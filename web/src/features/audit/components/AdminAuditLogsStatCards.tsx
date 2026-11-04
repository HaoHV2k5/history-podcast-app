import React from 'react';
import {
  FileText,
  User,
  Settings,
  Shield,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type {
  AuditLogCategoryFilter,
  AuditLogKpis,
} from '../auditLogsLogic';

interface AdminAuditLogsStatCardsProps {
  kpis: AuditLogKpis;
  activeCategory: AuditLogCategoryFilter;
  onSelectCategory: (category: AuditLogCategoryFilter) => void;
  isLoading?: boolean;
}

function renderTrendBadge(totalLogs: number, trendPercent: number) {
  if (totalLogs <= 0 || trendPercent === 0) return null;
  const isPositive = trendPercent > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums whitespace-nowrap ${isPositive ? 'text-[#059669]' : 'text-[#E11D48]'
        }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>
        {isPositive ? '+' : ''}
        {trendPercent}%
      </span>
    </span>
  );
}

export const AdminAuditLogsStatCards: React.FC<AdminAuditLogsStatCardsProps> = ({
  kpis,
  activeCategory,
  onSelectCategory,
  isLoading = false,
}) => {
  const handleCardToggle = (target: AuditLogCategoryFilter) => {
    if (target === 'ALL') {
      onSelectCategory('ALL');
      return;
    }
    onSelectCategory(activeCategory === target ? 'ALL' : target);
  };

  const getTotalSubtitle = () => {
    if (kpis.totalLogs <= 0) {
      return 'Chưa có bản ghi nhật ký nào';
    }
    if (kpis.diff7dCount !== 0) {
      const prefix = kpis.diff7dCount > 0 ? '+' : '';
      return `${prefix}${kpis.diff7dCount.toLocaleString('vi-VN')} bản ghi so với 7 ngày trước`;
    }
    return 'Toàn bộ lịch sử ghi nhận hệ thống';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none font-sans">
      {/* 1. Tổng số nhật ký */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleCardToggle('ALL')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardToggle('ALL');
          }
        }}
        aria-pressed={activeCategory === 'ALL'}
        title="Nhấp để hiển thị toàn bộ nhật ký hệ thống"
        className={`flex items-center gap-3.5 p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer active:scale-[0.99] ${activeCategory === 'ALL'
            ? 'border-[#FECDD3] ring-1 ring-[#FFE4E6] hover:shadow-sm'
            : 'border-[#F0EBE6] hover:border-[#FECDD3] hover:shadow-sm'
          }`}
      >
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <FileText className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Tổng số nhật ký
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.totalLogs.toLocaleString('vi-VN')}
              </span>
              {!isLoading && renderTrendBadge(kpis.totalLogs, kpis.totalTrendPercent)}
            </div>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#FECDD3]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FDA4AF]" />
              <span className="w-1.5 h-6 rounded-full bg-[#FB7185]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {getTotalSubtitle()}
          </span>
        </div>
      </div>

      {/* 2. Nhật ký người dùng */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleCardToggle('USER')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardToggle('USER');
          }
        }}
        aria-pressed={activeCategory === 'USER'}
        title="Nhấp để lọc Nhật ký người dùng (nhấp lại để bỏ lọc)"
        className={`flex items-center gap-3.5 p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer active:scale-[0.99] ${activeCategory === 'USER'
            ? 'border-[#FDE68A] ring-1 ring-[#FEF3C7] bg-[#FFFBEB]/25 hover:shadow-sm'
            : 'border-[#F0EBE6] hover:border-[#FDE68A] hover:shadow-sm'
          }`}
      >
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706]">
          <User className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Nhật ký người dùng
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.userLogsCount.toLocaleString('vi-VN')}
              </span>
              {!isLoading &&
                renderTrendBadge(kpis.userLogsCount, kpis.userTrendPercent)}
            </div>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#FEF3C7]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FDE68A]" />
              <span className="w-1.5 h-6 rounded-full bg-[#FBBF24]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            Thao tác từ người dùng &amp; kênh
          </span>
        </div>
      </div>

      {/* 3. Nhật ký hệ thống */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleCardToggle('SYSTEM')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardToggle('SYSTEM');
          }
        }}
        aria-pressed={activeCategory === 'SYSTEM'}
        title="Nhấp để lọc Nhật ký hệ thống (nhấp lại để bỏ lọc)"
        className={`flex items-center gap-3.5 p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer active:scale-[0.99] ${activeCategory === 'SYSTEM'
            ? 'border-[#A7F3D0] ring-1 ring-[#D1FAE5] bg-[#ECFDF5]/25 hover:shadow-sm'
            : 'border-[#F0EBE6] hover:border-[#A7F3D0] hover:shadow-sm'
          }`}
      >
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669]">
          <Settings className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Nhật ký hệ thống
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.systemLogsCount.toLocaleString('vi-VN')}
              </span>
              {!isLoading &&
                renderTrendBadge(kpis.systemLogsCount, kpis.systemTrendPercent)}
            </div>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#D1FAE5]" />
              <span className="w-1.5 h-4 rounded-full bg-[#A7F3D0]" />
              <span className="w-1.5 h-6 rounded-full bg-[#6EE7B7]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            Thao tác cấu hình, vận hành
          </span>
        </div>
      </div>

      {/* 4. Nhật ký bảo mật */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleCardToggle('SECURITY')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardToggle('SECURITY');
          }
        }}
        aria-pressed={activeCategory === 'SECURITY'}
        title="Nhấp để lọc Nhật ký bảo mật (nhấp lại để bỏ lọc)"
        className={`flex items-center gap-3.5 p-4 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer active:scale-[0.99] ${activeCategory === 'SECURITY'
            ? 'border-[#FECDD3] ring-1 ring-[#FFE4E6] bg-[#FFF0F2]/25 hover:shadow-sm'
            : 'border-[#F0EBE6] hover:border-[#FECDD3] hover:shadow-sm'
          }`}
      >
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <Shield className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Nhật ký bảo mật
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                {isLoading ? '—' : kpis.securityLogsCount.toLocaleString('vi-VN')}
              </span>
              {!isLoading &&
                renderTrendBadge(kpis.securityLogsCount, kpis.securityTrendPercent)}
            </div>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#FECDD3]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FDA4AF]" />
              <span className="w-1.5 h-6 rounded-full bg-[#FB7185]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            Đăng nhập, phân quyền, cảnh báo
          </span>
        </div>
      </div>
    </div>
  );
};

