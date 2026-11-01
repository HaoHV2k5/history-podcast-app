import React from 'react';
import { Calendar, ArrowRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { WalletTransactionItem } from '@/types/transaction';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { shouldDisplayRecentTransactions, getRecentTransactionTitle } from '../financeLogic';

interface WalletRecentTransactionsCardProps {
  transactions: WalletTransactionItem[];
  onViewAll: () => void;
  onSelectTransaction: (tx: WalletTransactionItem) => void;
  className?: string;
}

export const WalletRecentTransactionsCard: React.FC<WalletRecentTransactionsCardProps> = ({
  transactions,
  onViewAll,
  onSelectTransaction,
  className,
}) => {
  // STRICT RULE: If no real transactions exist, do NOT display this card at all (NO fake data)
  if (!shouldDisplayRecentTransactions(transactions)) {
    return null;
  }

  // Display top 4 latest real transactions
  const recentItems = transactions.slice(0, 4);

  const getTransactionSubtitle = (tx: WalletTransactionItem): string => {
    if (tx.description && tx.description.trim().length > 0) {
      return tx.description;
    }
    return `Mã GD #${tx.id}`;
  };

  const formatTxDate = (dateStr?: string): string => {
    if (!dateStr) return '---';
    try {
      return formatDateTime(dateStr);
    } catch {
      return dateStr;
    }
  };

  return (
    <article
      aria-label="Giao dịch gần đây"
      className={cn(
        'rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all duration-200 select-none',
        className
      )}
      data-motion-target="recent-transactions-card"
    >
      {/* Card Header: Red Calendar Icon + Title + "Xem tất cả ->" */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#F4EFE6]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-[#981B1E]" />
          <h2 className="text-sm font-bold text-[#1F1A19]">Giao dịch gần đây</h2>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          aria-label="Xem toàn bộ lịch sử giao dịch"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#981B1E] hover:underline active:opacity-75 transition-colors cursor-pointer group"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Transaction Items List */}
      <div className="divide-y divide-[#F4EFE6] pt-1">
        {recentItems.map((tx) => {
          const isPositive = tx.amount > 0;
          const title = getRecentTransactionTitle(tx.type, tx.amount);
          const subtitle = getTransactionSubtitle(tx);
          const formattedDate = formatTxDate(tx.createdAt);
          const formattedAmount = `${isPositive ? '+' : '-'} ${Math.abs(tx.amount).toLocaleString('vi-VN')} đ`;

          return (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTransaction(tx);
                }
              }}
              aria-label={`Xem chi tiết giao dịch ${title}: ${formattedAmount}`}
              className="py-3.5 flex items-center justify-between gap-3 group hover:bg-[#FAF8F5] -mx-2 px-2 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#981B1E]"
            >
              {/* Left: Direction Circle Icon + Title & Subtitle */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-2xs transition-transform duration-200 group-hover:scale-105',
                    isPositive
                      ? 'bg-[#EDFDF2] text-[#168A4E] border border-[#A6E9B9]'
                      : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                  )}
                >
                  {isPositive ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-[#1F1A19] truncate group-hover:text-[#981B1E] transition-colors">
                    {title}
                  </p>
                  <p className="text-[11px] text-[#786D66] truncate max-w-[200px] sm:max-w-[260px]">
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* Right: Formatted Amount + Date */}
              <div className="text-right shrink-0 space-y-0.5 pl-2">
                <div
                  className={cn(
                    'font-bold text-xs tabular-nums',
                    isPositive ? 'text-[#168A4E]' : 'text-[#DC2626]'
                  )}
                >
                  {formattedAmount}
                </div>
                <div className="text-[10px] text-[#A89F91] font-medium">
                  {formattedDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
};
