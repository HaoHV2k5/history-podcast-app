import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft,
  Clock,
  Heart,
  ThumbsDown,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  FileText,
  Calendar,
  Video,
  Info,
} from 'lucide-react';
import { creatorStudioApi, BusinessApiError } from '@/services/api/creatorStudio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';

export const CreatorContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentId = id ? parseInt(id, 10) : NaN;

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['creator', 'studio-video', contentId],
    queryFn: () => creatorStudioApi.getVideoDetail(contentId),
    enabled: !isNaN(contentId) && contentId > 0,
    retry: 1,
  });

  const detail = response?.data;

  // Handle invalid ID parameter
  if (isNaN(contentId) || contentId <= 0) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/creator/content')}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Thư viện nội dung</span>
        </Button>

        <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-status-error-text mx-auto" />
          <h2 className="text-base font-bold text-ink">Mã tác phẩm không hợp lệ</h2>
          <p className="text-xs text-muted">Vui lòng chọn tác phẩm từ danh sách thư viện.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 bg-surface-subtle rounded w-48" />
        <div className="aspect-video bg-surface-subtle rounded-xl border border-border" />
        <div className="h-32 bg-surface-subtle rounded-xl border border-border" />
      </div>
    );
  }

  // Error state (404 / 403 / Network / Business error envelope)
  if (isError || !detail || !detail.title) {
    let errorTitle = 'Không thể tải chi tiết tác phẩm';
    let errorDesc =
      'Đã xảy ra lỗi khi truy xuất dữ liệu từ máy chủ. Vui lòng kiểm tra lại kết nối mạng.';

    let errorCode: string | undefined;
    let errorStatus: number | undefined;
    let backendMsg: string | undefined;

    if (error instanceof BusinessApiError) {
      errorCode = error.errorCode;
      errorStatus = error.response?.status;
      backendMsg = error.message;
    } else if (axios.isAxiosError(error)) {
      errorCode = error.response?.data?.errorCode;
      errorStatus = error.response?.status;
      backendMsg = error.response?.data?.message;
    } else if (error instanceof Error) {
      backendMsg = error.message;
    }

    if (errorStatus === 404 || errorCode === 'ERR_1002') {
      errorTitle = 'Không tìm thấy tác phẩm hoặc bạn không có quyền truy cập';
      errorDesc =
        'Tác phẩm này không tồn tại hoặc thuộc sở hữu của kênh khác. Hệ thống Sử Ký thực hiện bảo vệ phân quyền tác giả nghiêm ngặt.';
    } else if (errorStatus === 403 || errorCode === 'ERR_1004') {
      errorTitle = 'Từ chối truy cập (403 Forbidden)';
      errorDesc = 'Bạn cần quyền Nhà sáng tạo (CREATOR) để xem thông tin chi tiết này.';
    } else if (backendMsg) {
      errorDesc = backendMsg;
    }

    return (
      <div className="space-y-6 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/creator/content')}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Thư viện nội dung</span>
        </Button>

        <div className="rounded-xl border border-status-error-text/30 bg-status-error-bg p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-status-error-text mx-auto" />
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-status-error-text">{errorTitle}</h2>
            <p className="text-xs text-status-error-text/90 leading-relaxed">{errorDesc}</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="gap-2 text-xs border-status-error-text/30 text-status-error-text"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs"
            >
              Về Thư viện nội dung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getContentStatusBadge(detail.status);
  const isVideoFile =
    detail.fileUrl &&
    (detail.fileUrl.endsWith('.mp4') ||
      detail.fileUrl.endsWith('.webm') ||
      detail.fileUrl.endsWith('.mov') ||
      detail.fileUrl.includes('/video/'));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Navigation Back & Quick Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/creator/content')}
          className="gap-2 text-xs text-muted hover:text-ink -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Thư viện nội dung</span>
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Mã nội dung: #{detail.contentId}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-7 px-2"
            title="Làm mới"
          >
            <RotateCcw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. Title & Status Header */}
      <div className="border-b border-border pb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {detail.isExclusive && (
            <Badge variant="accent">
              <Sparkles className="h-3 w-3 mr-1" />
              Độc quyền Hội viên VIP
            </Badge>
          )}
          {detail.channelName && (
            <span className="text-xs text-muted flex items-center gap-1">
              <Radio className="h-3.5 w-3.5 text-accent" />
              <span>Kênh: <strong>{detail.channelName}</strong></span>
            </span>
          )}
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink">
          {detail.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Ngày tạo: {formatDateTime(detail.createdAt)}</span>
          </span>
          {detail.durationSeconds && detail.durationSeconds > 0 ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Thời lượng: {formatDuration(detail.durationSeconds)}</span>
            </span>
          ) : null}
          {detail.artifactId && (
            <span className="font-mono text-[11px] text-muted">
              Artifact ID: #{detail.artifactId}
            </span>
          )}
        </div>
      </div>

      {/* 3. Media Player Preview */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-subtle/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-accent" />
            <span>Bản Xem Trước Phương Tiện (Media Preview)</span>
          </span>
          <span className="text-[11px] text-muted font-mono">
            {detail.fileUrl ? 'Media Stream Sẵn Sàng' : 'Chưa có tệp Media'}
          </span>
        </div>

        <div className="p-4 bg-black/95 flex items-center justify-center min-h-[220px]">
          {detail.fileUrl ? (
            isVideoFile ? (
              <video
                controls
                className="w-full max-h-[420px] rounded-lg shadow-sm"
                src={detail.fileUrl}
              >
                Trình duyệt không hỗ trợ phát thẻ video HTML5.
              </video>
            ) : (
              <div className="w-full max-w-lg py-6 space-y-3 text-center">
                <div className="h-12 w-12 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </div>
                <audio controls className="w-full" src={detail.fileUrl}>
                  Trình duyệt không hỗ trợ phát thẻ audio HTML5.
                </audio>
              </div>
            )
          ) : (
            <div className="text-center py-10 space-y-2 text-muted">
              <Video className="h-10 w-10 mx-auto opacity-50" />
              <p className="text-xs text-stone-400">
                Tác phẩm chưa có tệp truyền thông (Media file đang chờ kết xuất hoặc chưa tải lên).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Description & Script Body */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <span>Kịch bản & Nội dung sử liệu</span>
        </h2>
        {detail.description ? (
          <div className="text-xs md:text-sm text-ink leading-relaxed whitespace-pre-wrap font-sans bg-surface-subtle p-4 rounded-lg border border-border">
            {detail.description}
          </div>
        ) : (
          <p className="text-xs text-muted italic">Chưa có nội dung mô tả kịch bản.</p>
        )}
      </div>

      {/* 5. AI Shield & Moderation Review Details */}
      {(detail.aiShieldScore !== null || detail.moderationDecision) && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Thẩm định sử liệu & AI Shield Policy</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* AI Shield Score card */}
            {detail.aiShieldScore !== null && detail.aiShieldScore !== undefined && (
              <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-2">
                <span className="text-muted block font-medium">Điểm số AI Shield</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-ink">
                    {Number(detail.aiShieldScore).toFixed(1)}
                  </span>
                  <span className="text-muted text-xs">/ 100</span>
                  {detail.aiShieldTierLabel && (
                    <Badge variant="outline" className="ml-auto text-[11px]">
                      {detail.aiShieldTierLabel}
                    </Badge>
                  )}
                </div>
                {detail.aiShieldReason && (
                  <p className="text-muted text-[11px] leading-relaxed pt-1 border-t border-border">
                    {detail.aiShieldReason}
                  </p>
                )}
              </div>
            )}

            {/* Admin Moderation card */}
            {detail.moderationDecision && (
              <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-2">
                <span className="text-muted block font-medium">Quyết định Ban Kiểm Duyệt</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      detail.moderationDecision === 'APPROVED'
                        ? 'success'
                        : detail.moderationDecision === 'REJECTED'
                          ? 'error'
                          : 'pending'
                    }
                  >
                    {detail.moderationDecision}
                  </Badge>
                </div>
                {detail.moderationReason && (
                  <p className="text-muted text-[11px] leading-relaxed pt-1 border-t border-border">
                    Lý do / Phản hồi: {detail.moderationReason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Audience Engagement & Comments */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          <span>Tương tác từ Thính giả</span>
        </h2>

        {/* Counter cards */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg border border-border bg-surface-subtle">
            <span className="text-[11px] text-muted block">Lượt thích</span>
            <span className="text-base font-bold text-ink mt-0.5 flex items-center justify-center gap-1">
              <Heart className="h-3.5 w-3.5 text-accent" />
              {detail.likeCount || 0}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-subtle">
            <span className="text-[11px] text-muted block">Lượt không thích</span>
            <span className="text-base font-bold text-muted mt-0.5 flex items-center justify-center gap-1">
              <ThumbsDown className="h-3.5 w-3.5" />
              {detail.dislikeCount || 0}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-subtle">
            <span className="text-[11px] text-muted block">Bình luận</span>
            <span className="text-base font-bold text-ink mt-0.5 flex items-center justify-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-ink" />
              {detail.commentCount || 0}
            </span>
          </div>
        </div>

        {/* Comment list */}
        {detail.comments && detail.comments.length > 0 ? (
          <div className="pt-2 space-y-3 divide-y divide-border">
            <span className="text-xs font-semibold text-ink block">
              Danh sách bình luận ({detail.comments.length})
            </span>
            {detail.comments.map((c) => (
              <div key={c.id} className="pt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span className="font-medium text-ink">{c.userEmail}</span>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-xs text-ink leading-relaxed">{c.textBody}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted text-center py-4 italic">
            Chưa có bình luận nào cho tác phẩm này.
          </p>
        )}
      </div>

      {/* 7. Read-only notice */}
      <div className="p-4 rounded-lg border border-border bg-surface-subtle text-xs text-muted flex items-start gap-2.5">
        <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Lưu ý:</strong> Trang chi tiết tác phẩm ở chế độ Xem chỉ đọc (Read-only) trong
          Milestone 4. Các tính năng chỉnh sửa kịch bản, kết xuất lại hoạt họa AI Shield và xuất bản
          tập podcast mới sẽ được kích hoạt ở Milestone 5.
        </p>
      </div>
    </div>
  );
};
