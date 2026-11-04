import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Layers,
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ContractMilestoneTimeline } from '../ContractMilestoneTimeline';
import {
  calculateEscrowBreakdown,
  generateMilestoneEscrowCSV,
  downloadCSV,
} from '../milestoneFinanceLogic';
import type { AdminContractRow } from '../contractsLogic';
import { bookingEscrowApi } from '@/services/api/bookingEscrow';
import { formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface AdminContractDetailModalProps {
  contract: AdminContractRow | null;
  initialTab?: 'milestones' | 'terms';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export const AdminContractDetailModal: React.FC<AdminContractDetailModalProps> = ({
  contract,
  initialTab = 'milestones',
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'terms'>(initialTab);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setIsNoteExpanded(false);
    }
  }, [open, initialTab, contract?.id]);

  // Fetch real-time Platform Escrow & Service Terms directly from Backend Policy
  const { data: policyResponse } = useQuery({
    queryKey: ['public-booking-escrow-policy'],
    queryFn: () => bookingEscrowApi.getPublicPolicy(),
    staleTime: 5 * 60 * 1000,
  });

  if (!contract) return null;

  const raw = contract.rawContract;
  const milestones = raw?.milestones || [];
  const liveRenderedTerms = policyResponse?.data?.renderedTerms;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(contract.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleExportContractCSV = () => {
    const breakdown = calculateEscrowBreakdown(milestones);
    const csv = generateMilestoneEscrowCSV(contract.id, contract.title, milestones, breakdown);
    downloadCSV(`doi-soat-hop-dong-${contract.code}.csv`, csv);
  };

  const noteText =
    raw?.description ||
    'Thực hiện đúng tiến độ và tiêu chuẩn chất lượng của từng mốc bàn giao bên dưới.';
  const isLongNote = noteText.length > 130 || (noteText.match(/\n/g)?.length || 0) >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        maxWidth="max-w-4xl"
        className="p-0 overflow-hidden rounded-2xl bg-[#FAF8F5] border border-[#EBE4D8] shadow-2xl max-h-[90vh] flex flex-col gap-0 focus:outline-none font-sans"
      >
        {/* ─── 1. MODAL HEADER (Synchronized with CreatorContractDetailDrawer) ─── */}
        <div className="shrink-0 pl-5 sm:pl-6 pr-12 sm:pr-14 py-4 bg-white border-b border-[#EBE4D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyCode}
                title="Sao chép mã hợp đồng"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] font-mono text-xs font-bold text-[#1C1615] hover:border-[#A31D24]/40 transition-colors cursor-pointer"
              >
                <span>#{contract.code}</span>
                {copiedCode ? (
                  <Check className="h-3 w-3 text-[#16A34A]" />
                ) : (
                  <Copy className="h-3 w-3 text-stone-400" />
                )}
              </button>

              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border"
                style={{
                  backgroundColor: contract.statusConfig.bg,
                  color: contract.statusConfig.text,
                  borderColor: contract.statusConfig.border,
                }}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${contract.statusConfig.dot}`} />
                <span>{contract.statusConfig.label}</span>
              </div>

              {raw?.serviceType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  {raw.serviceType === 'SERIES'
                    ? 'Chuỗi nhiều tập (Series)'
                    : raw.serviceType === 'SINGLE_VIDEO'
                    ? 'Tác phẩm lẻ (Single)'
                    : raw.serviceType}
                </span>
              )}
            </div>

            <DialogTitle className="text-base sm:text-lg font-bold text-[#1C1615] leading-snug break-words">
              {contract.title}
            </DialogTitle>

            <DialogDescription className="text-xs text-stone-500">
              Kênh phát hành:{' '}
              <strong className="text-[#1C1615] font-semibold">{contract.channelOrSeries}</strong> •
              Ngày lập:{' '}
              <strong className="text-[#1C1615] font-mono font-semibold tabular-nums">
                {contract.dateStr} {contract.timeStr}
              </strong>
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportContractCSV}
              className="h-9 px-3 text-xs rounded-xl border-[#EBE4D8] bg-white text-stone-700 hover:bg-[#FAF8F5] inline-flex items-center gap-1.5 font-semibold shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-[#A31D24]" />
              <span>Xuất CSV đối soát</span>
            </Button>
          </div>
        </div>

        {/* ─── 2. NAVIGATION TABS ─── */}
        <div className="shrink-0 flex items-center gap-5 px-5 sm:px-6 border-b border-[#EBE4D8] bg-white text-xs select-none">
          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-1.5 py-3 font-semibold transition-colors border-b-2 outline-none cursor-pointer ${
              activeTab === 'milestones'
                ? 'border-[#A31D24] text-[#A31D24]'
                : 'border-transparent text-stone-500 hover:text-[#1C1615]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Lộ trình bàn giao &amp; Sản phẩm ({contract.milestonesCount} mốc)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 py-3 font-semibold transition-colors border-b-2 outline-none cursor-pointer ${
              activeTab === 'terms'
                ? 'border-[#A31D24] text-[#A31D24]'
                : 'border-transparent text-stone-500 hover:text-[#1C1615]'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Điều khoản &amp; Chữ ký điện tử</span>
          </button>
        </div>

        {/* ─── 3. SCROLLABLE BODY ─── */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 bg-[#FAF8F5]">
          {/* Row 1: 3 KPI-Style Financial Cards (Matching CreatorContractDetailDrawer 100%) */}
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
                  100% giá trị • {contract.milestonesCount} giai đoạn
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
                  Phí nền tảng ({raw?.platformFeePercent ?? 5}%)
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#1C1615] leading-none">
                    {formatVND(contract.platformFee || 0)}
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
                  Creator thực nhận ({100 - (raw?.platformFeePercent ?? 5)}%)
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#16A34A] leading-none">
                    {formatVND(contract.netAmount || 0)}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 block truncate mt-0.5">
                  Cộng thẳng vào ví Nhà sáng tạo
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Dual Participant Profile Cards + Expandable Agreement Note */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 shadow-2xs space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Creator Profile */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] min-w-0">
                <div className="h-10 w-10 rounded-full bg-[#FDE9E9] border border-rose-200/70 flex items-center justify-center text-[#A31D24] font-bold text-xs shrink-0">
                  {contract.creatorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#1C1615] truncate">
                      {contract.creatorName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#A31D24] bg-[#FDE9E9] px-2 py-0.5 rounded-full border border-rose-200/60">
                      <span>Nhà sáng tạo (Creator)</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    Kênh: <strong className="text-stone-700">{contract.channelOrSeries}</strong> •{' '}
                    <span className="font-mono">{contract.creatorEmail}</span>
                  </p>
                </div>
              </div>

              {/* Customer / Requester Profile */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] min-w-0">
                <div className="h-10 w-10 rounded-full bg-[#EAFCF1] border border-emerald-200/70 flex items-center justify-center text-[#16A34A] font-bold text-xs shrink-0">
                  {contract.narratorInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#1C1615] truncate">
                      {contract.narratorName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-[#EAFCF1] px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      <span>Khách đặt nội dung</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono truncate mt-0.5">
                    {contract.narratorEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Note & Policy Badges */}
            <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] px-3.5 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Ghi chú &amp; Thỏa thuận hợp đồng
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#EBE4D8] text-[10.5px] font-medium text-stone-600">
                    Sửa tối đa 2 lần (+2 ngày/lần)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#EBE4D8] text-[10.5px] font-medium text-stone-600">
                    Tự động duyệt sau 3 ngày
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
          </div>

          {/* Row 3: Tab Content */}
          {activeTab === 'milestones' && (
            <ContractMilestoneTimeline
              contractId={contract.id}
              initialMilestones={raw?.milestones}
              contractTitle={contract.title}
              contractCode={contract.code}
            />
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3.5 text-xs font-sans">
              {/* Signing status card */}
              <div className="p-4 rounded-2xl border border-[#EBE4D8] bg-white shadow-2xs space-y-2.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Trạng thái ký kết điện tử
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] text-[#1C1615]">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <div>
                      <span className="block font-bold">
                        Nhà sáng tạo ({contract.creatorName})
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Đã lập &amp; ký báo giá lộ trình ({contract.dateStr})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] text-[#1C1615]">
                    {contract.status === 'ACTIVE' || contract.status === 'COMPLETED' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                        <div>
                          <span className="block font-bold">
                            Khách đặt nội dung ({contract.narratorName})
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Đã chấp thuận lộ trình &amp; ký xác nhận ({contract.dateStr})
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="block font-bold">
                            Khách đặt nội dung ({contract.narratorName})
                          </span>
                          <span className="text-[11px] text-amber-700">
                            Đang chờ chấp thuận lộ trình
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms Content */}
              <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 shadow-2xs space-y-2">
                <span className="font-bold text-stone-600 block text-[11px] uppercase tracking-wider">
                  Nội dung điều khoản thỏa thuận sản xuất
                </span>
                <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-4 text-[#1C1615] leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto font-sans text-xs">
                  {contract.termsText ||
                    liveRenderedTerms ||
                    `ĐIỀU KHOẢN TIÊU CHUẨN NỀN TẢNG (PLATFORM ESCROW & SERVICE TERMS)

1. Quy trình Đặt hàng Nội dung & Giới hạn 1 Hợp đồng đang mở:
- Khán thính giả (Khách đặt nội dung) gửi yêu cầu đặt Nhà sáng tạo (Creator) sản xuất Video/Podcast lẻ (SINGLE_VIDEO) hoặc Chuỗi nhiều tập (SERIES).
- Mỗi thời điểm, một Khách đặt nội dung chỉ được thực hiện tối đa 01 yêu cầu đặt hàng hoặc 01 hợp đồng đang mở.

2. Báo giá Lộ trình Milestone & Cơ chế Ký quỹ Cuốn chiếu (Escrow Protection):
- Nhà sáng tạo lập bảng lộ trình gồm tối đa 20 giai đoạn (Milestone) và gửi báo giá; Khách đặt nội dung có 48 giờ để xem xét và bấm Chấp nhận.
- Tiền ký quỹ được phong tỏa an toàn trong két Ký quỹ cho đến khi giai đoạn hoàn tất.

3. Cam kết Tiến độ (dueAt) & Phí Dịch vụ Nền tảng (5.0%):
- Nhà sáng tạo cam kết nộp sản phẩm đúng hạn durationDays. Quá hạn chưa nộp bài, Khách đặt nội dung có quyền Hủy do quá hạn để nhận hoàn lại 100% tiền ký quỹ.
- Sau khi được nghiệm thu và qua 3 ngày giữ an toàn, hệ thống khấu trừ 5.0% phí dịch vụ và giải ngân 95.0% vào ví khả dụng của Nhà sáng tạo.`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. MODAL FOOTER ─── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-white border-t border-[#EBE4D8]">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="hidden sm:inline">
              Hệ thống bảo chứng Ký quỹ an toàn 100% cho Khách đặt nội dung và Nhà sáng tạo
            </span>
            <span className="sm:hidden">Ký quỹ bảo chứng an toàn</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 rounded-xl border border-[#EBE4D8] bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
