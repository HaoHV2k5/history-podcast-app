import React, { useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Sparkles,
  Scroll,
  Layers,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScriptVerificationResponse } from '@/types/creatorStudio';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';

interface StudioHistoricalResearchPanelProps {
  selectedTopicItem: HistoricalTopicItem | null;
  activeTopicText: string;
  selectedDynasty: 'all' | 'ly' | 'tran';
  onSelectDynasty: (dynasty: 'all' | 'ly' | 'tran') => void;
  verificationResult: ScriptVerificationResponse | null;
  onApplyRevisedScript?: (revised: string) => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  isProcessing: boolean;
  storyboardDuration: number;
}

export const StudioHistoricalResearchPanel: React.FC<StudioHistoricalResearchPanelProps> = ({
  selectedTopicItem,
  activeTopicText,
  selectedDynasty,
  onSelectDynasty,
  verificationResult,
  onApplyRevisedScript,
  copiedKey,
  onCopy,
  isProcessing,
  storyboardDuration,
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showRevisedScript, setShowRevisedScript] = useState(false);

  // If a topic is active, fallback to selectedTopicItem or the first canonical topic
  const activeItem =
    selectedTopicItem ||
    HISTORICAL_SCOPE_SUGGESTIONS.find(
      (item) => item.title === activeTopicText || item.id === activeTopicText
    ) ||
    (activeTopicText ? HISTORICAL_SCOPE_SUGGESTIONS[0] : null);

  // State 1: Verification Completed (Manual Script Fact-check Results)
  if (verificationResult) {
    return (
      <div className="rounded-xl border border-border/80 bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Kết Quả Thẩm Định Sử Liệu
            </span>
          </div>

          <Badge
            variant={
              verificationResult.overall_score >= 80
                ? 'success'
                : verificationResult.overall_score >= 50
                ? 'pending'
                : 'error'
            }
          >
            {verificationResult.overall_score}/100 Điểm
          </Badge>
        </div>

        <div className="p-3 rounded-lg bg-surface-subtle text-xs space-y-1">
          <span className="font-semibold text-ink block">Đánh giá chung:</span>
          <p className="text-muted leading-relaxed">{verificationResult.summary}</p>
        </div>

        {/* Claims Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-ink block">Chi tiết các luận điểm lịch sử:</span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {verificationResult.claims.map((claim, idx) => {
              const isVerified =
                claim.verdict === 'verified' || claim.verdict === 'CORRECT' || claim.verdict === 'ACCURATE';
              const isError =
                claim.verdict === 'error' || claim.verdict === 'INACCURATE' || claim.verdict === 'CRITICAL_ERROR';
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    isVerified
                      ? 'border-status-success-text/30 bg-status-success-bg/20'
                      : isError
                      ? 'border-status-error-text/30 bg-status-error-bg/20'
                      : 'border-status-warning-text/30 bg-status-warning-bg/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-ink flex-1 leading-snug">{claim.claim_text}</p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                        isVerified
                          ? 'text-status-success-text bg-status-success-bg'
                          : isError
                          ? 'text-status-error-text bg-status-error-bg'
                          : 'text-status-warning-text bg-status-warning-bg'
                      }`}
                    >
                      {claim.verdict}
                    </span>
                  </div>
                  {claim.explanation && (
                    <p className="text-[11px] text-muted leading-relaxed">{claim.explanation}</p>
                  )}
                  {claim.source_reference && (
                    <div className="text-[10px] text-accent font-medium flex items-center gap-1 pt-0.5">
                      <BookOpen className="h-3 w-3" />
                      <span>{claim.source_reference}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Revised Script Suggestion */}
        {verificationResult.revised_script && (
          <div className="pt-2 border-t border-border/70 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRevisedScript(!showRevisedScript)}
              className="w-full text-xs justify-between border-accent/40 text-accent hover:bg-accent-soft/30 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Xem kịch bản đề xuất đã chuẩn hóa sử liệu</span>
              </span>
              {showRevisedScript ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            {showRevisedScript && (
              <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs space-y-2">
                <p className="font-sans leading-relaxed text-ink/90 whitespace-pre-line text-[11px]">
                  {verificationResult.revised_script}
                </p>
                {onApplyRevisedScript && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApplyRevisedScript(verificationResult.revised_script!)}
                    className="w-full text-xs h-8 gap-1.5 bg-accent text-canvas hover:bg-accent/90 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Áp dụng kịch bản chuẩn hóa này</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Thumbnail Prompt copy */}
        {verificationResult.thumbnail_prompt && (
          <div className="pt-2 border-t border-border/70 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted block">
              Gợi ý Prompt Ảnh Bìa Podcast (Tỉ lệ 1:1):
            </span>
            <div className="relative p-2.5 rounded-lg bg-surface-subtle border border-border text-[11px] font-mono text-muted pr-16 leading-relaxed">
              <p className="line-clamp-2">{verificationResult.thumbnail_prompt}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(verificationResult.thumbnail_prompt!, 'thumb_prompt_ver')}
                className="absolute right-2 top-2 h-7 px-2 text-[11px] gap-1 cursor-pointer"
              >
                {copiedKey === 'thumb_prompt_ver' ? (
                  <Check className="h-3 w-3 text-status-success-text" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedKey === 'thumb_prompt_ver' ? 'Đã chép' : 'Chép'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 2 & 3: Contextual Historical Source & Scope Panel (Matching Reference Design)
  return (
    <div className="space-y-4">
      {/* Card 1: Phạm vi tư liệu lịch sử */}
      <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-[#1C1917]">Phạm vi tư liệu lịch sử</span>
            <span className="text-xs text-[#A8A29E] cursor-help" title="Hệ thống RAG hỗ trợ chính sử Lý – Trần">
              ⓘ
            </span>
          </div>
        </div>

        {/* 3 Pills in a row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSelectDynasty('all')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDynasty === 'all'
                ? 'bg-accent text-white shadow-2xs'
                : 'border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#FAF8F5]'
            }`}
          >
            Tất cả đề tài (4)
          </button>

          <button
            type="button"
            onClick={() => onSelectDynasty(selectedDynasty === 'ly' ? 'all' : 'ly')}
            title={selectedDynasty === 'ly' ? 'Nhấp để bỏ chọn (chuyển về Tất cả)' : 'Chọn Triều Lý'}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDynasty === 'ly'
                ? 'bg-accent text-white shadow-2xs'
                : 'border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="block leading-tight">Triều Lý</span>
            <span className="text-[10px] font-normal text-[#A8A29E] block">(1009 – 1225)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectDynasty(selectedDynasty === 'tran' ? 'all' : 'tran')}
            title={selectedDynasty === 'tran' ? 'Nhấp để bỏ chọn (chuyển về Tất cả)' : 'Chọn Triều Trần'}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDynasty === 'tran'
                ? 'bg-accent text-white shadow-2xs'
                : 'border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="block leading-tight">Triều Trần</span>
            <span className="text-[10px] font-normal text-[#A8A29E] block">(1225 – 1400)</span>
          </button>
        </div>

        {/* Info notice box */}
        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE7DF] flex items-center gap-2.5 text-xs text-[#78716C] leading-relaxed">
          <Scroll className="h-4 w-4 text-[#A8A29E] shrink-0" />
          <span>
            Sử dụng tư liệu RAG từ <em>Đại Việt Sử Ký Toàn Thư</em> và <em>Khâm Định Việt Sử</em> để tạo nội dung lịch sử đáng tin cậy.
          </span>
        </div>
      </div>

      {/* RAG Processing Indicator */}
      {isProcessing && (
        <div className="p-3 rounded-2xl bg-[#FAF0F1] border border-accent/20 text-xs text-accent flex items-center gap-2.5 animate-pulse shadow-2xs">
          <Sparkles className="h-4 w-4 animate-spin text-accent shrink-0" />
          <span className="font-medium">Đang truy vấn Đại Việt Sử Ký &amp; đối chiếu RAG...</span>
        </div>
      )}

      {/* Card 2: Xem trước tư liệu tham khảo */}
      {activeItem ? (
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs space-y-3.5 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DF]">
            <div className="flex items-center gap-2">
              <span className="text-accent">🔖</span>
              <span className="text-sm font-bold text-[#1C1917]">Xem trước tư liệu tham khảo</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-accent bg-[#FAF0F1] border border-accent/20">
              RAG Verified
            </span>
          </div>

          {/* Dynasty tag & Title */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase">
              {activeItem.dynastyName}
            </span>
            <h3 className="font-serif text-base font-bold text-[#1C1917] leading-snug">
              {activeItem.title}
            </h3>
            <div className="text-xs text-[#78716C] flex items-center gap-2">
              <span>Nhân vật: <strong className="text-[#1C1917]">{activeItem.figure}</strong></span>
              <span>•</span>
              <span>{activeItem.era}</span>
            </div>
          </div>

          {/* Chronicle Excerpt Quote Box */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE7DF] text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#78716C]">
              <strong className="text-[#1C1917]">{activeItem.sourceBook}</strong>
              <span>{activeItem.sourceVolume}</span>
            </div>
            <p className="font-serif italic text-[#292524] text-xs leading-relaxed border-l-2 border-accent pl-3">
              &ldquo;{activeItem.excerpt}&rdquo;
            </p>
          </div>

          {/* Entities & Keywords */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-[#1C1917] block">
              Thực thể &amp; Từ khóa lịch sử:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBE7DF] text-xs text-[#44403C] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Expand Details Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full py-2.5 px-3 rounded-xl border border-[#EBE7DF] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1C1917] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-accent text-sm">⊕</span>
                <span>{showFullDetails ? 'Thu gọn chi tiết tư liệu' : 'Xem chi tiết tư liệu và nguồn tham khảo'}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-[#78716C] transition-transform ${showFullDetails ? 'rotate-180' : ''}`} />
            </button>

            {showFullDetails && (
              <div className="mt-3 pt-3 border-t border-[#EBE7DF] space-y-3 animate-fade-in text-xs">
                <div className="text-[#78716C] leading-relaxed space-y-1">
                  <span className="font-bold text-[#1C1917] block text-xs">Bối cảnh lịch sử chi tiết:</span>
                  <p className="text-xs text-[#44403C]">{activeItem.desc}</p>
                </div>

                {/* Scene Structure Blueprint */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-accent" />
                      <span>Cấu trúc phân cảnh dự kiến</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#78716C]">
                      {storyboardDuration}s ({Math.max(1, Math.round(storyboardDuration / 30))} cảnh)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {Array.from({ length: Math.max(1, Math.round(storyboardDuration / 30)) }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF8F5] border border-[#EBE7DF] text-[#78716C]"
                      >
                        <span className="font-medium text-[#1C1917]">
                          Cảnh {i + 1}: {i === 0 ? 'Bối cảnh khởi sự' : i === 1 ? 'Diễn biến cao trào' : i === 2 ? 'Chiến công hào hùng' : 'Bài học muôn đời'}
                        </span>
                        <span className="font-mono text-xs text-accent font-semibold">~30s</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scope Assurance Note */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF0F1] border border-accent/20 text-xs text-[#1C1917]">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span>Chủ đề nằm trong phạm vi triều đại được bảo trợ bởi RAG Fact-Checker.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty / Compact Info State when no topic is selected */
        <div className="rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-6 text-center space-y-2">
          <Info className="h-5 w-5 text-[#A8A29E] mx-auto" />
          <span className="text-xs font-bold text-[#1C1917] block">Chưa chọn chủ đề lịch sử</span>
          <p className="text-xs text-[#78716C] max-w-xs mx-auto leading-relaxed">
            Nhập đề tài hoặc chọn một chủ đề gợi ý bên trái để tự động tra cứu chính sử Đại Việt Sử Ký Toàn Thư.
          </p>
        </div>
      )}
    </div>
  );
};
