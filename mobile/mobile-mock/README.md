# mobile-mock

Bản UI/local demo đầy đủ tại mốc chuyển bốn tab. Nội dung/audio/video mẫu có trong source để test UI; không kết nối backend, không giao dịch hoặc xác thực thật. “Sử Ký” là tên prototype.

## Chạy

Yêu cầu Dart >= 3.13.3 < 4 và Flutter tương thích (source đã kiểm bằng Flutter 3.47.3 / Dart 3.13.3), Android SDK/JDK khi chạy Android. Dependencies tải qua Pub, không commit vào Git.

```sh
cd mobile/mobile-mock
flutter pub get
flutter run
# Hoặc preview web
flutter run -d chrome
```

Android applicationId tạm `com.example.su_ky_mobile.mock` để cài cùng bản integration; nhãn Sử Ký Mock. iOS chưa có project/QA. Web chỉ preview mobile tối đa 480 px.

## Test và build

```sh
flutter analyze
flutter test
flutter build web --release --no-web-resources-cdn
flutter build apk --debug
```

116 unit/widget tests kế thừa kiểm UI/state: tab/carousel/search/scroll/reduced motion/chữ 2×; player/video/audio; KYC/error recovery; Studio/Narrator/Wallet/artwork/publishing. Bản build/debug signing không thay production signing hoặc QA điện thoại thật.

## Dữ liệu thử

Trong app: Cá nhân → Cài đặt & bản thử → Dữ liệu thử giao diện. Nạp chủ động một trong các kịch bản; Khôi phục trả lại local data trước lần nạp đầu. Không đồng bộ server. OTP mẫu: **889900**.

`lib/mock/fixtures` chứa catalog/narrators/video metadata; `lib/mock/services` chứa mô phỏng local; `assets/mock/demo/scenarios.json` chứa preset; `assets/mock/audio` và `video` chứa media kỹ thuật do FFmpeg tạo. Không phải nội dung lịch sử đã kiểm chứng. Ảnh prototype có nguồn trong [ASSETS](docs/ASSETS.md); cần xác nhận quyền/đổi ảnh trước phát hành sản phẩm. Không đưa file do người dùng chọn, SharedPreferences hay ảnh cá nhân vào repo.

## Tài liệu nhóm

- [Design](docs/DESIGN.md): font, màu, nguyên tắc UI.
- [Backend questions](docs/BACKEND-QUESTIONS-VI.md): câu hỏi cần chốt; số demo không phải policy server.
- [Mock inventory](lib/mock/README.md): vị trí mô phỏng và cách thay.

Không commit cache/build/APK/ZIP/node_modules, `.env`, SDK path, signing key hoặc thông tin đăng nhập. `.gitignore` đã chặn các file đó; lockfile và font licenses phải giữ.
