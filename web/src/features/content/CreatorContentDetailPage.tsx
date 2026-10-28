import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Send,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Download,
  Film,
  X,
  Volume2,
  Pause,
  UploadCloud,
  Wrench,
  Image as ImageIcon,
} from 'lucide-react';
import { creatorStudioApi, BusinessApiError } from '@/services/api/creatorStudio';
import { CreatorSentencePatchItem } from '@/types/creatorStudio';
import { SceneImageUploadDropzone } from '../studio/components/SceneImageUploadDropzone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AiShieldBadge } from '@/features/moderation/components/AiShieldBadge';
import { formatDateTime, formatDate, formatDuration, getContentStatusBadge } from '@/utils/formatters';
import { resolveVideoThumbnail } from '../studio/creatorStudioUtils';

export const CreatorContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contentId = id ? parseInt(id, 10) : NaN;

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Metadata Dialog State
  const [editOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsExclusive, setEditIsExclusive] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Submit for Review Dialog State
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitConsent, setSubmitConsent] = useState(false);

  // Visibility Toggle Dialog State
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [targetHidden, setTargetHidden] = useState(false);

  // Media playback fallback
  const [mediaError, setMediaError] = useState(false);

  // Thumbnail Upload Modal State
  const [thumbnailOpen, setThumbnailOpen] = useState(false);
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  // Smart Script Patching Modal State
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [editedSentences, setEditedSentences] = useState<Record<number, string>>({});
  const [patchCoverFile, setPatchCoverFile] = useState<File | null>(null);
  const [patchCoverPreview, setPatchCoverPreview] = useState<string | null>(null);
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const sentenceAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Query Video Detail from backend
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
    // Live polling every 8s when video is pending review
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status === 'PENDING_REVIEW' ? 8000 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const detail = response?.data;

  // Media URL resolver using configured API base URL (no hardcoded localhost:8080)
  const resolveMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Mutation: Submit for Review & AI Shield
  const submitMutation = useMutation({
    mutationFn: () => creatorStudioApi.submitVideoForPublish(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
      setSubmitOpen(false);
      setSubmitConsent(false);
      setFeedback({
        type: 'success',
        message: 'Đã gửi video kiểm duyệt thành công! Hệ thống AI Shield đã phân tích nội dung và video hiện đang trong hàng đợi Admin xem xét.',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Có lỗi xảy ra khi gửi video kiểm duyệt.';
      if (err instanceof BusinessApiError) {
        msg = err.message;
      } else if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({ type: 'error', message: msg });
    },
  });

  // Mutation: Update Video Metadata
  const updateMutation = useMutation({
    mutationFn: (payload: { title: string; description?: string; isExclusive?: boolean }) =>
      creatorStudioApi.updateVideo(contentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      setEditDialogOpen(false);
      setEditError(null);
      setFeedback({
        type: 'success',
        message: 'Cập nhật thông tin tác phẩm thành công!',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể cập nhật thông tin tác phẩm.';
      if (err instanceof BusinessApiError) {
        msg = err.message;
      } else if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setEditError(msg);
    },
  });

  // Mutation: Toggle Visibility (HIDDEN <-> PUBLISHED)
  const visibilityMutation = useMutation({
    mutationFn: (hidden: boolean) => creatorStudioApi.updateVisibility(contentId, hidden),
    onSuccess: (_, hidden) => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
      setVisibilityOpen(false);
      setFeedback({
        type: 'success',
        message: hidden ? 'Đã tạm ẩn video khỏi danh mục công khai.' : 'Đã công khai video trên hệ thống Sử Ký.',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể thay đổi trạng thái hiển thị của video.';
      if (err instanceof BusinessApiError) {
        msg = err.message;
      } else if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({ type: 'error', message: msg });
    },
  });

  // Query Podcast Sentences (active when Smart Patching modal is opened)
  const {
    data: sentencesResponse,
    isLoading: isLoadingSentences,
    refetch: refetchSentences,
  } = useQuery({
    queryKey: ['creator', 'podcast-sentences', contentId],
    queryFn: () => creatorStudioApi.getPodcastSentences(contentId),
    enabled: patchModalOpen && !isNaN(contentId) && contentId > 0,
  });

  const podcastSentences = sentencesResponse?.data?.sentences || [];

  // Mutation: Upload custom Thumbnail poster
  const uploadThumbnailMutation = useMutation({
    mutationFn: (file: File) => creatorStudioApi.uploadVideoThumbnail(contentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      setThumbnailOpen(false);
      setSelectedThumbFile(null);
      setThumbPreviewUrl(null);
      setFeedback({
        type: 'success',
        message: 'Cập nhật ảnh Thumbnail Poster thành công!',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể tải ảnh Thumbnail lên máy chủ.';
      if (err instanceof BusinessApiError) {
        msg = err.message;
      } else if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({ type: 'error', message: msg });
    },
  });

  // Mutation: Smart Patch Podcast (< 10s)
  const patchPodcastMutation = useMutation({
    mutationFn: async () => {
      // Build patch items
      const patches: CreatorSentencePatchItem[] = [];
      Object.entries(editedSentences).forEach(([idxStr, text]) => {
        const idx = parseInt(idxStr, 10);
        if (text && text.trim().length > 0) {
          patches.push({
            index: idx,
            text: text.trim(),
            reRecord: true,
          });
        }
      });

      let coverUrl: string | undefined = undefined;
      if (patchCoverFile) {
        const upRes = await creatorStudioApi.uploadSceneImage(patchCoverFile);
        coverUrl = upRes.data?.imageUrl;
      }

      return creatorStudioApi.patchPodcast(contentId, {
        patches,
        coverImage: coverUrl,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      setPatchModalOpen(false);
      setEditedSentences({});
      setPatchCoverFile(null);
      setPatchCoverPreview(null);
      if (sentenceAudioRef.current) {
        sentenceAudioRef.current.pause();
      }
      setPlayingSentenceIdx(null);
      setFeedback({
        type: 'success',
        message: `Đã vá kịch bản và xuất bản phiên bản mới (v${res.data?.version || 2}) thành công trong < 10 giây! Bản v1 cũ đang chiếu vẫn tiếp tục phát sóng bình thường.`,
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể vá video podcast.';
      if (err instanceof BusinessApiError) {
        msg = err.message;
      } else if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({ type: 'error', message: msg });
    },
  });

  const handlePlaySentenceAudio = (audioUrl: string | null | undefined, index: number) => {
    if (!audioUrl) return;
    if (playingSentenceIdx === index) {
      if (sentenceAudioRef.current) {
        sentenceAudioRef.current.pause();
      }
      setPlayingSentenceIdx(null);
      return;
    }

    if (sentenceAudioRef.current) {
      sentenceAudioRef.current.pause();
    }

    const fullUrl = resolveMediaUrl(audioUrl);
    const audio = new Audio(fullUrl);
    sentenceAudioRef.current = audio;
    setPlayingSentenceIdx(index);
    audio.play().catch((err) => {
      console.warn('Audio sentence play failed:', err);
      setPlayingSentenceIdx(null);
    });
    audio.onended = () => {
      setPlayingSentenceIdx(null);
    };
    audio.onerror = () => {
      setPlayingSentenceIdx(null);
    };
  };

  // Open Edit Dialog & seed initial values
  const handleOpenEdit = () => {
    if (!detail) return;
    setEditTitle(detail.title || '');
    setEditDescription(detail.description || '');
    setEditIsExclusive(Boolean(detail.isExclusive));
    setEditError(null);
    setEditDialogOpen(true);
  };

  // Submit edit form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Tiêu đề tác phẩm không được để trống.');
      return;
    }
    setEditError(null);
    updateMutation.mutate({
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      isExclusive: editIsExclusive,
    });
  };

  // Open Visibility Dialog
  const handleOpenVisibility = (hidden: boolean) => {
    setTargetHidden(hidden);
    setVisibilityOpen(true);
  };

  // Invalid ID parameter
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
  const mediaUrl = resolveMediaUrl(detail.fileUrl);
  const isVideoFile =
    Boolean(mediaUrl) &&
    (mediaUrl.endsWith('.mp4') ||
      mediaUrl.endsWith('.webm') ||
      mediaUrl.endsWith('.mov') ||
      mediaUrl.includes('/video/') ||
      mediaUrl.includes('/outputs/'));

  // Eligibility for Submission
  const isEligibleForReview =
    (detail.status === 'COMPLETED' || detail.status === 'REJECTED') &&
    Boolean(detail.fileUrl && detail.fileUrl.trim().length > 0);

  const canEditMetadata =
    detail.status === 'COMPLETED' ||
    detail.status === 'REJECTED' ||
    detail.status === 'HIDDEN' ||
    detail.status === 'PUBLISHED';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Feedback Toast / Alert Bar */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'border-status-success-text/30 bg-status-success-bg text-status-success-text'
              : 'border-status-error-text/30 bg-status-error-bg text-status-error-text'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-status-success-text" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-status-error-text" />
            )}
            <p className="leading-relaxed font-medium">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-70 p-0.5"
            title="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
          {detail.version && detail.version > 1 && (
            <Badge variant="accent" className="font-mono text-xs">
              Phiên bản: v{detail.version}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-7 px-2"
            title="Làm mới dữ liệu"
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
              <span>
                Kênh: <strong>{detail.channelName}</strong>
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink flex-1">
            {detail.title}
          </h1>

          {/* Quick Edit Action */}
          {canEditMetadata && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="text-xs gap-1.5 shrink-0"
            >
              <Edit3 className="h-3.5 w-3.5 text-accent" />
              <span>Chỉnh sửa thông tin</span>
            </Button>
          )}
        </div>

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

      {/* 3. Lifecycle & Publication Workflow Action Banner */}
      <div className="rounded-xl border p-5 shadow-xs transition-all">
        {/* State: COMPLETED -> Ready for Review */}
        {detail.status === 'COMPLETED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink">
                  Tác phẩm đã kết xuất xong — Sẵn sàng gửi kiểm duyệt xuất bản
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Tệp video/âm thanh đã sẵn sàng. Bạn có thể kiểm tra kịch bản và nghe thử bên dưới.
                  Khi gửi kiểm duyệt, hệ thống AI Shield sẽ tự động thẩm định tính xác thực lịch sử
                  và đưa tác phẩm vào hàng đợi để Quản trị viên (Admin) phê duyệt.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-border">
              <Button
                size="sm"
                onClick={() => setSubmitOpen(true)}
                disabled={!isEligibleForReview || submitMutation.isPending}
                className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Gửi kiểm duyệt xuất bản</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="text-xs gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa thông tin</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                  setThumbnailOpen(true);
                }}
                className="text-xs gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5 text-accent" />
                <span>Đổi Thumbnail Poster</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedSentences({});
                  setPatchCoverFile(null);
                  setPatchCoverPreview(null);
                  setPatchModalOpen(true);
                }}
                className="text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Vá Kịch Bản Siêu Tốc (&lt; 10s)</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: PENDING_REVIEW -> Under Moderation */}
        {detail.status === 'PENDING_REVIEW' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-status-pending-bg text-status-pending-text flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">
                    Đang trong hàng đợi kiểm duyệt của Ban biên tập
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-pending-bg border border-status-pending-text/30 text-[10px] font-medium text-status-pending-text">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-pending-text animate-ping" />
                    <span>Tự động theo dõi quyết định (8s)</span>
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Tác phẩm đã vượt qua thẩm định AI Shield sơ bộ và đang chờ Quản trị viên (Admin)
                  xem xét phê duyệt. Hệ thống đang tự động cập nhật kết quả theo thời gian thực — giao
                  diện sẽ tự động chuyển trạng thái ngay khi có quyết định chính thức.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border text-[11px] text-muted">
              <span>Đang mở chế độ thăm dò tự động (Polling)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-7 px-2.5 text-xs gap-1.5 text-muted hover:text-ink cursor-pointer"
                title="Kiểm tra trạng thái ngay từ máy chủ"
              >
                <RotateCcw className={`h-3 w-3 ${isFetching ? 'animate-spin text-accent' : ''}`} />
                <span>Kiểm tra ngay</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: REJECTED -> Action Required */}
        {detail.status === 'REJECTED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-status-error-bg text-status-error-text flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-status-error-text">
                  Tác phẩm bị từ chối phê duyệt bởi Ban biên tập
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Quản trị viên đã xem xét kết quả AI Shield và từ chối phê duyệt tác phẩm này với
                  lý do dưới đây. Vui lòng rà soát lại thông tin hoặc kịch bản trước khi gửi thẩm định lại.
                </p>

                {/* Prominent Rejection Reason Box */}
                {detail.moderationReason && (
                  <div className="mt-2 p-3 rounded-lg border border-status-error-text/30 bg-status-error-bg text-xs text-status-error-text font-medium leading-relaxed">
                    <strong>Lý do từ chối:</strong> {detail.moderationReason}
                  </div>
                )}

                <div className="mt-2 p-2.5 rounded-lg border border-border bg-surface-subtle text-[11px] text-muted space-y-1">
                  <p>
                    <strong>Lưu ý:</strong> Chỉnh sửa tiêu đề/mô tả chỉ cập nhật thông tin hiển thị bên ngoài. Nếu lý do từ chối liên quan đến giọng đọc, hình ảnh hoặc sai lệch sử liệu trong video đã kết xuất, việc chỉnh sửa metadata sẽ không thể khắc phục được. Bạn cần quay lại <strong>Creator Studio</strong> để chỉnh sửa kịch bản và kết xuất video mới. Việc gửi thẩm định lại không đảm bảo tác phẩm sẽ được phê duyệt.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-border">
              <Button
                size="sm"
                onClick={() => setSubmitOpen(true)}
                disabled={submitMutation.isPending}
                className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                <span>Gửi thẩm định lại</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="text-xs gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa tiêu đề & mô tả</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                  setThumbnailOpen(true);
                }}
                className="text-xs gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5 text-accent" />
                <span>Đổi Thumbnail Poster</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedSentences({});
                  setPatchCoverFile(null);
                  setPatchCoverPreview(null);
                  setPatchModalOpen(true);
                }}
                className="text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Vá Kịch Bản Siêu Tốc (&lt; 10s)</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/creator/studio')}
                className="text-xs gap-1.5 text-muted hover:text-ink"
              >
                <Film className="h-3.5 w-3.5" />
                <span>Tạo bản kết xuất mới trong Studio</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: PUBLISHED -> Publicly live */}
        {detail.status === 'PUBLISHED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-status-success-bg text-status-success-text flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink">
                  Tác phẩm đã được xuất bản công khai
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Tác phẩm đang được phát sóng công khai trên nền tảng Sử Ký cho toàn bộ thính giả.
                  Tệp truyền thông đã được tối ưu hóa đường truyền qua mạng lưới CDN.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenVisibility(true)}
                disabled={visibilityMutation.isPending}
                className="text-xs gap-1.5 text-muted hover:text-status-error-text hover:border-status-error-text/40"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Tạm ẩn tác phẩm</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="text-xs gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa thông tin</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                  setThumbnailOpen(true);
                }}
                className="text-xs gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5 text-accent" />
                <span>Đổi Thumbnail Poster</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedSentences({});
                  setPatchCoverFile(null);
                  setPatchCoverPreview(null);
                  setPatchModalOpen(true);
                }}
                className="text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Vá Kịch Bản Siêu Tốc (&lt; 10s)</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: HIDDEN -> Currently Hidden */}
        {detail.status === 'HIDDEN' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-surface-subtle text-muted flex items-center justify-center shrink-0">
                <EyeOff className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink">
                  Tác phẩm đang tạm ẩn khỏi danh mục công khai
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Tác phẩm đã qua kiểm duyệt nhưng hiện đang được ẩn. Thính giả sẽ không nhìn thấy
                  hoặc tìm kiếm được nội dung này cho đến khi bạn công khai lại.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-border">
              <Button
                size="sm"
                onClick={() => handleOpenVisibility(false)}
                disabled={visibilityMutation.isPending}
                className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Công khai lại tác phẩm</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="text-xs gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa thông tin</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: PROCESSING / FAILED / DRAFT */}
        {detail.status === 'PROCESSING' && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-ink">Video đang được kết xuất trong Creator Studio</h3>
                <p className="text-xs text-muted">Vui lòng theo dõi tiến trình trực tiếp tại màn hình Studio.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/creator/studio')} className="text-xs">
              Mở Studio
            </Button>
          </div>
        )}

        {detail.status === 'FAILED' && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-status-error-text" />
              <div>
                <h3 className="text-sm font-bold text-status-error-text">Quá trình kết xuất video thất bại</h3>
                <p className="text-xs text-muted">Bạn có thể tạo và chạy lại tiến trình kết xuất mới trong Studio.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/creator/studio')} className="text-xs">
              Mở Studio
            </Button>
          </div>
        )}

        {detail.status === 'DRAFT' && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted" />
              <div>
                <h3 className="text-sm font-bold text-ink">Tác phẩm đang ở trạng thái bản nháp</h3>
                <p className="text-xs text-muted">Hoàn thiện kịch bản và kết xuất video để sẵn sàng gửi duyệt.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/creator/studio')} className="text-xs">
              Đến Studio
            </Button>
          </div>
        )}
      </div>

      {/* 4. Media Player & Thumbnail Poster Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video / Audio Player (2 cols on lg) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface-subtle/50">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-accent" />
              <span>Bản Xem Trước Phương Tiện (Media Preview)</span>
            </span>
            <span className="text-[11px] text-muted font-mono">
              {mediaUrl ? (isVideoFile ? 'Tệp Video MP4 Sẵn Sàng' : 'Tệp Audio Sẵn Sàng') : 'Chưa có tệp Media'}
            </span>
          </div>

          <div className="p-4 bg-black/95 flex-1 flex items-center justify-center min-h-[240px]">
            {mediaUrl && !mediaError ? (
              isVideoFile ? (
                <video
                  controls
                  crossOrigin="anonymous"
                  className="w-full max-h-[420px] rounded-lg shadow-sm"
                  src={mediaUrl}
                  onError={() => setMediaError(true)}
                >
                  Trình duyệt không hỗ trợ phát thẻ video HTML5.
                </video>
              ) : (
                <div className="w-full max-w-lg py-6 space-y-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                  </div>
                  <audio
                    controls
                    className="w-full"
                    src={mediaUrl}
                    onError={() => setMediaError(true)}
                  >
                    Trình duyệt không hỗ trợ phát thẻ audio HTML5.
                  </audio>
                </div>
              )
            ) : (
              <div className="text-center py-10 space-y-3 text-muted">
                <Video className="h-10 w-10 mx-auto opacity-50" />
                <div className="space-y-1">
                  <p className="text-xs text-stone-400">
                    {mediaError
                      ? 'Không thể phát luồng trực tiếp (Tệp cục bộ hoặc URL đã hết hạn).'
                      : 'Tác phẩm chưa có tệp truyền thông (đang chờ kết xuất hoặc chưa tải lên).'}
                  </p>
                  {mediaUrl && (
                    <div className="pt-2">
                      <a
                        href={mediaUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-900 text-stone-200 text-xs hover:bg-stone-800 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Tải trực tiếp tệp Media ({mediaUrl.split('/').pop() || 'media'})</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Thumbnail Poster Card (1 col on lg) */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface-subtle/50">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-accent" />
              <span>Ảnh Thumbnail Poster</span>
            </span>
            {detail.version && detail.version > 1 && (
              <Badge variant="accent" className="font-mono text-[10px]">
                v{detail.version}
              </Badge>
            )}
          </div>

          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="relative aspect-video rounded-lg border border-border overflow-hidden bg-surface-subtle flex items-center justify-center">
              {resolveVideoThumbnail(detail.thumbnailUrl, detail.fileUrl) ? (
                <img
                  src={resolveVideoThumbnail(detail.thumbnailUrl, detail.fileUrl)}
                  alt="Ảnh Thumbnail Poster"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 space-y-1.5 text-muted">
                  <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-[11px] text-muted">Chưa có ảnh Thumbnail riêng</p>
                  <p className="text-[10px] text-muted/70">Hệ thống đang hiển thị ảnh mặc định từ Cảnh 1.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] text-muted leading-relaxed">
                Poster tĩnh hiển thị ngoài Trang chủ &amp; Danh sách phát khi thính giả duyệt tìm tác phẩm.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                  setThumbnailOpen(true);
                }}
                className="w-full text-xs gap-1.5"
              >
                <ImageIcon className="h-3.5 w-3.5 text-accent" />
                <span>Đổi ảnh Thumbnail Poster</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AI Shield & Moderation Review Details */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Thẩm Định Sử Liệu AI Shield & Quyết Định Kiểm Duyệt</span>
          </h2>
          <span className="text-[11px] text-muted">
            MarkItDown + RAG Embedding Policy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Card 1: AI Shield Evaluation */}
          <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted block font-medium">Đánh giá AI Shield</span>
                {detail.aiShieldTier ? (
                  <AiShieldBadge
                    tier={detail.aiShieldTier}
                    label={detail.aiShieldTierLabel || undefined}
                  />
                ) : (
                  <Badge variant="outline" className="text-[11px]">
                    Chưa thẩm định
                  </Badge>
                )}
              </div>

              {detail.aiShieldScore !== null && detail.aiShieldScore !== undefined ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-ink">
                      {Number(detail.aiShieldScore).toFixed(1)}
                    </span>
                    <span className="text-muted text-xs">/ 100 điểm tin cậy</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        Number(detail.aiShieldScore) >= 80
                          ? 'bg-status-success-text'
                          : Number(detail.aiShieldScore) >= 50
                            ? 'bg-status-pending-text'
                            : 'bg-status-error-text'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(detail.aiShieldScore)))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic pt-1">
                  Tác phẩm sẽ được thẩm định đối chiếu tự động khi bạn nhấn &quot;Gửi kiểm duyệt xuất bản&quot;.
                </p>
              )}

              {detail.aiShieldReason && (
                <div className="pt-2 border-t border-border space-y-1">
                  <span className="text-[11px] font-semibold text-ink block">Nhận xét từ AI Shield:</span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    {detail.aiShieldReason}
                  </p>
                </div>
              )}
            </div>

            {/* Threshold guide & Disclaimer */}
            <div className="pt-2 text-[10px] text-muted border-t border-border/60 space-y-1">
              <div>
                <span>Quy chuẩn phân tầng: </span>
                <span className="text-status-error-text font-medium">&lt;50% Đỏ</span> |{' '}
                <span className="text-amber-500 font-medium">50-80% Khá</span> |{' '}
                <span className="text-emerald-500 font-medium">80-90% Tốt</span> |{' '}
                <span className="text-status-success-text font-medium">&gt;90% Xuất sắc</span>
              </div>
              <p className="text-[10px] text-muted/80 leading-normal italic">
                * Điểm số AI Shield là kết quả đánh giá đối chiếu tự động với kho sử liệu, mang tính chất tham khảo hỗ trợ và không phải là bảo chứng tuyệt đối hay cam kết được Ban biên tập phê duyệt.
              </p>
            </div>
          </div>

          {/* Card 2: Admin Moderation Decision */}
          <div className="p-4 rounded-lg border border-border bg-surface-subtle space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-muted block font-medium">Quyết định Ban Kiểm Duyệt</span>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    detail.moderationDecision === 'APPROVED'
                      ? 'success'
                      : detail.moderationDecision === 'REJECTED'
                        ? 'error'
                        : detail.moderationDecision === 'PENDING'
                          ? 'pending'
                          : 'default'
                  }
                >
                  {detail.moderationDecision === 'APPROVED'
                    ? 'Đã Phê Duyệt'
                    : detail.moderationDecision === 'REJECTED'
                      ? 'Bị Từ Chối'
                      : detail.moderationDecision === 'PENDING'
                        ? 'Đang Chờ Duyệt'
                        : 'Chưa Gửi Duyệt'}
                </Badge>
              </div>

              {detail.moderationReason ? (
                <div className="pt-2 space-y-1 border-t border-border">
                  <span className="text-[11px] font-semibold text-ink block">
                    Ý kiến phản hồi từ Quản trị viên:
                  </span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    {detail.moderationReason}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted italic pt-1">
                  Chưa có ý kiến phản hồi nào từ Quản trị viên.
                </p>
              )}
            </div>

            <div className="pt-2 text-[10px] text-muted border-t border-border/60">
              Quyết định từ Ban biên tập Sử Ký là căn cứ chính thức để xuất bản nội dung ra cộng đồng.
            </div>
          </div>
        </div>
      </div>

      {/* 6. Description & Script Body */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <span>Kịch bản & Nội dung sử liệu</span>
          </h2>

          {canEditMetadata && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenEdit}
              className="text-xs h-7 px-2 gap-1 text-muted hover:text-ink"
            >
              <Edit3 className="h-3 w-3" />
              <span>Chỉnh sửa</span>
            </Button>
          )}
        </div>

        {detail.description ? (
          <div className="text-xs md:text-sm text-ink leading-relaxed whitespace-pre-wrap font-sans bg-surface-subtle p-4 rounded-lg border border-border">
            {detail.description}
          </div>
        ) : (
          <p className="text-xs text-muted italic">Chưa có nội dung mô tả kịch bản.</p>
        )}
      </div>

      {/* 7. Audience Engagement & Comments */}
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

      {/* ========================================================================= */}
      {/* DIALOG 1: Submit for Review & AI Shield Gate                             */}
      {/* ========================================================================= */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent maxWidth="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <span>Gửi Kiểm Duyệt Xuất Bản</span>
            </DialogTitle>
            <DialogDescription>
              Kích hoạt quy trình thẩm định AI Shield tự động và chuyển video vào danh sách chờ
              kiểm duyệt của Ban biên tập.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Content summary box */}
            <div className="p-3.5 rounded-lg border border-border bg-surface-subtle space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Tiêu đề tác phẩm:</span>
                <span className="font-semibold text-ink text-right max-w-[260px] truncate">
                  {detail.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Thời lượng kết xuất:</span>
                <span className="font-mono text-ink">
                  {formatDuration(detail.durationSeconds || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Quyền truy cập:</span>
                <span className="text-ink">
                  {detail.isExclusive ? 'Độc quyền VIP' : 'Miễn phí / Công khai'}
                </span>
              </div>
            </div>

            {/* Verification checklist notice */}
            <div className="p-3.5 rounded-lg border border-accent/20 bg-accent-soft space-y-2 text-ink">
              <span className="font-semibold flex items-center gap-1.5 text-accent">
                <Sparkles className="h-4 w-4" />
                <span>Quy trình tự động hóa AI Shield:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-muted">
                <li>MarkItDown trích xuất văn bản kịch bản và lời dẫn.</li>
                <li>RAG Embedding đối chiếu với kho sử liệu chính thống.</li>
                <li>Chấm điểm tính xác thực (0 – 100%) và phân tầng chính sách.</li>
                <li>Chuyển video vào hàng đợi duyệt của Ban biên tập Sử Ký.</li>
              </ul>
            </div>

            {/* Mandatory confirmation checkbox */}
            <div className="pt-2">
              <Checkbox
                id="submit-consent"
                checked={submitConsent}
                onChange={(e) => setSubmitConsent(e.target.checked)}
                label="Tôi cam kết nội dung đã được rà soát và sẵn sàng để Ban biên tập thẩm định."
                description="Trong quá trình chờ duyệt, tác phẩm sẽ được khóa chỉnh sửa trạng thái xuất bản."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitOpen(false);
                setSubmitConsent(false);
              }}
              disabled={submitMutation.isPending}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              disabled={!submitConsent || submitMutation.isPending}
              className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang kích hoạt AI Shield...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Xác nhận gửi kiểm duyệt</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: Edit Metadata Dialog                                           */}
      {/* ========================================================================= */}
      <Dialog open={editOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent maxWidth="max-w-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-accent" />
                <span>Chỉnh Sửa Thông Tin Hiển Thị</span>
              </DialogTitle>
              <DialogDescription>
                Cập nhật tiêu đề, tóm tắt mô tả hiển thị hoặc chế độ độc quyền. Lưu ý: Thao tác này
                không thay đổi kịch bản gốc hay âm thanh/hình ảnh trong tệp video đã kết xuất.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {editError && (
                <div className="p-3 rounded-lg border border-status-error-text/30 bg-status-error-bg text-status-error-text flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label htmlFor="edit-title" className="font-semibold text-ink block">
                  Tiêu đề tác phẩm <span className="text-status-error-text">*</span>
                </label>
                <Input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Đại chiến Bạch Đằng 938..."
                  className="text-xs h-9 bg-canvas"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label htmlFor="edit-desc" className="font-semibold text-ink block">
                  Mô tả / Tóm tắt hiển thị
                </label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Nhập mô tả tóm tắt tác phẩm hiển thị cho thính giả..."
                  className="text-xs min-h-[100px] bg-canvas"
                />
                <span className="text-[10px] text-muted block">
                  Cập nhật thông tin tóm tắt bên ngoài thẻ video, không thay đổi kịch bản lồng tiếng gốc.
                </span>
              </div>

              {/* Exclusive Checkbox */}
              <div className="pt-1">
                <Checkbox
                  id="edit-exclusive"
                  checked={editIsExclusive}
                  onChange={(e) => setEditIsExclusive(e.target.checked)}
                  label="Độc quyền cho Hội viên VIP"
                  description="Chỉ thính giả có gói hội viên của kênh mới có thể nghe toàn bộ tác phẩm."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu thay đổi</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: Visibility Toggle Dialog (HIDDEN <-> PUBLISHED)                */}
      {/* ========================================================================= */}
      <Dialog open={visibilityOpen} onOpenChange={setVisibilityOpen}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {targetHidden ? (
                <>
                  <EyeOff className="h-5 w-5 text-status-error-text" />
                  <span>Xác Nhận Tạm Ẩn Tác Phẩm</span>
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 text-status-success-text" />
                  <span>Xác Nhận Công Khai Lại Tác Phẩm</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {targetHidden
                ? 'Tác phẩm sẽ bị ẩn khỏi danh mục phát sóng công khai và người xem sẽ không thể tìm thấy.'
                : 'Tác phẩm sẽ được công khai trở lại trên nền tảng Sử Ký cho toàn bộ thính giả.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted">
            <p>
              Tác phẩm: <strong>{detail.title}</strong>
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibilityOpen(false)}
              disabled={visibilityMutation.isPending}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => visibilityMutation.mutate(targetHidden)}
              disabled={visibilityMutation.isPending}
              className={`gap-2 text-xs text-white ${
                targetHidden ? 'bg-status-error-text hover:bg-status-error-text/90' : 'bg-accent hover:bg-accent/90'
              }`}
            >
              {visibilityMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              <span>{targetHidden ? 'Xác nhận ẩn' : 'Xác nhận công khai'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: Upload Video Thumbnail Poster (16:9)                            */}
      {/* ========================================================================= */}
      <Dialog open={thumbnailOpen} onOpenChange={setThumbnailOpen}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-accent" />
              <span>Cập Nhật Ảnh Bìa Thumbnail (Poster)</span>
            </DialogTitle>
            <DialogDescription>
              Tải lên hình ảnh đại diện tỷ lệ 16:9 để hiển thị nổi bật trên trang chủ và danh sách phát của kênh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Dropzone / File Picker */}
            <div className="space-y-2">
              <label className="font-semibold text-ink block">
                Chọn ảnh Poster mới (JPG, PNG, WebP)
              </label>
              <SceneImageUploadDropzone
                label="Tải lên ảnh Thumbnail Poster"
                sublabel="Khung hình 16:9 ngoài trang chủ (PNG, JPG, WebP)"
                imageUrl={thumbPreviewUrl || (detail.thumbnailUrl ? resolveMediaUrl(detail.thumbnailUrl) : undefined)}
                aspectRatio="16:9"
                onFileSelect={(file: File) => {
                  setSelectedThumbFile(file);
                  const objectUrl = URL.createObjectURL(file);
                  setThumbPreviewUrl(objectUrl);
                }}
                onRemoveImage={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                }}
              />
              {detail.thumbnailUrl && !selectedThumbFile && (
                <div className="mt-2 text-muted text-[11px] flex items-center gap-1.5">
                  <span>Ảnh thumbnail hiện tại đang dùng:</span>
                  <a
                    href={resolveMediaUrl(detail.thumbnailUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline font-mono truncate max-w-[220px]"
                  >
                    Xem ảnh gốc
                  </a>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setThumbnailOpen(false);
                setSelectedThumbFile(null);
                setThumbPreviewUrl(null);
              }}
              disabled={uploadThumbnailMutation.isPending}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedThumbFile) {
                  uploadThumbnailMutation.mutate(selectedThumbFile);
                }
              }}
              disabled={!selectedThumbFile || uploadThumbnailMutation.isPending}
              className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
            >
              {uploadThumbnailMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang tải lên CDN...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Lưu Ảnh Thumbnail</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 5: Smart Script Patching (< 10s)                                   */}
      {/* ========================================================================= */}
      <Dialog open={patchModalOpen} onOpenChange={setPatchModalOpen}>
        <DialogContent maxWidth="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-accent" />
                <span>Vá Kịch Bản Siêu Tốc (Smart Script Patching)</span>
              </DialogTitle>
              <Badge variant="accent" className="font-mono text-[10px]">
                &lt; 10s · Tiết kiệm 90% chi phí
              </Badge>
            </div>
            <DialogDescription>
              Chỉ thu âm lại đúng các câu bạn chỉnh sửa và ghép lại video trong chưa đầy 10 giây. Bản video cũ vẫn tiếp tục phát sóng cho khán giả xem bình thường mà không bị gián đoạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs max-h-[60vh] overflow-y-auto pr-1">
            {/* Optional Cover Image Replacement */}
            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-accent" />
                  <span>Thay đổi ảnh bìa Podcast (Tùy chọn)</span>
                </span>
                {patchCoverFile && (
                  <Badge variant="accent" size="sm" className="text-[10px]">
                    Đã chọn ảnh mới
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted">
                Nếu bạn muốn cập nhật ảnh bìa mới cho video cùng lúc với việc sửa câu kịch bản.
              </p>
              <div className="pt-1">
                <SceneImageUploadDropzone
                  label="Tải lên ảnh bìa Podcast mới"
                  sublabel="Khung hình vuông 1:1 hoặc 16:9 (PNG, JPG, WebP)"
                  imageUrl={patchCoverPreview || undefined}
                  aspectRatio="1:1"
                  onFileSelect={(file: File) => {
                    setPatchCoverFile(file);
                    const objUrl = URL.createObjectURL(file);
                    setPatchCoverPreview(objUrl);
                  }}
                  onRemoveImage={() => {
                    setPatchCoverFile(null);
                    setPatchCoverPreview(null);
                  }}
                />
              </div>
            </div>

            {/* Sentences List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">
                  Danh sách câu thoại trong kịch bản ({podcastSentences.length} câu)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchSentences()}
                  disabled={isLoadingSentences}
                  className="text-xs h-7 px-2 text-muted hover:text-ink gap-1"
                >
                  <RotateCcw className={`h-3 w-3 ${isLoadingSentences ? 'animate-spin' : ''}`} />
                  <span>Tải lại câu</span>
                </Button>
              </div>

              {isLoadingSentences ? (
                <div className="py-12 text-center space-y-2 text-muted">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent" />
                  <p className="text-xs">Đang nạp danh sách câu từ máy chủ...</p>
                </div>
              ) : podcastSentences.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border rounded-xl text-muted space-y-1">
                  <AlertCircle className="h-5 w-5 mx-auto text-muted" />
                  <p className="font-medium text-ink">Chưa có phân tách câu cho video này</p>
                  <p className="text-[11px]">
                    Tính năng vá kịch bản siêu tốc chỉ hỗ trợ tác phẩm có dữ liệu câu kịch bản từ bản kết xuất gần nhất.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {podcastSentences.map((sentence, idx) => {
                    const isModified = editedSentences[idx] !== undefined && editedSentences[idx] !== sentence.text;
                    const currentVal = editedSentences[idx] !== undefined ? editedSentences[idx] : sentence.text;
                    const isPlaying = playingSentenceIdx === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border transition-all ${
                          isModified
                            ? 'border-accent bg-accent-soft/20 shadow-xs'
                            : 'border-border bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isModified ? 'accent' : 'outline'}
                              className="font-mono text-[10px]"
                            >
                              Câu #{idx + 1}
                            </Badge>
                            {isModified && (
                              <span className="text-[10px] font-semibold text-accent animate-pulse">
                                ● Sẽ thu âm lại
                              </span>
                            )}
                          </div>

                          {/* Audio preview button for this sentence */}
                          {sentence.audioUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePlaySentenceAudio(sentence.audioUrl, idx)}
                              className={`h-6 px-2 text-[11px] gap-1 rounded-md ${
                                isPlaying ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                              }`}
                              title="Nghe thử câu này"
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="h-3 w-3" />
                                  <span>Dừng</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3 w-3" />
                                  <span>Nghe thử</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        <Textarea
                          value={currentVal}
                          onChange={(e) => {
                            const nextText = e.target.value;
                            setEditedSentences((prev) => ({
                              ...prev,
                              [idx]: nextText,
                            }));
                          }}
                          rows={2}
                          className="text-xs bg-canvas resize-none"
                          placeholder="Nhập nội dung chỉnh sửa cho câu này..."
                        />

                        {isModified && (
                          <div className="pt-1.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditedSentences((prev) => {
                                  const copy = { ...prev };
                                  delete copy[idx];
                                  return copy;
                                });
                              }}
                              className="text-[10px] text-muted hover:text-ink underline"
                            >
                              Khôi phục câu gốc
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-muted">
                {Object.keys(editedSentences).length > 0 || patchCoverFile ? (
                  <span className="text-accent font-semibold">
                    Đã chọn sửa {Object.keys(editedSentences).length} câu {patchCoverFile ? '+ 1 ảnh bìa mới' : ''}
                  </span>
                ) : (
                  <span>Chưa có thay đổi nào được chọn.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPatchModalOpen(false);
                    if (sentenceAudioRef.current) {
                      sentenceAudioRef.current.pause();
                    }
                    setPlayingSentenceIdx(null);
                  }}
                  disabled={patchPodcastMutation.isPending}
                  className="text-xs"
                >
                  Hủy bỏ
                </Button>

                <Button
                  size="sm"
                  onClick={() => patchPodcastMutation.mutate()}
                  disabled={
                    patchPodcastMutation.isPending ||
                    (Object.keys(editedSentences).length === 0 && !patchCoverFile)
                  }
                  className="gap-2 text-xs bg-accent text-white hover:bg-accent/90"
                >
                  {patchPodcastMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang vá video (&lt; 10s)...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Vá Video Ngay (&lt; 10s)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
