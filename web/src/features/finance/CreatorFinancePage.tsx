import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { walletApi } from '@/services/api/wallet';
import { contractsApi } from '@/services/api/contracts';
import {
  CreateBankAccountRequest,
  CreateWithdrawalRequest,
  CreateDepositRequest,
} from '@/types/wallet';
import { WalletTransactionItem } from '@/types/transaction';
import { createSafeMotionContext, isReducedMotion } from '@/utils/motion';

// Compound Components
import { WalletHeroBanner } from './components/WalletHeroBanner';
import { WalletBalanceCards } from './components/WalletBalanceCards';
import { CreatorMilestoneEarningsBanner } from './components/CreatorMilestoneEarningsBanner';
import { WalletHistoryTabs } from './components/WalletHistoryTabs';
import { WalletRecentTransactionsCard } from './components/WalletRecentTransactionsCard';

// Modals & Dialogs
import { WalletWithdrawDialog } from './components/WalletWithdrawDialog';
import { WalletDepositDialog } from './components/WalletDepositDialog';
import { WalletAddBankDialog } from './components/WalletAddBankDialog';
import {
  WalletTransactionDetailModal,
  DisplayTransactionDetail,
} from './components/WalletTransactionDetailModal';

export const CreatorFinancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const historyTabsSectionRef = useRef<HTMLDivElement>(null);

  // ─── 1. State Management ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals' | 'banks'>('transactions');

  // Dialog states
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositResultUrl, setDepositResultUrl] = useState<string | null>(null);
  const [addBankOpen, setAddBankOpen] = useState(false);

  // Transaction detail receipt modal
  const [txDetailModalOpen, setTxDetailModalOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<DisplayTransactionDetail | null>(null);

  // Toast feedback state
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 4000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // ─── 2. React Query: Wallet Balance & Data ─────────────────────────────────
  const {
    data: walletRes,
    isLoading: isLoadingWallet,
    isRefetching: isRefetchingWallet,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['creator-wallet-balance'],
    queryFn: () => walletApi.getMyWallet(),
  });
  const wallet = walletRes?.data;

  // Transactions query
  const {
    data: txRes,
    isLoading: isLoadingTx,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['creator-wallet-transactions'],
    queryFn: () => walletApi.getMyTransactions(0, 50),
  });
  const rawTx = txRes?.data;
  const transactions: WalletTransactionItem[] = Array.isArray(rawTx)
    ? rawTx
    : rawTx?.items || rawTx?.content || [];

  // Bank accounts query
  const {
    data: bankRes,
    isLoading: isLoadingBanks,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ['creator-bank-accounts'],
    queryFn: () => walletApi.getMyBankAccounts(),
  });
  const bankAccounts = Array.isArray(bankRes?.data) ? bankRes.data : [];

  // Primary bank account selection state (persisted in localStorage)
  const [primaryBankId, setPrimaryBankId] = useState<number | null>(() => {
    const saved = localStorage.getItem('su_ky_primary_bank_id');
    return saved ? Number(saved) : null;
  });

  const handleSelectPrimaryBank = (bankId: number) => {
    setPrimaryBankId(bankId);
    localStorage.setItem('su_ky_primary_bank_id', String(bankId));
    const target = bankAccounts.find((b) => b.id === bankId);
    if (target) {
      setSuccessToast(`Đã đặt ${target.bankName} làm tài khoản ngân hàng chính.`);
    }
  };

  useEffect(() => {
    if (bankAccounts.length > 0) {
      if (!primaryBankId || !bankAccounts.some((b) => b.id === primaryBankId)) {
        setPrimaryBankId(bankAccounts[0].id);
      }
    }
  }, [bankAccounts, primaryBankId]);

  // Withdrawals query
  const {
    data: withdrawalsRes,
    isLoading: isLoadingWithdrawals,
    refetch: refetchWithdrawals,
  } = useQuery({
    queryKey: ['creator-my-withdrawals'],
    queryFn: () => walletApi.getMyWithdrawals(0, 50),
  });
  const rawW = withdrawalsRes?.data;
  const withdrawals = Array.isArray(rawW)
    ? rawW
    : rawW?.items || rawW?.content || [];

  // Milestone financials query (Reversed Commission & Escrow Flow)
  const {
    data: milestoneFinancialsRes,
    isLoading: isLoadingMilestones,
    refetch: refetchMilestones,
  } = useQuery({
    queryKey: ['creator-milestone-financials'],
    queryFn: () => contractsApi.getMyMilestoneFinancials(),
  });
  const milestoneFinancials = milestoneFinancialsRes?.data;

  // ─── 3. Mutations ──────────────────────────────────────────────────────────
  // 3.1. Request Withdrawal
  const withdrawMutation = useMutation({
    mutationFn: (req: CreateWithdrawalRequest) => walletApi.requestWithdrawal(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['creator-my-withdrawals'] });
      setWithdrawOpen(false);
      setSuccessToast('Tạo yêu cầu rút tiền thành công! Lệnh đang chờ đối soát.');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e.response?.data?.message ||
          'Không thể tạo yêu cầu rút tiền. Vui lòng kiểm tra lại số dư khả dụng.'
      );
    },
  });

  // 3.2. Create Deposit (VNPay Sandbox)
  const depositMutation = useMutation({
    mutationFn: (req: CreateDepositRequest) => walletApi.createDeposit(req),
    onSuccess: (res) => {
      if (res.data?.paymentUrl) {
        setDepositResultUrl(res.data.paymentUrl);
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e.response?.data?.message || 'Không thể khởi tạo lệnh nạp tiền qua cổng VNPay.'
      );
    },
  });

  // 3.3. Add Bank Account
  const addBankMutation = useMutation({
    mutationFn: (req: CreateBankAccountRequest) => walletApi.createBankAccount(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-bank-accounts'] });
      setAddBankOpen(false);
      setSuccessToast('Đã thêm tài khoản ngân hàng liên kết thành công!');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e.response?.data?.message || 'Không thể thêm tài khoản ngân hàng. Vui lòng thử lại.'
      );
    },
  });

  // 3.4. Delete Bank Account
  const deleteBankMutation = useMutation({
    mutationFn: (id: number) => walletApi.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-bank-accounts'] });
      setSuccessToast('Đã hủy liên kết tài khoản ngân hàng.');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e.response?.data?.message || 'Không thể xóa tài khoản ngân hàng vào lúc này.'
      );
    },
  });

  // ─── 4. Handlers ───────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    await Promise.all([
      refetchWallet(),
      refetchTx(),
      refetchBanks(),
      refetchWithdrawals(),
      refetchMilestones(),
    ]);
    setSuccessToast('Đã cập nhật số dư và lịch sử giao dịch mới nhất.');
  };

  const handleWithdrawSubmit = (amount: number, bankAccountId: number) => {
    withdrawMutation.mutate({ amount, bankAccountId });
  };

  const handleDepositSubmit = (amount: number, description: string) => {
    depositMutation.mutate({ amount, description });
  };

  const handleAddBankSubmit = (
    bankName: string,
    accountNumber: string,
    accountHolderName: string
  ) => {
    addBankMutation.mutate({
      bankName,
      accountNumber,
      accountHolderName,
    });
  };

  const handleDeleteBankConfirm = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng này?')) {
      deleteBankMutation.mutate(id);
    }
  };



  const handleViewAllTransactions = () => {
    setActiveTab('transactions');
    historyTabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectRawTx = (tx: WalletTransactionItem) => {
    const isPos = tx.amount > 0;
    let title = isPos ? 'Doanh thu nội dung' : 'Giao dịch rút tiền';
    if (tx.type?.includes('PODCAST')) title = 'Doanh thu từ podcast';
    else if (tx.type?.includes('VIDEO')) title = 'Doanh thu từ video';
    else if (tx.type === 'TOPUP') title = 'Nạp tiền vào ví';
    else if (tx.type === 'WITHDRAW') title = 'Rút tiền về ngân hàng';

    setSelectedTxDetail({
      id: tx.id,
      title,
      subtitle: tx.description || `Mã GD #${tx.id}`,
      amount: tx.amount,
      isPositive: isPos,
      date: tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '---',
      status: tx.status,
      rawTx: tx,
    });
    setTxDetailModalOpen(true);
  };

  // ─── 5. GSAP 60fps Entrance Motion (Safe for Prefers-Reduced-Motion) ─────────
  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    const cleanup = createSafeMotionContext(containerRef, () => {
      const hero = containerRef.current?.querySelector('[data-motion-target="wallet-hero"]');
      const cards = containerRef.current?.querySelectorAll('[data-motion-target="balance-card-item"]');
      const tabs = containerRef.current?.querySelector('[data-motion-target="history-tabs-container"]');
      const recentCard = containerRef.current?.querySelector('[data-motion-target="recent-transactions-card"]');

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (hero) {
        tl.fromTo(
          hero,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.42, clearProps: 'transform,opacity' }
        );
      }

      if (cards && cards.length > 0) {
        tl.fromTo(
          cards,
          { opacity: 0, y: 14, scale: 0.99 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.38,
            stagger: 0.06,
            clearProps: 'transform,opacity',
          },
          '-=0.22'
        );
      }

      if (tabs) {
        tl.fromTo(
          tabs,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.36, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (recentCard) {
        tl.fromTo(
          recentCard,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.36, clearProps: 'transform,opacity' },
          '-=0.15'
        );
      }
    });

    return cleanup;
  }, []);

  // ─── 6. Render ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="space-y-6 max-w-7xl mx-auto pb-12 select-none"
    >
      {/* ─── TOAST NOTIFICATIONS ─── */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center justify-between gap-3 rounded-2xl border border-[#A6E9B9] bg-[#EDFDF2] px-4 py-3 text-xs font-semibold text-[#168A4E] shadow-xl animate-in slide-in-from-top-4 duration-200 select-none max-w-md"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-[#168A4E]" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-[#168A4E] hover:opacity-75 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-xs text-[#DC2626] font-medium shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-[#DC2626] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ─── 1. PAGE HERO BANNER ─── */}
      <WalletHeroBanner
        onRefresh={handleRefreshAll}
        isRefreshing={isRefetchingWallet}
      />

      {/* ─── 2. FINANCIAL OVERVIEW MATRIX (OPERATING WALLET & ESCROW) ─── */}
      <section
        aria-label="Tổng quan tài chính & Ký quỹ"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch"
        data-motion-target="balance-cards"
      >
        <div className="lg:col-span-7 flex">
          <WalletBalanceCards
            wallet={wallet}
            bankAccounts={bankAccounts}
            primaryBankId={primaryBankId}
            onSelectPrimaryBank={handleSelectPrimaryBank}
            isLoading={isLoadingWallet}
            onOpenWithdraw={() => setWithdrawOpen(true)}
            onOpenDeposit={() => {
              setDepositResultUrl(null);
              setDepositOpen(true);
            }}
            onOpenAddBank={() => setAddBankOpen(true)}
            className="w-full"
          />
        </div>

        <div className="lg:col-span-5 flex">
          <CreatorMilestoneEarningsBanner
            financials={milestoneFinancials}
            isLoading={isLoadingMilestones}
            className="w-full"
          />
        </div>
      </section>

      {/* ─── 3. TABS: TRANSACTIONS / WITHDRAWALS / LINKED BANKS ─── */}
      <div ref={historyTabsSectionRef}>
        <WalletHistoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          transactions={transactions}
          withdrawals={withdrawals}
          bankAccounts={bankAccounts}
          primaryBankId={primaryBankId}
          onSelectPrimaryBank={handleSelectPrimaryBank}
          isLoadingTx={isLoadingTx}
          isLoadingWithdrawals={isLoadingWithdrawals}
          isLoadingBanks={isLoadingBanks}
          onOpenWithdraw={() => setWithdrawOpen(true)}
          onOpenAddBank={() => setAddBankOpen(true)}
          onDeleteBank={handleDeleteBankConfirm}
          onSelectTransaction={handleSelectRawTx}
          isDeletingBank={deleteBankMutation.isPending}
        />
      </div>

      {/* ─── 4. RECENT TRANSACTIONS (RENDERED STRICTLY ONLY WHEN REAL TRANSACTIONS EXIST) ─── */}
      {transactions && transactions.length > 0 && (
        <section
          aria-label="Giao dịch gần đây"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start"
        >
          <div className="lg:col-span-1">
            <WalletRecentTransactionsCard
              transactions={transactions}
              onViewAll={handleViewAllTransactions}
              onSelectTransaction={handleSelectRawTx}
              className="w-full"
            />
          </div>
        </section>
      )}

      {/* ─── 5. INTERACTIVE DIALOGS & MODALS ─── */}
      <WalletWithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        wallet={wallet}
        bankAccounts={bankAccounts}
        defaultBankAccountId={primaryBankId}
        onSubmitWithdraw={handleWithdrawSubmit}
        isSubmitting={withdrawMutation.isPending}
        onOpenAddBank={() => setAddBankOpen(true)}
      />

      <WalletDepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onSubmitDeposit={handleDepositSubmit}
        isSubmitting={depositMutation.isPending}
        depositResultUrl={depositResultUrl}
        errorMessage={errorMessage}
        onResetResult={() => setDepositResultUrl(null)}
      />

      <WalletAddBankDialog
        open={addBankOpen}
        onOpenChange={setAddBankOpen}
        onSubmitAddBank={handleAddBankSubmit}
        isSubmitting={addBankMutation.isPending}
        errorMessage={errorMessage}
      />

      <WalletTransactionDetailModal
        open={txDetailModalOpen}
        onOpenChange={setTxDetailModalOpen}
        transaction={selectedTxDetail}
      />
    </div>
  );
};
