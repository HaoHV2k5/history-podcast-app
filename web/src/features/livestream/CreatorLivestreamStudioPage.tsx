import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Radio,
  ChevronLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Eye,
  Crown,
  StopCircle,
  AlertTriangle,
  Loader2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const user = useAuthStore((s) => s.user);
  const sessionId = Number(id);

  // End session dialog state
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);

  // Agora publisher hook with device selection and resilience controls
  const {
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

    connectionState,
    isJoining,
    isPublishing,
    isBroadcasting,
    isStoppingBroadcast,
    broadcastSeconds,
    error: publisherError,
    isMockTokenDetected,
    agoraChannelName,
    startPreview,
    stopPreview,
    toggleCamera,
    toggleMicrophone,
    startBroadcasting,
    stopBroadcasting,
    clearError,
  } = useAgoraPublisher();

  // 1. Fetch Session Details with controlled refresh for backend viewer counter
  const {
    data: sessionRes,
    isLoading: isLoadingSession,
    isError: isSessionError,
    error: sessionError,
  } = useQuery({
    queryKey: ['creator-livestream-detail', sessionId],
    queryFn: () => livestreamApi.getSession(sessionId),
    enabled: !isNaN(sessionId) && sessionId > 0,
    // Step 6: Backend-based viewer counter refresh (chu kỳ 10s khi đang hoạt động, tự dừng khi ENDED)
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'ENDED') return false;
      return 10000;
    },
  });

  const session = sessionRes?.data;
  const isOwner = canManageLivestream(session, user?.id);
  const isSessionEnded = session?.status === 'ENDED';

  // Loading state
  if (isLoadingSession) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-xs text-muted">Đang tải thông tin phòng phát sóng...</p>
      </div>
    );
  }

  // Error or Not Found state
  if (isSessionError || !session) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-status-error-text/30 bg-status-error-bg p-6 text-center space-y-3 mt-12">
        <AlertTriangle className="h-8 w-8 text-status-error-text mx-auto" />
        <h2 className="font-serif text-lg font-bold text-status-error-text">
          Không tìm thấy phiên livestream
        </h2>
        <p className="text-xs text-status-error-text/90">
          {(sessionError as Error)?.message || 'Phiên livestream không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/creator/livestream')}
            className="gap-2 text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại Livestream Hub</span>
          </Button>
        </div>
      </div>
    );
  }

  // Session has already ended
  if (isSessionEnded) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-8 text-center space-y-4 mt-12 shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-muted mx-auto">
          <Clock className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-lg font-bold text-ink">
            Phiên phát sóng này đã kết thúc
          </h2>
          <p className="text-xs text-muted">
            &ldquo;{session.title}&rdquo; đã kết thúc vào {formatDateTime(session.endedAt)}. Không thể tiếp tục phát sóng lại phiên này.
          </p>
        </div>
        <div className="pt-2">
          <Button
            size="sm"
            onClick={() => navigate('/creator/livestream')}
            className="gap-2 bg-accent hover:bg-accent-hover text-canvas"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại danh sách phiên</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Studio Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/creator/livestream"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-surface-subtle transition-colors shrink-0"
            title="Quay lại Livestream Hub"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
                STUDIO PHÁT SÓNG (AGORA RTC)
              </span>
              <span className="text-muted">•</span>
              <span className="text-[11px] text-muted">Kênh: {session.channelName}</span>
              {session.isExclusive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                  <Crown className="h-3 w-3 text-amber-500" />
                  VIP
                </span>
              )}
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink line-clamp-1">
              {session.title}
            </h1>
          </div>
        </div>

        {/* Status Indicators & Duration */}
        <div className="flex items-center gap-2.5">
          {/* Backend Viewer Counter (Làm mới mỗi 10 giây) */}
          <div
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink shadow-xs"
            title="Số lượng người xem do máy chủ thống kê (làm mới tự động mỗi 10 giây)"
          >
            <Eye className="h-3.5 w-3.5 text-sky-500" />
            <span className="font-bold font-mono text-ink">
              {formatLivestreamViewerCount(session.viewerCount)}
            </span>
            <span className="text-muted text-[11px] hidden sm:inline">người xem</span>
          </div>

          {isBroadcasting ? (
            <div className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
              <span>TRỰC TIẾP</span>
              <span className="border-l border-white/30 pl-2 font-mono">
                {formatBroadcastingDuration(broadcastSeconds)}
              </span>
            </div>
          ) : isJoining || isPublishing ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{isJoining ? 'Đang kết nối Agora...' : 'Đang phát luồng...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-1.5 text-xs font-medium text-muted">
              <span className="h-2 w-2 rounded-full bg-muted" />
              <span>CHƯA PHÁT SÓNG</span>
            </div>
          )}

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEndDialogOpen(true)}
              className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              title="Đóng phòng phát sóng trên máy chủ"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>Kết thúc phiên live</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Left (Video & Controls) / Right (Diagnostics & Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Video Preview & Broadcaster Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* Local Video Stage Container */}
          <div className="relative aspect-video w-full rounded-2xl bg-neutral-950 overflow-hidden border border-border shadow-md">
            {/* Stable video container for Agora RTC local playback */}
            <div
              ref={localVideoRef}
              id="agora-local-video-player"
              className={`h-full w-full ${!isPreviewing || !isCameraEnabled ? 'hidden' : 'block'}`}
            />

            {/* Camera Muted / Off State */}
            {isPreviewing && !isCameraEnabled && (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-neutral-400 space-y-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-neutral-400">
                  <VideoOff className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-white">Camera đang tắt</p>
                <p className="text-xs text-neutral-400">
                  Bấm biểu tượng camera bên dưới để bật lại hình ảnh
                </p>
              </div>
            )}

            {/* Standby / Preview Not Started State */}
            {!isPreviewing && (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-accent">
                  <Radio className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="font-serif text-lg font-bold text-white">
                    Sẵn sàng phát sóng trực tiếp
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Khởi động Camera và Microphone để xem trước khung hình và kiểm tra âm thanh trước khi phát sóng tới cộng đồng thính giả.
                  </p>
                </div>
                <Button
                  onClick={startPreview}
                  className="gap-2 bg-accent hover:bg-accent-hover text-canvas font-semibold shadow-xs"
                >
                  <Video className="h-4 w-4" />
                  <span>Bật Camera & Micro (Xem trước)</span>
                </Button>
              </div>
            )}

            {/* Overlay Status Chips (Top Left) */}
            {isPreviewing && (
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isBroadcasting
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>{isBroadcasting ? 'ON AIR' : 'XEM TRƯỚC (PREVIEW)'}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-xs">
                  <Eye className="h-3 w-3 text-sky-400" />
                  <span>{formatLivestreamViewerCount(session.viewerCount)} xem</span>
                </span>
              </div>
            )}

            {/* Overlay Hardware Indicators (Bottom Left) */}
            {isPreviewing && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium backdrop-blur-xs ${
                    isMicEnabled
                      ? 'bg-emerald-500/80 text-white'
                      : 'bg-rose-500/90 text-white'
                  }`}
                >
                  {isMicEnabled ? (
                    <>
                      <Mic className="h-3 w-3" />
                      <span>Micro BẬT</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-3 w-3" />
                      <span>Micro TẮT</span>
                    </>
                  )}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium backdrop-blur-xs ${
                    isCameraEnabled
                      ? 'bg-emerald-500/80 text-white'
                      : 'bg-rose-500/90 text-white'
                  }`}
                >
                  {isCameraEnabled ? (
                    <>
                      <Video className="h-3 w-3" />
                      <span>Camera BẬT</span>
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-3 w-3" />
                      <span>Camera TẮT</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Reconnecting Network Banner */}
          {connectionState === 'RECONNECTING' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2.5 shadow-xs">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
              <span>Đang mất kết nối tạm thời. Hệ thống đang tự động kết nối lại luồng phát sóng Agora...</span>
            </div>
          )}

          {/* Error Banner */}
          {publisherError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-950">Lỗi kết nối / phần cứng</p>
                  <p className="leading-relaxed">{publisherError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Studio Control Toolbar */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Left Controls: Media Track Toggles */}
            <div className="flex items-center gap-2">
              <Button
                variant={isMicEnabled ? 'outline' : 'destructive'}
                size="sm"
                onClick={toggleMicrophone}
                disabled={!isPreviewing}
                className={`gap-1.5 text-xs h-9 ${
                  !isMicEnabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
                }`}
                title={isMicEnabled ? 'Tắt micro' : 'Bật micro'}
              >
                {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <span className="hidden sm:inline">{isMicEnabled ? 'Micro' : 'Tắt Mic'}</span>
              </Button>

              <Button
                variant={isCameraEnabled ? 'outline' : 'destructive'}
                size="sm"
                onClick={toggleCamera}
                disabled={!isPreviewing}
                className={`gap-1.5 text-xs h-9 ${
                  !isCameraEnabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
                }`}
                title={isCameraEnabled ? 'Tắt camera' : 'Bật camera'}
              >
                {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                <span className="hidden sm:inline">{isCameraEnabled ? 'Camera' : 'Tắt Cam'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={isPreviewing ? stopPreview : startPreview}
                disabled={isStartingPreview || isStoppingBroadcast}
                className="gap-1.5 text-xs h-9"
              >
                {isStartingPreview ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                <span>
                  {isStartingPreview
                    ? 'Đang khởi động...'
                    : isPreviewing
                    ? 'Dừng xem trước'
                    : 'Bật xem trước'}
                </span>
              </Button>
            </div>

            {/* Right Controls: Start / Stop Broadcast */}
            <div className="flex items-center gap-2">
              {!isBroadcasting ? (
                <Button
                  onClick={() => startBroadcasting(sessionId)}
                  disabled={!isPreviewing || isJoining || isPublishing || isStartingPreview}
                  className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 h-10 shadow-xs cursor-pointer"
                >
                  {isJoining || isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang kết nối...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" />
                      <span>BẮT ĐẦU PHÁT SÓNG</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={stopBroadcasting}
                  disabled={isStoppingBroadcast}
                  variant="outline"
                  className="gap-2 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold px-4 h-10 shadow-xs cursor-pointer"
                >
                  {isStoppingBroadcast ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang dừng...</span>
                    </>
                  ) : (
                    <>
                      <StopCircle className="h-4 w-4 text-rose-600" />
                      <span>Dừng phát sóng</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Hardware Device Selection Card (Camera & Microphone) */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-accent" />
                <h3 className="font-serif text-xs font-bold text-ink">
                  Thiết bị thu hình & âm thanh
                </h3>
              </div>
              <span className="text-[11px] text-muted">
                {isPreviewing ? 'Đang bật xem trước' : 'Chưa bật xem trước'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-ink" />
                  <span>Camera</span>
                </label>
                <Select
                  value={selectedCameraId}
                  onChange={(e) => switchCamera(e.target.value)}
                  disabled={!isPreviewing || isDeviceSwitching}
                  className="h-9 text-xs"
                >
                  {cameras.length === 0 ? (
                    <option value="">{isPreviewing ? 'Không tìm thấy camera' : 'Bật xem trước để chọn camera'}</option>
                  ) : (
                    cameras.map((cam, idx) => (
                      <option key={cam.deviceId || idx} value={cam.deviceId}>
                        {formatDeviceLabel(cam, 'video', idx)}
                      </option>
                    ))
                  )}
                </Select>
              </div>

              {/* Microphone Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-ink" />
                  <span>Microphone</span>
                </label>
                <Select
                  value={selectedMicrophoneId}
                  onChange={(e) => switchMicrophone(e.target.value)}
                  disabled={!isPreviewing || isDeviceSwitching}
                  className="h-9 text-xs"
                >
                  {microphones.length === 0 ? (
                    <option value="">{isPreviewing ? 'Không tìm thấy microphone' : 'Bật xem trước để chọn micro'}</option>
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

            {/* Note on safe device switching */}
            <p className="text-[10px] text-muted leading-relaxed">
              * Khuyến nghị: Thiết lập camera và micro phù hợp trong chế độ xem trước (Preview) trước khi phát sóng trực tiếp để đảm bảo chất lượng hình ảnh và âm thanh ổn định nhất.
            </p>
          </div>
        </div>

        {/* Right Column: Connection Diagnostics & Session Info */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mock Token Warning Card (If Backend has unconfigured Agora App ID) */}
          {isMockTokenDetected && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2 shadow-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="font-bold text-amber-950">Chế độ giả lập (Mock Token)</p>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Máy chủ Backend hiện chưa được cấu hình <code>app.agora.app-id</code> hoặc <code>app.agora.app-certificate</code>. Backend đang sinh token giả lập để kiểm thử luồng REST API.
              </p>
              <div className="rounded-md border border-amber-200 bg-white/70 p-2 text-[10px] text-amber-900 space-y-1">
                <p className="font-semibold">Để kích hoạt WebRTC Video thật:</p>
                <p>1. Cấu hình biến môi trường Agora trên Spring Boot Backend.</p>
                <p>2. Khởi tạo lại phiên phát sóng với App ID hợp lệ.</p>
              </div>
            </div>
          )}

          {/* Session Overview Card */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs text-xs">
            <h3 className="font-serif text-sm font-bold text-ink border-b border-border pb-2 flex items-center justify-between">
              <span>Thông tin phòng live</span>
              <Badge variant="outline" className="text-[10px]">
                ID: #{session.id}
              </Badge>
            </h3>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Kênh Agora RTC
                </span>
                <p className="mt-0.5 font-mono text-xs font-bold text-accent truncate" title={session.agoraChannelName}>
                  {agoraChannelName || session.agoraChannelName}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Thời gian bắt đầu
                </span>
                <p className="mt-0.5 font-medium text-ink">
                  {formatDateTime(session.startedAt)}
                </p>
              </div>

              {session.description && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Mô tả
                  </span>
                  <p className="mt-0.5 text-muted leading-relaxed line-clamp-3">
                    {session.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Technical Diagnostics Card */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs text-xs">
            <h3 className="font-serif text-sm font-bold text-ink border-b border-border pb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Thông số kỹ thuật Agora</span>
            </h3>

            <div className="space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Trạng thái kết nối RTC:</span>
                <span
                  className={`font-semibold ${
                    connectionState === 'CONNECTED'
                      ? 'text-emerald-600 font-bold'
                      : connectionState === 'CONNECTING'
                      ? 'text-amber-600'
                      : 'text-muted'
                  }`}
                >
                  {connectionState}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Vai trò luồng (Role):</span>
                <span className="font-semibold text-ink">PUBLISHER (Host)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">SDK Version:</span>
                <span className="font-mono text-ink">agora-rtc-sdk-ng v4.24.9</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Video Codec:</span>
                <span className="font-mono text-ink">VP8 (Mode: Live)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Độ phân giải:</span>
                <span className="font-mono text-ink">720p HD (30 FPS)</span>
              </div>
            </div>
          </div>

          {/* Live Chat Panel Component */}
          <LivestreamChatPanel
            sessionId={sessionId}
            isSessionEnded={isSessionEnded}
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
