import React from 'react';
import { Download } from 'lucide-react';
import type { KycStatsResult } from '../kycLogic';
import { cn } from '@/utils/cn';

interface AdminKycFilterTabsProps {
  activeStatus: string;
  onSelectStatus: (status: string) => void;
  stats: KycStatsResult;
  onExport: () => void;
  isExporting?: boolean;
}

export const AdminKycFilterTabs: React.FC<AdminKycFilterTabsProps> = ({
  activeStatus,
  onSelectStatus,
  stats,
  onExport,
  isExporting,
}) => {
  const tabs = [
    { id: '', label: 'Tất cả', count: stats.total },
    { id: 'PENDING', label: 'Chờ duyệt', count: stats.pending },
    { id: 'APPROVED', label: 'Đã phê duyệt', count: stats.approved },
    { id: 'REJECTED', label: 'Bị từ chối', count: stats.rejected },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE4D8] pb-0 select-none">
      {/* 1. Left: Filter Status Tabs matching Mockup */}
      <div
        role="tablist"
        aria-label="Lọc theo trạng thái hồ sơ KYC"
        className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id || 'all'}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id || 'all'}`}
              onClick={() => onSelectStatus(tab.id)}
              className={cn(
                'relative flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[14px] font-medium transition-all duration-150 focus:outline-none cursor-pointer',
                isActive
                  ? 'text-[#991B1B] font-bold'
                  : 'text-[#4B5563] hover:text-[#111827]'
              )}
            >
              <span>{tab.label}</span>
              {/* Separate count pill badge matching mockup */}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold leading-none',
                  isActive
                    ? 'bg-[#FDE8E8] text-[#991B1B]'
                    : 'bg-[#F3F4F6] text-[#6B7280]'
                )}
              >
                ({tab.count})
              </span>

              {/* Active Red Underline Bar matching mockup */}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#991B1B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Right: Export List Button matching Mockup */}
      <div className="flex items-center justify-end shrink-0 pb-2 sm:pb-2.5">
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-xs sm:text-[13px] font-semibold text-[#1F2937] shadow-2xs hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] disabled:opacity-50 cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#374151] stroke-[2]" />
          <span>{isExporting ? 'Đang xuất...' : 'Xuất danh sách'}</span>
        </button>
      </div>
    </div>
  );
};
