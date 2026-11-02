import React from 'react';
import { cn } from '@/utils/cn';

interface CreatorCommissionsHeroBannerProps {
  className?: string;
}

export const CreatorCommissionsHeroBanner: React.FC<CreatorCommissionsHeroBannerProps> = ({
  className,
}) => {
  return (
    <header
      aria-label="Tiêu đề Đơn Đặt Hàng & Lộ Trình Milestone"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] px-5 sm:px-7 py-3.5 sm:py-4 shadow-2xs min-h-[86px] sm:min-h-[96px] flex flex-col justify-center',
        className
      )}
      data-motion-target="commissions-hero"
    >
      {/* Historical Scroll & Quill Artwork on Right Background */}
      <div
        className="absolute inset-y-0 right-0 h-full w-full sm:w-4/5 lg:w-3/5 flex items-center justify-end pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/commissions-hero-banner-exact.png"
          alt=""
          className="h-full w-auto max-w-none object-contain object-right pointer-events-none select-none transition-opacity duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/studio/wallet-hero-banner-exact.png';
          }}
        />
      </div>

      {/* Protective Left Gradient Wash for Text Readability */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/5 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/95 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Content Area */}
      <div className="relative z-10 space-y-1 max-w-md sm:max-w-xl">
        <h1 className="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#1C1615] leading-snug">
          Đơn Đặt Hàng &amp; Lộ Trình Milestone
        </h1>
        <p className="text-xs text-[#6B5E55] leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none">
          Tiếp nhận yêu cầu nội dung từ khán giả, trao đổi trực tiếp với khách hàng, lập lộ trình ký quỹ cuốn chiếu và bàn giao nghiệm thu.
        </p>
      </div>
    </header>
  );
};
