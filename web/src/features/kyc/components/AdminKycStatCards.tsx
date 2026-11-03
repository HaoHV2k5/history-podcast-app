import React from 'react';
import { ShieldCheck, Bell, XCircle, ArrowUp } from 'lucide-react';
import type { KycStatsResult } from '../kycLogic';
import { cn } from '@/utils/cn';

interface AdminKycStatCardsProps {
  stats: KycStatsResult;
  activeStatus?: string;
  onSelectStatus?: (status: string) => void;
  isLoading?: boolean;
}

export const AdminKycStatCards: React.FC<AdminKycStatCardsProps> = ({
  stats,
  activeStatus = '',
  onSelectStatus,
  isLoading,
}) => {
  const cards = [
    {
      id: '',
      title: 'Tổng hồ sơ',
      value: stats.total,
      trend: stats.totalTrend || '+12%',
      trendBg: 'bg-[#DCFCE7] text-[#15803D]',
      trendIsUp: true,
      subtitle: 'Tất cả hồ sơ KYC',
      icon: ShieldCheck,
      cardBg: 'bg-[#FFF8F8] border-[#FEE2E2] hover:border-[#FCA5A5]',
      iconContainer: 'bg-[#FDECEC] text-[#DC2626]',
    },
    {
      id: 'PENDING',
      title: 'Chờ duyệt',
      value: stats.pending,
      trend: stats.pendingTrend || '+2',
      trendBg: 'bg-[#FEE2E2] text-[#DC2626]',
      trendIsUp: true,
      subtitle: 'Cần xem xét và phê duyệt',
      icon: Bell,
      cardBg: 'bg-[#FFFCF7] border-[#FEF3C7] hover:border-[#FCD34D]',
      iconContainer: 'bg-[#FEF6EC] text-[#D97706]',
    },
    {
      id: 'APPROVED',
      title: 'Đã phê duyệt',
      value: stats.approved,
      trend: stats.approvedTrend || '+5',
      trendBg: 'bg-[#DCFCE7] text-[#15803D]',
      trendIsUp: true,
      subtitle: 'Đã xác thực danh tính',
      icon: ShieldCheck,
      cardBg: 'bg-[#F8FCF9] border-[#DCFCE7] hover:border-[#86EFAC]',
      iconContainer: 'bg-[#EAF7EE] text-[#059669]',
    },
    {
      id: 'REJECTED',
      title: 'Bị từ chối',
      value: stats.rejected,
      trend: stats.rejectedTrend || '+1',
      trendBg: 'bg-[#FEE2E2] text-[#DC2626]',
      trendIsUp: true,
      subtitle: 'Không đạt yêu cầu',
      icon: XCircle,
      cardBg: 'bg-[#F8FAFC] border-[#E0EBF7] hover:border-[#BAE6FD]',
      iconContainer: 'bg-[#E8F1FC] text-[#0284C7]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {cards.map((card) => {
        const isSelected = activeStatus === card.id;
        const IconComponent = card.icon;

        return (
          <div
            key={card.title}
            role="button"
            tabIndex={0}
            onClick={() => onSelectStatus?.(card.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectStatus?.(card.id);
              }
            }}
            className={cn(
              'group relative flex items-center gap-4 sm:gap-4.5 rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99]',
              card.cardBg,
              isSelected ? 'ring-2 ring-[#991B1B]/30 shadow-xs' : ''
            )}
          >
            {/* Left: Rounded squircle icon container matching mockup */}
            <div
              className={cn(
                'flex h-14 w-14 sm:h-15 sm:w-15 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 shadow-2xs',
                card.iconContainer
              )}
            >
              <IconComponent className="h-7 w-7 stroke-[2]" />
            </div>

            {/* Right: Vertical 3-line info stack matching mockup */}
            <div className="flex flex-col min-w-0 justify-center space-y-0.5">
              {/* Line 1: Title */}
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#374151] leading-tight">
                {card.title}
              </span>

              {/* Line 2: Big Bold Number + Trend Pill */}
              <div className="flex items-center gap-2 sm:gap-2.5 py-0.5">
                <span className="font-bold text-[26px] sm:text-[28px] text-[#111827] leading-none tracking-tight">
                  {isLoading ? '...' : card.value}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none shadow-2xs',
                    card.trendBg
                  )}
                >
                  <ArrowUp className="h-2.5 w-2.5 stroke-[2.5]" />
                  <span>{card.trend}</span>
                </span>
              </div>

              {/* Line 3: Subtitle */}
              <span className="text-xs text-[#6B7280] leading-tight truncate">
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
