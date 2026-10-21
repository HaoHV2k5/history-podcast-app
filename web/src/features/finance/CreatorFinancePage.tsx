import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  Clock,
  AlertCircle,
  PlusCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { walletApi } from '@/services/api/wallet';
import {
  CreateBankAccountRequest,
  CreateWithdrawalRequest,
  CreateDepositRequest,
} from '@/types/wallet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatVND, formatDateTime, formatDate, maskAccountNumber } from '@/utils/formatters';
import {
  validateWithdrawalAmount,
  validateBankAccount,
  formatTransactionBadge,
} from './financeLogic';

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

export const CreatorFinancePage: React.FC = () => {
  const queryClient = useQueryClient();

  // Active tab: 'transactions' | 'withdrawals' | 'banks'
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals' | 'banks'>('transactions');

  // Withdrawal modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50000');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Deposit modal state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('50000');
  const [depositDescription, setDepositDescription] = useState('Nạp tiền vào ví Sử Ký');
  const [depositResultUrl, setDepositResultUrl] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Add Bank Account modal state
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [bankName, setBankName] = useState(POPULAR_VIETNAMESE_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankError, setBankError] = useState<string | null>(null);

  // 1. Fetch Wallet Balance
  const {
    data: walletRes,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['creator-wallet-balance'],
    queryFn: () => walletApi.getMyWallet(),
  });
  const wallet = walletRes?.data;

  // 2. Fetch Transactions
  const {
    data: txRes,
    isLoading: isLoadingTx,
  } = useQuery({
    queryKey: ['creator-wallet-transactions'],
    queryFn: () => walletApi.getMyTransactions(0, 50),
  });
  const rawTx = txRes?.data;
  const transactions = Array.isArray(rawTx)
    ? rawTx
    : rawTx?.items || rawTx?.content || [];

  // 3. Fetch Bank Accounts
  const {
    data: bankRes,
    isLoading: isLoadingBanks,
  } = useQuery({
    queryKey: ['creator-bank-accounts'],
    queryFn: () => walletApi.getMyBankAccounts(),
  });
  const bankAccounts = Array.isArray(bankRes?.data) ? bankRes.data : [];

  // 4. Fetch Withdrawals
  const {
    data: withdrawalsRes,
    isLoading: isLoadingWithdrawals,
  } = useQuery({
    queryKey: ['creator-my-withdrawals'],
    queryFn: () => walletApi.getMyWithdrawals(0, 50),
  });
  const rawW = withdrawalsRes?.data;
  const withdrawals = Array.isArray(rawW)
    ? rawW
    : rawW?.items || rawW?.content || [];

  // Mutation: Request Withdrawal
  const withdrawMutation = useMutation({
    mutationFn: (req: CreateWithdrawalRequest) => walletApi.requestWithdrawal(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['creator-my-withdrawals'] });
      setWithdrawOpen(false);
      setWithdrawError(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setWithdrawError(e.response?.data?.message || 'Không thể tạo yêu cầu rút tiền. Vui lòng kiểm tra lại số dư.');
    },
  });

  // Mutation: Create Deposit (VNPay Sandbox)
  const depositMutation = useMutation({
    mutationFn: (req: CreateDepositRequest) => walletApi.createDeposit(req),
    onSuccess: (res) => {
      if (res.data?.paymentUrl) {
        setDepositResultUrl(res.data.paymentUrl);
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setDepositError(e.response?.data?.message || 'Không thể khởi tạo lệnh nạp tiền.');
    },
  });

  // Mutation: Add Bank Account
  const addBankMutation = useMutation({
    mutationFn: (req: CreateBankAccountRequest) => walletApi.createBankAccount(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-bank-accounts'] });
      setAddBankOpen(false);
      setAccountNumber('');
      setAccountHolderName('');
      setBankError(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setBankError(e.response?.data?.message || 'Không thể thêm tài khoản ngân hàng.');
    },
  });

  // Mutation: Delete Bank Account
  const deleteBankMutation = useMutation({
    mutationFn: (id: number) => walletApi.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-bank-accounts'] });
    },
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    const validation = validateWithdrawalAmount(amt, wallet?.availableBalance || 0);
    if (!validation.valid) {
      setWithdrawError(validation.error || 'Số tiền không hợp lệ');
      return;
    }
    const bId = selectedBankId ? parseInt(selectedBankId, 10) : bankAccounts[0]?.id;
    if (!bId) {
      setWithdrawError('Vui lòng chọn hoặc thêm tài khoản ngân hàng để nhận tiền');
      return;
    }
    withdrawMutation.mutate({ amount: amt, bankAccountId: bId });
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(depositAmount, 10);
    if (isNaN(amt) || amt < 10000) {
      setDepositError('Số tiền nạp tối thiểu là 10.000 VNĐ');
      return;
    }
    depositMutation.mutate({ amount: amt, description: depositDescription });
  };

  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBankAccount(bankName, accountNumber, accountHolderName);
    if (!validation.valid) {
      setBankError(validation.error || 'Thông tin tài khoản không hợp lệ');
      return;
    }
    addBankMutation.mutate({
      bankName,
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim().toUpperCase(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-ink">Ví & Quản Lý Thu Nhập</h1>
            <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent text-xs font-semibold">
              Creator Wallet
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted">
            Theo dõi doanh thu gói hội viên, số dư ví khả dụng, lịch sử giao dịch và yêu cầu rút tiền.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchWallet()}
          className="gap-1.5 self-start sm:self-center text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới số dư
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Available Balance Card */}
        <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-surface via-surface to-accent/5 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Số dư khả dụng</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-subtle">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-ink">
              {isLoadingWallet ? '---' : formatVND(wallet?.availableBalance || 0)}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Tiền sẵn sàng để rút về tài khoản ngân hàng
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/80">
            <Button
              size="sm"
              onClick={() => {
                setWithdrawError(null);
                setWithdrawOpen(true);
              }}
              className="flex-1 gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs shadow-subtle"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Rút tiền
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDepositError(null);
                setDepositResultUrl(null);
                setDepositOpen(true);
              }}
              className="flex-1 gap-1.5 text-xs border-border"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Nạp tiền (VNPay)
            </Button>
          </div>
        </div>

        {/* Pending Balance Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Số dư đang chờ duyệt rút</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-ink">
              {isLoadingWallet ? '---' : formatVND(wallet?.pendingBalance || 0)}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              Đang trong hàng đợi đối soát chuyển khoản ngân hàng
            </p>
          </div>

          <div className="pt-2 border-t border-border/80 text-[11px] text-ink-muted flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tiền được bảo vệ bởi quy trình ký quỹ và đối soát Sử Ký</span>
          </div>
        </div>

        {/* Linked Banks Summary */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-subtle space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">Tài khoản ngân hàng</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-subtle text-ink">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-serif text-2xl font-bold text-ink">
                {bankAccounts.length} tài khoản
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                {bankAccounts[0]
                  ? `${bankAccounts[0].bankName} (${maskAccountNumber(bankAccounts[0].accountNumber)})`
                  : 'Chưa liên kết ngân hàng'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBankError(null);
              setAddBankOpen(true);
            }}
            className="w-full gap-1.5 text-xs border-border"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Thêm tài khoản mới
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all shrink-0 whitespace-nowrap min-h-[44px] ${
            activeTab === 'transactions'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <span>Lịch sử biến động số dư</span>
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-mono tabular-nums">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all shrink-0 whitespace-nowrap min-h-[44px] ${
            activeTab === 'withdrawals'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <span>Lịch sử rút tiền</span>
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-mono tabular-nums">
            {withdrawals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all shrink-0 whitespace-nowrap min-h-[44px] ${
            activeTab === 'banks'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <span>Tài khoản ngân hàng liên kết</span>
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-mono tabular-nums">
            {bankAccounts.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-subtle">
          {isLoadingTx ? (
            <div className="p-8 text-center text-xs text-ink-muted">Đang tải lịch sử giao dịch...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Clock className="mx-auto h-8 w-8 text-ink-muted opacity-50" />
              <p className="text-xs text-ink-muted font-medium">Chưa có giao dịch biến động số dư nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-ink-muted uppercase tracking-wider font-semibold border-b border-border text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Mã GD</th>
                    <th className="px-4 py-3">Loại giao dịch</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F7F5F1] transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">#{tx.id}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            formatTransactionBadge(tx.type).isPositive
                              ? 'bg-status-success-bg text-status-success-text border-status-success-text/30'
                              : 'bg-surface-subtle text-ink border-border'
                          }`}
                        >
                          {formatTransactionBadge(tx.type).label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold font-mono tabular-nums">
                        <span
                          className={
                            tx.amount > 0 ? 'text-status-success-text' : 'text-status-error-text'
                          }
                        >
                          {tx.amount > 0 ? `+${formatVND(tx.amount)}` : formatVND(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted max-w-xs truncate">
                        {tx.description || 'Không có ghi chú'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            tx.status === 'SUCCESS'
                              ? 'bg-status-success-bg text-status-success-text border-status-success-text/30'
                              : tx.status === 'FAILED'
                              ? 'bg-status-error-bg text-status-error-text border-status-error-text/30'
                              : 'bg-status-pending-bg text-status-pending-text border-status-pending-text/30'
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono tabular-nums">
                        {formatDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Withdrawals Queue */}
      {activeTab === 'withdrawals' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-subtle">
          {isLoadingWithdrawals ? (
            <div className="p-8 text-center text-xs text-ink-muted">Đang tải lịch sử rút tiền...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CreditCard className="mx-auto h-8 w-8 text-ink-muted opacity-50" />
              <p className="text-xs text-ink-muted font-medium">Chưa có yêu cầu rút tiền nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-ink-muted uppercase tracking-wider font-semibold border-b border-border text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Mã yêu cầu</th>
                    <th className="px-4 py-3">Số tiền rút</th>
                    <th className="px-4 py-3">Tài khoản nhận</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày yêu cầu</th>
                    <th className="px-4 py-3">Ngày xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#F7F5F1] transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">#{w.id}</td>
                      <td className="px-4 py-3 font-bold font-mono tabular-nums text-ink">
                        {formatVND(w.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink">{w.bankName}</span>
                          <span className="font-mono text-[11px] text-ink-muted">
                            {maskAccountNumber(w.accountNumber)} • {w.accountHolderName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            w.status === 'COMPLETED'
                              ? 'bg-status-success-bg text-status-success-text border-status-success-text/30'
                              : w.status === 'REJECTED' || w.status === 'FAILED'
                              ? 'bg-status-error-bg text-status-error-text border-status-error-text/30'
                              : 'bg-status-pending-bg text-status-pending-text border-status-pending-text/30'
                          }`}
                        >
                          {w.status === 'COMPLETED'
                            ? 'Hoàn thành'
                            : w.status === 'PROCESSING'
                            ? 'Đang chuyển khoản'
                            : w.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : 'Bị từ chối'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono tabular-nums">{formatDateTime(w.requestedAt)}</td>
                      <td className="px-4 py-3 text-ink-muted font-mono tabular-nums">
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

      {/* Tab 3: Bank Accounts List */}
      {activeTab === 'banks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setBankError(null);
                setAddBankOpen(true);
              }}
              className="gap-2 bg-accent text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Thêm tài khoản ngân hàng
            </Button>
          </div>

          {isLoadingBanks ? (
            <div className="p-8 text-center text-xs text-ink-muted">Đang tải danh sách ngân hàng...</div>
          ) : bankAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center space-y-3">
              <Building2 className="mx-auto h-8 w-8 text-ink-muted opacity-50" />
              <p className="text-xs text-ink-muted">Bạn chưa liên kết tài khoản ngân hàng nào.</p>
              <Button size="sm" onClick={() => setAddBankOpen(true)} className="bg-accent text-white">
                Thêm ngay
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-border bg-surface p-5 shadow-subtle space-y-3 relative flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent">{b.bankName}</span>
                      {b.verified && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã xác minh
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-base font-bold text-ink">
                      {maskAccountNumber(b.accountNumber)}
                    </div>
                    <div className="text-xs text-ink-muted uppercase tracking-wider font-medium">
                      {b.accountHolderName}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
                    <span>Thêm ngày {formatDate(b.createdAt)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBankMutation.mutate(b.id)}
                      disabled={deleteBankMutation.isPending}
                      className="h-7 w-7 p-0 text-ink-muted hover:text-danger"
                      title="Xóa tài khoản này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog: Request Withdrawal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-accent" />
              Yêu Cầu Rút Tiền Về Ngân Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Số tiền khả dụng hiện tại: <strong>{formatVND(wallet?.availableBalance || 0)}</strong>. Số tiền rút tối thiểu: 50.000 VNĐ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-2">
            {withdrawError && (
              <div className="flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Số tiền muốn rút (VNĐ)</label>
              <Input
                type="number"
                min={50000}
                step={10000}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Tài khoản ngân hàng nhận tiền</label>
              {bankAccounts.length === 0 ? (
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 space-y-2">
                  <p>Bạn chưa có tài khoản ngân hàng nào.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setWithdrawOpen(false);
                      setAddBankOpen(true);
                    }}
                    className="text-xs"
                  >
                    Thêm tài khoản ngân hàng ngay
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} — {maskAccountNumber(b.accountNumber)} ({b.accountHolderName})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={withdrawMutation.isPending || bankAccounts.length === 0}
                className="bg-accent text-white hover:bg-accent/90"
              >
                {withdrawMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Xác nhận rút tiền
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Deposit (VNPay Sandbox) */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-accent" />
              Nạp Tiền Vào Ví (VNPay Sandbox)
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Tạo lệnh thanh toán cổng VNPay Sandbox để thử nghiệm các chức năng tài chính.
            </DialogDescription>
          </DialogHeader>

          {depositResultUrl ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-ink">Đã tạo lệnh thanh toán thành công</h4>
                <p className="text-xs text-ink-muted">
                  Bấm nút bên dưới để mở trang thanh toán VNPay Sandbox.
                </p>
              </div>
              <Button
                onClick={() => window.open(depositResultUrl, '_blank')}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Chuyển sang VNPay Sandbox</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleDepositSubmit} className="space-y-4 py-2">
              {depositError && (
                <div className="flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{depositError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Số tiền nạp (VNĐ)</label>
                <Input
                  type="number"
                  min={10000}
                  step={10000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Nội dung nạp</label>
                <Input
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDepositOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="bg-accent text-white hover:bg-accent/90"
                >
                  {depositMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Tạo link VNPay
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Bank Account */}
      <Dialog open={addBankOpen} onOpenChange={setAddBankOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Thêm Tài Khoản Ngân Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Nhập chính xác thông tin tài khoản ngân hàng chính chủ để thực hiện rút tiền an toàn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBankSubmit} className="space-y-4 py-2">
            {bankError && (
              <div className="flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{bankError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Ngân hàng</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {POPULAR_VIETNAMESE_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Số tài khoản</label>
              <Input
                placeholder="Ví dụ: 1029384756..."
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Tên chủ tài khoản (In hoa không dấu)</label>
              <Input
                placeholder="Ví dụ: NGUYEN VAN A"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setAddBankOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={addBankMutation.isPending}
                className="bg-accent text-white hover:bg-accent/90"
              >
                {addBankMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Lưu tài khoản
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
