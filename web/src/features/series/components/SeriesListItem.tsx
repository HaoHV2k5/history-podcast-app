import React from 'react';
import {
  Play,
  Film,
  Headphones,
  Heart,
  ArrowRight,
  MoreHorizontal,
  Edit3,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { SeriesCardData } from './SeriesCard';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';

interface SeriesListItemProps {
  series: SeriesCardData;
  onPlay: (series: SeriesCardData) => void;
  onManageEpisodes: (series: SeriesCardData) => void;
  onEdit: (series: SeriesCardData) => void;
  onDelete: (series: SeriesCardData) => void;
  style?: React.CSSProperties;
}

const formatMetricCount = (val?: number): string => {
  if (val == null) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString('vi-VN');
};

export const SeriesListItem: React.FC<SeriesListItemProps> = ({
  series,
  onPlay,
  onManageEpisodes,
  onEdit,
  onDelete,
  style,
}) => {
  return (
    <article
      style={style}
      className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-[#EBE4D8] bg-white p-4 shadow-2xs hover:border-stone-300 hover:shadow-md transition-all duration-200 text-left"
      aria-label={`Tuyển tập: ${series.title}`}
    >
      {/* Left: Thumbnail with Play Overlay */}
      <div
        onClick={() => onManageEpisodes(series)}
        title="Nhấp để mở danh sách các tác phẩm trong tuyển tập này"
        className="relative w-full sm:w-44 aspect-video sm:aspect-[16/10] rounded-xl overflow-hidden bg-[#1C1615] shrink-0 cursor-pointer"
      >
        {series.coverUrl ? (
          <img
            src={series.coverUrl}
            alt={series.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/assets/studio/topic-thang-long.png';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-2 text-center">
            <BookOpen className="h-6 w-6 text-[#A31D24]/70 mb-1" />
            <span className="text-[10px] text-stone-300 font-serif">Sử Ký</span>
          </div>
        )}

        {/* Hover Cue: View Episode List (Unified with Thumbnail Click) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-xs">
            <Film className="h-3 w-3 text-[#A31D24]" />
            <span>Xem tập</span>
          </span>
        </div>

        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white border border-white/10">
            <Film className="h-2.5 w-2.5 opacity-90" />
            <span>{series.itemCount} tập</span>
          </span>
        </div>
      </div>

      {/* Center: Details */}
      <div className="flex-1 min-w-0 space-y-1.5 sm:pr-4">
        <button
          type="button"
          onClick={() => onManageEpisodes(series)}
          title="Nhấp để mở danh sách các tác phẩm trong tuyển tập này"
          className="text-left font-serif text-base sm:text-lg font-bold text-[#1C1615] leading-snug truncate hover:text-[#A31D24] hover:underline transition-colors block w-full cursor-pointer"
        >
          {series.title}
        </button>
        <p className="text-xs text-[#5C524F] line-clamp-2 leading-relaxed">
          {series.description || 'Tuyển chọn các tác phẩm đặc sắc tái hiện bối cảnh lịch sử dân tộc.'}
        </p>

        {/* Tags & Stats */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#786C68]">
          <span className="inline-flex items-center gap-1" title={`Lượt nghe tuyển tập: ${formatMetricCount(series.listenCount ?? 0)}`}>
            <Headphones className="h-3.5 w-3.5 text-stone-400" />
            <span>{formatMetricCount(series.listenCount ?? 0)} lượt nghe</span>
          </span>
          <span className="inline-flex items-center gap-1" title={`Lượt thích tuyển tập: ${formatMetricCount(series.likeCount ?? 0)}`}>
            <Heart className="h-3.5 w-3.5 text-stone-400" />
            <span>{formatMetricCount(series.likeCount ?? 0)}</span>
          </span>
          {series.tags?.map((tag, idx) => (
            <span
              key={`${tag.label}-${idx}`}
              title={`Chủ đề: ${tag.label}`}
              className="inline-flex items-center rounded-full bg-[#F5F2EB] px-2 py-0.5 text-[10px] font-medium text-[#5C524F] border border-[#EBE4D8]"
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onPlay(series)}
          title="Phát nghe ngay tuyển tập này"
          className="h-9 px-3 rounded-xl bg-[#FDF2F2] hover:bg-[#A31D24] text-[#A31D24] hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer border border-[#F8D7DA]/60"
        >
          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          <span>Nghe</span>
        </button>

        <button
          type="button"
          onClick={() => onManageEpisodes(series)}
          title="Mở danh sách các tác phẩm trong tuyển tập"
          className="h-9 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#5C524F] hover:text-[#1C1615] flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
        >
          <span>Quản lý tập</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-9 w-9 rounded-xl border border-[#EBE4D8] hover:bg-[#F5F2EB] flex items-center justify-center text-[#786C68] hover:text-[#1C1615] transition-colors cursor-pointer"
              aria-label={`Tùy chọn ${series.title}`}
              title="Tùy chọn thao tác tuyển tập"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onManageEpisodes(series)}
              className="gap-2 cursor-pointer text-xs"
            >
              <Film className="h-3.5 w-3.5 text-[#A31D24]" />
              <span>Quản lý danh sách tập</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(series)}
              className="gap-2 cursor-pointer text-xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-stone-600" />
              <span>Chỉnh sửa thông tin</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(series)}
              className="gap-2 cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa tuyển tập</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
};
