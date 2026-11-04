import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Trash2,
  Coins,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  Calendar,
  CheckCircle2,
  Info,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { contractsApi } from '@/services/api/contracts';
import { bookingEscrowApi } from '@/services/api/bookingEscrow';
import { chatsApi } from '@/services/api/chats';
import { useAuthStore } from '@/store/authStore';
import { CommissionItem } from '@/types/commission';
import { ContractItem, MilestoneItemPayload } from '@/types/contract';
import { formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface CreatorMilestoneRoadmapModalProps {
  commission?: CommissionItem | null;
  existingContract?: ContractItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contract: ContractItem) => void;
}

export const CreatorMilestoneRoadmapModal: React.FC<CreatorMilestoneRoadmapModalProps> = ({
  commission,
  existingContract,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Fetch dynamic policy parameters from system backend
  const { data: policyData } = useQuery({
    queryKey: ['public-booking-escrow-policy'],
    queryFn: () => bookingEscrowApi.getPublicPolicy(),
    staleTime: 1000 * 60 * 10,
  });

  const policy = policyData?.data;
  const maxMilestones = policy?.maxMilestones || 20;
  const platformFeePercent = policy?.platformFeePercent != null ? policy.platformFeePercent : 5.0;
  const feeRate = platformFeePercent / 100;
  const minMilestoneAmount = policy?.depositMinAmount || 10000;

  // Form State
  const [contractTitle, setContractTitle] = useState('');
  const [contractDescription, setContractDescription] = useState('');
  const [milestones, setMilestones] = useState<MilestoneItemPayload[]>([
    {
      title: 'Giai đoạn 1: Đề cương & Kịch bản phân cảnh',
      requirement: 'Bản giao file kịch bản PDF chi tiết các phân đoạn lịch sử',
      amount: 500000,
      durationDays: 3,
    },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Collapse / Expand state for individual milestone cards
  const [collapsedIndices, setCollapsedIndices] = useState<Set<number>>(new Set());

  const toggleCollapse = (index: number) => {
    setCollapsedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Initialize or populate from existing contract / commission
  useEffect(() => {
    if (existingContract) {
      setContractTitle(existingContract.title || '');
      setContractDescription(existingContract.description || '');
      if (existingContract.milestones && existingContract.milestones.length > 0) {
        setMilestones(
          existingContract.milestones.map((m) => ({
            title: m.title || '',
            requirement: m.requirement || '',
            amount: m.amount || 0,
            durationDays: m.durationDays || 3,
          }))
        );
      }
      setCollapsedIndices(new Set());
    } else if (commission) {
      setContractTitle(
        commission.title ? `Hợp đồng sản xuất: ${commission.title}` : 'Hợp đồng sản xuất'
      );
      setContractDescription(
        commission.description ? `Dựa trên yêu cầu: ${commission.description}` : ''
      );
      setMilestones([
        {
          title: 'Giai đoạn 1: Đề cương & Kịch bản phân cảnh',
          requirement: 'Bản giao file kịch bản PDF chi tiết các phân đoạn lịch sử',
          amount: 500000,
          durationDays: 3,
        },
      ]);
      setCollapsedIndices(new Set());
    }
  }, [existingContract, commission, isOpen]);

  // Real-time financial calculations
  const totalGrossAmount = useMemo(() => {
    return milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [milestones]);

  const totalPlatformFee = useMemo(() => {
    return Math.round(totalGrossAmount * feeRate);
  }, [totalGrossAmount, feeRate]);

  const totalNetCreator = useMemo(() => {
    return totalGrossAmount - totalPlatformFee;
  }, [totalGrossAmount, totalPlatformFee]);

  // Add / Remove / Update milestones
  const handleAddMilestone = () => {
    if (milestones.length >= maxMilestones) return;
    const nextIdx = milestones.length + 1;
    setMilestones((prev) => [
      ...prev,
      {
        title: `Giai đoạn ${nextIdx}: `,
        requirement: '',
        amount: 500000,
        durationDays: 3,
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length <= 1) {
      setFormError('Lộ trình cần ít nhất 01 giai đoạn Milestone.');
      return;
    }
    setFormError(null);
    setMilestones((prev) => prev.filter((_, i) => i !== index));
    setCollapsedIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const handleUpdateMilestone = (
    index: number,
    field: keyof MilestoneItemPayload,
    value: string | number
  ) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  // Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!contractTitle.trim()) {
        throw new Error('Vui lòng nhập tiêu đề lộ trình hợp đồng.');
      }
      if (milestones.length === 0) {
        throw new Error('Cần ít nhất 01 giai đoạn Milestone.');
      }
      if (milestones.length > maxMilestones) {
        throw new Error(`Tối đa chỉ được tạo ${maxMilestones} giai đoạn Milestone.`);
      }

      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (!m.title.trim()) {
          throw new Error(`Giai đoạn #${i + 1} chưa có tiêu đề.`);
        }
        if (!m.requirement.trim()) {
          throw new Error(`Giai đoạn #${i + 1} chưa có mô tả cam kết bàn giao.`);
        }
        if (Number(m.amount) < minMilestoneAmount) {
          throw new Error(
            `Số tiền giai đoạn #${i + 1} tối thiểu phải là ${formatVND(minMilestoneAmount)}.`
          );
        }
        if (Number(m.durationDays) < 1) {
          throw new Error(`Thời gian thực hiện giai đoạn #${i + 1} tối thiểu là 1 ngày.`);
        }
      }

      if (existingContract?.id) {
        return contractsApi.updatePendingContract(existingContract.id, {
          title: contractTitle.trim(),
          description: contractDescription.trim(),
          milestones,
        });
      } else {
        const commissionId = commission?.id || existingContract?.hireRequestId;
        if (!commissionId) {
          throw new Error('Không xác định được ID đơn đặt hàng.');
        }
        const requesterId =
          commission?.requesterId ||
          commission?.narratorId ||
          existingContract?.requesterId ||
          existingContract?.freelancerId;
        return contractsApi.createContract({
          hireRequestId: commissionId,
          commissionId,
          requesterId,
          title: contractTitle.trim(),
          description: contractDescription.trim(),
          milestones,
        });
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      queryClient.invalidateQueries({ queryKey: ['creator-commissions-received'] });
      queryClient.invalidateQueries({ queryKey: ['creator-my-milestones'] });
      setFormError(null);
      onClose();

      const savedContract = res.data;
      if (savedContract) {
        // Automatically notify customer in Firestore Chat so Viewer knows to inspect & fund the roadmap
        void (async () => {
          try {
            const convRes = await chatsApi.getOrCreateConversation({
              contractId: savedContract.id,
              hireRequestId:
                savedContract.commissionId ||
                commission?.id ||
                existingContract?.hireRequestId,
            });
            const convId =
              convRes?.data?.conversationId ||
              (savedContract.commissionId
                ? `hire_request_${savedContract.commissionId}`
                : `contract_${savedContract.id}`);
            const stageCount = savedContract.milestones?.length || milestones.length;
            const grossVal = savedContract.totalAmount || totalGrossAmount;
            const autoNoticeText = existingContract
              ? `🔄 Mình vừa cập nhật lại lộ trình Hợp đồng #${savedContract.id} "${savedContract.title}" (${stageCount} giai đoạn • Tổng giá trị: ${formatVND(grossVal)}). Bạn vui lòng vào mục Hợp đồng để xem chi tiết và xác nhận ký quỹ nhé!`
              : `📋 Mình đã lập lộ trình Hợp đồng #${savedContract.id} "${savedContract.title}" gồm ${stageCount} giai đoạn (Tổng giá trị: ${formatVND(grossVal)}). Bạn vui lòng mở mục Hợp đồng để kiểm tra chi tiết từng mốc và xác nhận ký quỹ nhé!`;

            await chatsApi.sendFirestoreMessage(convId, {
              senderId: Number(user?.id) || 0,
              senderRole: 'CREATOR',
              senderName: user?.fullName || user?.email || 'Nhà sáng tạo',
              text: autoNoticeText,
            });
          } catch {
            // Non-blocking notification
          }
        })();

        onSuccess?.(savedContract);
      }
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setFormError(
        err.response?.data?.message || err.message || 'Lỗi khi lưu lộ trình Milestone.'
      );
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-2xl"
        className="w-[95vw] sm:w-full max-h-[88vh] p-0 overflow-hidden bg-[#FBF8F3] rounded-2xl border border-[#E5DEC9] shadow-2xl font-sans flex flex-col z-[70] [&>button:last-child]:hidden"
      >
        {/* ─── 1. STICKY HEADER ─────────────── */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-[#EBE4D8] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#FDE9E9] border border-rose-200/70 flex items-center justify-center text-[#A31D24] shrink-0 mt-0.5">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A31D24]">
                THIẾT LẬP LỘ TRÌNH MILESTONE
              </span>
              <DialogTitle className="text-base sm:text-lg font-bold font-serif text-[#1C1615] tracking-tight leading-snug">
                {existingContract
                  ? `Chỉnh sửa Lộ trình Hợp đồng #${existingContract.id}`
                  : 'Lập Lộ trình Milestone Tổng (Hợp đồng)'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#685D4F] leading-relaxed">
                Thiết lập từ 1 đến tối đa {maxMilestones} giai đoạn bàn giao. Khách hàng duyệt lộ trình tổng và nạp cọc cuốn chiếu từng giai đoạn.
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="h-8 w-8 rounded-lg bg-[#FAF8F4] border border-[#EBE4D8] hover:bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─── 2. SCROLLABLE FORM BODY & STICKY FOOTER ──────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
            {/* Contract Overview Card (Title & General Agreement Note) */}
            <div className="rounded-xl bg-white border border-[#EBE4D8] p-4 space-y-3.5 shadow-2xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E1810]">
                  Tên hợp đồng sản xuất <span className="text-[#A31D24]">*</span>
                </label>
                <input
                  type="text"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  placeholder="Ví dụ: Hợp đồng sản xuất Series 3 tập: Chiến thắng Bạch Đằng"
                  className="w-full text-xs sm:text-[13px] h-10 px-3.5 rounded-xl border border-[#DDD4C2] bg-white text-[#1E1810] font-medium placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E1810]">
                  Ghi chú &amp; Thỏa thuận chung
                </label>
                <textarea
                  rows={2}
                  value={contractDescription}
                  onChange={(e) => setContractDescription(e.target.value)}
                  placeholder="Ghi chú phạm vi sản xuất, phong cách dựng video/audio hoặc các thỏa thuận bổ sung với khách hàng..."
                  className="w-full text-xs sm:text-[13px] p-3 rounded-xl border border-[#DDD4C2] bg-[#FAF8F4] focus:bg-white text-[#1E1810] placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all leading-relaxed resize-y"
                />
              </div>
            </div>

            {/* ─── 3. DANH SÁCH GIAI ĐOẠN MILESTONE ───────────────────────────── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#A31D24] shrink-0" />
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E1810]">
                    Danh sách giai đoạn Milestone ({milestones.length}/{maxMilestones})
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={handleAddMilestone}
                  disabled={milestones.length >= maxMilestones}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#FDE9E9] border border-rose-200/80 text-[#A31D24] hover:bg-rose-100/80 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm giai đoạn</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {milestones.map((m, idx) => {
                  const milestoneAmount = Number(m.amount) || 0;
                  const mFee = Math.round(milestoneAmount * feeRate);
                  const mNet = milestoneAmount - mFee;
                  const isCollapsed = collapsedIndices.has(idx);

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4 space-y-3 transition-colors hover:border-[#D5CBB8] shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleCollapse(idx)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#A31D24] text-white shrink-0">
                            Mốc #{idx + 1}
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold text-[#1E1810] truncate">
                            {m.title || 'Chưa đặt tên giai đoạn'}
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-xs font-bold text-[#1E1810] mr-1 tabular-nums">
                            {formatVND(milestoneAmount)}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleCollapse(idx)}
                            aria-label={
                              isCollapsed
                                ? `Mở rộng giai đoạn #${idx + 1}`
                                : `Thu gọn giai đoạn #${idx + 1}`
                            }
                            className="h-7 w-7 rounded-lg border border-[#EBE4D8] bg-[#FAF8F4] text-stone-500 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                            title={isCollapsed ? 'Mở rộng giai đoạn' : 'Thu gọn giai đoạn'}
                          >
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform duration-150',
                                isCollapsed && '-rotate-90'
                              )}
                            />
                          </button>

                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              aria-label={`Xóa giai đoạn #${idx + 1}`}
                              className="h-7 w-7 rounded-lg border border-[#EBE4D8] bg-white text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                              title="Xóa giai đoạn này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-3 pt-2 border-t border-[#F2ECE1]">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-6 space-y-1">
                              <label className="block text-[11px] font-semibold text-[#5C5346]">
                                Tên giai đoạn <span className="text-[#A31D24]">*</span>
                              </label>
                              <input
                                type="text"
                                value={m.title}
                                onChange={(e) =>
                                  handleUpdateMilestone(idx, 'title', e.target.value)
                                }
                                placeholder="Ví dụ: Giai đoạn 1: Đề cương & Kịch bản"
                                className="w-full text-xs h-9 px-3 rounded-lg border border-[#DDD4C2] bg-white text-[#1E1810] placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all"
                              />
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <label className="block text-[11px] font-semibold text-[#5C5346]">
                                Giá mốc (VNĐ) <span className="text-[#A31D24]">*</span>
                              </label>
                              <input
                                type="number"
                                step={10000}
                                min={minMilestoneAmount}
                                value={m.amount || ''}
                                onChange={(e) =>
                                  handleUpdateMilestone(idx, 'amount', Number(e.target.value))
                                }
                                placeholder="500000"
                                className="w-full text-xs h-9 px-3 rounded-lg border border-[#DDD4C2] bg-white text-[#1E1810] font-mono font-semibold focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all"
                              />
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <label className="block text-[11px] font-semibold text-[#5C5346]">
                                Thời hạn (Ngày) <span className="text-[#A31D24]">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={90}
                                  value={m.durationDays || ''}
                                  onChange={(e) =>
                                    handleUpdateMilestone(
                                      idx,
                                      'durationDays',
                                      Number(e.target.value)
                                    )
                                  }
                                  placeholder="3"
                                  className="w-full text-xs h-9 pl-3 pr-7 rounded-lg border border-[#DDD4C2] bg-white text-[#1E1810] font-semibold focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all"
                                />
                                <Calendar className="h-3.5 w-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>

                            <div className="sm:col-span-12 space-y-1">
                              <label className="block text-[11px] font-semibold text-[#5C5346]">
                                Sản phẩm cam kết bàn giao <span className="text-[#A31D24]">*</span>
                              </label>
                              <input
                                type="text"
                                value={m.requirement}
                                onChange={(e) =>
                                  handleUpdateMilestone(idx, 'requirement', e.target.value)
                                }
                                placeholder="Ví dụ: Bàn giao file kịch bản PDF chi tiết các phân đoạn lịch sử"
                                className="w-full text-xs h-9 px-3 rounded-lg border border-[#DDD4C2] bg-white text-[#1E1810] placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F5F1E8] text-[11px] flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-[#685D4F]">
                              <Coins className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
                              <span>
                                Phí nền tảng ({platformFeePercent}%):{' '}
                                <strong className="text-[#B45309] font-mono">
                                  -{formatVND(mFee)}
                                </strong>
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 text-[#15803D] font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                              <span>
                                Thực nhận mốc này (95%):{' '}
                                <strong className="font-mono font-bold text-[#15803D]">
                                  {formatVND(mNet)}
                                </strong>
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── 4. UNIFIED 3-CARD SỬ KÝ FINANCIAL SUMMARY ──────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-xl bg-white border border-[#EBE4D8] p-3 flex items-start gap-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-[#FDE9E9] text-[#A31D24] flex items-center justify-center shrink-0 mt-0.5">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-[#685D4F] block">
                    Tổng giá trị (Khách trả)
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#1E1810] tabular-nums block mt-0.5">
                    {formatVND(totalGrossAmount)}
                  </span>
                  <span className="text-[10px] text-[#8C8070] block">
                    Cộng từ {milestones.length} mốc bàn giao
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-[#EBE4D8] p-3 flex items-start gap-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-[#FEF7E6] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-[#685D4F] block">
                    Phí nền tảng ({platformFeePercent}%)
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#B45309] tabular-nums block mt-0.5">
                    -{formatVND(totalPlatformFee)}
                  </span>
                  <span className="text-[10px] text-[#8C8070] block">
                    Khấu trừ khi giải ngân
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-[#BDE7CE] p-3 flex items-start gap-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-[#EAFCF1] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#15803D] block">
                    Creator thực nhận (95%)
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-[#15803D] tabular-nums block mt-0.5">
                    {formatVND(totalNetCreator)}
                  </span>
                  <span className="text-[10px] text-[#16A34A] block">
                    Cộng thẳng vào ví khả dụng
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-white/80 border border-[#EBE4D8] text-[11px] text-[#685D4F] leading-relaxed">
              <Info className="h-3.5 w-3.5 text-[#A31D24] shrink-0 mt-0.5" />
              <span>
                Khi gửi lộ trình, hệ thống tự động báo trong khung Tin nhắn để khách hàng kiểm tra và nạp tiền ký quỹ Milestone #1.
              </span>
            </div>

            {formError && (
              <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#A31D24]" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}
          </div>

          {/* ─── 5. STICKY ACTION BUTTONS FOOTER ────────────────────────────── */}
          <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#EBE4D8] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="h-9 px-5 rounded-xl border border-[#DDD4C2] bg-white text-[#4A4238] hover:bg-stone-50 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending || totalGrossAmount <= 0}
              className="h-9 px-5 rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] active:scale-[0.98] transition-all text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang gửi lộ trình...</span>
                </>
              ) : existingContract ? (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Cập nhật &amp; Gửi lại lộ trình</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi Lộ trình Milestone cho khách duyệt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
