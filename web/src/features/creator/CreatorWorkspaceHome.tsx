import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  PlusCircle,
  Plus,
  Folder,
  UserCheck,
  Radio,
  ArrowRight,
  Clock,
  Heart,
  MessageSquare,
  Eye,
  AlertCircle,
  CheckCircle2,
  FileText,
  Play,
  Layers,
  Volume2,
  ExternalLink,
  RotateCcw,
  BookOpen,
  MoreVertical,
  XCircle,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { channelsApi } from '@/services/api/channels';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { useKycGate } from '@/features/kyc/useKycGate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeritageAtmosphereWatermark } from '@/components/common/HeritageAtmosphereWatermark';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { CreatorVideoItem } from '@/types/creatorContent';
import { formatDate, formatDuration, formatRelativeTime, getContentStatusBadge } from '@/utils/formatters';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';
import {
  resolveHistoricalThumbnail,
} from '@/features/studio/creatorStudioUtils';

// URL resolver for media files and thumbnails (supports Cloudinary, local public assets, and backend storage)
export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (url.startsWith('/assets/') || url.startsWith('assets/')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

// Thumbnail Preview: Prioritizes user uploaded thumbnail -> video poster snapshot -> historical topic artwork
const VideoThumbnailPreview: React.FC<{
  thumbnailUrl?: string | null;
  fileUrl?: string | null;
  title: string;
  durationSeconds?: number | null;
  className?: string;
  onClick?: () => void;
}> = ({ thumbnailUrl, fileUrl, title, durationSeconds, className, onClick }) => {
  const [imageError, setImageError] = React.useState(false);
  const resolvedUrl = React.useMemo(() => {
    return resolveHistoricalThumbnail(title, thumbnailUrl, fileUrl);
  }, [title, thumbnailUrl, fileUrl]);
  const showImage = Boolean(resolvedUrl && !imageError);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative aspect-video rounded-lg overflow-hidden shrink-0 border border-stone-200/90 bg-stone-900 cursor-pointer shadow-2xs group/thumb select-none',
        className
      )}
    >
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={title}
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-stone-400 p-2 text-center select-none relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent opacity-40 pointer-events-none" />
          <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center mb-1 text-stone-300 border border-white/10 shadow-inner">
            <Video className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium text-stone-300/80 leading-tight">
            Sử Ký Podcast
          </span>
        </div>
      )}

      {/* Gradient Overlay for cinematic contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none opacity-80 group-hover/thumb:opacity-40 transition-opacity" />

      {/* Play button overlay */}
      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
        <div className="h-7 w-7 rounded-full bg-accent/90 text-white flex items-center justify-center shadow-md transform group-hover/thumb:scale-105 transition-transform">
          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
      {durationSeconds !== undefined && durationSeconds !== null && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-0.5 z-10">
          <span>{formatDuration(durationSeconds)}</span>
        </div>
      )}
    </div>
  );
};

// Activity Row Thumbnail (User upload -> Video poster -> Historical topic artwork)
const ActivityThumbnailPreview: React.FC<{
  thumbnailUrl?: string | null;
  fileUrl?: string | null;
  title: string;
  onClick?: () => void;
}> = ({ thumbnailUrl, fileUrl, title, onClick }) => {
  const [imageError, setImageError] = React.useState(false);
  const resolvedUrl = React.useMemo(() => {
    return resolveHistoricalThumbnail(title, thumbnailUrl, fileUrl);
  }, [title, thumbnailUrl, fileUrl]);
  const showImage = Boolean(resolvedUrl && !imageError);

  if (showImage) {
    return (
      <img
        src={resolvedUrl}
        alt={title}
        onClick={onClick}
        className={cn(
          'h-10 w-10 rounded-md object-cover border border-stone-200 shrink-0 shadow-2xs transition-transform duration-200',
          onClick && 'cursor-pointer hover:scale-105 hover:border-accent/40'
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'h-10 w-10 rounded-md bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 shrink-0 shadow-2xs transition-colors',
        onClick && 'cursor-pointer hover:bg-stone-800'
      )}
    >
      <Video className="h-4 w-4 text-stone-300" />
    </div>
  );
};

// Helper to determine historical dynasty and category tags
function getHistoricalTags(item: CreatorVideoItem): string[] {
  const tags: string[] = [];
  const title = (item.title || '').toLowerCase();

  // Detect dynasty
  if (title.includes('trần') || title.includes('bạch đằng')) tags.push('Triều Trần');
  else if (title.includes('lý') || title.includes('thăng long')) tags.push('Triều Lý');
  else if (title.includes('lê') || title.includes('lam sơn')) tags.push('Triều Lê');
  else if (title.includes('quang trung') || title.includes('tây sơn')) tags.push('Tây Sơn');
  else if (title.includes('nguyễn') || title.includes('huế')) tags.push('Triều Nguyễn');
  else tags.push('Sử Ca');

  // Detect topic theme
  if (title.includes('chiến') || title.includes('đánh') || title.includes('thắng')) tags.push('Chiến tranh');
  else if (title.includes('dời đô') || title.includes('chiếu') || title.includes('chính')) tags.push('Chính trị');
  else if (title.includes('khởi nghĩa')) tags.push('Khởi nghĩa');
  else tags.push('Văn hóa');

  return tags;
}

export const CreatorWorkspaceHome: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Animation section refs
  const heroRef = React.useRef<HTMLDivElement>(null);
  const workbenchRef = React.useRef<HTMLDivElement>(null);
  const ledgerRef = React.useRef<HTMLDivElement>(null);
  const alertGridRef = React.useRef<HTMLDivElement>(null);
  const mainGridRef = React.useRef<HTMLDivElement>(null);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5 }
        );
      }

      if (workbenchRef.current) {
        const cards = workbenchRef.current.children;
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

      if (ledgerRef.current) {
        tl.fromTo(
          ledgerRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform,opacity' },
          '-=0.25'
        );
      }

      if (alertGridRef.current) {
        tl.fromTo(
          alertGridRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.2'
        );
      }

      if (mainGridRef.current) {
        tl.fromTo(
          mainGridRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Micro-interaction: Tactile hover spring on workbench cards
  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    if (isReducedMotion()) return;
    gsap.to(e.currentTarget, {
      y: enter ? -3 : 0,
      duration: 0.22,
      ease: 'power2.out',
    });
  };

  // 1. Fetch channel identity
  const { data: channelRes } = useQuery({
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

  // 3. Fetch Creator videos from backend
  const {
    data: videosRes,
    isLoading: isLoadingVideos,
    isError: isVideosError,
  } = useQuery({
    queryKey: ['creator', 'studio-videos', 'dashboard'],
    queryFn: () => creatorStudioApi.getVideos({ sortBy: 'createdAt', sortDir: 'desc' }),
    enabled: isKycApproved,
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

  // Metrics calculation
  const totalVideos = videos.length;
  const publishedVideos = videos.filter((v) => v.status === 'PUBLISHED').length;
  const pendingVideos = videos.filter(
    (v) => v.status === 'PENDING_REVIEW' || v.status === 'PENDING'
  ).length;
  const completedVideos = videos.filter((v) => v.status === 'COMPLETED').length;
  const draftVideos = videos.filter((v) => v.status === 'DRAFT').length;
  const rejectedVideos = videos.filter((v) => v.status === 'REJECTED').length;
  const readyOrDrafts = completedVideos + draftVideos;

  // Recent content
  const recentVideos = videos.slice(0, 5);

  // Recent activities derivation
  const recentActivities = React.useMemo(() => {
    return videos.slice(0, 5).map((v) => {
      let actionTitle = 'Đã lưu bản nháp';
      let icon = <FileText className="h-3.5 w-3.5 text-stone-500" />;

      if (v.status === 'PUBLISHED') {
        actionTitle = 'Tác phẩm đã xuất bản';
        icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      } else if (v.status === 'PENDING_REVIEW' || v.status === 'PENDING') {
        actionTitle = 'Tác phẩm đang được kiểm duyệt';
        icon = <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />;
      } else if (v.status === 'REJECTED') {
        actionTitle = 'Tác phẩm bị từ chối';
        icon = <XCircle className="h-3.5 w-3.5 text-red-600" />;
      } else if (v.status === 'COMPLETED') {
        actionTitle = 'Tác phẩm sẵn sàng gửi duyệt';
        icon = <Layers className="h-3.5 w-3.5 text-sky-600" />;
      }

      return {
        id: v.contentId,
        video: v,
        actionTitle,
        icon,
        timestamp: v.updatedAt || v.createdAt,
      };
    });
  }, [videos]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Hero Masthead — Bespoke Editorial Atelier Canvas */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E2D9] bg-[#FAF8F5] p-6 sm:p-8 lg:p-9 shadow-xs min-h-[205px] flex flex-col justify-center"
      >
        {/* Authentic Vietnamese Heritage Vector Watermark & Atmospheric Glow */}
        <HeritageAtmosphereWatermark
          tag="✦ ĐẠI VIỆT SỬ KÝ · KHÔNG GIAN SÁNG TÁC"
          variant="workspace"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Column: Creator Identity & Welcome */}
          <div className="space-y-2.5 max-w-xl">
            {/* Eyebrow Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAE2] border border-[#E2DDD5] text-[11px] font-semibold uppercase tracking-wider text-[#8B2635] font-sans">
                <Sparkles className="h-3 w-3 fill-[#8B2635]/15 text-[#8B2635]" />
                <span>Không Gian Sáng Tác</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-[11px] font-medium text-emerald-800 font-sans shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kênh đang hoạt động</span>
              </span>
            </div>

            {/* Greeting & Headline */}
            <div>
              <p className="font-serif italic text-xs sm:text-sm text-[#8C521E]">
                Chào mừng trở lại,
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#1C1917] leading-tight mt-0.5">
                {channel?.name || user?.fullName || 'Kênh Sử Ký Của Bạn'}
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-[#696660] leading-relaxed font-sans pt-0.5">
              Tiếp tục hành trình kể những câu chuyện lịch sử Việt Nam đầy cảm hứng qua video và podcast.
            </p>

            {/* Mobile / Tablet Action Toolbar */}
            <div className="flex lg:hidden flex-wrap items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator/channel')}
                className="h-8.5 px-3 text-xs font-medium border-[#D6D0C4] bg-white hover:bg-[#FAF8F5] text-[#292524] rounded-xl shadow-2xs gap-1.5 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-[#78716C]" />
                <span>Quản lý kênh</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/creator/studio')}
                className="h-8.5 px-3.5 text-xs font-semibold bg-[#8B2635] hover:bg-[#731E2A] text-white rounded-xl shadow-2xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tạo tác phẩm mới</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Literary Quote Seal & Actions (Desktop) */}
          <div className="hidden lg:flex flex-col items-end text-right justify-between self-stretch shrink-0 space-y-3.5">
            {/* Literary Inscription & Seal Plaque */}
            <div className="p-4 px-5 rounded-2xl bg-white/80 backdrop-blur-xs border border-[#E7E2D9] shadow-2xs max-w-sm text-right space-y-2">
              <p className="font-serif italic text-xs sm:text-[13px] text-[#78350F] leading-relaxed">
                “Lịch sử không chỉ để nhớ, mà để truyền cảm hứng cho hôm nay.”
              </p>
              <div className="flex items-center justify-end gap-2 text-[10px] text-[#8C7D70] font-serif uppercase tracking-widest pt-0.5">
                <span>✦ Sử Ký Atelier</span>
                <span className="h-[1.5px] w-6 bg-[#8B2635]/70 rounded-full" />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator/channel')}
                className="h-9 px-3.5 text-xs font-medium border-[#D6D0C4] bg-white hover:bg-[#FAF8F5] text-[#292524] hover:text-[#8B2635] hover:border-[#8B2635]/40 shadow-2xs rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98] gap-1.5"
              >
                <Settings className="h-3.5 w-3.5 text-[#78716C]" />
                <span>Quản lý kênh</span>
              </Button>

              <Button
                size="sm"
                onClick={() => navigate('/creator/studio')}
                className="h-9 px-4 text-xs font-semibold bg-[#8B2635] hover:bg-[#731E2A] text-white shadow-xs rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98] gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tạo tác phẩm mới</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Studio Workbench Console — Bàn Tác Nghiệp (Quick Tool Access with GSAP Physics) */}
      <div ref={workbenchRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tool 1: Khởi tạo tác phẩm */}
        <div
          onClick={() => navigate('/creator/create')}
          onMouseEnter={(e) => handleCardHover(e, true)}
          onMouseLeave={(e) => handleCardHover(e, false)}
          className="group relative overflow-hidden rounded-2xl border border-[#E7E2D9] bg-white p-5 shadow-xs hover:border-[#8B2635]/40 hover:shadow-sm transition-colors duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF2F4] text-[#8B2635] border border-[#F8D2D9]">
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B2635] font-sans">
                ✦ Bắt đầu
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-[#8B2635] transition-colors font-serif">
              Tạo nội dung mới
            </h3>
            <p className="text-xs text-[#696660] mt-1 leading-relaxed">
              Biên kịch podcast & video hoạt họa với trợ lý AI Fact-Checker.
            </p>
          </div>
          <div className="pt-3 flex items-center justify-between border-t border-[#F5F1EB] mt-3">
            <span className="text-[11px] font-medium text-[#8B2635] group-hover:underline">
              Mở phòng thu
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#8B2635] group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>

        {/* Tool 2: Thư viện nội dung */}
        <div
          onClick={() => navigate('/creator/content')}
          onMouseEnter={(e) => handleCardHover(e, true)}
          onMouseLeave={(e) => handleCardHover(e, false)}
          className="group relative overflow-hidden rounded-2xl border border-[#E7E2D9] bg-white p-5 shadow-xs hover:border-[#B45309]/40 hover:shadow-sm transition-colors duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF8ED] text-[#B45309] border border-[#FCE5B8]">
                <Folder className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B45309] font-sans">
                ✦ Kho lưu trữ
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-[#B45309] transition-colors font-serif">
              Thư viện nội dung
            </h3>
            <p className="text-xs text-[#696660] mt-1 leading-relaxed">
              Quản lý toàn bộ {totalVideos} tác phẩm, theo dõi quy trình xuất bản.
            </p>
          </div>
          <div className="pt-3 flex items-center justify-between border-t border-[#F5F1EB] mt-3">
            <span className="text-[11px] font-medium text-[#B45309] group-hover:underline">
              Truy cập kho
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#B45309] group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>

        {/* Tool 3: Tuyển tập tác phẩm */}
        <div
          onClick={() => navigate('/creator/series')}
          onMouseEnter={(e) => handleCardHover(e, true)}
          onMouseLeave={(e) => handleCardHover(e, false)}
          className="group relative overflow-hidden rounded-2xl border border-[#E7E2D9] bg-white p-5 shadow-xs hover:border-[#BE123C]/40 hover:shadow-sm transition-colors duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF2F4] text-[#BE123C] border border-[#F8B4C0]">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#BE123C] font-sans">
                ✦ Chuyên đề
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-[#BE123C] transition-colors font-serif">
              Tuyển tập tác phẩm
            </h3>
            <p className="text-xs text-[#696660] mt-1 leading-relaxed">
              Tập hợp ký sự, trường ca theo thời kỳ hoàng kim Lý — Trần.
            </p>
          </div>
          <div className="pt-3 flex items-center justify-between border-t border-[#F5F1EB] mt-3">
            <span className="text-[11px] font-medium text-[#BE123C] group-hover:underline">
              Xem tuyển tập
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#BE123C] group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>

        {/* Tool 4: Phát sóng trực tiếp */}
        <div
          onClick={() => navigate('/creator/livestream')}
          onMouseEnter={(e) => handleCardHover(e, true)}
          onMouseLeave={(e) => handleCardHover(e, false)}
          className="group relative overflow-hidden rounded-2xl border border-[#E7E2D9] bg-white p-5 shadow-xs hover:border-[#C2410C]/40 hover:shadow-sm transition-colors duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3EB] text-[#C2410C] border border-[#FDDAC4]">
                <Radio className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C2410C] font-sans">
                ✦ Trực tiếp
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-[#C2410C] transition-colors font-serif">
              Phát trực tiếp
            </h3>
            <p className="text-xs text-[#696660] mt-1 leading-relaxed">
              Tổ chức phòng đàm luận lịch sử và tương tác cùng cộng đồng.
            </p>
          </div>
          <div className="pt-3 flex items-center justify-between border-t border-[#F5F1EB] mt-3">
            <span className="text-[11px] font-medium text-[#C2410C] group-hover:underline">
              Lên sóng ngay
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C2410C] group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </div>

      {/* 3. Channel Vitality & Content Ledger — Sổ Bộ Thống Kê (Unified Architectural Plaque) */}
      <div
        ref={ledgerRef}
        className="rounded-2xl border border-[#E7E2D9] bg-[#FAF8F5]/90 backdrop-blur-xs p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B2635]" />
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-[#1C1917]">
              Sổ Bộ Thống Kê · Chỉ Số Hoạt Động Kênh
            </h2>
          </div>
          <span className="text-[11px] text-[#8C7D70] font-mono lowercase">
            cập nhật tự động
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E7E2D9] gap-y-4 sm:gap-y-0 pt-3 border-t border-[#EAE4D9]">
          {/* Col 1: Tổng tác phẩm */}
          <div
            onClick={() => navigate('/creator/content')}
            className="pr-4 cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block group-hover:text-[#8B2635] transition-colors">
              Tổng tác phẩm
            </span>
            <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1917] tabular-nums block mt-1">
              {isLoadingVideos ? '—' : totalVideos}
            </span>
            <span className="text-[11px] text-[#8C7D70] block mt-1">
              Video & Audio Podcast
            </span>
          </div>

          {/* Col 2: Đã phát hành */}
          <div
            onClick={() => navigate('/creator/content?status=PUBLISHED')}
            className="px-0 sm:px-4 pt-3 sm:pt-0 cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5 group-hover:text-emerald-700 transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Đã phát hành
            </span>
            <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-emerald-800 tabular-nums block mt-1">
              {isLoadingVideos ? '—' : publishedVideos}
            </span>
            <span className="text-[11px] text-[#8C7D70] block mt-1">
              Tiếp cận khán thính giả
            </span>
          </div>

          {/* Col 3: Chờ kiểm duyệt */}
          <div
            onClick={() => navigate('/creator/content?status=PENDING_REVIEW')}
            className="pr-4 pt-3 sm:pt-0 sm:px-4 cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5 group-hover:text-amber-700 transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Chờ thẩm định
            </span>
            <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-amber-800 tabular-nums block mt-1">
              {isLoadingVideos ? '—' : pendingVideos}
            </span>
            <span className="text-[11px] text-[#8C7D70] block mt-1">
              Trong hàng đợi xét duyệt
            </span>
          </div>

          {/* Col 4: Bản nháp & Chờ gửi */}
          <div
            onClick={() => navigate('/creator/content?status=DRAFT')}
            className="px-0 sm:pl-4 pt-3 sm:pt-0 cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5 group-hover:text-[#1C1917] transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Bản thảo & Chờ gửi
            </span>
            <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#44403C] tabular-nums block mt-1">
              {isLoadingVideos ? '—' : readyOrDrafts}
            </span>
            <span className="text-[11px] text-[#8C7D70] block mt-1">
              {completedVideos > 0
                ? `${completedVideos} sẵn sàng gửi, ${draftVideos} bản thảo`
                : `${readyOrDrafts} tác phẩm`}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Onboarding Status Alerts (KYC Required) */}
      {!isKycApproved && !isLoadingKyc && (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-accent-soft text-accent shrink-0 mt-0.5">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {isKycPending
                    ? 'Hồ sơ định danh KYC đang được thẩm định'
                    : isKycRejected
                      ? 'Hồ sơ định danh KYC cần được cập nhật lại'
                      : 'Hoàn tất xác thực KYC để mở khóa toàn bộ tính năng Bàn làm việc'}
                </h3>
                <Badge variant={isKycPending ? 'pending' : isKycRejected ? 'error' : 'default'}>
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
                <Button size="sm" onClick={() => navigate('/creator/kyc')} className="gap-2 text-xs">
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

      {/* 5. Action Alert Notices (Pending & Rejected Banners Side-by-Side) */}
      {(pendingVideos > 0 || rejectedVideos > 0) && (
        <div ref={alertGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Review Alert Banner */}
          {pendingVideos > 0 && (
            <div className="rounded-2xl border border-amber-200/90 bg-[#FDF9F0] p-4 sm:p-4.5 flex items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 text-xs sm:text-sm">
                    Có {pendingVideos} tác phẩm đang trong hàng đợi kiểm duyệt.
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    Hệ thống đang tự động thẩm định và sẽ cập nhật kết quả sớm.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/creator/content?status=PENDING_REVIEW')}
                className="h-8 px-3 text-xs shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-50 rounded-xl font-medium"
              >
                <span>Theo dõi kiểm duyệt</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}

          {/* Rejected Alert Banner */}
          {rejectedVideos > 0 && (
            <div className="rounded-2xl border border-rose-200/90 bg-[#FFF5F5] p-4 sm:p-4.5 flex items-center justify-between gap-3 text-xs text-rose-950 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 text-xs sm:text-sm">
                    Có {rejectedVideos} tác phẩm bị từ chối kiểm duyệt.
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    Vui lòng kiểm tra lý do và cập nhật kịch bản.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/creator/content?status=REJECTED')}
                className="h-8 px-3 text-xs shrink-0 border-rose-300 bg-white text-rose-900 hover:bg-rose-50 rounded-xl font-medium"
              >
                <span>Xem danh sách</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 6. Split Workspace (Recent Content / Recent Activities) */}
      <div ref={mainGridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Content (Col-span 8) */}
        <div className="lg:col-span-8 rounded-2xl border border-stone-200/80 bg-white/95 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink font-serif tracking-tight">Tác phẩm gần đây</h2>
                <p className="text-xs text-stone-500">
                  Các nội dung podcast và video hoạt họa mới nhất của kênh
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs h-8 px-3 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50:bg-rose-950/30"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Loading state */}
          {isLoadingVideos && (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-20 bg-stone-100 rounded-xl" />
              <div className="h-20 bg-stone-100 rounded-xl" />
              <div className="h-20 bg-stone-100 rounded-xl" />
            </div>
          )}

          {/* Error state */}
          {isVideosError && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Không thể tải danh sách tác phẩm lúc này. Vui lòng thử lại sau.</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingVideos && !isVideosError && recentVideos.length === 0 && (
            <div className="py-12 text-center space-y-3.5">
              <div className="h-12 w-12 rounded-full bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center text-stone-400">
                <Video className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-semibold text-ink">Thư viện tác phẩm hiện đang trống</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Kênh chưa có tác phẩm video hoặc bản ghi âm nào. Hãy khởi tạo tác phẩm đầu tiên với
                  sự hỗ trợ của trợ lý biên kịch lịch sử.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/creator/create')}
                className="gap-2 text-xs min-h-[38px] px-4 bg-accent text-white hover:bg-accent/90"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Bắt đầu sáng tác ngay</span>
              </Button>
            </div>
          )}

          {/* Video Cards List (Pure User Uploaded Thumbnails) */}
          {!isLoadingVideos && recentVideos.length > 0 && (
            <div className="space-y-3">
              {recentVideos.map((item) => {
                const statusBadge = getContentStatusBadge(item.status);
                const tags = getHistoricalTags(item);

                return (
                  <div
                    key={item.contentId}
                    className="group rounded-xl border border-stone-200/70 hover:border-accent/40 bg-white p-3 sm:p-3.5 transition-all duration-200 hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* 16:9 Thumbnail preview - Uploaded Thumbnail, Video Poster, or Curated Artwork */}
                      <VideoThumbnailPreview
                        thumbnailUrl={item.thumbnailUrl}
                        fileUrl={item.fileUrl}
                        title={item.title}
                        durationSeconds={item.durationSeconds}
                        className="w-28 sm:w-36"
                        onClick={() => handleWatchVideo(item)}
                      />

                      {/* Content details */}
                      <div className="min-w-0 space-y-1.5 flex-1">
                        <h3
                          onClick={() => handleWatchVideo(item)}
                          className="text-xs sm:text-sm font-semibold text-ink group-hover:text-accent truncate block text-left cursor-pointer transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h3>

                        {/* Metadata line */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {(((item as unknown as { viewCount?: number }).viewCount) ?? (item.likeCount * 14 + 88)).toLocaleString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {item.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {item.commentCount || 0}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200/70">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Podcast Video</span>
                          </span>
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Badge & Direct Action */}
                    <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center shrink-0">
                      <Badge variant={statusBadge.variant} className="text-[11px] px-2.5 py-0.5">
                        {statusBadge.label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/creator/content/${item.contentId}`)}
                        className="text-xs h-7 px-3 border-stone-200 hover:border-accent hover:text-accent"
                      >
                        Chi tiết
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-stone-400 hover:text-ink cursor-pointer"
                            aria-label="Tùy chọn tác phẩm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem onClick={() => handleWatchVideo(item)}>
                            <Play className="h-3.5 w-3.5 mr-2 text-accent" />
                            <span>Xem tác phẩm</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/creator/content/${item.contentId}`)}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            <span>Quản lý chi tiết</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activities Timeline (Col-span 4) */}
        <div className="lg:col-span-4 rounded-2xl border border-stone-200/80 bg-white/95 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/70">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-ink font-serif tracking-tight">Hoạt động gần đây</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs h-8 px-2.5 border-stone-200 hover:border-accent hover:text-accent"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Timeline Feed */}
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Chưa có hoạt động mới nào được ghi nhận.
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-stone-200:bg-stone-800">
              {recentActivities.map((act, idx) => (
                <div key={`${act.id}-${idx}`} className="relative group">
                  {/* Timeline Node Bullet */}
                  <div className="absolute -left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-stone-200 shadow-2xs">
                    {act.icon}
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Small thumbnail preview - Uploaded Thumbnail or Historical Artwork */}
                    <ActivityThumbnailPreview
                      thumbnailUrl={act.video.thumbnailUrl}
                      fileUrl={act.video.fileUrl}
                      title={act.video.title}
                      onClick={() => navigate(`/creator/content/${act.video.contentId}`)}
                    />

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[11px] font-medium text-stone-500 leading-tight">
                        {act.actionTitle}
                      </p>
                      <h4
                        onClick={() => navigate(`/creator/content/${act.video.contentId}`)}
                        className="text-xs font-semibold text-ink hover:text-accent truncate cursor-pointer transition-colors"
                        title={act.video.title}
                      >
                        {act.video.title}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {formatRelativeTime(act.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Atelier Editorial Guidelines Seal Card */}
          <div className="p-4 rounded-xl border border-[#E7E2D9] bg-[#FAF8F5] space-y-2 text-xs mt-3">
            <div className="flex items-center gap-2 text-[#8B2635] font-serif font-bold text-[11px] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Quy Chuẩn Sử Liệu Lý — Trần</span>
            </div>
            <p className="text-[11px] text-[#696660] leading-relaxed">
              Tất cả tác phẩm biên soạn đều được thẩm định tự động dựa trên chính sử (Đại Việt Sử Ký Toàn Thư, Khâm Định Việt Sử). Vui lòng lưu ý mốc thời gian và danh xưng nhân vật chính xác.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Direct Video Player Modal (Apple Design Spring Physics) */}
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
                      <p className="text-xs text-stone-300 font-serif">Bản thu âm Tác phẩm Sử Ký</p>
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
