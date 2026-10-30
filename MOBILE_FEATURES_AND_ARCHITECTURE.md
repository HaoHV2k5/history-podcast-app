# Sử Ký Mobile (`mobile-production`) — Tổng Quan Tính Năng & Kiến Trúc Tích Hợp

Tài liệu này mô tả toàn diện hiện trạng ứng dụng **Sử Ký Mobile (`mobile-production`)**, các phân hệ chức năng đã hoàn thiện, luồng kết nối API với **Spring Boot Backend (`localhost:8080`)**, và hướng dẫn chạy/kiểm thử dành cho thành viên trong nhóm.

---

## 1. Tổng Quan Hệ Thống

**Sử Ký** là nền tảng Podcast, Video Tư liệu, Livestream Sử học, Xưởng Sáng tạo AI (Creator Studio) và Sàn Hợp tác Giọng đọc (Narrator Marketplace) chuyên biệt cho lịch sử Việt Nam.

- **Thư mục mã nguồn**: `mobile/mobile-production`
- **Ngôn ngữ & Framework**: Flutter (Dart `^3.13.3`), hỗ trợ chạy trực tiếp trên **Android, iOS và Flutter Web (Chrome)**.
- **Ngôn ngữ thiết kế (Editorial Design System)**:
  - Bảng màu giấy cổ điển (`Palette.paper #FBF8F2`, `Palette.ink #171412`, `Palette.red #A62B2B`, `Palette.soft #F2ECE1`).
  - Typography chuẩn học thuật: `NotoSerif` (tiêu đề biên tập), `BeVietnam` (nội dung & điều hướng), `CormorantWordmark` (thương hiệu), số liệu tài chính/thời lượng căn thẳng cột (`FontFeature.tabularFigures()`).
  - Biểu tượng đồng nhất bằng `CupertinoIcons`.
- **Chế độ vận hành kép (Dual-Mode Architecture)**:
  - **Live Backend Mode (Mặc định qua `main.dart` & `LiveBackendApplicationFactory`)**: Kết nối trực tiếp tới toàn bộ 28 RESTful API Repositories của Spring Boot Backend (`http://localhost:8080` trên Web/iOS hoặc `http://10.0.2.2:8080` trên Android Emulator), tự động ẩn toàn bộ công cụ mô phỏng/mock.
  - **Offline / Widget Test Mode**: Hỗ trợ 주입 (inject) `MockClient` hoặc chạy độc lập trong bộ kiểm thử Widget/Integration Test.

---

## 2. Chi Tiết 4 Phân Hệ Chức Năng Đã Hoàn Thiện

### Phân hệ 1: Thính Giả, Khám Phá, Trình Phát & Hội Viên Kênh (Viewer, Playback & Membership)
- **Trang Khám Phá (`HomeShell.discover`) & Tìm Kiếm (`searchPage`)**:
  - Đồng bộ trực tiếp danh sách Tập đã xuất bản (`GET /api/v1/contents/search?status=PUBLISHED`) và danh sách Kênh (`GET /api/v1/channels`).
  - **Tuyển tập & Gợi ý biên tập (`DiscoveryCarousel`, `CollectionPage`)**: Lấy trực tiếp từ các tập xuất bản trên hệ thống.
  - Hỗ trợ kéo để làm mới (`RefreshIndicator`), băng rôn cảnh báo và nút **Thử lại** khi mất kết nối mạng.
- **Trang Chi Tiết Kênh (`ChannelPage`) & Chi Tiết Tập (`EpisodePage`)**:
  - Hiển thị danh sách **Series / Tuyển tập theo kênh** (`GET /api/v1/channels/{channelId}/series` & `GET /api/v1/series/{id}`).
  - Hiển thị **Bản chép lời / Transcript** (`GET /api/v1/transcripts`), **Nguồn sử liệu tham khảo**, và **Mục lục chương (Chapters)**.
  - **Tương tác Thích / Không thích (`ReactionRepository`)**: Gọi `POST /api/v1/reactions` và `DELETE /api/v1/reactions/{id}` với cơ chế Optimistic UI (cập nhật tức thì và hoàn tác nếu lỗi).
  - **Bình luận theo tập (`CommentRepository`)**: Tải và gửi bình luận thật qua `GET /api/v1/comments?artifactId=...` và `POST /api/v1/comments`.
- **Trình Phát Đa Phương Tiện (`PlayerPage`, `MiniPlayer`)**:
  - Phát Audio (`just_audio`) và Video (`video_player`), hỗ trợ danh sách chờ phát (Queue), chỉnh tốc độ phát (`0.75x` – `2.0x`), hẹn giờ tắt (`Sleep Timer`), và lưu tiến độ nghe vào Thư viện (`Đã lưu`, `Kênh đang theo dõi`, `Đã nghe`).
- **Đăng Ký & Gia Hạn Hội Viên Kênh Bằng Số Dư Ví (`MembershipPage`)**:
  - Đồng bộ gói hội viên từng kênh (`GET /api/v1/channels/{id}/memberships/membership-plans`) và kiểm tra quyền hội viên (`GET /api/v1/channels/{id}/memberships/check`).
  - Hiển thị trực tiếp **Số dư ví khả dụng** ngay trên trang Hội viên, có nút mở nhanh sang **Ví / Nạp thêm**.
  - Thanh toán mở khóa hoặc **Gia hạn thêm 30 ngày** bằng số dư ví thật qua `POST /api/v1/channels/{id}/memberships/subscribe`, tự động mở khóa các tập và phòng Livestream độc quyền (`isExclusive = true`).

---

### Phân hệ 2: Phòng Phát Sóng Trực Tiếp (Livestream & Live Chat)
- **Kệ Đang Phát Trực Tiếp (`LivestreamShelfCard`)**:
  - Tự động hiển thị trên trang Khám phá và trang Kênh khi có phiên đang `LIVE` (`GET /api/v1/livestreams?status=LIVE`).
- **Phòng Nghe Trực Tiếp (`LivestreamRoomPage`)**:
  - Kiểm tra cổng **Hội viên VIP** nếu phiên phát sóng đặt `isExclusive = true`.
  - Tự động cập nhật bộ đếm người xem thực tế (`POST /api/v1/livestreams/{id}/join` & `/leave`).
  - **Trò chuyện trực tiếp (`LivestreamChatMessage`)**: Đồng bộ tin nhắn và gửi bình luận trực tiếp (`GET /api/v1/livestreams/{id}/messages` & `POST /api/v1/livestreams/{id}/messages`).
- **Studio Phát Sóng Trực Tiếp Cho Người Kể (`CreatorLivestreamStudioPage`)**:
  - Cho phép chủ kênh mở phòng phát sóng mới (`POST /api/v1/livestreams`), chọn chế độ Công khai hoặc Chỉ dành cho Hội viên, theo dõi lượng người nghe và kết thúc phiên (`POST /api/v1/livestreams/{id}/end`).

---

### Phân hệ 3: Không Gian Sáng Tạo, Quản Lý Kênh, Series & Xưởng AI 6 Bước (Creator Studio)
- **Định Danh KYC & Khởi Tạo Kênh (`CreatorStudio`, `KycSheet`)**:
  - Đồng bộ trạng thái KYC thật từ `GET /api/v1/kyc-profiles/me` và nộp hồ sơ qua `POST /api/v1/kyc-profiles`.
  - Quản lý thông tin kênh (`GET /api/v1/channels/me`, `POST /api/v1/channels`, `PUT /api/v1/channels/{id}`).
- **Cấu Hình Gói Hội Viên Tháng (`MembershipPlanConfigSheet`)**:
  - Thiết lập tên gói, mức phí hàng tháng, mô tả và danh sách đặc quyền hội viên (`POST /api/v1/channels/{id}/memberships/membership-plans`).
- **Quản Lý Series & Tuyển Tập (`CreatorSeriesManagerPage`)**:
  - Tạo mới, cập nhật, xóa Series (`GET /api/v1/creator/series`, `POST /api/v1/creator/series`, `DELETE /api/v1/creator/series/{id}`).
- **Xưởng AI Whiteboard & Kiểm Duyệt Sử Liệu 6 Bước (`AiWhiteboardPipelinePage`)**:
  1. **Cấu hình Giọng đọc AI (`GET/PUT /api/v1/creator/studio/settings`, `GET /api/v1/creator/studio/voices`)** & Nghe thử giọng đọc (`POST /api/v1/creator/studio/voices/preview`).
  2. **Sinh Storyboard RAG Lịch sử (`POST /api/v1/creator/studio/storyboard`)**: Phân cảnh tự động từ chủ đề lịch sử.
  3. **Thẩm định Sử liệu AI Shield (`POST /api/v1/creator/studio/verify-script`)**: Chấm điểm độ chính xác lịch sử và phản hồi nguồn đối chiếu.
  4. **Khởi chạy Render Video Bảng trắng (`POST /api/v1/creator/studio/render`)**.
  5. **Theo dõi tiến độ Render Job (`GET /api/v1/creator/studio/jobs/{jobId}`)**.
  6. **Gửi duyệt AI Shield & Xuất bản (`POST /api/v1/creator/studio/videos/{contentId}/submit-publish`)**.
- **Biên Tập Bản Thảo & Phát Hành Nội Dung (`DraftEditor`, `PublicationPage`)**:
  - Viết kịch bản, đính kèm nguồn tham khảo, nhập video có sẵn (STT), thẩm định nội dung và xuất bản tập mới thẳng lên danh mục công khai hoặc hội viên (`POST /api/v1/contents`).

---

### Phân hệ 4: Sàn Giọng Đọc, Hợp Đồng Ký Quỹ, Phòng Chat & Ví Thu Chi (Marketplace, Contracts & Wallet)
- **Sàn Giọng Đọc (`NarratorMarketplacePage`) & Không Gian Người Đọc (`NarratorHome`)**:
  - Hiển thị danh mục Nghệ sĩ / Người đọc đã xác thực từ Backend (`GET /api/v1/narrator-profiles`, `GET /api/v1/freelancers/me`).
  - Quản lý các bản thu demo giọng đọc (`GET/POST /api/v1/narrator-demos`).
  - Gửi lời mời hợp tác thu âm (`POST /api/v1/hire-requests`) kèm khởi tạo Hợp đồng & Cột mốc thanh toán (`POST /api/v1/contracts`).
- **Quản Lý Vòng Đời Hợp Đồng & Ký Quỹ (`NarratorState`, `ContractRepository`, `MilestoneRepository`)**:
  - Đồng bộ danh sách hợp đồng của cả hai vai trò Creator & Narrator (`GET /api/v1/contracts/me`).
  - Hỗ trợ đầy đủ các bước: Chấp nhận/Từ chối lời mời, Thương lượng thù lao, Ký xác nhận, Nộp file bàn giao (`POST /api/v1/deliverables`), Yêu cầu chỉnh sửa, Nghiệm thu & Giải ngân (`MilestoneRepository`), Gửi yêu cầu phân xử tranh chấp (`POST /api/v1/disputes`), và Xuất hợp đồng PDF (`contract_pdf.dart`).
- **Phòng Trao Đổi Kịch Bản & Bản Thu (`ContractChatSheet`)**:
  - Mở phòng chat theo từng hợp đồng (`POST /api/v1/chats/conversation`), tải lịch sử trao đổi và gửi tin nhắn thời gian thực (`GET/POST /api/v1/chats/conversations/{id}/messages`).
- **Ví Sử Ký, Nạp Tiền & Rút Tiền Ngân Hàng (`WalletPage`, `TopUpWalletSheet`, `BankLinkSheet`, `WithdrawSheet`)**:
  - Truy cập trực tiếp từ cả **Góc của bạn (`Ví Sử Ký & Nạp / Rút tiền`)**, **Trang Hội viên**, và **Không gian sáng tạo**.
  - Đồng bộ số dư khả dụng (`availableBalance`), số dư chờ giữ ký quỹ (`pendingBalance`), và lịch sử biến động số dư (`GET /api/v1/wallets/me`, `GET /api/v1/wallets/me/transactions`).
  - **Nạp tiền vào ví (`TopUpWalletSheet`)**: Hỗ trợ chọn nhanh mệnh giá (`100.000đ` – `2.000.000đ`) hoặc nhập số tiền tùy chọn, gọi `POST /api/v1/wallets/me/deposits` và cộng số dư khả dụng ngay lập tức.
  - **Liên kết Ngân hàng & Rút tiền (`BankLinkSheet`, `WithdrawSheet`)**: Đồng bộ tài khoản ngân hàng (`GET/POST /api/v1/bank-accounts`) và gửi yêu cầu rút tiền (`GET/POST /api/v1/withdrawals`).

---

## 3. Cấu Trúc Thư Mục Chính (`mobile/mobile-production`)

```text
mobile/mobile-production/
├── lib/
│   ├── main.dart                              # Điểm vào chính (chạy LiveBackendApplicationFactory)
│   ├── app.dart                               # HomeShell (Khám phá, Tìm kiếm, Thư viện, Góc của bạn), EpisodePage, PlayerPage, MiniPlayer
│   ├── audience_pages.dart                    # ChannelPage, MembershipPage, ProfileContent, LoginPage, PersonalSettingsPage
│   ├── livestream_page.dart                   # LivestreamShelfCard, LivestreamRoomPage, CreatorLivestreamStudioPage
│   ├── studio_pages.dart                      # CreatorStudio, DraftEditor, VideoUploadSttModal
│   ├── creator_studio_extensions.dart         # MembershipPlanConfigSheet, CreatorSeriesManagerPage, AiWhiteboardPipelinePage
│   ├── publication_page.dart                  # PublicationPage, PublicationReviewPage (Phát hành tập lên kênh)
│   ├── narrator_marketplace.dart              # NarratorMarketplacePage (Sàn thuê giọng đọc & quản lý hợp đồng)
│   ├── narrator_pages.dart                    # NarratorHome (Không gian làm việc của Người đọc)
│   ├── contract_chat_sheet.dart               # ContractChatSheet (Phòng chat hợp đồng) & TopUpWalletSheet (Nạp tiền ví)
│   ├── wallet_page.dart & wallet_forms.dart   # Sổ thu chi, Ký quỹ, Liên kết ngân hàng & Rút tiền
│   ├── core/
│   │   ├── live_backend_application_factory.dart # Khởi tạo 28 Repositories kết nối Spring Boot Backend
│   │   └── api/                               # 28 Repository classes (Auth, Content, Channel, Series, Studio, Livestream, Membership, Wallet, Contract, Chat, KYC...)
│   └── mock/services/                         # State managers (AppState, CreatorState, NarratorState, NarratorProfileState, WalletState)
└── test/
    ├── live_viewer_integration_test.dart      # Integration test Phân hệ 1 (Viewer, Catalog, Series, Reaction, Membership)
    ├── livestream_flow_test.dart              # Integration test Phân hệ 2 (Livestream Room, VIP Gate, Live Chat, Host Studio)
    ├── creator_studio_live_test.dart          # Integration test Phân hệ 3 (Channel, Membership Plan, Series, 6-step AI Pipeline)
    └── marketplace_contract_wallet_live_test.dart # Integration test Phân hệ 4 (Marketplace, HireRequest, Contract Chat, Wallet Top-up)
```

---

## 4. Hướng Dẫn Chạy & Kiểm Thử Nhanh

### 4.1. Khởi chạy ứng dụng (kết nối Backend `localhost:8080`)
- **Chạy trên trình duyệt Chrome (Flutter Web)**:
  ```powershell
  cd mobile/mobile-production
  flutter run -d chrome --web-port 5173
  ```
- **Chạy trên thiết bị / máy ảo Android**:
  ```powershell
  cd mobile/mobile-production
  flutter run
  ```
  *(Lưu ý: Bạn cũng có thể đổi URL máy chủ API trực tiếp trong ứng dụng tại mục **Góc của bạn → Cài đặt tài khoản → Máy chủ kết nối API**).*

### 4.2. Tài khoản kiểm thử mặc định (khi chạy cùng Docker Backend)
- **Tài khoản có sẵn 1.000.000đ trong ví**: `test1tr@example.com` / Mật khẩu: `Creator@123`
- **Tài khoản Chủ kênh Sử Việt Ký**: `suviet.creator@example.com` / Mật khẩu: `Creator@123`
- **Tài khoản Nghệ sĩ Thu âm (Narrator)**: `minhduc.voice@example.com` / Mật khẩu: `Creator@123`

### 4.3. Chạy bộ kiểm thử tự động (Integration Tests 4 Phân hệ)
```powershell
cd mobile/mobile-production
flutter test test/live_viewer_integration_test.dart test/livestream_flow_test.dart test/creator_studio_live_test.dart test/marketplace_contract_wallet_live_test.dart
```
