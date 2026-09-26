# Backend Service

> **Dự án**: PRM - Backend API Service  
> **Mục tiêu**: Cung cấp hệ thống RESTful API, xác thực và xử lý logic nghiệp vụ cho ứng dụng Mobile và Web.

---

## 📌 1. Giới thiệu tổng quan

Thư mục `backend` chứa toàn bộ mã nguồn phía máy chủ, chịu trách nhiệm:
- Xử lý xác thực & phân quyền người dùng (Authentication & Authorization - JWT / OAuth).
- Cung cấp các API Endpoints cho Web và Mobile.
- Kết nối, quản lý và truy vấn cơ sở dữ liệu (PostgreSQL / MySQL / MongoDB).
- Quản lý logic nghiệp vụ, tích hợp dịch vụ bên thứ ba (Storage, Payment, Notification).

---

## 🏗️ 2. Cấu trúc thư mục đề xuất (Clean / Layered Architecture)

```text
backend/
├── src/
│   ├── config/             # Cấu hình hệ thống (Database, Environment, JWT, CORS)
│   ├── controllers/        # Tiếp nhận HTTP request, gọi service và trả về HTTP response
│   ├── middlewares/        # Middlewares (Xác thực JWT, Validate dữ liệu, Error handler)
│   ├── models/             # Schema / Entity định nghĩa dữ liệu (Prisma, TypeORM, Mongoose...)
│   ├── repositories/       # Tầng tương tác trực tiếp với Database
│   ├── routes/             # Định nghĩa danh sách các API routes theo module
│   ├── services/           # Xử lý logic nghiệp vụ chính (Business Logic)
│   ├── utils/              # Các hàm bổ trợ (Formatters, Helpers, Logger)
│   └── app.ts / index.ts   # Điểm khởi chạy server
├── tests/                  # Unit test & Integration test
├── .env.example            # Mẫu biến môi trường
├── .gitignore
├── package.json / pom.xml  # Quản lý thư viện phụ thuộc
└── README.md
```

---

## ⚙️ 3. Cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- **Runtime**: Node.js (>= 18.x) / Java (>= 17) / Python (>= 3.10) / .NET (tùy công nghệ lựa chọn).
- **Cơ sở dữ liệu**: PostgreSQL / MySQL / MongoDB.
- **Package Manager**: `npm`, `yarn`, `pnpm` hoặc công cụ tương ứng.

### Các bước cài đặt (Ví dụ với Node.js/TypeScript)

1. **Di chuyển vào thư mục backend**:
   ```bash
   cd backend
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Cập nhật thông tin kết nối DB, JWT secret và cổng server (Port).

4. **Khởi chạy Database & Migration (nếu có)**:
   ```bash
   npm run db:migrate
   ```

5. **Khởi chạy ứng dụng**:
   - Chế độ phát triển (Development):
     ```bash
     npm run dev
     ```
   - Chế độ sản phẩm (Production):
     ```bash
     npm run build
     npm start
     ```

---

## 🔌 4. Quy ước API & Mã trạng thái HTTP

- **Base URL**: `http://localhost:<PORT>/api/v1`
- **Quy chuẩn mã HTTP**:
  - `200 OK`: Yêu cầu thành công.
  - `201 Created`: Tạo mới tài nguyên thành công.
  - `400 Bad Request`: Dữ liệu gửi lên không hợp lệ.
  - `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn.
  - `403 Forbidden`: Không có quyền truy cập tài nguyên.
  - `404 Not Found`: Không tìm thấy tài nguyên.
  - `500 Internal Server Error`: Lỗi phía máy chủ.

- **Định dạng phản hồi chuẩn (Standard Response)**:
  ```json
  {
    "success": true,
    "message": "Thông báo trạng thái",
    "data": {}
  }
  ```
