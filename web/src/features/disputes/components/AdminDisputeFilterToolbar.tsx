import React, { useState } from 'react';
import { Search, Calendar, RotateCw, Download, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';

export interface AdminDisputeFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  disputeTypeFilter: string;
  onDisputeTypeFilterChange: (value: string) => void;
  statusSelectFilter: string;
  onStatusSelectFilterChange: (value: string) => void;
  dateRangePreset: string;
  onDateRangePresetChange: (value: string) => void;
  customDateStart?: string;
  customDateEnd?: string;
  onCustomDateChange: (start?: string, end?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCSV?: () => void;
}

const DISPUTE_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả loại tranh chấp' },
  { value: 'Chất lượng thu âm', label: 'Chất lượng thu âm' },
  { value: 'Hoàn tiền ký quỹ', label: 'Hoàn tiền ký quỹ' },
  { value: 'Nội dung thuyết minh', label: 'Nội dung thuyết minh' },
  { value: 'Vi phạm bản quyền', label: 'Vi phạm bản quyền' },
  { value: 'Thanh toán', label: 'Không thanh toán' },
  { value: 'Hủy hợp đồng', label: 'Yêu cầu hủy hợp đồng' },
  { value: 'Phân chia doanh thu', label: 'Phân chia doanh thu' },
  { value: 'Giọng đọc', label: 'Khiếu nại giọng đọc' },
];

const STATUS_SELECT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'OPEN', label: 'Đang thụ lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export const AdminDisputeFilterToolbar: React.FC<AdminDisputeFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  disputeTypeFilter,
  onDisputeTypeFilterChange,
  statusSelectFilter,
  onStatusSelectFilterChange,
  dateRangePreset,
  onDateRangePresetChange,
  customDateStart,
  customDateEnd,
  onCustomDateChange,
  onRefresh,
  isRefreshing = false,
  onExportCSV,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Date range label for the trigger button
  const getDateRangeLabel = () => {
    if (dateRangePreset === 'TODAY') return 'Hôm nay';
    if (dateRangePreset === '7_DAYS' || dateRangePreset === '7d') return '7 ngày qua';
    if (dateRangePreset === '30_DAYS' || dateRangePreset === '30d') return '30 ngày qua';
    if (dateRangePreset === '90_DAYS' || dateRangePreset === '90d') return '90 ngày qua';
    if (dateRangePreset === 'CUSTOM' || dateRangePreset === 'custom') {
      if (customDateStart && customDateEnd) return `${customDateStart} → ${customDateEnd}`;
      if (customDateStart) return `Từ ${customDateStart}`;
      if (customDateEnd) return `Đến ${customDateEnd}`;
      return 'Tùy chỉnh ngày';
    }
    return 'Chọn khoảng thời gian';
  };

  // Toggle-off handler for date presets
  const handlePresetClick = (preset: string) => {
    if (dateRangePreset === preset) {
      onDateRangePresetChange('ALL');
      onCustomDateChange(undefined, undefined);
    } else {
      onDateRangePresetChange(preset);
      if (preset !== 'CUSTOM') {
        onCustomDateChange(undefined, undefined);
      }
    }
    setIsDateOpen(false);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDateStart || customDateEnd) {
      onDateRangePresetChange('CUSTOM');
      setIsDateOpen(false);
    }
  };

  const handleClearCustomDate = () => {
    onCustomDateChange(undefined, undefined);
    onDateRangePresetChange('ALL');
  };

  const selectedTypeLabel =
    DISPUTE_TYPE_OPTIONS.find((o) => o.value === disputeTypeFilter)?.label ||
    'Tất cả loại tranh chấp';

  const selectedStatusLabel =
    STATUS_SELECT_OPTIONS.find((o) => o.value === statusSelectFilter)?.label ||
    'Tất cả trạng thái';

  return (
    <div className="relative z-30 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3 select-none">
      {/* 1. Large Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo mã khiếu nại, tiêu đề, người gửi, hợp đồng..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] shadow-2xs transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded transition-colors"
            title="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Dropdown: Loại tranh chấp */}
      <DropdownMenu open={isTypeOpen} onOpenChange={setIsTypeOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 font-medium shadow-2xs shrink-0 cursor-pointer transition-colors"
          >
            <span className="truncate max-w-[140px] sm:max-w-[160px]">
              {selectedTypeLabel}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 p-1 rounded-xl bg-white border border-[#F0EBE6] shadow-lg z-[999] duration-200 ease-out font-sans text-xs sm:text-[13px]"
        >
          {DISPUTE_TYPE_OPTIONS.map((opt) => {
            const isSelected = disputeTypeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onDisputeTypeFilterChange(isSelected && opt.value !== 'ALL' ? 'ALL' : opt.value);
                  setIsTypeOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />}
              </button>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Dropdown: Trạng thái */}
      <DropdownMenu open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 font-medium shadow-2xs shrink-0 cursor-pointer transition-colors"
          >
            <span className="truncate max-w-[130px] sm:max-w-[145px]">
              {selectedStatusLabel}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-48 p-1 rounded-xl bg-white border border-[#F0EBE6] shadow-lg z-[999] duration-200 ease-out font-sans text-xs sm:text-[13px]"
        >
          {STATUS_SELECT_OPTIONS.map((opt) => {
            const isSelected = statusSelectFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onStatusSelectFilterChange(isSelected && opt.value !== 'ALL' ? 'ALL' : opt.value);
                  setIsStatusOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />}
              </button>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. Popover: Chọn khoảng thời gian (Radix Portal z-[999], Toggle-Off) */}
      <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-[13px] font-medium shadow-2xs shrink-0 cursor-pointer transition-colors ${
              dateRangePreset !== 'ALL'
                ? 'border-[#991B1B] text-[#991B1B] bg-[#FFF0F2]/50 font-semibold'
                : 'border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-stone-500 shrink-0" />
            <span className="truncate max-w-[135px] sm:max-w-[160px]">
              {getDateRangeLabel()}
            </span>
            <ChevronDown className="h-3 w-3 text-stone-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 p-3 rounded-2xl bg-white border border-[#F0EBE6] shadow-xl z-[999] duration-200 ease-out font-sans text-xs sm:text-[13px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE6]">
            <span className="font-semibold text-stone-900 text-xs sm:text-[13px]">
              Khoảng thời gian
            </span>
            {dateRangePreset !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  onDateRangePresetChange('ALL');
                  onCustomDateChange(undefined, undefined);
                  setIsDateOpen(false);
                }}
                className="text-[11px] font-medium text-[#991B1B] hover:underline cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </div>

          {/* Quick Presets with Toggle-off */}
          <div className="grid grid-cols-2 gap-1.5 py-2.5 border-b border-[#F0EBE6]">
            {[
              { id: 'TODAY', label: 'Hôm nay' },
              { id: '7_DAYS', label: '7 ngày qua' },
              { id: '30_DAYS', label: '30 ngày qua' },
              { id: '90_DAYS', label: '90 ngày qua' },
            ].map((preset) => {
              const isSelected = dateRangePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#991B1B] text-white font-semibold shadow-2xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleCustomDateSubmit} className="pt-2.5 space-y-2">
            <span className="text-[11px] font-medium text-stone-500 block">
              Hoặc chọn ngày tùy chỉnh:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Từ ngày</label>
                <input
                  type="date"
                  value={customDateStart || ''}
                  onChange={(e) => onCustomDateChange(e.target.value, customDateEnd)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E7E5E4] text-stone-800 focus:outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Đến ngày</label>
                <input
                  type="date"
                  value={customDateEnd || ''}
                  onChange={(e) => onCustomDateChange(customDateStart, e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E7E5E4] text-stone-800 focus:outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {(customDateStart || customDateEnd) && (
                <button
                  type="button"
                  onClick={handleClearCustomDate}
                  className="text-[11px] text-stone-500 hover:text-stone-700 cursor-pointer"
                >
                  Xóa lọc tùy chỉnh
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                className="ml-auto text-xs py-1 px-3 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-lg shadow-2xs cursor-pointer"
              >
                Áp dụng
              </Button>
            </div>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 5. Nút Làm mới [⟳ Làm mới] */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 font-medium shadow-2xs shrink-0 cursor-pointer transition-colors disabled:opacity-50"
        title="Làm mới dữ liệu khiếu nại"
      >
        <RotateCw
          className={`h-3.5 w-3.5 text-stone-600 ${isRefreshing ? 'animate-spin text-[#991B1B]' : ''}`}
        />
        <span className="hidden sm:inline">Làm mới</span>
      </button>

      {/* 6. Nút Xuất CSV [⬇ Xuất CSV] (nếu hỗ trợ) */}
      {onExportCSV && (
        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 font-medium shadow-2xs shrink-0 cursor-pointer transition-colors"
          title="Xuất danh sách khiếu nại ra tệp CSV"
        >
          <Download className="h-3.5 w-3.5 text-stone-600" />
          <span className="hidden sm:inline">Xuất CSV</span>
        </button>
      )}
    </div>
  );
};

