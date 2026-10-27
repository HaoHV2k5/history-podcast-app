import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  X,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreatorVoiceItem } from '@/types/creatorStudio';

import {
  VoiceRegion,
  getVoiceRegion,
  getVoiceAccentDisplay,
  getRegionLabel,
  getGenderLabel,
  getEngineLabel,
} from '../creatorStudioUtils';

export type { VoiceRegion };
export {
  getVoiceRegion,
  getVoiceAccentDisplay,
  getRegionLabel,
  getGenderLabel,
  getEngineLabel,
};

// ─── 2. COMPONENT PROPS ─────────────────────────────────────────────────────

interface Step3VoiceSelectorProps {
  voices: CreatorVoiceItem[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  playingVoiceId: string | null;
  onPlayPreview: (voice: CreatorVoiceItem) => void;
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
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'neutral'>('all');
  const [engineFilter, setEngineFilter] = useState<'all' | 'edge-tts' | 'elevenlabs'>('all');

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearchQuery('');
    setRegionFilter('all');
    setGenderFilter('all');
    setEngineFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    regionFilter !== 'all' ||
    genderFilter !== 'all' ||
    engineFilter !== 'all';

  // Lọc danh sách giọng đọc theo vùng miền, giới tính, công nghệ và từ khóa tìm kiếm
  const filteredVoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return voices.filter((voice) => {
      // 1. Lọc theo Engine
      if (engineFilter !== 'all' && voice.engine !== engineFilter) return false;

      // 2. Lọc theo Giới tính
      if (genderFilter !== 'all') {
        if (genderFilter === 'neutral') {
          if (voice.gender === 'male' || voice.gender === 'female') return false;
        } else if (voice.gender !== genderFilter) {
          return false;
        }
      }

      // 3. Lọc theo Vùng miền (Chuẩn hóa)
      if (regionFilter !== 'all') {
        const voiceRegion = getVoiceRegion(voice);
        if (voiceRegion !== regionFilter) return false;
      }

      // 4. Lọc theo Từ khóa tìm kiếm
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
  }, [voices, engineFilter, genderFilter, regionFilter, searchQuery]);

  const selectedVoiceObj = voices.find((v) => v.id === selectedVoiceId) || null;
  const selectedVoiceRegion = selectedVoiceObj ? getVoiceRegion(selectedVoiceObj) : 'mien-bac';

  return (
    <div className="space-y-6 w-full">
      {/* ─── HEADER & BANNER GIỌNG ĐANG CHỌN ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
              <Mic className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-accent font-sans">
              BƯỚC 3 • THƯ VIỆN GIỌNG ĐỌC THUYẾT MINH
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Lựa Chọn Giọng Đọc AI Phù Hợp Với Đề Tài Lịch Sử
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
            Tích hợp bộ sưu tập 19 giọng đọc thuyết minh chuyên nghiệp. Hỗ trợ đầy đủ ba miền Bắc – Trung – Nam
            cùng sắc thái hào sảng, bi tráng, tự sự và học thuật cổ điển.
          </p>
        </div>

        {/* Selected Voice Card Banner / Unselected Emil Design State */}
        {selectedVoiceObj ? (
          <div className="p-4 rounded-xl border border-accent/30 bg-[#FFFBFB] shadow-2xs flex items-center justify-between gap-4 shrink-0 lg:min-w-[340px]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {selectedVoiceObj.gender === 'female' ? 'Nữ' : 'Nam'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
                    Giọng đang chọn
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                </div>
                <h3 className="font-serif font-bold text-sm text-ink truncate max-w-[200px]">
                  {selectedVoiceObj.name}
                </h3>
                <p className="text-[11px] text-muted truncate max-w-[220px]">
                  {getRegionLabel(selectedVoiceRegion)} • {getGenderLabel(selectedVoiceObj.gender)} • {getEngineLabel(selectedVoiceObj.engine)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPlayPreview(selectedVoiceObj)}
                className="h-8 px-2.5 rounded-lg border-accent/30 text-accent hover:bg-accent hover:text-white transition-all duration-150 active:scale-95 shrink-0 text-xs gap-1.5"
              >
                {isLoadingVoiceId === selectedVoiceObj.id ? (
                  <RotateCcw className="h-3 w-3 animate-spin" />
                ) : playingVoiceId === selectedVoiceObj.id ? (
                  <>
                    <Pause className="h-3 w-3" />
                    <span>Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>Nghe thử</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSelectVoice('')}
                className="h-8 px-2 text-[11px] text-muted hover:text-status-error-text transition-colors cursor-pointer"
                title="Bỏ chọn giọng này"
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-border bg-[#FAF8F5] shadow-2xs flex items-center justify-between gap-4 shrink-0 lg:min-w-[340px]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-surface-subtle text-muted border border-border flex items-center justify-center font-bold text-sm shrink-0">
                <Mic className="h-5 w-5 text-muted" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                    Chưa chọn giọng riêng
                  </span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-muted/10 text-muted font-medium">
                    Tùy chọn
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xs sm:text-sm text-ink truncate max-w-[200px]">
                  Mặc định: Nam Minh
                </h3>
                <p className="text-[11px] text-muted truncate max-w-[220px]">
                  Miền Bắc • Hào sảng • Edge-TTS
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-accent/80 shrink-0">
              Tự động áp dụng
            </span>
          </div>
        )}
      </div>

      {/* ─── TOOLBAR TÌM KIẾM & BỘ LỌC ĐA TIÊU CHÍ ──────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Hàng 1: Ô tìm kiếm giọng đọc */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên giọng (Nam Minh, Hoài My, Brian...), sắc thái (hào sảng, trầm ấm, dịu dàng), phong cách..."
              className="h-10 pl-10 pr-9 text-xs sm:text-sm bg-surface-subtle/40 border-border/80 rounded-xl focus:border-accent font-sans text-ink placeholder:text-muted/70 transition-all duration-150"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-sans text-muted shrink-0">
            <span className="font-medium">
              Hiển thị <strong className="text-ink">{filteredVoices.length}</strong> / {voices.length} giọng đọc
            </span>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 px-2 text-xs text-accent hover:bg-accent-soft hover:text-accent rounded-lg cursor-pointer"
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Hàng 2: Bộ lọc Vùng miền, Giới tính và Công nghệ */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs">
          {/* 1. Lọc Vùng Miền */}
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
              { id: 'toan-quoc', label: 'Toàn quốc' },
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
                  title={isActive ? 'Nhấp để bỏ lọc vùng miền này' : `Lọc theo ${tab.label}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 ${
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

          {/* 2. Lọc Giới tính & Công nghệ */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Giới tính */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-ink mr-1">Giới tính:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'male', label: 'Nam' },
                { id: 'female', label: 'Nữ' },
              ].map((g) => {
                const isActive = genderFilter === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setGenderFilter(
                        genderFilter === g.id ? 'all' : (g.id as 'all' | 'male' | 'female')
                      )
                    }
                    title={isActive ? 'Nhấp để bỏ lọc giới tính này' : `Lọc giọng ${g.label}`}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? 'bg-[#1C1917] text-white shadow-2xs'
                        : 'border border-border/70 bg-white text-muted hover:text-ink hover:bg-surface-subtle'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Công nghệ */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-ink mr-1">Công nghệ:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'edge-tts', label: 'Edge-TTS' },
                { id: 'elevenlabs', label: 'ElevenLabs' },
              ].map((eng) => {
                const isActive = engineFilter === eng.id;
                return (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() =>
                      setEngineFilter(
                        engineFilter === eng.id
                          ? 'all'
                          : (eng.id as 'all' | 'edge-tts' | 'elevenlabs')
                      )
                    }
                    title={isActive ? 'Nhấp để bỏ lọc công nghệ này' : `Lọc công nghệ ${eng.label}`}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? 'bg-accent text-white shadow-2xs'
                        : 'border border-border/70 bg-white text-muted hover:text-ink hover:bg-surface-subtle'
                    }`}
                  >
                    {eng.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi khi không thể phát âm thanh */}
      {voicePreviewError && (
        <div className="rounded-xl border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{voicePreviewError}</span>
        </div>
      )}

      {/* ─── LƯỚI DANH SÁCH THẺ GIỌNG ĐỌC (VOICE CARDS GRID) ────────────────── */}
      {filteredVoices.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center space-y-4 shadow-2xs">
          <div className="h-12 w-12 rounded-full bg-surface-subtle text-muted mx-auto flex items-center justify-center">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-ink">
              Không tìm thấy giọng đọc phù hợp
            </h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              Không có giọng đọc nào khớp với từ khóa "{searchQuery}" hoặc các bộ lọc vùng miền, giới tính hiện tại.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs mt-2"
          >
            Đặt lại tất cả bộ lọc &amp; tìm kiếm
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceId === voice.id;
            const isPlaying = playingVoiceId === voice.id;
            const isLoading = isLoadingVoiceId === voice.id;
            const region = getVoiceRegion(voice);
            const accentText = getVoiceAccentDisplay(voice);

            return (
              <div
                key={voice.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectVoice(isSelected ? '' : voice.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectVoice(isSelected ? '' : voice.id);
                  }
                }}
                title={isSelected ? 'Nhấp để bỏ chọn giọng đọc này' : 'Nhấp để chọn giọng đọc này'}
                className={`group p-4 sm:p-5 rounded-2xl border text-left cursor-pointer relative flex flex-col justify-between gap-3.5 select-none transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out active:scale-[0.985] ${
                  isSelected
                    ? 'border-accent bg-[#FFFDFD] ring-2 ring-accent/30 shadow-xs scale-[1.008]'
                    : 'border-border/80 bg-white hover:border-accent/60 hover:bg-[#FAF8F5]/60 hover:shadow-card-hover hover:-translate-y-1'
                }`}
              >
                {/* Phần đầu: Tên giọng + Radio Checkmark */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-accent text-white'
                            : 'bg-surface-subtle text-muted group-hover:bg-accent/10 group-hover:text-accent'
                        }`}
                      >
                        {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                      </span>
                      <h4 className="font-serif font-bold text-base text-ink group-hover:text-accent transition-colors truncate">
                        {voice.name}
                      </h4>
                    </div>

                    {/* Huy hiệu đặc tính: Vùng miền, Giới tính, Công nghệ, Đánh giá */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {/* Vùng miền */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] border border-border/80 text-[#1C1917]">
                        {getRegionLabel(region)}
                      </span>

                      {/* Giới tính */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] border border-border/80 text-[#78716C]">
                        {getGenderLabel(voice.gender)}
                      </span>

                      {/* Công nghệ */}
                      <Badge
                        variant={voice.engine === 'elevenlabs' ? 'accent' : 'outline'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {voice.engine === 'elevenlabs' ? 'ElevenLabs' : 'Edge-TTS'}
                      </Badge>

                      {voice.vietnameseRating && (
                        <span className="text-[11px] text-accent font-semibold font-mono ml-auto">
                          ★ {voice.vietnameseRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nút tròn chọn giọng với hiệu ứng Spring */}
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center border shrink-0 transition-all duration-200 ease-out ${
                      isSelected
                        ? 'border-accent bg-accent text-white shadow-2xs scale-105'
                        : 'border-border/80 bg-white group-hover:border-accent/60'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Phần giữa: Miêu tả sắc thái & Đề xuất phù hợp */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-[12px] font-medium text-ink flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-accent shrink-0" />
                    <span className="truncate">{accentText}</span>
                  </div>

                  {voice.recommendedFor && (
                    <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                      Phù hợp: {voice.recommendedFor}
                    </p>
                  )}

                  {/* Câu thoại mẫu */}
                  {voice.sampleText && (
                    <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] text-[11px] font-serif italic text-[#78716C] line-clamp-2">
                      "{voice.sampleText}"
                    </div>
                  )}
                </div>

                {/* Phần chân: Nút nghe thử câu mẫu & Trạng thái lựa chọn */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPreview(voice);
                    }}
                    className={`h-8 px-3 text-xs gap-1.5 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer font-sans ${
                      isPlaying
                        ? 'bg-accent text-white hover:bg-accent/90 shadow-2xs'
                        : 'border border-border/70 bg-white text-accent hover:bg-accent-soft hover:border-accent/40'
                    }`}
                  >
                    {isLoading ? (
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    ) : isPlaying ? (
                      <div className="flex items-center gap-1.5">
                        <Pause className="h-3.5 w-3.5" />
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="sound-bar !bg-white !w-[2px]" />
                          <span className="sound-bar !bg-white !w-[2px]" />
                          <span className="sound-bar !bg-white !w-[2px]" />
                          <span className="sound-bar !bg-white !w-[2px]" />
                        </div>
                      </div>
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    <span className="font-semibold">
                      {isLoading ? 'Đang tải âm thanh...' : isPlaying ? 'Tạm dừng' : 'Nghe thử câu mẫu'}
                    </span>
                  </Button>

                  <span
                    className={`text-[11px] font-medium font-sans transition-colors ${
                      isSelected
                        ? 'text-accent font-bold flex items-center gap-1 group-hover:text-status-error-text'
                        : 'text-muted group-hover:text-ink'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Đã chọn • Bấm để bỏ</span>
                      </>
                    ) : (
                      'Nhấp để chọn'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── THANH ĐIỀU HƯỚNG BƯỚC (BOTTOM NAVIGATION) ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-border/80">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevStep}
          className="w-full sm:w-auto gap-2 text-xs border-border/80 hover:bg-surface-subtle transition-all duration-150 active:scale-95 cursor-pointer rounded-xl h-10 px-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Bước 2: Phân cảnh</span>
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!selectedVoiceObj && (
            <span className="text-xs text-muted font-sans text-center sm:text-right">
              Chưa chọn giọng riêng • Tự động dùng giọng mặc định (Nam Minh)
            </span>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onNextStep}
            className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-bold px-6 h-10 rounded-xl shadow-glow-accent shimmer-button bg-accent text-white hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span>Tiếp tục: Thiết lập kết xuất video (Bước 4)</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
