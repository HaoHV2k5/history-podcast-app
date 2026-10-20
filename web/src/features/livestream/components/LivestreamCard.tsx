import React from 'react';
import {
  Radio,
  Crown,
  Eye,
  Calendar,
  Clock,
  Tv,
  StopCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivestreamSession } from '@/types/livestream';
import { formatDateTime } from '@/utils/formatters';
import {
  formatLivestreamViewerCount,
  canManageLivestream,
} from '../livestreamLogic';

interface LivestreamCardProps {
  session: LivestreamSession;
  currentUserId: number | null | undefined;
  onViewDetails: (session: LivestreamSession) => void;
  onEnterStudio: (session: LivestreamSession) => void;
  onEndSession: (session: LivestreamSession) => void;
}

export const LivestreamCard: React.FC<LivestreamCardProps> = ({
  session,
  currentUserId,
  onViewDetails,
  onEnterStudio,
  onEndSession,
}) => {
  const isLive = session.status === 'LIVE';
  const isOwner = canManageLivestream(session, currentUserId);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Thumbnail / Header Area */}
      <div className="relative aspect-video w-full bg-surface-subtle overflow-hidden">
        {session.thumbnailUrl ? (
          <img
            src={session.thumbnailUrl}
            alt={session.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface-subtle via-canvas to-surface-subtle flex flex-col items-center justify-center p-4 text-center">
            <Radio className={`h-10 w-10 ${isLive ? 'text-accent animate-pulse' : 'text-muted'}`} />
            <span className="mt-2 text-xs font-semibold text-ink line-clamp-1">{session.channelName}</span>
          </div>
        )}

        {/* Status & VIP Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>TRỰC TIẾP</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-ink/75 px-2.5 py-0.5 text-[10px] font-medium text-canvas backdrop-blur-xs">
              ĐÃ KẾT THÚC
            </span>
          )}

          {session.isExclusive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-xs">
              <Crown className="h-3 w-3" />
              <span>HỘI VIÊN VIP</span>
            </span>
          )}
        </div>

        {/* Viewer Count Badge Overlay (Bottom Right) */}
        {isLive && (
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
            <Eye className="h-3.5 w-3.5 text-rose-400" />
            <span>{formatLivestreamViewerCount(session.viewerCount)}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-4 space-y-3">
        {/* Title */}
        <h3
          className="font-serif text-sm font-bold text-ink line-clamp-2 leading-snug cursor-pointer hover:text-accent transition-colors"
          onClick={() => onViewDetails(session)}
          title={session.title}
        >
          {session.title}
        </h3>

        {/* Channel info */}
        <div className="flex items-center gap-2 text-xs text-muted">
          {session.channelAvatarUrl ? (
            <img
              src={session.channelAvatarUrl}
              alt={session.channelName}
              className="h-5 w-5 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-subtle text-[10px] font-bold text-ink border border-border">
              {session.channelName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate font-medium text-ink/80">{session.channelName}</span>
        </div>

        {/* Description Snippet */}
        {session.description ? (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
            {session.description}
          </p>
        ) : (
          <p className="text-xs text-muted/60 italic">Không có mô tả chi tiết</p>
        )}

        {/* Timestamps info */}
        <div className="mt-auto pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateTime(session.startedAt)}
          </span>
          {session.endedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(session.endedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-surface-subtle/30 border-t border-border flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 h-8 px-2.5"
          onClick={() => onViewDetails(session)}
        >
          <Info className="h-3.5 w-3.5" />
          <span>Chi tiết</span>
        </Button>

        <div className="flex items-center gap-2">
          {isLive && (
            <>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  onClick={() => onEndSession(session)}
                  title="Kết thúc buổi phát sóng trực tiếp"
                >
                  <StopCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Kết thúc</span>
                </Button>
              )}

              <Button
                size="sm"
                className="text-xs gap-1.5 h-8 px-3 bg-accent hover:bg-accent-hover text-canvas"
                onClick={() => onEnterStudio(session)}
              >
                <Tv className="h-3.5 w-3.5" />
                <span>Vào Studio</span>
              </Button>
            </>
          )}

          {!isLive && (
            <span className="text-[11px] font-medium text-muted px-2 py-1">
              Phiên đã lưu trữ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
