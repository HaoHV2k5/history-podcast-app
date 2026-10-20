import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Radio,
  PlusCircle,
  RefreshCw,
  Eye,
  Tv,
  AlertCircle,
  Layers,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { livestreamApi } from '@/services/api/livestream';
import { channelsApi } from '@/services/api/channels';
import { useAuthStore } from '@/store/authStore';
import { LivestreamSession } from '@/types/livestream';
import { ChannelItem } from '@/types/channel';
import {
  normalizeLivestreamList,
  filterLivestreamsByStatus,
  formatLivestreamViewerCount,
} from './livestreamLogic';
import { LivestreamCard } from './components/LivestreamCard';
import { CreateLivestreamModal } from './components/CreateLivestreamModal';
import { LivestreamDetailModal } from './components/LivestreamDetailModal';
import { EndLivestreamConfirmDialog } from './components/EndLivestreamConfirmDialog';

type StatusTab = 'ALL' | 'LIVE' | 'ENDED';

export const CreatorLivestreamPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Filter tab state
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<LivestreamSession | null>(null);
  const [endingSession, setEndingSession] = useState<LivestreamSession | null>(null);

  // Post-creation banner state
  const [justCreatedSession, setJustCreatedSession] = useState<LivestreamSession | null>(null);

  // 1. Fetch current creator channel
  const {
    data: channelRes,
    isLoading: isLoadingChannel,
  } = useQuery({
    queryKey: ['creator', 'my-channel'],
    queryFn: async (): Promise<ChannelItem | null> => {
      try {
        const res = await channelsApi.getMyChannel();
        return res.data;
      } catch {
        return null;
      }
    },
  });
  const myChannel = channelRes ?? null;

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

  const allSessions = normalizeLivestreamList(livestreamsRes);
  const filteredSessions = filterLivestreamsByStatus(allSessions, activeTab);

  // Metrics counts
  const liveCount = allSessions.filter((s) => s.status === 'LIVE').length;
  const endedCount = allSessions.filter((s) => s.status === 'ENDED').length;
  const totalViewers = allSessions
    .filter((s) => s.status === 'LIVE')
    .reduce((sum, s) => sum + (s.viewerCount || 0), 0);

  const handleEnterStudio = (session: LivestreamSession) => {
    navigate(`/creator/livestream/${session.id}/studio`);
  };

  const handleCreateSuccess = (session: LivestreamSession) => {
    setIsCreateModalOpen(false);
    setJustCreatedSession(session);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Masthead / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-accent uppercase tracking-wider">
              PHÂN HỆ SẢN XUẤT
            </span>
            <span className="text-muted">•</span>
            <span className="text-xs text-muted">AGORA RTC WEB v4.24.9</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Quản lý Phát trực tiếp (Livestream Hub)
          </h1>
          <p className="text-xs text-muted max-w-2xl leading-relaxed">
            Khởi tạo và điều phối các buổi đàm đạo podcast lịch sử trực tiếp, tương tác thời gian thực với cộng đồng thính giả trên nền tảng Sử Ký.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs h-9"
            title="Làm mới danh sách phiên livestream"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-accent' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 text-xs h-9 bg-accent hover:bg-accent-hover text-canvas font-semibold shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo phiên Live mới</span>
          </Button>
        </div>
      </div>

      {/* Just-created Success Banner */}
      {justCreatedSession && (
        <div className="relative rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs text-emerald-900 shadow-xs">
          <button
            type="button"
            onClick={() => setJustCreatedSession(null)}
            className="absolute top-3 right-3 text-emerald-700 hover:text-emerald-900 p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1 pr-6">
              <p className="font-bold text-sm text-emerald-950">
                Khởi tạo thành công phiên phát trực tiếp: &ldquo;{justCreatedSession.title}&rdquo;!
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Phiên phát sóng hiện đang ở trạng thái <strong className="font-bold text-rose-700">LIVE</strong> trên máy chủ. Bạn có thể vào Studio ngay bây giờ để bật Camera/Microphone và bắt đầu phát sóng trực tiếp.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                  onClick={() => handleEnterStudio(justCreatedSession)}
                >
                  <Tv className="h-3.5 w-3.5 mr-1" />
                  Vào Studio phát sóng
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-emerald-800 hover:bg-emerald-100"
                  onClick={() => setDetailSession(justCreatedSession)}
                >
                  Xem chi tiết phiên
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Đang phát sóng
            </span>
            <p className="mt-1 font-serif text-2xl font-bold text-rose-600 flex items-center gap-2">
              {liveCount}
              {liveCount > 0 && (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Radio className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Thính giả trực tuyến
            </span>
            <p className="mt-1 font-serif text-2xl font-bold text-ink">
              {formatLivestreamViewerCount(totalViewers)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Eye className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Tổng số phiên live
            </span>
            <p className="mt-1 font-serif text-2xl font-bold text-ink">
              {allSessions.length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-subtle text-muted">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink hover:border-border'
            }`}
          >
            <span>Tất cả</span>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] text-muted">
              {allSessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIVE')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'LIVE'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-muted hover:text-ink hover:border-border'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${liveCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-muted'}`} />
              <span>Đang trực tiếp</span>
            </span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              {liveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ENDED')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'ENDED'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink hover:border-border'
            }`}
          >
            <span>Đã kết thúc</span>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] text-muted">
              {endedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingSessions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3 animate-pulse">
              <div className="aspect-video w-full rounded-lg bg-surface-subtle" />
              <div className="h-4 w-3/4 bg-surface-subtle rounded" />
              <div className="h-3 w-1/2 bg-surface-subtle rounded" />
              <div className="h-8 w-full bg-surface-subtle rounded mt-4" />
            </div>
          ))}
        </div>
      ) : isSessionsError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <h3 className="font-serif text-base font-bold text-rose-900">
            Không thể tải danh sách phiên livestream
          </h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            {(sessionsError as Error)?.message || 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 text-rose-800 hover:bg-rose-100"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle text-muted mx-auto">
            <Radio className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-ink">
              {activeTab === 'LIVE'
                ? 'Hiện không có phiên phát sóng trực tiếp nào'
                : activeTab === 'ENDED'
                ? 'Chưa có phiên livestream nào đã kết thúc'
                : 'Chưa có phiên phát sóng trực tiếp nào'}
            </h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              {activeTab === 'LIVE'
                ? 'Bắt đầu một buổi phát sóng mới ngay bây giờ để giao lưu cùng thính giả podcast của bạn.'
                : 'Các phiên live sau khi kết thúc sẽ được lưu trữ lịch sử phát sóng tại đây.'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 bg-accent hover:bg-accent-hover text-canvas font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo phiên Live đầu tiên</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
      )}

      {/* Create Modal */}
      <CreateLivestreamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        channel={myChannel}
        isLoadingChannel={isLoadingChannel}
      />

      {/* Details Modal */}
      <LivestreamDetailModal
        session={detailSession}
        isOpen={Boolean(detailSession)}
        onClose={() => setDetailSession(null)}
        onEnterStudio={handleEnterStudio}
      />

      {/* End Session Confirm Dialog */}
      <EndLivestreamConfirmDialog
        session={endingSession}
        isOpen={Boolean(endingSession)}
        onClose={() => setEndingSession(null)}
        onSuccess={() => {
          if (detailSession?.id === endingSession?.id) {
            setDetailSession(null);
          }
        }}
      />
    </div>
  );
};
