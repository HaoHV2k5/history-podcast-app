import React, { useState } from 'react';
import {
  Clapperboard,
  Film,
  Video,
  Download,
  Terminal,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  setRenderMode,
  renderTitle,
  setRenderTitle,
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

  // 6-step progress calculation
  const currentStep = jobStatus?.step || 1;
  const totalSteps = jobStatus?.total_steps || 6;
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  const STEP_NAMES = [
    'Khởi tạo môi trường đồ họa',
    'Tổng hợp giọng đọc thuyết minh (TTS)',
    'Tạo phụ đề SRT đồng bộ',
    'Kết xuất khung hình MP4',
    'Tải video lên Cloudinary CDN',
    'Hoàn tất video',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
                  <span className="text-[11px] text-muted font-mono">Job ID: {activeJobId}</span>
                </div>
              </div>

              <Badge
                variant={isCompleted ? 'success' : isFailed ? 'error' : 'accent'}
                className="font-mono text-xs font-bold"
              >
                {isCompleted ? 'COMPLETED (100%)' : isFailed ? 'FAILED' : `PROCESSING (${progressPercent}%)`}
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
                      Bước {currentStep}/{totalSteps}: {jobStatus?.step_name || STEP_NAMES[currentStep - 1] || 'Đang xử lý...'}
                    </span>
                  </span>
                  <span className="text-accent font-mono font-bold">{progressPercent}%</span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-surface-subtle overflow-hidden border border-border">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 pt-1">
                  {STEP_NAMES.map((name, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep > stepNum;
                    const isCurrent = currentStep === stepNum;

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isDone
                            ? 'border-status-success-text/30 bg-status-success-bg/30 text-ink'
                            : isCurrent
                            ? 'border-accent bg-accent-soft/40 text-accent font-bold ring-1 ring-accent'
                            : 'border-border/60 bg-surface-subtle/30 text-muted opacity-60'
                        }`}
                      >
                        <span className="text-[10px] block font-mono font-bold">0{stepNum}</span>
                        <span className="text-[10px] line-clamp-1 mt-0.5">{name}</span>
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

          {/* COMPLETED VIDEO & AUDIO PLAYERS */}
          {isCompleted && (
            <div className="space-y-6 animate-fadeIn">
              {/* Media Preview Card */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-status-success-bg text-status-success-text">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <h3 className="font-serif text-sm font-bold text-ink">
                      Xem Trước Video Thành Phẩm &amp; Tải Xuống
                    </h3>
                  </div>

                  <span className="text-xs text-muted font-mono">Định dạng MP4 • 1080p</span>
                </div>

                {/* HTML5 Video Player */}
                {jobStatus?.video_url && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video max-w-2xl mx-auto shadow-md">
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

                {/* Optional HTML5 Audio Player */}
                {jobStatus?.audio_url && (
                  <div className="p-4 rounded-xl border border-border bg-surface-subtle/50 max-w-2xl mx-auto space-y-2">
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
                        className="text-[11px] text-accent hover:underline flex items-center gap-1 font-mono"
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

                {/* Download Buttons Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {jobStatus?.video_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.video_url)}
                      download="final_video.mp4"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-canvas font-bold text-xs hover:bg-accent/90 transition-colors shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Tải Video MP4</span>
                    </a>
                  )}

                  {jobStatus?.srt_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.srt_url)}
                      download="subtitles.srt"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-ink hover:bg-surface-subtle transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 text-muted" />
                      <span>Tải Phụ Đề SRT</span>
                    </a>
                  )}

                  {jobStatus?.audio_url && (
                    <a
                      href={resolveMediaUrl(jobStatus.audio_url)}
                      download="podcast_voice.mp3"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-ink hover:bg-surface-subtle transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-accent" />
                      <span>Tải Audio MP3</span>
                    </a>
                  )}
                </div>
              </div>

              {/* VITAL FEATURE: SUBMIT MODERATION TO AI SHIELD */}
              <div className="rounded-xl border border-accent/40 bg-accent-soft/20 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-accent/20">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-canvas">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-2">
                        <span>Gửi Kiểm Duyệt Xuất Bản (AI Shield &amp; Admin)</span>
                        {activeContentId && (
                          <span className="text-[10px] font-mono text-muted font-normal">(Video #{activeContentId})</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-muted">
                        Kích hoạt AI Shield thẩm định an toàn nội dung, chấm điểm và chuyển vào hàng đợi Admin duyệt
                      </p>
                    </div>
                  </div>

                  {publishResult ? (
                    <Badge variant="success" className="font-sans font-bold">
                      Đã Gửi Duyệt Thành Công
                    </Badge>
                  ) : (
                    <Badge variant="pending" className="font-sans">
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

                {publishResult ? (
                  <div className="p-4 rounded-xl border border-status-success-text/30 bg-status-success-bg/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-status-success-text" />
                        <span>AI Shield đã tiếp nhận và đánh giá video của bạn</span>
                      </span>
                      {publishResult.aiShieldScore !== undefined && (
                        <Badge variant="success" className="font-mono font-bold text-xs">
                          Điểm an toàn: {publishResult.aiShieldScore}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Video hiện đang ở trạng thái <strong>PENDING_REVIEW</strong>. Quản trị viên (Admin) sẽ xem xét phê duyệt trước khi video được công khai trên nền tảng.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={onGoToContentLibrary}
                        className="text-xs gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Đến Thư Viện Nội Dung Của Bạn</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetNewVideo}
                        className="text-xs"
                      >
                        Tạo video mới khác
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-muted max-w-lg">
                      Nhấn nút dưới đây để kích hoạt kiểm duyệt tự động. Quá trình kiểm tra ngôn từ và đối chiếu chính trị chỉ mất vài giây.
                    </p>

                    <Button
                      size="sm"
                      onClick={onSubmitPublish}
                      disabled={isSubmittingPublish}
                      className="gap-2 text-xs font-semibold px-5 shadow-glow-accent shimmer-button bg-accent text-canvas hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${isSubmittingPublish ? 'animate-spin' : 'animate-pulse'}`} />
                      <span>{isSubmittingPublish ? 'Đang gửi kiểm duyệt...' : 'Gửi kiểm duyệt AI Shield ngay'}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
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
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Bước 4 • Thiết Lập &amp; Khởi Chạy Kết Xuất
                </span>
              </div>
              <span className="text-xs text-muted font-mono">1080p Full HD</span>
            </div>

            {/* 1. Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Tiêu đề tác phẩm video</span>
                <span className="text-status-error-text text-[11px]">* Bắt buộc</span>
              </label>
              <Input
                type="text"
                placeholder="Ví dụ: Đại lễ dời đô 1010 và Khát vọng Thăng Long ngàn năm"
                value={renderTitle}
                onChange={(e) => setRenderTitle(e.target.value)}
                className="text-xs h-9 bg-surface-subtle/30 border-border font-medium"
              />
            </div>

            {/* 2. Format Selection (Whiteboard vs Audio Podcast) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink block">
                Định dạng video kết xuất
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Audio Podcast Card */}
                <div
                  onClick={() => setRenderMode('audio_podcast')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    renderMode === 'audio_podcast'
                      ? 'border-accent bg-accent-soft/30 ring-1 ring-accent shadow-xs'
                      : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-subtle/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-ink flex items-center gap-2">
                      <Film className="h-4 w-4 text-accent" />
                      <span>Video Audio Podcast</span>
                    </span>
                    <Badge variant="accent" size="sm">Đề xuất • Nhanh</Badge>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed">
                    Âm thanh chất lượng cao, kết hợp <strong>1 ảnh bìa thumbnail nghệ thuật</strong> và sóng âm thanh động kèm phụ đề SRT đồng bộ. Thời gian tạo chỉ 30–60 giây.
                  </p>

                  <div className="pt-2 border-t border-border/60 text-[10px] text-accent font-medium">
                    ✓ Chỉ cần 1 ảnh bìa Podcast Cover
                  </div>
                </div>

                {/* Whiteboard Card */}
                <div
                  onClick={() => setRenderMode('whiteboard')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    renderMode === 'whiteboard'
                      ? 'border-accent bg-accent-soft/30 ring-1 ring-accent shadow-xs'
                      : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-subtle/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-ink flex items-center gap-2">
                      <Video className="h-4 w-4 text-accent" />
                      <span>Hoạt Họa Bảng Trắng</span>
                    </span>
                    <Badge variant="outline" size="sm">Whiteboard 16:9</Badge>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed">
                    Hoạt họa nét vẽ tay phác thảo dòng mực xuất hiện dần trên nền giấy cổ, chuyển cảnh theo phân cảnh Storyboard.
                  </p>

                  <div className="pt-2 border-t border-border/60 text-[10px] text-ink font-medium">
                    {sceneValidation.isValid && scenes.length > 0 ? (
                      <span className="text-status-success-text">✓ Đủ {sceneValidation.assignedCount}/{sceneValidation.totalScenes} ảnh phân cảnh</span>
                    ) : (
                      <span className="text-status-error-text">! Cần tải đủ ảnh cho từng phân cảnh</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Image Requirements (Podcast Cover vs Scene Images Status) */}
            {renderMode === 'audio_podcast' ? (
              <div className="space-y-2 p-4 rounded-xl border border-border bg-surface-subtle/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <UploadCloud className="h-3.5 w-3.5 text-accent" />
                    <span>Ảnh Bìa Đại Diện Podcast (Tỉ lệ 1:1 hoặc 16:9)</span>
                    <span className="text-status-error-text text-[11px]">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setCoverImageUrl(
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80'
                      )
                    }
                    className="text-[11px] text-accent hover:underline"
                  >
                    Dùng ảnh mẫu Thăng Long
                  </button>
                </div>

                <SceneImageUploadDropzone
                  label="Tải ảnh bìa Podcast"
                  sublabel="Khung hình 1:1 hoặc 16:9 (PNG / JPG / WebP)"
                  imageUrl={coverImageUrl}
                  aspectRatio="1:1"
                  isUploading={uploadingCover}
                  onFileSelect={onUploadCoverImage}
                  onRemoveImage={() => setCoverImageUrl('')}
                />
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

            {/* 4. Configuration Recap Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-surface-subtle/30 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Giọng đọc đã chọn:</span>
                <span className="font-bold text-ink font-serif">
                  {selectedVoice?.name || 'Chưa chọn'}
                </span>
                <span className="text-muted text-[11px] ml-1.5">
                  ({selectedVoice?.accent || 'Miền Bắc'} • {selectedVoice?.engine || 'edge-tts'})
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px]">Thời lượng video:</span>
                <span className="font-bold text-ink font-serif">{renderDurationSec} giây</span>
                <span className="text-muted text-[11px] ml-1.5">({scenes.length} phân cảnh)</span>
              </div>
            </div>

            {/* Error Message */}
            {renderError && (
              <div className="p-3.5 rounded-xl border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{renderError.message || 'Không thể khởi chạy render video.'}</span>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="confirm-render-checkbox"
                checked={confirmCheck}
                onChange={(e) => setConfirmCheck(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="confirm-render-checkbox" className="text-xs text-muted leading-relaxed cursor-pointer select-none">
                Tôi xác nhận kịch bản thuyết minh và tài nguyên hình ảnh đã được chuẩn bị đầy đủ và sẵn sàng khởi chạy kết xuất video.
              </label>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrevStep}
                className="gap-2 text-xs border-border hover:bg-surface-subtle"
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
                className="gap-2 text-xs font-semibold px-6 shadow-glow-accent shimmer-button bg-accent text-canvas hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
              >
                <Clapperboard className={`h-3.5 w-3.5 ${isStartingRender ? 'animate-spin' : ''}`} />
                <span>
                  {isCheckingSoftGuard
                    ? '🔍 Đang đối chiếu sử liệu...'
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
