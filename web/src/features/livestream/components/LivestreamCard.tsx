import React, { useState } from 'react';
import {
  Radio,
  Eye,
  Calendar,
  Clock,
  Tv,
  StopCircle,
  Info,
  MoreVertical,
  Heart,
  MessageSquare,
  Copy,
  Crown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { LivestreamSession } from '@/types/livestream';
import { canManageLivestream, formatLivestreamViewerCount } from '../livestreamLogic';
import {
  enrichLivestreamSession,
  EnrichedLivestreamSession,
} from '../canonicalLivestreamData';

interface LivestreamCardProps {
  session: LivestreamSession;
  currentUserId?: number | null;
  onViewDetails: (session: LivestreamSession) => void;
  onEnterStudio: (session: LivestreamSession) => void;
  onEndSession: (session: LivestreamSession) => void;
}

export function formatLivestreamDateTime(dateStr?: string | null): string {
  if (!dateStr) return '20/10/2026 11:24';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export const LivestreamCard: React.FC<LivestreamCardProps> = ({
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
      className="group relative flex flex-col rounded-2xl border border-[#EBE4D8] bg-white shadow-xs hover:shadow-md hover:border-[#D6CCC2] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* 1. Thumbnail Header Area (16:9 ratio) - Clickable with hover state */}
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
        className="group/thumb relative aspect-video w-full bg-stone-900 overflow-hidden select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A11C27] focus-visible:ring-offset-2"
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
          <div className="h-10 w-10 rounded-full bg-white/95 text-[#A11C27] flex items-center justify-center shadow-md transition-transform duration-200 group-hover/thumb:scale-110">
            <Eye className="h-5 w-5" />
          </div>
        </div>

        {/* Status Pill Badge (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-20 pointer-events-none">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A11C27] px-3 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>TRỰC TIẾP</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-0.5 text-[11px] font-semibold text-[#1C1615] shadow-xs backdrop-blur-xs border border-white/80">
              Đã kết thúc
            </span>
          )}

          {session.isExclusive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-xs">
              <Crown className="h-3 w-3" />
              <span>HỘI VIÊN VIP</span>
            </span>
          )}
        </div>

        {/* Duration / Clock Badge (Bottom Right) */}
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/75 px-2.5 py-0.5 text-[11px] font-mono font-medium text-white backdrop-blur-xs z-20 pointer-events-none">
          <Clock className="h-3 w-3 text-stone-300" />
          <span>{enriched.durationLabel}</span>
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-5 space-y-3">
        {/* Title - Clickable with keyboard focus */}
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
          className="font-serif text-sm sm:text-base font-bold text-[#1C1615] line-clamp-2 leading-snug cursor-pointer group-hover:text-[#A11C27] transition-colors break-words focus:outline-none focus-visible:text-[#A11C27] focus-visible:underline"
        >
          {session.title}
        </h3>

        {/* Channel / Host Identity */}
        <div className="flex items-center gap-2 text-xs text-[#5C524F] min-w-0">
          {session.channelAvatarUrl ? (
            <img
              src={session.channelAvatarUrl}
              alt={safeChannelName}
              className="h-5 w-5 rounded-full object-cover border border-[#EBE4D8] shrink-0"
            />
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDF2F2] text-[10px] font-bold text-[#A11C27] border border-[#F8D7DA]">
              {initialLetter}
            </div>
          )}
          <span className="truncate font-medium text-[#1C1615]/85">
            {safeChannelName}
          </span>
        </div>

        {/* Description Snippet */}
        <p className="text-xs text-[#786F6B] line-clamp-2 leading-relaxed min-h-[36px] break-words">
          {session.description || 'Buổi đàm đạo và chia sẻ kiến thức lịch sử trực tiếp trên Sử Ký Studio.'}
        </p>

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {enriched.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-md bg-stone-100/80 px-2 py-0.5 text-[11px] font-medium text-[#5C524F] border border-[#EBE4D8]/80"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 3. Footer Metadata & Actions */}
        <div className="mt-auto pt-4 border-t border-[#EBE4D8] flex items-center justify-between gap-2 text-xs text-[#786F6B]">
          {/* Metadata counts (Date, Views, Likes, Comments) */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {/* Started Date */}
            <span
              className="flex items-center gap-1 text-[#786F6B]"
              title="Thời gian phát sóng"
            >
              <Calendar className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>{formatLivestreamDateTime(session.startedAt)}</span>
            </span>

            {/* Views count */}
            <span
              className="flex items-center gap-1 text-[#786F6B]"
              title="Tổng lượt xem"
            >
              <Eye className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="font-mono tabular-nums">{displayViews}</span>
            </span>

            {/* Likes count - Chỉ hiển thị khi có dữ liệu thật */}
            {enriched.likesCount > 0 && (
              <span
                className="flex items-center gap-1 text-[#786F6B]"
                title="Lượt yêu thích"
              >
                <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span className="font-mono tabular-nums">{enriched.likesCount}</span>
              </span>
            )}

            {/* Comments count - Chỉ hiển thị khi có dữ liệu thật */}
            {enriched.commentsCount > 0 && (
              <span
                className="flex items-center gap-1 text-[#786F6B]"
                title="Bình luận trao đổi"
              >
                <MessageSquare className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="font-mono tabular-nums">{enriched.commentsCount}</span>
              </span>
            )}
          </div>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(session)}
              className="h-8 px-3 text-xs bg-white hover:bg-stone-50 text-[#1C1615] border-[#E5E0D8] shadow-2xs font-medium rounded-lg"
              title="Xem thông tin chi tiết buổi phát"
            >
              Chi tiết
            </Button>

            {/* More Menu Dropdown */}
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
              <DropdownMenuContent align="end" className="w-48 bg-white border-[#EBE4D8] shadow-md">
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
      </div>
    </article>
  );
};
