import React, { useState } from 'react';
import { Search, Calendar, RotateCw, Download, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';

export interface AdminContractsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  narratorFilter: string;
  onNarratorFilterChange: (value: string) => void;
  availableNarrators: string[];
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
  { value: 'ACTIVE', label: 'Đang thực hiện' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'PENDING', label: 'Chờ ký' },
  { value: 'DISPUTED', label: 'Có khiếu nại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export const AdminContractsFilterToolbar: React.FC<AdminContractsFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  narratorFilter,
  onNarratorFilterChange,
  availableNarrators,
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

  // Date range label for the trigger button
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

  // Toggle-off handler: clicking currently active preset resets back to 'all'
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

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDateStart || customDateEnd) {
      onDateRangePresetChange('custom');
      setIsDateOpen(false);
    }
  };

  const handleClearCustomDate = () => {
    onCustomDateChange(undefined, undefined);
    onDateRangePresetChange('all');
    setIsDateOpen(false);
  };

  return (
    <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      {/* 1. Large Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên tác phẩm, nhà sáng tạo, khách đặt hàng, mã hợp đồng..."
          className="w-full h-11 pl-10 pr-9 text-xs sm:text-[13px] font-sans bg-white border border-[#E7E5E4] rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#991B1B]/20 focus:border-[#991B1B] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700"
            title="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Filters & Actions Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Dropdown */}
        <div className="min-w-[150px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full h-11 flex items-center justify-between gap-2 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] font-sans text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <span className="truncate">
                  {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || 'Tất cả trạng thái'}
                </span>
                <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-48 p-1.5 rounded-xl border border-[#E7E5E4] bg-white shadow-lg z-[999]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onStatusFilterChange(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {statusFilter === opt.value && <Check className="h-3.5 w-3.5 text-[#991B1B]" />}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer Dropdown */}
        <div className="min-w-[170px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full h-11 flex items-center justify-between gap-2 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] font-sans text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <span className="truncate">
                  {narratorFilter === 'all' ? 'Tất cả khách đặt hàng' : narratorFilter}
                </span>
                <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 p-1.5 max-h-60 overflow-y-auto rounded-xl border border-[#E7E5E4] bg-white shadow-lg z-[999]"
            >
              <button
                type="button"
                onClick={() => onNarratorFilterChange('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  narratorFilter === 'all'
                    ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>Tất cả khách đặt hàng</span>
                {narratorFilter === 'all' && <Check className="h-3.5 w-3.5 text-[#991B1B]" />}
              </button>
              {availableNarrators.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onNarratorFilterChange(name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                    narratorFilter === name
                      ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="truncate">{name}</span>
                  {narratorFilter === name && <Check className="h-3.5 w-3.5 text-[#991B1B]" />}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Date Range Popover */}
        <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`h-11 flex items-center gap-2 px-3.5 rounded-xl border text-xs sm:text-[13px] font-sans transition-colors shrink-0 ${
                dateRangePreset !== 'all'
                  ? 'border-[#991B1B] bg-[#FFF0F2] text-[#991B1B] font-medium'
                  : 'border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0 text-stone-400" />
              <span className="truncate max-w-[160px] sm:max-w-none">{getDateRangeLabel()}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 p-3 rounded-2xl border border-[#E7E5E4] bg-white shadow-xl z-[999] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#F0EBE6] pb-2">
              <span className="text-xs font-semibold text-stone-900 font-sans">
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
                  className="text-[11px] text-[#991B1B] hover:underline font-sans"
                >
                  Đặt lại
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: '7d', label: '7 ngày qua' },
                { id: '30d', label: '30 ngày' },
                { id: '90d', label: '90 ngày' },
              ].map((p) => {
                const isSelected = dateRangePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-sans text-center transition-colors ${
                      isSelected
                        ? 'bg-[#991B1B] text-white font-medium shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCustomDateSubmit} className="space-y-2 pt-1 border-t border-[#F0EBE6]">
              <span className="text-[11px] font-medium text-stone-500 font-sans block">
                Tùy chỉnh ngày
              </span>
              <div className="space-y-1.5">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Từ ngày</label>
                  <input
                    type="date"
                    value={customDateStart || ''}
                    onChange={(e) => onCustomDateChange(e.target.value, customDateEnd)}
                    className="w-full px-2.5 py-1.5 text-xs font-sans border border-[#E7E5E4] rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Đến ngày</label>
                  <input
                    type="date"
                    value={customDateEnd || ''}
                    onChange={(e) => onCustomDateChange(customDateStart, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-sans border border-[#E7E5E4] rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {(customDateStart || customDateEnd) && (
                  <button
                    type="button"
                    onClick={handleClearCustomDate}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-sans"
                  >
                    Xóa lọc ngày
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="ml-auto bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs h-8 px-3 rounded-lg"
                >
                  Áp dụng
                </Button>
              </div>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-11 flex items-center gap-1.5 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] font-sans text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors shrink-0 disabled:opacity-50"
          title="Làm mới dữ liệu"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#991B1B]' : 'text-stone-500'}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={onExportCSV}
          className="h-11 flex items-center gap-1.5 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] font-sans text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors shrink-0"
          title="Xuất danh sách ra file CSV"
        >
          <Download className="h-4 w-4 text-stone-500" />
          <span className="hidden sm:inline">Xuất CSV</span>
        </button>
      </div>
    </div>
  );
};
