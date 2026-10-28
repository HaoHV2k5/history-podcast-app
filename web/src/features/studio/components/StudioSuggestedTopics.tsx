import React from 'react';
import { Lightbulb, ChevronRight, Check } from 'lucide-react';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';

interface StudioSuggestedTopicsProps {
  selectedTopicTitle: string;
  onSelectTopic: (topic: HistoricalTopicItem | null) => void;
}

export const StudioSuggestedTopics: React.FC<StudioSuggestedTopicsProps> = ({
  selectedTopicTitle,
  onSelectTopic,
}) => {
  return (
    <div className="space-y-2 pt-1">
      {/* Header: Title + 'Xem thêm >' */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 text-accent" />
          <span>Gợi ý chủ đề phổ biến</span>
        </label>
        <button
          type="button"
          onClick={() => {
            const firstItem = HISTORICAL_SCOPE_SUGGESTIONS[0];
            const isFirstSelected =
              selectedTopicTitle === firstItem.title || selectedTopicTitle === firstItem.shortTitle;
            onSelectTopic(isFirstSelected ? null : firstItem);
          }}
          className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-0.5 cursor-pointer transition-colors"
        >
          <span>Xem thêm</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* 4 Cards Grid with Authentic Historical Paintings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {HISTORICAL_SCOPE_SUGGESTIONS.map((item) => {
          const isSelected =
            selectedTopicTitle === item.title || selectedTopicTitle === item.shortTitle;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTopic(isSelected ? null : item)}
              title={isSelected ? 'Nhấp để bỏ chọn chủ đề này' : 'Nhấp để chọn chủ đề này'}
              className={`p-2 rounded-xl border text-left transition-all duration-150 group flex items-center gap-2.5 cursor-pointer select-none min-h-[72px] relative active:scale-[0.98] ${
                isSelected
                  ? 'border-accent bg-[#FFFBFB] ring-1 ring-accent/30 shadow-2xs'
                  : 'border-[#E7E5E4] bg-white hover:border-accent/40 hover:bg-[#FAF8F5]'
              }`}
            >
              {/* Authentic Historical Miniature Thumbnail */}
              {item.thumbnailUrl && (
                <div className="relative shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-12 h-16 rounded-md object-cover border border-border/40 shadow-2xs group-hover:scale-[1.02] transition-transform"
                  />
                  {isSelected && (
                    <div className="absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center shadow-2xs">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <span
                  className={`text-xs font-bold block line-clamp-2 leading-tight transition-colors ${
                    isSelected ? 'text-accent' : 'text-[#1C1917] group-hover:text-accent'
                  }`}
                >
                  {item.shortTitle || item.title}
                </span>
                <div className="text-[10.5px] text-[#78716C] block mt-1 leading-tight">
                  <div>{item.figure.replace(/Vua |Thái úy |Hưng Đạo Đại Vương /g, '')}</div>
                  <div className="text-[9.5px] text-[#A8A29E] mt-0.5">
                    {item.dynasty === 'ly' ? '(1009 – 1225)' : '(1225 – 1400)'}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-[9.5px] font-semibold text-accent/80 block mt-0.5 group-hover:text-status-error-text transition-colors">
                    Đã chọn • Bấm để bỏ
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
