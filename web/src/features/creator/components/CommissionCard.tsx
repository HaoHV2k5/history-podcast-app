import React, { useState } from 'react';
import {
  Video,
  Layers,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
  MoreVertical,
  Check,
  Copy,
  Eye,
} from 'lucide-react';
import { CommissionItem } from '@/types/commission';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface CommissionCardProps {
  commission: CommissionItem;
  onAccept: (id: number) => void;
  onReject: (commission: CommissionItem) => void;
  onOpenChat: (commission: CommissionItem) => void;
  onOpenRoadmap: (commission: CommissionItem) => void;
  onViewContract: (contractId: number) => void;
  onViewDetail?: (commission: CommissionItem) => void;
  isAccepting?: boolean;
}

export const CommissionCard: React.FC<CommissionCardProps> = ({
  commission,
  onAccept,
  onReject,
  onOpenChat,
  onOpenRoadmap,
  onViewContract,
  onViewDetail,
  isAccepting,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const requesterName = commission.requesterFullName || 'Khán giả';
  const requesterInitial = requesterName[0].toUpperCase();
  const isSeries = commission.contentType === 'SERIES';

  const handleCopyId = () => {
    navigator.clipboard?.writeText(String(commission.id));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1200);
  };

  return (
    <article
      className="rounded-xl border border-[#EBE4D8] bg-white px-4 py-3 shadow-2xs hover:border-[#D5CFC5] hover:shadow-xs transition-all duration-200 group flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch"
      aria-label={`Yêu cầu đặt nội dung #${commission.id}: ${commission.title}`}
    >
      {/* 1. Left/Middle: Content & Metadata */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1.5">
        <div className="space-y-1">
          {/* Top Single Line: Badges + Title */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#A31D24] border border-rose-200/60 font-sans shrink-0">
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

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider bg-[#FAF8F4] text-[#685D4F] border border-[#EBE4D8] shrink-0">
              ĐƠN #{commission.id}
            </span>

            {commission.contractId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAF8F4] text-[#685D4F] border border-[#EBE4D8] font-sans shrink-0">
                Đã lập HĐ #{commission.contractId}
              </span>
            )}

            <h3
              role="button"
              tabIndex={0}
              onClick={() => onViewDetail?.(commission)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewDetail?.(commission);
                }
              }}
              title={`Xem chi tiết ${commission.contentType === 'SERIES' ? 'series' : 'video'}: ${commission.title}`}
              className="text-sm font-bold text-stone-900 hover:text-[#A31D24] group-hover:text-[#A31D24] transition-colors truncate font-sans cursor-pointer focus:outline-none focus-visible:underline text-left min-w-0"
            >
              {commission.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-xs text-stone-600 line-clamp-1 leading-relaxed break-words font-sans">
            {commission.description}
          </p>
        </div>

        {/* Rejection Reason Alert if any */}
        {commission.rejectionReason && (
          <div className="px-2.5 py-1.5 rounded-lg bg-rose-50/80 border border-rose-200 text-xs text-rose-900 flex items-center gap-1.5 break-words font-sans">
            <AlertCircle className="h-3 w-3 text-rose-700 shrink-0" />
            <span className="font-bold text-[10px] uppercase text-rose-700 shrink-0">
              Lý do từ chối:
            </span>
            <span className="text-[11px] italic text-rose-800 truncate">
              &ldquo;{commission.rejectionReason}&rdquo;
            </span>
          </div>
        )}

        {/* Requester & Timestamp Meta Row */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-5 w-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-stone-700 overflow-hidden font-sans">
              {commission.requesterAvatarUrl ? (
                <img
                  src={commission.requesterAvatarUrl}
                  alt={requesterName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                requesterInitial
              )}
            </div>
            <span className="font-medium text-stone-700 truncate max-w-[160px] font-sans">
              {requesterName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono shrink-0">
            <Clock className="h-3 w-3 text-stone-400 shrink-0" />
            <span>{formatDateTime(commission.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 2. Right: Status Badge & Horizontal Action Buttons */}
      <div className="shrink-0 flex flex-col justify-between items-start sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        {/* Status Badge with colored dot */}
        <div className="self-start sm:self-end">
          {commission.status === 'ACCEPTED' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2F6] text-[#334155] border border-[#CBD5E1]/70 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] shrink-0" />
              <span>Đã nhận đơn</span>
            </span>
          )}

          {commission.status === 'CONTRACT_SENT' && commission.contractStatus === 'COMPLETED' && (<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" /><span>Hoàn thành</span></span>)} {commission.status === 'CONTRACT_SENT' && commission.contractStatus === 'ACTIVE' && (<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /><span>Đang thực hiện lộ trình</span></span>)} {commission.status === 'CONTRACT_SENT' && commission.contractStatus !== 'COMPLETED' && commission.contractStatus !== 'ACTIVE' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]/70 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
              <span>Đã gửi lộ trình</span>
            </span>
          )}

          {commission.status === 'PENDING' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Chờ phản hồi</span>
            </span>
          )}

          {commission.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Hoàn thành</span>
            </span>
          )}

          {commission.status === 'REJECTED' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/70 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Đã từ chối</span>
            </span>
          )}

          {commission.status === 'CANCELLED' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" />
              <span>Đã hủy</span>
            </span>
          )}
        </div>

        {/* Action Buttons Row: Strictly single horizontal line with no line breaks */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap w-full sm:w-auto justify-end">
          {/* Case 1: PENDING */}
          {commission.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => onReject(commission)}
                className="h-8 px-3 text-xs font-medium rounded-lg border border-stone-200 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-200 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer font-sans"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => onAccept(commission.id)}
                disabled={isAccepting}
                className="h-8 px-3.5 text-xs font-semibold rounded-lg bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer font-sans"
              >
                {isAccepting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  'Chấp nhận thảo luận'
                )}
              </button>
            </>
          )}

          {/* Case 2: ACCEPTED */}
          {commission.status === 'ACCEPTED' && (
            <>
              <button
                type="button"
                onClick={() => onOpenChat(commission)}
                className="h-8 px-3 text-xs font-semibold rounded-lg border border-[#E5E0D8] bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer font-sans"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#A31D24] shrink-0" />
                <span className="whitespace-nowrap">Mở chat với khách hàng</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenRoadmap(commission)}
                className="h-8 px-3 text-xs font-semibold rounded-lg bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs flex items-center gap-1.5 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer font-sans"
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Lập lộ trình Milestone</span>
              </button>
            </>
          )}

          {/* Case 3: CONTRACT_SENT */}
          {(commission.status === 'CONTRACT_SENT' || commission.status === 'COMPLETED') && commission.contractId && (
            <button
              type="button"
              onClick={() => onViewContract(commission.contractId!)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-[#E5E0D8] bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-300 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer font-sans"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#A31D24] shrink-0" />
              <span className="whitespace-nowrap">{commission.contractStatus === 'COMPLETED' || commission.status === 'COMPLETED' ? 'Xem hợp đồng hoàn tất' : commission.contractStatus === 'ACTIVE' ? 'Xem tiến độ hợp đồng' : 'Xem lộ trình đã gửi'}</span>
            </button>
          )}

          {/* More options menu ⋮ */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Tùy chọn khác"
              className={cn(
                'h-8 w-8 rounded-lg border border-[#E5E0D8] bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-50 hover:border-stone-300 flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer shrink-0',
                menuOpen && 'bg-stone-100 text-stone-800'
              )}
            >
              <MoreVertical className="h-4 w-4 shrink-0" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-1 sm:mb-0 sm:mt-1 z-30 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150 font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors whitespace-nowrap"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  )}
                  <span>{copied ? 'Đã sao chép mã!' : `Mã đơn #${commission.id}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewDetail?.(commission);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors whitespace-nowrap"
                >
                  <Eye className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span>Xem chi tiết yêu cầu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenChat(commission);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span>Mở chat với khách hàng</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
