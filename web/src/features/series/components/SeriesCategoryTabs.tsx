import React from 'react';
import {
  BookOpen,
  Crown,
  Shield,
  Swords,
  User,
  Sparkles,
  Camera,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export type SeriesCategoryKey =
  | 'ALL'
  | 'TRIEU_LY'
  | 'TRIEU_TRAN'
  | 'CHIEN_TRANH'
  | 'NHAN_VAT'
  | 'VAN_HOA'
  | 'KHAC';

export interface CategoryOption {
  key: SeriesCategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'ALL', label: 'Tất cả', icon: BookOpen },
  { key: 'TRIEU_LY', label: 'Triều Lý', icon: Crown },
  { key: 'TRIEU_TRAN', label: 'Triều Trần', icon: Shield },
  { key: 'CHIEN_TRANH', label: 'Chiến tranh', icon: Swords },
  { key: 'NHAN_VAT', label: 'Nhân vật', icon: User },
  { key: 'VAN_HOA', label: 'Văn hóa', icon: Sparkles },
  { key: 'KHAC', label: 'Khác', icon: Camera },
];

interface SeriesCategoryTabsProps {
  activeCategory: SeriesCategoryKey;
  onSelectCategory: (key: SeriesCategoryKey) => void;
  categoryCounts: Record<SeriesCategoryKey, number>;
}

export const SeriesCategoryTabs: React.FC<SeriesCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Lọc tuyển tập theo chủ đề"
      className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none select-none"
    >
      {CATEGORY_OPTIONS.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.key;
        const count = categoryCounts[cat.key] ?? 0;

        return (
          <button
            key={cat.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`series-panel-${cat.key}`}
            onClick={() => onSelectCategory(cat.key)}
            title={`Lọc theo chủ đề: ${cat.label} (${count} tuyển tập)`}
            className={cn(
              'group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer shrink-0 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24] active:scale-[0.98]',
              isActive
                ? 'bg-white border-[#A31D24] text-[#A31D24] ring-1 ring-[#A31D24]/20 shadow-xs font-semibold'
                : 'bg-white/90 hover:bg-white border-[#EBE4D8] text-[#5C524F] hover:text-[#1C1615] hover:border-stone-300'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-[#A31D24]' : 'text-stone-400 group-hover:text-stone-600'
              )}
            />
            <span>{cat.label}</span>
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-mono leading-none transition-colors',
                isActive
                  ? 'bg-[#FDF2F2] text-[#A31D24] font-semibold'
                  : 'bg-[#F5F2EB] text-[#786C68] group-hover:bg-[#EAE4D9]'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
