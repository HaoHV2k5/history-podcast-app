import React from 'react';
import { FileCheck, Layers, ShieldCheck, Clock, FileSignature } from 'lucide-react';
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
    <div
      aria-label="Thống kê hợp đồng và ký quỹ"
      className="rounded-2xl border border-[#E7E2D9] bg-[#FAF8F5]/95 p-4 sm:p-5 shadow-2xs"
    >
      {/* Plaque Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E7E2D9]/80">
        <div className="flex items-center gap-2">
          <FileSignature className="h-3.5 w-3.5 text-[#8B2635]" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-[#736B63] uppercase">
            ✦ Sổ Bộ Hợp Đồng &amp; Ký Quỹ Đặt Hàng
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFEAE2] text-[#4A453F] border border-[#E2DDD5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
            Escrow Bảo Chứng Tự Động
          </span>
        </div>
      </div>

      {/* 4 Segmented Ledger Metrics Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x divide-[#E7E2D9]">
        {/* Metric 1: Đơn nhận được */}
        <div className="lg:px-4 first:lg:pl-0 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <FileCheck className={`h-3.5 w-3.5 ${pendingCommissions > 0 ? 'text-[#8B2635]' : 'text-stone-400'}`} />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Đơn nhận được
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#1C1917] tracking-tight">
              {totalCommissions}
            </span>
            <span className="text-[11px] text-[#736B63] font-sans">yêu cầu</span>
          </div>
          <p className="text-[11px] pt-1">
            {pendingCommissions > 0 ? (
              <span className="text-[#8B2635] font-semibold">
                ● {pendingCommissions} đơn cần phản hồi
              </span>
            ) : (
              <span className="text-[#8C827A]">Đã phản hồi toàn bộ</span>
            )}
          </p>
        </div>

        {/* Metric 2: Hợp đồng đang chạy */}
        <div className="lg:px-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Hợp đồng đang chạy
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#1C1917] tracking-tight">
              {activeContracts}
            </span>
            <span className="text-[11px] text-[#736B63] font-sans">hợp đồng</span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            {activeMilestonesCount > 0 ? `${activeMilestonesCount} mốc đang sản xuất` : 'Không có mốc trễ hạn'}
          </p>
        </div>

        {/* Metric 3: Thu nhập thực nhận */}
        <div className="lg:px-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Thu nhập thực nhận
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl sm:text-2xl font-bold tabular-nums text-[#1C1917] tracking-tight truncate">
              {formatVND(financials?.totalEarned || 0)}
            </span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            {financials?.completedMilestonesCount || 0} mốc nghiệm thu thành công
          </p>
        </div>

        {/* Metric 4: Đang chờ nhận (Giữ Escrow) */}
        <div className="lg:px-4 last:lg:pr-0 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Clock className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Ký quỹ chờ nhận
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl sm:text-2xl font-bold tabular-nums text-[#8B2635] tracking-tight truncate">
              {formatVND(financials?.pendingEarnings || 0)}
            </span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            Được bảo chứng tại quỹ Escrow
          </p>
        </div>
      </div>
    </div>
  );
};
