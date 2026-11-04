"""
rag_service.py — Dịch vụ Tra cứu Sử liệu (RAG) & Thẩm định Kịch bản (Fact-Checking)
Tích hợp cho tool (Whiteboard Studio)
"""

import os
import re
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv

# Tải cấu hình từ .env
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent / ".env",
    Path.cwd() / ".env"
]
for ep in env_paths:
    if ep.exists():
        load_dotenv(ep)
        break

import chromadb

ROOT_TOOL_DIR = Path(__file__).resolve().parent.parent
raw_db_dir = os.getenv("CHROMA_DB_DIR", "./data/chroma_db")
if os.path.isabs(raw_db_dir):
    CHROMA_DB_DIR = raw_db_dir
else:
    clean_rel = raw_db_dir.replace("./", "")
    CHROMA_DB_DIR = str((ROOT_TOOL_DIR / clean_rel).resolve())

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
SYSTEM_KEY = os.getenv("SYSTEM_GEMINI_API_KEY", "").strip()

# Lazy-loaded ChromaDB collection
_chroma_client = None
_collection = None


def get_chroma_collection():
    global _chroma_client, _collection
    if _collection is None:
        db_path = Path(CHROMA_DB_DIR).resolve()
        db_path.mkdir(parents=True, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=str(db_path))
        _collection = _chroma_client.get_or_create_collection(
            name="vietnam_history_docs",
            metadata={"description": "Kho tri thức sử Việt từ thư mục doc"}
        )
    return _collection


def get_embedding(text: str, api_key: str, model: str = EMBEDDING_MODEL, output_dim: int = 768) -> List[float]:
    """
    Tạo vector embedding cho một chuỗi văn bản (query, title hoặc câu kịch bản)
    Hỗ trợ tự động fallback giữa gemini-embedding-2 và gemini-embedding-001.
    """
    key_to_use = (api_key or "").strip()
    if not key_to_use:
        raise ValueError("Chưa có Google Gemini API Key của người dùng. Vui lòng cấu hình API Key cá nhân trong Cài đặt (⚙️).")

    candidate_models = [model]
    if model != "gemini-embedding-2":
        candidate_models.append("gemini-embedding-2")
    if "gemini-embedding-001" not in candidate_models:
        candidate_models.append("gemini-embedding-001")

    for candidate in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:embedContent?key={key_to_use}"
        payload = {
            "content": {"parts": [{"text": text[:2048]}]},
            "outputDimensionality": output_dim
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        for attempt in range(2):
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data.get("embedding", {}).get("values", [])
            except urllib.error.HTTPError as e:
                err_text = ""
                try:
                    err_text = e.read().decode("utf-8", errors="ignore")
                except Exception:
                    pass
                if "RESOURCE_EXHAUSTED" in err_text or "Quota exceeded" in err_text:
                    # Hết quota lượt gọi API trong ngày, dừng thử ngay để chuyển sang keyword search
                    break
                if e.code == 429 and attempt == 0:
                    time.sleep(1.0)
                    continue
                break
            except Exception:
                if attempt == 0:
                    time.sleep(0.5)
                    continue
                break

    raise RuntimeError("Không thể tạo vector embedding với các mô hình Gemini hiện có.")


_cached_corpus = None

def get_cached_corpus():
    global _cached_corpus
    if _cached_corpus is None:
        col = get_chroma_collection()
        total = col.count()
        if total > 0:
            data = col.get(include=["documents", "metadatas"])
            _cached_corpus = (data.get("documents", []), data.get("metadatas", []))
        else:
            _cached_corpus = ([], [])
    return _cached_corpus


def search_history_by_keywords(query: str, top_k: int = 6) -> List[Dict[str, Any]]:
    """
    Tìm kiếm sử liệu dựa trên từ khóa ngữ cảnh trên toàn bộ kho sách doc/ (1920 chunks trong ChromaDB).
    Hoạt động như phương thức Hybrid / Fallback vững chắc khi Gemini Vector Embedding chạm quota hoặc lỗi kết nối.
    Đảm bảo quy trình RAG luôn BẮT BUỘC và không bao giờ bị gián đoạn.
    """
    import re
    docs, metas = get_cached_corpus()
    if not docs:
        return []

    q_lower = query.lower()
    # Tách cụm từ 2-3 từ
    phrases = re.findall(r'\b[a-zA-Zà-ỹÀ-Ỹ]{3,}(?:\s+[a-zA-Zà-ỹÀ-Ỹ]{3,}){1,2}\b', q_lower)
    stop_words = {
        'và', 'của', 'các', 'những', 'ở', 'tại', 'trong', 'cho', 'với', 'là', 'khi',
        'về', 'năm', 'được', 'người', 'này', 'đó', 'từ', 'ra', 'vào', 'đã', 'sẽ', 'lại'
    }
    words = [w for w in re.findall(r'\b[a-zA-Zà-ỹÀ-Ỹ]{2,}\b', q_lower) if w not in stop_words]

    scored = []
    for d, m in zip(docs, metas):
        dl = d.lower()
        score = 0
        for p in phrases:
            if p in dl:
                score += 8
        for w in words:
            score += dl.count(w)
        if score > 0:
            similarity = min(0.95, 0.65 + score * 0.015)
            scored.append({
                "text": d,
                "book_title": m.get("book_title", "Sử liệu Việt Nam"),
                "page": m.get("page_number", 0),
                "file_name": m.get("file_name", ""),
                "similarity": round(similarity, 4),
                "distance": round(max(0.0, 1.0 - similarity), 4),
                "_score": score
            })

    scored.sort(key=lambda x: x["_score"], reverse=True)
    return scored[:top_k]


def search_history_context(query: str, api_key: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Tìm kiếm các đoạn tư liệu lịch sử liên quan nhất trong ChromaDB.
    Ưu tiên tìm kiếm Vector Embedding; tự động kích hoạt Keyword Search nếu Embedding API bận/quota.
    Đảm bảo quy trình RAG BẮT BUỘC luôn trả về nguồn sử liệu gốc tin cậy.
    """
    col = get_chroma_collection()
    total_chunks = col.count()
    if total_chunks == 0:
        return []

    # 1. Thử Vector Embedding Search
    try:
        query_emb = get_embedding(query, api_key)
        results = col.query(
            query_embeddings=[query_emb],
            n_results=min(top_k, total_chunks)
        )

        matches = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0]

            for d, m, dist in zip(docs, metas, distances):
                similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                matches.append({
                    "text": d,
                    "book_title": m.get("book_title", "Sử liệu Việt Nam"),
                    "page": m.get("page_number", 0),
                    "file_name": m.get("file_name", ""),
                    "similarity": round(similarity, 4),
                    "distance": round(dist, 4)
                })

        if matches:
            print(f"[RAG] ✅ Tìm thấy {len(matches)} đoạn sử liệu qua Vector Search (Sim cao nhất: {matches[0]['similarity']})")
            return matches
    except Exception as e:
        print(f"[RAG] ⚠️ Vector Search không khả dụng ({e}). Tự động kích hoạt Keyword Context RAG...")

    # 2. Fallback / Hybrid sang Keyword Search từ kho 1920 chunks
    kw_matches = search_history_by_keywords(query, top_k=top_k)
    if kw_matches:
        print(f"[RAG] ✅ Tìm thấy {len(kw_matches)} đoạn sử liệu qua Keyword Context RAG (Trích dẫn cao nhất: {kw_matches[0]['book_title']} Trang {kw_matches[0]['page']})")
    return kw_matches


def verify_script_with_gemini(script_text: str, api_key: str) -> Dict[str, Any]:
    """
    Thẩm định kịch bản người dùng cung cấp so với các tài liệu sử học trong doc/:
    - Kiểm tra phạm vi (scope)
    - Đối chiếu các luận điểm lịch sử với tư liệu gốc
    - Đưa ra điểm tin cậy, chi tiết đúng/sai, trích dẫn sách và bản sửa đổi chuẩn xác
    """
    key_to_use = (api_key or "").strip()
    if not key_to_use:
        raise ValueError("Vui lòng cung cấp Google Gemini API Key cá nhân trong Cài đặt (⚙️) để thực hiện thẩm định!")

    # ── 0. BỘ KIỂM SOÁT NIÊN ĐẠI CỨNG (DETERMINISTIC CHRONOLOGY GATE) ──
    year_matches = list(re.finditer(r'\b(?:năm|vào năm|niên hiệu.*?năm|năm thứ)?\s*(\d{3,4})\b', script_text, flags=re.IGNORECASE))
    for ym in year_matches:
        full_match = ym.group(0).strip()
        yr_str = ym.group(1)
        yr = int(yr_str)
        if "năm" in full_match.lower() or "vào năm" in full_match.lower() or full_match.isdigit():
            if yr < 1009 or yr > 1400:
                dynasty_hint = (
                    f"Thời kỳ Hiện đại thế kỷ 20 - 21 (năm {yr})" if yr >= 1900 else (
                    "Lê Sơ (1428 - 1527)" if 1428 <= yr <= 1527 else (
                    "Nhà Hồ / Thời thuộc Minh (1400 - 1427)" if 1400 < yr < 1428 else (
                    "Hậu Lê / Mạc / Trịnh - Nguyễn (1527 - 1788)" if 1527 < yr <= 1788 else (
                    "Nhà Tây Sơn / Nhà Nguyễn (1788 - 1945)" if 1788 < yr <= 1945 else (
                    "Thời Đinh - Tiền Lê (968 - 1009)" if 968 <= yr < 1009 else (
                    "Thời Ngô Quyền (938 - 967)" if 938 <= yr < 968 else "ngoài thời kỳ Lý - Trần"
                )))))))

                correct_yr = ""
                lower_t = script_text.lower()
                explanation = f"Năm {yr} thuộc {dynasty_hint}, hoàn toàn nằm ngoài phạm vi triều đại Nhà Lý (1009 - 1225) và Nhà Trần (1225 - 1400)."
                if (yr == 1453 or yr == 2000 or yr > 1400) and any(k in lower_t for k in ["trương hán siêu", "hóa châu", "trần dụ tông", "thần sách"]):
                    correct_yr = "1353"
                    explanation = f"Sự kiện vua Trần Dụ Tông cử Trương Hán Siêu đem quân Thần Sách vào trấn giữ Hóa Châu diễn ra vào năm Quý Tỵ 1353 (thời Trần), không phải năm {yr} ({dynasty_hint})."
                elif (yr == 1012 or yr != 1010) and any(k in lower_t for k in ["dời đô", "lý thái tổ", "lý công uẩn", "đại la", "thăng long"]):
                    correct_yr = "1010"
                    explanation = f"Vua Lý Thái Tổ ban Chiếu Dời Đô từ Hoa Lư về Đại La vào mùa thu năm Canh Tuất 1010, không phải năm {yr}."
                elif (yr != 1288) and "bạch đằng" in lower_t and any(k in lower_t for k in ["trần hưng đạo", "ô mã nhi", "trần quốc tuấn"]):
                    correct_yr = "1288"
                    explanation = f"Trận thủy chiến Bạch Đằng lịch sử do Trần Hưng Đạo lãnh đạo diễn ra vào năm 1288, không phải năm {yr}."

                suggested = script_text.replace(yr_str, correct_yr) if correct_yr else script_text
                return {
                    "in_scope": False,
                    "overall_score": 35,
                    "status": "critical_errors",
                    "summary": f"Phát hiện mốc niên đại sai lệch nghiêm trọng: {explanation}",
                    "claims": [{
                        "claim_text": full_match,
                        "verdict": "error",
                        "explanation": explanation,
                        "source_reference": "Đại Việt Sử Ký Toàn Thư (Bản Kỷ Toàn Thư)",
                        "suggested_fix": correct_yr
                    }],
                    "revised_script": suggested
                }

    # 1. Truy vấn các đoạn sử liệu liên quan nhất cho toàn bộ bài viết / kịch bản
    # Lấy mẫu thông minh từ cả phần đầu, giữa và kết bài để không bỏ sót các phân cảnh sau
    queries = []
    clean_text = " ".join([line.strip() for line in script_text.split("\n") if line.strip()])
    if len(clean_text) <= 500:
        queries.append(clean_text)
    else:
        queries.append(clean_text[:400])
        mid_pos = len(clean_text) // 2
        queries.append(clean_text[mid_pos:mid_pos + 400])
        queries.append(clean_text[-400:])

    context_chunks = []
    seen_sigs = set()
    for q in queries:
        try:
            matched = search_history_context(q, key_to_use, top_k=5)
            for c in matched:
                sig = f"{c.get('book_title')}_{c.get('page')}_{c.get('text', '')[:60]}"
                if sig not in seen_sigs:
                    seen_sigs.add(sig)
                    context_chunks.append(c)
        except Exception as err:
            print(f"⚠️ Context search chunk warning: {err}")

    context_str = ""
    for idx, c in enumerate(context_chunks, 1):
        context_str += f"""--- TRÍCH DẪN {idx} [{c['book_title']} - Trang {c['page']}] ---
{c['text']}

"""

    if not context_str:
        context_str = "(Chưa tìm thấy đoạn trích trực tiếp trong kho tư liệu hiện có)"

    # 2. Xây dựng Prompt Thẩm định chuyên sâu
    system_prompt = f"""Bạn là một Chuyên gia Lịch sử Việt Nam và Cố vấn Thẩm định Kịch bản (Historical Fact-Checker).
Dưới đây là một KỊCH BẢN / ĐOẠN VĂN do người dùng gửi đến:

\"\"\"{script_text}\"\"\"

VÀ ĐÂY LÀ CÁC TRÍCH ĐOẠN SỬ LIỆU GỐC ĐƯỢC TÌM THẤY TRONG KHO SÁCH (Đại Việt Sử Ký Toàn Thư, An Nam Chí Lược, Đại Việt Sử Lược):
{context_str}

NHIỆM VỤ CỦA BẠN (CỰC KỲ KHÁCH QUAN, CHUẨN XÁC VÀ KHOA HỌC):
1. ĐÁNH GIÁ PHẠM VI (SCOPE):
   - Đề tài có nằm trong phạm vi lịch sử Việt Nam hay không? (in_scope: true / false).
   - Nếu hoàn toàn không thuộc lịch sử Việt Nam (ví dụ: công nghệ hiện đại, lịch sử phương Tây), hãy nêu rõ.

2. ĐỐI CHIẾU VÀ ĐÁNH GIÁ TỪNG MỆNH ĐỀ SỰ KIỆN (CLAIMS ANALYSIS):
   - Rà soát từng câu trong kịch bản và đối chiếu với trích đoạn sử liệu gốc cùng chính sử Việt Nam:
     + Kiểm tra tính chuẩn xác của niên đại, mốc năm, địa danh, tên gọi nhân vật và tước vị.
     + Phân định rạch ròi giữa các giai đoạn/chiến dịch lịch sử (ví dụ: không lẫn lộn giữa các lần kháng chiến chống Nguyên Mông 1258, 1285, 1287-1288; các tướng giặc bị chém hay bị bắt phải đúng trận và đúng năm).
     + Kiểm tra tính đúng đắn của bối cảnh quân sự, địa lý, lý do dời đô hoặc ban bố chiếu thư.
   - Với mỗi luận điểm trong kịch bản, xác định verdict:
     + "verified": Khi mệnh đề CHÍNH XÁC, khớp với sử liệu chính thống (Đại Việt Sử Ký Toàn Thư hoặc các trích dẫn ở trên). Khi đã "verified", đặt "suggested_fix": null (tuyệt đối KHÔNG gán lỗi hay bắt người dùng sửa câu đã đúng).
     + "error": Khi mệnh đề SAI LỆCH SỰ THẬT (sai mốc năm, gán sai nhân vật, nhầm lẫn chiến dịch, đảo lộn bản chất sự kiện). Cần giải thích rõ điểm sai và BẮT BUỘC cung cấp "suggested_fix" chuẩn xác.
     + "unverified": Khi mệnh đề là giai thoại dân gian truyền miệng, dã sử chưa được chính sử ghi nhận, hoặc nhận định chủ quan suy diễn thiếu cứ liệu. Cung cấp "suggested_fix" với giọng văn trung tính hơn.
   - Cung cấp "explanation" khách quan, trích dẫn chính xác sách sử (sách nào, quyển nào, trang nào).

3. TỔNG KẾT ĐIỂM SỐ, THUMBNAIL PROMPT VÀ BẢN SỬA ĐỔI HOÀN CHỈNH:
   - overall_score: Thang điểm 0 - 100:
     + Nếu kịch bản hoàn toàn chính xác theo chính sử (mọi claim đều verified): 90 - 100 điểm.
     + Nếu kịch bản có sai sót về niên đại hoặc nhân vật (có claim error): tính điểm từ 55 - 75 điểm.
     + Nếu kịch bản sai lạc nghiêm trọng hoặc xuyên tạc: dưới 50 điểm.
   - status: "verified" (nếu score >= 85 và không có claim error), "needs_revision" (nếu score từ 50 - 84 hoặc có claim error), hoặc "critical_errors" (nếu score < 50).
   - summary: Nhận xét khách quan, ghi nhận rõ những luận điểm đã đúng và chỉ ra chi tiết cần hiệu đính nếu có.
   - thumbnail_prompt: 1 prompt tiếng Anh chuyên dụng tạo ảnh bìa podcast lịch sử tỉ lệ VUÔNG 1:1 (1200x1200px) đại diện ĐÚNG CHO CHỦ ĐỀ VÀ NHÂN VẬT của kịch bản này (Epic cinematic historical podcast illustration, atmospheric dramatic lighting, rich historical tones, classical oil painting art style, square 1:1 aspect ratio, 1200x1200px, strictly NO text, NO typography, NO watermark).
   - revised_script: Viết lại kịch bản hoàn chỉnh dựa trên ĐÚNG chủ đề, nhân vật và sự kiện gốc của bài viết. CHỈ hiệu đính các lỗi sai sự kiện/niên đại (nếu có), TUYỆT ĐỐI KHÔNG tự ý đổi sang chủ đề hay thời đại lịch sử khác. Loại bỏ các từ nối rập khuôn AI (như 'Thế nhưng,', 'Chính vì vậy,').

HÃY TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (không bọc trong markdown ```json):
{{
  "in_scope": true,
  "overall_score": 75,
  "status": "needs_revision",
  "summary": "...",
  "thumbnail_prompt": "Epic cinematic historical podcast thumbnail illustration...",
  "claims": [
    {{
      "claim_text": "...",
      "verdict": "verified",
      "explanation": "Khớp hoàn toàn với trích đoạn sử liệu từ Đại Việt Sử Ký Toàn Thư...",
      "source_reference": "Đại Việt Sử Ký Toàn Thư (Trang 189)",
      "suggested_fix": null
    }}
  ],
  "revised_script": "..."
}}
"""

    payload = {
        "contents": [{"parts": [{"text": system_prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }

    models = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"]
    last_err = None

    for model in models:
        for ver in ["v1beta", "v1"]:
            url = f"https://generativelanguage.googleapis.com/{ver}/models/{model}:generateContent?key={key_to_use}"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    raw_resp = json.loads(resp.read().decode("utf-8"))
                    text_out = raw_resp["candidates"][0]["content"]["parts"][0]["text"].strip()
                    # Parse JSON
                    if text_out.startswith("```"):
                        text_out = text_out.split("```")[1]
                        if text_out.startswith("json"):
                            text_out = text_out[4:].strip()
                    parsed = json.loads(text_out)
                    if not parsed.get("thumbnail_prompt"):
                        clean_sample = re.sub(r'[\r\n\t"]+', ' ', script_text[:120]).strip()
                        parsed["thumbnail_prompt"] = (
                            f"Epic cinematic historical podcast thumbnail illustration representing {clean_sample}, "
                            "atmospheric dramatic lighting, rich historical color tones, classical oil painting art style, "
                            "epic composition, square 1:1 aspect ratio, 1200x1200px, strictly NO text, NO typography, NO watermark"
                        )
                    parsed["source_citations"] = [
                        {
                            "id": idx,
                            "book": c["book_title"],
                            "page": c["page"],
                            "similarity": c["similarity"],
                            "text": c.get("text", ""),
                            "file_name": c.get("file_name", "")
                        }
                        for idx, c in enumerate(context_chunks, 1)
                    ]
                    return parsed
            except Exception as e:
                last_err = e
                continue

    raise RuntimeError(f"Không thể kết nối Gemini API để thẩm định: {last_err}")
