import React from 'react';

export const AdminKycHeroBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between py-3 sm:py-4 px-2 sm:px-4 select-none min-h-[140px] sm:min-h-[150px] overflow-hidden rounded-2xl bg-[#FAF8F5]">
      {/* 1. Authentic Generated Heritage Landscape Panorama Background (Zero Crop, Zero Watermark) */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-kyc-header-bg.png?v=20261103f"
          alt=""
          className="h-full w-full object-cover object-[center_center] select-none pointer-events-none"
        />
        {/* Soft natural fade overlay on left side so title and category pill are 100% crisp */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 via-30% to-transparent w-full md:w-2/5" />
      </div>

      {/* 2. Left Column: Category Pill, Heading & Subtitle */}
      <div className="relative z-10 space-y-1.5 shrink-0 max-w-xl pl-2 sm:pl-4">
        {/* Category Pill: [🛡✓] QUẢN LÝ XÁC THỰC DANH TÍNH ✦ */}
        <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#991B1B] tracking-wider uppercase">
          {/* Solid shield with checkmark matching mockup exactly */}
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#991B1B] text-white shadow-2xs">
            <svg
              className="h-2.5 w-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span>QUẢN LÝ XÁC THỰC DANH TÍNH</span>
          {/* Sparkle icon */}
          <svg
            className="h-3 w-3 text-[#991B1B] shrink-0 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>

        {/* Large Serif Title */}
        <h1 className="font-serif text-[28px] sm:text-[32px] md:text-[34px] font-bold text-[#1C1917] tracking-tight leading-tight">
          Xác thực danh tính KYC
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed font-sans max-w-2xl text-pretty">
          <span>Thẩm định hồ sơ định danh và phê duyệt quyền Nhà sáng tạo (Creator)</span>{' '}
          <span className="inline-block whitespace-nowrap">trên nền tảng Sử&nbsp;Ký.</span>
        </p>
      </div>

      {/* 3. Right Side: Pure Real Typography Slogan (Pure HTML text, bold, high-contrast serif italic) */}
      <div className="relative z-10 hidden lg:flex flex-col text-left select-none pr-6 sm:pr-10 md:pr-14 shrink-0">
        <span className="font-serif italic text-[15px] sm:text-[16px] md:text-[17px] font-bold text-[#881337] leading-snug whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
          “Xác thực minh bạch
        </span>
        <span className="font-serif italic text-[15px] sm:text-[16px] md:text-[17px] font-bold text-[#881337] leading-snug whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
          Cộng đồng bền vững”
        </span>
      </div>
    </div>
  );
};
