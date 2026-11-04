import React from 'react';
import { RefreshCw } from 'lucide-react';
import { HeritageAtmosphereWatermark } from '@/components/common/HeritageAtmosphereWatermark';
import { cn } from '@/utils/cn';

interface WalletHeroBannerProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const WalletHeroBanner: React.FC<WalletHeroBannerProps> = ({
  onRefresh,
  isRefreshing = false,
  className,
}) => {
  return (
    <header
      aria-label="Tiêu đề Ví & Quản Lý Thu Nhập"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 sm:p-7 md:p-8 shadow-2xs',
        className
      )}
      data-motion-target="wallet-hero"
      data-ui="wallet-hero"
    >
      {/* Authentic Vietnamese Heritage Vector Watermark & Atmospheric Glow */}
      <HeritageAtmosphereWatermark
        tag="SỬ KÝ ATELIER · QUẢN LÝ TÀI CHÍNH"
        variant="compact"
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 max-w-xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-[#981B1E]" />
            <span className="text-xs font-medium text-[#786D66]">
              Phòng thu Sử Ký · Tài chính &amp; Thu nhập
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1A19]">
            Ví &amp; Quản Lý Thu Nhập
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-[#786D66] leading-relaxed max-w-lg">
            Theo dõi số dư khả dụng, quản lý yêu cầu rút tiền và tiến độ giải ngân hợp đồng.
          </p>
        </div>

        {/* Refresh Balance Button on Right */}
        <div className="self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Làm mới số dư ví"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DDD7CD] bg-white px-4 py-2.5 text-xs font-semibold text-[#292524] hover:bg-[#FAF8F5] hover:border-[#C5BEB3] active:scale-[0.98] transition-[background-color,border-color,transform] duration-150 shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 text-[#786D66] transition-transform duration-500',
                isRefreshing && 'animate-spin text-[#981B1E]'
              )}
            />
            <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới số dư'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
