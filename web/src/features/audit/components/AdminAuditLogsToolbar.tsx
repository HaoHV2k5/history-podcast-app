import React, { useState } from 'react';
import {
  Search,
  Calendar,
  RotateCw,
  Download,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import type {
  AuditActionFilter,
  AuditActorOption,
  AuditLogCategoryFilter,
} from '../auditLogsLogic';

export interface AdminAuditLogsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: AuditLogCategoryFilter;
  onCategoryFilterChange: (val: AuditLogCategoryFilter) => void;
  actionFilter: AuditActionFilter;
  onActionFilterChange: (val: AuditActionFilter) => void;
  actorFilter: string;
  onActorFilterChange: (val: string) => void;
  actorOptions: AuditActorOption[];
  dateRangePreset: string;
  onDateRangePresetChange: (preset: string) => void;
  customDateStart?: string;
  customDateEnd?: string;
  onCustomDateChange: (start?: string, end?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCsv: () => void;
}

const LOG_CATEGORY_OPTIONS: { value: AuditLogCategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả phân loại' },
  { value: 'SYSTEM', label: 'Hệ thống' },
  { value: 'USER', label: 'Người dùng' },
  { value: 'SECURITY', label: 'Bảo mật' },
];

const ACTION_OPTIONS: { value: AuditActionFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả hành động' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'APPROVE', label: 'Duyệt' },
  { value: 'LOGIN', label: 'Đăng nhập' },
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'REJECT', label: 'Từ chối' },
  { value: 'GRANT_ROLE', label: 'Phân quyền' },
  { value: 'LOGOUT', label: 'Đăng xuất' },
];

export const AdminAuditLogsToolbar: React.FC<AdminAuditLogsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  actionFilter,
  onActionFilterChange,
  actorFilter,
  onActorFilterChange,
  actorOptions,
  dateRangePreset,
  onDateRangePresetChange,
  customDateStart,
  customDateEnd,
  onCustomDateChange,
  onRefresh,
  isRefreshing = false,
  onExportCsv,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);

  const getDateRangeLabel = () => {
    if (dateRangePreset === 'today') return 'Hôm nay';
    if (dateRangePreset === '7d') return '7 ngày qua';
    if (dateRangePreset === '30d') return '30 ngày qua';
    if (dateRangePreset === '90d') return '90 ngày qua';
    if (dateRangePreset === 'custom') {
      if (customDateStart && customDateEnd) {
        return `${customDateStart} → ${customDateEnd}`;
      }
      if (customDateStart) return `Từ ${customDateStart}`;
      if (customDateEnd) return `Đến ${customDateEnd}`;
      return 'Tùy chỉnh ngày';
    }
    return 'Chọn khoảng thời gian';
  };

  // Nhấp lại lựa chọn đang chọn sẽ tự động bỏ chọn về 'all' (Tất cả thời gian)
  const handlePresetClick = (preset: string) => {
    if (dateRangePreset === preset && preset !== 'all') {
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
    <div className="relative z-30 flex flex-col xl:flex-row xl:items-center gap-2.5 sm:gap-3 select-none font-sans">
      {/* 1. Ô tìm kiếm lớn bên trái chuẩn ảnh mẫu */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo mã nhật ký, hành động, người thực hiện..."
          aria-label="Tìm kiếm theo mã nhật ký, hành động, người thực hiện"
          className="w-full rounded-xl border border-[#E7E5E4] bg-white py-2.5 pl-10 pr-9 text-xs sm:text-[13px] text-stone-800 placeholder:text-stone-400 shadow-2xs transition-colors focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Xóa từ khóa tìm kiếm"
            title="Xóa từ khóa tìm kiếm"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Dãy bộ lọc & nút thao tác bên phải chuẩn ảnh mẫu */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Bộ lọc 1: Tất cả phân loại */}
        <div className="relative min-w-[140px]">
          <select
            aria-label="Lọc theo phân loại nhật ký"
            value={categoryFilter}
            onChange={(e) =>
              onCategoryFilterChange(e.target.value as AuditLogCategoryFilter)
            }
            className={`w-full appearance-none rounded-xl border py-2.5 pl-3.5 pr-8 text-xs sm:text-[13px] font-medium shadow-2xs transition-colors focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] cursor-pointer ${
              categoryFilter !== 'ALL'
                ? 'border-[#991B1B] bg-[#FFF0F2]/50 text-[#991B1B] font-semibold'
                : 'border-[#E7E5E4] bg-white text-stone-700 hover:border-stone-300'
            }`}
          >
            {LOG_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        </div>

        {/* Bộ lọc 2: Tất cả hành động */}
        <div className="relative min-w-[150px]">
          <select
            aria-label="Lọc theo loại hành động"
            value={actionFilter}
            onChange={(e) =>
              onActionFilterChange(e.target.value as AuditActionFilter)
            }
            className={`w-full appearance-none rounded-xl border py-2.5 pl-3.5 pr-8 text-xs sm:text-[13px] font-medium shadow-2xs transition-colors focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] cursor-pointer ${
              actionFilter !== 'ALL'
                ? 'border-[#991B1B] bg-[#FFF0F2]/50 text-[#991B1B] font-semibold'
                : 'border-[#E7E5E4] bg-white text-stone-700 hover:border-stone-300'
            }`}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        </div>

        {/* Bộ lọc 3: Tất cả người thực hiện */}
        <div className="relative min-w-[168px] max-w-[220px]">
          <select
            aria-label="Lọc theo người thực hiện"
            value={actorFilter}
            onChange={(e) => onActorFilterChange(e.target.value)}
            className={`w-full appearance-none rounded-xl border py-2.5 pl-3.5 pr-8 text-xs sm:text-[13px] font-medium shadow-2xs transition-colors focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] cursor-pointer truncate ${
              actorFilter !== 'ALL'
                ? 'border-[#991B1B] bg-[#FFF0F2]/50 text-[#991B1B] font-semibold'
                : 'border-[#E7E5E4] bg-white text-stone-700 hover:border-stone-300'
            }`}
          >
            <option value="ALL">Tất cả người thực hiện</option>
            {actorOptions.map((actor) => (
              <option key={actor.value} value={actor.value}>
                {actor.label} ({actor.count})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        </div>

        {/* Hộp chọn Khoảng thời gian: Cổng hiển thị z-[999] + Bỏ chọn nhanh */}
        <DropdownMenu open={isDateOpen} onOpenChange={setIsDateOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-3.5 text-xs sm:text-[13px] font-medium shadow-2xs transition-colors cursor-pointer shrink-0 ${
                dateRangePreset !== 'all'
                  ? 'border-[#991B1B] bg-[#FFF0F2]/50 text-[#991B1B] font-semibold'
                  : 'border-[#E7E5E4] bg-white text-stone-700 hover:border-stone-300'
              }`}
            >
              <Calendar className="h-4 w-4 text-stone-500 shrink-0" />
              <span className="whitespace-nowrap">{getDateRangeLabel()}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="w-72 p-3.5 bg-white rounded-2xl border border-[#F0EBE6] shadow-xl text-xs space-y-3 z-[999] duration-200 ease-out font-sans"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-800">
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
                  className="text-[11px] font-semibold text-[#991B1B] hover:underline cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>

            <div className="space-y-1">
              {[
                { id: 'all', label: 'Tất cả thời gian' },
                { id: 'today', label: 'Hôm nay' },
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
                        ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tùy chỉnh ngày */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-semibold text-stone-500 block">
                Tùy chỉnh khoảng ngày
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customDateStart || ''}
                    onChange={(e) => {
                      onDateRangePresetChange('custom');
                      onCustomDateChange(e.target.value, customDateEnd);
                    }}
                    className="w-full rounded-lg border border-[#E7E5E4] px-2 py-1 text-xs text-stone-700 focus:border-[#991B1B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customDateEnd || ''}
                    onChange={(e) => {
                      onDateRangePresetChange('custom');
                      onCustomDateChange(customDateStart, e.target.value);
                    }}
                    className="w-full rounded-lg border border-[#E7E5E4] px-2 py-1 text-xs text-stone-700 focus:border-[#991B1B] focus:outline-none"
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

        {/* Nút Làm mới */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-stone-700 shadow-2xs transition-all hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] disabled:opacity-50 cursor-pointer shrink-0"
          title="Làm mới dữ liệu nhật ký hệ thống từ máy chủ"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${
              isRefreshing ? 'animate-spin text-[#991B1B]' : 'text-stone-600'
            }`}
          />
          <span className="whitespace-nowrap">Làm mới</span>
        </button>

        {/* Nút Xuất báo cáo */}
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-700 shadow-2xs transition-all hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] cursor-pointer shrink-0"
          title="Xuất danh sách nhật ký đang hiển thị ra tệp dữ liệu bảng tính"
        >
          <Download className="h-3.5 w-3.5 text-stone-600" />
          <span className="hidden 2xl:inline whitespace-nowrap">Xuất báo cáo</span>
        </button>
      </div>
    </div>
  );
};
