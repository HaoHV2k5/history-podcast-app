# Câu hỏi cần gửi backend — Sử Ký mobile

Ngày 02/10/2026 · frontend Flutter tại `[local project] ki` · tên Sử Ký đang là tên prototype.

Bạn có thể gửi nguyên file này cho backend. Mỗi câu trả lời nên giữ mã Bxx, kèm ví dụ request/response hoặc link OpenAPI. Những tỷ lệ, giới hạn file và số tiền bên dưới đang là **đề xuất hoặc cấu hình demo**, chưa phải quyết định backend.

Tin nhắn ngắn để gửi:

> Mobile đã có giao diện và luồng thử cho người nghe, Creator và Narrator. Nhờ bên backend trả lời các mục B01–B10 trước, gửi Swagger/OpenAPI, URL staging và tài khoản giả cho từng vai trò. Đặc biệt cần chốt auth/OTP, upload ảnh và media, trạng thái nội dung, quyền phát/xem và cấu trúc lỗi. Các mục về thanh toán/hợp đồng cần cả người phụ trách nghiệp vụ xác nhận. Frontend chưa gọi API production.

## Ưu tiên trả lời trước để tích hợp

| Mã | Câu hỏi | Backend cần trả lại |
|---|---|---|
| B01 | Backend dùng REST hay cách khác? Đã có staging, OpenAPI/Postman và người phụ trách chưa? | Base URL, version API, spec và dữ liệu giả. Không gửi secret production trong tài liệu. |
| B02 | Đăng nhập bằng email, SĐT hay cả hai? Đăng ký có xác minh không? Access token/refresh token hết hạn và refresh/đăng xuất/thu hồi phiên như thế nào? | DTO login/register/me/refresh/logout; mã lỗi expired/revoked và trạng thái cần xác minh. |
| B03 | Một tài khoản có thể đồng thời Viewer/Creator/Narrator không? Ai cấp vai trò, KYC và duyệt hồ sơ có riêng theo vai trò không? | `userId`, roles, creator/narrator IDs, trạng thái KYC/hồ sơ và quyền thực tế. Hiện demo dùng chung thiết bị, chưa phải hệ thống tài khoản. |
| B04 | Quên mật khẩu OTP gửi email hay SMS? Có khác OTP đăng ký/KYC/ký thỏa thuận không? | Request challenge → verify → reset: challengeId, thời gian hết hạn, thời điểm cho resend, giới hạn sai mã, resetToken dùng một lần. Không chỉ trả `verified: true` để client tự quyết định. |
| B05 | Người dùng quên mật khẩu nhập mật khẩu mới/confirm sau xác thực OTP: yêu cầu độ dài/ký tự và xử lý phiên cũ thế nào? | Rule mật khẩu, field errors, token hết hạn/đã dùng, có logout các thiết bị khác không. UI đã tách OTP và mật khẩu thành hai màn. |
| B06 | Upload ảnh/audio/video qua multipart trực tiếp hay upload ticket/signed URL? Có upload tiếp từ chỗ dừng và hủy không? | Các bước tạo upload, tải bytes, xác nhận hoàn tất; assetId, trạng thái xử lý, MIME/size/checksum; lỗi quá dung lượng/sai định dạng. |
| B07 | Chốt avatar/ảnh kênh/cover audio/video tỷ lệ và giới hạn nào? Cho crop trên client hay server tạo nhiều biến thể? | Đề xuất hiện tại: avatar/kênh/audio 1:1, video 16:9. Demo nhận ảnh tĩnh JPEG/PNG/WebP ≤8 MB, ≥160px, ≤12 MP; thumbnail lưu nhỏ trên thiết bị. Cần xác nhận policy thật, HEIC, ảnh động, min resolution, kiểm file và quyền ảnh. |
| B08 | Chốt ID và trạng thái của bản thảo, bước AI, sản xuất, duyệt, phát hành. Client được gọi hành động nào ở mỗi bước? | Schema draft/version/jobs/review/episode; enum, `allowedActions`, revision/version chống ghi đè, reason/fieldErrors; phân biệt status nội dung với status job. |
| B09 | Có được đổi ảnh bìa/tên/nguồn sau khi gửi hoặc được duyệt không? Sửa gì cần duyệt lại? Gỡ rồi có được sửa/phát lại? | Policy metadata, version artifact, ai duyệt lại và state transitions. Hiện ảnh bìa khóa cùng nội dung; không tự nới quyền. |
| B10 | Khi đã có tập phát hành, API trả quyền xem và URL phát như thế nào? Audio/video được stream định dạng gì? | Episode/channel IDs, access public/member, media type, duration thật, chapters, URL hoặc playback ticket/expiry; CORS/Range và native streaming. Không dùng URL trả về làm bằng chứng đủ quyền. |

## Nội dung, người đọc và duyệt

| Mã | Câu hỏi | Backend cần trả lại |
|---|---|---|
| B11 | Tên kênh có duy nhất không? Có một hay nhiều kênh mỗi Creator? Đổi tên có giữ follower/member và URL không? | Channel ID ổn định, kiểm trùng tên, category IDs, slug và lỗi. Demo hiện có một kênh và nhiều chỗ dùng tên; cần chuyển sang ID khi nối API. |
| B12 | Script và nguồn tham khảo là text hay danh sách nguồn có cấu trúc? Giới hạn thật bao nhiêu? | Schema nguồn/title/author/url/page, giới hạn text, validation, autosave/version; mục bắt buộc lúc lưu nháp vs lúc gửi kiểm tra. |
| B13 | Text → audio/video và video upload → STT có job không? Nhận tiến độ bằng polling, SSE hay websocket? Có hủy/retry, trả preview và giữ bản cũ không? | Job ID/status/progress/error, artifact IDs, transcript, format, estimated duration nếu có, cách retry/idempotency. Frontend hiện chỉ diễn tập. |
| B14 | KYC nhận giấy tờ/liveness từ dịch vụ nào? Người từ 18 tuổi, dữ liệu cá nhân và lịch sử duyệt được kiểm/lưu/xóa thế nào? | KYC request/result/rejection codes, upload flow và quyền truy cập; form Creator/Narrator; policy dữ liệu cần nhóm nghiệp vụ xác nhận. |
| B15 | Hồ sơ Narrator gồm vùng/chất giọng/demo nào? Có sửa lại hồ sơ đã duyệt, duyệt lại và search/filter/pagination không? | Profile IDs/status/fields, demo asset/playback permission, search params và review actions. |
| B16 | Creator được mời Narrator cho những bản thảo nào? Thù lao là số VND hay text thương lượng? Deadline dùng múi giờ nào? | Contract/invitation DTO, amount integer + currency, UTC ISO 8601, quyền của mỗi bên, revision/counter và stale version errors. Demo hiện còn feeProposal dạng text. |
| B17 | Hai bên xác nhận thỏa thuận theo trình tự nào? OTP/PDF có phải chữ ký pháp lý hay chỉ xác nhận trong app? | Document/version/hash, signer identity/challenge, signature/consent audit, cancel/expiry; quyết định pháp lý từ người phụ trách. PDF/OTP 889900 trong app chỉ là mẫu. |
| B18 | Bàn giao → yêu cầu sửa → bàn giao lại → nghiệm thu có giới hạn và phiên bản thế nào? Phân xử, quá hạn và hủy do ai xử lý? | Delivery asset/version, revision notes, status/allowedActions, dispute record/evidence/result. Không giải ngân chỉ vì client bấm nút hoặc deadline đã qua. |

## Hội viên, ví và tương tác

| Mã | Câu hỏi | Backend cần trả lại |
|---|---|---|
| B19 | Hội viên đăng ký theo kênh hay toàn app? Giá/chu kỳ/gia hạn/hủy/hoàn tiền/chậm thanh toán là gì? | Plan IDs + pricing/currency, subscription status, activeUntil/cancelAt, checkout ticket; webhook là nguồn xác nhận thanh toán. Giá và policy chưa chốt. |
| B20 | Ví Creator/Narrator có tách không? Available/holding/escrow/processing được tính ở server và ghi sổ thế nào? | Ledger/balance/transaction IDs, integer money + currency, transaction/idempotency/version; lịch sử phân trang. Tránh cập nhật số dư độc lập ở client. |
| B21 | Chốt ngân hàng, tên chủ khớp KYC, min/max rút/phí/thời gian giữ/thời gian xử lý và yêu cầu song song. | Bank-link/withdraw DTO, field errors, trạng thái pending/succeeded/failed/refunded, reason, retry behavior. Ngưỡng demo 100.000đ và 6–19 chữ số không phải policy thật. |
| B22 | Like/dislike/comment/report có giới hạn, moderation và xóa/sửa không? Search, library/save/follow/history/queue sync theo tài khoản thế nào? | IDs/counts/version, pagination/cursors, comment ownership/report reasons, đồng bộ progress/rate/queue và conflict rules nhiều thiết bị. |
| B23 | Thông báo bằng push hay chỉ inbox? Khi bấm thông báo, target bị gỡ/mất quyền thì xử lý ra sao? | Notification IDs/unread/read cursor, typed target IDs, deep-link payload, push-device registration và denied/not-found fallback. |

## Quy ước dùng chung

| Mã | Câu hỏi | Backend cần trả lại |
|---|---|---|
| B24 | Có cấu trúc lỗi thống nhất cho form và thao tác không? | Ví dụ `code`, `message`, `fieldErrors`, `requestId`, `retryAfterSeconds` nếu bị giới hạn. HTTP 401/403/404/409/422/429 cần rõ nghĩa; thông báo không chứa lỗi nội bộ. |
| B25 | List pagination và job/network retry dùng quy ước nào? Thao tác tạo/upload/publish/withdraw/sign có idempotency key không? | Cursor/limit/nextCursor, UTC/timeouts, retryable flag, polling interval, optimistic concurrency và ví dụ request bị gửi lại. |
| B26 | Có tài khoản/dữ liệu staging cho public/member, pending/rejected KYC, profile cần sửa, job lỗi, hợp đồng hai bên và ví thất bại không? | Account giả cho từng role, reset/seed staging, asset có quyền dùng, bộ test success/error/permission. Không dùng giấy tờ hoặc tài khoản ngân hàng thật để test. |

## Mẫu câu trả lời

```text
B01: REST /v1, staging ...; OpenAPI ...; người phụ trách ...
B02: ...
B07: audio ...; video ...; avatar/kênh ...; kích thước ...; crop ...
B08: enum ...; cho phép hành động ...; version ...
B09: metadata sửa được ...; cần duyệt lại khi ...
Các mục chưa chốt: ...; người quyết định ...; thời điểm dự kiến ...
```

## File frontend để backend đối chiếu

| Phần | Code hiện có |
|---|---|
| Auth / reset | `lib/app_state.dart`, `lib/password_recovery.dart` |
| Ảnh / crop | `lib/artwork_state.dart`, `lib/artwork_editor.dart`, `lib/artwork_image.dart` |
| Creator / nội dung | `lib/creator_state.dart`, `lib/studio_pages.dart`, `lib/publication_page.dart` |
| Narrator / hợp tác | `lib/narrator_profile.dart`, `lib/narrator_state.dart`, `lib/narrator_pages.dart` |
| Thỏa thuận / ví | `lib/contract_terms.dart`, `lib/contract_pdf.dart`, `lib/wallet_state.dart`, `lib/wallet_page.dart` |
| Viewer / media / inbox | `lib/episode.dart`, `lib/app_state.dart`, `lib/audio_playback.dart`, `lib/video_surface.dart`, `lib/notification_page.dart` |

Các API/schema là những điều cần backend xác nhận, chưa phải contract được hai bên thống nhất. Admin web do nhóm khác làm; mobile không chứa công cụ admin production. Không sửa font/palette/player morph đã duyệt khi tích hợp API.
