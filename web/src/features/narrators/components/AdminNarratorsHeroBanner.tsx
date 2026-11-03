import React from 'react';
import { Mic } from 'lucide-react';

export const AdminNarratorsHeroBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between py-4 px-3 sm:px-6 md:px-8 select-none min-h-[145px] sm:min-h-[155px] overflow-hidden rounded-2xl bg-[#FAF8F5] border border-[#F0EBE6]">
      {/* 1. Lớp 1 (Background): Tranh nền panorama Sử Ký sạch, liền mạch, 100% không dính text hay nút lỗi */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-membership-hero-panorama-seamless.png"
          alt=""
          className="h-full w-full object-cover object-center select-none pointer-events-none opacity-90"
        />
        {/* Soft natural gradient fade on left to guarantee 100% crispness for title and subtitle */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 via-40% to-transparent w-full md:w-[50%]" />
        {/* Soft natural gradient fade on right to guarantee 100% crispness for slogan quote */}
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/85 via-25% to-transparent w-full md:w-1/3" />
      </div>

      {/* 2. Lớp 2 (Artwork Điểm Nhấn): Hình minh họa chính PNG trong suốt đặt chuẩn vị trí mockup */}
      <div
        className="pointer-events-none absolute right-[26%] lg:right-[24%] xl:right-[22%] top-1/2 -translate-y-1/2 hidden md:block z-5 select-none"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-narrators-hero-art.png"
          alt="Minh họa hồ sơ thuyết minh viên Sử Ký"
          className="h-28 lg:h-32 w-auto object-contain drop-shadow-xs"
        />
      </div>

      {/* 3. Lớp 3 (Nội Dung & Typography): Tiêu đề, mô tả chuẩn HTML/Tailwind, đỏ đô #7F1D1D / #991B1B */}
      <div className="relative z-10 space-y-1.5 shrink-0 max-w-xl pl-1 sm:pl-2">
        {/* Tag Pill: 🎙 QUẢN LÝ HỒ SƠ THUYẾT MINH VIÊN */}
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B]">
          <Mic className="h-4 w-4" />
          <span>QUẢN LÝ HỒ SƠ THUYẾT MINH VIÊN</span>
        </div>

        {/* Large Bold Title */}
        <h1 className="font-sans text-2xl sm:text-3xl md:text-[30px] font-bold tracking-tight text-[#1F1612] leading-tight">
          Danh bạ Thuyết minh viên
        </h1>

        {/* Subtitle: Sắc nét, tương phản cao, chống rớt chữ mồ côi (Anti-orphan word) */}
        <p className="text-xs sm:text-[13px] md:text-sm text-[#44403C] leading-relaxed font-sans max-w-lg text-pretty drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
          <span>Tra cứu danh bạ nghệ sĩ giọng đọc và thẩm định các tệp demo</span>{' '}
          <span className="inline-block whitespace-nowrap">ghi âm phục vụ sản xuất nội dung.</span>
        </p>
      </div>

      {/* Right Side: Authentic Typography Slogan Quote Box matching mockup */}
      <div className="relative z-10 hidden lg:flex flex-col text-left select-none pr-3 sm:pr-6 md:pr-8 shrink-0">
        <p className="font-sans italic font-bold text-xs sm:text-sm md:text-[14px] text-[#991B1B] leading-snug drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
          <span className="block whitespace-nowrap">“Giọng nói hay</span>
          <span className="block whitespace-nowrap">kiến tạo giá trị nội dung”</span>
        </p>
        <div className="mt-2.5 h-[2px] w-7 bg-[#991B1B] rounded-full" />
      </div>
    </div>
  );
};

