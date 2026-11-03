import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Crown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentDisplayRow, getAvatarInitials } from '../membershipLogic';
import { formatVND, formatDateTime } from '@/utils/formatters';

interface AdminMembershipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDisplayRow | null;
}

export const AdminMembershipDetailModal: React.FC<AdminMembershipDetailModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!isOpen || !payment) return null;

  const initials = getAvatarInitials(payment.userName);

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-membership-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative border-b border-[#F0EBE6] bg-[#FFFBF7] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="modal-membership-title"
                  className="text-base font-bold text-[#1F1612]"
                >
                  Chi tiết thanh toán #{payment.id}
                </h3>
                <p className="text-xs text-stone-500">
                  Gói Hội viên ID #{payment.membershipId}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* User Section */}
          <div className="rounded-xl border border-stone-100 bg-[#FAF8F5]/60 p-4">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              Người đăng ký gói
            </div>
            <div className="flex items-center gap-3">
              {payment.userAvatar ? (
                <img
                  src={payment.userAvatar}
                  alt={payment.userName}
                  className="h-10 w-10 rounded-full object-cover border border-stone-200 shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7F3] font-bold text-xs text-[#9D174D] border border-[#FBCFE8]">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-[#1F1612] truncate">
                  {payment.userName}
                </div>
                <div className="text-stone-500 truncate">{payment.userEmail}</div>
              </div>
            </div>
          </div>

          {/* Payment & Financial Breakdown Section */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Chi tiết tài chính & Phân bổ
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                <span className="text-[11px] text-stone-500">Gói hội viên</span>
                <div className="mt-1 font-bold text-stone-900 truncate">
                  {payment.planName}
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                <span className="text-[11px] text-stone-500">Phương thức</span>
                <div className="mt-1 font-bold text-stone-900">
                  {payment.paymentMethod}
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                <span className="text-[11px] text-stone-500">Tổng thanh toán</span>
                <div className="mt-1 font-bold text-base text-[#1F1612] font-mono">
                  {formatVND(payment.amount)}
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                <span className="text-[11px] text-stone-500">Trạng thái</span>
                <div className="mt-1 flex items-center gap-1.5 font-bold">
                  {payment.statusVariant === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">{payment.statusLabel}</span>
                    </>
                  )}
                  {payment.statusVariant === 'warning' && (
                    <>
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-700">{payment.statusLabel}</span>
                    </>
                  )}
                  {payment.statusVariant === 'error' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      <span className="text-rose-700">{payment.statusLabel}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Revenue Distribution Breakdown according to Policy */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Thu nhập Creator (90% theo Policy)</span>
                </span>
                <span className="font-bold text-emerald-700 font-mono">
                  {formatVND(payment.creatorEarning || payment.amount * 0.9)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Phí sàn Sử Ký (10% duy trì hệ thống)</span>
                <span className="font-semibold text-stone-700 font-mono">
                  {formatVND(payment.commissionAmount || payment.amount * 0.1)}
                </span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-stone-500 pt-1">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span>Thời điểm ghi nhận: {payment.paidAt ? formatDateTime(payment.paidAt) : 'Chưa ghi nhận'}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#F0EBE6] bg-[#FAF8F5]/50 px-6 py-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              window.alert(
                `Biên lai giao dịch #${payment.id} đã được gửi tới hệ thống xuất chứng từ.`
              );
            }}
            className="text-xs border-stone-200"
          >
            <Receipt className="mr-1.5 h-3.5 w-3.5 text-stone-500" />
            <span>In biên lai</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="bg-[#991B1B] hover:bg-[#831826] text-white text-xs px-4"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
