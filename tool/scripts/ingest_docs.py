#!/usr/bin/env python3
"""
ingest_docs.py — Script trích xuất văn bản, làm sạch và embedding sách lịch sử vào ChromaDB
Dành riêng cho Admin / Hệ thống để nạp kho tri thức từ thư mục doc/

Sử dụng:
    python scripts/ingest_docs.py [--sample-pages 5] [--batch-size 40] [--force]
"""

import os
import re
import sys
import time
import json
import glob
import argparse
import urllib.request
import urllib.error
from pathlib import Path

# Thử load .env
try:
    from dotenv import load_dotenv
    # Tìm file .env ở thư mục hiện tại hoặc thư mục cha
    env_paths = [
        Path(__file__).resolve().parent.parent / ".env",
        Path.cwd() / ".env",
        Path.cwd().parent / ".env"
    ]
    for p in env_paths:
        if p.exists():
            load_dotenv(p)
            break
except ImportError:
    pass

import pypdf
import chromadb


# ==============================================================================
# 1. HÀM CHUẨN HÓA VÀ LÀM SẠCH VĂN BẢN TIẾNG VIỆT
# ==============================================================================
def clean_vietnamese_text(text: str) -> str:
    """
    Sửa các lỗi font chữ PDF thường gặp trong sách dịch tiếng Việt:
    - Ký tự nguyên âm và dấu thanh bị tách rời bởi khoảng trắng: "c ủa", "th ứ", "L ược", "ngh ĩa"
    - Xóa các ký tự điều khiển, khoảng trắng dư thừa
    """
    if not text:
        return ""

    # Gộp các nguyên âm/dấu thanh bị tách rời
    # Ví dụ: "L ược" -> "Lược", "c ủa" -> "của", "th ời" -> "thời"
    pattern1 = r'([a-zA-ZÀ-ỹ])\s+([àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])'
    for _ in range(3):  # lặp lại để gộp các từ bị tách nhiều âm tiết
        text = re.sub(pattern1, r'\1\2', text, flags=re.IGNORECASE)

    # Gộp nguyên âm ghép: "u ơ", "i ê", "u y"
    pattern2 = r'([a-zA-Z])\s+([a-zA-Z])\b'
    # Không gộp bừa bãi mọi từ đơn, chỉ xử lý dấu câu và dòng
    
    # Xóa dòng header/footer lặp lại nhiều lần
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line_str = line.strip()
        # Bỏ dòng số trang đơn thuần: "12", "Page 15"
        if re.match(r'^\d{1,4}$', line_str) or re.match(r'^Trang\s+\d+$', line_str, re.IGNORECASE):
            continue
        # Bỏ dòng quá ngắn vô nghĩa
        if len(line_str) == 0:
            continue
        cleaned_lines.append(line_str)

    text = " ".join(cleaned_lines)
    # Rút gọn khoảng trắng liên tiếp
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """
    Chia văn bản thành các chunk nhỏ có gối đầu (overlap)
    Ưu tiên cắt ở dấu chấm câu (. ! ?) để giữ nguyên ý nghĩa câu.
    """
    if len(text) <= chunk_size:
        return [text] if len(text) >= 50 else []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        if end < text_len:
            # Tìm điểm ngắt câu gần nhất trong khoảng [end - 150, end]
            punct_pos = max(
                text.rfind('. ', start + chunk_size - 200, end),
                text.rfind('; ', start + chunk_size - 200, end),
                text.rfind('\n', start + chunk_size - 200, end)
            )
            if punct_pos > start + 300:
                end = punct_pos + 1

        chunk = text[start:end].strip()
        if len(chunk) >= 50:  # Bỏ qua chunk quá ngắn
            chunks.append(chunk)

        if end >= text_len:
            break
        start = end - overlap

    return chunks


# ==============================================================================
# 2. HÀM EMBEDDING VỚI GOOGLE GEMINI API (BATCH EMBEDDING)
# ==============================================================================
def get_gemini_embeddings_batch(texts: list[str], api_key: str, model: str = None, output_dim: int = 768) -> list[list[float]]:
    """
    Gọi Gemini batchEmbedContents API để embed nhiều đoạn văn bản cùng lúc.
    Tiết kiệm thời gian gấp 50 lần so với gọi từng đoạn đơn lẻ.
    """
    model_to_use = model or os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_to_use}:batchEmbedContents?key={api_key}"
    
    requests_payload = []
    for t in texts:
        req_item = {
            "model": f"models/{model}",
            "content": {"parts": [{"text": t[:2048]}]}
        }
        if output_dim:
            req_item["outputDimensionality"] = output_dim
        requests_payload.append(req_item)

    payload = {"requests": requests_payload}
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    MAX_RETRIES = 15
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                embeddings = [e["values"] for e in result.get("embeddings", [])]
                return embeddings
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            if e.code == 429:
                wait_time = 20.0 if attempt < 2 else 40.0
                print(f"   ⏳ [Rate limit 429] Chờ {wait_time:.1f}s trước khi thử lại...", end="", flush=True)
                time.sleep(wait_time)
                continue
            else:
                raise RuntimeError(f"Gemini Embedding API Error ({e.code}): {err_body}")
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(3)
                continue
            raise RuntimeError(f"Lỗi kết nối Gemini Embedding: {e}")

    raise RuntimeError("Vượt quá số lần retry Gemini Embedding API.")


# ==============================================================================
# 3. TIẾN TRÌNH QUÉT VÀ INGESTION CHÍNH
# ==============================================================================
def process_book_pdf(pdf_path: str, max_pages: int = None) -> list[dict]:
    """
    Đọc PDF và trích xuất danh sách các chunks kèm metadata
    """
    book_filename = os.path.basename(pdf_path)
    book_title = book_filename.replace(".pdf", "").replace("-", " ").replace("_", " ").title()
    
    # Đặt tên chuẩn thân thiện cho các sách chính
    if "dai-viet-su-ky-toan-thu" in book_filename.lower():
        book_title = "Đại Việt Sử Ký Toàn Thư"
    elif "annam-chiluoc" in book_filename.lower():
        book_title = "An Nam Chí Lược"
    elif "dai-viet-su-luoc" in book_filename.lower():
        book_title = "Đại Việt Sử Lược"
    elif "dai_cuong_lich_su" in book_filename.lower():
        book_title = "Đại Cương Lịch Sử Việt Nam"

    print(f"\n📖 Đang đọc: {book_title} ({book_filename})")
    try:
        reader = pypdf.PdfReader(pdf_path)
    except Exception as e:
        print(f"❌ Không thể đọc file PDF {pdf_path}: {e}")
        return []

    total_pages = len(reader.pages)
    pages_to_process = min(total_pages, max_pages) if max_pages else total_pages
    print(f"   Tổng số trang: {total_pages} (sẽ xử lý: {pages_to_process} trang)")

    chunks_data = []
    total_extracted_chars = 0

    for page_idx in range(pages_to_process):
        try:
            page = reader.pages[page_idx]
            raw_text = page.extract_text() or ""
            clean_t = clean_vietnamese_text(raw_text)
            
            if not clean_t:
                continue

            total_extracted_chars += len(clean_t)
            page_chunks = chunk_text(clean_t, chunk_size=1000, overlap=150)
            
            for c_idx, c_text in enumerate(page_chunks):
                chunk_id = f"{os.path.splitext(book_filename)[0]}_p{page_idx+1}_c{c_idx+1}"
                chunks_data.append({
                    "id": chunk_id,
                    "text": c_text,
                    "metadata": {
                        "book_title": book_title,
                        "file_name": book_filename,
                        "page_number": page_idx + 1,
                        "chunk_index": c_idx + 1
                    }
                })
        except Exception as e:
            print(f"   ⚠️ Lỗi ở trang {page_idx+1}: {e}")

    print(f"   ✅ Đã trích xuất {len(chunks_data)} chunks ({total_extracted_chars:,} ký tự)")
    return chunks_data


def main():
    parser = argparse.ArgumentParser(description="Ingest Vietnamese History PDFs into ChromaDB with Gemini Embeddings")
    parser.add_argument("--doc-dir", default=os.getenv("DOC_DIR", "../doc"), help="Thư mục chứa sách PDF")
    parser.add_argument("--db-dir", default=os.getenv("CHROMA_DB_DIR", "./data/chroma_db"), help="Thư mục ChromaDB")
    parser.add_argument("--batch-size", type=int, default=40, help="Kích thước batch gọi Gemini embedding")
    parser.add_argument("--sample-pages", type=int, default=None, help="Số trang đọc mẫu mỗi sách (để test nhanh)")
    parser.add_argument("--force", action="store_true", help="Xóa bộ nhớ cũ và tạo lại từ đầu")
    args = parser.parse_args()

    api_key = os.getenv("SYSTEM_GEMINI_API_KEY", "").strip()
    if not api_key:
        print("❌ LỖI: Chưa cấu hình SYSTEM_GEMINI_API_KEY trong file .env!")
        print("Vui lòng mở file tool/.env và điền key vào.")
        sys.exit(1)

    doc_dir_path = Path(args.doc_dir).resolve()
    db_dir_path = Path(args.db_dir).resolve()
    db_dir_path.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("🚀 TIẾN TRÌNH EMBEDDING TÀI LIỆU LỊCH SỬ VIỆT NAM (ADMIN)")
    print("=" * 70)
    print(f"📁 Thư mục sách: {doc_dir_path}")
    print(f"💾 Thư mục ChromaDB: {db_dir_path}")
    print(f"🤖 Model Embedding: {os.getenv('EMBEDDING_MODEL', 'gemini-embedding-001')}")
    print(f"🔑 Gemini Key: {api_key[:6]}...{api_key[-4:]}")
    if args.sample_pages:
        print(f"🧪 Chế độ TEST MẪU: Chỉ xử lý tối đa {args.sample_pages} trang đầu mỗi sách.")
    print("-" * 70)

    # Khởi tạo ChromaDB client
    chroma_client = chromadb.PersistentClient(path=str(db_dir_path))
    collection_name = "vietnam_history_docs"

    if args.force:
        try:
            chroma_client.delete_collection(collection_name)
            print(f"🗑️ Đã xóa collection cũ: {collection_name}")
        except Exception:
            pass

    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"description": "Kho tri thức sử Việt từ thư mục doc"}
    )

    pdf_files = sorted(glob.glob(str(doc_dir_path / "*.pdf")))
    if not pdf_files:
        print(f"❌ Không tìm thấy file PDF nào trong: {doc_dir_path}")
        sys.exit(1)

    all_chunks = []
    for pdf_f in pdf_files:
        # Bỏ qua file scan tiff nếu chưa có text layer
        if "dai_cuong_lich_su_viet_nam_tap_2" in os.path.basename(pdf_f):
            print(f"\n⚠️ Bỏ qua '{os.path.basename(pdf_f)}' (File dạng scan ảnh, sẽ xử lý OCR riêng).")
            continue
        chunks = process_book_pdf(pdf_f, max_pages=args.sample_pages)
        all_chunks.extend(chunks)

    if not all_chunks:
        print("❌ Không có đoạn văn bản nào để embedding!")
        sys.exit(1)

    # Kiểm tra các chunk đã có sẵn trong DB để tiếp tục (Resume capability)
    existing_ids = set()
    try:
        existing_result = collection.get(include=[])
        if existing_result and "ids" in existing_result:
            existing_ids = set(existing_result["ids"])
            if existing_ids:
                print(f"🔄 Tìm thấy {len(existing_ids):,} chunks đã có trong ChromaDB (sẽ tự động bỏ qua).")
    except Exception:
        pass

    chunks_to_embed = [c for c in all_chunks if c["id"] not in existing_ids]

    if not chunks_to_embed:
        print("🎉 Toàn bộ các chunk đã được nạp đầy đủ vào ChromaDB từ trước!")
        print(f"📚 Tổng số chunks hiện có trong ChromaDB: {collection.count()}")
        return

    print(f"\n📊 TỔNG CỘNG: {len(all_chunks)} chunks (Cần nạp mới: {len(chunks_to_embed)} chunks).")
    print("⚡ Bắt đầu tiến trình Embedding qua Gemini API (theo batch)...")

    batch_size = max(10, min(80, args.batch_size))
    total_batches = (len(chunks_to_embed) + batch_size - 1) // batch_size
    start_time = time.time()

    for b_idx in range(total_batches):
        b_start = b_idx * batch_size
        b_end = min(b_start + batch_size, len(chunks_to_embed))
        batch = chunks_to_embed[b_start:b_end]

        batch_texts = [item["text"] for item in batch]
        batch_ids = [item["id"] for item in batch]
        batch_metadatas = [item["metadata"] for item in batch]

        print(f"   [Batch {b_idx+1}/{total_batches}] Đang embed {len(batch)} chunks ({b_start+1} - {b_end})...", end="", flush=True)

        try:
            embeddings = get_gemini_embeddings_batch(
                batch_texts, 
                api_key=api_key,
                model=os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")
            )

            # Lưu vào ChromaDB
            collection.upsert(
                ids=batch_ids,
                documents=batch_texts,
                embeddings=embeddings,
                metadatas=batch_metadatas
            )
            print(" ✅ Xong")
        except Exception as e:
            print(f" ❌ Lỗi: {e}")

        # Nghỉ 4.2 giây để tuân thủ hạn ngạch 15 RPM (Requests Per Minute) của gói Free Tier
        time.sleep(4.2)

    elapsed = time.time() - start_time
    total_count = collection.count()
    print("\n" + "=" * 70)
    print(f"🎉 HOÀN TẤT THÀNH CÔNG trong {elapsed:.1f} giây!")
    print(f"📚 Tổng số chunks hiện có trong ChromaDB: {total_count}")
    print(f"💾 Dữ liệu đã lưu tại: {db_dir_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
