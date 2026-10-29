import React, { useState } from 'react';
import {
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Tv,
  Info,
  MoreVertical,
  Copy,
  Check,
  StopCircle,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { LivestreamSession } from '@/types/livestream';
import {
  canManageLivestream,
  formatLivestreamViewerCount,
} from '../livestreamLogic';
import {
  enrichLivestreamSession,
  EnrichedLivestreamSession,
} from '../canonicalLivestreamData';
import { formatLivestreamDateTime } from './LivestreamCard';

interface LivestreamListItemProps {
  session: LivestreamSession;
  currentUserId?: number | null;
  onViewDetails: (session: LivestreamSession) => void;
  onEnterStudio: (session: LivestreamSession) => void;
  onEndSession: (session: LivestreamSession) => void;
}

export const LivestreamListItem: React.FC<LivestreamListItemProps> = ({
  session,
  currentUserId,
  onViewDetails,
  onEnterStudio,
  onEndSession,
}) => {
  const enriched: EnrichedLivestreamSession = enrichLivestreamSession(session);
  const isLive = session.status === 'LIVE';
  const isOwner = canManageLivestream(session, currentUserId);
  const safeChannelName = session.channelName || 'Dai Viet Su Ky Podcast';
  const initialLetter = safeChannelName.charAt(0).toUpperCase() || 'D';

  const [hasCopied, setHasCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/creator/livestream/${session.id}/studio`;
    navigator.clipboard?.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Lượt xem thực tế từ backend
  const displayViews = formatLivestreamViewerCount(session.viewerCount ?? 0);

  return (
    <article
      aria-label={`Phiên phát trực tiếp: ${session.title}`}
      className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-2xl border border-[#EBE4D8] bg-white shadow-xs hover:shadow-md hover:border-[#D6CCC2] hover:-translate-y-0.5 transition-all duration-200 gap-4"
    >
      {/* Left: Thumbnail with badges - Clickable with hover state */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onViewDetails(session)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewDetails(session);
          }
        }}
        title={`Xem chi tiết phiên: ${session.title}`}
        aria-label={`Xem chi tiết phiên: ${session.title}`}
        className="group/thumb relative aspect-video sm:w-52 sm:h-28 shrink-0 rounded-xl bg-stone-900 overflow-hidden select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A11C27] focus-visible:ring-offset-2"
      >
        <img
          src={imageError ? '/assets/studio/livestream-citadel-sunset.jpg' : enriched.resolvedThumbnailUrl}
          alt={session.title}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-105 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay hint with eye icon */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 pointer-events-none">
          <div className="h-8 w-8 rounded-full bg-white/95 text-[#A11C27] flex items-center justify-center shadow-md transition-transform duration-200 group-hover/thumb:scale-110">
            <Eye className="h-4 w-4" />
          </div>
        </div>

        {/* Status Pill Badge (Top Left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-20 pointer-events-none">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#A11C27] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              <span>TRỰC TIẾP</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1C1615] shadow-2xs border border-white/80">
              Đã kết thúc
            </span>
          )}

          {session.isExclusive && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/95 px-2 py-0.5 text-[9px] font-semibold text-white shadow-xs">
              <Crown className="h-2.5 w-2.5" />
              <span>VIP</span>
            </span>
          )}
        </div>

        {/* Duration Badge (Bottom Right) */}
        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-mono text-white pointer-events-none z-20">
          <Clock className="h-2.5 w-2.5 text-stone-300" />
          <span>{enriched.durationLabel}</span>
        </div>
      </div>

      {/* Middle: Content info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <h3
          role="button"
          tabIndex={0}
          onClick={() => onViewDetails(session)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onViewDetails(session);
            }
          }}
          title={session.title}
          className="font-serif text-sm sm:text-base font-bold text-[#1C1615] line-clamp-1 hover:text-[#A11C27] cursor-pointer transition-colors break-words focus:outline-none focus-visible:text-[#A11C27] focus-visible:underline"
        >
          {session.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-[#5C524F] min-w-0">
          {session.channelAvatarUrl ? (
            <img
              src={session.channelAvatarUrl}
              alt={safeChannelName}
              className="h-4 w-4 rounded-full object-cover border border-[#EBE4D8] shrink-0"
            />
          ) : (
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FDF2F2] text-[9px] font-bold text-[#A11C27]">
              {initialLetter}
            </div>
          )}
          <span className="truncate font-medium text-[#1C1615]/85">
            {safeChannelName}
          </span>
        </div>

        <p className="text-xs text-[#786F6B] line-clamp-1 break-words">
          {session.description || 'Buổi đàm đạo và chia sẻ kiến thức lịch sử trực tiếp trên Sử Ký Studio.'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {enriched.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-[#5C524F]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Stats & Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 sm:border-l sm:border-[#EBE4D8] sm:pl-4">
        {/* Engagement counts */}
        <div className="flex items-center gap-3 text-[11px] text-[#786F6B]">
          <span className="flex items-center gap-1" title="Thời gian">
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
            <span>{formatLivestreamDateTime(session.startedAt)}</span>
          </span>
          <span className="flex items-center gap-1" title="Lượt xem">
            <Eye className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono tabular-nums">{displayViews}</span>
          </span>
          {enriched.likesCount > 0 && (
            <span className="flex items-center gap-1" title="Lượt thích">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-mono tabular-nums">{enriched.likesCount}</span>
            </span>
          )}
          {enriched.commentsCount > 0 && (
            <span className="flex items-center gap-1" title="Bình luận">
              <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-mono tabular-nums">{enriched.commentsCount}</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(session)}
            className="h-8 px-3 text-xs bg-white hover:bg-stone-50 text-[#1C1615] border-[#E5E0D8] rounded-lg"
          >
            Chi tiết
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[#786F6B] hover:text-[#1C1615] rounded-lg"
                aria-label="Tùy chọn khác"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border-[#EBE4D8]">
              <DropdownMenuItem
                onClick={() => onEnterStudio(session)}
                className="gap-2 cursor-pointer text-xs"
              >
                <Tv className="h-3.5 w-3.5 text-[#A11C27]" />
                <span>Vào phòng phát sóng</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onViewDetails(session)}
                className="gap-2 cursor-pointer text-xs"
              >
                <Info className="h-3.5 w-3.5 text-[#5C524F]" />
                <span>Xem chi tiết</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="gap-2 cursor-pointer text-xs"
              >
                {hasCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#5C524F]" />
                )}
                <span>{hasCopied ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}</span>
              </DropdownMenuItem>
              {isLive && isOwner && (
                <DropdownMenuItem
                  onClick={() => onEndSession(session)}
                  className="gap-2 cursor-pointer text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  <span>Kết thúc phát sóng</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
};
