import React from 'react';
import { Clock } from 'lucide-react';

export const AdminAuditLogsHeroBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between py-4 px-4 sm:px-6 md:px-8 select-none min-h-[140px] sm:min-h-[150px] overflow-hidden rounded-2xl bg-[#FAF8F5] border border-[#F0EBE6] font-sans">
      {/* 1. Lớp 1 (Background): Tranh nền panorama Sử Ký sạch, liền mạch */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-membership-hero-panorama-seamless.png"
          alt=""
          className="h-full w-full object-cover object-center select-none pointer-events-none opacity-85"
        />
        {/* Soft natural gradient fade on left for title and subtitle contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/95 via-45% to-transparent w-full md:w-[58%]" />
        {/* Soft natural gradient fade on right for slogan quote contrast */}
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/90 via-25% to-transparent w-full md:w-1/3" />
      </div>

      {/* 2. Lớp 2 (Artwork): Hình minh họa chính PNG trong suốt đặt chuẩn tọa độ mockup */}
      <div
        className="pointer-events-none absolute right-[20%] lg:right-[19%] xl:right-[18%] top-1/2 -translate-y-1/2 hidden md:block z-5 select-none"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-audit-logs-hero-art.png"
          alt="Minh họa sổ lưu trữ nhật ký hệ thống Sử Ký"
          className="h-26 lg:h-29 w-auto object-contain drop-shadow-xs"
        />
      </div>

      {/* 3. Lớp 3 (Typography): Render 100% bằng HTML/Tailwind, đỏ đô #991B1B / #7F1D1D */}
      <div className="relative z-10 space-y-2 shrink-0 max-w-2xl pl-1 sm:pl-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#C81E1E] shadow-2xs"
            aria-hidden="true"
          >
            <Clock className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2]" />
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl md:text-[30px] font-bold tracking-tight text-[#1F1612] leading-tight text-balance">
            Nhật ký hệ thống
          </h1>
        </div>

        <p className="text-xs sm:text-[13px] md:text-sm text-[#57534E] leading-relaxed font-sans max-w-xl text-pretty drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] pl-0.5">
          Sổ lưu trữ toàn bộ lịch sử thao tác hành chính và biến động dữ liệu quan trọng trên{' '}
          <span className="inline-block whitespace-nowrap">nền tảng Sử Ký</span>
        </p>
      </div>

      {/* Slogan Quote Box góc phải kèm gạch chân đỏ đô #991B1B */}
      <div className="relative z-10 hidden lg:flex flex-col text-left select-none pr-2 sm:pr-4 md:pr-6 shrink-0">
        <p className="font-sans font-bold text-xs sm:text-sm md:text-[14px] text-[#991B1B] leading-snug drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
          <span className="block whitespace-nowrap">“Minh bạch hành động</span>
          <span className="block whitespace-nowrap">Vận hành bền vững”</span>
        </p>
        <div className="mt-2.5 h-[2px] w-8 bg-[#991B1B] rounded-full" />
      </div>
    </div>
  );
};

