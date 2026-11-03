import React, { useState } from 'react';
import { Search, Calendar, RotateCw, Download, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';

export interface AdminEscrowFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodFilterChange: (value: string) => void;
  dateRangePreset: string;
  onDateRangePresetChange: (value: string) => void;
  customDateStart?: string;
  customDateEnd?: string;
  onCustomDateChange: (start?: string, end?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCSV?: () => void;
}

const STATUS_SELECT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'HELD', label: 'Đang giữ (HELD)' },
  { value: 'RELEASED', label: 'Đã giải ngân' },
  { value: 'FROZEN', label: 'Đóng băng (FROZEN)' },
  { value: 'REFUNDED', label: 'Đã hoàn (REFUNDED)' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'ALL', label: 'Tất cả phương thức thanh toán' },
  { value: 'Ví Sử Ký', label: 'Ví Sử Ký' },
  { value: 'VNPay', label: 'VNPay' },
  { value: 'Ngân hàng', label: 'Chuyển khoản Ngân hàng' },
];

export const AdminEscrowFilterToolbar: React.FC<AdminEscrowFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
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
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Date range label for the trigger button
  const getDateRangeLabel = () => {
    if (dateRangePreset === '7d' || dateRangePreset === '7D') return '7 ngày qua';
    if (dateRangePreset === '30d' || dateRangePreset === '30D') return '30 ngày qua';
    if (dateRangePreset === '90d' || dateRangePreset === '90D') return '90 ngày qua';
    if (dateRangePreset === 'custom' || dateRangePreset === 'CUSTOM') {
      if (customDateStart && customDateEnd) return `${customDateStart} → ${customDateEnd}`;
      if (customDateStart) return `Từ ${customDateStart}`;
      if (customDateEnd) return `Đến ${customDateEnd}`;
      return 'Tùy chỉnh ngày';
    }
    return 'Chọn khoảng thời gian';
  };

  // Toggle-off handler for date presets
  const handlePresetClick = (preset: string) => {
    if (dateRangePreset.toLowerCase() === preset.toLowerCase()) {
      onDateRangePresetChange('ALL');
      onCustomDateChange(undefined, undefined);
    } else {
      onDateRangePresetChange(preset);
      if (preset !== 'CUSTOM' && preset !== 'custom') {
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
    setIsDateOpen(false);
  };

  const currentStatusLabel =
    STATUS_SELECT_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Tất cả trạng thái';

  const currentPaymentLabel =
    PAYMENT_METHOD_OPTIONS.find((p) => p.value === paymentMethodFilter)?.label ||
    'Tất cả phương thức thanh toán';

  return (
    <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      {/* 1. Large Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo mã giao dịch, tên tác phẩm, người dùng..."
          className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-900 placeholder:text-stone-400 font-sans shadow-2xs focus:outline-none focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/15 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors"
            title="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Dropdown: Tất cả trạng thái */}
      <div className="shrink-0">
        <DropdownMenu open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full lg:w-auto h-11 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 font-sans shadow-2xs inline-flex items-center justify-between lg:justify-start gap-2.5 transition-colors focus:outline-none focus:border-[#991B1B]"
            >
              <span className="truncate max-w-[160px]">{currentStatusLabel}</span>
              <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 p-1.5 rounded-xl border border-[#E7E5E4] bg-white shadow-lg text-xs font-sans z-[999]"
          >
            {STATUS_SELECT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onStatusFilterChange(opt.value);
                  setIsStatusOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${statusFilter === opt.value
                    ? 'bg-rose-50 text-[#991B1B] font-semibold'
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

      {/* 3. Dropdown: Tất cả phương thức thanh toán */}
      <div className="shrink-0">
        <DropdownMenu open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full lg:w-auto h-11 px-3.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 font-sans shadow-2xs inline-flex items-center justify-between lg:justify-start gap-2.5 transition-colors focus:outline-none focus:border-[#991B1B]"
            >
              <span className="truncate max-w-[180px]">{currentPaymentLabel}</span>
              <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 p-1.5 rounded-xl border border-[#E7E5E4] bg-white shadow-lg text-xs font-sans z-[999]"
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onPaymentMethodFilterChange(opt.value);
                  setIsPaymentOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${paymentMethodFilter === opt.value
                    ? 'bg-rose-50 text-[#991B1B] font-semibold'
                    : 'text-stone-700 hover:bg-stone-50'
                  }`}
              >
                <span>{opt.label}</span>
                {paymentMethodFilter === opt.value && (
                  <Check className="h-3.5 w-3.5 text-[#991B1B]" />
                )}
              </button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 4. Popover: Chọn khoảng thời gian (Radix Portal z-[999]) */}
      <div className="shrink-0">
        <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`w-full lg:w-auto h-11 px-3.5 rounded-xl border bg-white text-xs sm:text-[13px] font-sans shadow-2xs inline-flex items-center justify-between lg:justify-start gap-2 transition-colors focus:outline-none ${dateRangePreset !== 'ALL' && dateRangePreset !== 'all'
                  ? 'border-rose-300 text-[#991B1B] bg-rose-50/40 font-semibold'
                  : 'border-[#E7E5E4] text-stone-700 hover:bg-stone-50'
                }`}
            >
              <Calendar
                className={`h-4 w-4 shrink-0 ${dateRangePreset !== 'ALL' && dateRangePreset !== 'all'
                    ? 'text-[#991B1B]'
                    : 'text-stone-400'
                  }`}
              />
              <span className="truncate max-w-[170px]">{getDateRangeLabel()}</span>
              <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 p-3 rounded-2xl border border-[#E7E5E4] bg-white shadow-xl text-xs font-sans z-[999] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#F0EBE6] pb-2">
              <span className="font-semibold text-stone-800">Khoảng thời gian</span>
              {(dateRangePreset !== 'ALL' && dateRangePreset !== 'all') && (
                <button
                  type="button"
                  onClick={handleClearCustomDate}
                  className="text-[11px] text-[#991B1B] hover:underline font-medium"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {/* Presets List with Toggle-Off support */}
            <div className="space-y-1">
              {[
                { key: '7D', label: '7 ngày qua' },
                { key: '30D', label: '30 ngày qua' },
                { key: '90D', label: '90 ngày qua' },
              ].map((p) => {
                const isActive =
                  dateRangePreset.toUpperCase() === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePresetClick(p.key)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${isActive
                        ? 'bg-rose-50 text-[#991B1B] font-semibold'
                        : 'text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    <span>{p.label}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-[#991B1B]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Form */}
            <div className="border-t border-[#F0EBE6] pt-2 space-y-2">
              <span className="text-[11px] font-medium text-stone-500 block">Tùy chỉnh ngày:</span>
              <form onSubmit={handleCustomDateSubmit} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Từ ngày</label>
                    <input
                      type="date"
                      value={customDateStart || ''}
                      onChange={(e) => onCustomDateChange(e.target.value, customDateEnd)}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E7E5E4] text-[11px] text-stone-800 focus:outline-none focus:border-[#991B1B]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Đến ngày</label>
                    <input
                      type="date"
                      value={customDateEnd || ''}
                      onChange={(e) => onCustomDateChange(customDateStart, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E7E5E4] text-[11px] text-stone-800 focus:outline-none focus:border-[#991B1B]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleClearCustomDate}
                    className="text-[11px] text-stone-500 hover:text-stone-800"
                  >
                    Xóa lọc
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="h-7 px-3 text-[11px] rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-white"
                  >
                    Áp dụng
                  </Button>
                </div>
              </form>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 5. Action Buttons: Refresh & CSV */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-11 px-4 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 text-xs sm:text-[13px] font-sans shadow-2xs inline-flex items-center gap-2"
          title="Làm mới dữ liệu"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#991B1B]' : 'text-stone-500'}`} />
          <span>Làm mới</span>
        </Button>

        {onExportCSV && (
          <Button
            type="button"
            variant="outline"
            onClick={onExportCSV}
            className="h-11 px-4 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 text-xs sm:text-[13px] font-sans shadow-2xs inline-flex items-center gap-2"
            title="Xuất CSV đối soát"
          >
            <Download className="h-4 w-4 text-stone-500" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </Button>
        )}
      </div>
    </div>
  );
};

