# PRM Backend Service

> **Dự án**: PRM Modular Monolith Backend  
> **Công nghệ**: Java 21 (LTS), Spring Boot 3.3.4, PostgreSQL 17, Spring Data JPA, Flyway, JJWT, SpringDoc OpenAPI (Swagger).

---

## 📌 1. Giới thiệu tổng quan

Hệ thống Backend được xây dựng theo kiến trúc **Modular Monolith** gồm 8 domain nghiệp vụ chính:
1. `identity`: Xác thực (JWT, BCrypt), phân quyền (Roles: VIEWER, CREATOR, NARRATOR, ADMIN), User KYC, Refresh Token.
2. `channel`: Kênh nội dung, bài đăng, audio/video artifacts, bản chép lời (transcripts), AI filter & moderation.
3. `social`: Bình luận đa cấp (comments), tương tác (reactions).
4. `membership`: Gói thành viên kênh, thanh toán & phân chia doanh thu creator.
5. `wallet`: Ví số dư, giao dịch nạp/rút, liên kết tài khoản ngân hàng.
6. `narrator`: Hồ sơ thuyết minh viên (voice talent), audio demo, giá cơ bản.
7. `contract`: Yêu cầu thuê thuyết minh (hire request), hợp đồng (contract), ký quỹ (escrow), khiếu nại (dispute).
8. `common`: Nhật ký hệ thống (audit logs), cấu hình hệ thống (system configs), chuẩn hóa response & exceptions.

---

## ⚙️ 2. Yêu cầu môi trường

- **Java**: JDK 21 (LTS).
- **Maven**: 3.9+ (hoặc dùng Maven tích hợp trong IDE).
- **Docker & Docker Compose**: Để chạy PostgreSQL.

---

## 🚀 3. Hướng dẫn khởi chạy lần đầu cho thành viên mới

Chỉ cần **2 bước đơn giản**, không cần chạy lệnh SQL thủ công (Flyway tự động thực hiện):

### Bước 1: Khởi động cơ sở dữ liệu PostgreSQL
Di chuyển vào thư mục `backend` và chạy Docker Compose:
```bash
cd backend
docker compose up -d
```
> **Ghi chú**: Container `prm-postgres` sẽ khởi chạy trên cổng `5432` với database `prm_db`, user `postgres`, password `postgres`.
> (Tùy chọn: bạn có thể copy file `.env.sample` thành `.env` nếu muốn đổi thông số kết nối).

### Bước 2: Khởi chạy ứng dụng Spring Boot
```bash
mvn spring-boot:run
```
*(hoặc nhấn **Run** file `PrmBackendApplication.java` từ IntelliJ IDEA / VS Code / Eclipse)*

#### ✨ Cơ chế tự động của Flyway:
Ngay khi ứng dụng khởi chạy lần đầu:
- **`V1__init_schema.sql`**: Tự động tạo toàn bộ **27 bảng** và các chỉ mục (indexes).
- **`V2__seed_initial_roles.sql`**: Tự động nạp sẵn 4 Role chuẩn: `VIEWER`, `CREATOR`, `NARRATOR`, `ADMIN`.
- **Hibernate**: Chế độ `ddl-auto: validate` sẽ kiểm tra tính toàn vẹn giữa Entity và Database.

---

## 🔌 4. Tài liệu API & Swagger UI

Sau khi server khởi động thành công trên cổng `8080`:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## 🛡️ 5. Các API Xác thực cơ bản

- `POST /api/v1/auth/register`: Đăng ký tài khoản (mặc định role VIEWER, có confirmPassword).
- `POST /api/v1/auth/login`: Đăng nhập, nhận Access Token & Refresh Token.
- `POST /api/v1/auth/refresh-token`: Làm mới Access Token khi hết hạn.
