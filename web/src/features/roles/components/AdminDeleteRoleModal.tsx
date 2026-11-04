import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X, Trash2, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { AdminRoleRow, canDeleteRole } from '../rolesLogic';

interface AdminDeleteRoleModalProps {
  roleRow: AdminRoleRow | null;
  onClose: () => void;
  onConfirmDelete: (roleId: number) => Promise<void>;
  isDeleting?: boolean;
}

export const AdminDeleteRoleModal: React.FC<AdminDeleteRoleModalProps> = ({
  roleRow,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleRow) return;
    setErrorMsg(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roleRow, isDeleting, onClose]);

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

  if (!roleRow || typeof document === 'undefined') return null;

  const deleteCheck = canDeleteRole(roleRow);

  const handleConfirm = async () => {
    if (!deleteCheck.allowed) return;
    setErrorMsg(null);
    try {
      await onConfirmDelete(roleRow.id);
      onClose();
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể xóa vai trò này. Vui lòng thử lại.';
      setErrorMsg(apiMsg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 font-sans overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-role-modal-title"
    >
      {/* Full-viewport Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-[2px] overflow-hidden overscroll-contain"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#EAE4DC] bg-white shadow-2xl overflow-hidden flex flex-col overscroll-contain"
      >
        <div className="px-5 py-4 border-b border-[#F0EBE6] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
              {deleteCheck.allowed ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="delete-role-modal-title"
                className="text-base font-bold text-stone-900"
              >
                {deleteCheck.allowed
                  ? `Xóa vai trò ${roleRow.shortLabel}?`
                  : `Bảo vệ vai trò ${roleRow.shortLabel}`}
              </h2>
              <p className="text-xs text-stone-500">Mã #{roleRow.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Đóng cửa sổ"
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-[0.95] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 text-xs text-stone-600 leading-relaxed">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          {!deleteCheck.allowed ? (
            <div className="rounded-xl border border-amber-200 bg-[#FFFBEB] p-3.5 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{deleteCheck.reason}</span>
            </div>
          ) : (
            <p>
              Bạn có chắc chắn muốn xóa vai trò{' '}
              <strong className="text-stone-900">
                {roleRow.shortLabel}
              </strong>{' '}
              (Mã #{roleRow.id}) khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#F0EBE6] bg-[#FAF8F5] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-[0.97] transition-all cursor-pointer"
          >
            {deleteCheck.allowed ? 'Hủy bỏ' : 'Đã hiểu'}
          </button>

          {deleteCheck.allowed && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#991B1B] active:scale-[0.97] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xác nhận xóa</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
