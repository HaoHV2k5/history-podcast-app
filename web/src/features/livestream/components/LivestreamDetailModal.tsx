import React from 'react';
import {
  Radio,
  Crown,
  Eye,
  Calendar,
  Clock,
  User,
  Tv,
  Heart,
  MessageSquare,
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
import { LivestreamSession } from '@/types/livestream';
import { formatDateTime } from '@/utils/formatters';
import { formatLivestreamViewerCount } from '../livestreamLogic';
import {
  enrichLivestreamSession,
  EnrichedLivestreamSession,
} from '../canonicalLivestreamData';

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

  const enriched: EnrichedLivestreamSession = enrichLivestreamSession(session);
  const isLive = session.status === 'LIVE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-lg"
        className="max-h-[90vh] flex flex-col p-5 sm:p-6 gap-4 overflow-hidden rounded-2xl border-[#EBE4D8] bg-white shadow-xl"
      >
        <DialogHeader className="shrink-0 pr-6 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A11C27] px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  <span>TRỰC TIẾP</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-0.5 text-[11px] font-semibold text-[#1C1615] border border-[#EBE4D8]">
                  ĐÃ KẾT THÚC
                </span>
              )}

              {session.isExclusive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  <Crown className="h-3 w-3" />
                  <span>Hội viên VIP</span>
                </span>
              )}
            </div>

            <DialogTitle className="text-lg font-serif font-bold text-[#1C1615] pt-0.5 leading-snug break-words">
              {session.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C524F] break-words">
              Kênh phát sóng: <span className="font-semibold text-[#1C1615]">{session.channelName}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs min-h-0">
          {/* Cover / Thumbnail banner */}
          <div className="relative aspect-video max-h-52 w-full rounded-xl overflow-hidden border border-[#EBE4D8] bg-stone-900">
            <img
              src={enriched.resolvedThumbnailUrl}
              alt={session.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[11px] font-mono text-white">
              <Clock className="h-3 w-3 text-stone-300" />
              <span>{enriched.durationLabel}</span>
            </div>
          </div>

          {/* Description */}
          {session.description && (
            <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF7F2] p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#786F6B]">
                Mô tả nội dung
              </span>
              <p className="text-xs text-[#1C1615] whitespace-pre-wrap leading-relaxed">
                {session.description}
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {enriched.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-[#5C524F] border border-[#EBE4D8]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#EBE4D8] bg-white p-3 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] text-[#786F6B]">
                <User className="h-3.5 w-3.5" /> Người phát sóng
              </span>
              <p className="mt-1 font-semibold text-xs text-[#1C1615] truncate">
                {session.creatorName || session.channelName}
              </p>
            </div>

            <div className="rounded-xl border border-[#EBE4D8] bg-white p-3 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] text-[#786F6B]">
                <Eye className="h-3.5 w-3.5" /> Lượt xem
              </span>
              <p className="mt-1 font-bold text-xs text-[#1C1615]">
                {formatLivestreamViewerCount(session.viewerCount ?? 0)}
              </p>
            </div>

            <div className="rounded-xl border border-[#EBE4D8] bg-white p-3 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] text-[#786F6B]">
                <Calendar className="h-3.5 w-3.5" /> Thời gian bắt đầu
              </span>
              <p className="mt-1 font-medium text-xs text-[#1C1615]">
                {formatDateTime(session.startedAt)}
              </p>
            </div>

            <div className="rounded-xl border border-[#EBE4D8] bg-white p-3 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] text-[#786F6B]">
                <Clock className="h-3.5 w-3.5" /> Thời gian kết thúc
              </span>
              <p className="mt-1 font-medium text-xs text-[#1C1615]">
                {session.endedAt ? formatDateTime(session.endedAt) : (isLive ? 'Đang diễn ra' : '—')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2.5 pt-3 shrink-0 border-t border-[#EBE4D8]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-lg border-[#E5E0D8]"
          >
            Đóng
          </Button>
          {onEnterStudio && (
            <Button
              type="button"
              size="sm"
              className="gap-1.5 text-xs h-9 px-4 bg-[#A11C27] hover:bg-[#85151E] text-white font-semibold rounded-lg shadow-xs"
              onClick={() => onEnterStudio(session)}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>{isLive ? 'Vào Studio phát sóng' : 'Vào xem lại phòng'}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
