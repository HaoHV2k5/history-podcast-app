import React from 'react';
import { Sparkles, FileText, Check } from 'lucide-react';

export type CreationMode = 'ai_prompt' | 'manual_script';

interface StudioCreationMethodToggleProps {
  creationMode: CreationMode;
  onSelectMode: (mode: CreationMode) => void;
}

export const StudioCreationMethodToggle: React.FC<StudioCreationMethodToggleProps> = ({
  creationMode,
  onSelectMode,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Option 1: AI Prompt Generation */}
      <button
        type="button"
        onClick={() => onSelectMode('ai_prompt')}
        className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
          creationMode === 'ai_prompt'
            ? 'border-accent bg-[#FFFBFB] shadow-2xs'
            : 'border-[#E7E5E4] bg-white hover:border-accent/40 hover:bg-[#FAF8F5]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 rounded-xl items-center justify-center shrink-0 mt-0.5 transition-colors ${
                creationMode === 'ai_prompt'
                  ? 'bg-[#FAF0F1] text-accent'
                  : 'bg-[#F5F4F0] text-[#78716C]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="font-sans text-sm font-bold text-[#1C1917] block leading-tight">
                AI hỗ trợ sáng tác
              </span>
              <span className="text-[11px] text-[#78716C] block mt-1 leading-relaxed">
                Nhập ý tưởng lịch sử để AI phát triển kịch bản cho bạn, dựa trên tư liệu chính thống.
              </span>
            </div>
          </div>

          {creationMode === 'ai_prompt' && (
            <div className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
          )}
        </div>
      </button>

      {/* Option 2: Manual Script Paste */}
      <button
        type="button"
        onClick={() => onSelectMode('manual_script')}
        className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
          creationMode === 'manual_script'
            ? 'border-accent bg-[#FFFBFB] shadow-2xs'
            : 'border-[#E7E5E4] bg-white hover:border-accent/40 hover:bg-[#FAF8F5]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 rounded-xl items-center justify-center shrink-0 mt-0.5 transition-colors ${
                creationMode === 'manual_script'
                  ? 'bg-[#FAF0F1] text-accent'
                  : 'bg-[#F5F4F0] text-[#78716C]'
              }`}
            >
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <span className="font-sans text-sm font-bold text-[#1C1917] block leading-tight">
                Sử dụng kịch bản có sẵn
              </span>
              <span className="text-[11px] text-[#78716C] block mt-1 leading-relaxed">
                Tự viết hoặc dán nội dung kịch bản đã có của bạn.
              </span>
            </div>
          </div>

          {creationMode === 'manual_script' && (
            <div className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
};
