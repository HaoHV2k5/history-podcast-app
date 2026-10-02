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
Nội dung video vừa được trích xuất sang định dạng Markdown (bằng Microsoft MarkItDown) dưới đây:

\"\"\"markdown
{markdown_content}
\"\"\"

CÁC TRÍCH ĐOẠN SỬ LIỆU GỐC ĐỐI CHIẾU TỪ KHO SÁCH (Đại Việt Sử Ký Toàn Thư, An Nam Chí Lược, Đại Việt Sử Lược):
{context_str}

QUY TẮC ĐÁNH GIÁ VÀ PHÂN TẦNG ĐIỂM SỐ (POLICY SHIELD - BẮT BUỘC TUÂN THỦ CHÍNH XÁC):
1. Thang điểm từ 0 đến 100:
   - Dưới 50% (< 50): Báo động đỏ (RED_ALERT) - Xảy ra khi có sai lệch sự thật lịch sử nghiêm trọng, xuyên tạc nhân vật/sự kiện, chứa ngôn từ thù hận, kích động, hoặc vi phạm nghiêm trọng chính sách nội dung. Kèm lý do vi phạm chi tiết.
   - Từ 50% tới < 80%: Khá (FAIR) - Nội dung cơ bản phù hợp nhưng còn tồn tại các lỗi sai sót nhỏ về số liệu/năm tháng/địa danh hoặc kịch bản còn sơ sài, cần lưu ý chỉnh sửa.
   - Từ 80% tới 90%: Tốt (GOOD) - Kịch bản và tư liệu đối chiếu chuẩn xác, đáp ứng đầy đủ tiêu chuẩn xuất bản, thông tin rõ ràng.
   - Trên 90% (> 90): Xuất sắc (EXCELLENT) - Sử liệu mẫu mực, hấp dẫn, độ tin cậy rất cao, xuất sắc.

2. Hãy phân tích các luận điểm (claims), chỉ ra điểm đúng, điểm sai hoặc thiếu căn cứ.

HÃY TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON (không có markdown code fences ```json):
{{
  "score": 85.0,
  "reason": "Tóm tắt nhận định tổng thể về chất lượng và độ an toàn của video...",
  "violations": ["Điểm vi phạm hoặc sai sót 1", "Điểm vi phạm 2"],
  "positive_points": ["Điểm tốt 1", "Điểm tốt 2"],
  "claims": [
    {{
      "claim": "...",
      "verdict": "verified / error / warning",
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
                        raw_score = float(parsed.get("score", 75.0))
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
                                    "similarity": c.get("similarity", 0)
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
    Quy tắc kiểm duyệt dự phòng khi Gemini API không khả dụng:
    Đảm bảo luôn phân loại chính xác 4 mức theo policy người dùng yêu cầu:
    - < 50: Báo động đỏ (RED_ALERT)
    - 50 - <80: Khá (FAIR)
    - 80 - 90: Tốt (GOOD)
    - > 90: Xuất sắc (EXCELLENT)
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

    if max_sim < 0.2 and context_chunks:
        warnings.append("Chưa tìm thấy đoạn trích sử liệu đối chiếu trực tiếp có độ tin cậy cao trong kho tài liệu.")

    # Tính điểm
    if critical_violations:
        score = 35.0  # Dưới 50% => Báo động đỏ
        reason = f"Báo động đỏ: Nội dung vi phạm chính sách hoặc sai lệch tiêu chuẩn. Chi tiết: {'; '.join(critical_violations)}"
    elif warnings:
        score = 68.0 if max_sim > 0.4 else 58.0  # 50% - <80% => Khá
        reason = f"Nội dung đạt mức Khá. Cần lưu ý các điểm sau trước khi xuất bản: {'; '.join(warnings)}"
    elif max_sim >= 0.7:
        score = 92.5  # > 90% => Xuất sắc
        reason = "Nội dung xuất sắc: Kịch bản khớp rất cao với các tư liệu sử học gốc, cấu trúc mạch lạc và chuẩn mực."
    else:
        score = 84.0  # 80% - 90% => Tốt
        reason = "Nội dung đạt chuẩn Tốt: Thông tin rõ ràng, đối chiếu phù hợp với nguồn sử liệu hiện có."

    tier, tier_label = evaluate_tier(score)

    return {
        "tier": tier,
        "tier_label": tier_label,
        "score": round(score, 2),
        "reason": reason,
        "violations": critical_violations,
        "positive_points": ["Đã được trích xuất thành định dạng Markdown chuẩn qua MarkItDown"] if not critical_violations else [],
        "claims": [],
        "recommendation": "Admin cần xem xét chi tiết lý do và báo cáo trước khi đưa ra quyết định." if score < 80.0 else "Nội dung đáp ứng tiêu chuẩn để Admin phê duyệt.",
        "markdown_content": markdown_content,
        "source_citations": [
            {
                "book": c.get("book_title", ""),
                "page": c.get("page", 0),
                "similarity": c.get("similarity", 0)
            }
            for c in context_chunks
        ],
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
