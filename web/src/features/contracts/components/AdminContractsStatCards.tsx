import React from 'react';
import { FileText, Clock, CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { ContractKPIs } from '../contractsLogic';

interface AdminContractsStatCardsProps {
  kpis: ContractKPIs;
  isSampleData?: boolean;
}

export const AdminContractsStatCards: React.FC<AdminContractsStatCardsProps> = ({
  kpis,
  isSampleData = false,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Tổng hợp đồng',
      value: kpis.totalCount,
      trend: kpis.totalTrend,
      trendPositive: true,
      description: isSampleData
        ? '+14 hợp đồng so với 7 ngày trước'
        : kpis.newContractsCount > 0
          ? `+${kpis.newContractsCount} hợp đồng mới trong 7 ngày qua`
          : 'Toàn bộ hợp đồng trên hệ thống',
      icon: FileText,
      iconBg: 'bg-[#FFF0F2] border-[#FFE4E8] text-[#991B1B]',
      chartColor: 'bg-[#991B1B]',
    },
    {
      id: 'active',
      label: 'Đang thực hiện',
      value: kpis.activeCount,
      trend: kpis.activeTrend,
      trendPositive: true,
      description: 'Hợp đồng đang trong quá trình thu âm',
      icon: Clock,
      iconBg: 'bg-[#FFFBEB] border-[#FEF3C7] text-[#D97706]',
      chartColor: 'bg-[#D97706]',
    },
    {
      id: 'completed',
      label: 'Đã hoàn thành',
      value: kpis.completedCount,
      trend: kpis.completedTrend,
      trendPositive: true,
      description: 'Hợp đồng đã hoàn tất',
      icon: CheckCircle2,
      iconBg: 'bg-[#ECFDF5] border-[#D1FAE5] text-[#059669]',
      chartColor: 'bg-[#059669]',
    },
    {
      id: 'cancelled',
      label: 'Đã hủy',
      value: kpis.cancelledCount,
      trend: kpis.cancelledTrend,
      trendPositive: false,
      description: 'Hợp đồng đã bị hủy',
      icon: XCircle,
      iconBg: 'bg-[#FFF0F2] border-[#FFE4E8] text-[#DC2626]',
      chartColor: 'bg-[#DC2626]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const showTrend = kpis.totalCount > 0 && card.trend !== 0;

        return (
          <div
            key={card.id}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#F0EBE6] shadow-xs hover:shadow-sm transition-all duration-200"
          >
            {/* Squircle Icon Container */}
            <div
              className={`flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl border ${card.iconBg} transition-transform group-hover:scale-105`}
            >
              <IconComponent className="h-6 w-6" />
            </div>

            {/* Right Information Block (3 balanced rows) */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Category Name */}
              <span className="text-xs sm:text-[13px] font-medium text-stone-500 block truncate">
                {card.label}
              </span>

              {/* Row 2: Value + Trend Badge + Mini Bar Chart */}
              <div className="flex items-center justify-between gap-1.5 my-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-[26px] font-bold font-sans tabular-nums text-stone-900 leading-none">
                    {card.value.toLocaleString('vi-VN')}
                  </span>

                  {showTrend && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${card.trendPositive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                        }`}
                    >
                      {card.trendPositive ? (
                        <TrendingUp className="h-3 w-3 shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 shrink-0" />
                      )}
                      <span>{Math.abs(card.trend)}%</span>
                    </span>
                  )}
                </div>

                {/* Mini Bar Graphic (3 rounded pills) */}
                <div className="flex items-end gap-1 h-6 shrink-0 opacity-80" aria-hidden="true">
                  <span className={`w-1.5 h-2.5 rounded-full ${card.chartColor} opacity-40`} />
                  <span className={`w-1.5 h-4 rounded-full ${card.chartColor} opacity-70`} />
                  <span className={`w-1.5 h-6 rounded-full ${card.chartColor}`} />
                </div>
              </div>

              {/* Row 3: Contextual Subtitle Description */}
              <span className="text-[11px] sm:text-xs text-stone-400 font-sans block truncate">
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

