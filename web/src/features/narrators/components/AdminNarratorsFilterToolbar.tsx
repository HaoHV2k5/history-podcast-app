import React, { useState } from 'react';
import { Search, Calendar, RotateCw, Download, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';

export interface AdminNarratorsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  voiceGenderFilter: string;
  onVoiceGenderChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRangePreset: string;
  onDateRangePresetChange: (value: string) => void;
  customDateStart?: string;
  customDateEnd?: string;
  onCustomDateChange: (start?: string, end?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCSV: () => void;
}

const VOICE_OPTIONS = [
  { value: 'all', label: 'Tất cả giọng đọc' },
  { value: 'FEMALE', label: 'Giọng nữ' },
  { value: 'MALE', label: 'Giọng nam' },
  { value: 'OTHER', label: 'Đa dạng giọng' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xét duyệt' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
];

export const AdminNarratorsFilterToolbar: React.FC<AdminNarratorsFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  voiceGenderFilter,
  onVoiceGenderChange,
  statusFilter,
  onStatusFilterChange,
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
    <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* 1. Large Search Input on Left */}
      <div className="relative flex-1 min-w-[240px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên, email, mã user, giọng đọc, ngôn ngữ..."
          className="w-full rounded-xl border border-[#E7E5E4] bg-white py-2 pl-10 pr-9 sm:pr-10 text-xs sm:text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            title="Xóa tìm kiếm"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Filters & Action Buttons on Right */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Dropdown: Tất cả giọng đọc */}
        <div className="relative min-w-[140px]">
          <select
            value={voiceGenderFilter}
            onChange={(e) => onVoiceGenderChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#E7E5E4] bg-white py-2 pl-3.5 pr-8 text-xs sm:text-[13px] font-medium text-stone-700 hover:border-stone-300 focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] transition-colors cursor-pointer"
          >
            {VOICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        </div>

        {/* Dropdown: Tất cả trạng thái */}
        <div className="relative min-w-[145px]">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#E7E5E4] bg-white py-2 pl-3.5 pr-8 text-xs sm:text-[13px] font-medium text-stone-700 hover:border-stone-300 focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        </div>

        {/* Popover Thời Gian: BẮT BUỘC dùng Radix Portal z-[999] để chống bị bảng đè */}
        <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-[13px] font-medium transition-colors ${dateRangePreset !== 'all'
                  ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B] shadow-xs'
                  : 'border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
            >
              <Calendar className="h-4 w-4 text-stone-400" />
              <span className="whitespace-nowrap">{getDateRangeLabel()}</span>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-72 sm:w-80 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl z-[999]"
          >
            {/* Popover Header with Reset Button inside (No redundant outer button) */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
              <span className="text-xs font-semibold text-stone-800">Khoảng thời gian</span>
              {dateRangePreset !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    onDateRangePresetChange('all');
                    onCustomDateChange(undefined, undefined);
                    setIsDateOpen(false);
                  }}
                  className="text-[11px] font-medium text-[#991B1B] hover:underline"
                >
                  Đặt lại mặc định
                </button>
              )}
            </div>

            {/* Quick Presets with Toggle-Off support */}
            <div className="space-y-1">
              {[
                { id: 'all', label: 'Tất cả thời gian' },
                { id: '7d', label: '7 ngày qua' },
                { id: '30d', label: '30 ngày qua' },
                { id: '90d', label: '90 ngày qua' },
              ].map((p) => {
                const isSelected = dateRangePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSelected
                        ? 'bg-[#FEF2F2] text-[#991B1B] font-semibold'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                  >
                    <span>{p.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#991B1B]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Form */}
            <form onSubmit={handleCustomDateSubmit} className="mt-2.5 pt-2.5 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-medium text-stone-500 block">Tùy chỉnh ngày:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Từ ngày</label>
                  <input
                    type="date"
                    value={customDateStart || ''}
                    onChange={(e) => onCustomDateChange(e.target.value, customDateEnd)}
                    className="w-full rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-800 focus:border-[#991B1B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Đến ngày</label>
                  <input
                    type="date"
                    value={customDateEnd || ''}
                    onChange={(e) => onCustomDateChange(customDateStart, e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-800 focus:border-[#991B1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                {(customDateStart || customDateEnd) && (
                  <button
                    type="button"
                    onClick={handleClearCustomDate}
                    className="px-2.5 py-1 text-[11px] text-stone-500 hover:text-stone-700"
                  >
                    Xóa lọc tùy chỉnh
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!customDateStart && !customDateEnd}
                  className="px-3 py-1 rounded-lg bg-[#991B1B] text-white text-[11px] font-medium hover:bg-[#7F1D1D] disabled:opacity-50 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Nút Làm Mới */}
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-none"
        >
          <RotateCw className={`h-3.5 w-3.5 text-stone-500 ${isRefreshing ? 'animate-spin text-[#991B1B]' : ''}`} />
          <span>Làm mới</span>
        </Button>

        {/* Nút Xuất CSV */}
        <Button
          type="button"
          variant="outline"
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-none"
        >
          <Download className="h-3.5 w-3.5 text-stone-500" />
          <span>Xuất CSV</span>
        </Button>
      </div>
    </div>
  );
};

