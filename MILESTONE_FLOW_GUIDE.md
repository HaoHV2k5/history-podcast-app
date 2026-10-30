# TÀI LIỆU TOÀN DIỆN VỀ LUỒNG ĐẶT LÀM NỘI DUNG & MILESTONE ESCROW

---

## 1. TỔNG QUAN & CÁC BÊN THAM GIA (ACTORS)

### 1.1. Luồng Đặt làm nội dung (Commission) & Milestone là gì?
Trong hệ thống History Podcast, **Người nghe (`USER` / `VIEWER`)** có thể gửi yêu cầu đặt **Nhà sáng tạo (`CREATOR`)** sản xuất nội dung lịch sử theo yêu cầu:
- **`SINGLE_VIDEO`**: Video / Podcast đơn lẻ.
- **`SERIES`**: Chuỗi nhiều tập chuyên sâu (Lưu ý: Không hỗ trợ đặt `LIVESTREAM`).

Sau khi Creator chấp nhận yêu cầu và hai bên thống nhất qua phòng Chat 1-1, Creator sẽ lập **Hợp đồng & Lộ trình thực hiện (`Contract`)** gồm **từ 1 đến tối đa 20 giai đoạn (`Milestone`)**. Mỗi giai đoạn đại diện cho một phần khối lượng công việc (ví dụ: Đề cương kịch bản, Bản thu âm nháp, Video hoàn chỉnh Tập 1, Tập 2...), có số tiền riêng, yêu cầu bàn giao riêng và số ngày thực hiện riêng.

Cơ chế bảo vệ cốt lõi của hệ thống là **Ký quỹ bảo chứng cuốn chiếu (Sequential Milestone Escrow)**:
- **Người thuê (Listener/Viewer)** duyệt toàn bộ lộ trình 1 lần ở đầu hợp đồng, nhưng chỉ nạp tiền ký quỹ **cuốn chiếu từng giai đoạn một** vào quỹ bảo chứng trung gian (Escrow) của hệ thống.
- **Creator** chỉ bắt đầu làm việc khi thấy giai đoạn hiện tại đã được nạp tiền ký quỹ an toàn (`IN_PROGRESS` / `HELD`) và nhận **95% giá trị giai đoạn** về ví khả dụng sau khi sản phẩm được nghiệm thu (Sàn thu **5% phí vận hành**).

### 1.2. Các bên tham gia (Actors)
1. **Người thuê / Người đặt nội dung (`USER` / `VIEWER` - lưu tại `hire_requests.narrator_id` & `contracts.freelancer_id`)**:
   - Gửi yêu cầu đặt làm nội dung (`SINGLE_VIDEO` hoặc `SERIES`) tới kênh của Creator.
   - Áp dụng **Quy tắc 1 Đơn Đang Thực Hiện (1 Active Commission Rule)**: Tại một thời điểm chỉ được có tối đa 1 yêu cầu/hợp đồng đang hoạt động để chống spam.
   - Duyệt hoặc từ chối lộ trình Milestone do Creator lập; nạp tiền ký quỹ (`Fund`) cho từng giai đoạn khi đến lượt.
   - Thẩm định sản phẩm do Creator nộp: **Duyệt nghiệm thu (`Approve`)** hoặc **Yêu cầu chỉnh sửa (`Request Revision` - tối đa 2 lần/mốc)**.
   - Có quyền **hủy ngay giai đoạn trễ hạn (`Cancel Overdue`)** và nhận lại **100% tiền ký quỹ** của giai đoạn đó nếu Creator trễ deadline bàn giao.
2. **Nhà sáng tạo (`CREATOR` - lưu tại `hire_requests.creator_id` & `contracts.creator_id`)**:
   - Chấp nhận (`Accept` - mở khóa phòng Chat 1-1) hoặc Từ chối (`Reject` - bắt buộc nhập lý do từ chối) yêu cầu đặt nội dung.
   - Lập lộ trình từ `1..20` Milestone; có toàn quyền **chỉnh sửa thông tin từng Milestone hoặc xóa bớt Milestone (ví dụ gộp 2 mốc cuối thành 1 mốc)** khi đang thương lượng (`PENDING` / `REJECTED` trước khi nạp quỹ).
   - Thực hiện sản xuất nội dung và nộp sản phẩm bàn giao (`Submit` / `Upload Deliverable`).
   - Nhận giải ngân **95% (`netAmount`)** về ví khả dụng sau khi hoàn tất nghiệm thu.
3. **Hệ thống tự động (`BookingEscrowScheduledService`)**:
   - Tự động đếm ngược hạn chót (deadlines).
   - Tự động duyệt nghiệm thu (`Auto-Approve`) nếu Người thuê quá hạn **3 ngày** không phản hồi sau khi Creator nộp bài.
   - Tự động giải ngân 95% về ví Creator (`Auto-Release`) sau **3 ngày giữ tiền an toàn (`releaseHoldDays = 3`)**.
   - Tự động hủy hợp đồng nếu Người thuê không nạp tiền ký quỹ Mốc #1 trong **48 giờ** hoặc tạm dừng quá **7 ngày** ở các Mốc #2 trở đi.
4. **Admin (Ban Quản trị nền tảng)**:
   - Quản lý tập trung bộ **Chính sách vận hành toàn sàn (Platform Policy)** và đóng vai trò trọng tài độc lập khi phát sinh tranh chấp (`Dispute`).

---

## 2. VÒNG ĐỜI TRẠNG THÁI CỦA ĐƠN ĐẶT HÀNG & MILESTONE

### 2.1. Trạng thái Đơn yêu cầu đặt nội dung (`CommissionStatus`)
- **`PENDING`**: Người nghe vừa gửi đơn, chờ Creator phản hồi (Phòng Chat 1-1 đang khóa để chống spam).
- **`ACCEPTED`**: Creator đã chấp nhận yêu cầu $\rightarrow$ **Mở khóa phòng Chat 1-1 (`hire_request_{id}`)** để hai bên trao đổi chi tiết.
- **`REJECTED`**: Creator từ chối đơn (kèm `rejectionReason` bắt buộc) $\rightarrow$ Giải phóng ngay lượt đặt hàng cho Người nghe đi thuê Creator khác.
- **`CANCELLED`**: Người nghe chủ động hủy đơn (hoặc hợp đồng bị hủy) $\rightarrow$ Giải phóng lượt đặt hàng.
- **`CONTRACT_SENT`**: Creator đã lập và gửi lộ trình Milestone (Contract dùng chung phòng chat `hire_request_{id}`).
- **`COMPLETED`**: Toàn bộ các Milestone của hợp đồng đã hoàn thành và giải ngân xong.

### 2.2. Trạng thái Giai đoạn (`MilestoneStatus`) & Tiền ký quỹ (`EscrowStatus`)

| Trạng thái Milestone (`MilestoneStatus`) | Trạng thái Tiền (`EscrowStatus`) | Ý nghĩa thực tế |
| :--- | :--- | :--- |
| **WAITING** | `NONE` (Chưa nạp) | Giai đoạn đang xếp hàng chờ. Khi hợp đồng mới tạo hoặc các giai đoạn trước chưa được duyệt nghiệm thu. |
| **UNFUNDED** | `NONE` (Chưa nạp) | Đã mở khóa đến lượt thực hiện. Người thuê có **48 giờ** (`fundDueAt`) để nạp tiền ký quỹ. |
| **IN_PROGRESS** | `HELD` (Đang phong tỏa) | Người thuê đã nạp tiền ký quỹ thành công. Tiền được giữ trong Escrow. Creator bắt đầu sản xuất nội dung theo hạn bàn giao (`dueAt`). |
| **SUBMITTED** | `HELD` (Đang phong tỏa) | Creator đã nộp sản phẩm bàn giao. Hệ thống đếm ngược **3 ngày** (`reviewDueAt`) để Người thuê kiểm tra và phản hồi. |
| **APPROVED** | `HELD` (Đang phong tỏa) | Người thuê đã duyệt sản phẩm (hoặc hệ thống tự động duyệt). Hệ thống giữ tiền **3 ngày đệm an toàn** (`releaseAt`), đồng thời **mở khóa ngay Milestone kế tiếp sang `UNFUNDED`**. |
| **RELEASED** | `RELEASED` (Đã giải ngân) | Hết 3 ngày giữ tiền an toàn mà không có khiếu nại, **95% tiền được cộng vào ví khả dụng của Creator** (5% phí nền tảng). |
| **DISPUTED** | `FROZEN` (Đóng băng) | Một trong hai bên mở khiếu nại. Toàn bộ tiền ký quỹ của giai đoạn này bị đóng băng chờ Admin phân xử. |
| **CANCELLED** | `REFUNDED` (Hoàn trả 100%) | Giai đoạn bị hủy (do Creator trễ hạn hoặc Admin phân xử hoàn tiền). **100% tiền ký quỹ của giai đoạn đang chạy được hoàn trả về ví Người thuê**. |

---

## 3. TOÀN BỘ LUỒNG HOẠT ĐỘNG TỪNG BƯỚC (STEP-BY-STEP FLOW)

### Bước 1: Gửi Yêu cầu Đặt làm Nội dung & Mở khóa Chat 1-1
1. **Người nghe gửi yêu cầu**: Gọi `POST /api/v1/commissions` (hỗ trợ song song alias `POST /api/v1/hire-requests`) với 4 trường tinh gọn: `channelId` (hoặc `creatorId`), `contentType` (`SINGLE_VIDEO` | `SERIES`), `title`, `description`.
2. **Creator phản hồi**:
   - Nếu từ chối: Gọi `POST /api/v1/commissions/{id}/reject` kèm lý do (`reason`). Đơn chuyển sang `REJECTED`, người nghe được mở khóa để đặt kênh khác.
   - Nếu đồng ý: Gọi `POST /api/v1/commissions/{id}/accept`. Đơn chuyển sang `ACCEPTED`, mở khóa phòng Chat 1-1 (`POST /api/v1/chats/conversation` với `hireRequestId`).

### Bước 2: Creator lập Lộ trình Milestone & Thương lượng (Sửa / Gộp / Xóa mốc)
1. **Creator tạo hợp đồng**: Gọi `POST /api/v1/contracts` (truyền `hireRequestId`, `title`, `description` và danh sách `1..20` milestones, mỗi mốc chỉ cần 4 trường: `title`, `requirement`, `amount`, `durationDays`).
   - Tất cả các Milestone khởi tạo ở trạng thái `WAITING`.
   - Hợp đồng snapshot tỷ lệ phí sàn hiện hành (`5.0%`) để đảm bảo tính bất biến lịch sử.
2. **Thương lượng & Chỉnh sửa / Gộp / Xóa Milestone (trước khi nạp quỹ)**:
   - Nếu Người thuê muốn điều chỉnh lộ trình (ví dụ gộp 2 mốc cuối thành 1 mốc và tăng thời gian thực hiện), Người thuê có thể nhắn qua Chat hoặc bấm `POST /api/v1/contracts/{id}/reject`.
   - Khi hợp đồng đang ở `PENDING` hoặc `REJECTED` (chưa có mốc nào nạp tiền ký quỹ), Creator có thể:
     - **Xóa bớt 1 Milestone**: `DELETE /api/v1/milestones/{id}` (khi hợp đồng có từ 2 mốc trở lên) $\rightarrow$ Hệ thống xóa mốc, tự động đánh lại `orderNo = 1..N` và tính lại tổng tiền hợp đồng.
     - **Sửa thông tin 1 Milestone**: `PUT /api/v1/milestones/{id}` $\rightarrow$ Sửa `title`, `requirement`, `amount`, `durationDays` và tự động tính lại tổng tiền hợp đồng.
     - **Cập nhật toàn bộ lộ trình**: `PUT /api/v1/contracts/{id}` $\rightarrow$ Thay thế danh sách milestone mới và gửi lại cho Người thuê duyệt.

### Bước 3: Người thuê Chấp thuận Lộ trình & Mở khóa Mốc #1
- **Hành động**: Người thuê đọc toàn bộ lộ trình `1..N` Milestone và bấm `POST /api/v1/contracts/{id}/accept`.
- **Hệ thống xử lý**:
  - Hợp đồng chuyển sang `ACTIVE`, khóa cấu trúc lộ trình (không ai được tự ý sửa/xóa mốc nữa).
  - **Duy nhất Milestone #1** được mở khóa từ `WAITING` sang `UNFUNDED` (`fundDueAt = Hiện tại + 48 giờ`).
  - Các Milestone từ #2 trở đi vẫn giữ trạng thái `WAITING`.

### Bước 4: Người thuê Nạp tiền Ký quỹ (`Fund Milestone`)
- **Actor thực hiện**: Người thuê (`USER` / `VIEWER`).
- **Hành động**: Gọi `POST /api/v1/milestones/{id}/fund`.
- **Hệ thống xử lý**:
  - Trừ 100% số tiền của giai đoạn đó từ ví khả dụng của Người thuê chuyển vào quỹ bảo chứng Escrow (`HELD`).
  - Chuyển trạng thái Milestone sang `IN_PROGRESS` và bắt đầu đếm ngược hạn bàn giao của Creator: `dueAt = Hiện tại + durationDays`.

### Bước 5: Creator Nộp sản phẩm bàn giao (`Submit` / `Upload Deliverable`)
- **Actor thực hiện**: Creator.
- **Hành động**: Gọi `POST /api/v1/milestones/{id}/submit` hoặc tải tệp lên qua `POST /api/v1/milestones/{milestoneId}/deliverables`.
- **Hệ thống xử lý**:
  - Lưu phiên bản bàn giao (`versionNo` tự tăng: v1, v2...).
  - Chuyển Milestone sang `SUBMITTED` và đặt hạn nghiệm thu `reviewDueAt = Hiện tại + 3 ngày`.

### Bước 6: Người thuê Nghiệm thu hoặc Yêu cầu Chỉnh sửa
- **Lựa chọn A — Yêu cầu chỉnh sửa (`POST /api/v1/milestones/{id}/request-revision`)**:
  - Áp dụng tối đa **2 lần sửa miễn phí / milestone** (`maxRevisions = 2`).
  - Milestone quay lại `IN_PROGRESS`, cộng thêm **2 ngày** (`revisionDays = 2`) vào `dueAt` để Creator chỉnh sửa và nộp lại.
- **Lựa chọn B — Duyệt nghiệm thu (`POST /api/v1/milestones/{id}/approve`) hoặc Tự động duyệt sau 3 ngày**:
  - Milestone chuyển sang `APPROVED`, hẹn giờ giải ngân `releaseAt = Hiện tại + 3 ngày`.
  - **Mở khóa ngay Milestone tiếp theo (`orderNo + 1`)** từ `WAITING` sang `UNFUNDED` để Người thuê có thể nạp tiền làm tiếp ngay mà không phải đợi hết 3 ngày giam tiền của mốc trước.

### Bước 7: Giải ngân về ví Creator (95% Creator / 5% Platform)
- Sau 3 ngày đệm an toàn (`releaseHoldDays = 3`) kể từ khi `APPROVED` mà không có tranh chấp (`Dispute`), hệ thống tự động giải ngân:
  - Cộng **95% (`netAmount`)** vào ví khả dụng của **Creator**.
  - Khấu trừ **5% (`platformFee`)** doanh thu vận hành nền tảng.
  - Khi Milestone cuối cùng chuyển sang `RELEASED`, cả `Contract` và `HireRequest` tự động chuyển sang `COMPLETED`.

---

## 4. BẢNG THÔNG SỐ CHÍNH SÁCH VẬN HÀNH TOÀN SÀN HỢP NHẤT

Toàn bộ thông số vận hành được công khai minh bạch tại API `GET /api/v1/policies/booking-escrow` và quản trị bởi Admin tại `PUT /api/v1/admin/booking-escrow/config`:

| Tham số Cấu hình | Giá trị Chuẩn | Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- |
| **`maxMilestones`** | **20 mốc** | Số giai đoạn tối đa cho một hợp đồng `SINGLE_VIDEO` hoặc `SERIES` (từ 1 đến 20 mốc). |
| **`platformFeePercent`** | **5.0%** | Phí nền tảng cho luồng Đặt làm nội dung (Creator thực nhận **95%**). Được snapshot cứng vào từng hợp đồng lúc tạo. |
| **`membershipFeePercent`** | **10.0%** | Phí nền tảng khi khán giả mua Gói Hội Viên kênh (Creator thực nhận **90%**, thời hạn gói **30 ngày**). |
| **`contractAcceptHours`** | **48 giờ** | Thời hạn để Người thuê duyệt lộ trình Milestone kể từ lúc Creator gửi báo giá. |
| **`fundHours`** | **48 giờ** | Thời hạn tiêu chuẩn để Người thuê nạp tiền ký quỹ khi một Milestone được mở khóa sang `UNFUNDED`. |
| **`fundPauseMaxDays`** | **7 ngày** | Thời gian ân hạn tạm dừng tối đa giữa các giai đoạn (từ Mốc #2 trở đi) để Người thuê chuẩn bị ngân sách trước khi hệ thống tự hủy phần còn lại. |
| **`reviewDays`** | **3 ngày** | Thời hạn để Người thuê nghiệm thu sản phẩm kể từ lúc Creator nộp bài. Quá 3 ngày không phản hồi $\rightarrow$ Tự động duyệt (`Auto-Approve`). |
| **`maxRevisionsDefault`** | **2 lần** | Số lượt yêu cầu chỉnh sửa miễn phí tối đa cho mỗi giai đoạn. |
| **`revisionDays`** | **2 ngày** | Số ngày cộng thêm cho Creator hoàn thành mỗi lượt chỉnh sửa. |
| **`releaseHoldDays`** | **3 ngày** | Thời gian giữ tiền an toàn sau khi duyệt (`APPROVED`) trước khi giải ngân 95% về ví khả dụng của Creator. |
| **`withdrawalSlaDays`** | **2 ngày (48h)** | Cam kết SLA tối đa để Admin xử lý và chuyển khoản đơn rút tiền từ ví về ngân hàng (`slaDueAt = requestedAt + 2 ngày`). |
| **`withdrawalMinAmount`** | **50.000 VNĐ** | Số tiền rút tối thiểu mỗi lệnh rút về tài khoản ngân hàng. |
| **`depositMinAmount`** | **10.000 VNĐ** | Số tiền nạp tối thiểu vào ví qua cổng thanh toán PayOS. |
