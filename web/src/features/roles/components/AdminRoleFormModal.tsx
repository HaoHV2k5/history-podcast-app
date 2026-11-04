import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X, Shield, Loader2, AlertCircle, Lock } from 'lucide-react';
import type { RoleItem, RoleRequestPayload } from '@/types/role';
import { AdminRoleRow, validateRoleFormInput } from '../rolesLogic';

interface AdminRoleFormModalProps {
  open: boolean;
  editingRole: AdminRoleRow | null;
  existingRoles: RoleItem[];
  onClose: () => void;
  onSubmit: (payload: RoleRequestPayload, editingId?: number) => Promise<void>;
  isSubmitting?: boolean;
}

export const AdminRoleFormModal: React.FC<AdminRoleFormModalProps> = ({
  open,
  editingRole,
  existingRoles,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isEditing = Boolean(editingRole);
  const isCoreRoleLocked = Boolean(editingRole?.isCoreSystemRole);

  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setName(editingRole.name);
      setDescription(
        editingRole.description === 'Chưa có mô tả chi tiết cho vai trò này.'
          ? ''
          : editingRole.description
      );
    } else {
      setName('');
      setDescription('');
    }
    setErrorMsg(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, editingRole, isSubmitting, onClose]);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateRoleFormInput(
      { name, description },
      existingRoles,
      editingRole?.id
    );

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Dữ liệu không hợp lệ.');
      return;
    }

    try {
      await onSubmit(
        {
          name: validation.normalizedName,
          description: validation.trimmedDescription,
        },
        editingRole?.id
      );
      onClose();
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu thông tin vai trò. Vui lòng thử lại.';
      setErrorMsg(apiMsg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 font-sans overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-form-modal-title"
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
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#EAE4DC] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh] overscroll-contain"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0EBE6] bg-[#FAF8F5] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="role-form-modal-title"
                className="text-base font-bold text-stone-900 leading-snug"
              >
                {isEditing
                  ? `Chỉnh sửa vai trò ${editingRole?.shortLabel}`
                  : 'Thêm vai trò hệ thống mới'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {isEditing
                  ? `Cập nhật thông tin định nghĩa cho vai trò Mã #${editingRole?.id}`
                  : 'Khởi tạo bản ghi vai trò mới trong danh mục phân quyền hệ thống'}
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
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Field 1: Tên định danh vai trò */}
          <div className="space-y-1.5">
            <label
              htmlFor="role-name-input"
              className="text-xs font-bold text-stone-800 flex flex-wrap items-center justify-between gap-2"
            >
              <span>Mã định danh vai trò *</span>
              {isCoreRoleLocked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span>Vai trò chuẩn hệ thống</span>
                </span>
              )}
            </label>
            <input
              id="role-name-input"
              type="text"
              value={name}
              disabled={isCoreRoleLocked || isSubmitting}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Ví dụ: KIEM_DUYET_VIEN, BIEN_TAP_VIEN..."
              maxLength={50}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-[13px] font-bold uppercase tracking-wide focus:outline-none transition-colors ${
                isCoreRoleLocked
                  ? 'border-[#E7E5E4] bg-stone-100 text-stone-500 cursor-not-allowed'
                  : 'border-[#E7E5E4] bg-white text-stone-900 focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]'
              }`}
            />
            <p className="text-[11px] text-stone-500 leading-relaxed">
              {isCoreRoleLocked
                ? 'Mã định danh của 5 vai trò gốc (Thính giả, Nhà sáng tạo, Thuyết minh viên, Quản trị viên, Cộng tác viên) được cố định để đồng bộ với bộ kiểm soát phân quyền của máy chủ.'
                : 'Sử dụng chữ cái in hoa không dấu và dấu gạch dưới (A-Z, 0-9, _).'}
            </p>
          </div>

          {/* Field 2: Mô tả vai trò */}
          <div className="space-y-1.5">
            <label
              htmlFor="role-description-input"
              className="text-xs font-bold text-stone-800 block"
            >
              Mô tả vai trò &amp; Phạm vi trách nhiệm *
            </label>
            <textarea
              id="role-description-input"
              rows={4}
              value={description}
              disabled={isSubmitting}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chức năng và phạm vi quyền hạn của vai trò này..."
              maxLength={500}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7E5E4] bg-white text-xs sm:text-[13px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400">
              <span>Hiển thị tại cột Mô tả trên bảng Phân quyền</span>
              <span className="tabular-nums shrink-0">{description.length}/500</span>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.97] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEditing ? 'Lưu thay đổi' : 'Tạo vai trò'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
