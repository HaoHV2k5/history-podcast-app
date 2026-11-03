import React, { useState } from 'react';
import { Search, RotateCw, Calendar, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import { cn } from '@/utils/cn';

interface AdminTransactionsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRange: string;
  dateRangeLabel?: string;
  customStartDate?: string;
  customEndDate?: string;
  onDateRangeChange: (preset: string, start?: string, end?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExport: () => void;
}

export const AdminTransactionsFilterToolbar: React.FC<AdminTransactionsFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  dateRangeLabel,
  customStartDate: propCustomStart,
  customEndDate: propCustomEnd,
  onDateRangeChange,
  onRefresh,
  isRefreshing = false,
  onExport,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(propCustomStart || '');
  const [customEndDate, setCustomEndDate] = useState(propCustomEnd || '');

  // Sync custom date when prop changes
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
    // Toggle-off: Clicking the active preset deselects it and reverts to 'all'
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
    <div className="flex flex-col xl:flex-row items-stretch xl:items-end justify-between gap-3 select-none font-sans">
      {/* Left: Search input */}
      <div className="relative flex-1 min-w-[280px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên người dùng, email, mã giao dịch, nội dung..."
          className="w-full h-10 pl-10 pr-9 rounded-xl border border-[#E7E2DA] bg-white text-xs text-[#1F1612] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#991B1B] focus:border-[#991B1B] transition-all shadow-2xs font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
            title="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right: Dropdowns with labels above, Date Popover & Action Buttons */}
      <div className="flex flex-wrap items-end gap-2.5">
        {/* Dropdown 1: Loại giao dịch */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-stone-500">Loại giao dịch</span>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className={cn(
              'h-10 px-3 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#991B1B] focus:border-[#991B1B] transition-all cursor-pointer shadow-2xs font-sans',
              typeFilter !== 'all'
                ? 'border-[#991B1B] bg-[#FFFBF7] text-[#991B1B]'
                : 'border-[#E7E2DA] bg-white text-stone-700'
            )}
          >
            <option value="all">Tất cả loại giao dịch</option>
            <option value="TOPUP">Nạp tiền</option>
            <option value="WITHDRAW">Rút tiền</option>
            <option value="DISTRIBUTION">Phân phối doanh thu</option>
            <option value="ESCROW">Ký quỹ hợp đồng</option>
            <option value="MEMBERSHIP">Phí hội viên</option>
            <option value="REFUND">Hoàn tiền</option>
          </select>
        </div>

        {/* Dropdown 2: Trạng thái */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-stone-500">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={cn(
              'h-10 px-3 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#991B1B] focus:border-[#991B1B] transition-all cursor-pointer shadow-2xs font-sans',
              statusFilter !== 'all'
                ? 'border-[#991B1B] bg-[#FFFBF7] text-[#991B1B]'
                : 'border-[#E7E2DA] bg-white text-stone-700'
            )}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="FAILED">Thất bại</option>
          </select>
        </div>

        {/* Dropdown 3: Khoảng thời gian với Toggle-Off Popover */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-stone-500">Khoảng thời gian</span>
          <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-xs font-medium transition-all shadow-2xs cursor-pointer font-sans',
                  dateRange !== 'all'
                    ? 'border-[#991B1B] bg-[#FFFBF7] text-[#991B1B]'
                    : 'border-[#E7E2DA] bg-white text-stone-700 hover:bg-stone-50'
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{dateRangeLabel || 'Chọn khoảng thời gian'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 p-3 bg-white rounded-2xl border border-[#F0EBE6] shadow-xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200 ease-out z-[900] font-sans"
            >
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Khoảng thời gian nhanh
                  </span>
                  {dateRange !== 'all' && (
                    <button
                      type="button"
                      onClick={handleResetDate}
                      className="text-[11px] text-[#991B1B] hover:text-[#7F1D1D] hover:underline cursor-pointer font-semibold"
                      title="Đặt lại về Tất cả thời gian"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: '7d', label: '7 ngày qua' },
                    { id: '30d', label: '30 ngày qua' },
                    { id: '90d', label: '90 ngày qua' },
                  ].map((item) => {
                    const isActive = dateRange === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handlePresetSelect(item.id)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer',
                          isActive
                            ? 'bg-[#991B1B] text-white shadow-2xs font-semibold'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                        )}
                      >
                        <span>{item.label}</span>
                        {isActive && <span className="text-[10px] text-white/80">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0EBE6] space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Tùy chỉnh khoảng ngày
                </span>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-0.5">Từ ngày:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-[#E7E2DA] text-xs text-stone-700 focus:outline-none focus:border-[#991B1B]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-0.5">Đến ngày:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-[#E7E2DA] text-xs text-stone-700 focus:outline-none focus:border-[#991B1B]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    onClick={handleResetDate}
                    className="px-2.5 py-1 rounded-md text-[11px] text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
                  >
                    Xóa lọc
                  </button>
                  <Button
                    size="sm"
                    onClick={handleApplyCustomDate}
                    className="h-7 px-3 text-xs bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-lg cursor-pointer"
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Export CSV Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-10 px-3.5 text-xs text-stone-700 border-[#E7E2DA] hover:bg-stone-50 rounded-xl shadow-2xs font-medium font-sans cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
          <span>Xuất CSV</span>
        </Button>

        {/* Refresh button matching mockup */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 px-3.5 text-xs text-[#991B1B] border-[#FECACA] bg-[#FFFBF7] hover:bg-[#FEE2E2] rounded-xl shadow-2xs font-semibold font-sans"
        >
          <RotateCw className={cn('h-3.5 w-3.5 mr-1.5', isRefreshing && 'animate-spin')} />
          <span>Làm mới</span>
        </Button>
      </div>
    </div>
  );
};
