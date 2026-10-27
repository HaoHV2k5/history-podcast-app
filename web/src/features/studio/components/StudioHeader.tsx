import React from 'react';
import { Settings, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudioHeaderProps {
  onOpenSettings: () => void;
  onNavigateLibrary: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onOpenSettings,
  onNavigateLibrary,
}) => {
  return (
    <div className="relative w-full min-h-[145px] sm:min-h-[165px] flex items-center justify-between transition-colors px-1 pt-2 pb-5 overflow-hidden rounded-2xl">
      {/* High-Fidelity Authentic Vietnamese Pagoda Artwork (Transparent PNG, zero bounding box, full architecture visible) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[760px] md:w-[920px] lg:w-[1080px] xl:w-[1180px] pointer-events-none bg-no-repeat bg-right bg-contain opacity-95 transition-opacity"
        style={{
          backgroundImage: 'url(/assets/studio/header-landscape.png)',
        }}
      />
      {/* Soft gradient wash on the far left to keep text ultra sharp */}
      <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/60 to-transparent pointer-events-none" />

      {/* Header Content: Title on left, Action buttons on right */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Masthead Title & Editorial Subtitle */}
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="font-serif text-2xl sm:text-[34px] font-bold tracking-tight text-[#1C1917] leading-tight">
            Tạo nội dung mới
          </h1>
          <p className="text-xs sm:text-[14px] text-[#78716C] leading-relaxed">
            Biến ý tưởng lịch sử thành podcast hoặc video giàu giá trị, dựa trên tư liệu chính thống.
          </p>
        </div>

        {/* Studio Quick Action Buttons (Settings gear & BookOpen red outline) */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="gap-2 text-xs font-medium border-[#E2DDD5] bg-white text-[#1C1917] hover:bg-[#F5F4F0] hover:border-accent/40 shadow-xs h-9 px-4 rounded-xl cursor-pointer"
          >
            <Settings className="h-4 w-4 text-[#78716C]" />
            <span>Cài đặt API Key</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateLibrary}
            className="gap-2 text-xs font-medium border-[#E2DDD5] bg-white text-[#1C1917] hover:bg-[#F5F4F0] hover:border-accent/40 shadow-xs h-9 px-4 rounded-xl cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-accent stroke-[1.8]" />
            <span>Thư viện nội dung</span>
          </Button>
        </div>
      </div>
    </div>
  );
};



