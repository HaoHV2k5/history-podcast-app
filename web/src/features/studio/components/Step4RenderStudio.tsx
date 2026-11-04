import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import {
  Clapperboard,
  Film,
  Video,
  Download,
  Terminal,
  Volume2,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CreatorJobStatusResponse,
  CreatorVoiceItem,
  StoryboardResponse,
} from '@/types/creatorStudio';
import { CreatorVideoItem } from '@/types/creatorContent';
import { resolveMediaUrl, validateSceneImages } from '../creatorStudioUtils';
import { SceneImageUploadDropzone } from './SceneImageUploadDropzone';

interface Step4RenderStudioProps {
  renderMode: 'whiteboard' | 'audio_podcast';
  setRenderMode: (mode: 'whiteboard' | 'audio_podcast') => void;
  renderTitle: string;
  setRenderTitle: (title: string) => void;
  renderDurationSec: number;
  selectedVoice: CreatorVoiceItem | undefined;
  storyboard: StoryboardResponse | null;
  sceneImages: Record<string, string>;
  coverImageUrl: string;
  setCoverImageUrl: (url: string) => void;
  uploadingCover: boolean;
  onUploadCoverImage: (file: File) => Promise<void>;
  onStartRender: () => void;
  isStartingRender: boolean;
  isCheckingSoftGuard?: boolean;
  renderError: Error | null;
  // Active Job Monitoring
  activeJobId: string | null;
  jobStatus: CreatorJobStatusResponse | null;
  pollingError: string | null;
  // Submit Moderation
  activeContentId: number | null;
  onSubmitPublish: () => void;
  isSubmittingPublish: boolean;
  publishResult: CreatorVideoItem | null;
  publishError: Error | null;
  // Navigation
  onPrevStep: () => void;
  onResetNewVideo: () => void;
  onGoToContentLibrary: () => void;
}

export const Step4RenderStudio: React.FC<Step4RenderStudioProps> = ({
  renderMode,
  setRenderMode: _setRenderMode,
  renderTitle,
  setRenderTitle: _setRenderTitle,
  renderDurationSec,
  selectedVoice,
  storyboard,
  sceneImages,
  coverImageUrl,
  setCoverImageUrl,
  uploadingCover,
  onUploadCoverImage,
  onStartRender,
  isStartingRender,
  isCheckingSoftGuard = false,
  renderError,
  activeJobId,
  jobStatus,
  pollingError,
  activeContentId,
  onSubmitPublish,
  isSubmittingPublish,
  publishResult,
  publishError,
  onPrevStep,
  onResetNewVideo,
  onGoToContentLibrary,
}) => {
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const scenes = storyboard?.scenes || [];
  const sceneValidation = validateSceneImages(scenes, sceneImages);

  const isCompleted = jobStatus?.status === 'completed';
  const isFailed = jobStatus?.status === 'failed';
  const isRunning = activeJobId && !isCompleted && !isFailed;

  const progressBarRef = useRef<HTMLDivElement>(null);
  const stepsGridRef = useRef<HTMLDivElement>(null);
  const completedContainerRef = useRef<HTMLDivElement>(null);
  const softGuardProgressRef = useRef<HTMLDivElement>(null);
  const softGuardTweenRef = useRef<gsap.core.Timeline | null>(null);

  // 6-step progress calculation
  const currentStep = jobStatus?.step || 1;
  const totalSteps = jobStatus?.total_steps || 6;
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  const STEP_ITEMS = [
    { num: 1, title: 'Khởi tạo', desc: 'Môi trường đồ họa' },
    { num: 2, title: 'Lồng tiếng AI', desc: 'Thuyết minh TTS' },
    { num: 3, title: 'Phụ đề SRT', desc: 'Khớp thời gian' },
    { num: 4, title: 'Render MP4', desc: 'Khung hình video' },
    { num: 5, title: 'Lưu trữ Cloud', desc: 'Đồng bộ đám mây' },
    { num: 6, title: 'Hoàn tất', desc: 'Sẵn sàng phát' },
  ];

  // GSAP Progress Bar Animation
  useEffect(() => {
    if (isReducedMotion() || !progressBarRef.current) return;
    gsap.to(progressBarRef.current, {
      width: `${progressPercent}%`,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, [progressPercent]);

  // GSAP Smooth Progressive Animation for AI Shield Historical Verification
  useEffect(() => {
    if (!softGuardProgressRef.current) return;

    if (isCheckingSoftGuard) {
      if (isReducedMotion()) {
        softGuardProgressRef.current.style.width = '75%';
        return;
      }

      if (softGuardTweenRef.current) {
        softGuardTweenRef.current.kill();
      }

      gsap.set(softGuardProgressRef.current, { width: '0%' });

      // Smooth realistic progress animation:
      // Starts responsive: 0% -> 28% in 0.7s -> 65% in 1.8s -> steadily up to 92% in 3.5s
      const tl = gsap.timeline();
      tl.to(softGuardProgressRef.current, {
        width: '28%',
        duration: 0.7,
        ease: 'power2.out',
      })
      .to(softGuardProgressRef.current, {
        width: '65%',
        duration: 1.8,
        ease: 'power1.inOut',
      })
      .to(softGuardProgressRef.current, {
        width: '92%',
        duration: 3.5,
        ease: 'power1.out',
      });

      softGuardTweenRef.current = tl;
    } else {
      if (softGuardTweenRef.current) {
        softGuardTweenRef.current.kill();
        softGuardTweenRef.current = null;
      }
      if (softGuardProgressRef.current) {
        gsap.to(softGuardProgressRef.current, {
          width: '100%',
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    }

    return () => {
      if (softGuardTweenRef.current) {
        softGuardTweenRef.current.kill();
        softGuardTweenRef.current = null;
      }
    };
  }, [isCheckingSoftGuard]);

  // GSAP Active Step Animation
  useEffect(() => {
    if (isReducedMotion() || !stepsGridRef.current || !isRunning) return;
    const currentCard = stepsGridRef.current.children[currentStep - 1];
    if (currentCard) {
      gsap.fromTo(
        currentCard,
        { scale: 0.97 },
        { scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
      );
    }
  }, [currentStep, isRunning]);

  // GSAP Entrance Stagger for Completed View
  useEffect(() => {
    if (isReducedMotion() || !completedContainerRef.current || !isCompleted) return;
    const items = completedContainerRef.current.querySelectorAll('[data-completion-item]');
    if (!items.length) return;
    gsap.fromTo(
      items,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
    );
  }, [isCompleted]);

  return (
    <div className="space-y-6 w-full">
      {/* =========================================================================
          VIEW A: ACTIVE RENDERING IN PROGRESS OR COMPLETED
         ========================================================================= */}
      {activeJobId ? (
        <div className="space-y-6">
          {/* Header Status Card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Clapperboard className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-serif text-sm font-bold text-ink">
                    {isCompleted
                      ? 'Kết Xuất Video Thành Công!'
                      : isFailed
                      ? 'Kết Xuất Video Thất Bại'
                      : 'Đang Kết Xuất Video & Thuyết Minh...'}
                  </h3>
                  <span className="text-[11px] text-muted font-mono">Mã tiến trình: {activeJobId}</span>
                </div>
              </div>

              <Badge
                variant={isCompleted ? 'success' : isFailed ? 'error' : 'accent'}
                className="font-sans text-xs font-semibold tabular-nums"
              >
                {isCompleted ? 'Hoàn tất (100%)' : isFailed ? 'Thất bại' : `Đang xử lý (${progressPercent}%)`}
              </Badge>
            </div>

            {pollingError && (
              <div className="p-3 rounded-lg border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pollingError}</span>
              </div>
            )}

            {/* Progress Bar (Visible while rendering) */}
            {isRunning && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-ink flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-accent animate-spin" />
                    <span>
                      Bước {currentStep}/{totalSteps}: {jobStatus?.step_name || STEP_ITEMS[currentStep - 1]?.title || 'Đang xử lý...'}
                    </span>
                  </span>
                  <span className="text-accent font-sans font-bold text-sm tabular-nums">{progressPercent}%</span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-surface-subtle overflow-hidden border border-border">
                  <div
                    ref={progressBarRef}
                    className="h-full bg-accent rounded-full transition-[width] duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div ref={stepsGridRef} className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                  {STEP_ITEMS.map((item, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep > stepNum;
                    const isCurrent = currentStep === stepNum;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-center transition-[background-color,border-color,transform] flex flex-col items-center justify-center gap-0.5 ${
                          isDone
                            ? 'border-status-success-text/30 bg-status-success-bg/25 text-ink'
                            : isCurrent
                            ? 'border-accent bg-accent-soft/40 text-accent font-semibold ring-1 ring-accent shadow-2xs'
                            : 'border-border/60 bg-surface-subtle/30 text-muted opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isDone ? (
                            <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                          ) : (
                            <span className="text-[11px] font-sans font-bold tabular-nums">
                              {stepNum}
                            </span>
                          )}
                          <span className="text-xs font-semibold tracking-tight text-ink">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted leading-tight font-sans">
                          {item.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Failure Message */}
            {isFailed && (
              <div className="p-4 rounded-xl border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Quá trình kết xuất video gặp sự cố</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {jobStatus?.logs?.slice(-1)[0] || 'Máy chủ render báo lỗi. Vui lòng kiểm tra lại cấu hình API key hoặc thử lại.'}
                </p>
                <Button size="sm" variant="outline" onClick={onResetNewVideo} className="text-xs mt-2">
                  Thử kết xuất lại
                </Button>
              </div>
            )}

            {/* Live Logs Terminal Toggle */}
            {jobStatus?.logs && jobStatus.logs.length > 0 && (
              <div className="pt-2 border-t border-border space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-xs text-muted hover:text-ink gap-1.5 h-7 px-2"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>{showLogs ? 'Thu gọn nhật ký kết xuất' : 'Xem nhật ký kết xuất trực tiếp'}</span>
                  {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>

                {showLogs && (
                  <div className="p-3.5 rounded-lg bg-surface-subtle border border-border text-[11px] font-mono text-muted max-h-[180px] overflow-y-auto space-y-1">
                    {jobStatus.logs.map((log, idx) => (
                      <p key={idx} className="leading-relaxed">
                        <span className="text-accent mr-1">&gt;</span>
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COMPLETED VIDEO & ACTIONS VIEW */}
          {isCompleted && (
            <div ref={completedContainerRef} className="space-y-6">
              {/* 1. Celebratory Success Hero Banner */}
              <div
                data-completion-item
                className="p-5 sm:p-6 rounded-xl border border-status-success-text/30 bg-status-success-bg/25 border-l-4 border-l-status-success-text flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-status-success-text text-canvas shadow-2xs">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="success" className="font-semibold text-xs px-2.5 py-0.5">
                        KẾT XUẤT THÀNH CÔNG • 100%
                      </Badge>
                      <span className="text-xs text-muted font-medium">
                        {renderMode === 'whiteboard'
                          ? 'Hoạt Họa Bảng Trắng 1080p'
                          : 'Bản Thuyết Minh Audio Podcast'}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-ink">
                      Tác phẩm video đã hoàn thành xuất sắc!
                    </h3>
                    <p className="text-xs text-muted leading-relaxed max-w-2xl">
                      {renderMode === 'whiteboard'
                        ? 'Toàn bộ nét vẽ phác thảo tay, giọng đọc thuyết minh chuẩn sắc và phụ đề đã được đồng bộ chính xác vào video MP4.'
                        : 'Bản thu âm thanh chất lượng cao kết hợp hình ảnh bìa và sóng âm đã sẵn sàng phát hành.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {jobStatus?.video_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.video_url)}
                      download="final_video.mp4"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-canvas font-semibold text-xs hover:bg-accent/90 transition-[background-color,transform] active:scale-[0.98]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Tải MP4 Ngay</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 2. Cinema Screening Room Preview Card */}
              <div
                data-completion-item
                className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                      <Film className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-ink">
                        Bản Chiếu Xem Trước (Preview Thành Phẩm)
                      </h3>
                      {renderTitle && (
                        <p className="text-[11px] text-muted truncate max-w-md">
                          {renderTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-muted border-border font-medium">
                      Định dạng MP4 • 1080p
                    </Badge>
                    {jobStatus?.srt_url && (
                      <Badge variant="outline" className="text-xs text-status-success-text border-status-success-text/30 bg-status-success-bg/20 font-medium">
                        Phụ đề SRT đồng bộ
                      </Badge>
                    )}
                  </div>
                </div>

                {/* HTML5 Video Player Frame */}
                {jobStatus?.video_url && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video max-w-3xl mx-auto">
                    <video
                      controls
                      src={resolveMediaUrl(jobStatus.video_url)}
                      poster={coverImageUrl || undefined}
                      className="w-full h-full object-contain"
                    >
                      Trình duyệt không hỗ trợ thẻ video HTML5.
                    </video>
                  </div>
                )}

                {/* Optional HTML5 Audio Player - STRICTLY ONLY for audio_podcast */}
                {renderMode === 'audio_podcast' && jobStatus?.audio_url && (
                  <div className="p-4 rounded-xl border border-border bg-surface-subtle/50 max-w-3xl mx-auto space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-accent" />
                        <span>Bản thu âm thanh thuyết minh (MP3)</span>
                      </span>
                      <a
                        href={resolveMediaUrl(jobStatus.audio_url)}
                        download="podcast_voice.mp3"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent hover:underline flex items-center gap-1 font-sans font-medium"
                      >
                        <Download className="h-3 w-3" />
                        <span>Tải MP3</span>
                      </a>
                    </div>
                    <audio
                      controls
                      src={resolveMediaUrl(jobStatus.audio_url)}
                      className="w-full h-8"
                    >
                      Trình duyệt không hỗ trợ thẻ audio.
                    </audio>
                  </div>
                )}

                {/* Download & Export Action Bar */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {jobStatus?.video_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.video_url)}
                      download="final_video.mp4"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-xs hover:bg-accent/90 transition-[background-color,transform] active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4" />
                      <span>Tải Video MP4 (1080p)</span>
                    </a>
                  )}

                  {jobStatus?.srt_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.srt_url)}
                      download="subtitles.srt"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-ink hover:bg-surface-subtle transition-[background-color,color]"
                    >
                      <Download className="h-3.5 w-3.5 text-muted" />
                      <span>Tải Phụ Đề SRT</span>
                    </a>
                  )}

                  {renderMode === 'audio_podcast' && jobStatus?.audio_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.audio_url)}
                      download="podcast_voice.mp3"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-ink hover:bg-surface-subtle transition-[background-color,color]"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-accent" />
                      <span>Tải Audio MP3</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 3. AI Shield Moderation Card */}
              <div
                data-completion-item
                className="rounded-xl border border-accent/40 bg-accent-soft/20 p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-accent/20">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-canvas">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-2">
                        <span>Kiểm Duyệt Nội Dung &amp; Xuất Bản (AI Shield)</span>
                        {activeContentId && (
                          <span className="text-[11px] text-muted font-normal">(Video #{activeContentId})</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-muted">
                        Kích hoạt AI Shield thẩm định an toàn nội dung, chấm điểm và chuyển vào hàng đợi Admin duyệt
                      </p>
                    </div>
                  </div>

                  {publishResult ? (
                    <Badge variant="success" className="font-sans font-bold text-xs">
                      Đã Gửi Duyệt Thành Công
                    </Badge>
                  ) : (
                    <Badge variant="pending" className="font-sans text-xs">
                      Trạng thái: Chờ gửi duyệt
                    </Badge>
                  )}
                </div>

                {publishError && (
                  <div className="p-3 rounded-lg border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{publishError.message || 'Lỗi khi gửi kiểm duyệt video'}</span>
                  </div>
                )}

                {publishResult ? (() => {
                  const score =
                    publishResult.aiShieldScore !== undefined && publishResult.aiShieldScore !== null
                      ? Number(publishResult.aiShieldScore)
                      : null;
                  const isFair = score !== null && score >= 50 && score < 80;
                  const isCritical = score !== null && score < 50;

                  return (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-3 ${
                        isCritical
                          ? 'border-rose-500/30 bg-rose-500/10'
                          : isFair
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-status-success-text/30 bg-status-success-bg/40'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-ink flex items-center gap-1.5">
                          {isCritical ? (
                            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                          ) : isFair ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0" />
                          )}
                          <span>
                            {isCritical
                              ? 'AI Shield: Cảnh báo sử liệu / Chờ Admin xem xét kỹ'
                              : isFair
                              ? 'AI Shield: Đạt mức Khá (Cần lưu ý một số chi tiết)'
                              : 'AI Shield: Video đạt chuẩn an toàn & sử liệu cao'}
                          </span>
                        </span>
                        {score !== null && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase shrink-0 border ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isFair
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            Điểm an toàn: {score.toFixed(0)}/100 •{' '}
                            {publishResult.aiShieldTierLabel ||
                              (isCritical ? 'Báo động đỏ' : isFair ? 'Khá' : 'Xuất sắc')}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted leading-relaxed">
                        {isCritical
                          ? 'AI Shield phát hiện điểm nghi vấn hoặc mâu thuẫn sử liệu giữa tiêu đề và nội dung kịch bản. Tác phẩm đã được chuyển sang chế độ Admin xem xét đặc biệt trước khi duyệt công khai.'
                          : isFair
                          ? 'Video đạt tiêu chuẩn nhưng có một số luận điểm cần biên tập viên đối chiếu lại. Video hiện đang trong hàng đợi Chờ quản trị viên phê duyệt.'
                          : 'Video đã được AI Shield thẩm định đạt chất lượng cao và không có từ ngữ độc hại. Tác phẩm đã được chuyển vào hàng đợi ưu tiên phê duyệt xuất bản.'}
                      </p>

                      {publishResult.aiShieldReason && (
                        <div className="p-3 rounded-lg bg-surface border border-border/80 text-[11px] space-y-1">
                          <span className="font-semibold text-ink block text-[11px]">
                            Nhận định chi tiết của AI Shield:
                          </span>
                          <p className="text-muted leading-relaxed font-serif italic text-[11px]">
                            {publishResult.aiShieldReason}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          onClick={onGoToContentLibrary}
                          className="text-xs gap-1.5 font-semibold px-4 rounded-xl bg-accent text-white hover:bg-accent/90"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Đến Thư Viện Nội Dung Của Bạn</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onResetNewVideo}
                          className="text-xs rounded-xl border-border hover:bg-surface-subtle"
                        >
                          Tạo video mới khác
                        </Button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1">
                      <div className="p-3 rounded-lg bg-surface border border-border/80 text-[11px] space-y-1">
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-status-success-text" />
                          <span>An toàn ngôn từ</span>
                        </div>
                        <p className="text-muted leading-relaxed">Quét từ cấm, bạo lực và nội dung độc hại tự động.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border/80 text-[11px] space-y-1">
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-status-success-text" />
                          <span>Chuẩn mực lịch sử</span>
                        </div>
                        <p className="text-muted leading-relaxed">Đối chiếu nhân vật, sự kiện và niên đại chuẩn xác.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border/80 text-[11px] space-y-1">
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-status-success-text" />
                          <span>Chấm điểm AI Shield</span>
                        </div>
                        <p className="text-muted leading-relaxed">Cấp điểm an toàn và xếp vào hàng đợi ưu tiên duyệt.</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      {isSubmittingPublish && (
                        <div className="p-3.5 rounded-xl bg-accent/8 border border-accent/25 flex items-center justify-between text-xs animate-in fade-in">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-accent animate-pulse shrink-0" />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-ink block text-xs">
                                AI Shield đang quét ngôn từ &amp; đối chiếu sử liệu...
                              </span>
                              <span className="text-[11px] text-muted block">
                                Hệ thống đang kiểm tra mức độ chân thực với kho sách nội bộ doc/.
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-surface rounded-full px-2.5 font-mono shrink-0">
                            Đang xử lý
                          </Badge>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted max-w-lg leading-relaxed">
                          Nhấn nút dưới đây để kích hoạt kiểm duyệt tự động. Quá trình kiểm tra ngôn từ và đối chiếu chính trị chỉ mất vài giây.
                        </p>

                        <Button
                          size="sm"
                          onClick={onSubmitPublish}
                          disabled={isSubmittingPublish}
                          className={`gap-2 text-xs font-semibold px-5 rounded-xl bg-accent text-canvas transition-[background-color,transform] duration-200 ${
                            isSubmittingPublish
                              ? 'cursor-wait opacity-90'
                              : 'shadow-glow-accent shimmer-button hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98]'
                          }`}
                        >
                          {isSubmittingPublish ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-canvas" />
                              <span>Đang gửi kiểm duyệt...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-canvas" />
                              <span>Gửi kiểm duyệt AI Shield ngay</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions - only rendered if publishResult is not yet present to prevent duplicate buttons */}
              {!publishResult && (
                <div
                  data-completion-item
                  className="flex items-center justify-between pt-4 border-t border-border"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onGoToContentLibrary}
                    className="gap-2 text-xs border-border hover:bg-surface-subtle"
                  >
                    <Film className="h-3.5 w-3.5 text-accent" />
                    <span>Mở Thư Viện Nội Dung</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onResetNewVideo}
                    className="gap-2 text-xs"
                  >
                    <span>Tạo Video Mới Khác</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW B: PRE-RENDER CONFIGURATION FORM
           ========================================================================= */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Clapperboard className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold text-ink">
                  Bước 4: Thiết lập &amp; Khởi chạy kết xuất video
                </span>
              </div>
              <Badge variant="outline" className="text-xs text-muted border-border font-medium">
                1080p Full HD
              </Badge>
            </div>

            {/* 1. Title Input (Locked & Fixed from Script) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>Tiêu đề tác phẩm video</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted font-normal bg-surface-subtle px-2 py-0.5 rounded border border-border">
                    <Lock className="h-3 w-3 text-stone-500" />
                    <span>Đã khóa cố định</span>
                  </span>
                </span>
                <span className="text-muted text-[11px] font-normal">Cố định theo kịch bản</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={renderTitle}
                  className="text-xs h-9 bg-surface-subtle/70 text-ink border-border font-medium pr-8 cursor-not-allowed select-all focus-visible:ring-0 focus-visible:border-border"
                  title="Tiêu đề video được thiết lập từ bước khởi tạo và đã được khóa cố định"
                />
                <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* 2. Confirmed Video Format Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink block">
                  Định dạng video kết xuất (Đã xác nhận)
                </label>
                <button
                  type="button"
                  onClick={onPrevStep}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Quay lại nếu cần chỉnh sửa</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-accent/25 bg-accent-soft/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    {renderMode === 'whiteboard' ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <Film className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-ink">
                        {renderMode === 'whiteboard' ? 'Hoạt Họa Bảng Trắng 16:9' : 'Video Audio Podcast'}
                      </span>
                      <Badge variant="accent" size="sm">
                        {renderMode === 'whiteboard' ? 'Whiteboard Animation' : 'Audio Wave Podcast'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                      {renderMode === 'whiteboard'
                        ? 'Hoạt họa nét vẽ tay phác thảo dòng mực xuất hiện dần trên nền giấy cổ, chuyển cảnh theo từng phân cảnh Storyboard.'
                        : 'Âm thanh chất lượng cao kết hợp ảnh bìa thumbnail nghệ thuật và sóng âm thanh động kèm phụ đề SRT đồng bộ.'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/60 sm:pl-4 space-y-0.5">
                  <span className="text-[11px] font-medium text-ink block">
                    {renderMode === 'whiteboard'
                      ? `${sceneValidation.assignedCount}/${sceneValidation.totalScenes} ảnh phân cảnh`
                      : '1 ảnh bìa Podcast Cover'}
                  </span>
                  <div className="flex items-center sm:justify-end gap-1 text-[11px] text-status-success-text font-medium">
                    <Check className="h-3.5 w-3.5" />
                    <span>Đã khóa định dạng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Image Requirements (Podcast Cover vs Scene Images Status) */}
            {renderMode === 'audio_podcast' ? (
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                      <UploadCloud className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5">
                        <span>Ảnh Bìa Đại Diện Podcast (Tỉ lệ 1:1 hoặc 16:9)</span>
                        <span className="text-status-error-text">*</span>
                      </h4>
                      <p className="text-[11px] text-muted">
                        Ảnh bìa hiển thị làm đại diện trên nền ứng dụng và video phát sóng kèm sóng âm thanh
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={coverImageUrl ? 'success' : 'error'}
                    size="sm"
                    className="font-medium text-[11px] shrink-0"
                  >
                    {coverImageUrl ? 'Đã có ảnh bìa' : 'Bắt buộc'}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1">
                  {/* Compact, balanced Cover Artwork Preview / Dropzone */}
                  <div className="w-40 sm:w-44 md:w-48 shrink-0">
                    <SceneImageUploadDropzone
                      label="Tải ảnh bìa Podcast"
                      sublabel="Kéo thả hoặc nhấp chọn ảnh"
                      imageUrl={coverImageUrl}
                      aspectRatio="1:1"
                      isUploading={uploadingCover}
                      onFileSelect={onUploadCoverImage}
                      onRemoveImage={() => setCoverImageUrl('')}
                    />
                  </div>

                  {/* Informational & Action Panel beside the preview */}
                  <div className="flex-1 min-w-0 space-y-3 flex flex-col justify-between self-stretch text-xs">
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-surface-subtle/50 border border-border/60 space-y-1.5">
                        <span className="font-semibold text-ink text-[11px] uppercase tracking-wider block">
                          Tiêu chuẩn ảnh bìa nghệ thuật:
                        </span>
                        <ul className="text-[11px] text-muted space-y-1 leading-relaxed">
                          <li className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-accent shrink-0" />
                            <span>Tỉ lệ khuyến nghị: <strong>1:1 (Vuông, 1080×1080px)</strong> hoặc <strong>16:9 (1920×1080px)</strong></span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-accent shrink-0" />
                            <span>Định dạng hỗ trợ: <strong>PNG, JPG, WebP</strong> (Dung lượng tối đa 10MB)</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-accent shrink-0" />
                            <span>Chủ đề: Tranh khắc gỗ, nhân vật lịch sử, cờ lệnh hoặc bảo vật triều đại</span>
                          </li>
                        </ul>
                      </div>

                      {coverImageUrl ? (
                        <div className="flex items-center gap-2 text-[11px] text-status-success-text font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Ảnh bìa đã sẵn sàng để kết xuất cùng âm thanh thuyết minh và sóng âm.</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted">
                          Bạn có thể tải ảnh từ thiết bị hoặc chọn nhanh ảnh mẫu có sẵn bên dưới:
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCoverImageUrl(
                            'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80'
                          )
                        }
                        className="text-xs h-8 px-3 rounded-xl border-border/80 hover:bg-surface-subtle text-accent font-medium gap-1.5 cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Dùng ảnh mẫu Thăng Long</span>
                      </Button>

                      {coverImageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCoverImageUrl('')}
                          className="text-xs h-8 px-3 text-status-error-text hover:bg-status-error-bg rounded-xl cursor-pointer transition-colors active:scale-[0.98]"
                        >
                          Gỡ ảnh hiện tại
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-surface-subtle/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    Trạng thái hình ảnh phân cảnh Bảng Trắng:
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrevStep}
                    className="text-[11px] text-accent h-6 px-2 hover:bg-accent-soft"
                  >
                    Quản lý ảnh tại Bước 2
                  </Button>
                </div>

                <div
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    sceneValidation.isValid && scenes.length > 0
                      ? 'border-status-success-text/30 bg-status-success-bg/30 text-ink'
                      : 'border-status-warning-text/30 bg-status-warning-bg/30 text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Đã sẵn sàng: {sceneValidation.assignedCount} / {sceneValidation.totalScenes} phân cảnh</span>
                    {sceneValidation.isValid && scenes.length > 0 ? (
                      <Badge variant="success" size="sm">Đủ điều kiện</Badge>
                    ) : (
                      <Badge variant="error" size="sm">Còn thiếu ảnh</Badge>
                    )}
                  </div>
                  {!sceneValidation.isValid && scenes.length > 0 && (
                    <p className="text-[11px] text-status-error-text">
                      Còn thiếu ảnh cho Cảnh: {sceneValidation.missingScenes.join(', ')}. Hãy chuyển về Bước 2 để tải ảnh minh họa.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Render Readiness Checklist (Bảng kiểm tra điều kiện kết xuất - emil-design-eng) */}
            {(() => {
              const isTitleReady = Boolean(renderTitle.trim());
              const isImageReady =
                renderMode === 'audio_podcast'
                  ? Boolean(coverImageUrl.trim())
                  : sceneValidation.isValid && scenes.length > 0;
              const isConfirmReady = confirmCheck;
              const isAllMandatoryReady = isTitleReady && isImageReady && isConfirmReady;

              return (
                <div className="rounded-xl border border-border/80 bg-surface-subtle/30 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      <span>Điều kiện sẵn sàng kết xuất video (~{renderDurationSec}s)</span>
                    </span>
                    <span className="text-[11px] font-mono">
                      {isAllMandatoryReady ? (
                        <span className="text-status-success-text font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Đủ điều kiện kết xuất</span>
                        </span>
                      ) : (
                        <span className="text-status-warning-text font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Cần hoàn thiện mục bắt buộc</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Mục 1: Tiêu đề */}
                    <div
                      className={`p-2.5 rounded-lg border flex items-start gap-2 transition-colors ${
                        isTitleReady
                          ? 'border-status-success-text/30 bg-status-success-bg/20'
                          : 'border-status-warning-text/40 bg-status-warning-bg/20'
                      }`}
                    >
                      {isTitleReady ? (
                        <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0 mt-0.5" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-status-warning-text/60 flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-status-warning-text font-bold">
                          !
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-ink block">Tiêu đề tác phẩm (Bắt buộc)</span>
                        <span className="text-[11px] text-muted truncate block">
                          {isTitleReady ? renderTitle : 'Chưa nhập tiêu đề'}
                        </span>
                      </div>
                    </div>

                    {/* Mục 2: Hình ảnh */}
                    <div
                      className={`p-2.5 rounded-lg border flex items-start gap-2 transition-colors ${
                        isImageReady
                          ? 'border-status-success-text/30 bg-status-success-bg/20'
                          : 'border-status-warning-text/40 bg-status-warning-bg/20'
                      }`}
                    >
                      {isImageReady ? (
                        <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0 mt-0.5" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-status-warning-text/60 flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-status-warning-text font-bold">
                          !
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-ink block">Hình ảnh minh họa (Bắt buộc)</span>
                        <span className="text-[11px] text-muted truncate block">
                          {renderMode === 'audio_podcast'
                            ? coverImageUrl
                              ? 'Đã có ảnh bìa Podcast'
                              : 'Chưa tải ảnh bìa'
                            : sceneValidation.isValid && scenes.length > 0
                            ? `Đủ ${sceneValidation.assignedCount}/${sceneValidation.totalScenes} ảnh phân cảnh`
                            : `Thiếu ${sceneValidation.missingScenes.length} ảnh phân cảnh`}
                        </span>
                      </div>
                    </div>

                    {/* Mục 3: Giọng đọc */}
                    <div className="p-2.5 rounded-lg border border-status-success-text/30 bg-status-success-bg/20 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-ink">Giọng thuyết minh</span>
                          <span className="text-[10px] text-status-success-text font-medium">(Đã chọn)</span>
                        </div>
                        <span className="text-[11px] text-muted truncate block">
                          {selectedVoice
                            ? `${selectedVoice.name} (${selectedVoice.accent || (selectedVoice.engine === 'elevenlabs' ? 'ElevenLabs' : 'Việt Nam')})`
                            : 'Mặc định: Nam Minh (Miền Bắc, Edge-TTS)'}
                        </span>
                      </div>
                    </div>

                    {/* Mục 4: Xác nhận */}
                    <div
                      className={`p-2.5 rounded-lg border flex items-start gap-2 transition-colors ${
                        isConfirmReady
                          ? 'border-status-success-text/30 bg-status-success-bg/20'
                          : 'border-status-warning-text/40 bg-status-warning-bg/20'
                      }`}
                    >
                      {isConfirmReady ? (
                        <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0 mt-0.5" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-status-warning-text/60 flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-status-warning-text font-bold">
                          !
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-ink block">Xác nhận điều kiện (Bắt buộc)</span>
                        <span className="text-[11px] text-muted truncate block">
                          {isConfirmReady ? 'Đã xác nhận sẵn sàng' : 'Chưa tích chọn ô bên dưới'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Error Message */}
            {renderError && (
              <div className="p-3.5 rounded-xl border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{renderError.message || 'Không thể khởi chạy render video.'}</span>
              </div>
            )}

            {/* Confirmation Checkbox Card (Mathematically Centered Alignment) */}
            <div
              onClick={() => setConfirmCheck(!confirmCheck)}
              className={`p-3.5 sm:p-4 rounded-xl border transition-[background-color,border-color] duration-150 cursor-pointer select-none ${
                confirmCheck
                  ? 'border-accent/40 bg-accent/5 shadow-2xs'
                  : 'border-border/80 bg-white hover:border-border hover:bg-surface-subtle/30'
              }`}
            >
              <label
                htmlFor="confirm-render-checkbox"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    id="confirm-render-checkbox"
                    type="checkbox"
                    checked={confirmCheck}
                    onChange={(e) => setConfirmCheck(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-[background-color,border-color,transform] duration-150 ${
                      confirmCheck
                        ? 'bg-accent border-accent text-white shadow-2xs scale-100'
                        : 'border-border/90 bg-canvas hover:border-ink-muted'
                    }`}
                  >
                    {confirmCheck && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                </div>

                <span className="text-xs sm:text-[13px] font-medium text-ink leading-snug">
                  Tôi xác nhận kịch bản thuyết minh và tài nguyên hình ảnh đã được chuẩn bị đầy đủ và sẵn sàng khởi chạy kết xuất video.
                </span>
              </label>
            </div>

            {/* Active Historical Verification Inspection Banner (ui-ux-pro-max & taste) */}
            {isCheckingSoftGuard && (
              <div
                role="status"
                aria-live="polite"
                className="p-4 rounded-xl border border-accent/40 bg-accent-soft/20 space-y-2.5 animate-in fade-in duration-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-canvas shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-xs font-bold text-ink">
                          Rào chắn mềm AI Shield đang đối chiếu sử liệu
                        </span>
                        <Badge variant="outline" className="text-[10px] text-accent border-accent/30 bg-accent/10">
                          RAG Chính Sử
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Hệ thống đang rà soát niên đại, sự kiện và nhân vật với Đại Việt Sử Ký Toàn Thư qua RAG...
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-accent font-sans">
                    Đang quét sử liệu...
                  </span>
                </div>

                {/* Micro Progress Bar with GSAP Smooth Drive */}
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div
                    ref={softGuardProgressRef}
                    className="h-full bg-accent rounded-full transition-none"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrevStep}
                className="gap-2 text-xs border-border hover:bg-surface-subtle cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại Bước 3 (Giọng đọc)</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={onStartRender}
                disabled={
                  !renderTitle.trim() ||
                  !confirmCheck ||
                  isStartingRender ||
                  (renderMode === 'audio_podcast' && !coverImageUrl.trim()) ||
                  (renderMode === 'whiteboard' && (!sceneValidation.isValid || scenes.length === 0))
                }
                className={`gap-2 text-xs font-semibold px-6 shadow-glow-accent shimmer-button text-canvas transition-[background-color,transform] duration-200 active:scale-[0.98] ${
                  isCheckingSoftGuard
                    ? 'bg-accent/90 cursor-wait'
                    : isStartingRender
                    ? 'bg-accent/80 cursor-wait'
                    : 'bg-accent hover:bg-accent/90 hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                {isCheckingSoftGuard ? (
                  <ShieldCheck className="h-4 w-4 text-amber-200" />
                ) : isStartingRender ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clapperboard className="h-3.5 w-3.5" />
                )}
                <span>
                  {isCheckingSoftGuard
                    ? 'Đang đối chiếu sử liệu...'
                    : isStartingRender
                    ? 'Đang khởi chạy render...'
                    : 'Bắt đầu kết xuất Video'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
