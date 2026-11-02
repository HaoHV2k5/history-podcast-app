import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface AdminModerationFilterTabsProps {
  decision: string;
  onDecisionChange: (dec: string) => void;
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export const AdminModerationFilterTabs: React.FC<AdminModerationFilterTabsProps> = ({
  decision,
  onDecisionChange,
  counts,
  showAdvanced,
  onToggleAdvanced,
}) => {
  const tabs = [
    { id: '', label: 'Tất cả', count: counts.all },
    { id: 'PENDING', label: 'Chờ duyệt', count: counts.pending },
    { id: 'APPROVED', label: 'Đã xuất bản', count: counts.approved },
    { id: 'REJECTED', label: 'Từ chối', count: counts.rejected },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E0DDD7]/70 pb-0.5 select-none">
      {/* Left: Tab items (No scrollbars, clean flex) */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2" role="tablist">
        {tabs.map((tab) => {
          const isActive = decision === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onDecisionChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]',
                isActive
                  ? 'text-[#991B1B] font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F2EB]/60'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-rose-50 text-[#991B1B] border border-rose-200/60'
                    : 'bg-[#F5F2EB] text-[#78716C]'
                )}
              >
                {tab.count}
              </span>

              {/* Active bottom border indicator */}
              {isActive && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-[#991B1B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Bộ lọc nâng cao */}
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onToggleAdvanced}
          className={cn(
            'flex items-center gap-2 rounded-xl border border-[#E0DDD7] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C1917] shadow-2xs hover:bg-[#F5F2EB] hover:border-[#D6D0C4] transition-all duration-150 active:scale-[0.98]',
            showAdvanced && 'bg-[#F5F2EB] border-[#991B1B] text-[#991B1B]'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Bộ lọc nâng cao</span>
        </Button>
      </div>
    </div>
  );
};
