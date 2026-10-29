import React from 'react';
import { RefreshCw, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivestreamHeaderBannerProps {
  onRefresh: () => void;
  onCreateClick: () => void;
  isFetching?: boolean;
}

export const LivestreamHeaderBanner: React.FC<LivestreamHeaderBannerProps> = ({
  onRefresh,
  onCreateClick,
  isFetching = false,
}) => {
  return (
    <header
      aria-label="Quản lý phát trực tiếp Sử Ký"
      className="relative overflow-hidden py-4 sm:py-6 lg:py-7 flex flex-col justify-center min-h-[140px] sm:min-h-[150px]"
    >
      {/* Historical Landscape Panoramic Artwork - Spanning across the header (Red Sun, Khuê Văn Các, Citadel & Flying Swallows) */}
      <div
        className="absolute inset-y-0 right-0 w-full sm:w-5/6 md:w-3/4 lg:w-[72%] xl:w-[68%] pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/livestream-header-hero.png?v=3"
          alt=""
          className="w-full h-full object-cover object-right pointer-events-none select-none mix-blend-multiply opacity-95"
        />
        {/* Soft edge gradient to blend seamlessly into canvas background */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-36 md:w-48 bg-gradient-to-r from-canvas via-canvas/70 to-transparent pointer-events-none" />
      </div>

      {/* Protective Left Gradient Wash for Text Readability */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/5 md:w-1/2 bg-gradient-to-r from-canvas via-canvas/95 via-65% to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-wider text-[#A11C27] uppercase">
              PHÁT TRỰC TIẾP
            </span>
            <span className="text-[#A11C27]/60">•</span>
            <span className="font-mono text-xs font-semibold text-[#A11C27] uppercase">
              SỬ KÝ STUDIO
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-[#1C1615] leading-tight">
            Quản lý Phát trực tiếp
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#5C524F] leading-relaxed max-w-2xl text-pretty">
            Khởi tạo và điều phối các buổi đàm đạo podcast lịch sử trực tiếp, tương tác thời&nbsp;gian&nbsp;thực với cộng đồng thính giả trên nền tảng Sử&nbsp;Ký.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="gap-2 text-xs h-10 px-4 bg-white/95 backdrop-blur-xs hover:bg-stone-50 text-[#1C1615] border-[#E5E0D8] shadow-2xs transition-all duration-150 active:scale-[0.98] rounded-xl"
            title="Làm mới danh sách phiên phát trực tiếp"
            aria-label="Làm mới danh sách phiên phát trực tiếp"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#5C524F] ${isFetching ? 'animate-spin text-[#A11C27]' : ''}`}
            />
            <span className="font-medium">Làm mới</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onCreateClick}
            className="gap-2 text-xs h-10 px-4 bg-[#A11C27] hover:bg-[#85151E] text-white font-semibold rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98]"
            aria-label="Tạo phiên Live mới"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo phiên Live mới</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

