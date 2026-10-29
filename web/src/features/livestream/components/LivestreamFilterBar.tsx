import React from 'react';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type StatusTab = 'ALL' | 'LIVE' | 'ENDED';

export interface LivestreamFilterState {
  searchQuery: string;
  historicalEra: string;
  sortBy: 'newest' | 'oldest' | 'most_viewed';
  viewMode: 'grid' | 'list';
}

export const HISTORICAL_ERA_LIVESTREAM_OPTIONS = [
  { value: 'ALL', label: 'Tất cả thời kỳ' },
  { value: 'TRIEU_TRAN', label: 'Thời Trần' },
  { value: 'TRIEU_LY', label: 'Thời Lý' },
  { value: 'TRIEU_LE', label: 'Thời Lê' },
  { value: 'TRIEU_NGUYEN', label: 'Thời Nguyễn' },
  { value: 'CAN_DAI', label: 'Cận - Hiện đại' },
];

export const SORT_LIVESTREAM_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'most_viewed', label: 'Lượt xem cao nhất' },
];

interface LivestreamFilterBarProps {
  activeTab: StatusTab;
  onTabChange: (tab: StatusTab) => void;
  totalCount: number;
  liveCount: number;
  endedCount: number;
  filter: LivestreamFilterState;
  onFilterChange: (updates: Partial<LivestreamFilterState>) => void;
}

export const LivestreamFilterBar: React.FC<LivestreamFilterBarProps> = ({
  activeTab,
  onTabChange,
  totalCount,
  liveCount,
  endedCount,
  filter,
  onFilterChange,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Status Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Lọc trạng thái phát trực tiếp"
        className="flex items-center gap-2 border-b border-[#EBE4D8] -mb-px"
      >
        {/* Tất cả */}
        <button
          type="button"
          role="tab"
          id="livestream-tab-all"
          aria-selected={activeTab === 'ALL'}
          aria-controls="livestream-panel"
          onClick={() => onTabChange('ALL')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer',
            activeTab === 'ALL'
              ? 'border-[#A11C27] text-[#A11C27]'
              : 'border-transparent text-[#786F6B] hover:text-[#1C1615] hover:border-[#EBE4D8]'
          )}
        >
          <span>Tất cả</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums',
              activeTab === 'ALL'
                ? 'bg-[#FDF2F2] text-[#A11C27] font-bold border border-[#F8D7DA]'
                : 'bg-stone-100 text-[#786F6B]'
            )}
          >
            {totalCount}
          </span>
        </button>

        {/* Đang trực tiếp */}
        <button
          type="button"
          role="tab"
          id="livestream-tab-live"
          aria-selected={activeTab === 'LIVE'}
          aria-controls="livestream-panel"
          onClick={() => onTabChange('LIVE')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer',
            activeTab === 'LIVE'
              ? 'border-[#A11C27] text-[#A11C27]'
              : 'border-transparent text-[#786F6B] hover:text-[#1C1615] hover:border-[#EBE4D8]'
          )}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                liveCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-stone-300'
              )}
            />
            <span>Đang trực tiếp</span>
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums',
              activeTab === 'LIVE'
                ? 'bg-[#FDF2F2] text-[#A11C27] font-bold border border-[#F8D7DA]'
                : 'bg-stone-100 text-[#786F6B]'
            )}
          >
            {liveCount}
          </span>
        </button>

        {/* Đã kết thúc */}
        <button
          type="button"
          role="tab"
          id="livestream-tab-ended"
          aria-selected={activeTab === 'ENDED'}
          aria-controls="livestream-panel"
          onClick={() => onTabChange('ENDED')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer',
            activeTab === 'ENDED'
              ? 'border-[#A11C27] text-[#A11C27]'
              : 'border-transparent text-[#786F6B] hover:text-[#1C1615] hover:border-[#EBE4D8]'
          )}
        >
          <span>Đã kết thúc</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums',
              activeTab === 'ENDED'
                ? 'bg-[#FDF2F2] text-[#A11C27] font-bold border border-[#F8D7DA]'
                : 'bg-stone-100 text-[#786F6B]'
            )}
          >
            {endedCount}
          </span>
        </button>
      </div>

      {/* 2. Search, Era & Sort Dropdowns, View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[260px] max-w-xl">
          <label htmlFor="livestream-search-input" className="sr-only">
            Tìm kiếm theo tiêu đề, mô tả hoặc chủ đề...
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              id="livestream-search-input"
              type="text"
              value={filter.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Tìm kiếm theo tiêu đề, mô tả hoặc chủ đề..."
              title="Tìm kiếm phiên phát sóng"
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A11C27]/20 focus:border-[#A11C27] shadow-2xs transition-colors"
            />
            {filter.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns & View switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Thời kỳ lịch sử */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#786F6B] whitespace-nowrap hidden sm:inline">
              Thời kỳ lịch sử:
            </span>
            <select
              value={filter.historicalEra}
              onChange={(e) => onFilterChange({ historicalEra: e.target.value })}
              className="h-10 px-3 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] focus:outline-none focus:ring-2 focus:ring-[#A11C27]/20 focus:border-[#A11C27] shadow-2xs cursor-pointer"
              aria-label="Chọn thời kỳ lịch sử"
            >
              {HISTORICAL_ERA_LIVESTREAM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#786F6B] whitespace-nowrap hidden sm:inline">
              Sắp xếp:
            </span>
            <select
              value={filter.sortBy}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as 'newest' | 'oldest' | 'most_viewed',
                })
              }
              className="h-10 px-3 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] focus:outline-none focus:ring-2 focus:ring-[#A11C27]/20 focus:border-[#A11C27] shadow-2xs cursor-pointer"
              aria-label="Chọn thứ tự sắp xếp"
            >
              {SORT_LIVESTREAM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View mode toggle (Grid / List) */}
          <div
            className="flex items-center rounded-xl border border-[#EBE4D8] bg-white p-0.5 shadow-2xs"
            role="group"
            aria-label="Chế độ hiển thị"
          >
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              aria-pressed={filter.viewMode === 'grid'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 cursor-pointer',
                filter.viewMode === 'grid'
                  ? 'bg-[#A11C27] text-white shadow-2xs'
                  : 'text-[#786F6B] hover:text-[#1C1615]'
              )}
              title="Xem dạng lưới"
              aria-label="Xem dạng lưới"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'list' })}
              aria-pressed={filter.viewMode === 'list'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 cursor-pointer',
                filter.viewMode === 'list'
                  ? 'bg-[#A11C27] text-white shadow-2xs'
                  : 'text-[#786F6B] hover:text-[#1C1615]'
              )}
              title="Xem dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
