import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  X,
  Shield,
  CheckCircle2,
  Users,
  Search,
  Pencil,
  UserPlus,
  KeyRound,
  ArrowUpRight,
} from 'lucide-react';
import type { UserResponse } from '@/types/auth';
import {
  AdminRoleRow,
  extractUserInitials,
  getRoleVietnameseLabel,
  getUserRolesList,
  normalizeRoleCode,
  removeVietnameseTones,
} from '../rolesLogic';

interface AdminRoleDetailModalProps {
  roleRow: AdminRoleRow | null;
  onClose: () => void;
  onEditRole: (row: AdminRoleRow) => void;
  onAssignRoleToUser: (row: AdminRoleRow, targetUser?: UserResponse) => void;
}

export const AdminRoleDetailModal: React.FC<AdminRoleDetailModalProps> = ({
  roleRow,
  onClose,
  onEditRole,
  onAssignRoleToUser,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'permissions'>('accounts');
  const [userSearch, setUserSearch] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState<'ALL' | 'PRIMARY' | 'SECONDARY'>('ALL');

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleRow) return;
    setActiveTab('accounts');
    setUserSearch('');
    setRoleTypeFilter('ALL');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roleRow, onClose]);

  // GSAP Modal Entrance Animation (60fps GPU-composited)
  useEffect(() => {
    if (!roleRow) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: 'power2.out' }
        );
      }
      if (panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 12, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.26,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        );
      }
    });

    return () => ctx.revert();
  }, [roleRow]);

  const filteredUsers = useMemo(() => {
    if (!roleRow) return [];
    const rawQuery = userSearch.trim().toLowerCase();
    const normQuery = removeVietnameseTones(rawQuery).toLowerCase();

    return roleRow.assignedUsers.filter((u) => {
      const isPrimary = normalizeRoleCode(u.roleName) === roleRow.name;
      if (roleTypeFilter === 'PRIMARY' && !isPrimary) return false;
      if (roleTypeFilter === 'SECONDARY' && isPrimary) return false;

      if (rawQuery) {
        const hay = `${u.fullName || ''} ${u.email || ''} ${u.phone || ''} #${u.id}`.toLowerCase();
        const normHay = removeVietnameseTones(hay).toLowerCase();
        if (!hay.includes(rawQuery) && !normHay.includes(normQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [roleRow, userSearch, roleTypeFilter]);

  // GSAP Staggered List / Tab Content Animation
  useEffect(() => {
    if (!roleRow || !listContainerRef.current) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const items = listContainerRef.current?.querySelectorAll('[data-gsap-row]');
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.025,
            ease: 'power2.out',
            clearProps: 'transform',
          }
        );
      }
    }, listContainerRef);

    return () => ctx.revert();
  }, [roleRow, activeTab, roleTypeFilter]);

  if (!roleRow || typeof document === 'undefined') return null;

  const getUserStatusMeta = (status?: string) => {
    const code = (status || 'ACTIVE').toUpperCase();
    if (code === 'ACTIVE') {
      return {
        label: 'Hoạt động',
        dotClass: 'bg-[#059669]',
        badgeClass: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]',
      };
    }
    if (code === 'LOCKED' || code === 'TEMP_LOCKED') {
      return {
        label: 'Bị khóa',
        dotClass: 'bg-[#E11D48]',
        badgeClass: 'bg-[#FFF0F2] border-[#FECDD3] text-[#E11D48]',
      };
    }
    return {
      label: 'Ngưng hoạt động',
      dotClass: 'bg-stone-400',
      badgeClass: 'bg-stone-100 border-stone-200 text-stone-600',
    };
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 font-sans overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-detail-modal-title"
    >
      {/* Full-viewport Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-[2px] overflow-hidden overscroll-contain"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Compact, Refined Modal Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#EAE4DC] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[86vh] overscroll-contain"
      >
        {/* 1. Compact Header */}
        <div className="px-5 py-4 border-b border-[#F0EBE6] bg-[#FAF8F5] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="role-detail-modal-title"
                  className="text-base font-bold text-stone-900 leading-snug"
                >
                  Vai trò {roleRow.shortLabel}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-600 text-[11px] font-semibold tabular-nums whitespace-nowrap">
                  Mã #{roleRow.id}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[11px] font-semibold whitespace-nowrap">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>{roleRow.statusLabel}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                {roleRow.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết vai trò"
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-[0.95] flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Unified Sub-Navigation & Summary Metrics Bar */}
        <div className="px-5 py-2.5 border-b border-[#F0EBE6] bg-white flex flex-wrap items-center justify-between gap-2.5">
          {/* Segmented Tab Switcher */}
          <div className="inline-flex items-center rounded-xl bg-[#F5F2EE] p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-white text-[#991B1B] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Tài khoản phân quyền ({roleRow.userCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-white text-[#991B1B] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              <span>Phạm vi quyền hạn ({roleRow.permissionScopes.length})</span>
            </button>
          </div>

          {/* Right: Inline Metrics + Primary Action */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold">
              <span className="px-2 py-1 rounded-lg bg-[#FFF0F2] border border-[#FECDD3]/80 text-[#991B1B] tabular-nums whitespace-nowrap">
                Chính: {roleRow.primaryUserCount}
              </span>
              <span className="px-2 py-1 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]/80 text-[#059669] tabular-nums whitespace-nowrap">
                Kiêm nhiệm: {roleRow.secondaryUserCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onAssignRoleToUser(roleRow)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-[0.97] cursor-pointer shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span>Gán vai trò</span>
            </button>
          </div>
        </div>

        {/* 3. Scrollable Content Area */}
        <div
          ref={listContainerRef}
          className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs text-stone-700 overscroll-contain bg-[#FAF8F5]/40"
        >
          {activeTab === 'accounts' ? (
            <>
              {/* Compact Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo họ tên, thư điện tử, mã số..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#991B1B] transition-colors"
                  />
                </div>

                <div className="inline-flex items-center rounded-xl border border-[#E7E5E4] bg-white p-0.5 shrink-0 self-start sm:self-auto">
                  {[
                    { id: 'ALL' as const, label: `Tất cả (${roleRow.userCount})` },
                    { id: 'PRIMARY' as const, label: `Chính (${roleRow.primaryUserCount})` },
                    { id: 'SECONDARY' as const, label: `Kiêm nhiệm (${roleRow.secondaryUserCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setRoleTypeFilter((prev) =>
                          prev === tab.id && tab.id !== 'ALL' ? 'ALL' : tab.id
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        roleTypeFilter === tab.id
                          ? 'bg-[#FFF0F2] text-[#991B1B]'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Single-Row Accounts List */}
              {filteredUsers.length === 0 ? (
                <div className="rounded-2xl border border-[#F0EBE6] bg-white p-7 text-center space-y-1.5">
                  <Users className="h-6 w-6 text-stone-400 mx-auto" />
                  <p className="text-xs font-bold text-stone-800">
                    {roleRow.userCount === 0
                      ? `Chưa có tài khoản nào giữ vai trò ${roleRow.shortLabel}`
                      : 'Không tìm thấy tài khoản phù hợp'}
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                    Nhấn nút &ldquo;Gán vai trò&rdquo; ở góc trên để phân quyền cho tài khoản người dùng.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#F2ECE4] rounded-xl border border-[#EAE4DC] bg-white overflow-hidden shadow-2xs">
                  {filteredUsers.map((user) => {
                    const userRoles = getUserRolesList(user);
                    const primaryRole =
                      normalizeRoleCode(user.roleName) || userRoles[0] || 'VIEWER';
                    const displayFullName =
                      (user.fullName && user.fullName.trim()) || 'Chưa cập nhật họ tên';
                    const statusMeta = getUserStatusMeta(user.status);

                    return (
                      <div
                        key={user.id}
                        data-gsap-row
                        className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAF8F5] transition-colors"
                      >
                        {/* Left: Avatar with Status Dot + Full Name + Email */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={displayFullName}
                                className="h-9 w-9 rounded-full object-cover border border-[#E7E5E4]"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] font-bold text-[11px] flex items-center justify-center">
                                {extractUserInitials(user)}
                              </div>
                            )}
                            <span
                              title={statusMeta.label}
                              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusMeta.dotClass}`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="font-bold text-stone-900 text-xs sm:text-[13px] truncate"
                                title={displayFullName}
                              >
                                {displayFullName}
                              </span>
                              <span className="text-[11px] font-medium text-stone-400 tabular-nums shrink-0">
                                #{user.id}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap shrink-0 ${statusMeta.badgeClass}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                            <p
                              className="text-[11.5px] text-stone-500 truncate"
                              title={user.email}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Right: Pure Vietnamese Role Pills + Change Role Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-11 sm:pl-0">
                          <div className="flex flex-wrap items-center sm:justify-end gap-1">
                            {userRoles.map((r) => {
                              const isPrimaryRole = r === primaryRole;
                              return (
                                <span
                                  key={r}
                                  title={
                                    isPrimaryRole
                                      ? `Vai trò chính: ${getRoleVietnameseLabel(r)}`
                                      : `Vai trò kiêm nhiệm: ${getRoleVietnameseLabel(r)}`
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap ${
                                    isPrimaryRole
                                      ? 'bg-[#FFF0F2] border border-[#FECDD3] text-[#991B1B] font-bold'
                                      : 'bg-stone-100 border border-stone-200/80 text-stone-700 font-medium'
                                  }`}
                                >
                                  <span>{getRoleVietnameseLabel(r)}</span>
                                  {isPrimaryRole && (
                                    <span className="text-[10px] font-semibold opacity-75">
                                      • Chính
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => onAssignRoleToUser(roleRow, user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E7E5E4] bg-white text-stone-700 hover:bg-[#FFF0F2] hover:text-[#991B1B] hover:border-[#FECDD3] active:scale-[0.97] text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer"
                            title="Thay đổi vai trò chính cho tài khoản này"
                          >
                            <span>Đổi vai trò</span>
                            <ArrowUpRight className="h-3 w-3 shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              {/* Compact RBAC & Backend Flow Summary */}
              <div
                data-gsap-row
                className="rounded-xl border border-[#EAE4DC] bg-white p-3.5 space-y-1.5 shadow-2xs"
              >
                <span className="font-bold text-stone-900 text-xs block">
                  Cơ chế vận hành &amp; Kiểm soát truy cập tại Máy chủ
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {roleRow.backendFlowSummary}
                </p>
              </div>

              <div className="space-y-2">
                {roleRow.detailedPermissions.map((perm) => (
                  <div
                    key={perm.scope}
                    data-gsap-row
                    className="rounded-xl border border-[#EAE4DC] bg-white p-3.5 space-y-1 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                        <span className="font-bold text-stone-900 text-xs sm:text-[13px]">
                          {perm.scope}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E5E4] text-stone-600 text-[10.5px] font-medium whitespace-nowrap">
                        {perm.mechanism}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 pl-6 leading-relaxed">
                      {perm.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Compact Footer */}
        <div className="px-5 py-3 border-t border-[#F0EBE6] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditRole(roleRow);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
          >
            <Pencil className="h-3.5 w-3.5 text-stone-600" />
            <span>Chỉnh sửa mô tả</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-[#991B1B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#7F1D1D] active:scale-[0.97] transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
