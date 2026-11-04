import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  X,
  UserPlus,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Info,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import type { UserResponse } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';
import {
  AdminRoleRow,
  canModifyUserPrimaryRole,
  extractUserInitials,
  getRoleVietnameseLabel,
  getUserRolesList,
  normalizeRoleCode,
  removeVietnameseTones,
} from '../rolesLogic';

interface AdminAssignUserRoleModalProps {
  open: boolean;
  roles: AdminRoleRow[];
  users: UserResponse[];
  initialRole?: AdminRoleRow | null;
  initialUser?: UserResponse | null;
  onClose: () => void;
  onSubmit: (params: {
    userId: number;
    roleName: string;
    roleId?: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const AdminAssignUserRoleModal: React.FC<AdminAssignUserRoleModalProps> = ({
  open,
  roles,
  users,
  initialRole,
  initialUser,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const currentAdminEmail = useAuthStore((s) => s.user?.email);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('VIEWER');
  const [userSearch, setUserSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setUserSearch('');

    if (initialUser) {
      setSelectedUserId(initialUser.id);
    } else if (users.length > 0) {
      setSelectedUserId(users[0].id);
    } else {
      setSelectedUserId(null);
    }

    if (initialRole) {
      setSelectedRoleName(initialRole.name);
    } else if (initialUser?.roleName) {
      setSelectedRoleName(normalizeRoleCode(initialUser.roleName));
    } else if (roles.length > 0) {
      setSelectedRoleName(roles[0].name);
    } else {
      setSelectedRoleName('VIEWER');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, initialRole, initialUser, users, roles, isSubmitting, onClose]);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const normQ = removeVietnameseTones(q).toLowerCase();
    if (!q) return users.slice(0, 50);

    return users
      .filter((u) => {
        const hay = `${u.fullName || ''} ${u.email || ''} ${u.phone || ''} #${u.id}`.toLowerCase();
        const normHay = removeVietnameseTones(hay).toLowerCase();
        return hay.includes(q) || normHay.includes(normQ);
      })
      .slice(0, 50);
  }, [users, userSearch]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || initialUser || null,
    [users, selectedUserId, initialUser]
  );

  const selectedRoleObj = useMemo(
    () => roles.find((r) => r.name === selectedRoleName) || null,
    [roles, selectedRoleName]
  );

  if (!open || typeof document === 'undefined') return null;

  const currentUserRoles = getUserRolesList(selectedUser);
  const currentPrimaryRole =
    normalizeRoleCode(selectedUser?.roleName) || currentUserRoles[0] || 'VIEWER';
  const nextRolesSet = Array.from(new Set([selectedRoleName, ...currentUserRoles]));
  const modifyCheck = canModifyUserPrimaryRole(
    selectedUser,
    selectedRoleName,
    currentAdminEmail
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!modifyCheck.allowed || !selectedUser) {
      setErrorMsg(
        modifyCheck.reason || 'Vui lòng chọn một tài khoản người dùng để phân quyền.'
      );
      return;
    }

    try {
      await onSubmit({
        userId: selectedUser.id,
        roleName: selectedRoleName,
        roleId: selectedRoleObj?.id,
      });
      onClose();
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật vai trò cho tài khoản này. Vui lòng thử lại.';
      setErrorMsg(apiMsg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 font-sans overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-user-role-modal-title"
    >
      {/* Full-viewport Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-[2px] overflow-hidden overscroll-contain"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[#EAE4DC] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh] overscroll-contain"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0EBE6] bg-[#FAF8F5] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="assign-user-role-modal-title"
                className="text-base font-bold text-stone-900 leading-snug"
              >
                Gán &amp; Thiết lập Vai trò Tài khoản
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Cập nhật Vai trò chính và tự động cộng dồn vào Tập hợp đa vai trò
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ"
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-[0.95] flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto overscroll-contain">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Select User Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 block">
              1. Tài khoản người dùng *
            </label>

            {!initialUser && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm kiếm tài khoản theo họ tên, thư điện tử, mã số..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#991B1B]"
                />
              </div>
            )}

            <div className="max-h-36 overflow-y-auto rounded-xl border border-[#E7E5E4] divide-y divide-[#F0EBE6] bg-white">
              {(initialUser ? [initialUser] : filteredUsers).length === 0 ? (
                <div className="p-4 text-center text-stone-400 text-xs">
                  Không tìm thấy tài khoản người dùng phù hợp.
                </div>
              ) : (
                (initialUser ? [initialUser] : filteredUsers).map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const uRoles = getUserRolesList(u);
                  const primaryCode = normalizeRoleCode(u.roleName) || uRoles[0] || 'VIEWER';
                  const displayFullName =
                    (u.fullName && u.fullName.trim()) || 'Chưa cập nhật họ tên';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFF0F2]/80 text-[#991B1B]'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {extractUserInitials(u)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="font-bold text-xs text-stone-900 truncate"
                              title={displayFullName}
                            >
                              {displayFullName}
                            </span>
                            <span className="text-[10.5px] text-stone-400 tabular-nums shrink-0">
                              #{u.id}
                            </span>
                          </div>
                          <span
                            className="text-[11px] text-stone-500 truncate block"
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[10.5px] font-bold whitespace-nowrap">
                          {getRoleVietnameseLabel(primaryCode)} • Chính
                        </span>
                        {uRoles.length > 1 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold whitespace-nowrap">
                            +{uRoles.length - 1}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-[#991B1B] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Select Target Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 block">
              2. Chọn vai trò chính cần thiết lập *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((r) => {
                const isSelected = selectedRoleName === r.name;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleName(r.name)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-[#991B1B] bg-[#FFF0F2]/60 ring-1 ring-[#991B1B]'
                        : 'border-[#E7E5E4] bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-stone-900">
                          {r.shortLabel}
                        </span>
                        <span className="text-[10px] text-stone-400 tabular-nums">
                          Mã #{r.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1">
                        {r.displayTitle}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-[#991B1B] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Multi-Role Preview */}
          {selectedUser && (
            <div className="rounded-xl border border-[#EAE4DC] bg-[#F7F4F0] p-3 space-y-2">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs min-w-0">
                <Info className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                <span className="truncate" title={selectedUser.email}>
                  Xem trước thay đổi phân quyền cho {selectedUser.email}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <div className="rounded-lg bg-white border border-[#ECE7E0] p-2.5 space-y-1">
                  <span className="text-[10.5px] font-semibold text-stone-500 block">
                    Vai trò chính của tài khoản
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
                    <span className="text-stone-400 line-through">
                      {getRoleVietnameseLabel(currentPrimaryRole)}
                    </span>
                    <span className="text-stone-400">→</span>
                    <span className="text-[#991B1B]">
                      {getRoleVietnameseLabel(selectedRoleName)}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-[#ECE7E0] p-2.5 space-y-1">
                  <span className="text-[10.5px] font-semibold text-stone-500 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-[#059669]" />
                    <span>Tập hợp vai trò sau khi lưu</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {nextRolesSet.map((code) => (
                      <span
                        key={code}
                        className="px-1.5 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[10.5px] font-bold"
                      >
                        {getRoleVietnameseLabel(code)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Self-Demotion Protection Warning */}
          {selectedUser && !modifyCheck.allowed && modifyCheck.reason && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-[#FFFBEB] p-3 text-xs text-amber-900 flex items-start gap-2"
            >
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{modifyCheck.reason}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0EBE6]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-[0.97] transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedUser || !modifyCheck.allowed}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.97] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Xác nhận phân quyền</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
