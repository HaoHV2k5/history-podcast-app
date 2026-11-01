import React, { useState } from 'react';
import { Building2, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { validateBankAccount } from '../financeLogic';

const POPULAR_VIETNAMESE_BANKS = [
  'Vietcombank (Ngân hàng Ngoại thương Việt Nam)',
  'MB Bank (Ngân hàng Quân đội)',
  'Techcombank (Ngân hàng Kỹ thương)',
  'BIDV (Ngân hàng Đầu tư và Phát triển)',
  'VietinBank (Ngân hàng Công thương)',
  'ACB (Ngân hàng Á Châu)',
  'VPBank (Ngân hàng Việt Nam Thịnh Vượng)',
  'TPBank (Ngân hàng Tiên Phong)',
  'Sacombank (Ngân hàng Sài Gòn Thương Tín)',
  'Agribank (Ngân hàng Nông nghiệp & PTNT)',
];

interface WalletAddBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitAddBank: (bankName: string, accountNumber: string, accountHolderName: string) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export const WalletAddBankDialog: React.FC<WalletAddBankDialogProps> = ({
  open,
  onOpenChange,
  onSubmitAddBank,
  isSubmitting = false,
  errorMessage = null,
}) => {
  const [bankName, setBankName] = useState(POPULAR_VIETNAMESE_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const validation = validateBankAccount(bankName, accountNumber, accountHolderName);
    if (!validation.valid) {
      setLocalError(validation.error || 'Thông tin tài khoản không hợp lệ');
      return;
    }

    onSubmitAddBank(
      bankName,
      accountNumber.trim(),
      accountHolderName.trim().toUpperCase()
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setLocalError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF8F2] border border-[#CFEBD9] text-[#059669]">
              <Building2 className="h-5 w-5" />
            </div>
            <DialogTitle className="font-serif text-lg font-bold text-[#1F1A19]">
              Thêm Tài Khoản Ngân Hàng
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#786D66] leading-relaxed">
            Nhập chính xác thông tin tài khoản ngân hàng chính chủ để thực hiện rút tiền an toàn và đối soát thuận tiện.
          </DialogDescription>
        </DialogHeader>

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

          <div className="space-y-1.5">
            <label htmlFor="bank-name-select" className="text-xs font-bold text-[#1F1A19]">
              Ngân hàng thụ hưởng
            </label>
            <select
              id="bank-name-select"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-[#1F1A19] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#981B1E]"
            >
              {POPULAR_VIETNAMESE_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bank-account-num-input" className="text-xs font-bold text-[#1F1A19]">
              Số tài khoản ngân hàng
            </label>
            <Input
              id="bank-account-num-input"
              placeholder="Ví dụ: 1029384756..."
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setLocalError(null);
              }}
              required
              className="h-10 rounded-xl border-[#E5E0D8] bg-[#FAF8F5] px-3.5 font-mono text-xs font-bold text-[#1F1A19] focus:bg-white focus:border-[#981B1E]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bank-holder-input" className="text-xs font-bold text-[#1F1A19]">
              Tên chủ tài khoản (In hoa không dấu)
            </label>
            <Input
              id="bank-holder-input"
              placeholder="Ví dụ: NGUYEN VAN A"
              value={accountHolderName}
              onChange={(e) => {
                setAccountHolderName(e.target.value.toUpperCase());
                setLocalError(null);
              }}
              required
              className="h-10 rounded-xl border-[#E5E0D8] bg-[#FAF8F5] px-3.5 font-mono text-xs font-bold text-[#1F1A19] uppercase focus:bg-white focus:border-[#981B1E]"
            />
            <p className="text-[11px] text-[#786D66]">
              Tên tài khoản ngân hàng cần trùng khớp với họ và tên xác thực KYC.
            </p>
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
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu tài khoản'}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
