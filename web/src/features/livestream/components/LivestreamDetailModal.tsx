import React from 'react';
import {
  Radio,
  Crown,
  Eye,
  Calendar,
  Clock,
  Layers,
  User,
  Hash,
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
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={isLive ? 'error' : 'default'}
                  className={isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-surface-subtle text-muted'}
                >
                  {isLive ? '• TRỰC TIẾP (LIVE)' : 'ĐÃ KẾT THÚC (ENDED)'}
                </Badge>
                {session.isExclusive && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 gap-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    <span>Hội viên VIP</span>
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-serif font-bold text-ink pt-1">
                {session.title}
              </DialogTitle>
              <DialogDescription>
                Kênh phát sóng: <span className="font-semibold text-ink">{session.channelName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Cover / Thumbnail banner */}
          {session.thumbnailUrl ? (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-surface-subtle">
              <img
                src={session.thumbnailUrl}
                alt={session.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-gradient-to-br from-surface-subtle via-canvas to-surface-subtle flex flex-col items-center justify-center p-6 text-center">
              <Radio className={`h-12 w-12 ${isLive ? 'text-accent animate-pulse' : 'text-muted'}`} />
              <p className="mt-2 text-xs font-semibold text-ink">{session.title}</p>
              <p className="text-[11px] text-muted">{session.channelName}</p>
            </div>
          )}

          {/* Description */}
          {session.description && (
            <div className="rounded-lg border border-border bg-surface-subtle/40 p-3 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Mô tả nội dung
              </span>
              <p className="text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">
                {session.description}
              </p>
            </div>
          )}

          {/* Technical Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Hash className="h-3.5 w-3.5" /> Mã phiên live
              </span>
              <p className="mt-1 font-mono text-xs font-bold text-ink">#{session.id}</p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Eye className="h-3.5 w-3.5" /> Lượt xem trực tiếp
              </span>
              <p className="mt-1 font-bold text-xs text-ink">
                {formatLivestreamViewerCount(session.viewerCount)} thính giả
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <User className="h-3.5 w-3.5" /> Chủ phòng (Creator)
              </span>
              <p className="mt-1 font-semibold text-xs text-ink truncate">{session.creatorName}</p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Calendar className="h-3.5 w-3.5" /> Bắt đầu lúc
              </span>
              <p className="mt-1 font-medium text-xs text-ink">
                {formatDateTime(session.startedAt)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Clock className="h-3.5 w-3.5" /> Kết thúc lúc
              </span>
              <p className="mt-1 font-medium text-xs text-ink">
                {session.endedAt ? formatDateTime(session.endedAt) : (isLive ? 'Đang phát sóng' : '—')}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-subtle/30 p-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Layers className="h-3.5 w-3.5" /> Kênh Agora RTC
              </span>
              <p className="mt-1 font-mono text-[11px] font-semibold text-accent truncate" title={session.agoraChannelName}>
                {session.agoraChannelName}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {isLive && onEnterStudio && (
            <Button
              type="button"
              className="gap-2 bg-accent hover:bg-accent-hover text-canvas"
              onClick={() => onEnterStudio(session)}
            >
              <Tv className="h-4 w-4" />
              <span>Vào Studio phát sóng</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
