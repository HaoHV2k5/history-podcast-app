import React from 'react';
import { ClipboardList, Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { WithdrawalKPIs } from '../withdrawalsLogic';

interface AdminWithdrawalsStatCardsProps {
  kpis: WithdrawalKPIs;
  isLoading?: boolean;
}

export const AdminWithdrawalsStatCards: React.FC<AdminWithdrawalsStatCardsProps> = ({
  kpis,
  isLoading = false,
}) => {
  // Live trend values: strictly computed from real data (Zero Fake Data)
  const isTotalPositive = kpis.trendPercentageTotal >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none font-sans">
      {/* 1. Tổng yêu cầu */}
      <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm">
        {/* Left: Squircle Icon with pastel background */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl border border-[#FFE4E8] bg-[#FFF0F2] text-[#E11D48]">
          <ClipboardList className="h-6 w-6" />
        </div>

        {/* Right: 3-line Content */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block">
            Tổng yêu cầu
          </span>

          {/* Line 2: Big Number + Trend Badge + 3 Mini Bars on Right */}
          <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900 tabular-nums">
                {isLoading ? '...' : kpis.totalCount.toLocaleString('vi-VN')}
              </span>
              {kpis.totalCount > 0 && kpis.trendPercentageTotal !== 0 && (
                <span
                  className={`inline-flex items-center text-xs font-semibold gap-0.5 ${
                    isTotalPositive ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {isTotalPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  <span>{Math.abs(kpis.trendPercentageTotal)}%</span>
                </span>
              )}
            </div>

            {/* 3 mini bars on right */}
            <div className="flex items-end gap-1 shrink-0 pb-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-rose-200 h-2.5" />
              <div className="w-1.5 rounded-full bg-rose-300 h-4" />
              <div className="w-1.5 rounded-full bg-rose-400 h-6" />
            </div>
          </div>

          {/* Line 3: Description */}
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block mt-0.5 truncate">
            {kpis.trendDiffTotal !== 0
              ? `${kpis.trendDiffTotal > 0 ? '+' : ''}${kpis.trendDiffTotal} yêu cầu so với 7 ngày trước`
              : 'Toàn bộ đơn rút tiền hệ thống'}
          </span>
        </div>
      </div>

      {/* 2. Chờ xét duyệt */}
      <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm">
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]">
          <Clock className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block">
            Chờ xét duyệt
          </span>

          <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900 tabular-nums">
                {isLoading ? '...' : kpis.pendingCount.toLocaleString('vi-VN')}
              </span>
              {kpis.pendingCount > 0 && kpis.trendPercentagePending !== 0 && (
                <span className="inline-flex items-center text-xs font-semibold text-rose-500 gap-0.5">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span>{Math.abs(kpis.trendPercentagePending)}%</span>
                </span>
              )}
            </div>

            <div className="flex items-end gap-1 shrink-0 pb-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-amber-200 h-2.5" />
              <div className="w-1.5 rounded-full bg-amber-300 h-5" />
              <div className="w-1.5 rounded-full bg-amber-400 h-4" />
            </div>
          </div>

          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block mt-0.5 truncate">
            Cần xử lý trong thời gian sớm nhất
          </span>
        </div>
      </div>

      {/* 3. Đã hoàn tất */}
      <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm">
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl border border-[#D1FAE5] bg-[#ECFDF5] text-[#059669]">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block">
            Đã hoàn tất
          </span>

          <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900 tabular-nums">
                {isLoading ? '...' : kpis.completedCount.toLocaleString('vi-VN')}
              </span>
              {kpis.completedCount > 0 && kpis.trendPercentageCompleted !== 0 && (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{Math.abs(kpis.trendPercentageCompleted)}%</span>
                </span>
              )}
            </div>

            <div className="flex items-end gap-1 shrink-0 pb-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-emerald-200 h-2" />
              <div className="w-1.5 rounded-full bg-emerald-300 h-3.5" />
              <div className="w-1.5 rounded-full bg-emerald-400 h-6" />
            </div>
          </div>

          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block mt-0.5 truncate">
            Đã chuyển tiền thành công
          </span>
        </div>
      </div>

      {/* 4. Đã từ chối */}
      <div className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm">
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl border border-[#FFE4E8] bg-[#FFF0F2] text-[#E11D48]">
          <XCircle className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block">
            Đã từ chối
          </span>

          <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900 tabular-nums">
                {isLoading ? '...' : kpis.rejectedCount.toLocaleString('vi-VN')}
              </span>
              {kpis.rejectedCount > 0 && kpis.trendPercentageRejected !== 0 && (
                <span className="inline-flex items-center text-xs font-semibold text-rose-500 gap-0.5">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span>{Math.abs(kpis.trendPercentageRejected)}%</span>
                </span>
              )}
            </div>

            <div className="flex items-end gap-1 shrink-0 pb-1" aria-hidden="true">
              <div className="w-1.5 rounded-full bg-rose-200 h-4" />
              <div className="w-1.5 rounded-full bg-rose-300 h-2.5" />
              <div className="w-1.5 rounded-full bg-rose-400 h-3.5" />
            </div>
          </div>

          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block mt-0.5 truncate">
            Không đáp ứng điều kiện rút tiền
          </span>
        </div>
      </div>
    </div>
  );
};
