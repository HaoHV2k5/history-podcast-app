import React from 'react';
import { Settings, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeritageAtmosphereWatermark } from '@/components/common/HeritageAtmosphereWatermark';

interface StudioHeaderProps {
  onOpenSettings: () => void;
  onNavigateLibrary: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onOpenSettings,
  onNavigateLibrary,
}) => {
  return (
    <header
      aria-label="Khởi tạo kịch bản lịch sử"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E2D9] bg-[#FAF8F5] p-5 sm:p-7 md:p-8 shadow-2xs"
    >
      {/* Authentic Vietnamese Heritage Vector Watermark & Atmospheric Glow */}
      <HeritageAtmosphereWatermark
        tag="✦ SỬ KÝ STUDIO · PHÒNG THU SÁNG TÁC"
        variant="studio"
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        {/* Left: Editorial Eyebrow, Title & Subtitle */}
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent font-sans">
            <Sparkles className="h-3.5 w-3.5 fill-accent/15" />
            <span>Phòng Thu Sáng Tác • Sử Ký Studio</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-[#1C1917] leading-tight">
            Tạo nội dung mới
          </h1>

          <p className="text-xs sm:text-[13px] text-[#78716C] leading-relaxed max-w-lg">
            Biến ý tưởng lịch sử thành podcast hoặc video giàu giá trị, dựa trên tư liệu chính thống.
          </p>
        </div>

        {/* Right: Refined Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="gap-2 text-xs font-semibold border-[#E2DDD5] bg-white/95 backdrop-blur-xs text-[#292524] hover:bg-white hover:text-accent hover:border-accent/40 shadow-2xs h-9 px-3.5 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Settings className="h-3.5 w-3.5 text-[#78716C]" />
            <span>Cài đặt API Key</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNavigateLibrary}
            className="gap-2 text-xs font-semibold border-[#E2DDD5] bg-white/95 backdrop-blur-xs text-[#292524] hover:bg-white hover:text-accent hover:border-accent/40 shadow-2xs h-9 px-3.5 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <BookOpen className="h-3.5 w-3.5 text-accent stroke-[2]" />
            <span>Thư viện nội dung</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
