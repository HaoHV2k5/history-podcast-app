import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
  Layers,
  Coins,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Info,
  Download,
  ExternalLink,
  Gavel,
} from 'lucide-react';
import { EscrowTransactionItem } from '@/types/escrow';
import { MilestoneItem } from '@/types/contract';
import { escrowApi } from '@/services/api/escrow';
import {
  calculateEscrowBreakdown,
  formatMilestoneWorkStatus,
  formatMilestoneEscrowStatus,
  formatDateOrFallback,
  formatVNDOrFallback,
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
  generateMilestoneEscrowCSV,
  downloadCSV,
} from '@/features/contracts/milestoneFinanceLogic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatVND } from '@/utils/formatters';

interface EscrowMilestoneBreakdownDialogProps {
  escrowItem: EscrowTransactionItem | null;
  onClose: () => void;
}

export const EscrowMilestoneBreakdownDialog: React.FC<EscrowMilestoneBreakdownDialogProps> = ({
  escrowItem,
  onClose,
}) => {
  const navigate = useNavigate();
  const contractId = escrowItem?.contractId;

  const {
    data: milestonesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-escrow-milestones', contractId],
    queryFn: () => escrowApi.getMilestonesByContract(contractId!),
    enabled: Boolean(contractId),
  });

  const milestones: MilestoneItem[] = milestonesResponse?.data || [];
  const breakdown = calculateEscrowBreakdown(milestones);

  const handleExportCSV = () => {
    if (!contractId || milestones.length === 0) return;
    const csv = generateMilestoneEscrowCSV(
      contractId,
      `Hợp đồng #${contractId}`,
      milestones,
      breakdown
    );
    downloadCSV(`Doi_soat_Ky_quy_Hop_dong_${contractId}.csv`, csv);
  };

  const isForbidden =
    (error as { response?: { status?: number } })?.response?.status === 403;

  if (!escrowItem) return null;

  return (
    <Dialog open={Boolean(escrowItem)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-4xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              <span>Đối soát Ký quỹ Milestone — Hợp đồng #{contractId}</span>
            </DialogTitle>
            <StatusBadge status={escrowItem.status} />
          </div>
          <DialogDescription>
            Giao dịch Ký quỹ Escrow ID #{escrowItem.id} • Tổng số tiền bảo chứng:{' '}
            <strong className="text-ink font-mono">{formatVND(escrowItem.amount)}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Action Toolbar: CSV Export and Cross-links */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isLoading || isError || milestones.length === 0}
              className="text-xs min-h-[32px] px-3 inline-flex items-center gap-1.5 border-border hover:border-accent hover:text-accent"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất CSV đối soát</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/admin/contracts?search=${contractId}`);
              }}
              className="text-xs min-h-[32px] px-2.5 inline-flex items-center gap-1 text-muted hover:text-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Xem Hợp đồng #{contractId}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span>{breakdown.totalMilestones} Cột mốc</span>
            <span>•</span>
            <span className={breakdown.isBalanced ? 'text-status-success-text' : 'text-status-error-text'}>
              {breakdown.isBalanced ? '✓ Sổ cái cân bằng' : '⚠ Cảnh báo lệch sổ'}
            </span>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-subtle p-3 text-xs text-muted leading-relaxed">
          <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p>
            Hệ thống bảo chứng Sử Ký quản lý dòng tiền độc lập theo từng Cột mốc (Milestone).
            Tiền của mỗi cột mốc chỉ được giải ngân cho Thuyết minh viên sau khi Creator nghiệm thu và hết thời hạn giữ tiền 3 ngày.
            Bảng đối soát dưới đây phản ánh chính xác tình trạng tài chính của từng giai đoạn.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2.5 text-xs text-muted py-12">
            <RefreshCw className="h-4 w-4 animate-spin text-accent" />
            <span>Đang truy vấn sổ cái cột mốc hợp đồng #{contractId}...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg/60 p-4 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-status-error-text">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {isForbidden
                    ? 'Không có quyền truy cập dữ liệu cột mốc (403 Forbidden)'
                    : 'Không thể tải sổ cái cột mốc'}
                </p>
                <p className="text-[11px] opacity-90">
                  {isForbidden
                    ? 'Tài khoản Quản trị viên hiện tại không được cấp quyền đọc chi tiết cột mốc của hợp đồng này.'
                    : 'Đã xảy ra lỗi trong quá trình kết nối tới Backend. Vui lòng thử lại.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-xs min-h-[36px]"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && milestones.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-8 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-semibold text-ink">
              Chưa có dữ liệu cột mốc chi tiết
            </h4>
            <p className="text-[11px] text-muted max-w-md mx-auto leading-relaxed">
              Giao dịch ký quỹ #{escrowItem.id} chưa có phân rã cột mốc (áp dụng ký quỹ nguyên hợp đồng)
              hoặc chưa ghi nhận cấu hình milestone trên hệ thống.
            </p>
          </div>
        )}

        {/* Data Loaded */}
        {!isLoading && !isError && milestones.length > 0 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* KPI Financial Breakdown Cards (Strict Zero-Double-Counting) */}
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
                  <span>Hoàn trả / Đóng băng</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <div className="text-sm font-semibold font-mono text-ink">
                  {formatVND(breakdown.totalRefunded + breakdown.currentlyFrozen)}
                </div>
                <div className="text-[10px] text-muted">
                  {breakdown.currentlyFrozen > 0
                    ? `Đóng băng: ${formatVND(breakdown.currentlyFrozen)}`
                    : breakdown.totalRefunded > 0
                      ? `Đã hoàn: ${formatVND(breakdown.totalRefunded)}`
                      : 'Không phát sinh'}
                </div>
              </div>
            </div>

            {/* Milestones Escrow Table */}
            <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-subtle border-b border-border text-[11px] text-muted uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Cột mốc</th>
                      <th className="py-2.5 px-3 text-right">Giá trị (Gross)</th>
                      <th className="py-2.5 px-3 text-right">Phí sàn</th>
                      <th className="py-2.5 px-3 text-right">Thực nhận (Net)</th>
                      <th className="py-2.5 px-3">Ký quỹ (Escrow)</th>
                      <th className="py-2.5 px-3">Tiến độ (Work)</th>
                      <th className="py-2.5 px-3">Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {milestones.map((m) => {
                      const workStatus = formatMilestoneWorkStatus(m.status);
                      const escrowStatus = formatMilestoneEscrowStatus(m.escrowStatus);

                      return (
                        <tr key={m.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-accent">
                            {m.orderNo || '#'}
                          </td>
                          <td className="py-3 px-3 max-w-[200px]">
                            <span className="font-semibold text-ink block truncate">
                              {m.title || `Cột mốc #${m.orderNo}`}
                            </span>
                            {m.requirement && (
                              <span className="text-[10px] text-muted block truncate">
                                {m.requirement}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-ink whitespace-nowrap">
                            {formatVNDOrFallback(m.amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted whitespace-nowrap">
                            {m.platformFee != null ? formatVND(m.platformFee) : (m.feePercent != null ? `${m.feePercent}%` : 'Theo hợp đồng')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-status-success-text whitespace-nowrap">
                            {m.netAmount != null ? formatVND(m.netAmount) : 'Chưa có dữ liệu'}
                            {getMilestoneSplitRefund(m) > 0 && (
                              <span className="block text-[10px] text-status-pending-text font-normal">
                                Hoàn Creator: {formatVND(getMilestoneSplitRefund(m))}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge variant={escrowStatus.variant} size="sm">
                              {escrowStatus.label}
                            </Badge>
                            {m.escrowStatus === 'FROZEN' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  navigate(`/admin/disputes?search=${contractId}`);
                                }}
                                className="mt-1 h-5 px-1.5 text-[10px] text-status-error-text hover:bg-status-error-bg/60 rounded border border-status-error-text/30 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Xem khiếu nại đang đóng băng mốc này"
                              >
                                <Gavel className="h-2.5 w-2.5" />
                                <span>Xem khiếu nại</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge variant={workStatus.variant} size="sm">
                              {workStatus.label}
                            </Badge>
                            {(() => {
                              const autoRelease = getAutoReleaseIndicator(m);
                              if (autoRelease) {
                                return (
                                  <Badge
                                    variant={autoRelease.badgeVariant}
                                    size="sm"
                                    className="mt-1 block max-w-fit font-normal text-[10px]"
                                  >
                                    {autoRelease.message}
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-muted whitespace-nowrap">
                            {m.releasedAt ? (
                              <span>Giải ngân: {formatDateOrFallback(m.releasedAt)}</span>
                            ) : m.refundedAt ? (
                              <span className="text-status-pending-text">Hoàn tiền: {formatDateOrFallback(m.refundedAt)}</span>
                            ) : m.fundedAt ? (
                              <span>Đã khóa: {formatDateOrFallback(m.fundedAt)}</span>
                            ) : (
                              <span>Chưa nạp tiền</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
