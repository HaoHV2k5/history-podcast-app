import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Layers,
  MessageSquare,
  FileText,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CommissionItem } from '@/types/commission';
import { formatDateTime } from '@/utils/formatters';
import { resolveCommissionThumbnail } from '../utils/thumbnailResolver';

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
  const navigate = useNavigate();

  if (!commission) return null;

  const requesterName = commission.requesterFullName || 'Khán giả';
  const requesterInitial = requesterName[0].toUpperCase();
  const thumbnailUrl = resolveCommissionThumbnail(commission.title, commission.contentType);
  const isSeries = commission.contentType === 'SERIES';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-2xl" className="p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {/* 1. Header with Tags & Status */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Content Type Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-[#A31D24] border border-rose-200/60 font-sans">
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
            <span className="text-xs font-mono font-medium text-stone-500">
              Đơn đặt #{commission.id}
            </span>
          </div>

          {/* Status Badge */}
          <div className="mr-8">
            {commission.status === 'ACCEPTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF2F6] text-[#334155] border border-[#CBD5E1]/70 font-sans">
                <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0" />
                <span>Đã nhận đơn</span>
              </span>
            )}
            {commission.status === 'CONTRACT_SENT' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]/70 font-sans">
                <span className="h-2 w-2 rounded-full bg-[#64748B] shrink-0" />
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

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Hero Artwork & Full Title Banner */}
          <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 select-none shadow-xs group">
            <img
              src={thumbnailUrl}
              alt={commission.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/studio/topic-bach-dang-938.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold font-sans uppercase tracking-wider">
                  {isSeries ? 'Series Tác Phẩm Lịch Sử' : 'Tác Phẩm Video Độc Lập'}
                </span>
                <span className="text-[11px] text-stone-300 font-mono">
                  {formatDateTime(commission.createdAt)}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold font-serif text-white tracking-tight leading-snug line-clamp-2">
                {commission.title}
              </h2>
            </div>
          </div>

          {/* Requester Information Card */}
          <div className="p-4 rounded-xl border border-stone-200/80 bg-[#FAF8F5] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-white border border-stone-300 flex items-center justify-center shrink-0 font-bold text-stone-700 shadow-2xs font-sans overflow-hidden">
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
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-stone-900 truncate font-sans">
                    {requesterName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    <span>Khán giả đặt làm</span>
                  </span>
                </div>
                {commission.requesterEmail && (
                  <p className="text-[11px] text-stone-500 font-mono truncate">
                    {commission.requesterEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-stone-400 block font-sans">Thời điểm gửi</span>
              <span className="font-mono text-xs text-stone-600 font-medium">
                {formatDateTime(commission.createdAt)}
              </span>
            </div>
          </div>

          {/* Detailed Request Brief / Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 font-sans">
              <FileText className="h-3.5 w-3.5 text-[#A31D24]" />
              <span>Nội dung yêu cầu chi tiết &amp; Bối cảnh lịch sử</span>
            </h3>
            <div className="p-4 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed space-y-2 font-sans whitespace-pre-line shadow-2xs">
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

          {/* Connected Contract or Series Quick Jump Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Option A: Connected Contract */}
            {commission.contractId ? (
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 font-sans">
                    <FileText className="h-3.5 w-3.5 text-[#A31D24]" />
                    <span>Hợp đồng &amp; Lộ trình Milestone</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-normal font-sans">
                    Đã lập hợp đồng #{commission.contractId}. Kiểm tra các mốc ký quỹ và tiến độ bàn giao.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onViewContract(commission.contractId!);
                  }}
                  className="w-full text-xs h-8 justify-between border-stone-300 hover:border-[#A31D24] hover:text-[#A31D24] cursor-pointer"
                >
                  <span>Xem bảng tiến độ Milestone</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 font-sans">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>Lập lộ trình sản xuất</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-normal font-sans">
                    Chia nhỏ nội dung thành các mốc Milestone để ký quỹ Escrow an toàn với khán giả.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onOpenRoadmap(commission);
                  }}
                  className="w-full text-xs h-8 justify-between border-stone-300 hover:border-[#A31D24] hover:text-[#A31D24] cursor-pointer"
                >
                  <span>Thiết lập Milestone</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Option B: Series or Video Navigation */}
            {isSeries ? (
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 font-sans">
                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Quản lý Tuyển tập Series</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-normal font-sans">
                    Xem danh sách các tuyển tập và sắp xếp thứ tự các tập video trong series trên kênh.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate('/creator/series');
                  }}
                  className="w-full text-xs h-8 justify-between border-stone-300 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer"
                >
                  <span>Mở trang Tuyển tập Series</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 font-sans">
                    <Video className="h-3.5 w-3.5 text-rose-600" />
                    <span>Creator Studio &amp; Thư viện</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-normal font-sans">
                    Bắt đầu soạn kịch bản, tạo giọng lồng tiếng lịch sử hoặc kiểm tra thư viện tác phẩm.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate('/creator/create');
                  }}
                  className="w-full text-xs h-8 justify-between border-stone-300 hover:border-rose-600 hover:text-rose-600 cursor-pointer"
                >
                  <span>Mở Creator Studio</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Footer Action Buttons */}
        <div className="px-6 py-4 bg-stone-50/80 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 border-stone-200 text-stone-600 hover:text-stone-900 cursor-pointer font-sans"
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
                    className="text-xs h-9 px-3.5 border-stone-200 text-rose-700 hover:bg-rose-50 hover:border-rose-200 cursor-pointer font-sans"
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
                    Chấp nhận đơn
                  </Button>
                )}
              </>
            )}

            {/* Chat button for active statuses */}
            {commission.status !== 'REJECTED' && commission.status !== 'CANCELLED' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onOpenChat(commission);
                }}
                className="text-xs h-9 px-3.5 border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <MessageSquare className="h-3.5 w-3.5 text-stone-500" />
                <span>Phòng Chat 1-1</span>
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
            {(commission.status === 'CONTRACT_SENT' || commission.status === 'COMPLETED') && commission.contractId && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onViewContract(commission.contractId!);
                }}
                className="text-xs h-9 px-4 bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs flex items-center gap-1.5 cursor-pointer font-sans font-semibold"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Xem lộ trình đã gửi</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

