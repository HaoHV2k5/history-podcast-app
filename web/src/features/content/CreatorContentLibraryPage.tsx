import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  ShieldAlert,
  FileQuestion,
  ExternalLink,
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
import { CreatorVideoItem } from '@/types/creatorContent';
import { formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PUBLISHED', label: 'Đã xuất bản' },
  { key: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { key: 'COMPLETED', label: 'Chờ gửi duyệt' },
  { key: 'DRAFT', label: 'Bản nháp' },
  { key: 'REJECTED', label: 'Bị từ chối' },
  { key: 'HIDDEN', label: 'Đã ẩn' },
];

const SORT_OPTIONS: { value: string; label: string; sortBy: string; sortDir: 'asc' | 'desc' }[] = [
  { value: 'createdAt_desc', label: 'Mới nhất trước', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAt_asc', label: 'Cũ nhất trước', sortBy: 'createdAt', sortDir: 'asc' },
  { value: 'title_asc', label: 'Tiêu đề (A – Z)', sortBy: 'title', sortDir: 'asc' },
  { value: 'duration_desc', label: 'Thời lượng dài nhất', sortBy: 'durationSeconds', sortDir: 'desc' },
  { value: 'likes_desc', label: 'Nhiều lượt thích nhất', sortBy: 'likeCount', sortDir: 'desc' },
  { value: 'comments_desc', label: 'Nhiều bình luận nhất', sortBy: 'commentCount', sortDir: 'desc' },
];

export const CreatorContentLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search, filter & sort state
  const activeStatus = searchParams.get('status') || 'ALL';
  const keywordParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'createdAt_desc';
  const exclusiveParam = searchParams.get('vip');

  const [searchTerm, setSearchTerm] = useState(keywordParam);

  // Quick Watch Video Modal State
  const [playingVideo, setPlayingVideo] = useState<CreatorVideoItem | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const resolveMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  };

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

    // Luôn mở modal xem trực tiếp. Nếu item chưa có fileUrl thì fetch detail từ API để cập nhật ngay
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
    return (
      SORT_OPTIONS.find((s) => s.value === sortParam) || SORT_OPTIONS[0]
    );
  }, [sortParam]);

  // Query videos from backend
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'creator',
      'studio-videos',
      'library',
      {
        keyword: keywordParam || undefined,
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        sortBy: currentSortOption.sortBy,
        sortDir: currentSortOption.sortDir,
        isExclusive: exclusiveParam === 'true' ? true : exclusiveParam === 'false' ? false : undefined,
      },
    ],
    queryFn: () =>
      creatorStudioApi.getVideos({
        keyword: keywordParam.trim() || undefined,
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        sortBy: currentSortOption.sortBy,
        sortDir: currentSortOption.sortDir,
        isExclusive: exclusiveParam === 'true' ? true : exclusiveParam === 'false' ? false : undefined,
      }),
    // Live polling every 15s if viewing pending tab or if any video is pending review
    refetchInterval: (query) => {
      const vids = Array.isArray(query.state.data?.data) ? query.state.data.data : [];
      const hasPending = vids.some((v) => v.status === 'PENDING_REVIEW' || v.status === 'PENDING');
      return activeStatus === 'PENDING_REVIEW' || hasPending ? 15000 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const videos = Array.isArray(response?.data) ? response.data : [];

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

  const handleExclusiveToggle = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (exclusiveParam === 'true') {
      nextParams.delete('vip');
    } else {
      nextParams.set('vip', 'true');
    }
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. Header Masthead */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            <Video className="h-4 w-4" />
            <span>Kho Tác Phẩm Sử Ký</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink">
            Thư Viện Nội Dung
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Quản lý toàn bộ danh mục podcast, video hoạt họa lịch sử và theo dõi tiến trình kiểm
            duyệt của kênh.
          </p>
        </div>

        {/* Refetch / Total badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Badge variant="outline" className="font-mono text-xs px-3 py-1">
            Tổng cộng: {videos.length} tác phẩm
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-8 px-2.5 gap-1.5"
            title="Tải lại danh sách"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleStatusChange(tab.key)}
                className={`px-3.5 py-2 min-h-[44px] inline-flex items-center text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap shrink-0 border-b-2 -mb-px cursor-pointer ${
                  isActive
                    ? 'border-accent text-accent font-semibold bg-surface'
                    : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm theo tiêu đề hoặc kịch bản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-20 text-xs h-9 bg-surface"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('q');
                  setSearchParams(nextParams);
                }}
                className="text-[11px] text-muted hover:text-ink absolute right-14 top-1/2 -translate-y-1/2"
              >
                Xóa
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2.5 text-[11px]"
            >
              Tìm
            </Button>
          </form>

          {/* Sort & VIP toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExclusiveToggle}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 h-9 ${
                exclusiveParam === 'true'
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border bg-surface text-muted hover:text-ink'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chỉ VIP</span>
            </button>

            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 h-9">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted shrink-0" />
              <select
                aria-label="Sắp xếp tác phẩm"
                value={sortParam}
                onChange={handleSortChange}
                className="bg-transparent text-xs text-ink focus:outline-none cursor-pointer py-1"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Content Area */}
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4 space-y-4 animate-pulse shadow-xs"
            >
              <div className="aspect-video bg-surface-subtle rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 bg-surface-subtle rounded w-3/4" />
                <div className="h-3 bg-surface-subtle rounded w-1/2" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-surface-subtle rounded w-16" />
                <div className="h-4 bg-surface-subtle rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-status-error-text/30 bg-status-error-bg p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-full bg-status-error-text/10 text-status-error-text mx-auto flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-status-error-text">
              Không thể tải thư viện nội dung
            </h3>
            <p className="text-xs text-status-error-text/90 leading-relaxed">
              {(error as Error)?.message ||
                'Đã xảy ra lỗi khi kết nối tới máy chủ API Creator Studio. Vui lòng kiểm tra lại đường truyền.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 text-xs border-status-error-text/40 text-status-error-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Empty State: No results for filters */}
      {!isLoading && !isError && videos.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-surface-subtle border border-border mx-auto flex items-center justify-center text-muted">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-semibold text-ink">
              {keywordParam || activeStatus !== 'ALL' || exclusiveParam
                ? 'Không tìm thấy tác phẩm phù hợp'
                : 'Thư viện kênh hiện chưa có tác phẩm nào'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {keywordParam || activeStatus !== 'ALL' || exclusiveParam
                ? 'Không có video hoặc podcast nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Thử đặt lại bộ lọc để xem toàn bộ danh mục.'
                : 'Kênh của bạn chưa có tác phẩm podcast hoặc video nào. Bạn có thể bắt đầu bằng cách nhấn "Tạo nội dung mới" để khởi tạo kịch bản và dựng hoạt họa trong Creator Studio.'}
            </p>
          </div>

          {(keywordParam || activeStatus !== 'ALL' || exclusiveParam) && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="gap-2 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại bộ lọc</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4. Video Grid */}
      {!isLoading && !isError && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((item) => {
            const statusBadge = getContentStatusBadge(item.status);
            return (
              <div
                key={item.contentId}
                className="group rounded-xl border border-border bg-surface hover:border-accent/40 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden"
              >
                {/* Top media thumbnail / placeholder */}
                <div>
                  <div
                    onClick={() => handleWatchVideo(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleWatchVideo(item);
                      }
                    }}
                    className="relative aspect-video bg-surface-subtle border-b border-border overflow-hidden flex items-center justify-center cursor-pointer group/thumb hover:brightness-95 transition-all duration-200 select-none"
                    title={`Xem video: ${item.title}`}
                  >
                    {/* Media preview icon */}
                    <div className="h-12 w-12 rounded-full bg-canvas/90 text-accent flex items-center justify-center shadow-md group-hover/thumb:scale-110 group-hover/thumb:bg-accent group-hover/thumb:text-canvas transition-all duration-200">
                      <Play className="h-5 w-5 fill-current ml-0.5 opacity-90 group-hover/thumb:opacity-100" />
                    </div>

                    {/* Hover Callout Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-2.5 pointer-events-none">
                      <span className="text-[11px] font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                        <Play className="h-3 w-3 fill-current text-accent" />
                        <span>Xem video ngay</span>
                      </span>
                    </div>

                    {/* Top status & VIP pill overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      {item.isExclusive && (
                        <Badge variant="accent" size="sm">
                          VIP
                        </Badge>
                      )}
                    </div>

                    {/* Bottom duration pill overlay */}
                    {item.durationSeconds && item.durationSeconds > 0 ? (
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-mono flex items-center gap-1 z-10 pointer-events-none">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(item.durationSeconds)}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3
                      onClick={() => handleWatchVideo(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleWatchVideo(item);
                        }
                      }}
                      title={`Xem video: ${item.title}`}
                      className="font-serif text-sm font-bold text-ink line-clamp-1 hover:text-accent cursor-pointer hover:underline transition-colors"
                    >
                      {item.title}
                    </h3>

                    {item.description ? (
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted italic">Chưa có kịch bản tóm tắt</p>
                    )}

                    {/* AI Shield or Moderation alert preview */}
                    {item.moderationDecision === 'REJECTED' && item.moderationReason && (
                      <div className="p-2 rounded bg-status-error-bg border border-status-error-text/20 text-[11px] text-status-error-text flex items-start gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-medium">
                          Từ chối: {item.moderationReason}
                        </span>
                      </div>
                    )}

                    {item.aiShieldScore !== null && item.aiShieldScore !== undefined && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>AI Shield:</span>
                        <span className="font-mono font-medium text-ink">
                          {Number(item.aiShieldScore).toFixed(1)}/100
                        </span>
                        {item.aiShieldTierLabel && (
                          <span className="text-muted text-[10px]">
                            ({item.aiShieldTierLabel})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer metadata & Action */}
                <div className="px-4 py-3 bg-surface-subtle border-t border-border flex items-center justify-between text-[11px] text-muted">
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums">{formatDate(item.createdAt)}</span>
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Heart className="h-3 w-3" />
                      {item.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <MessageSquare className="h-3 w-3" />
                      {item.commentCount || 0}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/creator/content/${item.contentId}`)}
                    className="h-7 px-2.5 text-xs gap-1"
                  >
                    <span>
                      {item.status === 'COMPLETED'
                        ? 'Gửi duyệt'
                        : item.status === 'REJECTED'
                          ? 'Xem lý do'
                          : 'Chi tiết'}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Direct Video Player Modal (Opens on thumbnail or title click) */}
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
          className="p-0 overflow-hidden bg-black text-canvas border border-stone-800 rounded-2xl shadow-modal focus:outline-none"
        >
          {playingVideo && (
            <div className="flex flex-col">
              {/* Top Bar */}
              <div className="p-3.5 px-5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="flex h-6 w-6 rounded-md bg-accent/20 text-accent items-center justify-center shrink-0">
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
                    <RotateCcw className="h-7 w-7 text-accent animate-spin" />
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
                      <div className="h-16 w-16 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center shadow-glow-accent">
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
                      <span className="flex items-center gap-1 text-accent font-medium">
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
                      className="text-xs h-8 px-4 bg-accent text-canvas hover:bg-accent/90"
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
