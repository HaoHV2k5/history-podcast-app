import React, { useState } from 'react';
import { Lightbulb, ChevronRight, Check, BookOpen, Clock, Quote, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';

interface StudioSuggestedTopicsProps {
  selectedTopicTitle: string;
  onSelectTopic: (topic: HistoricalTopicItem | null) => void;
}

export const StudioSuggestedTopics: React.FC<StudioSuggestedTopicsProps> = ({
  selectedTopicTitle,
  onSelectTopic,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDynasty, setFilterDynasty] = useState<'all' | 'ly' | 'tran'>('all');

  const filteredTopics = HISTORICAL_SCOPE_SUGGESTIONS.filter((t) => {
    if (filterDynasty === 'all') return true;
    return t.dynasty === filterDynasty;
  });

  return (
    <div className="space-y-2 pt-0.5">
      {/* Header: Title + 'Xem thêm >' */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-accent" />
          <span>Gợi ý chủ đề phổ biến</span>
        </label>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-0.5 cursor-pointer transition-colors group"
        >
          <span>Xem thêm</span>
          <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4 Cards Grid - Compact, Balanced, Anti-AI-slop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {HISTORICAL_SCOPE_SUGGESTIONS.map((item) => {
          const isSelected =
            selectedTopicTitle === item.title || selectedTopicTitle === item.shortTitle;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTopic(isSelected ? null : item)}
              title={`${item.title} (${item.dynastyName})\n${item.desc}`}
              className={`group relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none min-h-[58px] active:scale-[0.98] ${
                isSelected
                  ? 'border-accent bg-[#FFF9F9] ring-1 ring-accent/30 shadow-2xs'
                  : 'border-[#E7E5E4] bg-white hover:border-accent/40 hover:bg-[#FAF8F5] hover:shadow-2xs'
              }`}
            >
              {/* Authentic Historical Miniature Thumbnail */}
              {item.thumbnailUrl && (
                <div className="relative shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-stone-200/70 shadow-2xs group-hover:scale-[1.04] transition-transform duration-200"
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent text-white flex items-center justify-center shadow-2xs ring-1 ring-white">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </div>
                  )}
                </div>
              )}

              {/* Title & Concise Subtitle */}
              <div className="min-w-0 flex-1">
                <span
                  className={`text-[11.5px] sm:text-xs font-semibold block line-clamp-2 leading-snug transition-colors ${
                    isSelected ? 'text-accent font-bold' : 'text-[#1C1917] group-hover:text-accent'
                  }`}
                >
                  {item.shortTitle || item.title}
                </span>
                <p className="text-[10px] text-[#78716C] truncate mt-0.5 leading-none font-normal">
                  {item.cardSubtitle || `${item.figure} • ${item.era}`}
                </p>
                {isSelected && (
                  <span className="text-[9px] font-semibold text-accent/90 block mt-0.5 leading-none">
                    Đã chọn
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Full Topics Modal ('Xem thêm') */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent maxWidth="max-w-3xl" className="p-6">
          <DialogHeader className="pb-2 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-serif font-bold text-ink">
                  Kho chủ đề lịch sử tiêu biểu (Triều Lý – Triều Trần)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted">
                  Các sự kiện chuẩn xác từ <em>Đại Việt Sử Ký Toàn Thư</em>, được tối ưu cho sản xuất video &amp; audio podcast.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFilterDynasty('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                filterDynasty === 'all'
                  ? 'bg-accent text-white shadow-2xs'
                  : 'bg-surface-subtle text-muted hover:text-ink hover:bg-surface-subtle/80'
              }`}
            >
              Tất cả ({HISTORICAL_SCOPE_SUGGESTIONS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterDynasty('ly')}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                filterDynasty === 'ly'
                  ? 'bg-accent text-white shadow-2xs'
                  : 'bg-surface-subtle text-muted hover:text-ink hover:bg-surface-subtle/80'
              }`}
            >
              Triều Lý (1009 – 1225)
            </button>
            <button
              type="button"
              onClick={() => setFilterDynasty('tran')}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                filterDynasty === 'tran'
                  ? 'bg-accent text-white shadow-2xs'
                  : 'bg-surface-subtle text-muted hover:text-ink hover:bg-surface-subtle/80'
              }`}
            >
              Triều Trần (1225 – 1400)
            </button>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 pt-1">
            {filteredTopics.map((item) => {
              const isSelected =
                selectedTopicTitle === item.title || selectedTopicTitle === item.shortTitle;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-accent bg-accent/[0.03] ring-1 ring-accent/30 shadow-xs'
                      : 'border-border/80 bg-white hover:border-accent/40 hover:shadow-2xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex gap-3 items-start">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border/60 shadow-2xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-accent border-accent/30 bg-accent/5 px-2 py-0.5"
                          >
                            {item.dynasty === 'ly' ? 'Triều Lý' : 'Triều Trần'}
                          </Badge>
                          <span className="text-[10.5px] text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.suggestedDuration}s
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-xs text-ink mt-1 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[10.5px] text-accent/80 font-medium">
                          {item.era} • {item.figure}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Historic Quote */}
                    <div className="bg-[#FAF8F5] rounded-lg p-2.5 border border-border/50 text-[10.5px] text-ink/80 italic font-serif flex items-start gap-1.5">
                      <Quote className="h-3.5 w-3.5 text-accent/60 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">"{item.excerpt}"</span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[10px] text-muted font-mono truncate max-w-[170px]" title={`${item.sourceBook} • ${item.sourceVolume}`}>
                      {item.sourceVolume}
                    </span>
                    <Button
                      size="sm"
                      variant={isSelected ? 'outline' : 'default'}
                      className={`h-7 px-3 text-xs cursor-pointer ${
                        isSelected
                          ? 'border-accent text-accent hover:bg-accent/10'
                          : 'bg-accent hover:bg-accent-hover text-white shadow-2xs'
                      }`}
                      onClick={() => {
                        onSelectTopic(isSelected ? null : item);
                        setIsModalOpen(false);
                      }}
                    >
                      {isSelected ? 'Bỏ chọn' : 'Chọn chủ đề này'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
