import React from 'react';
import { ClipboardList, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { WithdrawalKPIs } from '../withdrawalsLogic';

interface AdminWithdrawalsStatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  kpis: WithdrawalKPIs;
}

export const AdminWithdrawalsStatusTabs: React.FC<AdminWithdrawalsStatusTabsProps> = ({
  activeTab,
  onTabChange,
  kpis,
}) => {
  const tabs = [
    {
      id: 'ALL',
      label: 'Tất cả',
      count: kpis.totalCount,
      icon: ClipboardList,
      color: 'text-stone-700',
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
      icon: RefreshCw,
      color: 'text-blue-600',
    },
    {
      id: 'COMPLETED',
      label: 'Đã hoàn tất',
      count: kpis.completedCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      id: 'REJECTED',
      label: 'Bị từ chối',
      count: kpis.rejectedCount,
      icon: XCircle,
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none select-none">
      {tabs.map((tab) => {
        const isActive = activeTab.toUpperCase() === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${isActive
                ? 'bg-white text-[#991B1B] font-semibold shadow-xs border border-[#991B1B]/30'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#991B1B]' : tab.color}`}
            />
            <span>{tab.label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                  ? 'bg-rose-50 text-[#991B1B] font-bold'
                  : 'text-stone-500'
                }`}
            >
              ({tab.count.toLocaleString('vi-VN')})
            </span>
          </button>
        );
      })}
    </div>
  );
};

