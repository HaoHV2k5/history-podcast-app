import React, { useState } from 'react';
import { ArrowUpRight, AlertCircle, Building2, ShieldCheck, Loader2 } from 'lucide-react';
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
import { maskAccountNumber } from '@/utils/formatters';

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

const QUICK_AMOUNT_CHIPS = [50000, 100000, 200000, 500000, 1000000];

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
  const [amountStr, setAmountStr] = useState<string>('50000');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amt = parseFloat(amountStr);
    const validation = validateWithdrawalAmount(amt, availableBalance);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Số tiền rút không hợp lệ');
      return;
    }

    const bId = selectedBankId ? parseInt(selectedBankId, 10) : bankAccounts[0]?.id;
    if (!bId) {
      setErrorMessage('Vui lòng chọn hoặc thêm tài khoản ngân hàng để nhận tiền');
      return;
    }

    onSubmitWithdraw(amt, bId);
  };

  const handleSelectQuickChip = (val: number) => {
    setAmountStr(String(val));
    setErrorMessage(null);
  };

  const handleSelectAll = () => {
    if (availableBalance < 50000) {
      setErrorMessage('Số dư khả dụng tối thiểu để rút là 50.000 VNĐ');
      return;
    }
    setAmountStr(String(availableBalance));
    setErrorMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF2F2] border border-[#F9D2D4] text-[#A31D24]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <DialogTitle className="font-serif text-lg font-bold text-[#1F1A19]">
              Yêu Cầu Rút Tiền Về Ngân Hàng
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#786D66] leading-relaxed">
            Số dư khả dụng hiện tại: <strong className="text-[#1F1A19] font-mono font-bold">{availableBalance.toLocaleString('vi-VN')} đ</strong>. Hạn mức rút tối thiểu 50.000 VNĐ.
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
                Số tiền muốn rút (VNĐ)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-[#981B1E] hover:underline cursor-pointer"
              >
                Rút tất cả
              </button>
            </div>

            <div className="relative">
              <Input
                id="withdraw-amount-input"
                type="number"
                min={50000}
                step={10000}
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMessage(null);
                }}
                required
                className="h-11 rounded-xl border-[#E5E0D8] bg-[#FAF8F5] px-3.5 font-mono text-base font-bold text-[#1F1A19] focus:bg-white focus:border-[#981B1E]"
                placeholder="Nhập số tiền..."
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-[#786D66]">
                VNĐ
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {QUICK_AMOUNT_CHIPS.map((chipVal) => (
                <button
                  key={chipVal}
                  type="button"
                  onClick={() => handleSelectQuickChip(chipVal)}
                  className="rounded-lg border border-[#E5E0D8] bg-white px-2.5 py-1 text-[11px] font-mono font-medium text-[#38302E] hover:bg-[#FAF8F5] hover:border-[#D5CFC5] active:scale-95 transition-all cursor-pointer"
                >
                  {(chipVal / 1000).toLocaleString('vi-VN')}k
                </button>
              ))}
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
              className="rounded-xl border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || bankAccounts.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
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
