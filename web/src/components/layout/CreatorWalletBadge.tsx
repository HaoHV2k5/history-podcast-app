import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowUpRight, ArrowDownLeft, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import { walletApi } from '@/services/api/wallet';
import { formatVND } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

export const CreatorWalletBadge: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => walletApi.getMyWallet(),
    enabled: !!user,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const wallet = data?.data;
  const availableBalance = wallet?.availableBalance ?? 0;
  const pendingBalance = wallet?.pendingBalance ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="creator-wallet-header-btn"
          type="button"
          className="relative flex items-center gap-2 rounded-xl border border-border/80 bg-canvas px-2.5 sm:px-3 py-1.5 min-h-[40px] text-xs transition-all duration-150 hover:bg-surface-subtle hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95 cursor-pointer shadow-2xs"
          aria-label="Ví người dùng"
          title="Ví Sử Ký & Thu nhập"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent font-semibold shrink-0">
            <Wallet className="h-4 w-4" />
          </div>

          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-[10px] text-muted font-medium">Ví khả dụng</span>
            <span className="font-mono font-bold text-ink text-xs tracking-tight">
              {isLoading ? (
                <span className="text-muted font-normal animate-pulse">Đang tải...</span>
              ) : (
                formatVND(availableBalance)
              )}
            </span>
          </div>

          <ChevronDown className="hidden sm:block h-3 w-3 text-muted/70 ml-0.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-3 space-y-3">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Wallet className="h-4 w-4 text-accent" />
              <span>Ví tài khoản Sử Ký</span>
            </div>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-subtle text-muted">
              {wallet?.currency || 'VND'}
            </span>
          </div>

          <div className="pt-2.5 space-y-2">
            <div className="rounded-lg bg-surface-subtle/70 p-2.5 border border-border/40">
              <div className="text-[11px] text-muted">Số dư khả dụng</div>
              <div className="text-base font-bold font-mono text-accent mt-0.5">
                {isLoading ? '...' : formatVND(availableBalance)}
              </div>
            </div>

            {pendingBalance > 0 && (
              <div className="flex items-center justify-between text-xs px-1 text-muted">
                <span>Đang tạm giữ (Ký quỹ):</span>
                <span className="font-mono font-medium text-ink">
                  {formatVND(pendingBalance)}
                </span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="space-y-1">
          <DropdownMenuItem
            id="wallet-menu-detail-btn"
            onClick={() => navigate('/creator/wallet')}
            className="cursor-pointer text-xs font-medium flex items-center justify-between py-2 text-ink"
          >
            <span className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-accent" />
              Quản lý Ví & Lịch sử
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
          </DropdownMenuItem>

          <DropdownMenuItem
            id="wallet-menu-deposit-btn"
            onClick={() => navigate('/creator/wallet')}
            className="cursor-pointer text-xs flex items-center gap-2 py-1.5 text-muted hover:text-ink"
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
            Nạp tiền vào ví
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

