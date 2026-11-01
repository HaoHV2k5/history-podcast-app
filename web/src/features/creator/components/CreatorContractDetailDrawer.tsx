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
  Send,
  Radio,
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
import { chatsApi, ChatConversationItem } from '@/services/api/chats';
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

interface CreatorContractDetailDrawerProps {
  contractId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onMilestoneActionSuccess?: () => void;
}

export const CreatorContractDetailDrawer: React.FC<CreatorContractDetailDrawerProps> = ({
  contractId,
  isOpen,
  onClose,
  onMilestoneActionSuccess,
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

  // Chat 1-1 toggle state (User requirement: mặc định đóng, click vào mới mở ra)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<
    { id: string; sender: 'me' | 'partner'; text: string; time: string }[]
  >([
    {
      id: 'init-1',
      sender: 'partner',
      text: 'Chào bạn! Mình vừa gửi yêu cầu đặt sản xuất nội dung này, rất mong được kênh hỗ trợ.',
      time: '21:30',
    },
    {
      id: 'init-2',
      sender: 'me',
      text: 'Cảm ơn bạn! Mình đã nhận được yêu cầu và đang lên lộ trình chi tiết. Mình sẽ gửi bảng Milestone sớm nhất cho bạn ạ.',
      time: '21:36',
    },
  ]);

  // Collapsible Milestones: In-progress stage is expanded by default, others collapsed
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

  // Fetch Conversation Info for Chat 1-1
  const { data: chatRes } = useQuery({
    queryKey: ['chat-conversation', contractId],
    queryFn: () =>
      chatsApi.getOrCreateConversation({
        contractId: contractId || undefined,
      }),
    enabled: Boolean(contractId) && isOpen,
  });

  const contract: ContractItem | null = response?.data || null;
  const milestones: MilestoneItem[] = contract?.milestones || [];
  const rawDisputes = disputesRes?.data;
  const disputes: DisputeItem[] = Array.isArray(rawDisputes) ? rawDisputes : [];
  const conversation: ChatConversationItem | null = chatRes?.data || null;

  // Set default collapsed milestones once data arrives
  useEffect(() => {
    if (milestones.length > 0) {
      const initialCollapsed = new Set<number>();
      let hasFoundActive = false;
      milestones.forEach((m) => {
        if (m.status === 'IN_PROGRESS' && !hasFoundActive) {
          hasFoundActive = true;
          // Keep active stage open
        } else if (!hasFoundActive && m === milestones[0]) {
          // If none in-progress yet, keep stage 1 open
        } else {
          initialCollapsed.add(m.id);
        }
      });
      setCollapsedMilestones(initialCollapsed);
    }
  }, [contract?.id]);

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
    if (window.confirm('Bạn có chắc chắn muốn xóa giai đoạn này và tự động đánh số lại các mốc còn lại?')) {
      deleteMilestoneMutation.mutate(milestoneId);
    }
  };

  const handleCancelContract = () => {
    if (!contract) return;
    if (window.confirm('Bạn có chắc chắn muốn hủy hợp đồng này trước khi khán giả nạp cọc? Thao tác này sẽ giải phóng slot đặt hàng.')) {
      cancelContractMutation.mutate(contract.id);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'me',
        text: chatInputText.trim(),
        time: timeStr,
      },
    ]);
    setChatInputText('');
  };

  const isNegotiating = contract?.status === 'PENDING' || contract?.status === 'REJECTED';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          maxWidth={isChatOpen ? 'max-w-7xl' : 'max-w-5xl'}
          className={cn(
            'w-[96vw] max-h-[92vh] overflow-hidden p-0 bg-white rounded-[28px] sm:rounded-[32px] border border-stone-200/90 shadow-2xl font-sans z-[60] flex flex-col [&>button:last-child]:hidden transition-all duration-300',
            isChatOpen ? 'max-w-7xl' : 'max-w-5xl'
          )}
        >
          {/* Top Floating Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute top-4 right-4 z-30 h-8 w-8 rounded-full bg-[#FAF9F6] border border-stone-200/80 hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Loading State */}
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-2.5 text-xs text-stone-400">
              <RefreshCw className="h-7 w-7 animate-spin text-[#A31D24]" />
              <span className="font-sans font-medium text-stone-600">Đang tải thông tin chi tiết lộ trình hợp đồng...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-6 m-6 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center justify-between font-sans">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#A31D24] shrink-0" />
                <span>Không thể tải chi tiết hợp đồng #{contractId}. Vui lòng thử lại.</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 text-xs font-semibold">
                Thử lại
              </Button>
            </div>
          )}

          {/* Action Error Banner */}
          {actionError && (
            <div className="mx-6 mt-4 p-3.5 text-xs text-rose-900 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-sans">
              <AlertCircle className="h-4 w-4 text-[#A31D24] shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Main Layout: Split Screen (Left Contract & Milestones, Right Collapsible Chat 1-1) */}
          {!isLoading && contract && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* ─── LEFT COLUMN: CONTRACT OVERVIEW & MILESTONES ROADMAP ──── */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 min-w-0">
                {/* 1. Header Row */}
                <div className="space-y-2 pb-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider bg-[#FFF0F0] text-[#A31D24] border border-[#FECDD3]">
                      <FileText className="h-3.5 w-3.5" />
                      HỢP ĐỒNG #{contract.id}
                    </span>

                    {/* Action buttons on header */}
                    <div className="flex items-center gap-2 flex-wrap pr-8">
                      {/* Chat 1-1 Toggle Tab (User requirement: click vào mới mở ra) */}
                      <button
                        type="button"
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={cn(
                          'inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs font-sans active:scale-[0.98]',
                          isChatOpen
                            ? 'bg-[#FFF0F0] border-[#FECDD3] text-[#A31D24]'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                        )}
                        title={isChatOpen ? 'Thu gọn phòng Chat 1-1' : 'Mở phòng Chat 1-1'}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#A31D24]" />
                        <span>Phòng Chat 1-1</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                      </button>

                      {/* Negotiating Action Buttons */}
                      {isNegotiating && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenEditRoadmap(true)}
                            className="h-8 px-3 text-xs rounded-xl border-stone-200 bg-white text-[#A31D24] hover:bg-rose-50 flex items-center gap-1.5 font-semibold active:scale-[0.98]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Sửa toàn bộ lộ trình</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelContract}
                            disabled={cancelContractMutation.isPending}
                            className="h-8 px-3 text-xs rounded-xl border-stone-200 bg-white text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 font-semibold active:scale-[0.98]"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span>Hủy hợp đồng</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <DialogTitle className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight leading-snug">
                    {contract.title || 'Chi tiết Hợp đồng Lộ trình Milestone'}
                  </DialogTitle>

                  <DialogDescription className="text-xs sm:text-[13px] text-stone-500 font-sans leading-relaxed">
                    Khách hàng đặt nội dung:{' '}
                    <strong className="text-stone-800 font-semibold">
                      {contract.requesterFullName || contract.freelancerFullName || 'Khán giả'}
                    </strong>
                    {contract.requesterEmail && (
                      <span className="text-stone-500"> ({contract.requesterEmail})</span>
                    )}
                  </DialogDescription>
                </div>

                {/* 2. Four KPI / Stat Cards (Exact match from reference image) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Card 1: Tổng giá trị (Khách trả) */}
                  <div className="rounded-2xl border border-stone-200/80 bg-[#FAF9F6] p-4 space-y-1 shadow-2xs">
                    <span className="text-xs text-stone-500 font-sans block truncate">
                      Tổng giá trị (Khách trả)
                    </span>
                    <span className="text-base sm:text-lg font-bold font-sans text-stone-900 block truncate">
                      {formatVND(contract.totalAmount || 0)}
                    </span>
                    <span className="text-[11px] text-stone-400 font-sans block truncate">
                      {milestones.length} giai đoạn
                    </span>
                  </div>

                  {/* Card 2: Phí nền tảng (5%) */}
                  <div className="rounded-2xl border border-rose-200/60 bg-rose-50/40 p-4 space-y-1 shadow-2xs">
                    <span className="text-xs text-rose-800 font-sans block truncate flex items-center gap-1">
                      <span className="font-bold font-mono">%</span> Phí nền tảng (5%)
                    </span>
                    <span className="text-base sm:text-lg font-bold font-sans text-rose-700 block truncate">
                      {formatVND(contract.platformFee || Math.round((contract.totalAmount || 0) * 0.05))}
                    </span>
                    <span className="text-[11px] text-rose-600/80 font-sans block truncate">
                      Thu khi giải ngân
                    </span>
                  </div>

                  {/* Card 3: Creator thực nhận (95%) */}
                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
                    <span className="text-xs text-emerald-800 font-sans block truncate">
                      Creator thực nhận (95%)
                    </span>
                    <span className="text-base sm:text-lg font-bold font-sans text-emerald-700 block truncate">
                      {formatVND(contract.netAmount || Math.round((contract.totalAmount || 0) * 0.95))}
                    </span>
                    <span className="text-[11px] text-emerald-600/80 font-sans block truncate">
                      Vào ví khả dụng
                    </span>
                  </div>

                  {/* Card 4: Trạng thái hợp đồng */}
                  <div className="rounded-2xl border border-stone-200/80 bg-[#FAF9F6] p-4 space-y-1 shadow-2xs">
                    <span className="text-xs text-stone-500 font-sans block truncate">
                      Trạng thái hợp đồng
                    </span>
                    <div className="pt-0.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-sans bg-stone-200/80 text-stone-800">
                        {contract.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-sans block truncate pt-0.5">
                      Tạo: {formatDate(contract.createdAt)}
                    </span>
                  </div>
                </div>

                {/* 3. Ghi chú & Thỏa thuận */}
                {contract.description && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-stone-800 font-sans">
                      Ghi chú &amp; Thỏa thuận
                    </h4>
                    <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3.5 text-xs sm:text-[13px] text-stone-700 leading-relaxed font-sans break-words shadow-2xs">
                      {contract.description}
                    </div>
                  </div>
                )}

                {/* 4. Quy định Escrow Bar */}
                <div className="p-3 rounded-xl border border-stone-200/80 bg-[#FAF9F6] flex flex-wrap items-center gap-2 text-xs font-sans shadow-2xs">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="h-4 w-4 text-[#A31D24]" />
                    Quy định Escrow:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-stone-200 text-stone-700 shadow-2xs">
                    Tối đa 2 lần sửa miễn phí (+2 ngày/lần)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-stone-200 text-stone-700 shadow-2xs">
                    Tự động duyệt sau 3 ngày
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-stone-200 text-stone-700 shadow-2xs">
                    Hoàn 100% nếu Creator trễ hạn
                  </span>
                </div>

                {/* 5. Section: Tiến độ từng giai đoạn (Collapsible Cards per Stage) */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 font-sans flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#A31D24]" />
                      <span>Tiến độ từng giai đoạn ({milestones.length} mốc)</span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {milestones.map((m) => {
                      const workStatus = formatMilestoneWorkStatus(m.status);
                      const escrowStatus = formatMilestoneEscrowStatus(m.escrowStatus);
                      const overdue = isMilestoneOverdue(m);
                      const revisionInfo = getMilestoneRevisionInfo(m);
                      const milestoneDispute = disputes.find((d) => d.milestoneId === m.id);
                      const isCollapsed = collapsedMilestones.has(m.id);

                      return (
                        <div
                          key={m.id}
                          className={cn(
                            'rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all duration-200 bg-white hover:border-stone-300 space-y-3',
                            milestoneDispute
                              ? 'border-rose-400 bg-rose-50/20'
                              : overdue
                                ? 'border-rose-300 bg-rose-50/10'
                                : revisionInfo.hasRevisions && m.status === 'IN_PROGRESS'
                                  ? 'border-amber-300/80 bg-amber-50/10'
                                  : 'border-stone-200/90'
                          )}
                        >
                          {/* Card Header Row: Badge #OrderNo + Title + Badges + Chevron Toggle */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-sans bg-stone-100 text-stone-800 border border-stone-200/80 shrink-0">
                                #{m.orderNo}
                              </span>
                              <h5 className="text-sm font-bold text-stone-900 font-sans truncate">
                                {m.title}
                              </h5>

                              {milestoneDispute && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shrink-0">
                                  <ShieldAlert className="h-3 w-3" />
                                  {milestoneDispute.status === 'RESOLVED' ? 'Đã phân xử' : 'FROZEN'}
                                </span>
                              )}
                              {overdue && !milestoneDispute && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                                  <AlertTriangle className="h-3 w-3" />
                                  Quá hạn
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={workStatus.variant} className="text-[10px] px-2.5 py-0.5 font-sans font-semibold">
                                • {workStatus.label}
                              </Badge>
                              <Badge variant={escrowStatus.variant} className="text-[10px] px-2.5 py-0.5 font-sans font-medium">
                                Escrow: {escrowStatus.label}
                              </Badge>

                              {/* Collapse / Expand Arrow Button (User requirement) */}
                              <button
                                type="button"
                                onClick={() => toggleMilestoneCollapse(m.id)}
                                aria-label={isCollapsed ? `Mở rộng mốc #${m.orderNo}` : `Thu gọn mốc #${m.orderNo}`}
                                className="h-7 w-7 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-[0.96] ml-1"
                                title={isCollapsed ? 'Mở rộng giai đoạn này' : 'Thu gọn giai đoạn này'}
                              >
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 transition-transform duration-200 text-stone-600',
                                    isCollapsed && '-rotate-90'
                                  )}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {!isCollapsed && (
                            <div className="space-y-3.5 pt-2 border-t border-stone-100 animate-in fade-in-50 duration-200">
                              {/* Cam kết bàn giao */}
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-stone-600 font-sans">
                                  Cam kết bàn giao:
                                </span>
                                <p className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/70 text-xs sm:text-[13px] text-stone-800 leading-relaxed font-sans break-words shadow-2xs">
                                  {m.requirement || 'Chưa cập nhật chi tiết yêu cầu'}
                                </p>
                              </div>

                              {/* 4 Stat Boxes (Giá trị, Thực nhận, Thời gian, Lượt sửa) */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-xl border border-stone-200/70 bg-[#FAF9F6] p-2.5 space-y-0.5">
                                  <span className="text-[11px] text-stone-500 font-sans block">Giá trị mốc:</span>
                                  <strong className="text-sm font-bold font-sans text-stone-900 block">
                                    {formatVND(m.amount)}
                                  </strong>
                                </div>

                                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-2.5 space-y-0.5">
                                  <span className="text-[11px] text-emerald-800 font-sans block">Thực nhận (95%):</span>
                                  <strong className="text-sm font-bold font-sans text-emerald-700 block">
                                    {formatVND(m.netAmount || Math.round(m.amount * 0.95))}
                                  </strong>
                                </div>

                                <div className="rounded-xl border border-stone-200/70 bg-[#FAF9F6] p-2.5 space-y-0.5">
                                  <span className="text-[11px] text-stone-500 font-sans block">Thời gian:</span>
                                  <span className="text-sm font-semibold font-sans text-stone-800 block">
                                    {m.durationDays || 3} ngày
                                  </span>
                                </div>

                                <div className="rounded-xl border border-stone-200/70 bg-[#FAF9F6] p-2.5 space-y-0.5">
                                  <span className="text-[11px] text-stone-500 font-sans block">Lượt sửa:</span>
                                  <span className="text-sm font-semibold font-sans text-stone-800 block">
                                    {m.revisionsUsed || 0}/{m.maxRevisions || 2} lần (+2 ngày/lần)
                                  </span>
                                </div>
                              </div>

                              {/* Dispute Alert Box */}
                              {milestoneDispute && (
                                <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-3.5 space-y-2 text-xs font-sans">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                                      Khiếu nại tranh chấp #{milestoneDispute.id} (Tiền bảo chứng: ĐÓNG BĂNG)
                                    </span>
                                    <Badge
                                      variant={milestoneDispute.status === 'RESOLVED' ? 'success' : 'error'}
                                      className="text-[10px]"
                                    >
                                      {milestoneDispute.status === 'RESOLVED' ? 'Đã giải quyết' : 'Chờ Admin phân xử'}
                                    </Badge>
                                  </div>

                                  <div className="space-y-1.5 text-rose-900">
                                    <p className="leading-relaxed">
                                      <strong>Lý do khiếu nại: </strong>
                                      <span>{milestoneDispute.reason}</span>
                                    </p>
                                    {milestoneDispute.evidence && (
                                      <p className="text-[11px] text-stone-600 bg-white/70 p-2 rounded-lg border border-rose-150 break-words">
                                        <strong>Bằng chứng ban đầu: </strong>
                                        {milestoneDispute.evidence}
                                      </p>
                                    )}
                                    {milestoneDispute.counterEvidence ? (
                                      <div className="p-2 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-[11px] break-words">
                                        <strong className="text-emerald-800">Giải trình đối chất: </strong>
                                        <span>{milestoneDispute.counterEvidence}</span>
                                      </div>
                                    ) : milestoneDispute.status === 'OPEN' ? (
                                      <div className="pt-1">
                                        <Button
                                          size="sm"
                                          onClick={() => setSelectedDisputeForCounter(milestoneDispute)}
                                          className="h-8 px-3 text-xs rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] font-semibold shadow-2xs active:scale-[0.98] transition-all"
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
                                          {milestoneDispute.splitPercent != null && ` (${milestoneDispute.splitPercent}%)`}
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
                                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 flex items-start gap-2.5 text-xs text-rose-800 font-sans">
                                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-rose-900">
                                      Giai đoạn này đã quá hạn bàn giao!
                                    </p>
                                    <p className="text-[11px] text-rose-700 leading-relaxed">
                                      Hạn chót ban đầu: {m.dueAt ? formatDateTime(m.dueAt) : 'Chưa xác định'}. Khách hàng có quyền hủy mốc này và nhận hoàn tiền 100%. Vui lòng nộp thành phẩm ngay.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Revision Request Banner */}
                              {revisionInfo.hasRevisions && revisionInfo.latestRevisionNote && !milestoneDispute && (
                                <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3 space-y-1.5 text-xs text-amber-900 font-sans">
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
                                <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-2.5 flex items-center justify-between gap-2 text-xs text-blue-900 flex-wrap font-sans">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                                    <span>
                                      Đã nộp bài. Khách hàng có 3 ngày nghiệm thu (đến <strong>{formatDateTime(m.reviewDueAt)}</strong>).
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                                    Tự động duyệt sau 3 ngày
                                  </span>
                                </div>
                              )}

                              {/* 3-Day Safety Hold Notice */}
                              {m.status === 'APPROVED' && m.releaseAvailableAt && !milestoneDispute && (
                                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900 flex-wrap font-sans">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>
                                      Khách đã duyệt nghiệm thu! Đang tạm giữ an toàn 3 ngày (đến <strong>{formatDateTime(m.releaseAvailableAt)}</strong>).
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                    Tự động giải ngân 95%
                                  </span>
                                </div>
                              )}

                              {/* Released Payout Confirmation */}
                              {m.escrowStatus === 'RELEASED' && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 flex items-center gap-2 text-xs text-emerald-900 font-sans">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>
                                    Đã giải ngân thành công <strong>{formatVND(m.netAmount || Math.round(m.amount * 0.95))}</strong> (95%) vào số dư ví khả dụng của bạn.
                                  </span>
                                </div>
                              )}

                              {/* Milestone Reviews List */}
                              {m.reviews && m.reviews.length > 0 && (
                                <div className="space-y-1.5 pt-1 font-sans">
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

                              {/* Milestone Action Buttons Row (Exact match from reference) */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap font-sans">
                                  {m.dueAt && (
                                    <span className="flex items-center gap-1.5 font-sans">
                                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                                      Hạn nộp: <strong className="text-stone-700">{formatDateTime(m.dueAt)}</strong>
                                    </span>
                                  )}
                                  {m.reviewDueAt && m.status === 'SUBMITTED' && (
                                    <span className="flex items-center gap-1.5 text-amber-700 font-sans">
                                      <Clock className="h-3.5 w-3.5" />
                                      Hạn khách duyệt: {formatDateTime(m.reviewDueAt)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* In negotiating mode: Creator can edit or delete this milestone */}
                                  {isNegotiating && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedMilestoneForEdit(m)}
                                        className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1 active:scale-[0.98] transition-all font-sans"
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
                                          className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-rose-700 hover:bg-rose-50 flex items-center gap-1 active:scale-[0.98] transition-all font-sans"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          <span>Xóa mốc</span>
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {/* View Deliverables */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedMilestoneForDeliverables(m)}
                                    className="h-8 px-3 text-xs rounded-xl border-stone-200 bg-white text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-2xs font-sans font-medium"
                                  >
                                    <FolderOpen className="h-3.5 w-3.5 text-stone-500" />
                                    <span>Tệp bàn giao</span>
                                  </Button>

                                  {/* Upload Deliverable Button (Primary Red #A31D24) */}
                                  {m.status === 'IN_PROGRESS' && (
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedMilestoneForUpload(m)}
                                      className="h-8 px-3.5 text-xs rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] font-semibold flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all font-sans"
                                    >
                                      <UploadCloud className="h-3.5 w-3.5" />
                                      <span>Nộp thành phẩm</span>
                                    </Button>
                                  )}

                                  {/* Review Milestone Button */}
                                  {(m.status === 'APPROVED' || m.status === 'RELEASED') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedMilestoneForReview(m)}
                                      className="h-8 px-3 text-xs rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 flex items-center gap-1 active:scale-[0.98] transition-all font-sans font-medium"
                                    >
                                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                      <span>Đánh giá</span>
                                    </Button>
                                  )}

                                  {/* Open Dispute Button */}
                                  {!milestoneDispute &&
                                    (m.status === 'IN_PROGRESS' ||
                                      m.status === 'SUBMITTED' ||
                                      m.status === 'APPROVED') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedMilestoneForDispute(m)}
                                        className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-stone-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1 active:scale-[0.98] transition-all font-sans"
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

              {/* ─── RIGHT COLUMN: COLLAPSIBLE CHAT 1-1 PANEL ─────────────── */}
              {isChatOpen && (
                <div className="w-full lg:w-[410px] xl:w-[440px] shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200/80 flex flex-col bg-stone-50/40 animate-in slide-in-from-right-4 duration-300">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-stone-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-[#FFF0F0] border border-[#FECDD3] flex items-center justify-center shrink-0 text-[#A31D24] font-sans font-bold text-sm shadow-2xs">
                        {conversation?.partnerAvatarUrl ? (
                          <img
                            src={conversation.partnerAvatarUrl}
                            alt={conversation.partnerName || 'Khán giả'}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          (contract.requesterFullName || conversation?.partnerName || 'K')[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 font-sans truncate">
                            {contract.requesterEmail || conversation?.partnerEmail || 'customer@example.com'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 font-medium">
                            • Đã mở khóa
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-sans truncate block pt-0.5">
                          {contract.title}
                        </span>
                      </div>
                    </div>

                    {/* Minimize Chat Button */}
                    <button
                      type="button"
                      onClick={() => setIsChatOpen(false)}
                      className="h-7 w-7 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Thu gọn phòng chat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Chat Negotiation Notice Banner (Exact match from design) */}
                  <div className="p-3.5 m-3.5 rounded-xl border border-amber-200/80 bg-amber-50/70 text-xs text-amber-900 space-y-1 font-sans shrink-0 shadow-2xs">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-800 text-xs">
                      <Radio className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Quy tắc thương lượng bảo chứng Escrow:</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Hai bên thống nhất kịch bản, thời gian và số chặng Milestone tại đây. Sau khi chốt, Creator bấm &ldquo;Lập lộ trình&rdquo; để gửi bảng giá và các giai đoạn cho khách hàng ký quỹ.
                    </p>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                    <div className="flex justify-center my-1">
                      <span className="px-3 py-0.5 rounded-full bg-stone-200/70 text-stone-600 text-[10px] font-sans">
                        Hôm nay
                      </span>
                    </div>

                    {localMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-2xs break-words font-sans ${
                            msg.sender === 'me'
                              ? 'bg-[#A31D24] text-white rounded-br-xs'
                              : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-stone-400 font-sans px-1">
                          {msg.time}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-3 border-t border-stone-200/80 bg-white flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Nhập tin nhắn trao đổi kịch bản, yêu cầu kỹ thuật..."
                      className="flex-1 h-9 px-3 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden font-sans transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim()}
                      className="h-9 px-4 rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] disabled:opacity-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-sans shrink-0 active:scale-[0.98]"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Gửi</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
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
