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
  Eye,
} from 'lucide-react';
import { ContractItem } from '@/types/contract';
import { formatDate, formatVND } from '@/utils/formatters';
import { resolveCommissionThumbnail } from '../utils/thumbnailResolver';
import { cn } from '@/utils/cn';

interface ContractCardProps {
  contract: ContractItem;
  onViewDetail: (contractId: number) => void;
  onEditRoadmap?: (contract: ContractItem) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onViewDetail,
  onEditRoadmap,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const milestones = contract.milestones || [];
  const totalCount = milestones.length;
  const completedCount = milestones.filter(
    (m) => m.status === 'RELEASED' || m.status === 'APPROVED'
  ).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const requesterName = contract.requesterFullName || contract.freelancerFullName || 'Khán giả';
  const requesterInitial = requesterName[0].toUpperCase();
  const thumbnailUrl = resolveCommissionThumbnail(contract.title, contract.contentType);

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
      className="rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#D5CFC5] hover:shadow-xs transition-all duration-200 group flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch"
      aria-label={`Hợp đồng #${contract.id}: ${contract.title || 'Sản xuất nội dung'}`}
    >
      {/* 1. Left: 16:9 Thumbnail Image with Contract ID badge */}
      <div
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
        className="w-full sm:w-48 md:w-52 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-stone-200/80 relative bg-stone-100 select-none cursor-pointer group/thumb focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]"
      >
        <img
          src={thumbnailUrl}
          alt={contract.title || 'Hợp đồng'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/studio/topic-bach-dang-938.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-black/60 text-white backdrop-blur-xs">
          HỢP ĐỒNG #{contract.id}
        </span>

        {/* Hover Cue: "Xem tiến độ" */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium border border-white/20 shadow-md">
            <Eye className="h-3.5 w-3.5 text-rose-300" />
            <span>Xem tiến độ</span>
          </span>
        </div>
      </div>

      {/* 2. Middle: Content & Progress */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#A31D24] border border-rose-200/60 font-sans">
              <Layers className="h-3 w-3 shrink-0" />
              <span>LỘ TRÌNH MILESTONE</span>
            </span>
          </div>

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
            className="text-sm sm:text-base font-bold text-stone-900 hover:text-[#A31D24] group-hover:text-[#A31D24] transition-colors line-clamp-1 break-words font-sans cursor-pointer focus:outline-none focus-visible:underline text-left"
          >
            {contract.title || 'Hợp đồng sản xuất nội dung'}
          </h3>
        </div>

        {/* Milestone Progress Bar */}
        <div className="space-y-1.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE4D8]/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium text-[11px] font-sans">
              Tiến độ bàn giao:
            </span>
            <span className="font-mono font-bold text-stone-800 text-[11px]">
              {completedCount}/{totalCount} mốc ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-stone-200/80 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Requester & Timestamp Meta Row */}
        <div className="flex items-center gap-4 text-xs text-stone-500 pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-5 w-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-stone-700 overflow-hidden font-sans">
              <span>{requesterInitial}</span>
            </div>
            <span className="font-medium text-stone-700 truncate max-w-[150px] font-sans">
              {requesterName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono shrink-0">
            <Clock className="h-3 w-3 text-stone-400 shrink-0" />
            <span>Tạo {formatDate(contract.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 3. Right: Status, Financials & Actions */}
      <div className="shrink-0 flex flex-col justify-between items-start sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        {/* Status Badge */}
        <div className="self-start sm:self-end">
          {contract.status === 'ACTIVE' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Đang thực hiện</span>
            </span>
          )}

          {contract.status === 'PENDING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 font-sans">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span>Chờ khách duyệt</span>
            </span>
          )}

          {contract.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-sans">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Đã hoàn tất</span>
            </span>
          )}

          {contract.status === 'REJECTED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/70 font-sans">
              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
              <span>Khách từ chối</span>
            </span>
          )}

          {contract.status === 'CANCELLED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200 font-sans">
              <span className="h-2 w-2 rounded-full bg-stone-400 shrink-0" />
              <span>Đã hủy</span>
            </span>
          )}
        </div>

        {/* Financial info */}
        <div className="text-left sm:text-right space-y-0.5 font-sans">
          <div className="text-xs text-stone-500">
            Bạn nhận (95%):{' '}
            <strong className="font-mono text-emerald-700 font-bold text-sm">
              {formatVND(netEarned)}
            </strong>
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            Tổng giá trị: {formatVND(contract.totalAmount || 0)}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap w-full sm:w-auto justify-end">
          {onEditRoadmap && (contract.status === 'PENDING' || contract.status === 'REJECTED') && (
            <button
              type="button"
              onClick={() => onEditRoadmap(contract)}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-[#A31D24] hover:bg-rose-50 hover:border-rose-200 flex items-center gap-1.5 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer font-sans"
            >
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Sửa lộ trình</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetail(contract.id)}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] shadow-xs flex items-center gap-1.5 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer font-sans"
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
                'h-9 w-9 rounded-xl border border-[#E5E0D8] bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-50 hover:border-stone-300 flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer shrink-0',
                menuOpen && 'bg-stone-100 text-stone-800'
              )}
            >
              <MoreVertical className="h-4 w-4 shrink-0" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-1 sm:mb-0 sm:mt-1 z-30 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150 font-sans"
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
