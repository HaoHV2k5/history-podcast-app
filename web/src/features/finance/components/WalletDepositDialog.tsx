import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
  Copy,
  Check,
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
import {
  formatNumberWithDots,
  parseNumberFromDots,
  validateDepositAmount,
  convertVNDToWords,
  QUICK_DEPOSIT_PRESETS,
  MIN_DEPOSIT_AMOUNT,
  MAX_DEPOSIT_AMOUNT,
} from '../depositLogic';
import { cn } from '@/utils/cn';

interface WalletDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitDeposit: (amount: number, description: string) => void;
  isSubmitting?: boolean;
  depositResultUrl?: string | null;
  errorMessage?: string | null;
  onResetResult?: () => void;
}

export const WalletDepositDialog: React.FC<WalletDepositDialogProps> = ({
  open,
  onOpenChange,
  onSubmitDeposit,
  isSubmitting = false,
  depositResultUrl = null,
  errorMessage = null,
  onResetResult,
}) => {
  // Store raw dot-formatted string, e.g. "50.000"
  const [displayAmount, setDisplayAmount] = useState<string>('50.000');
  const [description, setDescription] = useState('Nạp tiền vào ví Sử Ký');
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (!depositResultUrl) {
        setDisplayAmount('50.000');
        setDescription('Nạp tiền vào ví Sử Ký');
        setLocalError(null);
      }
    }
  }, [open, depositResultUrl]);

  const currentNumericAmount = parseNumberFromDots(displayAmount);
  const amountInWords = convertVNDToWords(currentNumericAmount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatNumberWithDots(rawVal);
    setDisplayAmount(formatted);
    setLocalError(null);
  };

  const handleSelectPreset = (value: number) => {
    setDisplayAmount(formatNumberWithDots(value));
    setLocalError(null);
  };

  const handleClearAmount = () => {
    setDisplayAmount('');
    setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const validation = validateDepositAmount(currentNumericAmount);
    if (!validation.valid) {
      setLocalError(validation.error || 'Số tiền nạp không hợp lệ');
      return;
    }

    const cleanDesc = description.trim() || 'Nạp tiền vào ví Sử Ký';
    onSubmitDeposit(currentNumericAmount, cleanDesc);
  };

  const handleClose = () => {
    onOpenChange(false);
    onResetResult?.();
    setLocalError(null);
    setCopiedUrl(false);
  };

  const handleCopyLink = async () => {
    if (!depositResultUrl) return;
    try {
      await navigator.clipboard.writeText(depositResultUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ui="wallet-deposit-dialog"
        className="max-w-md rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] text-[#981B1E] shadow-2xs">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-serif text-lg font-bold text-[#1F1A19]">
                    Nạp Tiền Vào Ví
                  </DialogTitle>
                  <span className="inline-flex items-center rounded-md bg-[#EDFDF2] border border-[#A6E9B9] px-1.5 py-0.5 text-[10px] font-semibold text-[#168A4E]">
                    VNPay
                  </span>
                </div>
                <span className="text-[11px] text-[#786D66]">
                  Cổng thanh toán điện tử chuẩn VNPAY-QR
                </span>
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs text-[#786D66] leading-relaxed pt-1">
            Bổ sung nguồn vốn hoạt động creator qua cổng VNPay (hỗ trợ VNPAY-QR, Thẻ ATM nội địa &amp; Thẻ Quốc tế).
          </DialogDescription>
        </DialogHeader>

        {depositResultUrl ? (
          /* Payment URL Ready State */
          <div className="space-y-5 py-4">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDFDF2] border border-[#A6E9B9] text-[#168A4E]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-[#1F1A19]">
                  Khởi tạo phiên thanh toán thành công
                </h4>
                <p className="text-xs text-[#786D66] max-w-sm mx-auto leading-relaxed">
                  Liên kết VNPay đã được tạo sẵn sàng. Bấm nút bên dưới để mở trang thanh toán chính thức của VNPay.
                </p>
              </div>

              {/* Amount summary pill */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] px-4 py-2">
                <span className="text-xs text-[#786D66]">Số tiền nạp:</span>
                <span className="font-serif text-sm font-bold text-[#981B1E]">
                  {formatNumberWithDots(currentNumericAmount)} ₫
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => window.open(depositResultUrl, '_blank', 'noopener,noreferrer')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#981B1E] px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-colors cursor-pointer"
              >
                <span>Chuyển sang cổng VNPay</span>
                <ExternalLink className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-5 py-2.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-colors cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="h-4 w-4 text-[#168A4E]" />
                    <span className="text-[#168A4E]">Đã sao chép liên kết</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#786D66]" />
                    <span>Sao chép liên kết thanh toán</span>
                  </>
                )}
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

            {/* Amount input with dots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="deposit-amount-input" className="text-xs font-bold text-[#1F1A19]">
                  Số tiền muốn nạp
                </label>
                <span className="text-[11px] text-[#786D66]">
                  Tối thiểu {formatNumberWithDots(MIN_DEPOSIT_AMOUNT)} ₫
                </span>
              </div>

              <div className="relative rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] focus-within:bg-white focus-within:border-[#981B1E] focus-within:ring-2 focus-within:ring-[#981B1E]/10 transition-colors">
                <Input
                  id="deposit-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  required
                  autoFocus
                  className="h-12 border-none bg-transparent pl-4 pr-20 font-serif text-xl font-bold text-[#1F1A19] placeholder:text-[#A89F91] focus-visible:ring-0 shadow-none"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {displayAmount && (
                    <button
                      type="button"
                      onClick={handleClearAmount}
                      aria-label="Xóa số tiền"
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[#A89F91] hover:text-[#1F1A19] hover:bg-[#EBE4D8] transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <span className="rounded-md bg-[#EBE4D8]/60 px-2 py-0.5 font-serif text-[11px] font-bold text-[#786D66]">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Amount in words */}
              {amountInWords ? (
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-[#786D66] animate-in fade-in duration-200">
                  <span className="text-[#A89F91]">Bằng chữ:</span>
                  <span className="font-serif font-semibold text-[#1F1A19] italic">
                    {amountInWords}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-[#A89F91] px-1">
                  Hạn mức: tối đa {formatNumberWithDots(MAX_DEPOSIT_AMOUNT)} ₫ mỗi giao dịch
                </div>
              )}

              {/* Quick chips in structured 3-column grid */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-[#786D66] block">
                  Chọn nhanh mệnh giá:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_DEPOSIT_PRESETS.map((chip) => {
                    const isSelected = currentNumericAmount === chip.value;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => handleSelectPreset(chip.value)}
                        className={cn(
                          'rounded-xl border py-2 px-3 text-xs font-serif font-semibold transition-colors cursor-pointer text-center',
                          isSelected
                            ? 'bg-[#981B1E] border-[#981B1E] text-white shadow-2xs'
                            : 'bg-white border-[#E5E0D8] text-[#38302E] hover:border-[#D5CFC5] hover:bg-[#FAF8F5] active:scale-[0.98]'
                        )}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description input */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="deposit-desc-input" className="text-xs font-bold text-[#1F1A19]">
                Nội dung giao dịch
              </label>
              <Input
                id="deposit-desc-input"
                value={description}
                maxLength={100}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 rounded-xl border-[#E5E0D8] bg-[#FAF8F5] px-3.5 text-xs text-[#1F1A19] focus:bg-white focus:border-[#981B1E] focus-visible:ring-1 focus-visible:ring-[#981B1E]/15 shadow-none"
                placeholder="Nạp tiền vào ví Sử Ký"
              />
            </div>

            {/* Security trust badge */}
            <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] px-3.5 py-2.5 text-[11px] text-[#786D66]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#168A4E] shrink-0" />
                <span>Bảo mật 256-bit SSL</span>
              </div>
              <span className="font-semibold text-[#38302E]">VNPAY-QR • ATM • Visa</span>
            </div>

            {/* Footer actions */}
            <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || currentNumericAmount < MIN_DEPOSIT_AMOUNT}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#981B1E] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang khởi tạo...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo link VNPay</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
