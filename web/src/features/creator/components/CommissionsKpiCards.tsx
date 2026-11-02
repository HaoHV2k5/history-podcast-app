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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* Card 1: Đơn nhận được */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FDE9E9] text-[#A31D24] flex items-center justify-center shrink-0">
          <FileCheck className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
              Đơn nhận được
            </span>
            <span className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-[#EAFCF1] text-[#16A34A] border border-emerald-200/60 shrink-0">
              <TrendingUp className="h-2.5 w-2.5" />
              +100%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-[#1C1615] leading-none truncate">
              {totalCommissions}
            </span>
            <span className="text-[11px] text-stone-500 truncate">
              {pendingCommissions > 0 ? (
                <span className="text-[#A31D24] font-semibold">
                  • {pendingCommissions} chờ duyệt
                </span>
              ) : (
                '• Đã phản hồi hết'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Hợp đồng đang chạy */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EAFCF1] text-[#16A34A] flex items-center justify-center shrink-0">
          <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
              Hợp đồng đang chạy
            </span>
            <span className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-[#EAFCF1] text-[#16A34A] border border-emerald-200/60 shrink-0">
              <TrendingUp className="h-2.5 w-2.5" />
              +100%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-[#1C1615] leading-none truncate">
              {activeContracts}
            </span>
            <span className="text-[11px] text-stone-500 truncate">
              • {activeMilestonesCount} mốc đang làm
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Thu nhập thực nhận */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EAFBF0] text-[#16A34A] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider block truncate">
            Thu nhập thực nhận
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base sm:text-lg font-bold font-mono text-[#1C1615] leading-none truncate">
              {formatVND(financials?.totalEarned || 0)}
            </span>
            <span className="text-[10px] text-stone-400 truncate hidden sm:inline">
              ({financials?.completedMilestonesCount || 0} mốc 95%)
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Đang chờ nhận */}
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC5] transition-all duration-200 flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FEF7E6] text-[#D97706] flex items-center justify-center shrink-0">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider block truncate">
            Đang chờ nhận
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base sm:text-lg font-bold font-mono text-[#1C1615] leading-none truncate">
              {formatVND(financials?.pendingEarnings || 0)}
            </span>
            <span className="text-[10px] text-stone-400 truncate hidden sm:inline">
              (Giữ Escrow)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
