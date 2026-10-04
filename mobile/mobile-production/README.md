# mobile-production — nền tảng tích hợp

Giữ UI của mobile-mock, gom mô phỏng riêng và tạo điểm ghép backend theo option 1. **Chưa production-ready và chưa kết nối bất kỳ API nào.** Không tự đặt endpoint/DTO/auth/payment policy từ số demo. “Sử Ký” và applicationId `com.example.su_ky_mobile` vẫn là prototype.

## Chạy mặc định (mock tắt)

Yêu cầu Dart >= 3.13.3 < 4 và Flutter tương thích; source đã kiểm bằng Flutter 3.47.3 / Dart 3.13.3. Vào app này riêng, không chạy Pub từ thư mục `mobile`.

```sh
cd mobile/mobile-production
flutter pub get
flutter run
```

Mặc định `USE_MOCK_SERVICES=false`. Khi chưa có adapter sẽ hiển thị “Đang chờ kết nối backend”; không tạo mock AppState/preferences và không dùng OTP/checkout/role mô phỏng. Chỉ điền API_BASE_URL không tự biến app thành bản gọi API thật.

## Xem UI hiện tại bằng mock rõ ràng

```sh
flutter run --dart-define=USE_MOCK_SERVICES=true
# Preview mobile trên web
flutter run -d chrome --dart-define=USE_MOCK_SERVICES=true
```

Chế độ này mở toàn bộ UI/dịch vụ local demo giống mobile-mock, vẫn không production. Đọc `lib/mock/README.md`; data/media mẫu ở `lib/mock` và `assets/mock`. Android label là Sử Ký Integration; khác applicationId của app mock nên có thể cài cả hai. iOS chưa có project/QA.

## Điểm ghép backend và phạm vi còn thiếu

`lib/main.dart` → `launchProduction` → `lib/bootstrap.dart` chọn đúng chế độ. Nhánh backend nhận `BackendApplicationFactory` qua injection, khai báo ở `lib/core/backend_application_factory.dart`. `PendingBackendApplicationFactory` chỉ báo chưa tích hợp và không gửi request. Khi kết nối thật, cung cấp implementation vào `launchProduction(backendFactory: ...)`.

`RuntimeConfiguration` đọc public build config `API_BASE_URL` (mặc định trống) và `USE_MOCK_SERVICES`. Base URL chỉ cho HTTP(S), không nhận username/password/query/fragment. `config/dart_defines.example.json` là mẫu rỗng; file config thật nên để ngoài repo. Tokens, private API keys và secret không được đặt trong Dart defines, assets hay source client.

Đây là điểm ghép ở composition root, **chưa phải các repository adapter đã hoàn thành**. UI hiện còn tham chiếu các feature types local qua compatibility exports. Nhóm cần thay feature state/contracts, map DTO, nối session/error/loading và server permissions cho từng luồng; không kế thừa mock state rồi gọi đó là production. Backend có source ở cấp repo; endpoint/contract phải đối chiếu phiên bản nhóm chốt khi tích hợp.

## Gỡ mock sau tích hợp

1. Thay state/adapter của catalog, auth/reset OTP, KYC/Creator, Narrator/contracts, Wallet/member/payment, social, uploads/media và publishing bằng API thật, kiểm từng luồng. Chuyển các DTO/model dùng chung ra khỏi mock.
2. Thay các compatibility exports `*_state.dart`, gỡ `part` fixtures trong episode/marketplace/Studio, seed/comments/policy demo và các control/hints/mock routes trong UI.
3. Thay bootstrap mock/deferred import; bỏ `lib/mock`, `assets/mock` và entries tương ứng trong pubspec. Không chỉ xóa folder rồi kỳ vọng compile.
4. Thay tests dùng mock bằng contract/integration tests với API; giữ UI/accessibility regression. Chốt applicationId, signing, permissions/network, asset rights và native QA trước phát hành.

Không có fallback từ backend lỗi sang mô phỏng. Dịch vụ thiếu không được hiển thị đăng nhập/OTP/thanh toán thành công giả.

## Kiểm

```sh
flutter analyze
flutter test
flutter build web --release --no-web-resources-cdn
# Kiểm riêng UI mock (không phải build production)
flutter build web --release --no-web-resources-cdn --dart-define=USE_MOCK_SERVICES=true
flutter build apk --debug
```

122 tests (116 UI/local-state regression + 6 bootstrap/config) không chứng minh backend/API hoặc store readiness. Mobile docs: [Design](docs/DESIGN.md), [Assets/licenses](docs/ASSETS.md), [Backend questions](docs/BACKEND-QUESTIONS-VI.md). Build/cache/APK/ZIP/secrets/SDK/AVD/log/QA/handoff nội bộ không đưa lên Git.
