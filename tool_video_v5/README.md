# 🎨 Whiteboard AI Studio

> **Tự động tạo video hoạt họa bảng trắng chuyên nghiệp** — từ một tiêu đề ngắn hoặc kịch bản có sẵn, AI sẽ tự động lên kịch bản, gợi ý prompt tạo ảnh, lồng giọng đọc và xuất ra video MP4 hoàn chỉnh.

---

## 📋 Tính Năng

| Tính năng | Mô tả |
|---|---|
| 🤖 **AI Lên Kịch Bản** | Tự động tạo kịch bản chi tiết từ tiêu đề ngắn hoặc bài viết dài (Gemini API) |
| 📋 **Xem Trước & Duyệt** | Hiển thị toàn bộ lời thuyết minh để bạn chỉnh sửa trước khi tạo video |
| 🖼️ **Gợi Ý Prompt Ảnh** | Sinh prompt chuẩn doodle/sketch để dùng với Midjourney / DALL-E / Ideogram |
| 📤 **Tự Upload Ảnh** | Kéo thả ảnh vào từng cảnh, hỗ trợ drag & drop |
| 🎙️ **Giọng Đọc AI** | Edge-TTS (miễn phí) hoặc ElevenLabs (trả phí, giọng tự nhiên hơn) |
| ⏱️ **Chọn Thời Lượng** | 30s / 1 phút / 2 phút / 3 phút / 5 phút (tối đa 10 cảnh) |
| 🎬 **Hiệu Ứng Bảng Trắng** | Hoạt ảnh nét vẽ tay xuất hiện dần, đồng bộ với giọng đọc |
| 📝 **Phụ Đề SRT** | Tự động xuất file `.srt` chuẩn |

---

## ⚡ Cách Chạy Nhanh

### Bước 1: Mở Terminal, cd vào thư mục dự án

```bash
cd /Users/ttcenter/Desktop/projects/tool_video_v5
```

### Bước 2: Chạy server

```bash
cd web_app && ../.venv/bin/python server.py
```

### Bước 3: Mở trình duyệt

```
http://localhost:8000
```

> Server sẽ chạy cho đến khi bạn bấm `Ctrl+C` để dừng.

---

## 🛠️ Cài Đặt Lần Đầu

Nếu chưa có môi trường `.venv`, chạy lần lượt:

```bash
cd /Users/ttcenter/Desktop/projects/tool_video_v5

# 1. Tạo virtual environment
python3 -m venv .venv

# 2. Kích hoạt
source .venv/bin/activate

# 3. Cài dependencies
pip install fastapi uvicorn pillow opencv-python numpy edge-tts pydantic

# 4. Cài ffmpeg (nếu chưa có)
brew install ffmpeg
```

---

## 🔑 Cấu Hình API Keys (Tùy Chọn)

Vào **⚙️ Cài đặt API** trong giao diện web để cài:

| Key | Để làm gì | Lấy ở đâu |
|---|---|---|
| **Google Gemini API Key** | Tạo kịch bản thông minh, chi tiết thật sự | [Google AI Studio](https://aistudio.google.com/app/apikey) (miễn phí) |
| **ElevenLabs API Key** | Giọng đọc cực kỳ tự nhiên, chuyên nghiệp | [ElevenLabs](https://elevenlabs.io) (có gói free) |
| **Pollinations.ai Key** | Tự động tạo ảnh khi không upload tay | [Pollinations](https://pollinations.ai) |

> Không có key nào vẫn dùng được — hệ thống sẽ dùng **Gemini offline template** + **Edge-TTS miễn phí** làm mặc định.

---

## 🎬 Quy Trình Tạo Video

```
1. Nhập chủ đề hoặc dán kịch bản
         ↓
2. Click "✨ Tạo Kịch Bản & Gợi Ý Prompt"
         ↓
3. 📋 XEM TRƯỚC KỊCH BẢN — Chỉnh sửa từng câu nếu muốn
         ↓
4. Click "✅ Chấp nhận & Tiếp tục tạo ảnh"
         ↓
5. 🎨 STUDIO WORKBENCH — Hiện danh sách cảnh + prompt ảnh
   • Copy prompt → tạo ảnh tại Midjourney / DALL-E / Ideogram
   • Upload ảnh vào từng cảnh (hoặc để AI tự sinh nếu bỏ trống)
         ↓
6. Click "🎬 Bắt Đầu Ghép Hoạt Họa Bảng Trắng & Lồng Tiếng"
         ↓
7. ⏳ Chờ xử lý (2–10 phút tùy số cảnh)
         ↓
8. 🎉 Tải video MP4 + file SRT phụ đề
```

---

## 📁 Cấu Trúc Dự Án

```
tool_video_v5/
├── web_app/
│   ├── server.py              # Backend FastAPI — điều phối toàn bộ pipeline
│   ├── static/
│   │   └── index.html         # Giao diện người dùng (toàn bộ UI)
│   └── outputs/               # Video xuất ra (tạo tự động)
│       └── job_<id>/
│           ├── final_whiteboard_video.mp4
│           └── subtitles.srt
├── scripts/
│   ├── render_stream_whiteboard.py   # Render hiệu ứng nét vẽ bảng trắng
│   ├── add_subtitles.py              # Ghép phụ đề vào video
│   ├── export_srt.py                 # Xuất file SRT
│   └── stream_render.py             # Engine render streaming
├── assets/
│   ├── drawing-hand.png       # Ảnh bàn tay vẽ
│   └── preview.html           # Tool xem trước annotation
├── .venv/                     # Python virtual environment
└── README.md                  # File này
```

---

## 🔧 Xử Lý Sự Cố Thường Gặp

### ❌ Không vào được localhost:8000
→ Server chưa chạy. Thực hiện lại **Bước 2** ở trên.

### ❌ `ModuleNotFoundError`
→ Chưa cài dependencies. Chạy:
```bash
cd /Users/ttcenter/Desktop/projects/tool_video_v5
source .venv/bin/activate
pip install fastapi uvicorn pillow opencv-python numpy edge-tts pydantic
```

### ❌ `ffmpeg: command not found`
```bash
brew install ffmpeg
```

### ❌ Gemini API lỗi 404 (model not found)
→ Hệ thống tự động thử các model thay thế. Nếu tất cả đều lỗi, lấy key mới tại [Google AI Studio](https://aistudio.google.com/app/apikey).

### ❌ Gemini bị 429 (quá tải traffic)
→ Hệ thống tự động retry với thời gian chờ tăng dần (2s → 4s → 8s). Nếu vẫn lỗi, thử lại sau vài phút.

### ❌ ElevenLabs lỗi 401
→ API Key không đúng. Kiểm tra lại trong **⚙️ Cài đặt API**.

### ❌ Video không có tiếng
→ Đổi sang **Edge-TTS (miễn phí)** trong Cài đặt API.

---

## 📊 Thời Gian Xử Lý Ước Tính

| Thời lượng video | Số cảnh | Thời gian chờ |
|---|---|---|
| 30 giây | 1 cảnh | ~1 phút |
| 1 phút | 2 cảnh | ~2 phút |
| 2 phút | 4 cảnh | ~4 phút |
| 3 phút | 6 cảnh | ~6 phút |
| 5 phút | 10 cảnh | ~10 phút |

> ⚡ Thời gian phụ thuộc vào tốc độ internet và số lượng ảnh cần tự sinh.

---

## 🌐 Nơi Tạo Ảnh Đẹp (Miễn Phí)

Sau khi có prompt từ Studio, vào các trang này để tạo ảnh doodle 16:9:

| Trang | Đặc điểm |
|---|---|
| 🌐 [Bing Image Creator](https://www.bing.com/images/create) | DALL-E 3, miễn phí, chất lượng tốt |
| 🌐 [Ideogram AI](https://ideogram.ai) | Rất tốt cho doodle/sketch style |
| 🌐 [Leonardo.ai](https://leonardo.ai) | Nhiều style, 150 credits/ngày miễn phí |
| 🌐 [Midjourney](https://midjourney.com) | Chất lượng cao nhất, cần subscription |

---

## 📄 License

MIT License — xem file [LICENSE](LICENSE).
