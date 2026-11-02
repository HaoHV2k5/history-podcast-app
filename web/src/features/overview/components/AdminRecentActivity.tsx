import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Video,
  Wallet,
  ChevronDown,
  Check,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import {
  OverviewActivityItem,
  ActivityFilterType,
  filterActivities,
  formatActivitySplitDateTime,
} from '../overviewLogic';

interface AdminRecentActivityProps {
  activities: OverviewActivityItem[];
  isLoading?: boolean;
}

const FILTER_OPTIONS: { id: ActivityFilterType; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'MODERATION', label: 'Video kiểm duyệt' },
  { id: 'KYC', label: 'Xác thực KYC' },
  { id: 'WITHDRAWAL', label: 'Yêu cầu rút tiền' },
  { id: 'DISPUTE', label: 'Khiếu nại' },
];

export const AdminRecentActivity: React.FC<AdminRecentActivityProps> = ({
  activities,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>('ALL');

  const filteredItems = useMemo(() => {
    return filterActivities(activities, activeFilter);
  }, [activities, activeFilter]);

  const currentLabel = FILTER_OPTIONS.find((f) => f.id === activeFilter)?.label || 'Tất cả';

  const renderIcon = (type: OverviewActivityItem['type']) => {
    switch (type) {
      case 'MODERATION':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
            <Video className="h-4 w-4" />
          </div>
        );
      case 'KYC':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
            <svg
              className="h-4 w-4 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
      case 'WITHDRAWAL':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
            <Wallet className="h-4 w-4" />
          </div>
        );
      case 'DISPUTE':
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F2] text-[#E11D48]">
            <svg
              className="h-3.5 w-3.5 ml-0.5 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-xs">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626]">
              <Calendar className="h-4 w-4 stroke-[2.2]" />
            </div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1C1917]">
              Hoạt động gần đây
            </h2>
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group inline-flex items-center gap-2 rounded-lg border border-[#E0DDD7] bg-white px-3 py-1.5 text-xs font-semibold text-[#1C1917] shadow-2xs transition-colors hover:border-accent/40 hover:bg-[#F9F7F4] select-none cursor-pointer"
              >
                <span>{currentLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#78716C] transition-transform duration-150 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <span className={activeFilter === opt.id ? 'font-bold text-accent' : 'text-ink'}>
                    {opt.label}
                  </span>
                  {activeFilter === opt.id && <Check className="h-3.5 w-3.5 text-accent" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Timeline Activities Feed */}
        <div className="divide-y divide-[#F0EBE1]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <span className="text-xs text-muted">Đang tải hoạt động...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.slice(0, 4).map((item) => {
              const { time, date } = formatActivitySplitDateTime(item.timestamp);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => item.targetUrl && navigate(item.targetUrl)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (item.targetUrl) navigate(item.targetUrl);
                    }
                  }}
                  className="group py-3.5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-[#FBF9F6] -mx-2 px-2.5 rounded-xl transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* Left: Event Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {renderIcon(item.type)}

                    <div className="flex flex-col min-w-0 space-y-0.5">
                      <span className="text-xs sm:text-[13px] font-bold text-[#1C1917] truncate group-hover:text-accent transition-colors leading-snug">
                        {item.title}
                      </span>
                      <span className="text-[11px] sm:text-xs text-[#78716C] truncate leading-snug">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {/* Right: Two-line Time Stamp */}
                  <div className="flex flex-col items-end shrink-0 font-mono leading-tight text-right">
                    <span className="text-xs font-semibold text-[#1C1917] tabular-nums">
                      {time}
                    </span>
                    <span className="text-[11px] text-[#A8A29E] tabular-nums mt-0.5">
                      {date}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-muted">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-ink">Không có hoạt động nào</p>
              <p className="text-[11px] text-muted">Hệ thống chưa ghi nhận sự kiện phù hợp bộ lọc.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

