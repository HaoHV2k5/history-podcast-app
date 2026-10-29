import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, PlusCircle, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import { seriesApi } from '@/services/api/series';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { SeriesItem, SeriesDetail, SeriesItemDetail, CreateSeriesRequest, UpdateSeriesRequest } from '@/types/series';
import {
  reorderItems,
  extractContentIds,
  validateReorderPayload,
} from './seriesLogic';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

// Compound & Sub-components
import { SeriesHeroBanner } from './components/SeriesHeroBanner';
import { SeriesCategoryTabs, SeriesCategoryKey } from './components/SeriesCategoryTabs';
import { SeriesFilterBar, SeriesFilterState } from './components/SeriesFilterBar';
import { SeriesCard, SeriesCardData } from './components/SeriesCard';
import { SeriesListItem } from './components/SeriesListItem';
import { SeriesAudioPlayerBar, PlayingTrack } from './components/SeriesAudioPlayerBar';
import { SeriesCreateEditDialog } from './components/SeriesCreateEditDialog';
import { SeriesManageEpisodesDialog } from './components/SeriesManageEpisodesDialog';
import { SeriesDeleteConfirmDialog } from './components/SeriesDeleteConfirmDialog';

export const CreatorSeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Animation Refs (GSAP Smooth Float In matching Content Library)
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ─── 1. MODAL STATES ────────────────────────────────────────────────────────
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesCardData | null>(null);
  const [deleteConfirmSeries, setDeleteConfirmSeries] = useState<SeriesCardData | null>(null);
  const [managingSeriesId, setManagingSeriesId] = useState<number | null>(null);

  // Form states for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formCategory, setFormCategory] = useState('TRIEU_LY');
  const [formStatus, setFormStatus] = useState<'PUBLISHED' | 'HIDDEN' | 'DRAFT'>('PUBLISHED');
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Episode Management modal state
  const [addVideoId, setAddVideoId] = useState<string>('');
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // ─── 2. FILTER & VIEW STATES ────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<SeriesCategoryKey>('ALL');
  const [filterState, setFilterState] = useState<SeriesFilterState>({
    searchQuery: '',
    historicalEra: 'ALL',
    format: 'ALL',
    sortBy: 'newest',
    viewMode: 'grid',
  });

  // ─── 3. AUDIO PLAYER STATE (NO FAKE DATA: initially null) ───────────────────
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<{
    seriesId?: number;
    seriesTitle?: string;
    episodes: SeriesItemDetail[];
  } | null>(null);

  // ─── 4. API QUERIES ─────────────────────────────────────────────────────────
  // 1. Fetch Creator's series list from BE
  const {
    data: seriesRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['creator-series-list'],
    queryFn: () => seriesApi.getMySeries(),
  });
  const backendSeriesList: SeriesItem[] = Array.isArray(seriesRes?.data) ? seriesRes.data : [];

  // 2. Fetch series detail when managing episodes
  const {
    data: seriesDetailRes,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ['creator-series-detail', managingSeriesId],
    queryFn: () => seriesApi.getSeriesDetail(managingSeriesId!),
    enabled: managingSeriesId != null,
  });
  const seriesDetail: SeriesDetail | undefined = seriesDetailRes?.data;

  // 3. Fetch Creator's videos to pick from when adding to series
  const {
    data: creatorVideosRes,
  } = useQuery({
    queryKey: ['creator-videos-for-series'],
    queryFn: () => creatorStudioApi.getVideos(),
    enabled: managingSeriesId != null,
  });
  const creatorVideos = Array.isArray(creatorVideosRes?.data) ? creatorVideosRes.data : [];

  // ─── 5. API MUTATIONS ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (req: CreateSeriesRequest) => seriesApi.createSeries(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setModalMode(null);
      resetForm();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message || 'Không thể tạo tuyển tập. Vui lòng thử lại.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateSeriesRequest }) =>
      seriesApi.updateSeries(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', selectedSeries?.id] });
      setModalMode(null);
      resetForm();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message || 'Không thể cập nhật tuyển tập. Vui lòng thử lại.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => seriesApi.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setDeleteConfirmSeries(null);
    },
  });

  const addEpisodeMutation = useMutation({
    mutationFn: ({ seriesId, contentId }: { seriesId: number; contentId: number }) =>
      seriesApi.addSeriesItem(seriesId, { contentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setAddVideoId('');
    },
  });

  const removeEpisodeMutation = useMutation({
    mutationFn: ({ seriesId, contentId }: { seriesId: number; contentId: number }) =>
      seriesApi.removeSeriesItem(seriesId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ seriesId, contentIds }: { seriesId: number; contentIds: number[] }) =>
      seriesApi.reorderSeriesItems(seriesId, { contentIds }),
    onSuccess: (res) => {
      if (res.data) {
        queryClient.setQueryData(['creator-series-detail', managingSeriesId], res);
      } else {
        queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
      }
      queryClient.invalidateQueries({ queryKey: ['creator-series-list'] });
      setReorderError(null);
      setReorderSuccessMsg('Đã cập nhật thứ tự các tập thành công.');
      setTimeout(() => setReorderSuccessMsg(null), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setReorderError(e.response?.data?.message || 'Không thể sắp xếp lại thứ tự tập. Vui lòng thử lại.');
      queryClient.invalidateQueries({ queryKey: ['creator-series-detail', managingSeriesId] });
    },
  });

  // ─── 6. REAL BACKEND DATA MAPPING (NO FAKE DATA) ───────────────────────────
  // Map purely from backend series list, absolutely no mock/fake series injection.
  const unifiedSeriesList: SeriesCardData[] = useMemo(() => {
    return backendSeriesList.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      coverUrl: s.coverUrl || '/assets/studio/topic-thang-long.png',
      itemCount: s.itemCount || 0,
      totalDurationSeconds: s.totalDurationSeconds || 0,
      status: s.status,
      listenCount: 0,
      likeCount: 0,
      category: 'ALL',
      tags: [
        { label: 'Sử Ký', variant: 'rose', iconName: 'Landmark' },
        { label: `${s.itemCount || 0} tập`, variant: 'stone', iconName: 'Folder' },
      ],
      featuredTrackTitle: s.title,
      authorOrTopic: s.channelName || 'Đại Việt Sử Ký',
    }));
  }, [backendSeriesList]);

  // Compute category counts for tab badges from real series
  const categoryCounts: Record<SeriesCategoryKey, number> = useMemo(() => {
    const counts: Record<SeriesCategoryKey, number> = {
      ALL: backendSeriesList.length,
      TRIEU_LY: 0,
      TRIEU_TRAN: 0,
      CHIEN_TRANH: 0,
      NHAN_VAT: 0,
      VAN_HOA: 0,
      KHAC: 0,
    };

    backendSeriesList.forEach((s) => {
      const text = `${s.title} ${s.description || ''}`.toLowerCase();
      if (text.includes('lý') || text.includes('thăng long')) counts.TRIEU_LY++;
      else if (text.includes('trần') || text.includes('đông a')) counts.TRIEU_TRAN++;
      else if (text.includes('chiến') || text.includes('bạch đằng') || text.includes('quân')) counts.CHIEN_TRANH++;
      else if (text.includes('nhân vật') || text.includes('vua') || text.includes('tướng') || text.includes('quang trung')) counts.NHAN_VAT++;
      else if (text.includes('văn hóa') || text.includes('phật') || text.includes('miếu')) counts.VAN_HOA++;
      else counts.KHAC++;
    });

    return counts;
  }, [backendSeriesList]);

  // Filter & Sort Logic
  const filteredSeriesList = useMemo(() => {
    let result = [...unifiedSeriesList];

    // Filter by category tab
    if (activeCategory !== 'ALL') {
      result = result.filter((item) => {
        const searchTarget = `${item.title} ${item.description || ''}`.toLowerCase();
        if (activeCategory === 'TRIEU_LY') return searchTarget.includes('lý') || searchTarget.includes('thăng long');
        if (activeCategory === 'TRIEU_TRAN') return searchTarget.includes('trần') || searchTarget.includes('đông a');
        if (activeCategory === 'CHIEN_TRANH') return searchTarget.includes('chiến') || searchTarget.includes('thủy chiến') || searchTarget.includes('bạch đằng');
        if (activeCategory === 'NHAN_VAT') return searchTarget.includes('vua') || searchTarget.includes('nhân vật') || searchTarget.includes('tướng');
        if (activeCategory === 'VAN_HOA') return searchTarget.includes('văn hóa') || searchTarget.includes('đời sống') || searchTarget.includes('phật');
        if (activeCategory === 'KHAC') return true;
        return false;
      });
    }

    // Filter by search query
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // Filter by historical era select
    if (filterState.historicalEra !== 'ALL') {
      result = result.filter((item) => {
        const searchTarget = `${item.title} ${item.description || ''}`.toLowerCase();
        if (filterState.historicalEra === 'TRIEU_LY') return searchTarget.includes('lý');
        if (filterState.historicalEra === 'TRIEU_TRAN') return searchTarget.includes('trần');
        if (filterState.historicalEra === 'CHIEN_TRANH') return searchTarget.includes('chiến') || searchTarget.includes('thủy chiến');
        return true;
      });
    }

    // Sort order
    if (filterState.sortBy === 'most_listened') {
      result.sort((a, b) => (b.listenCount || 0) - (a.listenCount || 0));
    } else if (filterState.sortBy === 'most_episodes') {
      result.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0));
    } else if (filterState.sortBy === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }

    return result;
  }, [unifiedSeriesList, activeCategory, filterState]);

  // ─── 7. ACTIONS & HANDLERS ──────────────────────────────────────────────────
  const handlePlayEpisode = (episode: SeriesItemDetail, series: SeriesDetail) => {
    setActivePlaylist({
      seriesId: series.id,
      seriesTitle: series.title,
      episodes: series.items || [],
    });
    setCurrentTrack({
      title: episode.title,
      authorOrTopic: series.title,
      coverUrl: episode.thumbnailUrl || series.coverUrl || '/assets/studio/topic-bach-dang-938.png',
      durationSeconds: episode.durationSeconds || 60,
      currentSeconds: 0,
      seriesId: series.id,
      seriesTitle: series.title,
      contentId: episode.contentId,
      mediaUrl: episode.mediaUrl,
    });
    setIsPlaying(true);
  };

  const handlePlaySeries = async (series: SeriesCardData) => {
    try {
      const res = await seriesApi.getSeriesDetail(series.id);
      const detail = res?.data;
      if (detail && Array.isArray(detail.items) && detail.items.length > 0) {
        handlePlayEpisode(detail.items[0], detail);
      } else {
        // Tuyển tập chưa có bài/tập nào: Mở trình quản lý tập để người dùng thêm bài vào
        setManagingSeriesId(series.id);
      }
    } catch {
      setManagingSeriesId(series.id);
    }
  };

  const handlePrevTrack = () => {
    if (activePlaylist && activePlaylist.episodes.length > 0) {
      const curIdx = activePlaylist.episodes.findIndex((e) => e.contentId === currentTrack?.contentId);
      const prevIdx = curIdx > 0 ? curIdx - 1 : activePlaylist.episodes.length - 1;
      const prevEpisode = activePlaylist.episodes[prevIdx];
      if (prevEpisode) {
        setCurrentTrack({
          title: prevEpisode.title,
          authorOrTopic: activePlaylist.seriesTitle || '',
          coverUrl: prevEpisode.thumbnailUrl || '/assets/studio/topic-bach-dang-938.png',
          durationSeconds: prevEpisode.durationSeconds || 60,
          currentSeconds: 0,
          seriesId: activePlaylist.seriesId,
          seriesTitle: activePlaylist.seriesTitle,
          contentId: prevEpisode.contentId,
          mediaUrl: prevEpisode.mediaUrl,
        });
        setIsPlaying(true);
        return;
      }
    }
    const curIdx = filteredSeriesList.findIndex((s) => s.id === currentTrack?.seriesId);
    const prevIdx = curIdx > 0 ? curIdx - 1 : filteredSeriesList.length - 1;
    const target = filteredSeriesList[prevIdx];
    if (target) handlePlaySeries(target);
  };

  const handleNextTrack = () => {
    if (activePlaylist && activePlaylist.episodes.length > 0) {
      const curIdx = activePlaylist.episodes.findIndex((e) => e.contentId === currentTrack?.contentId);
      const nextIdx = curIdx < activePlaylist.episodes.length - 1 ? curIdx + 1 : 0;
      const nextEpisode = activePlaylist.episodes[nextIdx];
      if (nextEpisode) {
        setCurrentTrack({
          title: nextEpisode.title,
          authorOrTopic: activePlaylist.seriesTitle || '',
          coverUrl: nextEpisode.thumbnailUrl || '/assets/studio/topic-bach-dang-938.png',
          durationSeconds: nextEpisode.durationSeconds || 60,
          currentSeconds: 0,
          seriesId: activePlaylist.seriesId,
          seriesTitle: activePlaylist.seriesTitle,
          contentId: nextEpisode.contentId,
          mediaUrl: nextEpisode.mediaUrl,
        });
        setIsPlaying(true);
        return;
      }
    }
    const curIdx = filteredSeriesList.findIndex((s) => s.id === currentTrack?.seriesId);
    const nextIdx = curIdx < filteredSeriesList.length - 1 ? curIdx + 1 : 0;
    const target = filteredSeriesList[nextIdx];
    if (target) handlePlaySeries(target);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCoverUrl('');
    setFormCategory('TRIEU_LY');
    setFormStatus('PUBLISHED');
    setFormError(null);
    setSelectedSeries(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
  };

  const openEditModal = (s: SeriesCardData) => {
    setSelectedSeries(s);
    setFormTitle(s.title || '');
    setFormDescription(s.description || '');
    setFormCoverUrl(s.coverUrl || '');
    setFormStatus((s.status as 'PUBLISHED' | 'HIDDEN' | 'DRAFT') || 'PUBLISHED');
    setFormError(null);
    setModalMode('edit');
  };

  const handleUploadSeriesCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Định dạng ảnh không hợp lệ. Vui lòng chọn file JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Kích thước ảnh vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    setFormError(null);
    setIsUploadingCover(true);
    try {
      const res = await creatorStudioApi.uploadSceneImage(file, 'series/covers');
      const uploadedUrl = res.data?.imageUrl || '';
      if (uploadedUrl) {
        setFormCoverUrl(uploadedUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải ảnh bìa lên. Vui lòng thử lại.';
      setFormError(msg);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Tiêu đề tuyển tập không được để trống.');
      return;
    }

    if (modalMode === 'create') {
      createMutation.mutate({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        coverUrl: formCoverUrl.trim() || undefined,
        status: formStatus,
      });
    } else if (modalMode === 'edit' && selectedSeries) {
      updateMutation.mutate({
        id: selectedSeries.id,
        req: {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          coverUrl: formCoverUrl.trim() || undefined,
          status: formStatus,
        },
      });
    }
  };

  const handleMoveEpisode = (fromIdx: number, toIdx: number) => {
    if (!managingSeriesId || !seriesDetail?.items) return;
    if (reorderMutation.isPending) return;
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= seriesDetail.items.length ||
      toIdx >= seriesDetail.items.length ||
      fromIdx === toIdx
    ) {
      return;
    }

    const reordered = reorderItems(seriesDetail.items, fromIdx, toIdx);
    const contentIds = extractContentIds(reordered);
    const validation = validateReorderPayload(contentIds);
    if (!validation.valid) {
      setReorderError(validation.error || 'Thứ tự tập không hợp lệ');
      return;
    }

    setReorderError(null);
    setReorderSuccessMsg(null);
    reorderMutation.mutate({ seriesId: managingSeriesId, contentIds });
  };

  const handleAddEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const cId = parseInt(addVideoId, 10);
    if (!managingSeriesId || isNaN(cId) || cId <= 0) return;
    addEpisodeMutation.mutate({ seriesId: managingSeriesId, contentId: cId });
  };

  // ─── 7. ENTRANCE ANIMATION: GSAP SMOOTH FLOAT IN (Exact Match with Content Library) ────
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

      if (tabsRef.current) {
        tl.fromTo(
          tabsRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.28'
        );
      }

      if (filterRef.current) {
        tl.fromTo(
          filterRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.25'
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
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, activeCategory, filterState.historicalEra, filterState.format, filterState.sortBy, filterState.viewMode]);

  // ─── 8. RENDER ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={cn('space-y-6 max-w-7xl mx-auto transition-all duration-300', currentTrack ? 'pb-20' : 'pb-0')}>
      {/* 1. Hero Panorama Masthead (Exact Visual Alignment with Image) */}
      <div ref={heroRef}>
        <SeriesHeroBanner
          totalCount={categoryCounts.ALL}
          onCreateClick={openCreateModal}
        />
      </div>

      {/* 2. Category Filter Pills with Badges */}
      <div ref={tabsRef}>
        <SeriesCategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* 3. Search & Control Filter Bar */}
      <div ref={filterRef}>
        <SeriesFilterBar
          filter={filterState}
          onChange={(updates) => setFilterState((prev) => ({ ...prev, ...updates }))}
          onCreateClick={openCreateModal}
        />
      </div>

      {/* 4. Series Display (Grid or List) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-2xl bg-white border border-[#EBE4D8] animate-pulse p-4 flex flex-col gap-4"
            >
              <div className="aspect-video w-full rounded-xl bg-stone-200/80" />
              <div className="h-5 w-3/4 rounded-md bg-stone-200/80" />
              <div className="h-4 w-full rounded-md bg-stone-200/60" />
              <div className="h-4 w-1/2 rounded-md bg-stone-200/60 mt-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="text-sm font-semibold text-[#1C1615]">
            Không thể tải danh sách tuyển tập từ máy chủ.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-stone-300"
          >
            Thử tải lại
          </Button>
        </div>
      ) : backendSeriesList.length === 0 ? (
        /* Genuine Empty State when channel has 0 series (No Fake Data) */
        <div className="rounded-2xl border border-dashed border-[#EBE4D8] bg-[#FBF8F4] p-10 sm:p-14 text-center space-y-5 shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FDF2F2] text-[#A31D24] border border-[#F8D7DA] shadow-xs">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1615]">
              Chưa có tuyển tập nào trong kênh của bạn
            </h3>
            <p className="text-xs sm:text-sm text-[#786C68] leading-relaxed">
              Bạn chưa tạo tuyển tập tác phẩm nào. Hãy tạo tuyển tập đầu tiên để gom nhóm các bài podcast và video lịch sử theo từng chủ đề hoặc thời kỳ, giúp khán giả tiện theo dõi trọn vẹn nội dung.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={openCreateModal}
              className="rounded-xl bg-[#A31D24] hover:bg-[#8B181E] text-white shadow-xs px-5 py-2.5 font-medium cursor-pointer"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo Tuyển Tập Đầu Tiên
            </Button>
            <Button
              onClick={() => navigate('/creator/content')}
              variant="outline"
              className="rounded-xl border-[#EBE4D8] bg-white hover:bg-stone-50 text-[#5C524F] px-5 py-2.5 cursor-pointer"
            >
              Xem Thư viện nội dung
            </Button>
          </div>
        </div>
      ) : filteredSeriesList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EBE4D8] bg-white p-12 text-center space-y-4 shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDF2F2] text-[#A31D24]">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-[#1C1615]">
              Không tìm thấy tuyển tập phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-[#786C68] max-w-md mx-auto">
              Không có tuyển tập nào khớp với từ khóa tìm kiếm hoặc danh mục đã chọn.
            </p>
          </div>
          <Button
            onClick={() => {
              setActiveCategory('ALL');
              setFilterState((prev) => ({
                ...prev,
                searchQuery: '',
                historicalEra: 'ALL',
                format: 'ALL',
              }));
            }}
            variant="outline"
            className="rounded-xl border-[#EBE4D8]"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : filterState.viewMode === 'grid' ? (
        /* 3-Column Grid matching reference image with GPU staggered entrance */
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeriesList.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              onPlay={handlePlaySeries}
              onManageEpisodes={() => setManagingSeriesId(series.id)}
              onEdit={openEditModal}
              onDelete={setDeleteConfirmSeries}
            />
          ))}
        </div>
      ) : (
        /* List View with GPU staggered entrance */
        <div ref={gridRef} className="space-y-3.5">
          {filteredSeriesList.map((series) => (
            <SeriesListItem
              key={series.id}
              series={series}
              onPlay={handlePlaySeries}
              onManageEpisodes={() => setManagingSeriesId(series.id)}
              onEdit={openEditModal}
              onDelete={setDeleteConfirmSeries}
            />
          ))}
        </div>
      )}

      {/* 5. Persistent Bottom Audio Player Bar (Active when user plays real content) */}
      <SeriesAudioPlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onClose={handleClosePlayer}
        onTrackClick={(track) => {
          if (track.seriesId) {
            setManagingSeriesId(track.seriesId);
          } else if (track.contentId) {
            navigate(`/creator/content/${track.contentId}`);
          }
        }}
        onSeriesClick={(seriesId) => {
          setManagingSeriesId(seriesId);
        }}
        onContentClick={(contentId) => {
          navigate(`/creator/content/${contentId}`);
        }}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
      />

      {/* 6. Dialog: Create or Edit Series */}
      <SeriesCreateEditDialog
        open={modalMode !== null}
        onOpenChange={(open) => !open && setModalMode(null)}
        isEdit={modalMode === 'edit'}
        title={formTitle}
        onTitleChange={setFormTitle}
        description={formDescription}
        onDescriptionChange={setFormDescription}
        coverUrl={formCoverUrl}
        onCoverUrlChange={setFormCoverUrl}
        status={formStatus}
        onStatusChange={setFormStatus}
        category={formCategory}
        onCategoryChange={setFormCategory}
        error={formError}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        isUploadingCover={isUploadingCover}
        onUploadCover={handleUploadSeriesCover}
        onSubmit={handleSubmitForm}
      />

      {/* 7. Dialog: Manage Episodes */}
      <SeriesManageEpisodesDialog
        open={managingSeriesId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setManagingSeriesId(null);
            setReorderError(null);
            setReorderSuccessMsg(null);
          }
        }}
        seriesDetail={seriesDetail}
        isLoadingDetail={isLoadingDetail}
        creatorVideos={creatorVideos}
        addVideoId={addVideoId}
        onAddVideoIdChange={setAddVideoId}
        onAddEpisode={handleAddEpisode}
        onMoveEpisode={handleMoveEpisode}
        onRemoveEpisode={(contentId) =>
          managingSeriesId &&
          removeEpisodeMutation.mutate({
            seriesId: managingSeriesId,
            contentId,
          })
        }
        isAdding={addEpisodeMutation.isPending}
        isReordering={reorderMutation.isPending}
        isRemoving={removeEpisodeMutation.isPending}
        reorderError={reorderError}
        reorderSuccessMsg={reorderSuccessMsg}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayEpisode={handlePlayEpisode}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />

      {/* 8. Dialog: Delete Confirmation */}
      <SeriesDeleteConfirmDialog
        series={deleteConfirmSeries}
        open={deleteConfirmSeries !== null}
        onOpenChange={(open) => !open && setDeleteConfirmSeries(null)}
        onConfirm={() =>
          deleteConfirmSeries && deleteMutation.mutate(deleteConfirmSeries.id)
        }
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
