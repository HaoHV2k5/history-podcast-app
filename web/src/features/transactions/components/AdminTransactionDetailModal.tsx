import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowLeftRight,
  Calendar,
  Wallet,
  ShieldCheck,
  Receipt,
  User,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminTransactionRow, getAvatarInitials } from '../transactionsLogic';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface AdminTransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AdminTransactionRow | null;
}

export const AdminTransactionDetailModal: React.FC<AdminTransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const initials = getAvatarInitials(transaction.userName);

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-transaction-title"
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
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="modal-transaction-title"
                  className="text-base font-bold text-[#1F1612]"
                >
                  Chi tiết giao dịch #{transaction.id}
                </h3>
                <p className="text-xs text-stone-500">
                  Ví ID #{transaction.walletId} • Sổ cái tài chính Sử Ký
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
              title="Đóng (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {/* Main Financial Amount Card */}
          <div className="rounded-xl border border-[#F0EBE6] bg-[#FAFAF9] p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-stone-500">Số tiền biến động</span>
              <div
                className={cn(
                  'text-2xl font-bold font-mono tracking-tight',
                  transaction.isPositive ? 'text-emerald-700' : 'text-rose-700'
                )}
              >
                {transaction.amountDisplay}
              </div>
              <span className="text-[11px] text-stone-500">
                {transaction.isPositive ? 'Cộng tiền vào ví người dùng' : 'Trừ tiền khỏi ví người dùng'}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                  transaction.statusColor === 'bg-emerald-500'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : transaction.statusColor === 'bg-amber-500'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', transaction.statusColor)} />
                <span>{transaction.statusLabel}</span>
              </div>
              <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">
                {transaction.status}
              </span>
            </div>
          </div>

          {/* User Account Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <User className="h-3.5 w-3.5" />
              <span>Chủ tài khoản ví</span>
            </div>
            <div className="rounded-xl border border-[#F0EBE6] bg-white p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#991B1B]/10 text-[#991B1B] font-bold text-xs border border-[#991B1B]/20">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#1F1612] truncate">
                  {transaction.userName}
                </div>
                <div className="text-[11px] text-stone-500 truncate">{transaction.userEmail}</div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-mono text-stone-600">
                  <Wallet className="h-3 w-3" />
                  <span>Ví #{transaction.walletId}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <Receipt className="h-3.5 w-3.5" />
              <span>Thông số nghiệp vụ & Sổ cái</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#F0EBE6] p-3 space-y-1">
                <span className="text-[11px] text-stone-500 block">Loại biến động:</span>
                <div className="inline-flex items-center gap-1.5 font-semibold text-stone-800">
                  <span className={cn('h-2 w-2 rounded-full', transaction.typeColor)} />
                  <span>{transaction.typeLabel}</span>
                </div>
                <span className="block text-[10px] font-mono text-stone-400 uppercase">
                  {transaction.type}
                </span>
              </div>

              <div className="rounded-xl border border-[#F0EBE6] p-3 space-y-1">
                <span className="text-[11px] text-stone-500 block">Thời điểm ghi sổ:</span>
                <div className="flex items-center gap-1.5 font-medium text-stone-800 font-mono tabular-nums">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  <span>{formatDateTime(transaction.createdAt)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#F0EBE6] p-3 space-y-1">
                <span className="text-[11px] text-stone-500 block">Cổng / Đối tác:</span>
                <div className="flex items-center gap-1.5 font-medium text-stone-800">
                  <Building className="h-3.5 w-3.5 text-stone-400" />
                  <span>{transaction.gatewayProvider || 'Hệ thống nội bộ'}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#F0EBE6] p-3 space-y-1">
                <span className="text-[11px] text-stone-500 block">Mã tham chiếu đối tác:</span>
                <span className="font-mono text-[11px] font-semibold text-stone-800 break-all">
                  {transaction.merchantTxnRef || transaction.gatewayTxnNo || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Internal Note */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Nội dung diễn giải
            </span>
            <div className="rounded-xl border border-[#F0EBE6] bg-[#FFFBF7] p-3.5 text-stone-700 leading-relaxed">
              {transaction.description || 'Giao dịch được ghi nhận tự động bởi hệ thống Sử Ký.'}
            </div>
          </div>

          {/* Related Entity Link if present */}
          {(transaction.relatedType || transaction.relatedId) && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Liên kết nghiệp vụ:{' '}
                  <span className="font-semibold">{transaction.relatedType || 'Thực thể'}</span>
                </span>
              </div>
              {transaction.relatedId && (
                <span className="font-mono font-bold text-xs">ID #{transaction.relatedId}</span>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#F0EBE6] bg-[#FAFAF9] px-6 py-3.5 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold text-stone-700 border-[#E7E2DA] hover:bg-stone-100 rounded-xl"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
