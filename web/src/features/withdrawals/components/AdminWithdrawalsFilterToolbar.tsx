import React, { useState } from 'react';
import {
  Search,
  Calendar,
  RotateCw,
  Download,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';

export interface AdminWithdrawalsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  bankFilter: string;
  onBankFilterChange: (value: string) => void;
  dateRangePreset: string;
  onDateRangePresetChange: (value: string) => void;
  customDateStart?: string;
  customDateEnd?: string;
  onCustomDateChange: (start?: string, end?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCSV: () => void;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xét duyệt' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'COMPLETED', label: 'Đã hoàn tất' },
  { value: 'REJECTED', label: 'Bị từ chối' },
];

const BANK_OPTIONS = [
  { value: 'all', label: 'Tất cả ngân hàng' },
  { value: 'vietcombank', label: 'Vietcombank' },
  { value: 'mb', label: 'MB Bank' },
  { value: 'techcombank', label: 'Techcombank' },
  { value: 'bidv', label: 'BIDV' },
  { value: 'vietinbank', label: 'VietinBank' },
  { value: 'acb', label: 'ACB' },
  { value: 'tpbank', label: 'TPBank' },
  { value: 'sacombank', label: 'Sacombank' },
  { value: 'vpbank', label: 'VPBank' },
  { value: 'agribank', label: 'Agribank' },
];

export const AdminWithdrawalsFilterToolbar: React.FC<AdminWithdrawalsFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  bankFilter,
  onBankFilterChange,
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

  // Date range label for the button
  const getDateRangeLabel = () => {
    if (dateRangePreset === '7d') return '7 ngày qua';
    if (dateRangePreset === '30d') return '30 ngày qua';
    if (dateRangePreset === '90d') return '90 ngày qua';
    if (dateRangePreset === 'custom') {
      if (customDateStart && customDateEnd) return `${customDateStart} → ${customDateEnd}`;
      if (customDateStart) return `Từ ${customDateStart}`;
      if (customDateEnd) return `Đến ${customDateEnd}`;
      return 'Tùy chỉnh ngày';
    }
    return 'Chọn khoảng thời gian';
  };

  // Toggle-off handler for presets: if currently active preset is clicked again, reset to 'all'
  const handlePresetClick = (preset: string) => {
    if (dateRangePreset === preset) {
      onDateRangePresetChange('all');
      onCustomDateChange(undefined, undefined);
    } else {
      onDateRangePresetChange(preset);
      if (preset !== 'custom') {
        onCustomDateChange(undefined, undefined);
      }
    }
    setIsDateOpen(false);
  };

  return (
    <div className="relative z-30 flex flex-col gap-3 rounded-2xl border border-[#F0EBE6] bg-white p-3.5 sm:p-4 shadow-xs select-none font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* 1. Large Search Input on Left matching mockup */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên, email, mã yêu cầu, số tài khoản..."
            className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF8F5]/50 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-800 placeholder-stone-400 transition-colors focus:border-[#991B1B] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. Controls Grid */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Status Dropdown */}
          <div className="relative min-w-[145px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E7E5E4] bg-white py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 focus:border-[#991B1B] focus:outline-hidden focus:ring-1 focus:ring-[#991B1B] cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Bank Dropdown */}
          <div className="relative min-w-[155px]">
            <select
              value={bankFilter}
              onChange={(e) => onBankFilterChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E7E5E4] bg-white py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 focus:border-[#991B1B] focus:outline-hidden focus:ring-1 focus:ring-[#991B1B] cursor-pointer"
            >
              {BANK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Date Range Popover (Using Radix Portal with z-[999] so it NEVER clips or hides under table) */}
          <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-3.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  dateRangePreset !== 'all'
                    ? 'border-[#991B1B] bg-rose-50/50 text-[#991B1B]'
                    : 'border-[#E7E5E4] bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                <Calendar className="h-4 w-4 text-stone-500" />
                <span>{getDateRangeLabel()}</span>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400 ml-1" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="w-72 p-3.5 bg-white rounded-2xl border border-[#F0EBE6] shadow-xl text-xs space-y-3 z-[999] font-sans"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Khoảng thời gian
                </span>
                {dateRangePreset !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      onDateRangePresetChange('all');
                      onCustomDateChange(undefined, undefined);
                      setIsDateOpen(false);
                    }}
                    className="text-[11px] font-medium text-[#991B1B] hover:underline cursor-pointer"
                  >
                    Đặt lại
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {[
                  { id: 'all', label: 'Tất cả thời gian' },
                  { id: '7d', label: '7 ngày qua' },
                  { id: '30d', label: '30 ngày qua' },
                  { id: '90d', label: '90 ngày qua' },
                ].map((preset) => {
                  const isSelected = dateRangePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetClick(preset.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 text-[#991B1B] font-semibold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#991B1B]" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Range Section */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Tùy chỉnh ngày
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Từ ngày</label>
                    <input
                      type="date"
                      value={customDateStart || ''}
                      onChange={(e) => {
                        onDateRangePresetChange('custom');
                        onCustomDateChange(e.target.value, customDateEnd);
                      }}
                      className="w-full rounded-lg border border-[#E7E5E4] px-2 py-1 text-xs text-stone-700 focus:border-[#991B1B] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Đến ngày</label>
                    <input
                      type="date"
                      value={customDateEnd || ''}
                      onChange={(e) => {
                        onDateRangePresetChange('custom');
                        onCustomDateChange(customDateStart, e.target.value);
                      }}
                      className="w-full rounded-lg border border-[#E7E5E4] px-2 py-1 text-xs text-stone-700 focus:border-[#991B1B] focus:outline-hidden"
                    />
                  </div>
                </div>
                {dateRangePreset === 'custom' && (
                  <button
                    type="button"
                    onClick={() => {
                      onDateRangePresetChange('all');
                      onCustomDateChange(undefined, undefined);
                    }}
                    className="w-full mt-1 text-center text-[11px] text-stone-500 hover:text-stone-800 py-1 cursor-pointer"
                  >
                    Xóa lọc tùy chỉnh
                  </button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-xl border-[#E7E5E4] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#991B1B]' : 'text-stone-500'}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            onClick={onExportCSV}
            className="rounded-xl border-[#E7E5E4] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            title="Xuất bảng dữ liệu ra file CSV Excel"
          >
            <Download className="h-4 w-4 text-stone-500" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
