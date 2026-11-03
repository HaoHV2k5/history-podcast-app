import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Clock,
  ShieldCheck,
  FileText,
  FileCheck2,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { MilestoneItem } from '@/types/contract';
import { deliverablesApi } from '@/services/api/deliverables';
import {
  formatMilestoneWorkStatus,
  formatDateOrFallback,
  formatVNDOrFallback,
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
} from '@/features/contracts/milestoneFinanceLogic';
import { getEscrowStatusConfig } from '../escrowLogic';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/utils/formatters';

interface AdminMilestoneDetailModalProps {
  milestone: MilestoneItem | null;
  contractCode?: string;
  contractTitle?: string;
  onClose: () => void;
  onViewContract?: (contractId: number) => void;
}

export const AdminMilestoneDetailModal: React.FC<AdminMilestoneDetailModalProps> = ({
  milestone,
  contractCode,
  contractTitle,
  onClose,
  onViewContract,
}) => {
  // Query live deliverables if milestone exists
  const { data: deliverablesRes, isLoading: isLoadingDeliverables } = useQuery({
    queryKey: ['admin-milestone-deliverables', milestone?.id],
    queryFn: () => deliverablesApi.getDeliverablesByMilestone(milestone!.id),
    enabled: Boolean(milestone?.id),
  });

  if (!milestone) return null;

  const workStatus = formatMilestoneWorkStatus(milestone.status);
  const escrowStatus = getEscrowStatusConfig(milestone.escrowStatus);
  const deliverables = deliverablesRes?.data || milestone.deliverables || [];
  const autoRelease = getAutoReleaseIndicator(milestone);
  const splitRefund = getMilestoneSplitRefund(milestone);

  const feeAmount =
    milestone.platformFee != null
      ? milestone.platformFee
      : milestone.feePercent != null
        ? Math.round((milestone.amount * milestone.feePercent) / 100)
        : Math.round(milestone.amount * 0.05);

  const netAmount =
    milestone.netAmount != null
      ? milestone.netAmount
      : milestone.amount - feeAmount;

  const handleDownload = async (deliverableId: number, fileName: string) => {
    try {
      await deliverablesApi.downloadDeliverableFile(deliverableId, fileName);
    } catch {
      window.open(deliverablesApi.getDownloadUrl(deliverableId), '_blank');
    }
  };

  return (
    <Dialog open={Boolean(milestone)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-xl"
        className="p-0 overflow-hidden font-sans border-[#E7E5E4] rounded-2xl max-h-[min(90vh,640px)] flex flex-col shadow-2xl"
      >
        {/* Header - Fixed & Compact, pr-14 sm:pr-16 to ensure zero collision with close button */}
        <div className="shrink-0 bg-[#FAF8F5] border-b border-[#F0EBE6] pl-5 sm:pl-6 pr-14 sm:pr-16 py-3.5 select-none">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#991B1B] min-w-0">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">CHI TIẾT CỘT MỐC GIAI ĐOẠN #{milestone.orderNo || milestone.id}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mr-2 sm:mr-3">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${escrowStatus.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 shrink-0 ${escrowStatus.dotColor}`} />
                <span className="whitespace-nowrap">{escrowStatus.label}</span>
              </span>
            </div>
          </div>

          <div className="mt-1.5">
            <DialogTitle className="text-lg sm:text-xl font-bold font-sans text-stone-900 tracking-tight leading-snug">
              {milestone.title || `Giai đoạn ${milestone.orderNo}`}
            </DialogTitle>
          </div>

          <DialogDescription className="text-[11px] text-stone-500 mt-0.5 truncate font-sans">
            Hợp đồng <strong className="text-stone-700 font-semibold">{contractCode || `HD${String(milestone.contractId).padStart(5, '0')}`}</strong>
            {contractTitle && ` (${contractTitle})`}
          </DialogDescription>
        </div>

        {/* Modal Body - Scrollable with compact spacing */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 font-sans">
          {/* 1. 3 Financial Cards (Gross, Fee, Net) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5 bg-stone-50/90 border border-[#E7E5E4] space-y-0.5">
              <span className="text-[10px] font-medium text-stone-500 block truncate">
                Giá trị mốc (Gross)
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold font-sans tabular-nums text-stone-900 block leading-tight">
                {formatVNDOrFallback(milestone.amount)}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                Bên thuê đặt cọc
              </span>
            </div>

            <div className="rounded-xl p-2.5 bg-rose-50/50 border border-rose-100 space-y-0.5">
              <span className="text-[10px] font-medium text-[#991B1B] block truncate">
                Phí sàn ({milestone.feePercent || 5}%)
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold font-sans tabular-nums text-[#991B1B] block leading-tight">
                {formatVND(feeAmount)}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                Nền tảng Sử Ký
              </span>
            </div>

            <div className="rounded-xl p-2.5 bg-emerald-50/50 border border-emerald-100 space-y-0.5">
              <span className="text-[10px] font-medium text-emerald-700 block truncate">
                Thực nhận (95%)
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold font-sans tabular-nums text-emerald-700 block leading-tight">
                {formatVND(netAmount)}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                {splitRefund > 0 ? `Hoàn Creator ${formatVND(splitRefund)}` : 'Chi trả Creator'}
              </span>
            </div>
          </div>

          {/* 2. Requirement & Technical Specs */}
          <div className="rounded-xl border border-[#F0EBE6] p-3.5 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-stone-400" />
                <span>Yêu cầu & Nội dung công việc</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                {workStatus.label}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#F0EBE6] text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-line">
              {milestone.requirement || 'Không có mô tả chi tiết cho giai đoạn này.'}
            </div>

            {/* Spec Chips Row */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-stone-50 border border-[#E7E5E4] text-center">
                <span className="text-stone-400 block text-[10px]">Thời hạn thực hiện</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {milestone.durationDays ? `${milestone.durationDays} ngày` : 'Theo thỏa thuận'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-stone-50 border border-[#E7E5E4] text-center">
                <span className="text-stone-400 block text-[10px]">Số lần chỉnh sửa</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {milestone.revisionsUsed || 0} / {milestone.maxRevisions || 2} lần
                </span>
              </div>

              <div className="p-2 rounded-lg bg-stone-50 border border-[#E7E5E4] text-center">
                <span className="text-stone-400 block text-[10px]">Hạn mỗi lần sửa</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {milestone.revisionDays ? `${milestone.revisionDays} ngày` : '2 ngày'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Deliverables & Outputs */}
          <div className="rounded-xl border border-[#F0EBE6] p-3.5 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-stone-400" />
                <span>Sản phẩm bàn giao ({deliverables.length})</span>
              </span>
            </div>

            {isLoadingDeliverables ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-stone-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#991B1B]" />
                <span>Đang tải tệp sản phẩm bàn giao...</span>
              </div>
            ) : deliverables.length === 0 ? (
              <div className="p-3 rounded-lg bg-stone-50 border border-[#E7E5E4] text-center text-xs text-stone-400">
                Chưa có tệp sản phẩm bàn giao nào được nộp cho giai đoạn này.
              </div>
            ) : (
              <div className="space-y-1.5">
                {deliverables.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#F0EBE6] text-xs hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 truncate" title={item.fileName}>
                          {item.fileName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          v{item.versionNo || 1}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-stone-400 block mt-0.5 tabular-nums">
                        Nộp lúc {formatDateOrFallback(item.createdAt)}
                        {item.fileSize ? ` • ${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(item.id, item.fileName)}
                      className="h-7 px-2.5 text-[11px] rounded-lg border border-[#E7E5E4] hover:bg-white text-stone-700 inline-flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <Download className="h-3 w-3 text-stone-500" />
                      <span>Tải về</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Timestamps & Countdown Notice */}
          <div className="rounded-xl border border-[#F0EBE6] p-3 bg-white space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Lộ trình & Mốc thời gian
            </span>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Hạn nộp sản phẩm:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatDateOrFallback(milestone.dueAt)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Hạn nghiệm thu:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatDateOrFallback(milestone.reviewDueAt)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Thời điểm ký quỹ:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatDateOrFallback(milestone.fundedAt || milestone.fundDueAt)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Thời điểm giải ngân:</span>
                <span className="font-semibold text-emerald-700 tabular-nums">
                  {formatDateOrFallback(milestone.releasedAt || milestone.releaseAt)}
                </span>
              </div>
            </div>

            {autoRelease && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>{autoRelease.message}</span>
              </div>
            )}
          </div>

          {/* 5. Escrow Protection Notice */}
          <div className="rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] p-2.5 flex items-center gap-2 text-[11px] text-[#991B1B] leading-tight">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#991B1B]" />
            <span>
              Cột mốc này được quản lý độc lập trong Escrow. Tiền chỉ được giải ngân cho Creator sau khi hoàn thành nghiệm thu hoặc hết hạn đối soát 3 ngày.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 bg-[#FAF8F5] border-t border-[#F0EBE6] px-5 sm:px-6 py-2.5 flex items-center justify-between gap-2 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 px-3.5 rounded-xl border border-[#E7E5E4] text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Đóng
          </Button>

          {onViewContract && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                onViewContract(milestone.contractId);
              }}
              className="h-8 px-3.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Xem hợp đồng liên quan</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
