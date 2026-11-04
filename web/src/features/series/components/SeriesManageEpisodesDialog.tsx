import React, { useState, useMemo, useEffect } from 'react';
import {
  Film,
  Plus,
  Loader2,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  Check,
  Play,
  Pause,
  Volume2,
  Search,
  ListVideo,
  FolderPlus,
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
import { formatDuration, formatDate, formatRelativeTime, getContentStatusBadge } from '@/utils/formatters';
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
  onAddEpisodeById?: (contentId: number) => void;
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

type ModeTab = 'episodes' | 'add';
type FilterFilterMode = 'unadded' | 'all' | 'added';

const normalizeText = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export const SeriesManageEpisodesDialog: React.FC<SeriesManageEpisodesDialogProps> = ({
  open,
  onOpenChange,
  seriesDetail,
  isLoadingDetail,
  creatorVideos,
  addVideoId: _addVideoId,
  onAddVideoIdChange,
  onAddEpisode,
  onAddEpisodeById,
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
  const [activeTab, setActiveTab] = useState<ModeTab>('episodes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterFilterMode>('unadded');
  const [pendingAddId, setPendingAddId] = useState<number | null>(null);

  // Clear pending add ID when isAdding turns false
  useEffect(() => {
    if (!isAdding) {
      setPendingAddId(null);
    }
  }, [isAdding]);

  // Reset tab and filters when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setFilterMode('unadded');
      // If series has no episodes, open directly to add tab for convenience
      if (seriesDetail && (!seriesDetail.items || seriesDetail.items.length === 0)) {
        setActiveTab('add');
      } else {
        setActiveTab('episodes');
      }
    }
  }, [open, seriesDetail?.id]);

  const itemsCount = seriesDetail?.items?.length || 0;
  const hasEpisodes = itemsCount > 0;
  const isSeriesPlaying = Boolean(
    isPlaying &&
    currentTrack?.seriesId === seriesDetail?.id
  );

  // Map of contentId -> episode order number (#1, #2...)
  const existingContentIdMap = useMemo(() => {
    const map = new Map<number, number>();
    if (seriesDetail?.items) {
      seriesDetail.items.forEach((item, idx) => {
        map.set(item.contentId, idx + 1);
      });
    }
    return map;
  }, [seriesDetail?.items]);

  // Total series duration in seconds
  const totalDurationSeconds = useMemo(() => {
    return seriesDetail?.items?.reduce((acc, it) => acc + (it.durationSeconds || 0), 0) || 0;
  }, [seriesDetail?.items]);

  // Unadded videos count
  const unaddedVideos = useMemo(() => {
    return creatorVideos.filter((v) => !existingContentIdMap.has(v.contentId));
  }, [creatorVideos, existingContentIdMap]);

  const unaddedCount = unaddedVideos.length;
  const totalCreatorVideos = creatorVideos.length;
  const inSeriesCount = totalCreatorVideos - unaddedCount;

  // Filtered creator videos for the library tab
  const filteredCreatorVideos = useMemo(() => {
    let list = creatorVideos;
    if (filterMode === 'unadded') {
      list = list.filter((v) => !existingContentIdMap.has(v.contentId));
    } else if (filterMode === 'added') {
      list = list.filter((v) => existingContentIdMap.has(v.contentId));
    }

    if (!searchQuery.trim()) return list;

    const queryNorm = normalizeText(searchQuery.trim());
    return list.filter((v) => {
      const titleNorm = normalizeText(v.title || '');
      const descNorm = normalizeText(v.description || '');
      return titleNorm.includes(queryNorm) || descNorm.includes(queryNorm);
    });
  }, [creatorVideos, filterMode, searchQuery, existingContentIdMap]);

  const handleDirectAdd = (contentId: number) => {
    setPendingAddId(contentId);
    if (onAddEpisodeById) {
      onAddEpisodeById(contentId);
    } else {
      onAddVideoIdChange(String(contentId));
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onAddEpisode(syntheticEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-6 overflow-hidden">
        {/* Header Section */}
        <DialogHeader className="pr-8 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FBF2EE] text-[#8B2635] border border-[#F0DDD8] shrink-0 overflow-hidden">
              {seriesDetail?.coverUrl ? (
                <img
                  src={seriesDetail.coverUrl}
                  alt={seriesDetail.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Film className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-serif text-lg font-bold text-[#1C1615] truncate">
                {seriesDetail?.title || 'Tuyển tập tác phẩm'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#786C68] mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[#1C1615]">{itemsCount} tập</span>
                {hasEpisodes && (
                  <>
                    <span>•</span>
                    <span>Tổng thời lượng: <strong className="text-[#1C1615]">{formatDuration(totalDurationSeconds)}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Quản lý thứ tự phát & thêm tập từ thư viện</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Feedback Banners */}
        {reorderError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 mt-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{reorderError}</span>
          </div>
        )}
        {reorderSuccessMsg && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 mt-2 shrink-0">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}

        {/* Segmented Controller Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E7E2D9] pt-2 pb-2.5 mt-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('episodes')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer',
              activeTab === 'episodes'
                ? 'bg-[#8B2635] text-white'
                : 'bg-[#FAF8F5] text-[#786C68] hover:bg-[#F4EFEA] hover:text-[#1C1615]'
            )}
            title="Xem và sắp xếp thứ tự các tập hiện có trong tuyển tập"
          >
            <ListVideo className="h-3.5 w-3.5" />
            <span>Danh sách tập</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                activeTab === 'episodes' ? 'bg-white/20 text-white' : 'bg-[#E7E2D9] text-[#1C1615]'
              )}
            >
              {itemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer',
              activeTab === 'add'
                ? 'bg-[#8B2635] text-white'
                : 'bg-[#FAF8F5] text-[#786C68] hover:bg-[#F4EFEA] hover:text-[#1C1615]'
            )}
            title="Tìm kiếm và chọn thêm tác phẩm từ thư viện của bạn"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>Thêm từ thư viện</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                activeTab === 'add' ? 'bg-white/20 text-white' : 'bg-[#E7E2D9] text-[#1C1615]'
              )}
            >
              {unaddedCount}
            </span>
          </button>
        </div>

        {/* TAB 1: EPISODES MANAGEMENT */}
        {activeTab === 'episodes' && (
          <div className="flex flex-col flex-1 min-h-0 pt-2">
            {/* Quick Action Toolbar */}
            <div className="flex items-center justify-between pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1C1615]">
                  Danh sách phát ({itemsCount} tập)
                </span>
                {isReordering && (
                  <span className="flex items-center gap-1 text-[11px] font-normal text-[#8B2635] bg-[#FBF2EE] px-2 py-0.5 rounded-full border border-[#F0DDD8]">
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
                    'gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95',
                    isSeriesPlaying
                      ? 'bg-[#FBF2EE] border-[#F0DDD8] text-[#8B2635] hover:bg-[#F8ECE8]'
                      : 'bg-white border-[#E7E2D9] text-[#1C1615] hover:bg-[#FAF8F5] hover:border-stone-400'
                  )}
                  title={isSeriesPlaying ? 'Tạm dừng phát tuyển tập này' : 'Phát tuyển tập này từ tập đầu tiên'}
                >
                  {isSeriesPlaying ? (
                    <>
                      <Pause className="h-3 w-3 fill-current text-[#8B2635]" />
                      <span className="text-[#8B2635]">Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current text-[#8B2635] ml-0.5" />
                      <span>Phát tất cả</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Scrollable Episodes List */}
            <div className="overflow-y-auto max-h-[50vh] space-y-2 py-1 pr-1 flex-1">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#8B2635]" />
                  Đang tải danh sách tập...
                </div>
              ) : !seriesDetail?.items || seriesDetail.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E7E2D9] bg-[#FAF8F5] p-8 text-center flex flex-col items-center">
                  <Film className="h-10 w-10 text-stone-400 mb-2.5 opacity-60" />
                  <p className="text-sm font-semibold text-[#1C1615]">Tuyển tập này chưa có tập nào</p>
                  <p className="text-xs text-[#786C68] mt-1 max-w-sm">
                    Bắt đầu xây dựng tuyển tập bằng cách thêm các video hoặc podcast lịch sử từ thư viện của bạn.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="mt-4 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs h-9 px-4 rounded-xl gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>Chọn tập từ thư viện ({unaddedCount} tác phẩm)</span>
                  </Button>
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
                        'group flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-colors duration-150',
                        isTrackActive
                          ? 'border-[#8B2635]/50 bg-[#FBF2EE]/50 ring-1 ring-[#8B2635]/20'
                          : 'border-[#E7E2D9] bg-white hover:border-stone-300'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Order Index */}
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF8F5] border border-[#E7E2D9] text-xs font-bold text-[#8B2635] tabular-nums shrink-0">
                          #{idx + 1}
                        </span>

                        {/* Direct Play/Pause Button */}
                        <button
                          type="button"
                          onClick={handleItemPlay}
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0',
                            isTrackPlaying
                              ? 'bg-[#8B2635] text-white hover:bg-[#731E2A]'
                              : isTrackActive
                              ? 'bg-stone-800 text-white hover:bg-stone-900'
                              : 'bg-[#FBF2EE] text-[#8B2635] hover:bg-[#8B2635] hover:text-white border border-[#F0DDD8]'
                          )}
                          title={isTrackPlaying ? `Tạm dừng: ${item.title}` : `Phát: ${item.title}`}
                          aria-label={isTrackPlaying ? `Tạm dừng ${item.title}` : `Phát ${item.title}`}
                        >
                          {isTrackPlaying ? (
                            <Pause className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Thumbnail Image */}
                        <div className="relative h-11 w-16 rounded-lg overflow-hidden border border-[#E7E2D9] bg-stone-100 shrink-0">
                          <img
                            src={item.thumbnailUrl || '/assets/studio/topic-bach-dang-938.png'}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/studio/topic-bach-dang-938.png';
                            }}
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-[9px] text-white px-1 py-0.2 rounded font-medium tabular-nums">
                            {formatDuration(item.durationSeconds)}
                          </span>
                        </div>

                        {/* Video Info */}
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
                                isTrackActive ? 'text-[#8B2635] font-bold' : 'text-[#1C1615] hover:text-[#8B2635]'
                              )}
                              title={`Nhấp để phát: ${item.title}`}
                            >
                              {item.title}
                            </h4>

                            {isTrackActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8B2635] bg-white px-2 py-0.5 rounded-full border border-[#F0DDD8] shrink-0">
                                <Volume2 className="h-3 w-3" />
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
                            {item.createdAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(item.createdAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reorder and Delete Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!canMoveUp(idx) || isReordering}
                          onClick={() => onMoveEpisode(idx, idx - 1)}
                          className="h-8 w-8 p-0 text-stone-500 hover:text-[#8B2635] disabled:opacity-25"
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
                          className="h-8 w-8 p-0 text-stone-500 hover:text-[#8B2635] disabled:opacity-25"
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADD FROM LIBRARY */}
        {activeTab === 'add' && (
          <div className="flex flex-col flex-1 min-h-0 pt-2 space-y-2.5">
            {/* Search and Filters Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tác phẩm theo tiêu đề..."
                  className="w-full rounded-xl border border-[#E7E2D9] bg-white pl-8 pr-8 py-1.5 text-xs text-[#1C1615] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterMode('unadded')}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer',
                    filterMode === 'unadded'
                      ? 'bg-[#8B2635] text-white'
                      : 'bg-[#FAF8F5] text-[#786C68] hover:bg-[#F4EFEA] hover:text-[#1C1615] border border-[#E7E2D9]'
                  )}
                >
                  Chưa thêm ({unaddedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer',
                    filterMode === 'all'
                      ? 'bg-[#8B2635] text-white'
                      : 'bg-[#FAF8F5] text-[#786C68] hover:bg-[#F4EFEA] hover:text-[#1C1615] border border-[#E7E2D9]'
                  )}
                >
                  Tất cả ({totalCreatorVideos})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('added')}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer',
                    filterMode === 'added'
                      ? 'bg-[#8B2635] text-white'
                      : 'bg-[#FAF8F5] text-[#786C68] hover:bg-[#F4EFEA] hover:text-[#1C1615] border border-[#E7E2D9]'
                  )}
                >
                  Đã thêm ({inSeriesCount})
                </button>
              </div>
            </div>

            {/* Video Cards Grid / List */}
            <div className="overflow-y-auto max-h-[50vh] space-y-2 py-1 pr-1 flex-1">
              {creatorVideos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E7E2D9] bg-[#FAF8F5] p-8 text-center">
                  <Film className="mx-auto h-8 w-8 text-stone-400 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-[#1C1615]">Thư viện của bạn chưa có tác phẩm nào</p>
                  <p className="text-[11px] text-[#786C68] mt-1">
                    Hãy tạo video hoặc podcast mới trong Creator Studio trước khi thêm vào tuyển tập này.
                  </p>
                </div>
              ) : filteredCreatorVideos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E7E2D9] bg-[#FAF8F5] p-6 text-center">
                  <Search className="mx-auto h-6 w-6 text-stone-400 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-[#1C1615]">
                    Không tìm thấy tác phẩm nào phù hợp
                  </p>
                  <p className="text-[11px] text-[#786C68] mt-1">
                    {searchQuery
                      ? `Không có kết quả khớp với "${searchQuery}". Thử tìm với từ khóa khác.`
                      : 'Không có tác phẩm nào trong bộ lọc này.'}
                  </p>
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-xs h-7 px-3 rounded-lg"
                    >
                      Xóa từ khóa tìm kiếm
                    </Button>
                  )}
                </div>
              ) : (
                filteredCreatorVideos.map((video) => {
                  const isAlreadyAdded = existingContentIdMap.has(video.contentId);
                  const addedOrderNo = existingContentIdMap.get(video.contentId);
                  const isCurrentlyAdding = isAdding && pendingAddId === video.contentId;
                  const statusInfo = getContentStatusBadge(video.status);

                  return (
                    <div
                      key={video.contentId}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-colors duration-150',
                        isAlreadyAdded
                          ? 'border-[#E7E2D9] bg-[#FAF8F5]/60'
                          : 'border-[#E7E2D9] bg-white hover:border-[#8B2635]/30'
                      )}
                    >
                      {/* Left: Thumbnail & Video Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Thumbnail with duration */}
                        <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-[#E7E2D9] bg-stone-100 shrink-0">
                          <img
                            src={video.thumbnailUrl || '/assets/studio/topic-bach-dang-938.png'}
                            alt={video.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/studio/topic-bach-dang-938.png';
                            }}
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-[9px] text-white px-1 py-0.2 rounded font-medium tabular-nums">
                            {formatDuration(video.durationSeconds)}
                          </span>
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-[#1C1615] truncate"
                            title={video.title}
                          >
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#786C68] mt-0.5 flex-wrap">
                            <span
                              className={cn(
                                'px-1.5 py-0.2 rounded text-[10px] font-medium border',
                                statusInfo.variant === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : statusInfo.variant === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-stone-50 text-stone-600 border-stone-200'
                              )}
                            >
                              {statusInfo.label}
                            </span>
                            <span>•</span>
                            <span>{formatDuration(video.durationSeconds)}</span>
                            {video.createdAt && (
                              <>
                                <span>•</span>
                                <span>{formatRelativeTime(video.createdAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button or Status Badge */}
                      <div className="shrink-0">
                        {isAlreadyAdded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            <Check className="h-3 w-3" />
                            <span>Đã có (Tập #{addedOrderNo})</span>
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isAdding || isReordering}
                            onClick={() => handleDirectAdd(video.contentId)}
                            className="gap-1.5 bg-[#8B2635] hover:bg-[#731E2A] text-white rounded-xl cursor-pointer h-8 px-3 text-xs whitespace-nowrap"
                            title={`Thêm "${video.title}" vào tuyển tập`}
                          >
                            {isCurrentlyAdding ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Đang thêm...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>+ Thêm vào tập #{itemsCount + 1}</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Dialog Footer */}
        <DialogFooter className="pt-3 border-t border-[#EBE4D8] flex items-center justify-between sm:justify-between w-full shrink-0">
          <div className="text-xs text-[#786C68]">
            Tuyển tập: <strong className="text-[#1C1615] font-semibold">{itemsCount} tập</strong>
            {hasEpisodes && (
              <>
                {' '}• Tổng thời lượng: <strong className="text-[#1C1615] font-semibold">{formatDuration(totalDurationSeconds)}</strong>
              </>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-[#EBE4D8] text-xs h-8 px-4"
            title="Đóng cửa sổ quản lý danh sách tập"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
