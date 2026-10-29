import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Radio,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Tv,
} from 'lucide-react';
import { gsap } from 'gsap';
import { isReducedMotion, MOTION_CONFIG } from '@/utils/motion';
import { Button } from '@/components/ui/button';
import { livestreamApi } from '@/services/api/livestream';
import { channelsApi } from '@/services/api/channels';
import { useAuthStore } from '@/store/authStore';
import { LivestreamSession } from '@/types/livestream';
import { ChannelItem } from '@/types/channel';
import {
  normalizeLivestreamList,
  formatLivestreamViewerCount,
} from './livestreamLogic';

// Compound Components
import { LivestreamHeaderBanner } from './components/LivestreamHeaderBanner';
import { LivestreamMetricsRow } from './components/LivestreamMetricsRow';
import { LivestreamQuickActionHero } from './components/LivestreamQuickActionHero';
import {
  LivestreamFilterBar,
  StatusTab,
  LivestreamFilterState,
} from './components/LivestreamFilterBar';
import { LivestreamCard } from './components/LivestreamCard';
import { LivestreamListItem } from './components/LivestreamListItem';
import { CreateLivestreamModal } from './components/CreateLivestreamModal';
import { LivestreamDetailModal } from './components/LivestreamDetailModal';
import { EndLivestreamConfirmDialog } from './components/EndLivestreamConfirmDialog';

export const CreatorLivestreamPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // GSAP Animation Refs
  const bannerRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [filterState, setFilterState] = useState<LivestreamFilterState>({
    searchQuery: '',
    historicalEra: 'ALL',
    sortBy: 'newest',
    viewMode: 'grid',
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<LivestreamSession | null>(null);
  const [endingSession, setEndingSession] = useState<LivestreamSession | null>(null);

  // Post-creation banner state
  const [justCreatedSession, setJustCreatedSession] = useState<LivestreamSession | null>(null);

  // 1. Fetch current creator channel
  const {
    data: rawChannel,
    isLoading: isLoadingChannel,
  } = useQuery({
    queryKey: ['creator', 'my-channel'],
    queryFn: () => channelsApi.getMyChannel(),
  });
  const myChannel: ChannelItem | null =
    rawChannel && typeof rawChannel === 'object' && 'data' in rawChannel
      ? (rawChannel as { data: ChannelItem | null }).data ?? null
      : ((rawChannel as unknown as ChannelItem) ?? null);

  // 2. Fetch livestreams list
  const {
    data: livestreamsRes,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['creator-livestreams'],
    queryFn: () => livestreamApi.getLivestreams({ size: 50 }),
  });

  const allSessions = useMemo(() => normalizeLivestreamList(livestreamsRes), [livestreamsRes]);

  // Metrics counts
  const liveCount = useMemo(() => allSessions.filter((s) => s.status === 'LIVE').length, [allSessions]);
  const endedCount = useMemo(() => allSessions.filter((s) => s.status === 'ENDED').length, [allSessions]);
  const totalViewers = useMemo(() => {
    return allSessions
      .filter((s) => s.status === 'LIVE')
      .reduce((sum, s) => sum + (s.viewerCount || 0), 0);
  }, [allSessions]);

  // Filtered & Sorted Sessions
  const filteredSessions = useMemo(() => {
    let list = allSessions;

    // 1. Filter by status tab
    if (activeTab !== 'ALL') {
      list = list.filter((s) => s.status === activeTab);
    }

    // 2. Filter by search query
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.channelName || '').toLowerCase().includes(q)
      );
    }

    // 3. Filter by historical era
    if (filterState.historicalEra !== 'ALL') {
      list = list.filter((s) => {
        const text = `${s.title} ${s.description}`.toLowerCase();
        switch (filterState.historicalEra) {
          case 'TRIEU_TRAN':
            return text.includes('trần') || text.includes('đông a') || text.includes('bạch đằng');
          case 'TRIEU_LY':
            return text.includes('lý') || text.includes('thăng long') || text.includes('như nguyệt');
          case 'TRIEU_LE':
            return text.includes('lê') || text.includes('lam sơn');
          case 'TRIEU_NGUYEN':
            return text.includes('nguyễn') || text.includes('huế');
          default:
            return true;
        }
      });
    }

    // 4. Sort
    return [...list].sort((a, b) => {
      if (filterState.sortBy === 'newest') {
        const tA = new Date(a.createdAt || a.startedAt || 0).getTime();
        const tB = new Date(b.createdAt || b.startedAt || 0).getTime();
        return tB - tA;
      }
      if (filterState.sortBy === 'oldest') {
        const tA = new Date(a.createdAt || a.startedAt || 0).getTime();
        const tB = new Date(b.createdAt || b.startedAt || 0).getTime();
        return tA - tB;
      }
      if (filterState.sortBy === 'most_viewed') {
        return (b.viewerCount || 0) - (a.viewerCount || 0);
      }
      return 0;
    });
  }, [allSessions, activeTab, filterState]);

  // GSAP Smooth Entrance Timeline
  useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current || isLoadingSessions) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: MOTION_CONFIG.ease } });

      if (bannerRef.current) {
        tl.fromTo(
          bannerRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform,opacity' }
        );
      }

      if (metricsRef.current) {
        const cards = metricsRef.current.children;
        tl.fromTo(
          cards,
          { opacity: 0, y: 12, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.05,
            clearProps: 'transform,opacity',
          },
          '-=0.3'
        );
      }

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (filterRef.current) {
        tl.fromTo(
          filterRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform,opacity' },
          '-=0.15'
        );
      }
    });

    return () => ctx.revert();
  }, [isLoadingSessions]);

  const handleEnterStudio = (session: LivestreamSession) => {
    navigate(`/creator/livestream/${session.id}/studio`);
  };

  const handleCreateSuccess = (session: LivestreamSession) => {
    setIsCreateModalOpen(false);
    setJustCreatedSession(session);
    refetch();
  };

  return (
    <div className="space-y-6 sm:space-y-7 pb-12">
      {/* 1. Editorial Masthead / Header Banner */}
      <div ref={bannerRef}>
        <LivestreamHeaderBanner
          onRefresh={() => refetch()}
          onCreateClick={() => setIsCreateModalOpen(true)}
          isFetching={isFetching}
        />
      </div>

      {/* Just-created Success Banner */}
      {justCreatedSession && (
        <div className="relative rounded-2xl border border-emerald-200 bg-[#F0FDF4] p-4 sm:p-5 text-xs text-emerald-900 shadow-xs">
          <button
            type="button"
            onClick={() => setJustCreatedSession(null)}
            className="absolute top-3.5 right-3.5 text-emerald-700/80 hover:text-emerald-900 p-1 rounded-md cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 pr-6">
              <p className="font-serif font-bold text-sm text-emerald-950">
                Khởi tạo thành công phiên phát trực tiếp: &ldquo;{justCreatedSession.title}&rdquo;!
              </p>
              <p className="text-emerald-800 leading-relaxed max-w-2xl">
                Phòng phát sóng đã sẵn sàng. Bạn có thể vào Studio ngay bây giờ để kiểm tra thiết bị âm thanh, hình ảnh và bắt đầu lên sóng giao lưu cùng thính giả.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#A11C27] hover:bg-[#85151E] text-white font-semibold rounded-lg shadow-xs"
                  onClick={() => handleEnterStudio(justCreatedSession)}
                >
                  <Tv className="h-3.5 w-3.5 mr-1.5" />
                  Vào Studio phát sóng
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50 rounded-lg"
                  onClick={() => setDetailSession(justCreatedSession)}
                >
                  Xem chi tiết phiên
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Metrics Bar (4 Cards) */}
      <div ref={metricsRef}>
        <LivestreamMetricsRow
          liveCount={liveCount}
          totalViewers={totalViewers}
          totalSessions={allSessions.length}
          peakListeners={liveCount > 0 ? totalViewers : 0}
        />
      </div>

      {/* 3. Hero Quick Action Banner (Bắt đầu phiên phát trực tiếp mới & Gợi ý) */}
      <div ref={heroRef}>
        <LivestreamQuickActionHero
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      </div>

      {/* 4. Filter & Search Navigation Bar */}
      <div ref={filterRef}>
        <LivestreamFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={allSessions.length}
          liveCount={liveCount}
          endedCount={endedCount}
          filter={filterState}
          onFilterChange={(updates) => setFilterState((prev) => ({ ...prev, ...updates }))}
        />
      </div>

      {/* 5. Main Content Area (Grid or List View) */}
      <div id="livestream-panel" role="tabpanel" ref={contentRef}>
        {isLoadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#EBE4D8] bg-white p-4 space-y-3.5 animate-pulse shadow-xs"
              >
                <div className="aspect-video w-full rounded-xl bg-stone-100" />
                <div className="h-4 w-3/4 bg-stone-100 rounded" />
                <div className="h-3 w-1/2 bg-stone-100 rounded" />
                <div className="h-8 w-full bg-stone-100 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : isSessionsError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="font-serif text-base font-bold text-rose-950">
              Không thể tải danh sách phiên phát trực tiếp
            </h3>
            <p className="text-xs text-rose-800 max-w-md mx-auto">
              {(sessionsError as Error)?.message ||
                'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-300 text-rose-900 hover:bg-rose-100/60 rounded-lg text-xs"
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D6CCC2] bg-white p-12 sm:p-16 text-center space-y-4 shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF7F2] text-[#A11C27] mx-auto border border-[#EBE4D8]">
              <Radio className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-[#1C1615]">
                {activeTab === 'LIVE'
                  ? 'Hiện không có phiên phát sóng trực tiếp nào'
                  : activeTab === 'ENDED'
                  ? 'Chưa có phiên phát trực tiếp nào đã kết thúc'
                  : filterState.searchQuery
                  ? 'Không tìm thấy phiên phát sóng phù hợp với từ khóa'
                  : 'Chưa có phiên phát sóng trực tiếp nào'}
              </h3>
              <p className="text-xs text-[#786F6B] max-w-md mx-auto leading-relaxed">
                {activeTab === 'LIVE'
                  ? 'Bắt đầu một buổi phát sóng mới ngay bây giờ để đàm đạo lịch sử cùng thính giả podcast của bạn.'
                  : filterState.searchQuery
                  ? 'Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc thời kỳ lịch sử.'
                  : 'Các phiên phát sóng sau khi hoàn thành sẽ được lưu trữ và hiển thị tại đây.'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (filterState.searchQuery) {
                  setFilterState((prev) => ({ ...prev, searchQuery: '', historicalEra: 'ALL' }));
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="gap-2 bg-[#A11C27] hover:bg-[#85151E] text-white font-semibold rounded-lg text-xs h-10 px-5 shadow-xs"
            >
              {filterState.searchQuery ? (
                <span>Xóa bộ lọc</span>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Tạo phiên Live đầu tiên</span>
                </>
              )}
            </Button>
          </div>
        ) : filterState.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <LivestreamCard
                key={session.id}
                session={session}
                currentUserId={user?.id}
                onViewDetails={(s) => setDetailSession(s)}
                onEnterStudio={handleEnterStudio}
                onEndSession={(s) => setEndingSession(s)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredSessions.map((session) => (
              <LivestreamListItem
                key={session.id}
                session={session}
                currentUserId={user?.id}
                onViewDetails={(s) => setDetailSession(s)}
                onEnterStudio={handleEnterStudio}
                onEndSession={(s) => setEndingSession(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Create Modal */}
      <CreateLivestreamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        channel={myChannel}
        isLoadingChannel={isLoadingChannel}
      />

      {/* 7. Details Modal */}
      <LivestreamDetailModal
        session={detailSession}
        isOpen={Boolean(detailSession)}
        onClose={() => setDetailSession(null)}
        onEnterStudio={handleEnterStudio}
      />

      {/* 8. End Session Confirm Dialog */}
      <EndLivestreamConfirmDialog
        session={endingSession}
        isOpen={Boolean(endingSession)}
        onClose={() => setEndingSession(null)}
        onSuccess={() => {
          if (detailSession?.id === endingSession?.id) {
            setDetailSession(null);
          }
          refetch();
        }}
      />
    </div>
  );
};
