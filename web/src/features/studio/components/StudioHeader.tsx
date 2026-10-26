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
    <div className="relative rounded-2xl border border-[#EBE7DF]/80 bg-[#FAF9F6] px-6 py-6 sm:px-8 sm:py-7 shadow-xs overflow-hidden transition-colors">
      {/* High-Fidelity Vietnamese Pagoda & Landscape Artwork Background */}
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[58%] pointer-events-none bg-no-repeat bg-right bg-cover opacity-90 mix-blend-multiply"
        style={{ backgroundImage: 'url(/assets/studio/header-landscape.jpg)' }}
      />
      {/* Soft gradient overlay to ensure perfect readability of title and subtitle on the left */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/85 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Masthead Title & Editorial Subtitle */}
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="font-serif text-2xl sm:text-[32px] font-bold tracking-tight text-[#1C1917] leading-tight">
            Tạo nội dung mới
          </h1>
          <p className="text-xs sm:text-[13.5px] text-[#78716C] leading-relaxed">
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


