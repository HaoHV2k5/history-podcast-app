#!/usr/bin/env python3
"""
Whiteboard Studio AI - Backend Server
Tự động hóa 100% quy trình từ Prompt -> Kịch bản (Gemini) -> Vẽ ảnh (Pollinations/Imagen) -> 
Tạo phân vùng -> Render Whiteboard -> Phụ đề -> Giọng đọc (ElevenLabs / Edge-TTS) -> Video MP4.
"""
from __future__ import annotations

import asyncio
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import io
from PIL import Image, ImageOps

# Thư mục gốc dự án
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "scripts"))

import stream_render as sr
from add_subtitles import add_subtitles, get_font, parse_annotation
from export_srt import export_srt
from rag_service import search_history_context, verify_script_with_gemini, get_chroma_collection

app = FastAPI(title="Whiteboard AI Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUTS_DIR = ROOT_DIR / "web_app" / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR = ROOT_DIR / "web_app" / "static"

app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

JOBS: dict[str, dict] = {}


class StoryboardRequest(BaseModel):
    topic: str
    duration_sec: int = 60
    gemini_api_key: Optional[str] = None
    use_rag: bool = True


class VerifyScriptRequest(BaseModel):
    script: str
    gemini_api_key: Optional[str] = None


class VideoRequest(BaseModel):
    topic: Optional[str] = ""
    duration_sec: int = 60
    storyboard: Optional[dict] = None
    custom_images: Optional[dict[str, str]] = None
    scene_1_b64: Optional[str] = None
    scene_2_b64: Optional[str] = None
    gemini_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    pollinations_api_key: Optional[str] = "key_CfTHxQ8fPC7LLn13vYdyD"
    together_api_key: Optional[str] = None
    image_engine: str = "auto"  # 'auto', 'pollinations', 'together', 'imagen'
    tts_engine: str = "edge-tts"  # 'edge-tts' hoặc 'elevenlabs'
    voice_name: str = "vi-VN-NamMinhNeural"  # 'vi-VN-NamMinhNeural', 'Brian', 'Liam', etc.



def decode_base64_image(b64_str: str) -> bytes:
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    return base64.b64decode(b64_str)


def process_uploaded_image(raw_bytes: bytes, out_path: Path):
    im = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    im_fit = ImageOps.fit(im, (1376, 768), method=Image.Resampling.LANCZOS)
    im_fit.save(out_path, "PNG")


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/jobs")
async def list_jobs():
    completed = []
    for jid, job in JOBS.items():
        if job["status"] == "completed":
            completed.append({
                "job_id": jid,
                "title": job.get("title", jid),
                "video_url": job.get("video_url"),
                "created_at": job.get("created_at")
            })
    return completed


@app.get("/api/job/{job_id}")
async def get_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job không tồn tại")
    return JOBS[job_id]


class OutOfScopeHistoryError(Exception):
    """Ngoại lệ khi chủ đề nằm ngoài phạm vi sử liệu trong kho sách doc/"""
    pass


@app.post("/api/storyboard")
async def generate_storyboard_endpoint(req: StoryboardRequest):
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Vui lòng nhập chủ đề!")
    dur = req.duration_sec or 60
    key_to_use = sanitize_gemini_key(req.gemini_api_key) or os.getenv("SYSTEM_GEMINI_API_KEY", "").strip()
    use_rag = getattr(req, "use_rag", True)
    try:
        sb = call_gemini_storyboard(topic, key_to_use, duration_sec=dur, use_rag=use_rag)
        return sb
    except OutOfScopeHistoryError as ose:
        raise HTTPException(status_code=400, detail=str(ose))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Gemini storyboard failed: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi tạo kịch bản: {e}")


@app.post("/api/script/verify")
async def verify_script_endpoint(req: VerifyScriptRequest):
    script_text = req.script.strip()
    if not script_text:
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung kịch bản cần thẩm định!")
    key_to_use = sanitize_gemini_key(req.gemini_api_key) or os.getenv("SYSTEM_GEMINI_API_KEY", "").strip()
    try:
        report = verify_script_with_gemini(script_text, key_to_use)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi thẩm định kịch bản: {str(e)}")


@app.get("/api/rag/status")
async def get_rag_status_endpoint():
    try:
        col = get_chroma_collection()
        count = col.count()
        return {
            "status": "ready" if count > 0 else "empty",
            "total_chunks": count,
            "books": ["Đại Việt Sử Ký Toàn Thư", "An Nam Chí Lược", "Đại Việt Sử Lược"]
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "total_chunks": 0}


@app.post("/api/create")
async def create_video(req: VideoRequest, background_tasks: BackgroundTasks):
    job_id = f"job_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    display_title = (req.topic or (req.storyboard.get("title") if req.storyboard else "Whiteboard Animation"))[:40]
    JOBS[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "step": 0,
        "total_steps": 6,
        "step_name": "Đang khởi tạo",
        "logs": ["Đã nhận yêu cầu tạo video..."],
        "title": display_title,
        "created_at": time.strftime("%H:%M:%S %d/%m/%Y"),
        "video_url": None,
        "srt_url": None,
        "error": None
    }
    background_tasks.add_task(run_pipeline, job_id, req)
    return {"job_id": job_id}



def log(job_id: str, message: str, step: int = None, step_name: str = None):
    print(f"[{job_id}] {message}")
    if job_id in JOBS:
        JOBS[job_id]["logs"].append(message)
        if step is not None:
            JOBS[job_id]["step"] = step
        if step_name is not None:
            JOBS[job_id]["step_name"] = step_name


# ──────────────────────────────────────────────────────────────
# BƯỚC 1: RESEARCH & TẠO KỊCH BẢN (GEMINI API + SMART OFFLINE AI)
# ──────────────────────────────────────────────────────────────
def sanitize_gemini_key(raw_key: str | None) -> str:
    if not raw_key:
        return ""
    key = raw_key.strip().strip("'\"`")
    if "key=" in key:
        key = key.split("key=")[-1].split("&")[0]
    m = re.search(r"(AIzaSy[A-Za-z0-9_-]{33})", key)
    if m:
        return m.group(1)
    return key


def generate_smart_storyboard(topic: str, duration_sec: int = 60) -> dict:
    """Tự động sinh kịch bản chuyên nghiệp 1-10 cảnh (lên đến 5 phút) hoàn toàn offline.
    Hỗ trợ cả trường hợp: Người dùng nhập Tiêu đề ngắn HOẶC dán Bài viết / Kịch bản dài có sẵn.
    Mỗi lần gọi sẽ trả về thứ tự cảnh ngẫu nhiên khác nhau."""
    import random
    clean_topic = topic.strip()
    num_scenes = max(1, min(10, int(round(duration_sec / 28.5)) or 1))

    # KIỂM TRA ĐẦU VÀO: Có phải người dùng dán cả bài viết / kịch bản dài không?
    is_script_input = len(clean_topic) > 100 or "\n" in clean_topic or clean_topic.count(".") >= 3

    if is_script_input:
        # Tách các câu thực tế từ bài viết người dùng
        raw_sentences = [s.strip() for s in re.split(r"[.\n!?;]+", clean_topic) if len(s.strip()) > 8]
        if not raw_sentences:
            raw_sentences = [clean_topic]

        # Tiêu đề lấy từ câu đầu tiên hoặc tóm tắt
        title = raw_sentences[0][:40]
        if not title.startswith("Kịch Bản:"):
            title = f"Kịch Bản: {title}"

        total_elements_needed = num_scenes * 3
        # Đảm bảo đủ câu cho tất cả các phân đoạn
        extended_sentences = []
        while len(extended_sentences) < total_elements_needed:
            for s in raw_sentences:
                extended_sentences.append(s)
                if len(extended_sentences) >= total_elements_needed:
                    break

        scenes = []
        sent_idx = 0
        for s_i in range(num_scenes):
            scene_idx = s_i + 1
            scene_elems = []
            ele_descs = []

            for e_i in range(3):
                cur_text = extended_sentences[sent_idx]
                words = cur_text.split()
                # Cắt gọn câu nếu quá dài (tối đa ~24 từ để đọc vừa vặn trong 6-7s)
                if len(words) > 24:
                    cur_text = " ".join(words[:24]) + "..."
                
                # Trích xuất nhãn từ 2-4 từ đầu tiên
                label_words = [w for w in words[:4] if len(w) > 1]
                label = " ".join(label_words).capitalize() if label_words else f"Ý chính {e_i+1}"
                safe_clean_label = clean_ascii_prompt(label)[:30] or f"Subject {e_i+1}"

                scene_elems.append({
                    "label": label[:25],
                    "narrativeRole": f"Phân đoạn {e_i+1}",
                    "subtitle": cur_text,
                    "visual_desc": f"Minimalist sketch doodle of {safe_clean_label}"
                })
                ele_descs.append(safe_clean_label)
                sent_idx += 1

            p_left = ele_descs[0]
            p_mid = ele_descs[1]
            p_right = ele_descs[2]
            image_prompt = (
                f"Minimalist sketch illustration on solid warm beige background (#F5EBD7). "
                f"Clean doodle line art with dark charcoal grey hand-drawn outlines and subtle selective warm color accents. "
                f"Strictly NO text, NO letters, NO words, NO numbers anywhere. Three distinct separate subjects arranged horizontally from left to right with generous whitespace between them: "
                f"Left side: doodle of {p_left}. Center: doodle of {p_mid}. Right side: doodle of {p_right}. "
                f"Pure minimalist doodle style, clean outlines, ample empty beige space, 16:9 ratio."
            )

            scenes.append({
                "scene_index": scene_idx,
                "scene_title": f"Cảnh {scene_idx}: {scene_elems[0]['label']}",
                "image_prompt": image_prompt,
                "elements": scene_elems
            })

        return {"title": title, "scenes": scenes}

    # TRƯỜNG HỢP NHẬP TIÊU ĐỀ / Ý TƯỞNG NGẮN:
    title = f"Khám Phá: {clean_topic[:35]}"
    
    # 10 mẫu kịch bản chuyên sâu theo mạch truyện tài liệu (Documentary Arc)
    # Lời thoại liên tục, có từ nối chuyển ý mượt mà ("Thế nhưng,", "Chính vì vậy,", "Không dừng lại ở đó,", "Và kết quả là,")
    stage_templates = [
        {
            "title_suffix": "Bối Cảnh & Điểm Khởi Đầu",
            "roles": ["Khởi nguồn", "Thực tế khắc nghiệt", "Động lực tiên phong"],
            "subs": [
                f"Ngay từ những dấu mốc đầu tiên, câu chuyện về {clean_topic} đã bắt đầu từ một bối cảnh đầy ấn tượng.",
                f"Thế nhưng, chính hoàn cảnh thực tế thời bấy giờ lại đặt ra hàng loạt rào cản và thách thức nan giải.",
                f"Chính vì vậy, nhu cầu cấp bách từ thực tiễn đã thôi thúc những bước chân tiên phong bắt đầu hành động."
            ],
            "visuals": [
                f"primitive origin and early context of {clean_topic}",
                f"difficult conditions and environmental obstacles",
                f"pioneers observing and taking first bold action"
            ]
        },
        {
            "title_suffix": "Thách Thức & Nguy Cơ Bùng Nổ",
            "roles": ["Biến cố bất ngờ", "Bế tắc phương pháp cũ", "Áp lực sinh tồn"],
            "subs": [
                f"Không dừng lại ở đó, những biến cố dữ dội liên tiếp ập đến khiến hành trình ngày càng trở nên cam go.",
                f"Và khi những phương pháp truyền thống hoàn toàn bất lực, mọi lối đi tưởng chừng như đã rơi vào bế tắc.",
                f"Đứng trước nguy cơ thất bại cận kề, một đòi hỏi sống còn về sự thay đổi đã bùng nổ mạnh mẽ hơn bao giờ hết."
            ],
            "visuals": [
                f"sudden dramatic storm of crisis facing {clean_topic}",
                f"broken outdated tools and frustrated attempts",
                f"intense urgency and burning need for breakthrough"
            ]
        },
        {
            "title_suffix": "Ý Tưởng Mới & Đốm Sáng Đột Phá",
            "roles": ["Ý tưởng mới", "Thử nghiệm táo bạo", "Tia hy vọng"],
            "subs": [
                f"Chính trong khoảnh khắc ngặt nghèo ấy, một ý tưởng mang tính cách mạng đã bất ngờ được nhen nhóm.",
                f"Họ lập tức bắt tay vào những thử nghiệm táo bạo, bất chấp sự hoài nghi và vô vàn rủi ro rình rập.",
                f"Và rồi, những tín hiệu tích cực đầu tiên xuất hiện, thắp sáng niềm tin vững chắc vào con đường mới."
            ],
            "visuals": [
                f"eureka lightbulb spark of innovative concept for {clean_topic}",
                f"hands-on bold experimental workshop trial",
                f"first glowing sign of success and renewed hope"
            ]
        },
        {
            "title_suffix": "Bước Ngoặt Quyết Định & Cao Trào",
            "roles": ["Thời khắc quyết định", "Đồng lòng vượt khó", "Đột phá ngoạn mục"],
            "subs": [
                f"Thời khắc quyết định đã điểm, khi toàn bộ tâm huyết và nguồn lực được dồn vào trận địa cam go nhất.",
                f"Bằng sự phối hợp ăn ý và lòng quả cảm phi thường, mọi trở ngại dường như dần bị đẩy lùi.",
                f"Để rồi, một bước đột phá ngoạn mục đã diễn ra, chính thức phá vỡ mọi giới hạn tưởng chừng bất khả thi."
            ],
            "visuals": [
                f"climactic decisive moment of high stakes regarding {clean_topic}",
                f"synchronized teamwork conquering giant hurdle",
                f"spectacular breakthrough crossing the finish line"
            ]
        },
        {
            "title_suffix": "Lan Tỏa Tri Thức & Sức Mạnh Kết Nối",
            "roles": ["Chia sẻ bài học", "Liên kết cộng đồng", "Hiệu ứng cộng hưởng"],
            "subs": [
                f"Không giữ riêng thành quả cho mình, những bài học quý giá nhanh chóng được chia sẻ rộng rãi.",
                f"Sự kết nối nhịp nhàng giữa các cá nhân đã tạo nên một mạng lưới hợp tác vô cùng vững chắc.",
                f"Nhờ vậy, ngọn lửa sáng tạo tiếp tục cộng hưởng và lan tỏa sức ảnh hưởng mạnh mẽ ra khắp muôn nơi."
            ],
            "visuals": [
                f"mentor sharing knowledge and diagrams about {clean_topic}",
                f"interconnected network of diverse collaborating people",
                f"widely spreading ripple effect across communities"
            ]
        },
        {
            "title_suffix": "Thử Lửa Thực Tế & Bản Lĩnh Vững Vàng",
            "roles": ["Thử thách khắc nghiệt", "Bản lĩnh kiên cường", "Vượt qua giông bão"],
            "subs": [
                f"Tuy nhiên, chặng đường phía trước vẫn không thiếu những đợt sóng gió mới thử thách độ bền vững.",
                f"Chính kỷ luật nghiêm ngặt và tinh thần không lùi bước đã giữ cho toàn bộ hệ thống luôn đứng vững.",
                f"Và qua mỗi lần tôi luyện trong gian khó, bản lĩnh kiên cường lại càng được khẳng định sắc bén hơn."
            ],
            "visuals": [
                f"standing strong against torrential winds and rain testing {clean_topic}",
                f"solid unyielding foundation and unwavering resolve",
                f"emerging victorious and seasoned from the storm"
            ]
        },
        {
            "title_suffix": "Chuẩn Hóa Quy Trình & Tối Ưu Hiệu Suất",
            "roles": ["Khoa học hóa", "Tối ưu vận hành", "Đạt chuẩn mực cao"],
            "subs": [
                f"Bước sang giai đoạn mới, mọi phương pháp đều được tinh gọn và chuẩn hóa một cách bài bản.",
                f"Nhờ ứng dụng những nguyên lý tối ưu thông minh, hiệu suất tổng thể đã tăng vọt ngoài mong đợi.",
                f"Từ đó, một chuẩn mực chất lượng đỉnh cao được xác lập, trở thành hình mẫu tiêu biểu cho tương lai."
            ],
            "visuals": [
                f"clean scientific schematic blueprint for {clean_topic}",
                f"smooth streamlined gears spinning with high efficiency",
                f"gold standard badge of premium quality and excellence"
            ]
        },
        {
            "title_suffix": "Thành Tựu Vang Dội & Vị Thế Dẫn Đầu",
            "roles": ["Ghi nhận xứng đáng", "Chuyển mình toàn diện", "Vị thế tiên phong"],
            "subs": [
                f"Những nỗ lực không ngừng nghỉ cuối cùng đã gặt hái quả ngọt với sự công nhận vang dội từ xã hội.",
                f"Cục diện chung giờ đây đã hoàn toàn lột xác, mở ra một chương phát triển rực rỡ và phồn thịnh.",
                f"Họ tự tin khẳng định vị thế dẫn đầu vững chắc, để lại niềm tự hào sâu sắc trong lòng mọi người."
            ],
            "visuals": [
                f"prestigious celebration and public recognition for {clean_topic}",
                f"blossoming modern landscape full of prosperity",
                f"proud visionary standing atop leading pinnacle"
            ]
        },
        {
            "title_suffix": "Di Sản Trường Tồn & Bài Học Vô Giá",
            "roles": ["Dấu ấn lịch sử", "Bài học sâu sắc", "Ngọn đuốc soi đường"],
            "subs": [
                f"Năm tháng có thể qua đi, nhưng giá trị cốt lõi đọng lại vẫn vẹn nguyên sức sống mạnh mẽ theo thời gian.",
                f"Bài học về lòng quả cảm và khát vọng vươn lên tiếp tục là kim chỉ nam soi sáng cho thế hệ đi sau.",
                f"Đó là nguồn cảm hứng vô tận, thắp sáng niềm tin vào những điều phi thường có thể trở thành hiện thực."
            ],
            "visuals": [
                f"monumental enduring stone tablet of heritage for {clean_topic}",
                f"wisdom scroll passed down through time",
                f"bright torch illuminating forward pathway"
            ]
        },
        {
            "title_suffix": "Tầm Nhìn Thế Kỷ & Khát Vọng Tương Lai",
            "roles": ["Bệ phóng tương lai", "Sứ mệnh kế thừa", "Chinh phục chân trời mới"],
            "subs": [
                f"Nhìn về phía trước, những thành tựu hôm nay chính là bệ phóng hoàn hảo cho những giấc mơ lớn hơn.",
                f"Trách nhiệm của chúng ta là tiếp nối ngọn lửa nhiệt huyết, không ngừng bứt phá mọi giới hạn mới.",
                f"Và cuộc hành trình kỳ diệu ấy sẽ vẫn tiếp diễn, mở ra những chân trời bao la đang chờ đón phía trước."
            ],
            "visuals": [
                f"futuristic telescope gazing into shining horizon for {clean_topic}",
                f"next generation youth carrying forward the mission",
                f"endless open road leading towards bright rising sun"
            ]
        }
    ]

    # Xáo trộn thứ tự template ngẫu nhiên để mỗi lần "Tạo lại" có nội dung khác
    random.shuffle(stage_templates)

    # Các biến thể từ nối ngẫu nhiên để câu không bị lặp
    connectors_start = [
        "Ngay từ thuở sơ khai,", "Nhìn lại lịch sử,", "Câu chuyện bắt đầu khi,",
        "Ít ai biết rằng,", "Để hiểu rõ hơn,"
    ]
    connectors_mid = [
        "Thế nhưng,", "Chính trong hoàn cảnh đó,", "Điều đáng chú ý là,",
        "Song song với đó,", "Tuy nhiên,"
    ]
    connectors_end = [
        "Chính vì vậy,", "Và kết quả là,", "Không dừng lại ở đó,",
        "Từ đó,", "Điều này dẫn đến việc,"
    ]

    scenes = []
    for i in range(num_scenes):
        tmpl = stage_templates[i % len(stage_templates)]
        scene_idx = i + 1
        s_title = f"Cảnh {scene_idx}: {tmpl['title_suffix']}"

        # Chọn ngẫu nhiên từ nối để mỗi lần khác nhau
        c0 = random.choice(connectors_start)
        c1 = random.choice(connectors_mid)
        c2 = random.choice(connectors_end)

        # Thay thế phần đầu câu bằng từ nối ngẫu nhiên
        def vary_sub(original_sub: str, connector: str) -> str:
            # Tách câu gốc, thay connector đầu nếu có
            for prefix in ["Ngay từ", "Thế nhưng", "Chính vì", "Không dừng", "Và kết",
                           "Chính trong", "Bằng sự", "Để rồi", "Những", "Năm tháng",
                           "Nhìn về", "Trách nhiệm", "Tuy nhiên", "Bước sang", "Nhờ"]:
                if original_sub.startswith(prefix):
                    rest = original_sub[len(prefix):].lstrip(",: ")
                    return connector + " " + rest
            return connector + " " + original_sub

        raw_subs = tmpl["subs"]
        varied_subs = [
            vary_sub(raw_subs[0], c0),
            vary_sub(raw_subs[1], c1),
            vary_sub(raw_subs[2], c2),
        ]

        elements = []
        for e_i in range(3):
            lbl = tmpl["roles"][e_i]
            sub = varied_subs[e_i]
            vdesc = tmpl["visuals"][e_i]
            elements.append({
                "label": lbl,
                "narrativeRole": tmpl["roles"][e_i],
                "subtitle": sub,
                "visual_desc": f"Minimalist sketch doodle of {vdesc}"
            })

        v_left = tmpl["visuals"][0]
        v_mid = tmpl["visuals"][1]
        v_right = tmpl["visuals"][2]

        image_prompt = (
            f"Minimalist sketch illustration on solid warm beige background (#F5EBD7). "
            f"Clean doodle line art with dark charcoal grey hand-drawn outlines and subtle selective warm color accents. "
            f"Strictly NO text, NO letters, NO words, NO numbers anywhere. Three distinct separate subjects arranged horizontally from left to right with generous whitespace between them: "
            f"Left side: {v_left}. Center: {v_mid}. Right side: {v_right}. "
            f"Pure minimalist doodle style, clean outlines, ample empty beige space, 16:9 ratio."
        )

        scenes.append({
            "scene_index": scene_idx,
            "scene_title": s_title,
            "image_prompt": image_prompt,
            "elements": elements
        })

    return {"title": title, "scenes": scenes}


def check_history_scope_llm(topic: str, api_key: str) -> dict:
    """Xác định nhanh bằng AI xem đề tài có thuộc phạm vi triều đại nhà Lý và nhà Trần hay không."""
    prompt = f"""Bạn là Người Gác Cổng Sử Học chuyên trách THỜI KỲ NHÀ LÝ (1009 - 1225) VÀ NHÀ TRẦN (1225 - 1400) trong lịch sử Việt Nam.
Nhiệm vụ: Xác định xem đề tài sau có thuộc phạm vi lịch sử triều đại nhà Lý hoặc nhà Trần hay không?

Đề tài: "{topic}"

Quy tắc phân định NGHIÊM NGẶT:
1. ĐƯỢC CHẤP NHẬN (in_scope = true):
   - Đề tài thuộc triều đại nhà Lý (1009 - 1225): Vua Lý Thái Tổ (Lý Công Uẩn), Chiếu dời đô 1010, định đô Thăng Long, Lý Thái Tông, Lý Thánh Tông, Lý Nhân Tông, Lý Chiêu Hoàng; danh nhân Lý Thường Kiệt, Tô Hiến Thành; sự kiện phạt Tống, phòng tuyến sông Như Nguyệt, chùa Một Cột, văn miếu Quốc Tử Giám...
   - Đề tài thuộc triều đại nhà Trần (1225 - 1400): Vua Trần Thái Tông, Trần Thánh Tông, Trần Nhân Tông, Trần Anh Tông...; tướng lĩnh Trần Hưng Đạo (Trần Quốc Tuấn), Trần Thủ Độ, Trần Quang Khải, Trần Nhật Duật, Trần Khánh Dư, Yết Kiêu, Dã Tượng, Phạm Ngũ Lão, Chu Văn An, Tuệ Tĩnh; 3 lần kháng chiến chống quân Nguyên Mông (1258, 1285, 1288), Đông Bộ Đầu, Chương Dương, Hàm Tử, Vạn Kiếp, Bạch Đằng 1288, Hịch tướng sĩ, Hội nghị Bình Than, Hội nghị Diên Hồng, Thiền phái Trúc Lâm Yên Tử...
   - Đề tài giai đoạn chuyển giao tiền đề (như bối cảnh Hoa Lư thời Đinh - Tiền Lê dẫn tới việc Lý Thái Tổ dời đô).

2. BỊ TỪ CHỐI (in_scope = false):
   - BẤT KỲ thời kỳ nào khác ngoài Lý - Trần (ví dụ: thời Hồng Bàng, Hai Bà Trưng, Ngô Quyền, Đinh Bộ Lĩnh thời độc lập, nhà Hồ, Lê Sơ, Lê Lợi, Nguyễn Trãi, Lê Thánh Tông, thời Trịnh - Nguyễn, phong trào Tây Sơn, vua Quang Trung, triều Nguyễn, thời Pháp thuộc, thời hiện đại).
   - BẤT KỲ đề tài nào ngoài lịch sử Việt Nam (quốc tế, công nghệ, thể thao, kinh tế hiện đại, thời sự 2024-2025).

Trả về JSON thuần túy (không bọc trong markdown):
{{"in_scope": true, "reason": "giải thích ngắn 1 câu tiếng Việt rõ ràng"}}"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return json.loads(text)
    except Exception as e:
        print(f"⚠️ Scope check error: {e}")
        other_dynasties_keywords = [
            "hồng bàng", "an dương vương", "hai bà trưng", "ngô quyền",
            "lê lợi", "nguyễn trãi", "lê sơ", "lê thánh tông", "quang trung", "tây sơn",
            "gia long", "minh mạng", "nhà nguyễn", "pháp thuộc", "mỹ", "usa", "nga", "bitcoin", "2024", "2025"
        ]
        if any(k in topic.lower() for k in other_dynasties_keywords):
            return {"in_scope": False, "reason": "Đề tài thuộc thời kỳ lịch sử ngoài triều đại Lý - Trần."}
        return {"in_scope": True, "reason": "Cho phép kiểm tra tiếp qua kho sử liệu Lý - Trần"}


def call_gemini_storyboard(topic: str, raw_api_key: str | None, duration_sec: int = 60, use_rag: bool = True) -> dict:
    api_key = sanitize_gemini_key(raw_api_key)
    if not api_key:
        raise ValueError("Chưa có API Key hoặc định dạng API Key không đúng (Key Google AI Studio thường bắt đầu bằng 'AIzaSy...').")

    num_scenes = max(1, min(10, int(round(duration_sec / 28.5)) or 1))
    approx_time = num_scenes * 25.0
    raw_input = topic.strip()
    is_long_text = len(raw_input) > 100 or "\n" in raw_input or raw_input.count(".") >= 3

    # ── BƯỚC 1: BỘ GÁC CỔNG PHẠM VI SỬ LIỆU THỜI KỲ LÝ - TRẦN ──
    # Chỉ cho phép các sự kiện, nhân vật thời Lý (1009-1225) và thời Trần (1225-1400)
    scope_result = check_history_scope_llm(raw_input, api_key)
    if not scope_result.get("in_scope", True):
        reason = scope_result.get("reason", "Chủ đề không thuộc thời kỳ triều đại nhà Lý hoặc nhà Trần.")
        print(f"[ScopeGate] 🚫 TỪ CHỐI đề tài ngoài phạm vi Lý - Trần: '{raw_input}' - Lý do: {reason}")
        raise OutOfScopeHistoryError(
            f"⚠️ CHỦ ĐỀ BỊ TỪ CHỐI (CHỈ HỖ TRỢ THỜI KỲ LÝ - TRẦN):\n\n"
            f"Đề tài: \"{raw_input}\"\n"
            f"Lý do: {reason}\n\n"
            f"Hệ thống hiện được giới hạn chuyên biệt: CHỈ TẠO VIDEO CHO CÁC SỰ KIỆN, NHÂN VẬT THUỘC THỜI KỲ NHÀ LÝ (1009 - 1225) VÀ NHÀ TRẦN (1225 - 1400) trong kho sách sử đã nạp.\n"
            f"Mọi thời kỳ lịch sử khác hoặc thông tin ngoài phạm vi này đều bị chặn."
        )

    # ── BƯỚC 2: TRA CỨU SỬ LIỆU TRONG KHO SÁCH doc/ ──
    citations = []
    rag_context_section = ""
    threshold = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.62"))
    chunks = []
    try:
        chunks = search_history_context(raw_input[:400], api_key, top_k=6)
    except Exception as e:
        print(f"⚠️ RAG Search in storyboard failed: {e}")

    valid_chunks = [c for c in chunks if c.get("similarity", 0) >= threshold]
    if valid_chunks:
        citations = [
            {
                "id": i,
                "book_title": c["book_title"],
                "page": c["page"],
                "similarity": c["similarity"],
                "text": c.get("text", ""),
                "file_name": c.get("file_name", "")
            }
            for i, c in enumerate(valid_chunks, 1)
        ]
        rag_context_section = "\n\nTƯ LIỆU SỬ HỌC ĐỐI CHIẾU TỪ KHO SÁCH doc/ (Đại Việt Sử Ký Toàn Thư, An Nam Chí Lược, Đại Việt Sử Lược):\n"
        for i, c in enumerate(valid_chunks, 1):
            rag_context_section += f"[{i}] ({c['book_title']} - Trang {c['page']}): {c['text']}\n\n"
    if is_long_text:
        prompt_instruction = f"""Người dùng cung cấp một BÀI VIẾT / KỊCH BẢN / DÀN Ý CÓ SẴN dưới đây:
\"{raw_input}\"
{rag_context_section}
HÃY PHÂN TÍCH VÀ BIÊN TẬP THÀNH KỊCH BẢN VIDEO HOẠT HỌA BẢNG TRẮNG:
- BÁM SÁT DỮ LIỆU ĐƯỢC CUNG CẤP: Kiểm tra kỹ lưỡng các mốc năm, sự kiện, địa danh và nhân vật so với tư liệu sử học. Sửa chữa ngay mọi chi tiết sai lệch hoặc hiểu nhầm.
- Giữ trọn vẹn thông điệp cốt lõi của người dùng, phân bổ hợp lý vào đúng {num_scenes} CẢNH (tổng thời lượng video khoảng {approx_time:.1f} giây).
- VĂN PHONG TỰ NHIÊN, KHÔNG DÙNG TỪ NỐI RẬP KHUÔN: Tuyệt đối KHÔNG mở đầu câu bằng các từ nối máy móc như 'Thế nhưng,', 'Chính vì vậy,', 'Không dừng lại ở đó,', 'Và kết quả là,'. Dẫn dắt câu chuyện tự nhiên bằng thời gian, bối cảnh và hành động cụ thể."""
    else:
        # Đề tài thuộc kho sử liệu Việt Nam
        history_specific_note = ""
        if any(k in raw_input.lower() for k in ["hoa lư", "lý thái tổ", "dời đô", "thăng long"]):
            history_specific_note = """   - HƯỚNG DẪN RIÊNG CHO SỰ KIỆN DỜI ĐÔ NĂM 1010:
     + Cố đô Hoa Lư đồi núi hiểm trở vốn là thế thủ thời loạn lạc, nhưng việc hai nhà Đinh - Lê đóng mãi ở đây khiến 'thế đại không dài, vận số ngắn ngủi, trăm họ hao tổn'.
     + Nhà vua dời đô cốt để 'mưu nghiệp lớn, chọn ở chỗ giữa, làm kế cho con cháu muôn vạn đời'.
     + Chọn thành Đại La (đô cũ Cao Vương) vì: ở giữa khu vực trời đất, thế rồng cuộn hổ ngồi, mặt đất rộng mà bằng phẳng, thế đất cao mà sáng sủa, dân cư không khổ vì ngập lụt trũng tối.
     + Mốc thời gian: Mùa thu tháng 7 năm Canh Tuất 1010, vua Lý Thái Tổ từ Hoa Lư dời đô ra Đại La.
     + Điển tích tên Thăng Long (Rồng bay): Khi thuyền ngự vừa tạm đỗ dưới chân thành Đại La, có điềm lành rồng vàng hiện lên ở thuyền ngự bay vút lên trời xanh, nhân đó vua đổi tên thành Thăng Long.
     + Kiến thiết kinh thành: Triều đình dựng điện Càn Nguyên làm chỗ coi chầu, cùng điện Tập Hiền, Giảng Võ và đào hào đắp thành.
"""

        prompt_instruction = f"""ĐỀ TÀI CẦN VIẾT KỊCH BẢN VIDEO BẢNG TRẮNG:
\"{raw_input}\"
{rag_context_section}
QUY CHUẨN NỘI DUNG VÀ VĂN PHONG PHIM TÀI LIỆU LỊCH SỬ CHÍNH THỐNG:
- BẮT ĐẦU NGAY VÀO SỰ KIỆN TỪ CÂU ĐẦU TIÊN: Toàn bộ subtitle đều là lời đọc của người dẫn chuyện tài liệu lịch sử. TUYỆT ĐỐI CẤM mọi câu chào hỏi, đối thoại hoặc phản hồi của AI (như 'Tôi đã sẵn sàng', 'Hãy gửi nội dung', 'Chào bạn').
1. NGUYÊN TẮC BÁM SÁT 100% SỬ LIỆU GỐC (TUYỆT ĐỐI KHÔNG TỰ SUY DIỄN):
   - Mọi dữ kiện, nguyên nhân, hành động, địa danh, mốc thời gian PHẢI BÁM CHẶT VÀO VĂN BẢN TRÍCH ĐOẠN SỬ LIỆU CUNG CẤP Ở TRÊN.
   - TUYỆT ĐỐI KHÔNG tự bịa đặt, KHÔNG dùng các từ ngữ hiện đại suy diễn thiếu căn cứ (như không tự tiện gán ghép 'vùng trũng thấp chật hẹp', 'không đủ không gian phát triển lâu dài'). Thuật lại trung thực lập luận của tiền nhân ghi trong sử sách.
{history_specific_note}
2. DỮ KIỆN CỤ THỂ - NÓI KHÔNG VỚI LỜI KHEN SÁO RỖNG:
   - Mỗi câu thuyết minh PHẢI chứa thông tin lịch sử thật: nhân vật, địa danh, mốc năm hoặc hành động cụ thể.
   - TUYỆT ĐỐI CẤM các câu tán tụng sáo rỗng vô thưởng vô phạt ở cuối cảnh như: 'mở ra kỷ nguyên phát triển rực rỡ', 'để lại đức dày cho con cháu muôn đời', 'ghi dấu son chói lọi'.

3. VĂN PHONG TỰ NHIÊN, BÃI BỎ TỪ NỐI AI CÔNG THỨC:
   - TUYỆT ĐỐI KHÔNG mở đầu câu bằng các từ nối công thức: 'Thế nhưng,', 'Chính vì vậy,', 'Không dừng lại ở đó,', 'Và kết quả là,', 'Và qua đó,', 'Chính trong hoàn cảnh đó,'.
   - Hãy dẫn dắt tự nhiên bằng tiến trình thời gian và hành động của nhân vật.

4. BỐ CỤC: Chia thành đúng {num_scenes} CẢNH liền mạch."""

    prompt = f"""{prompt_instruction}

YÊU CẦU ĐỊNH DẠNG:
- Tổng cộng đúng {num_scenes} Cảnh (từ Scene 1 đến Scene {num_scenes}).
- Mỗi cảnh gồm đúng 3 khối chủ thể xuất hiện từ Trái qua Phải.
- Mỗi khối chủ thể có:
  + label: Nhãn tên chủ thể ngắn gọn, đắt giá (2-4 từ tiếng Việt, ví dụ: 'Cố Đô Hoa Lư', 'Chiếu Dời Đô 1010', 'Rồng Vàng Thăng Long').
  + narrativeRole: Vai trò dẫn dắt câu chuyện (tiếng Việt).
  + subtitle: 1 câu thuyết minh tiếng Việt CHUẨN XÁC THEO SỬ LIỆU, GIÀU HÌNH ẢNH, dài khoảng 18 đến 24 từ (vừa vặn đọc trong 5.5 đến 7.0 giây, khớp với tốc độ vẽ whiteboard sketch). Văn phong đĩnh đạc, câu chuyện tự nhiên, KHÔNG dùng từ nối máy móc AI.
  + visual_desc: Mô tả hình vẽ phác thảo tối giản kiểu doodle/sketch bằng tiếng Anh cho AI tạo ảnh.
- image_prompt: 1 prompt tổng thể tiếng Anh (16:9) theo chuẩn Notion Doodle để người dùng copy tạo ảnh:
  "Minimalist sketch illustration on solid warm beige background (#F5EBD7). Clean doodle line art with dark charcoal grey hand-drawn outlines and subtle selective warm color accents. Strictly NO text, NO letters, NO words, NO numbers anywhere. Three distinct separate subjects arranged horizontally from left to right with generous whitespace between them: Left side: [Mô tả chi tiết phân cảnh 1]. Center: [Mô tả chi tiết phân cảnh 2]. Right side: [Mô tả chi tiết phân cảnh 3]. Pure minimalist doodle style, clean outlines, ample empty beige space, 16:9 ratio."

Hãy trả về định dạng JSON thuần túy (không bọc trong markdown):
{{
  "title": "Tiêu đề video",
  "scenes": [
    {{
      "scene_index": 1,
      "scene_title": "Tiêu đề cảnh 1",
      "image_prompt": "Minimalist sketch illustration on solid warm beige background (#F5EBD7)...",
      "elements": [
        {{ "label": "...", "narrativeRole": "...", "subtitle": "...", "visual_desc": "..." }},
        {{ "label": "...", "narrativeRole": "...", "subtitle": "...", "visual_desc": "..." }},
        {{ "label": "...", "narrativeRole": "...", "subtitle": "...", "visual_desc": "..." }}
      ]
    }}
  ]
}}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.25
        }
    }
    
    models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]
    last_err = None
    MAX_RETRIES_ON_TRAFFIC = 3   # Số lần retry khi gặp 429 (traffic cao)
    RETRY_BASE_DELAY = 2.0       # Giây: 2s → 4s → 8s (exponential backoff)

    for model in models:
        for ver in ["v1beta", "v1"]:
            url = f"https://generativelanguage.googleapis.com/{ver}/models/{model}:generateContent?key={api_key}"

            # ── RETRY LOOP cho traffic cao (429) ──
            for attempt in range(MAX_RETRIES_ON_TRAFFIC):
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                try:
                    with urllib.request.urlopen(req, timeout=40) as resp:
                        res_data = json.loads(resp.read().decode("utf-8"))
                        text_out = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text_out)
                        if m:
                            text_out = m.group(1).strip()
                        print(f"[Gemini] ✅ Thành công với {ver}/{model} (attempt {attempt+1})")
                        parsed = json.loads(text_out)

                        # Bộ lọc khử câu chào / đối thoại meta của AI nếu vô tình lọt vào kịch bản
                        META_AI_PATTERNS = [
                            r"tôi đã sẵn sàng",
                            r"hãy gửi nội dung",
                            r"sẵn sàng nhận",
                            r"chào bạn",
                            r"tôi là (?:trợ lý|ai|mô hình)",
                            r"rất sẵn lòng"
                        ]
                        for sc in parsed.get("scenes", []):
                            for el in sc.get("elements", []):
                                sub = el.get("subtitle", "").strip()
                                for pat in META_AI_PATTERNS:
                                    if re.search(pat, sub, re.IGNORECASE):
                                        print(f"[Sanitize] ⚠️ Phát hiện câu meta AI: '{sub}', đang tự động sửa thành nội dung lịch sử chuẩn.")
                                        if any(k in raw_input.lower() for k in ["hoa lư", "lý thái tổ", "dời đô", "thăng long"]):
                                            el["subtitle"] = "Thành Hoa Lư hiểm trở hợp phòng thủ thời loạn, nhưng đóng đô lâu dài khiến thế đại không bền, trăm họ hao tổn."
                                            el["label"] = "Cố Đô Hoa Lư"
                                        break

                        parsed["citations"] = citations
                        parsed["use_rag"] = bool(citations)
                        return parsed

                except urllib.error.HTTPError as e:
                    err_body = e.read().decode("utf-8", errors="ignore")
                    try:
                        err_json = json.loads(err_body)
                        msg = err_json.get("error", {}).get("message", err_body)
                    except Exception:
                        msg = err_body[:300]
                    last_err = f"HTTP {e.code}: {msg}"

                    # 403 / 400 invalid key: stop immediately, no point retrying
                    if e.code == 403:
                        raise RuntimeError(f"❌ Gemini API: Không có quyền truy cập (403 Forbidden). Kiểm tra quyền API Key. {msg}")
                    if e.code == 400 and "API_KEY_INVALID" in err_body:
                        raise RuntimeError(f"❌ Gemini API: Key không hợp lệ (400 Invalid Key). {msg}")

                    # 404: model này không tồn tại → switch sang model tiếp, không retry
                    if e.code == 404:
                        print(f"[Gemini] ⚠️ Model {ver}/{model} không tồn tại (404), thử model tiếp theo...")
                        break  # thoát retry loop, chuyển sang ver/model tiếp

                    # 429: traffic cao → retry với exponential backoff
                    if e.code == 429:
                        delay = RETRY_BASE_DELAY * (2 ** attempt)
                        print(f"[Gemini] ⏳ Rate limit (429) trên {ver}/{model}, chờ {delay:.0f}s rồi retry (lần {attempt+1}/{MAX_RETRIES_ON_TRAFFIC})...")
                        time.sleep(delay)
                        continue  # retry same model/ver

                    # Lỗi khác (5xx server error): retry ngắn hơn
                    if e.code >= 500:
                        delay = RETRY_BASE_DELAY
                        print(f"[Gemini] ⚠️ Server error ({e.code}) trên {ver}/{model}, chờ {delay:.0f}s...")
                        time.sleep(delay)
                        continue

                    # Lỗi khác → skip
                    print(f"[Gemini] Lỗi không xử lý được ({e.code}) trên {ver}/{model}: {msg[:100]}")
                    break

                except Exception as e:
                    last_err = str(e)
                    print(f"[Gemini] Lỗi kết nối {ver}/{model}: {e}")
                    break  # skip to next model/ver on network errors

                break  # nếu chạy đến đây mà không return thì thôi (không nhật thiết retry)

    raise RuntimeError(f"Không thể kết nối Gemini API sau khi thử tất cả model. Lỗi cuối: {last_err}")

# ──────────────────────────────────────────────────────────────
# BƯỚC 2: TẠO ẢNH MINH HỌA (POLLINATIONS AI + LOCAL VECTOR DOODLE)
# ──────────────────────────────────────────────────────────────
import unicodedata
from PIL import ImageDraw

def clean_ascii_prompt(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9\s,\.-]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def generate_local_doodle_scene(scene_data: dict, out_path: Path) -> Path:
    """Vẽ minh họa Doodle bảng trắng độc nhất theo từng chủ đề và phân đoạn, 100% offline"""
    w, h = 1376, 768
    im = Image.new("RGB", (w, h), color=(245, 235, 215))  # Nền giấy be #F5EBD7
    draw = ImageDraw.Draw(im)

    cols = [240, 688, 1136]
    color_charcoal = (45, 45, 45)
    color_light = (185, 178, 165)
    color_accent = (70, 75, 85)

    elements = scene_data.get("elements", [])
    font_label = get_font(22)

    for i, cx in enumerate(cols):
        cy = 380
        el = elements[i] if i < len(elements) else {}
        label = el.get("label", f"Chủ thể {i+1}")

        # Khung viền mờ bo tròn (Vignette sketch frame)
        draw.rounded_rectangle([cx - 160, cy - 200, cx + 160, cy + 220], radius=18, outline=color_light, width=2)
        
        # Nhãn tên chủ thể ở trên đầu
        bbox = draw.textbbox((0, 0), label, font=font_label)
        lw = bbox[2] - bbox[0]
        draw.text((cx - lw // 2, cy - 185), label, font=font_label, fill=color_charcoal)

        # Vẽ hình tượng nghệ thuật phác thảo
        # Đầu & nụ cười/biểu cảm
        draw.ellipse([cx - 40, cy - 120, cx + 40, cy - 40], outline=color_charcoal, width=4)
        draw.arc([cx - 15, cy - 80, cx + 15, cy - 65], start=0, end=180, fill=color_charcoal, width=2)

        # Thân
        draw.line([cx, cy - 40, cx, cy + 80], fill=color_charcoal, width=4)

        # Các tư thế khác nhau cho 3 phân đoạn:
        if i == 0:  # Khởi đầu / Bối cảnh
            draw.line([cx, cy - 10, cx - 60, cy - 50], fill=color_charcoal, width=4)
            draw.line([cx, cy - 10, cx + 55, cy + 20], fill=color_charcoal, width=4)
            draw.ellipse([cx - 65, cy - 90, cx - 45, cy - 70], outline=(180, 140, 40), width=3)
        elif i == 1: # Hành động / Thử thách
            draw.line([cx, cy - 10, cx - 65, cy + 30], fill=color_charcoal, width=4)
            draw.line([cx, cy - 10, cx + 65, cy + 30], fill=color_charcoal, width=4)
            draw.ellipse([cx + 45, cy + 10, cx + 75, cy + 40], outline=color_accent, width=3)
        else: # Thành tựu / Vinh quang
            draw.line([cx, cy - 10, cx - 55, cy - 70], fill=color_charcoal, width=4)
            draw.line([cx, cy - 10, cx + 55, cy - 70], fill=color_charcoal, width=4)
            draw.line([cx + 55, cy - 70, cx + 75, cy - 90], fill=(180, 50, 50), width=3)

        # Chân
        draw.line([cx, cy + 80, cx - 40, cy + 165], fill=color_charcoal, width=4)
        draw.line([cx, cy + 80, cx + 40, cy + 165], fill=color_charcoal, width=4)

        # Nền đất phác thảo
        draw.arc([cx - 85, cy + 150, cx + 85, cy + 185], start=0, end=180, fill=(130, 125, 115), width=3)

    im.save(out_path, "PNG")
    return out_path


import base64

DEFAULT_POLLINATIONS_KEY = "key_CfTHxQ8fPC7LLn13vYdyD"


def generate_image_google_imagen(prompt: str, api_key: str, out_p: Path) -> bool:
    """Tạo ảnh minh họa qua Google Imagen 3 (Nano Banana) với Gemini API Key"""
    if not api_key:
        return False
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "16:9",
            "outputMimeType": "image/png"
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            preds = data.get("predictions", [])
            if preds and "bytesBase64Encoded" in preds[0]:
                raw_bytes = base64.b64decode(preds[0]["bytesBase64Encoded"])
                out_p.write_bytes(raw_bytes)
                im = Image.open(out_p).convert("RGB")
                if im.size != (1376, 768):
                    im = im.resize((1376, 768), Image.Resampling.LANCZOS)
                im.save(out_p, "PNG")
                return True
    except Exception as e:
        print(f"Google Imagen (Nano Banana) failed: {e}")
        return False


def generate_image_together_flux(prompt: str, api_key: str, out_p: Path) -> bool:
    """Tạo ảnh minh họa qua Together AI FLUX.1-schnell"""
    if not api_key:
        return False
    url = "https://api.together.xyz/v1/images/generations"
    payload = {
        "model": "black-forest-labs/FLUX.1-schnell",
        "prompt": prompt,
        "width": 1024,
        "height": 576,
        "steps": 4,
        "n": 1,
        "response_format": "b64_json"
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            b64 = data["data"][0]["b64_json"]
            raw_bytes = base64.b64decode(b64)
            out_p.write_bytes(raw_bytes)
            im = Image.open(out_p).convert("RGB")
            if im.size != (1376, 768):
                im = im.resize((1376, 768), Image.Resampling.LANCZOS)
            im.save(out_p, "PNG")
            return True
    except Exception as e:
        print(f"Together AI FLUX failed: {e}")
        return False


def generate_or_download_scene_image(
    scene_data: dict, 
    out_path: Path, 
    topic: str = "", 
    gemini_key: str = None,
    pollinations_key: str = None,
    together_key: str = None,
    image_engine: str = "auto"
) -> Path:
    s_idx = scene_data.get("scene_index", 1)
    
    # Xây dựng câu lệnh prompt chuẩn Whiteboard Doodle 3 chủ thể, cấm từ 'paper background'
    elements = scene_data.get("elements", [])
    ele_parts = []
    positions = ["On left side", "In center", "On right side"]
    for i, pos in enumerate(positions):
        if i < len(elements):
            v_desc = elements[i].get("visual_desc", "") or elements[i].get("label", "")
            safe_desc = clean_ascii_prompt(v_desc)[:60]
            ele_parts.append(f"{pos}: {safe_desc}")
        else:
            ele_parts.append(f"{pos}: action illustration")
    
    comp_desc = ". ".join(ele_parts)
    full_prompt = f"flat 2D whiteboard animation doodle drawing, black marker sketch line art, {comp_desc}, 3 distinct figures arranged horizontally from left to right with wide spacing, solid flat pale beige background #F5EBD7, clean outlines, high contrast lines, no shading, no 3D, no real paper, no borders, 16:9 ratio"

    # 1. Thử Together AI nếu người dùng chọn hoặc có key
    if (image_engine == "together" or together_key) and together_key:
        print(f"Đang tạo ảnh qua Together AI (FLUX) cho Cảnh {s_idx}...")
        if generate_image_together_flux(full_prompt, together_key, out_path):
            print(f"✅ Together AI đã tạo ảnh Cảnh {s_idx} thành công!")
            return out_path

    # 2. Thử Google Imagen 3 (Nano Banana) nếu có Gemini API Key
    if (image_engine == "imagen" or gemini_key) and gemini_key:
        print(f"Đang tạo ảnh qua Google Imagen (Nano Banana) cho Cảnh {s_idx}...")
        if generate_image_google_imagen(full_prompt, gemini_key, out_path):
            print(f"✅ Google Imagen đã tạo ảnh Cảnh {s_idx} thành công!")
            return out_path

    # 3. Thử tải qua Pollinations AI với API Key (xác thực không bị rate limit)
    p_key = pollinations_key or DEFAULT_POLLINATIONS_KEY
    seed = random.randint(10000, 9999999)
    encoded = urllib.parse.quote(full_prompt)
    poll_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=576&nologo=true&seed={seed}&model=flux&key={p_key}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": "https://pollinations.ai/"
    }
    if p_key:
        headers["Authorization"] = f"Bearer {p_key}"
        
    try:
        print(f"Đang tạo ảnh qua Pollinations AI (FLUX + Key) cho Cảnh {s_idx}...")
        req = urllib.request.Request(poll_url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            if len(data) > 5000:
                out_path.write_bytes(data)
                im = Image.open(out_path).convert("RGB")
                if im.size != (1376, 768):
                    im = im.resize((1376, 768), Image.Resampling.LANCZOS)
                im.save(out_path, "PNG")
                print(f"✅ Pollinations AI đã tạo ảnh Cảnh {s_idx} thành công!")
                return out_path
    except Exception as e:
        print(f"Pollinations fetch failed ({e}), chuyển sang vẽ doodle nội bộ...")

    # 4. Fallback an toàn: Vẽ trực tiếp Doodle Vector theo đúng các phân đoạn chủ đề mới
    print(f"Sử dụng Engine Vẽ Doodle Nội Bộ cho Cảnh {s_idx}")
    return generate_local_doodle_scene(scene_data, out_path)



# ──────────────────────────────────────────────────────────────
# BƯỚC 3: TỰ ĐỘNG TÍNH TỌA ĐỘ VÙNG VẼ (BOUNDING BOXES)
# ──────────────────────────────────────────────────────────────
def auto_detect_regions(img_path: Path) -> list[tuple[int, int, int, int]]:
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    bg = (arr[0, 0] + arr[0, -1] + arr[-1, 0] + arr[-1, -1]) / 4.0
    dist = np.linalg.norm(arr - bg, axis=2)
    mask = dist > 20

    w, h = img.width, img.height
    slices = [(0, int(w * 0.35)), (int(w * 0.33), int(w * 0.68)), (int(w * 0.66), w)]
    boxes = []

    for s_min, s_max in slices:
        sub = np.zeros_like(mask)
        sub[:, s_min:s_max] = mask[:, s_min:s_max]
        ys, xs = np.where(sub)
        if len(xs) > 10:
            x1, x2 = int(xs.min()), int(xs.max())
            y1, y2 = int(ys.min()), int(ys.max())
            pad = 20
            x1 = max(0, x1 - pad)
            y1 = max(0, y1 - pad)
            x2 = min(w, x2 + pad)
            y2 = min(h, y2 + pad)
            boxes.append((x1, y1, x2 - x1, y2 - y1))
        else:
            boxes.append((s_min + 30, int(h * 0.2), s_max - s_min - 60, int(h * 0.6)))
    return boxes


def build_annotation_json(
    scene_data: dict, 
    img_path: Path, 
    out_json: Path, 
    element_timings: list[dict] = None, 
    scene_duration_ms: int = 28500
) -> Path:
    boxes = auto_detect_regions(img_path)
    elements = []
    default_timings = [
        (500, 5200),
        (9000, 5200),
        (18000, 5200)
    ]

    for i, el in enumerate(scene_data.get("elements", [])[:3]):
        bx, by, bw, bh = boxes[i]
        speech_meta = None
        if element_timings and i < len(element_timings):
            t = element_timings[i]
            start_ms = t["draw_start_ms"]
            dur_ms = t["draw_dur_ms"]
            speech_meta = {
                "startMs": int(round(t["voice_start_s"] * 1000)),
                "endMs": int(round(t["voice_end_s"] * 1000))
            }
        else:
            start_ms, dur_ms = default_timings[i]

        elem_dict = {
            "id": f"elem_{i+1}",
            "label": el.get("label", f"Chủ thể {i+1}"),
            "sequence": i + 1,
            "narrativeRole": el.get("narrativeRole", ""),
            "subtitle": el.get("subtitle", ""),
            "type": "character",
            "region": {"x": bx, "y": by, "width": bw, "height": bh},
            "reveal": {
                "direction": "top_to_bottom",
                "startMs": start_ms,
                "durationMs": dur_ms,
                "maskPaddingPx": 22,
                "protectedRegions": []
            },
            "handPath": {
                "start": [bx + bw // 2, by + 10],
                "end": [bx + bw // 2, by + bh - 10],
                "easing": "easeInOut"
            }
        }
        if speech_meta:
            elem_dict["speech"] = speech_meta
        elements.append(elem_dict)

    ann = {
        "sceneId": scene_data.get("scene_index", 1),
        "canvas": {"width": 1376, "height": 768},
        "storyBasis": scene_data.get("scene_title", ""),
        "sceneDurationMs": scene_duration_ms,
        "elements": elements
    }
    out_json.write_text(json.dumps(ann, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_json


# ──────────────────────────────────────────────────────────────
# BƯỚC 3: TTS & DÒNG THỜI GIAN ĐỘNG (CONTINUOUS NARRATION ENGINE)
# ──────────────────────────────────────────────────────────────
async def generate_speech_edge(text: str, voice: str, out_p: Path):
    import edge_tts
    # Thử gọi 3 lần với khoảng nghỉ nhỏ chống nghẽn websocket
    for attempt in range(3):
        try:
            comm = edge_tts.Communicate(text, voice)
            await comm.save(str(out_p))
            if out_p.exists() and out_p.stat().st_size > 500:
                return
        except Exception as e:
            print(f"Edge-TTS attempt {attempt+1} failed: {e}")
            await asyncio.sleep(0.8)
            continue

    # Nếu vẫn lỗi, thử đổi sang giọng dự phòng
    alt_voice = "vi-VN-HoaiMyNeural" if "Nam" in voice else "vi-VN-NamMinhNeural"
    try:
        print(f"Thử lại với giọng phụ: {alt_voice}")
        comm = edge_tts.Communicate(text, alt_voice)
        await comm.save(str(out_p))
        if out_p.exists() and out_p.stat().st_size > 500:
            return
    except Exception as e:
        print(f"Edge-TTS alt voice failed: {e}")

    # Fallback an toàn: Tạo file âm thanh giả lập (tránh sập luồng)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
        "-t", "5.0", "-q:a", "9", "-acodec", "libmp3lame",
        str(out_p)
    ], check=True)


def generate_speech_elevenlabs(text: str, voice_id: str, api_key: str, out_p: Path):
    """Gọi ElevenLabs TTS. Nếu lỗi sẽ raise RuntimeError với thông báo rõ ràng."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "language_code": "vi",
        "voice_settings": {"stability": 0.75, "similarity_boost": 0.85, "style": 0.0, "use_speaker_boost": True}
    }
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"xi-api-key": api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            out_p.write_bytes(resp.read())
    except urllib.error.HTTPError as e:
        # Phân tích body lỗi để lấy message cụ thể
        err_body = e.read().decode("utf-8", errors="ignore")
        try:
            err_json = json.loads(err_body)
            detail = err_json.get("detail", {}) or {}
            if isinstance(detail, dict):
                msg = detail.get("message", err_body)
            else:
                msg = str(detail)
        except Exception:
            msg = err_body[:300]
        code = e.code
        if code == 401:
            raise RuntimeError(f"❌ ElevenLabs: API Key không hợp lệ (401 Unauthorized). Kiểm tra lại key trong Cài đặt.")
        elif code == 422:
            raise RuntimeError(f"❌ ElevenLabs: Dữ liệu đầu vào không hợp lệ (422). Chi tiết: {msg}")
        elif code == 429:
            raise RuntimeError(f"❌ ElevenLabs: Quá nhiều yỪu cầu - hết quota hoặc rate limit (429). {msg}")
        else:
            raise RuntimeError(f"❌ ElevenLabs API lỗi HTTP {code}: {msg}")
    except Exception as e:
        raise RuntimeError(f"❌ Không thể kết nối ElevenLabs: {e}")


def generate_single_audio_clip(
    text: str,
    out_mp3: Path,
    out_wav: Path,
    tts_engine: str,
    voice_name: str,
    el_key: str | None
) -> float:
    """Tạo file âm thanh cho 1 câu phụ đề và đo thời lượng chính xác bằng ffprobe.
    Nếu ElevenLabs được chọn mà lỗi: RAISE ngay, không tự động chuyển sang edge-tts."""
    el_voices = {
        "Brian": "nPczCjzI2devNBz1zQrb",
        "Liam": "TX3LPaxmHKxFdv7VOQHJ",
        "Adam": "pNInz6obpgDQGcFmaJgB"
    }

    if tts_engine == "elevenlabs":
        if not el_key or not el_key.strip():
            raise RuntimeError(
                "❌ ElevenLabs được chọn nhưng chưa có API Key. "
                "Vui lòng vào ⚙️ Cài đặt API để nhập ElevenLabs API Key."
            )
        vid = el_voices.get(voice_name, el_voices["Brian"])
        # Sẽ raise RuntimeError nếu lỗi - không silent fallback
        generate_speech_elevenlabs(text, vid, el_key.strip(), out_mp3)
    else:
        vname = "vi-VN-NamMinhNeural" if "Nam" in voice_name or voice_name in ["Brian", "Liam", "Adam"] else "vi-VN-HoaiMyNeural"
        asyncio.run(generate_speech_edge(text, vname, out_mp3))

    # Chuẩn hóa sang WAV 44.1kHz stereo để trộn timeline mượt mà
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(out_mp3), "-ar", "44100", "-ac", "2", str(out_wav)], check=True)

    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(out_wav)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        dur = float(res.stdout.strip())
    except Exception:
        dur = 5.0
    return max(0.5, dur)


def compute_scene_continuous_timeline(audio_durations: list[float]) -> dict:
    """
    Tính toán dòng thời gian nói LIÊN TỤC và chuyển cảnh sau đúng 1.5 giây:
    - Khoảng nghỉ giữa các câu chỉ 0.35s (nhịp thở tự nhiên của người thuyết minh, không có khoảng lặng chết).
    - Nét vẽ tay hoàn thành TRƯỚC khi giọng nói dứt câu (người xem nhìn thấy hình hoàn chỉnh trước).
    - Cảnh kết thúc đúng 1.5s sau khi câu nói cuối cùng dứt (chuyển cảnh dứt khoát, không chờ lâu 3-4s).
    """
    PAUSE_BETWEEN_SENTENCES = 0.35  # Giọng đọc liền mạch, nhịp thở 0.35s
    SCENE_TAIL_WAIT = 1.5           # Đúng 1.5s sau khi dứt lời là qua cảnh tiếp theo

    element_timings = []
    prev_voice_end = 0.0
    prev_draw_end = 0.0

    for i, dur in enumerate(audio_durations):
        if i == 0:
            voice_start = 0.4
            draw_start = 0.2
        else:
            voice_start = prev_voice_end + PAUSE_BETWEEN_SENTENCES
            draw_start = max(prev_draw_end + 0.1, voice_start - 0.2)

        voice_end = voice_start + dur

        # Nét vẽ hoàn thành trước giọng nói ~0.8s (người xem thấy tranh trọn vẹn trước khi dứt câu)
        ideal_draw_dur = max(2.2, min(4.8, dur - 0.7))
        # Nếu vẽ xong vẫn muộn hơn voice_end, ép vẽ nhanh hơn để xong trước giọng nói
        if draw_start + ideal_draw_dur > voice_end - 0.3:
            ideal_draw_dur = max(1.8, (voice_end - 0.3) - draw_start)

        draw_end = draw_start + ideal_draw_dur

        element_timings.append({
            "voice_start_s": round(voice_start, 3),
            "voice_dur_s": round(dur, 3),
            "voice_end_s": round(voice_end, 3),
            "draw_start_ms": int(round(draw_start * 1000)),
            "draw_dur_ms": int(round(ideal_draw_dur * 1000))
        })

        prev_voice_end = voice_end
        prev_draw_end = draw_end

    # Cảnh đợi đúng 1.5s sau khi câu thoại cuối kết thúc là chuyển cảnh
    scene_dur_s = prev_voice_end + SCENE_TAIL_WAIT
    scene_dur_ms = int(round(scene_dur_s * 1000))

    return {
        "element_timings": element_timings,
        "scene_duration_s": round(scene_dur_s, 3),
        "scene_duration_ms": scene_dur_ms
    }


def mix_scene_audio(
    clip_files_and_starts: list[tuple[Path, float]],
    out_wav: Path,
    scene_dur_s: float
) -> Path:
    """Trộn các câu thoại vào đúng mốc thời gian liên tục của từng cảnh."""
    inputs = []
    parts = []
    for idx, (p, start_s) in enumerate(clip_files_and_starts):
        inputs.extend(["-i", str(p)])
        del_ms = int(round(start_s * 1000))
        parts.append(f"[{idx}]adelay={del_ms}|{del_ms}[a{idx}]")
    all_in = "".join(f"[a{k}]" for k in range(len(clip_files_and_starts)))
    parts.append(f"{all_in}amix=inputs={len(clip_files_and_starts)}:dropout_transition=0:normalize=0[aout]")

    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", *inputs,
        "-filter_complex", ";".join(parts), "-map", "[aout]",
        "-t", f"{scene_dur_s:.3f}", str(out_wav)
    ], check=True)
    return out_wav


# ──────────────────────────────────────────────────────────────
# QUY TRÌNH TỰ ĐỘNG CHÍNH (MAIN PIPELINE)
# ──────────────────────────────────────────────────────────────
def run_pipeline(job_id: str, req: VideoRequest):
    try:
        job_dir = OUTPUTS_DIR / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        JOBS[job_id]["status"] = "running"

        duration_sec = req.duration_sec or 60
        # 1. Kịch bản (Ưu tiên kịch bản người dùng tùy chỉnh từ Studio, hoặc Gemini AI, hoặc Smart Offline AI)
        storyboard = req.storyboard
        key_to_use = sanitize_gemini_key(req.gemini_api_key)

        if not storyboard:
            log(job_id, f"🔍 Bước 1: Chuẩn bị nội dung kịch bản ({duration_sec}s)...", 1, "Nghiên cứu & Kịch bản")
            if key_to_use:
                try:
                    log(job_id, "   Đang kết nối Google Gemini AI...")
                    storyboard = call_gemini_storyboard(req.topic, key_to_use, duration_sec=duration_sec)
                    log(job_id, f"✅ Gemini AI đã nghiên cứu và tạo kịch bản thành công: {storyboard.get('title')}")
                except Exception as e:
                    err_msg = str(e)
                    log(job_id, f"⚠️ Gemini API gặp sự cố: {err_msg[:120]}")
                    log(job_id, "💡 Tự động kích hoạt Engine Kịch Bản Dự Phòng (Offline AI) để tiếp tục tạo video...")

            if not storyboard:
                log(job_id, "   Đang khởi tạo kịch bản chuyên sâu theo chủ đề qua Engine Offline...")
                storyboard = generate_smart_storyboard(req.topic, duration_sec=duration_sec)
                log(job_id, f"✅ Đã tạo kịch bản hoàn chỉnh: {storyboard.get('title')}")
        else:
            log(job_id, f"✅ Đã tải kịch bản Studio ({len(storyboard.get('scenes', []))} cảnh): {storyboard.get('title')}", 1, "Nghiên cứu & Kịch bản")

        scenes = storyboard.get("scenes", [])
        num_scenes = max(1, len(scenes))

        display_t = storyboard.get("title", req.topic or "Whiteboard Animation")
        JOBS[job_id]["title"] = display_t
        (job_dir / "storyboard.json").write_text(json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")

        # 2. Xử lý ảnh minh họa 16:9 (Ưu tiên ảnh người dùng tự tải lên)
        log(job_id, f"🎨 Bước 2: Chuẩn bị hình ảnh minh họa vẽ tay cho {num_scenes} cảnh...", 2, "Xử lý ảnh vẽ tay")
        img_scenes = []
        
        # Hỗ trợ custom_images dạng dict {"1": b64, "2": b64, ...} lẫn legacy fields
        custom_b64s = {}
        if req.custom_images:
            for k, v in req.custom_images.items():
                try:
                    custom_b64s[int(k)] = v
                except Exception:
                    pass
        if req.scene_1_b64 and 1 not in custom_b64s:
            custom_b64s[1] = req.scene_1_b64
        if req.scene_2_b64 and 2 not in custom_b64s:
            custom_b64s[2] = req.scene_2_b64

        for sc in scenes:
            s_idx = sc["scene_index"]
            img_p = job_dir / f"scene_{s_idx}.png"
            b64_val = custom_b64s.get(s_idx)

            if b64_val and len(b64_val.strip()) > 100:
                log(job_id, f"   🖼️ Sử dụng ảnh bạn đã tải lên cho Cảnh {s_idx}!")
                raw_bytes = decode_base64_image(b64_val)
                process_uploaded_image(raw_bytes, img_p)
            else:
                log(job_id, f"   🎨 Đang chuẩn bị tranh Cảnh {s_idx}...")
                generate_or_download_scene_image(
                    sc, img_p, req.topic or "", 
                    gemini_key=key_to_use,
                    pollinations_key=req.pollinations_api_key,
                    together_key=req.together_api_key,
                    image_engine=req.image_engine
                )
            img_scenes.append(img_p)
            time.sleep(0.5)

        # 3. Lồng tiếng AI & Tính toán dòng thời gian nói liên tục (AUDIO-FIRST DYNAMIC TIMELINE)
        log(job_id, f"🎙️ Bước 3: Đang sinh giọng đọc AI & tối ưu mạch nói liên tục ({req.tts_engine.upper()})...", 3, "Lồng tiếng & Đồng bộ")
        audio_dir = job_dir / "audio_clips"
        audio_dir.mkdir(exist_ok=True)

        scene_timelines = []
        scene_audio_files = []
        ann_files = []

        for s_i, sc in enumerate(scenes):
            s_idx = sc["scene_index"]
            log(job_id, f"   Đang thu âm & khớp nhịp liên tục Cảnh {s_idx}...")
            
            elements = sc.get("elements", [])[:3]
            audio_durations = []
            clip_paths_and_starts = []

            # Sinh audio cho từng câu
            for e_i, el in enumerate(elements):
                cid = f"scene_{s_idx}_elem_{e_i+1}"
                mp3_p = audio_dir / f"{cid}.mp3"
                wav_p = audio_dir / f"{cid}.wav"
                sub_text = el.get("subtitle", "")
                dur = generate_single_audio_clip(sub_text, mp3_p, wav_p, req.tts_engine, req.voice_name, req.elevenlabs_api_key)
                audio_durations.append(dur)

            # Tính toán dòng thời gian liền mạch (nghỉ 0.35s giữa các câu, đợi 1.5s chuyển cảnh)
            timeline = compute_scene_continuous_timeline(audio_durations)
            scene_timelines.append(timeline)

            for e_i, t in enumerate(timeline["element_timings"]):
                wav_p = audio_dir / f"scene_{s_idx}_elem_{e_i+1}.wav"
                clip_paths_and_starts.append((wav_p, t["voice_start_s"]))

            # Mix audio cho cảnh này
            scene_voice_wav = job_dir / f"scene_{s_idx}_voice.wav"
            mix_scene_audio(clip_paths_and_starts, scene_voice_wav, timeline["scene_duration_s"])
            scene_audio_files.append(scene_voice_wav)

            # Xuất annotation.json tương ứng đúng thời lượng này
            ann_p = job_dir / f"scene_{s_idx}.annotation.json"
            build_annotation_json(
                sc, img_scenes[s_i], ann_p,
                element_timings=timeline["element_timings"],
                scene_duration_ms=timeline["scene_duration_ms"]
            )
            ann_files.append(ann_p)

        # Xuất SRT tổng thể đồng bộ hoàn hảo với giọng nói
        srt_full = job_dir / "subtitles.srt"
        export_srt([str(a) for a in ann_files], str(srt_full))
        log(job_id, f"✅ Đã tạo phụ đề chuẩn và đồng bộ giọng đọc: {srt_full.name}")

        # 4. Render Video Whiteboard Animation
        log(job_id, f"✍️ Bước 4: Đang render hoạt họa vẽ tay bảng trắng ({num_scenes} cảnh)...", 4, "Render vẽ bảng trắng")
        py_env = ROOT_DIR / ".venv" / "bin" / "python"
        render_script = ROOT_DIR / "scripts" / "render_stream_whiteboard.py"
        hand_img = ROOT_DIR / "assets" / "drawing-hand.png"

        scene_final_videos = []
        for i, ann_p in enumerate(ann_files):
            s_idx = scenes[i]["scene_index"]
            dur_s = scene_timelines[i]["scene_duration_s"]
            log(job_id, f"   Đang vẽ nét Cảnh {s_idx} ({dur_s:.1f}s)...")
            raw_mp4 = job_dir / f"scene_{s_idx}_raw.mp4"
            subprocess.run([
                str(py_env), str(render_script),
                str(img_scenes[i]), str(ann_p), str(raw_mp4), str(hand_img),
                "--cap-long-edge", "1080"
            ], check=True)

            # Đóng phụ đề vào cảnh (Hardsub)
            sub_mp4 = job_dir / f"scene_{s_idx}_subbed.mp4"
            cues = parse_annotation(ann_p)
            add_subtitles(raw_mp4, cues, sub_mp4)

            # Lồng tiếng vào cảnh này (đồng bộ 100%, kết thúc đợi đúng 1.5s là chuyển)
            scene_final_mp4 = job_dir / f"scene_{s_idx}_final.mp4"
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(sub_mp4),
                "-i", str(scene_audio_files[i]),
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-t", f"{dur_s:.3f}",
                str(scene_final_mp4)
            ], check=True)
            scene_final_videos.append(scene_final_mp4)

        # 5. Ghép các cảnh thành video hoàn chỉnh
        log(job_id, f"🎬 Bước 5: Đang kết nối {num_scenes} cảnh thành video hoàn chỉnh...", 5, "Ghép cảnh & Hoàn tất")
        final_video = job_dir / "final_whiteboard_video.mp4"
        if len(scene_final_videos) == 1:
            shutil.copyfile(scene_final_videos[0], final_video)
        else:
            merge_script = ROOT_DIR / "scripts" / "merge_scenes.py"
            subprocess.run([
                str(py_env), str(merge_script),
                "--inputs", *[str(p) for p in scene_final_videos],
                "--output", str(final_video)
            ], check=True)

        # Đo tổng thời lượng video thực tế
        cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(final_video)]
        actual_total_s = float(subprocess.run(cmd, capture_output=True, text=True).stdout.strip() or 0.0)

        # 6. Hoàn tất
        JOBS[job_id]["step"] = 6
        JOBS[job_id]["step_name"] = "Hoàn tất"
        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["video_url"] = f"/outputs/{job_id}/final_whiteboard_video.mp4"
        JOBS[job_id]["srt_url"] = f"/outputs/{job_id}/subtitles.srt"
        log(job_id, f"🎉 XUẤT BẢN THÀNH CÔNG! Video ({actual_total_s:.1f}s) đã sẵn sàng: mạch nói liên tục, chuyển cảnh mượt mà sau 1.5s!")

    except Exception as e:
        import traceback
        err_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in job {job_id}: {err_msg}")
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
        log(job_id, f"❌ LỖI: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
