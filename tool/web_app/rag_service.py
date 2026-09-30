"""
rag_service.py — Dịch vụ Tra cứu Sử liệu (RAG) & Thẩm định Kịch bản (Fact-Checking)
Tích hợp cho tool (Whiteboard Studio)
"""

import os
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
    key_to_use = (api_key or SYSTEM_KEY).strip()
    if not key_to_use:
        raise ValueError("Chưa có Gemini API Key để thực hiện truy vấn embedding!")

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

        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data.get("embedding", {}).get("values", [])
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                break  # try next model
            except Exception:
                if attempt < 2:
                    time.sleep(1.0)
                    continue
                break

    raise RuntimeError("Không thể tạo vector embedding với các mô hình Gemini hiện có.")


def search_history_context(query: str, api_key: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Tìm kiếm các đoạn tư liệu lịch sử liên quan nhất trong ChromaDB
    """
    try:
        col = get_chroma_collection()
        total_chunks = col.count()
        if total_chunks == 0:
            return []

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
                # Cosine distance: 0 = identical, 1 = orthogonal
                similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                matches.append({
                    "text": d,
                    "book_title": m.get("book_title", "Sử liệu Việt Nam"),
                    "page": m.get("page_number", 0),
                    "file_name": m.get("file_name", ""),
                    "similarity": round(similarity, 4),
                    "distance": round(dist, 4)
                })

        return matches
    except Exception as e:
        print(f"⚠️ Lỗi truy vấn Vector DB: {e}")
        return []


def verify_script_with_gemini(script_text: str, api_key: str) -> Dict[str, Any]:
    """
    Thẩm định kịch bản người dùng cung cấp so với các tài liệu sử học trong doc/:
    - Kiểm tra phạm vi (scope)
    - Đối chiếu các luận điểm lịch sử với tư liệu gốc
    - Đưa ra điểm tin cậy, chi tiết đúng/sai, trích dẫn sách và bản sửa đổi chuẩn xác
    """
    key_to_use = (api_key or SYSTEM_KEY).strip()
    if not key_to_use:
        raise ValueError("Vui lòng cung cấp Gemini API Key để thực hiện thẩm định!")

    # 1. Truy vấn các đoạn sử liệu liên quan nhất cho toàn bộ bài viết / kịch bản
    # Cắt ngắn để tìm kiếm theo bối cảnh chung
    summary_query = script_text[:500].replace("\n", " ")
    context_chunks = search_history_context(summary_query, key_to_use, top_k=7)

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

NHIỆM VỤ CỦA BẠN (CỰC KỲ NGHIÊM NGẶT VÀ CỤ THỂ):
1. ĐÁNH GIÁ PHẠM VI (SCOPE):
   - Đề tài có nằm trong phạm vi lịch sử Việt Nam hay không? (in_scope: true / false).
   - Nếu hoàn toàn không thuộc lịch sử Việt Nam (ví dụ: công nghệ hiện đại, lịch sử phương Tây), hãy nêu rõ.

2. ĐỐI CHIẾU VÀ BẮT LỖI TỪNG MỆNH ĐỀ SỰ KIỆN (CLAIMS ANALYSIS):
   - Phân tích kỹ từng vế câu, phát hiện cả những ngộ nhận lịch sử tinh vi, nhầm lẫn bản chất sự kiện hoặc đảo lộn địa lý - quân sự:
     + Chú ý đặc tính địa lý - quân sự: Ví dụ nếu câu ghi Hoa Lư "thiếu hiểm địa" hoặc "không có thế hiểm" thì ĐÂY LÀ LỖI SAI (error). Thực tế Hoa Lư núi non hiểm trở bao bọc rất tốt để phòng thủ thời loạn lạc; lý do vua Lý Thái Tổ dời đô theo Chiếu dời đô là vì hai nhà Đinh - Lê đóng mãi ở đây khiến "thế đại không dài, vận số ngắn ngủi, trăm họ hao tổn"; vua muốn "mưu nghiệp lớn, lập kế muôn đời" nên chọn Đại La vì đất rộng bằng phẳng, thế đất cao ráo sáng sủa, dân không khổ vì ngập lụt trũng tối.
     + Chú ý nguồn gốc tên gọi và điển tích: Ví dụ tên gọi Thăng Long gắn liền trực tiếp với sự kiện mùa thu tháng 7 năm 1010 có rồng vàng bay lên ở thuyền ngự khi cập bến Đại La, chứ không chỉ đơn thuần bắt nguồn trừu tượng từ thế đất.
     + Chú ý các mốc năm then chốt (năm Canh Tuất 1010) và văn kiện lịch sử (Chiếu dời đô / Thiên đô chiếu).
   - Với mỗi luận điểm, đánh giá verdict:
     + "verified" (Chính xác, khớp hoàn toàn với sử liệu gốc)
     + "error" (Sai lệch sự thật, nhầm lẫn mốc năm, gán sai tính chất quân sự/địa lý, hiểu ngược bản chất)
     + "unverified" (Dã sử, thiếu dữ kiện xác thực, hoặc diễn giải chủ quan thiếu căn cứ)
   - Cung cấp giải thích chi tiết, khách quan, trích dẫn chính xác sách sử (sách nào, bối cảnh nào).
   - BẮT BUỘC cung cấp "suggested_fix" chuẩn xác cho mọi luận điểm bị đánh giá "error" hoặc "unverified".

3. TỔNG KẾT ĐIỂM SỐ VÀ BẢN SỬA ĐỔI HOÀN HẢO:
   - overall_score: Thang điểm 0 - 100. Trừ điểm nghiêm khắc nếu có hiểu sai về địa lý/quân sự hoặc thiếu dữ kiện cốt lõi (ví dụ: nhầm lẫn thế hiểm Hoa Lư chỉ được tối đa 65-75 điểm).
   - status: "verified" (nếu score >= 85), "needs_revision" (nếu score từ 50 - 84), hoặc "critical_errors" (nếu score < 50).
   - summary: Nhận xét thẳng thắn, sắc bén, chỉ rõ điểm được và điểm sai lệch/thiếu sót của kịch bản.
   - revised_script: Viết lại kịch bản hoàn chỉnh, sửa sạch lỗi sai, đưa vào mốc năm 1010, Chiếu dời đô, thế đất Đại La, sự tích rồng vàng bay lên ở thuyền ngự, và loại bỏ hoàn toàn các từ nối rập khuôn AI.

HÃY TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (không bọc trong markdown ```json):
{{
  "in_scope": true,
  "overall_score": 70,
  "status": "needs_revision",
  "summary": "...",
  "claims": [
    {{
      "claim_text": "...",
      "verdict": "error",
      "explanation": "...",
      "source_reference": "Đại Việt Sử Ký Toàn Thư - Bản Kỷ - Quyển II (Trang 80-81)",
      "suggested_fix": "..."
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
