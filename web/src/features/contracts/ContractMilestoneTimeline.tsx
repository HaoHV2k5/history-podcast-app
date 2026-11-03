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
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
} from './milestoneFinanceLogic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND, formatDateTime } from '@/utils/formatters';

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

  // Prefer fetched data, fall back to initialMilestones
  const milestones: MilestoneItem[] =
    (response?.data && response.data.length > 0
      ? response.data
      : initialMilestones) || [];

  const breakdown = calculateEscrowBreakdown(milestones);

  const isForbidden =
    (error as { response?: { status?: number } })?.response?.status === 403;

  if (isLoading && milestones.length === 0) {
    return (
      <div className={`space-y-3 py-6 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-xs text-stone-500 py-6 font-sans">
          <RefreshCw className="h-4 w-4 animate-spin text-[#991B1B]" />
          <span>Đang tải danh sách cột mốc & dữ liệu ký quỹ...</span>
        </div>
      </div>
    );
  }

  if (isError && milestones.length === 0) {
    return (
      <div className={`rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 space-y-2.5 font-sans ${className}`}>
        <div className="flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              {isForbidden
                ? 'Không có quyền truy cập dữ liệu cột mốc (403 Forbidden)'
                : 'Không thể kết nối danh sách cột mốc hợp đồng'}
            </p>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              {isForbidden
                ? 'Tài khoản hiện tại không có quyền truy vấn chi tiết cột mốc của hợp đồng này.'
                : 'Không thể tải dữ liệu trực tiếp từ máy chủ. Vui lòng thử lại.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-7 px-3 border-rose-300 hover:bg-rose-100 text-rose-800 rounded-lg"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5]/60 p-5 text-center space-y-1.5 font-sans ${className}`}>
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF0F2] text-[#991B1B]">
          <Layers className="h-4 w-4" />
        </div>
        <h4 className="text-xs font-semibold text-stone-800">Chưa có cột mốc thanh toán</h4>
        <p className="text-[11px] text-stone-500 max-w-sm mx-auto leading-relaxed">
          Hợp đồng #{contractId} chưa được thiết lập các giai đoạn nghiệm thu hoặc chưa phát sinh dữ liệu cột mốc.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 font-sans ${className}`}>
      {/* 4 Financial Escrow KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/70 p-2.5 space-y-0.5">
          <div className="flex items-center justify-between text-[10.5px] text-stone-500">
            <span>Tổng giá trị</span>
            <Coins className="h-3.5 w-3.5 text-[#991B1B]" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold tabular-nums text-stone-900">
            {formatVND(breakdown.totalGross)}
          </div>
          <div className="text-[10px] text-stone-400 tabular-nums">
            {breakdown.totalMilestones} cột mốc
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-2.5 space-y-0.5">
          <div className="flex items-center justify-between text-[10.5px] text-amber-800">
            <span>Đang giữ Escrow</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold tabular-nums text-stone-900">
            {formatVND(breakdown.currentlyHeld)}
          </div>
          <div className="text-[10px] text-amber-700">Trạng thái HELD</div>
        </div>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-2.5 space-y-0.5">
          <div className="flex items-center justify-between text-[10.5px] text-emerald-800">
            <span>Đã giải ngân (Net)</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold tabular-nums text-stone-900">
            {formatVND(breakdown.totalReleasedNet)}
          </div>
          <div className="text-[10px] text-stone-500 tabular-nums">
            Phí sàn: {formatVND(breakdown.totalPlatformFee)}
          </div>
        </div>

        <div className="rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/70 p-2.5 space-y-0.5">
          <div className="flex items-center justify-between text-[10.5px] text-stone-500">
            <span>Chưa nạp / Hoàn trả</span>
            <FileCheck2 className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold tabular-nums text-stone-900">
            {formatVND(breakdown.unfundedAmount + breakdown.totalRefunded)}
          </div>
          <div className="text-[10px] text-stone-400 tabular-nums">
            {breakdown.totalRefunded > 0
              ? `Hoàn lại: ${formatVND(breakdown.totalRefunded)}`
              : 'Chưa ký quỹ'}
          </div>
        </div>
      </div>

      {/* Milestone List Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <h4 className="font-semibold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#991B1B]" />
            <span>Tiến trình Cột mốc & Ký quỹ (Milestone Timeline)</span>
          </h4>
          <span className="text-[11px] tabular-nums text-stone-400">
            Hợp đồng #{contractId}
          </span>
        </div>

        <div className="space-y-2.5">
          {milestones.map((milestone) => {
            const workStatus = formatMilestoneWorkStatus(milestone.status);
            const escrowStatus = formatMilestoneEscrowStatus(milestone.escrowStatus);

            const grossAmount = Number(milestone.amount || 0);
            const feePercent = milestone.feePercent != null ? Number(milestone.feePercent) : 5;
            const platformFee =
              milestone.platformFee != null
                ? Number(milestone.platformFee)
                : Math.round(grossAmount * (feePercent / 100));
            const netAmount =
              milestone.netAmount != null
                ? Number(milestone.netAmount)
                : Math.max(0, grossAmount - platformFee);

            // Contextual date formatters aligned with backend lifecycle
            const formatFundedLabel = () => {
              if (milestone.fundedAt) {
                try {
                  return formatDateTime(milestone.fundedAt);
                } catch {
                  return 'Đã nạp Escrow';
                }
              }
              if (milestone.escrowStatus === 'UNFUNDED') return 'Chưa ký quỹ';
              if (milestone.escrowStatus === 'HELD') return 'Đang giữ Escrow';
              return 'Chưa nạp';
            };

            const formatDueLabel = () => {
              if (milestone.dueAt) {
                try {
                  return formatDateTime(milestone.dueAt);
                } catch {
                  return 'Theo tiến độ';
                }
              }
              if (milestone.durationDays) return `Trong hạn ${milestone.durationDays} ngày`;
              return 'Theo tiến độ';
            };

            const formatReviewDueLabel = () => {
              if (milestone.reviewDueAt) {
                try {
                  return formatDateTime(milestone.reviewDueAt);
                } catch {
                  return '3 ngày sau nộp';
                }
              }
              if (milestone.status === 'IN_PROGRESS') return '3 ngày sau khi nộp';
              if (milestone.status === 'WAITING' || milestone.status === 'UNFUNDED') return 'Chưa kích hoạt';
              return '3 ngày xét duyệt';
            };

            const formatReleaseLabel = () => {
              if (milestone.refundedAt) {
                try {
                  return `Hoàn trả: ${formatDateTime(milestone.refundedAt)}`;
                } catch {
                  return 'Đã hoàn trả';
                }
              }
              if (milestone.releasedAt) {
                try {
                  return `Giải ngân: ${formatDateTime(milestone.releasedAt)}`;
                } catch {
                  return 'Đã giải ngân';
                }
              }
              if (milestone.escrowStatus === 'HELD') return 'Giải ngân: Chờ nghiệm thu';
              if (milestone.escrowStatus === 'UNFUNDED') return 'Giải ngân: Chờ ký quỹ';
              return 'Giải ngân: Chưa tất toán';
            };

            return (
              <div
                key={milestone.id}
                className="p-3 sm:p-3.5 rounded-xl border border-[#F0EBE6] bg-white space-y-2.5 shadow-2xs hover:border-[#E7E5E4] transition-colors"
              >
                {/* Header row: Order, Title, Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF0F2] tabular-nums text-[11px] font-bold text-[#991B1B] border border-[#FFE4E8]">
                      {milestone.orderNo || '#'}
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-stone-900 leading-snug">
                        {milestone.title || `Cột mốc #${milestone.orderNo}`}
                      </h5>
                      {milestone.requirement && (
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1" title={milestone.requirement}>
                          {milestone.requirement}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-7 sm:pl-0">
                    <div className="inline-flex items-center gap-1 text-[10.5px]">
                      <span className="text-stone-400">Tiến độ:</span>
                      <Badge variant={workStatus.variant} size="sm" className="font-medium text-[10px] px-2 py-0">
                        {workStatus.label}
                      </Badge>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10.5px]">
                      <span className="text-stone-400">Ký quỹ:</span>
                      <Badge variant={escrowStatus.variant} size="sm" className="font-medium text-[10px] px-2 py-0">
                        {escrowStatus.label}
                      </Badge>
                    </div>
                    {(() => {
                      const autoRelease = getAutoReleaseIndicator(milestone);
                      if (autoRelease) {
                        return (
                          <Badge variant={autoRelease.badgeVariant} size="sm" className="font-normal text-[10px] px-2 py-0">
                            {autoRelease.message}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Financial Breakdown Grid (Zero Missing Data) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-stone-50/80 border border-[#F0EBE6] p-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-semibold">
                      Tổng giá trị (Gross)
                    </span>
                    <span className="font-bold tabular-nums text-stone-900">
                      {formatVND(grossAmount)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-semibold">
                      Phí sàn ({feePercent}%)
                    </span>
                    <span className="text-stone-600 tabular-nums">
                      {formatVND(platformFee)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-stone-400 block uppercase tracking-wider font-semibold">
                      Thực nhận Thuyết minh viên
                    </span>
                    <span className="font-bold tabular-nums text-emerald-700">
                      {formatVND(netAmount)}
                    </span>
                    {getMilestoneSplitRefund(milestone) > 0 && (
                      <span className="text-[10px] text-amber-700 block tabular-nums">
                        (Hoàn Creator: {formatVND(getMilestoneSplitRefund(milestone))})
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamps contextual row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] text-stone-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0 text-stone-400" />
                    <span className="truncate" title={formatFundedLabel()}>
                      Ký quỹ: <strong className="font-medium text-stone-700 tabular-nums">{formatFundedLabel()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0 text-stone-400" />
                    <span className="truncate" title={formatDueLabel()}>
                      Hạn nộp: <strong className="font-medium text-stone-700 tabular-nums">{formatDueLabel()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0 text-stone-400" />
                    <span className="truncate" title={formatReviewDueLabel()}>
                      Hạn duyệt: <strong className="font-medium text-stone-700 tabular-nums">{formatReviewDueLabel()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                    <span className="truncate" title={formatReleaseLabel()}>
                      <strong className="font-medium text-stone-700 tabular-nums">{formatReleaseLabel()}</strong>
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
