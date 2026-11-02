import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const AdminModerationHeroBanner: React.FC = () => {
  return (
    <div className="relative flex items-center justify-between py-1.5 select-none min-h-[110px] sm:min-h-[120px] overflow-hidden">
      {/* 1. Classical Heritage Panorama Artwork Backdrop (Authentic Pagoda, Peach Trees, Mountain & Swallows) */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-moderation-hero-backdrop-clean.png?v=20261102e"
          alt=""
          className="h-full w-full object-cover object-[right_center] select-none pointer-events-none"
        />
      </div>

      {/* 2. Left Column: Category Pill, Heading & Subtitle */}
      <div className="relative z-10 space-y-1 shrink-0 max-w-xl">
        {/* Category Pill: KIỂM DUYỆT NỘI DUNG */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#991B1B] tracking-wider uppercase">
          <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#991B1B]" strokeWidth={2.2} />
          <span>Kiểm duyệt nội dung</span>
        </div>

        {/* Large Serif Title */}
        <h1 className="font-serif text-[28px] sm:text-[32px] md:text-[34px] font-bold text-[#1C1917] tracking-tight leading-tight">
          Kiểm duyệt nội dung
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed font-sans max-w-xl">
          Hàng đợi kiểm duyệt video và thẩm định học thuật với sự hỗ trợ của AI Shield
        </p>
      </div>

      {/* 3. Right Side: Heritage Quality Guarantee Callout Card */}
      <div className="relative z-10 hidden lg:flex items-center justify-end shrink-0">
        <div className="flex items-center gap-3 bg-white/98 backdrop-blur-xs border border-[#EBE4D8] px-4 py-3 rounded-2xl shadow-xs transition-transform duration-200 hover:-translate-y-0.5">
          {/* Authentic Vietnamese Traditional Royal Seal / Bronze Drum Emblem */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <img
              src="/assets/studio/admin-moderation-seal-emblem.png?v=20261102e"
              alt=""
              className="h-8 w-8 object-contain select-none pointer-events-none"
            />
          </div>

          {/* Slogan Text */}
          <div className="flex flex-col">
            <span className="font-bold text-[13px] text-[#1C1917] leading-tight">
              Đảm bảo nội dung
            </span>
            <span className="text-[11px] sm:text-xs text-[#57534E] leading-tight mt-0.5">
              chất lượng, lan tỏa giá trị lịch sử
            </span>
            <div className="h-[2px] w-9 bg-[#991B1B] rounded-full mt-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
