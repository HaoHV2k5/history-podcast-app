# Mobile — History Podcast

Hai ứng dụng Flutter chạy độc lập. Web trong mỗi app là preview giao diện mobile, không phải admin web. Source Android và preview web đã có; chưa tạo iOS project hoặc kiểm iOS.

| Thư mục | Mục đích | Mặc định |
|---|---|---|
| [mobile-mock](mobile-mock/README.md) | UI/local demo hiện tại để test và thảo luận | Dữ liệu/dịch vụ mô phỏng |
| [mobile-production](mobile-production/README.md) | UI giữ nguyên + điểm ghép backend; nền tảng tích hợp, chưa production-ready | Không bật mock; hiện báo chờ adapter backend |

Mỗi thư mục có `pubspec.yaml`, lockfile, assets, source, tests, Android và web. Vào đúng app trước khi `flutter pub get`, `flutter test` hoặc `flutter run`. Không cần Node/npm/node_modules cho hai app Flutter.

Mock tập trung trong `lib/mock` và `assets/mock`. Hai app không có dependency vào thư mục máy tác giả; không cần log/ZIP/bản build/SDK/AVD để clone và chạy. Tài liệu kỹ thuật chọn lọc trong `docs/`; font licenses giữ trong `assets/fonts/`.

Tên “Sử Ký” và applicationId `com.example.*` vẫn là tên prototype, chưa chốt thương hiệu/ID store. Backend, web, tool và doc cấp repo được giữ nguyên. Chưa tích hợp API, xác thực/OTP thật, KYC, payment/ledger, upload/STT/generation/review, push hoặc background media. Đọc giới hạn của từng app trước khi dùng.

Mốc kiểm sau tách 04/10/2026: mobile-mock 116 tests, mobile-production 122 tests (116 UI/local-state + 6 bootstrap/config); analyzer cả hai sạch. Cả hai build web release và APK Android debug x86_64; production còn build riêng web bật mock. Browser smoke đã kiểm default không fallback/không tạo mock preferences, hai UI mock, assets audio/video/JSON và Range video; không có lỗi JS hoặc resource 404. Không bao gồm native runtime QA đầy đủ hay tích hợp API.
