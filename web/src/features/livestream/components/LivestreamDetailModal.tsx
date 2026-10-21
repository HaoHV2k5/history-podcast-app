import React from 'react';
import {
  Radio,
  Crown,
  Eye,
  Calendar,
  Clock,
  User,
  Tv,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LivestreamSession } from '@/types/livestream';
import { formatDateTime } from '@/utils/formatters';
import { formatLivestreamViewerCount } from '../livestreamLogic';

interface LivestreamDetailModalProps {
  session: LivestreamSession | null;
  isOpen: boolean;
  onClose: () => void;
  onEnterStudio?: (session: LivestreamSession) => void;
}

export const LivestreamDetailModal: React.FC<LivestreamDetailModalProps> = ({
  session,
  isOpen,
  onClose,
  onEnterStudio,
}) => {
  if (!session) return null;

  const isLive = session.status === 'LIVE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-lg"
        className="max-h-[88vh] flex flex-col p-4 sm:p-5 gap-3 overflow-hidden"
      >
        <DialogHeader className="shrink-0 pr-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={isLive ? 'error' : 'default'}
                className={isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-surface-subtle text-muted'}
              >
                {isLive ? '• TRỰC TIẾP' : 'ĐÃ KẾT THÚC'}
              </Badge>
              {session.isExclusive && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 gap-1">
                  <Crown className="h-3 w-3 text-amber-500" />
                  <span>Hội viên VIP</span>
                </Badge>
              )}
            </div>
            <DialogTitle className="text-base font-serif font-bold text-ink pt-0.5">
              {session.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kênh phát sóng: <span className="font-semibold text-ink">{session.channelName}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs min-h-0">
          {/* Cover / Thumbnail banner */}
          {session.thumbnailUrl ? (
            <div className="relative aspect-video max-h-48 w-full rounded-lg overflow-hidden border border-border bg-surface-subtle">
              <img
                src={session.thumbnailUrl}
                alt={session.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="relative h-36 w-full rounded-lg overflow-hidden border border-border bg-gradient-to-br from-surface-subtle via-canvas to-surface-subtle flex flex-col items-center justify-center p-4 text-center">
              <Radio className={`h-9 w-9 ${isLive ? 'text-accent animate-pulse' : 'text-muted'}`} />
              <p className="mt-1.5 text-xs font-semibold text-ink line-clamp-1">{session.title}</p>
              <p className="text-[11px] text-muted">{session.channelName}</p>
            </div>
          )}

          {/* Description */}
          {session.description && (
            <div className="rounded-lg border border-border bg-surface-subtle/40 p-2.5 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Mô tả nội dung
              </span>
              <p className="text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">
                {session.description}
              </p>
            </div>
          )}

          {/* User-friendly Session Info Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <User className="h-3.5 w-3.5" /> Người phát sóng
              </span>
              <p className="mt-1 font-semibold text-xs text-ink truncate">
                {session.creatorName || session.channelName}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Eye className="h-3.5 w-3.5" /> Thính giả đang xem
              </span>
              <p className="mt-1 font-bold text-xs text-ink">
                {isLive
                  ? `${formatLivestreamViewerCount(session.viewerCount)} đang xem`
                  : 'Phiên đã kết thúc'}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Calendar className="h-3.5 w-3.5" /> Thời gian tạo
              </span>
              <p className="mt-1 font-medium text-xs text-ink">
                {formatDateTime(session.startedAt)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Clock className="h-3.5 w-3.5" /> Thời gian kết thúc
              </span>
              <p className="mt-1 font-medium text-xs text-ink">
                {session.endedAt ? formatDateTime(session.endedAt) : (isLive ? 'Đang diễn ra' : '—')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2.5 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          {isLive && onEnterStudio && (
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-accent hover:bg-accent-hover text-canvas"
              onClick={() => onEnterStudio(session)}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Vào Studio phát sóng</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
