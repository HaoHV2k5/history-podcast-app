import React from 'react';
import { Search, ChevronDown, Calendar, RotateCw, X, Sliders } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AdminModerationSearchToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  tier: string;
  onTierChange: (val: string) => void;
  decision: string;
  onDecisionChange: (val: string) => void;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  showAdvanced?: boolean;
  onResetFilters: () => void;
}

export const AdminModerationSearchToolbar: React.FC<AdminModerationSearchToolbarProps> = ({
  search,
  onSearchChange,
  tier,
  onTierChange,
  decision,
  onDecisionChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isRefreshing = false,
  showAdvanced = false,
  onResetFilters,
}) => {
  return (
    <div className="space-y-3">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề video, tên kênh, tác giả..."
            className="h-11 w-full rounded-xl border border-[#E0DDD7] bg-white pl-10 pr-9 text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
              title="Xóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdowns & Refresh Container */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Dropdown 1: Phân tầng AI (min-w-[205px] ensures 'Tất cả phân tầng AI' is never clipped) */}
          <div className="relative flex-1 sm:w-60 min-w-[205px]">
            <select
              value={tier}
              onChange={(e) => onTierChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-[#E0DDD7] bg-white pl-3.5 pr-8 text-xs sm:text-[13px] font-medium text-[#1C1917] focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] cursor-pointer whitespace-nowrap"
            >
              <option value="">Tất cả phân tầng AI</option>
              <option value="EXCELLENT">Xuất sắc (≥ 85%)</option>
              <option value="GOOD">Tốt (70% - 85%)</option>
              <option value="FAIR">Khá / Cần xem xét (45% - 70%)</option>
              <option value="RED_ALERT">Báo động đỏ (&lt; 45%)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
          </div>

          {/* Dropdown 2: Trạng thái duyệt */}
          <div className="relative flex-1 sm:w-44 min-w-[155px]">
            <select
              value={decision}
              onChange={(e) => onDecisionChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-[#E0DDD7] bg-white pl-3.5 pr-8 text-xs sm:text-[13px] font-medium text-[#1C1917] focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] cursor-pointer whitespace-nowrap"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
          </div>

          {/* Dropdown 3: Thời gian */}
          <div className="relative flex-1 sm:w-44 min-w-[155px]">
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-[#E0DDD7] bg-white pl-9 pr-8 text-xs sm:text-[13px] font-medium text-[#1C1917] focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] cursor-pointer whitespace-nowrap"
            >
              <option value="all">Mọi thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
            </select>
            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
          </div>

          {/* Action Button: Làm mới */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#E0DDD7] bg-white px-4 text-xs sm:text-sm font-semibold text-[#1C1917] shadow-2xs hover:bg-[#F5F2EB] hover:border-[#D6D0C4] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <RotateCw
              className={cn('h-3.5 w-3.5 text-[#57534E]', isRefreshing && 'animate-spin text-[#991B1B]')}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Collapsible Drawer */}
      {showAdvanced && (
        <div className="rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
              <Sliders className="h-4 w-4 text-[#991B1B]" />
              <span>Tiêu chí lọc mở rộng</span>
            </div>

            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-[#991B1B] hover:underline cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block font-medium text-[#57534E] mb-1">Mức độ cảnh báo AI</span>
              <p className="text-[11px] text-[#78716C]">
                Lọc nhanh các video có vi phạm hoặc cần thẩm định nhân sự chuyên sâu trước khi phê duyệt.
              </p>
            </div>
            <div>
              <span className="block font-medium text-[#57534E] mb-1">Bộ lọc theo kênh</span>
              <p className="text-[11px] text-[#78716C]">
                Nhập tên kênh hoặc tác giả vào thanh tìm kiếm phía trên để đối chiếu hàng đợi theo người sáng tạo.
              </p>
            </div>
            <div>
              <span className="block font-medium text-[#57534E] mb-1">Nguyên tắc bản quyền</span>
              <p className="text-[11px] text-[#78716C]">
                Video gắn nhãn Báo động đỏ được tự động tạm khóa công khai và yêu cầu xác minh tài liệu lịch sử.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
