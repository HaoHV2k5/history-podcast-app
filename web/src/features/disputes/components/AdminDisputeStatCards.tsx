import React from 'react';
import { MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { DisputeKpis } from '../disputesLogic';

interface AdminDisputeStatCardsProps {
  kpis: DisputeKpis;
  isLoading?: boolean;
}

export const AdminDisputeStatCards: React.FC<AdminDisputeStatCardsProps> = ({
  kpis,
  isLoading = false,
}) => {
  const hasRealData = kpis.totalCount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {/* 1. Tổng khiếu nại */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        {/* Left Squircle Icon */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <MessageSquare className="h-6 w-6 stroke-[1.8]" />
        </div>
        {/* Right Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Tổng khiếu nại
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.totalCount}
              </span>
              {hasRealData && kpis.trendTotal !== 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                  ↑ {Math.abs(kpis.trendTotal)}%
                </span>
              )}
            </div>
            {/* Mini 3-bar chart */}
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#FDA4AF]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FB7185]" />
              <span className="w-1.5 h-6 rounded-full bg-[#E11D48]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasRealData ? '+6 khiếu nại so với 7 ngày trước' : 'Chưa có khiếu nại nào'}
          </span>
        </div>
      </div>

      {/* 2. Đang thụ lý */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        {/* Left Squircle Icon */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706]">
          <Clock className="h-6 w-6 stroke-[1.8]" />
        </div>
        {/* Right Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Đang thụ lý
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.openCount}
              </span>
              {hasRealData && kpis.trendOpen !== 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48]">
                  ↓ {Math.abs(kpis.trendOpen)}%
                </span>
              )}
            </div>
            {/* Mini 3-bar chart */}
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-4 rounded-full bg-[#FDE68A]" />
              <span className="w-1.5 h-6 rounded-full bg-[#FBBF24]" />
              <span className="w-1.5 h-2.5 rounded-full bg-[#D97706]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasRealData ? 'Cần xử lý trong thời gian sớm' : 'Không có vụ việc tồn đọng'}
          </span>
        </div>
      </div>

      {/* 3. Đã giải quyết */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        {/* Left Squircle Icon */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669]">
          <CheckCircle2 className="h-6 w-6 stroke-[1.8]" />
        </div>
        {/* Right Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Đã giải quyết
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.resolvedCount}
              </span>
              {hasRealData && kpis.trendResolved !== 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                  ↑ {Math.abs(kpis.trendResolved)}%
                </span>
              )}
            </div>
            {/* Mini 3-bar chart */}
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#A7F3D0]" />
              <span className="w-1.5 h-4 rounded-full bg-[#34D399]" />
              <span className="w-1.5 h-6 rounded-full bg-[#059669]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasRealData ? 'Đã xử lý thành công' : 'Chưa có phân xử hoàn tất'}
          </span>
        </div>
      </div>

      {/* 4. Đã hủy */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        {/* Left Squircle Icon */}
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#DC2626]">
          <XCircle className="h-6 w-6 stroke-[1.8]" />
        </div>
        {/* Right Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Đã hủy
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.cancelledCount}
              </span>
              {hasRealData && kpis.trendCancelled !== 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48]">
                  ↓ {Math.abs(kpis.trendCancelled)}%
                </span>
              )}
            </div>
            {/* Mini 3-bar chart */}
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-6 rounded-full bg-[#FECDD3]" />
              <span className="w-1.5 h-4 rounded-full bg-[#F87171]" />
              <span className="w-1.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {hasRealData ? 'Không đủ căn cứ' : 'Không có khiếu nại bị hủy'}
          </span>
        </div>
      </div>
    </div>
  );
};

