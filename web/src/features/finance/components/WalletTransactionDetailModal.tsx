import React from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  Copy,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WalletTransactionItem } from '@/types/transaction';
import { cn } from '@/utils/cn';

export interface DisplayTransactionDetail {
  id: string | number;
  title: string;
  subtitle: string;
  amount: number;
  isPositive: boolean;
  date: string;
  status: string;
  rawTx?: WalletTransactionItem;
}

interface WalletTransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: DisplayTransactionDetail | null;
}

export const WalletTransactionDetailModal: React.FC<WalletTransactionDetailModalProps> = ({
  open,
  onOpenChange,
  transaction,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!transaction) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(String(transaction.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = transaction.status === 'SUCCESS';
  const formatDisplayVND = (num: number) => {
    return `${Math.abs(num).toLocaleString('vi-VN')} đ`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xl">
        <DialogHeader className="space-y-1 text-center pb-2 border-b border-[#F0EAE1]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF2F2] border border-[#F9D2D4] text-[#A31D24] shadow-2xs mb-2">
            <Receipt className="h-6 w-6" />
          </div>
          <DialogTitle className="font-serif text-lg font-bold text-[#1F1A19]">
            Chi Tiết Giao Dịch Điện Tử
          </DialogTitle>
          <p className="text-[11px] text-[#786D66]">
            Hóa đơn điện tử nội bộ hệ thống thanh toán Sử Ký
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Amount Card */}
          <div className="text-center p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] space-y-1">
            <div className="text-xs font-semibold text-[#786D66]">
              {transaction.title}
            </div>
            <div
              className={cn(
                'font-serif text-3xl font-bold tabular-nums',
                transaction.isPositive ? 'text-[#059669]' : 'text-[#DC2626]'
              )}
            >
              {transaction.isPositive
                ? `+ ${formatDisplayVND(transaction.amount)}`
                : `- ${formatDisplayVND(transaction.amount)}`}
            </div>
            <div className="pt-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                  isSuccess
                    ? 'bg-[#EDFDF2] text-[#168A4E] border-[#A6E9B9]'
                    : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                )}
              >
                {isSuccess ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                <span>{isSuccess ? 'Giao dịch thành công' : 'Đang xử lý'}</span>
              </span>
            </div>
          </div>

          {/* Details Field List */}
          <div className="divide-y divide-[#F4EFEA] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#786D66]">Mã tham chiếu GD</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-[#1F1A19]">
                <span>#{transaction.id}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Sao chép mã"
                  className="p-1 hover:bg-[#F2ECE4] rounded transition-colors text-[#786D66]"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-[#059669]">Đã chép</span>}
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#786D66]">Nội dung / Tác phẩm</span>
              <span className="font-semibold text-[#1F1A19] text-right max-w-[220px] truncate">
                {transaction.subtitle}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#786D66]">Thời gian ghi nhận</span>
              <span className="font-mono text-[#1F1A19]">
                {transaction.date}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#786D66]">Phí giao dịch nền tảng</span>
              <span className="font-semibold text-[#059669]">0 đ (Miễn phí)</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#786D66]">Phương thức thanh toán</span>
              <span className="font-semibold text-[#1F1A19]">Ví Sử Ký / Napas 24/7</span>
            </div>
          </div>

          {/* Security stamp */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EDFDF2] border border-[#A6E9B9] text-[11px] text-[#168A4E]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Giao dịch được mã hóa và xác thực số theo tiêu chuẩn an toàn PRM393.</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1]">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>In biên lai</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-[#981B1E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
