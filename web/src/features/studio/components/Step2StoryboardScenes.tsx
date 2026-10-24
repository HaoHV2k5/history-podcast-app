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
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StoryboardResponse } from '@/types/creatorStudio';
import { SceneImageUploadDropzone } from './SceneImageUploadDropzone';

interface Step2StoryboardScenesProps {
  storyboard: StoryboardResponse | null;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  sceneImages: Record<string, string>;
  onUploadSceneImage: (sceneIndex: string, file: File) => Promise<void>;
  onRemoveSceneImage: (sceneIndex: string) => void;
  uploadingSceneIndex: string | null;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onUpdateSceneNarration: (sceneIndex: number, newNarration: string) => void;
}

export const Step2StoryboardScenes: React.FC<Step2StoryboardScenesProps> = ({
  storyboard,
  scriptContent,
  setScriptContent,
  sceneImages,
  onUploadSceneImage,
  onRemoveSceneImage,
  uploadingSceneIndex,
  copiedKey,
  onCopy,
  onPrevStep,
  onNextStep,
  onUpdateSceneNarration,
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

  const totalScenes = storyboard.scenes.length;
  const uploadedCount = storyboard.scenes.filter((s) => {
    const key = String(s.scene_index);
    return Boolean(sceneImages[key]);
  }).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info Banner */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="accent" className="text-[11px] font-sans font-medium">
              {totalScenes} Phân Cảnh Whiteboard
            </Badge>
            <Badge variant="outline" className="text-[11px] font-mono">
              ~{storyboard.estimated_duration_sec || 60}s tổng thời lượng
            </Badge>
            <span className="text-xs text-muted">
              • Đã tải {uploadedCount} / {totalScenes} ảnh minh họa
            </span>
          </div>
          <h2 className="font-serif text-lg font-bold text-ink">
            {storyboard.title || 'Kịch Bản Phân Cảnh Lịch Sử'}
          </h2>
        </div>

        {/* Script Drawer Toggle */}
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

      {/* Expandable Full Script Textarea */}
      {showFullScript && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Film className="h-3.5 w-3.5 text-accent" />
              <span>Toàn Văn Lời Dẫn Thuyết Minh (Có Thể Chỉnh Sửa Tự Do)</span>
            </span>
            <span className="text-[11px] text-muted italic">
              * Khi render, giọng đọc AI sẽ đọc chính xác từng từ ngữ theo kịch bản này
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

      {/* Scene Cards List */}
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
                      {scene.scene_title || `Phân cảnh ${scene.scene_index}`}
                    </h3>
                    <span className="text-[11px] text-muted">
                      Thời lượng ước tính: ~{scene.estimated_duration_sec || 10} giây
                    </span>
                  </div>
                </div>

                {currentImg ? (
                  <Badge variant="success" size="sm" className="gap-1 font-sans">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Đã có ảnh minh họa</span>
                  </Badge>
                ) : (
                  <Badge variant="pending" size="sm" className="gap-1 font-sans">
                    <ImageIcon className="h-3 w-3" />
                    <span>Chờ tải ảnh minh họa</span>
                  </Badge>
                )}
              </div>

              {/* Scene Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left (7 cols): Narration + AI Prompt */}
                <div className="lg:col-span-7 space-y-3.5">
                  {/* Narration */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink flex items-center justify-between">
                      <span>Lời thuyết minh phân cảnh</span>
                      <span className="text-[11px] text-muted font-normal">Chỉnh sửa trực tiếp</span>
                    </label>
                    <Textarea
                      rows={3}
                      value={scene.narration_text}
                      onChange={(e) => onUpdateSceneNarration(scene.scene_index, e.target.value)}
                      className="text-xs font-sans leading-relaxed bg-surface-subtle/30 border-border"
                    />
                  </div>

                  {/* AI Prompt Box */}
                  {scene.image_prompt && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-accent" />
                          <span>Gợi ý Prompt vẽ ảnh (Doodle / Sketch phác thảo 16:9):</span>
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
                          <span>
                            {copiedKey === `scene_prompt_${scene.scene_index}` ? 'Đã chép' : 'Chép'}
                          </span>
                        </Button>
                      </div>

                      <p className="text-[10px] text-muted italic">
                        * Mang prompt này sang Midjourney, DALL-E hoặc Canva để tạo ảnh 16:9 rồi kéo thả vào khung bên phải.
                      </p>
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
      </div>

      {/* Bottom Navigation */}
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
