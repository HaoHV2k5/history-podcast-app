import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Layers,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  Star,
  Edit3,
  RefreshCw,
  FolderOpen,
  Trash2,
  MessageSquare,
  Ban,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  X,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { contractsApi } from '@/services/api/contracts';
import { milestonesApi } from '@/services/api/milestones';
import { disputesApi } from '@/services/api/disputes';
import { ContractItem, MilestoneItem } from '@/types/contract';
import { DisputeItem } from '@/types/dispute';
import { formatDateTime, formatDate, formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import {
  formatMilestoneWorkStatus,
  formatMilestoneEscrowStatus,
  isMilestoneOverdue,
  getMilestoneRevisionInfo,
} from '@/features/contracts/milestoneFinanceLogic';
import { CreatorUploadDeliverableModal } from './CreatorUploadDeliverableModal';
import { CreatorDeliverablesListModal } from './CreatorDeliverablesListModal';
import { CreatorMilestoneReviewModal } from './CreatorMilestoneReviewModal';
import { CreatorMilestoneRoadmapModal } from './CreatorMilestoneRoadmapModal';
import { CreatorEditSingleMilestoneModal } from './CreatorEditSingleMilestoneModal';
import { CreatorOpenDisputeModal } from './CreatorOpenDisputeModal';
import { CreatorCounterEvidenceModal } from './CreatorCounterEvidenceModal';
import { stripUrlsFromText, extractUrlsFromText } from '@/features/disputes/disputesLogic';

interface CreatorContractDetailDrawerProps {
  contractId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onMilestoneActionSuccess?: () => void;
  onOpenCustomerChat?: (contract: ContractItem) => void;
}

function getContractStatusPresentation(
  status?: string,
  milestones?: MilestoneItem[]
): {
  label: string;
  className: string;
  dotColor: string;
} {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'IN_PROGRESS': {
      const hasActiveWork = milestones?.some(
        (m) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED'
      );
      const unfundedStage = !hasActiveWork
        ? milestones?.find((m) => m.status === 'UNFUNDED')
        : undefined;
      if (unfundedStage) {
        return {
          label: `Khách đã duyệt • Chờ ký quỹ Mốc #${unfundedStage.orderNo}`,
          className: 'bg-amber-50 text-amber-800 border-amber-200',
          dotColor: 'bg-amber-500',
        };
      }
      return {
        label: milestones && milestones.length > 0 && milestones.every((m) => m.status === 'RELEASED') ? 'Đã hoàn tất' : milestones && milestones.length > 0 && milestones.every((m) => m.status === 'RELEASED' || m.status === 'APPROVED') ? 'Đã nghiệm thu • Chờ giải ngân' : 'Đang thực hiện',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    }
    case 'PENDING':
      return {
        label: 'Chờ khách duyệt lộ trình',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn tất',
        className: 'bg-sky-50 text-sky-800 border-sky-200',
        dotColor: 'bg-sky-500',
      };
    case 'REJECTED':
      return {
        label: 'Khách yêu cầu sửa lộ trình',
        className: 'bg-rose-50 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
      };
    case 'CANCELLED': {
      const doneCount = (milestones || []).filter(
        (m) => m.status === 'APPROVED' || m.status === 'RELEASED'
      ).length;
      if (doneCount > 0 && milestones && milestones.length > 0) {
        return {
          label: `Đã dừng • Hoàn tất ${doneCount}/${milestones.length} mốc`,
          className: 'bg-amber-50 text-amber-800 border-amber-200',
          dotColor: 'bg-amber-500',
        };
      }
      return {
        label: 'Đã hủy',
        className: 'bg-stone-100 text-stone-700 border-stone-200/90',
        dotColor: 'bg-stone-400',
      };
    }
    default:
      return {
        label: status || 'Đang xử lý',
        className: 'bg-stone-100 text-stone-700 border-stone-200',
        dotColor: 'bg-stone-400',
      };
  }
}

export const CreatorContractDetailDrawer: React.FC<CreatorContractDetailDrawerProps> = ({
  contractId,
  isOpen,
  onClose,
  onMilestoneActionSuccess,
  onOpenCustomerChat,
}) => {
  const queryClient = useQueryClient();

  // Sub-modal triggers
  const [selectedMilestoneForUpload, setSelectedMilestoneForUpload] =
    useState<MilestoneItem | null>(null);
  const [selectedMilestoneForDeliverables, setSelectedMilestoneForDeliverables] =
    useState<MilestoneItem | null>(null);
  const [selectedMilestoneForReview, setSelectedMilestoneForReview] =
    useState<MilestoneItem | null>(null);
  const [selectedMilestoneForEdit, setSelectedMilestoneForEdit] =
    useState<MilestoneItem | null>(null);
  const [selectedMilestoneForDispute, setSelectedMilestoneForDispute] =
    useState<MilestoneItem | null>(null);
  const [selectedDisputeForCounter, setSelectedDisputeForCounter] =
    useState<DisputeItem | null>(null);
  const [openEditRoadmap, setOpenEditRoadmap] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  // Collapsible Milestones: Only an actively running stage (IN_PROGRESS/SUBMITTED) opens by default; all others start collapsed
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<number>>(new Set());

  const toggleMilestoneCollapse = (milestoneId: number) => {
    setCollapsedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  };

  // Fetch Contract Data
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['creator-contract-detail', contractId],
    queryFn: () => {
      if (!contractId) throw new Error('Không có contractId');
      return contractsApi.getContractById(contractId);
    },
    enabled: Boolean(contractId) && isOpen,
  });

  // Fetch Disputes for this contract
  const { data: disputesRes, refetch: refetchDisputes } = useQuery({
    queryKey: ['contract-disputes', contractId],
    queryFn: () => {
      if (!contractId) throw new Error('Không có contractId');
      return disputesApi.getDisputesByContract(contractId);
    },
    enabled: Boolean(contractId) && isOpen,
  });

  const contract: ContractItem | null = response?.data || null;
  const milestones: MilestoneItem[] = contract?.milestones || [];
  const rawDisputes = disputesRes?.data;
  const disputes: DisputeItem[] = Array.isArray(rawDisputes) ? rawDisputes : [];

  // Determine which milestone the contract is currently on (only when contract is ACTIVE/IN_PROGRESS)
  const isContractActive =
    contract?.status === 'ACTIVE' || contract?.status === 'IN_PROGRESS';
  const currentStageMilestone = isContractActive
    ? milestones.find((m) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED') ||
      milestones.find((m) => m.status === 'UNFUNDED' || m.status === 'WAITING') ||
      null
    : null;

  // Set default collapsed milestones once contract & milestones arrive:
  // Collapse all milestones by default EXCEPT a single actively worked-on milestone (IN_PROGRESS / SUBMITTED)
  useEffect(() => {
    setIsNoteExpanded(false);
    if (milestones.length > 0) {
      const activeWorkMilestone =
        contract?.status === 'ACTIVE' || contract?.status === 'IN_PROGRESS'
          ? milestones.find((m) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED')
          : undefined;

      const initialCollapsed = new Set<number>();
      milestones.forEach((m) => {
        if (!activeWorkMilestone || m.id !== activeWorkMilestone.id) {
          initialCollapsed.add(m.id);
        }
      });
      setCollapsedMilestones(initialCollapsed);
    }
  }, [contract?.id, contract?.status, milestones.length]);

  // Mutations
  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId: number) => milestonesApi.deleteMilestone(milestoneId),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      setActionError(null);
      onMilestoneActionSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setActionError(err.response?.data?.message || err.message || 'Lỗi khi xóa giai đoạn');
    },
  });

  const cancelContractMutation = useMutation({
    mutationFn: (id: number) => contractsApi.cancelContract(id),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      setActionError(null);
      onClose();
      onMilestoneActionSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setActionError(err.response?.data?.message || err.message || 'Lỗi khi hủy hợp đồng');
    },
  });

  const handleDeleteMilestone = (milestoneId: number) => {
    if (milestones.length <= 1) {
      setActionError('Hợp đồng phải có ít nhất 1 giai đoạn Milestone.');
      return;
    }
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa giai đoạn này và tự động đánh số lại các mốc còn lại?'
      )
    ) {
      deleteMilestoneMutation.mutate(milestoneId);
    }
  };

  const handleCancelContract = () => {
    if (!contract) return;
    if (
      window.confirm(
        'Bạn có chắc chắn muốn hủy hợp đồng này trước khi khán giả nạp cọc? Thao tác này sẽ giải phóng slot đặt hàng.'
      )
    ) {
      cancelContractMutation.mutate(contract.id);
    }
  };

  const isNegotiating =
    (contract?.status === 'PENDING' || contract?.status === 'REJECTED') &&
    milestones.every(
      (m) =>
        (m.status === 'WAITING' || m.status === 'UNFUNDED') &&
        (!m.escrowStatus || m.escrowStatus === 'UNFUNDED')
    );
  const contractStatusBadge = getContractStatusPresentation(contract?.status, milestones);
  const customerDisplayName =
    contract?.requesterFullName || contract?.freelancerFullName || 'Khách hàng';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          maxWidth="max-w-4xl"
          className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white rounded-3xl border border-[#EBE4D8] shadow-2xl font-sans flex flex-col [&>button:last-child]:hidden"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-[#696660]">
              <RefreshCw className="h-7 w-7 animate-spin text-[#9B2C2C]" />
              <span className="font-sans font-medium text-[#4A4640]">
                Đang tải thông tin chi tiết hợp đồng...
              </span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-6 m-6 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center justify-between font-sans">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#9B2C2C] shrink-0" />
                <span>Không thể tải chi tiết hợp đồng #{contractId}. Vui lòng thử lại.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="h-8 text-xs font-semibold"
              >
                Thử lại
              </Button>
            </div>
          )}

          {/* Main Contract Content */}
          {!isLoading && contract && (
            <>
              {/* ─── 1. STICKY HEADER BAR (Matching Sử Ký Studio Modal Header) ─── */}
              <div className="px-6 py-4 bg-white border-b border-[#EBE4D8] flex items-center justify-between gap-4 shrink-0">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDE9E9] text-[#A31D24] border border-rose-200/60 whitespace-nowrap">
                      <FileText className="h-3 w-3 shrink-0" />
                      HỢP ĐỒNG #{contract.id}
                    </span>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap',
                        contractStatusBadge.className
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          contractStatusBadge.dotColor
                        )}
                      />
                      {contractStatusBadge.label}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium whitespace-nowrap">
                      <Calendar className="h-3 w-3 text-stone-400 shrink-0" />
                      Ngày lập: {formatDate(contract.createdAt)}
                    </span>
                  </div>

                  <DialogTitle className="font-serif text-lg sm:text-xl font-bold text-[#1C1615] tracking-tight leading-snug truncate">
                    {contract.title || 'Hợp đồng Sản xuất Nội dung Lịch sử'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Chi tiết hợp đồng #{contract.id} với khách hàng {customerDisplayName}
                  </DialogDescription>
                </div>

                {/* Top Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {onOpenCustomerChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCustomerChat(contract);
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white hover:bg-[#FDE9E9]/50 border border-[#EBE4D8] hover:border-[#A31D24]/40 text-[#1C1615] hover:text-[#A31D24] text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs active:scale-[0.98] whitespace-nowrap"
                      title="Chuyển đến mục Tin nhắn với khách hàng này"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#A31D24] shrink-0" />
                      <span>
                        {contract.status === 'CANCELLED' || contract.status === 'COMPLETED'
                          ? 'Xem lịch sử chat'
                          : 'Mở chat với khách hàng'}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                    </button>
                  )}

                  {isNegotiating && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenEditRoadmap(true)}
                        className="h-9 px-3 text-xs rounded-xl border-[#EBE4D8] bg-white text-[#A31D24] hover:bg-rose-50 flex items-center gap-1.5 font-semibold whitespace-nowrap"
                      >
                        <Edit3 className="h-3.5 w-3.5 shrink-0" />
                        <span>Sửa lộ trình</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelContract}
                        disabled={cancelContractMutation.isPending}
                        className="h-9 px-3 text-xs rounded-xl border-[#EBE4D8] bg-white text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 font-semibold whitespace-nowrap"
                      >
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        <span>Hủy hợp đồng</span>
                      </Button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng cửa sổ"
                    className="h-9 w-9 rounded-xl bg-white border border-[#EBE4D8] hover:bg-stone-100 text-stone-500 hover:text-[#1C1615] flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Error Banner */}
              {actionError && (
                <div className="mx-6 mt-4 p-3 text-xs text-rose-900 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-sans shrink-0">
                  <AlertCircle className="h-4 w-4 text-[#A31D24] shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* ─── 2. SCROLLABLE BODY ─── */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#FAF8F5]">
                {/* Row 1: 3 KPI-Style Financial Cards (Matching CommissionsKpiCards.tsx 100%) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Tổng giá trị */}
                  <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3.5 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FDE9E9] text-[#A31D24] flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block truncate">
                        Tổng giá trị (Khách trả)
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#1C1615] leading-none">
                          {formatVND(contract.totalAmount || 0)}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 block truncate mt-0.5">
                        100% giá trị • {milestones.length} giai đoạn
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Phí nền tảng (5%) */}
                  <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3.5 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF7E6] text-[#D97706] flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block truncate">
                        Phí nền tảng (5%)
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#1C1615] leading-none">
                          {formatVND(
                            contract.platformFee || Math.round((contract.totalAmount || 0) * 0.05)
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 block truncate mt-0.5">
                        Khấu trừ khi giải ngân
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Creator thực nhận (95%) */}
                  <div className="rounded-2xl border border-[#EBE4D8] bg-white p-3.5 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAFCF1] text-[#16A34A] flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block truncate">
                        Creator thực nhận (95%)
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#16A34A] leading-none">
                          {formatVND(
                            contract.netAmount || Math.round((contract.totalAmount || 0) * 0.95)
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 block truncate mt-0.5">
                        Cộng thẳng vào ví khả dụng
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Customer Profile + Expandable Agreement Card */}
                <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-[#FDE9E9] border border-rose-200/70 flex items-center justify-center text-[#A31D24] font-bold text-sm shrink-0">
                        {(customerDisplayName || 'K')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#1C1615] truncate">
                            {customerDisplayName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-[#EAFCF1] px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            <span>Khách hàng đặt nội dung</span>
                          </span>
                        </div>
                        {contract.requesterEmail && (
                          <p className="text-[11px] text-stone-500 font-mono truncate mt-0.5">
                            {contract.requesterEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Escrow Policy Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-stone-600">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] font-medium whitespace-nowrap">
                        Sửa tối đa 2 lần (+2 ngày/lần)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] font-medium whitespace-nowrap">
                        Tự động duyệt sau 3 ngày
                      </span>
                    </div>
                  </div>

                  {/* Expandable Multi-Line Agreement Note */}
                  {(() => {
                    const noteText =
                      contract.description ||
                      'Thực hiện đúng tiến độ và tiêu chuẩn chất lượng của từng mốc bàn giao bên dưới.';
                    const isLongNote =
                      noteText.length > 130 || (noteText.match(/\n/g)?.length || 0) >= 2;
                    return (
                      <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] px-3.5 py-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Ghi chú &amp; Thỏa thuận hợp đồng
                          </span>
                          {isLongNote && (
                            <button
                              type="button"
                              onClick={() => setIsNoteExpanded((prev) => !prev)}
                              className="text-[11px] font-semibold text-[#A31D24] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>{isNoteExpanded ? 'Thu gọn' : 'Xem đầy đủ'}</span>
                              <ChevronDown
                                className={cn(
                                  'h-3 w-3 transition-transform duration-150',
                                  isNoteExpanded && 'rotate-180'
                                )}
                              />
                            </button>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-xs sm:text-[13px] text-[#1C1615] leading-relaxed break-words whitespace-pre-line',
                            !isNoteExpanded && isLongNote && 'line-clamp-2',
                            isNoteExpanded && 'max-h-40 overflow-y-auto pr-1'
                          )}
                        >
                          {noteText}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* ─── 3. MILESTONES ROADMAP SECTION ─── */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-sm sm:text-base font-bold text-[#1C1615] flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#A31D24] shrink-0" />
                        <span>Lộ trình bàn giao ({milestones.length} mốc)</span>
                      </h4>

                      {/* Current Milestone Position Badge */}
                      {milestones.length > 0 && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap',
                            contract.status === 'COMPLETED'
                              ? 'bg-[#EAFCF1] text-[#16A34A] border-emerald-200/70'
                              : contract.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                              : contract.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200/80'
                              : contract.status === 'CANCELLED'
                              ? 'bg-stone-100 text-stone-600 border-stone-200'
                              : currentStageMilestone
                              ? 'bg-[#FDE9E9] text-[#A31D24] border-rose-200/70'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          )}
                        >
                          {contract.status === 'COMPLETED' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />
                              <span>Đã hoàn tất {milestones.length}/{milestones.length} mốc</span>
                            </>
                          ) : contract.status === 'PENDING' ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>Chưa bắt đầu — Chờ khách chấp thuận lộ trình</span>
                            </>
                          ) : contract.status === 'REJECTED' ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>Khách yêu cầu sửa — Chờ cập nhật &amp; gửi lại lộ trình</span>
                            </>
                          ) : contract.status === 'CANCELLED' ? (
                            <span>
                              {(() => {
                                const doneCount = milestones.filter(
                                  (m) => m.status === 'APPROVED' || m.status === 'RELEASED'
                                ).length;
                                return doneCount > 0
                                  ? `Hợp đồng đã dừng — Đã hoàn tất ${doneCount}/${milestones.length} mốc trước đó`
                                  : 'Hợp đồng đã hủy';
                              })()}
                            </span>
                          ) : currentStageMilestone ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-[#A31D24]" />
                              <span>
                                Đang ở Mốc #{currentStageMilestone.orderNo}/{milestones.length}:{' '}
                                {currentStageMilestone.title}
                                {currentStageMilestone.status === 'UNFUNDED'
                                  ? ' (Chờ khách nạp cọc)'
                                  : currentStageMilestone.status === 'SUBMITTED'
                                  ? ' (Chờ khách nghiệm thu)'
                                  : ' (Đang thực hiện)'}
                              </span>
                            </>
                          ) : (
                            <span>Chưa bắt đầu</span>
                          )}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (collapsedMilestones.size > 0) {
                          setCollapsedMilestones(new Set());
                        } else {
                          setCollapsedMilestones(new Set(milestones.map((m) => m.id)));
                        }
                      }}
                      className="text-xs font-semibold text-stone-600 hover:text-[#A31D24] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {collapsedMilestones.size === milestones.length
                        ? 'Mở rộng chi tiết'
                        : 'Thu gọn tất cả'}
                    </button>
                  </div>

                  {/* Interactive Multi-Milestone Stepper Bar (when >= 2 milestones) */}
                  {milestones.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {milestones.map((m, idx) => {
                        const isDone = m.status === 'RELEASED' || m.status === 'APPROVED';
                        const isCurrent = currentStageMilestone?.id === m.id;
                        return (
                          <React.Fragment key={m.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setCollapsedMilestones((prev) => {
                                  const next = new Set(prev);
                                  next.delete(m.id);
                                  return next;
                                });
                              }}
                              className={cn(
                                'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0',
                                isCurrent
                                  ? 'bg-[#A31D24] text-white border-[#A31D24] shadow-2xs'
                                  : isDone
                                  ? 'bg-[#EAFCF1] text-[#16A34A] border-emerald-200/70'
                                  : 'bg-white text-stone-600 border-[#EBE4D8] hover:bg-stone-50'
                              )}
                            >
                              {isDone && <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />}
                              <span>Mốc #{m.orderNo}</span>
                              <span className="opacity-80 max-w-[120px] truncate">
                                • {m.title}
                              </span>
                            </button>
                            {idx < milestones.length - 1 && (
                              <div className="w-4 h-px bg-[#D5CFC5] shrink-0" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-3">
                    {milestones.map((m) => {
                      const workStatus = formatMilestoneWorkStatus(m.status);
                      const escrowStatus = formatMilestoneEscrowStatus(
                        m.escrowStatus || 'UNFUNDED'
                      );
                      const overdue = isMilestoneOverdue(m);
                      const revisionInfo = getMilestoneRevisionInfo(m);
                      const milestoneDispute = disputes.find((d) => d.milestoneId === m.id);
                      const isCollapsed = collapsedMilestones.has(m.id);
                      const isCurrentStage =
                        currentStageMilestone?.id === m.id &&
                        contract.status !== 'CANCELLED' &&
                        contract.status !== 'REJECTED' &&
                        contract.status !== 'COMPLETED';
                      const isDoneStage = m.status === 'RELEASED' || m.status === 'APPROVED';
                      const effectiveWorkVariant =
                        (m.status || '').toUpperCase() === 'CANCELLED'
                          ? 'default'
                          : workStatus.variant;

                      return (
                        <div
                          key={m.id}
                          className={cn(
                            'rounded-2xl border transition-all duration-150 bg-white overflow-hidden shadow-2xs',
                            milestoneDispute
                              ? 'border-rose-400'
                              : overdue
                              ? 'border-rose-300'
                              : isCurrentStage
                              ? 'border-[#A31D24]/40 ring-1 ring-[#A31D24]/10'
                              : 'border-[#EBE4D8] hover:border-[#D5CFC5]'
                          )}
                        >
                          {/* Milestone Header Bar */}
                          <div
                            onClick={() => toggleMilestoneCollapse(m.id)}
                            className="px-4 py-3.5 bg-white hover:bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0',
                                  isCurrentStage
                                    ? 'bg-[#A31D24] text-white shadow-2xs'
                                    : isDoneStage
                                    ? 'bg-[#EAFCF1] text-[#16A34A]'
                                    : 'bg-[#FDE9E9] text-[#A31D24]'
                                )}
                              >
                                #{m.orderNo}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-bold text-[#1C1615] truncate">
                                    {m.title}
                                  </h5>
                                  {isCurrentStage && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE9E9] text-[#A31D24] border border-rose-200/70 shrink-0 whitespace-nowrap">
                                      Đang ở mốc này
                                    </span>
                                  )}
                                  {milestoneDispute && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shrink-0 whitespace-nowrap">
                                      <ShieldAlert className="h-3 w-3" />
                                      {milestoneDispute.status === 'RESOLVED'
                                        ? 'Đã phân xử'
                                        : 'Đang tranh chấp'}
                                    </span>
                                  )}
                                  {overdue && !milestoneDispute && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 whitespace-nowrap">
                                      <AlertTriangle className="h-3 w-3" />
                                      Quá hạn
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                                  <span className="font-mono font-bold text-[#1C1615] tabular-nums">
                                    {formatVND(m.amount)}
                                  </span>
                                  <span>•</span>
                                  <span className="text-[#16A34A] font-medium font-mono tabular-nums">
                                    Thực nhận: {formatVND(m.netAmount || Math.round(m.amount * 0.95))}
                                  </span>
                                  <span>•</span>
                                  <span>{m.durationDays || 3} ngày</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {contract.status === 'PENDING' && m.status === 'WAITING' ? (
                                <Badge
                                  variant="pending"
                                  className="text-[11px] px-2.5 py-0.5 font-sans font-semibold whitespace-nowrap"
                                >
                                  Chờ khách duyệt lộ trình
                                </Badge>
                              ) : contract.status === 'REJECTED' && m.status === 'WAITING' ? (
                                <Badge
                                  variant="error"
                                  className="text-[11px] px-2.5 py-0.5 font-sans font-semibold whitespace-nowrap"
                                >
                                  Chờ cập nhật lộ trình
                                </Badge>
                              ) : isContractActive && m.status === 'WAITING' ? (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] px-2.5 py-0.5 font-sans font-medium whitespace-nowrap"
                                >
                                  Chờ mở khóa (sau Mốc #{Math.max(1, m.orderNo - 1)})
                                </Badge>
                              ) : (
                                <>
                                  <Badge
                                    variant={effectiveWorkVariant}
                                    className="text-[11px] px-2.5 py-0.5 font-sans font-semibold whitespace-nowrap"
                                  >
                                    {m.status === 'UNFUNDED' ? 'Chờ khách ký quỹ' : workStatus.label}
                                  </Badge>
                                  <Badge
                                    variant={escrowStatus.variant}
                                    className="text-[11px] px-2.5 py-0.5 font-sans font-medium whitespace-nowrap"
                                  >
                                    Ký quỹ: {escrowStatus.label}
                                  </Badge>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMilestoneCollapse(m.id);
                                }}
                                aria-label={
                                  isCollapsed
                                    ? `Mở rộng mốc #${m.orderNo}`
                                    : `Thu gọn mốc #${m.orderNo}`
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

                          {/* Milestone Expanded Details */}
                          {!isCollapsed && (
                            <div className="p-4 border-t border-[#EBE4D8] space-y-3.5 bg-[#FAF8F5]/50">
                              {/* 4-Column Metric Strip */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EBE4D8] rounded-xl border border-[#EBE4D8] bg-white">
                                <div className="p-3 space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                                    Giá trị mốc
                                  </span>
                                  <strong className="text-sm font-bold font-mono text-[#1C1615] tabular-nums block whitespace-nowrap">
                                    {formatVND(m.amount)}
                                  </strong>
                                </div>

                                <div className="p-3 space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                                    Thực nhận (95%)
                                  </span>
                                  <strong className="text-sm font-bold font-mono text-[#16A34A] tabular-nums block whitespace-nowrap">
                                    {formatVND(m.netAmount || Math.round(m.amount * 0.95))}
                                  </strong>
                                </div>

                                <div className="p-3 space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                                    Thời gian thực hiện
                                  </span>
                                  <strong className="text-sm font-bold text-[#1C1615] block whitespace-nowrap">
                                    {m.durationDays || 3} ngày
                                  </strong>
                                </div>

                                <div className="p-3 space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block whitespace-nowrap">
                                    Hạn mức chỉnh sửa
                                  </span>
                                  <strong className="text-sm font-bold text-[#1C1615] block whitespace-nowrap">
                                    {m.revisionsUsed || 0}/{m.maxRevisions || 2} lần (+2 ngày)
                                  </strong>
                                </div>
                              </div>

                              {/* Cam kết bàn giao (Clean White Card) */}
                              <div className="rounded-xl border border-[#EBE4D8] bg-white px-3.5 py-2.5 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                  Cam kết bàn giao giai đoạn #{m.orderNo}
                                </span>
                                <p className="text-xs sm:text-[13px] text-[#1C1615] leading-relaxed break-words whitespace-pre-line">
                                  {m.requirement || 'Chưa cập nhật chi tiết yêu cầu bàn giao.'}
                                </p>
                              </div>

                              {/* Dispute Alert Box */}
                              {milestoneDispute && (
                                <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-3.5 space-y-2 text-xs">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                                      Khiếu nại tranh chấp #{milestoneDispute.id} (Tiền bảo chứng: ĐÓNG BĂNG)
                                    </span>
                                    <Badge
                                      variant={
                                        milestoneDispute.status === 'RESOLVED' ? 'success' : 'error'
                                      }
                                      className="text-[10px]"
                                    >
                                      {milestoneDispute.status === 'RESOLVED'
                                        ? 'Đã giải quyết'
                                        : 'Chờ Admin phân xử'}
                                    </Badge>
                                  </div>

                                  <div className="space-y-1.5 text-rose-900">
                                    <p className="leading-relaxed">
                                      <strong>Lý do khiếu nại: </strong>
                                      <span>{milestoneDispute.reason}</span>
                                    </p>
                                    {(milestoneDispute.evidence ||
                                      (milestoneDispute.evidenceUrls &&
                                        milestoneDispute.evidenceUrls.length > 0)) && (
                                      <div className="text-[11px] text-stone-600 bg-white/70 p-2.5 rounded-lg border border-rose-150 break-words space-y-1.5">
                                        <div>
                                          <strong>Bằng chứng ban đầu: </strong>
                                          <span className="whitespace-pre-line">
                                            {stripUrlsFromText(milestoneDispute.evidence) ||
                                              'Đã đính kèm tệp bằng chứng bên dưới'}
                                          </span>
                                        </div>
                                        {extractUrlsFromText(
                                          milestoneDispute.evidence,
                                          milestoneDispute.evidenceUrls
                                        ).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-rose-100">
                                              {extractUrlsFromText(
                                                milestoneDispute.evidence,
                                                milestoneDispute.evidenceUrls
                                              ).map((url, idx) => (
                                                <a
                                                  key={idx}
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-[#A31D24] hover:bg-rose-100 transition-colors"
                                                >
                                                  <FileText className="h-3 w-3 shrink-0" />
                                                  <span className="truncate max-w-[180px]">
                                                    {url.split('/').pop() ||
                                                      `Tệp bằng chứng #${idx + 1}`}
                                                  </span>
                                                  <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                      </div>
                                    )}
                                    {milestoneDispute.counterEvidence ||
                                    (milestoneDispute.counterEvidenceUrls &&
                                      milestoneDispute.counterEvidenceUrls.length > 0) ? (
                                      <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-[11px] break-words space-y-1.5">
                                        <div>
                                          <strong className="text-emerald-800">
                                            Giải trình đối chất:{' '}
                                          </strong>
                                          <span className="whitespace-pre-line">
                                            {stripUrlsFromText(milestoneDispute.counterEvidence) ||
                                              'Đã đính kèm tệp đối chất bên dưới'}
                                          </span>
                                        </div>
                                        {extractUrlsFromText(
                                          milestoneDispute.counterEvidence,
                                          milestoneDispute.counterEvidenceUrls
                                        ).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-200/70">
                                              {extractUrlsFromText(
                                                milestoneDispute.counterEvidence,
                                                milestoneDispute.counterEvidenceUrls
                                              ).map(
                                                (url, idx) => (
                                                  <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 rounded-md bg-white border border-emerald-300 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                                                  >
                                                    <FileText className="h-3 w-3 shrink-0" />
                                                    <span className="truncate max-w-[180px]">
                                                      {url.split('/').pop() ||
                                                        `Tệp đối chất #${idx + 1}`}
                                                    </span>
                                                    <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                                                  </a>
                                                )
                                              )}
                                            </div>
                                          )}
                                        {milestoneDispute.status === 'OPEN' && (
                                          <div className="pt-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setSelectedDisputeForCounter(milestoneDispute)
                                              }
                                              className="h-7 px-2.5 text-[11px] rounded-lg border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold"
                                            >
                                              <ShieldCheck className="h-3 w-3 mr-1" />
                                              Bổ sung bằng chứng đối chất
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ) : milestoneDispute.status === 'OPEN' ? (
                                      <div className="pt-1">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            setSelectedDisputeForCounter(milestoneDispute)
                                          }
                                          className="h-8 px-3 text-xs rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] font-semibold shadow-2xs"
                                        >
                                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                          Gửi bằng chứng đối chất
                                        </Button>
                                      </div>
                                    ) : null}

                                    {milestoneDispute.status === 'RESOLVED' && (
                                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                                        <p className="font-bold">
                                          Quyết định của Admin: {milestoneDispute.result}
                                          {milestoneDispute.splitPercent != null &&
                                            ` (${milestoneDispute.splitPercent}%)`}
                                        </p>
                                        {milestoneDispute.resolution && (
                                          <p className="text-[11px] text-emerald-800 italic">
                                            &ldquo;{milestoneDispute.resolution}&rdquo;
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Overdue Alert Banner */}
                              {overdue && !milestoneDispute && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-start gap-2.5 text-xs text-rose-800">
                                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-rose-900">
                                      Giai đoạn này đã quá hạn bàn giao!
                                    </p>
                                    <p className="text-[11px] text-rose-700 leading-relaxed">
                                      Hạn chót ban đầu:{' '}
                                      {m.dueAt ? formatDateTime(m.dueAt) : 'Chưa xác định'}. Khách
                                      hàng có quyền hủy mốc này và nhận hoàn tiền 100%. Vui lòng
                                      nộp thành phẩm ngay.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Revision Request Banner */}
                              {revisionInfo.hasRevisions &&
                                revisionInfo.latestRevisionNote &&
                                !milestoneDispute && (
                                  <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3 space-y-1.5 text-xs text-amber-900">
                                    <div className="flex items-center justify-between font-bold text-amber-800 text-[11px]">
                                      <span className="flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                        Yêu cầu chỉnh sửa từ Khách hàng:
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

                              {/* Auto-Approval Notice */}
                              {m.status === 'SUBMITTED' && m.reviewDueAt && !milestoneDispute && (
                                <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-2.5 flex items-center justify-between gap-2 text-xs text-blue-900 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                                    <span>
                                      Đã nộp bài. Khách hàng có 3 ngày nghiệm thu (đến{' '}
                                      <strong>{formatDateTime(m.reviewDueAt)}</strong>).
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                                    Tự động duyệt sau 3 ngày
                                  </span>
                                </div>
                              )}

                              {/* 3-Day Safety Hold Notice */}
                              {m.status === 'APPROVED' &&
                                m.releaseAvailableAt &&
                                !milestoneDispute && (
                                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                      <span>
                                        Khách đã duyệt nghiệm thu! Đang tạm giữ an toàn 3 ngày (đến{' '}
                                        <strong>{formatDateTime(m.releaseAvailableAt)}</strong>).
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                      Tự động giải ngân 95%
                                    </span>
                                  </div>
                                )}

                              {/* Released Payout Confirmation */}
                              {m.escrowStatus === 'RELEASED' && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 flex items-center gap-2 text-xs text-emerald-900">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>
                                    Đã giải ngân thành công{' '}
                                    <strong>
                                      {formatVND(m.netAmount || Math.round(m.amount * 0.95))}
                                    </strong>{' '}
                                    (95%) vào số dư ví khả dụng của bạn.
                                  </span>
                                </div>
                              )}

                              {/* Milestone Reviews List */}
                              {m.reviews && m.reviews.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                    Đánh giá nghiệm thu ({m.reviews.length})
                                  </span>
                                  <div className="space-y-1.5">
                                    {m.reviews.map((rev) => (
                                      <div
                                        key={rev.id}
                                        className="p-2.5 rounded-lg bg-stone-50/80 border border-stone-200/60 text-xs space-y-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                              {(rev.reviewerFullName || 'K')[0].toUpperCase()}
                                            </div>
                                            <strong className="text-stone-800 truncate">
                                              {rev.reviewerFullName || 'Khán giả đánh giá'}
                                            </strong>
                                          </div>
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
                                          <p className="text-stone-600 text-[11px] italic bg-white/70 p-2 rounded border border-stone-150 break-words leading-relaxed">
                                            &ldquo;{rev.comment}&rdquo;
                                          </p>
                                        )}
                                        <span className="text-[9px] text-stone-400 font-mono block">
                                          {formatDateTime(rev.createdAt)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Milestone Action Buttons Row */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                                  {m.dueAt ? (
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                                      Hạn nộp:{' '}
                                      <strong className="text-stone-700">
                                        {formatDateTime(m.dueAt)}
                                      </strong>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-stone-400">
                                      Thời hạn tính từ lúc khách hàng ký quỹ mốc này
                                    </span>
                                  )}
                                  {m.reviewDueAt && m.status === 'SUBMITTED' && (
                                    <span className="flex items-center gap-1.5 text-amber-700 whitespace-nowrap">
                                      <Clock className="h-3.5 w-3.5" />
                                      Hạn khách duyệt: {formatDateTime(m.reviewDueAt)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {isNegotiating && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedMilestoneForEdit(m)}
                                        className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1 whitespace-nowrap"
                                      >
                                        <Edit3 className="h-3.5 w-3.5 text-stone-500" />
                                        <span>Sửa mốc</span>
                                      </Button>

                                      {milestones.length >= 2 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeleteMilestone(m.id)}
                                          disabled={deleteMilestoneMutation.isPending}
                                          className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-rose-700 hover:bg-rose-50 flex items-center gap-1 whitespace-nowrap"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          <span>Xóa mốc</span>
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedMilestoneForDeliverables(m)}
                                    className="h-8 px-3 text-xs rounded-xl border-stone-200 bg-white text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 font-medium whitespace-nowrap"
                                  >
                                    <FolderOpen className="h-3.5 w-3.5 text-stone-500" />
                                    <span>Tệp bàn giao</span>
                                  </Button>

                                  {m.status === 'IN_PROGRESS' && (
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedMilestoneForUpload(m)}
                                      className="h-8 px-3.5 text-xs rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                                    >
                                      <UploadCloud className="h-3.5 w-3.5" />
                                      <span>Nộp thành phẩm</span>
                                    </Button>
                                  )}

                                  {(m.status === 'APPROVED' || m.status === 'RELEASED') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedMilestoneForReview(m)}
                                      className="h-8 px-3 text-xs rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 flex items-center gap-1 font-medium whitespace-nowrap"
                                    >
                                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                      <span>Đánh giá</span>
                                    </Button>
                                  )}

                                  {!milestoneDispute &&
                                    (m.status === 'IN_PROGRESS' ||
                                      m.status === 'SUBMITTED' ||
                                      m.status === 'APPROVED') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedMilestoneForDispute(m)}
                                        className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-stone-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1 whitespace-nowrap"
                                        title="Khiếu nại tranh chấp giai đoạn này"
                                      >
                                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                        <span>Khiếu nại</span>
                                      </Button>
                                    )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub Modals */}
      <CreatorUploadDeliverableModal
        milestone={selectedMilestoneForUpload}
        isOpen={Boolean(selectedMilestoneForUpload)}
        onClose={() => setSelectedMilestoneForUpload(null)}
        onSuccess={() => {
          refetch();
          onMilestoneActionSuccess?.();
        }}
      />

      <CreatorDeliverablesListModal
        milestone={selectedMilestoneForDeliverables}
        isOpen={Boolean(selectedMilestoneForDeliverables)}
        onClose={() => setSelectedMilestoneForDeliverables(null)}
        onOpenUpload={() => {
          if (selectedMilestoneForDeliverables) {
            setSelectedMilestoneForUpload(selectedMilestoneForDeliverables);
          }
        }}
      />

      <CreatorMilestoneReviewModal
        milestone={selectedMilestoneForReview}
        isOpen={Boolean(selectedMilestoneForReview)}
        onClose={() => setSelectedMilestoneForReview(null)}
        onSuccess={() => {
          refetch();
          onMilestoneActionSuccess?.();
        }}
      />

      <CreatorEditSingleMilestoneModal
        milestone={selectedMilestoneForEdit}
        isOpen={Boolean(selectedMilestoneForEdit)}
        onClose={() => setSelectedMilestoneForEdit(null)}
        onSuccess={() => {
          refetch();
          onMilestoneActionSuccess?.();
        }}
      />

      <CreatorOpenDisputeModal
        milestone={selectedMilestoneForDispute}
        isOpen={Boolean(selectedMilestoneForDispute)}
        onClose={() => setSelectedMilestoneForDispute(null)}
        onSuccess={() => {
          refetch();
          refetchDisputes();
          onMilestoneActionSuccess?.();
        }}
      />

      <CreatorCounterEvidenceModal
        dispute={selectedDisputeForCounter}
        isOpen={Boolean(selectedDisputeForCounter)}
        onClose={() => setSelectedDisputeForCounter(null)}
        onSuccess={() => {
          refetch();
          refetchDisputes();
          onMilestoneActionSuccess?.();
        }}
      />

      {contract && (
        <CreatorMilestoneRoadmapModal
          existingContract={contract}
          isOpen={openEditRoadmap}
          onClose={() => setOpenEditRoadmap(false)}
          onSuccess={() => {
            refetch();
            onMilestoneActionSuccess?.();
          }}
        />
      )}
    </>
  );
};
