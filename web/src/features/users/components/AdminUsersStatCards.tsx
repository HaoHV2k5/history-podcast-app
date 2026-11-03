import React from 'react';
import { FileText, UserPlus, Lock, Heart, Sparkles, Shield } from 'lucide-react';
import type { UserStatsResult } from '../usersLogic';
import { cn } from '@/utils/cn';

interface AdminUsersStatCardsProps {
  stats: UserStatsResult;
  activeStatusFilter?: string;
  onFilterSelect?: (status: string) => void;
  isLoading?: boolean;
}

export const AdminUsersStatCards: React.FC<AdminUsersStatCardsProps> = ({
  stats,
  activeStatusFilter = '',
  onFilterSelect,
  isLoading,
}) => {
  const cards = [
    {
      id: '',
      title: 'Tổng người dùng',
      value: stats.total,
      trend: stats.totalTrend,
      trendColor: 'text-[#16A34A]',
      subtitle: stats.totalSubtitle,
      icon: FileText,
      watermark: Heart,
      cardBg: 'bg-[#FFF9F9] border-[#FEE2E2] hover:border-[#FCA5A5]',
      iconContainer: 'bg-[#FEE2E2] text-[#DC2626]',
      watermarkColor: 'text-rose-200',
    },
    {
      id: 'NEW',
      title: 'Người dùng mới',
      value: stats.newCount,
      trend: stats.newTrend,
      trendColor: 'text-[#16A34A]',
      subtitle: stats.newSubtitle,
      icon: UserPlus,
      watermark: Sparkles,
      cardBg: 'bg-[#FFFDF7] border-[#FEF3C7] hover:border-[#FCD34D]',
      iconContainer: 'bg-[#FEF7EC] text-[#D97706]',
      watermarkColor: 'text-amber-200',
    },
    {
      id: 'ACTIVE',
      title: 'Người dùng hoạt động',
      value: stats.activeCount,
      trend: stats.activeTrend,
      trendColor: 'text-[#16A34A]',
      subtitle: stats.activeSubtitle,
      // Audio waveform equalizer icon matching mockup exactly
      iconType: 'audio',
      watermark: Sparkles,
      cardBg: 'bg-[#F8FCF9] border-[#DCFCE7] hover:border-[#86EFAC]',
      iconContainer: 'bg-[#DCFCE7] text-[#059669]',
      watermarkColor: 'text-emerald-200',
    },
    {
      id: 'LOCKED',
      title: 'Người dùng bị khóa',
      value: stats.lockedCount,
      trend: stats.lockedTrend,
      trendColor: 'text-[#DC2626]',
      subtitle: stats.lockedSubtitle,
      icon: Lock,
      watermark: Shield,
      cardBg: 'bg-[#FFF9F9] border-[#FEE2E2] hover:border-[#FCA5A5]',
      iconContainer: 'bg-[#FEE2E2] text-[#DC2626]',
      watermarkColor: 'text-rose-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {cards.map((card) => {
        // Only show ring if user explicitly activated a specific filter (not default empty)
        const isSelected = activeStatusFilter !== '' && activeStatusFilter === card.id;
        const IconComponent = card.icon;
        const WatermarkComponent = card.watermark;

        return (
          <div
            key={card.title}
            role="button"
            tabIndex={0}
            onClick={() => onFilterSelect?.(card.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFilterSelect?.(card.id);
              }
            }}
            className={cn(
              'group relative flex items-start gap-3.5 sm:gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99]',
              card.cardBg,
              isSelected ? 'ring-2 ring-[#991B1B]/40 border-[#991B1B]' : ''
            )}
          >
            {/* Top-right subtle decorative watermark matching mockup */}
            <div className={cn('absolute right-3.5 top-3.5 pointer-events-none opacity-40', card.watermarkColor)}>
              {WatermarkComponent && <WatermarkComponent className="h-6 w-6" />}
            </div>

            {/* Left: Rounded squircle icon container matching mockup */}
            <div
              className={cn(
                'flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 shadow-2xs',
                card.iconContainer
              )}
            >
              {card.iconType === 'audio' ? (
                /* 3-bar audio wave icon matching mockup exactly */
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <line x1="6" y1="10" x2="6" y2="14" />
                  <line x1="12" y1="6" x2="12" y2="18" />
                  <line x1="18" y1="10" x2="18" y2="14" />
                </svg>
              ) : (
                IconComponent && <IconComponent className="h-6 w-6" />
              )}
            </div>

            {/* Right: Content details (Title, Number + Trend, Subtitle without divider) */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs sm:text-[13px] font-semibold text-stone-700 leading-tight">
                {card.title}
              </span>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-[28px] font-serif font-bold text-[#111827] leading-none">
                  {isLoading ? '...' : card.value.toLocaleString('vi-VN')}
                </span>

                <span
                  className={cn(
                    'text-xs font-semibold flex items-center gap-0.5',
                    card.trendColor
                  )}
                >
                  {card.trend}
                </span>
              </div>

              <span className="text-[11px] text-stone-500 mt-1 truncate block leading-snug">
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
