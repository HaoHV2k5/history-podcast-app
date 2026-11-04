import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileAudio,
  FileText,
  Gavel,
  Layers,
  Lock,
  Play,
  Scale,
  ShieldAlert,
  User,
} from 'lucide-react';
import { DisputeItem, DisputeResult, ResolveDisputePayload } from '@/types/dispute';
import { ContractItem, MilestoneItem } from '@/types/contract';
import { MilestoneDeliverableItem } from '@/types/deliverable';
import { disputesApi } from '@/services/api/disputes';
import { contractsApi } from '@/services/api/contracts';
import { deliverablesApi } from '@/services/api/deliverables';
import { usersApi } from '@/services/api/users';
import { DeliverableMediaModal } from '@/features/creator/components/DeliverableMediaModal';
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
import {
  AdminDisputeRow,
  extractUrlsFromText,
  stripUrlsFromText,
  formatDisputeId,
  formatContractCode,
} from './disputesLogic';

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
      evidenceUrls: row.evidenceUrls,
      counterEvidence: row.counterEvidence,
      counterEvidenceUrls: row.counterEvidenceUrls,
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
  const deliverablesBoxRef = useRef<HTMLDivElement>(null);
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
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MilestoneDeliverableItem | null>(
    null
  );

  // 1. Fetch fresh dispute detail from Backend API
  const { data: freshDisputeData } = useQuery({
    queryKey: ['admin-dispute-detail', numericId],
    queryFn: () => disputesApi.getDisputeById(numericId),
    enabled: Boolean(numericId > 0),
    retry: false,
  });

  const activeDispute: DisputeItem =
    freshDisputeData?.data || (dispute ? toDisputeItem(dispute) : (null as any));

  // 2. Fetch associated contract details for full financial and party context
  const { data: contractData } = useQuery({
    queryKey: ['admin-contract-detail', activeDispute?.contractId],
    queryFn: () => contractsApi.getContractById(activeDispute!.contractId),
    enabled: Boolean(activeDispute?.contractId),
  });

  // 3. Fetch milestone deliverables so Admin can inspect/listen to submitted files right here
  const { data: deliverablesRes } = useQuery({
    queryKey: ['admin-dispute-milestone-deliverables', activeDispute?.milestoneId],
    queryFn: () => deliverablesApi.getDeliverablesByMilestone(activeDispute!.milestoneId!),
    enabled: Boolean(activeDispute?.milestoneId),
  });

  // 3b. Fetch users lookup to display 100% real emails & names for Creator, Requester, and Complainant
  const { data: usersRes } = useQuery({
    queryKey: ['admin-users-lookup'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 200 }),
    staleTime: 60 * 1000,
  });

  const userLookupMap = React.useMemo(() => {
    const map = new Map<number, { id: number; fullName?: string; email?: string }>();
    const rawU = usersRes?.data;
    const list = !rawU
      ? []
      : Array.isArray(rawU)
      ? rawU
      : 'content' in rawU && Array.isArray((rawU as any).content)
      ? (rawU as any).content
      : 'items' in rawU && Array.isArray((rawU as any).items)
      ? (rawU as any).items
      : [];
    for (const u of list) {
      if (u && typeof u.id === 'number') {
        map.set(u.id, u);
      }
    }
    return map;
  }, [usersRes]);

  const contract: ContractItem | null = contractData?.data || null;
  const milestone: MilestoneItem | undefined = contract?.milestones?.find(
    (m) => m.id === activeDispute?.milestoneId
  );
  const deliverables: MilestoneDeliverableItem[] = deliverablesRes?.data || [];

  const eligibility = isDisputeEligibleForResolution(activeDispute, milestone);
  const normalizedStatus = (activeDispute?.status || '').toUpperCase();
  const isResolved =
    normalizedStatus === 'RESOLVED' ||
    normalizedStatus === 'ĐÃ GIẢI QUYẾT' ||
    normalizedStatus === 'ĐÃ PHÂN XỬ';
  const isCancelled =
    normalizedStatus === 'CANCELLED' ||
    normalizedStatus === 'ĐÃ HỦY' ||
    normalizedStatus === 'DA HUY';

  // GSAP Entrance Micro-Animation
  useEffect(() => {
    if (!dispute) return;
    const ctx = gsap.context(() => {
      const items = [
        contextBoxRef.current,
        reasonEvidenceRef.current,
        deliverablesBoxRef.current,
        resolutionBoxRef.current,
      ].filter(Boolean);
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

  // Real party names, emails, and IDs directly from contract, user lookup, or dispute sender (Zero Fake Data)
  const rawDisputeRow = dispute && 'rawId' in dispute ? (dispute as AdminDisputeRow) : null;

  const creatorDisplayId =
    contract?.creatorId ||
    (rawDisputeRow?.senderRole === 'Creator' ? rawDisputeRow.senderId : null) ||
    null;
  const creatorLookup = creatorDisplayId ? userLookupMap.get(creatorDisplayId) : undefined;
  const creatorDisplayEmail =
    contract?.creatorEmail?.trim() || creatorLookup?.email?.trim() || '';
  const creatorDisplayName =
    contract?.creatorFullName?.trim() ||
    creatorLookup?.fullName?.trim() ||
    (rawDisputeRow?.senderRole === 'Creator' ? rawDisputeRow.senderName : null) ||
    (creatorDisplayEmail ? creatorDisplayEmail.split('@')[0] : 'Chưa có thông tin');

  const requesterDisplayId =
    contract?.requesterId ||
    contract?.freelancerId ||
    (rawDisputeRow?.senderRole === 'Người dùng' ? rawDisputeRow.senderId : null) ||
    null;
  const requesterLookup = requesterDisplayId ? userLookupMap.get(requesterDisplayId) : undefined;
  const requesterDisplayEmail =
    contract?.requesterEmail?.trim() || requesterLookup?.email?.trim() || '';
  const requesterDisplayName =
    contract?.requesterFullName?.trim() ||
    contract?.freelancerFullName?.trim() ||
    requesterLookup?.fullName?.trim() ||
    (rawDisputeRow?.senderRole === 'Người dùng' ? rawDisputeRow.senderName : null) ||
    (requesterDisplayEmail ? requesterDisplayEmail.split('@')[0] : 'Chưa có thông tin');

  const senderDisplayId =
    activeDispute?.raisedByUserId || (rawDisputeRow ? rawDisputeRow.senderId : null);
  const senderLookup = senderDisplayId ? userLookupMap.get(senderDisplayId) : undefined;
  const senderDisplayEmail =
    rawDisputeRow?.senderEmail?.trim() || senderLookup?.email?.trim() || '';
  const senderDisplayName =
    activeDispute?.raisedByUserFullName?.trim() ||
    senderLookup?.fullName?.trim() ||
    (rawDisputeRow ? rawDisputeRow.senderName : null) ||
    (senderDisplayEmail ? senderDisplayEmail.split('@')[0] : `Người dùng #${senderDisplayId || ''}`);

  const isRaisedByCreator =
    contract?.creatorId != null
      ? activeDispute?.raisedByUserId === contract.creatorId
      : rawDisputeRow?.senderRole === 'Creator';

  // 4. Resolve Mutation with rollback & cache invalidation
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
        `Đã phân xử khiếu nại thành công! Kết quả: ${
          formatDisputeResult(response.data.result || selectedResult).label
        }`
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
      : 5;

  const feeDiscrepancy = checkSplitFeeDiscrepancy(platformFeeRate);
  const isSplitBlocked = feeDiscrepancy.isUnsafeForSettlement;

  const splitEstimate = calculateSplitEstimate(
    milestoneGross,
    Number(splitPercentInput) || 0,
    platformFeeRate
  );

  // Cleanly separate text explanation from embedded attachment URLs
  const evidenceCleanText = stripUrlsFromText(activeDispute.evidence);
  const evidenceUrls = extractUrlsFromText(activeDispute.evidence, activeDispute.evidenceUrls);

  const counterEvidenceCleanText = stripUrlsFromText(activeDispute.counterEvidence);
  const counterEvidenceUrls = extractUrlsFromText(
    activeDispute.counterEvidence,
    activeDispute.counterEvidenceUrls
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
    if (resolveMutation.isPending) return;
    const payload: ResolveDisputePayload = {
      result: selectedResult,
      resolution: resolutionNote.trim(),
      splitPercent: selectedResult === 'SPLIT' ? Number(splitPercentInput) : undefined,
    };
    resolveMutation.mutate(payload);
  };

  const statusInfo = formatDisputeStatus(activeDispute.status);
  const disputeCode = formatDisputeId(activeDispute.id);
  const contractCode = formatContractCode(activeDispute.contractId);

  return (
    <>
      <Dialog open={Boolean(dispute)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          maxWidth="max-w-4xl"
          className="p-0 gap-0 max-h-[92vh] flex flex-col overflow-hidden font-sans border-[#EBE4D8] bg-[#FAF8F5] rounded-2xl shadow-2xl"
        >
          {/* Sticky Top Header */}
          <DialogHeader className="px-5 py-4 border-b border-[#EBE4D8] bg-[#FAF8F5] shrink-0 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#A31D24]/10 border border-[#A31D24]/20 px-2.5 py-0.5 text-xs font-mono font-bold text-[#A31D24]">
                  <Gavel className="h-3.5 w-3.5" />
                  {disputeCode}
                </span>
                <Badge
                  variant={statusInfo.variant}
                  size="sm"
                  className="shrink-0 text-xs py-0.5 px-2.5"
                >
                  {statusInfo.label}
                </Badge>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#EBE4D8] px-2.5 py-0.5 text-xs font-mono font-semibold text-stone-700">
                  Hợp đồng: {contractCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold rounded-lg bg-white border border-[#E5DEC9] text-[#5C4D43] hover:text-[#A31D24] hover:border-[#A31D24]/40 shadow-2xs transition-colors cursor-pointer"
                  onClick={() => {
                    onClose();
                    navigate(`/admin/contracts?search=${contractCode}`);
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#A31D24]" />
                  <span>Mở Hợp đồng {contractCode}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
              <DialogTitle className="text-base sm:text-lg font-bold text-[#2C221E] leading-snug">
                {contract?.title || activeDispute.contractTitle || `Hợp đồng #${activeDispute.contractId}`}
                {activeDispute.milestoneTitle && (
                  <span className="text-xs sm:text-sm font-normal text-[#6E5D4F] ml-1.5">
                    — {activeDispute.milestoneTitle}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-[#8C7B6B] font-mono shrink-0">
                Khởi tạo: {formatDateTime(activeDispute.createdAt)}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Scrollable Body */}
          <div
            ref={modalContainerRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs"
          >
            {/* Success Banner */}
            {successNotice && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Mutation Error Banner */}
            {mutationErrorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{mutationErrorMessage}</span>
              </div>
            )}

            {/* 1. Context Card: Parties & Disputed Milestone Financials */}
            <div
              ref={contextBoxRef}
              className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 space-y-3 shadow-2xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Creator */}
                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-2.5 flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#A31D24]/10 text-[#A31D24] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#8C7B6B] block uppercase font-bold tracking-wider">
                      Nhà sáng tạo (Creator)
                    </span>
                    <span
                      className="font-bold text-[#2C221E] text-xs truncate block mt-0.5"
                      title={creatorDisplayName}
                    >
                      {creatorDisplayName}
                    </span>
                    <span className="text-[11px] text-[#6E5D4F] truncate block font-mono">
                      {creatorDisplayEmail
                        ? creatorDisplayEmail
                        : contract?.channelName
                        ? `Kênh: ${contract.channelName}`
                        : creatorDisplayId
                        ? `ID: #${creatorDisplayId}`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Customer / Requester */}
                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-2.5 flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#8C7B6B] block uppercase font-bold tracking-wider">
                      Khách đặt nội dung
                    </span>
                    <span
                      className="font-bold text-[#2C221E] text-xs truncate block mt-0.5"
                      title={requesterDisplayName}
                    >
                      {requesterDisplayName}
                    </span>
                    <span className="text-[11px] text-[#6E5D4F] truncate block font-mono">
                      {requesterDisplayEmail
                        ? requesterDisplayEmail
                        : requesterDisplayId
                        ? `ID: #${requesterDisplayId}`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Raised By */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-2.5 flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-amber-900/70 uppercase font-bold tracking-wider">
                        Bên gửi khiếu nại
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          isRaisedByCreator
                            ? 'bg-[#A31D24]/10 text-[#A31D24]'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isRaisedByCreator ? 'Creator' : 'Khách hàng'}
                      </span>
                    </div>
                    <span className="font-bold text-[#991B1B] text-xs truncate block mt-0.5">
                      {senderDisplayName}
                    </span>
                    <span className="text-[11px] text-[#6E5D4F] truncate block font-mono">
                      {senderDisplayEmail
                        ? senderDisplayEmail
                        : `ID: #${senderDisplayId || '—'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestone Financial Summary Strip */}
              {milestone && (
                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-4 w-4 text-[#A31D24] shrink-0" />
                    <span className="font-semibold text-[#2C221E] truncate">
                      Cột mốc #{milestone.orderNo}: {milestone.title}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 shrink-0">
                      <Lock className="h-3 w-3" />
                      {milestone.escrowStatus === 'FROZEN'
                        ? 'Quỹ đang đóng băng (FROZEN)'
                        : `Quỹ: ${milestone.escrowStatus || 'HELD'}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                    <span>
                      Giá trị mốc (Khách nạp):{' '}
                      <strong className="text-[#2C221E]">{formatVND(milestone.amount)}</strong>
                    </span>
                    <span className="text-stone-300">•</span>
                    <span>
                      Phí sàn ({platformFeeRate}%):{' '}
                      <strong className="text-[#6E5D4F]">
                        {formatVND(
                          milestone.platformFee ??
                            Math.round((milestone.amount * platformFeeRate) / 100)
                        )}
                      </strong>
                    </span>
                    <span className="text-stone-300">•</span>
                    <span>
                      Creator thực nhận:{' '}
                      <strong className="text-emerald-700">
                        {formatVND(
                          milestone.netAmount ??
                            milestone.amount -
                              Math.round((milestone.amount * platformFeeRate) / 100)
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Side-by-Side Dossier: Lý do & Bằng chứng đối chất */}
            <div ref={reasonEvidenceRef} className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Left Column: Complainant Reason & Evidence */}
              <div className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A31D24] flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      1. Nội dung Khiếu nại & Bằng chứng
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C7B6B]">
                      Từ: {activeDispute.raisedByUserFullName || 'Bên khiếu nại'}
                    </span>
                  </div>

                  {/* Reason */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7B6B] block mb-1">
                      Lý do khiếu nại chính:
                    </span>
                    <div className="rounded-lg border border-[#EBE4D8] bg-[#FAF8F5] p-2.5 text-[#2C221E] text-xs leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                      {activeDispute.reason || 'Chưa có thông tin lý do chi tiết.'}
                    </div>
                  </div>

                  {/* Evidence Explanation Text */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7B6B] block mb-1">
                      Mô tả / Giải trình bằng chứng:
                    </span>
                    {evidenceCleanText ? (
                      <div className="rounded-lg border border-[#EBE4D8] bg-[#FAF8F5] p-2.5 text-[#2C221E] text-xs leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                        {evidenceCleanText}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#E5DEC9] bg-[#FAF8F5]/50 p-2 text-[#8C7B6B] text-[11px] italic">
                        {evidenceUrls.length > 0
                          ? 'Đính kèm tệp bằng chứng trực tiếp bên dưới.'
                          : 'Không có mô tả bằng chứng bổ sung.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Attachment URLs */}
                <div className="pt-2 border-t border-[#F2EDE4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7B6B] block mb-1.5">
                    Tệp bằng chứng đính kèm ({evidenceUrls.length}):
                  </span>
                  {evidenceUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {evidenceUrls.map((url, idx) => {
                        const fileName =
                          url.split('/').pop()?.split('?')[0] || `Tệp bằng chứng #${idx + 1}`;
                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5DEC9] px-2.5 py-1 text-[11px]"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#A31D24] shrink-0" />
                            <span className="truncate max-w-[150px] font-medium text-[#2C221E]">
                              {fileName}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPreviewItem({
                                  id: -(idx + 1),
                                  milestoneId: activeDispute.milestoneId || 0,
                                  title: `Bằng chứng khiếu nại #${idx + 1}`,
                                  description: evidenceCleanText || activeDispute.reason,
                                  fileName,
                                  versionNo: 1,
                                  uploadedByFullName: activeDispute.raisedByUserFullName,
                                  downloadUrl: url,
                                  previewUrl: url,
                                  createdAt: activeDispute.createdAt || new Date().toISOString(),
                                })
                              }
                              className="inline-flex items-center gap-1 rounded bg-[#A31D24] px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#8B181E] transition-colors cursor-pointer"
                            >
                              <Play className="h-2.5 w-2.5" />
                              Xem / Nghe
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#6E5D4F] hover:text-[#A31D24] p-0.5"
                              title="Mở trong tab mới"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8C7B6B] italic">
                      Không có tệp đính kèm.
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Counter-Evidence & Explanation from Respondent */}
              <div className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 flex flex-col justify-between space-y-3 shadow-2xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-amber-700" />
                      2. Giải trình & Phản hồi đối chất
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C7B6B]">
                      Từ bên bị khiếu nại
                    </span>
                  </div>

                  {counterEvidenceCleanText || counterEvidenceUrls.length > 0 ? (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70 block mb-1">
                        Nội dung giải trình phản hồi:
                      </span>
                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-2.5 text-[#2C221E] text-xs leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
                        {counterEvidenceCleanText ||
                          'Bên bị khiếu nại đã đính kèm tệp bằng chứng đối chất bên dưới.'}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[#E5DEC9] bg-[#FAF8F5] p-5 text-center space-y-1">
                      <p className="text-xs font-semibold text-[#5C4D43]">
                        Chưa có phản hồi đối chất
                      </p>
                      <p className="text-[11px] text-[#8C7B6B] leading-relaxed">
                        Bên bị khiếu nại hiện chưa gửi văn bản giải trình hoặc tệp bằng chứng phản
                        hồi cho tranh chấp này.
                      </p>
                    </div>
                  )}
                </div>

                {/* Counter-Evidence Attachment URLs */}
                <div className="pt-2 border-t border-[#F2EDE4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7B6B] block mb-1.5">
                    Tệp đối chất đính kèm ({counterEvidenceUrls.length}):
                  </span>
                  {counterEvidenceUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {counterEvidenceUrls.map((url, idx) => {
                        const fileName =
                          url.split('/').pop()?.split('?')[0] || `Tệp đối chất #${idx + 1}`;
                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/60 border border-amber-200 px-2.5 py-1 text-[11px]"
                          >
                            <FileText className="h-3.5 w-3.5 text-amber-800 shrink-0" />
                            <span className="truncate max-w-[150px] font-medium text-[#2C221E]">
                              {fileName}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPreviewItem({
                                  id: -(100 + idx + 1),
                                  milestoneId: activeDispute.milestoneId || 0,
                                  title: `Bằng chứng đối chất #${idx + 1}`,
                                  description: counterEvidenceCleanText,
                                  fileName,
                                  versionNo: 1,
                                  downloadUrl: url,
                                  previewUrl: url,
                                  createdAt: activeDispute.createdAt || new Date().toISOString(),
                                })
                              }
                              className="inline-flex items-center gap-1 rounded bg-amber-700 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-800 transition-colors cursor-pointer"
                            >
                              <Play className="h-2.5 w-2.5" />
                              Xem / Nghe
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-800 hover:text-amber-950 p-0.5"
                              title="Mở trong tab mới"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8C7B6B] italic">
                      Không có tệp đối chất đính kèm.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Milestone Deliverables Section (Direct inspection of Creator's submitted files!) */}
            {activeDispute.milestoneId && (
              <div
                ref={deliverablesBoxRef}
                className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C221E] flex items-center gap-1.5">
                    <FileAudio className="h-4 w-4 text-[#A31D24]" />
                    3. Sản phẩm bàn giao của Creator tại cột mốc này ({deliverables.length})
                  </span>
                  <span className="text-[11px] text-[#8C7B6B]">
                    Bấm &ldquo;Xem / Nghe&rdquo; để kiểm tra chất lượng file trực tiếp
                  </span>
                </div>

                {deliverables.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#E5DEC9] bg-[#FAF8F5] p-3 text-center text-xs text-[#8C7B6B] italic">
                    Nhà sáng tạo chưa nộp tệp sản phẩm bàn giao nào ở cột mốc này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deliverables.map((d) => {
                      const fileHref = d.downloadUrl || d.previewUrl;
                      return (
                        <div
                          key={d.id}
                          className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-2.5 flex items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center rounded bg-[#A31D24]/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#A31D24] shrink-0">
                                v{d.versionNo || 1}
                              </span>
                              <p className="text-xs font-bold text-[#2C221E] truncate">
                                {d.title || d.fileName || `Bản nộp lần #${d.versionNo || 1}`}
                              </p>
                            </div>
                            {d.description && (
                              <p className="text-[11px] text-[#5C4D43] truncate mt-0.5">
                                Ghi chú: {d.description}
                              </p>
                            )}
                            <p className="text-[10px] text-[#8C7B6B] font-mono mt-0.5">
                              Nộp bởi: {d.uploadedByFullName || creatorDisplayName} •{' '}
                              {formatDateTime(d.createdAt)}
                            </p>
                          </div>

                          {fileHref && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedPreviewItem(d)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#A31D24] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#8B181E] transition-colors cursor-pointer"
                              >
                                <Play className="h-3 w-3" />
                                Xem / Nghe
                              </button>
                              <a
                                href={fileHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-[#E5DEC9] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#5C4D43] hover:bg-[#F4EFE6] transition-colors"
                                title="Tải về"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. SECTION: CANCELLED VIEW */}
            {isCancelled && (
              <div
                ref={resolutionBoxRef}
                className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 space-y-1.5"
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
                <p className="text-xs text-stone-600 leading-relaxed">
                  Khiếu nại này đã được hủy bỏ hoặc kết thúc. Không cần thực hiện phân xử thêm.
                </p>
              </div>
            )}

            {/* 4. SECTION: RESOLVED READ-ONLY VIEW */}
            {isResolved && (
              <div
                ref={resolutionBoxRef}
                className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span className="font-bold text-xs uppercase text-emerald-900">
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
                  <div className="font-mono text-xs text-[#2C221E] bg-white p-2.5 rounded-lg border border-emerald-200">
                    Tỷ lệ phân chia:{' '}
                    <strong className="text-emerald-800">
                      Nhà sáng tạo (Creator) {activeDispute.splitPercent}%
                    </strong>{' '}
                    —{' '}
                    <strong className="text-sky-800">
                      Khách đặt nội dung {100 - activeDispute.splitPercent}%
                    </strong>
                  </div>
                )}

                {activeDispute.resolution && (
                  <div>
                    <span className="text-[10px] text-emerald-900/70 block mb-1 font-bold uppercase">
                      Căn cứ kết luận của Ban Quản trị:
                    </span>
                    <div className="rounded-lg bg-white p-2.5 text-[#2C221E] leading-relaxed whitespace-pre-line border border-emerald-200 text-xs">
                      {activeDispute.resolution}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-900/70 pt-1.5 border-t border-emerald-200/70 font-mono">
                  <span>
                    Phân xử bởi:{' '}
                    {activeDispute.resolvedByUserFullName ||
                      `Admin ID #${activeDispute.resolvedByUserId ?? '—'}`}
                  </span>
                  <span>Thời điểm: {formatDateTime(activeDispute.resolvedAt)}</span>
                </div>
              </div>
            )}

            {/* 4. SECTION: OPEN RESOLUTION FORM (ADMIN ONLY) */}
            {!isResolved && !isCancelled && eligibility.eligible && (
              <div
                ref={resolutionBoxRef}
                className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-[#A31D24]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#A31D24]">
                      4. Quyết định Phân xử của Ban Quản trị
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#8C7B6B]">
                    Quyết định sẽ tự động giải ngân hoặc hoàn trả quỹ bảo chứng
                  </span>
                </div>

                {/* 3 Resolution Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Release to Creator */}
                  <label
                    onClick={() => setSelectedResult('RELEASE_TO_CREATOR')}
                    className={`cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all duration-150 ${
                      selectedResult === 'RELEASE_TO_CREATOR' ||
                      selectedResult === 'RELEASE_TO_FREELANCER'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-600/20'
                        : 'border-[#EBE4D8] bg-[#FAF8F5] hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#2C221E]">
                          Giải ngân cho Creator
                        </span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="RELEASE_TO_CREATOR"
                          checked={
                            selectedResult === 'RELEASE_TO_CREATOR' ||
                            selectedResult === 'RELEASE_TO_FREELANCER'
                          }
                          onChange={() => setSelectedResult('RELEASE_TO_CREATOR')}
                          className="accent-[#A31D24]"
                        />
                      </div>
                      <p className="text-[11px] text-[#6E5D4F] leading-relaxed mt-1">
                        Chuyển tiền bảo chứng (sau trừ phí sàn {platformFeeRate}%) vào ví Nhà sáng
                        tạo.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-2 block">
                      → Giải ngân ví Nhà sáng tạo
                    </span>
                  </label>

                  {/* Option 2: Refund to Requester */}
                  <label
                    onClick={() => setSelectedResult('REFUND_TO_REQUESTER')}
                    className={`cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all duration-150 ${
                      selectedResult === 'REFUND_TO_REQUESTER' ||
                      selectedResult === 'REFUND_TO_CREATOR'
                        ? 'border-amber-600 bg-amber-50/50 shadow-2xs ring-1 ring-amber-600/20'
                        : 'border-[#EBE4D8] bg-[#FAF8F5] hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#2C221E]">
                          Hoàn tiền cho Khách hàng
                        </span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="REFUND_TO_REQUESTER"
                          checked={
                            selectedResult === 'REFUND_TO_REQUESTER' ||
                            selectedResult === 'REFUND_TO_CREATOR'
                          }
                          onChange={() => setSelectedResult('REFUND_TO_REQUESTER')}
                          className="accent-[#A31D24]"
                        />
                      </div>
                      <p className="text-[11px] text-[#6E5D4F] leading-relaxed mt-1">
                        Hoàn trả 100% tiền bảo chứng vào ví Khách đặt nội dung. Hợp đồng chuyển
                        sang ĐÃ HỦY.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 mt-2 block">
                      → Hoàn trả ví Khách đặt nội dung
                    </span>
                  </label>

                  {/* Option 3: Split */}
                  <label
                    onClick={() => setSelectedResult('SPLIT')}
                    className={`cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all duration-150 ${
                      selectedResult === 'SPLIT'
                        ? isSplitBlocked
                          ? 'border-red-400 bg-red-50/40 shadow-2xs'
                          : 'border-[#A31D24] bg-[#A31D24]/5 shadow-2xs ring-1 ring-[#A31D24]/20'
                        : 'border-[#EBE4D8] bg-[#FAF8F5] hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#2C221E]">
                          Phân chia theo tỷ lệ
                        </span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="SPLIT"
                          checked={selectedResult === 'SPLIT'}
                          onChange={() => setSelectedResult('SPLIT')}
                          className="accent-[#A31D24]"
                        />
                      </div>
                      <p className="text-[11px] text-[#6E5D4F] leading-relaxed mt-1">
                        Phân chia khoản tiền bảo chứng giữa Nhà sáng tạo và Khách đặt nội dung theo
                        %.
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-[#A31D24] block">
                        → Chia tỷ lệ Creator / Khách
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
                  <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-3 space-y-2.5">
                    {isSplitBlocked && (
                      <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-[11px] text-rose-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                          <span>Cảnh báo An toàn Tài chính — Vô hiệu hóa phân xử SPLIT</span>
                        </div>
                        <p className="leading-relaxed text-[11px]">
                          Hợp đồng quy định mức phí sàn là <strong>{platformFeeRate}%</strong>,
                          trong khi dịch vụ giải ngân SPLIT của Backend hiện tính cố định theo mức
                          mặc định toàn sàn <strong>5.0%</strong>. Để ngăn ngừa sai lệch dòng tiền
                          thực tế, thao tác SPLIT tạm thời bị vô hiệu hóa cho hợp đồng này.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#2C221E]">
                        Tỷ lệ Nhà sáng tạo (Creator) được nhận (%):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          disabled={isSplitBlocked}
                          value={splitPercentInput}
                          onChange={(e) => setSplitPercentInput(e.target.value)}
                          className="w-24 px-2.5 py-1.5 text-xs font-mono font-bold text-right border border-[#D8CFC2] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#A31D24] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="font-mono text-xs font-bold text-[#5C4D43]">%</span>
                      </div>
                    </div>
                    {formErrors.splitPercent && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {formErrors.splitPercent}
                      </p>
                    )}

                    {/* Live Estimate Breakdown */}
                    <div className="rounded-lg border border-[#EBE4D8] bg-white p-2.5 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6E5D4F] font-sans">
                          Nhà sáng tạo nhận ({splitEstimate.freelancerPercent}% gross):
                        </span>
                        {splitEstimate.hasKnownFee &&
                        splitEstimate.freelancerNet != null &&
                        splitEstimate.fee != null ? (
                          <span className="font-bold text-emerald-700">
                            {formatVND(splitEstimate.freelancerNet)} (trừ phí sàn{' '}
                            {splitEstimate.platformFeePercent}%: {formatVND(splitEstimate.fee)})
                          </span>
                        ) : (
                          <span className="font-bold text-[#2C221E]">
                            {formatVND(splitEstimate.freelancerGross)} (Phí sàn: Theo hợp đồng)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6E5D4F] font-sans">
                          Khách đặt nội dung nhận hoàn trả ({splitEstimate.creatorPercent}%):
                        </span>
                        <span className="font-bold text-sky-700">
                          {formatVND(splitEstimate.creatorRefund)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolution Note + Submit Action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 pt-1">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-bold text-[#2C221E] block">
                      Căn cứ & Ghi chú phân xử của Ban Quản trị{' '}
                      <span className="text-[#A31D24]">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Ghi rõ căn cứ phân định tranh chấp (kết quả kiểm tra file bàn giao, đối chiếu điều khoản hợp đồng)..."
                      className="w-full p-2.5 text-xs border border-[#D8CFC2] rounded-xl bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#A31D24] leading-relaxed resize-none"
                    />
                    {formErrors.resolution && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {formErrors.resolution}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleOpenConfirm}
                    disabled={
                      resolveMutation.isPending ||
                      (selectedResult === 'SPLIT' && isSplitBlocked)
                    }
                    className="h-11 px-5 text-xs bg-[#A31D24] hover:bg-[#8B181E] text-white shadow-xs rounded-xl shrink-0 font-semibold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Gavel className="h-4 w-4 mr-1.5" />
                    <span>Tiến hành phân xử</span>
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION: NOT ELIGIBLE NOTICE */}
            {!isResolved && !isCancelled && !eligibility.eligible && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-center gap-2 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Không thể phân xử trực tiếp:</strong> {eligibility.reason}
                </span>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3 border-t border-[#EBE4D8] bg-[#FAF8F5] flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-[#8C7B6B]">
              Mọi quyết định phân xử đều được lưu vết kiểm toán và thông báo tự động cho hai bên.
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 px-4 text-xs border-[#D8CFC2] text-[#2C221E] hover:bg-[#EFE9DD] rounded-lg cursor-pointer"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Step Modal */}
      <DisputeConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        isPending={resolveMutation.isPending}
        dispute={activeDispute}
        selectedResult={selectedResult}
        splitPercent={selectedResult === 'SPLIT' ? Number(splitPercentInput) : undefined}
        resolutionNote={resolutionNote.trim()}
        errorMessage={mutationErrorMessage}
      />

      {/* In-Place Media & Document Preview Modal */}
      <DeliverableMediaModal
        deliverable={selectedPreviewItem}
        isOpen={Boolean(selectedPreviewItem)}
        onClose={() => setSelectedPreviewItem(null)}
      />
    </>
  );
};
