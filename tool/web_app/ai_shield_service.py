"""
ai_shield_service.py — AI Shield Content Verification Service
Sử dụng Microsoft MarkItDown để chuyển đổi nội dung/media video thành định dạng Markdown (.md),
sau đó thực hiện đối chiếu tư liệu (RAG Embedding) và kiểm duyệt chính sách (Policy Check).

Phân tầng đánh giá:
- < 50%: Báo động đỏ (RED_ALERT) + lý do vi phạm nghiêm trọng
- 50% - < 80%: Khá (FAIR) + lý do, điểm cần lưu ý/chỉnh sửa
- 80% - 90%: Tốt (GOOD) + đánh giá tích cực, đạt tiêu chuẩn
- > 90%: Xuất sắc (EXCELLENT) + đánh giá chất lượng cao, xuất sắc
"""

import os
import re
import json
import time
import tempfile
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, Dict, Any, List

from markitdown import MarkItDown

from rag_service import search_history_context, search_history_by_keywords

_markitdown_instance = None


def get_markitdown() -> MarkItDown:
    global _markitdown_instance
    if _markitdown_instance is None:
        _markitdown_instance = MarkItDown()
    return _markitdown_instance


def convert_content_to_markdown(
    title: str,
    script_text: str,
    storyboard: Optional[Dict[str, Any]] = None,
    video_path: Optional[str] = None,
    media_url: Optional[str] = None
) -> str:
    """
    Chuyển đổi toàn bộ thông tin kịch bản, âm thanh/video và phân cảnh thành Markdown chuẩn thông qua Microsoft MarkItDown.
    """
    md_converter = get_markitdown()
    extracted_media_md = ""

    # 1. Nếu có tệp video/audio thực tế trên đĩa, cho MarkItDown chuyển đổi trực tiếp
    target_file = None
    temp_file_to_clean = None
    if video_path and os.path.exists(video_path):
        target_file = video_path
    elif media_url and (media_url.startswith("http://") or media_url.startswith("https://")):
        # Thử tải phần đầu hoặc tệp nếu kích thước hợp lý (tối đa 20MB)
        try:
            req = urllib.request.Request(media_url, headers={"User-Agent": "AIShield/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                ext = Path(media_url).suffix or ".mp4"
                if len(ext) > 5 or not ext:
                    ext = ".mp4"
                with tempfile.NamedTemporaryFile("wb", suffix=ext, delete=False) as tf:
                    # Đọc tối đa 15MB
                    tf.write(resp.read(15 * 1024 * 1024))
                    temp_file_to_clean = tf.name
                    target_file = temp_file_to_clean
        except Exception as e:
            print(f"[AI Shield] ⚠️ Không thể tải media từ URL để MarkItDown đọc trực tiếp: {e}")

    if target_file and os.path.exists(target_file):
        try:
            converted = md_converter.convert(target_file)
            if converted and converted.text_content:
                extracted_media_md = converted.text_content.strip()
        except Exception as e:
            print(f"[AI Shield] ⚠️ MarkItDown convert tệp media thất bại: {e}")
        finally:
            if temp_file_to_clean and os.path.exists(temp_file_to_clean):
                try:
                    os.remove(temp_file_to_clean)
                except Exception:
                    pass

    # 2. Tạo tệp tạm dạng Markdown từ scriptText và phân cảnh, rồi cho MarkItDown xử lý chuẩn hóa
    structured_raw = []
    structured_raw.append(f"# Video: {title.strip() if title else 'Chưa đặt tiêu đề'}\n")
    structured_raw.append("## Lời Thuyết Minh Chính (Narration Script)\n")
    structured_raw.append(script_text.strip() if script_text else "(Không có lời thuyết minh)")
    structured_raw.append("\n")

    if storyboard and isinstance(storyboard, dict):
        scenes = storyboard.get("scenes", [])
        if scenes and isinstance(scenes, list):
            structured_raw.append("## Chi Tiết Phân Cảnh (Storyboard Breakdown)\n")
            for idx, sc in enumerate(scenes, 1):
                if isinstance(sc, dict):
                    sc_desc = sc.get("narration") or sc.get("text") or sc.get("description") or ""
                    prompt = sc.get("prompt") or sc.get("visual_prompt") or ""
                    structured_raw.append(f"### Cảnh {idx}")
                    if sc_desc:
                        structured_raw.append(f"- **Lời bình**: {sc_desc}")
                    if prompt:
                        structured_raw.append(f"- **Mô tả hình ảnh (Visual Prompt)**: {prompt}")
                    structured_raw.append("")

    raw_text = "\n".join(structured_raw)

    # Đưa qua MarkItDown converter để chuẩn hóa định dạng Markdown
    final_md = raw_text
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".txt", encoding="utf-8", delete=False) as f:
            f.write(raw_text)
            tmp_txt = f.name
        res = md_converter.convert(tmp_txt)
        if res and res.text_content:
            final_md = res.text_content.strip()
        os.remove(tmp_txt)
    except Exception as e:
        print(f"[AI Shield] ⚠️ Lỗi khi chuẩn hóa qua MarkItDown: {e}")

    if extracted_media_md:
        final_md += f"\n\n## Trích Xuất Media Metadata (MarkItDown)\n{extracted_media_md}\n"

    return final_md


def evaluate_tier(score: float) -> tuple[str, str]:
    """
    Xác định phân tầng đánh giá dựa trên điểm số (0 - 100):
    - < 50%: RED_ALERT ("Báo động đỏ")
    - 50% - < 80%: FAIR ("Khá")
    - 80% - 90%: GOOD ("Tốt")
    - > 90%: EXCELLENT ("Xuất sắc")
    """
    if score < 50.0:
        return "RED_ALERT", "Báo động đỏ"
    elif score < 80.0:
        return "FAIR", "Khá"
    elif score <= 90.0:
        return "GOOD", "Tốt"
    else:
        return "EXCELLENT", "Xuất sắc"


def verify_content_ai_shield(
    title: str,
    script_text: str,
    storyboard: Optional[Dict[str, Any]] = None,
    video_path: Optional[str] = None,
    media_url: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Thực hiện toàn bộ quy trình AI Shield:
    1. Chuyển đổi nội dung thành Markdown (.md) qua Microsoft MarkItDown.
    2. RAG Embedding tra cứu sử liệu đối chiếu từ doc/.
    3. Kiểm duyệt các tiêu chuẩn chính sách: Sử liệu chân thực, Văn hóa lịch sử, Không ngôn từ thù hận/xuyên tạc.
    4. Tính điểm 0-100 và phân tầng 4 mức: Báo động đỏ (<50%), Khá (50-<80%), Tốt (80-90%), Xuất sắc (>90%).
    5. Đóng gói kết quả gửi đến Admin kèm báo cáo Markdown.
    """
    # 1. Chuyển đổi sang Markdown
    markdown_content = convert_content_to_markdown(
        title=title,
        script_text=script_text,
        storyboard=storyboard,
        video_path=video_path,
        media_url=media_url
    )

    clean_key = (api_key or "").strip()
    system_key = os.getenv("SYSTEM_GEMINI_API_KEY", "").strip()
    key_to_use = clean_key or system_key

    # 2. Truy vấn RAG Context
    query = (title + " " + (script_text[:400] if script_text else "")).strip()
    context_chunks = []
    if key_to_use:
        try:
            context_chunks = search_history_context(query, key_to_use, top_k=6)
        except Exception:
            context_chunks = search_history_by_keywords(query, top_k=6)
    else:
        context_chunks = search_history_by_keywords(query, top_k=6)

    context_str = ""
    for idx, c in enumerate(context_chunks, 1):
        context_str += f"""--- TRÍCH DẪN SỬ LIỆU {idx} [{c.get('book_title', 'Sử liệu Việt Nam')} - Trang {c.get('page', 0)}] ---
{c.get('text', '')}

"""

    if not context_str:
        context_str = "(Không có trích đoạn sử liệu đối chiếu trực tiếp từ kho tư liệu)"

    # 3. Đánh giá nội dung bằng Gemini API nếu có key
    if key_to_use:
        try:
            prompt = f"""Bạn là Hệ Thống Kiểm Duyệt Nội Dung & AI Shield Thẩm Định Sử Liệu Lịch Sử Việt Nam.
HỆ THỐNG ÁP DỤNG CHÍNH SÁCH B - RÀNG BUỘC SỬ LIỆU NGHIÊM NGẶT TUYỆT ĐỐI (STRICT RAG GROUNDING POLICY):
Kho tài liệu số hóa nội bộ (`doc/`) là CƠ SỞ BẮT BUỘC ĐỂ XÁC THỰC MỌI VIDEO.

Nội dung video vừa được trích xuất sang định dạng Markdown (bằng Microsoft MarkItDown) dưới đây:
\"\"\"markdown
{markdown_content}
\"\"\"

CÁC TRÍCH ĐOẠN SỬ LIỆU GỐC ĐỐI CHIẾU TỪ KHO SÁCH NỘI BỘ (Đại Việt Sử Ký Toàn Thư, An Nam Chí Lược, Đại Việt Sử Lược):
{context_str}

QUY TẮC ĐÁNH GIÁ VÀ PHÂN TẦNG ĐIỂM SỐ (CHÍNH SÁCH B - BẮT BUỘC TUÂN THỦ CHÍNH XÁC):
1. QUY TẮC RÀNG BUỘC KHO SỬ LIỆU TUYỆT ĐỐI:
   - Nếu nội dung kịch bản/video KHÔNG CÓ TRÍCH ĐOẠN SỬ LIỆU ĐỐI CHIẾU trong kho tài liệu được cấp ở trên (hoặc các trích đoạn cung cấp không liên quan đến thời kỳ/sự kiện/nhân vật trong video, ví dụ: kho sách chỉ có thời phong kiến mà video nói về Điện Biên Phủ 1954, thời hiện đại, hoặc nhân vật hư cấu):
     * BẮT BUỘC PHẢI CHẤM ĐIỂM DƯỚI 50% (< 50% - BÁO ĐỘNG ĐỎ / RED_ALERT, điểm đề xuất từ 30% đến 45%).
     * Phải ghi rõ trong "violations" và "reason": "Báo động đỏ: Nội dung nằm ngoài phạm vi kho sử liệu nội bộ (doc/), không có tài liệu đối chiếu xác thực theo chính sách hệ thống. Đề xuất Admin Từ chối (Reject)."
     * Đề xuất ("recommendation"): "Admin Từ chối (Reject) video vì chủ đề nằm ngoài kho tư liệu hỗ trợ của hệ thống. Yêu cầu tác giả chọn chủ đề thuộc phạm vi sử liệu được hỗ trợ."
     * Các tuyên bố (claims) không tìm thấy chứng cứ trong trích đoạn phải đánh dấu verdict: "error" hoặc "warning" (không có căn cứ trong kho sách).
   - Nếu TIÊU ĐỀ và NỘI DUNG KỊCH BẢN MÂU THUẪN THỜI ĐẠI / NHÂN VẬT (ví dụ: Tiêu đề đặt tên nhân vật thời Lý như "Lý Thường Kiệt" nhưng nội dung thuyết minh lại kể về sự kiện thời Trần như "Hội nghị Diên Hồng năm 1284", hoặc ngược lại):
     * Đây là lỗi sai lệch lịch sử nghiêm trọng (gán sai nhân vật, lệch niên đại hàng trăm năm).
     * BẮT BUỘC PHẢI CHẤM ĐIỂM DƯỚI 50% (< 50% - BÁO ĐỘNG ĐỎ / RED_ALERT, điểm đề xuất từ 30% đến 40%).
     * Phải ghi rõ trong "violations" và "reason": "Báo động đỏ: Mâu thuẫn thời đại và nhân vật lịch sử giữa tiêu đề và nội dung kịch bản (Tiêu đề đề cập đến [nhân vật/thời đại ở tiêu đề], nhưng kịch bản lại thuyết minh về [sự kiện/thời đại ở nội dung], sai lệch hoàn toàn về niên đại và nhân vật). Đề xuất Admin Từ chối (Reject)."
     * Đề xuất ("recommendation"): "Admin Từ chối (Reject) video vì tiêu đề và nội dung mâu thuẫn thời đại lịch sử. Yêu cầu tác giả chỉnh sửa tiêu đề hoặc nội dung cho đồng nhất đúng với sự thật lịch sử."

2. ĐIỀU KIỆN ĐẠT ĐIỂM >= 50% (BẮT BUỘC PHẢI CÓ TƯ LIỆU TRONG KHO SÁCH ĐỐI CHIẾU VÀ ĐỒNG NHẤT VỀ LỊCH SỬ):
   - Từ 50% tới < 80%: Khá (FAIR) - Khi nội dung ĐÃ CÓ TRONG KHO SÁCH nhưng kịch bản còn tồn tại lỗi sai sót nhỏ về số liệu/năm tháng/địa danh, hoặc kịch bản còn sơ sài chưa phản ánh đầy đủ sử liệu.
   - Từ 80% tới 90%: Tốt (GOOD) - Kịch bản ĐÃ ĐƯỢC ĐỐI CHIẾU KHỚP VÀ CHUẨN XÁC VỚI KHO SỬ LIỆU GỐC ĐƯỢC CẤP, tiêu đề và nội dung đồng nhất, thông tin rõ ràng, không có lỗi sai, đáp ứng đầy đủ tiêu chuẩn xuất bản.
   - Trên 90% (> 90): Xuất sắc (EXCELLENT) - Sử liệu mẫu mực, đối chiếu khớp chặt chẽ và sâu sắc với trích dẫn từ sách gốc (có trích dẫn văn bia/hịch/lời bình của sử gia), văn phong xuất sắc, độ tin cậy tuyệt đối.
   - Dưới 50% (< 50): Báo động đỏ (RED_ALERT) - Xảy ra khi:
     (1) Nội dung NẰM NGOÀI KHO SỬ LIỆU NỘI BỘ (không có tài liệu đối chiếu).
     (2) Tiêu đề và nội dung kịch bản mâu thuẫn thời kỳ / nhân vật lịch sử.
     (3) Có sai lệch lịch sử nghiêm trọng, xuyên tạc sự thật, ngôn từ thù hận, kích động, hoặc vi phạm nghiêm trọng chính sách nội dung.

3. Hãy phân tích các luận điểm (claims), chỉ ra điểm đúng, điểm sai hoặc thiếu căn cứ từ kho sách.

HÃY TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON (không có markdown code fences ```json):
{{
  "score": 38.0,
  "reason": "Tóm tắt nhận định tổng thể, nêu rõ tình trạng đối chiếu với kho sách nội bộ...",
  "violations": ["Điểm vi phạm hoặc cảnh báo nằm ngoài kho sách"],
  "positive_points": ["Điểm tốt (nếu có)"],
  "claims": [
    {{
      "claim": "...",
      "verdict": "error / warning / verified",
      "explanation": "..."
    }}
  ],
  "recommendation": "Đề xuất cho Admin duyệt hay từ chối và hướng dẫn tác giả chỉnh sửa"
}}
"""
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            }

            models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]
            for model in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key_to_use}"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                try:
                    with urllib.request.urlopen(req, timeout=45) as resp:
                        raw_data = json.loads(resp.read().decode("utf-8"))
                        text_resp = raw_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if text_resp.startswith("```"):
                            text_resp = text_resp.split("```")[1]
                            if text_resp.startswith("json"):
                                text_resp = text_resp[4:].strip()
                        parsed = json.loads(text_resp)
                        raw_score = float(parsed.get("score", 35.0))

                        # HƯỚNG B: STRICT GROUNDING GUARDRAIL (Enforcement Code Layer):
                        # Nhận diện nếu nội dung nằm ngoài kho sách từ nhận định của Gemini hoặc lack of grounding
                        reason_text = (parsed.get("reason", "") + " " + " ".join([str(v) for v in parsed.get("violations", [])])).lower()
                        is_out_of_scope = any(
                            k in reason_text for k in [
                                "nằm ngoài", "không có tài liệu đối chiếu", "không chứa tư liệu",
                                "thiếu trích dẫn chứng cứ lịch sử từ kho", "không tìm thấy trích đoạn",
                                "không có trích đoạn sử liệu", "chưa có tư liệu đối chiếu", "không có trong kho",
                                "ngoài phạm vi kho", "thiếu trích dẫn chứng cứ", "không tìm thấy tài liệu"
                            ]
                        )

                        # Nếu nội dung nằm ngoài kho sách hoặc không có căn cứ đối chiếu:
                        # BẮT BUỘC kẹp điểm (clamp) xuống dưới 50% (BÁO ĐỘNG ĐỎ - RED_ALERT, 38.0)
                        if (not context_chunks or is_out_of_scope) and raw_score >= 50.0:
                            raw_score = 38.0
                            orig_reason = parsed.get("reason", "")
                            parsed["reason"] = f"[Báo động đỏ - Strict Grounding] Chủ đề hoặc sự kiện nằm ngoài phạm vi kho sử liệu nội bộ (doc/). Theo chính sách B, video bị xếp loại Báo động đỏ để Admin từ chối. Nhận định: {orig_reason}"
                            violations = parsed.get("violations", [])
                            if not isinstance(violations, list):
                                violations = []
                            warning_msg = "Báo động đỏ: Nội dung nằm ngoài phạm vi kho sử liệu nội bộ (doc/), không có tài liệu đối chiếu xác thực theo chính sách hệ thống."
                            if not any("kho sách" in str(v).lower() or "báo động đỏ" in str(v).lower() for v in violations):
                                violations.insert(0, warning_msg)
                            parsed["violations"] = violations
                            parsed["recommendation"] = "Admin Từ chối (Reject) video vì chủ đề nằm ngoài kho tư liệu hỗ trợ của hệ thống."

                        # Clamp score between 0 and 100
                        score = max(0.0, min(100.0, raw_score))
                        tier, tier_label = evaluate_tier(score)

                        return {
                            "tier": tier,
                            "tier_label": tier_label,
                            "score": round(score, 2),
                            "reason": parsed.get("reason", "Đã hoàn thành kiểm duyệt AI Shield."),
                            "violations": parsed.get("violations", []),
                            "positive_points": parsed.get("positive_points", []),
                            "claims": parsed.get("claims", []),
                            "recommendation": parsed.get("recommendation", ""),
                            "markdown_content": markdown_content,
                            "source_citations": [
                                {
                                    "book": c.get("book_title", ""),
                                    "page": c.get("page", 0),
                                    "similarity": c.get("similarity", 0),
                                    "snippet": (c.get("text", "")[:280] + "...") if len(c.get("text", "")) > 280 else c.get("text", "")
                                }
                                for c in context_chunks
                            ],
                            "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        }
                except Exception as ex:
                    print(f"[AI Shield] ⚠️ Lỗi thử model {model}: {ex}")
                    continue
        except Exception as e:
            print(f"[AI Shield] ⚠️ Gọi Gemini AI Shield thất bại, chuyển sang bộ quy tắc nội bộ: {e}")

    # 4. Fallback: Đánh giá bằng bộ quy tắc chính sách & sử liệu nội bộ (Rule-based Shield)
    return rule_based_policy_evaluation(
        title=title,
        script_text=script_text,
        markdown_content=markdown_content,
        context_chunks=context_chunks
    )


def rule_based_policy_evaluation(
    title: str,
    script_text: str,
    markdown_content: str,
    context_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Quy tắc kiểm duyệt dự phòng khi Gemini API không khả dụng (Chính sách B):
    Tuân thủ nghiêm ngặt chính sách Strict RAG Grounding:
    - Nếu không có trích dẫn từ kho sách nội bộ: Bắt buộc rơi vào Báo động đỏ (RED_ALERT: < 50%)
    - < 50: Báo động đỏ (RED_ALERT)
    - 50 - <80: Khá (FAIR - chỉ khi có trích dẫn trong kho sách nhưng còn lỗi nhỏ)
    - 80 - 90: Tốt (GOOD - chỉ khi có trích dẫn sử liệu chuẩn xác từ kho sách)
    - > 90: Xuất sắc (EXCELLENT - chỉ khi có trích dẫn sử liệu khớp cao từ kho sách)
    """
    content_lower = (title + " " + script_text).lower()

    # Từ khóa cấm / vi phạm nghiêm trọng (Báo động đỏ)
    critical_violations = []
    toxic_words = [
        "xuyên tạc", "phản động", "kích động", "thù hằn", "bạo lực", "khiêu dâm",
        "tuyên truyền sai trái", "phỉ báng", "xúc phạm danh dự", "lừa đảo"
    ]
    for w in toxic_words:
        if w in content_lower:
            critical_violations.append(f"Phát hiện nội dung có chứa từ ngữ vi phạm chính sách: '{w}'")

    # Kiểm tra tính đầy đủ của kịch bản
    warnings = []
    words_count = len(script_text.split())
    if words_count < 10:
        critical_violations.append("Nội dung kịch bản quá ngắn (dưới 10 từ), không đủ cấu trúc thông tin lịch sử.")
    elif words_count < 20 and not context_chunks:
        warnings.append("Kịch bản tương đối ngắn, nên bổ sung chi tiết sự kiện và bối cảnh lịch sử.")

    # Đánh giá độ khớp với kho tư liệu
    max_sim = 0.0
    if context_chunks:
        max_sim = max([float(c.get("similarity", 0.0)) for c in context_chunks] + [0.0])

    has_grounding = bool(context_chunks and max_sim >= 0.40)
    if not has_grounding:
        warnings.append("Chưa tìm thấy đoạn trích sử liệu đối chiếu trực tiếp từ kho sách nội bộ (doc/).")

    # Tính điểm theo Strict Grounding (Hướng B: Không có trong sách => Báo động đỏ)
    if critical_violations:
        score = 35.0  # Dưới 50% => Báo động đỏ
        reason = f"Báo động đỏ: Nội dung vi phạm chính sách hoặc sai lệch tiêu chuẩn. Chi tiết: {'; '.join(critical_violations)}"
    elif not has_grounding:
        score = 38.0  # Dưới 50% => Báo động đỏ vì nằm ngoài kho sách
        reason = "[Báo động đỏ - Strict Grounding] Chủ đề/nội dung nằm ngoài phạm vi kho sách nội bộ (doc/), không có tư liệu đối chiếu trực tiếp để xác thực."
    elif warnings:
        score = 68.0  # 50% - <80% => Khá
        reason = f"Nội dung đạt mức Khá. Cần lưu ý các điểm sau trước khi xuất bản: {'; '.join(warnings)}"
    elif max_sim >= 0.70:
        score = 92.5  # > 90% => Xuất sắc
        reason = "Nội dung xuất sắc: Kịch bản khớp rất cao với các tư liệu sử học gốc từ kho sách, cấu trúc mạch lạc và chuẩn mực."
    else:
        score = 84.0  # 80% - 90% => Tốt
        reason = "Nội dung đạt chuẩn Tốt: Thông tin rõ ràng, đối chiếu phù hợp với nguồn sử liệu trong kho sách nội bộ."

    tier, tier_label = evaluate_tier(score)

    return {
        "tier": tier,
        "tier_label": tier_label,
        "score": round(score, 2),
        "reason": reason,
        "violations": critical_violations + ([w for w in warnings if "kho sách" in w] if not has_grounding and not critical_violations else []),
        "positive_points": ["Đã được trích xuất thành định dạng Markdown chuẩn qua MarkItDown"] if not critical_violations else [],
        "claims": [],
        "recommendation": "Admin Từ chối (Reject) video vì chủ đề nằm ngoài kho tư liệu hỗ trợ của hệ thống." if not has_grounding or critical_violations else ("Admin xem xét chi tiết trước khi phê duyệt." if score < 80.0 else "Nội dung đáp ứng tiêu chuẩn để Admin phê duyệt."),
        "markdown_content": markdown_content,
        "source_citations": [
            {
                "book": c.get("book_title", ""),
                "page": c.get("page", 0),
                "similarity": c.get("similarity", 0),
                "snippet": (c.get("text", "")[:280] + "...") if len(c.get("text", "")) > 280 else c.get("text", "")
            }
            for c in context_chunks
        ],
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

