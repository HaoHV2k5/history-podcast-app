# Hướng Dẫn Tích Hợp Livestream (Agora RTC) Cho Web & Mobile

> **Dự án**: PRM - Sử Ký Podcast
> **Backend Service**: `com.prm.livestream` (`/api/v1/livestreams`)
> **Agora Technology**: Agora RTC (Web SDK v4.x / Flutter SDK v6.x)
> **Phạm vi phân hệ (Scope)**:
>
> - **Web FE**: **Chỉ dành cho Creator Studio** (Tạo phòng, phát sóng qua webcam/micro, xem chat, kết thúc).
> - **Mobile App**: **Đầy đủ 2 chiều** (Creator phát sóng bằng camera điện thoại + Khán giả xem stream, chat, kiểm tra VIP Membership).

---

## 1. Tổng quan luồng hoạt động (Architecture Flow)

```
[Web / Mobile: Creator]                   [Spring Boot Backend]                 [Mobile: Khán giả]
        |                                          |                                     |
 1. POST /api/v1/livestreams --------------------> |                                     |
    (channelId, title, isExclusive)                |                                     |
        | <-- 201 Created (id, agoraChannel)       |                                     |
        |                                          |                                     |
 2. POST /{id}/join -----------------------------> | <------ 2. POST /{id}/join ---------|
        | <-- Token (Role: PUBLISHER, uid)         |         <-- Token (Role: SUBSCRIBER)|
        |                                          |         (Báo lỗi 403 nếu VIP)       |
        |                                          |                                     |
        | ======= 3. Publish Stream =============> |                                     |
        |          (Camera/Mic -> Agora SD-RTN)    | ======= 3. Subscribe Stream ======> |
        |                                          |          (Xem Host trên Agora)      |
        |                                          |                                     |
        | <------ 4. Live Chat API: GET/POST /chats (Polling mỗi 2-3s) ----------------> |
        |                                          |                                     |
 5. POST /{id}/end ------------------------------> | ======> Host rời phòng / Kết thúc ==|
```

---

## 2. Đặc tả API Backend (`/api/v1/livestreams`)

> Mã nguồn backend đã được kiểm chứng tại:
>
> - Controller: `backend/src/main/java/com/prm/livestream/controller/LivestreamController.java`
> - Service: `backend/src/main/java/com/prm/livestream/service/impl/LivestreamServiceImpl.java`
> - Token Builder: `backend/src/main/java/com/prm/livestream/util/AgoraTokenUtil.java`

Tất cả các endpoint đều yêu cầu xác thực Bearer Token (Trên Web đã được `apiClient` tại `web/src/services/api/client.ts` tự động chèn).

### 2.1. Bảng API Endpoints

| Method | Endpoint                         | Quyền hạn     | Mục đích & Dữ liệu                                                                                                                                                |
| :----- | :------------------------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/livestreams`            | `CREATOR`     | **Tạo phiên live**<br>Body: `{ channelId, title, description, thumbnailUrl, isExclusive }`<br>Trả về: `id` (Session ID), `agoraChannelName`, `status: "LIVE"` |
| `GET`  | `/api/v1/livestreams`            | Public / User | **Lấy danh sách phiên live**<br>Params: `status=LIVE`, `channelId`, `page`, `size`                                                                                |
| `GET`  | `/api/v1/livestreams/{id}`       | Public / User | **Xem chi tiết phiên live** (thông tin kênh, số mắt xem, creator)                                                                                                 |
| `POST` | `/api/v1/livestreams/{id}/join`  | Authenticated | **Lấy Token Agora RTC**<br>Param: `?clientUid=...` (số int tránh conflict khi test)<br>Trả về: `{ appId, token, agoraChannelName, uid, role, expirationSeconds }` |
| `POST` | `/api/v1/livestreams/{id}/end`   | `CREATOR`     | **Kết thúc phiên live** (Chuyển `status` thành `ENDED`)                                                                                                           |
| `POST` | `/api/v1/livestreams/{id}/chats` | Authenticated | **Gửi chat**<br>Body: `{ author, role, text }`                                                                                                                    |
| `GET`  | `/api/v1/livestreams/{id}/chats` | Authenticated | **Lấy chat mới**<br>Param: `?since={timestampMillis}`                                                                                                             |

### 2.2. Mã lỗi nghiệp vụ (Error Codes)

- `LIVE_4001`: Không tìm thấy phiên livestream.
- `LIVE_4002`: Phiên livestream đã kết thúc (`ENDED`).
- `LIVE_4003` (`LIVESTREAM_MEMBER_REQUIRED` - 403): **Phòng độc quyền hội viên VIP**. Mobile cần bắt mã lỗi này để hiển thị BottomSheet nâng cấp Membership cho khán giả.
- `ERR_1004` (403): Không phải chủ sở hữu của kênh để tạo hoặc kết thúc live.

---

## 3. Tích hợp Frontend Web (Chỉ Creator Studio)

Vị trí đề xuất trên Web: Thêm route `/creator/livestream` vào `web/src/routes/index.tsx` (thuộc `CreatorLayout`).

### 3.1. Cài đặt thư viện

```bash
cd web
npm install agora-rtc-sdk-ng
```

### 3.2. Luồng tích hợp phía Creator trên Web

1. Creator bấm "Bắt đầu Livestream" -> Gọi `POST /api/v1/livestreams` để tạo phòng.
2. Gọi `POST /api/v1/livestreams/{id}/join` -> Nhận `LivestreamTokenResponse` (role: `PUBLISHER`).
3. Khởi tạo Agora RTC Client, cấp quyền và phát sóng Webcam/Microphone.
4. Gọi `POST /api/v1/livestreams/{id}/end` khi bấm "Kết thúc Live".

### 3.3. Đoạn mã tích hợp cốt lõi (TypeScript)

```typescript
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { apiClient } from "@/services/api/client";

const client: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "live",
  codec: "vp8",
});
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;

// 1. Gia nhập & Phát sóng (Host)
export async function startBroadcast(
  tokenData: {
    appId: string;
    token: string;
    agoraChannelName: string;
    uid: number;
  },
  domElementId: string,
) {
  // Gán role Broadcaster/Host
  await client.setClientRole("host");

  // Join channel với token từ backend
  await client.join(
    tokenData.appId,
    tokenData.agoraChannelName,
    tokenData.token,
    tokenData.uid,
  );

  // Khởi tạo track Mic & Camera
  [localAudioTrack, localVideoTrack] =
    await AgoraRTC.createMicrophoneAndCameraTracks(
      {},
      { encoderConfig: "720p_1" }, // 720p 30fps
    );

  // Publish lên Agora SD-RTN
  await client.publish([localAudioTrack, localVideoTrack]);

  // Hiển thị camera của Host lên thẻ div DOM
  localVideoTrack.play(domElementId);
}

// 2. Mute/Unmute Mic & Bật/Tắt Cam
export async function toggleMic(isMuted: boolean) {
  if (localAudioTrack) await localAudioTrack.setEnabled(!isMuted);
}

export async function toggleCam(isCamOff: boolean) {
  if (localVideoTrack) await localVideoTrack.setEnabled(!isCamOff);
}

// 3. Kết thúc & Dọn dẹp
export async function stopBroadcast(sessionId: number) {
  localAudioTrack?.stop();
  localAudioTrack?.close();
  localVideoTrack?.stop();
  localVideoTrack?.close();

  await client.leave();
  await apiClient.post(`/api/v1/livestreams/${sessionId}/end`);
}
```

---

## 4. Tích hợp Mobile App (Flutter - Đầy đủ Creator & Viewer)

### 4.1. Thư viện & Cấu hình Native

Thêm vào `mobile/mobile-production/pubspec.yaml`:

```yaml
dependencies:
  agora_rtc_engine: ^6.3.0
  permission_handler: ^11.3.1
```

- **Android** (`android/app/src/main/AndroidManifest.xml`): Thêm quyền `CAMERA`, `RECORD_AUDIO`, `INTERNET`, `BLUETOOTH_CONNECT`.
- **iOS** (`ios/Runner/Info.plist`): Thêm mô tả `NSCameraUsageDescription` và `NSMicrophoneUsageDescription`.

---

### 4.2. Luồng tích hợp Creator trên Mobile (Host)

```dart
// 1. Xin quyền runtime
await [Permission.camera, Permission.microphone].request();

// 2. Khởi tạo RtcEngine
final engine = createAgoraRtcEngine();
await engine.initialize(RtcEngineContext(
  appId: tokenData.appId,
  channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
));

// 3. Thiết lập vai trò BROADCASTER & preview
await engine.enableVideo();
await engine.setClientRole(role: ClientRoleType.clientRoleBroadcaster);
await engine.startPreview();

// 4. Join channel
await engine.joinChannel(
  token: tokenData.token,
  channelId: tokenData.agoraChannelName,
  uid: tokenData.uid,
  options: const ChannelMediaOptions(
    clientRoleType: ClientRoleType.clientRoleBroadcaster,
    publishCameraTrack: true,
    publishMicrophoneTrack: true,
  ),
);

// 5. Render Video Host trên Flutter Widget:
AgoraVideoView(
  controller: VideoViewController(
    rtcEngine: engine,
    canvas: const VideoCanvas(uid: 0), // 0: Local preview
  ),
);

// Điều khiển nhanh:
// - Đổi camera: engine.switchCamera();
// - Mute mic: engine.muteLocalAudioStream(true);
```

---

### 4.3. Luồng tích hợp Khán giả trên Mobile (Viewer)

```dart
// 1. Gọi POST /api/v1/livestreams/{id}/join
// => Bắt lỗi LIVE_4003: Nếu phòng VIP mà chưa mua gói -> Mở BottomSheet mua Membership.

// 2. Khởi tạo Engine vai trò AUDIENCE
final engine = createAgoraRtcEngine();
await engine.initialize(RtcEngineContext(
  appId: tokenData.appId,
  channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
));

int? remoteHostUid;

engine.registerEventHandler(RtcEngineEventHandler(
  onUserJoined: (connection, remoteUid, elapsed) {
    setState(() => remoteHostUid = remoteUid);
  },
  onUserOffline: (connection, remoteUid, reason) {
    if (remoteHostUid == remoteUid) {
      setState(() => remoteHostUid = null);
      // Hiển thị thông báo Host đã kết thúc buổi live
    }
  },
));

await engine.enableVideo();
await engine.setClientRole(role: ClientRoleType.clientRoleAudience);

// 3. Tham gia xem luồng
await engine.joinChannel(
  token: tokenData.token,
  channelId: tokenData.agoraChannelName,
  uid: tokenData.uid,
  options: const ChannelMediaOptions(
    clientRoleType: ClientRoleType.clientRoleAudience,
    autoSubscribeAudio: true,
    autoSubscribeVideo: true,
  ),
);

// 4. Render Video của Host:
if (remoteHostUid != null) {
  AgoraVideoView(
    controller: VideoViewController.remote(
      rtcEngine: engine,
      canvas: VideoCanvas(uid: remoteHostUid),
      connection: RtcConnection(channelId: tokenData.agoraChannelName),
    ),
  );
}
```

---

### 4.4. Đồng bộ Live Chat

- **Gửi chat**: Gọi `POST /api/v1/livestreams/{id}/chats` với `{ "author": userName, "role": "viewer", "text": content }`.
- **Nhận chat**: Gọi `GET /api/v1/livestreams/{id}/chats?since={lastTimestamp}` theo chu kỳ Timer mỗi 2 giây, cập nhật tin nhắn vào danh sách cuộn.
- **Thoát phòng**: Luôn gọi `engine.leaveChannel()` và `engine.release()` trong hàm `dispose()` để tránh rò rỉ bộ nhớ & camera.

---

## 5. Lưu ý quan trọng khi triển khai (Gotchas)

1. **Tránh lỗi UID Conflict khi test**:
   - Nếu dùng chung 1 tài khoản test trên cả Web và Mobile cùng lúc, hãy truyền query `?clientUid=99999` (số ngẫu nhiên) khi gọi `/join` để Backend tạo Agora Token với UID riêng biệt, tránh bị Agora ngắt kết nối lẫn nhau.
2. **Xử lý phòng VIP (`LIVE_4003`)**:
   - Khi API `/join` trả về mã lỗi `LIVE_4003`, Mobile không khởi tạo Agora mà mở ngay popup mời mua gói Hội viên kênh.
3. **Chính sách Autoplay trên Web**:
   - Trình duyệt Chrome/Safari chặn autoplay âm thanh nếu người dùng chưa tương tác. Luôn yêu cầu Creator bấm nút "Bắt đầu phát sóng" trước khi gọi hàm `.play()`.
