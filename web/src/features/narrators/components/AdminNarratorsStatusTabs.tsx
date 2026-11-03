import React from 'react';
import { Mic, Clock, RotateCw, CheckCircle2, Ban } from 'lucide-react';
import { NarratorKPIs } from '../narratorsLogic';

export interface AdminNarratorsStatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  kpis: NarratorKPIs;
}

export const AdminNarratorsStatusTabs: React.FC<AdminNarratorsStatusTabsProps> = ({
  activeTab,
  onTabChange,
  kpis,
}) => {
  const tabs = [
    {
      id: 'ALL',
      label: 'Tất cả',
      count: kpis.totalCount,
      icon: Mic,
      color: 'text-[#991B1B]',
    },
    {
      id: 'PENDING',
      label: 'Chờ xét duyệt',
      count: kpis.pendingCount,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      id: 'PROCESSING',
      label: 'Đang xử lý',
      count: kpis.processingCount,
      icon: RotateCw,
      color: 'text-sky-600',
    },
    {
      id: 'APPROVED',
      label: 'Đã duyệt',
      count: kpis.approvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      id: 'REJECTED',
      label: 'Bị từ chối',
      count: kpis.rejectedCount,
      icon: Ban,
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`group inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-medium transition-all duration-200 whitespace-nowrap shrink-0 border ${isActive
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B] shadow-xs font-semibold'
                : 'bg-white border-[#E7E5E4] text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300'
              }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#991B1B]' : tab.color
                }`}
            />
            <span>
              {tab.label} <span className="tabular-nums font-semibold">({tab.count})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

