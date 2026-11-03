import React from 'react';
import { Crown } from 'lucide-react';

export const AdminMembershipHeroBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between py-4 px-3 sm:px-6 md:px-8 select-none min-h-[145px] sm:min-h-[155px] overflow-hidden rounded-2xl bg-[#FAF8F5]">
      {/* 1. Panoramic Heritage Backdrop (Authentic Imperial Crown, Lotus Pedestal, Pagoda Pavilion & Peach Trees) */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-membership-hero-panorama-seamless.png?v=20261103b"
          alt=""
          className="h-full w-full object-cover object-center select-none pointer-events-none"
        />
        {/* Soft natural gradient fade on left to guarantee 100% crispness for title and subtitle */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 via-40% to-transparent w-full md:w-[50%]" />
        {/* Soft natural gradient fade on right to guarantee 100% crispness for slogan quote */}
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/85 via-25% to-transparent w-full md:w-1/3" />
      </div>

      {/* 2. Left Column: Tag Pill, Heading & Subtitle */}
      <div className="relative z-10 space-y-1.5 shrink-0 max-w-2xl pl-1 sm:pl-2">
        {/* Tag Pill: 👑 QUẢN LÝ GÓI HỘI VIÊN & THANH TOÁN */}
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B]">
          <Crown className="h-4 w-4" />
          <span>QUẢN LÝ GÓI HỘI VIÊN & THANH TOÁN</span>
        </div>

        {/* Large Serif Title */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-[32px] font-bold tracking-tight text-[#1F1612] leading-tight">
          Gói Hội viên & Thanh toán
        </h1>

        {/* Subtitle: Sắc nét, tương phản cao, chống rớt chữ mồ côi (Anti-orphan word) */}
        <p className="text-xs sm:text-[13px] md:text-sm text-[#44403C] leading-relaxed font-sans max-w-2xl text-pretty drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
          <span>Theo dõi lịch sử thanh toán, quản lý gói hội viên</span>{' '}
          <span className="inline-block whitespace-nowrap">và phân bổ doanh&nbsp;thu cho&nbsp;Creator</span>
        </p>
      </div>

      {/* 3. Right Side: Authentic Typography Slogan (Pure HTML text, bold, high-contrast serif italic) */}
      <div className="relative z-10 hidden lg:flex flex-col text-left select-none pr-3 sm:pr-6 md:pr-8 shrink-0">
        <p className="font-serif italic font-bold text-xs sm:text-sm md:text-[15px] text-[#991B1B] leading-snug drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
          <span className="block whitespace-nowrap">“Nội dung chất lượng</span>
          <span className="block whitespace-nowrap">bắt đầu từ những</span>
          <span className="block whitespace-nowrap">nhà sáng tạo được trân trọng”</span>
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[#991B1B] text-xs">
          <span>✦</span>
          <span>✦</span>
        </div>
      </div>
    </div>
  );
};
