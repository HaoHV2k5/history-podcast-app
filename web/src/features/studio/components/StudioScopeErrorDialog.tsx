import React from 'react';
import {
  Landmark,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Edit3,
  Key,
  ShieldAlert,
  Clock,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';

export interface ScopeErrorItem {
  wrong: string;
  correct: string;
  explanation: string;
}

export interface ParsedScopeInfo {
  topic: string;
  reason: string;
  errors: ScopeErrorItem[];
  suggestedText: string;
}

interface StudioScopeErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeError: Error | null;
  onSelectHistoricalTopic: (topic: HistoricalTopicItem) => void;
  onOpenSettings?: () => void;
  onEditTopic?: () => void;
  onRetry?: () => void;
  onApplyCorrection?: (correctedText: string, errors: ScopeErrorItem[]) => void;
}

function parseScopeError(rawMessage: string): ParsedScopeInfo {
  let topic = '';
  let reason = '';
  const errors: ScopeErrorItem[] = [];
  let suggestedText = '';

  // 1. Extract Topic: Đề tài: "..." or Đề tài: ...
  const topicMatch =
    rawMessage.match(/Đề tài:\s*["“']?([^"”]+?)["”']?\n\s*Lý do:/i) ||
    rawMessage.match(/Đề tài:\s*["“']?([^"”'\n]+)["”']?/i);
  if (topicMatch && topicMatch[1]) {
    topic = topicMatch[1].trim();
  }

  // 2. Extract Reason: Lý do: ...
  const reasonMatch = rawMessage.match(
    /Lý do:\s*([^]+?)(?=\s*(?:Chi tiết các điểm cần hiệu đính|Bản đính chính đề xuất|Hệ thống hiện được giới hạn|Mọi thời kỳ lịch sử|CHỈ TẠO VIDEO|Mọi thời kỳ|$))/i
  );
  if (reasonMatch && reasonMatch[1]) {
    reason = reasonMatch[1].trim();
  }

  // 3. Extract Structured Errors: - ❌ Sai: "..." ➔  Đúng: "..." (giải thích)
  const errorRegex = /[-*•]?\s*❌\s*Sai:\s*["“']?([^"”'\n]+)["”']?\s*➔\s*Đúng:\s*["“']?([^"”'\n]+)["”']?(?:\s*\(([^)]+)\))?/gi;
  let errorMatch;
  while ((errorMatch = errorRegex.exec(rawMessage)) !== null) {
    errors.push({
      wrong: errorMatch[1].trim(),
      correct: errorMatch[2].trim(),
      explanation: errorMatch[3]?.trim() || '',
    });
  }

  // 4. Extract Suggested Text: Bản đính chính đề xuất: ...
  const suggestedMatch = rawMessage.match(
    /Bản đính chính đề xuất:\s*([^]+?)(?=\s*(?:Hệ thống hiện được giới hạn|Mọi thời kỳ lịch sử|CHỈ TẠO VIDEO|Mọi thời kỳ|$))/i
  );
  if (suggestedMatch && suggestedMatch[1]) {
    suggestedText = suggestedMatch[1].trim();
  }

  // 5. Fallback Reason: If reason not found by "Lý do:", clean boilerplate
  if (!reason) {
    const cleaned = rawMessage
      .replace(/^[⚠️\s]*(?:Lỗi tạo kịch bản|Lỗi thẩm định kịch bản)?[:\s]*/i, '')
      .replace(/CHỦ ĐỀ BỊ TỪ CHỐI[^\n]*[:\n]*/i, '')
      .replace(/Hệ thống hiện được giới hạn[^]*$/i, '')
      .replace(/Mọi thời kỳ lịch sử[^]*$/i, '')
      .replace(/Đề tài:\s*["“']?[^"”'\n]+["”']?/i, '')
      .trim();
    if (cleaned) {
      reason = cleaned;
    }
  }

  // 6. Smart Heuristic Fallback for Single / Multiple Errors in Plain Text Reason
  // Ví dụ: "Năm dời đô của vua Lý Công Uẩn là 1010 chứ không phải 1012 như trong văn bản."
  if (errors.length === 0 && reason) {
    const pattern1 = /(?:năm|thời điểm|nhân vật|sự kiện)?\s*là\s+([0-9a-zA-ZÀ-ỹ\s]+?)\s+chứ không phải\s+([0-9a-zA-ZÀ-ỹ\s]+?)(?:\s+(?:như|trong|ở)|\.|$)/i;
    const m1 = reason.match(pattern1);
    if (m1) {
      const correct = m1[1].trim();
      const wrong = m1[2].trim();
      errors.push({
        wrong,
        correct,
        explanation: reason,
      });
      if (!suggestedText && topic && topic.includes(wrong)) {
        suggestedText = topic.split(wrong).join(correct);
      }
    } else {
      const pattern2 = /không phải\s+([0-9a-zA-ZÀ-ỹ\s]+?)\s+mà là\s+([0-9a-zA-ZÀ-ỹ\s]+?)(?:\s+(?:như|trong|ở)|\.|$)/i;
      const m2 = reason.match(pattern2);
      if (m2) {
        const wrong = m2[1].trim();
        const correct = m2[2].trim();
        errors.push({
          wrong,
          correct,
          explanation: reason,
        });
        if (!suggestedText && topic && topic.includes(wrong)) {
          suggestedText = topic.split(wrong).join(correct);
        }
      }
    }
  }

  // If we have errors and topic, but no suggestedText, apply all error replacements to topic
  if (!suggestedText && topic && errors.length > 0) {
    let corrected = topic;
    for (const err of errors) {
      if (err.wrong && err.correct && corrected.includes(err.wrong)) {
        corrected = corrected.split(err.wrong).join(err.correct);
      }
    }
    if (corrected !== topic) {
      suggestedText = corrected;
    }
  }

  return { topic, reason, errors, suggestedText };
}

export const StudioScopeErrorDialog: React.FC<StudioScopeErrorDialogProps> = ({
  isOpen,
  onClose,
  activeError,
  onSelectHistoricalTopic,
  onOpenSettings,
  onEditTopic,
  onRetry,
  onApplyCorrection,
}) => {
  const rawErrorMessage =
    (activeError as unknown as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    activeError?.message ||
    '';

  const isScopeError =
    rawErrorMessage.includes('LÝ - TRẦN') ||
    rawErrorMessage.includes('Lý - Trần') ||
    rawErrorMessage.includes('ngoài phạm vi') ||
    rawErrorMessage.includes('OutOfScope') ||
    rawErrorMessage.includes('CHỦ ĐỀ BỊ TỪ CHỐI');

  const isKeyError =
    rawErrorMessage.includes('Gemini API Key') ||
    rawErrorMessage.includes('API Key') ||
    rawErrorMessage.includes('Cài đặt');

  const isTimeoutError =
    rawErrorMessage.toLowerCase().includes('timeout') ||
    rawErrorMessage.toLowerCase().includes('timed out') ||
    rawErrorMessage.toLowerCase().includes('exceeded');

  const isNetworkError =
    rawErrorMessage.includes('Network Error') ||
    rawErrorMessage.includes('Failed to fetch') ||
    rawErrorMessage.includes('ECONNREFUSED');

  const parsedScope = parseScopeError(rawErrorMessage);

  const cleanMessage = rawErrorMessage
    .replace(/^Lỗi tạo kịch bản:\s*/i, '')
    .replace(/^Lỗi thẩm định kịch bản:\s*/i, '')
    .replace(/^⚠️\s*/, '')
    .trim();

  // Friendly human message
  let displayMessage = cleanMessage;
  if (isTimeoutError) {
    displayMessage =
      'Quá thời gian chờ phản hồi từ máy chủ AI (Request Timeout). Quá trình đối chiếu tài liệu lịch sử RAG và khởi tạo phân cảnh kịch bản đang mất nhiều thời gian do khối lượng dữ liệu lớn. Bạn có thể bấm "Thử lại ngay" để hệ thống tiếp tục xử lý.';
  } else if (isNetworkError) {
    displayMessage =
      'Không thể kết nối đến máy chủ backend (Network Error). Vui lòng kiểm tra lại dịch vụ máy chủ hoặc đường truyền mạng của bạn.';
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-2xl" className="p-0 overflow-hidden border-[#E7E2D8] bg-[#FDFBF7] shadow-apple-dialog rounded-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-b from-[#FAF5EC] via-[#FAF5EC]/70 to-transparent p-5 sm:p-6 pb-4 border-b border-[#EFEBE4]">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 shadow-2xs mt-0.5 border ${
                isScopeError
                  ? 'bg-[#F5ECE0] border-[#E8DCBF] text-[#8C521E]'
                  : isTimeoutError
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]'
                  : 'bg-status-error-bg border-status-error-text/30 text-status-error-text'
              }`}
            >
              {isScopeError ? (
                <Landmark className="h-5 w-5" />
              ) : isTimeoutError ? (
                <Clock className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-serif text-base sm:text-lg font-bold text-ink tracking-tight">
                  {isScopeError
                    ? 'Chủ Đề Chưa Thuộc Kho Sử Liệu Lý – Trần'
                    : isTimeoutError
                    ? 'Thời Gian Phản Hồi Quá Lâu (Timeout)'
                    : isNetworkError
                    ? 'Lỗi Kết Nối Máy Chủ'
                    : 'Thông Báo Từ Máy Chủ AI Sử Ký'}
                </DialogTitle>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                    isScopeError
                      ? 'bg-[#EFE9DF] text-[#786F66] border border-[#E0D7CA]'
                      : isTimeoutError
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                      : 'bg-status-error-bg text-status-error-text border border-status-error-text/30'
                  }`}
                >
                  {isScopeError
                    ? 'Chính Sử 1009 – 1400'
                    : isTimeoutError
                    ? 'Quá thời gian chờ'
                    : 'Cần kiểm tra lại'}
                </span>
              </div>
              <DialogDescription className="text-xs text-[#78716C] leading-relaxed">
                {isScopeError
                  ? 'Kho tư liệu số hóa AI hiện chuyên sâu cho hai triều đại hoàng kim: Nhà Lý (1009 – 1225) và Nhà Trần (1225 – 1400) để đảm bảo độ chuẩn xác sử học tuyệt đối.'
                  : isTimeoutError
                  ? 'Quá trình phân tích chuyên sâu qua kho sử liệu lớn đang tốn nhiều thời gian hơn dự kiến.'
                  : 'Yêu cầu không thể hoàn tất do dữ liệu kịch bản hoặc cấu hình chưa phù hợp.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Reason Callout: Concise & Focused */}
          {isScopeError ? (
            <div className="rounded-xl border border-[#EADBCA] bg-white p-3.5 sm:p-4 space-y-3 text-xs shadow-2xs">
              {parsedScope.topic && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8C6D46] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-[#B45309]" />
                    Đề tài bạn đã nhập:
                  </span>
                  <div className="p-2.5 rounded-lg bg-[#FAF6F0] border border-[#E7E0D3] text-ink font-serif text-xs leading-relaxed max-h-24 overflow-y-auto">
                    &ldquo;{parsedScope.topic}&rdquo;
                  </div>
                </div>
              )}

              {parsedScope.reason && (
                <div className="text-xs text-[#574E43] leading-relaxed font-sans">
                  <span className="font-semibold text-ink/90">Lý do: </span>
                  <span>{parsedScope.reason}</span>
                </div>
              )}

              {/* Chi tiết các điểm cần hiệu đính (nếu có 1 hoặc nhiều lỗi) */}
              {parsedScope.errors.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-[#F2ECE1]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-ink flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-accent" />
                      <span>Các điểm cần sửa đổi theo chính sử ({parsedScope.errors.length}):</span>
                    </span>
                    <span className="text-[10px] text-[#A8A29E] font-sans">Đối chiếu chính sử</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {parsedScope.errors.map((err, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-[#F0E6D8] bg-[#FAF8F5] space-y-1 shadow-2xs">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 line-through font-serif font-medium">
                            {err.wrong}
                          </span>
                          <span className="text-[#A8A29E] font-sans text-xs">➔</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-serif font-bold">
                            {err.correct}
                          </span>
                        </div>
                        {err.explanation && err.explanation !== parsedScope.reason && (
                          <p className="text-[11px] text-[#696660] font-sans leading-relaxed">
                            {err.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bản đính chính đề xuất */}
              {parsedScope.suggestedText && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5 shadow-2xs pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Bản đính chính chuẩn sử liệu đề xuất:</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-medium">
                      Đã sửa chuẩn 100%
                    </span>
                  </div>
                  <p className="text-xs text-[#262522] font-serif leading-relaxed italic bg-white/90 p-2.5 rounded-lg border border-emerald-100 max-h-32 overflow-y-auto">
                    &ldquo;{parsedScope.suggestedText}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 shadow-2xs ${
                isTimeoutError
                  ? 'bg-[#FFFDF7] border-[#FDE68A] text-[#78350F]'
                  : 'bg-surface-subtle/70 border-border/70 text-ink/90'
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#8C6D46]">
                <AlertCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>
                  {isTimeoutError ? 'Nguyên nhân kỹ thuật:' : 'Phản hồi chi tiết từ hệ thống:'}
                </span>
              </div>
              <p className="text-xs font-sans leading-relaxed text-[#574E43] pl-5 select-text">
                {displayMessage || 'Đã xảy ra lỗi kết nối dịch vụ. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.'}
              </p>
            </div>
          )}

          {/* Scope Suggestions (1-Click Actionable Cards) */}
          {isScopeError && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-ink flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>Hoặc chọn 1 đề tài mẫu chuẩn sử liệu để tiếp tục ngay:</span>
                </span>
                <span className="text-[11px] text-accent font-medium hidden sm:inline">
                  1-chạm tự động điền kịch bản
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HISTORICAL_SCOPE_SUGGESTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectHistoricalTopic(item)}
                    className="p-3.5 rounded-xl border border-[#E7E2D8] bg-white hover:border-accent hover:bg-[#FAF7F5] transition-all text-left group flex flex-col justify-between cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                  >
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.dynasty === 'ly'
                              ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                              : 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]'
                          }`}
                        >
                          {item.dynasty === 'ly' ? 'Triều Lý' : 'Triều Trần'}
                        </span>
                        <span className="text-[10px] font-mono text-[#8C827A]">{item.era}</span>
                      </div>

                      <div className="font-serif font-bold text-xs sm:text-sm text-ink group-hover:text-accent transition-colors">
                        {item.shortTitle || item.title}
                      </div>

                      <p className="text-[11px] text-[#78716C] line-clamp-2 leading-relaxed">
                        <strong className="text-ink/80 font-medium">{item.figure}: </strong>
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#F2EDE4] w-full flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-muted">{item.suggestedDuration}s • Kịch bản mẫu</span>
                      <span className="font-semibold text-accent inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Áp dụng</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-[#FAF8F5]/80 border-t border-[#EFEBE4] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          {isScopeError && (parsedScope.suggestedText || parsedScope.errors.length > 0) ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose();
                  onApplyCorrection?.(parsedScope.suggestedText, parsedScope.errors);
                }}
                className="w-full sm:w-auto text-xs h-9 px-4 font-bold bg-accent text-white hover:bg-accent-hover rounded-xl cursor-pointer active:scale-[0.98] transition-transform gap-1.5 shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Áp dụng bản đính chính vào ô nhập</span>
              </Button>

              {onEditTopic && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEditTopic();
                  }}
                  className="w-full sm:w-auto text-xs h-9 px-3 font-medium border-[#D6D3D1] hover:bg-white text-ink rounded-xl cursor-pointer active:scale-[0.98] transition-transform gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5 text-[#78716C]" />
                  <span>Tự chỉnh sửa bằng tay</span>
                </Button>
              )}
            </div>
          ) : isScopeError && onEditTopic ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEditTopic();
              }}
              className="w-full sm:w-auto text-xs h-9 px-4 font-medium border-[#D6D3D1] hover:bg-white text-ink rounded-xl cursor-pointer active:scale-[0.98] transition-transform gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5 text-accent" />
              <span>Chỉnh sửa lại đề tài của tôi</span>
            </Button>
          ) : onRetry && (isTimeoutError || isNetworkError) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="w-full sm:w-auto text-xs h-9 px-4 font-bold bg-accent text-white hover:bg-accent-hover rounded-xl cursor-pointer active:scale-[0.98] transition-transform gap-1.5 shadow-2xs"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Thử lại ngay</span>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenSettings && isKeyError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="text-xs h-9 gap-1.5 border-accent/40 text-accent hover:bg-accent/5 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Cài đặt Gemini Key</span>
              </Button>
            )}
            <Button
              type="button"
              variant={isScopeError ? 'ghost' : 'outline'}
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-5 font-medium text-muted hover:text-ink hover:bg-white/80 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
