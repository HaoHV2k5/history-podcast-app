import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Clock,
  ShieldCheck,
  FileText,
  FileCheck2,
  FileAudio,
  FileVideo,
  FileArchive,
  Download,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Star,
} from 'lucide-react';
import { MilestoneItem } from '@/types/contract';
import { MilestoneDeliverableItem } from '@/types/deliverable';
import { deliverablesApi } from '@/services/api/deliverables';
import { DeliverableMediaModal } from '@/features/creator/components/DeliverableMediaModal';
import {
  formatMilestoneWorkStatus,
  formatDateOrFallback,
  formatVNDOrFallback,
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
  getMilestoneRevisionInfo,
} from '@/features/contracts/milestoneFinanceLogic';
import { getEscrowStatusConfig } from '../escrowLogic';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatVND, formatDateTime } from '@/utils/formatters';

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
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MilestoneDeliverableItem | null>(null);

  // Query live deliverables if milestone exists
  const { data: deliverablesRes, isLoading: isLoadingDeliverables } = useQuery({
    queryKey: ['admin-milestone-deliverables', milestone?.id],
    queryFn: () => deliverablesApi.getDeliverablesByMilestone(milestone!.id),
    enabled: Boolean(milestone?.id),
  });

  if (!milestone) return null;

  const workStatus = formatMilestoneWorkStatus(milestone.status);
  const escrowStatus = getEscrowStatusConfig(milestone.escrowStatus);
  const deliverables: MilestoneDeliverableItem[] =
    deliverablesRes?.data || (milestone.deliverables as MilestoneDeliverableItem[]) || [];
  const autoRelease = getAutoReleaseIndicator(milestone);
  const splitRefund = getMilestoneSplitRefund(milestone);
  const revisionInfo = getMilestoneRevisionInfo(milestone);

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

  const renderFileIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'webm') {
      return <FileVideo className="h-5 w-5 text-rose-500 shrink-0" />;
    }
    if (ext === 'mp3' || ext === 'wav' || ext === 'm4a' || ext === 'ogg') {
      return <FileAudio className="h-5 w-5 text-amber-500 shrink-0" />;
    }
    if (ext === 'zip' || ext === 'rar') {
      return <FileArchive className="h-5 w-5 text-indigo-500 shrink-0" />;
    }
    return <FileText className="h-5 w-5 text-emerald-600 shrink-0" />;
  };

  return (
    <>
      <Dialog open={Boolean(milestone)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          maxWidth="max-w-2xl"
          className="p-0 overflow-hidden font-sans border-[#EBE4D8] rounded-2xl max-h-[min(90vh,700px)] flex flex-col shadow-2xl bg-[#FAF8F5]"
        >
          {/* Header - Fixed & Compact */}
          <div className="shrink-0 bg-white border-b border-[#EBE4D8] pl-5 sm:pl-6 pr-14 sm:pr-16 py-4 select-none">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#A31D24] min-w-0">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  CHI TIẾT CỘT MỐC GIAI ĐOẠN #{milestone.orderNo || milestone.id}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 mr-2 sm:mr-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${escrowStatus.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full mr-1.5 shrink-0 ${escrowStatus.dotColor}`} />
                  <span className="whitespace-nowrap">{escrowStatus.label}</span>
                </span>
              </div>
            </div>

            <div className="mt-1.5">
              <DialogTitle className="text-lg sm:text-xl font-bold font-sans text-[#1C1615] tracking-tight leading-snug">
                {milestone.title || `Giai đoạn ${milestone.orderNo}`}
              </DialogTitle>
            </div>

            <DialogDescription className="text-xs text-stone-500 mt-0.5 truncate font-sans">
              Hợp đồng{' '}
              <strong className="text-[#1C1615] font-mono font-semibold">
                {contractCode || `HD${String(milestone.contractId).padStart(5, '0')}`}
              </strong>
              {contractTitle && ` — ${contractTitle}`}
            </DialogDescription>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 font-sans">
            {/* 1. 3 Financial Cards (Gross, Fee, Net) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl p-3 bg-white border border-[#EBE4D8] shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block truncate">
                  Giá trị mốc (Khách trả)
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-[#1C1615] block leading-tight">
                  {formatVNDOrFallback(milestone.amount)}
                </span>
                <span className="text-[10.5px] text-stone-400 block truncate">
                  Khách đặt nội dung ký quỹ
                </span>
              </div>

              <div className="rounded-xl p-3 bg-white border border-[#EBE4D8] shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] block truncate">
                  Phí nền tảng ({milestone.feePercent || 5}%)
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-[#1C1615] block leading-tight">
                  {formatVND(feeAmount)}
                </span>
                <span className="text-[10.5px] text-stone-400 block truncate">
                  Khấu trừ khi giải ngân
                </span>
              </div>

              <div className="rounded-xl p-3 bg-white border border-[#EBE4D8] shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] block truncate">
                  Creator thực nhận (95%)
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-[#16A34A] block leading-tight">
                  {formatVND(netAmount)}
                </span>
                <span className="text-[10.5px] text-stone-400 block truncate">
                  {splitRefund > 0
                    ? `Hoàn Khách hàng: ${formatVND(splitRefund)}`
                    : 'Cộng vào ví Nhà sáng tạo'}
                </span>
              </div>
            </div>

            {/* 2. Requirement & Technical Specs */}
            <div className="rounded-xl border border-[#EBE4D8] p-3.5 bg-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#A31D24]" />
                  <span>Cam kết &amp; Yêu cầu bàn giao</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#1C1615] border border-[#EBE4D8]">
                  {workStatus.label}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] text-xs text-[#1C1615] leading-relaxed font-sans whitespace-pre-line">
                {milestone.requirement || 'Chưa cập nhật chi tiết yêu cầu bàn giao cho giai đoạn này.'}
              </div>

              {/* Spec Chips Row */}
              <div className="grid grid-cols-3 gap-2 pt-0.5 text-[11px]">
                <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-center">
                  <span className="text-stone-400 block text-[10px]">Thời gian thực hiện</span>
                  <span className="font-bold text-[#1C1615] tabular-nums">
                    {milestone.durationDays ? `${milestone.durationDays} ngày` : '3 ngày'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-center">
                  <span className="text-stone-400 block text-[10px]">Hạn mức chỉnh sửa</span>
                  <span className="font-bold text-[#1C1615] tabular-nums">
                    {milestone.revisionsUsed || 0} / {milestone.maxRevisions || 2} lần
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-center">
                  <span className="text-stone-400 block text-[10px]">Gia hạn mỗi lần sửa</span>
                  <span className="font-bold text-[#1C1615] tabular-nums">
                    +{milestone.revisionDays ? `${milestone.revisionDays} ngày` : '2 ngày'}
                  </span>
                </div>
              </div>

              {/* Latest Revision Request Note if present */}
              {revisionInfo.hasRevisions && revisionInfo.latestRevisionNote && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Yêu cầu chỉnh sửa từ Khách đặt nội dung:</span>
                  </div>
                  <p className="text-xs italic text-stone-800 bg-white/80 p-2 rounded-lg border border-amber-200/60 leading-relaxed break-words">
                    &ldquo;{revisionInfo.latestRevisionNote}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* 3. Deliverables & Outputs (With Live Preview + Download) */}
            <div className="rounded-xl border border-[#EBE4D8] p-3.5 bg-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-[#A31D24]" />
                  <span>Tệp sản phẩm Creator đã bàn giao ({deliverables.length})</span>
                </span>
              </div>

              {isLoadingDeliverables ? (
                <div className="flex items-center justify-center gap-2 py-5 text-xs text-stone-400">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#A31D24]" />
                  <span>Đang tải danh sách tệp sản phẩm bàn giao...</span>
                </div>
              ) : deliverables.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#EBE4D8] text-center text-xs text-stone-500">
                  Nhà sáng tạo chưa tải tệp sản phẩm bàn giao nào lên cho giai đoạn này.
                </div>
              ) : (
                <div className="space-y-2">
                  {deliverables.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] p-3 text-xs hover:border-[#D5CFC5] transition-colors space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="mt-0.5">{renderFileIcon(item.fileName)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-[#FDE9E9] text-[#A31D24] border border-rose-200/70">
                                Phiên bản v{item.versionNo || 1}
                              </span>
                              {idx === 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAFCF1] text-[#16A34A] border border-emerald-200/70">
                                  Bản mới nhất
                                </span>
                              )}
                              <span
                                className="font-bold text-[#1C1615] truncate block w-full mt-0.5"
                                title={item.title || item.fileName}
                              >
                                {item.title || item.fileName}
                              </span>
                            </div>
                            <span className="text-[10.5px] font-mono text-stone-500 block mt-0.5 truncate">
                              {item.fileName} • Nộp lúc {formatDateOrFallback(item.createdAt)}
                              {item.fileSize
                                ? ` • ${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPreviewItem(item)}
                            className="h-8 px-2.5 text-xs rounded-lg border-[#EBE4D8] bg-white hover:bg-rose-50 text-[#1C1615] inline-flex items-center gap-1.5 font-medium shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#A31D24]" />
                            <span>Xem / Nghe</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(item.id, item.fileName)}
                            className="h-8 px-2.5 text-xs rounded-lg border-[#EBE4D8] bg-white hover:bg-stone-50 text-stone-700 inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5 text-stone-500" />
                            <span>Tải về</span>
                          </Button>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-stone-600 bg-white px-2.5 py-2 rounded-lg border border-[#EBE4D8] leading-relaxed break-words">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Milestone Reviews if present */}
            {milestone.reviews && milestone.reviews.length > 0 && (
              <div className="rounded-xl border border-[#EBE4D8] p-3.5 bg-white shadow-2xs space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Đánh giá nghiệm thu từ Khách hàng ({milestone.reviews.length})</span>
                </span>
                <div className="space-y-1.5">
                  {milestone.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#1C1615]">{rev.reviewerFullName || 'Khách đặt nội dung'}</strong>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-stone-600 text-[11px] italic">&ldquo;{rev.comment}&rdquo;</p>
                      )}
                      <span className="text-[10px] text-stone-400 font-mono block">
                        {formatDateTime(rev.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Timestamps & Countdown Notice */}
            <div className="rounded-xl border border-[#EBE4D8] p-3.5 bg-white shadow-2xs space-y-2 text-xs">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Lộ trình &amp; Mốc thời gian
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-sans">
                <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                  <span className="text-stone-500 text-[11px]">Hạn nộp sản phẩm:</span>
                  <span className="font-semibold text-[#1C1615] tabular-nums">
                    {formatDateOrFallback(milestone.dueAt)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                  <span className="text-stone-500 text-[11px]">Hạn khách nghiệm thu:</span>
                  <span className="font-semibold text-[#1C1615] tabular-nums">
                    {formatDateOrFallback(milestone.reviewDueAt)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                  <span className="text-stone-500 text-[11px]">Thời điểm ký quỹ:</span>
                  <span className="font-semibold text-[#1C1615] tabular-nums">
                    {formatDateOrFallback(milestone.fundedAt || milestone.fundDueAt)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                  <span className="text-stone-500 text-[11px]">Thời điểm giải ngân:</span>
                  <span className="font-semibold text-[#16A34A] tabular-nums">
                    {formatDateOrFallback(milestone.releasedAt || milestone.releaseAt)}
                  </span>
                </div>
              </div>

              {autoRelease && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{autoRelease.message}</span>
                </div>
              )}
            </div>

            {/* 6. Escrow Protection Notice */}
            <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] p-3 flex items-center gap-2 text-[11px] text-stone-600 leading-relaxed">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#A31D24]" />
              <span>
                Khoản tiền của cột mốc này được giữ bảo chứng độc lập. Hệ thống chỉ giải ngân 95% cho Nhà sáng tạo sau khi Khách đặt nội dung duyệt nghiệm thu và qua thời gian giữ an toàn.
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 bg-white border-t border-[#EBE4D8] px-5 sm:px-6 py-3 flex items-center justify-between gap-2 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 px-4 rounded-xl border border-[#EBE4D8] text-xs font-semibold text-stone-700 hover:bg-stone-50"
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
                className="h-8 px-4 rounded-xl bg-[#A31D24] hover:bg-[#8F181E] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Xem hợp đồng liên quan</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Preview Modal (Audio / Video / PDF / Image) */}
      <DeliverableMediaModal
        deliverable={selectedPreviewItem}
        isOpen={Boolean(selectedPreviewItem)}
        onClose={() => setSelectedPreviewItem(null)}
      />
    </>
  );
};
