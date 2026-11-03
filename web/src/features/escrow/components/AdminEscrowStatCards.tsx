import React from 'react';
import { Wallet, Coins, CheckCircle2, Clock } from 'lucide-react';
import { EscrowKpiMetrics, formatCurrencyVND } from '../escrowLogic';

interface AdminEscrowStatCardsProps {
  kpis: EscrowKpiMetrics;
}

export const AdminEscrowStatCards: React.FC<AdminEscrowStatCardsProps> = ({ kpis }) => {
  const hasData = kpis.totalCount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {/* CARD 1: Tổng giao dịch ký quỹ */}
      <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#F0EBE6] shadow-xs hover:border-stone-300 transition-colors">
        {/* Left Squircle Icon Box */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* Right Info (3 lines) */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Tổng giao dịch ký quỹ
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {kpis.totalCount.toLocaleString('vi-VN')}
              </span>
              {hasData && kpis.countTrend !== null && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                  ↑ {Math.abs(kpis.countTrend)}%
                </span>
              )}
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 shrink-0 h-6 pl-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-rose-200/90 h-3" />
              <div className="w-1.5 rounded-full bg-rose-200/90 h-5" />
              <div className="w-1.5 rounded-full bg-rose-200/90 h-3.5" />
              <div className="w-1.5 rounded-full bg-rose-300 h-6" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasData ? `${kpis.totalCount} giao dịch trong hệ thống` : 'Chưa có giao dịch ký quỹ'}
          </span>
        </div>
      </div>

      {/* CARD 2: Tổng giá trị ký quỹ */}
      <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#F0EBE6] shadow-xs hover:border-stone-300 transition-colors">
        {/* Left Squircle Icon Box */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] text-[#CA8A04]">
          <Coins className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* Right Info (3 lines) */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Tổng giá trị ký quỹ
          </span>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-xl sm:text-[22px] lg:text-[24px] font-bold font-sans tabular-nums text-stone-900 leading-none truncate">
                {formatCurrencyVND(kpis.totalVolume)}
              </span>
              {hasData && kpis.volumeTrend !== null && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 shrink-0">
                  ↑ {Math.abs(kpis.volumeTrend)}%
                </span>
              )}
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 shrink-0 h-6 pl-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-amber-200/90 h-2.5" />
              <div className="w-1.5 rounded-full bg-amber-200/90 h-4" />
              <div className="w-1.5 rounded-full bg-amber-200/90 h-3" />
              <div className="w-1.5 rounded-full bg-amber-300 h-6" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasData ? 'Giá trị đang được giữ an toàn' : 'Chưa phát sinh dòng tiền ký quỹ'}
          </span>
        </div>
      </div>

      {/* CARD 3: Đã giải ngân */}
      <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#F0EBE6] shadow-xs hover:border-stone-300 transition-colors">
        {/* Left Squircle Icon Box */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]">
          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* Right Info (3 lines) */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Đã giải ngân
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {kpis.releasedCount.toLocaleString('vi-VN')}
              </span>
              {hasData && kpis.releasedTrend !== null && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                  ↑ {Math.abs(kpis.releasedTrend)}%
                </span>
              )}
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 shrink-0 h-6 pl-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-emerald-200/90 h-3" />
              <div className="w-1.5 rounded-full bg-emerald-200/90 h-4" />
              <div className="w-1.5 rounded-full bg-emerald-200/90 h-5" />
              <div className="w-1.5 rounded-full bg-emerald-300 h-6" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasData ? (kpis.releasedCount > 0 ? `${kpis.releasedCount} giai đoạn đã giải ngân` : 'Chưa phát sinh giải ngân') : 'Chưa có giai đoạn giải ngân'}
          </span>
        </div>
      </div>

      {/* CARD 4: Đang giữ ký quỹ */}
      <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#F0EBE6] shadow-xs hover:border-stone-300 transition-colors">
        {/* Left Squircle Icon Box */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48]">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* Right Info (3 lines) */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Đang giữ ký quỹ
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {kpis.heldCount.toLocaleString('vi-VN')}
              </span>
              {hasData && kpis.heldTrend !== null && (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                  ↓ {Math.abs(kpis.heldTrend)}%
                </span>
              )}
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 shrink-0 h-6 pl-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-rose-200/90 h-4" />
              <div className="w-1.5 rounded-full bg-rose-200/90 h-3" />
              <div className="w-1.5 rounded-full bg-rose-200/90 h-5" />
              <div className="w-1.5 rounded-full bg-rose-300 h-2.5" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasData ? (kpis.heldCount > 0 ? `${kpis.heldCount} giai đoạn đang giữ an toàn` : 'Không có tiền giữ') : 'Không có tiền phong tỏa'}
          </span>
        </div>
      </div>
    </div>
  );
};

