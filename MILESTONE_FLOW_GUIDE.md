# TÀI LIỆU TOÀN DIỆN VỀ LUỒNG MILESTONE (GIAI ĐOẠN HỢP ĐỒNG)

---

## 1. TỔNG QUAN & CÁC BÊN THAM GIA (ACTORS)

### 1.1. Milestone là gì?
Trong hệ thống, một hợp đồng dịch vụ / công việc (`Contract`) được chia nhỏ thành **từ 1 đến 5 giai đoạn (`Milestone`)**. Mỗi giai đoạn đại diện cho một phần khối lượng công việc, có số tiền riêng, yêu cầu riêng và thời hạn hoàn thành riêng.

Cơ chế cốt lõi của Milestone là **Ký quỹ bảo chứng (Escrow)**:
- Tiền của người thuê được chuyển vào quỹ ký quỹ trung gian an toàn do hệ thống quản lý.
- Người làm chỉ nhận được tiền giải ngân khi sản phẩm bàn giao đạt yêu cầu và đã được người thuê nghiệm thu.

### 1.2. Các bên tham gia (Actors)
1. **Creator (Bên thuê / Người tạo việc)**:
   - Nạp tiền ký quỹ cho từng giai đoạn vào tài khoản bảo chứng của hệ thống.
   - Thẩm định sản phẩm do Freelancer nộp (Duyệt nghiệm thu hoặc Yêu cầu chỉnh sửa).
   - Có quyền hủy giai đoạn và nhận lại tiền nếu Freelancer làm trễ hạn cam kết.
2. **Freelancer (Người nhận việc / Chuyên gia)**:
   - Thực hiện công việc sau khi thấy giai đoạn đã được nạp tiền ký quỹ an toàn.
   - Nộp sản phẩm đầu ra (văn bản giải trình, đường dẫn sản phẩm, tệp đính kèm).
   - Tiếp thu và chỉnh sửa sản phẩm nếu Creator có yêu cầu (trong giới hạn số lần thỏa thuận).
   - Nhận tiền thanh toán về ví khả dụng sau khi giai đoạn được nghiệm thu.
3. **Hệ thống tự động (System / Background Worker - `BookingEscrowScheduledService`)**:
   - Tự động đếm ngược hạn chót (deadlines).
   - Tự động duyệt nghiệm thu (`Auto-Approve`) nếu Creator quá hạn 3 ngày không phản hồi.
   - Tự động giải ngân tiền về ví Freelancer (`Auto-Release`) sau 3 ngày giữ tiền an toàn.
   - Tự động hủy hợp đồng nếu Creator không nạp tiền ký quỹ đúng hạn.
4. **Admin (Ban Quản trị nền tảng)**:
   - Đóng vai trò trọng tài độc lập khi hai bên phát sinh khiếu nại, tranh chấp (`Dispute`).
   - Đưa ra phán quyết cuối cùng: trả tiền cho Freelancer, hoàn tiền cho Creator, hoặc phân chia theo tỷ lệ %.

---

## 2. VÒNG ĐỜI TRẠNG THÁI CỦA MILESTONE

Một Milestone trải qua các trạng thái tuần tự như sau:

| Trạng thái Milestone (`MilestoneStatus`) | Trạng thái Tiền (`EscrowStatus`) | Ý nghĩa thực tế |
| :--- | :--- | :--- |
| **WAITING** | `NONE` (Chưa nộp) | Giai đoạn đang xếp hàng chờ. Các giai đoạn trước chưa hoàn thành nên chưa đến lượt. |
| **UNFUNDED** | `NONE` (Chưa nộp) | Đã đến lượt thực hiện. Hệ thống yêu cầu Creator phải nạp tiền ký quỹ trong vòng 48 giờ. |
| **IN_PROGRESS** | `HELD` (Đang phong tỏa) | Creator đã ký quỹ thành công. Tiền bị khóa trong Escrow. Freelancer bắt đầu làm việc và hệ thống tính deadline bàn giao (`due_at`). |
| **SUBMITTED** | `HELD` (Đang phong tỏa) | Freelancer đã nộp sản phẩm. Hệ thống đếm ngược 3 ngày để Creator kiểm tra và phản hồi. |
| **APPROVED** | `HELD` (Đang phong tỏa) | Creator đã duyệt sản phẩm (hoặc hệ thống tự động duyệt). Hệ thống giữ tiền tiếp trong **3 ngày đệm an toàn** (`release_at`). Đồng thời kích hoạt Milestone kế tiếp sang `UNFUNDED`. |
| **RELEASED** | `RELEASED` (Đã chuyển giao) | Hết 3 ngày giữ tiền an toàn mà không có khiếu nại, tiền được giải ngân trực tiếp vào ví khả dụng của Freelancer (đã khấu trừ 5% phí sàn). |
| **DISPUTED** | `FROZEN` (Đóng băng) | Một trong hai bên mở khiếu nại. Toàn bộ tiền của giai đoạn này bị đóng băng, đợi Admin phân xử. |
| **CANCELLED** | `REFUNDED` (Hoàn trả) | Giai đoạn bị hủy (do trễ hạn, không ký quỹ, hoặc Admin phân xử hoàn tiền). Tiền ký quỹ được hoàn trả lại ví Creator. |

---

## 3. TOÀN BỘ LUỒNG HOẠT ĐỘNG TỪNG BƯỚC (STEP-BY-STEP FLOW)

### Bước 1: Kích hoạt Milestone đầu tiên
- **Điều kiện**: Creator tạo hợp đồng (chứa danh sách các Milestone) và gửi cho Freelancer.
- **Hành động**: Freelancer bấm **Chấp nhận hợp đồng (Accept Contract)**.
- **Hệ thống xử lý**:
  - Hợp đồng chuyển sang `ACTIVE`.
  - **Milestone 1** tự động đổi từ `WAITING` sang `UNFUNDED`.
  - Hệ thống đặt thời hạn ký quỹ: `fund_due_at = Hiện tại + 48 giờ`.
  - Các Milestone từ số 2 trở đi vẫn nằm ở trạng thái chờ `WAITING`.

---

### Bước 2: Ký quỹ giai đoạn (Creator ký quỹ)
- **Actor thực hiện**: Creator.
- **Hành động**: Creator gọi API ký quỹ (`POST /api/v1/milestones/{id}/fund`).
- **Ràng buộc kiểm tra**:
  - Phải đúng là Creator của hợp đồng.
  - Milestone phải đang ở trạng thái `UNFUNDED`.
  - Số dư khả dụng trong ví Creator phải $\ge$ số tiền của Milestone.
- **Hệ thống xử lý**:
  - Khóa số dư ví Creator và trừ tiền ngay lập tức.
  - Tạo giao dịch ví loại `FUND_ESCROW` (ghi nhận trừ tiền).
  - Đổi trạng thái tiền thành `HELD` (tiền nằm ở tài khoản bảo chứng).
  - Đổi trạng thái Milestone thành `IN_PROGRESS`.
  - **Bắt đầu tính deadline bàn giao**: `due_at = Hiện tại + duration_days` (số ngày làm việc đã cam kết).

---

### Bước 3: Freelancer làm việc và nộp sản phẩm
- **Actor thực hiện**: Freelancer.
- **Hành động**: Freelancer chuẩn bị bài làm và nộp qua API nộp bài (`POST /api/v1/milestones/{id}/submit`) hoặc tải tệp đính kèm (`POST /api/v1/milestones/{milestoneId}/deliverables`).
- **Ràng buộc kiểm tra**:
  - Phải đúng là Freelancer của hợp đồng.
  - Milestone phải đang ở trạng thái `IN_PROGRESS`.
- **Hệ thống xử lý**:
  - Ghi nhận thông tin nộp bài (nội dung, link, tệp đính kèm) kèm số thứ tự phiên bản (`version_no` tự tăng: v1, v2...).
  - Đổi trạng thái Milestone sang `SUBMITTED`.
  - **Kích hoạt đồng hồ duyệt bài**: `review_due_at = Hiện tại + 3 ngày`. Creator có tối đa 3 ngày để xem bài và phản hồi.

---

### Bước 4: Kiểm tra và Yêu cầu chỉnh sửa (Nếu chưa đạt)
- **Actor thực hiện**: Creator.
- **Hành động**: Nếu sản phẩm chưa đạt, Creator gửi yêu cầu sửa (`POST /api/v1/milestones/{id}/request-revision`).
- **Ràng buộc kiểm tra**:
  - Chỉ Creator mới có quyền yêu cầu sửa.
  - Milestone phải đang ở trạng thái `SUBMITTED`.
  - **Ràng buộc số lần sửa**: Số lần đã sửa (`revisions_used`) phải nhỏ hơn số lần tối đa được phép (`max_revisions`, mặc định là 2 lần). Nếu đã hết lượt sửa, hệ thống chặn lại và bắt buộc Creator phải chọn **Duyệt (Approve)** hoặc **Mở khiếu nại (Dispute)**.
- **Hệ thống xử lý**:
  - Tăng số lần đã sửa: `revisions_used = revisions_used + 1`.
  - Tạo một bản ghi yêu cầu chỉnh sửa kèm lý do phản hồi.
  - Chuyển trạng thái Milestone quay ngược lại `IN_PROGRESS`.
  - Gia hạn deadline sửa bài cho Freelancer: `due_at = Hiện tại + revision_days` (mặc định là 2 ngày).
  - Hủy đồng hồ duyệt cũ (`review_due_at = null`).

---

### Bước 5: Duyệt nghiệm thu (Creator duyệt hoặc Hệ thống tự duyệt)
- **Tình huống 1: Creator chủ động duyệt**:
  - Creator bấm duyệt (`POST /api/v1/milestones/{id}/approve`).
- **Tình huống 2: Hệ thống tự động duyệt (Auto-Approve)**:
  - Nếu bài nộp ở trạng thái `SUBMITTED` quá 3 ngày (`review_due_at`) mà Creator không phản hồi, hệ thống nền tự động can thiệp duyệt thay cho Creator.
- **Hệ thống xử lý chung**:
  - Đổi trạng thái Milestone sang `APPROVED`.
  - **Thiết lập thời gian giam tiền bảo vệ (Release Hold)**: `release_at = Hiện tại + 3 ngày`. Mục đích là tạo khoảng đệm 3 ngày để hai bên kiểm tra lại, phòng ngừa gian lận hoặc vi phạm bản quyền trước khi tiền rời khỏi hệ thống.
  - **Mở khóa Milestone kế tiếp**: Nếu hợp đồng còn Milestone tiếp theo (ví dụ Milestone 2), hệ thống lập tức chuyển Milestone đó từ `WAITING` sang `UNFUNDED`, đồng thời đặt hạn nạp tiền 48 giờ cho Creator.

---

### Bước 6: Tự động giải ngân (Auto-Release Escrow)
- **Actor thực hiện**: Hệ thống tự động (Scheduled Service chạy định kỳ mỗi giờ).
- **Điều kiện kích hoạt**:
  - Milestone ở trạng thái `APPROVED`.
  - Thời điểm hiện tại $\ge$ `release_at` (đã hoàn thành 3 ngày đệm).
  - Không có bất kỳ khiếu nại nào đang mở (`Dispute != OPEN`).
- **Hệ thống xử lý**:
  - Tính toán phí dịch vụ nền tảng: Cố định **5%** trên giá trị giai đoạn.
  - Tính tiền thực nhận của Freelancer: `net_amount = amount - platform_fee`.
  - Mở khóa ví Freelancer, cộng trực tiếp `net_amount` vào số dư khả dụng (`available_balance`).
  - Tạo giao dịch ví loại `RELEASE` cho Freelancer.
  - Đổi trạng thái tiền Escrow thành `RELEASED`, trạng thái Milestone thành `RELEASED`.
  - **Kiểm tra hoàn thành hợp đồng**: Nếu đây là Milestone cuối cùng của hợp đồng và tất cả các Milestone đều đã `RELEASED`, hệ thống tự động đổi trạng thái Hợp đồng sang `COMPLETED`.

---

## 4. CÁC LUỒNG NGOẠI LỆ & XỬ LÝ SỰ CỐ

### 4.1. Creator không nạp tiền ký quỹ đúng hạn
- **Trường hợp Milestone 1 (M1)**: Nếu sau 48h kể từ lúc Freelancer nhận việc mà Creator không ký quỹ, hệ thống tự động **HỦY HỢP ĐỒNG** (`CANCELLED`), đồng thời mở lại bài đăng tuyển (`OPEN`) để Freelancer khác có thể ứng tuyển.
- **Trường hợp từ Milestone 2 trở đi (M2+)**: Nếu hoàn thành M1 nhưng Creator chần chừ không ký quỹ M2, hệ thống cho phép tạm dừng tối đa 7 ngày (`fundPauseMaxDays = 7`). Nếu quá 7 ngày vẫn không ký quỹ, hệ thống tự động hủy các giai đoạn còn lại và đóng hợp đồng.

### 4.2. Freelancer trễ hạn bàn giao (Overdue)
- **Điều kiện**: Milestone đang ở `IN_PROGRESS` nhưng thời gian hiện tại đã vượt quá hạn chót (`now > due_at`) mà Freelancer chưa nộp bài.
- **Hành động của Creator**: Creator có quyền gọi API hủy milestone trễ hạn (`POST /api/v1/milestones/{id}/cancel-overdue`).
- **Hệ thống xử lý**:
  - Toàn bộ 100% tiền ký quỹ của Milestone này lập tức được hoàn trả về ví khả dụng của Creator.
  - Tạo giao dịch ví loại `REFUND`.
  - Đổi trạng thái Milestone sang `CANCELLED`.
  - Đổi trạng thái hợp đồng sang `CANCELLED`.

### 4.3. Phát sinh tranh chấp / Khiếu nại (Dispute Flow)
Bất kỳ khi nào trong các trạng thái `IN_PROGRESS`, `SUBMITTED`, hoặc `APPROVED` (chưa giải ngân), nếu hai bên có mâu thuẫn:
1. **Mở khiếu nại**: Creator hoặc Freelancer gọi `POST /api/v1/disputes`.
   - Tiền ký quỹ lập tức bị chuyển sang trạng thái **`FROZEN` (Đóng băng tuyệt đối)**.
   - Milestone chuyển sang trạng thái `DISPUTED`. Không ai được rút tiền hay tự động giải ngân.
2. **Nộp bằng chứng đối chứng**: Bên bị khiếu nại gửi thêm giải trình và bằng chứng thông qua `POST /api/v1/disputes/{id}/counter-evidence`.
3. **Admin phân xử (`POST /api/v1/disputes/{id}/resolve`)**:
   Admin xem xét bằng chứng và đưa ra 1 trong 3 phán quyết:
   - **Thắng cho Freelancer (`RELEASE_TO_FREELANCER`)**: Tiền giải ngân cho Freelancer (sau khi trừ 5% phí sàn). Milestone chuyển sang `RELEASED` và mở tiếp giai đoạn sau (nếu có).
   - **Hoàn tiền cho Creator (`REFUND_TO_CREATOR`)**: Hoàn 100% tiền ký quỹ về ví Creator. Milestone và Hợp đồng bị hủy (`CANCELLED`).
   - **Phân chia theo tỷ lệ (`SPLIT`)**: Admin quyết định tỷ lệ phân chia (ví dụ trả Freelancer 60% công sức, hoàn lại Creator 40%). Hệ thống tự động tính toán, trừ phí sàn trên phần của Freelancer, chia tiền về đúng 2 ví, sau đó giải phóng milestone.

---

## 5. ĐÁNH GIÁ GIAI ĐOẠN (MILESTONE REVIEWS)

Sau khi một Milestone đạt trạng thái `APPROVED` hoặc `RELEASED`, hai bên có thể đánh giá lẫn nhau:
- **Actor**: Cả Creator và Freelancer.
- **API**: `POST /api/v1/milestones/{milestoneId}/reviews`.
- **Dữ liệu**: Chấm điểm từ 1 đến 5 sao và kèm lời nhận xét.
- **Ràng buộc**: Mỗi bên chỉ được đánh giá đối phương 1 lần duy nhất cho mỗi Milestone (`uq_milestone_reviewer`).

---

## 6. DANH MỤC CÁC API CHI TIẾT

Tất cả các API dưới đây đều yêu cầu Header: `Authorization: Bearer <access_token>`.

### 6.1. Nhóm API Quản lý Milestone (`/api/v1/milestones`)

| Phương thức & Endpoint | Quyền gọi (Actor) | Dữ liệu đầu vào (Payload) | Mô tả tóm tắt |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/milestones/{id}/fund` | Creator | *Không có body* | Ký quỹ tiền cho milestone. Trừ tiền ví Creator $\rightarrow$ Escrow. Chuyển sang `IN_PROGRESS`. |
| `POST /api/v1/milestones/{id}/submit` | Freelancer | JSON: `{ "content": "string", "fileUrl": "string" }` | Nộp nội dung/link sản phẩm. Milestone sang `SUBMITTED`, hẹn giờ tự duyệt sau 3 ngày. |
| `POST /api/v1/milestones/{id}/request-revision` | Creator | JSON: `{ "submissionId": 12, "note": "string" }` | Yêu cầu Freelancer sửa lại bài. Giảm lượt sửa, quay lại `IN_PROGRESS` (hạn sửa 2 ngày). |
| `POST /api/v1/milestones/{id}/approve` | Creator | *Không có body* | Nghiệm thu bài làm. Milestone sang `APPROVED`, hẹn giờ giải ngân sau 3 ngày, kích hoạt milestone sau. |
| `POST /api/v1/milestones/{id}/cancel-overdue` | Creator | *Không có body* | Hủy milestone khi Freelancer làm trễ hạn. Hoàn tiền 100% về ví Creator. |
| `GET /api/v1/milestones/{id}` | Cả hai | Path param `{id}` | Lấy chi tiết toàn bộ thông tin của milestone (lịch sử nộp, tệp đính kèm, các lần sửa, đánh giá). |
| `GET /api/v1/milestones/contract/{contractId}` | Cả hai | Path param `{contractId}` | Lấy danh sách tất cả các milestone thuộc hợp đồng. |

---

### 6.2. Nhóm API Bàn giao Sản phẩm & Tệp đính kèm (`/api/v1/...`)

| Phương thức & Endpoint | Quyền gọi (Actor) | Dữ liệu đầu vào (Payload) | Mô tả tóm tắt |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/milestones/{milestoneId}/deliverables` | Freelancer | Multipart/form-data: `file`, `title`, `description` | Tải trực tiếp file sản phẩm đầu ra (PDF, ZIP, Video...). Tự động lưu phiên bản và chuyển milestone sang `SUBMITTED`. |
| `GET /api/v1/milestones/{milestoneId}/deliverables` | Cả hai | Path param `{milestoneId}` | Lấy danh sách file đính kèm đã nộp của một milestone. |
| `GET /api/v1/deliverables/{id}/view` | Cả hai | Path param `{id}` | Xem trước file trực tiếp trên ứng dụng / trình duyệt (Inline preview). |
| `GET /api/v1/deliverables/{id}/download` | Cả hai | Path param `{id}` | Tải file đính kèm về thiết bị cá nhân (bảo vệ quyền truy cập theo token). |

---

### 6.3. Nhóm API Khiếu nại & Tranh chấp (`/api/v1/disputes`)

| Phương thức & Endpoint | Quyền gọi (Actor) | Dữ liệu đầu vào (Payload) | Mô tả tóm tắt |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/disputes` | Creator / Freelancer | JSON: `{ "milestoneId": 1, "reason": "...", "evidence": "..." }` | Báo cáo vi phạm / mở khiếu nại. Lập tức đóng băng tiền (`FROZEN`) và dừng mọi luồng tự động. |
| `POST /api/v1/disputes/{id}/counter-evidence` | Bên bị khiếu nại | JSON: `{ "counterEvidence": "..." }` | Gửi văn bản và tài liệu đối chứng cho khiếu nại. |
| `POST /api/v1/disputes/{id}/resolve` | **Chỉ Admin** | JSON: `{ "result": "RELEASE_TO_FREELANCER" \| "REFUND_TO_CREATOR" \| "SPLIT", "splitPercent": 60.0, "resolution": "..." }` | Admin ra quyết định phân xử, tự động chia tiền hoặc hoàn tiền theo phán quyết. |
| `GET /api/v1/disputes/{id}` | Các bên liên quan | Path param `{id}` | Xem chi tiết tiến trình giải quyết tranh chấp. |

---

### 6.4. Nhóm API Đánh giá Giai đoạn (`/api/v1/milestones/{id}/reviews`)

| Phương thức & Endpoint | Quyền gọi (Actor) | Dữ liệu đầu vào (Payload) | Mô tả tóm tắt |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/milestones/{milestoneId}/reviews` | Cả hai | JSON: `{ "rating": 5, "comment": "Tốt" }` | Đánh giá đối phương (1 đến 5 sao) sau khi milestone đã `APPROVED` hoặc `RELEASED`. |
| `GET /api/v1/milestones/{milestoneId}/reviews` | Cả hai | Path param `{milestoneId}` | Xem các đánh giá của một milestone. |

---

## 7. BẢNG THAM SỐ CẤU HÌNH & QUY TẮC NGHIỆP VỤ CỐT LÕI

| Tham số / Quy tắc | Giá trị mặc định | Giải thích nghiệp vụ |
| :--- | :--- | :--- |
| **Số milestone mỗi hợp đồng** | Tối đa 5 giai đoạn | Một công việc không được chia quá 5 giai đoạn để tránh phân mảnh giao dịch. |
| **Thời hạn ký quỹ (`fundHours`)** | **48 giờ** | Creator có 48h để nạp tiền cho mỗi giai đoạn khi đến lượt. Quá hạn M1 sẽ bị hủy hợp đồng. |
| **Tạm dừng tối đa giữa các giai đoạn** | **7 ngày** | Nếu xong M1 mà Creator không ký quỹ M2, sau 7 ngày hệ thống sẽ tự hủy hợp đồng. |
| **Thời hạn thẩm định bài (`reviewDays`)** | **3 ngày** | Sau khi Freelancer nộp bài, nếu Creator không phản hồi trong 3 ngày, hệ thống tự động duyệt (`Auto-Approve`). |
| **Thời gian giữ tiền an toàn (`releaseHoldDays`)** | **3 ngày** | Sau khi duyệt, tiền chưa được rút ngay mà nằm chờ 3 ngày để bảo vệ các bên trước khiếu nại/gian lận. |
| **Số lần yêu cầu sửa tối đa (`maxRevisions`)** | Mặc định **2 lần** | Hết 2 lần sửa, Creator không thể ấn "Yêu cầu sửa" được nữa, chỉ có thể chọn Duyệt hoặc Khiếu nại. |
| **Thời hạn sửa bài mỗi lần (`revisionDays`)** | **2 ngày** | Freelancer có 2 ngày để hoàn thành bản sửa sau khi nhận phản hồi từ Creator. |
| **Phí dịch vụ nền tảng (`platformFeePercent`)** | **5.0%** | Khấu trừ tự động vào khoản tiền mà Freelancer nhận được khi giải ngân. |
| **Nguyên tắc ký quỹ cuốn chiếu** | Tuần tự từng cái một | Không bắt Creator nạp 100% toàn bộ hợp đồng một lúc. Tiền chỉ ký quỹ cho giai đoạn đang làm; giai đoạn sau chỉ mở khi giai đoạn trước đã được duyệt. |
