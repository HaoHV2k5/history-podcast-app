import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
  ShieldCheck,
  Copy,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { contractsApi } from '@/services/api/contracts';
import {
  AdminEscrowRow,
  getEscrowStatusConfig,
  formatCurrencyVND,
  extractInitials,
  copyToClipboard,
} from '../escrowLogic';

interface AdminEscrowDetailModalProps {
  row: AdminEscrowRow | null;
  onClose: () => void;
  onViewContract?: (contractId: number) => void;
  onViewMilestoneBreakdown?: (row: AdminEscrowRow) => void;
}

export const AdminEscrowDetailModal: React.FC<AdminEscrowDetailModalProps> = ({
  row,
  onClose,
  onViewContract,
  onViewMilestoneBreakdown,
}) => {
  const [copied, setCopied] = useState(false);

  // Fetch live Contract & Milestone details from Backend if contractId is present
  const { data: liveContractRes } = useQuery({
    queryKey: ['admin-escrow-live-contract', row?.contractId],
    queryFn: () => contractsApi.getContractById(row!.contractId),
    enabled: Boolean(row?.contractId),
  });

  if (!row) return null;

  const liveContract = liveContractRes?.data;
  const statusCfg = getEscrowStatusConfig(row.status);

  // Resolve authentic parties from Backend Contract if available
  const payerName = liveContract?.requesterFullName || row.payerName;
  const payerEmail = liveContract?.requesterEmail || row.payerEmail;
  const payeeName = liveContract?.creatorFullName || row.payeeName;
  const payeeEmail = liveContract?.creatorEmail || row.payeeEmail;

  // Resolve matching milestone details if available
  const matchingMilestone = liveContract?.milestones?.find(
    (m) => m.orderNo === row.milestoneOrderNo || m.id === row.milestoneId
  );
  const milestoneTitle =
    matchingMilestone?.title || row.milestoneTitle || (row.milestoneOrderNo ? `Mốc #${row.milestoneOrderNo}` : `Mốc #${row.milestoneId}`);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(row.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-lg"
        className="p-0 overflow-hidden font-sans border-[#E7E5E4] rounded-2xl max-h-[min(90vh,620px)] flex flex-col shadow-2xl"
      >
        {/* Header - Fixed & Compact, pl-5 sm:pl-6 pr-14 sm:pr-16 + mr-3 to guarantee no collision with close button */}
        <div className="shrink-0 bg-[#FAF8F5] border-b border-[#F0EBE6] pl-5 sm:pl-6 pr-14 sm:pr-16 py-3.5 select-none">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#991B1B] min-w-0">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">CHI TIẾT KÝ QUỸ ESCROW</span>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 mr-2 sm:mr-3 ${statusCfg.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 mr-1.5 ${statusCfg.dotColor}`} />
              <span className="whitespace-nowrap">{statusCfg.label}</span>
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-2.5">
            <DialogTitle className="text-xl font-bold font-sans text-stone-900 tracking-tight leading-none">
              {row.id}
            </DialogTitle>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 bg-white px-2 py-0.5 rounded-md border border-[#E7E5E4] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          <DialogDescription className="text-[11px] text-stone-500 mt-1 truncate">
            Bảo đảm thanh toán • Hợp đồng <strong className="text-stone-700 font-semibold">{row.contractCode}</strong> ({row.workTitle})
          </DialogDescription>
        </div>

        {/* Content Body - Scrollable if needed, compact spacing */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3">
          {/* 1. 3 Financial Cards - Compact 3 Columns */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5 bg-stone-50/90 border border-[#E7E5E4] space-y-0.5">
              <span className="text-[10px] font-medium text-stone-500 block truncate">
                Số tiền ký quỹ (Gross)
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold font-sans tabular-nums text-stone-900 block leading-tight">
                {formatCurrencyVND(row.grossAmount)}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                Người đặt chuyển vào
              </span>
            </div>

            <div className="rounded-xl p-2.5 bg-rose-50/50 border border-rose-100 space-y-0.5">
              <span className="text-[10px] font-medium text-[#991B1B] block truncate">
                Phí sàn ({row.feePercent}%)
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold font-sans tabular-nums text-[#991B1B] block leading-tight">
                {formatCurrencyVND(row.platformFee)}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                Nền tảng Sử Ký
              </span>
            </div>

            <div className="rounded-xl p-2.5 bg-emerald-50/50 border border-emerald-100 space-y-0.5">
              <span className="text-[10px] font-medium text-emerald-700 block truncate">
                Thực nhận ({100 - row.feePercent}%)
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold font-sans tabular-nums text-emerald-700 block leading-tight">
                {formatCurrencyVND(row.netAmount)}
              </span>
              <span className="text-[10px] text-stone-400 block truncate">
                Giải ngân cho Creator
              </span>
            </div>
          </div>

          {/* 2. Parties Comparison - Compact Box */}
          <div className="rounded-xl border border-[#F0EBE6] p-3 bg-white space-y-2">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Các bên tham gia giao dịch
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Bên ký quỹ */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF8F5] border border-[#F0EBE6]">
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {extractInitials(payerName)}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">
                      Bên ký quỹ (Khách hàng)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-900 block truncate" title={payerName}>
                    {payerName}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate" title={payerEmail}>
                    {payerEmail}
                  </span>
                </div>
              </div>

              {/* Bên nhận */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF8F5] border border-[#F0EBE6]">
                <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {extractInitials(payeeName)}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider">
                      Bên nhận (Thuyết minh viên)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-900 block truncate" title={payeeName}>
                    {payeeName}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate" title={payeeEmail}>
                    {payeeEmail}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Contract & Milestone Detail - Compact Table */}
          <div className="rounded-xl border border-[#F0EBE6] p-3 bg-white space-y-2">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Thông tin liên kết Hợp đồng & Lộ trình
            </span>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Mã hợp đồng:</span>
                <span className="font-semibold text-stone-900 tabular-nums">{row.contractCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Tác phẩm:</span>
                <span className="font-semibold text-stone-900 truncate max-w-[120px]" title={row.workTitle}>
                  {row.workTitle}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Giai đoạn Milestone:</span>
                <span className="font-semibold text-stone-900 truncate max-w-[120px]" title={milestoneTitle}>
                  {milestoneTitle}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Phương thức:</span>
                <span className="font-semibold text-stone-900">{row.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Thời điểm ký quỹ:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {row.date} {row.time}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE6]">
                <span className="text-stone-400 text-[11px]">Cơ chế giải ngân:</span>
                <span className="font-semibold text-emerald-700">Duyệt nghiệm thu / 3 ngày</span>
              </div>
            </div>
          </div>

          {/* 4. Escrow Protection Notice - Ultra Compact */}
          <div className="rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] p-2.5 flex items-center gap-2 text-[11px] text-[#991B1B] leading-tight">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#991B1B]" />
            <span>
              Ký quỹ Escrow bảo đảm an toàn 100%. Tiền được giải ngân khi nghiệm thu hoặc sau 3 ngày đối soát.
            </span>
          </div>
        </div>

        {/* Modal Footer - Fixed & Compact */}
        <div className="shrink-0 bg-[#FAF8F5] border-t border-[#F0EBE6] px-5 py-2.5 flex items-center justify-between gap-2 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 px-3.5 rounded-xl border border-[#E7E5E4] text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {onViewMilestoneBreakdown && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onViewMilestoneBreakdown(row);
                }}
                className="h-8 px-3 rounded-xl border border-[#E7E5E4] text-xs font-medium text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1.5"
              >
                <Layers className="h-3 w-3 text-stone-500" />
                <span>Đối soát lộ trình HĐ</span>
              </Button>
            )}

            {onViewContract && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  onViewContract(row.contractId);
                }}
                className="h-8 px-3.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Xem hợp đồng</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
