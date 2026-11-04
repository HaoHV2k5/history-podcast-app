import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Layers,
  Coins,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  FolderOpen,
  Eye,
  Download,
  ChevronDown,
  FileAudio,
  FileVideo,
  FileText,
  FileArchive,
  Star,
} from 'lucide-react';
import { MilestoneItem } from '@/types/contract';
import { MilestoneDeliverableItem } from '@/types/deliverable';
import { contractsApi } from '@/services/api/contracts';
import { deliverablesApi } from '@/services/api/deliverables';
import {
  calculateEscrowBreakdown,
  formatMilestoneWorkStatus,
  formatMilestoneEscrowStatus,
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
  isMilestoneOverdue,
  getMilestoneRevisionInfo,
} from './milestoneFinanceLogic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND, formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { DeliverableMediaModal } from '@/features/creator/components/DeliverableMediaModal';
import { AdminMilestoneDetailModal } from '@/features/escrow/components/AdminMilestoneDetailModal';

interface ContractMilestoneTimelineProps {
  contractId: number;
  initialMilestones?: MilestoneItem[];
  contractTitle?: string;
  contractCode?: string;
  className?: string;
}

export const ContractMilestoneTimeline: React.FC<ContractMilestoneTimelineProps> = ({
  contractId,
  initialMilestones,
  contractTitle,
  contractCode,
  className = '',
}) => {
  // Default: all milestones start collapsed so the modal is compact & scannable.
  // Admin can click any specific milestone header to expand it or click "Mở rộng tất cả".
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());
  const [selectedMilestoneModal, setSelectedMilestoneModal] = useState<MilestoneItem | null>(null);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MilestoneDeliverableItem | null>(
    null
  );

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
    (response?.data && response.data.length > 0 ? response.data : initialMilestones) || [];

  const breakdown = calculateEscrowBreakdown(milestones);

  const isForbidden = (error as { response?: { status?: number } })?.response?.status === 403;

  const toggleMilestoneCollapse = (id: number) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDownloadDeliverable = async (deliverableId: number, fileName: string) => {
    try {
      await deliverablesApi.downloadDeliverableFile(deliverableId, fileName);
    } catch {
      window.open(deliverablesApi.getDownloadUrl(deliverableId), '_blank');
    }
  };

  const renderFileIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'webm') {
      return <FileVideo className="h-4 w-4 text-rose-500 shrink-0" />;
    }
    if (ext === 'mp3' || ext === 'wav' || ext === 'm4a' || ext === 'ogg') {
      return <FileAudio className="h-4 w-4 text-amber-500 shrink-0" />;
    }
    if (ext === 'zip' || ext === 'rar') {
      return <FileArchive className="h-4 w-4 text-indigo-500 shrink-0" />;
    }
    return <FileText className="h-4 w-4 text-emerald-600 shrink-0" />;
  };

  if (isLoading && milestones.length === 0) {
    return (
      <div className={`space-y-3 py-6 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-xs text-stone-500 py-6 font-sans">
          <RefreshCw className="h-4 w-4 animate-spin text-[#A31D24]" />
          <span>Đang tải lộ trình bàn giao &amp; dữ liệu ký quỹ...</span>
        </div>
      </div>
    );
  }

  if (isError && milestones.length === 0) {
    return (
      <div
        className={`rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 space-y-2.5 font-sans ${className}`}
      >
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
      <div
        className={`rounded-xl border border-dashed border-[#EBE4D8] bg-white p-6 text-center space-y-1.5 font-sans ${className}`}
      >
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE9E9] text-[#A31D24]">
          <Layers className="h-4 w-4" />
        </div>
        <h4 className="text-xs font-semibold text-[#1C1615]">Chưa có cột mốc bàn giao</h4>
        <p className="text-[11px] text-stone-500 max-w-sm mx-auto leading-relaxed">
          Hợp đồng #{contractId} chưa được thiết lập các giai đoạn nghiệm thu hoặc chưa phát sinh dữ
          liệu cột mốc.
        </p>
      </div>
    );
  }

  const currentStageMilestone =
    milestones.find(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED' || m.status === 'UNFUNDED'
    ) || milestones.find((m) => m.status === 'WAITING');

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* 4 Financial Escrow KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-[#EBE4D8] bg-white p-3 space-y-0.5 shadow-2xs">
          <div className="flex items-center justify-between text-[10.5px] font-medium text-stone-500">
            <span>Tổng giá trị mốc</span>
            <Coins className="h-3.5 w-3.5 text-[#A31D24]" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#1C1615]">
            {formatVND(breakdown.totalGross)}
          </div>
          <div className="text-[10px] text-stone-400 tabular-nums">
            {breakdown.totalMilestones} giai đoạn bàn giao
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 space-y-0.5 shadow-2xs">
          <div className="flex items-center justify-between text-[10.5px] font-medium text-amber-800">
            <span>Đang giữ ký quỹ</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#1C1615]">
            {formatVND(breakdown.currentlyHeld + breakdown.currentlyFrozen)}
          </div>
          <div className="text-[10px] text-amber-700">
            {breakdown.currentlyFrozen > 0
              ? `Đóng băng: ${formatVND(breakdown.currentlyFrozen)}`
              : 'Khóa an toàn (HELD)'}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 space-y-0.5 shadow-2xs">
          <div className="flex items-center justify-between text-[10.5px] font-medium text-emerald-800">
            <span>Đã giải ngân Creator</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#16A34A]">
            {formatVND(breakdown.totalReleasedNet)}
          </div>
          <div className="text-[10px] text-stone-500 tabular-nums">
            Phí sàn: {formatVND(breakdown.totalPlatformFee)}
          </div>
        </div>

        <div className="rounded-xl border border-[#EBE4D8] bg-white p-3 space-y-0.5 shadow-2xs">
          <div className="flex items-center justify-between text-[10.5px] font-medium text-stone-500">
            <span>Chưa nạp / Hoàn trả</span>
            <FileCheck2 className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-[#1C1615]">
            {formatVND(breakdown.unfundedAmount + breakdown.totalRefunded)}
          </div>
          <div className="text-[10px] text-stone-400 tabular-nums">
            {breakdown.totalRefunded > 0
              ? `Hoàn Khách hàng: ${formatVND(breakdown.totalRefunded)}`
              : 'Chưa ký quỹ'}
          </div>
        </div>
      </div>

      {/* Milestone List Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-[#1C1615] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#A31D24] shrink-0" />
              <span>Lộ trình bàn giao &amp; Sản phẩm ({milestones.length} mốc)</span>
            </h4>
            {currentStageMilestone && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDE9E9] text-[#A31D24] border border-rose-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A31D24]" />
                <span>
                  Đang ở Mốc #{currentStageMilestone.orderNo}/{milestones.length}:{' '}
                  {currentStageMilestone.title}
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (expandedMilestones.size < milestones.length) {
                setExpandedMilestones(new Set(milestones.map((m) => m.id)));
              } else {
                setExpandedMilestones(new Set());
              }
            }}
            className="text-xs font-semibold text-[#A31D24] hover:underline cursor-pointer"
          >
            {expandedMilestones.size < milestones.length ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
          </button>
        </div>

        {/* Milestone Cards (Synchronized with CreatorContractDetailDrawer) */}
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const workStatus = formatMilestoneWorkStatus(milestone.status);
            const escrowStatus = formatMilestoneEscrowStatus(milestone.escrowStatus);
            const isCollapsed = !expandedMilestones.has(milestone.id);
            const isCurrentStage = currentStageMilestone?.id === milestone.id;
            const isDoneStage = milestone.status === 'APPROVED' || milestone.status === 'RELEASED';
            const overdue = isMilestoneOverdue(milestone);
            const revisionInfo = getMilestoneRevisionInfo(milestone);
            const autoRelease = getAutoReleaseIndicator(milestone);
            const splitRefund = getMilestoneSplitRefund(milestone);
            const deliverables: MilestoneDeliverableItem[] =
              (milestone.deliverables as MilestoneDeliverableItem[]) || [];

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

            return (
              <div
                key={milestone.id}
                className={cn(
                  'rounded-2xl border bg-white shadow-2xs overflow-hidden transition-all',
                  milestone.escrowStatus === 'FROZEN' || overdue
                    ? 'border-rose-300'
                    : isCurrentStage
                    ? 'border-[#A31D24]/40 ring-1 ring-[#A31D24]/10'
                    : 'border-[#EBE4D8] hover:border-[#D5CFC5]'
                )}
              >
                {/* Milestone Header Bar */}
                <div
                  onClick={() => toggleMilestoneCollapse(milestone.id)}
                  className="px-4 py-3.5 bg-white hover:bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 tabular-nums',
                        isCurrentStage
                          ? 'bg-[#A31D24] text-white shadow-2xs'
                          : isDoneStage
                          ? 'bg-[#EAFCF1] text-[#16A34A]'
                          : 'bg-[#FDE9E9] text-[#A31D24]'
                      )}
                    >
                      #{milestone.orderNo || 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-bold text-[#1C1615] truncate">
                          {milestone.title || `Giai đoạn #${milestone.orderNo}`}
                        </h5>
                        {isCurrentStage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE9E9] text-[#A31D24] border border-rose-200/70 shrink-0 whitespace-nowrap">
                            Đang ở mốc này
                          </span>
                        )}
                        {deliverables.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                            <FileCheck2 className="h-3 w-3" />
                            {deliverables.length} tệp bàn giao
                          </span>
                        )}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3" />
                            Quá hạn
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                        <span className="font-mono font-bold text-[#1C1615] tabular-nums">
                          {formatVND(grossAmount)}
                        </span>
                        <span>•</span>
                        <span className="text-[#16A34A] font-medium font-mono tabular-nums">
                          Creator thực nhận: {formatVND(netAmount)}
                        </span>
                        {splitRefund > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-medium font-mono tabular-nums">
                              Hoàn Khách hàng: {formatVND(splitRefund)}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{milestone.durationDays || 3} ngày</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges + Expand Toggle */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Badge
                      variant={workStatus.variant}
                      className="text-[11px] px-2.5 py-0.5 font-sans font-semibold whitespace-nowrap"
                    >
                      {milestone.status === 'UNFUNDED' ? 'Chờ khách ký quỹ' : workStatus.label}
                    </Badge>
                    <Badge
                      variant={escrowStatus.variant}
                      className="text-[11px] px-2.5 py-0.5 font-sans font-medium whitespace-nowrap"
                    >
                      Ký quỹ: {escrowStatus.label}
                    </Badge>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMilestoneCollapse(milestone.id);
                      }}
                      aria-label={
                        isCollapsed
                          ? `Mở rộng mốc #${milestone.orderNo}`
                          : `Thu gọn mốc #${milestone.orderNo}`
                      }
                      className="h-8 w-8 rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] text-stone-500 hover:text-[#1C1615] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200 ease-out text-stone-600',
                          isCollapsed && '-rotate-90'
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Milestone Details */}
                {!isCollapsed && (
                  <div className="p-4 border-t border-[#EBE4D8] space-y-3.5 bg-[#FAF8F5]/60">
                    {/* 4-Column Metric Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EBE4D8] rounded-xl border border-[#EBE4D8] bg-white">
                      <div className="p-3 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                          Giá trị mốc (Khách trả)
                        </span>
                        <strong className="text-sm font-bold font-mono text-[#1C1615] tabular-nums block whitespace-nowrap">
                          {formatVND(grossAmount)}
                        </strong>
                      </div>

                      <div className="p-3 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                          Creator thực nhận ({100 - feePercent}%)
                        </span>
                        <strong className="text-sm font-bold font-mono text-[#16A34A] tabular-nums block whitespace-nowrap">
                          {formatVND(netAmount)}
                        </strong>
                        {splitRefund > 0 && (
                          <span className="text-[10px] text-amber-700 font-mono block tabular-nums">
                            Hoàn Khách: {formatVND(splitRefund)}
                          </span>
                        )}
                      </div>

                      <div className="p-3 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                          Thời gian thực hiện
                        </span>
                        <strong className="text-sm font-bold text-[#1C1615] block whitespace-nowrap">
                          {milestone.durationDays || 3} ngày (Phí sàn: {formatVND(platformFee)})
                        </strong>
                      </div>

                      <div className="p-3 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                          Hạn mức chỉnh sửa
                        </span>
                        <strong className="text-sm font-bold text-[#1C1615] block whitespace-nowrap">
                          {milestone.revisionsUsed || 0}/{milestone.maxRevisions || 2} lần (+
                          {milestone.revisionDays || 2} ngày)
                        </strong>
                      </div>
                    </div>

                    {/* Cam kết bàn giao */}
                    <div className="rounded-xl border border-[#EBE4D8] bg-white px-3.5 py-2.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Cam kết bàn giao giai đoạn #{milestone.orderNo}
                      </span>
                      <p className="text-xs sm:text-[13px] text-[#1C1615] leading-relaxed break-words whitespace-pre-line">
                        {milestone.requirement || 'Chưa cập nhật chi tiết yêu cầu bàn giao.'}
                      </p>
                    </div>

                    {/* Revision Request Banner */}
                    {revisionInfo.hasRevisions && revisionInfo.latestRevisionNote && (
                      <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3 space-y-1.5 text-xs text-amber-900">
                        <div className="flex items-center justify-between font-bold text-amber-800 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            Yêu cầu chỉnh sửa từ Khách đặt nội dung:
                          </span>
                          <span className="text-[10px] text-amber-700/80">
                            Tự động gia hạn +{revisionInfo.revisionDays} ngày
                          </span>
                        </div>
                        <p className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 text-xs italic text-stone-800 break-words leading-relaxed">
                          &ldquo;{revisionInfo.latestRevisionNote}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Auto Release Banner */}
                    {autoRelease && (
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{autoRelease.message}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Hạn giải ngân: {autoRelease.formattedReleaseAt}
                        </span>
                      </div>
                    )}

                    {/* Inline Deliverables List (Direct Preview & Download) */}
                    <div className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                          <FolderOpen className="h-3.5 w-3.5 text-[#A31D24]" />
                          <span>
                            Tệp sản phẩm Nhà sáng tạo đã nộp ({deliverables.length})
                          </span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMilestoneModal(milestone)}
                          className="h-7 px-2.5 text-[11px] rounded-lg border-[#EBE4D8] bg-[#FAF8F5] text-[#A31D24] hover:bg-rose-50 font-semibold inline-flex items-center gap-1"
                        >
                          <FolderOpen className="h-3 w-3" />
                          <span>Mở cửa sổ đối soát mốc #{milestone.orderNo}</span>
                        </Button>
                      </div>

                      {deliverables.length === 0 ? (
                        <div className="rounded-lg bg-[#FAF8F5] border border-dashed border-[#EBE4D8] px-3 py-2.5 flex items-center justify-between gap-2 text-xs text-stone-500">
                          <span>Chưa có tệp bàn giao nào được ghi nhận ở giai đoạn này.</span>
                          <button
                            type="button"
                            onClick={() => setSelectedMilestoneModal(milestone)}
                            className="text-[11px] font-semibold text-[#A31D24] hover:underline shrink-0 cursor-pointer"
                          >
                            Kiểm tra trực tiếp &rarr;
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {deliverables.map((item, idx) => (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] hover:border-[#D5CFC5] transition-colors text-xs"
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div className="mt-0.5">{renderFileIcon(item.fileName)}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#FDE9E9] text-[#A31D24] border border-rose-200/70">
                                      Phiên bản v{item.versionNo || 1}
                                    </span>
                                    {idx === 0 && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EAFCF1] text-[#16A34A] border border-emerald-200/70">
                                        Bản mới nhất
                                      </span>
                                    )}
                                    <span
                                      className="font-bold text-[#1C1615] truncate"
                                      title={item.title || item.fileName}
                                    >
                                      {item.title || item.fileName}
                                    </span>
                                  </div>
                                  <div className="text-[10.5px] font-mono text-stone-500 mt-0.5 truncate">
                                    {item.fileName}
                                    {item.fileSize
                                      ? ` • ${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                      : ''}
                                    {item.createdAt ? ` • Nộp: ${formatDateTime(item.createdAt)}` : ''}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPreviewItem(item)}
                                  className="h-8 px-2.5 text-xs rounded-lg border-[#EBE4D8] bg-white text-[#1C1615] hover:bg-rose-50 inline-flex items-center gap-1.5 font-medium shadow-2xs"
                                >
                                  <Eye className="h-3.5 w-3.5 text-[#A31D24]" />
                                  <span>Xem / Nghe</span>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadDeliverable(item.id, item.fileName)}
                                  className="h-8 px-2.5 text-xs rounded-lg border-[#EBE4D8] bg-white text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <Download className="h-3.5 w-3.5 text-stone-500" />
                                  <span>Tải về</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Milestone Reviews List */}
                    {milestone.reviews && milestone.reviews.length > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          Đánh giá nghiệm thu từ Khách đặt nội dung ({milestone.reviews.length})
                        </span>
                        <div className="space-y-1.5">
                          {milestone.reviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-2.5 rounded-lg bg-white border border-[#EBE4D8] text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-[#1C1615] truncate">
                                  {rev.reviewerFullName || 'Khách đặt nội dung'}
                                </strong>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={cn(
                                        'h-3 w-3',
                                        s <= rev.rating
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-stone-300'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              {rev.comment && (
                                <p className="text-stone-600 text-[11px] italic bg-[#FAF8F5] p-2 rounded border border-[#EBE4D8] break-words leading-relaxed">
                                  &ldquo;{rev.comment}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamps Footer Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EBE4D8] text-[11px] text-stone-500">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-stone-400" />
                          Ký quỹ:{' '}
                          <strong className="text-[#1C1615] tabular-nums">
                            {milestone.fundedAt
                              ? formatDateTime(milestone.fundedAt)
                              : milestone.escrowStatus === 'HELD'
                              ? 'Đang giữ ký quỹ'
                              : 'Chưa ký quỹ'}
                          </strong>
                        </span>
                        {milestone.dueAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            Hạn nộp:{' '}
                            <strong className="text-[#1C1615] tabular-nums">
                              {formatDateTime(milestone.dueAt)}
                            </strong>
                          </span>
                        )}
                        {milestone.reviewDueAt && milestone.status === 'SUBMITTED' && (
                          <span className="flex items-center gap-1 text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            Hạn khách duyệt: {formatDateTime(milestone.reviewDueAt)}
                          </span>
                        )}
                      </div>

                      {milestone.releasedAt ? (
                        <span className="flex items-center gap-1 text-[#16A34A] font-medium tabular-nums">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Đã giải ngân: {formatDateTime(milestone.releasedAt)}
                        </span>
                      ) : milestone.refundedAt ? (
                        <span className="flex items-center gap-1 text-amber-700 font-medium tabular-nums">
                          Đã hoàn trả: {formatDateTime(milestone.refundedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Detail Modal */}
      <AdminMilestoneDetailModal
        milestone={selectedMilestoneModal}
        contractCode={contractCode}
        contractTitle={contractTitle}
        onClose={() => setSelectedMilestoneModal(null)}
      />

      {/* Deliverable Media Preview Modal (Audio / Video / PDF / Image) */}
      <DeliverableMediaModal
        deliverable={selectedPreviewItem}
        isOpen={Boolean(selectedPreviewItem)}
        onClose={() => setSelectedPreviewItem(null)}
      />
    </div>
  );
};
