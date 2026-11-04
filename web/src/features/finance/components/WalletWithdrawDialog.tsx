import React, { useState } from 'react';
import { ArrowUpRight, AlertCircle, Building2, ShieldCheck, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BankAccountItem, WalletItem } from '@/types/wallet';
import { validateWithdrawalAmount } from '../financeLogic';
import {
  formatNumberWithDots,
  parseNumberFromDots,
  convertVNDToWords,
} from '../depositLogic';
import { maskAccountNumber } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface WalletWithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: WalletItem | null;
  bankAccounts: BankAccountItem[];
  defaultBankAccountId?: number | null;
  onSubmitWithdraw: (amount: number, bankAccountId: number) => void;
  isSubmitting?: boolean;
  onOpenAddBank: () => void;
}

const QUICK_WITHDRAW_PRESETS = [
  { value: 50000, label: '50.000 ₫' },
  { value: 100000, label: '100.000 ₫' },
  { value: 200000, label: '200.000 ₫' },
  { value: 500000, label: '500.000 ₫' },
  { value: 1000000, label: '1.000.000 ₫' },
];

export const WalletWithdrawDialog: React.FC<WalletWithdrawDialogProps> = ({
  open,
  onOpenChange,
  wallet,
  bankAccounts,
  defaultBankAccountId,
  onSubmitWithdraw,
  isSubmitting = false,
  onOpenAddBank,
}) => {
  const availableBalance = wallet?.availableBalance ?? 0;
  const [displayAmount, setDisplayAmount] = useState<string>('50.000');
  const [selectedBankId, setSelectedBankId] = useState<string>(
    defaultBankAccountId ? String(defaultBankAccountId) : bankAccounts[0]?.id ? String(bankAccounts[0].id) : ''
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep selectedBankId in sync with defaultBankAccountId when dialog opens
  React.useEffect(() => {
    if (open) {
      if (defaultBankAccountId && bankAccounts.some((b) => b.id === defaultBankAccountId)) {
        setSelectedBankId(String(defaultBankAccountId));
      } else if (bankAccounts[0]?.id) {
        setSelectedBankId(String(bankAccounts[0].id));
      }
    }
  }, [open, defaultBankAccountId, bankAccounts]);

  const currentNumericAmount = parseNumberFromDots(displayAmount);
  const amountInWords = convertVNDToWords(currentNumericAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateWithdrawalAmount(currentNumericAmount, availableBalance);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Số tiền rút không hợp lệ');
      return;
    }

    const bId = selectedBankId ? parseInt(selectedBankId, 10) : bankAccounts[0]?.id;
    if (!bId) {
      setErrorMessage('Vui lòng chọn hoặc thêm tài khoản ngân hàng để nhận tiền');
      return;
    }

    onSubmitWithdraw(currentNumericAmount, bId);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setDisplayAmount(formatNumberWithDots(rawVal));
    setErrorMessage(null);
  };

  const handleSelectQuickChip = (val: number) => {
    setDisplayAmount(formatNumberWithDots(val));
    setErrorMessage(null);
  };

  const handleClearAmount = () => {
    setDisplayAmount('');
    setErrorMessage(null);
  };

  const handleSelectAll = () => {
    if (availableBalance < 50000) {
      setErrorMessage('Số dư khả dụng tối thiểu để rút là 50.000 VNĐ');
      return;
    }
    setDisplayAmount(formatNumberWithDots(availableBalance));
    setErrorMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ui="wallet-withdraw-dialog"
        className="max-w-md rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-2xl"
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF2F2] border border-[#F9D2D4] text-[#A31D24] shadow-2xs">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#1F1A19]">
                Yêu Cầu Rút Tiền Về Ngân Hàng
              </DialogTitle>
              <span className="text-[11px] text-[#786D66]">
                Xử lý chuyển khoản tự động trong 24-48 giờ làm việc
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-[#786D66] leading-relaxed pt-1">
            Số dư khả dụng hiện tại: <strong className="text-[#1F1A19] font-serif font-bold">{formatNumberWithDots(availableBalance)} ₫</strong>. Hạn mức rút tối thiểu 50.000 ₫.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Error Notice */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3 text-xs text-[#DC2626] font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="withdraw-amount-input" className="text-xs font-bold text-[#1F1A19]">
                Số tiền muốn rút
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-[#981B1E] hover:underline cursor-pointer"
              >
                Rút tất cả ({formatNumberWithDots(availableBalance)} ₫)
              </button>
            </div>

            <div className="relative rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] focus-within:bg-white focus-within:border-[#981B1E] focus-within:ring-2 focus-within:ring-[#981B1E]/10 transition-colors">
              <Input
                id="withdraw-amount-input"
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="0"
                required
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
            {amountInWords && (
              <div className="flex items-center gap-1.5 px-1 text-[11px] text-[#786D66] animate-in fade-in duration-200">
                <span className="text-[#A89F91]">Bằng chữ:</span>
                <span className="font-serif font-semibold text-[#1F1A19] italic">
                  {amountInWords}
                </span>
              </div>
            )}

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {QUICK_WITHDRAW_PRESETS.map((chip) => {
                const isSelected = currentNumericAmount === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleSelectQuickChip(chip.value)}
                    className={cn(
                      'rounded-xl border py-1.5 px-3 text-xs font-serif font-medium transition-colors cursor-pointer',
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

          {/* Bank account selection */}
          <div className="space-y-1.5">
            <label htmlFor="withdraw-bank-select" className="text-xs font-bold text-[#1F1A19]">
              Tài khoản ngân hàng thụ hưởng
            </label>

            {bankAccounts.length === 0 ? (
              <div className="rounded-xl bg-[#FFFBF5] border border-[#FDEEDA] p-3 text-xs text-[#92400E] space-y-2.5">
                <p>Bạn chưa liên kết tài khoản ngân hàng nào để nhận tiền.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenAddBank();
                  }}
                  className="w-full text-xs font-semibold rounded-xl border-[#E5E0D8] bg-white hover:bg-[#FAF8F5]"
                >
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  Thêm tài khoản ngân hàng ngay
                </Button>
              </div>
            ) : (
              <select
                id="withdraw-bank-select"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-[#1F1A19] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#981B1E]"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {maskAccountNumber(b.accountNumber)} ({b.accountHolderName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fee & Security assurance */}
          <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] p-3 space-y-1 text-[11px] text-[#786D66]">
            <div className="flex items-center gap-1.5 font-semibold text-[#1F1A19]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
              <span>Chính sách Nền tảng &amp; Cam kết SLA Rút Tiền</span>
            </div>
            <p>
              • Miễn phí 100% phí rút tiền (0% phí sàn), hạn mức rút tối thiểu 50.000 VNĐ.
            </p>
            <p>
              • Thời gian xử lý &amp; đối soát: Tối đa 2 ngày làm việc theo cam kết SLA nền tảng Sử Ký.
            </p>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || bankAccounts.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Đang gửi yêu cầu...' : 'Xác nhận rút tiền'}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
