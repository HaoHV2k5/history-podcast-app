import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateRejectReason, AdminWithdrawalRow } from '../withdrawalsLogic';

interface AdminWithdrawalReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: AdminWithdrawalRow | null;
  mode: 'REJECT' | 'FAIL';
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export const AdminWithdrawalReasonModal: React.FC<AdminWithdrawalReasonModalProps> = ({
  isOpen,
  onClose,
  withdrawal,
  mode,
  onConfirm,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !withdrawal) return null;

  const isReject = mode === 'REJECT';
  const title = isReject ? 'Từ chối yêu cầu rút tiền' : 'Báo lỗi chuyển khoản ngân hàng';
  const confirmText = isReject ? 'Xác nhận từ chối' : 'Xác nhận báo lỗi';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRejectReason(reason);
    if (!validation.valid) {
      setError(validation.error || 'Vui lòng nhập lý do hợp lệ');
      return;
    }
    setError(null);
    onConfirm(reason.trim());
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[#F0EBE6] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EBE6] bg-[#FAF8F5] px-6 py-4.5 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${isReject
                  ? 'border-rose-100 bg-rose-50 text-rose-600'
                  : 'border-amber-100 bg-amber-50 text-amber-600'
                }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-stone-900">{title}</h3>
              <p className="text-xs text-stone-500 font-sans">
                Đơn rút #{withdrawal.id} • {withdrawal.userName} ({withdrawal.formattedAmount})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Policy Alert */}
          <div
            className={`rounded-2xl border p-4 text-xs space-y-1 ${isReject
                ? 'border-rose-200 bg-rose-50/70 text-rose-800'
                : 'border-amber-200 bg-amber-50/70 text-amber-800'
              }`}
          >
            <span className="font-semibold block">Chính sách hoàn tiền tự động:</span>
            <p className="leading-relaxed">
              Hệ thống sẽ lập tức hoàn trả 100% số tiền ({withdrawal.formattedAmount}) từ số dư đóng băng về số dư khả dụng (available balance) của Nhà sáng tạo.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-1.5">
              Lý do xử lý <span className="text-[#991B1B]">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                isReject
                  ? 'Ví dụ: Thông tin số tài khoản không trùng khớp với tên đã xác thực KYC, vui lòng kiểm tra lại...'
                  : 'Ví dụ: Ngân hàng thụ hưởng báo số tài khoản đã bị khóa hoặc không tồn tại...'
              }
              className="w-full rounded-xl border border-[#E7E5E4] p-3 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:border-[#991B1B] focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
            />
            {error && (
              <div className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick preset reasons */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
              Gợi ý lý do nhanh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(isReject
                ? [
                  'STK không khớp tên KYC',
                  'Nghi vấn giao dịch bất thường',
                  'Creator yêu cầu hủy đơn',
                ]
                : [
                  'STK bị đóng hoặc khóa',
                  'Lỗi cổng chuyển mạch Napas',
                  'Ngân hàng đích bảo trì hệ thống',
                ]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-[#E7E5E4] text-xs font-medium text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-xl text-xs font-semibold text-white shadow-xs ${isReject ? 'bg-[#991B1B] hover:bg-[#7F1D1D]' : 'bg-amber-600 hover:bg-amber-700'
                }`}
            >
              {isSubmitting ? 'Đang xử lý...' : confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

