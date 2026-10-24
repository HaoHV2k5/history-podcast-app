import React, { useState } from 'react';
import {
  Volume2,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreatorVoiceItem } from '@/types/creatorStudio';

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
  const [engineFilter, setEngineFilter] = useState<'all' | 'edge-tts' | 'elevenlabs'>('all');
  const [accentFilter, setAccentFilter] = useState<'all' | 'bac' | 'nam' | 'trung'>('all');

  const filteredVoices = voices.filter((v) => {
    if (engineFilter !== 'all' && v.engine !== engineFilter) return false;
    if (accentFilter !== 'all') {
      const acc = (v.accent || '').toLowerCase();
      if (accentFilter === 'bac' && !acc.includes('bắc')) return false;
      if (accentFilter === 'nam' && !acc.includes('nam')) return false;
      if (accentFilter === 'trung' && !acc.includes('trung')) return false;
    }
    return true;
  });

  const selectedVoiceObj = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Volume2 className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Bước 3 • Thư Viện Giọng Đọc Thuyết Minh
            </span>
          </div>
          <h2 className="font-serif text-lg font-bold text-ink">
            Lựa Chọn Giọng Đọc AI Phù Hợp Với Đề Tài Lịch Sử
          </h2>
          <p className="text-xs text-muted">
            Hỗ trợ Microsoft Edge-TTS (miễn phí, chuẩn tiếng Việt) và ElevenLabs chất lượng truyền cảm.
          </p>
        </div>

        {/* Selected Voice Badge Preview */}
        {selectedVoiceObj && (
          <div className="p-3 rounded-lg border border-accent/30 bg-accent-soft/30 flex items-center gap-3 shrink-0">
            <div className="h-8 w-8 rounded-full bg-accent text-canvas flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <div>
              <span className="text-[10px] text-muted block uppercase tracking-wider">Giọng đang chọn:</span>
              <span className="font-serif font-bold text-xs text-ink">{selectedVoiceObj.name}</span>
              <span className="text-[11px] text-muted ml-1.5">
                ({selectedVoiceObj.accent || 'Miền Bắc'} • {selectedVoiceObj.engine})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface shadow-xs">
        {/* Accent Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted mr-1">Vùng miền:</span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'bac', label: 'Miền Bắc' },
            { id: 'trung', label: 'Miền Trung' },
            { id: 'nam', label: 'Miền Nam' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAccentFilter(tab.id as 'all' | 'bac' | 'nam' | 'trung')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                accentFilter === tab.id
                  ? 'bg-accent text-canvas font-bold'
                  : 'text-muted hover:text-ink hover:bg-surface-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Engine Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted mr-1">Engine:</span>
          {[
            { id: 'all', label: 'Tất cả Engine' },
            { id: 'edge-tts', label: 'Edge-TTS (Miễn phí)' },
            { id: 'elevenlabs', label: 'ElevenLabs' },
          ].map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => setEngineFilter(eng.id as 'all' | 'edge-tts' | 'elevenlabs')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                engineFilter === eng.id
                  ? 'bg-surface-subtle text-accent font-bold border border-border'
                  : 'text-muted hover:text-ink hover:bg-surface-subtle'
              }`}
            >
              {eng.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert if preview fails */}
      {voicePreviewError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-3 text-xs text-status-error-text flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{voicePreviewError}</span>
        </div>
      )}

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlaying = playingVoiceId === voice.id;
          const isLoading = isLoadingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`group p-4 rounded-xl border text-left card-hover-lift transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-accent bg-accent-soft/30 ring-2 ring-accent/30 shadow-glow-accent scale-[1.01]'
                  : 'border-border bg-surface hover:border-accent/50 hover:bg-surface-subtle/50 hover:shadow-card-hover'
              }`}
            >
              {/* Card Top: Name + Selection Check */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-serif font-bold text-sm text-ink group-hover:text-accent transition-colors">
                    {voice.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant={voice.engine === 'elevenlabs' ? 'accent' : 'outline'} size="sm">
                      {voice.engine === 'elevenlabs' ? 'ElevenLabs' : 'Edge-TTS'}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {voice.accent || 'Miền Bắc'}
                    </Badge>
                    {voice.gender && (
                      <span className="text-[10px] text-muted font-mono">{voice.gender}</span>
                    )}
                  </div>
                </div>

                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    isSelected
                      ? 'border-accent bg-accent text-canvas shadow-xs scale-110'
                      : 'border-border group-hover:border-accent/60'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
              </div>

              {/* Sample text preview note */}
              {voice.recommendedFor && (
                <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                  {voice.recommendedFor}
                </p>
              )}

              {/* Bottom Card: Listen Preview Button */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPreview(voice);
                  }}
                  className={`h-7 px-2.5 text-xs gap-1.5 rounded-lg transition-all duration-200 active:scale-95 ${
                    isPlaying
                      ? 'bg-accent text-canvas hover:bg-accent/90 shadow-xs'
                      : 'text-accent hover:bg-accent-soft'
                  }`}
                >
                  {isLoading ? (
                    <RotateCcw className="h-3 w-3 animate-spin" />
                  ) : isPlaying ? (
                    <div className="flex items-center gap-1">
                      <Pause className="h-3 w-3" />
                      <div className="flex items-center gap-0.5 h-2.5">
                        <span className="sound-bar !bg-canvas !w-[2px]" />
                        <span className="sound-bar !bg-canvas !w-[2px]" />
                        <span className="sound-bar !bg-canvas !w-[2px]" />
                        <span className="sound-bar !bg-canvas !w-[2px]" />
                      </div>
                    </div>
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  <span>{isLoading ? 'Đang tải...' : isPlaying ? 'Tạm dừng' : 'Nghe thử câu mẫu'}</span>
                </Button>

                <span className="text-[10px] text-muted font-mono">
                  {isSelected ? 'Đang chọn' : 'Nhấp để chọn'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevStep}
          className="gap-2 text-xs border-border hover:bg-surface-subtle transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Bước 2 (Phân cảnh)</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onNextStep}
          className="gap-2 text-xs font-semibold px-5 shadow-glow-accent shimmer-button bg-accent text-canvas hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
        >
          <span>Tiếp tục: Kết xuất video &amp; Xuất bản (Bước 4)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
