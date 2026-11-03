import React from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, ArrowDownRight, Gift } from 'lucide-react';
import { TransactionsKPIs } from '../transactionsLogic';
import { formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface AdminTransactionsStatCardsProps {
  kpis: TransactionsKPIs;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const AdminTransactionsStatCards: React.FC<AdminTransactionsStatCardsProps> = ({
  kpis,
  containerRef,
}) => {
  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
    >
      {/* Card 1: Tổng số dư hệ thống */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 lg:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        {/* Top: Icon box */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B]">
          <Wallet className="h-5 w-5" />
        </div>

        {/* Middle: Title & Value */}
        <div className="mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500 block">
            Tổng số dư hệ thống
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1612] whitespace-nowrap tabular-nums font-sans">
              {formatVND(kpis.totalSystemBalance)}
            </span>
            {kpis.totalSystemBalanceTrend ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold shrink-0 font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ArrowUpRight className="h-3 w-3" />
                <span>{kpis.totalSystemBalanceTrend}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Bottom: Subtext */}
        <div className="mt-3 pt-1">
          <p className="text-xs text-stone-400 leading-tight">
            {kpis.totalSystemBalanceSubtext}
          </p>
        </div>
      </div>

      {/* Card 2: Tổng nạp tiền */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 lg:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        {/* Top: Icon box */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] border border-[#A7F3D0] text-[#16A34A]">
          <ArrowDownLeft className="h-5 w-5" />
        </div>

        {/* Middle: Title & Value */}
        <div className="mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500 block">
            Tổng nạp tiền
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1612] whitespace-nowrap tabular-nums font-sans">
              {formatVND(kpis.totalDeposits)}
            </span>
            {kpis.totalDepositsTrend ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold shrink-0 font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ArrowUpRight className="h-3 w-3" />
                <span>{kpis.totalDepositsTrend}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Bottom: Subtext & mini bar chart */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-stone-400 leading-tight">
            {kpis.depositCount.toLocaleString('vi-VN')} giao dịch nạp tiền
          </p>
          <div className="flex items-end gap-0.5 h-3.5 shrink-0 opacity-70" aria-hidden="true">
            <div className="w-1 h-1.5 rounded-xs bg-[#16A34A]" />
            <div className="w-1 h-2.5 rounded-xs bg-[#16A34A]" />
            <div className="w-1 h-3.5 rounded-xs bg-[#16A34A]" />
          </div>
        </div>
      </div>

      {/* Card 3: Tổng rút tiền */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 lg:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        {/* Top: Icon box */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFE4E6] border border-[#FECDD3] text-[#E11D48]">
          <ArrowUpRight className="h-5 w-5" />
        </div>

        {/* Middle: Title & Value */}
        <div className="mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500 block">
            Tổng rút tiền
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1612] whitespace-nowrap tabular-nums font-sans">
              {formatVND(kpis.totalWithdrawals)}
            </span>
            {kpis.totalWithdrawalsTrend ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold shrink-0 font-mono border',
                  kpis.totalWithdrawalsTrend.startsWith('-')
                    ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                )}
              >
                {kpis.totalWithdrawalsTrend.startsWith('-') ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                <span>{kpis.totalWithdrawalsTrend}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Bottom: Subtext & mini bar chart */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-stone-400 leading-tight">
            {kpis.withdrawalCount.toLocaleString('vi-VN')} giao dịch rút tiền
          </p>
          <div className="flex items-end gap-0.5 h-3.5 shrink-0 opacity-70" aria-hidden="true">
            <div className="w-1 h-2 rounded-xs bg-[#E11D48]" />
            <div className="w-1 h-3 rounded-xs bg-[#E11D48]" />
            <div className="w-1 h-1.5 rounded-xs bg-[#E11D48]" />
          </div>
        </div>
      </div>

      {/* Card 4: Đã phân phối doanh thu */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 lg:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        {/* Top: Icon box */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706]">
          <Gift className="h-5 w-5" />
        </div>

        {/* Middle: Title & Value */}
        <div className="mt-3.5 space-y-1">
          <span className="text-xs font-medium text-stone-500 block">
            Đã phân phối doanh thu
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1612] whitespace-nowrap tabular-nums font-sans">
              {formatVND(kpis.totalRevenueDistributed)}
            </span>
            {kpis.totalRevenueDistributedTrend ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold shrink-0 font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ArrowUpRight className="h-3 w-3" />
                <span>{kpis.totalRevenueDistributedTrend}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Bottom: Subtext & mini bar chart */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-stone-400 leading-tight">
            {kpis.distributedCount.toLocaleString('vi-VN')} giao dịch phân phối
          </p>
          <div className="flex items-end gap-0.5 h-3.5 shrink-0 opacity-70" aria-hidden="true">
            <div className="w-1 h-1 rounded-xs bg-[#D97706]" />
            <div className="w-1 h-2 rounded-xs bg-[#D97706]" />
            <div className="w-1 h-3.5 rounded-xs bg-[#D97706]" />
          </div>
        </div>
      </div>
    </div>
  );
};
