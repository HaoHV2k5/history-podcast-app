import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Video,
  FileText,
  User,
  Clock,
  Calendar,
  Tag,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Check,
  Info,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  MoreVertical,
} from 'lucide-react';
import { AdminModerationItem } from '@/types/moderation';
import { moderationApi } from '@/services/api/moderation';
import {
  formatStackedDateTime,
  formatVideoDuration,
  cleanMarkdownTitle,
  resolveModerationRowThumbnail,
  resolveHistoricalCategory,
} from '../moderationLogic';
import { resolveMediaUrl } from '@/features/studio/creatorStudioUtils';
import { cn } from '@/utils/cn';

interface AdminModerationDetailModalProps {
  item: AdminModerationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: number, reason: string) => void;
  onReject: (id: number, reason: string) => void;
  isSubmitting?: boolean;
}

export const AdminModerationDetailModal: React.FC<AdminModerationDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isTransitioningToDetail, setIsTransitioningToDetail] = useState(false);

  // Video interactive state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch full real-time record from backend when modal is opened
  const { data: detailResponse } = useQuery({
    queryKey: ['admin-moderation-detail-modal', item?.reviewId],
    queryFn: () => moderationApi.getReviewDetail(item!.reviewId),
    enabled: Boolean(isOpen && item?.reviewId),
  });

  // Reset video playback state and trigger gentle entrance when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setShowRejectForm(false);
      setRejectReason('');
      setIsTransitioningToDetail(false);
      // Gentle delayed mount frame for silky entrance
      requestAnimationFrame(() => {
        setIsMounted(true);
      });
    } else {
      setIsMounted(false);
    }
  }, [item?.reviewId, isOpen]);

  // Lock body scroll and prevent background leakage when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const fullItem = detailResponse?.data || item;
  const displayTitle = cleanMarkdownTitle(fullItem.title);
  const timeStacked = formatStackedDateTime(fullItem.createdAt);
  const isPending = fullItem.decision === 'PENDING';
  const category = resolveHistoricalCategory(fullItem.title);

  const thumbnailSrc = resolveModerationRowThumbnail(
    fullItem.title,
    fullItem.optimizedUrl || fullItem.fileUrl
  );

  const mediaSource =
    fullItem.optimizedUrl || fullItem.fileUrl
      ? resolveMediaUrl(fullItem.optimizedUrl || fullItem.fileUrl!)
      : '';

  // AI Shield Scoring & Tier Presentation (Zero Fake Data: no hardcoded 95.0)
  const scoreNum =
    fullItem.aiShieldScore != null ? Number(fullItem.aiShieldScore) : null;
  const scoreFormatted =
    scoreNum !== null ? `${Math.min(100, Math.max(0, scoreNum)).toFixed(1)}%` : '--';
  const tier = (fullItem.aiShieldTier || 'EXCELLENT').toUpperCase();

  let tierLabel = 'Xuất sắc';
  let tierSubtitle = 'Nội dung an toàn, phù hợp';
  let tierBoxClass = 'border-[#C7EED8] bg-[#EAF7EE] text-[#065F46]';
  let tierIcon = (
    <ShieldCheck className="h-8 w-8 text-[#059669] shrink-0" strokeWidth={1.8} />
  );
  let checklist = [
    'Nội dung hợp lệ',
    'Không vi phạm chính sách',
    'Chất lượng nội dung tốt',
  ];

  if (tier === 'GOOD') {
    tierLabel = 'Tốt';
    tierSubtitle = 'Nội dung phù hợp xuất bản';
    tierBoxClass = 'border-[#C7EED8] bg-[#EAF7EE] text-[#065F46]';
    tierIcon = (
      <ShieldCheck className="h-8 w-8 text-[#059669] shrink-0" strokeWidth={1.8} />
    );
    checklist = [
      'Nội dung hợp lệ',
      'Không vi phạm chính sách',
      'Chất lượng nội dung tốt',
    ];
  } else if (tier === 'FAIR') {
    tierLabel = 'Khá';
    tierSubtitle = 'Cần xem xét một số yếu tố';
    tierBoxClass = 'border-amber-200/80 bg-[#FFFBEB] text-[#92400E]';
    tierIcon = (
      <AlertTriangle className="h-8 w-8 text-[#D97706] shrink-0" strokeWidth={1.8} />
    );
    checklist = [
      'Nội dung cơ bản phù hợp',
      'Cần đối chiếu tư liệu gốc',
      'Đề xuất kiểm tra bổ sung',
    ];
  } else if (tier === 'RED_ALERT') {
    tierLabel = 'Báo động đỏ';
    tierSubtitle = 'Nội dung nhạy cảm, từ chối';
    tierBoxClass = 'border-rose-200/80 bg-[#FEF2F2] text-[#991B1B]';
    tierIcon = (
      <ShieldAlert className="h-8 w-8 text-[#DC2626] shrink-0" strokeWidth={1.8} />
    );
    checklist = [
      'Phát hiện nội dung nhạy cảm',
      'Cần điều hành viên xác minh',
      'Đề xuất chỉnh sửa kịch bản',
    ];
  }

  // Script text from real backend
  const scriptText =
    fullItem.markdownContent ||
    fullItem.aiShieldReason ||
    'Chưa có dữ liệu trích xuất kịch bản chi tiết từ hệ thống AI Shield.';

  // Recommendation text from real backend (cleans duplicate prefixes and formats naturally)
  let recommendationText = '';
  if (fullItem.adminReason) {
    if (fullItem.adminReason.startsWith('AI Shield:')) {
      recommendationText = fullItem.adminReason;
    } else if (fullItem.decision === 'REJECTED') {
      const cleanReason = fullItem.adminReason.replace(/^Lý do từ chối:\s*/i, '');
      recommendationText = `Lý do từ chối: ${cleanReason}`;
    } else {
      recommendationText = fullItem.adminReason;
    }
  } else if (fullItem.aiShieldReason) {
    recommendationText = fullItem.aiShieldReason.startsWith('AI Shield:')
      ? fullItem.aiShieldReason
      : `AI Shield: ${fullItem.aiShieldReason}`;
  } else {
    recommendationText = 'Hồ sơ đang chờ điều hành viên thẩm định và đưa ra quyết định.';
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onReject(fullItem.reviewId, rejectReason.trim());
    setShowRejectForm(false);
    setRejectReason('');
  };

  // Video Player Control Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration || fullItem.durationSeconds || 0);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  // Video player duration formatting helper
  const formatTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  // Zero Fake Data: Duration derived strictly from real media or record
  const effectiveDuration = videoDuration || fullItem.durationSeconds || 0;
  const durationDisplay = formatTime(effectiveDuration);
  const currentDisplay = formatTime(currentTime);
  const scrubPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  // Gentle transition to standalone detail page
  const handleNavigateToDetail = () => {
    if ('startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        onClose();
        navigate(`/admin/moderation/${fullItem.reviewId}`);
      });
    } else {
      setIsTransitioningToDetail(true);
      setTimeout(() => {
        onClose();
        navigate(`/admin/moderation/${fullItem.reviewId}`);
      }, 200);
    }
  };

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto transition-all duration-300 ease-out',
        isMounted && !isTransitioningToDetail
          ? 'bg-black/60 backdrop-blur-xs opacity-100'
          : 'bg-black/0 opacity-0 pointer-events-none'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Card with Apple-grade smooth spring physics curve */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-moderation-title"
        className={cn(
          'relative z-10 w-full max-w-[1248px] overflow-hidden rounded-[24px] border border-[#E0DDD7] bg-[#FAF8F5] shadow-2xl flex flex-col max-h-[94vh] select-none transition-all duration-350',
          isMounted && !isTransitioningToDetail
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-[0.96] translate-y-3'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header with Authentic Watercolor Pagoda Backdrop */}
        <div className="relative overflow-hidden border-b border-[#EAE6DF] bg-white px-7 py-5 shrink-0">
          {/* Authentic red watercolor Pagoda & Pine Trees backdrop matching exact reference */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 right-[200px] sm:right-[212px] w-[380px] sm:w-[460px] md:w-[485px] bg-contain bg-right-bottom bg-no-repeat select-none z-0"
            style={{
              backgroundImage: "url('/assets/studio/admin-moderation-modal-pagoda.png')",
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            {/* Left: Category Icon & Title */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF5F5] border border-rose-200/70 text-[#991B1B] shadow-2xs">
                <Video className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#991B1B] block">
                  HỒ SƠ KIỂM DUYỆT #{fullItem.reviewId}
                </span>
                <h2
                  id="modal-moderation-title"
                  className="font-serif text-[22px] font-bold text-[#1C1917] leading-tight tracking-tight mt-0.5"
                >
                  Thẩm định nội dung & AI Shield
                </h2>
                <p className="text-[13px] text-[#78716C] mt-1 font-sans">
                  Xem chi tiết video, kết quả phân tích AI Shield và lý do đề xuất xử lý.
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleNavigateToDetail}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#E0DDD7] bg-white px-4 py-2.5 text-xs font-bold text-[#1C1917] shadow-2xs hover:bg-[#F5F2EB] active:scale-[0.98] transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 text-[#1C1917]" strokeWidth={1.8} />
                <span>Mở trang chi tiết</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ"
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#111827] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF8F5]">
          {/* Two-Column Grid matching reference image (52.5% vs 47.5%) */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* LEFT COLUMN: Video Player & Video Information Card */}
            <div className="w-full lg:w-[52.5%] space-y-5">
              {/* 1. Video Player Container with Custom-styled Overlay Controls */}
              <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm border border-[#EAE6DF] flex items-center justify-center">
                {mediaSource ? (
                  <video
                    ref={videoRef}
                    src={mediaSource}
                    poster={thumbnailSrc}
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={thumbnailSrc}
                      alt={displayTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Custom Video Controls Bar matching exact reference screenshot */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-6 pb-2.5 px-4 space-y-1.5 select-none">
                  {/* Top row: Play/Pause, Time, Right icons */}
                  <div className="flex items-center justify-between text-white text-xs">
                    {/* Left: Play and Time */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="text-white hover:text-rose-400 transition-colors cursor-pointer"
                        title={isPlaying ? 'Tạm dừng' : 'Phát video'}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 fill-white" />
                        ) : (
                          <Play className="h-4 w-4 fill-white" />
                        )}
                      </button>
                      <span className="font-mono text-xs text-white/95 tracking-wide">
                        {currentDisplay} / {durationDisplay}
                      </span>
                    </div>

                    {/* Right: Volume, CC, Fullscreen, Options */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="text-white hover:text-rose-400 transition-colors cursor-pointer"
                        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>

                      <span className="border border-white/80 text-white text-[10px] font-bold px-1 py-0.5 rounded leading-none">
                        CC
                      </span>

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="text-white hover:text-rose-400 transition-colors cursor-pointer"
                        title="Toàn màn hình"
                      >
                        <Maximize className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="Tùy chọn khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom row: Interactive Scrubber Progress Bar */}
                  <div className="relative flex items-center h-2 cursor-pointer">
                    <input
                      type="range"
                      min={0}
                      max={effectiveDuration}
                      value={currentTime}
                      onChange={handleScrubberChange}
                      className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="relative w-full h-[3px] bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all"
                        style={{ width: `${scrubPercent}%` }}
                      />
                    </div>
                    {/* Scrub handle circle matching mockup */}
                    <div
                      className="absolute h-3 w-3 rounded-full bg-white shadow-xs pointer-events-none transition-all"
                      style={{
                        left: `calc(${scrubPercent}% - 6px)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Thông tin video Card */}
              <div className="rounded-2xl border border-[#EAE6DF] bg-white shadow-2xs overflow-hidden">
                {/* Card Title Header with divider */}
                <div className="px-5 py-3.5 flex items-center gap-2 border-b border-[#EAE6DF]">
                  <FileText className="h-5 w-5 text-[#991B1B]" strokeWidth={1.8} />
                  <h3 className="font-bold text-[16px] text-[#1C1917]">Thông tin video</h3>
                </div>

                {/* Video Row Mini-Summary with divider */}
                <div className="px-5 py-3.5 flex items-center gap-3.5 border-b border-[#EAE6DF]">
                  <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded-xl border border-[#EAE6DF] bg-[#F5F2EB] shadow-2xs">
                    <img
                      src={thumbnailSrc}
                      alt={displayTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <h4
                      className="font-bold text-[15px] text-[#1C1917] leading-snug line-clamp-2"
                      title={displayTitle}
                    >
                      {displayTitle}
                    </h4>
                    <span className="text-[13px] text-[#78716C] mt-1 truncate">
                      #{fullItem.reviewId} • {category} • {formatVideoDuration(fullItem.durationSeconds)}
                    </span>
                  </div>
                </div>

                {/* 2x2 Metadata Grid with clean cross dividers */}
                <div className="grid grid-cols-2 border-b border-[#EAE6DF]">
                  {/* Field 1: Kênh */}
                  <div className="px-5 py-3.5 border-r border-b border-[#EAE6DF] flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#1C1917]" strokeWidth={1.8} />
                      <span className="font-medium text-[14px] text-[#1C1917]">Kênh</span>
                    </div>
                    <div className="text-right min-w-0">
                      <span
                        className="font-medium text-[14px] text-[#1C1917] block truncate max-w-[190px]"
                        title={fullItem.channelName || 'Chưa đặt kênh'}
                      >
                        {fullItem.channelName || 'Chưa đặt kênh'}
                      </span>
                      <span
                        className="text-[12px] text-[#78716C] block truncate max-w-[190px]"
                        title={fullItem.creatorEmail}
                      >
                        {fullItem.creatorEmail || 'creator@example.com'}
                      </span>
                    </div>
                  </div>

                  {/* Field 2: Thời lượng */}
                  <div className="px-5 py-3.5 border-b border-[#EAE6DF] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#1C1917]" strokeWidth={1.8} />
                      <span className="font-medium text-[14px] text-[#1C1917]">Thời lượng</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-[14px] text-[#1C1917]">
                        {formatVideoDuration(fullItem.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Field 3: Thời gian gửi */}
                  <div className="px-5 py-3.5 border-r border-[#EAE6DF] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#1C1917]" strokeWidth={1.8} />
                      <span className="font-medium text-[14px] text-[#1C1917]">Thời gian gửi</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-[14px] text-[#1C1917]">
                        {timeStacked.time} – {timeStacked.date}
                      </span>
                    </div>
                  </div>

                  {/* Field 4: Thể loại */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#1C1917]" strokeWidth={1.8} />
                      <span className="font-medium text-[14px] text-[#1C1917]">Thể loại</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-[#F5F0EB] text-[#57534E] text-xs font-medium px-3 py-1">
                        {category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mô tả tác phẩm with divider */}
                <div className="px-5 pt-3.5 pb-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#1C1917]">
                    <FileText className="h-4 w-4 text-[#1C1917]" strokeWidth={1.8} />
                    <span className="font-bold text-[14px] text-[#1C1917]">Mô tả tác phẩm</span>
                  </div>
                  <p
                    className={cn(
                      'text-[#57534E] leading-relaxed transition-all font-sans text-[13px]',
                      !isDescExpanded && 'line-clamp-2'
                    )}
                  >
                    {fullItem.description ||
                      'Khắc họa chiến thắng Bạch Đằng năm 1288 dưới sự chỉ huy của Hưng Đạo Đại Vương Trần Quốc Tuấn, một trong những chiến công vĩ đại nhất trong lịch sử chống ngoại xâm...'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-[#991B1B] font-bold text-xs inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>{isDescExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        isDescExpanded && 'rotate-180'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Shield, Script Analysis & Recommendations */}
            <div className="w-full lg:w-[47.5%] space-y-5">
              {/* 1. Đánh giá AI Shield Card */}
              <div className="rounded-2xl border border-[#EAE6DF] bg-white shadow-2xs overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#EAE6DF]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#991B1B]" strokeWidth={1.8} />
                    <h3 className="font-bold text-[16px] text-[#1C1917]">Đánh giá AI Shield</h3>
                  </div>

                  {/* Decision status badge */}
                  {isPending ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7]/60 border border-[#FDE68A] px-3 py-1 text-xs font-medium text-[#B45309]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Chờ xử lý</span>
                    </div>
                  ) : fullItem.decision === 'APPROVED' ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] border border-emerald-200 px-3 py-1 text-xs font-medium text-[#047857]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Đã phê duyệt</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Từ chối</span>
                    </div>
                  )}
                </div>

                {/* Score Box + Checklist Grid */}
                <div className="p-4 flex items-center gap-4">
                  {/* Left: Score Box */}
                  <div
                    className={cn(
                      'flex-1 rounded-2xl border p-3.5 flex items-center gap-3',
                      tierBoxClass
                    )}
                  >
                    {tierIcon}
                    <div className="min-w-0">
                      <span className="font-bold text-[16px] text-[#065F46] leading-tight block truncate">
                        {tierLabel} ({scoreFormatted})
                      </span>
                      <span className="text-[12px] text-[#047857]/90 leading-tight block mt-1 truncate">
                        {tierSubtitle}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] bg-[#EAE6DF] self-stretch my-1" />

                  {/* Right: Checklist */}
                  <div className="flex-1 space-y-2 pl-1">
                    {checklist.map((cItem, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-[#1C1917] font-medium leading-tight">
                        <Check className="h-4 w-4 text-[#059669] stroke-[2.5] shrink-0" />
                        <span>{cItem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Trích xuất kịch bản & phân tích Card */}
              <div className="rounded-2xl border border-[#EAE6DF] bg-white shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 flex items-center gap-2 border-b border-[#EAE6DF]">
                  <FileText className="h-5 w-5 text-[#991B1B]" strokeWidth={1.8} />
                  <h3 className="font-bold text-[16px] text-[#1C1917]">
                    Trích xuất kịch bản & phân tích
                  </h3>
                </div>

                {/* Script text box with inner container & chevron */}
                <div className="p-4">
                  <div
                    onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                    className="rounded-2xl border border-[#EAE6DF] bg-[#FAF8F5] p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F5F2EB]/60 transition-colors"
                  >
                    <p
                      className={cn(
                        'text-[13px] text-[#374151] leading-relaxed font-sans select-text',
                        !isScriptExpanded && 'line-clamp-3'
                      )}
                    >
                      {scriptText}
                    </p>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-[#1C1917] shrink-0 transition-transform duration-200',
                        isScriptExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Lý do đề xuất xử lý Card (Rose warning card with generous padding) */}
              <div className="rounded-2xl border border-rose-200/90 bg-[#FFF5F5] p-5 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#991B1B]">
                  <Info className="h-5 w-5 text-[#991B1B] shrink-0" strokeWidth={1.8} />
                  <h4 className="font-bold text-[15px] text-[#991B1B]">Lý do đề xuất xử lý</h4>
                </div>
                <p className="text-[13px] text-[#991B1B] leading-relaxed font-sans pl-0.5">
                  {recommendationText}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Form Input Drawer */}
          {showRejectForm && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="text-xs font-bold text-rose-900 block">
                Nhập lý do từ chối phát hành video:
              </span>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nêu rõ lý do (ví dụ: vi phạm thông tin lịch sử, âm thanh không rõ, tài liệu chưa đối chiếu...)"
                className="w-full rounded-xl border border-rose-200 bg-white p-3 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="rounded-xl border border-[#E0DDD7] bg-white px-4 py-2 text-xs font-semibold text-[#57534E] hover:bg-[#F5F2EB] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!rejectReason.trim() || isSubmitting}
                  onClick={handleConfirmReject}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-[#EAE6DF] bg-[#FAF9F6] px-6 py-4 flex items-center justify-between shrink-0 select-none">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#E0DDD7] bg-white px-6 py-2.5 text-sm font-bold text-[#1C1917] shadow-2xs hover:bg-[#F5F2EB] active:scale-[0.98] transition-all cursor-pointer"
          >
            Đóng
          </button>

          {isPending ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowRejectForm(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-[#FFF1F2] px-5 py-2.5 text-sm font-bold text-[#E11D48] shadow-2xs hover:bg-rose-100 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="h-4 w-4 text-[#E11D48]" strokeWidth={2} />
                <span>Từ chối video</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  onApprove(fullItem.reviewId, 'Đã thẩm định phù hợp xuất bản')
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-[#00875A] hover:bg-[#007048] text-white px-6 py-2.5 text-sm font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2} />
                <span>Phê duyệt xuất bản</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#78716C]">
              {fullItem.moderatorEmail && (
                <span>
                  Duyệt bởi:{' '}
                  <strong className="font-mono text-[#1C1917]">
                    {fullItem.moderatorEmail}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
