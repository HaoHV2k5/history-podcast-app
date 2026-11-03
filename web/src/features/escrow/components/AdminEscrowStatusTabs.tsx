import React from 'react';
import { FileText, Clock, Snowflake, CheckCircle2, RotateCcw } from 'lucide-react';
import { EscrowTabFilter, EscrowKpiMetrics } from '../escrowLogic';

interface AdminEscrowStatusTabsProps {
  activeTab: EscrowTabFilter;
  onChange: (tab: EscrowTabFilter) => void;
  kpis: EscrowKpiMetrics;
}

export const AdminEscrowStatusTabs: React.FC<AdminEscrowStatusTabsProps> = ({
  activeTab,
  onChange,
  kpis,
}) => {
  const tabs: {
    id: EscrowTabFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
      {
        id: 'ALL',
        label: 'Tất cả trạng thái',
        count: kpis.totalCount,
        icon: <FileText className="h-4 w-4 shrink-0 text-[#991B1B]" />,
      },
      {
        id: 'HELD',
        label: 'Đang giữ (HELD)',
        count: kpis.heldCount,
        icon: <Clock className="h-4 w-4 shrink-0 text-blue-600" />,
      },
      {
        id: 'FROZEN',
        label: 'Đóng băng (FROZEN)',
        count: kpis.frozenCount,
        icon: <Snowflake className="h-4 w-4 shrink-0 text-sky-600" />,
      },
      {
        id: 'RELEASED',
        label: 'Đã giải ngân (RELEASED)',
        count: kpis.releasedCount,
        icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />,
      },
      {
        id: 'REFUNDED',
        label: 'Đã hoàn (REFUNDED)',
        count: kpis.refundedCount,
        icon: <RotateCcw className="h-4 w-4 shrink-0 text-teal-600" />,
      },
    ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-sans transition-all duration-150 whitespace-nowrap border shrink-0 ${isActive
                ? 'bg-rose-50/70 border-rose-200 text-[#991B1B] font-semibold shadow-2xs'
                : 'bg-white border-[#F0EBE6] text-stone-600 hover:text-stone-900 hover:bg-stone-50/80 font-medium'
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`text-xs tabular-nums ${isActive ? 'text-[#991B1B] font-bold' : 'text-stone-400'
                }`}
            >
              ({tab.count})
            </span>
          </button>
        );
      })}
    </div>
  );
};

