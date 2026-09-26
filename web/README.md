# Web Application

> **Dự án**: PRM - Web Portal / Dashboard  
> **Mục tiêu**: Ứng dụng nền tảng Web phục vụ người dùng và hệ thống quản trị (Admin/Staff Portal).

---

## 📌 1. Giới thiệu tổng quan

Thư mục `web` chứa mã nguồn giao diện web (React / Next.js / Vite / Vue):
- Bảng điều khiển quản trị (Admin Dashboard): Quản lý người dùng, dữ liệu, thống kê và báo cáo.
- Giao diện người dùng web: Đăng nhập, quản lý thông tin, tương tác dữ liệu hệ thống.
- Giao tiếp với `backend` thông qua HTTP REST API / WebSocket.

---

## 💻 2. Cấu trúc thư mục đề xuất

```text
web/
├── public/                 # Các tệp tĩnh (Favicon, Logo, robots.txt...)
├── src/
│   ├── assets/             # Hình ảnh, icons, styles chung
│   ├── components/         # Các UI component dùng lại (Button, Table, Modal, Navbar, Sidebar)
│   ├── layouts/            # Khung bố cục (AdminLayout, AuthLayout, MainLayout)
│   ├── pages/ hoặc app/    # Các trang theo định tuyến (Routing)
│   ├── hooks/              # Custom React Hooks
│   ├── services/ / api/    # Hàm gọi API Backend (Axios Client, Interceptor)
│   ├── store/ / context/   # Quản lý trạng thái (Zustand, Redux Toolkit, Context API)
│   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript (Interface, Type)
│   ├── utils/              # Các hàm tiện ích (Format ngày tháng, tiền tệ, validation)
│   └── App.tsx / main.tsx  # Khởi tạo React App
├── .env.example            # Mẫu cấu hình môi trường
├── package.json
└── README.md
```

---

## ⚙️ 3. Cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản 18.x trở lên.
- **Package Manager**: `npm`, `yarn` hoặc `pnpm`.

### Hướng dẫn cài đặt & Khởi chạy

1. **Di chuyển vào thư mục web**:
   ```bash
   cd web
   ```

2. **Cài đặt thư viện phụ thuộc**:
   ```bash
   npm install
   # hoặc: pnpm install / yarn install
   ```

3. **Cấu hình môi trường**:
   Sao chép file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
   Cấu hình địa chỉ backend API (ví dụ: `VITE_API_BASE_URL=http://localhost:5000/api/v1`).

4. **Khởi chạy môi trường phát triển (Development)**:
   ```bash
   npm run dev
   ```
   Ứng dụng thường mở tại: `http://localhost:3000` hoặc `http://localhost:5173`.

5. **Đóng gói sản phẩm (Production Build)**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🎨 4. Quy ước phát triển & UI Guidelines

- **UI Framework đề xuất**: Tailwind CSS, Shadcn UI, Ant Design hoặc Material UI.
- **Quản lý Token**: Lưu `access_token` an toàn (HttpOnly Cookie hoặc LocalStorage/SessionStorage kết hợp refresh token).
- **Trải nghiệm người dùng**: Hỗ trợ loading skeleton, thông báo toast notification khi thao tác thành công/thất bại.
