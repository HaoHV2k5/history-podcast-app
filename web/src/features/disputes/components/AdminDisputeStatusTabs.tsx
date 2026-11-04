import React from 'react';
import { ShieldAlert, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { DisputeStatusFilter, DisputeKpis } from '../disputesLogic';

interface AdminDisputeStatusTabsProps {
  activeTab: DisputeStatusFilter;
  onTabChange: (tab: DisputeStatusFilter) => void;
  kpis: DisputeKpis;
}

export const AdminDisputeStatusTabs: React.FC<AdminDisputeStatusTabsProps> = ({
  activeTab,
  onTabChange,
  kpis,
}) => {
  const tabs = [
    {
      id: 'ALL' as DisputeStatusFilter,
      label: 'Tất cả tranh chấp',
      count: kpis.totalCount,
      icon: ShieldAlert,
      iconColor: 'text-[#991B1B]',
      activeClass: 'border-[#991B1B] text-[#991B1B] bg-[#FFF0F2]/50 font-bold',
    },
    {
      id: 'OPEN' as DisputeStatusFilter,
      label: 'Đang thụ lý',
      count: kpis.openCount,
      icon: Clock,
      iconColor: 'text-[#D97706]',
      activeClass: 'border-[#D97706] text-[#D97706] bg-[#FFFBEB]/60 font-bold',
    },
    {
      id: 'RESOLVED' as DisputeStatusFilter,
      label: 'Đã giải quyết',
      count: kpis.resolvedCount,
      icon: CheckCircle2,
      iconColor: 'text-[#059669]',
      activeClass: 'border-[#059669] text-[#059669] bg-[#ECFDF5]/60 font-bold',
    },
    {
      id: 'CANCELLED' as DisputeStatusFilter,
      label: 'Đã hủy',
      count: kpis.cancelledCount,
      icon: XCircle,
      iconColor: 'text-[#DC2626]',
      activeClass: 'border-[#DC2626] text-[#DC2626] bg-[#FFF0F2]/60 font-bold',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] border transition-all duration-200 cursor-pointer ${
              isActive
                ? `${tab.activeClass} shadow-2xs`
                : 'border-[#E7E5E4] bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 font-medium'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${tab.iconColor}`} />
            <span>{tab.label}</span>
            <span
              className={`text-xs tabular-nums px-1.5 py-0.2 rounded-full font-semibold ${
                isActive ? 'bg-white/80' : 'bg-stone-100 text-stone-600'
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

