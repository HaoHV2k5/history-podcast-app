import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  ChevronLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Volume2,
  VolumeX,
  Eye,
  Crown,
  StopCircle,
  AlertTriangle,
  Loader2,
  Clock,
  RotateCcw,
  Settings2,
  Move,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { livestreamApi } from '@/services/api/livestream';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import { useAgoraPublisher } from './hooks/useAgoraPublisher';
import {
  canManageLivestream,
  formatBroadcastingDuration,
  formatLivestreamViewerCount,
  formatDeviceLabel,
} from './livestreamLogic';
import { EndLivestreamConfirmDialog } from './components/EndLivestreamConfirmDialog';
import { LivestreamChatPanel } from './components/LivestreamChatPanel';

export const CreatorLivestreamStudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const sessionId = Number(id);

  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const videoOverlayRef = useRef<HTMLDivElement>(null);
  const [videoBounds, setVideoBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    startClientX: number;
    startClientY: number;
    startPipX: number;
    startPipY: number;
  } | null>(null);

  const {
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

    connectionState,
    isJoining,
    isPublishing,
    isBroadcasting,
    isStoppingBroadcast,
    broadcastSeconds,
    error: publisherError,
    isMockTokenDetected,
    startPreview,
    stopPreview,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    startBroadcasting,
    stopBroadcasting,
    clearError,
  } = useAgoraPublisher();

  const {
    data: sessionRes,
    isLoading: isLoadingSession,
    isError: isSessionError,
    error: sessionError,
  } = useQuery({
    queryKey: ['creator-livestream-detail', sessionId],
    queryFn: () => livestreamApi.getSession(sessionId),
    enabled: !isNaN(sessionId) && sessionId > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'ENDED') return false;
      return 5000;
    },
  });

  const session = sessionRes?.data;
  const isOwner = canManageLivestream(session, user?.id);
  const isSessionEnded = session?.status === 'ENDED';
  const liveViewerCountDisplay = isBroadcasting
    ? formatLivestreamViewerCount(session?.viewerCount ?? 0)
    : '0';

  const handleStopBroadcasting = async () => {
    await stopBroadcasting();
    queryClient.invalidateQueries({ queryKey: ['creator-livestream-detail', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['creator-livestreams'] });
  };

  // Đồng bộ khung tương tác PiP khớp 100% với vùng hiển thị thực tế của video theo mọi tỷ lệ màn hình (16:10, 16:9, 21:9...)
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;

    const updateBounds = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw <= 0 || ch <= 0) return;

      const targetRatio = stageAspectRatio > 0 ? stageAspectRatio : 16 / 9;
      const containerRatio = cw / ch;

      let width = cw;
      let height = ch;
      let left = 0;
      let top = 0;

      if (containerRatio > targetRatio) {
        height = ch;
        width = ch * targetRatio;
        left = (cw - width) / 2;
        top = 0;
      } else {
        width = cw;
        height = cw / targetRatio;
        left = 0;
        top = (ch - height) / 2;
      }

      setVideoBounds({ left, top, width, height });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(el);
    window.addEventListener('resize', updateBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, [stageAspectRatio, isPreviewing, isScreenSharing]);

  // Xử lý kéo thả tự do ô Camera PiP trên khung màn hình chia sẻ
  const handlePipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      isDragging: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPipX: pipLayout.x,
      startPipY: pipLayout.y,
    };
  };

  const handlePipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetEl = videoOverlayRef.current || stageContainerRef.current;
    if (!dragStateRef.current?.isDragging || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = (e.clientX - dragStateRef.current.startClientX) / rect.width;
    const deltaY = (e.clientY - dragStateRef.current.startClientY) / rect.height;

    updatePipLayout({
      x: dragStateRef.current.startPipX + deltaX,
      y: dragStateRef.current.startPipY + deltaY,
    });
  };

  const handlePipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.isDragging) {
      dragStateRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  if (isLoadingSession) {
    return (
      <div className="flex h-[65vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-xs text-muted">Đang tải thông tin phòng phát sóng...</p>
      </div>
    );
  }

  if (isSessionError || !session) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-status-error-text/30 bg-status-error-bg p-6 text-center space-y-3 mt-12">
        <AlertTriangle className="h-8 w-8 text-status-error-text mx-auto" />
        <h2 className="font-serif text-lg font-bold text-status-error-text">
          Không tìm thấy phiên phát trực tiếp
        </h2>
        <p className="text-xs text-status-error-text/90">
          {(sessionError as Error)?.message || 'Phiên phát trực tiếp không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/creator/livestream')}
            className="gap-2 text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại Quản lý Phát trực tiếp</span>
          </Button>
        </div>
      </div>
    );
  }

  if (isSessionEnded) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#EBE4D8] bg-white p-8 sm:p-10 text-center space-y-4 mt-12 shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2] text-[#A11C27] mx-auto border border-[#EBE4D8]">
          <Clock className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-serif text-xl font-bold text-[#1C1615]">
            Phiên phát sóng này đã kết thúc
          </h2>
          <p className="text-xs text-[#5C524F] leading-relaxed max-w-sm mx-auto">
            &ldquo;{session.title}&rdquo; đã kết thúc vào {formatDateTime(session.endedAt)}. Bản ghi và lịch sử phiên đã được lưu trữ trong hệ thống Sử Ký.
          </p>
        </div>
        <div className="pt-3 flex items-center justify-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate('/creator/livestream')}
            className="gap-2 bg-[#A11C27] hover:bg-[#85151E] text-white font-semibold rounded-xl text-xs h-9 px-4 shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại danh sách</span>
          </Button>
        </div>
      </div>
    );
  }

  const showVideoPlayer = isPreviewing && (isCameraEnabled || isScreenSharing);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-128px)] lg:min-h-[540px] gap-3">
      {/* Compact Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/creator/livestream"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-surface-subtle transition-colors shrink-0"
            title="Quay lại danh sách phiên phát trực tiếp"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-mono font-semibold uppercase tracking-wider text-accent">
                PHÒNG THU TRỰC TIẾP
              </span>
              <span className="text-muted">•</span>
              <span className="text-muted truncate">{session.channelName}</span>
              {session.isExclusive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200 shrink-0">
                  <Crown className="h-3 w-3 text-amber-500" />
                  VIP
                </span>
              )}
            </div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-ink truncate">
              {session.title}
            </h1>
          </div>
        </div>

        {/* Status Indicators & End Session Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-ink shadow-xs"
            title="Số lượng thính giả đang theo dõi trực tiếp"
          >
            <Eye className={`h-3.5 w-3.5 ${isBroadcasting ? 'text-rose-500' : 'text-muted'}`} />
            <span className="font-bold font-mono tabular-nums text-ink">
              {liveViewerCountDisplay}
            </span>
            <span className="text-muted text-[11px] hidden sm:inline">đang xem</span>
          </div>

          {isBroadcasting ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>TRỰC TIẾP</span>
              <span className="border-l border-white/30 pl-1.5 font-mono tabular-nums">
                {formatBroadcastingDuration(broadcastSeconds)}
              </span>
            </div>
          ) : isJoining || isPublishing ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{isJoining ? 'Đang kết nối...' : 'Đang mở luồng...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-muted">
              <span className="h-2 w-2 rounded-full bg-muted" />
              <span>CHƯA PHÁT SÓNG</span>
            </div>
          )}

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEndDialogOpen(true)}
              className="h-7.5 px-2.5 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              title="Đóng phiên phát sóng và lưu vào lịch sử"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>Kết thúc phiên live</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Fills exact remaining viewport height without page scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-stretch">
        {/* Left Column: Video Stage + Compact Controls, Audio Mixer & Device Bar */}
        <div className="lg:col-span-8 flex flex-col gap-3 lg:h-full min-h-0">
          {/* Video Stage Container */}
          <div
            ref={stageContainerRef}
            className="relative flex-1 min-h-[280px] w-full rounded-2xl bg-neutral-950 overflow-hidden border border-border shadow-sm select-none"
          >
            <div
              ref={localVideoRef}
              id="agora-local-video-player"
              className={`h-full w-full ${!showVideoPlayer ? 'hidden' : 'block'}`}
            />

            {/* Interactive Free-Drag & Resize Camera PiP Handle when Screen Sharing */}
            {isPreviewing && isScreenSharing && isCameraEnabled && (
              <div
                ref={videoOverlayRef}
                style={
                  videoBounds
                    ? {
                        left: `${videoBounds.left}px`,
                        top: `${videoBounds.top}px`,
                        width: `${videoBounds.width}px`,
                        height: `${videoBounds.height}px`,
                      }
                    : { inset: 0 }
                }
                className="pointer-events-none absolute z-20"
              >
                <div
                  onPointerDown={handlePipPointerDown}
                  onPointerMove={handlePipPointerMove}
                  onPointerUp={handlePipPointerUp}
                  onPointerCancel={handlePipPointerUp}
                  style={{
                    left: `${pipLayout.x * 100}%`,
                    top: `${pipLayout.y * 100}%`,
                    width: `${pipLayout.scale * 100}%`,
                    height: `${pipLayout.scale * 100}%`,
                  }}
                  className="pointer-events-auto group/pip absolute rounded-xl border-2 border-dashed border-transparent hover:border-sky-400/90 hover:bg-sky-500/10 cursor-move transition-colors flex flex-col justify-between p-1.5"
                  title="Giữ chuột để kéo Camera tới vị trí bất kỳ trên màn hình"
                >
                  <div className="opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-between gap-1 bg-black/80 backdrop-blur-xs rounded-md px-1.5 py-0.5 text-[10px] text-white shadow-sm">
                    <span className="inline-flex items-center gap-1 font-medium truncate">
                      <Move className="h-3 w-3 text-sky-400 shrink-0" />
                      <span className="hidden sm:inline">Kéo di chuyển</span>
                    </span>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePipLayout({ scale: pipLayout.scale - 0.04 });
                        }}
                        className="p-0.5 hover:text-sky-300 cursor-pointer"
                        title="Thu nhỏ Camera"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePipLayout({ scale: pipLayout.scale + 0.04 });
                        }}
                        className="p-0.5 hover:text-sky-300 cursor-pointer"
                        title="Phóng to Camera"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleCamera();
                        }}
                        className="p-0.5 text-rose-300 hover:text-rose-400 cursor-pointer ml-0.5"
                        title="Ẩn Camera (nhường 100% màn hình)"
                      >
                        <VideoOff className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Muted / Off State (Only when NOT screen sharing) */}
            {isPreviewing && !isCameraEnabled && !isScreenSharing && (
              <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center text-neutral-400 space-y-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-400">
                  <VideoOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-white">Camera đang tắt</p>
                <p className="text-xs text-neutral-400">
                  Bấm nút Camera bên dưới để bật lại hình ảnh
                </p>
              </div>
            )}

            {/* Standby / Preview Not Started State */}
            {!isPreviewing && (
              <div className="h-full w-full flex flex-col items-center justify-center p-5 text-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-accent">
                  <Radio className="h-7 w-7 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    Sẵn sàng lên sóng trực tiếp
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Khởi động Camera và Microphone để kiểm tra khung hình, âm thanh hoặc chia sẻ màn hình trước khi phát sóng tới cộng đồng thính giả.
                  </p>
                </div>
                <Button
                  onClick={startPreview}
                  disabled={isStartingPreview}
                  className="gap-2 bg-accent hover:bg-accent-hover text-canvas font-semibold shadow-xs h-9 text-xs"
                >
                  {isStartingPreview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang mở thiết bị...</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span>Bật Camera & Micro (Xem trước)</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Overlay Status Chips (Top Left) */}
            {isPreviewing && (
              <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isBroadcasting
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>{isBroadcasting ? 'TRỰC TIẾP' : 'XEM TRƯỚC'}</span>
                </span>

                {isScreenSharing && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-600/90 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                    <MonitorUp className="h-3 w-3" />
                    <span>
                      {isCameraEnabled
                        ? 'CHIA SẺ MÀN HÌNH 60FPS + CAMERA (KÉO THẢ)'
                        : 'CHIA SẺ MÀN HÌNH 60FPS (ĐÃ ẨN CAM)'}
                    </span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-xs">
                  <Eye className="h-3 w-3 text-sky-400" />
                  <span className="font-mono tabular-nums">{liveViewerCountDisplay}</span>
                  <span>đang xem</span>
                </span>
              </div>
            )}

            {/* Overlay Hardware Indicators (Bottom Left) */}
            {isPreviewing && (
              <div className="absolute bottom-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs ${
                    isMicEnabled
                      ? 'bg-emerald-600/85 text-white'
                      : 'bg-rose-600/90 text-white'
                  }`}
                >
                  {isMicEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  <span>{isMicEnabled ? `Mic ${micVolume}%` : 'Mic TẮT'}</span>
                </span>

                {isScreenSharing && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs ${
                      hasScreenAudio && isScreenAudioEnabled
                        ? 'bg-sky-600/85 text-white'
                        : 'bg-neutral-800/85 text-neutral-300'
                    }`}
                  >
                    {hasScreenAudio && isScreenAudioEnabled ? (
                      <Volume2 className="h-3 w-3" />
                    ) : (
                      <VolumeX className="h-3 w-3" />
                    )}
                    <span>
                      {hasScreenAudio
                        ? isScreenAudioEnabled
                          ? `Tiếng màn hình ${screenAudioVolume}%`
                          : 'Tiếng màn hình TẮT'
                        : 'Chỉ chia sẻ hình'}
                    </span>
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-xs ${
                    isCameraEnabled
                      ? 'bg-emerald-600/85 text-white'
                      : 'bg-rose-600/90 text-white'
                  }`}
                >
                  {isCameraEnabled ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                  <span>{isCameraEnabled ? 'Cam BẬT' : 'Cam ẨN'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Reconnecting / Error Banners */}
          {connectionState === 'RECONNECTING' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs text-amber-900 flex items-center gap-2 shadow-xs shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
              <span>Đang mất kết nối tạm thời. Hệ thống đang tự động khôi phục đường truyền phát sóng...</span>
            </div>
          )}

          {(publisherError || isMockTokenDetected) && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs text-rose-800 flex items-center justify-between gap-3 shadow-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="truncate">
                  {publisherError || 'Không thể thiết lập kết nối phát sóng trực tiếp. Vui lòng thử lại.'}
                </span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-rose-600 hover:text-rose-800 px-1.5 py-0.5 font-bold text-xs shrink-0 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Compact Studio Control, Audio Volume Mixer & Inline Device Bar */}
          <div className="shrink-0 rounded-2xl border border-border bg-surface p-3 shadow-xs space-y-2.5">
            {/* Row 1: Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant={isMicEnabled ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={toggleMicrophone}
                  disabled={!isPreviewing}
                  className={`gap-1.5 text-xs h-8.5 px-2.5 ${
                    !isMicEnabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
                  }`}
                  title={isMicEnabled ? 'Tắt micro' : 'Bật micro'}
                >
                  {isMicEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                  <span>{isMicEnabled ? 'Micro' : 'Đã tắt Mic'}</span>
                </Button>

                <Button
                  variant={isCameraEnabled ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={toggleCamera}
                  disabled={!isPreviewing}
                  className={`gap-1.5 text-xs h-8.5 px-2.5 ${
                    !isCameraEnabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
                  }`}
                  title={
                    isScreenSharing
                      ? isCameraEnabled
                        ? 'Ẩn ô Camera nhỏ để hiện 100% màn hình'
                        : 'Hiện lại ô Camera nhỏ trên màn hình chia sẻ'
                      : isCameraEnabled
                      ? 'Tắt hình ảnh Camera'
                      : 'Bật hình ảnh Camera'
                  }
                >
                  {isCameraEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                  <span>
                    {isScreenSharing
                      ? isCameraEnabled
                        ? 'Ẩn Cam góc'
                        : 'Hiện Cam góc'
                      : isCameraEnabled
                      ? 'Camera'
                      : 'Đã tắt Cam'}
                  </span>
                </Button>

                <Button
                  variant={isScreenSharing ? 'primary' : 'outline'}
                  size="sm"
                  onClick={toggleScreenShare}
                  disabled={!isPreviewing || isDeviceSwitching || isJoining || isPublishing}
                  className={`gap-1.5 text-xs h-8.5 px-2.5 ${
                    isScreenSharing
                      ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600'
                      : ''
                  }`}
                  title={
                    isScreenSharing
                      ? 'Dừng chia sẻ màn hình và quay lại Camera'
                      : 'Chia sẻ màn hình 60fps kèm Camera góc nhỏ & thu tiếng màn hình'
                  }
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorOff className="h-3.5 w-3.5" />
                      <span>Dừng chia sẻ</span>
                    </>
                  ) : (
                    <>
                      <MonitorUp className="h-3.5 w-3.5" />
                      <span>Chia sẻ màn hình</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPreviewing ? stopPreview : startPreview}
                  disabled={isStartingPreview || isStoppingBroadcast}
                  className="gap-1.5 text-xs h-8.5 px-2.5 text-muted hover:text-ink"
                >
                  {isStartingPreview ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isStartingPreview
                      ? 'Đang mở...'
                      : isPreviewing
                      ? 'Tắt xem trước'
                      : 'Bật xem trước'}
                  </span>
                </Button>
              </div>

              <div>
                {!isBroadcasting ? (
                  <Button
                    onClick={() => startBroadcasting(sessionId)}
                    disabled={!isPreviewing || isJoining || isPublishing || isStartingPreview}
                    className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 h-8.5 text-xs shadow-xs cursor-pointer"
                  >
                    {isJoining || isPublishing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang lên sóng...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="h-3.5 w-3.5" />
                        <span>BẮT ĐẦU PHÁT SÓNG</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopBroadcasting}
                    disabled={isStoppingBroadcast}
                    variant="outline"
                    className="gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold px-3.5 h-8.5 text-xs shadow-xs cursor-pointer"
                  >
                    {isStoppingBroadcast ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang dừng...</span>
                      </>
                    ) : (
                      <>
                        <StopCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Dừng phát sóng</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Row 2: Audio Volume Sliders (Mic Volume & Screen/Live Audio Volume) */}
            <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mic Volume Slider */}
              <div className="flex items-center gap-2 rounded-lg bg-surface-subtle/50 px-2.5 py-1.5 border border-border/50">
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  disabled={!isPreviewing}
                  className={`flex items-center gap-1 text-[11px] font-medium shrink-0 cursor-pointer ${
                    isMicEnabled ? 'text-ink' : 'text-rose-600'
                  }`}
                  title={isMicEnabled ? 'Bấm để tắt nhanh Micro' : 'Bấm để bật lại Micro'}
                >
                  {isMicEnabled ? (
                    <Mic className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <MicOff className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span>Âm lượng Mic</span>
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMicEnabled ? micVolume : 0}
                  onChange={(e) => changeMicVolume(Number(e.target.value))}
                  disabled={!isPreviewing}
                  aria-label="Âm lượng Microphone"
                  className="flex-1 h-1.5 accent-accent cursor-pointer disabled:opacity-40"
                />
                <span className="font-mono text-[11px] font-semibold text-ink w-9 text-right tabular-nums">
                  {isMicEnabled ? `${micVolume}%` : 'Tắt'}
                </span>
              </div>

              {/* Screen / Live Audio Volume Slider */}
              <div className="flex items-center gap-2 rounded-lg bg-surface-subtle/50 px-2.5 py-1.5 border border-border/50">
                <button
                  type="button"
                  onClick={toggleScreenAudio}
                  disabled={!isPreviewing}
                  className={`flex items-center gap-1 text-[11px] font-medium shrink-0 cursor-pointer ${
                    isScreenAudioEnabled ? 'text-ink' : 'text-rose-600'
                  }`}
                  title={
                    isScreenAudioEnabled
                      ? 'Bấm để tắt nhanh tiếng màn hình chia sẻ'
                      : 'Bấm để bật lại tiếng màn hình chia sẻ'
                  }
                >
                  {isScreenAudioEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-sky-600" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span>Tiếng màn hình</span>
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isScreenAudioEnabled ? screenAudioVolume : 0}
                  onChange={(e) => changeScreenAudioVolume(Number(e.target.value))}
                  disabled={!isPreviewing}
                  aria-label="Âm lượng màn hình chia sẻ"
                  className="flex-1 h-1.5 accent-sky-600 cursor-pointer disabled:opacity-40"
                />
                <span
                  className="font-mono text-[11px] font-semibold text-ink w-9 text-right tabular-nums truncate"
                  title={
                    isScreenSharing && !hasScreenAudio
                      ? 'Trình duyệt chưa cấp quyền thu tiếng hệ thống/thẻ (tích chọn "Chia sẻ âm thanh" khi chọn màn hình)'
                      : undefined
                  }
                >
                  {isScreenAudioEnabled ? `${screenAudioVolume}%` : 'Tắt'}
                </span>
              </div>
            </div>

            {/* Row 3: Inline Compact Hardware Selectors */}
            <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted flex items-center gap-1 shrink-0 w-16">
                  <Settings2 className="h-3 w-3 text-accent" />
                  <span>Camera</span>
                </span>
                <Select
                  value={selectedCameraId}
                  onChange={(e) => switchCamera(e.target.value)}
                  disabled={!isPreviewing || isDeviceSwitching}
                  className="h-8 text-xs flex-1"
                >
                  {cameras.length === 0 ? (
                    <option value="">
                      {isPreviewing ? 'Không tìm thấy camera' : 'Bật xem trước để chọn camera'}
                    </option>
                  ) : (
                    cameras.map((cam, idx) => (
                      <option key={cam.deviceId || idx} value={cam.deviceId}>
                        {formatDeviceLabel(cam, 'video', idx)}
                      </option>
                    ))
                  )}
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted flex items-center gap-1 shrink-0 w-16">
                  <Mic className="h-3 w-3 text-accent" />
                  <span>Micro</span>
                </span>
                <Select
                  value={selectedMicrophoneId}
                  onChange={(e) => switchMicrophone(e.target.value)}
                  disabled={!isPreviewing || isDeviceSwitching}
                  className="h-8 text-xs flex-1"
                >
                  {microphones.length === 0 ? (
                    <option value="">
                      {isPreviewing ? 'Không tìm thấy micro' : 'Bật xem trước để chọn micro'}
                    </option>
                  ) : (
                    microphones.map((mic, idx) => (
                      <option key={mic.deviceId || idx} value={mic.deviceId}>
                        {formatDeviceLabel(mic, 'audio', idx)}
                      </option>
                    ))
                  )}
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat Panel matched to Left Column height */}
        <div className="lg:col-span-4 flex flex-col lg:h-full min-h-0">
          <LivestreamChatPanel
            sessionId={sessionId}
            isSessionEnded={isSessionEnded}
            className="flex-1"
          />
        </div>
      </div>

      {/* End Session Confirm Dialog */}
      <EndLivestreamConfirmDialog
        session={session}
        isOpen={isEndDialogOpen}
        onClose={() => setIsEndDialogOpen(false)}
        onSuccess={async () => {
          try {
            await stopBroadcasting();
          } catch {
            /* ignore cleanup error during navigation */
          }
          try {
            await stopPreview();
          } catch {
            /* ignore cleanup error during navigation */
          }
          navigate('/creator/livestream');
        }}
      />
    </div>
  );
};
