import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Gavel,
  Info,
  Layers,
  Lock,
  Scale,
  ShieldAlert,
  User,
} from 'lucide-react';
import { DisputeItem, DisputeResult, ResolveDisputePayload } from '@/types/dispute';
import { ContractItem, MilestoneItem } from '@/types/contract';
import { disputesApi } from '@/services/api/disputes';
import { contractsApi } from '@/services/api/contracts';
import {
  isDisputeEligibleForResolution,
  validateResolutionForm,
  calculateSplitEstimate,
  formatDisputeResult,
  formatDisputeStatus,
  checkSplitFeeDiscrepancy,
} from './disputeResolutionLogic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatVND } from '@/utils/formatters';
import { DisputeConfirmationModal } from './DisputeConfirmationModal';

import { AdminDisputeRow } from './disputesLogic';

function toDisputeItem(d: DisputeItem | AdminDisputeRow): DisputeItem {
  if ('disputeType' in d) {
    const row = d as AdminDisputeRow;
    return {
      id: row.rawId,
      contractId: row.contractId,
      contractTitle: row.workTitle,
      milestoneId: row.milestoneId,
      milestoneTitle: row.milestoneTitle,
      raisedByUserId: row.senderId,
      raisedByUserFullName: row.senderName,
      reason: row.reason,
      evidence: row.evidence,
      counterEvidence: row.counterEvidence,
      status: row.status,
      result: row.result as any,
      splitPercent: row.splitPercent,
      resolvedAt: row.resolvedAt,
      resolvedByUserFullName: row.resolvedByUserFullName,
      resolution: row.resolution,
      createdAt: row.createdAt,
    };
  }
  return d;
}

interface AdminDisputeDetailModalProps {
  dispute: DisputeItem | AdminDisputeRow | null;
  onClose: () => void;
}

export const AdminDisputeDetailModal: React.FC<AdminDisputeDetailModalProps> = ({
  dispute,
  onClose,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // GSAP animation refs
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const contextBoxRef = useRef<HTMLDivElement>(null);
  const reasonEvidenceRef = useRef<HTMLDivElement>(null);
  const resolutionBoxRef = useRef<HTMLDivElement>(null);

  const numericId = dispute
    ? typeof dispute.id === 'number'
      ? dispute.id
      : 'rawId' in dispute
      ? Number(dispute.rawId)
      : parseInt(String(dispute.id).replace(/\D/g, ''), 10)
    : 0;

  // Form states
  const [selectedResult, setSelectedResult] = useState<DisputeResult>('RELEASE_TO_CREATOR');
  const [splitPercentInput, setSplitPercentInput] = useState<string>('50');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 1. Fetch fresh dispute detail from Backend API
  const { data: freshDisputeData } = useQuery({
    queryKey: ['admin-dispute-detail', numericId],
    queryFn: () => disputesApi.getDisputeById(numericId),
    enabled: Boolean(numericId > 0),
    retry: false,
  });

  const activeDispute: DisputeItem = freshDisputeData?.data || (dispute ? toDisputeItem(dispute) : (null as any));

  // 2. Fetch associated contract details for full financial and party context
  const { data: contractData } = useQuery({
    queryKey: ['admin-contract-detail', activeDispute?.contractId],
    queryFn: () => contractsApi.getContractById(activeDispute!.contractId),
    enabled: Boolean(activeDispute?.contractId),
  });

  const contract: ContractItem | null = contractData?.data || null;
  const milestone: MilestoneItem | undefined = contract?.milestones?.find(
    (m) => m.id === activeDispute?.milestoneId
  );

  const eligibility = isDisputeEligibleForResolution(activeDispute, milestone);
  const normalizedStatus = (activeDispute?.status || '').toUpperCase();
  const isResolved = normalizedStatus === 'RESOLVED' || normalizedStatus === 'ĐÃ GIẢI QUYẾT' || normalizedStatus === 'ĐÃ PHÂN XỬ';
  const isCancelled = normalizedStatus === 'CANCELLED' || normalizedStatus === 'ĐÃ HỦY' || normalizedStatus === 'DA HUY';

  // GSAP Entrance Micro-Animation
  useEffect(() => {
    if (!dispute) return;
    const ctx = gsap.context(() => {
      const items = [contextBoxRef.current, reasonEvidenceRef.current, resolutionBoxRef.current].filter(Boolean);
      gsap.fromTo(
        items,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    }, modalContainerRef);

    return () => ctx.revert();
  }, [dispute, isResolved, isCancelled]);

  // Real party names and IDs directly from contract or dispute sender (Zero Fake Data)
  const rawDisputeRow = dispute && 'rawId' in dispute ? (dispute as AdminDisputeRow) : null;

  const creatorDisplayName =
    contract?.creatorFullName ||
    (rawDisputeRow?.senderRole === 'Creator' ? rawDisputeRow.senderName : null) ||
    'Chưa có thông tin';

  const creatorDisplayId =
    contract?.creatorId ||
    (rawDisputeRow?.senderRole === 'Creator' ? rawDisputeRow.senderId : null) ||
    null;

  const requesterDisplayName =
    contract?.requesterFullName ||
    (rawDisputeRow?.senderRole === 'Người dùng' ? rawDisputeRow.senderName : null) ||
    'Chưa có thông tin';

  const requesterDisplayId =
    contract?.requesterId ||
    (rawDisputeRow?.senderRole === 'Người dùng' ? rawDisputeRow.senderId : null) ||
    null;

  // 3. Resolve Mutation with rollback & cache invalidation
  const resolveMutation = useMutation({
    mutationFn: (payload: ResolveDisputePayload) =>
      disputesApi.resolveDispute(numericId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', numericId] });
      queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-escrow'] });

      setShowConfirmModal(false);
      setSuccessNotice(
        `Đã phân xử khiếu nại thành công! Kết quả: ${response.data.result || selectedResult}`
      );
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      setShowConfirmModal(false);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi phân xử tranh chấp. Vui lòng kiểm tra lại.';
      setMutationErrorMessage(msg);
    },
  });

  if (!dispute || !activeDispute) return null;

  const milestoneGross = milestone?.amount || 0;
  const platformFeeRate =
    contract?.platformFeePercent != null
      ? contract.platformFeePercent
      : milestone?.feePercent != null
      ? milestone.feePercent
      : null;

  const feeDiscrepancy = checkSplitFeeDiscrepancy(platformFeeRate);
  const isSplitBlocked = feeDiscrepancy.isUnsafeForSettlement;

  const splitEstimate = calculateSplitEstimate(
    milestoneGross,
    Number(splitPercentInput) || 0,
    platformFeeRate
  );

  const handleOpenConfirm = () => {
    const validation = validateResolutionForm({
      result: selectedResult,
      splitPercent: splitPercentInput,
      resolution: resolutionNote,
      isSplitBlockedDueToDiscrepancy: isSplitBlocked,
      contractFeePercent: platformFeeRate,
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setMutationErrorMessage(null);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    if (resolveMutation.isPending) return; // Prevent duplicate clicks/submissions
    const payload: ResolveDisputePayload = {
      result: selectedResult,
      resolution: resolutionNote.trim(),
      splitPercent:
        selectedResult === 'SPLIT' ? Number(splitPercentInput) : undefined,
    };
    resolveMutation.mutate(payload);
  };

  const statusInfo = formatDisputeStatus(activeDispute.status);

  return (
    <>
      <Dialog open={Boolean(dispute)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          maxWidth="max-w-[760px]"
          className="p-4 sm:p-5 gap-2.5 max-h-[94vh] flex flex-col justify-between overflow-hidden font-sans border-[#F0EBE6] bg-white rounded-2xl shadow-apple-dialog"
        >
          {/* Header */}
          <DialogHeader className="space-y-0.5 pb-1">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-7">
              <DialogTitle className="text-base sm:text-[17px] font-bold text-stone-900 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-accent shrink-0">
                  <Gavel className="h-4 w-4" />
                </span>
                <span>Chi tiết Khiếu nại #{activeDispute.id}</span>
                {activeDispute.milestoneTitle && (
                  <span className="text-xs font-normal text-stone-500 truncate max-w-[260px]">
                    — {activeDispute.milestoneTitle}
                  </span>
                )}
              </DialogTitle>
              <Badge variant={statusInfo.variant} size="sm" className="shrink-0 text-xs py-0.5 px-2.5">
                {statusInfo.label}
              </Badge>
            </div>
            <DialogDescription className="text-[11px] text-stone-500">
              Hợp đồng ID #{activeDispute.contractId} • Thời điểm tạo:{' '}
              {formatDateTime(activeDispute.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {/* Success Banner */}
          {successNotice && (
            <div className="flex items-center gap-2 rounded-lg border border-status-success-text/30 bg-status-success-bg p-2 text-xs text-status-success-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Mutation Error Banner */}
          {mutationErrorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-status-error-text/30 bg-status-error-bg p-2 text-xs text-status-error-text">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mutationErrorMessage}</span>
            </div>
          )}

          {/* Main Modal Body - Compact, No Vertical Scroll on Desktop */}
          <div ref={modalContainerRef} className="space-y-2.5 text-xs">
            {/* 1. Context Box: Parties & Milestone Financials */}
            <div
              ref={contextBoxRef}
              className="rounded-xl border border-[#F0EBE6] bg-[#FAF8F5] p-2.5 sm:p-3 space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Creator */}
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-lg bg-red-50 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">
                      Nhà sáng tạo
                    </span>
                    <span className="font-semibold text-stone-800 text-xs truncate block" title={creatorDisplayName}>
                      {creatorDisplayName}
                    </span>
                    <span className="text-[10px] text-stone-500 block font-mono">
                      {contract?.channelName
                        ? `Kênh: ${contract.channelName}`
                        : creatorDisplayId
                        ? `ID: #${creatorDisplayId}`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Requester / Customer */}
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">
                      Khách đặt nội dung
                    </span>
                    <span className="font-semibold text-stone-800 text-xs truncate block" title={requesterDisplayName}>
                      {requesterDisplayName}
                    </span>
                    <span className="text-[10px] text-stone-500 block font-mono">
                      {requesterDisplayId ? `ID: #${requesterDisplayId}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Raised By */}
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">
                      Bên khởi tạo khiếu nại
                    </span>
                    <span className="font-semibold text-red-800 text-xs truncate block">
                      {activeDispute.raisedByUserFullName || (rawDisputeRow ? rawDisputeRow.senderName : `Người dùng #${activeDispute.raisedByUserId}`)}
                    </span>
                    <span className="text-[10px] text-stone-500 block font-mono">
                      ID: #{activeDispute.raisedByUserId || (rawDisputeRow ? rawDisputeRow.senderId : '—')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Consolidated Bottom Row: Milestone Info + Quick Links */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE3DC] text-[11px]">
                <div className="flex items-center gap-2 text-stone-600 truncate font-mono">
                  <Layers className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">
                    Hợp đồng #{activeDispute.contractId}
                    {milestone ? (
                      <>
                        {' • '}Mốc #{milestone.orderNo}: <strong className="text-stone-800 font-sans">{milestone.title}</strong>{' '}
                        ({formatVND(milestone.amount)})
                        <span className="inline-flex items-center gap-1 font-sans ml-1 text-status-error-text font-semibold">
                          <Lock className="h-3 w-3" />
                          <span>Đã đóng băng</span>
                        </span>
                      </>
                    ) : activeDispute.milestoneId ? (
                      <> • Cột mốc ID #{activeDispute.milestoneId}</>
                    ) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-lg bg-white border border-[#E7E5E4] text-stone-700 hover:text-accent hover:border-accent/40 shadow-2xs transition-colors cursor-pointer"
                    onClick={() => {
                      onClose();
                      navigate(`/admin/contracts?search=${activeDispute.contractId}`);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 text-accent" />
                    <span>Xem Hợp đồng</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-lg bg-white border border-[#E7E5E4] text-stone-700 hover:text-accent hover:border-accent/40 shadow-2xs transition-colors cursor-pointer"
                    onClick={() => {
                      onClose();
                      navigate(`/admin/escrow?search=${activeDispute.contractId}`);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 text-accent" />
                    <span>Xem Ký quỹ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Compact 2-Column: Lý do & Bằng chứng */}
            <div ref={reasonEvidenceRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Lý do khiếu nại */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                  Lý do khiếu nại:
                </span>
                <div className="rounded-lg border border-stone-200/90 bg-stone-50/80 p-2 text-stone-800 text-[11px] leading-relaxed min-h-[46px] max-h-[60px] overflow-y-auto">
                  {activeDispute.reason || 'Chưa có thông tin lý do chi tiết.'}
                </div>
              </div>

              {/* Bằng chứng bên khiếu nại */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                  Bằng chứng bên khiếu nại:
                </span>
                <div className="rounded-lg border border-stone-200/90 bg-white p-2 text-stone-800 text-[11px] leading-relaxed min-h-[46px] max-h-[75px] overflow-y-auto space-y-1.5">
                  {activeDispute.evidence ? (
                    <div>
                      {activeDispute.evidence.startsWith('http') ? (
                        <a
                          href={activeDispute.evidence}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline flex items-center gap-1.5 font-medium truncate"
                        >
                          <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="truncate">Xem tài liệu / tệp đính kèm bằng chứng</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="truncate">{activeDispute.evidence}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-stone-400 italic">Không có tệp bằng chứng đính kèm</span>
                  )}
                  {activeDispute.evidenceUrls && activeDispute.evidenceUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-100">
                      {activeDispute.evidenceUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-stone-50 border border-stone-200 px-2 py-0.5 text-[11px] font-sans text-accent hover:underline"
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {url.split('/').pop() || `Tệp bằng chứng #${idx + 1}`}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bằng chứng phản hồi từ bên bị khiếu nại (nếu có) */}
              {activeDispute.counterEvidence && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1">
                    Bằng chứng phản hồi từ bên bị khiếu nại:
                  </span>
                  <div className="rounded-lg border border-amber-200/90 bg-amber-50/40 p-2 text-stone-800 text-[11px] leading-relaxed min-h-[46px] max-h-[75px] overflow-y-auto space-y-1.5">
                    <div>{activeDispute.counterEvidence}</div>
                    {activeDispute.counterEvidenceUrls && activeDispute.counterEvidenceUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-200/50">
                        {activeDispute.counterEvidenceUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-amber-200 px-2 py-0.5 text-[11px] font-sans text-amber-700 hover:underline"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {url.split('/').pop() || `Tệp đối chất #${idx + 1}`}
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: CANCELLED VIEW */}
            {isCancelled && (
              <div
                ref={resolutionBoxRef}
                className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-stone-500" />
                    <span className="font-bold text-xs uppercase text-stone-700">
                      Trạng thái: Khiếu nại đã hủy
                    </span>
                  </div>
                  <Badge variant="outline" className="text-stone-600 bg-white text-[11px]">
                    Đã hủy
                  </Badge>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Khiếu nại này đã được hủy bỏ hoặc kết thúc. Không cần thực hiện phân xử thêm.
                </p>
              </div>
            )}

            {/* SECTION: RESOLVED READ-ONLY VIEW */}
            {isResolved && (
              <div
                ref={resolutionBoxRef}
                className="rounded-xl border border-status-success-text/30 bg-status-success-bg/25 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-status-success-text" />
                    <span className="font-bold text-xs uppercase text-status-success-text">
                      Kết quả phân xử của Ban Quản trị
                    </span>
                  </div>
                  {activeDispute.result && (
                    <Badge
                      variant={
                        formatDisputeResult(activeDispute.result).variant as
                          | 'success'
                          | 'pending'
                          | 'accent'
                          | 'default'
                          | 'outline'
                      }
                      size="sm"
                    >
                      {formatDisputeResult(activeDispute.result).label}
                    </Badge>
                  )}
                </div>

                {activeDispute.result === 'SPLIT' && activeDispute.splitPercent != null && (
                  <div className="font-mono text-xs text-ink bg-surface/70 p-2 rounded border border-status-success-text/20">
                    Tỷ lệ phân chia: <strong>Thuyết minh viên {activeDispute.splitPercent}%</strong> —{' '}
                    <strong>Nhà sáng tạo {100 - activeDispute.splitPercent}%</strong>
                  </div>
                )}

                {activeDispute.resolution && (
                  <div>
                    <span className="text-[10px] text-muted block mb-0.5 font-semibold uppercase">
                      Căn cứ kết luận của Admin:
                    </span>
                    <div className="rounded bg-surface p-2 text-ink leading-relaxed whitespace-pre-line border border-status-success-text/20 text-xs">
                      {activeDispute.resolution}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted pt-1.5 border-t border-status-success-text/20 font-mono">
                  <span>
                    Phân xử bởi: {activeDispute.resolvedByUserFullName || `Admin ID #${activeDispute.resolvedByUserId ?? '—'}`}
                  </span>
                  <span>
                    Thời điểm: {formatDateTime(activeDispute.resolvedAt)}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION: OPEN RESOLUTION FORM (ADMIN ONLY) */}
            {!isResolved && !isCancelled && eligibility.eligible && (
              <div
                ref={resolutionBoxRef}
                className="rounded-xl border border-red-100 bg-red-50/20 p-2.5 sm:p-3 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-accent" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    Thực hiện Phân xử Tranh chấp
                  </h4>
                </div>

                {/* 3 Resolution Options - Compact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Release to Creator */}
                  <label
                    onClick={() => setSelectedResult('RELEASE_TO_CREATOR')}
                    className={`cursor-pointer rounded-lg border p-2 flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${
                      selectedResult === 'RELEASE_TO_CREATOR' || selectedResult === 'RELEASE_TO_FREELANCER'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">Giải ngân cho Creator</span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="RELEASE_TO_CREATOR"
                          checked={selectedResult === 'RELEASE_TO_CREATOR' || selectedResult === 'RELEASE_TO_FREELANCER'}
                          onChange={() => setSelectedResult('RELEASE_TO_CREATOR')}
                          className="accent-[#991B1B]"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight line-clamp-2 mt-0.5">
                        Chuyển tiền bảo chứng (sau trừ phí sàn) vào ví Nhà sáng tạo.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 mt-1 block">
                      Giải ngân ví Nhà sáng tạo
                    </span>
                  </label>

                  {/* Option 2: Refund to Requester */}
                  <label
                    onClick={() => setSelectedResult('REFUND_TO_REQUESTER')}
                    className={`cursor-pointer rounded-lg border p-2 flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${
                      selectedResult === 'REFUND_TO_REQUESTER' || selectedResult === 'REFUND_TO_CREATOR'
                        ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">Hoàn tiền cho Khách</span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="REFUND_TO_REQUESTER"
                          checked={selectedResult === 'REFUND_TO_REQUESTER' || selectedResult === 'REFUND_TO_CREATOR'}
                          onChange={() => setSelectedResult('REFUND_TO_REQUESTER')}
                          className="accent-[#991B1B]"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight line-clamp-2 mt-0.5">
                        Hoàn lại 100% tiền bảo chứng vào ví Khách. Hợp đồng ĐÃ HỦY.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 mt-1 block">
                      Hoàn tiền ví Khách hàng
                    </span>
                  </label>

                  {/* Option 3: Split */}
                  <label
                    onClick={() => setSelectedResult('SPLIT')}
                    className={`cursor-pointer rounded-lg border p-2 flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${
                      selectedResult === 'SPLIT'
                        ? isSplitBlocked
                          ? 'border-red-400 bg-red-50/40 shadow-2xs'
                          : 'border-[#991B1B] bg-red-50/30 shadow-2xs ring-1 ring-[#991B1B]/20'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">Phân chia theo tỷ lệ</span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="SPLIT"
                          checked={selectedResult === 'SPLIT'}
                          onChange={() => setSelectedResult('SPLIT')}
                          className="accent-[#991B1B]"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight line-clamp-2 mt-0.5">
                        Phân chia tiền bảo chứng giữa hai bên theo tỷ lệ phần trăm.
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-semibold text-[#991B1B] block">
                        Phân chia tỷ lệ
                      </span>
                      {isSplitBlocked && (
                        <Badge variant="error" size="sm">
                          TẠM KHÓA
                        </Badge>
                      )}
                    </div>
                  </label>
                </div>

                {/* Split Configuration Sub-form */}
                {selectedResult === 'SPLIT' && (
                  <div className="rounded-lg border border-border bg-surface p-2.5 space-y-2">
                    {/* Discrepancy Safety Guard Banner */}
                    {isSplitBlocked && (
                      <div className="rounded-lg border border-status-error-text/40 bg-status-error-bg/60 p-2.5 text-[11px] text-status-error-text space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-status-error-text" />
                          <span>Cảnh báo An toàn Tài chính — Vô hiệu hóa phân xử SPLIT</span>
                        </div>
                        <p className="leading-relaxed text-[11px]">
                          Hợp đồng quy định mức phí sàn là <strong>{platformFeeRate}%</strong>, trong khi dịch vụ giải ngân SPLIT của Backend hiện tính cố định theo mức mặc định toàn sàn <strong>5.0%</strong>. Để ngăn ngừa sai lệch dòng tiền thực tế, thao tác SPLIT tạm thời bị vô hiệu hóa cho hợp đồng này.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-ink">
                        Tỷ lệ Thuyết minh viên được nhận (%):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          disabled={isSplitBlocked}
                          value={splitPercentInput}
                          onChange={(e) => setSplitPercentInput(e.target.value)}
                          className="w-24 px-2 py-1 text-xs font-mono font-bold text-right border border-border rounded bg-canvas focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="font-mono text-xs">%</span>
                      </div>
                    </div>
                    {formErrors.splitPercent && (
                      <p className="text-[11px] text-status-error-text">{formErrors.splitPercent}</p>
                    )}

                    {/* Live Estimate Breakdown */}
                    <div className="rounded border border-border bg-surface-subtle p-2 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-muted font-sans">
                          Thuyết minh ({splitEstimate.freelancerPercent}% gross):
                        </span>
                        {splitEstimate.hasKnownFee && splitEstimate.freelancerNet != null && splitEstimate.fee != null ? (
                          <span className="font-semibold text-status-success-text">
                            {formatVND(splitEstimate.freelancerNet)} (trừ phí sàn {splitEstimate.platformFeePercent}%: {formatVND(splitEstimate.fee)})
                          </span>
                        ) : (
                          <span className="font-semibold text-ink">
                            {formatVND(splitEstimate.freelancerGross)} (Phí sàn: Theo hợp đồng)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted font-sans">
                          Nhà sáng tạo nhận lại ({splitEstimate.creatorPercent}%):
                        </span>
                        <span className="font-semibold text-ink">
                          {formatVND(splitEstimate.creatorRefund)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Textarea + Action Button in Single Flex Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 pt-1">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-semibold text-stone-800 block">
                      Căn cứ & Ghi chú phân xử của Ban Quản trị <span className="text-accent">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Ghi rõ căn cứ phân định tranh chấp (kết quả file âm thanh, điều khoản hợp đồng)..."
                      className="w-full h-11 p-2 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-accent leading-tight resize-none"
                    />
                    {formErrors.resolution && (
                      <p className="text-[10px] text-status-error-text">{formErrors.resolution}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleOpenConfirm}
                    disabled={resolveMutation.isPending || (selectedResult === 'SPLIT' && isSplitBlocked)}
                    className="h-11 px-5 text-xs bg-accent hover:bg-accent-hover text-white shadow-xs rounded-xl shrink-0 font-medium active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Gavel className="h-4 w-4 mr-1.5" />
                    <span>Tiến hành phân xử</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Ineligible Notice */}
            {!isResolved && !isCancelled && !eligibility.eligible && (
              <div className="rounded-lg border border-border bg-surface-subtle p-2.5 flex items-start gap-2 text-xs text-muted">
                <Info className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                <span>Không thể thực hiện phân xử: {eligibility.reason}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Two-Step Confirmation Modal */}
      {showConfirmModal && (
        <DisputeConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSubmit}
          isPending={resolveMutation.isPending}
          dispute={activeDispute}
          selectedResult={selectedResult}
          splitPercent={Number(splitPercentInput) || 50}
          resolutionNote={resolutionNote}
          errorMessage={mutationErrorMessage}
        />
      )}
    </>
  );
};
