import React, { useState, useRef, useEffect } from 'react';
import { Plus, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { BankAccountItem } from '@/types/wallet';
import {
  resolveBankCardTheme,
  formatCardNumberDisplay,
  formatFullCardNumberDisplay,
  formatCardHolderName,
} from '../bankCardLogic';
import { cn } from '@/utils/cn';
import gsap from 'gsap';

interface CreatorBankCardProps {
  bankAccount?: BankAccountItem | null;
  bankAccounts?: BankAccountItem[];
  onSelectPrimaryBank?: (bankId: number) => void;
  onAddBank?: () => void;
  className?: string;
}

export const CreatorBankCard: React.FC<CreatorBankCardProps> = ({
  bankAccount,
  bankAccounts = [],
  onSelectPrimaryBank,
  onAddBank,
  className,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Micro lift interaction with GSAP (smooth Y-only lift to avoid scale jitter)
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const handleMouseEnter = () => {
      gsap.to(cardEl, {
        y: -2,
        duration: 0.2,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(cardEl, {
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
      });
    };

    cardEl.addEventListener('mouseenter', handleMouseEnter);
    cardEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cardEl.removeEventListener('mouseenter', handleMouseEnter);
      cardEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [bankAccount]);

  // ─── 1. Empty State: Ghost Card ──────────────────────────────────────────
  if (!bankAccount) {
    return (
      <button
        type="button"
        onClick={onAddBank}
        data-ui="bank-card-ghost"
        aria-label="Liên kết tài khoản ngân hàng thụ hưởng"
        className={cn(
          'w-full aspect-[1.58/1] rounded-2xl border-2 border-dashed border-[#DDD7CD] bg-[#FAF8F5]/90 hover:bg-[#F3EFE8] hover:border-[#981B1E]/40 active:scale-[0.99] transition-[background-color,border-color,transform] duration-200 p-5 flex flex-col items-center justify-center text-center cursor-pointer group shadow-2xs',
          className
        )}
      >
        <div className="w-10 h-10 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center text-[#981B1E] group-hover:scale-105 transition-transform duration-200 mb-2.5 shadow-2xs">
          <Plus className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-xs font-semibold text-[#1F1A19] group-hover:text-[#981B1E] transition-colors">
          Liên kết thẻ ngân hàng
        </span>
        <span className="text-[11px] text-[#786D66] mt-0.5">
          Nhận tiền rút tự động về tài khoản chính
        </span>
      </button>
    );
  }

  // ─── 2. Active State: Real Virtual Debit Card ─────────────────────────────
  const theme = resolveBankCardTheme(bankAccount.bankName);
  const cardHolderName = formatCardHolderName(bankAccount.accountHolderName);
  const cardNumberDisplay = showFullNumber
    ? formatFullCardNumberDisplay(bankAccount.accountNumber)
    : formatCardNumberDisplay(bankAccount.accountNumber);

  return (
    <div
      ref={cardRef}
      data-ui="creator-bank-card"
      className={cn(
        'relative w-full aspect-[1.58/1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-xs select-none border box-border',
        theme.bgClass,
        theme.borderClass,
        className
      )}
    >
      {/* Subtle Archival Watermark Pattern */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-white/[0.02] pointer-events-none" />

      {/* Top Row: EMV Chip, Contactless Wave & Official Bank Logo */}
      <div className="flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Metallic Gold EMV Chip */}
          <div className="w-8 h-6 rounded-sm bg-[#D4AF37] border border-[#B89628] p-0.5 shadow-xs relative overflow-hidden flex flex-col justify-between shrink-0">
            <div className="h-[1px] w-full bg-[#8E7118]/60" />
            <div className="h-[1px] w-full bg-[#8E7118]/60" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#8E7118]/60 -translate-x-1/2" />
          </div>

          {/* Contactless Waves Icon */}
          <svg
            className="w-4 h-4 text-white/50 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M8.5 16.5a5 5 0 0 1 0-9" />
            <path d="M12 19a8.5 8.5 0 0 1 0-14" />
            <path d="M15.5 21.5a12 12 0 0 1 0-19" />
          </svg>
        </div>

        {/* Bank Logo or Badge */}
        <div className="flex items-center justify-end h-6 max-w-[130px] shrink-0">
          {!imgFailed && theme.logoUrl ? (
            <img
              src={theme.logoUrl}
              alt={theme.shortName}
              onError={() => setImgFailed(true)}
              className="h-6 max-h-6 max-w-[110px] object-contain brightness-0 invert opacity-95 transition-opacity"
            />
          ) : (
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {theme.shortName}
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Fixed Height Account Number with Eye Toggle */}
      <div className="relative z-10 my-auto py-1 shrink-0">
        <div className="flex items-center justify-between mb-1 h-5">
          <span className="text-[10px] text-white/60 font-medium block">
            Số tài khoản thụ hưởng
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullNumber((prev) => !prev);
            }}
            aria-label={showFullNumber ? 'Ẩn bớt số tài khoản' : 'Hiện đầy đủ số tài khoản'}
            title={showFullNumber ? 'Ẩn bớt số tài khoản' : 'Hiện đầy đủ số tài khoản'}
            className="inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            {showFullNumber ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Ẩn</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Hiện</span>
              </>
            )}
          </button>
        </div>
        <div className="font-mono text-base sm:text-[17px] font-bold tracking-wider text-white tabular-nums drop-shadow-xs whitespace-nowrap overflow-hidden text-ellipsis leading-none h-6 flex items-center">
          {cardNumberDisplay}
        </div>
      </div>

      {/* Bottom Row: Cardholder Name & Primary Card Badge / Switcher */}
      <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10 shrink-0">
        <div className="min-w-0 pr-2">
          <span className="text-[10px] text-white/50 font-medium block">
            Chủ tài khoản
          </span>
          <div className="text-xs font-semibold text-white truncate max-w-[160px] tracking-wide">
            {cardHolderName}
          </div>
        </div>

        {/* Primary Card Selector / Badge */}
        {bankAccounts.length > 1 && onSelectPrimaryBank ? (
          <div className="relative shrink-0">
            <select
              aria-label="Chọn thẻ ngân hàng chính nhận tiền"
              title="Nhấp để đổi thẻ ngân hàng chính"
              value={bankAccount.id}
              onChange={(e) => onSelectPrimaryBank(Number(e.target.value))}
              className="appearance-none bg-white/15 hover:bg-white/20 text-white text-[10px] font-semibold pl-4 pr-5 py-0.5 rounded-full border border-white/20 cursor-pointer focus:outline-none transition-colors"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id} className="text-[#1F1A19] bg-white">
                  {b.bankName} (•• {b.accountNumber.slice(-4)}) {b.id === bankAccount.id ? '— Mặc định' : ''}
                </option>
              ))}
            </select>
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 pointer-events-none" />
            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white/70 pointer-events-none" />
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold text-white/90">
              Thẻ chính
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
