import { useState, useRef, useEffect, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  ILocalVideoTrack,
  ILocalAudioTrack,
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

export interface PipLayout {
  /** Tọa độ ngang góc trên-trái (0.0 -> 1.0) */
  x: number;
  /** Tọa độ dọc góc trên-trái (0.0 -> 1.0) */
  y: number;
  /** Tỷ lệ kích thước ô Camera so với khung hình (0.12 -> 0.38) */
  scale: number;
}

export interface UseAgoraPublisherReturn {
  // Preview & Track states
  isPreviewing: boolean;
  isStartingPreview: boolean;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  isScreenSharing: boolean;
  hasScreenAudio: boolean;
  isScreenAudioEnabled: boolean;
  micVolume: number;
  screenAudioVolume: number;
  pipLayout: PipLayout;
  stageAspectRatio: number;
  updatePipLayout: (partial: Partial<PipLayout>) => void;
  changeMicVolume: (volume: number) => void;
  changeScreenAudioVolume: (volume: number) => void;
  toggleScreenAudio: () => void;
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
  toggleScreenShare: () => Promise<boolean>;
  startBroadcasting: (sessionId: number) => Promise<boolean>;
  stopBroadcasting: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_PIP_LAYOUT: PipLayout = {
  x: 0.75,
  y: 0.72,
  scale: 0.22,
};

export function useAgoraPublisher(): UseAgoraPublisherReturn {
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Agora client & track refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | ILocalVideoTrack | null>(null);
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);

  // Audio track refs (Mic track, Screen audio track, and currently published audio track)
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenAudioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const publishedAudioTrackRef = useRef<ILocalAudioTrack | IMicrophoneAudioTrack | null>(null);

  // Web Audio Mixer refs (gộp tiếng Micro + tiếng Màn hình chia sẻ)
  const audioMixerCleanupRef = useRef<(() => void) | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const screenGainNodeRef = useRef<GainNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Compositor refs for 60fps Screen Share + Free-Drag Camera PiP
  const compositorCleanupRef = useRef<(() => void) | null>(null);
  const camVideoElRef = useRef<HTMLVideoElement | null>(null);
  const pipLayoutRef = useRef<PipLayout>(DEFAULT_PIP_LAYOUT);
  const isCameraEnabledRef = useRef<boolean>(true);
  const isMicEnabledRef = useRef<boolean>(true);
  const isScreenSharingRef = useRef<boolean>(false);
  const isScreenAudioEnabledRef = useRef<boolean>(true);
  const micVolumeRef = useRef<number>(100);
  const screenAudioVolumeRef = useRef<number>(80);

  // Active session and device refs
  const activeSessionIdRef = useRef<number | null>(null);
  const selectedCameraIdRef = useRef<string>('');
  const selectedMicrophoneIdRef = useRef<string>('');

  // In-flight operation locks
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

  // Preview, Audio Volume & PiP States
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isStartingPreview, setIsStartingPreview] = useState<boolean>(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [hasScreenAudio, setHasScreenAudio] = useState<boolean>(false);
  const [isScreenAudioEnabled, setIsScreenAudioEnabled] = useState<boolean>(true);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [screenAudioVolume, setScreenAudioVolume] = useState<number>(80);
  const [pipLayout, setPipLayout] = useState<PipLayout>(DEFAULT_PIP_LAYOUT);
  const [stageAspectRatio, setStageAspectRatio] = useState<number>(16 / 9);

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

  const updatePipLayout = useCallback((partial: Partial<PipLayout>) => {
    setPipLayout((prev) => {
      const nextScale =
        partial.scale !== undefined
          ? Math.min(0.38, Math.max(0.12, partial.scale))
          : prev.scale;
      const maxCoord = Math.max(0, 1 - nextScale);
      const nextX =
        partial.x !== undefined
          ? Math.min(maxCoord, Math.max(0, partial.x))
          : Math.min(maxCoord, Math.max(0, prev.x));
      const nextY =
        partial.y !== undefined
          ? Math.min(maxCoord, Math.max(0, partial.y))
          : Math.min(maxCoord, Math.max(0, prev.y));

      const next = { x: nextX, y: nextY, scale: nextScale };
      pipLayoutRef.current = next;
      return next;
    });
  }, []);

  /**
   * Điều chỉnh âm lượng Microphone (0 -> 100%)
   */
  const changeMicVolume = useCallback((volume: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(volume)));
    micVolumeRef.current = clamped;
    setMicVolume(clamped);

    if (clamped > 0 && !isMicEnabledRef.current) {
      isMicEnabledRef.current = true;
      setIsMicEnabled(true);
      if (!micGainNodeRef.current && audioTrackRef.current) {
        void audioTrackRef.current.setEnabled(true).catch(() => {});
      }
    }

    if (audioTrackRef.current) {
      try {
        audioTrackRef.current.setVolume(clamped);
      } catch {
        /* ignore */
      }
    }
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = isMicEnabledRef.current ? clamped / 100 : 0;
    }
  }, []);

  /**
   * Điều chỉnh âm lượng Màn hình chia sẻ / Tư liệu live (0 -> 100%)
   */
  const changeScreenAudioVolume = useCallback((volume: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(volume)));
    screenAudioVolumeRef.current = clamped;
    setScreenAudioVolume(clamped);

    if (clamped > 0 && !isScreenAudioEnabledRef.current) {
      isScreenAudioEnabledRef.current = true;
      setIsScreenAudioEnabled(true);
    }

    if (screenAudioTrackRef.current) {
      try {
        screenAudioTrackRef.current.setVolume(isScreenAudioEnabledRef.current ? clamped : 0);
      } catch {
        /* ignore */
      }
    }
    if (screenGainNodeRef.current) {
      screenGainNodeRef.current.gain.value = isScreenAudioEnabledRef.current ? clamped / 100 : 0;
    }
  }, []);

  /**
   * Bật/Tắt nhanh tiếng phát ra từ màn hình chia sẻ
   */
  const toggleScreenAudio = useCallback(() => {
    const next = !isScreenAudioEnabledRef.current;
    isScreenAudioEnabledRef.current = next;
    setIsScreenAudioEnabled(next);

    if (screenGainNodeRef.current) {
      screenGainNodeRef.current.gain.value = next ? screenAudioVolumeRef.current / 100 : 0;
    }
    if (screenAudioTrackRef.current) {
      try {
        screenAudioTrackRef.current.setVolume(next ? screenAudioVolumeRef.current : 0);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

  useEffect(() => {
    selectedMicrophoneIdRef.current = selectedMicrophoneId;
  }, [selectedMicrophoneId]);

  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  const stopCompositor = useCallback(() => {
    if (compositorCleanupRef.current) {
      try {
        compositorCleanupRef.current();
      } catch {
        /* ignore */
      }
      compositorCleanupRef.current = null;
    }
    camVideoElRef.current = null;
  }, []);

  const stopAudioMixer = useCallback(() => {
    if (audioMixerCleanupRef.current) {
      try {
        audioMixerCleanupRef.current();
      } catch {
        /* ignore */
      }
      audioMixerCleanupRef.current = null;
    }
    micGainNodeRef.current = null;
    screenGainNodeRef.current = null;
    micSourceNodeRef.current = null;
    audioContextRef.current = null;
  }, []);

  const createAdaptiveCameraTrack = useCallback(async (cameraId?: string): Promise<ICameraVideoTrack> => {
    try {
      return await AgoraRTC.createCameraVideoTrack({
        cameraId: cameraId || undefined,
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 60,
          bitrateMax: 2500,
        },
      });
    } catch {
      return await AgoraRTC.createCameraVideoTrack({
        cameraId: cameraId || undefined,
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMax: 1800,
        },
      });
    }
  }, []);

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

  const getOrCreateClient = useCallback((): IAgoraRTCClient => {
    if (!clientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

      client.on('connection-state-change', (curState, revState) => {
        if (!isMountedRef.current) return;
        setConnectionState(curState);

        if (curState === 'CONNECTED') {
          setError(null);
        } else if (
          curState === 'DISCONNECTED' &&
          (revState === 'CONNECTING' || revState === 'RECONNECTING')
        ) {
          setError('Mất kết nối tới máy chủ phát sóng. Vui lòng kiểm tra đường truyền và thử phát lại.');
        }
      });

      client.on('token-privilege-will-expire', async () => {
        if (!isMountedRef.current || !activeSessionIdRef.current || !isBroadcastingRef.current) return;
        try {
          const res = await livestreamApi.getJoinToken(activeSessionIdRef.current);
          if (res?.data?.token && clientRef.current && isMountedRef.current && isBroadcastingRef.current) {
            await clientRef.current.renewToken(res.data.token);
          }
        } catch (renewErr) {
          console.error('[Agora RTC] Thất bại khi tự động gia hạn token:', renewErr);
        }
      });

      client.on('token-privilege-did-expire', () => {
        if (!isMountedRef.current) return;
        setError('Phiên phát sóng đã hết hạn xác thực. Vui lòng kết nối lại.');
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
      stopCompositor();
      stopAudioMixer();

      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
          videoTrackRef.current.close();
        } catch {
          /* ignore */
        }
        videoTrackRef.current = null;
      }
      if (cameraTrackRef.current) {
        try {
          cameraTrackRef.current.stop();
          cameraTrackRef.current.close();
        } catch {
          /* ignore */
        }
        cameraTrackRef.current = null;
      }
      if (screenTrackRef.current) {
        try {
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
        } catch {
          /* ignore */
        }
        screenTrackRef.current = null;
      }
      if (screenAudioTrackRef.current) {
        try {
          screenAudioTrackRef.current.stop();
          screenAudioTrackRef.current.close();
        } catch {
          /* ignore */
        }
        screenAudioTrackRef.current = null;
      }
      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
          audioTrackRef.current.close();
        } catch {
          /* ignore */
        }
        audioTrackRef.current = null;
      }
      publishedAudioTrackRef.current = null;

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicrophoneIdRef.current || undefined,
        encoderConfig: 'speech_standard',
        AEC: true,
        ANS: true,
      });
      audioTrack.setVolume(micVolumeRef.current);

      const videoTrack = await createAdaptiveCameraTrack(selectedCameraIdRef.current || undefined);

      if (!isMountedRef.current || previewSessionIdRef.current !== currentPreviewId) {
        audioTrack.stop();
        audioTrack.close();
        videoTrack.stop();
        videoTrack.close();
        return false;
      }

      audioTrackRef.current = audioTrack;
      publishedAudioTrackRef.current = audioTrack;
      cameraTrackRef.current = videoTrack;
      videoTrackRef.current = videoTrack;

      const curCamId = videoTrack.getTrackLabel();
      if (curCamId && !selectedCameraIdRef.current) {
        setSelectedCameraId(curCamId);
      }

      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
        videoTrack.play(localVideoRef.current);
      }

      setIsPreviewing(true);
      setIsCameraEnabled(true);
      isCameraEnabledRef.current = true;
      setIsMicEnabled(true);
      isMicEnabledRef.current = true;
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
      setHasScreenAudio(false);

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
  }, [isPreviewing, isBroadcasting, refreshDevices, createAdaptiveCameraTrack, stopCompositor, stopAudioMixer]);

  /**
   * 2. Dừng phát sóng (Stop Broadcasting)
   */
  const stopBroadcasting = useCallback(async () => {
    if (!canStopBroadcasting({ isBroadcasting, isJoining })) {
      return;
    }

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
        const tracksToUnpublish: (ICameraVideoTrack | ILocalVideoTrack | ILocalAudioTrack | IMicrophoneAudioTrack)[] = [];
        const activeAudio = publishedAudioTrackRef.current || audioTrackRef.current;
        if (activeAudio) tracksToUnpublish.push(activeAudio);
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
      if (activeSessionIdRef.current) {
        await livestreamApi.leaveSession(activeSessionIdRef.current, true).catch(() => {});
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
      }
    }
  }, [isBroadcasting, isJoining]);

  /**
   * 3. Dừng xem trước thiết bị (Stop Device Preview)
   */
  const stopPreview = useCallback(async () => {
    previewSessionIdRef.current++;
    isStartingPreviewRef.current = false;

    if (isStoppingPreviewRef.current) return;
    isStoppingPreviewRef.current = true;

    try {
      if (isBroadcasting) {
        await stopBroadcasting();
      }

      stopCompositor();
      stopAudioMixer();

      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
          videoTrackRef.current.close();
        } catch {
          /* ignore */
        }
        videoTrackRef.current = null;
      }
      if (cameraTrackRef.current) {
        try {
          cameraTrackRef.current.stop();
          cameraTrackRef.current.close();
        } catch {
          /* ignore */
        }
        cameraTrackRef.current = null;
      }
      if (screenTrackRef.current) {
        try {
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
        } catch {
          /* ignore */
        }
        screenTrackRef.current = null;
      }
      if (screenAudioTrackRef.current) {
        try {
          screenAudioTrackRef.current.stop();
          screenAudioTrackRef.current.close();
        } catch {
          /* ignore */
        }
        screenAudioTrackRef.current = null;
      }
      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
          audioTrackRef.current.close();
        } catch {
          /* ignore */
        }
        audioTrackRef.current = null;
      }
      publishedAudioTrackRef.current = null;
    } finally {
      isStoppingPreviewRef.current = false;
      if (isMountedRef.current) {
        setIsPreviewing(false);
        setIsScreenSharing(false);
        isScreenSharingRef.current = false;
        setHasScreenAudio(false);
        setStageAspectRatio(16 / 9);
      }
    }
  }, [isBroadcasting, stopBroadcasting, stopCompositor, stopAudioMixer]);

  /**
   * 4. Bật/Tắt Camera (Mute/Unmute Video hoặc Ẩn/Hiện ô Camera PiP khi đang Chia sẻ màn hình)
   */
  const toggleCamera = useCallback(async () => {
    const nextState = !isCameraEnabled;

    if (isScreenSharingRef.current) {
      isCameraEnabledRef.current = nextState;
      if (isMountedRef.current) {
        setIsCameraEnabled(nextState);
      }
      return;
    }

    if (!cameraTrackRef.current) return;
    try {
      await cameraTrackRef.current.setEnabled(nextState);
      isCameraEnabledRef.current = nextState;
      if (isMountedRef.current) {
        setIsCameraEnabled(nextState);
      }
    } catch (err) {
      console.error('[Agora RTC] Lỗi chuyển đổi trạng thái camera:', err);
    }
  }, [isCameraEnabled]);

  /**
   * 5. Bật/Tắt Microphone (Mute/Unmute Audio - độc lập với âm thanh màn hình chia sẻ)
   */
  const toggleMicrophone = useCallback(async () => {
    if (!audioTrackRef.current) return;
    try {
      const nextState = !isMicEnabled;
      isMicEnabledRef.current = nextState;

      if (micGainNodeRef.current) {
        // Khi đang dùng bộ trộn âm thanh (Screen Audio + Mic), điều khiển qua GainNode để không làm ngắt tiếng màn hình
        micGainNodeRef.current.gain.value = nextState ? micVolumeRef.current / 100 : 0;
      } else {
        await audioTrackRef.current.setEnabled(nextState);
      }

      if (isMountedRef.current) {
        setIsMicEnabled(nextState);
      }
    } catch (err) {
      console.error('[Agora RTC] Lỗi chuyển đổi trạng thái micro:', err);
    }
  }, [isMicEnabled]);

  /**
   * 5b. Bật / Tắt Chia sẻ màn hình 60fps kèm trộn hình Camera PiP + trộn tiếng Màn hình & Micro
   */
  const toggleScreenShare = useCallback(async (): Promise<boolean> => {
    if (!isPreviewing || isJoining || isPublishing || isStoppingBroadcast) return false;
    if (isDeviceSwitchingRef.current) return false;

    isDeviceSwitchingRef.current = true;
    setIsDeviceSwitching(true);

    const revertToCamera = async (): Promise<boolean> => {
      try {
        const oldPublishedVideo = videoTrackRef.current;
        const oldPublishedAudio = publishedAudioTrackRef.current;
        const needRestoreMicAudio =
          oldPublishedAudio && oldPublishedAudio !== audioTrackRef.current;

        if (isBroadcastingRef.current && clientRef.current) {
          const toUnpub: (ICameraVideoTrack | ILocalVideoTrack | ILocalAudioTrack | IMicrophoneAudioTrack)[] = [];
          if (oldPublishedVideo) toUnpub.push(oldPublishedVideo);
          if (needRestoreMicAudio && oldPublishedAudio) toUnpub.push(oldPublishedAudio);
          if (toUnpub.length > 0) {
            await clientRef.current.unpublish(toUnpub).catch(() => {});
          }
        }

        stopCompositor();
        stopAudioMixer();

        if (screenTrackRef.current) {
          try {
            screenTrackRef.current.stop();
            screenTrackRef.current.close();
          } catch {
            /* ignore */
          }
          screenTrackRef.current = null;
        }
        if (screenAudioTrackRef.current) {
          try {
            screenAudioTrackRef.current.stop();
            screenAudioTrackRef.current.close();
          } catch {
            /* ignore */
          }
          screenAudioTrackRef.current = null;
        }

        if (oldPublishedVideo && oldPublishedVideo !== cameraTrackRef.current) {
          try {
            oldPublishedVideo.stop();
            oldPublishedVideo.close();
          } catch {
            /* ignore */
          }
        }

        let camTrack = cameraTrackRef.current;
        if (!camTrack) {
          camTrack = await createAdaptiveCameraTrack(selectedCameraIdRef.current || undefined);
          cameraTrackRef.current = camTrack;
        } else {
          await camTrack.setEnabled(true).catch(() => {});
        }

        if (audioTrackRef.current) {
          await audioTrackRef.current.setEnabled(isMicEnabledRef.current).catch(() => {});
          audioTrackRef.current.setVolume(micVolumeRef.current);
          publishedAudioTrackRef.current = audioTrackRef.current;
        }

        videoTrackRef.current = camTrack;
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          camTrack.play(localVideoRef.current);
        }

        if (isBroadcastingRef.current && clientRef.current) {
          const toPub: (ICameraVideoTrack | ILocalVideoTrack | ILocalAudioTrack | IMicrophoneAudioTrack)[] = [camTrack];
          if (needRestoreMicAudio && audioTrackRef.current) {
            toPub.push(audioTrackRef.current);
          }
          await clientRef.current.publish(toPub);
        }

        isScreenSharingRef.current = false;
        isCameraEnabledRef.current = true;
        if (isMountedRef.current) {
          setIsScreenSharing(false);
          setIsCameraEnabled(true);
          setHasScreenAudio(false);
          setStageAspectRatio(16 / 9);
        }
        return true;
      } catch (err) {
        console.error('[Agora RTC] Lỗi khôi phục camera sau khi dừng chia sẻ màn hình:', err);
        return false;
      }
    };

    try {
      if (isScreenSharing) {
        return await revertToCamera();
      } else {
        // 1. Tạo Screen Video Track (1080p @ 60fps) kèm tùy chọn thu tiếng màn hình/tab ('auto')
        const screenResult = await AgoraRTC.createScreenVideoTrack(
          {
            encoderConfig: {
              width: { max: 1920 },
              height: { max: 1200 },
              frameRate: 60,
              bitrateMax: 3500,
            },
            optimizationMode: 'detail',
          },
          'auto'
        );

        const screenTrack = Array.isArray(screenResult) ? screenResult[0] : screenResult;
        const capturedScreenAudio = Array.isArray(screenResult) ? screenResult[1] : null;
        screenTrackRef.current = screenTrack;
        screenAudioTrackRef.current = capturedScreenAudio;

        // 2. Đảm bảo Camera Track vẫn hoạt động để vẽ lên góc PiP
        let camTrack = cameraTrackRef.current;
        if (!camTrack) {
          camTrack = await createAdaptiveCameraTrack(selectedCameraIdRef.current || undefined);
          cameraTrackRef.current = camTrack;
        } else {
          await camTrack.setEnabled(true).catch(() => {});
        }

        // 3. Nếu người dùng có tích "Chia sẻ âm thanh (Share audio)", khởi tạo Bộ trộn âm thanh (Mic + Screen Audio)
        let mixedAudioTrack: ILocalAudioTrack | null = null;
        if (capturedScreenAudio && audioTrackRef.current) {
          try {
            await audioTrackRef.current.setEnabled(true).catch(() => {});
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;

            const dest = audioCtx.createMediaStreamDestination();

            // Nhánh 1: Microphone của Creator
            const micSource = audioCtx.createMediaStreamSource(
              new MediaStream([audioTrackRef.current.getMediaStreamTrack()])
            );
            const micGain = audioCtx.createGain();
            micGain.gain.value = isMicEnabledRef.current ? micVolumeRef.current / 100 : 0;
            micSource.connect(micGain).connect(dest);
            micSourceNodeRef.current = micSource;
            micGainNodeRef.current = micGain;

            // Nhánh 2: Âm thanh phát ra từ màn hình / tab chia sẻ
            const screenSource = audioCtx.createMediaStreamSource(
              new MediaStream([capturedScreenAudio.getMediaStreamTrack()])
            );
            const screenGain = audioCtx.createGain();
            screenGain.gain.value = isScreenAudioEnabledRef.current
              ? screenAudioVolumeRef.current / 100
              : 0;
            screenSource.connect(screenGain).connect(dest);
            screenGainNodeRef.current = screenGain;

            const mixedMediaTrack = dest.stream.getAudioTracks()[0];
            mixedAudioTrack = AgoraRTC.createCustomAudioTrack({
              mediaStreamTrack: mixedMediaTrack,
            });

            audioMixerCleanupRef.current = () => {
              try {
                micSource.disconnect();
                screenSource.disconnect();
                micGain.disconnect();
                screenGain.disconnect();
              } catch {
                /* ignore */
              }
              if (mixedAudioTrack) {
                try {
                  mixedAudioTrack.stop();
                  mixedAudioTrack.close();
                } catch {
                  /* ignore */
                }
              }
              try {
                mixedMediaTrack.stop();
              } catch {
                /* ignore */
              }
              void audioCtx.close().catch(() => {});
            };
          } catch (mixErr) {
            console.warn('[Agora RTC] Không thể trộn âm thanh màn hình, giữ nguyên Micro:', mixErr);
          }
        }

        // 4. Khởi tạo bộ trộn hình Canvas @ 60fps tự động đồng bộ tỷ lệ màn hình người dùng (16:10, 16:9, 21:9...)
        const screenVideoEl = document.createElement('video');
        screenVideoEl.muted = true;
        screenVideoEl.playsInline = true;
        screenVideoEl.autoplay = true;
        screenVideoEl.srcObject = new MediaStream([screenTrack.getMediaStreamTrack()]);
        await screenVideoEl.play().catch(() => {});

        const trackSettings = screenTrack.getMediaStreamTrack().getSettings();
        const rawScreenW = screenVideoEl.videoWidth || trackSettings.width || 1920;
        const rawScreenH = screenVideoEl.videoHeight || trackSettings.height || 1080;
        const rawAspect = rawScreenW > 0 && rawScreenH > 0 ? rawScreenW / rawScreenH : 16 / 9;
        const safeAspect = Math.min(2.35, Math.max(1.25, rawAspect));
        const canvasWidth = 1280;
        // Làm tròn chẵn chiều cao để tương thích bộ mã hóa VP8/H264 (VD: 16:10 -> 1280x800, 16:9 -> 1280x720)
        const canvasHeight = Math.round(canvasWidth / safeAspect / 2) * 2;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (isMountedRef.current) {
          setStageAspectRatio(canvasWidth / canvasHeight);
        }

        const camVideoEl = document.createElement('video');
        camVideoEl.muted = true;
        camVideoEl.playsInline = true;
        camVideoEl.autoplay = true;
        camVideoEl.srcObject = new MediaStream([camTrack.getMediaStreamTrack()]);
        await camVideoEl.play().catch(() => {});
        camVideoElRef.current = camVideoEl;

        const renderFrame = () => {
          if (!ctx) return;

          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (screenVideoEl.readyState >= 2 && screenVideoEl.videoWidth > 0 && screenVideoEl.videoHeight > 0) {
            const sw = screenVideoEl.videoWidth;
            const sh = screenVideoEl.videoHeight;
            const scale = Math.min(canvas.width / sw, canvas.height / sh);
            const dw = sw * scale;
            const dh = sh * scale;
            const dx = (canvas.width - dw) / 2;
            const dy = (canvas.height - dh) / 2;
            ctx.drawImage(screenVideoEl, dx, dy, dw, dh);
          }

          if (
            isCameraEnabledRef.current &&
            camVideoEl.readyState >= 2 &&
            camVideoEl.videoWidth > 0 &&
            camVideoEl.videoHeight > 0
          ) {
            const { x, y, scale } = pipLayoutRef.current;
            const pw = Math.round(canvas.width * scale);
            const ph = Math.round(canvas.height * scale);
            const px = Math.round(Math.min(canvas.width - pw, Math.max(0, x * canvas.width)));
            const py = Math.round(Math.min(canvas.height - ph, Math.max(0, y * canvas.height)));
            const radius = 14;

            ctx.save();

            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 16;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(px, py, pw, ph, radius);
            } else {
              ctx.rect(px, py, pw, ph);
            }
            ctx.fillStyle = '#18181b';
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.clip();

            const cw = camVideoEl.videoWidth;
            const ch = camVideoEl.videoHeight;
            const camRatio = cw / ch;
            const boxRatio = pw / ph;
            let sx = 0;
            let sy = 0;
            let sWidth = cw;
            let sHeight = ch;

            if (camRatio > boxRatio) {
              sWidth = ch * boxRatio;
              sx = (cw - sWidth) / 2;
            } else {
              sHeight = cw / boxRatio;
              sy = (ch - sHeight) / 2;
            }

            ctx.drawImage(
              camVideoEl,
              sx,
              sy,
              sWidth,
              sHeight,
              px,
              py,
              pw,
              ph
            );

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.restore();
          }
        };

        renderFrame();

        let worker: Worker | null = null;
        let fallbackInterval: ReturnType<typeof setInterval> | null = null;
        let blobUrl: string | null = null;

        try {
          const blob = new Blob(
            ['const id = setInterval(() => postMessage(0), 16); onmessage = () => clearInterval(id);'],
            { type: 'application/javascript' }
          );
          blobUrl = URL.createObjectURL(blob);
          worker = new Worker(blobUrl);
          worker.onmessage = renderFrame;
        } catch {
          fallbackInterval = setInterval(renderFrame, 16);
        }

        const canvasStream = canvas.captureStream(60);
        const canvasVideoMediaTrack = canvasStream.getVideoTracks()[0];

        const compositedTrack = AgoraRTC.createCustomVideoTrack({
          mediaStreamTrack: canvasVideoMediaTrack,
          bitrateMax: 3200,
          optimizationMode: 'detail',
        });

        compositorCleanupRef.current = () => {
          if (worker) {
            try {
              worker.postMessage('stop');
              worker.terminate();
            } catch {
              /* ignore */
            }
            worker = null;
          }
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            blobUrl = null;
          }
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
          screenVideoEl.pause();
          screenVideoEl.srcObject = null;
          camVideoEl.pause();
          camVideoEl.srcObject = null;
          try {
            canvasVideoMediaTrack.stop();
          } catch {
            /* ignore */
          }
        };

        // 5. Thay thế video track (và audio track nếu có trộn tiếng màn hình) trên Agora Client
        const oldPublishedVideo = videoTrackRef.current;
        const oldPublishedAudio = publishedAudioTrackRef.current;

        if (isBroadcastingRef.current && clientRef.current) {
          const toUnpub: (ICameraVideoTrack | ILocalVideoTrack | ILocalAudioTrack | IMicrophoneAudioTrack)[] = [];
          if (oldPublishedVideo) toUnpub.push(oldPublishedVideo);
          if (mixedAudioTrack && oldPublishedAudio) toUnpub.push(oldPublishedAudio);
          if (toUnpub.length > 0) {
            await clientRef.current.unpublish(toUnpub).catch(() => {});
          }
        }

        videoTrackRef.current = compositedTrack;
        if (mixedAudioTrack) {
          publishedAudioTrackRef.current = mixedAudioTrack;
        }

        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          compositedTrack.play(localVideoRef.current, {
            fit: 'contain',
            mirror: false,
          });
        }

        if (isBroadcastingRef.current && clientRef.current) {
          const toPub: (ICameraVideoTrack | ILocalVideoTrack | ILocalAudioTrack | IMicrophoneAudioTrack)[] = [compositedTrack];
          if (mixedAudioTrack) toPub.push(mixedAudioTrack);
          await clientRef.current.publish(toPub);
        }

        screenTrack.on('track-ended', () => {
          void revertToCamera();
        });

        isScreenSharingRef.current = true;
        if (isMountedRef.current) {
          setIsScreenSharing(true);
          setHasScreenAudio(Boolean(capturedScreenAudio));
          setIsScreenAudioEnabled(true);
        }
        return true;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const message = (err as Error)?.message || '';
      if (
        !code.includes('PERMISSION_DENIED') &&
        !message.toLowerCase().includes('permission denied') &&
        !message.toLowerCase().includes('cancelled')
      ) {
        console.warn('[Agora RTC] Không bật chia sẻ màn hình:', err);
      }
      return false;
    } finally {
      isDeviceSwitchingRef.current = false;
      if (isMountedRef.current) {
        setIsDeviceSwitching(false);
      }
    }
  }, [
    isPreviewing,
    isJoining,
    isPublishing,
    isStoppingBroadcast,
    isScreenSharing,
    createAdaptiveCameraTrack,
    stopCompositor,
    stopAudioMixer,
  ]);

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
        if (cameraTrackRef.current) {
          await cameraTrackRef.current.setDevice(deviceId);
          if (camVideoElRef.current) {
            camVideoElRef.current.srcObject = new MediaStream([
              cameraTrackRef.current.getMediaStreamTrack(),
            ]);
            await camVideoElRef.current.play().catch(() => {});
          }
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
   * 7. Chuyển đổi Microphone trực tiếp (Device Selection - cập nhật cả nhánh Audio Mixer nếu đang chia sẻ màn hình)
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
          if (audioContextRef.current && micGainNodeRef.current) {
            try {
              if (micSourceNodeRef.current) {
                micSourceNodeRef.current.disconnect();
              }
              const newMicSource = audioContextRef.current.createMediaStreamSource(
                new MediaStream([audioTrackRef.current.getMediaStreamTrack()])
              );
              newMicSource.connect(micGainNodeRef.current);
              micSourceNodeRef.current = newMicSource;
            } catch {
              /* ignore */
            }
          }
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
      const activeAudio = publishedAudioTrackRef.current || audioTrackRef.current;
      const hasTracks = Boolean(videoTrackRef.current && activeAudio);
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
        const tokenRes = await livestreamApi.getJoinToken(sessionId);
        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          return false;
        }
        const tokenData = tokenRes.data;

        const validation = validatePublisherTokenResponse(tokenData);
        if (validation.isMock) {
          if (isMountedRef.current && broadcastSessionIdRef.current === currentBroadcastId) {
            setIsMockTokenDetected(true);
            setError(
              validation.reason ||
                'Hệ thống phát sóng trực tiếp đang bảo trì cấu hình. Vui lòng thử lại sau.'
            );
            setIsJoining(false);
          }
          return false;
        }

        if (!validation.valid) {
          if (isMountedRef.current && broadcastSessionIdRef.current === currentBroadcastId) {
            setError(validation.reason || 'Dữ liệu kết nối phát sóng không hợp lệ.');
            setIsJoining(false);
          }
          return false;
        }

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) return false;

        setAgoraChannelName(tokenData.agoraChannelName);

        const client = getOrCreateClient();
        await client.setClientRole('host');

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          return false;
        }

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

        const audioToPub = publishedAudioTrackRef.current || audioTrackRef.current!;
        const tracksToPublish = [audioToPub, videoTrackRef.current!];
        await client.publish(tracksToPublish);

        if (!isMountedRef.current || broadcastSessionIdRef.current !== currentBroadcastId) {
          await client.unpublish(tracksToPublish).catch(() => {});
          await client.leave().catch(() => {});
          return false;
        }

        setIsPublishing(false);
        setIsBroadcasting(true);
        isBroadcastingRef.current = true;

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
          /* ignore */
        }

        const errMsg =
          (err as Error)?.message ||
          'Đã xảy ra lỗi khi kết nối hoặc phát sóng trực tiếp.';
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
      const wasBroadcasting = isBroadcastingRef.current;
      isBroadcastingRef.current = false;

      if (wasBroadcasting && activeSessionIdRef.current) {
        livestreamApi.leaveSession(activeSessionIdRef.current, true).catch(() => {});
      }

      AgoraRTC.onCameraChanged = undefined;
      AgoraRTC.onMicrophoneChanged = undefined;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      stopCompositor();
      stopAudioMixer();

      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
          videoTrackRef.current.close();
        } catch {
          /* ignore */
        }
        videoTrackRef.current = null;
      }
      if (cameraTrackRef.current) {
        try {
          cameraTrackRef.current.stop();
          cameraTrackRef.current.close();
        } catch {
          /* ignore */
        }
        cameraTrackRef.current = null;
      }
      if (screenTrackRef.current) {
        try {
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
        } catch {
          /* ignore */
        }
        screenTrackRef.current = null;
      }
      if (screenAudioTrackRef.current) {
        try {
          screenAudioTrackRef.current.stop();
          screenAudioTrackRef.current.close();
        } catch {
          /* ignore */
        }
        screenAudioTrackRef.current = null;
      }
      if (audioTrackRef.current) {
        try {
          audioTrackRef.current.stop();
          audioTrackRef.current.close();
        } catch {
          /* ignore */
        }
        audioTrackRef.current = null;
      }
      publishedAudioTrackRef.current = null;

      const client = clientRef.current;
      if (client) {
        try {
          client.removeAllListeners();
        } catch {
          /* ignore */
        }
        client.leave().catch(() => {});
        clientRef.current = null;
      }
    };
  }, [stopCompositor, stopAudioMixer]);

  return {
    isPreviewing,
    isStartingPreview,
    isCameraEnabled,
    isMicEnabled,
    isScreenSharing,
    hasScreenAudio,
    isScreenAudioEnabled,
    micVolume,
    screenAudioVolume,
    pipLayout,
    stageAspectRatio,
    updatePipLayout,
    changeMicVolume,
    changeScreenAudioVolume,
    toggleScreenAudio,
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
    toggleScreenShare,
    startBroadcasting,
    stopBroadcasting,
    clearError,
  };
}
