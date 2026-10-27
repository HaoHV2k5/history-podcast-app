import React from 'react';
import {
  ImagePlus,
  Mic,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export type StepTransitionModalState =
  | {
      type: 'step1_empty_input';
      title: string;
      description: string;
    }
  | {
      type: 'step1_not_generated';
      title: string;
      description: string;
    }
  | {
      type: 'step2_missing_cover';
      title: string;
      description: string;
      targetTab: 'voices' | 'render';
    }
  | {
      type: 'step2_missing_scenes';
      title: string;
      description: string;
      uploadedCount: number;
      totalScenes: number;
      targetTab: 'voices' | 'render';
    }
  | {
      type: 'step3_unselected_voice';
      title: string;
      description: string;
      targetTab: 'render';
    }
  | {
      type: 'step4_incomplete_render';
      title: string;
      missingItems: string[];
    }
  | null;

interface StepTransitionConfirmationDialogProps {
  modalState: StepTransitionModalState;
  onClose: () => void;
  onConfirmContinue: () => void;
}

export const StepTransitionConfirmationDialog: React.FC<StepTransitionConfirmationDialogProps> = ({
  modalState,
  onClose,
  onConfirmContinue,
}) => {
  if (!modalState) return null;

  const isBypassable =
    modalState.type === 'step2_missing_cover' ||
    modalState.type === 'step2_missing_scenes' ||
    modalState.type === 'step3_unselected_voice';

  return (
    <Dialog open={Boolean(modalState)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-md" className="p-0 overflow-hidden border-border/80 bg-white/95 backdrop-blur-2xl shadow-apple-dialog rounded-2xl">
        {/* Header Ribbon with Distinct Atelier Tone */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-gradient-to-b from-[#FAF8F5]/90 to-white/60 flex items-start gap-3.5">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform ${
              isBypassable
                ? 'bg-[#FAF0F1] text-accent border-accent/25'
                : 'bg-status-warning-bg text-status-warning-text border-status-warning-text/25'
            }`}
          >
            {modalState.type === 'step1_empty_input' || modalState.type === 'step1_not_generated' ? (
              <ShieldAlert className="h-5 w-5" />
            ) : modalState.type === 'step2_missing_cover' || modalState.type === 'step2_missing_scenes' ? (
              <ImagePlus className="h-5 w-5" />
            ) : modalState.type === 'step3_unselected_voice' ? (
              <Mic className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                  isBypassable
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'bg-status-warning-bg text-status-warning-text border border-status-warning-text/30'
                }`}
              >
                {isBypassable ? 'Tùy chọn • Có thể bỏ qua' : 'Bước bắt buộc'}
              </span>
              {modalState.type === 'step2_missing_scenes' && (
                <span className="text-[11px] font-mono text-muted">
                  ({modalState.uploadedCount}/{modalState.totalScenes} ảnh)
                </span>
              )}
            </div>

            <DialogTitle className="font-serif text-base sm:text-lg font-bold text-ink leading-snug tracking-tight">
              {modalState.title}
            </DialogTitle>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {'description' in modalState && (
            <DialogDescription className="text-xs text-muted leading-relaxed font-sans">
              {modalState.description}
            </DialogDescription>
          )}

          {/* Missing items list for Step 4 */}
          {modalState.type === 'step4_incomplete_render' && (
            <div className="space-y-2 p-3.5 rounded-xl border border-status-warning-text/30 bg-status-warning-bg/40 text-xs">
              <span className="font-bold text-ink block">Các mục cần hoàn thành:</span>
              <ul className="space-y-1.5 text-status-warning-text">
                {modalState.missingItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-warning-text shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Helpful context card for bypassable steps */}
          {isBypassable && (
            <div className="p-3.5 rounded-xl bg-[#FAF8F5]/90 border border-border/60 flex items-start gap-2.5 text-[11px] text-[#696660] leading-relaxed shadow-xs">
              <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                {modalState.type === 'step3_unselected_voice' ? (
                  <>
                    Hệ thống sẽ tự động dùng giọng mặc định <strong>Nam Minh (Miền Bắc)</strong>. Bạn có thể thay đổi lại bất cứ lúc nào trước khi kết xuất.
                  </>
                ) : (
                  <>
                    Bạn có thể hoàn thiện ảnh ở <strong>Bước 4</strong> trước khi bấm nút kết xuất video cuối cùng.
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons with Apple tactile active:scale-[0.98] */}
        <div className="p-4 sm:p-5 pt-3 border-t border-border/60 bg-[#FAF8F5]/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          {isBypassable ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto text-xs h-9 px-4 rounded-xl border-border/80 hover:bg-white text-muted hover:text-ink cursor-pointer transition-all duration-150 active:scale-[0.98]"
              >
                {modalState.type === 'step3_unselected_voice'
                  ? 'Ở lại chọn giọng đọc'
                  : 'Ở lại tải ảnh'}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose();
                  onConfirmContinue();
                }}
                className="w-full sm:w-auto text-xs h-9 px-5 rounded-xl font-bold gap-1.5 bg-accent text-white hover:bg-accent/90 shadow-2xs cursor-pointer transition-all duration-150 active:scale-[0.98]"
              >
                <span>
                  {modalState.type === 'step3_unselected_voice'
                    ? 'Dùng giọng mặc định & Tiếp tục'
                    : 'Bỏ qua & Sang Bước 3'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs h-9 px-6 rounded-xl font-bold bg-accent text-white hover:bg-accent/90 cursor-pointer transition-all duration-150 active:scale-[0.98]"
            >
              <span>Đã hiểu, tôi sẽ hoàn thiện</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
