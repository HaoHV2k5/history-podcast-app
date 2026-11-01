import React from 'react';
import { FileCheck, Layers, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import { formatVND } from '@/utils/formatters';
import { MyMilestoneFinancialResponse } from '@/types/contract';

interface CommissionsKpiCardsProps {
  totalCommissions: number;
  pendingCommissions: number;
  activeContracts: number;
  activeMilestonesCount: number;
  financials?: MyMilestoneFinancialResponse | null;
}

export const CommissionsKpiCards: React.FC<CommissionsKpiCardsProps> = ({
  totalCommissions,
  pendingCommissions,
  activeContracts,
  activeMilestonesCount,
  financials,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* Card 1: Đơn nhận được */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-start gap-3.5 sm:gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#FDE9E9] text-[#A31D24] flex items-center justify-center shrink-0">
          <FileCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
              Đơn nhận được
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#EAFCF1] text-[#16A34A] border border-emerald-200/60 shrink-0">
              <TrendingUp className="h-2.5 w-2.5" />
              +100%
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-[#1C1615] leading-none mt-1.5 block truncate">
            {totalCommissions}
          </span>
          <span className="text-xs text-stone-500 mt-1 block truncate">
            {pendingCommissions > 0 ? (
              <span className="text-[#A31D24] font-semibold">{pendingCommissions} đơn đang chờ duyệt</span>
            ) : (
              'Đã phản hồi toàn bộ'
            )}
          </span>
        </div>
      </div>

      {/* Card 2: Hợp đồng đang chạy */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-start gap-3.5 sm:gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#EAFCF1] text-[#16A34A] flex items-center justify-center shrink-0">
          <Layers className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
              Hợp đồng đang chạy
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#EAFCF1] text-[#16A34A] border border-emerald-200/60 shrink-0">
              <TrendingUp className="h-2.5 w-2.5" />
              +100%
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-[#1C1615] leading-none mt-1.5 block truncate">
            {activeContracts}
          </span>
          <span className="text-xs text-stone-500 mt-1 block truncate">
            {activeMilestonesCount} mốc đang thực hiện
          </span>
        </div>
      </div>

      {/* Card 3: Thu nhập thực nhận */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-start gap-3.5 sm:gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#EAFBF0] text-[#16A34A] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
              Thu nhập thực nhận
            </span>
            <span className="text-stone-300 font-mono text-[11px] select-none shrink-0">-</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#1C1615] leading-none mt-1.5 block truncate">
            {formatVND(financials?.totalEarned || 0)}
          </span>
          <span className="text-xs text-stone-500 mt-1 block truncate">
            {financials?.completedMilestonesCount || 0} mốc đã giải ngân (95%)
          </span>
        </div>
      </div>

      {/* Card 4: Đang chờ nhận */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-start gap-3.5 sm:gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#FEF7E6] text-[#D97706] flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
              Đang chờ nhận
            </span>
            <span className="text-stone-300 font-mono text-[11px] select-none shrink-0">-</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#1C1615] leading-none mt-1.5 block truncate">
            {formatVND(financials?.pendingEarnings || 0)}
          </span>
          <span className="text-xs text-stone-500 mt-1 block truncate">
            Đang giữ an toàn trong Escrow
          </span>
        </div>
      </div>
    </div>
  );
};
