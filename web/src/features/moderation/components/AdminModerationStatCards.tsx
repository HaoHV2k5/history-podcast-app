import React from 'react';
import { FileVideo, CheckCircle2, MinusCircle, Clock } from 'lucide-react';
import { ModerationStats } from '../moderationLogic';
import { cn } from '@/utils/cn';

interface AdminModerationStatCardsProps {
  stats: ModerationStats;
  selectedDecision?: string;
  onSelectDecision?: (decision: string) => void;
  isLoading?: boolean;
}

export const AdminModerationStatCards: React.FC<AdminModerationStatCardsProps> = ({
  stats,
  selectedDecision = '',
  onSelectDecision,
  isLoading = false,
}) => {
  const isCard1Active = selectedDecision === 'PENDING' || selectedDecision === '';
  const isCard2Active = selectedDecision === 'APPROVED';
  const isCard3Active = selectedDecision === 'REJECTED';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* Card 1: Chờ duyệt */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectDecision?.(selectedDecision === 'PENDING' ? '' : 'PENDING')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectDecision?.(selectedDecision === 'PENDING' ? '' : 'PENDING');
          }
        }}
        className={cn(
          'group relative flex items-center gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
          isCard1Active
            ? 'border-[#FCA5A5] bg-[#FEF2F2]/40 shadow-xs ring-1 ring-rose-200/50'
            : 'border-[#EBE4D8] bg-white hover:border-rose-200'
        )}
      >
        {/* Left Icon: Video Document with Play button */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 transition-transform duration-200 group-hover:scale-105">
          <FileVideo className="h-6 w-6 stroke-[1.8]" />
        </div>

        {/* Right Info: Number, Label, Subtitle */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-12 rounded-md bg-stone-100 animate-pulse" />
            ) : (
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight leading-none">
                {stats.pendingCount}
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm text-[#1C1917] leading-tight mt-1.5">
            Chờ duyệt
          </h3>
          <p className="text-xs text-[#78716C] leading-tight mt-0.5 truncate">
            Video đang chờ kiểm duyệt
          </p>
        </div>
      </div>

      {/* Card 2: Đã xuất bản */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectDecision?.(selectedDecision === 'APPROVED' ? '' : 'APPROVED')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectDecision?.(selectedDecision === 'APPROVED' ? '' : 'APPROVED');
          }
        }}
        className={cn(
          'group relative flex items-center gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
          isCard2Active
            ? 'border-[#FCD34D] bg-[#FFFBEB]/40 shadow-xs ring-1 ring-amber-200/50'
            : 'border-[#EBE4D8] bg-white hover:border-amber-200'
        )}
      >
        {/* Left Icon: Amber checkmark in circle */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 transition-transform duration-200 group-hover:scale-105">
          <CheckCircle2 className="h-6 w-6 stroke-[2]" />
        </div>

        {/* Right Info: Number, Label, Subtitle */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-12 rounded-md bg-stone-100 animate-pulse" />
            ) : (
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight leading-none">
                {stats.approvedCount}
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm text-[#1C1917] leading-tight mt-1.5">
            Đã xuất bản
          </h3>
          <p className="text-xs text-[#78716C] leading-tight mt-0.5 truncate">
            Video đã được phê duyệt
          </p>
        </div>
      </div>

      {/* Card 3: Từ chối */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectDecision?.(selectedDecision === 'REJECTED' ? '' : 'REJECTED')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectDecision?.(selectedDecision === 'REJECTED' ? '' : 'REJECTED');
          }
        }}
        className={cn(
          'group relative flex items-center gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
          isCard3Active
            ? 'border-[#93C5FD] bg-[#EFF6FF]/40 shadow-xs ring-1 ring-blue-200/50'
            : 'border-[#EBE4D8] bg-white hover:border-blue-200'
        )}
      >
        {/* Left Icon: Sky blue minus in circle */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200/60 text-sky-600 transition-transform duration-200 group-hover:scale-105">
          <MinusCircle className="h-6 w-6 stroke-[2]" />
        </div>

        {/* Right Info: Number, Label, Subtitle */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-12 rounded-md bg-stone-100 animate-pulse" />
            ) : (
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight leading-none">
                {stats.rejectedCount}
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm text-[#1C1917] leading-tight mt-1.5">
            Từ chối
          </h3>
          <p className="text-xs text-[#78716C] leading-tight mt-0.5 truncate">
            Video bị từ chối phê duyệt
          </p>
        </div>
      </div>

      {/* Card 4: Thời gian duyệt TB */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        {/* Left Icon: Emerald clock */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 transition-transform duration-200 group-hover:scale-105">
          <Clock className="h-6 w-6 stroke-[2]" />
        </div>

        {/* Right Info: Number, Label, Subtitle */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-16 rounded-md bg-stone-100 animate-pulse" />
            ) : (
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight leading-none">
                {stats.avgReviewTimeFormatted}
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm text-[#1C1917] leading-tight mt-1.5">
            Thời gian duyệt TB
          </h3>
          <p className="text-xs text-[#78716C] leading-tight mt-0.5 truncate">
            Thời gian xử lý trung bình
          </p>
        </div>
      </div>
    </div>
  );
};
