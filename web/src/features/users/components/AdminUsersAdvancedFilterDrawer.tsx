import React from 'react';
import { Download, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUsersAdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  onRoleChange: (r: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  dateRange: string;
  onDateRangeChange: (d: string) => void;
  hasChannelFilter: string; // 'all' | 'has_channel' | 'no_channel'
  onHasChannelFilterChange: (val: string) => void;
  onReset: () => void;
  onExportCSV: () => void;
}

export const AdminUsersAdvancedFilterDrawer: React.FC<AdminUsersAdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  role,
  onRoleChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  hasChannelFilter,
  onHasChannelFilterChange,
  onReset,
  onExportCSV,
}) => {
  if (!isOpen) return null;

  return (
    <div className="rounded-2xl border border-[#F0EBE6] bg-white p-5 shadow-sm transition-all duration-200 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h4 className="text-xs font-bold text-[#1F1612] uppercase tracking-wider">
          Bộ lọc nâng cao & Tiện ích xuất dữ liệu
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 p-1 rounded"
          aria-label="Đóng bộ lọc nâng cao"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Role */}
        <div className="space-y-1">
          <label className="font-semibold text-stone-700 block">Vai trò tài khoản</label>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white px-2.5 text-xs text-[#1F1612] focus:border-[#991B1B] focus:outline-none cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="CREATOR">Nhà sáng tạo (CREATOR)</option>
            <option value="VIEWER">Thính giả (VIEWER)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="NARRATOR">Thuyết minh viên (NARRATOR)</option>
            <option value="FREELANCER">Cộng tác viên (FREELANCER)</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="font-semibold text-stone-700 block">Trạng thái hoạt động</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white px-2.5 text-xs text-[#1F1612] focus:border-[#991B1B] focus:outline-none cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="TEMP_LOCKED">Tạm khóa</option>
            <option value="LOCKED">Bị khóa</option>
            <option value="INACTIVE">Chưa kích hoạt</option>
          </select>
        </div>

        {/* Date range */}
        <div className="space-y-1">
          <label className="font-semibold text-stone-700 block">Khoảng thời gian đăng ký</label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white px-2.5 text-xs text-[#1F1612] focus:border-[#991B1B] focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="7d">Trong 7 ngày qua</option>
            <option value="30d">Trong 30 ngày qua</option>
            <option value="90d">Trong 90 ngày qua</option>
          </select>
        </div>

        {/* Has Channel */}
        <div className="space-y-1">
          <label className="font-semibold text-stone-700 block">Sở hữu Kênh Podcast</label>
          <select
            value={hasChannelFilter}
            onChange={(e) => onHasChannelFilterChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white px-2.5 text-xs text-[#1F1612] focus:border-[#991B1B] focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="has_channel">Đã tạo kênh phát thanh</option>
            <option value="no_channel">Chưa tạo kênh phát thanh</option>
          </select>
        </div>
      </div>

      {/* Footer controls: Reset filters & Export CSV */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-stone-500 hover:text-stone-800"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          <span>Đặt lại mặc định</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          className="text-xs border-[#E7E5E4] text-[#991B1B] hover:bg-[#FFF5F5] hover:border-[#991B1B]"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          <span>Xuất dữ liệu CSV</span>
        </Button>
      </div>
    </div>
  );
};

