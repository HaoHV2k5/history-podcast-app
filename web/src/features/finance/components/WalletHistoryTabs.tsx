import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { WalletTransactionItem } from '@/types/transaction';
import { WithdrawalItem } from '@/types/withdrawal';
import { BankAccountItem } from '@/types/wallet';
import { formatDateTime, formatDate, maskAccountNumber } from '@/utils/formatters';
import { formatTransactionBadge } from '../financeLogic';
import { cn } from '@/utils/cn';

interface WalletHistoryTabsProps {
  activeTab: 'transactions' | 'withdrawals' | 'banks';
  onTabChange: (tab: 'transactions' | 'withdrawals' | 'banks') => void;
  transactions: WalletTransactionItem[];
  withdrawals: WithdrawalItem[];
  bankAccounts: BankAccountItem[];
  primaryBankId?: number | null;
  onSelectPrimaryBank?: (bankId: number) => void;
  isLoadingTx?: boolean;
  isLoadingWithdrawals?: boolean;
  isLoadingBanks?: boolean;
  onOpenWithdraw: () => void;
  onOpenAddBank: () => void;
  onDeleteBank: (id: number) => void;
  onSelectTransaction?: (tx: WalletTransactionItem) => void;
  isDeletingBank?: boolean;
}

export const WalletHistoryTabs: React.FC<WalletHistoryTabsProps> = ({
  activeTab,
  onTabChange,
  transactions,
  withdrawals,
  bankAccounts,
  primaryBankId,
  onSelectPrimaryBank,
  isLoadingTx = false,
  isLoadingWithdrawals = false,
  isLoadingBanks = false,
  onOpenWithdraw,
  onOpenAddBank,
  onDeleteBank,
  onSelectTransaction,
  isDeletingBank = false,
}) => {
  const navigate = useNavigate();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const dateFilterLabels: Record<'7d' | '30d' | '90d' | 'all', string> = {
    '7d': '7 ngày qua',
    '30d': '30 ngày qua',
    '90d': '90 ngày qua',
    all: 'Tất cả thời gian',
  };

  // Filter transactions by date
  const filteredTransactions = React.useMemo(() => {
    if (dateFilter === 'all') return transactions;
    const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return transactions.filter((tx) => {
      if (!tx.createdAt) return true;
      const txDate = new Date(tx.createdAt);
      return isNaN(txDate.getTime()) ? true : txDate >= cutoff;
    });
  }, [transactions, dateFilter]);

  // Filter withdrawals by date
  const filteredWithdrawals = React.useMemo(() => {
    if (dateFilter === 'all') return withdrawals;
    const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return withdrawals.filter((w) => {
      if (!w.requestedAt) return true;
      const wDate = new Date(w.requestedAt);
      return isNaN(wDate.getTime()) ? true : wDate >= cutoff;
    });
  }, [withdrawals, dateFilter]);

  const formatDisplayVND = (num: number) => {
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  return (
    <section
      aria-label="Lịch sử giao dịch và tài khoản liên kết"
      className="space-y-4"
      data-ui="wallet-history-tabs"
      data-motion-target="history-tabs-container"
    >
      {/* ─── TAB NAVIGATION BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE4D8] pb-1">
        {/* Tab Buttons */}
        <div
          role="tablist"
          aria-label="Bộ lọc loại lịch sử tài chính"
          className="flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none pb-px"
        >
          {/* Tab 1: Biến động số dư */}
          <button
            type="button"
            role="tab"
            id="tab-transactions"
            aria-selected={activeTab === 'transactions'}
            aria-controls="tabpanel-transactions"
            onClick={() => onTabChange('transactions')}
            className={cn(
              'group relative flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer border-b-2',
              activeTab === 'transactions'
                ? 'border-[#981B1E] text-[#981B1E]'
                : 'border-transparent text-[#786D66] hover:text-[#1F1A19]'
            )}
          >
            <Receipt className="h-4 w-4" />
            <span>Lịch sử biến động số dư</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold transition-colors',
                activeTab === 'transactions'
                  ? 'bg-[#FDF2F2] text-[#A31D24]'
                  : 'bg-[#F4EFEA] text-[#786D66]'
              )}
            >
              {filteredTransactions.length}
            </span>
          </button>

          {/* Tab 2: Lịch sử rút tiền */}
          <button
            type="button"
            role="tab"
            id="tab-withdrawals"
            aria-selected={activeTab === 'withdrawals'}
            aria-controls="tabpanel-withdrawals"
            onClick={() => onTabChange('withdrawals')}
            className={cn(
              'group relative flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer border-b-2',
              activeTab === 'withdrawals'
                ? 'border-[#981B1E] text-[#981B1E]'
                : 'border-transparent text-[#786D66] hover:text-[#1F1A19]'
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span>Lịch sử rút tiền</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold transition-colors',
                activeTab === 'withdrawals'
                  ? 'bg-[#FDF2F2] text-[#A31D24]'
                  : 'bg-[#F4EFEA] text-[#786D66]'
              )}
            >
              {filteredWithdrawals.length}
            </span>
          </button>

          {/* Tab 3: Ngân hàng liên kết */}
          <button
            type="button"
            role="tab"
            id="tab-banks"
            aria-selected={activeTab === 'banks'}
            aria-controls="tabpanel-banks"
            onClick={() => onTabChange('banks')}
            className={cn(
              'group relative flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer border-b-2',
              activeTab === 'banks'
                ? 'border-[#981B1E] text-[#981B1E]'
                : 'border-transparent text-[#786D66] hover:text-[#1F1A19]'
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>Tài khoản ngân hàng liên kết</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold transition-colors',
                activeTab === 'banks'
                  ? 'bg-[#FDF2F2] text-[#A31D24]'
                  : 'bg-[#F4EFEA] text-[#786D66]'
              )}
            >
              {bankAccounts.length}
            </span>
          </button>
        </div>

        {/* Right side: Date Filter Dropdown */}
        <div className="relative self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen((prev) => !prev)}
            aria-label="Chọn khoảng thời gian lọc"
            aria-haspopup="true"
            aria-expanded={filterDropdownOpen}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-1.5 text-xs font-medium text-[#38302E] shadow-2xs hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-[#786D66]" />
            <span>{dateFilterLabels[dateFilter]}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#786D66]" />
          </button>

          {filterDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setFilterDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-[#EBE4D8] bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                {(['7d', '30d', '90d', 'all'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDateFilter(key);
                      setFilterDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer',
                      dateFilter === key
                        ? 'bg-[#FDF2F2] font-semibold text-[#981B1E]'
                        : 'text-[#38302E] hover:bg-[#FAF8F5]'
                    )}
                  >
                    <span>{dateFilterLabels[key]}</span>
                    {dateFilter === key && <CheckCircle2 className="h-3.5 w-3.5 text-[#981B1E]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── TAB CONTENT AREA ─── */}

      {/* ─── TAB 1: Transactions ─── */}
      {activeTab === 'transactions' && (
        <div
          role="tabpanel"
          id="tabpanel-transactions"
          aria-labelledby="tab-transactions"
          className="rounded-2xl border border-[#EBE4D8] bg-white overflow-hidden shadow-2xs"
        >
          {isLoadingTx ? (
            <div className="p-12 text-center text-xs text-[#786D66]">
              Đang tải lịch sử giao dịch...
            </div>
          ) : filteredTransactions.length === 0 ? (
            /* Empty State Container Matching Reference Image */
            <div className="relative overflow-hidden p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 min-h-[320px]">
              {/* Background decorative faint equalizer bars */}
              <div
                className="absolute inset-0 flex justify-between items-center px-8 sm:px-16 pointer-events-none opacity-20"
                aria-hidden="true"
              >
                <div className="flex items-end gap-1.5 h-20">
                  <span className="w-1.5 h-6 bg-[#A31D24] rounded-full" />
                  <span className="w-1.5 h-12 bg-[#A31D24] rounded-full" />
                  <span className="w-1.5 h-8 bg-[#A31D24] rounded-full" />
                  <span className="w-1.5 h-16 bg-[#A31D24] rounded-full" />
                </div>
                <div className="flex items-end gap-1.5 h-20">
                  <span className="w-1.5 h-14 bg-[#A31D24] rounded-full" />
                  <span className="w-1.5 h-8 bg-[#A31D24] rounded-full" />
                  <span className="w-1.5 h-18 bg-[#A31D24] rounded-full" />
                  <span className="w-1.5 h-10 bg-[#A31D24] rounded-full" />
                </div>
              </div>

              {/* Central 3D Empty Search Illustration */}
              <div className="relative z-10 w-28 h-20 sm:w-36 sm:h-24 mx-auto overflow-hidden">
                <img
                  src="/assets/studio/wallet-empty-search-clean.png"
                  alt=""
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/studio/wallet-empty-search.png';
                  }}
                />
              </div>

              <div className="relative z-10 space-y-1.5 max-w-md">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19]">
                  Chưa có giao dịch biến động số dư nào
                </h3>
                <p className="text-xs text-[#786D66] leading-relaxed">
                  Các giao dịch nạp tiền, rút tiền, doanh thu từ nội dung sẽ được hiển thị tại đây.
                </p>
              </div>

              <div className="relative z-10 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/creator/create')}
                  aria-label="Tạo nội dung mới ngay"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tạo nội dung ngay</span>
                </button>
              </div>
            </div>
          ) : (
            /* Full High-End Data Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#786D66] uppercase tracking-wider font-semibold border-b border-[#EBE4D8] text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Mã GD</th>
                    <th className="px-5 py-3.5">Loại giao dịch</th>
                    <th className="px-5 py-3.5">Số tiền</th>
                    <th className="px-5 py-3.5">Mô tả / Tác phẩm</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE4D8]">
                  {filteredTransactions.map((tx) => {
                    const badgeInfo = formatTransactionBadge(tx.type);
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => onSelectTransaction?.(tx)}
                        className="hover:bg-[#FAF8F5] transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4 font-mono font-bold text-[#1F1A19]">
                          #{tx.id}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                              badgeInfo.isPositive
                                ? 'bg-[#EDFDF2] text-[#168A4E] border-[#A6E9B9]'
                                : 'bg-[#FFF8F8] text-[#A31D24] border-[#F9D2D4]'
                            )}
                          >
                            {badgeInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold tabular-nums">
                          <span
                            className={
                              tx.amount > 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                            }
                          >
                            {tx.amount > 0
                              ? `+ ${formatDisplayVND(tx.amount)}`
                              : formatDisplayVND(tx.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#786D66] max-w-xs truncate font-medium">
                          {tx.description || 'Không có ghi chú'}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                              tx.status === 'SUCCESS'
                                ? 'bg-[#EDFDF2] text-[#168A4E] border-[#A6E9B9]'
                                : tx.status === 'FAILED'
                                ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                                : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                            )}
                          >
                            {tx.status === 'SUCCESS'
                              ? 'Thành công'
                              : tx.status === 'FAILED'
                              ? 'Thất bại'
                              : 'Đang xử lý'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#786D66] font-mono tabular-nums text-[11px]">
                          {formatDateTime(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Withdrawals Queue ─── */}
      {activeTab === 'withdrawals' && (
        <div
          role="tabpanel"
          id="tabpanel-withdrawals"
          aria-labelledby="tab-withdrawals"
          className="rounded-2xl border border-[#EBE4D8] bg-white overflow-hidden shadow-2xs"
        >
          {isLoadingWithdrawals ? (
            <div className="p-12 text-center text-xs text-[#786D66]">
              Đang tải lịch sử rút tiền...
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="relative overflow-hidden p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4 min-h-[320px]">
              <div className="w-14 h-14 rounded-2xl bg-[#FEF6E9] border border-[#FDE8CA] flex items-center justify-center text-[#D97706] shadow-2xs mx-auto">
                <CreditCard className="h-7 w-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19]">
                  Chưa có yêu cầu rút tiền nào
                </h3>
                <p className="text-xs text-[#786D66] leading-relaxed">
                  Khi số dư khả dụng đạt tối thiểu 50.000 VNĐ, bạn có thể tạo yêu cầu rút tiền về tài khoản ngân hàng.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenWithdraw}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yêu cầu rút tiền</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#786D66] uppercase tracking-wider font-semibold border-b border-[#EBE4D8] text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Mã yêu cầu</th>
                    <th className="px-5 py-3.5">Số tiền rút</th>
                    <th className="px-5 py-3.5">Tài khoản nhận</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Ngày yêu cầu</th>
                    <th className="px-5 py-3.5">Ngày xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE4D8]">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#1F1A19]">#{w.id}</td>
                      <td className="px-5 py-4 font-mono font-bold tabular-nums text-[#1F1A19]">
                        {formatDisplayVND(w.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#1F1A19]">{w.bankName}</span>
                          <span className="font-mono text-[11px] text-[#786D66]">
                            {maskAccountNumber(w.accountNumber)} • {w.accountHolderName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                            w.status === 'COMPLETED'
                              ? 'bg-[#EDFDF2] text-[#168A4E] border-[#A6E9B9]'
                              : w.status === 'REJECTED' || w.status === 'FAILED'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                              : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                          )}
                        >
                          {w.status === 'COMPLETED'
                            ? 'Hoàn thành'
                            : w.status === 'PROCESSING'
                            ? 'Đang chuyển khoản'
                            : w.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : 'Bị từ chối'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#786D66] font-mono tabular-nums text-[11px]">
                        {formatDateTime(w.requestedAt)}
                      </td>
                      <td className="px-5 py-4 text-[#786D66] font-mono tabular-nums text-[11px]">
                        {w.processedAt ? formatDateTime(w.processedAt) : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Linked Bank Accounts Grid ─── */}
      {activeTab === 'banks' && (
        <div
          role="tabpanel"
          id="tabpanel-banks"
          aria-labelledby="tab-banks"
          className="space-y-4"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenAddBank}
              className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm tài khoản ngân hàng</span>
            </button>
          </div>

          {isLoadingBanks ? (
            <div className="p-12 text-center text-xs text-[#786D66]">
              Đang tải danh sách ngân hàng...
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EBE4D8] bg-white p-12 text-center space-y-3 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF8F2] border border-[#CFEBD9] flex items-center justify-center text-[#059669] shadow-2xs mx-auto">
                <Building2 className="h-7 w-7" />
              </div>
              <p className="text-xs text-[#786D66] font-medium">
                Bạn chưa liên kết tài khoản ngân hàng nào.
              </p>
              <button
                type="button"
                onClick={onOpenAddBank}
                className="inline-flex items-center gap-2 rounded-xl bg-[#981B1E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#801619] cursor-pointer"
              >
                Thêm ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bankAccounts.map((b) => {
                const isPrimary =
                  b.id === primaryBankId || (!primaryBankId && b.id === bankAccounts[0]?.id);
                return (
                  <div
                    key={b.id}
                    className={cn(
                      'rounded-2xl border bg-white p-5 shadow-2xs hover:shadow-xs transition-[box-shadow,border-color] space-y-4 flex flex-col justify-between',
                      isPrimary
                        ? 'border-[#168A4E] ring-1 ring-[#168A4E]/30 bg-[#FAFDFB]'
                        : 'border-[#EBE4D8]'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#981B1E]">{b.bankName}</span>
                        <div className="flex items-center gap-1.5">
                          {isPrimary ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#168A4E] bg-[#EDFDF2] px-2 py-0.5 rounded-full border border-[#A6E9B9]">
                              <CheckCircle2 className="h-3 w-3" />
                              Thẻ chính
                            </span>
                          ) : onSelectPrimaryBank ? (
                            <button
                              type="button"
                              onClick={() => onSelectPrimaryBank(b.id)}
                              className="text-[11px] font-semibold text-[#786D66] hover:text-[#981B1E] hover:underline cursor-pointer"
                            >
                              Đặt làm thẻ chính
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="font-mono text-base font-bold text-[#1F1A19] tracking-wider">
                        {maskAccountNumber(b.accountNumber)}
                      </div>
                      <div className="text-xs text-[#786D66] font-medium font-sans">
                        {b.accountHolderName}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EBE4D8] flex items-center justify-between text-[11px] text-[#786D66]">
                      <span>Thêm ngày {formatDate(b.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteBank(b.id)}
                        disabled={isDeletingBank}
                        aria-label={`Xóa tài khoản ngân hàng ${b.bankName}`}
                        className="p-1.5 rounded-lg text-[#786D66] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        title="Xóa tài khoản này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
