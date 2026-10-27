import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  PlusCircle,
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

// Fallback topic thumbnails
const DEFAULT_TOPIC_THUMBNAILS = [
  '/assets/studio/topic-bach-dang.png',
  '/assets/studio/topic-thang-long.png',
  '/assets/studio/topic-dien-hong.png',
  '/assets/studio/topic-nhu-nguyet.png',
];

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

// Artwork Illustrations for the 4 Bottom Cards
const QuillAndScrollArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('pointer-events-none select-none', className)}
    aria-hidden="true"
  >
    <path
      d="M20 70 C35 50, 70 52, 90 70 C110 88, 140 85, 148 72 C152 65, 142 55, 125 58 C100 62, 75 42, 45 48 C25 52, 16 65, 20 70 Z"
      fill="#FEE2E2"
      fillOpacity="0.6"
      stroke="#E11D48"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M30 65 C55 58, 95 62, 135 72"
      stroke="#BE123C"
      strokeWidth="1"
      strokeDasharray="2 3"
    />
    <path
      d="M35 73 C60 66, 100 70, 130 78"
      stroke="#BE123C"
      strokeWidth="1"
      strokeDasharray="2 3"
    />
    {/* Quill Feather */}
    <path
      d="M138 22 C125 35, 110 65, 95 95 C98 90, 104 82, 112 75 C122 66, 136 50, 142 35 C146 25, 144 20, 138 22 Z"
      fill="#FFE4E6"
      stroke="#BE123C"
      strokeWidth="1.4"
    />
    <path
      d="M138 22 Q115 60 92 102"
      stroke="#9F1239"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
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
      x="25"
      y="78"
      width="95"
      height="18"
      rx="3"
      fill="#FEF3C7"
      stroke="#D97706"
      strokeWidth="1.2"
    />
    <path d="M32 78 V96 M115 78 V96" stroke="#B45309" strokeWidth="1" />
    {/* Middle Book */}
    <rect
      x="35"
      y="58"
      width="88"
      height="17"
      rx="3"
      fill="#FDE68A"
      stroke="#D97706"
      strokeWidth="1.2"
    />
    <path d="M42 58 V75 M118 58 V75" stroke="#B45309" strokeWidth="1" />
    {/* Open Manuscript on top */}
    <path
      d="M50 56 C68 46, 85 46, 92 52 C99 46, 116 46, 134 56 L128 42 C112 34, 98 34, 92 40 C86 34, 72 34, 56 42 Z"
      fill="#FFFBEB"
      stroke="#B45309"
      strokeWidth="1.2"
    />
    <path d="M92 40 V52" stroke="#92400E" strokeWidth="1.2" />
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
    {/* Headphones Band */}
    <path
      d="M45 70 C45 38, 115 38, 115 70"
      stroke="#E11D48"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <rect x="38" y="65" width="14" height="24" rx="6" fill="#FFE4E6" stroke="#BE123C" strokeWidth="1.4" />
    <rect x="108" y="65" width="14" height="24" rx="6" fill="#FFE4E6" stroke="#BE123C" strokeWidth="1.4" />
    {/* Classic Studio Microphone */}
    <rect x="72" y="38" width="16" height="28" rx="8" fill="#FEE2E2" stroke="#9F1239" strokeWidth="1.4" />
    <path d="M72 48 H88 M72 54 H88 M72 60 H88" stroke="#BE123C" strokeWidth="0.8" />
    <path d="M66 52 C66 68, 94 68, 94 52" stroke="#9F1239" strokeWidth="1.4" fill="none" />
    <path d="M80 66 V82 M68 82 H92" stroke="#9F1239" strokeWidth="1.6" strokeLinecap="round" />
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
    <circle cx="68" cy="36" r="14" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1.2" />
    <circle cx="68" cy="36" r="4" fill="#C2410C" />
    <circle cx="94" cy="36" r="14" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1.2" />
    <circle cx="94" cy="36" r="4" fill="#C2410C" />
    {/* Camera Body */}
    <rect x="52" y="48" width="56" height="32" rx="4" fill="#FED7AA" stroke="#C2410C" strokeWidth="1.4" />
    {/* Lens & Projection Beams */}
    <polygon points="108,54 130,42 130,74 108,62" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.2" />
    <path d="M136 46 L148 40 M136 58 L152 58 M136 70 L148 76" stroke="#F97316" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 3" />
    {/* Tripod Legs */}
    <path d="M80 80 L62 108 M80 80 L80 108 M80 80 L98 108" stroke="#9A3412" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Helper to determine historical tags for a video
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

  // 3. Fetch Creator videos
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

  // Metrics
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
      {/* 1. Hero Masthead Panorama */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-linear-to-r from-[#FFFDF9] via-[#FAF7F2] to-[#F5EFEB] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-6 sm:p-8 shadow-xs">
        {/* Historical Landscape Watermark Graphic */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 max-w-2xl bg-right bg-contain bg-no-repeat opacity-25 dark:opacity-15 pointer-events-none mix-blend-multiply dark:mix-blend-screen"
          style={{ backgroundImage: `url('/assets/studio/header-landscape.png')` }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs sm:text-sm font-serif italic text-stone-500 dark:text-stone-400">
              Chào mừng trở lại,
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-ink">
              {channel?.name || user?.fullName || 'Đại Việt Sử Ký'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
              Tiếp tục hành trình kể những câu chuyện lịch sử Việt Nam đầy cảm hứng qua video và bản ghi âm.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3.5 shrink-0">
            {/* Historical Philosophical Quote */}
            <div className="text-left md:text-right max-w-xs hidden lg:block">
              <p className="font-serif italic text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                “Lịch sử không chỉ để nhớ, mà để truyền cảm hứng cho hôm nay.”
              </p>
              <div className="w-12 h-[1px] bg-accent/40 md:ml-auto mt-1.5" />
            </div>

            {/* Floating Channel Quick Badge */}
            <div className="flex items-center gap-3 p-2 px-3.5 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md shadow-xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Radio className="h-4 w-4 animate-pulse" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-xs font-bold text-ink block truncate max-w-[140px]">
                  {channel?.name || 'Kênh Chưa Kích Hoạt'}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Kênh hoạt động
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator/channel')}
                className="h-7 px-2.5 text-xs ml-1 border-stone-200 dark:border-stone-800 hover:border-accent hover:text-accent"
              >
                Quản lý kênh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Onboarding Status Alerts (KYC Required) */}
      {!isKycApproved && !isLoadingKyc && (
        <div className="rounded-xl border border-stone-200 bg-surface p-5 shadow-xs">
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

      {/* 3. Action Alert Notices (Pending & Rejected Banners) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Review Alert Banner */}
        {pendingVideos > 0 && (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/60 p-4 flex items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink dark:text-amber-100">
                  Có {pendingVideos} tác phẩm đang trong hàng đợi kiểm duyệt.
                </p>
                <p className="text-[11px] text-stone-500 dark:text-amber-300/80 truncate">
                  Hệ thống đang tự động thẩm định và sẽ cập nhật kết quả sớm.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/creator/content?status=PENDING_REVIEW')}
              className="h-8 px-3 text-xs shrink-0 border-amber-300 bg-white/90 dark:bg-stone-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60"
            >
              <span>Theo dõi kiểm duyệt</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Rejected Alert Banner */}
        {rejectedVideos > 0 && (
          <div className="rounded-xl border border-red-200/90 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900/60 p-4 flex items-center justify-between gap-3 text-xs text-red-950 dark:text-red-200 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink dark:text-red-100">
                  Có {rejectedVideos} tác phẩm bị từ chối kiểm duyệt.
                </p>
                <p className="text-[11px] text-stone-500 dark:text-red-300/80 truncate">
                  Vui lòng kiểm tra lý do và cập nhật kịch bản.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/creator/content?status=REJECTED')}
              className="h-8 px-3 text-xs shrink-0 border-red-300 bg-white/90 dark:bg-stone-900 text-red-900 dark:text-red-200 hover:bg-red-100/60"
            >
              <span>Xem danh sách</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* 4. Four Core KPI Metrics Cards with Editorial Bar Sparklines */}
      <div ref={kpiGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng tác phẩm */}
        <div
          onClick={() => navigate('/creator/content')}
          className="group rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-accent/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-accent dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
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
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                Video &amp; Bản ghi âm
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
          className="group rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-emerald-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                ĐÃ XUẤT BẢN
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 tracking-tight block">
                {isLoadingVideos ? '—' : publishedVideos}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                Tác phẩm công khai
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
          className="group rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-amber-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                CHỜ KIỂM DUYỆT
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 tracking-tight block">
                {isLoadingVideos ? '—' : pendingVideos}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                Tác phẩm đang thẩm định
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
          className="group rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-stone-400 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
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
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5 truncate max-w-[150px]">
                {completedVideos > 0
                  ? `${completedVideos} chờ gửi duyệt, ${draftVideos} bản nháp`
                  : 'Đang biên tập kịch bản'}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Content (Col-span 8) */}
        <div className="lg:col-span-8 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink font-serif tracking-tight">Tác phẩm gần đây</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Các nội dung bản ghi âm và video hoạt họa mới nhất của kênh
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs h-8 px-3 gap-1.5 border-stone-200 dark:border-stone-800 hover:border-accent hover:text-accent"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Loading state */}
          {isLoadingVideos && (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-xl" />
              <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-xl" />
              <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-xl" />
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
              <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 mx-auto flex items-center justify-center text-stone-400">
                <Video className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-semibold text-ink">Thư viện tác phẩm hiện đang trống</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
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

          {/* Video Cards List */}
          {!isLoadingVideos && recentVideos.length > 0 && (
            <div className="space-y-3">
              {recentVideos.map((item, idx) => {
                const statusBadge = getContentStatusBadge(item.status);
                const tags = getHistoricalTags(item);
                const thumbUrl = item.thumbnailUrl || DEFAULT_TOPIC_THUMBNAILS[idx % DEFAULT_TOPIC_THUMBNAILS.length];

                return (
                  <div
                    key={item.contentId}
                    className="group rounded-xl border border-stone-200/70 dark:border-stone-800 hover:border-accent/40 bg-white dark:bg-stone-900/60 p-3 sm:p-3.5 transition-all duration-200 hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* 16:9 Thumbnail preview */}
                      <div
                        onClick={() => handleWatchVideo(item)}
                        className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden shrink-0 border border-stone-200/80 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 cursor-pointer shadow-2xs group/thumb"
                      >
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_TOPIC_THUMBNAILS[0];
                          }}
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="h-7 w-7 rounded-full bg-accent/90 text-white flex items-center justify-center shadow-md">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Duration badge */}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-0.5">
                          <span>{formatDuration(item.durationSeconds)}</span>
                        </div>
                      </div>

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
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {(item.viewCount || 0).toLocaleString('vi-VN')}
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Video Sử Ký</span>
                          </span>
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700"
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
                        className="text-xs h-7 px-3 border-stone-200 dark:border-stone-800 hover:border-accent hover:text-accent"
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
        <div className="lg:col-span-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-ink font-serif tracking-tight">Hoạt động gần đây</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs h-8 px-2.5 border-stone-200 dark:border-stone-800 hover:border-accent hover:text-accent"
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
            <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-stone-200 dark:before:bg-stone-800">
              {recentActivities.map((act, idx) => (
                <div key={`${act.id}-${idx}`} className="relative group">
                  {/* Timeline Node Bullet */}
                  <div className="absolute -left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xs">
                    {act.icon}
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Small thumbnail preview */}
                    <img
                      src={act.video.thumbnailUrl || DEFAULT_TOPIC_THUMBNAILS[idx % DEFAULT_TOPIC_THUMBNAILS.length]}
                      alt={act.video.title}
                      className="h-10 w-10 rounded-md object-cover border border-stone-200 dark:border-stone-800 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_TOPIC_THUMBNAILS[0];
                      }}
                    />

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 leading-tight">
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

      {/* 6. Four Illustrated Quick Action Entry Points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Action 1: Tạo nội dung mới */}
        <div
          onClick={() => navigate('/creator/create')}
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-accent/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle Decorative Artwork */}
          <QuillAndScrollArtwork className="absolute right-0 -bottom-2 w-28 h-20 opacity-40 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300" />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent mb-3.5 group-hover:scale-105 transition-transform">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
              Tạo nội dung mới
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed max-w-[180px]">
              Sáng tạo video, bản ghi âm lịch sử với sự hỗ trợ của AI.
            </p>
          </div>
          <div className="pt-5 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-accent group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Action 2: Thư viện nội dung */}
        <div
          onClick={() => navigate('/creator/content')}
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-amber-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle Decorative Artwork */}
          <BooksStackArtwork className="absolute right-0 -bottom-2 w-28 h-20 opacity-40 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300" />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 mb-3.5 group-hover:scale-105 transition-transform">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-ink group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              Thư viện nội dung
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed max-w-[180px]">
              Quản lý toàn bộ tác phẩm, lọc theo trạng thái.
            </p>
          </div>
          <div className="pt-5 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Action 3: Tuyển tập Tác phẩm */}
        <div
          onClick={() => navigate('/creator/series')}
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-rose-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle Decorative Artwork */}
          <MicrophoneArtwork className="absolute right-0 -bottom-2 w-28 h-20 opacity-40 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300" />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 mb-3.5 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-ink group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
              Tuyển tập Tác phẩm
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed max-w-[180px]">
              Khám phá các tuyển tập theo chủ đề lịch sử.
            </p>
          </div>
          <div className="pt-5 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Action 4: Phát trực tiếp */}
        <div
          onClick={() => navigate('/creator/livestream')}
          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 p-5 shadow-xs hover:border-orange-500/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          {/* Subtle Decorative Artwork */}
          <CameraBroadcastArtwork className="absolute right-0 -bottom-2 w-28 h-20 opacity-40 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300" />

          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 mb-3.5 group-hover:scale-105 transition-transform">
              <Tv className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-ink group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
              Phát trực tiếp
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed max-w-[180px]">
              Tổ chức phát sóng trực tiếp thảo luận về lịch sử cùng cộng đồng.
            </p>
          </div>
          <div className="pt-5 flex items-center justify-between relative z-10">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-orange-600 group-hover:text-white transition-all">
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
