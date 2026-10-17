import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { channelsApi } from '@/services/api/channels';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { useKycGate } from '@/features/kyc/useKycGate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';

export const CreatorWorkspaceHome: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Content */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Tổng tác phẩm
            </span>
            <div className="p-2 rounded-lg bg-surface-subtle text-ink">
              <Video className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-ink">
              {isLoadingVideos ? '—' : totalVideos}
            </span>
            <span className="text-xs text-muted block mt-1">Video & Audio Podcast</span>
          </div>
        </div>

        {/* Published */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Đã xuất bản
            </span>
            <div className="p-2 rounded-lg bg-status-success-bg text-status-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-status-success-text">
              {isLoadingVideos ? '—' : publishedVideos}
            </span>
            <span className="text-xs text-muted block mt-1">Đang phát công khai</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Chờ kiểm duyệt
            </span>
            <div className="p-2 rounded-lg bg-status-pending-bg text-status-pending-text">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-status-pending-text">
              {isLoadingVideos ? '—' : pendingVideos}
            </span>
            <span className="text-xs text-muted block mt-1">Đang rà soát sử liệu</span>
          </div>
        </div>

        {/* Drafts & Ready to Submit */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Bản nháp & Chờ gửi
            </span>
            <div className="p-2 rounded-lg bg-surface-subtle text-muted">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-ink">
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
              <span className="text-lg font-bold text-ink">{totalLikes.toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-subtle text-ink">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs text-muted block">Bình luận từ thính giả</span>
              <span className="text-lg font-bold text-ink">{totalComments.toLocaleString('vi-VN')}</span>
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
            className="gap-1.5 text-xs"
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
                Kênh chưa có tác phẩm podcast hoặc video nào được khởi tạo. Bộ công cụ tạo kịch bản
                sử liệu AI và dựng video bảng trắng sẽ sẵn sàng ở giai đoạn tiếp theo (Milestone 5).
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator/content')}
                className="gap-2 text-xs"
              >
                <span>Xem Thư viện nội dung</span>
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
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-11 w-11 rounded-lg bg-surface-subtle border border-border flex items-center justify-center shrink-0 text-accent">
                      <Play className="h-4 w-4 fill-current opacity-80" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/creator/content/${item.contentId}`}
                          className="text-xs font-semibold text-ink hover:text-accent truncate block"
                        >
                          {item.title}
                        </Link>
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
    </div>
  );
};
