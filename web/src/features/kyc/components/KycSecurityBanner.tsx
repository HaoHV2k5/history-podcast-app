import React from 'react';
import { ShieldCheck, Lock, ChevronRight } from 'lucide-react';

interface KycSecurityBannerProps {
  onOpenSecurity: () => void;
  className?: string;
}

export const KycSecurityBanner: React.FC<KycSecurityBannerProps> = ({
  onOpenSecurity,
  className = '',
}) => {
  return (
    <footer
      aria-label="Cam kết bảo mật thông tin KYC"
      className={`rounded-xl sm:rounded-2xl border border-[#F3DFDF] bg-[#FCF7F7] px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      data-motion-target="security-banner"
    >
      {/* Left Icon & Text Content */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div
          className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FDE8E8] text-[#A31D24] border border-[#F8B4B4] shadow-2xs"
          aria-hidden="true"
        >
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h4 className="font-serif text-xs sm:text-[12.5px] font-bold text-[#991B1B] truncate">
            Thông tin của bạn được bảo mật tuyệt đối
          </h4>
          <p className="text-[10.5px] sm:text-[11px] text-[#5C524F] leading-tight sm:leading-normal">
            Sử Ký cam kết bảo vệ thông tin cá nhân và tài chính của nhà sáng tạo theo các tiêu chuẩn bảo mật cao nhất.
          </p>
        </div>
      </div>

      {/* Right Action Button */}
      <div className="shrink-0 w-full sm:w-auto flex justify-end">
        <button
          id="kyc-security-info-btn"
          type="button"
          onClick={onOpenSecurity}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-[#FAF4F4] text-[#A31D24] border border-[#F0D5D5] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold shadow-2xs transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]/30"
        >
          <Lock className="h-3 w-3" />
          <span>Bảo mật thông tin</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </footer>
  );
};
