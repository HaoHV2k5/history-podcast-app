import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  PlusCircle,
  UserCheck,
  Radio,
  ArrowRight,
  Sparkles,
  Clock,
  Heart,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  FileText,
  Play,
  Layers,
  Volume2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { channelsApi } from '@/services/api/channels';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { useKycGate } from '@/features/kyc/useKycGate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CreatorVideoItem } from '@/types/creatorContent';
import { formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';
import { gsap } from 'gsap';
import { isReducedMotion, MOTION_CONFIG } from '@/utils/motion';

export const CreatorWorkspaceHome: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const kpiGridRef = React.useRef<HTMLDivElement>(null);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current || !kpiGridRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        kpiGridRef.current,
        { opacity: 0, y: MOTION_CONFIG.distance.md },
        {
          opacity: 1,
          y: 0,
          duration: MOTION_CONFIG.duration.dashboardCards,
          ease: MOTION_CONFIG.ease,
          clearProps: 'transform,opacity',
        }
      );
    }, kpiGridRef);

    return () => ctx.revert();
  }, []);

  // 1. Fetch channel identity
  const { data: channelRes, isLoading: isLoadingChannel } = useQuery({
    queryKey: ['creator', 'my-channel'],
    queryFn: () => channelsApi.getMyChannel(),
    retry: 1,
  });
  const channel = channelRes?.data;

  // 2. Fetch KYC status
  const {
    status: kycStatus,
    isApproved: isKycApproved,
    isPending: isKycPending,
    isRejected: isKycRejected,
    isLoading: isLoadingKyc,
  } = useKycGate();

  // 3. Fetch Creator videos
  const {
    data: videosRes,
    isLoading: isLoadingVideos,
    isError: isVideosError,
  } = useQuery({
    queryKey: ['creator', 'studio-videos', 'dashboard'],
    queryFn: () => creatorStudioApi.getVideos({ sortBy: 'createdAt', sortDir: 'desc' }),
    enabled: isKycApproved,
    // Live polling every 15s when videos are pending review
    refetchInterval: (query) => {
      const vids = Array.isArray(query.state.data?.data) ? query.state.data.data : [];
      const hasPending = vids.some(
        (v) => v.status === 'PENDING_REVIEW' || v.status === 'PENDING'
      );
      return hasPending ? 15000 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const videos = Array.isArray(videosRes?.data) ? videosRes.data : [];

  // Quick Watch Video Modal State
  const [playingVideo, setPlayingVideo] = React.useState<CreatorVideoItem | null>(null);
  const [mediaError, setMediaError] = React.useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

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

  // Derived real metrics
  const totalVideos = videos.length;
  const publishedVideos = videos.filter((v) => v.status === 'PUBLISHED').length;
  const pendingVideos = videos.filter(
    (v) => v.status === 'PENDING_REVIEW' || v.status === 'PENDING'
  ).length;
  const completedVideos = videos.filter((v) => v.status === 'COMPLETED').length;
  const draftVideos = videos.filter((v) => v.status === 'DRAFT').length;
  const rejectedVideos = videos.filter((v) => v.status === 'REJECTED').length;

  const totalLikes = videos.reduce((acc, v) => acc + (v.likeCount || 0), 0);
  const totalComments = videos.reduce((acc, v) => acc + (v.commentCount || 0), 0);

  // Top 4 recent videos
  const recentVideos = videos.slice(0, 4);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* 1. Header Masthead */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Không Gian Sáng Tạo Sử Ký</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink">
            {channel?.name ? channel.name : 'Bàn Làm Việc Nhà Sáng Tạo'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Xin chào <strong className="text-ink font-medium">{user?.email}</strong>. Quản lý tác
            phẩm podcast, theo dõi trạng thái kiểm duyệt và xuất bản sử liệu.
          </p>
        </div>

        {/* Quick Channel Pill */}
        {channel ? (
          <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl border border-border bg-surface shadow-xs">
            {channel.avatarUrl ? (
              <img
                src={channel.avatarUrl}
                alt={channel.name}
                className="h-10 w-10 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                <Radio className="h-5 w-5" />
              </div>
            )}
            <div className="text-left">
              <span className="text-xs font-semibold text-ink block truncate max-w-[160px]">
                {channel.name}
              </span>
              <span className="text-[10px] text-status-success-text font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-success-text" />
                Kênh hoạt động
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/channel')}
              className="text-xs ml-2 h-7"
            >
              Quản lý
            </Button>
          </div>
        ) : null}
      </div>

      {/* 2. Onboarding Status Alerts (if KYC or Channel is not yet ready) */}
      {!isKycApproved && !isLoadingKyc && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent-soft text-accent shrink-0 mt-0.5">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {isKycPending
                    ? 'Hồ sơ định danh KYC đang được thẩm định'
                    : isKycRejected
                      ? 'Hồ sơ định danh KYC cần được cập nhật lại'
                      : 'Hoàn tất xác thực KYC để mở khóa toàn bộ tính năng Studio'}
                </h3>
                <Badge
                  variant={
                    isKycPending ? 'pending' : isKycRejected ? 'error' : 'default'
                  }
                >
                  {kycStatus || 'CHƯA GỬI'}
                </Badge>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isKycPending
                  ? 'Ban Biên tập Sử Ký đang xét duyệt hồ sơ của bạn (thời gian xử lý dự kiến: 24–48 giờ làm việc). Ngay sau khi được phê duyệt, bạn có thể khởi tạo kênh và xuất bản podcast.'
                  : isKycRejected
                    ? 'Hồ sơ KYC của bạn chưa đạt yêu cầu. Vui lòng rà soát lại thông tin định danh và tài khoản thanh toán để nộp lại.'
                    : 'Theo quy định nền tảng, Nhà sáng tạo cần hoàn tất xác thực thông tin định danh tác giả và tài khoản thụ hưởng trước khi khởi tạo kênh và xuất bản nội dung.'}
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  onClick={() => navigate('/creator/kyc')}
                  className="gap-2 text-xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>
                    {isKycPending
                      ? 'Xem chi tiết hồ sơ'
                      : isKycRejected
                        ? 'Cập nhật lại hồ sơ KYC'
                        : 'Bắt đầu xác thực KYC'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isKycApproved && !channel && !isLoadingChannel && (
        <div className="rounded-xl border border-accent/20 bg-accent-soft/30 p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent text-canvas shrink-0 mt-0.5">
              <Radio className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  Bước tiếp theo: Thiết lập Kênh Podcast Sử Ký chính thức
                </h3>
                <Badge variant="accent">Yêu cầu</Badge>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Hồ sơ tác giả của bạn đã được phê duyệt! Hãy đặt tên kênh, viết mô tả và tải lên ảnh
                đại diện/ảnh bìa để nhận diện thương hiệu với thính giả.
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  onClick={() => navigate('/creator/channel')}
                  className="gap-2 text-xs"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Khởi tạo Kênh Podcast</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Review Alert Notice (if any) */}
      {pendingVideos > 0 && (
        <div className="rounded-xl border border-status-pending-text/30 bg-status-pending-bg p-4 flex items-center justify-between gap-3 text-xs text-status-pending-text shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 animate-pulse" />
            <span>
              Kênh có <strong>{pendingVideos}</strong> tác phẩm đang trong hàng đợi kiểm duyệt của Ban biên tập. Hệ thống đang tự động thăm dò cập nhật kết quả.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/creator/content?status=PENDING_REVIEW')}
            className="text-xs h-7 border-status-pending-text/40 text-status-pending-text hover:bg-status-pending-bg/80"
          >
            Theo dõi kiểm duyệt
          </Button>
        </div>
      )}

      {/* Rejected Alert Notice (if any) */}
      {rejectedVideos > 0 && (
        <div className="rounded-xl border border-status-error-text/30 bg-status-error-bg p-4 flex items-center justify-between gap-3 text-xs text-status-error-text">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Kênh có <strong>{rejectedVideos}</strong> tác phẩm bị từ chối kiểm duyệt. Vui lòng kiểm
              tra lý do và cập nhật kịch bản.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/creator/content?status=REJECTED')}
            className="text-xs h-7 border-status-error-text/40 text-status-error-text"
          >
            Xem danh sách
          </Button>
        </div>
      )}

      {/* 3. Real Verified Metrics Cards */}
      <div ref={kpiGridRef} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* Total Content */}
        <div className="group relative rounded-xl border border-border bg-surface p-5 shadow-subtle hover:-translate-y-1 hover:border-accent/40 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-accent/70 group-hover:bg-accent transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Tổng tác phẩm
            </span>
            <div className="p-2 rounded-lg bg-surface-subtle text-ink shadow-2xs group-hover:scale-105 transition-transform">
              <Video className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-ink tracking-tight">
              {isLoadingVideos ? '—' : totalVideos}
            </span>
            <span className="text-xs text-muted block mt-1">Video & Audio Podcast</span>
          </div>
        </div>

        {/* Published */}
        <div className="group relative rounded-xl border border-border bg-surface p-5 shadow-subtle hover:-translate-y-1 hover:border-status-success-text/40 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-status-success-text/70 group-hover:bg-status-success-text transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Đã xuất bản
            </span>
            <div className="p-2 rounded-lg bg-status-success-bg text-status-success-text shadow-2xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-status-success-text tracking-tight">
              {isLoadingVideos ? '—' : publishedVideos}
            </span>
            <span className="text-xs text-muted block mt-1">Đang phát công khai</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="group relative rounded-xl border border-border bg-surface p-5 shadow-subtle hover:-translate-y-1 hover:border-status-pending-text/40 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-status-pending-text/70 group-hover:bg-status-pending-text transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Chờ kiểm duyệt
            </span>
            <div className="p-2 rounded-lg bg-status-pending-bg text-status-pending-text shadow-2xs group-hover:scale-105 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-status-pending-text tracking-tight">
              {isLoadingVideos ? '—' : pendingVideos}
            </span>
            <span className="text-xs text-muted block mt-1">Đang rà soát sử liệu</span>
          </div>
        </div>

        {/* Drafts & Ready to Submit */}
        <div className="group relative rounded-xl border border-border bg-surface p-5 shadow-subtle hover:-translate-y-1 hover:border-border-line hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-muted/40 group-hover:bg-muted transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Bản nháp & Chờ gửi
            </span>
            <div className="p-2 rounded-lg bg-surface-subtle text-muted shadow-2xs group-hover:scale-105 transition-transform">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-ink tracking-tight">
              {isLoadingVideos ? '—' : draftVideos + completedVideos}
            </span>
            <span className="text-xs text-muted block mt-1">
              {completedVideos > 0
                ? `${completedVideos} chờ gửi duyệt, ${draftVideos} bản nháp`
                : 'Đang biên soạn / Render'}
            </span>
          </div>
        </div>
      </div>

      {/* Engagement summary (if any likes or comments exist) */}
      {(totalLikes > 0 || totalComments > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-soft text-accent">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs text-muted block">Lượt yêu thích tích lũy</span>
              <span className="text-lg font-bold font-mono tabular-nums text-ink">{totalLikes.toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-subtle text-ink">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs text-muted block">Bình luận từ thính giả</span>
              <span className="text-lg font-bold font-mono tabular-nums text-ink">{totalComments.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Recent Content Section */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink font-serif">Tác phẩm gần đây</h2>
            <p className="text-xs text-muted mt-0.5">
              Các nội dung podcast và video hoạt họa mới nhất của kênh
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/creator/content')}
            className="gap-1.5 text-xs min-h-[36px]"
          >
            <span>Đến Thư viện nội dung</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Loading state */}
        {isLoadingVideos && (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-16 bg-surface-subtle rounded-lg" />
            <div className="h-16 bg-surface-subtle rounded-lg" />
          </div>
        )}

        {/* Error state */}
        {isVideosError && (
          <div className="p-4 rounded-lg border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Không thể tải danh sách tác phẩm lúc này. Vui lòng thử lại sau.</span>
          </div>
        )}

        {/* Empty library state */}
        {!isLoadingVideos && !isVideosError && recentVideos.length === 0 && (
          <div className="py-10 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-surface-subtle border border-border mx-auto flex items-center justify-center text-muted">
              <Video className="h-6 w-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-semibold text-ink">Thư viện kênh hiện đang trống</h3>
              <p className="text-xs text-muted leading-relaxed">
                Kênh chưa có tác phẩm podcast hoặc video nào được khởi tạo. Hãy sử dụng Xưởng Sáng Tác
                Sử Ký AI để bắt đầu biên soạn kịch bản và xuất bản tác phẩm podcast đầu tiên.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator/create')}
                className="gap-2 text-xs min-h-[40px] px-4 hover:border-accent hover:text-accent"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Bắt đầu sáng tác ngay</span>
              </Button>
            </div>
          </div>
        )}

        {/* Video list */}
        {!isLoadingVideos && recentVideos.length > 0 && (
          <div className="divide-y divide-border">
            {recentVideos.map((item) => {
              const statusBadge = getContentStatusBadge(item.status);
              return (
                <div
                  key={item.contentId}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F5F1] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleWatchVideo(item)}
                      title={`Xem video: ${item.title}`}
                      className="h-11 w-11 rounded-lg bg-surface-subtle border border-border flex items-center justify-center shrink-0 text-accent hover:bg-accent hover:text-white hover:scale-105 transition-all cursor-pointer group/btn"
                    >
                      <Play className="h-4 w-4 fill-current opacity-80 group-hover/btn:opacity-100" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleWatchVideo(item)}
                          title={`Xem video: ${item.title}`}
                          className="text-xs font-semibold text-ink hover:text-accent truncate block text-left hover:underline cursor-pointer"
                        >
                          {item.title}
                        </button>
                        {item.isExclusive && (
                          <Badge variant="accent" size="sm">
                            VIP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted mt-1">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>•</span>
                        <span>{formatDuration(item.durationSeconds)}</span>
                        {item.likeCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {item.likeCount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/creator/content/${item.contentId}`)}
                      className="text-xs h-7 px-2"
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Studio Modules & Roadmap Entry Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Content Library */}
        <div
          onClick={() => navigate('/creator/content')}
          className="rounded-xl border border-border bg-surface p-5 shadow-xs hover:border-accent/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-surface-subtle text-accent">
                <Video className="h-5 w-5" />
              </div>
              <Badge variant="success">Hoạt động</Badge>
            </div>
            <h3 className="text-sm font-bold text-ink">Thư viện nội dung</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Quản lý toàn bộ danh mục podcast, lọc theo trạng thái duyệt và xem thông số tương tác.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-accent">
            <span>Truy cập Thư viện</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Module 2: Channel Management */}
        <div
          onClick={() => navigate('/creator/channel')}
          className="rounded-xl border border-border bg-surface p-5 shadow-xs hover:border-accent/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-surface-subtle text-accent">
                <Radio className="h-5 w-5" />
              </div>
              <Badge variant="success">Hoạt động</Badge>
            </div>
            <h3 className="text-sm font-bold text-ink">Hồ sơ & Kênh Podcast</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Cập nhật tên kênh, thông tin giới thiệu, ảnh bìa và nhận diện thương hiệu tác giả.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-accent">
            <span>Quản lý Kênh</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Module 3: Studio Creator Tooling (Milestone 5) */}
        <div
          onClick={() => navigate('/creator/create')}
          className="rounded-xl border border-border bg-surface p-5 shadow-xs hover:border-accent/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-surface-subtle text-accent">
                <PlusCircle className="h-5 w-5" />
              </div>
              <Badge variant="success">Hoạt động</Badge>
            </div>
            <h3 className="text-sm font-bold text-ink">Xưởng Sáng Tác Sử Ký AI</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Biên kịch từ kho tư liệu lịch sử Đại Việt Sử Ký Toàn Thư, đối chiếu RAG và chọn giọng đọc
              thuyết minh.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-accent">
            <span>Truy cập Xưởng Dựng</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Direct Video Player Modal */}
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
                        <CheckCircle2 className="h-3.5 w-3.5" />
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
