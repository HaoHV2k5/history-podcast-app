import React, { useState } from 'react';
import {
  Search,
  Plus,
  RotateCw,
  Download,
  ChevronDown,
  Check,
  X,
  Filter,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import type { RoleCategoryFilter, RoleUsageFilter } from '../rolesLogic';

interface AdminRolesToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: RoleCategoryFilter;
  onCategoryFilterChange: (val: RoleCategoryFilter) => void;
  usageFilter: RoleUsageFilter;
  onUsageFilterChange: (val: RoleUsageFilter) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportCsv: () => void;
  onOpenCreateRole: () => void;
  onOpenAssignUserRole: () => void;
}

const CATEGORY_OPTIONS: { value: RoleCategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả nhóm quyền' },
  { value: 'ADMIN_PRIVILEGE', label: 'Đặc quyền Quản trị' },
  { value: 'CREATOR_ECONOMY', label: 'Sáng tạo & Thuyết minh' },
  { value: 'STANDARD_USER', label: 'Thính giả & Tùy chỉnh' },
];

const USAGE_OPTIONS: { value: RoleUsageFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả phạm vi' },
  { value: 'CORE', label: 'Vai trò chuẩn hệ thống' },
  { value: 'CUSTOM', label: 'Vai trò mở rộng' },
  { value: 'WITH_USERS', label: 'Đã có người dùng sở hữu' },
  { value: 'EMPTY_USERS', label: 'Chưa có người dùng' },
];

export const AdminRolesToolbar: React.FC<AdminRolesToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  usageFilter,
  onUsageFilterChange,
  onRefresh,
  isRefreshing = false,
  onExportCsv,
  onOpenCreateRole,
  onOpenAssignUserRole,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilter = categoryFilter !== 'ALL' || usageFilter !== 'ALL';

  const getActiveFilterSummary = () => {
    const parts: string[] = [];
    if (categoryFilter !== 'ALL') {
      const found = CATEGORY_OPTIONS.find((c) => c.value === categoryFilter);
      if (found) parts.push(found.label);
    }
    if (usageFilter !== 'ALL') {
      const found = USAGE_OPTIONS.find((u) => u.value === usageFilter);
      if (found) parts.push(found.label);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Bộ lọc vai trò';
  };

  return (
    <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 select-none font-sans">
      {/* Left: Search Box matching mockup */}
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên vai trò, mô tả, quyền hạn..."
          aria-label="Tìm kiếm theo tên vai trò, mô tả, quyền hạn"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] shadow-2xs transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded transition-colors cursor-pointer"
            title="Xóa từ khóa tìm kiếm"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right: Filter Popover, Refresh, Export CSV, Assign User Role & + Thêm vai trò */}
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0">
        {/* Filter Popover (Radix Portal z-[999] with Toggle-Off) */}
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-[13px] font-medium shadow-2xs shrink-0 cursor-pointer transition-colors ${hasActiveFilter
                  ? 'border-[#991B1B] text-[#991B1B] bg-[#FFF0F2]/60 font-semibold'
                  : 'border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                }`}
            >
              <Filter className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[180px]">
                {getActiveFilterSummary()}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 p-3 rounded-2xl bg-white border border-[#F0EBE6] shadow-xl z-[999] duration-200 ease-out font-sans text-xs sm:text-[13px] space-y-3"
          >
            {/* Header with Reset inside popover */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE6]">
              <span className="font-bold text-stone-900 text-xs">
                Lọc danh sách vai trò
              </span>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    onCategoryFilterChange('ALL');
                    onUsageFilterChange('ALL');
                    setIsFilterOpen(false);
                  }}
                  className="text-[11px] font-semibold text-[#991B1B] hover:underline cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {/* Section 1: Nhóm quyền (Toggle-Off supported) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-500 block">
                Theo nhóm chức năng
              </span>
              <div className="space-y-1">
                {CATEGORY_OPTIONS.map((opt) => {
                  const isSelected = categoryFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onCategoryFilterChange(
                          isSelected && opt.value !== 'ALL' ? 'ALL' : opt.value
                        );
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${isSelected
                          ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                          : 'text-stone-700 hover:bg-stone-50'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Phạm vi sử dụng (Toggle-Off supported) */}
            <div className="space-y-1.5 pt-2 border-t border-[#F0EBE6]">
              <span className="text-[11px] font-semibold text-stone-500 block">
                Theo trạng thái phân bổ
              </span>
              <div className="space-y-1">
                {USAGE_OPTIONS.map((opt) => {
                  const isSelected = usageFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onUsageFilterChange(
                          isSelected && opt.value !== 'ALL' ? 'ALL' : opt.value
                        );
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${isSelected
                          ? 'bg-[#FFF0F2] text-[#991B1B] font-semibold'
                          : 'text-stone-700 hover:bg-stone-50'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Nút Phân quyền tài khoản nhanh */}
        <button
          type="button"
          onClick={onOpenAssignUserRole}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 active:scale-[0.97] font-semibold shadow-2xs shrink-0 cursor-pointer transition-all"
          title="Gán hoặc thay đổi vai trò chính cho tài khoản người dùng"
        >
          <UserPlus className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
          <span className="hidden sm:inline">Gán quyền tài khoản</span>
        </button>

        {/* Nút Làm mới [⟳ Làm mới] */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 active:scale-[0.97] font-medium shadow-2xs shrink-0 cursor-pointer transition-all disabled:opacity-50"
          title="Làm mới dữ liệu vai trò và tài khoản"
        >
          <RotateCw
            className={`h-3.5 w-3.5 text-stone-600 ${isRefreshing ? 'animate-spin text-[#991B1B]' : ''
              }`}
          />
          <span className="hidden xl:inline">Làm mới</span>
        </button>

        {/* Nút Xuất CSV [⬇ Xuất CSV] */}
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-700 hover:bg-stone-50 active:scale-[0.97] font-medium shadow-2xs shrink-0 cursor-pointer transition-all"
          title="Xuất bảng vai trò và thống kê phân quyền ra tệp CSV"
        >
          <Download className="h-3.5 w-3.5 text-stone-600" />
          <span className="hidden xl:inline">Xuất CSV</span>
        </button>

        {/* Primary CTA: [+ Thêm vai trò] matching mockup */}
        <button
          type="button"
          onClick={onOpenCreateRole}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C81E1E] hover:bg-[#991B1B] active:scale-[0.97] text-xs sm:text-[13px] font-semibold text-white shadow-xs shrink-0 cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.2] shrink-0" />
          <span className="whitespace-nowrap">Thêm vai trò</span>
        </button>
      </div>
    </div>
  );
};

