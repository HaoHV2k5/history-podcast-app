import React from 'react';
import type { ContractKPIs } from '../contractsLogic';

interface AdminContractsStatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  kpis: ContractKPIs;
}

export const AdminContractsStatusTabs: React.FC<AdminContractsStatusTabsProps> = ({
  activeTab,
  onTabChange,
  kpis,
}) => {
  const tabs = [
    {
      id: 'ALL',
      label: 'Tất cả',
      count: kpis.totalCount,
    },
    {
      id: 'ACTIVE',
      label: 'Đang thực hiện',
      count: kpis.activeCount,
    },
    {
      id: 'COMPLETED',
      label: 'Đã hoàn thành',
      count: kpis.completedCount,
    },
    {
      id: 'CANCELLED',
      label: 'Đã hủy',
      count: kpis.cancelledCount,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all duration-200 shrink-0 ${isActive
                ? 'bg-[#991B1B] text-white shadow-xs'
                : 'bg-white border border-[#F0EBE6] text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-100 text-stone-600'
                }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

