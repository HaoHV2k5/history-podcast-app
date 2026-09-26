# Mobile Application

> **Dự án**: PRM - Mobile Application  
> **Mục tiêu**: Ứng dụng di động đa nền tảng (Android / iOS) phục vụ người dùng cuối.

---

## 📌 1. Giới thiệu tổng quan

Thư mục `mobile` chứa toàn bộ mã nguồn ứng dụng di động (thường được phát triển bằng Flutter, React Native, hoặc Native Android/iOS).
- Giao diện thân thiện, tương thích màn hình di động (Responsive UI).
- Tích hợp xác thực, lưu trữ cục bộ (Local Storage / Secure Storage).
- Gọi RESTful API tới server `backend` để hiển thị và đồng bộ dữ liệu.
- Quản lý trạng thái màn hình (State Management).

---

## 📱 2. Cấu trúc thư mục đề xuất (Feature-first hoặc Layered)

```text
mobile/
├── assets/                 # Hình ảnh, icons, fonts tĩnh
├── lib/ hoặc src/
│   ├── config/             # Cấu hình Theme, Routes, App Constants
│   ├── core/               # Các tiện ích dùng chung (Network client, Storage helper, Base UI)
│   ├── models/             # Dữ liệu đối tượng (Entity / Data Model & Serialization)
│   ├── services/           # Lớp kết nối API Backend (Dio / Axios / Fetch)
│   ├── providers/          # Quản lý trạng thái (Riverpod / Bloc / Provider / Zustand)
│   ├── screens/ / views/   # Các màn hình chính (Auth, Home, Profile, Detail...)
│   ├── widgets/ / components/ # Các component UI tái sử dụng (Button, InputField, Card...)
│   └── main.dart / App.tsx # Điểm vào chính của ứng dụng
├── android/                # Cấu hình native Android
├── ios/                    # Cấu hình native iOS
├── .env.example            # Mẫu cấu hình môi trường
├── pubspec.yaml / package.json
└── README.md
```

---

## ⚙️ 3. Cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- **SDK**: Flutter SDK (nếu dùng Flutter) hoặc Node.js & JDK (nếu dùng React Native).
- **Môi trường giả lập**:
  - Android Studio + Android Virtual Device (AVD).
  - Xcode + iOS Simulator (chỉ trên macOS).
  - Hoặc thiết bị di động thật đã bật chế độ Debugging USB.

### Hướng dẫn khởi chạy

#### Trường hợp 1: Dự án Flutter
1. Di chuyển vào thư mục:
   ```bash
   cd mobile
   ```
2. Tải các gói phụ thuộc:
   ```bash
   flutter pub get
   ```
3. Khởi chạy trên thiết bị đang kết nối:
   ```bash
   flutter run
   ```

#### Trường hợp 2: Dự án React Native
1. Di chuyển vào thư mục:
   ```bash
   cd mobile
   ```
2. Cài đặt dependencies:
   ```bash
   npm install # hoặc yarn install
   ```
3. Chạy ứng dụng:
   ```bash
   # Android
   npm run android
   # iOS
   npm run ios
   ```

---

## ⚠️ 4. Lưu ý khi kết nối Backend từ Mobile

Khi chạy backend trên máy nội bộ (`localhost`), thiết bị giả lập cần URL truy cập phù hợp:
- **Android Emulator**: Dùng `http://10.0.2.2:<PORT>` thay cho `http://localhost:<PORT>`.
- **iOS Simulator**: Dùng `http://localhost:<PORT>` hoặc `http://127.0.0.1:<PORT>`.
- **Thiết bị thật (Physical Device)**: Dùng địa chỉ IP nội bộ của máy tính trong mạng Wi-Fi chung (ví dụ: `http://192.168.1.x:<PORT>`).
