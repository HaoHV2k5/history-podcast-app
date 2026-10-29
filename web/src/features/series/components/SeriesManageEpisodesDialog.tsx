import React from 'react';
import {
  Film,
  Plus,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  Check,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SeriesDetail, SeriesItemDetail } from '@/types/series';
import { CreatorVideoItem } from '@/types/creatorContent';
import { formatDuration, getContentStatusBadge } from '@/utils/formatters';
import { canMoveUp, canMoveDown } from '../seriesLogic';
import { PlayingTrack } from './SeriesAudioPlayerBar';
import { cn } from '@/utils/cn';

interface SeriesManageEpisodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesDetail?: SeriesDetail;
  isLoadingDetail: boolean;
  creatorVideos: CreatorVideoItem[];
  addVideoId: string;
  onAddVideoIdChange: (val: string) => void;
  onAddEpisode: (e: React.FormEvent) => void;
  onMoveEpisode: (fromIdx: number, toIdx: number) => void;
  onRemoveEpisode: (contentId: number) => void;
  isAdding: boolean;
  isReordering: boolean;
  isRemoving: boolean;
  reorderError: string | null;
  reorderSuccessMsg: string | null;
  // Audio Playback Props
  currentTrack?: PlayingTrack | null;
  isPlaying?: boolean;
  onPlayEpisode?: (item: SeriesItemDetail, series: SeriesDetail) => void;
  onTogglePlay?: () => void;
}

export const SeriesManageEpisodesDialog: React.FC<SeriesManageEpisodesDialogProps> = ({
  open,
  onOpenChange,
  seriesDetail,
  isLoadingDetail,
  creatorVideos,
  addVideoId,
  onAddVideoIdChange,
  onAddEpisode,
  onMoveEpisode,
  onRemoveEpisode,
  isAdding,
  isReordering,
  isRemoving,
  reorderError,
  reorderSuccessMsg,
  currentTrack,
  isPlaying = false,
  onPlayEpisode,
  onTogglePlay,
}) => {
  const hasEpisodes = Boolean(seriesDetail?.items && seriesDetail.items.length > 0);
  const isSeriesPlaying = Boolean(
    isPlaying &&
    currentTrack?.seriesId === seriesDetail?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pr-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF2F2] text-[#A31D24] border border-[#F8D7DA] shrink-0">
              <Film className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-serif text-lg font-bold text-[#1C1615] truncate">
                {seriesDetail?.title || 'Tuyển tập tác phẩm'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#786C68] mt-0.5">
                {seriesDetail?.items?.length || 0} tập • Quản lý thứ tự và phát nghe các tập
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Feedback Banners */}
        {reorderError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{reorderError}</span>
          </div>
        )}
        {reorderSuccessMsg && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}

        {/* Add episode form */}
        <form onSubmit={onAddEpisode} className="flex items-center gap-2 pt-2 border-t border-[#EBE4D8] w-full">
          <select
            value={addVideoId}
            onChange={(e) => onAddVideoIdChange(e.target.value)}
            className="flex-1 min-w-0 rounded-xl border border-[#EBE4D8] bg-white px-3 py-2 text-xs text-[#1C1615] focus:outline-none focus:ring-1 focus:ring-[#A31D24] truncate"
          >
            <option value="">-- Chọn video/podcast để thêm vào tuyển tập --</option>
            {creatorVideos.map((v) => (
              <option key={v.contentId} value={v.contentId}>
                {v.title} — {getContentStatusBadge(v.status).label}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            size="sm"
            disabled={!addVideoId || isAdding || isReordering}
            className="gap-1.5 bg-[#A31D24] hover:bg-[#8B181E] text-white rounded-xl shadow-xs cursor-pointer shrink-0 whitespace-nowrap px-3.5 h-9"
            title="Thêm podcast/video đã chọn vào tuyển tập này"
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>Thêm tập</span>
          </Button>
        </form>

        {/* Episode List Section Header & Quick Play Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EBE4D8]/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1C1615]">
              Danh sách tập ({seriesDetail?.items?.length || 0})
            </span>
            {isReordering && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-[#A31D24] bg-[#FDF2F2] px-2 py-0.5 rounded-full border border-red-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang lưu thứ tự...
              </span>
            )}
          </div>

          {hasEpisodes && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (isSeriesPlaying) {
                  onTogglePlay?.();
                } else if (seriesDetail?.items?.[0]) {
                  onPlayEpisode?.(seriesDetail.items[0], seriesDetail);
                }
              }}
              className={cn(
                'gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95',
                isSeriesPlaying
                  ? 'bg-[#FDF2F2] border-[#F8D7DA] text-[#A31D24] hover:bg-[#FCE8E8]'
                  : 'bg-white border-[#EBE4D8] text-[#1C1615] hover:bg-[#FAF8F5] hover:border-stone-400'
              )}
              title={isSeriesPlaying ? 'Tạm dừng phát tuyển tập này' : 'Phát tuyển tập này từ tập đầu tiên'}
            >
              {isSeriesPlaying ? (
                <>
                  <Pause className="h-3 w-3 fill-current text-[#A31D24]" />
                  <span className="text-[#A31D24]">Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current text-[#A31D24] ml-0.5" />
                  <span>Phát tất cả</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Episodes list (Dynamic Content Hugging Height) */}
        <div className="overflow-y-auto max-h-[50vh] space-y-2 py-1 pr-1">
          {isLoadingDetail ? (
            <div className="py-8 text-center text-xs text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#A31D24]" />
              Đang tải danh sách tập...
            </div>
          ) : !seriesDetail?.items || seriesDetail.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EBE4D8] bg-[#FAF8F5] p-8 text-center">
              <Film className="mx-auto h-8 w-8 text-stone-400 mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#1C1615]">Tuyển tập này chưa có tập nào</p>
              <p className="text-[11px] text-[#786C68] mt-1">
                Chọn podcast hoặc video từ danh sách phía trên để thêm vào tuyển tập này.
              </p>
            </div>
          ) : (
            seriesDetail.items.map((item, idx) => {
              const isTrackActive = currentTrack?.contentId === item.contentId;
              const isTrackPlaying = isTrackActive && isPlaying;

              const handleItemPlay = () => {
                if (isTrackActive) {
                  onTogglePlay?.();
                } else {
                  onPlayEpisode?.(item, seriesDetail);
                }
              };

              return (
                <div
                  key={item.id}
                  className={cn(
                    'group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-150 shadow-2xs',
                    isTrackActive
                      ? 'border-[#A31D24]/50 bg-[#FDF2F2]/40 shadow-xs ring-1 ring-[#A31D24]/20'
                      : 'border-[#EBE4D8] bg-white hover:border-stone-300'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Index Badge */}
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F2EB] font-mono text-xs font-bold text-[#A31D24] shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Direct Play/Pause Button on each Episode */}
                    <button
                      type="button"
                      onClick={handleItemPlay}
                      className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0',
                        isTrackPlaying
                          ? 'bg-[#A31D24] text-white hover:bg-[#8B181E] shadow-sm'
                          : isTrackActive
                          ? 'bg-stone-800 text-white hover:bg-stone-900'
                          : 'bg-[#FDF2F2] text-[#A31D24] hover:bg-[#A31D24] hover:text-white border border-[#F8D7DA]'
                      )}
                      title={isTrackPlaying ? `Tạm dừng phát: ${item.title}` : `Phát nghe tập này: ${item.title}`}
                      aria-label={isTrackPlaying ? `Tạm dừng ${item.title}` : `Phát ${item.title}`}
                    >
                      {isTrackPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={handleItemPlay}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleItemPlay();
                            }
                          }}
                          className={cn(
                            'text-xs font-semibold truncate cursor-pointer transition-colors hover:underline block',
                            isTrackActive ? 'text-[#A31D24] font-bold' : 'text-[#1C1615] hover:text-[#A31D24]'
                          )}
                          title={`Nhấp để phát nghe: ${item.title}`}
                        >
                          {item.title}
                        </h4>

                        {/* Active Playing Badge */}
                        {isTrackActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#A31D24] bg-white px-2 py-0.5 rounded-full border border-red-200 shrink-0 shadow-2xs">
                            <Volume2 className={cn('h-3 w-3', isTrackPlaying && 'animate-pulse')} />
                            <span>{isTrackPlaying ? 'Đang phát' : 'Tạm dừng'}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#786C68] mt-0.5">
                        <span>Thời lượng: {formatDuration(item.durationSeconds)}</span>
                        {item.isExclusive && (
                          <Badge
                            variant="default"
                            className="text-[9px] bg-amber-600 text-white px-1.5 py-0"
                          >
                            VIP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Move Up, Move Down, Remove */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canMoveUp(idx) || isReordering}
                    onClick={() => onMoveEpisode(idx, idx - 1)}
                    className="h-8 w-8 p-0 text-stone-500 hover:text-[#A31D24] disabled:opacity-25"
                    title="Di chuyển lên trên"
                    aria-label={`Di chuyển tập ${item.title} lên trên`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!canMoveDown(idx, seriesDetail.items.length) || isReordering}
                    onClick={() => onMoveEpisode(idx, idx + 1)}
                    className="h-8 w-8 p-0 text-stone-500 hover:text-[#A31D24] disabled:opacity-25"
                    title="Di chuyển xuống dưới"
                    aria-label={`Di chuyển tập ${item.title} xuống dưới`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isRemoving || isReordering}
                    onClick={() => onRemoveEpisode(item.contentId)}
                    className="h-8 w-8 p-0 text-stone-400 hover:text-red-600 shrink-0"
                    title="Gỡ khỏi tuyển tập"
                    aria-label={`Gỡ tập ${item.title} khỏi tuyển tập`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-[#EBE4D8]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-[#EBE4D8]"
            title="Đóng cửa sổ quản lý danh sách tập"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
