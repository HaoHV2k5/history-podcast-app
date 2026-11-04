import React from 'react';
import {
  MoreHorizontal,
  Users,
  Crown,
  Gem,
  Copy,
  Lock,
  ShieldCheck,
  Settings,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import {
  MembershipTierConfig,
  SYSTEM_CORE_PERKS,
  isCoreSystemPerk,
} from '../membershipLogic';
import { formatVND } from '@/utils/formatters';

interface AdminMembershipTierCardsProps {
  tiers: MembershipTierConfig[];
  systemPerks?: string[];
  onEditTier?: (tier: MembershipTierConfig | null) => void;
  onFilterByTier?: (tierTitle: string) => void;
  onOpenCreatePlanModal?: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const AdminMembershipTierCards: React.FC<AdminMembershipTierCardsProps> = ({
  tiers,
  systemPerks = [...SYSTEM_CORE_PERKS],
  onEditTier,
  onFilterByTier,
  containerRef,
}) => {
  return (
    <div ref={containerRef} className="space-y-6 font-sans">
      {/* 1. System-Wide Membership Perks Card (Managed by Admin, Synced to Creator) */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EBE6] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FEE2E2] border border-[#FECACA] px-2.5 py-0.5 text-[11px] font-bold text-[#991B1B]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>QUY CHUẨN ĐẶC QUYỀN TOÀN HỆ THỐNG</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">
                90% Doanh thu Creator • 10% Phí nền tảng
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1612]">
              Danh sách Đặc quyền Hội viên Hệ thống ({systemPerks.length} đặc quyền đang áp dụng)
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Các đặc quyền dưới đây được áp dụng chung cho mọi gói hội viên trên toàn hệ thống và tự động đồng bộ sang giao diện Quản lý Kênh của Creator. Admin không can thiệp sửa giá hoặc thêm gói riêng của từng kênh.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onEditTier?.(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#991B1B]/25 bg-[#FFF8F6] hover:bg-[#FEE2E2]/50 px-4 py-2.5 text-xs font-semibold text-[#991B1B] transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Chỉnh sửa đặc quyền hệ thống</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {systemPerks.map((perk, idx) => {
            const isCore = isCoreSystemPerk(perk);
            return (
              <div
                key={idx}
                className={`flex items-start justify-between gap-2.5 rounded-xl border p-3.5 text-xs ${
                  isCore
                    ? 'border-[#EBE4D8] bg-[#FAF8F5]'
                    : 'border-emerald-200/90 bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${
                      isCore ? 'bg-[#991B1B]' : 'bg-emerald-600'
                    }`}
                  >
                    {isCore ? (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    ) : (
                      <Sparkles className="h-2.5 w-2.5" />
                    )}
                  </div>
                  <span className="font-semibold text-[#1F1612] leading-relaxed break-words">
                    {perk}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                    isCore
                      ? 'bg-white border border-[#E5E0D8] text-stone-600'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isCore ? (
                    <>
                      <Lock className="h-2.5 w-2.5 text-[#991B1B]" />
                      <span>Cố định</span>
                    </>
                  ) : (
                    <span>Mở rộng</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Read-Only Active Channel Membership Plans Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#1F1612]">
              Danh sách Gói Hội viên các Kênh đang mở đăng ký ({tiers.length} kênh)
            </h4>
            <p className="text-xs text-stone-500">
              Chế độ giám sát (Chỉ xem): Mỗi chủ kênh Creator tự thiết lập mức giá gói hội viên cho kênh của mình
            </p>
          </div>
        </div>

        {tiers.length === 0 ? (
          <div className="rounded-2xl border border-[#F0EBE6] bg-white p-10 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF8F6] border border-[#FEE2E2] text-[#991B1B]">
              <Crown className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-serif text-base font-bold text-[#1F1612]">
              Chưa có kênh nào kích hoạt gói hội viên
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Khi các nhà sáng tạo (Creator) bật gói hội viên VIP trên trang Quản lý Kênh của họ, danh sách các gói đang hoạt động sẽ tự động hiển thị tại đây để Admin giám sát.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((tier) => {
              const isPopular = tier.badgeType === 'popular';
              const checkColor = isPopular ? 'text-[#059669]' : 'text-[#DC2626]';
              const displayedPerks = systemPerks.length > 0 ? systemPerks : tier.perks;
              const creatorNet = Math.round((tier.price || 0) * 0.9);
              const platformFee = (tier.price || 0) - creatorNet;

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isPopular
                      ? 'border-amber-200/90 ring-1 ring-amber-300/40'
                      : 'border-[#F0EBE6]'
                  }`}
                >
                  <div>
                    {/* Top Row: Channel Badge & 3-dots Menu */}
                    <div className="flex items-center justify-between gap-2">
                      {tier.badgeType === 'basic' && (
                        <span className="inline-flex items-center rounded-md bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-bold text-[#991B1B] truncate">
                          {tier.channelName ? `Kênh: ${tier.channelName}` : tier.badge}
                        </span>
                      )}
                      {tier.badgeType === 'popular' && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#B45309] truncate">
                          <Crown className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {tier.channelName ? `Kênh: ${tier.channelName}` : tier.badge}
                          </span>
                        </span>
                      )}
                      {tier.badgeType === 'vip' && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FCE7F3] px-2.5 py-1 text-[11px] font-bold text-[#9D174D] truncate">
                          <Gem className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {tier.channelName ? `Kênh: ${tier.channelName}` : tier.badge}
                          </span>
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
                          ? `${tier.subscriberCount.toLocaleString('vi-VN')} hội viên đăng ký`
                          : 'Đang mở đăng ký trên kênh'}
                      </p>
                    </div>

                    {/* Price Banner + Revenue Split */}
                    <div className="mt-4 border-y border-[#F0EBE6] py-3.5 space-y-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-2xl font-bold tracking-tight text-[#1F1612]">
                          {formatVND(tier.price)}
                        </span>
                        <span className="text-xs text-stone-500 font-sans">{tier.priceUnit}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                        <span>Creator (90%): <strong className="text-emerald-700">{formatVND(creatorNet)}</strong></span>
                        <span>Phí sàn (10%): <strong className="text-[#991B1B]">{formatVND(platformFee)}</strong></span>
                      </div>
                    </div>

                    {/* Perks List */}
                    <div className="mt-5 space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Đặc quyền hệ thống áp dụng ({displayedPerks.length}):
                      </p>
                      <ul className="space-y-2">
                        {displayedPerks.map((perk, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                            <span className={`shrink-0 mt-0.5 ${checkColor}`}>✓</span>
                            <span className="leading-relaxed">{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Actions (Read-only inspection) */}
                  <div className="mt-6 pt-4 border-t border-[#F0EBE6] flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500">
                      <Lock className="h-3 w-3 text-stone-400" />
                      Giá do Chủ kênh thiết lập
                    </span>
                    <button
                      type="button"
                      onClick={() => onFilterByTier?.(tier.title)}
                      className="text-xs font-semibold text-[#991B1B] hover:text-[#7F1D1D] transition-colors cursor-pointer"
                    >
                      Xem lịch sử giao dịch &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
