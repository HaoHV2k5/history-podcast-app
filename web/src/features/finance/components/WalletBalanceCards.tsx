import React from 'react';
import {
  Wallet,
  Clock,
  Landmark,
  ArrowUpRight,
  SquareArrowOutUpRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { WalletItem, BankAccountItem } from '@/types/wallet';
import { maskAccountNumber } from '@/utils/formatters';

interface WalletBalanceCardsProps {
  wallet?: WalletItem | null;
  bankAccounts: BankAccountItem[];
  isLoading?: boolean;
  onOpenWithdraw: () => void;
  onOpenDeposit: () => void;
  onOpenAddBank: () => void;
}

export const WalletBalanceCards: React.FC<WalletBalanceCardsProps> = ({
  wallet,
  bankAccounts,
  isLoading = false,
  onOpenWithdraw,
  onOpenDeposit,
  onOpenAddBank,
}) => {
  const availableBalance = wallet?.availableBalance ?? 0;
  const pendingBalance = wallet?.pendingBalance ?? 0;
  const primaryBank = bankAccounts[0];

  const formatDisplayVND = (num: number) => {
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  return (
    <section
      aria-label="Thống kê số dư và tài khoản"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
      data-motion-target="balance-cards"
    >
      {/* ─── CARD 1: Số dư khả dụng ─── */}
      <article
        className="group relative overflow-hidden rounded-2xl border border-[#FCE7E7] bg-[#FFF8F8] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-[210px]"
        data-motion-target="balance-card-item"
      >
        {/* Subtle Pagoda Watermark in the background */}
        <div
          className="absolute right-2 bottom-2 w-28 h-28 pointer-events-none select-none opacity-20 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/assets/studio/wallet-card1-pagoda-clean.png"
            alt=""
            className="w-full h-full object-contain object-bottom-right"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF2F2] border border-[#F9D2D4] text-[#A31D24] shadow-2xs">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#786D66]">Số dư khả dụng</span>
              <div className="font-serif text-3xl font-bold tracking-tight text-[#1F1A19] tabular-nums">
                {isLoading ? '---' : formatDisplayVND(availableBalance)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#786D66] leading-relaxed">
            Tiền sẵn sàng để rút về tài khoản ngân hàng
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 pt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenWithdraw}
            aria-label="Mở hộp thoại rút tiền"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#981B1E] px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Rút tiền</span>
          </button>

          <button
            type="button"
            onClick={onOpenDeposit}
            aria-label="Mở hộp thoại nạp tiền VNPay"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#38302E] shadow-2xs hover:bg-[#FAF8F5] hover:border-[#D5CFC5] active:scale-[0.98] transition-all cursor-pointer"
          >
            <SquareArrowOutUpRight className="h-3.5 w-3.5 text-[#786D66]" />
            <span>Nạp tiền (VNPay)</span>
          </button>
        </div>
      </article>

      {/* ─── CARD 2: Số dư đang chờ duyệt rút ─── */}
      <article
        className="group relative overflow-hidden rounded-2xl border border-[#FDEEDA] bg-[#FFFAF3] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-[210px]"
        data-motion-target="balance-card-item"
      >
        {/* Authentic 3D Glass Hourglass artwork on top-right */}
        <div
          className="absolute right-4 top-3 w-16 h-16 sm:w-20 sm:h-20 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/assets/studio/wallet-card2-hourglass-clean.png"
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/studio/wallet-card-hourglass.png';
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-3 max-w-[70%]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF6E9] border border-[#FDE8CA] text-[#D97706] shadow-2xs">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#786D66]">Số dư đang chờ duyệt rút</span>
              <div className="font-serif text-3xl font-bold tracking-tight text-[#1F1A19] tabular-nums">
                {isLoading ? '---' : formatDisplayVND(pendingBalance)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#786D66] leading-relaxed">
            Đang trong hàng đợi đối soát chuyển khoản ngân hàng
          </p>
        </div>

        {/* Safety Protection Notice */}
        <div className="relative z-10 pt-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#FEF6E9]/90 border border-[#FDE8CA] px-3 py-2 text-[11px] font-medium text-[#92400E]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#D97706]" />
            <span className="leading-snug">
              Tiền được bảo vệ bởi quy trình ký quỹ và đối soát của Sử Ký
            </span>
          </div>
        </div>
      </article>

      {/* ─── CARD 3: Tài khoản ngân hàng liên kết ─── */}
      <article
        className="group relative overflow-hidden rounded-2xl border border-[#DDF1E5] bg-[#F6FBF8] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-[210px]"
        data-motion-target="balance-card-item"
      >
        {/* Authentic Neoclassical Mint Bank artwork on top-right */}
        <div
          className="absolute right-3 top-3 w-20 h-16 sm:w-24 sm:h-20 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/assets/studio/wallet-card3-bank-clean.png"
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/studio/wallet-card-bank.png';
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-3 max-w-[70%]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF8F2] border border-[#CFEBD9] text-[#059669] shadow-2xs">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#786D66]">Tài khoản ngân hàng liên kết</span>
              <div className="font-serif text-3xl font-bold tracking-tight text-[#1F1A19]">
                {bankAccounts.length} tài khoản
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#786D66] leading-relaxed truncate">
            {primaryBank
              ? `${primaryBank.bankName} (${maskAccountNumber(primaryBank.accountNumber)})`
              : 'Chưa liên kết ngân hàng'}
          </p>
        </div>

        {/* Add Bank Button */}
        <div className="relative z-10 pt-3">
          <button
            type="button"
            onClick={onOpenAddBank}
            aria-label="Thêm tài khoản ngân hàng mới"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#38302E] shadow-2xs hover:bg-[#FAF8F5] hover:border-[#D5CFC5] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#786D66]" />
            <span>Thêm tài khoản mới</span>
          </button>
        </div>
      </article>
    </section>
  );
};
