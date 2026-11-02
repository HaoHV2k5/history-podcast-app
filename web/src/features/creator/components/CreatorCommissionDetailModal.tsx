import React from 'react';
import {
  Video,
  Layers,
  MessageSquare,
  FileText,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CommissionItem } from '@/types/commission';
import { formatDateTime } from '@/utils/formatters';

interface CreatorCommissionDetailModalProps {
  commission: CommissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (commission: CommissionItem) => void;
  onOpenRoadmap: (commission: CommissionItem) => void;
  onViewContract: (contractId: number) => void;
  onAccept?: (commissionId: number) => void;
  onReject?: (commission: CommissionItem) => void;
}

export const CreatorCommissionDetailModal: React.FC<CreatorCommissionDetailModalProps> = ({
  commission,
  isOpen,
  onClose,
  onOpenChat,
  onOpenRoadmap,
  onViewContract,
  onAccept,
  onReject,
}) => {
  if (!commission) return null;

  const requesterName = commission.requesterFullName || 'Khán giả';
  const requesterInitial = requesterName[0].toUpperCase();
  const isSeries = commission.contentType === 'SERIES';
  const canOpenChat =
    commission.status === 'ACCEPTED' ||
    commission.status === 'CONTRACT_SENT' ||
    commission.status === 'COMPLETED' ||
    commission.status === 'CANCELLED';
  const isArchivedChat =
    commission.status === 'COMPLETED' || commission.status === 'CANCELLED';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-2xl"
        className="p-0 overflow-hidden bg-[#FBF8F3] border border-[#E5DEC9] rounded-2xl max-h-[88vh] flex flex-col z-[65]"
      >
        {/* 1. Editorial Header with Title, Type Tag & Status */}
        <div className="px-6 pt-5 pb-4 bg-white border-b border-[#EBE4D8] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-8 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Content Type Pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDE9E9] text-[#A31D24] border border-rose-200/60 font-sans">
                {isSeries ? (
                  <>
                    <Layers className="h-3 w-3 shrink-0" />
                    <span>SERIES NHIỀU TẬP</span>
                  </>
                ) : (
                  <>
                    <Video className="h-3 w-3 shrink-0" />
                    <span>VIDEO LẺ</span>
                  </>
                )}
              </span>

              {/* Commission Code */}
              <span className="text-xs font-mono font-semibold text-[#685D4F]">
                Đơn đặt #{commission.id}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] text-[#8C8070] font-medium">
                <Calendar className="h-3 w-3 text-[#8C8070]" />
                {formatDateTime(commission.createdAt)}
              </span>
            </div>

            {/* Status Badge */}
            <div>
              {commission.status === 'ACCEPTED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF2F6] text-[#334155] border border-[#CBD5E1]/70 font-sans">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0" />
                  <span>Đã nhận đơn</span>
                </span>
              )}
              {commission.status === 'CONTRACT_SENT' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF7E6] text-[#B45309] border border-[#FDE68A] font-sans">
                  <span className="h-2 w-2 rounded-full bg-[#D97706] shrink-0" />
                  <span>Đã gửi lộ trình</span>
                </span>
              )}
              {commission.status === 'PENDING' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 font-sans">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>Chờ phản hồi</span>
                </span>
              )}
              {commission.status === 'COMPLETED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Hoàn thành</span>
                </span>
              )}
              {commission.status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/70 font-sans">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Đã từ chối</span>
                </span>
              )}
              {commission.status === 'CANCELLED' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200 font-sans">
                  <span className="h-2 w-2 rounded-full bg-stone-400 shrink-0" />
                  <span>Đã hủy</span>
                </span>
              )}
            </div>
          </div>

          <DialogTitle className="text-lg sm:text-xl font-bold font-serif text-[#1E1810] tracking-tight leading-snug">
            {commission.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chi tiết đơn đặt làm nội dung #{commission.id} từ khán giả {requesterName}
          </DialogDescription>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Requester Information Card */}
          <div className="p-3.5 rounded-xl border border-[#EBE4D8] bg-white flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-[#FDE9E9] border border-rose-200/60 flex items-center justify-center shrink-0 font-bold text-[#A31D24] font-sans overflow-hidden">
                {commission.requesterAvatarUrl ? (
                  <img
                    src={commission.requesterAvatarUrl}
                    alt={requesterName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  requesterInitial
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-[#1E1810] truncate font-sans">
                    {requesterName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    <span>Khán giả đặt làm</span>
                  </span>
                </div>
                {commission.requesterEmail && (
                  <p className="text-[11px] text-[#685D4F] font-mono truncate">
                    {commission.requesterEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#8C8070] block font-sans">Loại nội dung đặt</span>
              <span className="text-xs font-bold text-[#1E1810]">
                {isSeries ? 'Dự án nhiều tập (Series)' : 'Video độc lập'}
              </span>
            </div>
          </div>

          {/* Detailed Request Brief / Description */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#685D4F] flex items-center gap-1.5 font-sans">
              <FileText className="h-3.5 w-3.5 text-[#A31D24]" />
              <span>Nội dung yêu cầu chi tiết &amp; Bối cảnh lịch sử</span>
            </h3>
            <div className="p-4 rounded-xl bg-white border border-[#EBE4D8] text-xs sm:text-sm text-[#1E1810] leading-relaxed font-sans whitespace-pre-line shadow-2xs">
              {commission.description || 'Khán giả chưa để lại mô tả chi tiết cho yêu cầu này.'}
            </div>
          </div>

          {/* Rejection Alert if rejected */}
          {commission.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1 font-sans">
              <span className="font-bold text-[11px] uppercase text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Lý do từ chối:
              </span>
              <p className="text-xs italic leading-relaxed text-rose-800">
                &ldquo;{commission.rejectionReason}&rdquo;
              </p>
            </div>
          )}

          {/* Milestone Delivery & Privacy Rule Card (Single Full-width Card — No Public Series Redirect) */}
          <div className="rounded-xl border border-[#EBE4D8] bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1810] font-sans">
                  {commission.contractId ? (
                    <>
                      <FileText className="h-3.5 w-3.5 text-[#A31D24]" />
                      <span>Hợp đồng &amp; Lộ trình Milestone #{commission.contractId}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-[#D97706]" />
                      <span>Quy trình Lập lộ trình &amp; Bàn giao Milestone riêng tư</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-[#685D4F] leading-relaxed font-sans">
                  {commission.contractId
                    ? `Đơn này đã được lập Hợp đồng #${commission.contractId}. Toàn bộ tệp video/audio/kịch bản được nộp và nghiệm thu riêng tư theo từng mốc Milestone trong hợp đồng (không tự động đăng công khai lên kênh).`
                    : 'Sau khi thống nhất qua phòng Chat 1-1, bạn lập lộ trình từ 1–20 mốc Milestone. Sản phẩm được bàn giao riêng tư theo từng mốc để khách hàng nghiệm thu và giải ngân Escrow 95%.'}
                </p>
              </div>

              {commission.contractId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onViewContract(commission.contractId!);
                  }}
                  className="text-xs h-8 px-3 border-[#DDD4C2] hover:border-[#A31D24] hover:text-[#A31D24] cursor-pointer shrink-0"
                >
                  <span>Mở Hợp đồng #{commission.contractId}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : commission.status === 'ACCEPTED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onOpenRoadmap(commission);
                  }}
                  className="text-xs h-8 px-3 border-[#DDD4C2] hover:border-[#A31D24] hover:text-[#A31D24] cursor-pointer shrink-0"
                >
                  <span>Thiết lập Milestone</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 pt-2.5 border-t border-[#F2ECE1] text-[11px] text-[#685D4F]">
              <Lock className="h-3 w-3 text-[#A31D24] shrink-0" />
              <span>
                Sản phẩm bàn giao thuộc phạm vi hợp đồng đặt riêng — chỉ đăng lên kênh công khai nếu có thỏa thuận cho phép từ khách hàng.
              </span>
            </div>
          </div>
        </div>

        {/* 3. Footer Action Buttons */}
        <div className="px-6 py-3.5 bg-white border-t border-[#EBE4D8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 border-[#DDD4C2] text-[#4A4238] hover:text-[#1E1810] cursor-pointer font-sans"
          >
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {/* PENDING: Accept / Reject */}
            {commission.status === 'PENDING' && (
              <>
                {onReject && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onReject(commission);
                    }}
                    className="text-xs h-9 px-3.5 border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer font-sans"
                  >
                    Từ chối
                  </Button>
                )}
                {onAccept && (
                  <Button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAccept(commission.id);
                    }}
                    className="text-xs h-9 px-4 bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs cursor-pointer font-sans font-semibold"
                  >
                    Chấp nhận đơn &amp; Mở chat
                  </Button>
                )}
              </>
            )}

            {/* Chat button ONLY when unlocked (ACCEPTED, CONTRACT_SENT, COMPLETED, CANCELLED) */}
            {canOpenChat && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onOpenChat(commission);
                }}
                className="text-xs h-9 px-3.5 border-[#DDD4C2] bg-white text-[#1E1810] hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#A31D24]" />
                <span>{isArchivedChat ? 'Xem lịch sử chat' : 'Mở chat với khách hàng'}</span>
              </Button>
            )}

            {/* ACCEPTED: Set up roadmap */}
            {commission.status === 'ACCEPTED' && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRoadmap(commission);
                }}
                className="text-xs h-9 px-4 bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs flex items-center gap-1.5 cursor-pointer font-sans font-semibold"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Lập lộ trình Milestone</span>
              </Button>
            )}

            {/* CONTRACT_SENT / COMPLETED: View Contract */}
            {(commission.status === 'CONTRACT_SENT' || commission.status === 'COMPLETED') &&
              commission.contractId && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewContract(commission.contractId!);
                  }}
                  className="text-xs h-9 px-4 bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs flex items-center gap-1.5 cursor-pointer font-sans font-semibold"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Xem chi tiết Hợp đồng</span>
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
