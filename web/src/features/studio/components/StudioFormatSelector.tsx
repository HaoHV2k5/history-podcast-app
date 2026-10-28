import React from 'react';
import { Volume2, Layers, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudioFormatSelectorProps {
  renderMode: 'audio_podcast' | 'whiteboard';
  setRenderMode?: (mode: 'audio_podcast' | 'whiteboard') => void;
}

export const StudioFormatSelector: React.FC<StudioFormatSelectorProps> = ({
  renderMode,
  setRenderMode,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border border-border/80 bg-surface shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <span>Định dạng nội dung:</span>
        </span>
        <span className="text-[11px] text-muted hidden md:inline">
          {renderMode === 'audio_podcast'
            ? 'Kể chuyện truyền cảm • Chỉ cần 1 ảnh bìa dọc/vuông'
            : 'Hoạt họa diễn họa vẽ tay • Khung hình chuẩn 16:9'}
        </span>
      </div>

      {/* Compact Segmented Control */}
      <div className="flex w-full sm:w-auto items-center p-0.5 sm:p-1 rounded-lg bg-surface-subtle border border-border/70">
        <button
          type="button"
          onClick={() => setRenderMode?.('audio_podcast')}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-initial ${
            renderMode === 'audio_podcast'
              ? 'bg-surface text-accent shadow-xs border border-border/80'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Volume2 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Video Podcast Âm Thanh</span>
          <span className="inline sm:hidden">Podcast</span>
          <Badge variant="accent" className="text-[9px] py-0 px-1 font-sans ml-0.5 shrink-0">
            Khuyên dùng
          </Badge>
          {renderMode === 'audio_podcast' && <Check className="h-3 w-3 ml-0.5 stroke-[2.5] shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setRenderMode?.('whiteboard')}
          className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-initial ${
            renderMode === 'whiteboard'
              ? 'bg-surface text-accent shadow-xs border border-border/80'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Hoạt Họa Bảng Trắng</span>
          <span className="inline sm:hidden">Bảng Trắng</span>
          <span className="text-[10px] text-muted font-sans font-medium ml-0.5 shrink-0">16:9</span>
          {renderMode === 'whiteboard' && <Check className="h-3 w-3 ml-0.5 stroke-[2.5] shrink-0" />}
        </button>
      </div>
    </div>
  );
};
