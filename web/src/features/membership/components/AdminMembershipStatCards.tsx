import React from 'react';
import { Users, Gem, Wallet, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MembershipKPIs } from '../membershipLogic';
import { formatVND } from '@/utils/formatters';

interface AdminMembershipStatCardsProps {
  kpis: MembershipKPIs;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const AdminMembershipStatCards: React.FC<AdminMembershipStatCardsProps> = ({
  kpis,
  containerRef,
}) => {
  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
    >
      {/* Card 1: Tổng hội viên */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCE7F3] border border-[#FBCFE8] text-[#DB2777]">
            <Users className="h-5 w-5" />
          </div>
          {kpis.totalMembersTrend ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              <ArrowUpRight className="h-3 w-3" />
              <span>{kpis.totalMembersTrend}</span>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500">Tổng hội viên</span>
          <div className="text-2xl font-bold tracking-tight text-[#1F1612]">
            {kpis.totalMembers.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-stone-400">{kpis.totalMembersDiffText}</p>
        </div>
      </div>

      {/* Card 2: Doanh thu tháng này */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706]">
            <Gem className="h-5 w-5" />
          </div>
          {kpis.revenueTrend ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              <ArrowUpRight className="h-3 w-3" />
              <span>{kpis.revenueTrend}</span>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500">Doanh thu tháng này</span>
          <div className="text-2xl font-bold tracking-tight text-[#1F1612] truncate">
            {formatVND(kpis.monthlyRevenue)}
          </div>
          <p className="text-[11px] text-stone-400">{kpis.revenueSubtext}</p>
        </div>
      </div>

      {/* Card 3: Đã thanh toán */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D1FAE5] border border-[#A7F3D0] text-[#059669]">
            <Wallet className="h-5 w-5" />
          </div>
          {kpis.paidTrend ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              <ArrowUpRight className="h-3 w-3" />
              <span>{kpis.paidTrend}</span>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500">Đã thanh toán</span>
          <div className="text-2xl font-bold tracking-tight text-[#1F1612]">
            {kpis.paidCount.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-stone-400">{kpis.paidSubtext}</p>
        </div>
      </div>

      {/* Card 4: Chờ xử lý */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFEDD5] border border-[#FED7AA] text-[#EA580C]">
            <Clock className="h-5 w-5" />
          </div>
          {kpis.pendingTrend ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
              <ArrowDownRight className="h-3 w-3" />
              <span>{kpis.pendingTrend}</span>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500">Chờ xử lý</span>
          <div className="text-2xl font-bold tracking-tight text-[#1F1612]">
            {kpis.pendingCount.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-stone-400">{kpis.pendingSubtext}</p>
        </div>
      </div>
    </div>
  );
};
