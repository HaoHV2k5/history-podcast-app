import React from 'react';
import { Users, Clock, CheckCircle2, Ban, TrendingUp, TrendingDown } from 'lucide-react';
import { NarratorKPIs } from '../narratorsLogic';

export interface AdminNarratorsStatCardsProps {
  kpis: NarratorKPIs;
  isLoading?: boolean;
}

export const AdminNarratorsStatCards: React.FC<AdminNarratorsStatCardsProps> = ({
  kpis,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 select-none">
      {/* CARD 1: Tổng thuyết minh viên */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-stone-300">
        <div className="flex items-center gap-3.5">
          {/* Squircle Icon Container */}
          <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E8] text-[#E11D48]">
            <Users className="h-6 w-6 stroke-[1.8]" />
          </div>

          {/* Right Information Content */}
          <div className="flex-1 min-w-0">
            {/* Dòng 1: Tên danh mục */}
            <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
              Tổng thuyết minh viên
            </span>

            {/* Dòng 2: Số lượng lớn + Trend Badge + Mini Bar Chart */}
            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                  {isLoading ? '...' : kpis.totalCount}
                </span>

                {/* Zero Fake Data: Only show trend badge if totalCount > 0 and trend != 0 */}
                {!isLoading && kpis.totalCount > 0 && kpis.totalTrend !== 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold font-sans bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <TrendingUp className="h-3 w-3 stroke-[2.2]" />
                    <span>{kpis.totalTrend > 0 ? `+${kpis.totalTrend}%` : `${kpis.totalTrend}%`}</span>
                  </span>
                )}
              </div>

              {/* Mini Bar Chart Graphic (3 cột bo tròn ở góc phải) */}
              <div className="flex items-end gap-1 shrink-0 pb-0.5" aria-hidden="true">
                <div className="w-1.5 h-2.5 rounded-full bg-[#FECDD3]" />
                <div className="w-1.5 h-4 rounded-full bg-[#FDA4AF]" />
                <div className="w-1.5 h-6 rounded-full bg-[#F43F5E]" />
              </div>
            </div>

            {/* Dòng 3: Dòng mô tả chi tiết ngữ cảnh */}
            <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
              {kpis.totalCount > 0
                ? `+${kpis.newNarratorsCount} thuyết minh viên mới`
                : 'Chưa có hồ sơ ghi nhận'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: Đang thẩm định */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-stone-300">
        <div className="flex items-center gap-3.5">
          {/* Squircle Icon Container */}
          <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706]">
            <Clock className="h-6 w-6 stroke-[1.8]" />
          </div>

          {/* Right Information Content */}
          <div className="flex-1 min-w-0">
            {/* Dòng 1: Tên danh mục */}
            <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
              Đang thẩm định
            </span>

            {/* Dòng 2: Số lượng lớn + Trend Badge + Mini Bar Chart */}
            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                  {isLoading ? '...' : kpis.pendingCount}
                </span>
              </div>

              {/* Mini Bar Chart Graphic */}
              <div className="flex items-end gap-1 shrink-0 pb-0.5" aria-hidden="true">
                <div className="w-1.5 h-2.5 rounded-full bg-[#FDE68A]" />
                <div className="w-1.5 h-4 rounded-full bg-[#FCD34D]" />
                <div className="w-1.5 h-6 rounded-full bg-[#F59E0B]" />
              </div>
            </div>

            {/* Dòng 3: Dòng mô tả chi tiết ngữ cảnh */}
            <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
              {kpis.pendingCount > 0 ? 'Cần xem xét và duyệt' : 'Không có hồ sơ chờ duyệt'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: Đã duyệt */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-stone-300">
        <div className="flex items-center gap-3.5">
          {/* Squircle Icon Container */}
          <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669]">
            <CheckCircle2 className="h-6 w-6 stroke-[1.8]" />
          </div>

          {/* Right Information Content */}
          <div className="flex-1 min-w-0">
            {/* Dòng 1: Tên danh mục */}
            <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
              Đã duyệt
            </span>

            {/* Dòng 2: Số lượng lớn + Trend Badge + Mini Bar Chart */}
            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                  {isLoading ? '...' : kpis.approvedCount}
                </span>

                {/* Zero Fake Data: Only show trend badge if approvedCount > 0 and trend != 0 */}
                {!isLoading && kpis.approvedCount > 0 && kpis.approvedTrend !== 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold font-sans bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <TrendingUp className="h-3 w-3 stroke-[2.2]" />
                    <span>+{kpis.approvedTrend}%</span>
                  </span>
                )}
              </div>

              {/* Mini Bar Chart Graphic */}
              <div className="flex items-end gap-1 shrink-0 pb-0.5" aria-hidden="true">
                <div className="w-1.5 h-2.5 rounded-full bg-[#A7F3D0]" />
                <div className="w-1.5 h-4 rounded-full bg-[#6EE7B7]" />
                <div className="w-1.5 h-6 rounded-full bg-[#10B981]" />
              </div>
            </div>

            {/* Dòng 3: Dòng mô tả chi tiết ngữ cảnh */}
            <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
              {kpis.approvedCount > 0 ? 'Có thể nhận dự án' : 'Chưa có nghệ sĩ nào được duyệt'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: Bị từ chối */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-stone-300">
        <div className="flex items-center gap-3.5">
          {/* Squircle Icon Container */}
          <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E8] text-[#DC2626]">
            <Ban className="h-6 w-6 stroke-[1.8]" />
          </div>

          {/* Right Information Content */}
          <div className="flex-1 min-w-0">
            {/* Dòng 1: Tên danh mục */}
            <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
              Bị từ chối
            </span>

            {/* Dòng 2: Số lượng lớn + Trend Badge + Mini Bar Chart */}
            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                  {isLoading ? '...' : kpis.rejectedCount}
                </span>

                {/* Zero Fake Data: Only show trend badge if rejectedCount > 0 and trend != 0 */}
                {!isLoading && kpis.rejectedCount > 0 && kpis.rejectedTrend !== 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold font-sans bg-rose-50 text-rose-700 border border-rose-200">
                    <TrendingDown className="h-3 w-3 stroke-[2.2]" />
                    <span>{kpis.rejectedTrend}%</span>
                  </span>
                )}
              </div>

              {/* Mini Bar Chart Graphic */}
              <div className="flex items-end gap-1 shrink-0 pb-0.5" aria-hidden="true">
                <div className="w-1.5 h-2.5 rounded-full bg-[#FECDD3]" />
                <div className="w-1.5 h-4 rounded-full bg-[#FDA4AF]" />
                <div className="w-1.5 h-6 rounded-full bg-[#EF4444]" />
              </div>
            </div>

            {/* Dòng 3: Dòng mô tả chi tiết ngữ cảnh */}
            <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
              {kpis.rejectedCount > 0 ? 'Không đáp ứng tiêu chuẩn' : 'Không có hồ sơ bị từ chối'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

