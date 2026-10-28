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
  Tv,
  ChevronRight,
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
import { isReducedMotion, MOTION_CONFIG } from '@/utils/motion';
import { cn } from '@/utils/cn';
import {
  resolveVideoThumbnail,
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

// Helper mini sparkline distribution bars
const MiniSparklineBars: React.FC<{
  heights: number[];
  colorClass: string;
}> = ({ heights, colorClass }) => (
  <div className="flex items-end gap-[3px] h-8 shrink-0 select-none" aria-hidden="true">
    {heights.map((h, i) => (
      <div
        key={i}
        style={{ height: `${Math.max(8, Math.round(h * 32))}px` }}
        className={cn('w-[3px] rounded-full transition-all duration-300', colorClass)}
      />
    ))}
  </div>
);

// High-Fidelity Artwork Illustrations for the 4 Bottom Quick Action Cards
const QuillAndScrollArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('pointer-events-none select-none', className)}
    aria-hidden="true"
  >
    {/* Background paper scroll flourish */}
    <path
      d="M18 78 C35 55, 68 56, 88 74 C108 92, 138 90, 148 76 C152 70, 145 60, 130 63 C105 68, 78 46, 48 52 C28 56, 16 72, 18 78 Z"
      fill="#FFF1F2"
      fillOpacity="0.8"
      stroke="#F43F5E"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Flourish writing dashes */}
    <path
      d="M28 72 C55 64, 95 68, 135 80"
      stroke="#E11D48"
      strokeWidth="1.2"
      strokeDasharray="2.5 3.5"
      strokeLinecap="round"
    />
    <path
      d="M36 80 C60 74, 98 77, 128 86"
      stroke="#E11D48"
      strokeWidth="1.2"
      strokeDasharray="2.5 3.5"
      strokeLinecap="round"
    />
    {/* Elegant Quill Pen */}
    <path
      d="M142 16 C130 30, 114 62, 96 96 C100 90, 107 82, 115 74 C126 64, 140 48, 146 32 C150 20, 147 14, 142 16 Z"
      fill="#FFE4E6"
      stroke="#BE123C"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    {/* Quill rachis / stem */}
    <path
      d="M142 16 Q118 58 92 104"
      stroke="#9F1239"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Ink drop */}
    <circle cx="90" cy="107" r="1.8" fill="#9F1239" />
  </svg>
);

const BooksStackArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('pointer-events-none select-none', className)}
    aria-hidden="true"
  >
    {/* Bottom Book */}
    <rect
      x="24"
      y="80"
      width="98"
      height="18"
      rx="3"
      fill="#FEF3C7"
      stroke="#D97706"
      strokeWidth="1.3"
    />
    <path d="M32 80 V98 M114 80 V98" stroke="#B45309" strokeWidth="1" strokeDasharray="1.5 2" />
    {/* Middle Book */}
    <rect
      x="34"
      y="60"
      width="90"
      height="17"
      rx="3"
      fill="#FDE68A"
      stroke="#D97706"
      strokeWidth="1.3"
    />
    <path d="M42 60 V77 M116 60 V77" stroke="#B45309" strokeWidth="1" strokeDasharray="1.5 2" />
    {/* Open Manuscript Book on Top */}
    <path
      d="M48 56 C68 44, 85 45, 92 51 C99 45, 116 44, 136 56 L130 42 C114 33, 98 34, 92 40 C86 34, 70 33, 54 42 Z"
      fill="#FFFBEB"
      stroke="#B45309"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    {/* Center Book Spine Line */}
    <path d="M92 40 V51" stroke="#92400E" strokeWidth="1.4" strokeLinecap="round" />
    {/* Page detail lines */}
    <path d="M62 46 C72 41, 82 42, 88 46" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2 2" />
    <path d="M96 46 C102 42, 112 41, 122 46" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2 2" />
  </svg>
);

const MicrophoneArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('pointer-events-none select-none', className)}
    aria-hidden="true"
  >
    {/* Headphones Arch */}
    <path
      d="M42 72 C42 36, 118 36, 118 72"
      stroke="#E11D48"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Left Ear Cushion */}
    <rect x="36" y="66" width="13" height="24" rx="6" fill="#FFE4E6" stroke="#BE123C" strokeWidth="1.3" />
    {/* Right Ear Cushion */}
    <rect x="111" y="66" width="13" height="24" rx="6" fill="#FFE4E6" stroke="#BE123C" strokeWidth="1.3" />
    {/* Studio Capsule Microphone */}
    <rect x="71" y="36" width="18" height="30" rx="9" fill="#FEE2E2" stroke="#9F1239" strokeWidth="1.4" />
    {/* Grille mesh horizontal ribs */}
    <path d="M71 44 H89 M71 50 H89 M71 56 H89" stroke="#BE123C" strokeWidth="0.9" />
    {/* Suspension U-bracket */}
    <path d="M64 50 C64 68, 96 68, 96 50" stroke="#9F1239" strokeWidth="1.4" fill="none" />
    {/* Mic Stand Post & Base */}
    <path d="M80 68 V86" stroke="#9F1239" strokeWidth="1.6" strokeLinecap="round" />
    <ellipse cx="80" cy="88" rx="14" ry="4" fill="#FFE4E6" stroke="#9F1239" strokeWidth="1.3" />
  </svg>
);

const CameraBroadcastArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('pointer-events-none select-none', className)}
    aria-hidden="true"
  >
    {/* Dual Film Reels */}
    <circle cx="66" cy="34" r="14" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1.3" />
    <circle cx="66" cy="34" r="4.5" fill="#C2410C" />
    <circle cx="94" cy="34" r="14" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1.3" />
    <circle cx="94" cy="34" r="4.5" fill="#C2410C" />
    {/* Camera Main Body */}
    <rect x="50" y="46" width="58" height="32" rx="4" fill="#FED7AA" stroke="#C2410C" strokeWidth="1.4" />
    <circle cx="70" cy="62" r="6" stroke="#EA580C" strokeWidth="1" fill="#FFEDD5" />
    {/* Optical Lens */}
    <polygon points="108,52 130,40 130,74 108,62" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.3" />
    {/* Projection Rays */}
    <path d="M136 44 L148 38 M136 57 L152 57 M136 70 L148 76" stroke="#F97316" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="2 3" />
    {/* Wooden Tripod Legs */}
    <path d="M79 78 L60 108 M79 78 L79 108 M79 78 L98 108" stroke="#9A3412" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

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
}> = ({ thumbnailUrl, fileUrl, title }) => {
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
        className="h-10 w-10 rounded-md object-cover border border-stone-200 shrink-0 shadow-2xs"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-md bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 shrink-0 shadow-2xs">
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
  const alertGridRef = React.useRef<HTMLDivElement>(null);
  const kpiGridRef = React.useRef<HTMLDivElement>(null);
  const mainGridRef = React.useRef<HTMLDivElement>(null);
  const quickActionsRef = React.useRef<HTMLDivElement>(null);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: MOTION_CONFIG.ease } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5 }
        );
      }

      if (alertGridRef.current) {
        tl.fromTo(
          alertGridRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.3'
        );
      }

      if (kpiGridRef.current) {
        const kpiCards = kpiGridRef.current.children;
        tl.fromTo(
          kpiCards,
          { opacity: 0, y: 15, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.06,
            clearProps: 'transform,opacity',
          },
          '-=0.25'
        );
      }

      if (mainGridRef.current) {
        tl.fromTo(
          mainGridRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (quickActionsRef.current) {
        const actionCards = quickActionsRef.current.children;
        tl.fromTo(
          actionCards,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.06,
            clearProps: 'transform,opacity',
          },
          '-=0.2'
        );
      }
    });

    return () => ctx.revert();
  }, []);

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
      {/* 1. Hero Masthead Panorama (Matching Reference Image 100%) */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-[#F7F2EA] p-6 sm:p-7 md:p-8 shadow-xs min-h-[195px] flex flex-col justify-center"
      >
        {/* Historical Khuê Văn Các Panorama - Full-bleed, Seamless Authenticity */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none mix-blend-multiply opacity-95"
          style={{
            backgroundImage: `url('/assets/studio/header-landscape-warm-v2.png')`,
          }}
          aria-hidden="true"
        />

        {/* Soft Left Protective Gradient for Title and Subtitle Legibility */}
        <div
          className="absolute inset-y-0 left-0 w-3/5 sm:w-1/2 bg-gradient-to-r from-[#F7F2EA] via-[#F7F2EA]/95 via-45% to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs sm:text-sm font-serif italic text-[#92400e]">
              Chào mừng trở lại,
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
              {channel?.name || user?.fullName || 'Dai Viet Su Ky Podcast'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
              Tiếp tục hành trình kể những câu chuyện lịch sử Việt Nam đầy cảm hứng qua video và podcast.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-between self-stretch shrink-0 gap-3.5">
            {/* Historical Philosophical Quote - Matching Reference Image */}
            <div className="hidden lg:block text-right">
              <p className="font-serif italic text-sm lg:text-base text-[#92400e] leading-snug">
                “Lịch sử không chỉ để nhớ,<br />
                mà để truyền cảm hứng<br />
                cho hôm nay.”
              </p>
              <div className="h-[2px] w-12 bg-[#be123c] ml-auto mt-1 rounded-full" />
            </div>

            {/* Floating Channel Quick Card with Direct Navigation */}
            <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl border border-stone-200/90 bg-white/95 backdrop-blur-md shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Radio className="h-4 w-4 animate-pulse" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-xs sm:text-sm font-bold text-stone-900 block truncate max-w-[160px]">
                  {channel?.name || user?.fullName || 'Dai Viet Su Ky Podcast'}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Kênh hoạt động
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator/channel')}
                className="h-7 px-2.5 text-xs ml-1 border-stone-200 hover:border-accent hover:text-accent gap-1 rounded-lg"
              >
                <Settings className="h-3 w-3 text-stone-500" />
                <span>Quản lý kênh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Onboarding Status Alerts (KYC Required) */}
      {!isKycApproved && !isLoadingKyc && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
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

      {/* 3. Action Alert Notices (Pending & Rejected Banners Side-by-Side) */}
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

      {/* 4. Four Core KPI Metrics Cards with Editorial Bar Sparklines */}
      <div ref={kpiGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng tác phẩm */}
        <div
          onClick={() => navigate('/creator/content')}
          className="group rounded-2xl border border-stone-200/80 bg-white/95 p-5 shadow-xs hover:border-accent/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-accent border border-rose-200/60">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                TỔNG TÁC PHẨM
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-ink tracking-tight block">
                {isLoadingVideos ? '—' : totalVideos}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Video &amp; Audio Podcast
              </span>
            </div>
            <MiniSparklineBars
              heights={[0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 0.75, 1.0, 0.85]}
              colorClass="bg-rose-400/60 group-hover:bg-accent transition-colors"
            />
          </div>
        </div>

        {/* Card 2: Đã xuất bản */}
        <div
          onClick={() => navigate('/creator/content?status=PUBLISHED')}
          className="group rounded-2xl border border-stone-200/80 bg-white/95 p-5 shadow-xs hover:border-emerald-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                ĐÃ XUẤT BẢN
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-emerald-700 tracking-tight block">
                {isLoadingVideos ? '—' : publishedVideos}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Tác phẩm
              </span>
            </div>
            <MiniSparklineBars
              heights={[0.2, 0.35, 0.5, 0.45, 0.7, 0.6, 0.85, 0.9, 1.0]}
              colorClass="bg-emerald-500/60 group-hover:bg-emerald-600 transition-colors"
            />
          </div>
        </div>

        {/* Card 3: Chờ kiểm duyệt */}
        <div
          onClick={() => navigate('/creator/content?status=PENDING_REVIEW')}
          className="group rounded-2xl border border-stone-200/80 bg-white/95 p-5 shadow-xs hover:border-amber-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                CHỜ KIỂM DUYỆT
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-amber-700 tracking-tight block">
                {isLoadingVideos ? '—' : pendingVideos}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Tác phẩm
              </span>
            </div>
            <MiniSparklineBars
              heights={[0.4, 0.6, 0.5, 0.8, 0.95, 0.7, 0.85, 0.9, 0.75]}
              colorClass="bg-amber-500/60 group-hover:bg-amber-600 transition-colors"
            />
          </div>
        </div>

        {/* Card 4: Bản nháp & Chờ gửi */}
        <div
          onClick={() => navigate('/creator/content?status=DRAFT')}
          className="group rounded-2xl border border-stone-200/80 bg-white/95 p-5 shadow-xs hover:border-stone-400 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200/60">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                BẢN NHÁP &amp; CHỜ GỬI
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-ink tracking-tight block">
                {isLoadingVideos ? '—' : readyOrDrafts}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5 truncate max-w-[150px]">
                {completedVideos > 0
                  ? `${completedVideos} chờ gửi duyệt, ${draftVideos} bản nháp`
                  : `${readyOrDrafts} tác phẩm`}
              </span>
            </div>
            <MiniSparklineBars
              heights={[0.2, 0.4, 0.35, 0.6, 0.5, 0.7, 0.8, 0.65, 0.75]}
              colorClass="bg-stone-400/60 group-hover:bg-stone-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 5. Awwwards Split Workspace (65% Recent Content / 35% Recent Activities) */}
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
        </div>
      </div>

      {/* 6. Four Illustrated Quick Action Entry Points (Matching Reference Image 100%) */}
      <div ref={quickActionsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Action 1: Tạo nội dung mới */}
        <div
          onClick={() => navigate('/creator/create')}
          className="group relative overflow-hidden rounded-2xl border border-[#F8DADA] bg-gradient-to-br from-[#FEF2F2] via-[#FFF6F6] to-white p-5 shadow-xs hover:border-rose-300:border-rose-800 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[175px]"
        >
          {/* Authentic Watercolor Artwork Illustration */}
          <img
            src="/assets/studio/action-quill-clean.png"
            alt="Tạo nội dung mới"
            className="absolute right-0 bottom-0 w-36 h-28 object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-300 select-none"
          />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE2E4] text-[#BE123C] border border-[#F8B4B4]/40 mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#881337] transition-colors">
              Tạo nội dung mới
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-[190px]">
              Sáng tạo video, podcast lịch sử với sự hỗ trợ của AI.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#BE123C] shadow-xs border border-rose-200/60 group-hover:bg-[#BE123C] group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Action 2: Thư viện nội dung */}
        <div
          onClick={() => navigate('/creator/content')}
          className="group relative overflow-hidden rounded-2xl border border-[#FCE5B8] bg-gradient-to-br from-[#FEF8ED] via-[#FFFBF2] to-white p-5 shadow-xs hover:border-amber-300:border-amber-800 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[175px]"
        >
          {/* Authentic Watercolor Artwork Illustration */}
          <img
            src="/assets/studio/action-books-clean.png"
            alt="Thư viện nội dung"
            className="absolute right-0 bottom-0 w-36 h-28 object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-300 select-none"
          />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE7C4] text-[#B45309] border border-[#FCD38D]/40 mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
              <Folder className="h-5 w-5" />
            </div>
            <h3 className="text-[15px] font-bold text-[#78350F] transition-colors">
              Thư viện nội dung
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-[190px]">
              Quản lý toàn bộ tác phẩm, lọc theo trạng thái.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#B45309] shadow-xs border border-amber-200/60 group-hover:bg-[#B45309] group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Action 3: Tuyển tập Podcast */}
        <div
          onClick={() => navigate('/creator/series')}
          className="group relative overflow-hidden rounded-2xl border border-[#F8D2D9] bg-gradient-to-br from-[#FDF2F4] via-[#FFF7F8] to-white p-5 shadow-xs hover:border-rose-300:border-rose-800 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[175px]"
        >
          {/* Authentic Watercolor Artwork Illustration */}
          <img
            src="/assets/studio/action-podcast-clean.png"
            alt="Tuyển tập Podcast"
            className="absolute right-0 bottom-0 w-36 h-28 object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-300 select-none"
          />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCD8DF] text-[#BE123C] border border-[#F8B4C0]/40 mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-[15px] font-bold text-[#881337] transition-colors">
              Tuyển tập Podcast
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-[190px]">
              Khám phá các tuyển tập theo chủ đề lịch sử.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#BE123C] shadow-xs border border-rose-200/60 group-hover:bg-[#BE123C] group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Action 4: Phát trực tiếp */}
        <div
          onClick={() => navigate('/creator/livestream')}
          className="group relative overflow-hidden rounded-2xl border border-[#FDDAC4] bg-gradient-to-br from-[#FFF3EB] via-[#FFF8F4] to-white p-5 shadow-xs hover:border-orange-300:border-orange-800 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[175px]"
        >
          {/* Authentic Watercolor Artwork Illustration */}
          <img
            src="/assets/studio/action-livestream-clean.png"
            alt="Phát trực tiếp"
            className="absolute right-0 bottom-0 w-36 h-28 object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-300 select-none"
          />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE2D2] text-[#C2410C] border border-[#FDBA95]/40 mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="text-[15px] font-bold text-[#9A3412] transition-colors">
              Phát trực tiếp
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-[190px]">
              Tổ chức livestream thảo luận về lịch sử cùng cộng đồng.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#C2410C] shadow-xs border border-orange-200/60 group-hover:bg-[#C2410C] group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
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
