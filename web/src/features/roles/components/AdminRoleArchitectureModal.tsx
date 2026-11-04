import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  X,
  Shield,
  Layers,
  Database,
  KeyRound,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';
import type { UserResponse } from '@/types/auth';
import {
  extractUserInitials,
  getRoleVietnameseLabel,
  getUserRolesList,
  isMultiRoleUser,
  normalizeRoleCode,
} from '../rolesLogic';

interface AdminRoleArchitectureModalProps {
  open: boolean;
  onClose: () => void;
  users: UserResponse[];
  onSelectUserForRoleChange: (user: UserResponse) => void;
}

export const AdminRoleArchitectureModal: React.FC<AdminRoleArchitectureModalProps> = ({
  open,
  onClose,
  users,
  onSelectUserForRoleChange,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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

  if (!open || typeof document === 'undefined') return null;

  const multiRoleUsers = users.filter((u) => isMultiRoleUser(u));

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 font-sans overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-arch-modal-title"
    >
      {/* Full-viewport Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-[2px] overflow-hidden overscroll-contain"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#EAE4DC] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[86vh] overscroll-contain"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0EBE6] bg-[#FAF8F5] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="role-arch-modal-title"
                className="text-base font-bold text-stone-900 leading-snug"
              >
                Kiến trúc Phân quyền Đa vai trò trên Hệ thống
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Cơ chế vận hành giữa Vai trò chính và Tập hợp vai trò kiêm nhiệm trên nền tảng Sử Ký
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-[0.95] flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-stone-600 leading-relaxed overscroll-contain bg-[#FAF8F5]/40">
          {/* 3-Layer RBAC Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-[#ECE7E0] bg-white p-3 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Database className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                <span>1. Vai trò chính</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Mỗi tài khoản có một <strong>Vai trò chính</strong> dùng để xác định không gian làm việc mặc định khi vừa đăng nhập.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7E0] bg-white p-3 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Layers className="h-3.5 w-3.5 text-[#059669] shrink-0" />
                <span>2. Tập hợp đa vai trò</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Khi được duyệt định danh <strong>Nhà sáng tạo</strong> hoặc cấp quyền mới, vai trò được cộng dồn vào <strong>Tập hợp đa vai trò</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7E0] bg-white p-3 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <KeyRound className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>3. Kiểm soát truy cập</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Phiên làm việc nạp <strong>toàn bộ danh sách vai trò đang sở hữu</strong> để mở khóa đồng thời các quyền hạn tại máy chủ.
              </p>
            </div>
          </div>

          {/* Live Multi-Role Accounts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-[#991B1B]" />
                <span>
                  Tài khoản có đa vai trò hiện tại ({multiRoleUsers.length})
                </span>
              </h3>
              <span className="text-[11px] text-stone-400">
                Dữ liệu thời gian thực từ máy chủ
              </span>
            </div>

            {multiRoleUsers.length === 0 ? (
              <div className="rounded-xl border border-[#F0EBE6] bg-white p-6 text-center space-y-1.5">
                <Shield className="h-6 w-6 text-stone-400 mx-auto" />
                <p className="font-bold text-stone-800 text-xs">
                  Hiện chưa có tài khoản nào sở hữu từ 2 vai trò trở lên
                </p>
                <p className="text-[11px] text-stone-500">
                  Khi người dùng được duyệt định danh Nhà sáng tạo hoặc được Quản trị viên cấp thêm vai trò, tài khoản sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F2ECE4] rounded-xl border border-[#EAE4DC] bg-white max-h-64 overflow-y-auto shadow-2xs">
                {multiRoleUsers.map((u) => {
                  const rolesList = getUserRolesList(u);
                  const primary = normalizeRoleCode(u.roleName) || rolesList[0] || 'VIEWER';
                  const displayFullName =
                    (u.fullName && u.fullName.trim()) || 'Chưa cập nhật họ tên';

                  return (
                    <div
                      key={u.id}
                      className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {extractUserInitials(u)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="font-bold text-stone-900 text-xs truncate"
                              title={displayFullName}
                            >
                              {displayFullName}
                            </span>
                            <span className="text-[10.5px] font-medium text-stone-400 tabular-nums shrink-0">
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

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-10 sm:pl-0">
                        <div className="flex flex-wrap items-center gap-1">
                          {rolesList.map((r) => {
                            const isPri = r === primary;
                            return (
                              <span
                                key={r}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] whitespace-nowrap ${
                                  isPri
                                    ? 'bg-[#FFF0F2] text-[#991B1B] border border-[#FECDD3] font-bold'
                                    : 'bg-stone-100 text-stone-700 border border-stone-200/80 font-medium'
                                }`}
                              >
                                <span>{getRoleVietnameseLabel(r)}</span>
                                {isPri && (
                                  <span className="text-[9.5px] font-semibold opacity-75">
                                    • Chính
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectUserForRoleChange(u);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E7E5E4] bg-white text-stone-700 hover:bg-[#FFF0F2] hover:text-[#991B1B] hover:border-[#FECDD3] active:scale-[0.97] text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer"
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#F0EBE6] bg-[#FAF8F5] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-[#991B1B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#7F1D1D] active:scale-[0.97] transition-all cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
