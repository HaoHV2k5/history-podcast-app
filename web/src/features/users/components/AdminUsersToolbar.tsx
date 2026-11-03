import React from 'react';
import { Search, Calendar, Filter, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface AdminUsersToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  roleValue: string;
  onRoleChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  dateRangeValue: string;
  onDateRangeChange: (value: string) => void;
  onToggleAdvancedFilter?: () => void;
  isAdvancedOpen?: boolean;
  onOpenCreateModal: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'CREATOR', label: 'CREATOR (Sáng tạo)' },
  { value: 'VIEWER', label: 'USER (Thính giả)' },
  { value: 'ADMIN', label: 'ADMIN (Quản trị)' },
  { value: 'NARRATOR', label: 'NARRATOR (Thuyết minh)' },
  { value: 'FREELANCER', label: 'FREELANCER (Cộng tác)' },
];

export const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'TEMP_LOCKED', label: 'Tạm khóa' },
  { value: 'LOCKED', label: 'Bị khóa' },
  { value: 'INACTIVE', label: 'Chờ xác thực' },
];

export const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'Thời gian đăng ký' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
];

export const AdminUsersToolbar: React.FC<AdminUsersToolbarProps> = ({
  searchValue,
  onSearchChange,
  roleValue,
  onRoleChange,
  statusValue,
  onStatusChange,
  dateRangeValue,
  onDateRangeChange,
  onToggleAdvancedFilter,
  isAdvancedOpen,
  onOpenCreateModal,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        {/* Left: Search input + Select Dropdowns */}
        <div className="flex flex-1 flex-wrap lg:flex-nowrap items-center gap-2 min-w-0">
          {/* Search box with search icon */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-8 text-xs text-stone-800 placeholder-stone-400 transition-colors focus:border-[#C52227] focus:outline-none focus:ring-1 focus:ring-[#C52227]"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Select: Tất cả vai trò */}
          <div className="relative w-auto min-w-[125px] shrink-0">
            <select
              value={roleValue}
              onChange={(e) => onRoleChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-7 text-xs text-stone-700 transition-colors focus:border-[#C52227] focus:outline-none focus:ring-1 focus:ring-[#C52227] cursor-pointer"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          </div>

          {/* Select: Tất cả trạng thái */}
          <div className="relative w-auto min-w-[140px] shrink-0">
            <select
              value={statusValue}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-7 text-xs text-stone-700 transition-colors focus:border-[#C52227] focus:outline-none focus:ring-1 focus:ring-[#C52227] cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          </div>

          {/* Select: Thời gian đăng ký (with Calendar icon) */}
          <div className="relative w-auto min-w-[160px] shrink-0">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <select
              value={dateRangeValue}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-7 pr-7 text-xs text-stone-700 transition-colors focus:border-[#C52227] focus:outline-none focus:ring-1 focus:ring-[#C52227] cursor-pointer"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          </div>

          {/* Reset Filters button if active */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-10 px-2 text-xs text-stone-500 hover:text-[#C52227] shrink-0 whitespace-nowrap"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Right: Advanced filter button + Add User CTA */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-auto">
          {/* Button: Bộ lọc nâng cao */}
          <Button
            type="button"
            variant="outline"
            onClick={onToggleAdvancedFilter}
            className={cn(
              'h-10 rounded-lg border-[#E5E7EB] bg-white px-3.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs transition-colors shrink-0 whitespace-nowrap',
              isAdvancedOpen && 'bg-stone-100 border-[#D6D3D1]'
            )}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
            <span>Bộ lọc nâng cao</span>
          </Button>

          {/* Button: + Thêm người dùng (Primary Crimson CTA matching mockup) */}
          <Button
            type="button"
            onClick={onOpenCreateModal}
            className="h-10 rounded-lg bg-[#C52227] hover:bg-[#A81B20] active:scale-[0.98] text-white px-4 text-xs font-semibold shadow-xs transition-all duration-150 shrink-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Thêm người dùng</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

