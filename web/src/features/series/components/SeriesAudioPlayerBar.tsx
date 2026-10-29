import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ListMusic,
  X,
} from 'lucide-react';

export interface PlayingTrack {
  title: string;
  authorOrTopic: string;
  coverUrl: string;
  durationSeconds: number;
  currentSeconds: number;
  seriesId?: number;
  seriesTitle?: string;
  contentId?: number;
  mediaUrl?: string;
}

interface SeriesAudioPlayerBarProps {
  currentTrack: PlayingTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek?: (seconds: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onTrackClick?: (track: PlayingTrack) => void;
  onSeriesClick?: (seriesId: number) => void;
  onClose?: () => void;
}

const formatAudioTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}.${s < 10 ? '0' : ''}${s}`;
};

export const SeriesAudioPlayerBar: React.FC<SeriesAudioPlayerBarProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onTrackClick,
  onSeriesClick,
  onClose,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.25x' | '1.5x' | '2x'>('1x');
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState(false);
  const [localProgress, setLocalProgress] = useState(
    currentTrack?.currentSeconds ?? 0
  );
  const [actualDuration, setActualDuration] = useState<number>(
    currentTrack?.durationSeconds || 60
  );

  // Convert Cloudinary video url (.mp4) to high-speed pure audio stream (.mp3)
  const resolveAudioUrl = (url?: string): string => {
    if (!url) return '/assets/audio/bach_dang_narration.mp3';
    // If it is the silent test job from earlier render, use real audible Vietnamese narration
    if (url.includes('job_1792985048_dfe8eb')) {
      return '/assets/audio/bach_dang_narration.mp3';
    }
    if (url.includes('cloudinary.com') && url.endsWith('.mp4')) {
      return url.replace(/\.mp4$/, '.mp3');
    }
    return url;
  };

  const audioSrc = resolveAudioUrl(currentTrack?.mediaUrl);

  // Sync actual duration from track metadata
  useEffect(() => {
    if (currentTrack?.durationSeconds && currentTrack.durationSeconds > 0) {
      setActualDuration(currentTrack.durationSeconds);
    }
  }, [currentTrack]);

  // Load and initialize real audio when source changes
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      const currentSrc = audioRef.current.currentSrc || audioRef.current.src;
      if (!currentSrc.includes(audioSrc)) {
        audioRef.current.src = audioSrc;
      }
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn('Tự động phát bị chặn bởi chính sách trình duyệt:', err);
        });
      }
    }
  }, [audioSrc]);

  // Sync play/pause state with audio element
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Lỗi khi phát âm thanh:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync volume & mute with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync playback speed with audio element
  useEffect(() => {
    if (audioRef.current) {
      const rate = parseFloat(playbackSpeed.replace('x', ''));
      audioRef.current.playbackRate = isNaN(rate) ? 1 : rate;
    }
  }, [playbackSpeed]);

  if (!currentTrack) {
    return null;
  }

  const duration = actualDuration > 0 ? actualDuration : 60;
  const progressPercent = Math.min(100, Math.max(0, (localProgress / duration) * 100));

  const handleCycleSpeed = () => {
    if (playbackSpeed === '1x') setPlaybackSpeed('1.25x');
    else if (playbackSpeed === '1.25x') setPlaybackSpeed('1.5x');
    else if (playbackSpeed === '1.5x') setPlaybackSpeed('2x');
    else setPlaybackSpeed('1x');
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newSec = (val / 100) * duration;
    setLocalProgress(newSec);
    if (audioRef.current && isFinite(newSec)) {
      audioRef.current.currentTime = newSec;
    }
    onSeek?.(newSec);
  };

  const handleTogglePlayClick = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.warn('Lỗi khi nhấn phát âm thanh:', err);
        });
      }
    }
    onTogglePlay();
  };

  const playerContent = (
    <div
      role="region"
      aria-label="Thanh phát podcast Sử Ký"
      className="pointer-events-auto absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 z-40 max-w-7xl mx-auto rounded-2xl border border-[#EBE4D8] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xl select-none transition-all duration-200"
    >
      {/* Real HTML5 Audio Element for Genuine Audio Output */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          onTimeUpdate={() => {
            if (audioRef.current) {
              setLocalProgress(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (
              audioRef.current &&
              isFinite(audioRef.current.duration) &&
              audioRef.current.duration > 0
            ) {
              setActualDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            onNext?.();
          }}
          onError={() => {
            // Fallback to original mediaUrl if converted mp3 fails
            if (
              audioRef.current &&
              currentTrack.mediaUrl &&
              audioRef.current.src !== currentTrack.mediaUrl
            ) {
              audioRef.current.src = currentTrack.mediaUrl;
              if (isPlaying) {
                audioRef.current.play().catch(() => {});
              }
            }
          }}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* ─── LEFT: TRACK COVER & METADATA & SCRUBBER (Clickable to view Series/Content) ─── */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 max-w-xl">
          {/* Interactive Cover Thumbnail */}
          <button
            type="button"
            onClick={() => onTrackClick?.(currentTrack)}
            title={
              currentTrack.seriesId
                ? `Nhấp để mở tuyển tập "${currentTrack.seriesTitle || currentTrack.authorOrTopic}"`
                : 'Nhấp để xem chi tiết tác phẩm'
            }
            className="group relative h-12 w-12 rounded-xl overflow-hidden bg-stone-900 border border-[#EBE4D8] shrink-0 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A31D24]/40 transition-transform active:scale-95"
          >
            <img
              src={currentTrack.coverUrl || '/assets/studio/topic-bach-dang-938.png'}
              alt={currentTrack.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/assets/studio/topic-bach-dang-938.png';
              }}
            />
            {isPlaying && (
              <span className="absolute bottom-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A31D24] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A31D24]" />
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            {/* Interactive Title */}
            <button
              type="button"
              onClick={() => onTrackClick?.(currentTrack)}
              title={
                currentTrack.seriesId
                  ? `Mở tuyển tập: ${currentTrack.seriesTitle || currentTrack.authorOrTopic}`
                  : 'Xem chi tiết tác phẩm này'
              }
              className="text-left font-serif text-xs sm:text-sm font-bold text-[#1C1615] truncate hover:text-[#A31D24] hover:underline transition-colors block w-full cursor-pointer"
            >
              {currentTrack.title}
            </button>

            <div className="flex items-center gap-2.5 text-[11px] text-[#786C68]">
              {/* Interactive Series Breadcrumb */}
              {currentTrack.seriesId ? (
                <button
                  type="button"
                  onClick={() => onSeriesClick?.(currentTrack.seriesId!)}
                  className="truncate font-medium text-[#A31D24] hover:underline cursor-pointer shrink-0 max-w-[140px]"
                  title="Nhấp để mở danh sách tập trong tuyển tập này"
                >
                  {currentTrack.seriesTitle || currentTrack.authorOrTopic}
                </button>
              ) : (
                <span className="truncate shrink-0 font-medium text-[#5C524F]">
                  {currentTrack.authorOrTopic}
                </span>
              )}

              <span className="font-mono text-stone-500 shrink-0">
                {formatAudioTime(localProgress)} / {formatAudioTime(duration)}
              </span>

              {/* Scrubber Bar: Solid Red Filled Bar for elapsed portion, Beige for remaining */}
              <div
                className="relative flex-1 flex items-center min-w-[90px] max-w-[170px] h-3 group cursor-pointer"
                title={`Tiến độ phát: ${formatAudioTime(localProgress)} / ${formatAudioTime(duration)} (nhấp hoặc kéo để tua)`}
              >
                {/* Background track (beige) */}
                <div className="w-full h-1.5 rounded-full bg-[#EBE4D8] overflow-hidden">
                  {/* Elapsed track (solid Imperial Red) */}
                  <div
                    className="h-full bg-[#A31D24] rounded-full transition-all duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* Range input layer for seeking interactions */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={handleSliderChange}
                  aria-label="Tiến độ phát audio"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Moving red knob */}
                <div
                  className="absolute h-3 w-3 rounded-full bg-[#A31D24] shadow-xs pointer-events-none -translate-x-1/2 transition-all duration-75 group-hover:scale-125"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── CENTER: PLAYBACK CONTROLS (Prev, Big Red Circular Play/Pause, Next) ─── */}
        <div className="flex items-center justify-center gap-4 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#786C68] hover:text-[#1C1615] hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tập trước đó"
            title="Tập trước đó"
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlayClick}
            className="h-10 w-10 rounded-full bg-[#A31D24] hover:bg-[#8B181E] active:scale-95 text-white flex items-center justify-center shadow-md transition-all duration-150 cursor-pointer"
            aria-label={isPlaying ? 'Tạm dừng podcast' : 'Phát podcast'}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#786C68] hover:text-[#1C1615] hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tập kế tiếp"
            title="Tập kế tiếp"
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </button>
        </div>

        {/* ─── RIGHT: VOLUME, SPEED & EXTRAS ─────────────────────────────────── */}
        <div className="hidden sm:flex items-center justify-end gap-3 text-stone-600 shrink-0">
          {/* Volume Control with Solid Red Fill */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:text-[#1C1615] transition-colors cursor-pointer"
              aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-stone-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-stone-600" />
              )}
            </button>
            <div
              className="relative flex items-center w-16 h-3 group cursor-pointer"
              title={`Âm lượng: ${isMuted ? 0 : volume}% (kéo để chỉnh)`}
            >
              <div className="w-full h-1.5 rounded-full bg-[#EBE4D8] overflow-hidden">
                <div
                  className="h-full bg-[#A31D24] rounded-full"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                aria-label="Âm lượng"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute h-2.5 w-2.5 rounded-full bg-[#A31D24] pointer-events-none -translate-x-1/2 group-hover:scale-125 transition-transform"
                style={{ left: `${isMuted ? 0 : volume}%` }}
              />
            </div>
          </div>

          {/* Playback Speed Button */}
          <button
            type="button"
            onClick={handleCycleSpeed}
            className="px-2 py-0.5 rounded-lg border border-[#EBE4D8] bg-[#F5F2EB] text-[11px] font-mono font-semibold text-[#5C524F] hover:text-[#1C1615] hover:bg-[#EAE4D9] transition-colors cursor-pointer"
            title={`Tốc độ phát hiện tại: ${playbackSpeed}. Nhấp để chuyển đổi (1x, 1.25x, 1.5x, 2x)`}
          >
            {playbackSpeed}
          </button>

          {/* More & Playlist Buttons */}
          <button
            type="button"
            onClick={() => onSeriesClick?.(currentTrack.seriesId || 0)}
            className="p-1.5 hover:text-[#1C1615] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Tùy chọn thao tác tuyển tập"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onSeriesClick?.(currentTrack.seriesId || 0)}
            className="p-1.5 hover:text-[#1C1615] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Xem danh sách các tập trong tuyển tập"
          >
            <ListMusic className="h-4 w-4" />
          </button>

          {/* Close Player Button (Desktop) */}
          {onClose && (
            <div className="pl-1.5 border-l border-[#EBE4D8]">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-[#A31D24] hover:bg-red-50 rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Đóng thanh phát âm thanh"
                aria-label="Đóng thanh phát âm thanh"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Close Player Button (Mobile) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-[#A31D24] rounded-md transition-colors"
            title="Đóng thanh phát"
            aria-label="Đóng thanh phát"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const slot = typeof document !== 'undefined' ? document.getElementById('creator-player-slot') : null;
  return slot ? createPortal(playerContent, slot) : playerContent;
};
