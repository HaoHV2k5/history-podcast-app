import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  ExternalLink,
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
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';

export const CreatorContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contentId = id ? parseInt(id, 10) : NaN;

  // Animation Refs for GSAP Entrance
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);
  const engagementRef = useRef<HTMLDivElement>(null);

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

  // GSAP Smooth Float-in Entrance Animation
  useEffect(() => {
    if (isReducedMotion() || isLoading || !detail) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45 }
        );
      }

      if (bannerRef.current) {
        tl.fromTo(
          bannerRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.25'
        );
      }

      if (mediaRef.current) {
        tl.fromTo(
          mediaRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.42 },
          '-=0.22'
        );
      }

      if (shieldRef.current) {
        tl.fromTo(
          shieldRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.38 },
          '-=0.2'
        );
      }

      if (scriptRef.current) {
        tl.fromTo(
          scriptRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.38 },
          '-=0.2'
        );
      }

      if (engagementRef.current) {
        tl.fromTo(
          engagementRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.2'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, detail?.contentId]);

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
        message: 'Đã gửi tác phẩm vào hàng đợi kiểm duyệt thành công! AI Shield sẽ thẩm định và Admin sẽ xét duyệt sớm.',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể gửi video kiểm duyệt.';
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

  // Mutation: Update Metadata
  const updateMutation = useMutation({
    mutationFn: (payload: { title: string; description?: string; isExclusive?: boolean }) =>
      creatorStudioApi.updateVideoMetadata(contentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      setEditDialogOpen(false);
      setFeedback({
        type: 'success',
        message: 'Đã cập nhật thông tin tác phẩm thành công!',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể cập nhật thông tin.';
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

  // Mutation: Toggle Visibility (Hidden <-> Published)
  const visibilityMutation = useMutation({
    mutationFn: (hidden: boolean) => creatorStudioApi.toggleVideoVisibility(contentId, hidden),
    onSuccess: (_, hidden) => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
      setVisibilityOpen(false);
      setFeedback({
        type: 'success',
        message: hidden ? 'Đã tạm ẩn tác phẩm khỏi danh mục công khai.' : 'Đã công khai lại tác phẩm thành công!',
      });
    },
    onError: (err: unknown) => {
      let msg = 'Không thể thay đổi trạng thái hiển thị.';
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
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() => navigate('/creator/content')}
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-stone-200/90 bg-white/95 hover:bg-white text-xs font-medium text-stone-600 hover:text-[#A22A2A] hover:border-[#A22A2A]/40 transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-stone-500 group-hover:text-[#A22A2A]" />
          <span>Quay lại Thư viện nội dung</span>
        </button>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-stone-900 font-serif">Mã tác phẩm không hợp lệ</h2>
          <p className="text-xs text-stone-500">Vui lòng chọn tác phẩm từ danh sách thư viện nội dung.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
        <div className="h-9 bg-stone-200/70 rounded-xl w-48" />
        <div className="h-44 bg-stone-200/60 rounded-2xl border border-stone-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 aspect-video bg-stone-200/60 rounded-2xl border border-stone-200" />
          <div className="h-64 bg-stone-200/60 rounded-2xl border border-stone-200" />
        </div>
        <div className="h-48 bg-stone-200/60 rounded-2xl border border-stone-200" />
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
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() => navigate('/creator/content')}
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-stone-200/90 bg-white/95 hover:bg-white text-xs font-medium text-stone-600 hover:text-[#A22A2A] hover:border-[#A22A2A]/40 transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-stone-500 group-hover:text-[#A22A2A]" />
          <span>Quay lại Thư viện nội dung</span>
        </button>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-4 shadow-2xs">
          <AlertCircle className="h-10 w-10 text-rose-600 mx-auto" />
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-rose-900 font-serif">{errorTitle}</h2>
            <p className="text-xs text-rose-700 leading-relaxed">{errorDesc}</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="gap-2 text-xs border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs bg-[#A22A2A] hover:bg-[#8B0000] text-white"
            >
              Về Thư viện nội dung
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  // Custom Status Badge Styles matching Library Design System
  const getCustomStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          label: 'Đã xuất bản',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dotColor: 'bg-emerald-500',
        };
      case 'PENDING_REVIEW':
      case 'PENDING':
        return {
          label: 'Chờ duyệt',
          className: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dotColor: 'bg-amber-500',
        };
      case 'COMPLETED':
        return {
          label: 'Chờ gửi duyệt',
          className: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dotColor: 'bg-[#A22A2A]',
        };
      case 'REJECTED':
        return {
          label: 'Bị từ chối',
          className: 'bg-red-50 text-red-700 border-red-200/80',
          dotColor: 'bg-red-500',
        };
      case 'HIDDEN':
        return {
          label: 'Đã ẩn',
          className: 'bg-stone-100 text-stone-700 border-stone-200/80',
          dotColor: 'bg-stone-400',
        };
      case 'DRAFT':
        return {
          label: 'Bản nháp',
          className: 'bg-stone-100 text-stone-600 border-stone-200/80',
          dotColor: 'bg-stone-400',
        };
      default:
        return {
          label: status,
          className: 'bg-stone-100 text-stone-700 border-stone-200/80',
          dotColor: 'bg-stone-400',
        };
    }
  };

  const currentBadge = getCustomStatusBadge(detail.status);

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-16">
      {/* Feedback Toast / Alert Bar */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <p className="leading-relaxed font-medium">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-70 p-0.5 cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header & Hero Section with Vietnamese Historical Aesthetics */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-gradient-to-b from-[#FDFBF7] via-[#FAF6F0] to-[#F5EFEB]/40 p-6 sm:p-8 shadow-2xs backdrop-blur-sm"
      >
        {/* Subtle Historical Ink Wash Decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#A22A2A]/20 via-amber-700/10 to-transparent" />

        {/* Top Navigation & Utility Pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-stone-200/80">
          <button
            type="button"
            onClick={() => navigate('/creator/content')}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-stone-200/90 bg-white/95 hover:bg-white text-xs font-medium text-stone-600 hover:text-[#A22A2A] hover:border-[#A22A2A]/40 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-stone-500 group-hover:text-[#A22A2A]" />
            <span>Quay lại Thư viện nội dung</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-stone-200/80 bg-white/90 text-xs font-mono text-stone-600">
              Mã tác phẩm: #{detail.contentId}
            </span>
            {detail.version && detail.version > 1 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-xs font-mono font-semibold text-[#A22A2A]">
                Phiên bản: v{detail.version}
              </span>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-stone-200/80 bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-[#A22A2A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hero Title & Main Actions */}
        <div className="relative z-10 pt-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A22A2A]">
                <Video className="h-4 w-4 text-[#A22A2A]" />
                <span>Chi Tiết &amp; Quản Trị Tác Phẩm Sử Ký</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 leading-snug">
                {detail.title}
              </h1>
            </div>

            {/* Quick Edit Action Button */}
            {canEditMetadata && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="self-start text-xs gap-1.5 h-9 px-4 rounded-xl border-stone-300 bg-white/90 hover:bg-white text-stone-700 hover:text-[#A22A2A] shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#A22A2A]" />
                <span>Chỉnh sửa thông tin</span>
              </Button>
            )}
          </div>

          {/* Metadata Chips Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-2xs ${currentBadge.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${currentBadge.dotColor}`} />
              <span>{currentBadge.label}</span>
            </span>

            {/* VIP Exclusive Pill */}
            {detail.isExclusive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium shadow-2xs">
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>Độc quyền Hội viên VIP</span>
              </span>
            )}

            {/* Channel Pill */}
            {detail.channelName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200/90 bg-white/90 text-stone-600 text-xs">
                <Radio className="h-3 w-3 text-[#A22A2A]" />
                <span>Kênh: <strong>{detail.channelName}</strong></span>
              </span>
            )}

            {/* Date Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200/80 bg-white/80 text-stone-500 text-xs">
              <Calendar className="h-3 w-3 text-stone-400" />
              <span>Ngày tạo: {formatDateTime(detail.createdAt)}</span>
            </span>

            {/* Duration Pill */}
            {detail.durationSeconds && detail.durationSeconds > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200/80 bg-white/80 text-stone-500 text-xs">
                <Clock className="h-3 w-3 text-stone-400" />
                <span>Thời lượng: {formatDuration(detail.durationSeconds)}</span>
              </span>
            ) : null}

            {detail.artifactId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-stone-100 font-mono text-[11px] text-stone-400">
                Artifact ID: #{detail.artifactId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Lifecycle & Publication Workflow Action Banner */}
      <div
        ref={bannerRef}
        className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-2xs backdrop-blur-sm"
      >
        {/* State: COMPLETED -> Ready for Review */}
        {detail.status === 'COMPLETED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-100 text-[#A22A2A] flex items-center justify-center shrink-0 shadow-2xs">
                <Send className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                  Tác phẩm đã kết xuất xong — Sẵn sàng gửi kiểm duyệt xuất bản
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-3xl">
                  Tệp video và âm thanh đã được kết xuất hoàn chỉnh. Khi gửi duyệt, hệ thống AI Shield sẽ tự động đối chiếu sử liệu chính thống, chấm điểm mức độ tin cậy và chuyển vào hàng đợi để Ban biên tập Sử Ký phê duyệt phát sóng.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-stone-200/80">
              <Button
                size="sm"
                onClick={() => setSubmitOpen(true)}
                disabled={!isEligibleForReview || submitMutation.isPending}
                className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white font-medium rounded-xl shadow-xs transition-all cursor-pointer"
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#A22A2A]" />
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-rose-200 hover:border-[#A22A2A]/40 bg-rose-50/50 text-[#A22A2A] hover:bg-rose-50 cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Vá Kịch Bản Siêu Tốc (&lt; 10s)</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: PENDING_REVIEW -> Under Moderation */}
        {detail.status === 'PENDING_REVIEW' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                    Đang trong hàng đợi kiểm duyệt của Ban biên tập
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Tự động theo dõi quyết định (8s)</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed max-w-3xl">
                  Tác phẩm đã qua thẩm định AI Shield sơ bộ và đang chờ Quản trị viên (Admin) xem xét phê duyệt. Hệ thống đang tự động cập nhật kết quả theo thời gian thực — giao diện sẽ tự động chuyển trạng thái ngay khi có quyết định chính thức.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-stone-200/80 text-xs text-stone-500">
              <span>Đang mở chế độ thăm dò tự động (Polling theo thời gian thực)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-8 px-3 text-xs gap-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                title="Kiểm tra trạng thái ngay từ máy chủ"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-[#A22A2A]' : ''}`} />
                <span>Kiểm tra ngay</span>
              </Button>
            </div>
          </div>
        )}

        {/* State: REJECTED -> Action Required */}
        {detail.status === 'REJECTED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-red-800 font-serif">
                  Tác phẩm bị từ chối phê duyệt bởi Ban biên tập
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Quản trị viên đã xem xét kết quả thẩm định và từ chối phê duyệt tác phẩm này với lý do dưới đây. Vui lòng rà soát lại kịch bản hoặc thông tin trước khi gửi thẩm định lại.
                </p>

                {/* Prominent Rejection Reason Box */}
                {detail.moderationReason && (
                  <div className="mt-2 p-3.5 rounded-xl border border-red-200 bg-red-50/80 text-xs text-red-800 leading-relaxed font-medium">
                    <strong className="block text-red-900 mb-0.5">Lý do từ chối từ Ban biên tập:</strong>
                    <span>{detail.moderationReason}</span>
                  </div>
                )}

                <div className="mt-2 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6] text-[11px] text-stone-500 space-y-1">
                  <p>
                    <strong>Lưu ý:</strong> Chỉnh sửa tiêu đề/mô tả chỉ cập nhật thông tin hiển thị bên ngoài. Nếu lý do từ chối liên quan đến giọng đọc, hình ảnh hoặc sai lệch sử liệu trong video đã kết xuất, bạn cần dùng tính năng <strong>Vá kịch bản siêu tốc</strong> hoặc tạo bản kết xuất mới trong <strong>Studio</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-stone-200/80">
              <Button
                size="sm"
                onClick={() => setSubmitOpen(true)}
                disabled={submitMutation.isPending}
                className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white font-medium rounded-xl shadow-xs cursor-pointer"
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa tiêu đề &amp; mô tả</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                  setThumbnailOpen(true);
                }}
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#A22A2A]" />
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-rose-200 hover:border-[#A22A2A]/40 bg-rose-50/50 text-[#A22A2A] hover:bg-rose-50 cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Vá Kịch Bản Siêu Tốc (&lt; 10s)</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/creator/studio')}
                className="text-xs h-9 px-3 gap-1.5 text-stone-500 hover:text-stone-900 cursor-pointer"
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
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                  Tác phẩm đã được xuất bản công khai
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-3xl">
                  Tác phẩm đang được phát sóng công khai trên nền tảng Sử Ký cho toàn bộ thính giả. Tệp truyền thông đã được tối ưu hóa đường truyền qua mạng lưới CDN tốc độ cao.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-stone-200/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenVisibility(true)}
                disabled={visibilityMutation.isPending}
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 text-stone-600 hover:text-red-700 hover:border-red-300 bg-white cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Tạm ẩn tác phẩm</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#A22A2A]" />
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
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-rose-200 hover:border-[#A22A2A]/40 bg-rose-50/50 text-[#A22A2A] hover:bg-rose-50 cursor-pointer"
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
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center shrink-0 shadow-2xs">
                <EyeOff className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                  Tác phẩm đang tạm ẩn khỏi danh mục công khai
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-3xl">
                  Tác phẩm đã qua kiểm duyệt nhưng hiện đang được ẩn. Thính giả sẽ không nhìn thấy hoặc tìm kiếm được nội dung này cho đến khi bạn công khai lại.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-stone-200/80">
              <Button
                size="sm"
                onClick={() => handleOpenVisibility(false)}
                disabled={visibilityMutation.isPending}
                className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white font-medium rounded-xl shadow-xs cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Công khai lại tác phẩm</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="text-xs h-9 px-4 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
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
              <Loader2 className="h-5 w-5 text-[#A22A2A] animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">Video đang được kết xuất trong Creator Studio</h3>
                <p className="text-xs text-stone-500">Vui lòng theo dõi tiến trình trực tiếp tại màn hình Studio.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/creator/studio')} className="text-xs rounded-xl">
              Mở Studio
            </Button>
          </div>
        )}

        {detail.status === 'FAILED' && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-bold text-red-700 font-serif">Quá trình kết xuất video thất bại</h3>
                <p className="text-xs text-stone-500">Bạn có thể tạo và chạy lại tiến trình kết xuất mới trong Studio.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/creator/studio')} className="text-xs rounded-xl">
              Mở Studio
            </Button>
          </div>
        )}

        {detail.status === 'DRAFT' && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-stone-400" />
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">Tác phẩm đang ở trạng thái bản nháp</h3>
                <p className="text-xs text-stone-500">Hoàn thiện kịch bản và kết xuất video để sẵn sàng gửi duyệt.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/creator/studio')} className="text-xs rounded-xl">
              Đến Studio
            </Button>
          </div>
        )}
      </div>

      {/* 3. Media Player & Thumbnail Poster Section */}
      <div ref={mediaRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video / Audio Player (2 cols on lg) */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200/90 bg-white/95 overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="p-4 px-5 border-b border-stone-200/80 flex items-center justify-between bg-[#FAF9F6]">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-[#A22A2A]" />
              <span>Bản Xem Trước Phương Tiện (Media Preview)</span>
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              {mediaUrl ? (isVideoFile ? 'Tệp Video MP4 Sẵn Sàng' : 'Tệp Audio Sẵn Sàng') : 'Chưa có tệp Media'}
            </span>
          </div>

          <div className="p-4 sm:p-5 bg-[#141210] flex-1 flex items-center justify-center min-h-[300px]">
            {mediaUrl && !mediaError ? (
              isVideoFile ? (
                <video
                  controls
                  crossOrigin="anonymous"
                  className="w-full max-h-[460px] rounded-xl shadow-lg border border-stone-800"
                  src={mediaUrl}
                  onError={() => setMediaError(true)}
                >
                  Trình duyệt không hỗ trợ phát thẻ video HTML5.
                </video>
              ) : (
                <div className="w-full max-w-lg py-8 space-y-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-red-500/20 text-[#A22A2A] mx-auto flex items-center justify-center">
                    <Play className="h-7 w-7 fill-current ml-0.5" />
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
              <div className="text-center py-12 space-y-3 text-stone-400">
                <Video className="h-10 w-10 mx-auto opacity-40 text-stone-500" />
                <div className="space-y-1.5 max-w-sm mx-auto">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 text-stone-200 text-xs hover:bg-stone-700 transition-colors"
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
        <div className="rounded-2xl border border-stone-200/90 bg-white/95 overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="p-4 px-5 border-b border-stone-200/80 flex items-center justify-between bg-[#FAF9F6]">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-[#A22A2A]" />
              <span>Ảnh Thumbnail Poster</span>
            </span>
            {detail.version && detail.version > 1 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-50 text-[#A22A2A] font-semibold">
                v{detail.version}
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="relative aspect-video rounded-xl border border-stone-200 overflow-hidden bg-[#FAF9F6] flex items-center justify-center group shadow-2xs">
              {resolveVideoThumbnail(detail.thumbnailUrl, detail.fileUrl) ? (
                <img
                  src={resolveVideoThumbnail(detail.thumbnailUrl, detail.fileUrl)}
                  alt={`Poster cho tác phẩm ${detail.title}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-center p-4 space-y-1.5 text-stone-400">
                  <ImageIcon className="h-8 w-8 mx-auto opacity-30" />
                  <p className="text-xs text-stone-500 font-medium">Chưa có ảnh Thumbnail riêng</p>
                  <p className="text-[11px] text-stone-400">Hệ thống đang hiển thị poster mặc định từ Cảnh 1.</p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-xs text-stone-500 leading-relaxed">
                Poster tĩnh tỉ lệ chuẩn 16:9 hiển thị nổi bật trên Trang chủ và Danh sách phát khi thính giả duyệt tìm tác phẩm.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedThumbFile(null);
                  setThumbPreviewUrl(null);
                  setThumbnailOpen(true);
                }}
                className="w-full text-xs h-9 gap-1.5 rounded-xl border-stone-300 hover:border-stone-400 bg-white text-stone-700 cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#A22A2A]" />
                <span>Đổi ảnh Thumbnail Poster</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI Shield & Moderation Review Details */}
      <div
        ref={shieldRef}
        className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 sm:p-8 shadow-2xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#A22A2A]" />
            <span>Thẩm Định Sử Liệu AI Shield &amp; Quyết Định Kiểm Duyệt</span>
          </h2>
          <span className="text-[11px] font-mono text-stone-400">
            MarkItDown + RAG Embedding Policy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Card 1: AI Shield Evaluation */}
          <div className="p-5 rounded-xl border border-stone-200/90 bg-[#FAF9F6] space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold text-xs block">Đánh giá AI Shield</span>
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
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-stone-900">
                      {Number(detail.aiShieldScore).toFixed(1)}
                    </span>
                    <span className="text-stone-500 text-xs">/ 100 điểm tin cậy</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        Number(detail.aiShieldScore) >= 80
                          ? 'bg-emerald-600'
                          : Number(detail.aiShieldScore) >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(detail.aiShieldScore)))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic pt-1">
                  Tác phẩm sẽ được thẩm định đối chiếu tự động khi bạn nhấn &quot;Gửi kiểm duyệt xuất bản&quot;.
                </p>
              )}

              {detail.aiShieldReason && (
                <div className="pt-3 border-t border-stone-200/80 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-800 block">Nhận xét từ AI Shield:</span>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    {detail.aiShieldReason}
                  </p>
                </div>
              )}
            </div>

            {/* Threshold guide & Disclaimer */}
            <div className="pt-3 text-[10px] text-stone-400 border-t border-stone-200/60 space-y-1">
              <div>
                <span>Quy chuẩn phân tầng: </span>
                <span className="text-red-600 font-medium">&lt;50% Đỏ</span> |{' '}
                <span className="text-amber-600 font-medium">50-80% Khá</span> |{' '}
                <span className="text-emerald-600 font-medium">80-90% Tốt</span> |{' '}
                <span className="text-emerald-700 font-medium">&gt;90% Xuất sắc</span>
              </div>
              <p className="text-[10px] text-stone-400 leading-normal italic">
                * Điểm số AI Shield là kết quả đánh giá đối chiếu tự động với kho sử liệu chính thống, mang tính chất tham khảo hỗ trợ và là căn cứ để Ban biên tập xem xét phê duyệt.
              </p>
            </div>
          </div>

          {/* Card 2: Admin Moderation Decision */}
          <div className="p-5 rounded-xl border border-stone-200/90 bg-[#FAF9F6] space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-stone-600 font-semibold text-xs block">Quyết định Ban Kiểm Duyệt</span>

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
                <div className="pt-2.5 space-y-1 border-t border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-800 block">
                    Ý kiến phản hồi từ Quản trị viên:
                  </span>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    {detail.moderationReason}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic pt-1">
                  Chưa có ý kiến phản hồi nào từ Quản trị viên.
                </p>
              )}
            </div>

            <div className="pt-3 text-[10px] text-stone-400 border-t border-stone-200/60">
              Quyết định từ Ban biên tập Sử Ký là căn cứ chính thức để xuất bản nội dung ra cộng đồng.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Description & Script Body */}
      <div
        ref={scriptRef}
        className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 sm:p-8 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#A22A2A]" />
            <span>Kịch Bản &amp; Nội Dung Sử Liệu</span>
          </h2>

          {canEditMetadata && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenEdit}
              className="text-xs h-8 px-3 gap-1.5 text-stone-600 hover:text-[#A22A2A] hover:bg-stone-50 rounded-lg cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Chỉnh sửa</span>
            </Button>
          )}
        </div>

        {detail.description ? (
          <div className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans bg-[#FAF9F6] p-5 sm:p-6 rounded-xl border border-stone-200/80 shadow-2xs">
            {detail.description}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-4">Chưa có nội dung mô tả kịch bản.</p>
        )}
      </div>

      {/* 6. Audience Engagement & Comments */}
      <div
        ref={engagementRef}
        className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 sm:p-8 shadow-2xs space-y-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#A22A2A]" />
          <span>Tương Tác Từ Thính GiẢ</span>
        </h2>

        {/* Counter cards */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl border border-stone-200/90 bg-[#FAF9F6] shadow-2xs">
            <span className="text-[11px] text-stone-500 font-medium block">Lượt thích</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-stone-900 mt-1 flex items-center justify-center gap-1.5">
              <Heart className="h-4 w-4 text-[#A22A2A] fill-[#A22A2A]/20" />
              {detail.likeCount || 0}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/90 bg-[#FAF9F6] shadow-2xs">
            <span className="text-[11px] text-stone-500 font-medium block">Lượt không thích</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-stone-500 mt-1 flex items-center justify-center gap-1.5">
              <ThumbsDown className="h-4 w-4" />
              {detail.dislikeCount || 0}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/90 bg-[#FAF9F6] shadow-2xs">
            <span className="text-[11px] text-stone-500 font-medium block">Bình luận</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-stone-900 mt-1 flex items-center justify-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-stone-700" />
              {detail.commentCount || 0}
            </span>
          </div>
        </div>

        {/* Comment list */}
        {detail.comments && detail.comments.length > 0 ? (
          <div className="pt-2 space-y-3 divide-y divide-stone-200/80">
            <span className="text-xs font-semibold text-stone-800 block">
              Danh sách bình luận ({detail.comments.length})
            </span>
            {detail.comments.map((c) => (
              <div key={c.id} className="pt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-medium text-stone-800">{c.userEmail}</span>
                  <span className="font-mono">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{c.textBody}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 text-center py-6 italic">
            Chưa có bình luận nào cho tác phẩm này.
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DIALOG 1: Submit for Review & AI Shield Gate                             */}
      {/* ========================================================================= */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent maxWidth="max-w-lg" className="rounded-2xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold text-stone-900">
              <ShieldCheck className="h-5 w-5 text-[#A22A2A]" />
              <span>Gửi Kiểm Duyệt Xuất Bản</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Kích hoạt quy trình thẩm định AI Shield tự động và chuyển video vào danh sách chờ kiểm duyệt của Ban biên tập.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Content summary box */}
            <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F6] space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Tiêu đề tác phẩm:</span>
                <span className="font-semibold text-stone-900 text-right max-w-[260px] truncate">
                  {detail.title}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Thời lượng kết xuất:</span>
                <span className="font-mono text-stone-800 font-medium">
                  {formatDuration(detail.durationSeconds || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Quyền truy cập:</span>
                <span className="text-stone-800 font-medium">
                  {detail.isExclusive ? 'Độc quyền VIP' : 'Miễn phí / Công khai'}
                </span>
              </div>
            </div>

            {/* Verification checklist notice */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2 text-stone-800">
              <span className="font-semibold flex items-center gap-1.5 text-[#A22A2A]">
                <Sparkles className="h-4 w-4" />
                <span>Quy trình tự động hóa AI Shield:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px] leading-relaxed">
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

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitOpen(false);
                setSubmitConsent(false);
              }}
              disabled={submitMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              disabled={!submitConsent || submitMutation.isPending}
              className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white rounded-xl font-medium shadow-xs"
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
        <DialogContent maxWidth="max-w-lg" className="rounded-2xl border-stone-200">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold text-stone-900">
                <Edit3 className="h-5 w-5 text-[#A22A2A]" />
                <span>Chỉnh Sửa Thông Tin Hiển Thị</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Cập nhật tiêu đề, tóm tắt mô tả hiển thị hoặc chế độ độc quyền. Thao tác này không thay đổi âm thanh hay hình ảnh trong tệp video đã kết xuất.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {editError && (
                <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label htmlFor="edit-title" className="font-semibold text-stone-800 block">
                  Tiêu đề tác phẩm <span className="text-red-600">*</span>
                </label>
                <Input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Đại chiến Bạch Đằng 938..."
                  className="text-xs h-9 bg-white border-stone-300 rounded-lg"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label htmlFor="edit-desc" className="font-semibold text-stone-800 block">
                  Mô tả / Tóm tắt hiển thị
                </label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Nhập mô tả tóm tắt tác phẩm hiển thị cho thính giả..."
                  className="text-xs min-h-[100px] bg-white border-stone-300 rounded-lg leading-relaxed"
                />
                <span className="text-[10px] text-stone-400 block">
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

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
                className="text-xs h-9 px-4 rounded-xl border-stone-300"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white rounded-xl font-medium shadow-xs cursor-pointer"
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
        <DialogContent maxWidth="max-w-md" className="rounded-2xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold">
              {targetHidden ? (
                <>
                  <EyeOff className="h-5 w-5 text-red-600" />
                  <span className="text-stone-900">Xác Nhận Tạm Ẩn Tác Phẩm</span>
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 text-emerald-600" />
                  <span className="text-stone-900">Xác Nhận Công Khai Lại Tác Phẩm</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              {targetHidden
                ? 'Tác phẩm sẽ bị ẩn khỏi danh mục phát sóng công khai và người xem sẽ không thể tìm thấy.'
                : 'Tác phẩm sẽ được công khai trở lại trên nền tảng Sử Ký cho toàn bộ thính giả.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-stone-600">
            <p>
              Tác phẩm: <strong>{detail.title}</strong>
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibilityOpen(false)}
              disabled={visibilityMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => visibilityMutation.mutate(targetHidden)}
              disabled={visibilityMutation.isPending}
              className={`gap-2 text-xs h-9 px-5 rounded-xl text-white font-medium shadow-xs cursor-pointer ${
                targetHidden ? 'bg-red-600 hover:bg-red-700' : 'bg-[#A22A2A] hover:bg-[#8B0000]'
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
        <DialogContent maxWidth="max-w-md" className="rounded-2xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold text-stone-900">
              <ImageIcon className="h-5 w-5 text-[#A22A2A]" />
              <span>Cập Nhật Ảnh Bìa Thumbnail (Poster)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Tải lên hình ảnh đại diện tỷ lệ 16:9 để hiển thị nổi bật trên trang chủ và danh sách phát của kênh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-stone-800 block">
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
                <div className="mt-2 text-stone-500 text-[11px] flex items-center gap-1.5">
                  <span>Ảnh thumbnail hiện tại:</span>
                  <a
                    href={resolveMediaUrl(detail.thumbnailUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A22A2A] underline font-mono truncate max-w-[220px]"
                  >
                    Xem ảnh gốc
                  </a>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
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
              className="text-xs h-9 px-4 rounded-xl border-stone-300"
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
              className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white rounded-xl font-medium shadow-xs cursor-pointer"
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
        <DialogContent maxWidth="max-w-2xl" className="rounded-2xl border-stone-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold text-stone-900">
                <Wrench className="h-5 w-5 text-[#A22A2A]" />
                <span>Vá Kịch Bản Siêu Tốc (Smart Script Patching)</span>
              </DialogTitle>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-[#A22A2A] font-semibold border border-rose-200">
                &lt; 10s · Tiết kiệm 90% chi phí
              </span>
            </div>
            <DialogDescription className="text-xs text-stone-500">
              Chỉ thu âm lại đúng các câu bạn chỉnh sửa và ghép lại video trong chưa đầy 10 giây. Bản video cũ vẫn tiếp tục phát sóng cho khán giả xem bình thường mà không bị gián đoạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs max-h-[60vh] overflow-y-auto pr-1">
            {/* Optional Cover Image Replacement */}
            <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F6] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[#A22A2A]" />
                  <span>Thay đổi ảnh bìa Podcast (Tùy chọn)</span>
                </span>
                {patchCoverFile && (
                  <span className="font-medium text-[10px] px-2 py-0.5 rounded bg-rose-50 text-[#A22A2A] border border-rose-200">
                    Đã chọn ảnh mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
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
                <span className="font-semibold text-stone-800">
                  Danh sách câu thoại trong kịch bản ({podcastSentences.length} câu)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchSentences()}
                  disabled={isLoadingSentences}
                  className="text-xs h-7 px-2 text-stone-500 hover:text-stone-900 gap-1 rounded-lg cursor-pointer"
                >
                  <RotateCcw className={`h-3 w-3 ${isLoadingSentences ? 'animate-spin' : ''}`} />
                  <span>Tải lại câu</span>
                </Button>
              </div>

              {isLoadingSentences ? (
                <div className="py-12 text-center space-y-2 text-stone-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#A22A2A]" />
                  <p className="text-xs">Đang nạp danh sách câu từ máy chủ...</p>
                </div>
              ) : podcastSentences.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-stone-200 rounded-xl text-stone-400 space-y-1 bg-[#FAF9F6]">
                  <AlertCircle className="h-5 w-5 mx-auto text-stone-400" />
                  <p className="font-medium text-stone-700">Chưa có phân tách câu cho video này</p>
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
                        className={`p-3.5 rounded-xl border transition-all ${
                          isModified
                            ? 'border-[#A22A2A] bg-rose-50/40 shadow-xs'
                            : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                                isModified ? 'bg-rose-100 text-[#A22A2A]' : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              Câu #{idx + 1}
                            </span>
                            {isModified && (
                              <span className="text-[10px] font-semibold text-[#A22A2A] animate-pulse">
                                ● Sẽ thu âm lại
                              </span>
                            )}
                          </div>

                          {/* Audio preview button for this sentence */}
                          {sentence.audioUrl && (
                            <button
                              type="button"
                              onClick={() => handlePlaySentenceAudio(sentence.audioUrl, idx)}
                              className={`h-6 px-2.5 text-[11px] gap-1 rounded-md inline-flex items-center transition-colors cursor-pointer ${
                                isPlaying ? 'bg-[#A22A2A] text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
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
                            </button>
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
                          className="text-xs bg-white border-stone-300 resize-none rounded-lg"
                          placeholder="Nhập nội dung chỉnh sửa cho câu này..."
                        />

                        {isModified && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditedSentences((prev) => {
                                  const copy = { ...prev };
                                  delete copy[idx];
                                  return copy;
                                });
                              }}
                              className="text-[10px] text-stone-500 hover:text-stone-900 underline cursor-pointer"
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

          <DialogFooter className="border-t border-stone-200 pt-3">
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-stone-500">
                {Object.keys(editedSentences).length > 0 || patchCoverFile ? (
                  <span className="text-[#A22A2A] font-semibold">
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
                  className="text-xs h-9 px-4 rounded-xl border-stone-300"
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
                  className="gap-2 text-xs h-9 px-5 bg-[#A22A2A] hover:bg-[#8B0000] text-white rounded-xl font-medium shadow-xs cursor-pointer"
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
