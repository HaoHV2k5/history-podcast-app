import React from 'react';
import { Users, CheckCircle2, Ban, UserCheck } from 'lucide-react';
import type { RoleKpis } from '../rolesLogic';

interface AdminRolesStatCardsProps {
  kpis: RoleKpis;
  isLoading?: boolean;
  onInspectMultiRoleAccounts?: () => void;
}

export const AdminRolesStatCards: React.FC<AdminRolesStatCardsProps> = ({
  kpis,
  isLoading = false,
  onInspectMultiRoleAccounts,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none font-sans">
      {/* 1. Tổng vai trò */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <Users className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Tổng vai trò
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
              {isLoading ? '—' : kpis.totalRoles}
            </span>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#FDA4AF]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FB7185]" />
              <span className="w-1.5 h-6 rounded-full bg-[#E11D48]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {kpis.totalRoles > 0
              ? 'Đang định nghĩa trên hệ thống'
              : 'Chưa có vai trò nào'}
          </span>
        </div>
      </div>

      {/* 2. Vai trò đang hoạt động */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669]">
          <CheckCircle2 className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Vai trò đang hoạt động
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
              {isLoading ? '—' : kpis.activeRoles}
            </span>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#A7F3D0]" />
              <span className="w-1.5 h-4 rounded-full bg-[#34D399]" />
              <span className="w-1.5 h-6 rounded-full bg-[#059669]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {kpis.activeRoles > 0
              ? 'Sẵn sàng gán quyền hệ thống'
              : 'Không có vai trò hoạt động'}
          </span>
        </div>
      </div>

      {/* 3. Vai trò bị vô hiệu */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <Ban className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Vai trò bị vô hiệu
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
              {isLoading ? '—' : kpis.disabledRoles}
            </span>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-6 rounded-full bg-[#FECDD3]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FDA4AF]" />
              <span className="w-1.5 h-2.5 rounded-full bg-[#E11D48]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            Không có vai trò bị tạm ngưng
          </span>
        </div>
      </div>

      {/* 4. Tài khoản có đa vai trò */}
      <div
        role={onInspectMultiRoleAccounts ? 'button' : undefined}
        tabIndex={onInspectMultiRoleAccounts ? 0 : undefined}
        onClick={onInspectMultiRoleAccounts}
        onKeyDown={(e) => {
          if (onInspectMultiRoleAccounts && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onInspectMultiRoleAccounts();
          }
        }}
        title={
          onInspectMultiRoleAccounts
            ? 'Nhấp để xem danh sách tài khoản có đa vai trò'
            : undefined
        }
        className={`flex items-center gap-3.5 p-4 rounded-2xl border border-[#F0EBE6] bg-white shadow-xs transition-all hover:shadow-sm ${onInspectMultiRoleAccounts
            ? 'cursor-pointer hover:border-[#FECDD3] active:scale-[0.99]'
            : ''
          }`}
      >
        <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <UserCheck className="h-6 w-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
            Tài khoản có đa vai trò
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
              {isLoading ? '—' : kpis.multiRoleAccountsCount}
            </span>
            <div className="flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-2.5 rounded-full bg-[#FDA4AF]" />
              <span className="w-1.5 h-4 rounded-full bg-[#FB7185]" />
              <span className="w-1.5 h-6 rounded-full bg-[#E11D48]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate mt-1">
            {kpis.totalAccountsCount > 0
              ? `Trên tổng ${kpis.totalAccountsCount} tài khoản hệ thống`
              : 'Đồng sở hữu từ 2 vai trò trở lên'}
          </span>
        </div>
      </div>
    </div>
  );
};

