import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { AdminNarratorRow } from '../narratorsLogic';

export interface AdminNarratorReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrator: AdminNarratorRow | null;
  onSubmit: (narrator: AdminNarratorRow, reason: string) => void;
  isSubmitting?: boolean;
}

const PRESET_REASONS = [
  'Chất lượng âm thanh bản thu demo chưa đạt chuẩn lọc ồn',
  'Chưa tải lên đầy đủ tệp demo ghi âm giọng đọc mẫu',
  'Thông tin hồ sơ liên hệ không chính xác hoặc không liên lạc được',
  'Chất giọng chưa phù hợp với định hướng nội dung lịch sử',
  'Nội dung bản demo vi phạm chính sách cộng đồng Sử Ký',
];

export const AdminNarratorReasonModal: React.FC<AdminNarratorReasonModalProps> = ({
  isOpen,
  onClose,
  narrator,
  onSubmit,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !narrator) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối hồ sơ thuyết minh');
      return;
    }
    setError(null);
    onSubmit(narrator, reason.trim());
  };

  const handleSelectPreset = (preset: string) => {
    setReason(preset);
    setError(null);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#FAF8F5] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-sans">
                Từ chối hồ sơ Thuyết minh viên
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Hồ sơ: <span className="font-semibold text-stone-800">{narrator.fullName}</span> (#{narrator.id})
              </p>
            </div>
          </div>

          {/* Exactly ONE clean close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-white hover:border-stone-300 transition-colors shadow-xs"
            aria-label="Đóng cửa sổ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập lý do chi tiết để hệ thống thông báo cho người dùng..."
              className="w-full rounded-xl border border-stone-200 p-3 text-xs sm:text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] transition-colors resize-none"
            />
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>

          {/* Preset Reason Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-stone-400 block">Lý do gợi ý nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-600 hover:bg-[#FEF2F2] hover:border-[#FCA5A5] hover:text-[#991B1B] transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
