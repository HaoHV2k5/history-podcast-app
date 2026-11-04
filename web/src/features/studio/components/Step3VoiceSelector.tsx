import React, { useState, useMemo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import {
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Search,
  X,
  Mic,
  SlidersHorizontal,
  Volume2,
  Star,
  Headphones,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreatorVoiceItem } from '@/types/creatorStudio';

import {
  VoiceRegion,
  getVoiceRegion,
  getVoiceAccentDisplay,
  getRegionLabel,
  getGenderLabel,
  getEngineLabel,
  getElevenLabsSampleQuote,
} from '../creatorStudioUtils';

export type { VoiceRegion };
export {
  getVoiceRegion,
  getVoiceAccentDisplay,
  getRegionLabel,
  getGenderLabel,
  getEngineLabel,
  getElevenLabsSampleQuote,
};

// ─── 2. COMPONENT PROPS ─────────────────────────────────────────────────────

interface Step3VoiceSelectorProps {
  voices: CreatorVoiceItem[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  playingVoiceId: string | null;
  onPlayPreview: (voice: CreatorVoiceItem, customText?: string) => void;
  isLoadingVoiceId: string | null;
  voicePreviewError: string | null;
  onPrevStep: () => void;
  onNextStep: () => void;
}

// ─── 3. MAIN COMPONENT ──────────────────────────────────────────────────────

export const Step3VoiceSelector: React.FC<Step3VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  playingVoiceId,
  onPlayPreview,
  isLoadingVoiceId,
  voicePreviewError,
  onPrevStep,
  onNextStep,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | VoiceRegion>('all');
  const [engineFilter, setEngineFilter] = useState<'all' | 'edge-tts' | 'elevenlabs'>('all');
  const [customTestText, setCustomTestText] = useState(
    'Sử Ký non sông, ngàn năm rạng rỡ anh hùng đất Việt.'
  );
  const [customVoiceId, setCustomVoiceId] = useState(() => {
    if (
      selectedVoiceId &&
      !selectedVoiceId.startsWith('vi-VN-') &&
      !voices.some((v) => v.id === selectedVoiceId)
    ) {
      return selectedVoiceId;
    }
    return '';
  });

  // GSAP Animation Refs
  const selectedDeckRef = useRef<HTMLDivElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearchQuery('');
    setRegionFilter('all');
    setEngineFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    regionFilter !== 'all' ||
    engineFilter !== 'all';

  // Lọc danh sách giọng đọc theo vùng miền, công nghệ và từ khóa tìm kiếm
  const filteredVoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return voices.filter((voice) => {
      // 1. Lọc theo Engine
      if (engineFilter !== 'all' && voice.engine !== engineFilter) return false;

      // 2. Lọc theo Vùng miền
      if (regionFilter !== 'all') {
        const voiceRegion = getVoiceRegion(voice);
        if (voiceRegion !== regionFilter) return false;
      }

      // 3. Lọc theo Từ khóa tìm kiếm
      if (q) {
        const nameMatch = (voice.name || '').toLowerCase().includes(q);
        const accentMatch = (voice.accent || '').toLowerCase().includes(q);
        const accentDisplayMatch = getVoiceAccentDisplay(voice).toLowerCase().includes(q);
        const recMatch = (voice.recommendedFor || '').toLowerCase().includes(q);
        const sampleMatch = (voice.sampleText || '').toLowerCase().includes(q);
        const regionLabelMatch = getRegionLabel(getVoiceRegion(voice)).toLowerCase().includes(q);
        const genderLabelMatch = getGenderLabel(voice.gender).toLowerCase().includes(q);
        const tagsMatch = (voice.tags || []).some((t) => t.toLowerCase().includes(q));

        if (
          !nameMatch &&
          !accentMatch &&
          !accentDisplayMatch &&
          !recMatch &&
          !sampleMatch &&
          !regionLabelMatch &&
          !genderLabelMatch &&
          !tagsMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [voices, engineFilter, regionFilter, searchQuery]);

  // Giọng được chọn hoặc giọng mặc định hệ thống (Nam Minh)
  const selectedVoiceObj = useMemo(() => {
    const found = voices.find((v) => v.id === selectedVoiceId);
    if (found) return found;
    if (selectedVoiceId && !selectedVoiceId.startsWith('vi-VN-')) {
      return {
        id: selectedVoiceId,
        name: `Giọng ElevenLabs (${selectedVoiceId.length > 10 ? selectedVoiceId.slice(0, 8) + '...' : selectedVoiceId})`,
        gender: 'custom',
        engine: 'elevenlabs',
        accent: 'ElevenLabs Tùy chỉnh',
        recommendedFor: 'Voice ID ElevenLabs cá nhân từ Creator',
        vietnameseRating: 5.0,
        previewUrl: '',
        sampleText: customTestText.trim() || 'Sử Ký non sông, ngàn năm rạng rỡ anh hùng đất Việt.',
        tags: ['ElevenLabs', 'Custom Voice ID', 'Đã lưu'],
      } as CreatorVoiceItem;
    }
    return null;
  }, [voices, selectedVoiceId, customTestText]);

  const defaultFallbackVoice = voices.find((v) => v.id === 'vi-VN-NamMinhNeural') || voices[0] || null;
  const activeDeckVoice = selectedVoiceObj || defaultFallbackVoice;
  const activeDeckRegion = activeDeckVoice ? getVoiceRegion(activeDeckVoice) : 'mien-bac';

  const isPlayingActiveDeck = Boolean(
    activeDeckVoice && playingVoiceId === activeDeckVoice.id
  );
  const isLoadingActiveDeck = Boolean(
    activeDeckVoice && isLoadingVoiceId === activeDeckVoice.id
  );

  const handleTestCustomVoiceId = () => {
    const trimmed = customVoiceId.trim();
    if (!trimmed) return;
    const customVoice: CreatorVoiceItem = {
      id: trimmed,
      name: `Giọng ElevenLabs (${trimmed.length > 10 ? trimmed.slice(0, 8) + '...' : trimmed})`,
      gender: 'custom',
      engine: 'elevenlabs',
      accent: 'ElevenLabs Tùy chỉnh',
      recommendedFor: 'Voice ID ElevenLabs cá nhân từ Creator',
      vietnameseRating: 5.0,
      previewUrl: '',
      sampleText: customTestText.trim() || 'Sử Ký non sông, ngàn năm rạng rỡ anh hùng đất Việt.',
      tags: ['ElevenLabs', 'Custom Voice ID'],
    };
    onPlayPreview(customVoice, customTestText.trim() || 'Sử Ký non sông, ngàn năm rạng rỡ anh hùng đất Việt.');
  };

  const handleApplyCustomVoiceId = () => {
    const trimmed = customVoiceId.trim();
    if (!trimmed) return;
    onSelectVoice(trimmed);
  };

  // ─── 4. GSAP ANIMATIONS ───────────────────────────────────────────────────

  // A. Stagger animation on catalog cards when filters change
  useEffect(() => {
    if (isReducedMotion() || !cardsGridRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.voice-catalog-card',
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.28,
          stagger: 0.025,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    }, cardsGridRef);

    return () => ctx.revert();
  }, [regionFilter, engineFilter, searchQuery]);

  // B. Selected Deck highlight animation when a voice is chosen
  useEffect(() => {
    if (isReducedMotion() || !selectedDeckRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        selectedDeckRef.current,
        { scale: 0.98, opacity: 0.8 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.22,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    }, selectedDeckRef);

    return () => ctx.revert();
  }, [selectedVoiceId]);

  // C. Audio Waveform Visualizer live animation
  useEffect(() => {
    if (!visualizerRef.current) return;
    const bars = visualizerRef.current.querySelectorAll('.studio-sound-bar');
    if (!bars.length) return;

    if (isPlayingActiveDeck) {
      const tweens = Array.from(bars).map((bar, i) =>
        gsap.to(bar, {
          scaleY: () => 0.15 + Math.random() * 0.85,
          duration: 0.18 + Math.random() * 0.18,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: (i % 6) * 0.04,
        })
      );
      return () => {
        tweens.forEach((t) => t.kill());
      };
    } else {
      gsap.to(bars, {
        scaleY: 0.25,
        duration: 0.25,
        ease: 'power1.out',
      });
    }
  }, [isPlayingActiveDeck]);

  return (
    <div className="space-y-6 w-full">
      {/* ─── 1. PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
              <Mic className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-accent font-sans">
              BƯỚC 3 • THƯ VIỆN GIỌNG ĐỌC AI LỊCH SỬ
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Chọn Giọng Đọc Thuyết Minh Tác Phẩm
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
            Tích hợp bộ sưu tập 19 giọng đọc thuyết minh chuyên nghiệp. Hỗ trợ chuẩn ngữ điệu ba miền Bắc – Trung – Nam
            cùng sắc thái hào sảng, bi tráng, tự sự và học thuật cổ điển.
          </p>
        </div>

        {/* Global Progress Indicator */}
        <div className="shrink-0 flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-sans text-xs px-3 py-1 rounded-lg border-accent/30 text-accent bg-[#FFFBFB]"
          >
            {selectedVoiceObj ? 'Đã chọn giọng riêng' : 'Dùng giọng chuẩn mặc định'}
          </Badge>
        </div>
      </div>

      {/* ─── 2. ERROR NOTIFICATION ────────────────────────────────────────── */}
      {voicePreviewError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-status-error-text/30 bg-status-error-bg/60 text-xs text-status-error-text flex items-center gap-3 animate-fadeIn"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-sans">{voicePreviewError}</span>
        </div>
      )}

      {/* ─── 3. STUDIO ATELIER MASTER-DETAIL 2-COLUMN LAYOUT ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN (5 cols): SELECTED VOICE STUDIO DECK & ACTIONS ────── */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 self-start space-y-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-0.5">
          {activeDeckVoice ? (
            <div
              ref={selectedDeckRef}
              className="rounded-2xl border border-[#DDD7CD] bg-white p-5 sm:p-6 shadow-2xs space-y-5"
            >
              {/* Studio Deck Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-2xs">
                    <Headphones className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold font-sans text-accent">
                      {selectedVoiceObj ? 'GIỌNG ĐÃ CHỌN' : 'GIỌNG MẶC ĐỊNH HỆ THỐNG'}
                    </h3>
                    <p className="text-[11px] text-muted font-sans">
                      Phòng kiểm âm & thử giọng AI
                    </p>
                  </div>
                </div>

                {selectedVoiceObj && (
                  <button
                    type="button"
                    onClick={() => onSelectVoice('')}
                    className="text-[11px] font-sans text-muted hover:text-status-error-text transition-[color] cursor-pointer"
                    title="Bỏ chọn giọng riêng"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              {/* Voice Identity Banner */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-ink leading-snug truncate">
                      {activeDeckVoice.name}
                    </h4>
                    <p className="font-sans text-xs text-muted pt-0.5 line-clamp-2">
                      {getVoiceAccentDisplay(activeDeckVoice)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                    {activeDeckVoice.gender === 'female' ? 'Nữ' : 'Nam'}
                  </div>
                </div>

                {/* Characteristic Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] border border-border/80 text-ink">
                    {getRegionLabel(activeDeckRegion)}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] border border-border/80 text-muted">
                    {getGenderLabel(activeDeckVoice.gender)}
                  </span>
                  <Badge
                    variant={activeDeckVoice.engine === 'elevenlabs' ? 'accent' : 'outline'}
                    size="sm"
                    className="text-[10px]"
                  >
                    {activeDeckVoice.engine === 'elevenlabs' ? 'ElevenLabs' : 'Edge-TTS'}
                  </Badge>
                  {activeDeckVoice.vietnameseRating && (
                    <span className="text-[11px] text-accent font-semibold flex items-center ml-auto">
                      <Star className="h-3 w-3 fill-accent text-accent inline mr-0.5" />
                      <span>{activeDeckVoice.vietnameseRating.toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Player Deck with GSAP Waveform */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onPlayPreview(activeDeckVoice)}
                    className={`h-11 w-11 rounded-full p-0 flex items-center justify-center shrink-0 transition-[background-color,color,transform] duration-150 active:scale-95 cursor-pointer shadow-2xs ${
                      isPlayingActiveDeck
                        ? 'bg-accent text-white hover:bg-accent/90'
                        : 'bg-white border border-[#DDD7CD] text-accent hover:bg-accent hover:text-white'
                    }`}
                    title={isPlayingActiveDeck ? 'Tạm dừng phát' : 'Nghe thử âm thanh'}
                  >
                    {isLoadingActiveDeck ? (
                      <RotateCcw className="h-4 w-4 animate-spin" />
                    ) : isPlayingActiveDeck ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-sans pb-1.5">
                      <span className="font-semibold text-ink truncate">
                        {isLoadingActiveDeck
                          ? 'Đang tải âm thanh...'
                          : isPlayingActiveDeck
                          ? 'Đang phát âm thanh...'
                          : activeDeckVoice.engine === 'elevenlabs'
                          ? 'Nghe âm sắc mẫu (English)'
                          : 'Nghe thử câu thoại Tiếng Việt'}
                      </span>
                      <span className="text-[10px] text-muted shrink-0 ml-1">
                        {isPlayingActiveDeck ? 'Đang phát' : 'Mẫu thử'}
                      </span>
                    </div>

                    {/* GSAP Waveform Visualizer */}
                    <div
                      ref={visualizerRef}
                      className="flex items-center gap-1 h-6 px-2 rounded-lg bg-white border border-[#EAE6DF]"
                      aria-label="Cột sóng âm thanh"
                    >
                      {Array.from({ length: 14 }).map((_, i) => (
                        <span
                          key={i}
                          className="studio-sound-bar flex-1 h-full bg-accent/80 rounded-full origin-bottom"
                          style={{ transform: 'scaleY(0.25)' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sample Quote Display */}
                {activeDeckVoice.engine === 'elevenlabs' ? (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#78716C]">
                      <span className="flex items-center gap-1 text-accent">
                        <Volume2 className="h-3 w-3" />
                        <span>Mẫu âm sắc gốc (English Sample):</span>
                      </span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-[#EAE6DF] text-[10px] text-muted">
                        Audio gốc
                      </span>
                    </div>
                    <p className="text-[11px] font-sans italic text-[#1C1917] leading-tight line-clamp-3 bg-white p-2.5 rounded-lg border border-[#EAE6DF]">
                      &quot;{getElevenLabsSampleQuote(activeDeckVoice.id)}&quot;
                    </p>
                    <p className="text-[10px] font-sans text-[#78716C] leading-snug flex items-start gap-1">
                      <span className="text-accent font-bold">*</span>
                      <span>
                        Khi kết xuất video, AI sẽ đọc kịch bản bằng <strong>Tiếng Việt chuẩn</strong> theo đúng âm sắc này.
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#78716C]">
                      <span className="flex items-center gap-1 text-accent">
                        <Volume2 className="h-3 w-3" />
                        <span>Mẫu câu đọc Tiếng Việt chuẩn:</span>
                      </span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-[#EAE6DF] text-[10px] text-status-success-text font-medium">
                        Tiếng Việt
                      </span>
                    </div>
                    <p className="text-[11px] font-serif italic text-[#1C1917] leading-tight line-clamp-3 bg-white p-2.5 rounded-lg border border-[#EAE6DF]">
                      &quot;{activeDeckVoice.sampleText || 'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.'}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Interactive Custom Text Testing Playground */}
              <div className="p-4 rounded-xl bg-white border border-[#EAE6DF] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-[#F2EFE9]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span className="font-sans text-xs font-bold text-[#1C1917]">
                      Thử nghiệm câu thoại tùy chọn
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 border-[#E2DDD5] text-accent bg-[#FAF0F1] font-medium"
                  >
                    {activeDeckVoice.engine === 'elevenlabs' ? 'ElevenLabs' : 'Edge-TTS'}
                  </Badge>
                </div>

                <p className="text-[11px] font-sans text-[#78716C] leading-snug">
                  Nhập câu tiếng Việt bất kỳ để kiểm tra âm điệu và sắc thái của giọng{' '}
                  <strong className="text-[#1C1917]">{activeDeckVoice.name}</strong>:
                </p>

                <div className="space-y-1.5">
                  <Textarea
                    rows={2}
                    value={customTestText}
                    onChange={(e) => setCustomTestText(e.target.value)}
                    placeholder="Nhập nội dung bạn muốn nghe thử (tiếng Việt có dấu)..."
                    className="font-sans text-xs bg-[#FAF8F5] border-[#EAE6DF] focus-visible:ring-accent leading-relaxed rounded-xl p-2.5 text-[#1C1917]"
                  />

                  {/* Preset historical chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-sans font-medium text-[#78716C]">Mẫu câu:</span>
                    {[
                      'Sử Ký non sông, ngàn năm rạng rỡ anh hùng đất Việt.',
                      'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.',
                      'Đại Việt ta từ trước, vốn xưng nền văn hiến đã lâu.',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomTestText(preset)}
                        className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#EAE6DF] text-[#44403C] hover:text-[#1C1917] transition-colors cursor-pointer truncate max-w-[190px]"
                        title={preset}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onPlayPreview(activeDeckVoice, customTestText.trim())}
                  disabled={!customTestText.trim() || isLoadingActiveDeck}
                  className="w-full h-8.5 text-xs font-sans font-semibold gap-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isLoadingActiveDeck ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang tổng hợp giọng nói...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Phát âm câu này</span>
                    </>
                  )}
                </Button>

                {activeDeckVoice.engine === 'elevenlabs' ? (
                  <p className="text-[10px] font-sans text-[#78716C] leading-tight flex items-start gap-1 pt-0.5">
                    <span className="text-accent font-bold">•</span>
                    <span>
                      Sử dụng <strong>ElevenLabs API Key</strong> trong phần Cài đặt AI của bạn để tổng hợp âm thanh tiếng Việt thực tế.
                    </span>
                  </p>
                ) : (
                  <p className="text-[10px] font-sans text-[#78716C] leading-tight flex items-start gap-1 pt-0.5">
                    <span className="text-accent font-bold">•</span>
                    <span>Hệ thống tạo âm thanh ngay lập tức với chuẩn ngữ điệu tự nhiên.</span>
                  </p>
                )}
              </div>

              {/* Voice ID ElevenLabs Tùy Chỉnh */}
              <div className="p-4 rounded-xl bg-white border border-[#EAE6DF] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-[#F2EFE9]">
                  <div className="flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-accent" />
                    <span className="font-sans text-xs font-bold text-[#1C1917]">
                      Voice ID ElevenLabs tùy chỉnh
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 border-[#E2DDD5] text-accent bg-[#FAF0F1] font-medium"
                  >
                    ElevenLabs Studio
                  </Badge>
                </div>

                <p className="text-[11px] font-sans text-[#78716C] leading-snug">
                  Dán Voice ID từ tài khoản ElevenLabs của bạn (hoặc giọng đã nhân bản - Cloned Voice):
                </p>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      value={customVoiceId}
                      onChange={(e) => setCustomVoiceId(e.target.value)}
                      placeholder="Ví dụ: 21m00Tcm4TlvDq8ikWAM"
                      className="font-mono text-xs bg-[#FAF8F5] border-[#EAE6DF] focus-visible:ring-accent rounded-lg h-9 pr-14 text-[#1C1917]"
                    />
                    {customVoiceId.trim() ? (
                      <button
                        type="button"
                        onClick={() => setCustomVoiceId('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-[#1C1917] p-1 text-xs cursor-pointer"
                        title="Xóa"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clip = await navigator.clipboard.readText();
                            if (clip) setCustomVoiceId(clip.trim());
                          } catch {
                            // clipboard read might be blocked
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-accent text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 hover:bg-accent/20 cursor-pointer"
                      >
                        Dán
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleTestCustomVoiceId}
                      disabled={!customVoiceId.trim() || isLoadingVoiceId === customVoiceId.trim()}
                      className="flex-1 h-8 text-[11px] font-sans font-medium gap-1 rounded-lg border-[#E2DDD5] bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#1C1917] cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingVoiceId === customVoiceId.trim() ? (
                        <>
                          <RotateCcw className="h-3 w-3 animate-spin" />
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-current" />
                          <span>Nghe thử ID này</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyCustomVoiceId}
                      disabled={!customVoiceId.trim() || selectedVoiceId === customVoiceId.trim()}
                      className={`flex-1 h-8 text-[11px] font-sans font-semibold gap-1 rounded-lg cursor-pointer ${
                        selectedVoiceId === customVoiceId.trim()
                          ? 'bg-status-success-bg text-status-success-text border border-status-success-text/30'
                          : 'bg-accent text-white hover:bg-accent/90 shadow-2xs'
                      }`}
                    >
                      {selectedVoiceId === customVoiceId.trim() ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Đang chọn giọng này</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Chọn Voice ID này</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {selectedVoiceId === customVoiceId.trim() && customVoiceId.trim() && (
                  <div className="p-2 rounded-lg bg-status-success-bg/20 border border-status-success-text/30 flex items-center gap-1.5 text-[11px] text-status-success-text font-medium">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Đang sử dụng Voice ID tùy chỉnh: <span className="font-mono">{customVoiceId.trim()}</span></span>
                  </div>
                )}
              </div>

              {/* ─── PRIMARY & SECONDARY ACTIONS RIGHT INSIDE THE STICKY LEFT DECK ─── */}
              <div className="pt-2 space-y-2 border-t border-[#EAE6DF]">
                <Button
                  type="button"
                  size="sm"
                  onClick={onNextStep}
                  className="w-full gap-2 text-xs sm:text-sm font-bold h-11 rounded-xl bg-accent text-white hover:bg-accent/90 shadow-2xs active:scale-[0.98] transition-[background-color,transform] focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                >
                  <span>Tiếp tục: Bước 4 (Kết xuất video)</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onPrevStep}
                  className="w-full gap-2 text-xs font-medium border-[#E2DDD5] bg-white hover:bg-[#FAF8F5] text-[#1C1917] h-9.5 rounded-xl active:scale-[0.98] transition-[background-color,border-color,transform] focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Quay lại Bước 2 (Phân cảnh)</span>
                </Button>

                <p className="text-[10px] text-muted text-center font-sans">
                  Bạn có thể thay đổi giọng đọc bất cứ lúc nào trước khi kết xuất.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ─── RIGHT COLUMN (7 cols): CATALOG & FILTERS ──────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Toolbar */}
          <div className="rounded-2xl border border-border/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            {/* Search Input & Engine Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <Input
                  type="text"
                  placeholder="Tìm theo tên giọng, ngữ điệu, vùng miền..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs rounded-xl bg-surface-subtle border-border/80 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Engine Filter Pills */}
              <div className="flex items-center gap-1 shrink-0 text-xs">
                {[
                  { id: 'all', label: 'Tất cả engine' },
                  { id: 'edge-tts', label: 'Edge-TTS' },
                  { id: 'elevenlabs', label: 'ElevenLabs' },
                ].map((item) => {
                  const isActive = engineFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setEngineFilter(item.id as 'all' | 'edge-tts' | 'elevenlabs')
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-[background-color,color] cursor-pointer ${
                        isActive
                          ? 'bg-accent text-white shadow-2xs'
                          : 'border border-border/70 bg-white text-muted hover:text-ink hover:bg-surface-subtle'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region Filter Tabs */}
            <div className="pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-ink mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                  <span>Vùng miền:</span>
                </span>
                {[
                  { id: 'all', label: 'Tất cả vùng miền' },
                  { id: 'mien-bac', label: 'Miền Bắc' },
                  { id: 'mien-trung', label: 'Miền Trung' },
                  { id: 'mien-nam', label: 'Miền Nam' },
                ].map((tab) => {
                  const isActive = regionFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setRegionFilter(
                          regionFilter === tab.id ? 'all' : (tab.id as 'all' | VoiceRegion)
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-accent text-white shadow-2xs'
                          : 'border border-border/70 bg-white text-muted hover:text-ink hover:bg-surface-subtle'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Filter Count & Reset */}
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="tabular-nums font-medium">
                  {filteredVoices.length} giọng đọc
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Custom Voice Banner */}
          {selectedVoiceObj && selectedVoiceObj.engine === 'elevenlabs' && !voices.some((v) => v.id === selectedVoiceObj.id) && (
            <div className="p-3.5 rounded-2xl border border-status-success-text/30 bg-status-success-bg/20 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-status-success-bg text-status-success-text flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-ink truncate">
                      {selectedVoiceObj.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-accent/30 text-accent bg-[#FAF0F1] font-medium">
                      Voice ID Tùy Chỉnh
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted font-mono truncate block">
                    ID: {selectedVoiceObj.id}
                  </span>
                </div>
              </div>
              <Badge variant="success" size="sm" className="shrink-0 text-[10px] font-sans font-medium">
                Đang kích hoạt
              </Badge>
            </div>
          )}

          {/* Catalog Cards Grid */}
          {filteredVoices.length === 0 ? (
            <div className="p-10 rounded-2xl border border-border/80 bg-white text-center space-y-3 shadow-2xs">
              <div className="h-10 w-10 rounded-full bg-accent-soft text-accent mx-auto flex items-center justify-center">
                <Search className="h-5 w-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-ink">
                Không tìm thấy giọng đọc phù hợp
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto font-sans">
                Thử thay đổi bộ lọc vùng miền, công nghệ hoặc xóa từ khóa tìm kiếm để khám phá thêm.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs rounded-xl"
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          ) : (
            <div
              ref={cardsGridRef}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                const isPlaying = playingVoiceId === voice.id;
                const isLoading = isLoadingVoiceId === voice.id;
                const region = getVoiceRegion(voice);
                const accentText = getVoiceAccentDisplay(voice);

                return (
                  <div
                    key={voice.id}
                    onClick={() => onSelectVoice(isSelected ? '' : voice.id)}
                    className={`voice-catalog-card p-3.5 rounded-xl border transition-[background-color,border-color,transform] duration-150 cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent/30 shadow-2xs'
                        : 'border-[#EAE6DF] bg-white hover:border-accent/50 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Card Header: Avatar, Name, Badges & Radio */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? 'bg-accent text-white'
                                : 'bg-surface-subtle text-muted'
                            }`}
                          >
                            {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-ink truncate">
                            {voice.name}
                          </h4>
                        </div>

                        {/* Radio Checkmark */}
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 transition-[background-color,border-color] duration-150 ${
                            isSelected
                              ? 'border-accent bg-accent text-white'
                              : 'border-border/80 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Region & Engine Badges */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F5] border border-border/80 text-ink">
                          {getRegionLabel(region)}
                        </span>
                        <Badge
                          variant={voice.engine === 'elevenlabs' ? 'accent' : 'outline'}
                          size="sm"
                          className="text-[9px] px-1.5 py-0"
                        >
                          {voice.engine === 'elevenlabs' ? 'ElevenLabs' : 'Edge-TTS'}
                        </Badge>
                        {voice.vietnameseRating && (
                          <span className="text-[10px] text-accent font-semibold flex items-center ml-auto">
                            <Star className="h-2.5 w-2.5 fill-accent text-accent inline mr-0.5" />
                            <span>{voice.vietnameseRating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      {/* Accent Description */}
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed font-sans pt-0.5">
                        {accentText}
                      </p>
                    </div>

                    {/* Card Footer: Quick Preview & State */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPreview(voice);
                        }}
                        className={`h-7.5 px-2.5 text-[11px] gap-1 rounded-lg transition-[background-color,color] duration-150 active:scale-95 cursor-pointer font-sans ${
                          isPlaying
                            ? 'bg-accent text-white hover:bg-accent/90 shadow-2xs'
                            : 'border border-border/70 bg-white text-accent hover:bg-accent-soft hover:border-accent/40'
                        }`}
                      >
                        {isLoading ? (
                          <RotateCcw className="h-3 w-3 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3 fill-current" />
                        )}
                        <span className="font-semibold">
                          {isLoading
                            ? 'Đang tải...'
                            : isPlaying
                            ? 'Dừng'
                            : voice.engine === 'elevenlabs'
                            ? 'Nghe âm sắc'
                            : 'Nghe thử'}
                        </span>
                      </Button>

                      <span
                        className={`text-[10px] font-medium font-sans ${
                          isSelected
                            ? 'text-accent font-bold'
                            : 'text-muted'
                        }`}
                      >
                        {isSelected ? 'Đã chọn' : 'Nhấp để chọn'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. MOBILE / TABLET FLOATING DOCK (< lg) ───────────────────────── */}
      <div className="lg:hidden fixed bottom-3 inset-x-3 z-30 max-w-lg mx-auto p-3 rounded-2xl bg-white border border-[#DDD7CD] shadow-2xs flex items-center justify-between gap-2.5 animate-fadeIn">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0">
            {activeDeckVoice?.gender === 'female' ? 'Nữ' : 'Nam'}
          </div>
          <div className="min-w-0">
            <h4 className="font-serif font-bold text-xs text-ink truncate">
              {activeDeckVoice?.name || 'Mặc định: Nam Minh'}
            </h4>
            <span className="text-[10px] text-muted block truncate font-sans">
              {activeDeckVoice ? getRegionLabel(getVoiceRegion(activeDeckVoice)) : 'Miền Bắc'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrevStep}
            className="h-9 px-2.5 text-xs rounded-xl border-border/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onNextStep}
            className="h-9 px-3.5 text-xs font-bold gap-1 rounded-xl bg-accent text-white hover:bg-accent/90"
          >
            <span>Bước 4</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
