import React from 'react';
import {
  ShieldAlert,
  AlertCircle,
  Sparkles,
  Plus,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';

interface StudioScopeErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeError: Error | null;
  onSelectHistoricalTopic: (topic: HistoricalTopicItem) => void;
  onOpenSettings?: () => void;
}

export const StudioScopeErrorDialog: React.FC<StudioScopeErrorDialogProps> = ({
  isOpen,
  onClose,
  activeError,
  onSelectHistoricalTopic,
  onOpenSettings,
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

  const cleanMessage = rawErrorMessage
    .replace(/^Lỗi tạo kịch bản:\s*/i, '')
    .replace(/^Lỗi thẩm định kịch bản:\s*/i, '')
    .replace(/^⚠️\s*/, '')
    .trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-xl" className="p-0 overflow-hidden border-border bg-surface shadow-modal rounded-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-b from-status-error-bg/70 via-status-error-bg/30 to-surface p-6 pb-4 border-b border-border/80">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-status-error-bg border border-status-error-text/30 text-status-error-text shrink-0 shadow-xs mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-serif text-base font-bold text-ink">
                  {isScopeError ? 'Chủ Đề Nằm Ngoài Kho Sử Liệu Lý - Trần' : 'Thông Báo Từ Máy Chủ AI Sử Ký'}
                </DialogTitle>
                <Badge variant="error" size="sm" className="font-sans font-medium text-[10px]">
                  {isScopeError ? 'ScopeGate RAG' : 'Cần kiểm tra lại'}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted leading-relaxed">
                {isScopeError
                  ? 'Kho tư liệu số hóa RAG hiện chuyên sâu cho các sự kiện thuộc triều đại Nhà Lý (1009 – 1225) và Nhà Trần (1225 – 1400) để đảm bảo độ chính xác sử học tuyệt đối.'
                  : 'Yêu cầu không thể hoàn tất do dữ liệu kịch bản hoặc cấu hình chưa phù hợp.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Feedback Callout */}
          <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border text-xs text-ink/90 space-y-1.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-status-error-text" />
              <span>Phản hồi chi tiết từ AI Fact-Checker:</span>
            </div>
            <p className="text-xs font-sans leading-relaxed text-ink pl-5 whitespace-pre-line select-text">
              {cleanMessage || 'Đã xảy ra lỗi kết nối dịch vụ. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.'}
            </p>
          </div>

          {/* Scope Suggestions (1-Click Recovery) */}
          {isScopeError && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>Gợi ý chủ đề chuẩn sử liệu Lý - Trần (1-chạm áp dụng ngay):</span>
                </span>
                <span className="text-[10px] text-accent font-medium">Tự động điền đề tài mẫu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HISTORICAL_SCOPE_SUGGESTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectHistoricalTopic(item)}
                    className="p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-accent/5 transition-all text-left group flex items-start gap-2.5 cursor-pointer shadow-2xs"
                  >
                    <span className="flex h-5 w-5 rounded-md bg-accent/10 text-accent items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-canvas transition-colors">
                      <Plus className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-ink truncate group-hover:text-accent transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted shrink-0">{item.era}</span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-surface-subtle/50 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-muted">
            Chạm hoặc nhấn ra ngoài màn hình để đóng thông báo
          </span>

          <div className="flex items-center gap-2">
            {onOpenSettings && isKeyError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="text-xs h-8 gap-1.5 border-border cursor-pointer"
              >
                <Key className="h-3.5 w-3.5 text-accent" />
                <span>Cài đặt Gemini Key</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-4 font-medium border-border hover:bg-surface cursor-pointer"
            >
              Đã hiểu & Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
