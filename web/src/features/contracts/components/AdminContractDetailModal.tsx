import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Coins,
  Layers,
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ContractMilestoneTimeline } from '../ContractMilestoneTimeline';
import type { AdminContractRow } from '../contractsLogic';
import { bookingEscrowApi } from '@/services/api/bookingEscrow';
import { formatVND } from '@/utils/formatters';

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

  // Fetch real-time Platform Escrow & Service Terms directly from Backend Policy
  const { data: policyResponse } = useQuery({
    queryKey: ['public-booking-escrow-policy'],
    queryFn: () => bookingEscrowApi.getPublicPolicy(),
    staleTime: 5 * 60 * 1000,
  });

  if (!contract) return null;

  const raw = contract.rawContract;
  const liveRenderedTerms = policyResponse?.data?.renderedTerms;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        maxWidth="max-w-2xl lg:max-w-3xl"
        className="p-0 overflow-hidden rounded-2xl bg-white border border-[#F0EBE6] shadow-2xl z-[999] max-h-[86vh] flex flex-col gap-0 focus:outline-none"
      >
        {/* Modal Header (Fixed / Shrink-0) */}
        <div className="relative shrink-0 px-5 py-3.5 bg-[#FAF8F5] border-b border-[#F0EBE6] pr-12 font-sans">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">
                {contract.code}
              </span>
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border"
                style={{
                  backgroundColor: contract.statusConfig.bg,
                  color: contract.statusConfig.text,
                  borderColor: contract.statusConfig.border,
                }}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${contract.statusConfig.dot}`} />
                <span>{contract.statusConfig.label}</span>
              </div>
            </div>
            <h2 className="text-xs sm:text-[13px] font-semibold text-stone-800 line-clamp-1">
              {contract.title}
            </h2>
            <p className="text-[11px] text-stone-500">
              Kênh: <strong className="text-stone-700 font-medium">{contract.channelOrSeries}</strong> • Ngày ký:{' '}
              <strong className="text-stone-700 font-medium tabular-nums">{contract.dateStr} {contract.timeStr}</strong>
            </p>
          </div>

          {/* Quick Close Button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Đóng cửa sổ"
            className="absolute right-3.5 top-3.5 h-7 w-7 rounded-lg border border-[#E7E5E4] bg-white text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Financial Summary Cards Row (Fixed / Shrink-0 / Compact) */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2 px-5 py-2.5 bg-white border-b border-[#F0EBE6] font-sans">
          {/* Creator Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/60 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#FFF0F2] text-[#991B1B] font-bold text-xs flex items-center justify-center shrink-0 border border-[#FFE4E8]">
              {contract.creatorName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] font-semibold text-stone-400 block uppercase tracking-wider">
                Nhà sáng tạo (Creator)
              </span>
              <span className="font-semibold text-stone-900 block truncate text-xs" title={contract.creatorName}>
                {contract.creatorName}
              </span>
              <span className="text-[10.5px] text-stone-400 block truncate" title={contract.creatorEmail}>
                {contract.creatorEmail}
              </span>
            </div>
          </div>

          {/* Narrator Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/60 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#ECFDF5] text-[#059669] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D1FAE5]">
              {contract.narratorInitials}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] font-semibold text-stone-400 block uppercase tracking-wider">
                Thuyết minh viên (Narrator)
              </span>
              <span className="font-semibold text-stone-900 block truncate text-xs" title={contract.narratorName}>
                {contract.narratorName}
              </span>
              <span className="text-[10.5px] text-stone-400 block truncate" title={contract.narratorEmail}>
                {contract.narratorEmail}
              </span>
            </div>
          </div>

          {/* Contract Value Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/60 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0 border border-[#FEF3C7]">
              <Coins className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] font-semibold text-stone-400 block uppercase tracking-wider">
                Giá trị hợp đồng (VND)
              </span>
              <span className="font-bold text-stone-900 block tabular-nums text-xs sm:text-[13px]">
                {contract.totalAmountFormatted}
              </span>
              <span className="text-[10.5px] text-stone-500 block tabular-nums truncate">
                Phí sàn (5%): {formatVND(contract.platformFee)} • Thực nhận: {formatVND(contract.netAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs (Clean, No Blue Outline) */}
        <div className="shrink-0 flex items-center gap-4 px-5 border-b border-[#F0EBE6] bg-white text-xs select-none font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-1.5 py-2.5 font-medium transition-colors border-b-2 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'milestones'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Tiến trình Cột mốc & Ký quỹ (Milestones)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 py-2.5 font-medium transition-colors border-b-2 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'terms'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Điều khoản & Chữ ký điện tử</span>
          </button>
        </div>

        {/* Tab Content Container (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-3 font-sans">
          {activeTab === 'milestones' && (
            <ContractMilestoneTimeline
              contractId={contract.id}
              initialMilestones={raw?.milestones}
              contractTitle={contract.title}
            />
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3.5 text-xs font-sans">
              {/* Signing status card */}
              <div className="p-3.5 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5] space-y-2">
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Trạng thái ký kết điện tử:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                  <div className="flex items-center gap-2 text-stone-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Nhà sáng tạo:</strong> Đã ký kết hợp đồng ({contract.dateStr})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-700">
                    {contract.status === 'ACTIVE' || contract.status === 'COMPLETED' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Thuyết minh viên:</strong> Đã ký xác nhận ({contract.dateStr})
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>
                          <strong>Thuyết minh viên:</strong> Đang chờ ký xác nhận
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms Content */}
              <div>
                <span className="font-semibold text-stone-700 block mb-1.5 text-xs uppercase tracking-wider">
                  Nội dung điều khoản thỏa thuận sản xuất:
                </span>
                <div className="rounded-xl border border-[#F0EBE6] bg-stone-50/70 p-3.5 text-stone-700 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto font-sans text-xs">
                  {contract.termsText || liveRenderedTerms ||
                    `ĐIỀU KHOẢN TIÊU CHUẨN NỀN TẢNG (PLATFORM ESCROW & SERVICE TERMS)

1. Quy trình Đặt hàng Nội dung & Giới hạn 1 Hợp đồng đang mở:
- Khán thính giả (Người đặt hàng) gửi yêu cầu đặt Creator sản xuất Video/Podcast lẻ (SINGLE_VIDEO) hoặc Chuỗi nhiều tập (SERIES).
- Mỗi thời điểm, một Người đặt hàng chỉ được thực hiện tối đa 01 yêu cầu đặt hàng hoặc 01 hợp đồng đang mở.

2. Báo giá Lộ trình Milestone & Cơ chế Ký quỹ Cuốn chiếu (Escrow Protection):
- Creator lập bảng lộ trình gồm tối đa 20 giai đoạn (Milestone) và gửi báo giá; Người đặt hàng có 48 giờ để xem xét và bấm Chấp nhận.
- Tiền ký quỹ được phong tỏa an toàn trong két Escrow cho đến khi giai đoạn hoàn tất.

3. Cam kết Tiến độ (dueAt) & Phí Dịch vụ Nền tảng (5.0%):
- Creator cam kết nộp sản phẩm đúng hạn durationDays. Quá hạn chưa nộp bài, Người đặt hàng có quyền Hủy do quá hạn để nhận hoàn lại 100% tiền ký quỹ.
- Sau khi được nghiệm thu và qua 3 ngày giữ an toàn, hệ thống khấu trừ 5.0% phí dịch vụ và giải ngân 95.0% vào ví khả dụng của Creator.`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Fixed / Shrink-0) */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-2.5 bg-[#FAF8F5] border-t border-[#F0EBE6] font-sans">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Ký quỹ Escrow bảo chứng an toàn 100% cho cả Nhà sáng tạo và Thuyết minh viên</span>
            <span className="sm:hidden">Ký quỹ Escrow bảo chứng</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
