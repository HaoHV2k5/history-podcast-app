import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  UserCheck,
  Wallet,
  AlertCircle,
  ArrowRight,
  Video,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { moderationApi } from '@/services/api/moderation';
import { kycApi } from '@/services/api/kyc';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { disputesApi } from '@/services/api/disputes';
import { DisputeItem } from '@/types/dispute';
import { formatDateTime, formatVND } from '@/utils/formatters';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Pending Moderation query
  const { data: modData, isLoading: modLoading } = useQuery({
    queryKey: ['admin-overview-moderation'],
    queryFn: () => moderationApi.getReviews({ decision: 'PENDING', size: 5 }),
  });

  // 2. Pending KYC query
  const { data: kycData, isLoading: kycLoading } = useQuery({
    queryKey: ['admin-overview-kyc'],
    queryFn: () => kycApi.getKycProfiles({ status: 'PENDING', size: 5 }),
  });

  // 3. Pending Withdrawals query
  const { data: withData, isLoading: withLoading } = useQuery({
    queryKey: ['admin-overview-withdrawals'],
    queryFn: () => withdrawalsApi.getAllWithdrawals(0, 50),
  });

  // 4. Open Disputes query
  const { data: disputeData, isLoading: disputeLoading } = useQuery({
    queryKey: ['admin-overview-disputes'],
    queryFn: () => disputesApi.getAllDisputes(),
  });

  // Aggregated live numbers
  const pendingModCount = modData?.data?.totalElements ?? 0;
  const recentModItems = modData?.data?.items || modData?.data?.content || [];

  const pendingKycCount = kycData?.data?.totalElements ?? 0;
  const recentKycItems = kycData?.data?.items || kycData?.data?.content || [];

  const allWithdrawals = withData?.data?.items || withData?.data?.content || [];
  const pendingWithItems = allWithdrawals.filter((w) => w.status?.toUpperCase() === 'PENDING');
  const pendingWithCount = pendingWithItems.length;

  const rawDisputes = disputeData?.data;
  const allDisputes: DisputeItem[] = Array.isArray(rawDisputes)
    ? rawDisputes
    : rawDisputes && 'items' in rawDisputes && Array.isArray(rawDisputes.items)
      ? (rawDisputes.items as DisputeItem[])
      : [];
  const openDisputes = allDisputes.filter((d: DisputeItem) => d.status?.toUpperCase() !== 'RESOLVED');
  const openDisputeCount = openDisputes.length;

  const statCards = [
    {
      title: 'Kiểm duyệt chờ duyệt',
      count: pendingModCount,
      loading: modLoading,
      description: 'Video podcast nộp chờ thẩm định AI & Điều hành',
      icon: ShieldAlert,
      to: '/admin/moderation',
      color: 'text-accent',
      bgColor: 'bg-accent-soft',
    },
    {
      title: 'Hồ sơ KYC chờ xác thực',
      count: pendingKycCount,
      loading: kycLoading,
      description: 'Ứng viên đăng ký quyền Nhà sáng tạo (Creator)',
      icon: UserCheck,
      to: '/admin/kyc',
      color: 'text-status-pending-text',
      bgColor: 'bg-status-pending-bg',
    },
    {
      title: 'Yêu cầu rút tiền chờ duyệt',
      count: pendingWithCount,
      loading: withLoading,
      description: 'Yêu cầu rút tiền về ngân hàng của Creator',
      icon: Wallet,
      to: '/admin/withdrawals',
      color: 'text-status-processing-text',
      bgColor: 'bg-status-processing-bg',
    },
    {
      title: 'Khiếu nại đang thụ lý',
      count: openDisputeCount,
      loading: disputeLoading,
      description: 'Tranh chấp hợp đồng thu âm cần giải quyết',
      icon: AlertCircle,
      to: '/admin/disputes',
      color: 'text-status-error-text',
      bgColor: 'bg-status-error-bg',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tổng quan Vận hành"
        description="Bảng điều phối tác vụ và tổng hợp các hàng đợi cần xem xét trên nền tảng Sử Ký"
      />

      {/* Operational KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.to)}
              className="group cursor-pointer rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-accent hover:bg-surface-subtle/30 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted tracking-wide">
                    {card.title}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgColor} ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="font-mono text-3xl font-bold text-ink tabular-nums">
                  {card.loading ? (
                    <span className="text-muted text-xl animate-pulse">...</span>
                  ) : (
                    card.count
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-medium text-ink group-hover:text-accent min-h-[44px]">
                <span>Vào hàng đợi</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Operational Queue Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pending Moderation Queue */}
        <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-base font-bold text-ink">
                Hàng đợi Kiểm duyệt Video ({pendingModCount})
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/moderation')}
              className="min-h-[44px] px-3 text-xs text-muted hover:text-ink"
            >
              <span>Xem tất cả</span>
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {recentModItems.length > 0 ? (
              recentModItems.slice(0, 4).map((item) => (
                <div
                  key={item.reviewId}
                  onClick={() => navigate(`/admin/moderation/${item.reviewId}`)}
                  className="py-3 min-h-[44px] flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle/50 px-2 rounded-md transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Video className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-ink truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        Kênh: {item.channelName || 'Không có tên'} • {item.creatorEmail}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-muted tabular-nums">
                      {formatDateTime(item.createdAt)}
                    </span>
                    <StatusBadge status={item.decision} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">
                Không có video nào đang chờ duyệt.
              </div>
            )}
          </div>
        </div>

        {/* Recent Pending KYC Queue */}
        <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-status-pending-text" />
              <h3 className="font-serif text-base font-bold text-ink">
                Hàng đợi Xác thực KYC Creator ({pendingKycCount})
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/kyc')}
              className="min-h-[44px] px-3 text-xs text-muted hover:text-ink"
            >
              <span>Xem tất cả</span>
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {recentKycItems.length > 0 ? (
              recentKycItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/admin/kyc/${item.id}`)}
                  className="py-3 min-h-[44px] flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle/50 px-2 rounded-md transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-ink truncate">
                      {item.fullName || 'Chưa cập nhật tên'}
                    </span>
                    <span className="text-[11px] text-muted truncate font-mono">
                      {item.userEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-muted tabular-nums">
                      {formatDateTime(item.createdAt)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">
                Không có hồ sơ KYC nào đang chờ duyệt.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Withdrawals Quick Review Strip */}
      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-status-processing-text" />
            <h3 className="font-serif text-base font-bold text-ink">
              Yêu cầu Rút tiền chờ xem xét ({pendingWithCount})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/withdrawals')}
            className="min-h-[44px] px-3 text-xs text-muted hover:text-ink"
          >
            <span>Tất cả yêu cầu rút</span>
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="divide-y divide-border">
          {pendingWithItems.length > 0 ? (
            pendingWithItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/admin/withdrawals/${item.id}`)}
                className="py-3 min-h-[44px] flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle/50 px-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-semibold text-ink">
                    Yêu cầu #{item.id}
                  </span>
                  <span className="text-xs text-muted">
                    {item.bankName} • {item.accountHolderName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-accent tabular-nums">
                    {formatVND(item.amount)}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-muted">
              Không có yêu cầu rút tiền nào đang chờ xử lý.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
