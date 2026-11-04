import React, { useState, useRef, useEffect } from 'react';
import { Plus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
  isPrimary?: boolean;
  onSelectPrimaryBank?: (bankId: number) => void;
  onAddBank?: () => void;
  className?: string;
}

export const CreatorBankCard: React.FC<CreatorBankCardProps> = ({
  bankAccount,
  isPrimary = true,
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
      {/* Subtle Archival Watermark Pattern (SVG dot grid) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="card-dot-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#FFFFFF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-dot-pattern)" />
      </svg>

      {/* Decorative ambient glass light reflection */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/20 blur-xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Row: Chip, Contactless & Bank Brand */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          {/* Authentic Metallic EMV Gold Chip */}
          <div className="w-10 h-7 rounded-md bg-[#D4AF37] border border-[#F3E2B8]/60 flex flex-col justify-between p-1 relative overflow-hidden">
            <div className="w-full h-[1px] bg-black/25" />
            <div className="flex justify-between w-full">
              <div className="w-1.5 h-2 rounded-[1px] border border-black/25" />
              <div className="w-1.5 h-2 rounded-[1px] border border-black/25" />
            </div>
            <div className="w-full h-[1px] bg-black/25" />
          </div>

          {/* Contactless Wave Icon */}
          <svg
            className="w-4 h-4 text-white/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-2.5" />
            <path d="M5 18a6 6 0 0 0 6-6c0-3.3-1.5-5-2.5-6" />
            <path d="M2 21a9.5 9.5 0 0 0 10-9.5C12 7 9.5 4.5 8 3" />
          </svg>
        </div>

        {/* Bank Brand Logo */}
        <div className="flex items-center gap-2">
          {theme.logoUrl && !imgFailed ? (
            <img
              src={theme.logoUrl}
              alt={theme.shortName}
              onError={() => setImgFailed(true)}
              className="h-5 max-w-[90px] object-contain brightness-0 invert"
            />
          ) : (
            <span className="font-serif font-black text-sm tracking-wider text-white/95">
              {theme.shortName}
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Masked Card Number with Toggle Eye */}
      <div className="relative z-10 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/60 tracking-wider font-medium">
            Số tài khoản thụ hưởng
          </span>
          <button
            type="button"
            onClick={() => setShowFullNumber((prev) => !prev)}
            aria-label={showFullNumber ? 'Ẩn bớt số tài khoản' : 'Hiện đầy đủ số tài khoản'}
            title={showFullNumber ? 'Ẩn bớt số tài khoản' : 'Hiện đầy đủ số tài khoản'}
            className="inline-flex items-center gap-1 text-[10px] text-white/80 hover:text-white px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
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
        <div className="font-mono text-base sm:text-[17px] font-bold tracking-wider text-white tabular-nums whitespace-nowrap overflow-hidden text-ellipsis leading-none h-6 flex items-center">
          {cardNumberDisplay}
        </div>
      </div>

      {/* Bottom Row: Cardholder Name & Primary Card Badge */}
      <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10 shrink-0 gap-2">
        <div className="min-w-0 pr-1">
          <span className="text-[9px] uppercase tracking-wider text-white/50 font-medium block whitespace-nowrap">
            Chủ tài khoản
          </span>
          <div className="text-xs sm:text-[13px] font-bold text-white truncate max-w-[170px] tracking-wide font-sans">
            {cardHolderName}
          </div>
        </div>

        {/* Primary Status or Action Button */}
        {isPrimary ? (
          <div className="shrink-0 flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-300 tracking-wide">
              Thẻ chính
            </span>
          </div>
        ) : onSelectPrimaryBank ? (
          <button
            type="button"
            onClick={() => onSelectPrimaryBank(bankAccount.id)}
            title="Nhấp để đặt thẻ này làm tài khoản chính"
            className="shrink-0 inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full border border-white/25 text-[10px] font-medium text-white shadow-2xs transition-[background-color,border-color,transform] duration-150 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <CheckCircle2 className="w-3 h-3 text-white/70" />
            <span>Đặt làm thẻ chính</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
