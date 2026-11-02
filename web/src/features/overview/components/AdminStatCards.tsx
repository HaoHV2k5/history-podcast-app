import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  User,
  Wallet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface AdminStatCardsProps {
  pendingModCount: number;
  modLoading?: boolean;
  pendingKycCount: number;
  kycLoading?: boolean;
  pendingWithCount: number;
  withLoading?: boolean;
  openDisputeCount: number;
  disputeLoading?: boolean;
}

export const AdminStatCards: React.FC<AdminStatCardsProps> = ({
  pendingModCount,
  modLoading,
  pendingKycCount,
  kycLoading,
  pendingWithCount,
  withLoading,
  openDisputeCount,
  disputeLoading,
}) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'moderation',
      title: 'Kiểm duyệt chờ duyệt',
      count: pendingModCount,
      loading: modLoading,
      trend: { dir: 'up', value: '+3', isRed: true },
      description: 'Video nộp chờ thẩm định AI & Ban điều hành',
      actionLabel: 'Xem hàng đợi',
      to: '/admin/moderation',
      theme: {
        cardBg: 'bg-[#FFF6F6]',
        borderColor: 'border-[#FCE8E8]',
        hoverBorder: 'hover:border-[#E89EAE]',
        iconBg: 'bg-[#FDE8E8]',
        iconColor: 'text-[#DC2626]',
        btnBorder: 'border-[#F3E8E8]',
      },
      icon: ShieldAlert,
      illustrationUrl: '/assets/studio/admin-stat-card1-video.png',
      alt: 'Biểu tượng kiểm duyệt video 3D',
    },
    {
      id: 'kyc',
      title: 'Hồ sơ KYC chờ xác thực',
      count: pendingKycCount,
      loading: kycLoading,
      trend: { dir: 'down', value: '-2', isRed: false },
      description: 'Ứng viên đăng ký quyền Nhà sáng tạo',
      actionLabel: 'Xem hàng đợi',
      to: '/admin/kyc',
      theme: {
        cardBg: 'bg-[#FFFDF5]',
        borderColor: 'border-[#FEF3C7]',
        hoverBorder: 'hover:border-[#E8C46E]',
        iconBg: 'bg-[#FEF3C7]',
        iconColor: 'text-[#D97706]',
        btnBorder: 'border-[#F5EED8]',
      },
      icon: User,
      illustrationUrl: '/assets/studio/admin-stat-card2-kyc.png',
      alt: 'Biểu tượng xác thực định danh 3D',
    },
    {
      id: 'withdrawals',
      title: 'Yêu cầu rút tiền chờ duyệt',
      count: pendingWithCount,
      loading: withLoading,
      trend: { dir: 'down', value: '-1', isRed: false },
      description: 'Yêu cầu rút tiền về ngân hàng của Nhà sáng tạo',
      actionLabel: 'Xem hàng đợi',
      to: '/admin/withdrawals',
      theme: {
        cardBg: 'bg-[#F6F9FE]',
        borderColor: 'border-[#E2EDFC]',
        hoverBorder: 'hover:border-[#96C0F7]',
        iconBg: 'bg-[#EFF6FF]',
        iconColor: 'text-[#2563EB]',
        btnBorder: 'border-[#E2EDFC]',
      },
      icon: Wallet,
      illustrationUrl: '/assets/studio/admin-stat-card3-wallet.png',
      alt: 'Biểu tượng rút tiền 3D',
    },
    {
      id: 'disputes',
      title: 'Khiếu nại đang thụ lý',
      count: openDisputeCount,
      loading: disputeLoading,
      trend: { dir: 'up', value: '+1', isRed: true },
      description: 'Tranh chấp hợp đồng thu âm cần giải quyết',
      actionLabel: 'Xem xử lý',
      to: '/admin/disputes',
      theme: {
        cardBg: 'bg-[#FFF6F6]',
        borderColor: 'border-[#FCE8E8]',
        hoverBorder: 'hover:border-[#F29D9D]',
        iconBg: 'bg-[#FEE2E2]',
        iconColor: 'text-[#DC2626]',
        btnBorder: 'border-[#F3E8E8]',
      },
      icon: AlertCircle,
      illustrationUrl: '/assets/studio/admin-stat-card4-dispute.png',
      alt: 'Biểu tượng khiếu nại 3D',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(card.to)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(card.to);
              }
            }}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[18px] border ${card.theme.borderColor} ${card.theme.cardBg} ${card.theme.hoverBorder} p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent select-none`}
            aria-label={`${card.title}: ${card.count}`}
          >
            {/* 3D Claymorphic Badge Artwork matching reference image 100% */}
            <img
              src={card.illustrationUrl}
              alt={card.alt}
              className="absolute right-1 top-2.5 w-[114px] h-[98px] pointer-events-none select-none object-contain transition-transform duration-300 group-hover:scale-105"
            />

            {/* Top Row: Squircle Icon & Title */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.theme.iconBg} ${card.theme.iconColor} shadow-2xs border border-white/80`}
                >
                  <IconComponent className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <span className="text-[14px] font-bold text-[#1C1917] leading-snug line-clamp-1">
                  {card.title}
                </span>
              </div>

              {/* Number and Trend comparison */}
              <div className="flex items-center gap-3 pt-0.5">
                <div className="font-sans text-[36px] sm:text-[40px] font-bold text-[#1C1917] tracking-tight tabular-nums leading-none">
                  {card.loading ? (
                    <span className="animate-pulse text-muted text-2xl font-mono">...</span>
                  ) : (
                    card.count
                  )}
                </div>

                <div className="flex flex-col justify-center leading-tight">
                  {card.count > 0 ? (
                    <>
                      <span
                        className={`inline-flex items-center text-xs font-bold font-mono ${
                          card.trend.isRed ? 'text-[#DC2626]' : 'text-[#15803D]'
                        }`}
                      >
                        {card.trend.dir === 'up' ? (
                          <TrendingUp className="mr-0.5 h-3.5 w-3.5 stroke-[2.5]" />
                        ) : (
                          <TrendingDown className="mr-0.5 h-3.5 w-3.5 stroke-[2.5]" />
                        )}
                        {card.trend.value}
                      </span>
                      <span className="text-[11px] text-[#78716C] mt-0.5 font-sans">
                        so với hôm qua
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-medium text-[#15803D] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full select-none">
                      Đã xử lý xong
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#57534E] leading-relaxed min-h-[32px] pt-1">
                {card.description}
              </p>
            </div>

            {/* Bottom Action Pill Button */}
            <div className="relative z-10 mt-3 pt-2">
              <div
                className={`flex items-center justify-between rounded-xl border ${card.theme.btnBorder} bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] shadow-2xs transition-colors duration-150 group-hover:border-[#DC2626]/30 group-hover:text-accent`}
              >
                <span>{card.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
