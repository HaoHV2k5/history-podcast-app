import { useState, useRef, useEffect, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ConnectionState,
} from 'agora-rtc-sdk-ng';
import { livestreamApi } from '@/services/api/livestream';
import {
  validatePublisherTokenResponse,
  interpretDeviceError,
  canStartDevicePreview,
  canStartBroadcasting,
  canStopBroadcasting,
  canSelectDevice,
} from '../livestreamLogic';

export interface UseAgoraPublisherReturn {
  // Preview states
  isPreviewing: boolean;
  isStartingPreview: boolean;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  localVideoRef: React.RefObject<HTMLDivElement>;

  // Device Selection & Enumeration
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  selectedCameraId: string;
  selectedMicrophoneId: string;
  isDeviceSwitching: boolean;
  switchCamera: (deviceId: string) => Promise<boolean>;
  switchMicrophone: (deviceId: string) => Promise<boolean>;
  refreshDevices: () => Promise<void>;

  // Connection & Broadcast states
  connectionState: ConnectionState | 'DISCONNECTED';
  isJoining: boolean;
  isPublishing: boolean;
  isBroadcasting: boolean;
  isStoppingBroadcast: boolean;
  broadcastSeconds: number;

  // Diagnostics & Errors
  error: string | null;
  isMockTokenDetected: boolean;
  agoraChannelName: string | null;

  // Actions
  startPreview: () => Promise<boolean>;
  stopPreview: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  startBroadcasting: (sessionId: number) => Promise<boolean>;
  stopBroadcasting: () => Promise<void>;
  clearError: () => void;
}

export function useAgoraPublisher(): UseAgoraPublisherReturn {
  // Stable DOM ref for video element
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Agora client & track refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  // Active session and device refs
  const activeSessionIdRef = useRef<number | null>(null);
  const selectedCameraIdRef = useRef<string>('');
  const selectedMicrophoneIdRef = useRef<string>('');

  // In-flight operation locks to prevent duplicate rapid clicks
  const isMountedRef = useRef<boolean>(true);
  const isStartingPreviewRef = useRef<boolean>(false);
  const isStoppingPreviewRef = useRef<boolean>(false);
  const isStartingBroadcastRef = useRef<boolean>(false);
  const isStoppingBroadcastRef = useRef<boolean>(false);
  const isDeviceSwitchingRef = useRef<boolean>(false);
  const isBroadcastingRef = useRef<boolean>(false);
  const broadcastSessionIdRef = useRef<number>(0);
  const previewSessionIdRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preview States
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isStartingPreview, setIsStartingPreview] = useState<boolean>(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);

  // Device List & Active Devices
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');
  const [isDeviceSwitching, setIsDeviceSwitching] = useState<boolean>(false);

  // Broadcast & Connection States
  const [connectionState, setConnectionState] = useState<ConnectionState | 'DISCONNECTED'>(
    'DISCONNECTED'
  );
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [isStoppingBroadcast, setIsStoppingBroadcast] = useState<boolean>(false);
  const [broadcastSeconds, setBroadcastSeconds] = useState<number>(0);

  // Diagnostics & Error Feedback
  const [error, setError] = useState<string | null>(null);
  const [isMockTokenDetected, setIsMockTokenDetected] = useState<boolean>(false);
  const [agoraChannelName, setAgoraChannelName] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sync state with refs for event callbacks
  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

  useEffect(() => {
    selectedMicrophoneIdRef.current = selectedMicrophoneId;
  }, [selectedMicrophoneId]);

  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);

  /**
   * Truy vấn danh sách thiết bị phần cứng khả dụng (Camera & Mic)
   */
  const refreshDevices = useCallback(async () => {
    try {
      const cams = await AgoraRTC.getCameras();
      const mics = await AgoraRTC.getMicrophones();
      if (isMountedRef.current) {
        setCameras(cams);
        setMicrophones(mics);
      }
    } catch (err) {
      console.warn('[Agora RTC] Lỗi truy vấn danh sách thiết bị:', err);
    }
  }, []);

  /**
   * Khởi tạo hoặc lấy instance Agora RTC Client với các event listener hồi phục mạng
   */
  const getOrCreateClient = useCallback((): IAgoraRTCClient => {
    if (!clientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

      // Theo dõi biến động trạng thái kết nối WebRTC
      client.on('connection-state-change', (curState, revState) => {
        if (!isMountedRef.current) return;
        console.log(`[Agora RTC] Trạng thái kết nối thay đổi: ${revState} -> ${curState}`);
        setConnectionState(curState);

        if (curState === 'CONNECTED') {
          // Kết nối thành công hoặc vừa hồi phục sau gián đoạn
          setError(null);
        } else if (
          curState === 'DISCONNECTED' &&
          (revState === 'CONNECTING' || revState === 'RECONNECTING')
        ) {
          setError('Mất kết nối tới máy chủ Agora RTC. Vui lòng kiểm tra đường truyền và thử phát lại.');
        }
      });

      // Tự động gia hạn Token khi sắp hết hạn (30 giây trước khi hết hạn)
      client.on('token-privilege-will-expire', async () => {
        if (!isMountedRef.current || !activeSessionIdRef.current || !isBroadcastingRef.current) return;
        console.log('[Agora RTC] Token sắp hết hạn, tự động làm mới token...');
        try {
          const res = await livestreamApi.getJoinToken(activeSessionIdRef.current);
          if (res?.data?.token && clientRef.current && isMountedRef.current && isBroadcastingRef.current) {
            await clientRef.current.renewToken(res.data.token);
            console.log('[Agora RTC] Gia hạn Token Agora thành công.');
          }
        } catch (renewErr) {
          console.error('[Agora RTC] Thất bại khi tự động gia hạn token:', renewErr);
        }
      });

      // Báo lỗi khi token đã hết hạn hoàn toàn
      client.on('token-privilege-did-expire', () => {
        if (!isMountedRef.current) return;
        setError('Phiên kết nối Agora đã hết hạn Token xác thực. Vui lòng kết nối lại.');
        setIsBroadcasting(false);
        setIsPublishing(false);
        setConnectionState('DISCONNECTED');
      });

      client.on('exception', (event) => {
        if (!isMountedRef.current) return;
        console.warn('[Agora RTC Exception]', event);
      });

      clientRef.current = client;
    }
    return clientRef.current;
  }, []);

  /**
   * 1. Bật xem trước thiết bị (Start Preview)
   */
  const startPreview = useCallback(async (): Promise<boolean> => {
    if (!canStartDevicePreview({ isPreviewing, isBroadcasting })) {
      return false;
    }

    if (isStartingPreviewRef.current) {
      return false;
    }
    const currentPreviewId = ++previewSessionIdRef.current;
    isStartingPreviewRef.current = true;
    setIsStartingPreview(true);

    try {
      setError(null);

      // Giải phóng an toàn các track cũ nếu có
      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
          videoTrackRef.current.close();
        } catch {
          /* ignore track release error */
        }
        videoTrackRef.current = null;
      }
      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
          audioTrackRef.current.close();
        } catch {
          /* ignore track release error */
        }
        audioTrackRef.current = null;
      }

      // Khởi tạo camera và microphone tracks theo thiết bị được chỉ định (nếu có)
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          microphoneId: selectedMicrophoneIdRef.current || undefined,
          encoderConfig: 'speech_standard',
          AEC: true,
          ANS: true,
        },
        {
          cameraId: selectedCameraIdRef.current || undefined,
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrateMax: 1500,
          },
        }
      );

      if (!isMountedRef.current || previewSessionIdRef.current !== currentPreviewId) {
        audioTrack.stop();
        audioTrack.close();
        videoTrack.stop();
        videoTrack.close();
        return false;
      }

      audioTrackRef.current = audioTrack;
      videoTrackRef.current = videoTrack;

      // Cập nhật ID thiết bị đang sử dụng thực tế
      const curCamId = videoTrack.getTrackLabel();
      if (curCamId && !selectedCameraIdRef.current) {
        setSelectedCameraId(curCamId);
      }

      // Phát video cục bộ lên khung xem trước
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      setIsPreviewing(true);
      setIsCameraEnabled(true);
      setIsMicEnabled(true);

      // Cập nhật danh sách thiết bị có nhãn sau khi đã được cấp quyền
      await refreshDevices();
      return true;
    } catch (err: unknown) {
      if (!isMountedRef.current) return false;
      const friendlyError = interpretDeviceError(err);
      setError(friendlyError);
      return false;
    } finally {
      isStartingPreviewRef.current = false;
      if (isMountedRef.current) {
        setIsStartingPreview(false);
      }
    }
  }, [isPreviewing, isBroadcasting, refreshDevices]);

  /**
   * 2. Dừng phát sóng (Stop Broadcasting) mà KHÔNG kết thúc phiên backend
   * Duy trì local preview tracks theo đúng chính sách vòng đời.
   */
  const stopBroadcasting = useCallback(async () => {
    if (!canStopBroadcasting({ isBroadcasting, isJoining })) {
      return;
    }

    // Invalidate any in-flight broadcast initiation
    broadcastSessionIdRef.current++;
    isStartingBroadcastRef.current = false;
    isBroadcastingRef.current = false;

    if (isStoppingBroadcastRef.current) {
      return;
    }
    isStoppingBroadcastRef.current = true;
    setIsStoppingBroadcast(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const client = clientRef.current;
      if (client) {
        const tracksToUnpublish: (ICameraVideoTrack | IMicrophoneAudioTrack)[] = [];
        if (audioTrackRef.current) tracksToUnpublish.push(audioTrackRef.current);
        if (videoTrackRef.current) tracksToUnpublish.push(videoTrackRef.current);

        if (tracksToUnpublish.length > 0) {
          try {
            await client.unpublish(tracksToUnpublish);
          } catch (unpubErr) {
            console.warn('[Agora RTC] Lỗi khi hủy publish tracks:', unpubErr);
          }
        }
        await client.leave();
      }
    } catch (err) {
      console.warn('[Agora RTC] Lỗi khi rời kênh trong stopBroadcasting:', err);
    } finally {
      isStoppingBroadcastRef.current = false;
      if (isMountedRef.current) {
        setIsBroadcasting(false);
        setIsJoining(false);
        setIsPublishing(false);
        setIsStoppingBroadcast(false);
        setConnectionState('DISCONNECTED');
        // Các track xem trước cục bộ (preview) tiếp tục được giữ nguyên
      }
    }
  }, [isBroadcasting, isJoining]);

  /**
   * 3. Dừng xem trước thiết bị (Stop Device Preview)
   */
  const stopPreview = useCallback(async () => {
    // Invalidate any in-flight preview track creation
    previewSessionIdRef.current++;
    isStartingPreviewRef.current = false;

    if (isStoppingPreviewRef.current) return;
    isStoppingPreviewRef.current = true;

    try {
      // Nếu đang phát sóng thì phải dừng phát sóng trước
      if (isBroadcasting) {
        await stopBroadcasting();
      }

      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
          videoTrackRef.current.close();
        } catch {
          /* ignore video track stop error */
        }
        videoTrackRef.current = null;
      }
      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
          audioTrackRef.current.close();
        } catch {
          /* ignore audio track stop error */
        }
        audioTrackRef.current = null;
      }
    } finally {
      isStoppingPreviewRef.current = false;
      if (isMountedRef.current) {
        setIsPreviewing(false);
      }
    }
  }, [isBroadcasting, stopBroadcasting]);

  /**
   * 4. Bật/Tắt Camera (Mute/Unmute Video)
   */
  const toggleCamera = useCallback(async () => {
    if (!videoTrackRef.current) return;
    try {
      const nextState = !isCameraEnabled;
      await videoTrackRef.current.setEnabled(nextState);
      if (isMountedRef.current) {
        setIsCameraEnabled(nextState);
      }
    } catch (err) {
      console.error('[Agora RTC] Lỗi chuyển đổi trạng thái camera:', err);
    }
  }, [isCameraEnabled]);

  /**
   * 5. Bật/Tắt Microphone (Mute/Unmute Audio)
   */
  const toggleMicrophone = useCallback(async () => {
    if (!audioTrackRef.current) return;
    try {
      const nextState = !isMicEnabled;
      await audioTrackRef.current.setEnabled(nextState);
      if (isMountedRef.current) {
        setIsMicEnabled(nextState);
      }
    } catch (err) {
      console.error('[Agora RTC] Lỗi chuyển đổi trạng thái micro:', err);
    }
  }, [isMicEnabled]);

  /**
   * 6. Chuyển đổi Camera trực tiếp (Device Selection)
   */
  const switchCamera = useCallback(
    async (deviceId: string): Promise<boolean> => {
      if (!deviceId || deviceId === selectedCameraId) return true;
      if (!canSelectDevice({ isJoining, isPublishing, isStoppingBroadcast })) return false;
      if (isDeviceSwitchingRef.current) return false;

      isDeviceSwitchingRef.current = true;
      setIsDeviceSwitching(true);

      try {
        if (videoTrackRef.current) {
          await videoTrackRef.current.setDevice(deviceId);
        }
        if (isMountedRef.current) {
          setSelectedCameraId(deviceId);
          selectedCameraIdRef.current = deviceId;
        }
        return true;
      } catch (err) {
        if (isMountedRef.current) {
          const msg = interpretDeviceError(err);
          setError(`Không thể chuyển đổi Camera: ${msg}`);
        }
        return false;
      } finally {
        isDeviceSwitchingRef.current = false;
        if (isMountedRef.current) {
          setIsDeviceSwitching(false);
        }
      }
    },
    [selectedCameraId, isJoining, isPublishing, isStoppingBroadcast]
  );

  /**
   * 7. Chuyển đổi Microphone trực tiếp (Device Selection)
   */
  const switchMicrophone = useCallback(
    async (deviceId: string): Promise<boolean> => {
      if (!deviceId || deviceId === selectedMicrophoneId) return true;
      if (!canSelectDevice({ isJoining, isPublishing, isStoppingBroadcast })) return false;
      if (isDeviceSwitchingRef.current) return false;

      isDeviceSwitchingRef.current = true;
      setIsDeviceSwitching(true);

      try {
        if (audioTrackRef.current) {
          await audioTrackRef.current.setDevice(deviceId);
        }
        if (isMountedRef.current) {
          setSelectedMicrophoneId(deviceId);
          selectedMicrophoneIdRef.current = deviceId;
        }
        return true;
      } catch (err) {
        if (isMountedRef.current) {
          const msg = interpretDeviceError(err);
          setError(`Không thể chuyển đổi Microphone: ${msg}`);
        }
        return false;
      } finally {
        isDeviceSwitchingRef.current = false;
        if (isMountedRef.current) {
          setIsDeviceSwitching(false);
        }
      }
    },
    [selectedMicrophoneId, isJoining, isPublishing, isStoppingBroadcast]
  );

  /**
   * 8. Bắt đầu phát sóng (Start Broadcasting)
   */
  const startBroadcasting = useCallback(
    async (sessionId: number): Promise<boolean> => {
      const hasTracks = Boolean(videoTrackRef.current && audioTrackRef.current);
      if (
        !canStartBroadcasting({
          isBroadcasting,
          isJoining,
          isPublishing,
          hasTracks,
        })
      ) {
        return false;
      }

      if (isStartingBroadcastRef.current) {
        return false;
      }
      const currentBroadcastId = ++broadcastSessionIdRef.current;
      isStartingBroadcastRef.current = true;

      activeSessionIdRef.current = sessionId;
      setError(null);
      setIsMockTokenDetected(false);
      setIsJoining(true);

      try {
        // Bước 1: Yêu cầu Token kết nối từ backend
        const tokenRes = await livestreamApi.getJoinToken(sessionId);
        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          return false;
        }
        const tokenData = tokenRes.data;

        // Bước 2: Kiểm tra dữ liệu token và phát hiện Mock Token
        const validation = validatePublisherTokenResponse(tokenData);
        if (validation.isMock) {
          if (isMountedRef.current && broadcastSessionIdRef.current === currentBroadcastId) {
            setIsMockTokenDetected(true);
            setError(
              validation.reason ||
                'Backend đang trả về Mock Token (chưa cấu hình Agora App ID/Certificate). Không thể kết nối tới máy chủ Agora thật.'
            );
            setIsJoining(false);
          }
          return false;
        }

        if (!validation.valid) {
          if (isMountedRef.current && broadcastSessionIdRef.current === currentBroadcastId) {
            setError(validation.reason || 'Dữ liệu kết nối Agora không hợp lệ.');
            setIsJoining(false);
          }
          return false;
        }

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) return false;

        setAgoraChannelName(tokenData.agoraChannelName);

        // Bước 3: Cấu hình client với vai trò Host
        const client = getOrCreateClient();
        await client.setClientRole('host');

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          return false;
        }

        // Bước 4: Tham gia kênh Agora
        await client.join(
          tokenData.appId,
          tokenData.agoraChannelName,
          tokenData.token,
          tokenData.uid
        );

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          await client.leave().catch(() => {});
          return false;
        }

        setIsJoining(false);
        setIsPublishing(true);

        // Bước 5: Publish audio & video tracks
        const tracksToPublish = [
          audioTrackRef.current!,
          videoTrackRef.current!,
        ];
        await client.publish(tracksToPublish);

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          await client.unpublish(tracksToPublish).catch(() => {});
          await client.leave().catch(() => {});
          return false;
        }

        setIsPublishing(false);
        setIsBroadcasting(true);
        isBroadcastingRef.current = true;

        // Bắt đầu bộ đếm thời lượng phát sóng
        setBroadcastSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          if (isMountedRef.current) {
            setBroadcastSeconds((sec) => sec + 1);
          }
        }, 1000);

        return true;
      } catch (err: unknown) {
        if (!isMountedRef.current) return false;
        setIsJoining(false);
        setIsPublishing(false);
        setIsBroadcasting(false);

        try {
          if (clientRef.current) {
            await clientRef.current.leave();
          }
        } catch {
          /* ignore leave error when join partially occurred */
        }

        const errMsg =
          (err as Error)?.message ||
          'Đã xảy ra lỗi khi kết nối hoặc phát sóng tới Agora RTC.';
        setError(errMsg);
        return false;
      } finally {
        isStartingBroadcastRef.current = false;
      }
    },
    [isBroadcasting, isJoining, isPublishing, getOrCreateClient]
  );

  // Đăng ký theo dõi sự kiện cắm/rút thiết bị phần cứng
  useEffect(() => {
    isMountedRef.current = true;

    // Lắng nghe biến động thiết bị từ Agora
    AgoraRTC.onCameraChanged = async (changedDevice) => {
      if (!isMountedRef.current) return;
      try {
        const cams = await AgoraRTC.getCameras();
        if (isMountedRef.current) setCameras(cams);
        if (
          changedDevice.state === 'INACTIVE' &&
          changedDevice.device.deviceId === selectedCameraIdRef.current
        ) {
          setError(
            `Camera "${changedDevice.device.label || 'hiện tại'}" đã bị ngắt kết nối khỏi máy tính.`
          );
        }
      } catch (err) {
        console.warn('[Agora RTC] Lỗi khi xử lý cắm/rút camera:', err);
      }
    };

    AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
      if (!isMountedRef.current) return;
      try {
        const mics = await AgoraRTC.getMicrophones();
        if (isMountedRef.current) setMicrophones(mics);
        if (
          changedDevice.state === 'INACTIVE' &&
          changedDevice.device.deviceId === selectedMicrophoneIdRef.current
        ) {
          setError(
            `Microphone "${changedDevice.device.label || 'hiện tại'}" đã bị ngắt kết nối khỏi máy tính.`
          );
        }
      } catch (err) {
        console.warn('[Agora RTC] Lỗi khi xử lý cắm/rút microphone:', err);
      }
    };

    const previewGen = previewSessionIdRef;
    const broadcastGen = broadcastSessionIdRef;

    return () => {
      isMountedRef.current = false;
      previewGen.current += 1;
      broadcastGen.current += 1;
      isStartingPreviewRef.current = false;
      isStartingBroadcastRef.current = false;
      isBroadcastingRef.current = false;

      // Hủy đăng ký listener
      AgoraRTC.onCameraChanged = undefined;
      AgoraRTC.onMicrophoneChanged = undefined;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Giải phóng tracks an toàn
      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
          videoTrackRef.current.close();
        } catch {
          /* ignore video track release error on unmount */
        }
        videoTrackRef.current = null;
      }
      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
          audioTrackRef.current.close();
        } catch {
          /* ignore audio track release error on unmount */
        }
        audioTrackRef.current = null;
      }

      // Rời khỏi kênh Agora, xóa toàn bộ event listeners và giải phóng client
      const client = clientRef.current;
      if (client) {
        try {
          client.removeAllListeners();
        } catch {
          /* ignore removeAllListeners error if already disposed */
        }
        client.leave().catch(() => {});
        clientRef.current = null;
      }
    };
  }, []);

  return {
    isPreviewing,
    isStartingPreview,
    isCameraEnabled,
    isMicEnabled,
    localVideoRef,

    cameras,
    microphones,
    selectedCameraId,
    selectedMicrophoneId,
    isDeviceSwitching,
    switchCamera,
    switchMicrophone,
    refreshDevices,

    connectionState,
    isJoining,
    isPublishing,
    isBroadcasting,
    isStoppingBroadcast,
    broadcastSeconds,

    error,
    isMockTokenDetected,
    agoraChannelName,

    startPreview,
    stopPreview,
    toggleCamera,
    toggleMicrophone,
    startBroadcasting,
    stopBroadcasting,
    clearError,
  };
}
