import React from 'react';
import { ShieldCheck, Check, Sparkles } from 'lucide-react';

interface KycBenefitsCardProps {
  className?: string;
}

const VERIFIED_BENEFITS = [
  'Được xuất bản podcast và video',
  'Nhận thù lao nhuận bút theo chính sách',
  'Tham gia chương trình đối tác & hợp tác',
  'Sử dụng đầy đủ tính năng Creator Studio',
  'Được hỗ trợ ưu tiên từ đội ngũ Sử Ký',
];

export const KycBenefitsCard: React.FC<KycBenefitsCardProps> = ({ className = '' }) => {
  return (
    <article
      aria-label="Quyền lợi sau khi xác thực"
      className={`rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4 shadow-2xs space-y-3 sm:space-y-3.5 relative overflow-hidden ${className}`}
      data-motion-target="benefits"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 border-b border-[#F0EBE1] pb-2.5">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#A31D24] shrink-0" />
          <h3 className="font-serif text-xs sm:text-sm font-bold text-[#A31D24]">
            Quyền lợi sau khi xác thực
          </h3>
        </div>

        {/* Golden crown emblem with warm circular glow */}
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8EB] border border-[#FDE68A] shadow-2xs"
          aria-hidden="true"
        >
          <img
            src="/assets/studio/kyc-crown-badge.png"
            alt="Biểu trưng đặc quyền"
            className="h-5 w-5 object-contain mix-blend-multiply"
          />
        </div>
      </div>

      {/* 5 Benefits List */}
      <ul className="space-y-2 sm:space-y-2.5">
        {VERIFIED_BENEFITS.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2.5">
            {/* Solid crimson circular checkmark */}
            <div
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A31D24] text-white shadow-2xs mt-0.5"
              aria-hidden="true"
            >
              <Check className="h-2.5 w-2.5 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-[12.5px] text-[#38302E] font-medium leading-snug">
              {benefit}
            </span>
          </li>
        ))}
      </ul>

      {/* Active Privileges Status Pill */}
      <div className="pt-2 border-t border-[#F0EBE1]">
        <div className="rounded-lg bg-[#F4F9F6] border border-[#C8DFD2] p-2 sm:p-2.5 flex items-center gap-2 text-[10.5px] sm:text-[11px] text-[#168A4E]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#168A4E] animate-pulse shrink-0" />
          <span className="font-semibold">Đã kích hoạt toàn bộ đặc quyền trên hệ thống</span>
        </div>
      </div>
    </article>
  );
};
