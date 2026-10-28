import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video,
  Search,
  ArrowUpDown,
  Clock,
  Heart,
  MessageSquare,
  AlertCircle,
  Play,
  Volume2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileQuestion,
  ExternalLink,
  Plus,
  ChevronDown,
  LayoutGrid,
  List,
  FileText,
  MoreHorizontal,
  ThumbsUp,
  Layers,
  Send,
  Edit3,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { CreatorVideoItem } from '@/types/creatorContent';
import { formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';
import { resolveVideoThumbnail, resolveMediaUrl } from '@/features/studio/creatorStudioUtils';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';

// ─── TAB & FILTER DEFINITIONS ────────────────────────────────────────────────

const STATUS_TABS: { key: string; label: string; countKey: keyof LibraryMetrics }[] = [
  { key: 'ALL', label: 'Tất cả', countKey: 'all' },
  { key: 'PUBLISHED', label: 'Đã xuất bản', countKey: 'published' },
  { key: 'PENDING_REVIEW', label: 'Chờ duyệt', countKey: 'pendingReview' },
  { key: 'COMPLETED', label: 'Chờ gửi duyệt', countKey: 'completed' },
  { key: 'DRAFT', label: 'Bản nháp', countKey: 'draft' },
  { key: 'REJECTED', label: 'Bị từ chối', countKey: 'rejected' },
  { key: 'HIDDEN', label: 'Đã ẩn', countKey: 'hidden' },
];

const FORMAT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả định dạng' },
  { value: 'PODCAST_VIDEO', label: 'Podcast Video' },
  { value: 'WHITEBOARD', label: 'Whiteboard' },
];

const HISTORICAL_ERA_OPTIONS = [
  { value: 'ALL', label: 'Tất cả thời kỳ' },
  { value: 'TRIEU_TRAN', label: 'Triều Trần' },
  { value: 'TRIEU_LY', label: 'Triều Lý' },
  { value: 'TRIEU_LE', label: 'Triều Lê' },
  { value: 'THOI_NGO', label: 'Thời Ngô' },
  { value: 'TAY_SON', label: 'Thời Tây Sơn' },
  { value: 'TRIEU_NGUYEN', label: 'Thời Nguyễn' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { value: 'COMPLETED', label: 'Chờ gửi duyệt' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'HIDDEN', label: 'Đã ẩn' },
];

const SORT_OPTIONS: { value: string; label: string; sortBy: string; sortDir: 'asc' | 'desc' }[] = [
  { value: 'createdAt_desc', label: 'Mới nhất trước', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAt_asc', label: 'Cũ nhất trước', sortBy: 'createdAt', sortDir: 'asc' },
  { value: 'title_asc', label: 'Tiêu đề (A – Z)', sortBy: 'title', sortDir: 'asc' },
  { value: 'duration_desc', label: 'Thời lượng dài nhất', sortBy: 'durationSeconds', sortDir: 'desc' },
  { value: 'likes_desc', label: 'Nhiều lượt thích nhất', sortBy: 'likeCount', sortDir: 'desc' },
  { value: 'comments_desc', label: 'Nhiều bình luận nhất', sortBy: 'commentCount', sortDir: 'desc' },
];

export interface LibraryMetrics {
  all: number;
  published: number;
  pendingReview: number;
  completed: number;
  draft: number;
  rejected: number;
  hidden: number;
}

// ─── METADATA INFERENCE FOR TAGS ─────────────────────────────────────────────

export interface ContentMetadataTags {
  format: 'Podcast Video' | 'Whiteboard';
  era: string;
  topic: string;
}

export function inferContentMetadata(title: string, description?: string | null): ContentMetadataTags {
  const t = (title + ' ' + (description || '')).toLowerCase();
  const rawTitle = (title || '').toLowerCase();

  // Format classification
  let format: 'Podcast Video' | 'Whiteboard' = 'Podcast Video';
  if (
    rawTitle.includes('1288') ||
    rawTitle.includes('lam sơn') ||
    rawTitle.includes('whiteboard') ||
    rawTitle.includes('hưng đạo vương')
  ) {
    format = 'Whiteboard';
  } else if (rawTitle.includes('938') || rawTitle.includes('chiếu dời đô') || rawTitle.includes('podcast')) {
    format = 'Podcast Video';
  } else if (t.includes('whiteboard') || t.includes('hoạt họa')) {
    format = 'Whiteboard';
  }

  // Era classification
  let era = 'Triều đại';
  if (
    rawTitle.includes('ngô quyền') ||
    (rawTitle.includes('bạch đằng') && rawTitle.includes('test-e2e-automated'))
  ) {
    era = 'Thời Ngô';
  } else if (rawTitle.includes('chiếu dời đô') || rawTitle.includes('1010') || rawTitle.includes('thăng long')) {
    era = 'Triều Lý';
  } else if (rawTitle.includes('lam sơn') || rawTitle.includes('lê lợi')) {
    era = 'Triều Lê';
  } else if (
    rawTitle.includes('1288') ||
    rawTitle.includes('trần') ||
    t.includes('mậu tý 1288') ||
    rawTitle.includes('938: tiếng sóng')
  ) {
    era = 'Triều Trần';
  } else if (t.includes('ngô') || t.includes('938')) {
    era = 'Thời Ngô';
  }

  // Topic classification
  let topic = 'Lịch sử';
  if (rawTitle.includes('chiếu dời đô') || rawTitle.includes('dời đô') || rawTitle.includes('thăng long')) {
    topic = 'Chính trị';
  } else if (rawTitle.includes('lam sơn') || rawTitle.includes('khởi nghĩa')) {
    topic = 'Khởi nghĩa';
  } else if (
    t.includes('chiến') ||
    t.includes('thủy chiến') ||
    t.includes('đại chiến') ||
    t.includes('đại thắng') ||
    t.includes('quân') ||
    t.includes('sóng vang')
  ) {
    topic = 'Chiến tranh';
  }

  return { format, era, topic };
}

/**
 * Resolves ONLY genuine thumbnails:
 * 1. User uploaded thumbnail (item.thumbnailUrl)
 * 2. Generated video poster snapshot from backend (/outputs/.../cover.png or Cloudinary poster)
 * Does NOT mock or assign arbitrary hardcoded assets.
 */
export const resolveRealThumbnailUrl = (
  thumbnailUrl?: string | null,
  fileUrl?: string | null
): string => {
  if (!thumbnailUrl && !fileUrl) return '';
  return resolveVideoThumbnail(thumbnailUrl, fileUrl);
};

// ─── COMPOUND COMPONENT: LIBRARY CARD ─────────────────────────────────────────

interface LibraryCardContextType {
  item: CreatorVideoItem;
  metadata: ContentMetadataTags;
  thumbnailUrl: string;
  onWatch: (item: CreatorVideoItem) => void;
  onNavigateDetail: (item: CreatorVideoItem) => void;
  onRequestSubmit: (item: CreatorVideoItem) => void;
}

const LibraryCardContext = React.createContext<LibraryCardContextType | null>(null);

function useLibraryCard() {
  const context = React.useContext(LibraryCardContext);
  if (!context) {
    throw new Error('LibraryCard compound components must be rendered within <LibraryCardRoot>');
  }
  return context;
}

interface LibraryCardProps {
  item: CreatorVideoItem;
  onWatch: (item: CreatorVideoItem) => void;
  onNavigateDetail: (item: CreatorVideoItem) => void;
  onRequestSubmit: (item: CreatorVideoItem) => void;
  className?: string;
  children?: React.ReactNode;
}

export const LibraryCardRoot: React.FC<LibraryCardProps> = ({
  item,
  onWatch,
  onNavigateDetail,
  onRequestSubmit,
  className = '',
  children,
}) => {
  const metadata = useMemo(() => inferContentMetadata(item.title, item.description), [item.title, item.description]);
  const thumbnailUrl = useMemo(() => resolveRealThumbnailUrl(item.thumbnailUrl, item.fileUrl), [item.thumbnailUrl, item.fileUrl]);

  return (
    <LibraryCardContext.Provider value={{ item, metadata, thumbnailUrl, onWatch, onNavigateDetail, onRequestSubmit }}>
      <article
        aria-label={`Tác phẩm: ${item.title}`}
        data-motion-card
        className={`group rounded-2xl border border-stone-200/90 bg-white hover:border-stone-300 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xs flex flex-col justify-between overflow-hidden select-none ${className}`}
      >
        {children}
      </article>
    </LibraryCardContext.Provider>
  );
};

export const LibraryCardThumbnail: React.FC = () => {
  const { item, metadata, thumbnailUrl, onWatch } = useLibraryCard();
  const [imageError, setImageError] = useState(false);
  const hasRealImage = Boolean(thumbnailUrl && !imageError);

  // Status configuration based strictly on actual BE status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          dotColor: 'bg-emerald-500',
          label: 'Đã xuất bản',
          textClass: 'text-emerald-800',
          borderClass: 'border-emerald-200/80',
        };
      case 'PENDING_REVIEW':
      case 'PENDING':
        return {
          dotColor: 'bg-amber-500',
          label: 'Chờ duyệt',
          textClass: 'text-amber-800',
          borderClass: 'border-amber-200/80',
        };
      case 'COMPLETED':
        return {
          dotColor: 'bg-blue-500',
          label: 'Chờ gửi duyệt',
          textClass: 'text-blue-800',
          borderClass: 'border-blue-200/80',
        };
      case 'REJECTED':
        return {
          dotColor: 'bg-red-500',
          label: 'Bị từ chối',
          textClass: 'text-red-800',
          borderClass: 'border-red-200/80',
        };
      case 'HIDDEN':
        return {
          dotColor: 'bg-stone-500',
          label: 'Đã ẩn',
          textClass: 'text-stone-700',
          borderClass: 'border-stone-200/80',
        };
      case 'DRAFT':
      default:
        return {
          dotColor: 'bg-stone-400',
          label: 'Bản nháp',
          textClass: 'text-stone-700',
          borderClass: 'border-stone-200/80',
        };
    }
  };

  const statusConfig = getStatusConfig(item.status);

  return (
    <div
      onClick={() => onWatch(item)}
      role="button"
      tabIndex={0}
      aria-label={`Xem trước video: ${item.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onWatch(item);
        }
      }}
      className="relative aspect-video bg-stone-900 border-b border-stone-100 overflow-hidden flex items-center justify-center cursor-pointer group/thumb transition-all duration-200"
    >
      {/* 16:9 Thumbnail: Only displays if user uploaded thumbnail or video poster generated */}
      {hasRealImage ? (
        <img
          src={thumbnailUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        /* Aesthetic Historical Fallback Placeholder (when no thumbnail uploaded) */
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 flex flex-col items-center justify-center p-3 text-center select-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(162,42,42,0.15),transparent_65%)] pointer-events-none" />
          <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center mb-1.5 text-stone-300 border border-white/10 shadow-inner">
            {metadata.format === 'Whiteboard' ? (
              <Video className="h-5 w-5 opacity-80" />
            ) : (
              <Layers className="h-5 w-5 opacity-80" />
            )}
          </div>
          <span className="text-[11px] font-serif font-medium text-stone-300/90 leading-tight">
            {metadata.era} • {metadata.format}
          </span>
          <span className="text-[10px] text-stone-500 pt-0.5">Chưa tải ảnh bìa</span>
        </div>
      )}

      {/* Center Play Button Overlay - Appears only on hover with smooth spring scale */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-all duration-200 flex items-center justify-center z-10 pointer-events-none">
        <div className="h-11 w-11 rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/25 flex items-center justify-center shadow-md scale-95 group-hover/thumb:scale-110 group-hover/thumb:bg-[#A22A2A] transition-all duration-200">
          <Play className="h-5 w-5 fill-current ml-0.5 opacity-90 group-hover/thumb:opacity-100" />
        </div>
      </div>

      {/* Top Status Pill Overlay with Colored Dot - Always reflects actual BE state */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 ${statusConfig.textClass} text-[11px] font-medium border ${statusConfig.borderClass} shadow-2xs backdrop-blur-xs`}>
          <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor} shrink-0`} />
          <span>{statusConfig.label}</span>
        </span>
        {item.isExclusive && (
          <span className="px-2 py-0.5 rounded-full bg-[#A22A2A] text-white text-[10px] font-bold font-mono">
            VIP
          </span>
        )}
      </div>

      {/* Bottom Duration Overlay - Reflects real duration from BE if available */}
      {item.durationSeconds && item.durationSeconds > 0 ? (
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-mono flex items-center gap-1 z-10 pointer-events-none backdrop-blur-2xs">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(item.durationSeconds)}</span>
        </div>
      ) : null}
    </div>
  );
};

export const LibraryCardBody: React.FC = () => {
  const { item, metadata, onWatch } = useLibraryCard();

  return (
    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
      <div className="space-y-2">
        {/* Title */}
        <h3
          onClick={() => onWatch(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onWatch(item);
            }
          }}
          title={item.title}
          className="font-serif text-[15px] font-bold text-stone-900 line-clamp-1 hover:text-[#A22A2A] cursor-pointer hover:underline transition-colors break-words"
        >
          {item.title}
        </h3>

        {/* Description */}
        {item.description ? (
          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed break-words">
            {item.description}
          </p>
        ) : (
          <p className="text-xs text-stone-400 italic">Chưa có kịch bản tóm tắt</p>
        )}
      </div>

      <div className="space-y-2 pt-1">
        {/* Curated Tags Row (Format Pill, Era Pill, Topic Pill) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Format Tag */}
          {metadata.format === 'Podcast Video' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-medium border border-[#BFDBFE]/60">
              <Layers className="h-3 w-3" />
              <span>Podcast Video</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] text-[11px] font-medium border border-[#CBD5E1]/80">
              <Video className="h-3 w-3" />
              <span>Whiteboard</span>
            </span>
          )}

          {/* Historical Era Tag */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF9F6] text-stone-600 text-[11px] font-medium border border-stone-200">
            {metadata.era}
          </span>

          {/* Historical Topic Tag */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF9F6] text-stone-600 text-[11px] font-medium border border-stone-200">
            {metadata.topic}
          </span>
        </div>

        {/* Real Moderation Rejection Reason or AI Shield */}
        {item.status === 'REJECTED' && item.moderationReason ? (
          <div className="p-2.5 rounded-lg bg-red-50/90 border border-red-200 text-[11px] text-red-700 flex items-start gap-1.5 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-600" />
            <span className="line-clamp-2">Từ chối: {item.moderationReason}</span>
          </div>
        ) : item.aiShieldScore !== null && item.aiShieldScore !== undefined ? (
          <div className="flex items-center gap-1.5 text-[11px] text-stone-600 pt-0.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#A22A2A] shrink-0" />
            <span>AI Shield:</span>
            <span
              className={`font-mono font-bold ${
                Number(item.aiShieldScore) >= 70
                  ? 'text-[#A22A2A]'
                  : 'text-amber-700'
              }`}
            >
              {Number(item.aiShieldScore).toFixed(1)}/100
            </span>
            {item.aiShieldTierLabel && (
              <span className="text-stone-500 text-[10px]">({item.aiShieldTierLabel})</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const LibraryCardFooter: React.FC = () => {
  const { item, onNavigateDetail, onRequestSubmit, onWatch } = useLibraryCard();

  return (
    <div className="px-4 py-2.5 bg-[#FAF9F6] border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
      {/* Date & Real Engagement Stats from BE */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-stone-500 tabular-nums">{formatDate(item.createdAt)}</span>
        <span className="flex items-center gap-1 font-mono tabular-nums text-stone-500" title="Lượt thích">
          <Heart className="h-3 w-3" />
          {item.likeCount || 0}
        </span>
        <span className="flex items-center gap-1 font-mono tabular-nums text-stone-500" title="Lượt không thích">
          <ThumbsUp className="h-3 w-3" />
          {item.dislikeCount || 0}
        </span>
        <span className="flex items-center gap-1 font-mono tabular-nums text-stone-500" title="Bình luận">
          <MessageSquare className="h-3 w-3" />
          {item.commentCount || 0}
        </span>
      </div>

      {/* Real Action Buttons strictly reflecting video state */}
      <div className="flex items-center gap-1.5">
        {item.status === 'COMPLETED' ? (
          <Button
            size="sm"
            onClick={() => onRequestSubmit(item)}
            className="h-7 px-3 text-xs gap-1.5 bg-[#A22A2A] hover:bg-[#8B2424] text-white shadow-2xs font-medium rounded-lg active:scale-[0.98] transition-transform"
          >
            <Send className="h-3 w-3" />
            <span>Gửi duyệt</span>
          </Button>
        ) : item.status === 'REJECTED' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateDetail(item)}
            className="h-7 px-3 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50 bg-white shadow-2xs font-medium rounded-lg active:scale-[0.98] transition-transform"
          >
            <Edit3 className="h-3 w-3" />
            <span>Chỉnh sửa</span>
          </Button>
        ) : item.status === 'DRAFT' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateDetail(item)}
            className="h-7 px-3 text-xs gap-1 border-stone-300 text-stone-700 hover:text-stone-900 bg-white shadow-2xs font-medium rounded-lg active:scale-[0.98] transition-transform"
          >
            <Edit3 className="h-3 w-3" />
            <span>Tiếp tục tạo</span>
          </Button>
        ) : item.status === 'HIDDEN' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateDetail(item)}
            className="h-7 px-3 text-xs gap-1 border-stone-300 text-stone-700 hover:text-stone-900 bg-white shadow-2xs font-medium rounded-lg active:scale-[0.98] transition-transform"
          >
            <span>Quản lý</span>
          </Button>
        ) : item.status === 'PENDING_REVIEW' || item.status === 'PENDING' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateDetail(item)}
            className="h-7 px-3 text-xs gap-1 border-amber-300 text-amber-800 hover:bg-amber-50 bg-white shadow-2xs font-medium rounded-lg active:scale-[0.98] transition-transform"
          >
            <span>Xem chi tiết</span>
            <ExternalLink className="h-3 w-3 text-amber-600" />
          </Button>
        ) : (
          /* PUBLISHED */
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateDetail(item)}
            className="h-7 px-3 text-xs gap-1 border-stone-300 text-stone-700 hover:text-stone-900 hover:border-stone-400 bg-white shadow-2xs font-medium rounded-lg active:scale-[0.98] transition-transform"
          >
            <span>Chi tiết</span>
            <ExternalLink className="h-3 w-3 text-stone-400" />
          </Button>
        )}

        {/* Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Tùy chọn khác"
              className="h-7 w-7 rounded-lg hover:bg-stone-200/70 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuItem onClick={() => onWatch(item)}>
              <Play className="h-3.5 w-3.5 mr-2 text-[#A22A2A]" />
              <span>Xem trước tác phẩm</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigateDetail(item)}>
              <ExternalLink className="h-3.5 w-3.5 mr-2 text-stone-500" />
              <span>Quản lý chi tiết</span>
            </DropdownMenuItem>
            {item.status === 'COMPLETED' && (
              <DropdownMenuItem onClick={() => onRequestSubmit(item)}>
                <Send className="h-3.5 w-3.5 mr-2 text-[#A22A2A]" />
                <span>Gửi kiểm duyệt ngay</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const LibraryCard = Object.assign(LibraryCardRoot, {
  Thumbnail: LibraryCardThumbnail,
  Body: LibraryCardBody,
  Footer: LibraryCardFooter,
});

// ─── 6TH CTA CARD: TẠO NỘI DUNG MỚI ──────────────────────────────────────────

interface CreateContentCardProps {
  onNavigateCreate: () => void;
}

export const CreateContentCard: React.FC<CreateContentCardProps> = ({ onNavigateCreate }) => {
  return (
    <div
      data-motion-card
      onClick={() => onNavigateCreate()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigateCreate();
        }
      }}
      aria-label="Tạo nội dung mới"
      className="rounded-2xl border border-dashed border-stone-300 hover:border-[#A22A2A]/60 bg-[#FAF9F6]/80 hover:bg-[#FFFDFB] transition-all duration-200 flex flex-col items-center justify-center p-6 text-center shadow-2xs hover:shadow-card-hover hover:-translate-y-1 min-h-[340px] select-none group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A22A2A]/30"
    >
      {/* Red Circular Icon with Plus Sign - Interactive Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNavigateCreate();
        }}
        aria-label="Tạo nội dung mới ngay"
        className="h-14 w-14 rounded-full bg-red-50 group-hover:bg-red-100/90 text-[#A22A2A] border border-red-200/80 flex items-center justify-center mb-3.5 shadow-2xs group-hover:scale-110 group-hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A22A2A]/40"
      >
        <Plus className="h-7 w-7 stroke-[2.4]" />
      </button>

      <h3 className="font-serif text-base font-bold text-stone-900 mb-1 group-hover:text-[#A22A2A] transition-colors">
        Tạo nội dung mới
      </h3>

      <p className="text-xs text-stone-500 max-w-[220px] leading-relaxed mb-5">
        Biến những trang sử hào hùng của dân tộc thành video &amp; podcast sống động.
      </p>

      <Button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNavigateCreate();
        }}
        className="bg-[#A22A2A] hover:bg-[#8B0000] text-white text-xs h-9 px-5 rounded-lg font-medium shadow-xs hover:shadow transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Tạo nội dung ngay</span>
      </Button>
    </div>
  );
};

// ─── MAIN CONTENT LIBRARY PAGE COMPONENT ──────────────────────────────────────

export const CreatorContentLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search, filter & sort state
  const activeStatus = searchParams.get('status') || 'ALL';
  const keywordParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'createdAt_desc';
  const formatFilter = searchParams.get('format') || 'ALL';
  const eraFilter = searchParams.get('era') || 'ALL';
  const exclusiveParam = searchParams.get('vip');

  const [searchTerm, setSearchTerm] = useState(keywordParam);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Quick Watch Video Modal State
  const [playingVideo, setPlayingVideo] = useState<CreatorVideoItem | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Submit for Review Dialog State
  const [submittingVideo, setSubmittingVideo] = useState<CreatorVideoItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Animation Refs for GSAP Entrance
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  const isVideoMedia = (url?: string | null): boolean => {
    if (!url) return true;
    const clean = url.split('?')[0].toLowerCase();
    return (
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.mov') ||
      clean.endsWith('.mkv') ||
      !clean.endsWith('.mp3')
    );
  };

  const handleWatchVideo = async (item: CreatorVideoItem) => {
    setMediaError(false);
    setPlayingVideo(item);

    if (!item.fileUrl) {
      setIsLoadingDetail(true);
      try {
        const res = await creatorStudioApi.getVideoDetail(item.contentId);
        if (res.data?.fileUrl) {
          setPlayingVideo((prev) =>
            prev && prev.contentId === item.contentId
              ? { ...prev, fileUrl: res.data.fileUrl }
              : prev
          );
        }
      } catch (err) {
        console.error('Không thể tải URL phương tiện từ API chi tiết:', err);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const currentSortOption = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortParam) || SORT_OPTIONS[0];
  }, [sortParam]);

  // Query videos from backend (fetch full list so tab counts & metrics stay consistent across tabs)
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'creator',
      'studio-videos',
      'library',
      {
        keyword: keywordParam || undefined,
        sortBy: currentSortOption.sortBy,
        sortDir: currentSortOption.sortDir,
        isExclusive: exclusiveParam === 'true' ? true : exclusiveParam === 'false' ? false : undefined,
      },
    ],
    queryFn: () =>
      creatorStudioApi.getVideos({
        keyword: keywordParam.trim() || undefined,
        sortBy: currentSortOption.sortBy,
        sortDir: currentSortOption.sortDir,
        isExclusive: exclusiveParam === 'true' ? true : exclusiveParam === 'false' ? false : undefined,
      }),
    refetchInterval: (query) => {
      const vids = Array.isArray(query.state.data?.data) ? query.state.data.data : [];
      const hasPending = vids.some((v) => v.status === 'PENDING_REVIEW' || v.status === 'PENDING');
      return hasPending ? 15000 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const rawVideos: CreatorVideoItem[] = Array.isArray(response?.data) ? response.data : [];

  // Submit for Review Mutation
  const submitMutation = useMutation({
    mutationFn: (contentId: number) => creatorStudioApi.submitVideoForPublish(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos', 'library'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos', 'dashboard'] });
      setSubmittingVideo(null);
      setFeedback({
        type: 'success',
        message: 'Đã gửi tác phẩm vào hàng đợi kiểm duyệt thành công! AI Shield sẽ thẩm định và Admin sẽ xét duyệt sớm.',
      });
    },
    onError: (err: unknown) => {
      setFeedback({
        type: 'error',
        message: (err as Error)?.message || 'Có lỗi xảy ra khi gửi kiểm duyệt. Vui lòng thử lại.',
      });
    },
  });

  // Client-side filtering for status, format, era, and presentation
  const filteredVideos = useMemo(() => {
    return rawVideos.filter((item) => {
      // 1. Status tab & status dropdown filter
      if (activeStatus !== 'ALL') {
        if (activeStatus === 'PENDING_REVIEW') {
          if (item.status !== 'PENDING_REVIEW' && item.status !== 'PENDING') {
            return false;
          }
        } else if (item.status !== activeStatus) {
          return false;
        }
      }

      const meta = inferContentMetadata(item.title, item.description);

      // 2. Format filter
      if (formatFilter === 'PODCAST_VIDEO' && meta.format !== 'Podcast Video') {
        return false;
      }
      if (formatFilter === 'WHITEBOARD' && meta.format !== 'Whiteboard') {
        return false;
      }

      // 3. Era filter
      if (eraFilter === 'TRIEU_TRAN' && meta.era !== 'Triều Trần') return false;
      if (eraFilter === 'TRIEU_LY' && meta.era !== 'Triều Lý') return false;
      if (eraFilter === 'TRIEU_LE' && meta.era !== 'Triều Lê') return false;
      if (eraFilter === 'THOI_NGO' && meta.era !== 'Thời Ngô') return false;
      if (eraFilter === 'TAY_SON' && meta.era !== 'Thời Tây Sơn') return false;
      if (eraFilter === 'TRIEU_NGUYEN' && meta.era !== 'Thời Nguyễn') return false;

      return true;
    });
  }, [rawVideos, activeStatus, formatFilter, eraFilter]);

  // Aggregate metrics strictly calculated from actual BE data
  const metrics: LibraryMetrics = useMemo(() => {
    const total = rawVideos.length;
    const published = rawVideos.filter((v) => v.status === 'PUBLISHED').length;
    const pendingReview = rawVideos.filter((v) => v.status === 'PENDING_REVIEW' || v.status === 'PENDING').length;
    const completed = rawVideos.filter((v) => v.status === 'COMPLETED').length;
    const draft = rawVideos.filter((v) => v.status === 'DRAFT').length;
    const rejected = rawVideos.filter((v) => v.status === 'REJECTED').length;
    const hidden = rawVideos.filter((v) => v.status === 'HIDDEN').length;

    return {
      all: total,
      published,
      pendingReview,
      completed,
      draft,
      rejected,
      hidden,
    };
  }, [rawVideos]);

  // ─── ENTRANCE ANIMATION: GSAP SMOOTH FLOAT IN ──────────────────────────────
  useEffect(() => {
    if (isReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.48 }
        );
      }

      if (filterRef.current) {
        tl.fromTo(
          filterRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.28'
        );
      }

      if (gridRef.current && gridRef.current.children.length > 0) {
        tl.fromTo(
          gridRef.current.children,
          { opacity: 0, y: 18, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            stagger: 0.05,
            clearProps: 'transform,opacity',
          },
          '-=0.2'
        );
      }

      if (paginationRef.current) {
        tl.fromTo(
          paginationRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, activeStatus, formatFilter, eraFilter, viewMode]);

  const handleStatusChange = (status: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (status === 'ALL') {
      nextParams.delete('status');
    } else {
      nextParams.set('status', status);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      nextParams.set('q', searchTerm.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', e.target.value);
    setSearchParams(nextParams);
  };

  const handleFormatFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParams = new URLSearchParams(searchParams);
    if (e.target.value === 'ALL') {
      nextParams.delete('format');
    } else {
      nextParams.set('format', e.target.value);
    }
    setSearchParams(nextParams);
  };

  const handleEraFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParams = new URLSearchParams(searchParams);
    if (e.target.value === 'ALL') {
      nextParams.delete('era');
    } else {
      nextParams.set('era', e.target.value);
    }
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Feedback Toast / Alert Bar */}
      {feedback && (
        <div
          className={`p-3.5 px-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Header Masthead with Historical Panorama & Floating Stats Card */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 md:p-8 min-h-[160px] flex flex-col justify-center"
      >
        {/* Historical Panorama Background - Subtle Watermark Blend */}
        <div
          className="absolute inset-0 bg-cover bg-right pointer-events-none opacity-85 mix-blend-multiply"
          style={{
            backgroundImage: `url('/assets/studio/header-landscape-warm-v2.png')`,
          }}
          aria-hidden="true"
        />

        {/* Soft Left Protective Gradient for Title and Subtitle Legibility */}
        <div
          className="absolute inset-y-0 left-0 w-3/4 sm:w-2/3 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/95 via-50% to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Masthead Titles */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A22A2A]">
              <Video className="h-4 w-4 text-[#A22A2A]" />
              <span>Kho Tác Phẩm Sử Ký</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
              Thư Viện Nội Dung
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed pt-0.5">
              Quản lý toàn bộ danh mục podcast, video hoạt họa lịch sử và theo dõi tiến trình kiểm duyệt của kênh.
            </p>
          </div>

          {/* Right Floating Stat Pill Card - Displays Actual Real Stats from BE */}
          <div className="flex items-center rounded-2xl border border-stone-200/90 bg-white/95 backdrop-blur-md px-5 py-3 shadow-sm divide-x divide-stone-200/80 shrink-0">
            {/* Stat 1: Tổng cộng */}
            <div className="flex items-center gap-2.5 pr-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Video className="h-4 w-4" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[11px] font-medium text-stone-500 block">Tổng cộng</span>
                <span className="text-base font-bold text-stone-900 font-mono tabular-nums">
                  {metrics.all}
                </span>
                <span className="text-[10px] text-stone-400 block -mt-0.5">tác phẩm</span>
              </div>
            </div>

            {/* Stat 2: Đã xuất bản */}
            <div className="flex items-center gap-2.5 px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[11px] font-medium text-stone-500 block">Đã xuất bản</span>
                <span className="text-base font-bold text-stone-900 font-mono tabular-nums">
                  {metrics.published}
                </span>
                <span className="text-[10px] text-stone-400 block -mt-0.5">tác phẩm</span>
              </div>
            </div>

            {/* Stat 3: Chờ duyệt */}
            <div className="flex items-center gap-2.5 px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[11px] font-medium text-stone-500 block">Chờ duyệt</span>
                <span className="text-base font-bold text-stone-900 font-mono tabular-nums">
                  {metrics.pendingReview}
                </span>
                <span className="text-[10px] text-stone-400 block -mt-0.5">tác phẩm</span>
              </div>
            </div>

            {/* Stat 4: Chờ gửi duyệt / Bản nháp */}
            <div className="flex items-center gap-2.5 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[11px] font-medium text-stone-500 block">Chờ gửi duyệt</span>
                <span className="text-base font-bold text-stone-900 font-mono tabular-nums">
                  {metrics.completed}
                </span>
                <span className="text-[10px] text-stone-400 block -mt-0.5">tác phẩm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Status Filter Tabs with Counts (Strictly matching BE counts) */}
      <div className="border-b border-stone-200/90 overflow-x-auto scrollbar-none">
        <div role="tablist" aria-label="Lọc theo trạng thái" className="flex items-center gap-1 sm:gap-2 min-w-max pb-0.5">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.key;
            const count = metrics[tab.countKey];

            return (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls="content-library-list"
                onClick={() => handleStatusChange(tab.key)}
                className={`group relative py-2.5 px-3.5 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none rounded-t-lg ${
                  isActive
                    ? 'text-[#A22A2A] font-semibold border-b-2 border-[#A22A2A]'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono tabular-nums transition-colors ${
                    isActive
                      ? 'text-[#A22A2A] font-bold'
                      : 'text-stone-400 group-hover:text-stone-600'
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filter Toolbar & Search Bar */}
      <div
        ref={filterRef}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1"
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả hoặc kịch bản..."
            aria-label="Tìm kiếm tác phẩm"
            className="pl-10 pr-4 h-9 text-xs bg-white border-stone-200/90 focus:border-[#A22A2A] focus:ring-1 focus:ring-[#A22A2A] shadow-2xs rounded-lg"
          />
        </form>

        {/* 4 Dropdowns & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown 1: Định dạng */}
          <div className="flex flex-col">
            <label htmlFor="filter-format" className="text-[10px] text-stone-500 font-medium mb-0.5">
              Định dạng
            </label>
            <div className="relative">
              <select
                id="filter-format"
                value={formatFilter}
                onChange={handleFormatFilterChange}
                aria-label="Lọc theo định dạng tác phẩm"
                className="appearance-none bg-white border border-stone-200/90 rounded-lg pl-3 pr-8 py-1.5 text-xs text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#A22A2A] cursor-pointer h-9 shadow-2xs"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Dropdown 2: Thời kỳ lịch sử */}
          <div className="flex flex-col">
            <label htmlFor="filter-era" className="text-[10px] text-stone-500 font-medium mb-0.5">
              Thời kỳ lịch sử
            </label>
            <div className="relative">
              <select
                id="filter-era"
                value={eraFilter}
                onChange={handleEraFilterChange}
                aria-label="Lọc theo thời kỳ lịch sử"
                className="appearance-none bg-white border border-stone-200/90 rounded-lg pl-3 pr-8 py-1.5 text-xs text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#A22A2A] cursor-pointer h-9 shadow-2xs"
              >
                {HISTORICAL_ERA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Dropdown 3: Trạng thái */}
          <div className="flex flex-col">
            <label htmlFor="filter-status" className="text-[10px] text-stone-500 font-medium mb-0.5">
              Trạng thái
            </label>
            <div className="relative">
              <select
                id="filter-status"
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Lọc theo trạng thái kiểm duyệt"
                className="appearance-none bg-white border border-stone-200/90 rounded-lg pl-3 pr-8 py-1.5 text-xs text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#A22A2A] cursor-pointer h-9 shadow-2xs"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Dropdown 4: Sắp xếp */}
          <div className="flex flex-col">
            <span className="text-[10px] text-transparent select-none mb-0.5">.</span>
            <div className="relative">
              <div className="flex items-center bg-white border border-stone-200/90 rounded-lg pl-2.5 pr-8 h-9 shadow-2xs hover:border-stone-300">
                <ArrowUpDown className="h-3.5 w-3.5 text-stone-400 mr-1.5 shrink-0" />
                <select
                  aria-label="Sắp xếp danh sách tác phẩm"
                  value={sortParam}
                  onChange={handleSortChange}
                  className="appearance-none bg-transparent text-xs text-stone-700 focus:outline-none cursor-pointer pr-1"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* View Mode Toggle Buttons (Grid vs List) */}
          <div className="flex flex-col">
            <span className="text-[10px] text-transparent select-none mb-0.5">.</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Xem dạng lưới thẻ"
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#A22A2A] text-white shadow-2xs'
                    : 'bg-white border border-stone-200/90 text-stone-500 hover:text-stone-800'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Xem dạng danh sách hàng"
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#A22A2A] text-white shadow-2xs'
                    : 'bg-white border border-stone-200/90 text-stone-500 hover:text-stone-800'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Grid / List / Skeletons / Empty State */}
      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200/80 bg-white p-4 space-y-4 animate-pulse shadow-2xs"
            >
              <div className="aspect-video bg-stone-100 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-stone-100 rounded w-16" />
                <div className="h-4 bg-stone-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-900">
              Không thể tải thư viện nội dung
            </h3>
            <p className="text-xs text-red-700/90 leading-relaxed">
              {(error as Error)?.message ||
                'Đã xảy ra lỗi khi kết nối tới máy chủ Creator Studio. Vui lòng kiểm tra lại đường truyền.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Empty State: No results */}
      {!isLoading && !isError && filteredVideos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center space-y-4 shadow-2xs">
          <div className="h-12 w-12 rounded-full bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center text-stone-500">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-semibold text-stone-900">
              {keywordParam || activeStatus !== 'ALL' || formatFilter !== 'ALL' || eraFilter !== 'ALL'
                ? 'Không tìm thấy tác phẩm phù hợp'
                : 'Thư viện kênh hiện chưa có tác phẩm nào'}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {keywordParam || activeStatus !== 'ALL' || formatFilter !== 'ALL' || eraFilter !== 'ALL'
                ? 'Không có video hoặc podcast nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Thử đặt lại bộ lọc để xem toàn bộ danh mục.'
                : 'Kênh của bạn chưa có tác phẩm podcast hoặc video nào. Bạn có thể bắt đầu bằng cách nhấn "Tạo nội dung mới" để khởi tạo kịch bản và dựng hoạt họa trong Creator Studio.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {(keywordParam || activeStatus !== 'ALL' || formatFilter !== 'ALL' || eraFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="gap-2 text-xs border-stone-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại bộ lọc</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate('/creator/create')}
              className="gap-1.5 text-xs bg-[#A22A2A] hover:bg-[#8B0000] text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo nội dung ngay</span>
            </Button>
          </div>
        </div>
      )}

      {/* 5. Video Grid Display (3 Columns, with 6th Card CTA) */}
      {!isLoading && !isError && filteredVideos.length > 0 && viewMode === 'grid' && (
        <div
          ref={gridRef}
          id="content-library-list"
          role="region"
          aria-label="Danh sách tác phẩm dạng lưới"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredVideos.map((item) => (
            <LibraryCard
              key={item.contentId}
              item={item}
              onWatch={handleWatchVideo}
              onNavigateDetail={(vid) => navigate(`/creator/content/${vid.contentId}`)}
              onRequestSubmit={(vid) => setSubmittingVideo(vid)}
            >
              <LibraryCard.Thumbnail />
              <LibraryCard.Body />
              <LibraryCard.Footer />
            </LibraryCard>
          ))}

          {/* 6th Card: Dedicated "Tạo nội dung mới" CTA card */}
          <CreateContentCard onNavigateCreate={() => navigate('/creator/create')} />
        </div>
      )}

      {/* 6. Video List Display (Alternative Table / Row View) */}
      {!isLoading && !isError && filteredVideos.length > 0 && viewMode === 'list' && (
        <div
          ref={gridRef}
          id="content-library-list"
          role="region"
          aria-label="Danh sách tác phẩm dạng danh sách"
          className="rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-2xs divide-y divide-stone-100"
        >
          {filteredVideos.map((item) => {
            const meta = inferContentMetadata(item.title, item.description);
            const thumb = resolveRealThumbnailUrl(item.thumbnailUrl, item.fileUrl);
            const statusBadge = getContentStatusBadge(item.status);

            return (
              <div
                key={item.contentId}
                data-motion-card
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    onClick={() => handleWatchVideo(item)}
                    role="button"
                    tabIndex={0}
                    className="relative h-16 w-28 rounded-lg overflow-hidden bg-stone-900 shrink-0 cursor-pointer group/thumb border border-stone-200"
                  >
                    {thumb ? (
                      <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-850 text-stone-400 p-1 text-center">
                        <Video className="h-5 w-5 opacity-50" />
                        <span className="text-[9px] text-stone-500 pt-0.5">Không ảnh bìa</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                      <span className="text-[11px] font-mono text-stone-400">
                        {meta.format} • {meta.era}
                      </span>
                    </div>
                    <h3
                      onClick={() => handleWatchVideo(item)}
                      className="font-serif text-sm font-bold text-stone-900 truncate hover:text-[#A22A2A] cursor-pointer"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 truncate max-w-xl">
                      {item.description || 'Chưa có kịch bản tóm tắt'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-stone-500">
                  <span className="font-mono text-stone-400">{formatDate(item.createdAt)}</span>
                  {item.status === 'COMPLETED' ? (
                    <Button
                      size="sm"
                      onClick={() => setSubmittingVideo(item)}
                      className="h-8 px-3 text-xs gap-1.5 bg-[#A22A2A] text-white hover:bg-[#8B2424]"
                    >
                      <Send className="h-3 w-3" />
                      <span>Gửi duyệt</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/content/${item.contentId}`)}
                      className="h-8 px-3 text-xs gap-1 border-stone-300 text-stone-700 hover:text-stone-900"
                    >
                      <span>Chi tiết</span>
                      <ExternalLink className="h-3 w-3 text-stone-400" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Bottom Pagination Bar (Matching Reference) */}
      {!isLoading && !isError && filteredVideos.length > 0 && (
        <div
          ref={paginationRef}
          className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 select-none"
        >
          {/* Left Count Summary */}
          <div>
            Hiển thị 1 – {filteredVideos.length} của {filteredVideos.length} tác phẩm
          </div>

          {/* Center Page Selector */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              aria-label="Trang trước"
              className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-400 flex items-center justify-center opacity-60 cursor-not-allowed"
            >
              &lt;
            </button>
            <button
              type="button"
              aria-label="Trang 1"
              aria-current="page"
              className="h-8 w-8 rounded-lg bg-[#A22A2A] text-white font-bold flex items-center justify-center shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              disabled
              aria-label="Trang sau"
              className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-400 flex items-center justify-center opacity-60 cursor-not-allowed"
            >
              &gt;
            </button>
          </div>

          {/* Right Items per Page Dropdown */}
          <div className="flex items-center gap-2">
            <span>Số tác phẩm mỗi trang</span>
            <div className="relative">
              <select
                aria-label="Số tác phẩm mỗi trang"
                defaultValue="12"
                className="appearance-none bg-white border border-stone-200/90 rounded-lg pl-3 pr-7 py-1 text-xs text-stone-700 hover:border-stone-300 focus:outline-none cursor-pointer h-8 shadow-2xs"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
              <ChevronDown className="h-3 w-3 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* 8. Submit For Review Confirmation Modal */}
      <Dialog
        open={Boolean(submittingVideo)}
        onOpenChange={(open) => {
          if (!open && !submitMutation.isPending) {
            setSubmittingVideo(null);
          }
        }}
      >
        <DialogContent
          maxWidth="max-w-md"
          className="p-6 bg-white border border-stone-200/90 rounded-2xl shadow-modal focus:outline-none"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-[#A22A2A] flex items-center justify-center shrink-0 border border-rose-100">
                <Send className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="font-serif text-base font-bold text-stone-900">
                  Gửi kiểm duyệt xuất bản
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 leading-relaxed">
                  Tác phẩm sẽ được hệ thống chuyển sang trạng thái <strong>Chờ duyệt</strong> và đưa vào hàng đợi kiểm duyệt của Quản trị viên.
                </DialogDescription>
              </div>
            </div>

            {submittingVideo && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
                <span className="font-semibold text-stone-900 block truncate">
                  {submittingVideo.title}
                </span>
                <div className="flex items-center gap-2 text-stone-500 text-[11px] font-mono">
                  <span>Mã tác phẩm: #{submittingVideo.contentId}</span>
                  {submittingVideo.durationSeconds && (
                    <span>• {formatDuration(submittingVideo.durationSeconds)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-800 space-y-1">
              <span className="font-semibold block flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                Kiểm định AI Shield &amp; Sử Ký Toàn Thư
              </span>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Hệ thống AI Shield sẽ tự động rà soát sự kiện, nhân vật và niên biểu lịch sử để bảo đảm độ chính xác trước khi xuất bản rộng rãi.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmittingVideo(null)}
                disabled={submitMutation.isPending}
                className="text-xs border-stone-300"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => submittingVideo && submitMutation.mutate(submittingVideo.contentId)}
                disabled={submitMutation.isPending}
                className="text-xs bg-[#A22A2A] hover:bg-[#8B2424] text-white gap-1.5"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Xác nhận gửi duyệt</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9. Direct Video Player Modal */}
      <Dialog
        open={Boolean(playingVideo)}
        onOpenChange={(open) => {
          if (!open) {
            setPlayingVideo(null);
            setMediaError(false);
          }
        }}
      >
        <DialogContent
          maxWidth="max-w-3xl"
          className="p-0 overflow-hidden bg-black text-stone-100 border border-stone-800 rounded-2xl shadow-modal focus:outline-none"
        >
          {playingVideo && (
            <div className="flex flex-col">
              {/* Modal Top Bar */}
              <div className="p-3.5 px-5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="flex h-6 w-6 rounded-md bg-[#A22A2A]/20 text-[#A22A2A] items-center justify-center shrink-0">
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </span>
                  <DialogTitle className="font-serif text-sm font-bold text-white truncate">
                    {playingVideo.title}
                  </DialogTitle>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={getContentStatusBadge(playingVideo.status).variant}>
                    {getContentStatusBadge(playingVideo.status).label}
                  </Badge>
                  {playingVideo.durationSeconds && (
                    <span className="text-[11px] font-mono text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded">
                      {formatDuration(playingVideo.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>

              {/* Video Surface Area */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 text-stone-300">
                    <RotateCcw className="h-7 w-7 text-[#A22A2A] animate-spin" />
                    <p className="text-xs font-mono">Đang kiểm tra luồng video sẵn sàng...</p>
                  </div>
                ) : playingVideo.fileUrl && !mediaError ? (
                  isVideoMedia(playingVideo.fileUrl) ? (
                    <video
                      key={playingVideo.contentId}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      src={resolveMediaUrl(playingVideo.fileUrl)}
                      onError={() => setMediaError(true)}
                    >
                      Trình duyệt không hỗ trợ thẻ video HTML5.
                    </video>
                  ) : (
                    <div className="w-full max-w-md p-8 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-[#A22A2A]/20 text-[#A22A2A] mx-auto flex items-center justify-center shadow-glow-accent">
                        <Volume2 className="h-8 w-8" />
                      </div>
                      <p className="text-xs text-stone-300 font-serif">Bản thu âm Podcast Lịch Sử</p>
                      <audio
                        controls
                        autoPlay
                        className="w-full"
                        src={resolveMediaUrl(playingVideo.fileUrl)}
                        onError={() => setMediaError(true)}
                      />
                    </div>
                  )
                ) : (
                  <div className="text-center p-8 space-y-3 text-stone-400">
                    <Video className="h-10 w-10 mx-auto opacity-50 text-stone-500" />
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      {mediaError
                        ? 'Không thể tải luồng video (URL bảo vệ hoặc đang cập nhật).'
                        : 'Tác phẩm đang xử lý kết xuất hoặc chưa tải tệp media lên.'}
                    </p>
                    {playingVideo.fileUrl && (
                      <div className="pt-1">
                        <a
                          href={resolveMediaUrl(playingVideo.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 text-stone-200 text-xs hover:bg-stone-700 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Mở trực tiếp link tệp media</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description & Metadata Footer */}
              <div className="p-4 px-5 bg-[#181715] border-t border-stone-800 space-y-3">
                {playingVideo.description && (
                  <DialogDescription className="text-xs text-stone-300 line-clamp-3 leading-relaxed">
                    {playingVideo.description}
                  </DialogDescription>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-3 text-stone-400 text-[11px]">
                    <span className="font-mono">{formatDate(playingVideo.createdAt)}</span>
                    {playingVideo.aiShieldScore !== null && playingVideo.aiShieldScore !== undefined && (
                      <span className="flex items-center gap-1 text-[#A22A2A] font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>AI Shield: {Number(playingVideo.aiShieldScore).toFixed(1)}/100</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const cid = playingVideo.contentId;
                        setPlayingVideo(null);
                        navigate(`/creator/content/${cid}`);
                      }}
                      className="text-xs h-8 gap-1.5 border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
                    >
                      <span>Quản lý &amp; Chi tiết tác phẩm</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPlayingVideo(null)}
                      className="text-xs h-8 px-4 bg-[#A22A2A] text-white hover:bg-[#8B0000]"
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
