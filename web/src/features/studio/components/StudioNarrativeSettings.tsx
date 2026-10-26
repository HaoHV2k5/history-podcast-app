import React from 'react';
import { Feather, Clock } from 'lucide-react';

export type NarrativeTone = 'epic' | 'intimate' | 'academic';

interface StudioNarrativeSettingsProps {
  narrativeTone: NarrativeTone;
  setNarrativeTone: (tone: NarrativeTone) => void;
  storyboardDuration: number;
  setStoryboardDuration: (dur: number) => void;
}

const TONE_OPTIONS: { id: NarrativeTone; label: string; desc: string }[] = [
  { id: 'epic', label: 'Hào sảng, sử thi', desc: 'Chiến trận, mở cõi' },
  { id: 'intimate', label: 'Sâu lắng, tự sự', desc: 'Ký sự, nhân sinh' },
  { id: 'academic', label: 'Khách quan, học thuật', desc: 'Tra cứu, sử học' },
];

const DURATION_OPTIONS = [
  { dur: 30, label: '30s', scenes: '1 cảnh' },
  { dur: 60, label: '60s', scenes: '2 cảnh (Đề xuất)' },
  { dur: 90, label: '90s', scenes: '3 cảnh' },
  { dur: 120, label: '120s', scenes: '4 cảnh' },
];

export const StudioNarrativeSettings: React.FC<StudioNarrativeSettingsProps> = ({
  narrativeTone,
  setNarrativeTone,
  storyboardDuration,
  setStoryboardDuration,
}) => {
  return (
    <div className="space-y-3 pt-1">
      {/* 1. Narrative Tone Box (Exact reference layout) */}
      <div className="p-3 sm:p-3.5 rounded-2xl border border-[#E7E5E4] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 rounded-xl items-center justify-center shrink-0 bg-[#FAF0F1] text-accent border border-accent/20">
            <Feather className="h-4 w-4" />
          </span>
          <div>
            <span className="font-sans text-xs sm:text-sm font-bold text-[#1C1917] block leading-tight">
              Phong cách kể chuyện (tùy chọn)
            </span>
            <span className="text-[11px] text-[#78716C] block mt-0.5">
              Chọn phong cách để AI điều chỉnh giọng văn phù hợp hơn.
            </span>
          </div>
        </div>

        <div className="relative shrink-0">
          <select
            value={narrativeTone}
            onChange={(e) => setNarrativeTone(e.target.value as NarrativeTone)}
            className="h-9 min-w-[170px] rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C1917] focus:outline-none focus:border-accent shadow-2xs cursor-pointer"
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Target Duration Pills */}
      <div className="flex items-center justify-between gap-2 px-1">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-accent" />
          <span>Thời lượng mục tiêu:</span>
          <span className="text-[11px] text-[#78716C] font-normal">
            (~{Math.max(1, Math.round(storyboardDuration / 30))} phân cảnh)
          </span>
        </label>

        <div className="flex items-center gap-1.5">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = storyboardDuration === opt.dur;
            return (
              <button
                key={opt.dur}
                type="button"
                onClick={() => setStoryboardDuration(opt.dur)}
                className={`h-7 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-accent bg-accent text-white font-bold shadow-2xs'
                    : 'border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                }`}
                title={opt.scenes}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
