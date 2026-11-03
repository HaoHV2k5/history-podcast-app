import React from 'react';
import { MoreHorizontal, Users, Crown, Gem, Edit3, Copy, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { MembershipTierConfig } from '../membershipLogic';
import { formatVND } from '@/utils/formatters';

interface AdminMembershipTierCardsProps {
  tiers: MembershipTierConfig[];
  onEditTier?: (tier: MembershipTierConfig | null) => void;
  onFilterByTier?: (tierTitle: string) => void;
  onOpenCreatePlanModal?: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const AdminMembershipTierCards: React.FC<AdminMembershipTierCardsProps> = ({
  tiers,
  onEditTier,
  onFilterByTier,
  onOpenCreatePlanModal,
  containerRef,
}) => {
  // Graceful Empty State when backend has 0 tiers configured (Zero Fake Data)
  if (tiers.length === 0) {
    return (
      <div
        ref={containerRef}
        className="rounded-2xl border border-[#F0EBE6] bg-white p-10 sm:p-14 text-center shadow-xs"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8F6] border border-[#FEE2E2] text-[#991B1B]">
          <Crown className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-serif text-base sm:text-lg font-bold text-[#1F1612]">
          Chưa có gói hội viên nào trong hệ thống
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          Hiện tại các kênh sáng tạo trên nền tảng Sử Ký chưa kích hoạt tính năng gói hội viên hoặc ban quản trị chưa thiết lập gói dùng chung. Khi gói hội viên được cấu hình, danh sách sẽ hiển thị tự động tại đây.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onOpenCreatePlanModal) {
                onOpenCreatePlanModal();
              } else if (onEditTier) {
                onEditTier(null);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#991B1B] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#7F1D1D] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm gói hội viên mới</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {tiers.map((tier) => {
        const isPopular = tier.badgeType === 'popular';

        // Checkmark icon color according to mockup
        const checkColor = isPopular ? 'text-[#059669]' : 'text-[#DC2626]';

        return (
          <div
            key={tier.id}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
              isPopular
                ? 'border-amber-200/90 ring-1 ring-amber-300/40'
                : 'border-[#F0EBE6]'
            }`}
          >
            <div>
              {/* Top Row: Badge Tag & 3-dots Menu */}
              <div className="flex items-center justify-between">
                {tier.badgeType === 'basic' && (
                  <span className="inline-flex items-center rounded-md bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-bold text-[#991B1B]">
                    {tier.badge}
                  </span>
                )}
                {tier.badgeType === 'popular' && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#B45309]">
                    <Crown className="h-3 w-3" />
                    <span>{tier.badge}</span>
                  </span>
                )}
                {tier.badgeType === 'vip' && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FCE7F3] px-2.5 py-1 text-[11px] font-bold text-[#9D174D]">
                    <Gem className="h-3 w-3" />
                    <span>{tier.badge}</span>
                  </span>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]"
                      aria-label={`Thao tác cho ${tier.title}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => onEditTier?.(tier)}
                      className="cursor-pointer text-xs"
                    >
                      <Edit3 className="mr-2 h-3.5 w-3.5 text-stone-500" />
                      <span>Cấu hình gói này</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onFilterByTier?.(tier.title)}
                      className="cursor-pointer text-xs"
                    >
                      <Users className="mr-2 h-3.5 w-3.5 text-stone-500" />
                      <span>Lọc giao dịch của gói</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `${tier.title} - ${formatVND(tier.price)}${tier.priceUnit}`
                        );
                      }}
                      className="cursor-pointer text-xs"
                    >
                      <Copy className="mr-2 h-3.5 w-3.5 text-stone-500" />
                      <span>Sao chép thông tin</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title & Subscriber Count */}
              <div className="mt-4">
                <h3 className="font-serif text-lg font-bold text-[#1F1612]">
                  {tier.title}
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  {tier.subscriberCount > 0
                    ? `${tier.subscriberCount.toLocaleString('vi-VN')} người đăng ký`
                    : 'Chưa có người đăng ký'}
                </p>
              </div>

              {/* Price Banner */}
              <div className="mt-4 flex items-baseline gap-1 border-y border-[#F0EBE6] py-3.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1F1612]">
                  {formatVND(tier.price)}
                </span>
                <span className="text-xs text-stone-500 font-sans">{tier.priceUnit}</span>
              </div>

              {/* Perks List */}
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Đặc quyền bao gồm:
                </p>
                <ul className="space-y-2">
                  {tier.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                      <span className={`shrink-0 mt-0.5 ${checkColor}`}>✓</span>
                      <span className="leading-relaxed">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-[#F0EBE6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onEditTier?.(tier)}
                className="text-xs font-semibold text-[#991B1B] hover:text-[#7F1D1D] transition-colors"
              >
                Chỉnh sửa quyền lợi →
              </button>
              <button
                type="button"
                onClick={() => onFilterByTier?.(tier.title)}
                className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                Xem báo cáo
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
