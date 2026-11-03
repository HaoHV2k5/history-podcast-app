import React, { useState } from 'react';
import { Search, SlidersHorizontal, Calendar, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import { cn } from '@/utils/cn';

interface AdminMembershipFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRange: string;
  dateRangeLabel?: string;
  customStartDate?: string;
  customEndDate?: string;
  onDateRangeChange: (preset: string, start?: string, end?: string) => void;
  onExport: () => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const AdminMembershipFilterToolbar: React.FC<AdminMembershipFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  dateRangeLabel,
  customStartDate: propCustomStart,
  customEndDate: propCustomEnd,
  onDateRangeChange,
  onExport,
  onResetFilters,
  isFiltered,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(propCustomStart || '');
  const [customEndDate, setCustomEndDate] = useState(propCustomEnd || '');

  // Đồng bộ custom date khi props thay đổi hoặc khi reset
  React.useEffect(() => {
    if (dateRange !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    } else {
      if (propCustomStart) setCustomStartDate(propCustomStart);
      if (propCustomEnd) setCustomEndDate(propCustomEnd);
    }
  }, [dateRange, propCustomStart, propCustomEnd]);

  const handlePresetSelect = (preset: string) => {
    // Toggle off: Nếu preset đang chọn được click lại, tự động bỏ chọn (chuyển về 'all' / Tất cả thời gian)
    if (dateRange === preset) {
      onDateRangeChange('all');
    } else {
      onDateRangeChange(preset);
    }
    setIsDateOpen(false);
  };

  const handleApplyCustomDate = () => {
    if (customStartDate || customEndDate) {
      onDateRangeChange('custom', customStartDate, customEndDate);
      setIsDateOpen(false);
    }
  };

  const handleResetDate = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    onDateRangeChange('all');
    setIsDateOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Left: Search input with integrated slider icon */}
      <div className="relative flex-1 min-w-[280px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên, email, mã giao dịch..."
          className="w-full h-10 pl-10 pr-9 rounded-xl border border-[#E7E5E4] bg-white text-xs text-[#1F1612] placeholder-stone-400 focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] transition-colors shadow-2xs"
          aria-label="Tìm kiếm giao dịch hội viên"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
        )}
      </div>

      {/* Right Controls: Plan filter, Status filter, Date Range, Export button */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Dropdown: Tất cả gói hội viên */}
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className="h-10 pl-3.5 pr-8 rounded-xl border border-[#E7E5E4] bg-white text-xs text-stone-700 font-medium focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] shadow-2xs appearance-none cursor-pointer"
            aria-label="Lọc theo gói hội viên"
          >
            <option value="all">Tất cả gói hội viên</option>
            <option value="Hội Viên Thường">Hội Viên Thường</option>
            <option value="Hội Viên Cao Cấp">Hội Viên Cao Cấp</option>
            <option value="Hội Viên VIP">Hội Viên VIP</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Dropdown: Tất cả trạng thái */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-10 pl-3.5 pr-8 rounded-xl border border-[#E7E5E4] bg-white text-xs text-stone-700 font-medium focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] shadow-2xs appearance-none cursor-pointer"
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="PENDING">Chờ xác minh</option>
            <option value="FAILED">Thất bại</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Date range picker trigger button matching media_1793684474783_da40b0a1.png 100% */}
        <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'h-10 px-3.5 flex items-center gap-2 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer select-none',
                dateRange && dateRange !== 'all'
                  ? 'border-[#991B1B] bg-[#FFF5F5] text-[#991B1B]'
                  : 'border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
              )}
              aria-label="Chọn khoảng thời gian"
            >
              <Calendar
                className={cn(
                  'h-4 w-4',
                  dateRange && dateRange !== 'all' ? 'text-[#991B1B]' : 'text-stone-500'
                )}
              />
              <span>{dateRangeLabel || 'Tất cả thời gian'}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 sm:w-80 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.1)] z-50 duration-200 ease-out origin-top-right transition-all"
            sideOffset={6}
          >
            <div className="mb-2 pb-2 border-b border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F1612]">Khoảng thời gian</span>
              {dateRange && dateRange !== 'all' && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="text-[10px] text-stone-400 hover:text-stone-700 cursor-pointer font-medium"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Quick Presets matching user request with toggle-off behavior */}
            <div className="space-y-1 mb-3">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                Chọn sẵn thời gian
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: '30days', label: '30 ngày gần đây' },
                  { id: '7days', label: '7 ngày qua' },
                  { id: 'today', label: 'Hôm nay' },
                  { id: 'this_month', label: 'Tháng này' },
                ].map((preset) => {
                  const isSelected = dateRange === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={cn(
                        'px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer border',
                        isSelected
                          ? 'bg-[#FFF5F5] text-[#991B1B] border-[#991B1B] shadow-2xs font-bold'
                          : 'bg-stone-50/80 text-stone-700 border-stone-200/60 hover:bg-stone-100 hover:border-stone-300'
                      )}
                      title={isSelected ? 'Nhấp lại để bỏ chọn' : undefined}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => handlePresetSelect('all')}
                className={cn(
                  'w-full mt-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border',
                  dateRange === 'all' || !dateRange
                    ? 'bg-stone-100 text-stone-900 border-stone-300 font-bold'
                    : 'bg-stone-50/80 text-stone-600 border-stone-200/60 hover:bg-stone-100'
                )}
              >
                Tất cả thời gian
              </button>
            </div>

            {/* Custom Range with date inputs matching media_1793685119783_23ccabc1.png */}
            <div className="pt-3 border-t border-stone-100 space-y-2.5">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Chọn từ ngày đến ngày
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-stone-500 font-medium block mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 font-medium block mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDate}
                  className="h-8 px-2.5 text-xs text-stone-500 hover:text-stone-800"
                >
                  Đặt lại
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyCustomDate}
                  className="h-8 px-4 bg-[#991B1B] hover:bg-[#831826] active:bg-[#6b1414] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Data Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-10 px-3.5 rounded-xl border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium shadow-2xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5 text-stone-500" />
          <span>Xuất dữ liệu</span>
        </Button>

        {/* Reset button when filtered */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-10 px-2.5 text-xs text-stone-500 hover:text-stone-800"
          >
            Đặt lại
          </Button>
        )}
      </div>
    </div>
  );
};
