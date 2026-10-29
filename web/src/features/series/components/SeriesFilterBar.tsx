import React from 'react';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SeriesFilterState {
  searchQuery: string;
  historicalEra: string;
  format: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}

interface SeriesFilterBarProps {
  filter: SeriesFilterState;
  onChange: (updates: Partial<SeriesFilterState>) => void;
  onReset?: () => void;
  onCreateClick?: () => void;
}

export const HISTORICAL_ERA_OPTIONS = [
  { value: 'ALL', label: 'Tất cả thời kỳ' },
  { value: 'TRIEU_LY', label: 'Triều Lý' },
  { value: 'TRIEU_TRAN', label: 'Triều Trần' },
  { value: 'CHIEN_TRANH', label: 'Chiến tranh' },
  { value: 'TRIEU_LE', label: 'Triều Lê' },
  { value: 'TRIEU_NGUYEN', label: 'Thời Nguyễn' },
  { value: 'KHAC', label: 'Thời kỳ khác' },
];

export const FORMAT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả định dạng' },
  { value: 'PODCAST_VIDEO', label: 'Podcast & Video' },
  { value: 'AUDIO_ONLY', label: 'Chỉ Audio Podcast' },
  { value: 'WHITEBOARD', label: 'Whiteboard Animation' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'most_listened', label: 'Lượt nghe nhiều nhất' },
  { value: 'most_episodes', label: 'Nhiều tập nhất' },
  { value: 'title_asc', label: 'Tiêu đề A — Z' },
];

export const SeriesFilterBar: React.FC<SeriesFilterBarProps> = ({
  filter,
  onChange,
  onReset,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 select-none">
      {/* Search Input Box */}
      <div className="flex-1 min-w-[260px] max-w-xl">
        <label htmlFor="series-search-input" className="sr-only">
          Tìm kiếm tuyển tập, chủ đề, mô tả
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            id="series-search-input"
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Tìm kiếm tuyển tập, chủ đề, mô tả..."
            title="Nhập từ khóa tìm kiếm tuyển tập theo tiêu đề, chủ đề hoặc mô tả"
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24] shadow-2xs transition-colors"
          />
          {filter.searchQuery && (
            <button
              type="button"
              onClick={() => onChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
              title="Xóa từ khóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Select Filter Controls & View Switcher */}
      <div className="flex flex-wrap items-end gap-2.5 sm:gap-3">
        {/* Thời kỳ lịch sử */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <span className="text-[11px] font-medium text-[#786C68]">
            Thời kỳ lịch sử
          </span>
          <select
            value={filter.historicalEra}
            onChange={(e) => onChange({ historicalEra: e.target.value })}
            title="Lọc danh sách theo thời kỳ lịch sử"
            className="h-11 px-3 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24] shadow-2xs cursor-pointer"
            aria-label="Chọn thời kỳ lịch sử"
          >
            {HISTORICAL_ERA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Định dạng */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <span className="text-[11px] font-medium text-[#786C68]">
            Định dạng
          </span>
          <select
            value={filter.format}
            onChange={(e) => onChange({ format: e.target.value })}
            title="Lọc theo định dạng: Podcast, Video hoặc Whiteboard"
            className="h-11 px-3 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24] shadow-2xs cursor-pointer"
            aria-label="Chọn định dạng nội dung"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sắp xếp */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-[11px] font-medium text-[#786C68]">
            Sắp xếp
          </span>
          <select
            value={filter.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            title="Sắp xếp danh sách tuyển tập"
            className="h-11 px-3 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24] shadow-2xs cursor-pointer"
            aria-label="Sắp xếp danh sách"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: Grid vs List */}
        <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl border border-[#EBE4D8] h-11 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ viewMode: 'grid' })}
            aria-label="Xem dạng lưới 3 cột"
            title="Hiển thị dạng lưới 3 cột"
            aria-pressed={filter.viewMode === 'grid'}
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer',
              filter.viewMode === 'grid'
                ? 'bg-[#A31D24] text-white shadow-2xs'
                : 'text-[#786C68] hover:text-[#1C1615] hover:bg-white/60'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ viewMode: 'list' })}
            aria-label="Xem dạng danh sách dòng"
            title="Hiển thị dạng danh sách hàng ngang"
            aria-pressed={filter.viewMode === 'list'}
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer',
              filter.viewMode === 'list'
                ? 'bg-[#A31D24] text-white shadow-2xs'
                : 'text-[#786C68] hover:text-[#1C1615] hover:bg-white/60'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
