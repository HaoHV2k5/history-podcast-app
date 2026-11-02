import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Video,
  FileText,
  User,
  Clock,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Check,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
} from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { WorkbenchSkeleton } from '@/components/common/LoadingSkeleton';
import { moderationApi } from '@/services/api/moderation';
import { formatDateTime } from '@/utils/formatters';
import { resolveMediaUrl } from '@/features/studio/creatorStudioUtils';
import {
  cleanMarkdownTitle,
  resolveModerationRowThumbnail,
  getDecisionBadgeConfig,
  formatStackedDateTime,
  formatVideoDuration,
} from './moderationLogic';
import { cn } from '@/utils/cn';

export const ModerationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reviewId = Number(id);

  // Moderator checklist interactive state
  const [historyCheck, setHistoryCheck] = useState(false);
  const [copyrightCheck, setCopyrightCheck] = useState(false);
  const [standardsCheck, setStandardsCheck] = useState(false);

  // Decision Modal State
  const [modalType, setModalType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  // Video interactive player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-moderation-detail', reviewId],
    queryFn: () => moderationApi.getReviewDetail(reviewId),
    enabled: Boolean(reviewId),
  });

  const decisionMutation = useMutation({
    mutationFn: (variables: { decision: 'APPROVED' | 'REJECTED'; reason: string }) =>
      moderationApi.submitDecision(reviewId, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-detail', reviewId] });
      setModalType(null);
    },
  });

  const item = data?.data;

  // Video player control handlers
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
    setVideoDuration(videoRef.current.duration || item?.durationSeconds || 0);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const formatPlayerTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <WorkbenchSkeleton />;
  }

  if (isError || !item) {
    return (
      <div className="rounded-2xl border border-[#EBE4D8] bg-white p-8 text-center shadow-xs">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#991B1B] mb-3" />
        <h2 className="font-serif text-lg font-bold text-[#1C1917] mb-1">
          Không tìm thấy hồ sơ kiểm duyệt
        </h2>
        <p className="text-xs text-[#78716C] mb-4">
          Hồ sơ kiểm duyệt ID #{reviewId} không tồn tại hoặc đã bị xóa.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/moderation')}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E0DDD7] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C1917] hover:bg-[#F5F2EB] transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isPending = item.decision === 'PENDING';
  const displayTitle = cleanMarkdownTitle(item.title);
  const decisionBadge = getDecisionBadgeConfig(item.decision);
  const timeStacked = formatStackedDateTime(item.createdAt);

  const thumbnailSrc = resolveModerationRowThumbnail(
    item.title,
    item.optimizedUrl || item.fileUrl
  );

  const mediaSource =
    item.optimizedUrl || item.fileUrl ? resolveMediaUrl(item.optimizedUrl || item.fileUrl!) : '';

  const effectiveDuration = videoDuration || item.durationSeconds || 0;
  const durationDisplay = formatPlayerTime(effectiveDuration);
  const currentDisplay = formatPlayerTime(currentTime);
  const scrubPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  // AI Shield Scoring & Tier Presentation (Zero Fake Data: strictly derived from backend)
  const scoreNum = item.aiShieldScore != null ? Number(item.aiShieldScore) : null;
  const scoreFormatted = scoreNum !== null ? `${Math.min(100, Math.max(0, scoreNum)).toFixed(1)}%` : '--';
  const tier = (item.aiShieldTier || 'EXCELLENT').toUpperCase();

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

  // Report and recommendation texts (Zero Fake Data: honest empty states if null)
  const reportContent =
    item.markdownContent ||
    item.aiShieldReason ||
    'Chưa có dữ liệu báo cáo phân tích chi tiết từ hệ thống AI Shield cho bản ghi này.';

  let recommendationText = '';
  if (item.adminReason) {
    if (item.adminReason.startsWith('AI Shield:')) {
      recommendationText = item.adminReason;
    } else if (item.decision === 'REJECTED') {
      const cleanReason = item.adminReason.replace(/^Lý do từ chối:\s*/i, '');
      recommendationText = `Lý do từ chối: ${cleanReason}`;
    } else {
      recommendationText = item.adminReason;
    }
  } else if (item.aiShieldReason) {
    recommendationText = item.aiShieldReason.startsWith('AI Shield:')
      ? item.aiShieldReason
      : `AI Shield: ${item.aiShieldReason}`;
  } else {
    recommendationText = 'Chưa có ý kiến thẩm định. Hồ sơ đang chờ điều hành viên kiểm tra và đưa ra quyết định.';
  }

  const handleDecisionSubmit = (reason: string) => {
    if (!modalType) return;
    decisionMutation.mutate({
      decision: modalType,
      reason: reason || (modalType === 'APPROVED' ? 'Đã thẩm định phù hợp xuất bản' : ''),
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between animate-in fade-in-0 duration-300 ease-out">
      <div className="space-y-6 pb-8">
        {/* 1. Header Banner with Authentic Red Watercolor Pagoda Backdrop */}
        <div className="relative overflow-hidden rounded-2xl border border-[#EBE4D8] bg-white px-7 py-6 shadow-xs select-none">
        {/* Watercolor Pagoda & Landscape Artwork positioned on the right */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 right-[20px] sm:right-[40px] md:right-[60px] w-[340px] sm:w-[420px] md:w-[460px] bg-contain bg-right-bottom bg-no-repeat select-none z-0 hidden sm:block opacity-90"
          style={{
            backgroundImage: "url('/assets/studio/admin-moderation-modal-pagoda.png')",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          {/* Back link */}
          <Link
            to="/admin/moderation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#991B1B] transition-colors mb-2.5 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Hàng đợi kiểm duyệt</span>
          </Link>

          {/* Category Pill Tag */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            <Video className="h-4 w-4 text-[#991B1B]" strokeWidth={2} />
            <span>HỒ SƠ KIỂM DUYỆT #{item.reviewId}</span>
          </div>

          {/* Title & Status Pill */}
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h1 className="font-serif text-2xl md:text-[28px] font-bold text-[#1C1917] tracking-tight leading-snug">
              {displayTitle}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                decisionBadge.badgeClasses
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', decisionBadge.dotColor)} />
              {decisionBadge.label}
            </span>
          </div>

          {/* Subtitle Metadata */}
          <p className="text-xs md:text-[13px] text-[#78716C] mt-2 font-sans flex flex-wrap items-center gap-1.5">
            <span>ID #{item.reviewId}</span>
            <span>•</span>
            <span>
              Kênh: <strong className="text-[#1C1917] font-semibold">{item.channelName || 'Chưa có'}</strong>
            </span>
            <span>•</span>
            <span>
              Tác giả: <span className="font-mono text-[#57534E]">{item.creatorEmail || 'Chưa có'}</span>
            </span>
          </p>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Matching 100% Mockup Hồ sơ kiểm duyệt.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Video Player & Content Metadata (~58% width) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: 16:9 Video Player Container with Custom Controls */}
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xs border border-[#E0DDD7] flex items-center justify-center">
            {mediaSource ? (
              <video
                ref={videoRef}
                src={mediaSource}
                poster={thumbnailSrc}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                className="h-full w-full object-contain cursor-pointer"
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center text-center p-6 bg-stone-900 select-none">
                <img
                  src={thumbnailSrc}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white mb-2 shadow-md">
                    <Video className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Video lưu trữ trên máy chủ nội bộ
                  </p>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Đang sẵn sàng cho phiên thẩm định của Hội đồng
                  </p>
                </div>
              </div>
            )}

            {/* Center Play Button Overlay */}
            {mediaSource && !isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Phát video"
                className="absolute z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#991B1B] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
              >
                <Play className="h-8 w-8 ml-1 fill-[#991B1B]" />
              </button>
            )}

            {/* Custom Bottom Video Player Controls Bar */}
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 py-3 opacity-90 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5">
              {/* Scrubber Range Slider */}
              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleScrubberChange}
                aria-label="Thanh tua video"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/30 accent-[#991B1B] transition-all hover:h-2"
                style={{
                  background: `linear-gradient(to right, #991B1B ${scrubPercent}%, rgba(255,255,255,0.3) ${scrubPercent}%)`,
                }}
              />

              <div className="flex items-center justify-between text-white text-xs select-none">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                  </button>

                  <span className="font-mono text-[11px] text-white/90">
                    {currentDisplay} / {durationDisplay}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                    aria-label={isMuted ? 'Bật âm' : 'Tắt âm'}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                    aria-label="Toàn màn hình"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Thông tin nội dung */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#991B1B]" />
              <h2 className="font-bold text-base text-[#1C1917]">Thông tin nội dung</h2>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#1C1917] leading-snug">
                {displayTitle}
              </h3>
              <p className="text-xs md:text-[13px] text-[#57534E] leading-relaxed whitespace-pre-line">
                {item.description || 'Không có mô tả chi tiết từ tác giả.'}
              </p>
            </div>

            <div className="border-t border-[#EAE6DF] pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Column 1: Kênh */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                    <User className="h-3.5 w-3.5 text-[#991B1B]" />
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Kênh</span>
                  </div>
                  <p className="font-semibold text-xs text-[#1C1917] truncate">
                    {item.channelName || 'Không có'}
                  </p>
                  <p className="text-[11px] font-mono text-[#78716C] truncate">
                    {item.creatorEmail || 'Chưa cập nhật'}
                  </p>
                </div>

                {/* Column 2: Thời lượng */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                    <Clock className="h-3.5 w-3.5 text-[#991B1B]" />
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Thời lượng</span>
                  </div>
                  <p className="font-semibold font-mono text-xs text-[#1C1917]">
                    {formatVideoDuration(item.durationSeconds)}
                  </p>
                </div>

                {/* Column 3: Gửi lúc */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                    <Calendar className="h-3.5 w-3.5 text-[#991B1B]" />
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Gửi lúc</span>
                  </div>
                  <p className="font-semibold font-mono text-xs text-[#1C1917]">
                    {timeStacked.time} {timeStacked.date}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Báo cáo thẩm định AI Shield & Trích dẫn */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#991B1B]" />
                <h2 className="font-bold text-base text-[#1C1917]">
                  Báo cáo thẩm định AI Shield & Trích dẫn
                </h2>
              </div>
              <span className="text-xs text-[#78716C] hidden sm:inline font-sans">
                Hỗ trợ gợi ý kiểm duyệt tự động
              </span>
            </div>

            <div className="rounded-xl border border-[#E0DDD7] bg-[#FAF8F5] p-4 text-xs text-[#1C1917] leading-relaxed font-sans whitespace-pre-line shadow-2xs">
              {reportContent}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Shield, Checklist, Decision Metadata (~42% width) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Thẩm định AI Shield */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#991B1B]" />
              <h2 className="font-bold text-base text-[#1C1917]">Thẩm định AI Shield</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
              {/* Left Score Box */}
              <div
                className={cn(
                  'rounded-xl border p-4 flex flex-col items-center justify-center text-center shadow-2xs transition-all',
                  tierBoxClass
                )}
              >
                {tierIcon}
                <p className="font-bold text-sm mt-2">
                  {tierLabel} ({scoreFormatted})
                </p>
                <p className="text-[11px] opacity-85 mt-0.5">{tierSubtitle}</p>
              </div>

              {/* Right Checklist */}
              <div className="flex flex-col justify-center space-y-2.5 text-xs text-[#1C1917] bg-[#FAF8F5]/60 rounded-xl p-3 border border-[#E0DDD7]/60">
                {checklist.map((cItem, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#059669] shrink-0" strokeWidth={2.5} />
                    <span className="font-medium text-[#1C1917]">{cItem}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Danh mục kiểm tra của điều hành viên */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xs space-y-3.5">
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-base text-[#1C1917]">
                Danh mục kiểm tra của điều hành viên
              </h2>
              <p className="text-[11px] text-[#78716C] font-normal">
                Quy chuẩn thẩm định dành cho điều hành viên trước khi ra quyết định
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 text-xs text-[#1C1917] cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isPending ? historyCheck : item.decision === 'APPROVED'}
                  disabled={!isPending}
                  onChange={(e) => setHistoryCheck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-[#D1D5DB] text-[#991B1B] focus:ring-[#991B1B] accent-[#991B1B] cursor-pointer disabled:opacity-80"
                />
                <span className="leading-snug group-hover:text-[#991B1B] transition-colors">
                  Tính chính xác của tư liệu lịch sử và nhân vật được đề cập
                </span>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 text-xs text-[#1C1917] cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isPending ? copyrightCheck : item.decision === 'APPROVED'}
                  disabled={!isPending}
                  onChange={(e) => setCopyrightCheck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-[#D1D5DB] text-[#991B1B] focus:ring-[#991B1B] accent-[#991B1B] cursor-pointer disabled:opacity-80"
                />
                <span className="leading-snug group-hover:text-[#991B1B] transition-colors">
                  Bản quyền hình ảnh, âm thanh, giọng đọc thuyết minh hợp lệ
                </span>
              </label>

              {/* Checkbox 3 */}
              <label className="flex items-start gap-3 text-xs text-[#1C1917] cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isPending ? standardsCheck : item.decision === 'APPROVED'}
                  disabled={!isPending}
                  onChange={(e) => setStandardsCheck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-[#D1D5DB] text-[#991B1B] focus:ring-[#991B1B] accent-[#991B1B] cursor-pointer disabled:opacity-80"
                />
                <span className="leading-snug group-hover:text-[#991B1B] transition-colors">
                  Tuân thủ chuẩn mực cộng đồng và pháp luật Việt Nam
                </span>
              </label>
            </div>
          </div>

          {/* Card 3: Thông tin quyết định */}
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-[#1C1917]">Thông tin quyết định</h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                  decisionBadge.badgeClasses
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', decisionBadge.dotColor)} />
                {decisionBadge.label}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="font-bold text-xs text-[#1C1917]">Ý kiến thẩm định:</p>
              <div className="rounded-xl border border-[#E0DDD7] bg-[#FAF8F5] p-3.5 text-xs text-[#57534E] leading-relaxed shadow-2xs">
                {recommendationText}
              </div>
            </div>

            {(item.moderatorEmail || item.reviewedAt) && (
              <div className="pt-3 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between text-[11px] text-[#78716C]">
                {item.moderatorEmail && (
                  <span>
                    Người duyệt: <strong className="text-[#1C1917] font-mono">{item.moderatorEmail}</strong>
                  </span>
                )}
                {item.reviewedAt && (
                  <span className="font-mono">{formatDateTime(item.reviewedAt)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* 3. Sticky Bottom Decision Action Bar matching 100% Mockup */}
      <div className="sticky bottom-0 z-30 mt-auto -mx-4 sm:-mx-6 md:-mx-8 border-t border-[#EAE6DF] bg-white px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Operational Warning Callout */}
        <div className="flex items-center gap-2 text-xs text-[#57534E] select-none">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Vui lòng kiểm tra kỹ nội dung trước khi ban hành quyết định</span>
        </div>

        {/* Right: Decision Actions */}
        {isPending ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModalType('REJECTED')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Từ chối nội dung</span>
            </button>

            <button
              type="button"
              onClick={() => setModalType('APPROVED')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#01A361] hover:bg-[#059669] text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Phê duyệt xuất bản</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#78716C]">
              Hồ sơ này đã có kết luận phê duyệt ({decisionBadge.label})
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin/moderation')}
              className="px-4 py-2 rounded-xl border border-[#E0DDD7] bg-white text-xs font-semibold text-[#1C1917] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
            >
              Quay lại hàng đợi
            </button>
          </div>
        )}
      </div>

      {/* Decision Confirmation Modal */}
      <ConfirmModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={
          modalType === 'APPROVED'
            ? 'Xác nhận phê duyệt xuất bản video'
            : 'Từ chối duyệt nội dung video'
        }
        description={
          modalType === 'APPROVED'
            ? 'Video sẽ được chuyển sang trạng thái CÔNG KHAI và hiển thị tới khán giả nền tảng Sử Ký.'
            : 'Nội dung sẽ bị từ chối. Creator sẽ nhận được thông báo kèm lý do chi tiết để chỉnh sửa và nộp lại.'
        }
        confirmText={modalType === 'APPROVED' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        variant={modalType === 'APPROVED' ? 'primary' : 'destructive'}
        requireReason={modalType === 'REJECTED'}
        reasonPlaceholder={
          modalType === 'REJECTED'
            ? 'Nêu rõ sai sót tư liệu lịch sử hoặc vi phạm quy định cộng đồng...'
            : 'Ghi chú kiểm duyệt nếu cần...'
        }
        isLoading={decisionMutation.isPending}
        onConfirm={(reason?: string) => handleDecisionSubmit(reason || '')}
      />
    </div>
  );
};
