/**
 * Step2StoryboardScenes Component
 * PRM232 - Sử Ký History Podcast Platform
 *
 * Anti-AI-Slop Refactored & Compound Architecture Edition:
 * - Design System: "Không Gian Xưởng Sử Ký (Historical Editorial Atelier Console)"
 * - Adheres strictly to design-taste-frontend, ui-ux-pro-max, shadcn-ui-mastery & composition-patterns.
 * - Unified typography: font-sans (Be Vietnam Pro) for body & prompts, font-serif (Noto Serif) for editorial headings.
 * - 100% full-width layout matching StudioWorkflowStepper (eliminated max-w-5xl overhang).
 * - Full ARIA semantics, accessible keyboard navigation, and responsive ergonomics.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Volume2,
  Clock,
  ImagePlus,
  AlertCircle,
  FileText,
  Edit3,
  HelpCircle,
  Clapperboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StoryboardResponse, StoryboardScene } from '@/types/creatorStudio';
import { SceneImageUploadDropzone } from './SceneImageUploadDropzone';

// ─── 1. TYPES & CONTEXT DEFINITION ──────────────────────────────────────────

export interface Step2StoryboardScenesProps {
  renderMode?: 'whiteboard' | 'audio_podcast';
  storyboard: StoryboardResponse | null;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  sceneImages: Record<string, string>;
  onUploadSceneImage: (sceneIndex: string, file: File) => Promise<void>;
  onRemoveSceneImage: (sceneIndex: string) => void;
  uploadingSceneIndex: string | null;
  coverImageUrl?: string;
  setCoverImageUrl?: (url: string) => void;
  uploadingCover?: boolean;
  onUploadCoverImage?: (file: File) => Promise<void>;
  thumbnailUrl?: string;
  setThumbnailUrl?: (url: string) => void;
  uploadingThumbnail?: boolean;
  onUploadThumbnail?: (file: File) => Promise<void>;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onUpdateSceneNarration?: (sceneIndex: number, newNarration: string) => void;
}

interface StoryboardStudioContextValue extends Step2StoryboardScenesProps {
  showFullScript: boolean;
  setShowFullScript: React.Dispatch<React.SetStateAction<boolean>>;
  isAudioPodcast: boolean;
  totalScenes: number;
  uploadedCount: number;
  wordCount: number;
  estimatedReadingSec: number;
}

const StoryboardStudioContext = createContext<StoryboardStudioContextValue | null>(null);

export const useStoryboardStudio = () => {
  const context = useContext(StoryboardStudioContext);
  if (!context) {
    throw new Error('useStoryboardStudio must be used within a <StoryboardStudio.Root>');
  }
  return context;
};

// ─── 2. EMPTY STATE COMPONENT ───────────────────────────────────────────────

export const StoryboardEmptyState: React.FC<{ onPrevStep: () => void }> = ({ onPrevStep }) => (
  <div
    role="region"
    aria-label="Thông báo chưa có phân cảnh"
    className="rounded-2xl border border-[#EAE6DF] bg-white p-12 text-center space-y-4 w-full shadow-2xs"
  >
    <div className="h-12 w-12 rounded-full bg-accent-soft text-accent mx-auto flex items-center justify-center">
      <Layers className="h-6 w-6" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h3 className="font-serif text-base font-bold text-[#1C1917]">Chưa có phân cảnh nào được tạo</h3>
      <p className="font-sans text-xs text-[#78716C] leading-relaxed">
        Vui lòng quay lại Bước 1 để hoàn thiện nội dung và khởi tạo phân cảnh kịch bản lịch sử.
      </p>
    </div>
    <Button
      size="sm"
      variant="outline"
      onClick={onPrevStep}
      className="font-sans text-xs gap-1.5 border-[#E2DDD5] bg-white hover:bg-[#FAF8F5] text-[#1C1917] rounded-xl focus-visible:ring-2 focus-visible:ring-accent"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Quay lại Bước 1</span>
    </Button>
  </div>
);

// ─── 3. HEADER & STATS TOOLBAR ──────────────────────────────────────────────

export const StoryboardStudioHeader: React.FC = () => {
  const {
    storyboard,
    isAudioPodcast,
    totalScenes,
    uploadedCount,
    coverImageUrl,
    showFullScript,
    setShowFullScript,
    onNextStep,
  } = useStoryboardStudio();

  if (!storyboard) return null;

  return (
    <header
      role="banner"
      className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 w-full"
    >
      <div className="space-y-2">
        {/* Semantic Status Meta Strip */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Thông số kỹ thuật phân cảnh">
          {isAudioPodcast ? (
            <span className="text-[11px] font-sans font-semibold text-accent border border-accent/25 bg-[#FAF0F1] flex items-center gap-1.5 py-0.5 px-2.5 rounded-md">
              <Volume2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Audio Podcast Video</span>
            </span>
          ) : (
            <span className="text-[11px] font-sans font-semibold text-accent border border-accent/25 bg-[#FAF0F1] flex items-center gap-1.5 py-0.5 px-2.5 rounded-md">
              <Clapperboard className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{totalScenes} Phân Cảnh Whiteboard</span>
            </span>
          )}

          <span className="text-[11px] font-sans font-medium text-[#78716C] border border-[#EAE6DF] bg-[#FAF8F5] flex items-center gap-1.5 py-0.5 px-2.5 rounded-md tabular-nums">
            <Clock className="h-3 w-3 text-[#78716C]" aria-hidden="true" />
            <span>~{storyboard.estimated_duration_sec || 60}s thời lượng</span>
          </span>

          {/* Clean Semantic Status Badge (No Emojis) */}
          {isAudioPodcast ? (
            coverImageUrl ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-status-success-text bg-status-success-bg px-2.5 py-0.5 rounded-full border border-status-success-text/20">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>Đã nạp ảnh bìa</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-status-pending-text bg-status-pending-bg px-2.5 py-0.5 rounded-full border border-status-pending-text/20">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>Cần 1 ảnh bìa trung tâm</span>
              </span>
            )
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full border ${
                uploadedCount === totalScenes
                  ? 'text-status-success-text bg-status-success-bg border-status-success-text/20'
                  : 'text-status-pending-text bg-status-pending-bg border-status-pending-text/20'
              }`}
            >
              {uploadedCount === totalScenes ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
              )}
              <span>
                Đã tải {uploadedCount} / {totalScenes} ảnh minh họa
              </span>
            </span>
          )}
        </div>

        {/* Storyboard Title */}
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
          {storyboard.title || 'Kịch Bản Phân Cảnh Lịch Sử'}
        </h2>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowFullScript(!showFullScript)}
          aria-expanded={showFullScript}
          aria-controls="full-script-panel"
          className="font-sans text-xs gap-1.5 border-[#E2DDD5] bg-white hover:bg-[#FAF8F5] text-[#1C1917] rounded-xl h-9 px-3.5 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <FileText className="h-3.5 w-3.5 text-[#78716C]" aria-hidden="true" />
          <span>{showFullScript ? 'Thu gọn kịch bản' : 'Xem toàn văn kịch bản'}</span>
          {showFullScript ? (
            <ChevronUp className="h-3.5 w-3.5 text-[#78716C]" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[#78716C]" aria-hidden="true" />
          )}
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onNextStep}
          className="font-sans gap-2 text-xs font-semibold px-4 rounded-xl h-9 bg-accent text-white hover:bg-accent/90 shadow-2xs active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <span>Tiếp tục (Bước 3)</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
};

// ─── 4. EXPANDABLE SCRIPT WORKBENCH ─────────────────────────────────────────

export const StoryboardStudioScriptWorkbench: React.FC = () => {
  const { showFullScript, scriptContent, setScriptContent, wordCount, estimatedReadingSec } =
    useStoryboardStudio();

  if (!showFullScript) return null;

  return (
    <section
      id="full-script-panel"
      role="region"
      aria-label="Biên tập toàn văn kịch bản thuyết minh"
      className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-2xs space-y-3.5 transition-all animate-fadeIn w-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE6DF] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF0F1] text-accent">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-sans text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              Toàn Văn Lời Dẫn Thuyết Minh
            </h3>
            <p className="font-sans text-[11px] text-[#78716C]">
              Bạn có thể tinh chỉnh trực tiếp lời dẫn trước khi đưa vào bộ đọc giọng nói AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans text-xs text-[#78716C] tabular-nums">
          <span className="font-medium text-[#1C1917]">{wordCount} từ</span>
          <span>•</span>
          <span>~{estimatedReadingSec}s đọc ước tính</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="script-workbench-textarea" className="sr-only">
          Nội dung kịch bản thuyết minh chi tiết
        </label>
        <Textarea
          id="script-workbench-textarea"
          rows={6}
          value={scriptContent}
          onChange={(e) => setScriptContent(e.target.value)}
          placeholder="Nhập hoặc hiệu đính toàn văn bản lời dẫn thuyết minh..."
          className="font-sans text-xs sm:text-[13px] leading-relaxed bg-[#FAF8F5]/80 border-[#EAE6DF] focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent text-[#1C1917] placeholder:text-[#A8A29E] rounded-xl p-3.5"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans text-[#78716C] pt-1">
        <p className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>Giọng đọc AI (Edge-TTS / Gemini) sẽ phát âm chính xác theo nội dung văn bản này.</span>
        </p>
        <span className="italic text-[#78716C]">Hỗ trợ định dạng dấu câu tiếng Việt chuẩn</span>
      </div>
    </section>
  );
};

// ─── 5. AUDIO PODCAST WORKSPACE (COVER ART STUDIO) ──────────────────────────

export const StoryboardStudioAudioPodcastView: React.FC = () => {
  const {
    storyboard,
    coverImageUrl,
    setCoverImageUrl,
    uploadingCover,
    onUploadCoverImage,
    thumbnailUrl,
    setThumbnailUrl,
    uploadingThumbnail,
    onUploadThumbnail,
    copiedKey,
    onCopy,
  } = useStoryboardStudio();

  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const promptText = storyboard?.thumbnail_prompt || '';
  const isCopied = copiedKey === 'podcast_cover_prompt';

  return (
    <div className="space-y-6 w-full">
      {/* Primary Cover Image Atelier Card */}
      <section
        role="region"
        aria-label="Khoang chế tác ảnh bìa Podcast"
        className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-2xs space-y-5 w-full"
      >
        {/* Module Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE6DF]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-2xs">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1917]">
                Ảnh Bìa Thuyết Minh Podcast
              </h3>
              <p className="font-sans text-xs text-[#78716C]">
                Ảnh bìa trung tâm xuất hiện xuyên suốt video trên nền sóng âm thanh và phụ đề chạy chữ
              </p>
            </div>
          </div>

          <Badge
            variant={coverImageUrl ? 'outline' : 'accent'}
            className={`font-sans text-[11px] font-semibold py-0.5 px-3 rounded-md ${
              coverImageUrl
                ? 'border-status-success-text/30 bg-status-success-bg text-status-success-text'
                : 'bg-accent text-white'
            }`}
          >
            {coverImageUrl ? 'Đã tải ảnh thành công' : 'Bắt buộc tải ảnh'}
          </Badge>
        </div>

        {/* 2-Column Split: Prompt Crafting & Upload Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): AI Prompt Synthesis & Guidance */}
          <div className="lg:col-span-7 space-y-4">
            {promptText ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span className="font-sans text-xs font-bold text-[#1C1917]">
                      Gợi ý Mô Tả Tạo Ảnh Bìa Nghệ Thuật:
                    </span>
                  </div>
                  <span className="font-sans text-[11px] font-medium text-[#78716C] bg-[#FAF8F5] px-2.5 py-0.5 rounded-md border border-[#EAE6DF]">
                    Tỷ lệ 1:1 • Vuông
                  </span>
                </div>

                {/* Prompt Card with Inline Copy Action - STRICTLY font-sans (Be Vietnam Pro) */}
                <div className="relative rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] p-4 text-[13px] sm:text-sm font-sans text-[#1C1917] leading-relaxed group shadow-2xs">
                  <p
                    className={`select-all break-words ${
                      !isPromptExpanded && promptText.length > 200 ? 'line-clamp-4' : ''
                    }`}
                  >
                    {promptText}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EAE6DF]">
                    {promptText.length > 200 ? (
                      <button
                        type="button"
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        className="font-sans text-xs font-medium text-accent hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded cursor-pointer"
                      >
                        <span>{isPromptExpanded ? 'Thu gọn' : 'Xem toàn bộ mô tả ảnh'}</span>
                        {isPromptExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="font-sans text-[11px] text-[#78716C]">Sẵn sàng để sao chép</span>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(promptText, 'podcast_cover_prompt')}
                      aria-live="polite"
                      className={`h-7.5 px-3 font-sans text-xs gap-1.5 font-medium transition-colors border-[#E2DDD5] bg-white hover:bg-[#FAF8F5] rounded-lg focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
                        isCopied ? 'text-status-success-text border-status-success-text/40' : 'text-[#1C1917]'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-status-success-text" aria-hidden="true" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#78716C]" aria-hidden="true" />
                          <span>Sao chép mô tả</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Structured Production Steps */}
                <div className="rounded-xl bg-[#FAF8F5]/60 p-3.5 border border-[#EAE6DF] text-xs font-sans text-[#78716C] space-y-1.5">
                  <p className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>Quy trình tạo ảnh nhanh:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
                    <li>
                      Sao chép đoạn mô tả phía trên dán vào các công cụ sinh ảnh AI (Midjourney, DALL-E 3, Leonardo AI hoặc Canva).
                    </li>
                    <li>
                      Lưu ảnh vuông về máy tính, sau đó thả tệp vào khung bên phải để hoàn tất.
                    </li>
                  </ol>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column (5 cols): Cover Dropzone Container */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-bold text-[#1C1917]">Tải Ảnh Bìa Podcast (1:1)</span>
              <span className="font-sans text-[11px] text-[#78716C]">CDN Cloudinary</span>
            </div>

            {onUploadCoverImage && (
              <SceneImageUploadDropzone
                label="Tải ảnh bìa Podcast"
                sublabel="Khung hình 1:1 vuông (PNG, JPG, WebP tối đa 10MB)"
                imageUrl={coverImageUrl}
                aspectRatio="1:1"
                isUploading={uploadingCover}
                onFileSelect={(file) => onUploadCoverImage(file)}
                onRemoveImage={() => setCoverImageUrl && setCoverImageUrl('')}
              />
            )}
          </div>
        </div>
      </section>

      {/* Secondary Optional Poster Card (16:9) */}
      <section
        role="region"
        aria-label="Ảnh Thumbnail Video 16:9 tùy chọn"
        className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-2xs space-y-3.5 w-full"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6.5 w-10 items-center justify-center rounded-md bg-[#FAF8F5] text-[#78716C] text-xs font-sans font-bold border border-[#EAE6DF] tabular-nums">
              16:9
            </span>
            <div>
              <h4 className="font-sans text-xs font-bold text-[#1C1917]">
                Ảnh Thumbnail Video 16:9 (Tùy chọn hiển thị Trang Chủ)
              </h4>
              <p className="font-sans text-[11px] text-[#78716C]">
                Nếu bạn không tải, hệ thống sẽ tự động dùng luôn <strong>Ảnh Bìa Podcast</strong> làm thumbnail để bảo đảm video luôn đầy đủ ảnh đại diện.
              </p>
            </div>
          </div>

          {thumbnailUrl && (
            <Badge
              variant="outline"
              className="font-sans text-[10px] font-medium border-status-success-text/30 bg-status-success-bg text-status-success-text rounded-md"
            >
              Đã có poster riêng
            </Badge>
          )}
        </div>

        {onUploadThumbnail && (
          <div className="max-w-md pt-1">
            <SceneImageUploadDropzone
              label="Tải ảnh Thumbnail Poster (Tùy chọn)"
              sublabel="Khung hình 16:9 ngang (PNG, JPG, WebP)"
              imageUrl={thumbnailUrl}
              aspectRatio="16:9"
              isUploading={uploadingThumbnail}
              onFileSelect={(file) => onUploadThumbnail(file)}
              onRemoveImage={() => setThumbnailUrl && setThumbnailUrl('')}
            />
          </div>
        )}
      </section>
    </div>
  );
};

// ─── 6. WHITEBOARD WORKSPACE (SCENE-BY-SCENE TIMELINE) ──────────────────────

interface WhiteboardSceneCardProps {
  scene: StoryboardScene;
  sceneImage?: string;
  isUploading: boolean;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onUpdateNarration?: (newNarration: string) => void;
}

const WhiteboardSceneCard: React.FC<WhiteboardSceneCardProps> = ({
  scene,
  sceneImage,
  isUploading,
  onUploadImage,
  onRemoveImage,
  copiedKey,
  onCopy,
  onUpdateNarration,
}) => {
  const [isEditingNarration, setIsEditingNarration] = useState(false);
  const [narrationDraft, setNarrationDraft] = useState(scene.narration_text || '');
  const promptKey = `scene_prompt_${scene.scene_index}`;
  const isPromptCopied = copiedKey === promptKey;

  const handleSaveNarration = () => {
    if (onUpdateNarration) {
      onUpdateNarration(narrationDraft);
    }
    setIsEditingNarration(false);
  };

  return (
    <article
      role="region"
      aria-label={`Phân cảnh ${scene.scene_index}`}
      className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-2xs space-y-4 hover:border-border transition-all w-full"
    >
      {/* Scene Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAE6DF]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-accent text-white font-sans text-xs font-bold shadow-2xs tabular-nums">
            {String(scene.scene_index).padStart(2, '0')}
          </span>
          <div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1917]">
              {scene.scene_title || `Phân Cảnh ${scene.scene_index}`}
            </h3>
            <p className="font-sans text-[11px] text-[#78716C] tabular-nums">
              ~{scene.estimated_duration_sec || 30}s • {scene.elements?.length || 3} khối hoạt họa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sceneImage ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-status-success-text bg-status-success-bg px-2.5 py-0.5 rounded-full border border-status-success-text/20">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              <span>Đã có ảnh vẽ</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-status-pending-text bg-status-pending-bg px-2.5 py-0.5 rounded-full border border-status-pending-text/20">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              <span>Chờ tải ảnh</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left (7 cols): Narrative Script & Doodle Elements */}
        <div className="lg:col-span-7 space-y-4">
          {/* Inline Scene Narration Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-accent" aria-hidden="true" />
                <span>Lời dẫn phân cảnh:</span>
              </span>
              {onUpdateNarration && !isEditingNarration && (
                <button
                  type="button"
                  onClick={() => setIsEditingNarration(true)}
                  className="font-sans text-xs font-medium text-accent hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" aria-hidden="true" />
                  <span>Sửa lời dẫn</span>
                </button>
              )}
            </div>

            {isEditingNarration ? (
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  value={narrationDraft}
                  onChange={(e) => setNarrationDraft(e.target.value)}
                  className="font-sans text-xs sm:text-[13px] bg-white border-[#EAE6DF] focus-visible:ring-accent leading-relaxed rounded-xl p-3"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNarrationDraft(scene.narration_text || '');
                      setIsEditingNarration(false);
                    }}
                    className="font-sans h-7 text-xs px-2.5 rounded-lg border-[#E2DDD5]"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNarration}
                    className="font-sans h-7 text-xs px-3 bg-accent text-white hover:bg-accent/90 rounded-lg cursor-pointer"
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <p className="font-sans text-xs sm:text-[13px] text-[#1C1917] leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF] italic">
                &ldquo;{scene.narration_text || 'Chưa có lời dẫn phân cảnh cụ thể.'}&rdquo;
              </p>
            )}
          </div>

          {/* Doodle Elements List */}
          {scene.elements && scene.elements.length > 0 && (
            <div className="space-y-2">
              <label className="font-sans text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
                Chủ thể xuất hiện trên bảng vẽ Whiteboard:
              </label>
              <div className="space-y-1.5">
                {scene.elements.map((el, elIdx) => (
                  <div
                    key={elIdx}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs font-sans space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                        {el.label}
                      </span>
                      {el.narrativeRole && (
                        <span className="text-[10px] text-[#78716C] font-sans font-medium">{el.narrativeRole}</span>
                      )}
                    </div>
                    {el.subtitle && (
                      <p className="text-[#78716C] text-xs leading-relaxed italic">
                        &quot;{el.subtitle}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Doodle Prompt - STRICTLY font-sans (Be Vietnam Pro) */}
          {scene.image_prompt && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>Gợi ý mô tả nét vẽ bảng trắng 16:9:</span>
                </span>
                <span className="font-sans text-[11px] font-medium text-[#78716C] tabular-nums">Khung ngang 16:9</span>
              </div>

              <div className="relative p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs sm:text-[13px] font-sans text-[#1C1917] leading-relaxed pr-20 shadow-2xs">
                <p className="line-clamp-3 select-all">{scene.image_prompt}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(scene.image_prompt || '', promptKey)}
                  className={`absolute right-2 top-2 h-7.5 px-2.5 font-sans text-xs gap-1 bg-white border-[#E2DDD5] hover:bg-[#FAF8F5] rounded-lg focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
                    isPromptCopied ? 'text-status-success-text border-status-success-text/40' : 'text-[#1C1917]'
                  }`}
                >
                  {isPromptCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-status-success-text" aria-hidden="true" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#78716C]" aria-hidden="true" />
                      <span>Chép</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right (5 cols): 16:9 Scene Dropzone */}
        <div className="lg:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold text-[#1C1917]">
              Ảnh Cảnh {scene.scene_index} (16:9)
            </span>
            <span className="font-sans text-[11px] text-[#78716C]">Widescreen</span>
          </div>

          <SceneImageUploadDropzone
            label={`Tải ảnh Cảnh ${scene.scene_index}`}
            sublabel="Khung hình 16:9 (PNG, JPG, WebP tối đa 10MB)"
            imageUrl={sceneImage || ''}
            aspectRatio="16:9"
            isUploading={isUploading}
            onFileSelect={onUploadImage}
            onRemoveImage={onRemoveImage}
          />
        </div>
      </div>
    </article>
  );
};

export const StoryboardStudioWhiteboardView: React.FC = () => {
  const {
    storyboard,
    sceneImages,
    uploadingSceneIndex,
    onUploadSceneImage,
    onRemoveSceneImage,
    thumbnailUrl,
    setThumbnailUrl,
    uploadingThumbnail,
    onUploadThumbnail,
    copiedKey,
    onCopy,
    onUpdateSceneNarration,
  } = useStoryboardStudio();

  if (!storyboard?.scenes) return null;

  return (
    <div className="space-y-4 w-full">
      {storyboard.scenes.map((scene) => {
        const sceneKey = String(scene.scene_index);
        return (
          <WhiteboardSceneCard
            key={scene.scene_index}
            scene={scene}
            sceneImage={sceneImages[sceneKey]}
            isUploading={uploadingSceneIndex === sceneKey}
            onUploadImage={(file) => onUploadSceneImage(sceneKey, file)}
            onRemoveImage={() => onRemoveSceneImage(sceneKey)}
            copiedKey={copiedKey}
            onCopy={onCopy}
            onUpdateNarration={
              onUpdateSceneNarration
                ? (text) => onUpdateSceneNarration(scene.scene_index, text)
                : undefined
            }
          />
        );
      })}

      {/* Optional Thumbnail Poster */}
      <section
        role="region"
        aria-label="Ảnh Thumbnail Poster 16:9 tùy chọn"
        className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-2xs space-y-3.5 w-full"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6.5 w-14 items-center justify-center rounded-md bg-[#FAF8F5] text-[#78716C] text-xs font-sans font-bold border border-[#EAE6DF]">
              Poster
            </span>
            <div>
              <h4 className="font-sans text-xs font-bold text-[#1C1917]">
                Ảnh Thumbnail Poster 16:9 (Tùy chọn hiển thị Trang Chủ)
              </h4>
              <p className="font-sans text-[11px] text-[#78716C]">
                Nếu để trống, hệ thống sẽ tự động dùng ảnh Cảnh 01 làm poster ngoài trang chủ.
              </p>
            </div>
          </div>
          {thumbnailUrl && (
            <Badge
              variant="outline"
              className="font-sans text-[10px] font-medium border-status-success-text/30 bg-status-success-bg text-status-success-text rounded-md"
            >
              Đã có poster riêng
            </Badge>
          )}
        </div>

        {onUploadThumbnail && (
          <div className="max-w-md pt-1">
            <SceneImageUploadDropzone
              label="Tải ảnh Thumbnail Poster 16:9 (Tùy chọn)"
              sublabel="Khung hình 16:9 (PNG, JPG, WebP tối đa 10MB)"
              imageUrl={thumbnailUrl}
              aspectRatio="16:9"
              isUploading={uploadingThumbnail}
              onFileSelect={(file) => onUploadThumbnail(file)}
              onRemoveImage={() => setThumbnailUrl && setThumbnailUrl('')}
            />
          </div>
        )}
      </section>
    </div>
  );
};

// ─── 7. FOOTER NAVIGATION ACTIONS ───────────────────────────────────────────

export const StoryboardStudioFooter: React.FC = () => {
  const { onPrevStep, onNextStep, isAudioPodcast, coverImageUrl, uploadedCount, totalScenes } = useStoryboardStudio();

  const isPendingCover = isAudioPodcast && !coverImageUrl;
  const isPendingScenes = !isAudioPodcast && uploadedCount < totalScenes;

  return (
    <div className="space-y-4 pt-6 border-t border-[#EAE6DF] mt-8 w-full">
      {/* Informative Guidance Banner (emil-design-eng) */}
      {isPendingCover && (
        <div className="rounded-xl border border-border/80 bg-[#FAF8F5] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#78716C] font-sans">
            <span className="h-2 w-2 rounded-full bg-status-warning-text shrink-0" />
            <span>
              <strong>Chưa tải ảnh bìa Podcast:</strong> Bạn có thể sang Bước 3 chọn giọng đọc trước hoặc bổ sung ở Bước 4 (Bắt buộc trước khi kết xuất).
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted border border-border bg-white px-2 py-0.5 rounded-md shrink-0">
            Có thể chuyển bước
          </span>
        </div>
      )}

      {isPendingScenes && (
        <div className="rounded-xl border border-border/80 bg-[#FAF8F5] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#78716C] font-sans">
            <span className="h-2 w-2 rounded-full bg-status-warning-text shrink-0" />
            <span>
              <strong>Còn thiếu {totalScenes - uploadedCount}/{totalScenes} ảnh phân cảnh:</strong> Bạn có thể sang Bước 3 chọn giọng đọc trước hoặc hoàn thiện ảnh ngay tại đây.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted border border-border bg-white px-2 py-0.5 rounded-md shrink-0">
            Có thể chuyển bước
          </span>
        </div>
      )}

      <footer
        role="contentinfo"
        className="flex items-center justify-between w-full"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevStep}
          className="font-sans gap-2 text-xs sm:text-sm font-medium border-[#E2DDD5] bg-white hover:bg-[#FAF8F5] text-[#1C1917] h-10 sm:h-11 px-4 sm:px-5 rounded-xl active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay lại Bước 1 (Kịch bản)</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onNextStep}
          className="font-sans gap-2 text-xs sm:text-sm font-bold px-5 sm:px-7 h-10 sm:h-11 rounded-xl bg-accent text-white hover:bg-accent/90 shadow-2xs active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <span>Tiếp tục: Chọn giọng đọc AI (Bước 3)</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </footer>
    </div>
  );
};

// ─── 8. COMPOUND COMPONENT CONTAINER & MAIN EXPORT ──────────────────────────

export const StoryboardStudioRoot: React.FC<Step2StoryboardScenesProps> = (props) => {
  const [showFullScript, setShowFullScript] = useState(false);

  const { storyboard, scriptContent, renderMode = 'audio_podcast', sceneImages } = props;

  const isAudioPodcast = renderMode === 'audio_podcast';
  const totalScenes = storyboard?.scenes?.length || 0;
  const uploadedCount = useMemo(() => {
    if (!storyboard?.scenes) return 0;
    return storyboard.scenes.filter((s) => {
      const key = String(s.scene_index);
      return Boolean(sceneImages[key]);
    }).length;
  }, [storyboard, sceneImages]);

  const wordCount = useMemo(() => {
    return scriptContent.trim() ? scriptContent.trim().split(/\s+/).length : 0;
  }, [scriptContent]);

  const estimatedReadingSec = useMemo(() => {
    return Math.max(5, Math.round(wordCount / 2.5));
  }, [wordCount]);

  const contextValue: StoryboardStudioContextValue = {
    ...props,
    renderMode,
    showFullScript,
    setShowFullScript,
    isAudioPodcast,
    totalScenes,
    uploadedCount,
    wordCount,
    estimatedReadingSec,
  };

  if (!storyboard || !storyboard.scenes || storyboard.scenes.length === 0) {
    return <StoryboardEmptyState onPrevStep={props.onPrevStep} />;
  }

  return (
    <StoryboardStudioContext.Provider value={contextValue}>
      <div
        role="region"
        aria-label="Kiểm duyệt phân cảnh và chuẩn bị hình ảnh minh họa"
        className="space-y-5 sm:space-y-6 w-full"
      >
        <StoryboardStudioHeader />
        <StoryboardStudioScriptWorkbench />
        {isAudioPodcast ? (
          <StoryboardStudioAudioPodcastView />
        ) : (
          <StoryboardStudioWhiteboardView />
        )}
        <StoryboardStudioFooter />
      </div>
    </StoryboardStudioContext.Provider>
  );
};

// Attach compound subcomponents for composable usage
export const Step2StoryboardScenes = Object.assign(StoryboardStudioRoot, {
  Root: StoryboardStudioRoot,
  Header: StoryboardStudioHeader,
  ScriptWorkbench: StoryboardStudioScriptWorkbench,
  AudioPodcastView: StoryboardStudioAudioPodcastView,
  WhiteboardView: StoryboardStudioWhiteboardView,
  Footer: StoryboardStudioFooter,
  EmptyState: StoryboardEmptyState,
});

export default Step2StoryboardScenes;
