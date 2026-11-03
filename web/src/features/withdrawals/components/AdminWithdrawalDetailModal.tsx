import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { AdminWithdrawalRow } from '../withdrawalsLogic';
import { BankLogoBadge } from './AdminWithdrawalsTable';
import { Button } from '@/components/ui/button';

interface AdminWithdrawalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: AdminWithdrawalRow | null;
  onProcess: (row: AdminWithdrawalRow) => void;
  onComplete: (row: AdminWithdrawalRow) => void;
  onReject: (row: AdminWithdrawalRow) => void;
  onFail: (row: AdminWithdrawalRow) => void;
  isProcessingAction?: boolean;
}

export const AdminWithdrawalDetailModal: React.FC<AdminWithdrawalDetailModalProps> = ({
  isOpen,
  onClose,
  withdrawal,
  onProcess,
  onComplete,
  onReject,
  onFail,
  isProcessingAction = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !withdrawal) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const status = (withdrawal.status || '').toUpperCase();

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#F0EBE6] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F0EBE6] bg-[#FAF8F5] px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-[#991B1B]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-lg font-bold text-stone-900">
                  Yêu cầu rút tiền #{withdrawal.id}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${withdrawal.statusConfig.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${withdrawal.statusConfig.dotColor}`} />
                  <span>{withdrawal.statusConfig.label}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Ví Creator ID #{withdrawal.walletId} • Cổng quản trị Sử Ký
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* 1. Large Amount Card */}
          <div className="rounded-2xl border border-[#F0EBE6] bg-[#FAF8F5]/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider block">
                Số tiền yêu cầu rút
              </span>
              <span className="font-sans text-3xl font-extrabold text-[#991B1B] tabular-nums tracking-tight mt-1 block">
                {withdrawal.formattedAmount}
              </span>
              <span className="text-[11px] text-stone-400 font-sans tabular-nums mt-0.5 block">
                Tương đương {withdrawal.amount.toLocaleString('vi-VN')} Việt Nam Đồng
              </span>
            </div>

            <div className="text-right sm:border-l sm:border-stone-200/80 sm:pl-5">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider block">
                Ngân hàng thụ hưởng
              </span>
              <div className="mt-1 flex items-center sm:justify-end gap-2">
                <BankLogoBadge bankName={withdrawal.bankName} code={withdrawal.bankBadgeConfig.code} />
              </div>
            </div>
          </div>

          {/* 2. Grid: Creator Profile & Bank Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Creator Information */}
            <div className="rounded-2xl border border-stone-200/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-2">
                <User className="h-3.5 w-3.5 text-stone-400" />
                <span>Thông tin Nhà sáng tạo</span>
              </div>

              <div className="flex items-center gap-3">
                {withdrawal.userAvatarUrl ? (
                  <img
                    src={withdrawal.userAvatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover border border-stone-200"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF8F5] border border-stone-200 font-bold text-xs text-stone-700">
                    {withdrawal.userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-stone-900 text-sm block truncate">
                    {withdrawal.userName}
                  </span>
                  <span className="text-xs text-stone-500 font-sans block truncate">
                    {withdrawal.userEmail}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs text-stone-500 flex justify-between border-t border-stone-100">
                <span>Ví hệ thống:</span>
                <span className="font-sans font-semibold text-stone-700 tabular-nums">Ví #{withdrawal.walletId}</span>
              </div>
            </div>

            {/* Bank Account Information */}
            <div className="rounded-2xl border border-stone-200/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-2">
                <Building2 className="h-3.5 w-3.5 text-stone-400" />
                <span>Chi tiết tài khoản ngân hàng</span>
              </div>

              <div>
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                  Số tài khoản (STK)
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-sans text-sm font-bold text-stone-900 tracking-wider tabular-nums">
                    {withdrawal.formattedAccountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(withdrawal.accountNumber, 'modal-acc')}
                    className="inline-flex items-center gap-1 text-xs text-[#991B1B] hover:underline"
                  >
                    {copiedKey === 'modal-acc' ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                  Tên chủ tài khoản
                </span>
                <span className="font-semibold text-xs text-stone-800 uppercase tracking-wider mt-0.5 block">
                  {withdrawal.accountHolderName}
                </span>
              </div>
            </div>
          </div>

          {/* 3. SLA & Timeline Section */}
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Cam kết thời gian xử lý (SLA)</span>
            </div>

            <p className="text-xs text-amber-900/80 leading-relaxed font-sans">
              {withdrawal.slaPolicyNote ||
                'Hệ thống cam kết thẩm định và giải quyết đơn rút tiền trong tối đa 2 ngày làm việc (48 giờ).'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/40 text-xs">
              <div>
                <span className="text-stone-500 block text-[11px]">Thời điểm yêu cầu:</span>
                <span className="font-sans text-stone-800 font-medium tabular-nums">
                  {withdrawal.datePart} {withdrawal.timePart}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Hạn xử lý SLA:</span>
                <span className="font-sans text-amber-900 font-semibold tabular-nums">
                  {withdrawal.slaDueAt
                    ? new Date(withdrawal.slaDueAt).toLocaleString('vi-VN')
                    : '48 giờ sau yêu cầu'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Thời điểm hoàn tất:</span>
                <span className="font-sans text-stone-800 font-medium tabular-nums">
                  {withdrawal.processedAt
                    ? new Date(withdrawal.processedAt).toLocaleString('vi-VN')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Failure / Rejection Reason Alert (if present) */}
          {withdrawal.failureReason && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Lý do từ chối / lỗi giao dịch:</span>
              </div>
              <p className="text-xs text-rose-700 font-sans pl-6">
                {withdrawal.failureReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-[#F0EBE6] bg-[#FAF8F5] px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-[#E7E5E4] text-xs font-medium text-stone-700 hover:bg-stone-100"
          >
            Đóng
          </Button>

          <div className="flex items-center gap-2.5">
            {status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onReject(withdrawal)}
                  disabled={isProcessingAction}
                  className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                >
                  <XCircle className="h-4 w-4 mr-1 text-rose-600" />
                  <span>Từ chối yêu cầu</span>
                </Button>

                <Button
                  onClick={() => onProcess(withdrawal)}
                  disabled={isProcessingAction}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isProcessingAction ? 'animate-spin' : ''}`} />
                  <span>Tiếp nhận xử lý đơn</span>
                </Button>
              </>
            )}

            {status === 'PROCESSING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onFail(withdrawal)}
                  disabled={isProcessingAction}
                  className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold"
                >
                  <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />
                  <span>Báo lỗi chuyển khoản</span>
                </Button>

                <Button
                  onClick={() => onComplete(withdrawal)}
                  disabled={isProcessingAction}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  <span>Xác nhận đã chuyển tiền</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
