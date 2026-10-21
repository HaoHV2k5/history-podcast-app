import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Layers,
  Coins,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import { MilestoneItem } from '@/types/contract';
import { contractsApi } from '@/services/api/contracts';
import {
  calculateEscrowBreakdown,
  formatMilestoneWorkStatus,
  formatMilestoneEscrowStatus,
  formatDateOrFallback,
  formatVNDOrFallback,
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
} from './milestoneFinanceLogic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/utils/formatters';

interface ContractMilestoneTimelineProps {
  contractId: number;
  initialMilestones?: MilestoneItem[];
  contractTitle?: string;
  className?: string;
}

export const ContractMilestoneTimeline: React.FC<ContractMilestoneTimelineProps> = ({
  contractId,
  initialMilestones,
  className = '',
}) => {
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-contract-milestones', contractId],
    queryFn: () => contractsApi.getMilestonesByContractId(contractId),
    enabled: Boolean(contractId),
    initialData:
      initialMilestones && initialMilestones.length > 0
        ? {
            success: true,
            message: 'OK',
            data: initialMilestones,
            timestamp: new Date().toISOString(),
          }
        : undefined,
  });

  const milestones: MilestoneItem[] = response?.data || initialMilestones || [];
  const breakdown = calculateEscrowBreakdown(milestones);

  // Check error status (like 403 Forbidden)
  const isForbidden =
    (error as { response?: { status?: number } })?.response?.status === 403;

  if (isLoading) {
    return (
      <div className={`space-y-4 py-6 ${className}`}>
        <div className="flex items-center justify-center gap-2.5 text-xs text-muted py-8">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" />
          <span>Đang tải danh sách cột mốc & dữ liệu ký quỹ...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`rounded-lg border border-status-error-text/30 bg-status-error-bg/60 p-4 space-y-3 ${className}`}>
        <div className="flex items-start gap-2.5 text-xs text-status-error-text">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              {isForbidden
                ? 'Không có quyền truy cập dữ liệu cột mốc (403 Forbidden)'
                : 'Không thể tải danh sách cột mốc hợp đồng'}
            </p>
            <p className="text-[11px] opacity-90">
              {isForbidden
                ? 'Tài khoản hiện tại không có quyền truy vấn chi tiết cột mốc của hợp đồng này.'
                : 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng bấm thử lại.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs min-h-[36px] border-status-error-text/40 hover:bg-status-error-bg"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-border bg-surface-subtle p-6 text-center space-y-2 ${className}`}>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Layers className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-semibold text-ink">Chưa có cột mốc thanh toán</h4>
        <p className="text-[11px] text-muted max-w-sm mx-auto leading-relaxed">
          Hợp đồng #{contractId} chưa được thiết lập các giai đoạn nghiệm thu hoặc chưa phát sinh dữ liệu cột mốc.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Tổng giá trị</span>
            <Coins className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="text-sm font-semibold font-mono text-ink">
            {formatVND(breakdown.totalGross)}
          </div>
          <div className="text-[10px] text-muted font-mono">
            {breakdown.totalMilestones} cột mốc
          </div>
        </div>

        <div className="rounded-lg border border-status-processing-text/25 bg-status-processing-bg/30 p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-status-processing-text">
            <span>Đang giữ Escrow</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-semibold font-mono text-ink">
            {formatVND(breakdown.currentlyHeld)}
          </div>
          <div className="text-[10px] text-muted">Trạng thái HELD</div>
        </div>

        <div className="rounded-lg border border-status-success-text/25 bg-status-success-bg/30 p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-status-success-text">
            <span>Đã giải ngân (Net)</span>
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-semibold font-mono text-ink">
            {formatVND(breakdown.totalReleasedNet)}
          </div>
          <div className="text-[10px] text-muted font-mono">
            Phí sàn: {formatVND(breakdown.totalPlatformFee)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Chưa nạp / Hoàn trả</span>
            <FileCheck2 className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-semibold font-mono text-ink">
            {formatVND(breakdown.unfundedAmount + breakdown.totalRefunded)}
          </div>
          <div className="text-[10px] text-muted">
            {breakdown.totalRefunded > 0
              ? `Hoàn lại: ${formatVND(breakdown.totalRefunded)}`
              : 'Chưa ký quỹ'}
          </div>
        </div>
      </div>

      {/* Milestone List Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span>Tiến trình Cột mốc & Ký quỹ (Milestone Timeline)</span>
          </h4>
          <span className="text-[11px] font-mono text-muted">
            Hợp đồng #{contractId}
          </span>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
          {milestones.map((milestone) => {
            const workStatus = formatMilestoneWorkStatus(milestone.status);
            const escrowStatus = formatMilestoneEscrowStatus(milestone.escrowStatus);

            return (
              <div
                key={milestone.id}
                className="p-4 space-y-3 hover:bg-canvas/50 transition-colors"
              >
                {/* Header row: Order, Title, Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-bold text-accent">
                      {milestone.orderNo || '#'}
                    </span>
                    <div>
                      <h5 className="text-xs font-semibold text-ink leading-snug">
                        {milestone.title || `Cột mốc #${milestone.orderNo}`}
                      </h5>
                      {milestone.requirement && (
                        <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                          {milestone.requirement}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Two Separate Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-8 sm:pl-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted">Tiến độ:</span>
                      <Badge variant={workStatus.variant} size="sm">
                        {workStatus.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted">Ký quỹ:</span>
                      <Badge variant={escrowStatus.variant} size="sm">
                        {escrowStatus.label}
                      </Badge>
                    </div>
                    {(() => {
                      const autoRelease = getAutoReleaseIndicator(milestone);
                      if (autoRelease) {
                        return (
                          <Badge variant={autoRelease.badgeVariant} size="sm" className="font-normal">
                            {autoRelease.message}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Financial Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-surface-subtle p-2.5 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      Tổng giá trị (Gross)
                    </span>
                    <span className="font-semibold text-ink">
                      {formatVNDOrFallback(milestone.amount)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      Phí sàn ({milestone.feePercent != null ? `${milestone.feePercent}%` : 'Theo hợp đồng'})
                    </span>
                    <span className="text-muted">
                      {milestone.platformFee != null
                        ? formatVND(milestone.platformFee)
                        : 'Chưa có dữ liệu'}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted block uppercase tracking-wider">
                      Thực nhận Thuyết minh viên
                    </span>
                    <span className="font-semibold text-status-success-text">
                      {milestone.netAmount != null
                        ? formatVND(milestone.netAmount)
                        : 'Chưa có dữ liệu'}
                    </span>
                    {getMilestoneSplitRefund(milestone) > 0 && (
                      <span className="text-[10px] text-status-pending-text block font-mono">
                        (Phân chia hoàn Creator: {formatVND(getMilestoneSplitRefund(milestone))})
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamps details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0 text-muted" />
                    <span>Ký quỹ: {formatDateOrFallback(milestone.fundedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0 text-muted" />
                    <span>Hạn nộp: {formatDateOrFallback(milestone.dueAt)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0 text-muted" />
                    <span>Hạn duyệt: {formatDateOrFallback(milestone.reviewDueAt)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 shrink-0 text-status-success-text" />
                    <span>
                      {milestone.refundedAt
                        ? `Hoàn trả: ${formatDateOrFallback(milestone.refundedAt)}`
                        : `Giải ngân: ${formatDateOrFallback(milestone.releasedAt)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
