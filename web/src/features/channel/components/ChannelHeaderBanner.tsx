import React from 'react';
import { Radio } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChannelHeaderBannerProps {
  status?: string;
  className?: string;
}

export const ChannelHeaderBanner: React.FC<ChannelHeaderBannerProps> = ({
  status = 'ACTIVE',
  className,
}) => {
  const isChannelActive = status === 'ACTIVE' || status === 'PUBLISHED';

  return (
    <header
      aria-label="Tiêu đề Quản lý Kênh Podcast"
      className={cn(
        'relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] px-4 sm:px-6 py-4 sm:py-5 min-h-[110px] sm:min-h-[120px] flex flex-col justify-center shadow-2xs',
        className
      )}
      data-motion-target="header"
    >
      {/* Historical Landscape Panorama Artwork - Flush right and bottom */}
      <div
        className="absolute inset-y-0 right-0 h-full flex items-end justify-end pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/kyc-header-artwork.png"
          alt=""
          className="h-full w-auto max-w-none object-contain object-right-bottom pointer-events-none select-none opacity-95"
        />
      </div>

      {/* Protective Left Gradient Wash for Text Readability */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/5 md:w-1/2 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Status Pill on Top-Right */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 hidden sm:flex items-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide border shadow-2xs select-none backdrop-blur-xs',
            isChannelActive
              ? 'bg-[#EDFDF2]/90 border-[#A6E9B9] text-[#168A4E]'
              : 'bg-[#FFFBEB]/90 border-[#FDE68A] text-[#B45309]'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isChannelActive ? 'bg-[#168A4E] animate-pulse' : 'bg-[#B45309]'
            )}
            aria-hidden="true"
          />
          <span className="uppercase">
            {isChannelActive ? 'KÊNH HOẠT ĐỘNG (ACTIVE)' : `TRẠNG THÁI (${status})`}
          </span>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="relative z-10 space-y-1.5 max-w-lg lg:max-w-xl">
        {/* Title with Radio Icon */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FDF2F2] border border-[#F9D2D4] text-[#A31D24] shadow-2xs"
            aria-hidden="true"
          >
            <Radio className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1A19]">
            Quản lý Kênh Podcast
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-[13px] text-[#786D66] leading-relaxed pl-9 sm:pl-10.5">
          Thiết lập nhận diện, chỉnh sửa thông tin mô tả và cập nhật hình ảnh của kênh.
        </p>
      </div>

      {/* Mobile-only status badge below */}
      <div className="mt-3 relative z-10 sm:hidden">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border shadow-2xs select-none',
            isChannelActive
              ? 'bg-[#EDFDF2] border-[#A6E9B9] text-[#168A4E]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isChannelActive ? 'bg-[#168A4E] animate-pulse' : 'bg-[#B45309]'
            )}
            aria-hidden="true"
          />
          <span className="uppercase">
            {isChannelActive ? 'KÊNH HOẠT ĐỘNG (ACTIVE)' : `TRẠNG THÁI (${status})`}
          </span>
        </div>
      </div>
    </header>
  );
};
