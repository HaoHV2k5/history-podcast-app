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
  Landmark,
  Scale,
  Shield,
  Swords,
  User,
  Sparkles,
  BookOpen,
  Folder,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';

export interface SeriesCardData {
  id: number;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  itemCount: number;
  totalDurationSeconds?: number;
  status?: string;
  listenCount?: number;
  likeCount?: number;
  category?: string;
  tags?: Array<{
    label: string;
    variant: 'rose' | 'amber' | 'stone' | 'sky';
    iconName?: string;
  }>;
  featuredTrackTitle?: string;
  authorOrTopic?: string;
}

interface SeriesCardProps {
  series: SeriesCardData;
  onPlay: (series: SeriesCardData) => void;
  onManageEpisodes: (series: SeriesCardData) => void;
  onEdit: (series: SeriesCardData) => void;
  onDelete: (series: SeriesCardData) => void;
  style?: React.CSSProperties;
}

const renderTagIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Landmark':
      return <Landmark className="h-3 w-3 shrink-0" />;
    case 'Scale':
      return <Scale className="h-3 w-3 shrink-0" />;
    case 'Shield':
      return <Shield className="h-3 w-3 shrink-0" />;
    case 'Swords':
      return <Swords className="h-3 w-3 shrink-0" />;
    case 'User':
      return <User className="h-3 w-3 shrink-0" />;
    case 'Sparkles':
      return <Sparkles className="h-3 w-3 shrink-0" />;
    case 'BookOpen':
      return <BookOpen className="h-3 w-3 shrink-0" />;
    case 'Folder':
    default:
      return <Folder className="h-3 w-3 shrink-0" />;
  }
};

const formatMetricCount = (val?: number): string => {
  if (val == null) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString('vi-VN');
};

export const SeriesCard: React.FC<SeriesCardProps> = ({
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
      className="group relative flex flex-col rounded-2xl border border-[#EBE4D8] bg-white shadow-2xs hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden text-left focus-within:ring-2 focus-within:ring-[#A31D24]/30"
      aria-label={`Tuyển tập: ${series.title}`}
    >
      {/* ─── 1. THUMBNAIL COVER (16:9 Aspect Ratio) ────────────────────────── */}
      <div
        onClick={() => onManageEpisodes(series)}
        title="Nhấp để mở danh sách các tác phẩm trong tuyển tập này"
        className="relative aspect-video w-full bg-[#1C1615] overflow-hidden flex items-center justify-center select-none cursor-pointer"
      >
        {series.coverUrl ? (
          <img
            src={series.coverUrl}
            alt={series.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            onError={(e) => {
              // Fallback to topic landscape if image fails to load
              e.currentTarget.src = '/assets/studio/topic-thang-long.png';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="h-10 w-10 text-[#A31D24]/70 mb-1" />
            <span className="text-[11px] text-stone-300 font-serif font-medium">
              Sử Ký Tuyển Tập
            </span>
          </div>
        )}

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Floating Episode Count Badge (Top-Right) */}
        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white border border-white/10 shadow-xs">
            <Film className="h-3 w-3 opacity-90" />
            <span>{series.itemCount} tập</span>
          </span>
        </div>

        {/* Hover Cue: View Episode List (Unified with Thumbnail Click) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/20 shadow-md">
            <Film className="h-3.5 w-3.5 text-[#A31D24]" />
            <span>Xem danh sách tập</span>
          </span>
        </div>

        {/* Bottom-Right Contextual Menu (•••) */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/75 active:bg-black backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer border border-white/15 shadow-xs"
                aria-label={`Tùy chọn cho tuyển tập ${series.title}`}
                title="Tùy chọn tuyển tập"
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
      </div>

      {/* ─── 2. CARD CONTENT (Title, Description, Tags) ────────────────────── */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Title: Clickable button opening episode list */}
          <button
            type="button"
            onClick={() => onManageEpisodes(series)}
            title="Nhấp để mở danh sách các tác phẩm trong tuyển tập này"
            className="text-left font-serif text-base sm:text-lg font-bold text-[#1C1615] leading-snug line-clamp-1 hover:text-[#A31D24] hover:underline transition-colors break-words w-full cursor-pointer block"
          >
            {series.title}
          </button>

          {/* Description (2 lines clamped) */}
          <p className="text-xs text-[#5C524F] line-clamp-2 leading-relaxed min-h-[36px] break-words">
            {series.description || 'Tuyển chọn các tác phẩm đặc sắc tái hiện bối cảnh lịch sử dân tộc.'}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {series.tags && series.tags.length > 0 ? (
              series.tags.map((tag, idx) => {
                const isRose = tag.variant === 'rose';
                const isAmber = tag.variant === 'amber';
                const isSky = tag.variant === 'sky';

                return (
                  <span
                    key={`${tag.label}-${idx}`}
                    title={`Chủ đề: ${tag.label}`}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors',
                      isRose && 'bg-rose-50 text-rose-700 border-rose-200/80',
                      isAmber && 'bg-amber-50 text-amber-800 border-amber-200/80',
                      isSky && 'bg-sky-50 text-sky-700 border-sky-200/80',
                      !isRose && !isAmber && !isSky && 'bg-[#F5F2EB] text-[#5C524F] border-[#EBE4D8]'
                    )}
                  >
                    {renderTagIcon(tag.iconName)}
                    <span>{tag.label}</span>
                  </span>
                );
              })
            ) : (
              <span
                title="Chủ đề: Lịch sử"
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-0.5 text-[11px] font-medium"
              >
                <Landmark className="h-3 w-3" />
                <span>Lịch sử</span>
              </span>
            )}
          </div>
        </div>

        {/* ─── 3. CARD FOOTER (Stats & Link Action) ─────────────────────────── */}
        <div className="pt-3 border-t border-[#EBE4D8]/80 flex items-center justify-between gap-2">
          {/* Left Stats: Headphones + Likes */}
          <div className="flex items-center gap-3 text-xs text-[#786C68]">
            <span className="inline-flex items-center gap-1.5" title={`Lượt nghe tuyển tập: ${formatMetricCount(series.listenCount ?? 0)}`}>
              <Headphones className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>{formatMetricCount(series.listenCount ?? 0)} lượt nghe</span>
            </span>
            <span className="inline-flex items-center gap-1.5" title={`Lượt thích tuyển tập: ${formatMetricCount(series.likeCount ?? 0)}`}>
              <Heart className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>{formatMetricCount(series.likeCount ?? 0)}</span>
            </span>
          </div>

          {/* Right Actions: Nghe Ngay Button + Circular Arrow Button to Open Series */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlay(series);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FDF2F2] hover:bg-[#A31D24] active:bg-[#8B181E] text-[#A31D24] hover:text-white text-xs font-semibold transition-all duration-150 shadow-2xs active:scale-95 cursor-pointer border border-[#F8D7DA]/60"
              title="Phát nghe ngay tuyển tập này"
              aria-label={`Phát nghe ngay tuyển tập ${series.title}`}
            >
              <Play className="h-3 w-3 fill-current ml-0.5" />
              <span>Nghe</span>
            </button>

            <button
              type="button"
              onClick={() => onManageEpisodes(series)}
              className="h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all duration-150 shadow-2xs active:scale-90 cursor-pointer"
              aria-label={`Xem chi tiết tuyển tập ${series.title}`}
              title="Mở danh sách tác phẩm trong tuyển tập"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
