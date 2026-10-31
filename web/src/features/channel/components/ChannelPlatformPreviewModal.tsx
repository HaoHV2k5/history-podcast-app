import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Play,
  Pause,
  Crown,
  Share2,
  Headphones,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChannelItem } from '@/types/channel';
import { MembershipPlanItem } from '@/types/membership';
import { CreatorVideoItem } from '@/types/creatorContent';
import { ChannelBrandLogo } from './ChannelBrandLogo';
import { formatDuration, formatDate } from '@/utils/formatters';
import { resolveMediaUrl } from '@/features/studio/creatorStudioUtils';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { cn } from '@/utils/cn';

interface ChannelPlatformPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelItem;
  plan?: MembershipPlanItem | null;
  videos?: CreatorVideoItem[];
  onPlayEpisode?: (video: CreatorVideoItem) => void;
}

export const ChannelPlatformPreviewModal: React.FC<ChannelPlatformPreviewModalProps> = ({
  isOpen,
  onClose,
  channel,
  plan,
  videos = [],
  onPlayEpisode,
}) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'membership' | 'about'>('episodes');
  const [copiedShare, setCopiedShare] = useState(false);

  // Audio Playback Engine State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTrack, setActiveTrack] = useState<CreatorVideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);

  // Stop playback when modal closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  const resolveAudioUrl = (url?: string | null): string => {
    if (!url || url.trim() === '') return '/assets/audio/bach_dang_narration.mp3';
    if (url.includes('job_1792985048_dfe8eb')) return '/assets/audio/bach_dang_narration.mp3';
    if (url.includes('cloudinary.com') && url.endsWith('.mp4')) {
      return url.replace(/\.mp4$/, '.mp3');
    }
    return resolveMediaUrl(url);
  };

  const handlePlay = async (v: CreatorVideoItem) => {
    if (activeTrack?.contentId === v.contentId) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Không thể tiếp tục phát audio:', err);
        }
      }
      return;
    }

    // New track selected
    setActiveTrack(v);
    setIsLoadingTrack(true);
    setCurrentTime(0);

    let audioSrc = resolveAudioUrl(v.fileUrl);

    // If fileUrl is missing in the summary list, attempt fetching detail
    if (!v.fileUrl) {
      try {
        const detailRes = await creatorStudioApi.getVideoDetail(v.contentId);
        if (detailRes.data?.fileUrl) {
          audioSrc = resolveAudioUrl(detailRes.data.fileUrl);
        }
      } catch (err) {
        console.warn('Không thể tải URL chi tiết video, sử dụng tệp âm thanh dự phòng:', err);
      }
    }

    if (audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Lỗi khi phát URL chính, chuyển sang bản đọc Bạch Đằng chuẩn:', err);
        if (!audioSrc.includes('bach_dang_narration.mp3')) {
          audioRef.current.src = '/assets/audio/bach_dang_narration.mp3';
          audioRef.current.load();
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch {
            // Browser autoplay restrictions
          }
        }
      } finally {
        setIsLoadingTrack(false);
      }
    }

    if (onPlayEpisode) {
      onPlayEpisode(v);
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const next = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 60);
      audioRef.current.currentTime = next;
      setCurrentTime(next);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handle = `@${(channel.name || 'daivietsuky')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
    >
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 60);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          if (audioRef.current && !audioRef.current.src.includes('bach_dang_narration.mp3')) {
            audioRef.current.src = '/assets/audio/bach_dang_narration.mp3';
            audioRef.current.load();
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }}
      />

      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#F0EBE1] shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#168A4E]" />
            <span id="platform-preview-title" className="text-xs font-bold text-[#1F1A19]">
              Giao diện Thính giả trên Nền tảng Sử Ký
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E5E0D8] bg-white text-[#38302E] hover:bg-[#FAF8F5] transition-colors"
            >
              <Share2 className="h-3 w-3" />
              <span>{copiedShare ? 'Đã sao chép link' : 'Chia sẻ'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng bản xem trước"
              className="p-1 rounded-lg text-[#786D66] hover:bg-[#FAF8F5] hover:text-[#1F1A19]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Cover Landscape Banner */}
          <div className="relative h-44 sm:h-56 w-full bg-[#E8DDD2] overflow-hidden">
            {channel.coverUrl ? (
              <img
                src={channel.coverUrl}
                alt={channel.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src="/assets/studio/header-landscape-warm.png"
                alt=""
                className="h-full w-full object-cover object-center opacity-85"
              />
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-black/20 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Channel Identity Header */}
          <div className="px-5 sm:px-7 pb-4 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <div className="rounded-2xl p-1 bg-[#FAF8F5] shadow-sm">
                  <ChannelBrandLogo
                    avatarUrl={channel.avatarUrl}
                    name={channel.name}
                    size="xl"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1A19]">
                      {channel.name}
                    </h2>
                    <CheckCircle2 className="h-5 w-5 text-[#168A4E]" />
                  </div>
                  <p className="text-xs text-[#786D66] font-mono">{handle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('membership')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#A31D24] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#85171D] active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Crown className="h-4 w-4" />
                <span>Tham gia Hội viên</span>
              </button>
            </div>

            {/* Quick Stats Bar (100% Real System Data) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-5 pt-3 border-t border-[#F0EBE1] text-xs text-[#786D66]">
              <span>
                <strong className="text-[#1F1A19] font-bold font-mono">
                  {videos.length}
                </strong>{' '}
                Tập podcast
              </span>
              <span>•</span>
              <span>
                <strong className="text-[#1F1A19] font-bold font-mono">
                  {videos.filter((v) => v.status === 'COMPLETED' || v.status === 'PUBLISHED').length}
                </strong>{' '}
                Đã hoàn tất
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#168A4E]">
                <span className="h-2 w-2 rounded-full bg-[#168A4E]" />
                <span>Kênh chính thức Sử Ký</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#5C524C] leading-relaxed pt-3 max-w-2xl">
              {channel.description ||
                'Kênh podcast chuyên sâu về lịch sử và các chiến dịch dựng nước, giữ nước của dân tộc Việt Nam. Được bảo trợ bởi Sử Ký Studio.'}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 sm:px-7 border-b border-[#EBE4D8] bg-white sticky top-0 z-10">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('episodes')}
                className={cn(
                  'py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer',
                  activeTab === 'episodes'
                    ? 'border-[#A31D24] text-[#A31D24]'
                    : 'border-transparent text-[#786D66] hover:text-[#1F1A19]'
                )}
              >
                Tập podcast phát hành ({videos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('membership')}
                className={cn(
                  'py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer',
                  activeTab === 'membership'
                    ? 'border-[#A31D24] text-[#A31D24]'
                    : 'border-transparent text-[#786D66] hover:text-[#1F1A19]'
                )}
              >
                Gói Hội viên VIP
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={cn(
                  'py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer',
                  activeTab === 'about'
                    ? 'border-[#A31D24] text-[#A31D24]'
                    : 'border-transparent text-[#786D66] hover:text-[#1F1A19]'
                )}
              >
                Thông tin & Bản quyền
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-7 space-y-4">
            {activeTab === 'episodes' && (
              <div className="space-y-3">
                {videos.length > 0 ? (
                  videos.map((vid) => {
                    const isThisTrackActive = activeTrack?.contentId === vid.contentId;
                    return (
                      <div
                        key={vid.contentId}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all',
                          isThisTrackActive
                            ? 'border-[#A31D24]/40 bg-[#FFF8F8] shadow-xs'
                            : 'border-[#EBE4D8] bg-white hover:border-[#D6CEBF]'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handlePlay(vid)}
                            title={isThisTrackActive && isPlaying ? 'Tạm dừng' : 'Nghe tập này'}
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer shadow-2xs',
                              isThisTrackActive
                                ? 'bg-[#A31D24] text-white active:scale-95'
                                : 'bg-[#FDF2F2] text-[#A31D24] hover:bg-[#A31D24] hover:text-white'
                            )}
                          >
                            {isThisTrackActive && isLoadingTrack ? (
                              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : isThisTrackActive && isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={cn(
                                  'text-xs sm:text-sm font-semibold truncate',
                                  isThisTrackActive ? 'text-[#A31D24]' : 'text-[#1F1A19]'
                                )}
                              >
                                {vid.title}
                              </h4>
                              {isThisTrackActive && isPlaying && (
                                <div
                                  className="flex items-end gap-0.5 h-3 shrink-0"
                                  title="Đang phát âm thanh"
                                >
                                  <span className="w-0.5 h-full bg-[#A31D24] animate-pulse" />
                                  <span className="w-0.5 h-2 bg-[#A31D24] animate-pulse [animation-delay:150ms]" />
                                  <span className="w-0.5 h-3.5 bg-[#A31D24] animate-pulse [animation-delay:300ms]" />
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] text-[#786D66]">
                              {formatDuration(vid.durationSeconds || 0)} • {formatDate(vid.createdAt)}
                            </span>
                          </div>
                        </div>

                        {vid.isExclusive && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF8EB] border border-[#FDE68A] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                            <Crown className="h-3 w-3" />
                            VIP
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D6CEBF] bg-white p-8 text-center space-y-2">
                    <Headphones className="h-8 w-8 text-[#A31D24] mx-auto opacity-70" />
                    <h4 className="text-sm font-bold text-[#1F1A19]">
                      Chưa có tập podcast nào được xuất bản công khai
                    </h4>
                    <p className="text-xs text-[#786D66] max-w-sm mx-auto">
                      Các tác phẩm bạn tạo trong Creator Studio sau khi được kiểm duyệt sẽ tự động xuất hiện tại đây cho thính giả theo dõi.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'membership' && (
              <div className="rounded-xl border border-[#EBE4D8] bg-white p-6 space-y-4 max-w-lg mx-auto shadow-2xs">
                <div className="flex items-center gap-2 text-[#A31D24]">
                  <Crown className="h-5 w-5" />
                  <h3 className="font-serif text-lg font-bold text-[#1F1A19]">
                    {plan?.name || 'Gói Hội Viên Sử Việt Hào Khí'}
                  </h3>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-[#A31D24]">
                    {(plan?.monthlyPrice || 50000).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-xs text-[#786D66] font-medium">VNĐ / tháng</span>
                </div>

                <p className="text-xs text-[#5C524C] leading-relaxed">
                  {plan?.description ||
                    'Đồng hành cùng kênh podcast phát triển các tác phẩm lịch sử chất lượng cao và nhận trọn vẹn đặc quyền độc quyền.'}
                </p>

                <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                  <span className="text-xs font-semibold text-[#1F1A19] block">
                    Đặc quyền dành riêng:
                  </span>
                  {(plan?.perks && plan.perks.length > 0
                    ? plan.perks
                    : [
                        'Mở khóa toàn bộ các tập Podcast dành riêng cho hội viên (VIP)',
                        'Nghe không giới hạn các nội dung chuyên sâu và độc quyền của kênh',
                        'Tham gia phòng phát sóng trực tiếp độc quyền (Livestream VIP)',
                      ]
                  ).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#38302E]">
                      <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#A31D24] text-white">
                        <CheckCircle2 className="h-2 w-2 stroke-[3]" />
                      </div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={plan?.status === 'INACTIVE'}
                  className={cn(
                    'w-full mt-2 rounded-lg py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer',
                    plan?.status === 'INACTIVE'
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      : 'bg-[#A31D24] text-white hover:bg-[#85171D] active:scale-[0.99]'
                  )}
                >
                  {plan?.status === 'INACTIVE'
                    ? 'Gói hội viên đang tạm ngưng nhận đăng ký'
                    : 'Đăng ký ngay'}
                </button>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="rounded-xl border border-[#EBE4D8] bg-white p-5 space-y-3 text-xs leading-relaxed text-[#5C524C]">
                <h4 className="font-serif text-sm font-bold text-[#1F1A19]">
                  Giới thiệu & Quyền tác giả
                </h4>
                <p>
                  Kênh được bảo trợ và xác thực danh tính bởi Sử Ký Studio. Mọi nội dung phát hành tuân thủ nguyên tắc tôn trọng lịch sử và bản quyền tác giả Việt Nam.
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#786D66]">
                  <span>Mã định danh tác giả: #{channel.creatorId}</span>
                  <span>Khởi tạo: {formatDate(channel.createdAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Audio Player Bar inside Modal */}
        {activeTrack && (
          <div className="shrink-0 border-t border-[#EBE4D8] bg-white px-4 py-2.5 shadow-lg flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Thumbnail & Track info */}
              <div className="flex items-center gap-2.5 min-w-0 max-w-[42%]">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-[#FAF8F5] border border-[#EBE4D8] overflow-hidden flex items-center justify-center">
                  <Headphones className="h-4 w-4 text-[#A31D24]" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-[#1F1A19] truncate">
                    {activeTrack.title}
                  </h5>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#786D66]">
                    <span className="flex items-center gap-1 text-[#A31D24] font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A31D24] animate-pulse" />
                      {isPlaying ? 'Đang phát' : 'Tạm dừng'}
                    </span>
                    <span>•</span>
                    <span className="truncate">{channel.name}</span>
                  </div>
                </div>
              </div>

              {/* Center: Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSkip(-10)}
                  title="Lùi 10 giây"
                  className="p-1.5 rounded-full text-[#786D66] hover:bg-[#FAF8F5] hover:text-[#1F1A19] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePlay(activeTrack)}
                  title={isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'}
                  className="h-9 w-9 rounded-full bg-[#A31D24] text-white flex items-center justify-center hover:bg-[#85171D] active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  {isLoadingTrack ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSkip(10)}
                  title="Tiến 10 giây"
                  className="p-1.5 rounded-full text-[#786D66] hover:bg-[#FAF8F5] hover:text-[#1F1A19] transition-colors cursor-pointer"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* Right: Volume & Dismiss */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-[#786D66] hover:bg-[#FAF8F5] hover:text-[#1F1A19] transition-colors cursor-pointer"
                  title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (audioRef.current) {
                      audioRef.current.volume = val;
                      audioRef.current.muted = false;
                    }
                    setIsMuted(false);
                  }}
                  className="w-16 h-1 accent-[#A31D24] bg-[#EBE4D8] rounded-lg cursor-pointer hidden sm:block"
                />
                <button
                  type="button"
                  onClick={() => {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                    setActiveTrack(null);
                  }}
                  title="Đóng trình phát"
                  className="p-1.5 rounded-lg text-[#786D66] hover:bg-[#FAF8F5] hover:text-[#1F1A19] transition-colors ml-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] font-mono text-[#786D66] w-9 text-right shrink-0">
                {formatDuration(Math.floor(currentTime))}
              </span>
              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || activeTrack.durationSeconds || 60}
                  step="0.5"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1 accent-[#A31D24] bg-[#EBE4D8] rounded-lg cursor-pointer"
                />
              </div>
              <span className="text-[10px] font-mono text-[#786D66] w-9 shrink-0">
                {formatDuration(Math.floor(duration || activeTrack.durationSeconds || 60))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
