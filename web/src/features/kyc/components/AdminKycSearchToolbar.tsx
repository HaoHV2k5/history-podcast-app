import React from 'react';
import { Search, ChevronDown, Calendar, RotateCcw, X } from 'lucide-react';

interface AdminKycSearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  method: string;
  onMethodChange: (method: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onReset: () => void;
  isFetching?: boolean;
}

export const AdminKycSearchToolbar: React.FC<AdminKycSearchToolbarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  method,
  onMethodChange,
  dateRange,
  onDateRangeChange,
  onReset,
  isFetching,
}) => {
  const hasActiveFilters = Boolean(search || status || method || dateRange !== 'all');

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 select-none">
      {/* 1. Left: Search Input Box */}
      <div className="relative flex-1 min-w-[260px] max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-[13px] text-[#1C1917] placeholder:text-[#9CA3AF] shadow-2xs focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] transition-all duration-150"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#9CA3AF] hover:text-[#1C1917]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Right: Filter Selects and Refresh */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-[#E5E7EB] bg-white pl-3.5 pr-8 text-xs sm:text-[13px] font-medium text-[#1C1917] shadow-2xs hover:border-[#D1D5DB] focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] transition-colors cursor-pointer"
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã phê duyệt</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
        </div>

        {/* Verification Method Dropdown */}
        <div className="relative">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-[#E5E7EB] bg-white pl-3.5 pr-8 text-xs sm:text-[13px] font-medium text-[#1C1917] shadow-2xs hover:border-[#D1D5DB] focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] transition-colors cursor-pointer"
          >
            <option value="">Phương thức xác thực</option>
            <option value="EMAIL">OTP qua Email</option>
            <option value="PHONE">OTP qua SMS</option>
            <option value="CCCD">CCCD/CMND</option>
            <option value="PASSPORT">Hộ chiếu</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
        </div>

        {/* Registration Date Filter Dropdown */}
        <div className="relative">
          <div className="flex items-center h-10 rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-8 shadow-2xs hover:border-[#D1D5DB] transition-colors">
            <Calendar className="h-3.5 w-3.5 text-[#6B7280] mr-2 shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="appearance-none bg-transparent text-xs sm:text-[13px] font-medium text-[#1C1917] focus:outline-none cursor-pointer"
            >
              <option value="all">Thời gian đăng ký</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="this_month">Tháng này</option>
            </select>
          </div>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
        </div>

        {/* Reset / Refresh Button */}
        <button
          type="button"
          onClick={onReset}
          title="Làm mới danh sách và đặt lại bộ lọc"
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-[13px] font-semibold text-[#1C1917] shadow-2xs hover:bg-[#FAF8F5] hover:border-[#D1D5DB] active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]"
        >
          <RotateCcw
            className={`h-3.5 w-3.5 text-[#57534E] ${isFetching ? 'animate-spin text-[#991B1B]' : ''}`}
          />
          <span>Làm mới</span>
        </button>

        {/* Clear Filters Pill (if any active) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#991B1B] hover:underline font-medium px-2 py-1"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};

