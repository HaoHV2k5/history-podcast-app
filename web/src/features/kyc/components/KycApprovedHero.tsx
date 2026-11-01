import React from 'react';
import { Check, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { KycProfile } from '@/types/kyc';

interface KycApprovedHeroProps {
  profile: KycProfile;
  onGoToChannel: () => void;
}

export const KycApprovedHero: React.FC<KycApprovedHeroProps> = ({
  profile,
  onGoToChannel,
}) => {
  const verifiedDate = profile.otpVerifiedAt
    ? new Date(profile.otpVerifiedAt).toLocaleDateString('vi-VN')
    : profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
    : 'Vừa cập nhật';

  const creatorDisplayName = profile.fullName?.trim() || 'Nhà Sáng Tạo';

  return (
    <section
      aria-label="Thông báo phê duyệt hồ sơ KYC"
      className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#D1E7DC] bg-[#F6FAF7] p-3.5 sm:p-4 md:p-4.5 min-h-[120px] sm:min-h-[130px] flex flex-col justify-center shadow-2xs"
      data-motion-target="hero"
    >
      {/* Bottom-left tea-green watercolor mist wash from master design */}
      <div
        className="absolute bottom-0 left-0 w-48 h-28 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(182,216,196,0.35)_0%,_rgba(246,250,247,0)_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Royal decree scroll illustration with imperial wax seal, ancient pagodas, and flying cranes */}
      <div
        className="absolute inset-y-0 right-0 h-full flex items-end justify-end pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/kyc-approved-scroll-clean.png"
          alt=""
          className="h-full w-auto max-w-none object-contain object-right pointer-events-none select-none"
        />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-5 max-w-2xl lg:max-w-3xl">
        {/* Jade green watercolor checkmark badge with soft halo and festive celebration confetti */}
        <div className="relative shrink-0 flex items-center justify-center">
          <img
            src="/assets/studio/kyc-approved-badge.png"
            alt="Đã xác thực"
            className="h-14 w-14 sm:h-16 sm:w-16 md:h-[72px] md:w-[72px] object-contain pointer-events-none select-none drop-shadow-xs"
          />
        </div>

        {/* Content Details */}
        <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
          {/* Status Badge & Profile Metadata */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F5EA] px-2 py-0.5 text-[10.5px] sm:text-[11px] font-bold text-[#137A43] border border-[#BBE5CD]">
              <CheckCircle2 className="h-3 w-3" />
              <span>ĐÃ PHÊ DUYỆT (APPROVED)</span>
            </span>
            {profile.id ? (
              <>
                <span className="text-[10.5px] sm:text-[11px] font-mono text-[#6B7280]">
                  Hồ sơ #{profile.id}
                </span>
                <span className="text-[#D1D5DB]">•</span>
              </>
            ) : null}
            <span className="text-[10.5px] sm:text-[11px] text-[#6B7280] font-medium">
              Xác thực lúc: {verifiedDate}
            </span>
          </div>

          {/* Greeting */}
          <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold tracking-tight text-[#1C1615] leading-snug">
            Chào mừng Nhà sáng tạo {creatorDisplayName}
          </h2>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-[#554C48] leading-relaxed max-w-xl">
            Bạn đã đủ điều kiện xuất bản tác phẩm và quản lý kênh podcast. Mọi khoản thù lao nhuận bút
            và phân phối tác quyền sẽ được thanh toán về tài khoản ngân hàng đã đăng ký.
          </p>

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              id="kyc-goto-channel-btn"
              type="button"
              onClick={onGoToChannel}
              className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#A31D24] to-[#881318] hover:from-[#8B141B] hover:to-[#741014] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-2xs shadow-[#A31D24]/20 hover:shadow-xs hover:shadow-[#A31D24]/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]/40 focus-visible:ring-offset-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Đến Không Gian Quản Lý Kênh</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
