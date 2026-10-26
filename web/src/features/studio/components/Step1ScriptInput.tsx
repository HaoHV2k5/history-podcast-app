import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileCheck2,
  PenLine,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScriptVerificationResponse } from '@/types/creatorStudio';
import { InputClassificationResult } from '../creatorStudioUtils';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';
import { StudioFormatSelector } from './StudioFormatSelector';
import { StudioCreationMethodToggle, CreationMode } from './StudioCreationMethodToggle';
import { StudioSuggestedTopics } from './StudioSuggestedTopics';
import { StudioNarrativeSettings, NarrativeTone } from './StudioNarrativeSettings';
import { StudioHistoricalResearchPanel } from './StudioHistoricalResearchPanel';
import { StudioScopeErrorDialog } from './StudioScopeErrorDialog';

export type { HistoricalTopicItem };
export { HISTORICAL_SCOPE_SUGGESTIONS };

interface Step1ScriptInputProps {
  renderMode?: 'whiteboard' | 'audio_podcast';
  setRenderMode?: (mode: 'whiteboard' | 'audio_podcast') => void;
  scriptTopic: string;
  setScriptTopic: (val: string) => void;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  storyboardDuration: number;
  setStoryboardDuration: (val: number) => void;
  inputClassification: InputClassificationResult;
  wordCount: number;
  estimatedReadingSec: number;
  sampleScript: string;
  onGenerateStoryboard: () => void;
  isGeneratingStoryboard: boolean;
  generateStoryboardError: Error | null;
  onVerifyScript: () => void;
  isVerifyingScript: boolean;
  verifyScriptError: Error | null;
  verificationResult: ScriptVerificationResponse | null;
  onApplyRevisedScript: (revised: string) => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onOpenSettings?: () => void;
  onClearError?: () => void;
}

export const Step1ScriptInput: React.FC<Step1ScriptInputProps> = ({
  renderMode = 'audio_podcast',
  setRenderMode,
  scriptTopic,
  setScriptTopic,
  scriptContent,
  setScriptContent,
  storyboardDuration,
  setStoryboardDuration,
  inputClassification: _inputClassification,
  wordCount,
  estimatedReadingSec,
  sampleScript,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  generateStoryboardError,
  onVerifyScript,
  isVerifyingScript,
  verifyScriptError,
  verificationResult,
  onApplyRevisedScript,
  copiedKey,
  onCopy,
  onOpenSettings,
  onClearError,
}) => {
  const [creationMode, setCreationMode] = useState<CreationMode>(
    scriptContent.length > 120 ? 'manual_script' : 'ai_prompt'
  );
  const [selectedDynasty, setSelectedDynasty] = useState<'all' | 'ly' | 'tran'>('all');
  const [narrativeTone, setNarrativeTone] = useState<NarrativeTone>('epic');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const effectiveInput = scriptTopic.trim() || scriptContent.trim();
  const isInputEmpty = !effectiveInput;

  // Active error handling
  const activeError = generateStoryboardError || verifyScriptError;
  useEffect(() => {
    if (activeError) {
      setIsErrorModalOpen(true);
    }
  }, [activeError]);

  // Selected topic match for contextual RAG panel
  const activeHistoricalItem =
    HISTORICAL_SCOPE_SUGGESTIONS.find(
      (item) => item.title === scriptTopic || item.title === scriptContent
    ) || null;

  return (
    <div className="space-y-3.5">
      {/* 1. Content Format Selection (Compact Segmented Control) */}
      <StudioFormatSelector
        renderMode={renderMode}
        setRenderMode={setRenderMode}
      />

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Main Creation Workspace): 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs space-y-5">
            {/* Step 1 Title & Description (Exact match to reference) */}
            <div className="space-y-1">
              <span className="text-accent text-xs font-bold uppercase tracking-wider block">
                BƯỚC 1/4
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1C1917] tracking-tight">
                Tạo kịch bản lịch sử
              </h2>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Chọn cách bắt đầu và nhập chủ đề lịch sử bạn muốn kể.
              </p>
            </div>

            {/* Creation Method Selection Cards */}
            <StudioCreationMethodToggle
              creationMode={creationMode}
              onSelectMode={setCreationMode}
            />

            {/* Mode A: AI Creation Mode */}
            {creationMode === 'ai_prompt' ? (
              <div className="space-y-4 pt-1">
                {/* Topic Input with Pen Icon & Character Counter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <PenLine className="h-4 w-4 text-accent" />
                      <span>Chủ đề hoặc sự kiện lịch sử <span className="text-accent">*</span></span>
                    </label>
                  </div>

                  <div className="relative">
                    <Input
                      type="text"
                      maxLength={200}
                      placeholder="Ví dụ: Đại Lễ dời đô năm 1010 của vua Lý Thái Tổ..."
                      value={scriptTopic || scriptContent}
                      onChange={(e) => {
                        setScriptTopic(e.target.value);
                        setScriptContent(e.target.value);
                      }}
                      className="text-xs h-11 px-3.5 pr-14 bg-white border-[#E7E5E4] rounded-xl focus:border-accent font-medium text-[#1C1917] shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#A8A29E] pointer-events-none tabular-nums">
                      {(scriptTopic || scriptContent).length}/200
                    </span>
                  </div>

                  <p className="text-xs text-[#78716C] flex items-center gap-1.5 pt-0.5">
                    <span className="text-[#A8A29E]">ⓘ</span>
                    <span>Hệ thống hỗ trợ giai đoạn Lý – Trần (1009 – 1400), dựa trên <em>Đại Việt Sử Ký Toàn Thư</em> &amp; <em>Khâm Định Việt Sử</em>.</span>
                  </p>
                </div>

                {/* Historical Topic Suggestions */}
                <StudioSuggestedTopics
                  selectedTopicTitle={scriptTopic || scriptContent}
                  onSelectTopic={(item) => {
                    setScriptTopic(item.title);
                    setScriptContent(item.desc);
                    setStoryboardDuration(item.suggestedDuration);
                  }}
                />

                {/* Narrative Settings (Tone & Duration) */}
                <StudioNarrativeSettings
                  narrativeTone={narrativeTone}
                  setNarrativeTone={setNarrativeTone}
                  storyboardDuration={storyboardDuration}
                  setStoryboardDuration={setStoryboardDuration}
                />

                {/* Dominant Primary Action CTA */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={onGenerateStoryboard}
                    disabled={isInputEmpty || isGeneratingStoryboard}
                    className="w-full sm:w-auto px-7 h-11 gap-2.5 bg-accent text-white font-bold hover:bg-accent/90 rounded-xl shadow-xs cursor-pointer text-xs sm:text-sm transition-all duration-200"
                  >
                    <Sparkles className={`h-4 w-4 ${isGeneratingStoryboard ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingStoryboard ? 'Đang tra cứu tư liệu & tạo kịch bản...' : 'Tạo kịch bản với AI'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Mode B: Manual Script Paste Mode */
              <div className="space-y-4 pt-1">
                {/* Title Input (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span>Tiêu đề tác phẩm</span>
                    <span className="text-[10px] text-muted font-normal">Tùy chọn</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Đại lễ dời đô năm 1010 và Khát vọng Thăng Long ngàn năm"
                    value={scriptTopic}
                    onChange={(e) => setScriptTopic(e.target.value)}
                    className="text-xs h-9 bg-surface border-border/80"
                  />
                </div>

                {/* Script Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink flex items-center gap-1">
                      <span>Nội dung kịch bản thuyết minh</span>
                      <span className="text-status-error-text">*</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setScriptTopic('Chiếu Dời Đô 1010 và Khát Vọng Thăng Long');
                          setScriptContent(sampleScript);
                        }}
                        className="text-[11px] h-6 px-2 text-accent hover:bg-accent/10 cursor-pointer"
                      >
                        Nạp mẫu Dời Đô 1010
                      </Button>
                      {scriptContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setScriptContent('');
                            setScriptTopic('');
                          }}
                          className="text-[11px] h-6 px-2 text-muted hover:text-ink cursor-pointer"
                        >
                          Xóa trắng
                        </Button>
                      )}
                    </div>
                  </div>

                  <Textarea
                    rows={7}
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    placeholder="Dán toàn văn kịch bản thuyết minh lịch sử tại đây..."
                    className="text-xs font-sans leading-relaxed min-h-[140px] bg-surface border-border/80 focus:border-accent"
                  />

                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Hệ thống bảo toàn 100% nội dung kịch bản tự viết của bạn.</span>
                    {wordCount > 0 && (
                      <span className="font-mono text-muted tabular-nums">
                        {wordCount} từ • ~{estimatedReadingSec}s đọc
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-ink">
                    Thời lượng video mục tiêu
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[30, 60, 90, 120].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setStoryboardDuration(dur)}
                        className={`h-8 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          storyboardDuration === dur
                            ? 'border-accent bg-accent text-canvas font-bold shadow-2xs ring-1 ring-accent/30'
                            : 'border-border/80 bg-surface text-muted hover:text-ink hover:bg-surface-subtle'
                        }`}
                      >
                        {dur}s ({dur / 30} cảnh)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions: Fact-check & Advance */}
                <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onVerifyScript}
                    disabled={isInputEmpty || isVerifyingScript || isGeneratingStoryboard}
                    className="gap-2 text-xs border-border/80 hover:bg-surface-subtle cursor-pointer"
                  >
                    <FileCheck2 className={`h-3.5 w-3.5 text-accent ${isVerifyingScript ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingScript ? 'Đang đối chiếu RAG...' : 'Thẩm định sử liệu (RAG AI)'}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={onGenerateStoryboard}
                    disabled={isInputEmpty || isGeneratingStoryboard || isVerifyingScript}
                    className="gap-2 text-xs font-bold px-5 bg-accent text-canvas hover:bg-accent/90 cursor-pointer"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isGeneratingStoryboard ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingStoryboard
                        ? 'Đang phân cảnh...'
                        : 'Tiếp tục: Chuyển sang Bước 2 (Phân Cảnh) →'}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Historical Source & RAG Panel): 5 Cols */}
        <div className="lg:col-span-5 space-y-4">
          <StudioHistoricalResearchPanel
            selectedTopicItem={activeHistoricalItem}
            activeTopicText={scriptTopic || scriptContent}
            selectedDynasty={selectedDynasty}
            onSelectDynasty={setSelectedDynasty}
            verificationResult={verificationResult}
            onApplyRevisedScript={onApplyRevisedScript}
            copiedKey={copiedKey}
            onCopy={onCopy}
            isProcessing={isGeneratingStoryboard || isVerifyingScript}
            storyboardDuration={storyboardDuration}
          />
        </div>
      </div>

      {/* ScopeGate & Diagnostics Error Dialog */}
      <StudioScopeErrorDialog
        isOpen={isErrorModalOpen}
        onClose={() => {
          setIsErrorModalOpen(false);
          onClearError?.();
        }}
        activeError={activeError}
        onSelectHistoricalTopic={(item) => {
          setScriptTopic(item.title);
          setScriptContent(item.desc);
          setStoryboardDuration(item.suggestedDuration);
          setIsErrorModalOpen(false);
          onClearError?.();
        }}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};
