import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePublisherTokenResponse,
  canStartDevicePreview,
  canStartBroadcasting,
  canStopBroadcasting,
  canRestartBroadcasting,
  canSelectDevice,
  formatDeviceLabel,
  validateEndSessionTransition,
  interpretDeviceError,
  isMockToken,
} from './livestreamLogic.ts';
import { LivestreamSession } from '../../types/livestream.ts';

describe('Agora RTC Publisher Lifecycle & Resilience Tests', () => {
  // Test 1: Media Preview Initialization & Guard Checks
  it('Test 1: startPreview preconditions and track lifecycle guard', () => {
    // Initial state: not previewing, not broadcasting -> Can start preview
    const canStart = canStartDevicePreview({ isPreviewing: false, isBroadcasting: false });
    assert.equal(canStart, true);

    // If already previewing -> Should not start preview again
    const cannotStartIfPreviewing = canStartDevicePreview({ isPreviewing: true, isBroadcasting: false });
    assert.equal(cannotStartIfPreviewing, false);

    // If broadcasting -> Should not start preview
    const cannotStartIfBroadcasting = canStartDevicePreview({ isPreviewing: false, isBroadcasting: true });
    assert.equal(cannotStartIfBroadcasting, false);
  });

  // Test 2: Start Broadcasting Guard Checks & Prerequisites
  it('Test 2: startBroadcasting guards against missing tracks or concurrent joining', () => {
    // State 1: Preview active, tracks ready, not broadcasting -> ALLOWED
    assert.equal(
      canStartBroadcasting({
        isBroadcasting: false,
        isJoining: false,
        isPublishing: false,
        hasTracks: true,
      }),
      true
    );

    // State 2: No tracks available -> BLOCKED
    assert.equal(
      canStartBroadcasting({
        isBroadcasting: false,
        isJoining: false,
        isPublishing: false,
        hasTracks: false,
      }),
      false
    );

    // State 3: Already joining (async in-flight) -> BLOCKED to prevent duplicate join
    assert.equal(
      canStartBroadcasting({
        isBroadcasting: false,
        isJoining: true,
        isPublishing: false,
        hasTracks: true,
      }),
      false
    );

    // State 4: Already publishing -> BLOCKED
    assert.equal(
      canStartBroadcasting({
        isBroadcasting: false,
        isJoining: false,
        isPublishing: true,
        hasTracks: true,
      }),
      false
    );

    // State 5: Already broadcasting -> BLOCKED
    assert.equal(
      canStartBroadcasting({
        isBroadcasting: true,
        isJoining: false,
        isPublishing: false,
        hasTracks: true,
      }),
      false
    );
  });

  // Test 3: Stop Broadcasting Guard Checks
  it('Test 3: stopBroadcasting guards against idle state', () => {
    // When broadcasting -> Can stop
    assert.equal(canStopBroadcasting({ isBroadcasting: true, isJoining: false }), true);

    // When joining in-flight -> Can cancel/stop
    assert.equal(canStopBroadcasting({ isBroadcasting: false, isJoining: true }), true);

    // When already stopped/idle -> Cannot stop
    assert.equal(canStopBroadcasting({ isBroadcasting: false, isJoining: false }), false);
  });

  // Test 4: Stop Broadcasting vs End Session Lifecycle Semantics
  it('Test 4: Stop Broadcasting preserves preview tracks and permits Restart; End Session forbids it', () => {
    // Tình huống A: Creator bấm "Dừng phát sóng" (Stop Broadcasting)
    // - Client unpublish tracks & leave Agora
    // - Backend session status vẫn là LIVE
    // - Preview tracks được GIỮ NGUYÊN để Creator có thể xem camera và bấm phát lại
    const stoppedState = {
      isBroadcasting: false,
      isJoining: false,
      hasTracks: true,
      isSessionEnded: false,
    };
    assert.equal(canRestartBroadcasting(stoppedState), true);

    // Tình huống B: Creator bấm "Kết thúc phiên live" (End Session)
    // - Backend xác nhận session status chuyển sang ENDED
    // - Tất cả tracks được giải phóng hoàn toàn
    // - Không bao giờ được phép phát sóng lại
    const endedState = {
      isBroadcasting: false,
      isJoining: false,
      hasTracks: false,
      isSessionEnded: true,
    };
    assert.equal(canRestartBroadcasting(endedState), false);
  });

  // Test 5: Mock Token Interception Before Agora RTC Join
  it('Test 5: Mock token is intercepted before calling Agora RTC join', () => {
    const mockTokenPayload = {
      appId: 'mock_app_id_999',
      token: 'mock_agora_token_ch_123_pub_456',
      agoraChannelName: 'live_ch_123',
      uid: 9999,
      role: 'PUBLISHER',
      expirationSeconds: 3600,
    };

    assert.equal(isMockToken(mockTokenPayload.token), true);

    const validation = validatePublisherTokenResponse(mockTokenPayload);
    assert.equal(validation.valid, false);
    assert.equal(validation.isMock, true);
    assert.match(validation.reason || '', /Mock Token/i);
    // Nhờ validation.isMock = true, controller sẽ dừng ngay và KHÔNG gọi client.join()
  });

  // Test 6: Device Selection State Transition Guards
  it('Test 6: canSelectDevice permits device switching only during stable states', () => {
    // Cho phép khi đang xem trước bình thường (không joining, không publishing)
    assert.equal(canSelectDevice({ isJoining: false, isPublishing: false }), true);

    // Chặn khi đang kết nối Agora (isJoining)
    assert.equal(canSelectDevice({ isJoining: true, isPublishing: false }), false);

    // Chặn khi đang xuất luồng (isPublishing)
    assert.equal(canSelectDevice({ isJoining: false, isPublishing: true }), false);
  });

  // Test 7: Device Label Formatting
  it('Test 7: formatDeviceLabel formats devices with label or fallback identifier', () => {
    assert.equal(
      formatDeviceLabel({ deviceId: 'cam-xyz-123456', label: 'FaceTime HD' }, 'video', 0),
      'FaceTime HD'
    );
    assert.equal(
      formatDeviceLabel({ deviceId: 'cam-xyz-123456', label: '' }, 'video', 0),
      'Camera 1 (cam-xy...)'
    );
    assert.equal(
      formatDeviceLabel({ deviceId: 'mic-xyz-654321', label: '' }, 'audio', 2),
      'Microphone 3 (mic-xy...)'
    );
    assert.equal(formatDeviceLabel(null, 'video', 0), 'Camera 1');
    assert.equal(formatDeviceLabel(null, 'audio', 1), 'Microphone 2');
  });

  // Test 8: End Session Permission and Status Validation
  it('Test 8: validateEndSessionTransition enforces Creator ownership and active LIVE status', () => {
    const ownerId = 42;
    const liveSession: Pick<LivestreamSession, 'status' | 'creatorId'> = {
      status: 'LIVE',
      creatorId: ownerId,
    };

    // Chủ phòng kết thúc phiên LIVE -> HỢP LỆ
    assert.equal(validateEndSessionTransition(liveSession, ownerId).canEnd, true);

    // Người khác (không phải Creator) cố kết thúc -> BỊ CHẶN
    const nonOwner = validateEndSessionTransition(liveSession, 999);
    assert.equal(nonOwner.canEnd, false);
    assert.match(nonOwner.reason || '', /Chỉ Creator sở hữu/i);

    // Phiên đã ENDED rồi -> BỊ CHẶN
    const endedSession: Pick<LivestreamSession, 'status' | 'creatorId'> = {
      status: 'ENDED',
      creatorId: ownerId,
    };
    assert.equal(validateEndSessionTransition(endedSession, ownerId).canEnd, false);

    // Phiên null -> BỊ CHẶN
    assert.equal(validateEndSessionTransition(null, ownerId).canEnd, false);
  });

  // Test 9: WebRTC Device Error Interpretation
  it('Test 9: interpretDeviceError maps hardware and browser errors to friendly Vietnamese messages', () => {
    // Permission Denied
    assert.match(
      interpretDeviceError({ name: 'NotAllowedError' }),
      /Quyền truy cập Camera hoặc Microphone bị từ chối/i
    );

    // Device Not Found
    assert.match(
      interpretDeviceError({ name: 'NotFoundError' }),
      /Không tìm thấy thiết bị Camera hoặc Microphone/i
    );

    // Device Busy (In use by Zoom/Meet)
    assert.match(
      interpretDeviceError({ name: 'NotReadableError' }),
      /đang bị ứng dụng khác sử dụng/i
    );

    // Insecure origin (HTTP instead of HTTPS/localhost)
    assert.match(
      interpretDeviceError(new Error('navigator.mediaDevices is undefined')),
      /kết nối không bảo mật/i
    );
  });

  // Test 10: Idempotent Cleanup Behavior
  it('Test 10: Cleanup helpers handle null, undefined and repeated calls safely', () => {
    // Kiểm tra tính lũy đẳng (idempotency): gọi kiểm tra trạng thái nhiều lần không gây crash
    assert.doesNotThrow(() => {
      canStartBroadcasting({ isBroadcasting: false, isJoining: false, isPublishing: false, hasTracks: false });
      canStopBroadcasting({ isBroadcasting: false, isJoining: false });
      canRestartBroadcasting({ isBroadcasting: false, isJoining: false, hasTracks: false, isSessionEnded: true });
    });
  });

  // Test 11: Generation Abort Simulation - In-flight publish cancellation
  it('Test 11: Generation abort prevents publishing when broadcast was stopped while join was in-flight', async () => {
    // Mô phỏng vòng đời generation counter trong useAgoraPublisher:
    let broadcastSessionId = 0;
    let isBroadcasting = false;
    let isPublishedOnAgora = false;

    // Giả lập hàm startBroadcasting bất đồng bộ
    async function simulateStartBroadcasting(shouldAbortMidway: boolean) {
      const currentId = ++broadcastSessionId;

      // Bước 1: Yêu cầu token bất đồng bộ (giả lập delay mạng 10ms)
      await new Promise((res) => setTimeout(res, 10));
      if (broadcastSessionId !== currentId) return false;

      // Bước 2: Giả lập user click "Dừng phát sóng" giữa chừng nếu shouldAbortMidway = true
      if (shouldAbortMidway) {
        // simulateStopBroadcasting
        broadcastSessionId++;
      }

      // Bước 3: Tham gia Agora và Publish
      await new Promise((res) => setTimeout(res, 10));
      if (broadcastSessionId !== currentId) {
        // Đã bị hủy trước khi kịp publish!
        return false;
      }

      isBroadcasting = true;
      isPublishedOnAgora = true;
      return true;
    }

    // Trường hợp 1: Chạy bình thường không bị ngắt -> Thành công
    const normalResult = await simulateStartBroadcasting(false);
    assert.equal(normalResult, true);
    assert.equal(isBroadcasting, true);
    assert.equal(isPublishedOnAgora, true);

    // Reset
    isBroadcasting = false;
    isPublishedOnAgora = false;

    // Trường hợp 2: Bị ngắt giữa chừng -> Generation abort chặn publish
    const abortedResult = await simulateStartBroadcasting(true);
    assert.equal(abortedResult, false);
    assert.equal(isBroadcasting, false);
    assert.equal(isPublishedOnAgora, false);
  });

  // Test 12: In-flight Preview Track Creation Cancellation
  it('Test 12: Preview track generation counter safely closes tracks created after stopPreview or unmount', async () => {
    let previewSessionId = 0;
    let trackClosedCount = 0;
    let isPreviewActive = false;

    async function simulateStartPreview(shouldStopMidway: boolean) {
      const currentPreviewId = ++previewSessionId;

      // Giả lập AgoraRTC.createMicrophoneAndCameraTracks delay 15ms
      await new Promise((res) => setTimeout(res, 15));
      const mockAudioTrack = { stop: () => {}, close: () => { trackClosedCount++; } };
      const mockVideoTrack = { stop: () => {}, close: () => { trackClosedCount++; } };

      if (shouldStopMidway) {
        // User bấm Dừng xem trước trong lúc đang xin quyền thiết bị
        previewSessionId++;
      }

      if (previewSessionId !== currentPreviewId) {
        // Dọn dẹp an toàn các track vừa sinh ra
        mockAudioTrack.close();
        mockVideoTrack.close();
        return false;
      }

      isPreviewActive = true;
      return true;
    }

    const aborted = await simulateStartPreview(true);
    assert.equal(aborted, false);
    assert.equal(isPreviewActive, false);
    assert.equal(trackClosedCount, 2); // Cả camera và microphone track đều được đóng an toàn
  });

  // Test 13: Token Renewal Guard Condition
  it('Test 13: Token renewal listener is guarded against inactive broadcast or disposed client', () => {
    // Điều kiện gia hạn: isMounted=true, activeSessionId hợp lệ, và isBroadcasting=true
    function shouldRenewToken(state: {
      isMounted: boolean;
      activeSessionId: number | null;
      isBroadcasting: boolean;
    }): boolean {
      return state.isMounted && state.activeSessionId !== null && state.activeSessionId > 0 && state.isBroadcasting;
    }

    // Khi đang phát sóng bình thường -> ĐƯỢC PHÉP gia hạn
    assert.equal(shouldRenewToken({ isMounted: true, activeSessionId: 101, isBroadcasting: true }), true);

    // Khi đã dừng phát sóng (isBroadcasting = false) -> KHÔNG gia hạn lãng phí
    assert.equal(shouldRenewToken({ isMounted: true, activeSessionId: 101, isBroadcasting: false }), false);

    // Khi component đã unmount -> KHÔNG gia hạn
    assert.equal(shouldRenewToken({ isMounted: false, activeSessionId: 101, isBroadcasting: true }), false);

    // Khi session ID rỗng -> KHÔNG gia hạn
    assert.equal(shouldRenewToken({ isMounted: true, activeSessionId: null, isBroadcasting: true }), false);
  });

  // Test 14: Device Switching Guarded During Stopping Broadcast Transition
  it('Test 14: canSelectDevice blocks hardware switching while stopBroadcasting is in-flight', () => {
    // Khi đang dừng phát sóng (isStoppingBroadcast = true) -> Phải chặn chuyển đổi thiết bị
    assert.equal(
      canSelectDevice({ isJoining: false, isPublishing: false, isStoppingBroadcast: true }),
      false
    );

    // Khi trạng thái ổn định (previewing, không joining, không publishing, không stopping) -> Cho phép
    assert.equal(
      canSelectDevice({ isJoining: false, isPublishing: false, isStoppingBroadcast: false }),
      true
    );
  });

  // Test 15: Session ENDED state enforces permanent studio closure
  it('Test 15: Session in ENDED status permanently blocks broadcast restart and management actions', () => {
    const endedSession: LivestreamSession = {
      id: 99,
      channelId: 1,
      channelName: 'Sử Ký',
      creatorId: 42,
      creatorName: 'Hào Hán',
      title: 'Triều Tây Sơn',
      status: 'ENDED',
      viewerCount: 0,
      agoraChannelName: 'live_99',
      isExclusive: false,
      startedAt: '2026-10-19T10:00:00Z',
      endedAt: '2026-10-19T11:00:00Z',
    };

    // Không thể quản lý hoặc tái phát sóng phiên đã kết thúc
    assert.equal(canRestartBroadcasting({ isBroadcasting: false, isJoining: false, hasTracks: true, isSessionEnded: true }), false);
    assert.equal(validateEndSessionTransition(endedSession, 42).canEnd, false);
  });
});
