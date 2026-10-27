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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
      {/* Option 1: AI Prompt Generation */}
      <button
        type="button"
        onClick={() => onSelectMode('ai_prompt')}
        className={`w-full h-full min-h-[96px] sm:min-h-[102px] p-3.5 sm:p-4 pr-9 sm:pr-10 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative flex items-start gap-3 select-none ${
          creationMode === 'ai_prompt'
            ? 'border-accent bg-[#FFFBFB] shadow-2xs'
            : 'border-[#E7E5E4] bg-white hover:border-accent/40 hover:bg-[#FAF8F5]'
        }`}
      >
        <span
          className={`flex h-9 w-9 min-w-[36px] min-h-[36px] rounded-xl items-center justify-center shrink-0 mt-0.5 transition-colors border ${
            creationMode === 'ai_prompt'
              ? 'bg-[#FAF0F1] text-accent border-accent/20'
              : 'bg-[#F5F4F0] text-[#78716C] border-[#E7E5E4]'
          }`}
        >
          <Sparkles className="h-4 w-4" />
        </span>

        <div className="flex-1 min-w-0">
          <span className="font-sans text-sm font-bold text-[#1C1917] block leading-tight">
            AI hỗ trợ sáng tác
          </span>
          <span className="text-[11px] text-[#78716C] block mt-1 leading-relaxed">
            Nhập ý tưởng lịch sử để AI phát triển kịch bản cho bạn, dựa trên tư liệu chính thống.
          </span>
        </div>

        {/* Selected Checkmark Badge (Positioned absolutely so it never alters text flow or height) */}
        {creationMode === 'ai_prompt' && (
          <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform animate-in fade-in zoom-in-75 duration-150">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
        )}
      </button>

      {/* Option 2: Manual Script Paste */}
      <button
        type="button"
        onClick={() => onSelectMode('manual_script')}
        className={`w-full h-full min-h-[96px] sm:min-h-[102px] p-3.5 sm:p-4 pr-9 sm:pr-10 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative flex items-start gap-3 select-none ${
          creationMode === 'manual_script'
            ? 'border-accent bg-[#FFFBFB] shadow-2xs'
            : 'border-[#E7E5E4] bg-white hover:border-accent/40 hover:bg-[#FAF8F5]'
        }`}
      >
        <span
          className={`flex h-9 w-9 min-w-[36px] min-h-[36px] rounded-xl items-center justify-center shrink-0 mt-0.5 transition-colors border ${
            creationMode === 'manual_script'
              ? 'bg-[#FAF0F1] text-accent border-accent/20'
              : 'bg-[#F5F4F0] text-[#78716C] border-[#E7E5E4]'
          }`}
        >
          <FileText className="h-4 w-4" />
        </span>

        <div className="flex-1 min-w-0">
          <span className="font-sans text-sm font-bold text-[#1C1917] block leading-tight">
            Sử dụng kịch bản có sẵn
          </span>
          <span className="text-[11px] text-[#78716C] block mt-1 leading-relaxed">
            Tự viết hoặc dán nội dung kịch bản đã có của bạn.
          </span>
        </div>

        {/* Selected Checkmark Badge (Positioned absolutely so it never alters text flow or height) */}
        {creationMode === 'manual_script' && (
          <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform animate-in fade-in zoom-in-75 duration-150">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
        )}
      </button>
    </div>
  );
};
