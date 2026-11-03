import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
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
  CheckCircle2,
  Layers,
  Eye,
} from 'lucide-react';
import { EscrowTransactionItem } from '@/types/escrow';
import { MilestoneItem } from '@/types/contract';
import { escrowApi } from '@/services/api/escrow';
import {
  calculateEscrowBreakdown,
  formatMilestoneWorkStatus,
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
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatVND } from '@/utils/formatters';
import { AdminMilestoneDetailModal } from './components/AdminMilestoneDetailModal';

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
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);

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

  const contractCode = `HD${String(contractId).padStart(5, '0')}`;

  return (
    <Dialog open={Boolean(escrowItem)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-6xl"
        className="w-[96vw] max-w-6xl p-0 overflow-hidden font-sans border-[#E7E5E4] rounded-2xl max-h-[min(90vh,680px)] flex flex-col shadow-2xl"
      >
        {/* Header - Fixed & Compact, pl-5 sm:pl-6 pr-14 sm:pr-16 + mr-3 to guarantee no collision with close button */}
        <div className="shrink-0 bg-[#FAF8F5] border-b border-[#F0EBE6] pl-5 sm:pl-6 pr-14 sm:pr-16 py-4 select-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B] min-w-0">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="truncate">ĐỐI SOÁT KÝ QUỸ MILESTONE</span>
            </div>
            <div className="shrink-0 mr-2 sm:mr-3">
              <StatusBadge status={escrowItem.status} />
            </div>
          </div>

          <div className="mt-1.5 flex items-baseline gap-2.5">
            <DialogTitle className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight leading-none">
              Hợp đồng {contractCode}
            </DialogTitle>
            <span className="text-xs text-stone-400 font-sans tabular-nums">(ID #{contractId})</span>
          </div>

          <DialogDescription className="text-xs text-stone-500 mt-1 font-sans">
            Giao dịch ký quỹ Escrow ID #{escrowItem.id} • Tổng số tiền bảo chứng:{' '}
            <strong className="text-stone-900 font-semibold tabular-nums">{formatVND(escrowItem.amount)}</strong>
          </DialogDescription>
        </div>

        {/* Content Body - Scrollable if needed, clean single font-sans */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 font-sans select-none">
          {/* Action Toolbar & Ledger Health */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl border border-[#F0EBE6] bg-white shadow-2xs">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isLoading || isError || milestones.length === 0}
                className="h-8 px-3 text-xs rounded-lg border border-[#E7E5E4] text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-stone-500" />
                <span>Xuất CSV đối soát</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/admin/contracts?search=${contractCode}`);
                }}
                className="h-8 px-2.5 text-xs rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 inline-flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                <span>Xem Hợp đồng {contractCode}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans tabular-nums text-stone-500">
              <span className="font-medium text-stone-700">{breakdown.totalMilestones} Cột mốc</span>
              <span>•</span>
              <span
                className={`font-semibold inline-flex items-center gap-1 ${
                  breakdown.isBalanced ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {breakdown.isBalanced ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Sổ cái cân bằng</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Cảnh báo lệch sổ</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Informational Guidance Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#FFE4E6] bg-[#FFF0F2] p-3 text-xs text-[#991B1B] leading-relaxed">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#991B1B]" />
            <p>
              Hệ thống bảo chứng Sử Ký quản lý dòng tiền độc lập theo từng Cột mốc (Milestone). Tiền của mỗi mốc chỉ được
              giải ngân cho Thuyết minh viên sau khi nghiệm thu và hết thời hạn giữ tiền 3 ngày. Bảng đối soát dưới đây phản
              ánh chính xác tình trạng tài chính của từng giai đoạn.
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2.5 text-xs text-stone-500 py-12">
              <RefreshCw className="h-4 w-4 animate-spin text-[#991B1B]" />
              <span>Đang truy vấn sổ cái cột mốc hợp đồng #{contractId}...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3 text-xs text-rose-800">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {isForbidden
                      ? 'Không có quyền truy cập dữ liệu cột mốc (403 Forbidden)'
                      : 'Không thể tải sổ cái cột mốc'}
                  </p>
                  <p className="text-[11px] text-rose-700">
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
                  className="h-8 px-3 text-xs rounded-lg border-rose-300 text-rose-800 hover:bg-rose-100"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  <span>Thử lại</span>
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && milestones.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5] p-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-[#991B1B]">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-semibold text-stone-900">
                Chưa có dữ liệu cột mốc chi tiết
              </h4>
              <p className="text-[11px] text-stone-500 max-w-md mx-auto leading-relaxed">
                Giao dịch ký quỹ #{escrowItem.id} chưa có phân rã cột mốc (áp dụng ký quỹ nguyên hợp đồng)
                hoặc chưa ghi nhận cấu hình milestone trên hệ thống.
              </p>
            </div>
          )}

          {/* Data Loaded: 4 Financial Cards & Table */}
          {!isLoading && !isError && milestones.length > 0 && (
            <div className="space-y-3.5">
              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Tổng giá trị */}
                <div className="rounded-xl border border-[#F0EBE6] bg-white p-3 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span>Tổng giá trị</span>
                    <Coins className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <div className="text-base font-bold font-sans tabular-nums text-stone-900 leading-tight">
                    {formatVND(breakdown.totalGross)}
                  </div>
                  <div className="text-[10px] text-stone-400 font-sans tabular-nums">
                    {breakdown.totalMilestones} cột mốc
                  </div>
                </div>

                {/* 2. Đang giữ Escrow */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-blue-700 font-medium">
                    <span>Đang giữ Escrow</span>
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="text-base font-bold font-sans tabular-nums text-blue-900 leading-tight">
                    {formatVND(breakdown.currentlyHeld)}
                  </div>
                  <div className="text-[10px] text-blue-600">Trạng thái HELD</div>
                </div>

                {/* 3. Đã giải ngân */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                    <span>Đã giải ngân (Net)</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="text-base font-bold font-sans tabular-nums text-emerald-900 leading-tight">
                    {formatVND(breakdown.totalReleasedNet)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-sans tabular-nums">
                    Phí sàn: {formatVND(breakdown.totalPlatformFee)}
                  </div>
                </div>

                {/* 4. Hoàn trả / Đóng băng */}
                <div className="rounded-xl border border-[#F0EBE6] bg-white p-3 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span>Hoàn trả / Đóng băng</span>
                    <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <div className="text-base font-bold font-sans tabular-nums text-stone-900 leading-tight">
                    {formatVND(breakdown.totalRefunded + breakdown.currentlyFrozen)}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {breakdown.currentlyFrozen > 0
                      ? `Đóng băng: ${formatVND(breakdown.currentlyFrozen)}`
                      : breakdown.totalRefunded > 0
                        ? `Đã hoàn: ${formatVND(breakdown.totalRefunded)}`
                        : 'Không phát sinh'}
                  </div>
                </div>
              </div>

              {/* Milestones Escrow Table - 100% Fit Sử Ký Style (Anti-Overlap & Spacious) */}
              <div className="w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs">
                <div className="overflow-x-auto lg:overflow-x-visible">
                  <table className="w-full table-auto sm:table-fixed text-left text-xs font-sans border-collapse">
                    <thead className="bg-[#FAF8F5] border-b border-[#F0EBE6] text-[11px] text-stone-500 uppercase font-semibold tracking-wider">
                      <tr>
                        <th className="py-3 px-2 text-center w-10">#</th>
                        <th className="py-3 px-3 w-[22%] min-w-[160px]">Cột mốc</th>
                        <th className="py-3 px-2.5 text-right w-[11%] min-w-[90px] whitespace-nowrap">Giá trị (Gross)</th>
                        <th className="py-3 px-2 text-right w-[9%] min-w-[80px] whitespace-nowrap">Phí sàn (5%)</th>
                        <th className="py-3 px-2.5 text-right w-[11%] min-w-[90px] whitespace-nowrap">Thực nhận (95%)</th>
                        <th className="py-3 px-3 w-[19%] min-w-[150px] whitespace-nowrap">Ký quỹ (Escrow)</th>
                        <th className="py-3 px-3 w-[16%] min-w-[130px] whitespace-nowrap">Tiến độ (Work)</th>
                        <th className="py-3 px-2 text-center w-[12%] min-w-[95px] whitespace-nowrap">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE6]">
                      {milestones.map((m) => {
                        const workStatus = formatMilestoneWorkStatus(m.status);
                        const isHeld = m.escrowStatus === 'HELD';
                        const isReleased = m.escrowStatus === 'RELEASED';
                        const isFrozen = m.escrowStatus === 'FROZEN';
                        const isRefunded = m.escrowStatus === 'REFUNDED';

                        return (
                          <tr
                            key={m.id}
                            onClick={() => setSelectedMilestone(m)}
                            className="hover:bg-amber-50/40 cursor-pointer transition-colors group"
                          >
                            {/* # */}
                            <td className="py-3 px-2 text-center text-stone-400 font-sans tabular-nums font-semibold">
                              {m.orderNo || '#'}
                            </td>

                            {/* Cột mốc */}
                            <td className="py-3 px-3 min-w-0">
                              <span
                                className="font-semibold text-stone-900 group-hover:text-[#991B1B] transition-colors block truncate"
                                title={m.title}
                              >
                                {m.title || `Cột mốc #${m.orderNo}`}
                              </span>
                              {m.requirement && (
                                <span className="text-[10.5px] text-stone-400 block truncate mt-0.5" title={m.requirement}>
                                  {m.requirement}
                                </span>
                              )}
                            </td>

                            {/* Giá trị Gross */}
                            <td className="py-3 px-2.5 text-right font-sans font-bold tabular-nums text-stone-900 whitespace-nowrap">
                              {formatVNDOrFallback(m.amount)}
                            </td>

                            {/* Phí sàn */}
                            <td className="py-3 px-2 text-right font-sans tabular-nums text-[#991B1B] whitespace-nowrap">
                              {m.platformFee != null ? formatVND(m.platformFee) : (m.feePercent != null ? `${m.feePercent}%` : '5%')}
                            </td>

                            {/* Thực nhận Net */}
                            <td className="py-3 px-2.5 text-right font-sans font-bold tabular-nums text-emerald-700 whitespace-nowrap">
                              {m.netAmount != null ? formatVND(m.netAmount) : '—'}
                              {getMilestoneSplitRefund(m) > 0 && (
                                <span className="block text-[10px] text-amber-600 font-normal">
                                  Hoàn: {formatVND(getMilestoneSplitRefund(m))}
                                </span>
                              )}
                            </td>

                            {/* Ký quỹ (Escrow) - Single line badge */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {isHeld ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5 shrink-0" />
                                  <span>Đang giữ ký quỹ</span>
                                </span>
                              ) : isReleased ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                                    <span>Đã giải ngân</span>
                                  </span>
                                  {m.releasedAt && (
                                    <span className="block text-[10px] text-stone-400 tabular-nums">
                                      {formatDateOrFallback(m.releasedAt)}
                                    </span>
                                  )}
                                </div>
                              ) : isFrozen ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1.5 shrink-0" />
                                    <span>Tạm đóng băng</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                      navigate(`/admin/disputes?search=${contractId}`);
                                    }}
                                    className="h-5 px-1.5 text-[10px] text-rose-700 hover:bg-rose-50 rounded border border-rose-200 flex items-center gap-1 transition-colors"
                                  >
                                    <Gavel className="h-2.5 w-2.5" />
                                    <span>Xem khiếu nại</span>
                                  </button>
                                </div>
                              ) : isRefunded ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-1.5 shrink-0" />
                                    <span>Đã hoàn cọc</span>
                                  </span>
                                  {m.refundedAt && (
                                    <span className="block text-[10px] text-stone-400 tabular-nums">
                                      {formatDateOrFallback(m.refundedAt)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-50 text-stone-500 border border-stone-200 shrink-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400 mr-1.5 shrink-0" />
                                  <span>Chưa ký quỹ</span>
                                </span>
                              )}
                            </td>

                            {/* Tiến độ (Work) */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-50 text-stone-700 border border-stone-200 shrink-0">
                                {workStatus.label}
                              </span>
                              {(() => {
                                const autoRelease = getAutoReleaseIndicator(m);
                                if (autoRelease) {
                                  return (
                                    <span className="mt-1 block max-w-fit text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      {autoRelease.message}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </td>

                            {/* Thao tác - Chi tiết */}
                            <td className="py-3 px-2 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMilestone(m);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:text-[#991B1B] hover:border-[#991B1B]/40 hover:bg-[#FAF8F5] transition-all text-xs font-medium shadow-2xs whitespace-nowrap shrink-0"
                                title="Xem chi tiết cột mốc giai đoạn"
                              >
                                <Eye className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#991B1B]" />
                                <span>Chi tiết</span>
                              </button>
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
        </div>

        {/* Modal Footer - Fixed & Compact */}
        <div className="shrink-0 bg-[#FAF8F5] border-t border-[#F0EBE6] px-5 sm:px-6 py-2.5 flex items-center justify-between gap-2 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 px-4 rounded-xl border border-[#E7E5E4] text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              disabled={isLoading || isError || milestones.length === 0}
              className="h-8 px-3 text-xs rounded-xl border border-[#E7E5E4] text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1.5"
            >
              <Download className="h-3 w-3 text-stone-500" />
              <span>Xuất CSV</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                navigate(`/admin/contracts?search=${contractCode}`);
              }}
              className="h-8 px-3.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Xem hợp đồng</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Milestone Detail Submodal - Admin clicks into each milestone */}
      <AdminMilestoneDetailModal
        milestone={selectedMilestone}
        contractCode={contractCode}
        contractTitle={milestones[0]?.contractTitle}
        onClose={() => setSelectedMilestone(null)}
        onViewContract={() => {
          setSelectedMilestone(null);
          onClose();
          navigate(`/admin/contracts?search=${contractCode}`);
        }}
      />
    </Dialog>
  );
};
