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
  FileText,
  ChevronDown,
  X,
  GripVertical,
  Calendar,
  CheckCircle2,
  Calculator,
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
      setContractTitle(commission.title ? `Hợp đồng sản xuất: ${commission.title}` : 'Hợp đồng sản xuất');
      setContractDescription(commission.description ? `Dựa trên yêu cầu: ${commission.description}` : '');
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
        return contractsApi.createContract({
          commissionId,
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
      if (res.data) onSuccess?.(res.data);
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setFormError(err.response?.data?.message || err.message || 'Lỗi khi lưu lộ trình Milestone.');
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-4xl"
        className="max-w-4xl w-[94vw] sm:w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white rounded-[28px] sm:rounded-[32px] border border-stone-200/90 shadow-2xl font-sans space-y-6 z-[60] [&>button:last-child]:hidden"
      >
        {/* ─── 1. HEADER SECTION (EXACT ARTWORK & PROPORTIONS) ─────────────── */}
        <div className="relative pb-2">
          {/* Top-Right Circular Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute -top-2 right-0 z-20 h-8 w-8 rounded-full bg-[#FAF9F6] border border-stone-200/80 hover:bg-stone-200/60 text-stone-400 hover:text-stone-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Top-Right Historical Artwork: Ancient Scroll, Target Bullseye, Pagoda & Clouds */}
          <div
            className="absolute -top-2 right-10 h-32 sm:h-36 w-auto max-w-[340px] sm:max-w-[380px] pointer-events-none select-none overflow-hidden hidden sm:block"
            aria-hidden="true"
          >
            <img
              src="/assets/studio/milestone-roadmap-header-illustration.png"
              alt=""
              className="h-full w-auto object-contain object-right pointer-events-none select-none"
            />
          </div>

          {/* Left Title & Tag */}
          <div className="relative z-10 space-y-1.5 max-w-xl pr-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#A31D24] shrink-0 shadow-2xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#A31D24] font-sans">
                  THIẾT LẬP LỘ TRÌNH MILESTONE
                </span>
                <DialogTitle className="text-xl sm:text-[22px] font-bold font-sans text-[#1C1615] tracking-tight leading-snug">
                  {existingContract
                    ? `Chỉnh sửa Lộ trình #${existingContract.id}`
                    : 'Lập Lộ trình Milestone Tổng (Hợp đồng)'}
                </DialogTitle>
              </div>
            </div>

            <DialogDescription className="text-xs sm:text-[13px] text-stone-500 leading-relaxed max-w-xl pt-1 font-sans">
              Lập bảng lộ trình gồm tối đa {maxMilestones} giai đoạn. Khán giả duyệt lộ trình tổng và chỉ nạp cọc theo từng giai đoạn cuốn chiếu.
            </DialogDescription>
          </div>
        </div>

        {/* ─── 2. FORM BODY ────────────────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          {/* Field 1: Tên hợp đồng sản xuất */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-[#FEE2E2] border border-[#FECDD3] flex items-center justify-center text-[#A31D24] shrink-0">
                <FileText className="h-3 w-3" />
              </div>
              <label className="text-xs font-semibold text-stone-800 font-sans">
                Tên hợp đồng sản xuất <span className="text-[#A31D24]">*</span>
              </label>
            </div>
            <input
              type="text"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="Ví dụ: Hợp đồng sản xuất: Series 3 tập: Cuộc chiến chống quân Nam Hán & Vương triều Ngô Quyền"
              className="w-full text-xs sm:text-[13px] h-11 px-4 rounded-xl border border-[#FCA5A5] bg-[#FFF5F5] text-[#A31D24] font-medium placeholder-[#F87171]/60 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden font-sans transition-all shadow-2xs"
            />
          </div>

          {/* Field 2: Ghi chú & Thỏa thuận chung */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-[#FEE2E2] border border-[#FECDD3] flex items-center justify-center text-[#A31D24] shrink-0">
                <FileText className="h-3 w-3" />
              </div>
              <label className="text-xs font-semibold text-stone-800 font-sans">
                Ghi chú &amp; Thỏa thuận chung
              </label>
            </div>
            <textarea
              rows={2}
              value={contractDescription}
              onChange={(e) => setContractDescription(e.target.value)}
              placeholder="Dựa trên yêu cầu: Yêu cầu đặt làm trọn bộ 3 tập series đồ họa hoạt họa và audio podcast phân tích chi tiết bối cảnh thế kỷ X."
              className="w-full text-xs sm:text-[13px] p-3.5 rounded-xl border border-stone-200/90 bg-[#FAF9F6] text-stone-700 placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden font-sans transition-all shadow-2xs leading-relaxed resize-none"
            />
          </div>

          {/* ─── 3. DANH SÁCH GIAI ĐOẠN MILESTONE ───────────────────────────── */}
          <div className="space-y-3 pt-1">
            {/* Header row: Exactly matches reference */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#A31D24] shrink-0" />
                <h4 className="text-sm sm:text-base font-bold text-stone-900 font-sans">
                  Danh sách giai đoạn Milestone ({milestones.length}/{maxMilestones})
                </h4>
              </div>

              {/* Add Stage button */}
              <button
                type="button"
                onClick={handleAddMilestone}
                disabled={milestones.length >= maxMilestones}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#FFF0F0] border border-[#FECDD3] text-[#A31D24] hover:bg-[#FEE2E2] active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer shadow-2xs font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm giai đoạn</span>
              </button>
            </div>

            {/* Stages Cards List */}
            <div className="space-y-3.5">
              {milestones.map((m, idx) => {
                const milestoneAmount = Number(m.amount) || 0;
                const mFee = Math.round(milestoneAmount * feeRate);
                const mNet = milestoneAmount - mFee;
                const isCollapsed = collapsedIndices.has(idx);

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 transition-all duration-200 hover:border-stone-300 shadow-2xs"
                  >
                    {/* Header Row: GripVertical + Badge + (Summary if collapsed) + Chevron + Trash */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <GripVertical className="h-4 w-4 text-stone-400 cursor-grab shrink-0" />
                        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold font-sans bg-[#FFF0F0] text-[#A31D24] border border-[#FECDD3] shrink-0">
                          Giai đoạn #{idx + 1}
                        </span>

                        {/* Collapsed title snippet */}
                        {isCollapsed && (
                          <span className="text-xs font-semibold text-stone-800 truncate font-sans">
                            {m.title || 'Chưa đặt tên giai đoạn'}
                          </span>
                        )}
                      </div>

                      {/* Right controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Collapsed amount snippet */}
                        {isCollapsed && (
                          <span className="font-sans text-xs font-bold text-stone-900 mr-1">
                            {formatVND(milestoneAmount)}
                          </span>
                        )}

                        {/* Collapse / Expand Arrow Button (User request: mũi tên thu gọn/mở rộng) */}
                        <button
                          type="button"
                          onClick={() => toggleCollapse(idx)}
                          aria-label={isCollapsed ? `Mở rộng giai đoạn #${idx + 1}` : `Thu gọn giai đoạn #${idx + 1}`}
                          className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-[0.96]"
                          title={isCollapsed ? 'Mở rộng giai đoạn' : 'Thu gọn giai đoạn'}
                        >
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform duration-200 text-stone-600',
                              isCollapsed && '-rotate-90'
                            )}
                          />
                        </button>

                        {/* Delete Stage Button (Trash) */}
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(idx)}
                            aria-label={`Xóa giai đoạn #${idx + 1}`}
                            className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-[0.96]"
                            title="Xóa giai đoạn này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form Fields inside card (When Expanded) */}
                    {!isCollapsed && (
                      <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
                        {/* Row 1: Tên giai đoạn (50%), Số tiền (25%), Hạn ngày (25%) */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                          {/* 1. Tên giai đoạn */}
                          <div className="sm:col-span-6 space-y-1">
                            <label className="block text-xs font-semibold text-stone-700 font-sans">
                              Tên giai đoạn <span className="text-[#A31D24]">*</span>
                            </label>
                            <input
                              type="text"
                              value={m.title}
                              onChange={(e) => handleUpdateMilestone(idx, 'title', e.target.value)}
                              placeholder="Ví dụ: Giai đoạn 1: Đề cương & Kịch bản phân cảnh"
                              className="w-full text-xs h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden font-sans transition-all shadow-2xs"
                            />
                          </div>

                          {/* 2. Số tiền (VNĐ) */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="block text-xs font-semibold text-stone-700 font-sans">
                              Số tiền (VNĐ) <span className="text-[#A31D24]">*</span>
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
                              className="w-full text-xs h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-sans font-medium focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all shadow-2xs text-left"
                            />
                          </div>

                          {/* 3. Hạn (Ngày) with Calendar icon */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="block text-xs font-semibold text-stone-700 font-sans">
                              Hạn (Ngày) <span className="text-[#A31D24]">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                max={90}
                                value={m.durationDays || ''}
                                onChange={(e) =>
                                  handleUpdateMilestone(idx, 'durationDays', Number(e.target.value))
                                }
                                placeholder="3"
                                className="w-full text-xs h-10 pl-3.5 pr-8 rounded-xl border border-stone-200 bg-white text-stone-900 font-sans font-medium text-left focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all shadow-2xs"
                              />
                              <Calendar className="h-4 w-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* 4. Sản phẩm cam kết bàn giao (Full Row) */}
                          <div className="sm:col-span-12 space-y-1">
                            <label className="block text-xs font-semibold text-stone-700 font-sans">
                              Sản phẩm cam kết bàn giao <span className="text-[#A31D24]">*</span>
                            </label>
                            <input
                              type="text"
                              value={m.requirement}
                              onChange={(e) => handleUpdateMilestone(idx, 'requirement', e.target.value)}
                              placeholder="Ví dụ: Bản giao file kịch bản PDF chi tiết các phân đoạn lịch sử"
                              className="w-full text-xs h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden font-sans transition-all shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Card Footer: 2 Pill Badges (Stone Phí sàn & Emerald Thực nhận) */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100/90 border border-stone-200/60 text-stone-700 text-xs font-medium font-sans">
                            <Coins className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                            <span>
                              Phí sàn ({platformFeePercent}%):{' '}
                              <strong className="text-stone-800 font-bold">{formatVND(mFee)}</strong>
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-emerald-800 text-xs font-semibold font-sans">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Bạn thực nhận (95%):{' '}
                              <strong className="font-bold text-emerald-700">{formatVND(mNet)}</strong>
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

          {/* ─── 4. FINANCIAL SUMMARY CARD ("Tổng hợp giá trị") ──────────────── */}
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAF9F6] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-5 items-stretch">
              {/* Left Column: Green Calculator Icon + "Tổng hợp giá trị" */}
              <div className="sm:w-36 shrink-0 flex flex-col items-center justify-center p-2 sm:border-r sm:border-stone-200/80">
                <div className="h-13 w-13 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-emerald-600 mb-1.5 shadow-2xs">
                  <Calculator className="h-6 w-6" />
                </div>
                <span className="font-sans font-bold text-xs sm:text-sm text-stone-800 text-center">
                  Tổng hợp giá trị
                </span>
              </div>

              {/* Right Column: Financial Rows & Highlight Banner */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Row 1: Tổng giá trị hợp đồng (Khách trả) */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700 font-sans">
                  <span>Tổng giá trị hợp đồng (Khách trả):</span>
                  <span className="font-bold text-stone-900 text-sm sm:text-base">
                    {formatVND(totalGrossAmount)}
                  </span>
                </div>

                {/* Row 2: Phí nền tảng (5%) */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 font-sans">
                  <span>Phí nền tảng ({platformFeePercent}%):</span>
                  <span className="text-rose-600 font-semibold text-xs sm:text-sm">
                    -{formatVND(totalPlatformFee)}
                  </span>
                </div>

                {/* Row 3: Highlight Banner for Net Creator payout */}
                <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm font-sans">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Tổng thực nhận của Creator (95%):</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-emerald-700">
                    {formatVND(totalNetCreator)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Callout Note */}
            <div className="flex items-start gap-1.5 pt-3 border-t border-stone-200/60 text-[11px] text-stone-500 leading-relaxed italic font-sans">
              <Info className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span>
                * Hệ thống áp dụng cấu hình tự động: Tối đa 2 lần chỉnh sửa miễn phí / mốc (+2 ngày/lần), tự động nghiệm thu sau 3 ngày nếu khách im lặng, và tạm giữ 3 ngày sau khi duyệt trước khi giải ngân vào ví khả dụng.
              </span>
            </div>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 font-sans">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#A31D24]" />
              <span className="leading-relaxed">{formError}</span>
            </div>
          )}

          {/* ─── 5. ACTION BUTTONS FOOTER ────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="h-10 px-6 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer font-sans disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending || totalGrossAmount <= 0}
              className="h-11 px-6 rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] active:scale-[0.98] transition-all text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang gửi lộ trình...</span>
                </>
              ) : existingContract ? (
                <>
                  <Send className="h-4 w-4" />
                  <span>Cập nhật &amp; Gửi lại lộ trình</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
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
