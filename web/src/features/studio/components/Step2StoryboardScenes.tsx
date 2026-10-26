import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  CheckCircle2,
  Volume2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StoryboardResponse } from '@/types/creatorStudio';
import { SceneImageUploadDropzone } from './SceneImageUploadDropzone';

interface Step2StoryboardScenesProps {
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

export const Step2StoryboardScenes: React.FC<Step2StoryboardScenesProps> = ({
  renderMode = 'audio_podcast',
  storyboard,
  scriptContent,
  setScriptContent,
  sceneImages,
  onUploadSceneImage,
  onRemoveSceneImage,
  uploadingSceneIndex,
  coverImageUrl = '',
  setCoverImageUrl,
  uploadingCover = false,
  onUploadCoverImage,
  thumbnailUrl = '',
  setThumbnailUrl,
  uploadingThumbnail = false,
  onUploadThumbnail,
  copiedKey,
  onCopy,
  onPrevStep,
  onNextStep,
  onUpdateSceneNarration: _onUpdateSceneNarration,
}) => {
  const [showFullScript, setShowFullScript] = useState(false);

  if (!storyboard || !storyboard.scenes || storyboard.scenes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center space-y-4 max-w-xl mx-auto">
        <div className="h-12 w-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center">
          <Layers className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-base font-bold text-ink">Chưa có phân cảnh nào được tạo</h3>
          <p className="text-xs text-muted">
            Vui lòng quay lại Bước 1 để nhập nội dung hoặc bấm &quot;Tiếp tục: Tạo phân cảnh&quot;.
          </p>
        </div>
        <Button size="sm" onClick={onPrevStep} className="text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Bước 1</span>
        </Button>
      </div>
    );
  }

  const isAudioPodcast = renderMode === 'audio_podcast';
  const totalScenes = storyboard.scenes.length;
  const uploadedCount = storyboard.scenes.filter((s) => {
    const key = String(s.scene_index);
    return Boolean(sceneImages[key]);
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Info Banner */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {isAudioPodcast ? (
              <Badge variant="accent" className="text-[11px] font-sans font-medium flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                <span>Audio Podcast Video</span>
              </Badge>
            ) : (
              <Badge variant="accent" className="text-[11px] font-sans font-medium">
                {totalScenes} Phân Cảnh Whiteboard
              </Badge>
            )}

            <Badge variant="outline" className="text-[11px] font-mono">
              ~{storyboard.estimated_duration_sec || 60}s tổng thời lượng
            </Badge>

            <span className="text-xs text-muted">
              {isAudioPodcast
                ? coverImageUrl
                  ? '• ✅ Đã tải ảnh bìa Podcast'
                  : '• ⚠️ Cần 1 ảnh bìa để render'
                : `• Đã tải ${uploadedCount} / ${totalScenes} ảnh minh họa`}
            </span>
          </div>

          <h2 className="font-serif text-lg font-bold text-ink">
            {storyboard.title || 'Kịch Bản Phân Cảnh Lịch Sử'}
          </h2>
        </div>

        {/* Script Drawer Toggle & Next Step */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullScript(!showFullScript)}
            className="text-xs gap-1.5 border-border hover:bg-surface-subtle"
          >
            <span>{showFullScript ? 'Thu gọn kịch bản tổng' : 'Xem toàn văn kịch bản'}</span>
            {showFullScript ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          <Button
            size="sm"
            onClick={onNextStep}
            className="gap-2 text-xs font-semibold px-4 shadow-xs"
          >
            <span>Tiếp tục: Chọn giọng đọc (Bước 3)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Expandable Full Script Textarea */}
      {showFullScript && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Film className="h-3.5 w-3.5 text-accent" />
              <span>Toàn Văn Lời Dẫn Thuyết Minh (Có Thể Chỉnh Sửa Tự Do)</span>
            </span>
            <span className="text-[11px] text-muted italic">
              * Giọng đọc AI sẽ đọc chính xác từng từ ngữ theo kịch bản này
            </span>
          </div>
          <Textarea
            rows={6}
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            className="text-xs font-sans leading-relaxed bg-surface-subtle/40 border-border"
          />
        </div>
      )}

      {/* 3. Conditional Layout: Audio Podcast vs Whiteboard */}
      {isAudioPodcast ? (
        /* ── A. AUDIO PODCAST MODE (1 Cover Image + Optional Thumbnail Poster) ── */
        <div className="space-y-6">
          {/* Main Cover Image Card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-canvas font-bold text-xs">
                  🖼️
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-ink">
                    Ảnh Bìa Thuyết Minh Podcast (Bắt buộc)
                  </h3>
                  <p className="text-xs text-muted">
                    Là hình ảnh trung tâm hiển thị xuyên suốt video MP4 trên nền sóng âm và phụ đề chạy chữ
                  </p>
                </div>
              </div>
              <Badge variant="accent" className="text-[10px]">
                {coverImageUrl ? 'Đã Tải Lên' : 'Đang Chờ Ảnh'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): AI Prompt Suggestion */}
              <div className="lg:col-span-7 space-y-4">
                {storyboard.thumbnail_prompt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span>Gợi ý Prompt tạo Ảnh Bìa Podcast Nghệ Thuật:</span>
                      </label>
                      <span className="text-[10px] text-accent font-medium">Tỷ lệ 1:1 hoặc 16:9</span>
                    </div>

                    <div className="relative p-3.5 rounded-lg bg-surface-subtle border border-border text-xs font-mono text-muted leading-relaxed pr-24">
                      <p className="line-clamp-4 select-all">{storyboard.thumbnail_prompt}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onCopy(storyboard.thumbnail_prompt || '', 'podcast_cover_prompt')}
                        className="absolute right-2.5 top-2.5 h-7 px-2.5 text-[11px] gap-1 bg-surface border-border hover:bg-surface-subtle"
                      >
                        {copiedKey === 'podcast_cover_prompt' ? (
                          <Check className="h-3 w-3 text-status-success-text" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedKey === 'podcast_cover_prompt' ? 'Đã chép' : 'Chép Prompt'}</span>
                      </Button>
                    </div>

                    <div className="rounded-lg bg-surface-subtle/60 p-3 border border-border/60 text-[11px] text-muted space-y-1">
                      <p className="font-medium text-ink flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-accent" />
                        <span>Hướng dẫn tạo ảnh nhanh:</span>
                      </p>
                      <p>
                        1. Bấm <strong>Chép Prompt</strong> ở trên sang các công cụ AI (Midjourney, DALL-E, Bing Image Creator, Leonardo AI hoặc Canva).
                      </p>
                      <p>2. Lưu ảnh về máy tính, sau đó kéo thả hoặc chọn tệp tải vào khung bên phải.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (5 cols): Cover Image Upload Dropzone */}
              <div className="lg:col-span-5 space-y-2">
                <label className="text-xs font-semibold text-ink flex items-center justify-between">
                  <span>Tải Ảnh Bìa Podcast (`coverImage`)</span>
                  <span className="text-[11px] text-muted">Cloudinary CDN</span>
                </label>

                {onUploadCoverImage && (
                  <SceneImageUploadDropzone
                    label="Tải ảnh bìa Podcast"
                    sublabel="Tỷ lệ 1:1 hoặc 16:9 (PNG / JPG / WebP)"
                    imageUrl={coverImageUrl}
                    aspectRatio="1:1"
                    isUploading={uploadingCover}
                    onFileSelect={(file) => onUploadCoverImage(file)}
                    onRemoveImage={() => setCoverImageUrl && setCoverImageUrl('')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Optional Thumbnail Poster Card */}
          <div className="rounded-xl border border-dashed border-border bg-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-subtle text-muted text-xs font-bold border border-border">
                  Poster
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Ảnh Thumbnail Video 16:9 (Tùy chọn hiển thị Trang Chủ)
                  </h4>
                  <p className="text-[11px] text-muted">
                    Nếu để trống, hệ thống sẽ tự động dùng luôn <strong>Ảnh Bìa Podcast</strong> làm thumbnail để video không bao giờ bị rỗng ảnh ngoài trang chủ.
                  </p>
                </div>
              </div>
              {thumbnailUrl && (
                <Badge variant="outline" className="text-[10px]">
                  Đã Có Poster Riêng
                </Badge>
              )}
            </div>

            {onUploadThumbnail && (
              <div className="max-w-md pt-1">
                <SceneImageUploadDropzone
                  label="Tải ảnh Thumbnail Poster (Tùy chọn)"
                  sublabel="Khung hình 16:9 (PNG / JPG / WebP)"
                  imageUrl={thumbnailUrl}
                  aspectRatio="16:9"
                  isUploading={uploadingThumbnail}
                  onFileSelect={(file) => onUploadThumbnail(file)}
                  onRemoveImage={() => setThumbnailUrl && setThumbnailUrl('')}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── B. WHITEBOARD MODE (Scene-by-scene 1..N + Optional Thumbnail Poster) ── */
        <div className="space-y-4">
          {storyboard.scenes.map((scene) => {
            const sceneKey = String(scene.scene_index);
            const currentImg = sceneImages[sceneKey];

            return (
              <div
                key={scene.scene_index}
                className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4 card-hover-lift hover:border-accent/40 hover:shadow-card-hover transition-all duration-200"
              >
                {/* Scene Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-canvas font-mono text-xs font-bold">
                      {scene.scene_index}
                    </span>
                    <div>
                      <h3 className="font-serif text-sm font-bold text-ink">
                        {scene.scene_title || `Phân Cảnh ${scene.scene_index}`}
                      </h3>
                      <p className="text-[11px] text-muted">
                        ~{scene.estimated_duration_sec || 30}s • {scene.elements?.length || 3} khối hoạt họa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentImg ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-status-success-text bg-status-success-bg px-2 py-0.5 rounded-full border border-status-success-border">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Đã có ảnh vẽ</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-status-error-text bg-status-error-bg px-2 py-0.5 rounded-full border border-status-error-border font-medium">
                        Cần tải ảnh
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left (7 cols): Scene Elements & Prompt */}
                  <div className="lg:col-span-7 space-y-3.5">
                    {/* Elements List */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                        Các khối chủ thể xuất hiện theo nét vẽ:
                      </label>
                      <div className="space-y-1.5">
                        {scene.elements?.map((el, elIdx) => (
                          <div
                            key={elIdx}
                            className="p-2.5 rounded-lg bg-surface-subtle/50 border border-border/80 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-ink flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                {el.label}
                              </span>
                              {el.narrativeRole && (
                                <span className="text-[10px] text-muted font-mono">{el.narrativeRole}</span>
                              )}
                            </div>
                            <p className="text-muted text-[11px] leading-relaxed italic">&quot;{el.subtitle}&quot;</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Prompt Box */}
                    {scene.image_prompt && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-accent" />
                            <span>Gợi ý Prompt vẽ ảnh Doodle 16:9:</span>
                          </label>
                          <span className="text-[10px] text-accent font-medium">1-Click Copy</span>
                        </div>

                        <div className="relative p-3 rounded-lg bg-surface-subtle border border-border text-[11px] font-mono text-muted leading-relaxed pr-20">
                          <p className="line-clamp-3 select-all">{scene.image_prompt}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onCopy(scene.image_prompt || '', `scene_prompt_${scene.scene_index}`)}
                            className="absolute right-2 top-2 h-7 px-2.5 text-[11px] gap-1 bg-surface border-border hover:bg-surface-subtle"
                          >
                            {copiedKey === `scene_prompt_${scene.scene_index}` ? (
                              <Check className="h-3 w-3 text-status-success-text" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedKey === `scene_prompt_${scene.scene_index}` ? 'Đã chép' : 'Chép'}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right (5 cols): Image Upload Dropzone */}
                  <div className="lg:col-span-5 space-y-1.5">
                    <label className="text-xs font-semibold text-ink flex items-center justify-between">
                      <span>Ảnh minh họa Cảnh {scene.scene_index} (16:9)</span>
                      <span className="text-[11px] text-muted">Cloudinary CDN</span>
                    </label>

                    <SceneImageUploadDropzone
                      label={`Tải ảnh Cảnh ${scene.scene_index}`}
                      sublabel="Khung hình 16:9 (PNG / JPG / WebP)"
                      imageUrl={currentImg || ''}
                      aspectRatio="16:9"
                      isUploading={uploadingSceneIndex === sceneKey}
                      onFileSelect={(file) => onUploadSceneImage(sceneKey, file)}
                      onRemoveImage={() => onRemoveSceneImage(sceneKey)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Optional Thumbnail Poster for Whiteboard Mode */}
          <div className="rounded-xl border border-dashed border-border bg-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-subtle text-muted text-xs font-bold border border-border">
                  Poster
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Ảnh Thumbnail Poster 16:9 (Tùy chọn hiển thị Trang Chủ)
                  </h4>
                  <p className="text-[11px] text-muted">
                    Nếu để trống, hệ thống sẽ tự động dùng ảnh Cảnh 1 làm poster ngoài trang chủ.
                  </p>
                </div>
              </div>
              {thumbnailUrl && (
                <Badge variant="outline" className="text-[10px]">
                  Đã Có Poster Riêng
                </Badge>
              )}
            </div>

            {onUploadThumbnail && (
              <div className="max-w-md pt-1">
                <SceneImageUploadDropzone
                  label="Tải ảnh Thumbnail Poster 16:9 (Tùy chọn)"
                  sublabel="Khung hình 16:9 (PNG / JPG / WebP)"
                  imageUrl={thumbnailUrl}
                  aspectRatio="16:9"
                  isUploading={uploadingThumbnail}
                  onFileSelect={(file) => onUploadThumbnail(file)}
                  onRemoveImage={() => setThumbnailUrl && setThumbnailUrl('')}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevStep}
          className="gap-2 text-xs border-border hover:bg-surface-subtle transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Bước 1 (Kịch bản)</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onNextStep}
          className="gap-2 text-xs font-semibold px-5 shadow-glow-accent shimmer-button bg-accent text-canvas hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
        >
          <span>Tiếp tục: Chọn giọng đọc AI (Bước 3)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
