import React, { useState, useEffect } from 'react';
import {
  Clock,
  Landmark,
  ArrowUpRight,
  SquareArrowOutUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { WalletItem, BankAccountItem } from '@/types/wallet';
import { CreatorBankCard } from './CreatorBankCard';
import { MarqueeText } from '@/components/common/MarqueeText';
import { resolveBankCardTheme } from '../bankCardLogic';
import { cn } from '@/utils/cn';

interface WalletBalanceCardsProps {
  wallet?: WalletItem | null;
  bankAccounts: BankAccountItem[];
  primaryBankId?: number | null;
  onSelectPrimaryBank?: (bankId: number) => void;
  isLoading?: boolean;
  onOpenWithdraw: () => void;
  onOpenDeposit: () => void;
  onOpenAddBank: () => void;
  className?: string;
}

export const WalletBalanceCards: React.FC<WalletBalanceCardsProps> = ({
  wallet,
  bankAccounts,
  primaryBankId,
  onSelectPrimaryBank,
  isLoading = false,
  onOpenWithdraw,
  onOpenDeposit,
  onOpenAddBank,
  className,
}) => {
  const availableBalance = wallet?.availableBalance ?? 0;
  const pendingBalance = wallet?.pendingBalance ?? 0;
  const primaryBank =
    bankAccounts.find((b) => b.id === primaryBankId) || bankAccounts[0] || null;

  const [viewingBankId, setViewingBankId] = useState<number | null>(() => primaryBank?.id ?? null);

  // Sync viewingBankId if bank list changes or primary is set
  useEffect(() => {
    if (viewingBankId && !bankAccounts.some((b) => b.id === viewingBankId)) {
      setViewingBankId(primaryBank?.id ?? null);
    }
  }, [bankAccounts, primaryBank, viewingBankId]);

  const activeBank = bankAccounts.find((b) => b.id === viewingBankId) || primaryBank;
  const isCurrentActivePrimary = activeBank?.id === (primaryBankId || bankAccounts[0]?.id);

  const currentIndex = Math.max(
    0,
    bankAccounts.findIndex((b) => b.id === activeBank?.id)
  );

  const handlePrevCard = () => {
    if (bankAccounts.length <= 1) return;
    const nextIdx = (currentIndex - 1 + bankAccounts.length) % bankAccounts.length;
    setViewingBankId(bankAccounts[nextIdx].id);
  };

  const handleNextCard = () => {
    if (bankAccounts.length <= 1) return;
    const nextIdx = (currentIndex + 1) % bankAccounts.length;
    setViewingBankId(bankAccounts[nextIdx].id);
  };

  const formatDisplayVND = (num: number) => {
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  return (
    <article
      data-ui="wallet-balance-panel"
      data-motion-target="balance-card-item"
      className={cn(
        'rounded-2xl border border-[#E5E0D8] bg-white p-5 sm:p-7 shadow-2xs flex flex-col justify-between space-y-6',
        className
      )}
    >
      {/* Top: Balance & Quick Actions on Left, Digital Bank Card on Right */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Left: Available Balance & Action Buttons */}
        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#786D66]">
              Số Dư Khả Dụng
            </span>
            <div className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1A19] tabular-nums">
              {isLoading ? '---' : formatDisplayVND(availableBalance)}
            </div>
            <p className="text-xs text-[#786D66] max-w-sm">
              Tiền sẵn sàng để rút về tài khoản ngân hàng liên kết.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onOpenWithdraw}
              aria-label="Mở hộp thoại rút tiền"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#981B1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#801619] active:scale-[0.98] transition-[background-color,transform] duration-150 cursor-pointer shadow-xs"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Rút tiền</span>
            </button>

            <button
              type="button"
              onClick={onOpenDeposit}
              aria-label="Mở hộp thoại nạp tiền VNPay"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DDD7CD] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#292524] hover:bg-[#FAF8F5] hover:border-[#C5BEB3] active:scale-[0.98] transition-[background-color,border-color,transform] duration-150 cursor-pointer"
            >
              <SquareArrowOutUpRight className="h-3.5 w-3.5 text-[#786D66]" />
              <span>Nạp tiền</span>
            </button>
          </div>
        </div>

        {/* Right: Virtual Bank Card of Creator with multi-card carousel */}
        <div className="w-full sm:w-[320px] md:w-[330px] shrink-0 flex flex-col gap-2">
          {/* Card Carousel Navigation Header (when multiple cards exist) */}
          {bankAccounts.length > 1 && (
            <div className="flex items-center justify-between px-1 text-xs text-[#786D66]">
              <div className="flex items-center gap-1.5 font-medium">
                <span>Thẻ thụ hưởng</span>
                <span className="text-[10px] font-semibold text-[#1F1A19] bg-[#F4EFEA] px-2 py-0.5 rounded-full">
                  {bankAccounts.length} thẻ
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  aria-label="Xem thẻ trước"
                  title="Thẻ trước"
                  className="p-1 rounded-md text-[#786D66] hover:text-[#1F1A19] hover:bg-[#FAF8F5] border border-[#DDD7CD] active:scale-95 transition-[color,background-color,border-color,transform] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-[#1F1A19] tabular-nums min-w-[34px] text-center">
                  {currentIndex + 1} / {bankAccounts.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextCard}
                  aria-label="Xem thẻ tiếp theo"
                  title="Thẻ tiếp theo"
                  className="p-1 rounded-md text-[#786D66] hover:text-[#1F1A19] hover:bg-[#FAF8F5] border border-[#DDD7CD] active:scale-95 transition-[color,background-color,border-color,transform] cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <CreatorBankCard
            bankAccount={activeBank}
            bankAccounts={bankAccounts}
            isPrimary={isCurrentActivePrimary}
            onSelectPrimaryBank={onSelectPrimaryBank}
            onAddBank={onOpenAddBank}
            className="w-full"
          />

          {/* Quick Card Switcher Track (smooth horizontal scroll if > 3 cards) */}
          {bankAccounts.length > 1 && (
            <div
              className="flex items-center gap-1.5 overflow-x-auto py-0.5 w-full justify-start xl:justify-end no-scrollbar"
              aria-label="Chọn thẻ hiển thị nhanh"
            >
              {bankAccounts.map((b) => {
                const bTheme = resolveBankCardTheme(b.bankName);
                const isSelected = b.id === activeBank?.id;
                const isCardPrimary = b.id === (primaryBankId || bankAccounts[0]?.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setViewingBankId(b.id)}
                    aria-pressed={isSelected}
                    title={`${b.bankName} (${b.accountNumber})${isCardPrimary ? ' - Thẻ chính' : ''}`}
                    className={cn(
                      'shrink-0 px-2 py-0.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-[background-color,border-color,color] cursor-pointer',
                      isSelected
                        ? 'bg-[#1F1A19] text-white border-[#1F1A19] shadow-2xs'
                        : 'bg-white text-[#574E4A] border-[#DDD7CD] hover:border-[#1F1A19]/40 hover:bg-[#FAF8F5]'
                    )}
                  >
                    <span className="font-semibold text-[11px]">{bTheme.code}</span>
                    <span className="text-[10px] opacity-80 tabular-nums">
                      ••{b.accountNumber.slice(-4)}
                    </span>
                    {isCardPrimary && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                        title="Thẻ chính"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sub-Metrics: Pending Balance & Linked Bank Account */}
      <div className="border-t border-[#EFEAE2] pt-4 mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sub-metric 1: Đang chờ duyệt rút */}
        <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#786D66]">
            <Clock className="h-3.5 w-3.5 text-[#786D66]" />
            <span>Đang chờ duyệt rút</span>
          </div>
          <div className="font-serif text-lg font-bold text-[#1F1A19] tabular-nums">
            {isLoading ? '---' : formatDisplayVND(pendingBalance)}
          </div>
          <span className="text-[11px] text-[#786D66] block">
            Trong hàng đợi đối soát chuyển khoản
          </span>
        </div>

        {/* Sub-metric 2: Phương thức thanh toán */}
        <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3.5 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#786D66] shrink-0">
                <Landmark className="h-3.5 w-3.5 text-[#786D66]" />
                <span>Phương thức thanh toán</span>
              </div>
              <button
                type="button"
                onClick={onOpenAddBank}
                className="text-[11px] font-semibold text-[#981B1E] hover:underline cursor-pointer shrink-0"
              >
                + Thêm tài khoản
              </button>
            </div>
            <MarqueeText
              text={primaryBank ? `${primaryBank.bankName} (Mặc định)` : 'Chưa có tài khoản'}
              className="font-serif text-sm font-semibold text-[#1F1A19]"
            />
            <span className="text-[11px] text-[#786D66] block">
              {bankAccounts.length > 1
                ? `Đã liên kết ${bankAccounts.length} tài khoản • Chọn thẻ chính ở trên hoặc bảng dưới`
                : primaryBank
                ? 'Sẵn sàng nhận tiền quyết toán tự động'
                : 'Thêm tài khoản để kích hoạt rút tiền'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
