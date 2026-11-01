import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
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
        'relative overflow-hidden rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] px-5 sm:px-8 py-5 sm:py-6 shadow-2xs min-h-[140px] flex flex-col justify-center',
        className
      )}
      data-motion-target="wallet-hero"
    >
      {/* Authentic Historical Watercolor + 3D Visual Artwork on the Right Background */}
      <div
        className="absolute inset-y-0 right-0 h-full w-full sm:w-3/4 lg:w-2/3 flex items-center justify-end pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/wallet-hero-banner-exact.png"
          alt=""
          className="h-full w-auto max-w-none object-contain object-right pointer-events-none select-none transition-opacity duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/studio/wallet-hero-exact-illustration.png';
          }}
        />
      </div>

      {/* Protective Left Gradient Wash for Text Readability */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-1/2 md:w-2/5 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          {/* Badge: Red Icon + CREATOR WALLET */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A31D24]">
            <Sparkles className="h-3.5 w-3.5 fill-[#A31D24]" />
            <span>CREATOR WALLET</span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1A19]">
            Ví & Quản Lý Thu Nhập
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-[#786D66] leading-relaxed max-w-lg">
            Theo dõi doanh thu, quản lý số dư ví, lịch sử giao dịch và yêu cầu rút tiền một cách dễ dàng.
          </p>
        </div>

        {/* Refresh Balance Button on Right */}
        <div className="self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Làm mới số dư ví"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] hover:border-[#D5CFC5] active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-60"
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
