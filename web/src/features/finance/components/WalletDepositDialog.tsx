import React, { useState } from 'react';
import {
  SquareArrowOutUpRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface WalletDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitDeposit: (amount: number, description: string) => void;
  isSubmitting?: boolean;
  depositResultUrl?: string | null;
  errorMessage?: string | null;
  onResetResult?: () => void;
}

const QUICK_DEPOSIT_CHIPS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const WalletDepositDialog: React.FC<WalletDepositDialogProps> = ({
  open,
  onOpenChange,
  onSubmitDeposit,
  isSubmitting = false,
  depositResultUrl = null,
  errorMessage = null,
  onResetResult,
}) => {
  const [amountStr, setAmountStr] = useState<string>('50000');
  const [description, setDescription] = useState('Nạp tiền vào ví Sử Ký');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const amt = parseInt(amountStr, 10);
    if (isNaN(amt) || amt < 10000) {
      setLocalError('Số tiền nạp tối thiểu là 10.000 VNĐ');
      return;
    }
    onSubmitDeposit(amt, description);
  };

  const handleClose = () => {
    onOpenChange(false);
    onResetResult?.();
    setLocalError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDFDF2] border border-[#A6E9B9] text-[#168A4E]">
              <SquareArrowOutUpRight className="h-5 w-5" />
            </div>
            <DialogTitle className="font-serif text-lg font-bold text-[#1F1A19]">
              Nạp Tiền Vào Ví (VNPay Sandbox)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#786D66] leading-relaxed">
            Khởi tạo phiên thanh toán qua cổng VNPay Sandbox để bổ sung nguồn vốn hoạt động creator.
          </DialogDescription>
        </DialogHeader>

        {depositResultUrl ? (
          /* Payment URL Ready State */
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDFDF2] text-[#168A4E] shadow-2xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="font-serif text-base font-bold text-[#1F1A19]">
                Khởi tạo lệnh nạp tiền thành công
              </h4>
              <p className="text-xs text-[#786D66] leading-relaxed">
                Đã tạo liên kết thanh toán VNPay Sandbox an toàn. Bấm nút bên dưới để chuyển tiếp sang cổng thanh toán.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.open(depositResultUrl, '_blank', 'noopener,noreferrer')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-[#047857] active:scale-[0.98] transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Chuyển sang VNPay Sandbox</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form Input State */
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {(localError || errorMessage) && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3 text-xs text-[#DC2626] font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{localError || errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="deposit-amount-input" className="text-xs font-bold text-[#1F1A19]">
                Số tiền muốn nạp (VNĐ)
              </label>
              <div className="relative">
                <Input
                  id="deposit-amount-input"
                  type="number"
                  min={10000}
                  step={10000}
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    setLocalError(null);
                  }}
                  required
                  className="h-11 rounded-xl border-[#E5E0D8] bg-[#FAF8F5] px-3.5 font-mono text-base font-bold text-[#1F1A19] focus:bg-white focus:border-[#981B1E]"
                  placeholder="Tối thiểu 10.000 VNĐ"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-[#786D66]">
                  VNĐ
                </span>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {QUICK_DEPOSIT_CHIPS.map((chipVal) => (
                  <button
                    key={chipVal}
                    type="button"
                    onClick={() => {
                      setAmountStr(String(chipVal));
                      setLocalError(null);
                    }}
                    className="rounded-lg border border-[#E5E0D8] bg-white px-2.5 py-1 text-[11px] font-mono font-medium text-[#38302E] hover:bg-[#FAF8F5] hover:border-[#D5CFC5] active:scale-95 transition-all cursor-pointer"
                  >
                    {(chipVal / 1000).toLocaleString('vi-VN')}k
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="deposit-desc-input" className="text-xs font-bold text-[#1F1A19]">
                Nội dung chuyển tiền
              </label>
              <Input
                id="deposit-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 rounded-xl border-[#E5E0D8] bg-[#FAF8F5] px-3 text-xs text-[#1F1A19] focus:bg-white focus:border-[#981B1E]"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Đang tạo liên kết...' : 'Tạo link VNPay'}</span>
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
