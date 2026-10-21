import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface AdminDisputeDetailModalProps {
  dispute: DisputeItem | null;
  onClose: () => void;
}

export const AdminDisputeDetailModal: React.FC<AdminDisputeDetailModalProps> = ({
  dispute,
  onClose,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form states
  const [selectedResult, setSelectedResult] = useState<DisputeResult>('RELEASE_TO_FREELANCER');
  const [splitPercentInput, setSplitPercentInput] = useState<string>('50');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 1. Fetch fresh dispute detail
  const { data: freshDisputeData } = useQuery({
    queryKey: ['admin-dispute-detail', dispute?.id],
    queryFn: () => disputesApi.getDisputeById(dispute!.id),
    enabled: Boolean(dispute?.id),
  });

  const activeDispute: DisputeItem = freshDisputeData?.data || dispute!;

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
  const isResolved = (activeDispute?.status || '').toUpperCase() === 'RESOLVED';

  // 3. Mutation: Resolve Dispute
  const resolveMutation = useMutation({
    mutationFn: (payload: ResolveDisputePayload) =>
      disputesApi.resolveDispute(activeDispute.id, payload),
    retry: false, // Critical: Prevent automated retry of financial mutations
    onSuccess: () => {
      // Invalidate relevant queries across the entire admin suite
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', activeDispute.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contract-detail', activeDispute.contractId] });
      queryClient.invalidateQueries({ queryKey: ['admin-escrow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contract-milestones', activeDispute.contractId] });

      setShowConfirmModal(false);
      setMutationErrorMessage(null);
      setSuccessNotice('Phân xử tranh chấp thành công! Số dư ví và trạng thái ký quỹ đã được cập nhật.');
    },
    onError: (err: { response?: { status?: number; data?: { message?: string; errorCode?: string } } }) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 403) {
        setMutationErrorMessage('Bạn không có quyền Quản trị viên để thực hiện phân xử.');
      } else if (status === 409 || err?.response?.data?.errorCode === 'DISPUTE_INVALID_STATE') {
        setMutationErrorMessage('Tranh chấp này đã được phân xử hoặc thay đổi trạng thái trước đó. Vui lòng tải lại.');
      } else if (!err?.response) {
        // Network failure or timeout: DO NOT RETRY AUTOMATICALLY
        setMutationErrorMessage(
          'Sự cố kết nối mạng trong quá trình phân xử. Giao dịch có thể đã được ghi nhận trên máy chủ. Vui lòng tải lại trang để kiểm tra trạng thái trước khi thao tác lại.'
        );
      } else {
        setMutationErrorMessage(message || 'Đã xảy ra lỗi trong quá trình phân xử. Vui lòng thử lại.');
      }
    },
  });

  if (!dispute) return null;

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
        <DialogContent maxWidth="max-w-3xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                <Gavel className="h-5 w-5 text-accent" />
                <span>Chi tiết Khiếu nại #{activeDispute.id}</span>
                {activeDispute.milestoneTitle && (
                  <span className="text-sm font-sans font-normal text-muted truncate max-w-xs">
                    — {activeDispute.milestoneTitle}
                  </span>
                )}
              </DialogTitle>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              Hợp đồng ID #{activeDispute.contractId} • Thời điểm tạo:{' '}
              {formatDateTime(activeDispute.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {/* Success Banner */}
          {successNotice && (
            <div className="flex items-center gap-2 rounded-lg border border-status-success-text/30 bg-status-success-bg p-3 text-xs text-status-success-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            {/* Context Box: Parties & Milestone Financials */}
            <div className="rounded-xl border border-border bg-surface-subtle p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Creator */}
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Nhà sáng tạo (Creator)
                    </span>
                    <span className="font-semibold text-ink">
                      {contract?.creatorFullName || 'Chưa có dữ liệu'}
                    </span>
                    <span className="text-[10px] text-muted block font-mono">
                      User #{contract?.creatorId || '—'}
                    </span>
                  </div>
                </div>

                {/* Freelancer */}
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-status-processing-text shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Thuyết minh viên (Freelancer)
                    </span>
                    <span className="font-semibold text-ink">
                      {contract?.freelancerFullName || 'Chưa có dữ liệu'}
                    </span>
                    <span className="text-[10px] text-muted block font-mono">
                      User #{contract?.freelancerId || '—'}
                    </span>
                  </div>
                </div>

                {/* Raised By */}
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-status-error-text shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Bên khởi tạo khiếu nại
                    </span>
                    <span className="font-semibold text-status-error-text">
                      {activeDispute.raisedByUserFullName || `User #${activeDispute.raisedByUserId}`}
                    </span>
                    <span className="text-[10px] text-muted block font-mono">
                      Người khiếu nại
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestone Financial Detail */}
              {milestone ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border font-mono text-[11px]">
                  <div>
                    <span className="text-[10px] text-muted block font-sans uppercase">
                      Cột mốc #{milestone.orderNo}
                    </span>
                    <span className="font-semibold text-ink truncate block">
                      {milestone.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block font-sans uppercase">
                      Số tiền bảo chứng
                    </span>
                    <span className="font-bold text-ink">
                      {formatVND(milestone.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block font-sans uppercase">
                      Trạng thái Ký quỹ
                    </span>
                    <span className="inline-flex items-center gap-1 font-sans">
                      <Lock className="h-3 w-3 text-status-error-text" />
                      <strong className="text-status-error-text">{milestone.escrowStatus || 'FROZEN'}</strong>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block font-sans uppercase">
                      Phí sàn {platformFeeRate != null ? `(${platformFeeRate}%)` : '(Theo hợp đồng)'}
                    </span>
                    <span className="text-muted">
                      {milestone.platformFee != null
                        ? formatVND(milestone.platformFee)
                        : platformFeeRate != null
                        ? `${platformFeeRate}%`
                        : 'Theo hợp đồng'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-border flex items-center gap-1.5 text-muted text-[11px]">
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    Hợp đồng #{activeDispute.contractId}
                    {activeDispute.milestoneId ? ` • Cột mốc ID #${activeDispute.milestoneId}` : ''}
                  </span>
                </div>
              )}

              {/* Quick cross-navigation */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border">
                <span className="text-[11px] text-muted font-medium">
                  Đối soát liên quan:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 px-2.5 text-ink hover:text-accent font-normal"
                    onClick={() => {
                      onClose();
                      navigate(`/admin/contracts?search=${activeDispute.contractId}`);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 text-accent" />
                    <span>Xem Hợp đồng #{activeDispute.contractId}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 px-2.5 text-ink hover:text-accent font-normal"
                    onClick={() => {
                      onClose();
                      navigate(`/admin/escrow?search=${activeDispute.contractId}`);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 text-accent" />
                    <span>Xem Sổ cái Ký quỹ</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Evidence & Statements */}
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
                  Lý do khiếu nại (Reason):
                </span>
                <div className="rounded-lg border border-border bg-canvas p-3.5 text-ink leading-relaxed whitespace-pre-line">
                  {activeDispute.reason || 'Chưa có thông tin lý do chi tiết.'}
                </div>
              </div>

              {activeDispute.evidence && (
                <div>
                  <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
                    Bằng chứng bên khiếu nại (Evidence):
                  </span>
                  <div className="rounded-lg border border-border bg-surface p-3 text-ink leading-relaxed whitespace-pre-line text-[11px]">
                    {activeDispute.evidence.startsWith('http') ? (
                      <a
                        href={activeDispute.evidence}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline font-mono flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Xem tài liệu / tệp đính kèm bằng chứng</span>
                      </a>
                    ) : (
                      activeDispute.evidence
                    )}
                  </div>
                </div>
              )}

              {activeDispute.counterEvidence && (
                <div>
                  <span className="font-semibold text-status-processing-text block mb-1 text-[11px] uppercase tracking-wider">
                    Bằng chứng phản hồi từ bên bị khiếu nại (Counter-Evidence):
                  </span>
                  <div className="rounded-lg border border-status-processing-text/25 bg-status-processing-bg/20 p-3 text-ink leading-relaxed whitespace-pre-line text-[11px]">
                    {activeDispute.counterEvidence.startsWith('http') ? (
                      <a
                        href={activeDispute.counterEvidence}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-status-processing-text underline font-mono flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Xem tệp giải trình phản hồi</span>
                      </a>
                    ) : (
                      activeDispute.counterEvidence
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: RESOLVED READ-ONLY VIEW */}
            {isResolved && (
              <div className="rounded-xl border border-status-success-text/30 bg-status-success-bg/25 p-4 space-y-3">
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
                    >
                      {formatDisputeResult(activeDispute.result).label}
                    </Badge>
                  )}
                </div>

                {activeDispute.result === 'SPLIT' && activeDispute.splitPercent != null && (
                  <div className="font-mono text-xs text-ink bg-surface/70 p-2.5 rounded border border-status-success-text/20">
                    Tỷ lệ phân chia: <strong>Thuyết minh viên {activeDispute.splitPercent}%</strong> —{' '}
                    <strong>Nhà sáng tạo {100 - activeDispute.splitPercent}%</strong>
                  </div>
                )}

                {activeDispute.resolution && (
                  <div>
                    <span className="text-[11px] text-muted block mb-1 font-semibold uppercase">
                      Căn cứ kết luận của Admin:
                    </span>
                    <div className="rounded bg-surface p-3 text-ink leading-relaxed whitespace-pre-line border border-status-success-text/20">
                      {activeDispute.resolution}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted pt-2 border-t border-status-success-text/20 font-mono">
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
            {!isResolved && eligibility.eligible && (
              <div className="rounded-xl border border-accent/30 bg-accent-soft/20 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-accent" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
                    Thực hiện Phân xử Tranh chấp (Admin Resolution)
                  </h4>
                </div>

                {/* 3 Resolution Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Release to Freelancer */}
                  <label
                    onClick={() => setSelectedResult('RELEASE_TO_FREELANCER')}
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between space-y-2 transition-all ${
                      selectedResult === 'RELEASE_TO_FREELANCER'
                        ? 'border-status-success-text bg-status-success-bg/40 shadow-xs'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink">Giải ngân cho Thuyết minh</span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="RELEASE_TO_FREELANCER"
                          checked={selectedResult === 'RELEASE_TO_FREELANCER'}
                          onChange={() => setSelectedResult('RELEASE_TO_FREELANCER')}
                          className="accent-accent"
                        />
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Chuyển 100% tiền bảo chứng (sau khấu trừ phí sàn theo hợp đồng) vào ví Thuyết minh viên.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-status-success-text">
                      RELEASE_TO_FREELANCER
                    </span>
                  </label>

                  {/* Option 2: Refund to Creator */}
                  <label
                    onClick={() => setSelectedResult('REFUND_TO_CREATOR')}
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between space-y-2 transition-all ${
                      selectedResult === 'REFUND_TO_CREATOR'
                        ? 'border-status-pending-text bg-status-pending-bg/40 shadow-xs'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink">Hoàn tiền cho Creator</span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="REFUND_TO_CREATOR"
                          checked={selectedResult === 'REFUND_TO_CREATOR'}
                          onChange={() => setSelectedResult('REFUND_TO_CREATOR')}
                          className="accent-accent"
                        />
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Hoàn lại 100% số tiền bảo chứng vào ví Creator. Hợp đồng sẽ chuyển sang trạng thái ĐÃ HỦY.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-status-pending-text">
                      REFUND_TO_CREATOR
                    </span>
                  </label>

                  {/* Option 3: Split */}
                  <label
                    onClick={() => setSelectedResult('SPLIT')}
                    className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between space-y-2 transition-all ${
                      selectedResult === 'SPLIT'
                        ? isSplitBlocked
                          ? 'border-status-error-text/60 bg-status-error-bg/30 shadow-xs'
                          : 'border-accent bg-accent-soft shadow-xs'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ink">Phân chia tỷ lệ (Split)</span>
                        <input
                          type="radio"
                          name="disputeResult"
                          value="SPLIT"
                          checked={selectedResult === 'SPLIT'}
                          onChange={() => setSelectedResult('SPLIT')}
                          className="accent-accent"
                        />
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Phân chia khoản tiền bảo chứng giữa hai bên theo tỷ lệ phần trăm phân xử.
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-accent">
                        SPLIT
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
                  <div className="rounded-lg border border-border bg-surface p-3.5 space-y-3">
                    {/* Discrepancy Safety Guard Banner */}
                    {isSplitBlocked && (
                      <div className="rounded-lg border border-status-error-text/40 bg-status-error-bg/60 p-3 text-[11px] text-status-error-text space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-4 w-4 shrink-0 text-status-error-text" />
                          <span>Cảnh báo An toàn Tài chính — Vô hiệu hóa phân xử SPLIT</span>
                        </div>
                        <p className="leading-relaxed">
                          Hợp đồng quy định mức phí sàn là <strong>{platformFeeRate}%</strong>, trong khi dịch vụ giải ngân SPLIT của Backend hiện tính cố định theo mức mặc định toàn sàn <strong>5.0%</strong>. Để ngăn ngừa sai lệch dòng tiền thực tế, thao tác SPLIT tạm thời bị vô hiệu hóa cho hợp đồng này.
                        </p>
                        <p className="leading-relaxed text-[10px] opacity-90">
                          * Quản trị viên vui lòng chọn <strong>Giải ngân cho Thuyết minh</strong> hoặc <strong>Hoàn tiền cho Creator</strong> (đã được kiểm chứng an toàn 100%), hoặc chờ đội ngũ Backend cập nhật bản vá tài chính.
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
                          className="w-24 px-2.5 py-1.5 text-xs font-mono font-bold text-right border border-border rounded bg-canvas focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="font-mono text-xs">%</span>
                      </div>
                    </div>
                    {formErrors.splitPercent && (
                      <p className="text-[11px] text-status-error-text">{formErrors.splitPercent}</p>
                    )}

                    {/* Live Estimate Breakdown */}
                    <div className="rounded border border-border bg-surface-subtle p-2.5 space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-muted font-sans">
                          Thuyết minh viên ({splitEstimate.freelancerPercent}% gross):
                        </span>
                        {splitEstimate.hasKnownFee && splitEstimate.freelancerNet != null && splitEstimate.fee != null ? (
                          <span className="font-semibold text-status-success-text">
                            {formatVND(splitEstimate.freelancerNet)} (sau trừ phí sàn {splitEstimate.platformFeePercent}%: {formatVND(splitEstimate.fee)})
                          </span>
                        ) : (
                          <span className="font-semibold text-ink">
                            {formatVND(splitEstimate.freelancerGross)} (Phí sàn & Thực nhận: Tính theo hợp đồng khi giải ngân)
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
                      <p className="text-[10px] text-muted font-sans italic pt-1 border-t border-border">
                        * Ghi chú: Số liệu trên là bảng tính ước tính xem trước (Preview). Backend là nguồn xác thực duy nhất thực hiện làm tròn số và ghi sổ giao dịch ví chính thức.
                      </p>
                    </div>
                  </div>
                )}

                {/* Resolution Note Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink block">
                    Căn cứ & Ghi chú phân xử của Ban Quản trị <span className="text-accent">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Ghi rõ căn cứ phân định tranh chấp (dựa theo kết quả kiểm tra file âm thanh, điều khoản hợp đồng hoặc trao đổi hai bên)..."
                    className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                  />
                  {formErrors.resolution && (
                    <p className="text-[11px] text-status-error-text">{formErrors.resolution}</p>
                  )}
                </div>

                {/* Action button to open confirmation dialog */}
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleOpenConfirm}
                    disabled={resolveMutation.isPending || (selectedResult === 'SPLIT' && isSplitBlocked)}
                    className="min-h-[44px] px-5 text-xs bg-accent hover:bg-accent-hover text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Gavel className="h-4 w-4 mr-1.5" />
                    <span>Tiến hành phân xử</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Ineligible Notice */}
            {!isResolved && !eligibility.eligible && (
              <div className="rounded-lg border border-border bg-surface-subtle p-3 flex items-start gap-2 text-xs text-muted">
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
          splitPercent={selectedResult === 'SPLIT' ? Number(splitPercentInput) : undefined}
          resolutionNote={resolutionNote}
          errorMessage={mutationErrorMessage}
        />
      )}
    </>
  );
};
