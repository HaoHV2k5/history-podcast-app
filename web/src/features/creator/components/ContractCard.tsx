import React, { useState } from 'react';
import {
  Layers,
  ChevronRight,
  Edit3,
  Clock,
  MoreVertical,
  Check,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { ContractItem } from '@/types/contract';
import { formatDate, formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface ContractCardProps {
  contract: ContractItem;
  onViewDetail: (contractId: number) => void;
  onEditRoadmap?: (contract: ContractItem) => void;
  onOpenChat?: (contract: ContractItem) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onViewDetail,
  onEditRoadmap,
  onOpenChat,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const milestones = contract.milestones || [];
  const totalCount = milestones.length;
  const completedCount = milestones.filter(
    (m) => m.status === 'RELEASED' || m.status === 'APPROVED'
  ).length; const releasedCount = milestones.filter((m) => m.status === 'RELEASED').length; const isAllReleased = totalCount > 0 && releasedCount === totalCount; const effectiveStatus = isAllReleased ? 'COMPLETED' : contract.status; const isWaitingEscrowRelease = effectiveStatus === 'ACTIVE' && totalCount > 0 && completedCount === totalCount && !isAllReleased;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Identify which milestone the contract is currently on
  const currentMilestone =
    milestones.find((m) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED') ||
    milestones.find((m) => m.status === 'UNFUNDED' || m.status === 'WAITING') ||
    milestones[milestones.length - 1] ||
    null;

  const isWaitingCustomerFunding =
    contract.status === 'ACTIVE' &&
    !milestones.some((m) => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED') &&
    milestones.some((m) => m.status === 'UNFUNDED');

  const currentStageLabel = (() => {
    if (!currentMilestone || totalCount === 0) return 'Chưa có mốc bàn giao';
    if (effectiveStatus === 'COMPLETED') { return `Đã hoàn tất toàn bộ (${totalCount}/${totalCount} mốc)`; } if (isWaitingEscrowRelease) { return `Đã nghiệm thu ${completedCount}/${totalCount} mốc — Chờ đối soát giải ngân`; } if (false) {
      return `Đã hoàn tất toàn bộ (${totalCount}/${totalCount} mốc)`;
    }
    if (contract.status === 'PENDING') {
      return `Chưa bắt đầu — Chờ khách chấp thuận lộ trình (${totalCount} mốc)`;
    }
    if (contract.status === 'REJECTED') {
      return 'Khách yêu cầu sửa lộ trình — Chờ cập nhật & gửi lại';
    }
    if (contract.status === 'CANCELLED') {
      return `Hợp đồng đã hủy (${completedCount}/${totalCount} mốc hoàn tất)`;
    }
    if (currentMilestone.status === 'SUBMITTED') {
      return `Đang ở Mốc #${currentMilestone.orderNo}/${totalCount}: ${currentMilestone.title} (Chờ khách nghiệm thu)`;
    }
    if (currentMilestone.status === 'IN_PROGRESS') {
      return `Đang ở Mốc #${currentMilestone.orderNo}/${totalCount}: ${currentMilestone.title} (Đang thực hiện)`;
    }
    return `Đang ở Mốc #${currentMilestone.orderNo}/${totalCount}: ${currentMilestone.title} (Chờ khách nạp cọc)`;
  })();

  const requesterName = contract.requesterFullName || contract.freelancerFullName || 'Khán giả';
  const requesterInitial = requesterName[0].toUpperCase();
  const isArchivedChat =
    contract.status === 'CANCELLED' || contract.status === 'COMPLETED';

  const netEarned = contract.netAmount || Math.round((contract.totalAmount || 0) * 0.95);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(String(contract.id));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1200);
  };

  return (
    <article
      className="rounded-xl border border-[#EBE4D8] bg-white px-4 py-3 shadow-2xs hover:border-[#D5CFC5] hover:shadow-xs transition-all duration-200 group flex flex-col gap-2"
      aria-label={`Hợp đồng #${contract.id}: ${contract.title || 'Sản xuất nội dung'}`}
    >
      {/* 1. Top Row (Single Line): Badges + Title on Left | Financials + Status Badge on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#A31D24] border border-rose-200/60 font-sans shrink-0">
            <FileText className="h-3 w-3 shrink-0" />
            <span>HĐ #{contract.id}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#FAF8F4] text-[#685D4F] border border-[#EBE4D8] font-sans shrink-0">
            <Layers className="h-3 w-3 text-[#A31D24] shrink-0" />
            <span>{totalCount} MỐC</span>
          </span>

          <h3
            role="button"
            tabIndex={0}
            onClick={() => onViewDetail(contract.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewDetail(contract.id);
              }
            }}
            title={`Xem chi tiết & tiến độ hợp đồng #${contract.id}: ${contract.title || 'Sản xuất nội dung'}`}
            className="text-sm font-bold text-stone-900 hover:text-[#A31D24] group-hover:text-[#A31D24] transition-colors truncate font-sans cursor-pointer focus:outline-none focus-visible:underline text-left min-w-0"
          >
            {contract.title || 'Hợp đồng sản xuất nội dung'}
          </h3>
        </div>

        {/* Financials + Status Badge Inline */}
        <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2.5 flex-wrap">
          <div className="font-sans flex items-baseline gap-1.5 text-xs">
            <span className="text-stone-500">
              Nhận (95%):{' '}
              <strong className="font-mono text-emerald-700 font-bold text-xs sm:text-sm tabular-nums">
                {formatVND(netEarned)}
              </strong>
            </span>
            <span className="text-[11px] text-stone-400 font-mono tabular-nums">
              / {formatVND(contract.totalAmount || 0)}
            </span>
          </div>

          <div>
            {effectiveStatus === 'ACTIVE' && isWaitingEscrowRelease && (<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/70 font-sans"><span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse shrink-0" /><span>Đã nghiệm thu • Chờ giải ngân</span></span>)} {effectiveStatus === 'ACTIVE' && !isWaitingCustomerFunding && !isWaitingEscrowRelease && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Đang thực hiện</span>
              </span>
            )}

            {contract.status === 'ACTIVE' && isWaitingCustomerFunding && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Đã duyệt • Chờ ký quỹ</span>
              </span>
            )}

            {contract.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Chờ khách duyệt lộ trình</span>
              </span>
            )}

            {effectiveStatus === 'COMPLETED' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Đã hoàn tất</span>
              </span>
            )}

            {contract.status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/70 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Khách yêu cầu sửa lộ trình</span>
              </span>
            )}

            {contract.status === 'CANCELLED' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" />
                <span>Đã hủy</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle Row (Single Slim Line): Full-Width 100% Milestone Progress Strip */}
      <div className="w-full flex items-center justify-between gap-3 bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#EBE4D8]/80">
        <span className="text-stone-700 font-semibold text-[11px] font-sans truncate min-w-0">
          {currentStageLabel}
        </span>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-24 sm:w-36 h-1.5 rounded-full bg-stone-200/80 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono font-bold text-stone-800 text-[11px] tabular-nums">
            {completedCount}/{totalCount} mốc ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* 3. Bottom Row (Single Line): Customer & Timestamp on Left | Compact Action Buttons on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-stone-500 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-5 w-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-stone-700 overflow-hidden font-sans">
              <span>{requesterInitial}</span>
            </div>
            <span className="font-medium text-stone-700 truncate max-w-[180px] font-sans">
              {requesterName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono shrink-0">
            <Clock className="h-3 w-3 text-stone-400 shrink-0" />
            <span>Tạo {formatDate(contract.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap w-full sm:w-auto justify-end">
          {onOpenChat && (
            <button
              type="button"
              onClick={() => onOpenChat(contract)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-[#E5E0D8] bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer font-sans"
              title="Mở chat với khách hàng của hợp đồng này"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#A31D24] shrink-0" />
              <span className="whitespace-nowrap">
                {isArchivedChat ? 'Xem lịch sử chat' : 'Mở chat với khách hàng'}
              </span>
            </button>
          )}

          {onEditRoadmap && (contract.status === 'PENDING' || contract.status === 'REJECTED') && (
            <button
              type="button"
              onClick={() => onEditRoadmap(contract)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-[#A31D24] hover:bg-rose-50 hover:border-rose-200 flex items-center gap-1.5 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer font-sans"
            >
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Sửa lộ trình</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetail(contract.id)}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs flex items-center gap-1 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer font-sans"
          >
            <span className="whitespace-nowrap">Chi tiết &amp; Tiến độ</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </button>

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
                  <span>{copied ? 'Đã sao chép!' : `Mã HĐ #${contract.id}`}</span>
                </button>

                {onOpenChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenChat(contract);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors whitespace-nowrap"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Mở chat với khách hàng</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewDetail(contract.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 text-left transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span>Mở bảng tiến độ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
