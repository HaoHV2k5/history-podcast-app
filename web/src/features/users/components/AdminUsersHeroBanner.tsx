import React from 'react';
import { Users } from 'lucide-react';

export const AdminUsersHeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-6 sm:p-7 shadow-xs">
      {/* Background warm tint & soft pinkish gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FFFBF7] via-[#FFF9F6] to-[#FFF5F5] opacity-90" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Text & Badges matching mockup */}
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            <Users className="h-4 w-4" />
            <span>QUẢN LÝ NGƯỜI DÙNG & KÊNH</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F1612]">
            Quản lý Người dùng & Kênh
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg">
            Tra cứu danh bạ người dùng, trạng thái kích hoạt và thiết lập vai trò hệ thống.
          </p>
        </div>

        {/* Center & Right: Artwork + Quote block matching mockup 100% */}
        <div className="flex items-center gap-5 sm:gap-6 self-stretch lg:self-auto justify-between lg:justify-end shrink-0">
          {/* Hero Banner Illustration */}
          <div className="hidden sm:block relative shrink-0">
            <img
              src="/assets/studio/admin-users-channels-hero-art.png"
              alt="Minh họa quản lý người dùng và kênh Sử Ký"
              className="h-28 sm:h-32 w-auto object-contain drop-shadow-xs"
            />
          </div>

          {/* Slogan Quote Box matching mockup 100% (No vertical border, left-aligned, exact 2 lines with red dash) */}
          <div className="flex flex-col justify-center text-left shrink-0">
            <p className="font-serif italic font-semibold text-sm sm:text-base text-[#D30722] leading-snug">
              <span className="block whitespace-nowrap">“Quản lý cộng đồng</span>
              <span className="block whitespace-nowrap">Kiến tạo giá trị bền vững”</span>
            </p>
            <div className="mt-3 h-[2.5px] w-6 bg-[#D30722] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
