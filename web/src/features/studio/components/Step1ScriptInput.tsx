import React from 'react';
import {
  BookOpen,
  Sparkles,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScriptVerificationResponse } from '@/types/creatorStudio';
import { InputClassificationResult } from '../creatorStudioUtils';

interface Step1ScriptInputProps {
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
}

export const Step1ScriptInput: React.FC<Step1ScriptInputProps> = ({
  scriptTopic,
  setScriptTopic,
  scriptContent,
  setScriptContent,
  storyboardDuration,
  setStoryboardDuration,
  inputClassification,
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
}) => {
  const [showRevisedScript, setShowRevisedScript] = React.useState(false);

  const isInputEmpty = !scriptContent.trim() && !scriptTopic.trim();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Smart Input Form */}
      <div className={`space-y-4 ${verificationResult ? 'lg:col-span-7' : 'lg:col-span-12 max-w-4xl mx-auto w-full'}`}>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-5">
          {/* Header Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-serif text-sm font-bold text-ink">Nội Dung Hoặc Chủ Đề Lịch Sử</h3>
                <p className="text-[11px] text-muted">Nhập tiêu đề ngắn để AI tự viết, hoặc dán kịch bản hoàn chỉnh có sẵn</p>
              </div>
            </div>

            {/* Smart Classification Tag */}
            <div className="flex items-center gap-2 text-xs font-mono">
              {inputClassification.branch === 'BRANCH_B_EXISTING_SCRIPT' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-soft text-accent text-[11px] font-sans font-medium border border-accent/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Nhánh 2: Kịch bản có sẵn ({inputClassification.metrics.length} ký tự)
                </span>
              ) : inputClassification.metrics.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle text-ink text-[11px] font-sans font-medium border border-border">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                  Nhánh 1: Tiêu đề ngắn ({inputClassification.metrics.length} ký tự)
                </span>
              ) : null}

              {wordCount > 0 && (
                <span className="text-muted text-[11px]">
                  {wordCount} từ • ~{estimatedReadingSec}s đọc
                </span>
              )}
            </div>
          </div>

          {/* Title Input (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink flex items-center justify-between">
              <span>Tiêu đề tác phẩm / Chủ đề video</span>
              <span className="text-[11px] text-muted font-normal">Tự động điền nếu để trống</span>
            </label>
            <Input
              type="text"
              placeholder="Ví dụ: Đại lễ dời đô năm 1010 và Khát vọng Thăng Long ngàn năm"
              value={scriptTopic}
              onChange={(e) => setScriptTopic(e.target.value)}
              className="text-xs h-9 bg-surface-subtle/40 border-border"
            />
          </div>

          {/* Main Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1">
                <span>Nội dung kịch bản hoặc Yêu cầu sáng tác</span>
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
                  className="text-[11px] h-6 px-2 text-accent hover:bg-accent-soft"
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
                    className="text-[11px] h-6 px-2 text-muted hover:text-ink"
                  >
                    Xóa trắng
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              rows={8}
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              placeholder="Nhập tiêu đề đề tài (ví dụ: 'Chiến thắng Bạch Đằng 938') hoặc dán toàn văn kịch bản thuyết minh lịch sử tại đây..."
              className="text-xs font-sans leading-relaxed min-h-[180px] bg-surface-subtle/30 border-border focus:border-accent"
            />

            {/* Explanation Helper according to README */}
            <div className="p-3 rounded-lg bg-surface-subtle/60 border border-border/80 text-[11px] text-muted space-y-1">
              <p className="flex items-start gap-1.5">
                <span className="font-semibold text-ink shrink-0">• &lt; 100 ký tự:</span>
                <span>Hệ thống dùng <strong>RAG tra cứu tư liệu sử gốc</strong> + <strong>Gemini AI</strong> tự động biên soạn kịch bản và phân cảnh tương ứng.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="font-semibold text-ink shrink-0">• &gt; 100 ký tự:</span>
                <span>Hệ thống <strong>giữ nguyên 100% kịch bản gốc</strong> của bạn, chỉ tự động phân bổ câu chữ vào các cảnh theo thời lượng.</span>
              </p>
            </div>
          </div>

          {/* Target Duration Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-ink">
              Thời lượng mục tiêu của video
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setStoryboardDuration(dur)}
                  className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                    storyboardDuration === dur
                      ? 'border-accent bg-accent text-canvas font-bold shadow-xs ring-1 ring-accent'
                      : 'border-border bg-surface text-muted hover:text-ink hover:bg-surface-subtle'
                  }`}
                >
                  {dur} giây ({dur / 30} cảnh)
                </button>
              ))}
            </div>
          </div>

          {/* Error Message for Storyboard Generation */}
          {generateStoryboardError && (
            <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-3.5 text-xs text-status-error-text space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Không thể tạo phân cảnh</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {generateStoryboardError.message || 'Lỗi kết nối dịch vụ tạo phân cảnh. Vui lòng kiểm tra lại cấu hình Gemini Key trong phần Cài đặt.'}
              </p>
            </div>
          )}

          {/* Error Message for Script Verification */}
          {verifyScriptError && (
            <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-3.5 text-xs text-status-error-text space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Lỗi thẩm định sử liệu</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {verifyScriptError.message || 'Không thể kết nối đến máy chủ thẩm định RAG.'}
              </p>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVerifyScript}
              disabled={isInputEmpty || isVerifyingScript || isGeneratingStoryboard}
              className="gap-2 text-xs border-border hover:bg-surface-subtle"
            >
              <FileCheck2 className={`h-3.5 w-3.5 text-accent ${isVerifyingScript ? 'animate-spin' : ''}`} />
              <span>{isVerifyingScript ? 'Đang đối chiếu RAG...' : 'Thẩm định sử liệu (RAG AI)'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onGenerateStoryboard}
              disabled={isInputEmpty || isGeneratingStoryboard || isVerifyingScript}
              className="gap-2 text-xs font-semibold px-5 shadow-xs"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingStoryboard ? 'animate-spin' : ''}`} />
              <span>
                {isGeneratingStoryboard
                  ? 'Đang phân tích kịch bản & phân cảnh...'
                  : 'Tiếp tục: Tạo phân cảnh & Lời dẫn (Bước 2)'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Fact-checking Results Panel (Only appears when verificationResult exists) */}
      {verificationResult && (
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
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
                className="font-mono text-xs font-bold"
              >
                {verificationResult.overall_score}/100 Điểm Sử Học
              </Badge>
            </div>

            {/* Summary */}
            <p className="text-xs text-ink leading-relaxed bg-surface-subtle p-3 rounded-lg border border-border">
              {verificationResult.summary}
            </p>

            {/* Claims list */}
            {verificationResult.claims && verificationResult.claims.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  Chi tiết đối chiếu sự kiện ({verificationResult.claims.length}):
                </span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {verificationResult.claims.map((claim, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border bg-surface-subtle/50 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink">{claim.claim_text || (claim as { claim?: string }).claim}</span>
                        <Badge
                          variant={
                            claim.verdict === 'verified' || claim.verdict === 'CORRECT' || claim.verdict === 'ACCURATE'
                              ? 'success'
                              : claim.verdict === 'unverified' || claim.verdict === 'needs_revision' || claim.verdict === 'NEEDS_REVISION'
                              ? 'pending'
                              : 'error'
                          }
                          size="sm"
                        >
                          {claim.verdict}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-muted leading-relaxed">
                        {claim.explanation}
                      </p>

                      {claim.source_reference && (
                        <div className="text-[10px] text-accent font-medium flex items-center gap-1 pt-0.5">
                          <BookOpen className="h-3 w-3" />
                          <span>{claim.source_reference}</span>
                        </div>
                      )}

                      {claim.suggested_fix && (
                        <div className="p-2 rounded bg-surface border border-border text-[11px] text-ink">
                          <strong className="text-accent">Sửa đổi đề xuất: </strong>
                          {claim.suggested_fix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revised Script action */}
            {verificationResult.revised_script && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    <span>Bản kịch bản chuẩn hóa</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRevisedScript(!showRevisedScript)}
                    className="text-[11px] h-6 px-2 text-accent"
                  >
                    {showRevisedScript ? (
                      <span className="flex items-center gap-1">Thu gọn <ChevronUp className="h-3 w-3" /></span>
                    ) : (
                      <span className="flex items-center gap-1">Xem trước <ChevronDown className="h-3 w-3" /></span>
                    )}
                  </Button>
                </div>

                {showRevisedScript && (
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap font-sans">
                    {verificationResult.revised_script}
                  </div>
                )}

                <Button
                  size="sm"
                  type="button"
                  onClick={() => onApplyRevisedScript(verificationResult.revised_script!)}
                  className="w-full text-xs gap-1.5 bg-accent-soft text-accent hover:bg-accent hover:text-canvas border border-accent/30"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Áp dụng bản sửa đổi này vào kịch bản</span>
                </Button>
              </div>
            )}

            {/* Thumbnail Prompt copy */}
            {verificationResult.thumbnail_prompt && (
              <div className="pt-2 border-t border-border space-y-1.5">
                <span className="text-[11px] font-semibold text-muted block">
                  Gợi ý Prompt Ảnh Bìa Podcast (Tỉ lệ 1:1):
                </span>
                <div className="relative p-2.5 rounded-lg bg-surface-subtle border border-border text-[11px] font-mono text-muted pr-16 leading-relaxed">
                  <p className="line-clamp-2">{verificationResult.thumbnail_prompt}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopy(verificationResult.thumbnail_prompt!, 'thumb_prompt_ver')}
                    className="absolute right-2 top-2 h-7 px-2 text-[11px] gap-1"
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
        </div>
      )}
    </div>
  );
};
