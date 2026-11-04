import React from 'react';
import { FileText } from 'lucide-react';

export const AdminContractsHeroBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between py-4 px-3 sm:px-6 md:px-8 select-none min-h-[145px] sm:min-h-[155px] overflow-hidden rounded-2xl bg-[#FAF8F5] border border-[#F0EBE6]">
      {/* 1. Lớp 1 (Background): Tranh nền panorama Sử Ký */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-membership-hero-panorama-seamless.png"
          alt=""
          className="h-full w-full object-cover object-center select-none pointer-events-none opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 via-40% to-transparent w-full md:w-[50%]" />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/85 via-25% to-transparent w-full md:w-1/3" />
      </div>

      {/* 2. Lớp 2 (Artwork Điểm Nhấn) */}
      <div
        className="pointer-events-none absolute right-[26%] lg:right-[24%] xl:right-[22%] top-1/2 -translate-y-1/2 hidden md:block z-5 select-none"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-contracts-hero-art.png"
          alt="Minh họa hợp đồng sản xuất nội dung Sử Ký"
          className="h-28 lg:h-32 w-auto object-contain drop-shadow-xs"
        />
      </div>

      {/* 3. Lớp 3 (Nội Dung & Typography) */}
      <div className="relative z-10 space-y-1.5 shrink-0 max-w-xl pl-1 sm:pl-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B]">
          <FileText className="h-4 w-4" />
          <span>QUẢN LÝ HỢP ĐỒNG SẢN XUẤT</span>
        </div>

        <h1 className="font-sans text-2xl sm:text-3xl md:text-[30px] font-bold tracking-tight text-[#1F1612] leading-tight">
          Quản lý Hợp đồng
        </h1>

        <p className="text-xs sm:text-[13px] md:text-sm text-[#44403C] leading-relaxed font-sans max-w-lg text-pretty drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
          <span>Sổ lưu trữ và đối soát hợp đồng đặt làm nội dung theo cột mốc giữa</span>{' '}
          <span className="inline-block whitespace-nowrap">Khách đặt nội dung và Nhà sáng tạo.</span>
        </p>
      </div>

      {/* Right Side: Slogan Quote Box */}
      <div className="relative z-10 hidden lg:flex flex-col text-left select-none pr-3 sm:pr-6 md:pr-8 shrink-0">
        <p className="font-sans italic font-bold text-xs sm:text-sm md:text-[14px] text-[#991B1B] leading-snug drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
          <span className="block whitespace-nowrap">“Hợp tác minh bạch</span>
          <span className="block whitespace-nowrap">Nội dung chất lượng”</span>
        </p>
        <div className="mt-2.5 h-[2px] w-7 bg-[#991B1B] rounded-full" />
      </div>
    </div>
  );
};
