import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  X,
  RotateCcw,
  CheckCircle2,
  Info,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  PolicyCardDraft,
  getTierThemeMeta,
  resolveActionTriggerLabel,
  formatScoreValue,
} from '../policiesLogic';

interface AdminPolicyInfoModalProps {
  open: boolean;
  onClose: () => void;
  drafts: PolicyCardDraft[];
  onResetDefaults: () => Promise<void>;
  isResetting: boolean;
}

export const AdminPolicyInfoModal: React.FC<AdminPolicyInfoModalProps> = ({
  open,
  onClose,
  drafts,
  onResetDefaults,
  isResetting,
}) => {
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmingReset(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResetting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isResetting, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handleConfirmReset = async () => {
    await onResetDefaults();
    setConfirmingReset(false);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-info-modal-title"
    >
      {/* Full-viewport Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-[2px] transition-opacity duration-200 ease-out"
        onClick={() => {
          if (!isResetting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#EAE4DC] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#F0EBE6] bg-[#FAF8F5] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-10 w-10 rounded-full bg-white border border-[#F2E2E2] shadow-2xs flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-[#991B1B]" />
            </div>
            <div className="min-w-0">
              <h2
                id="policy-info-modal-title"
                className="text-base sm:text-[17px] font-bold text-stone-900 leading-snug"
              >
                Phạm vi Cấu hình & Quy chuẩn AI Shield
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Cơ chế phân tầng kiểm duyệt sử liệu tự động và tiêu chuẩn vận hành hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            aria-label="Đóng cửa sổ thông tin"
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-stone-600 leading-relaxed">
          {/* Scope explanation */}
          <div className="rounded-xl border border-[#EAE4DC] bg-[#F7F4F0] p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-[13px]">
              <Info className="h-4 w-4 text-[#991B1B] shrink-0" />
              <span>Nguyên tắc vận hành AI Shield</span>
            </div>
            <p className="text-stone-600">
              Hệ thống <strong>AI Shield</strong> bóc tách nội dung âm thanh/văn bản qua{' '}
              <strong>MarkItDown</strong> và đối chiếu ngữ nghĩa với kho sử liệu chuẩn qua{' '}
              <strong>RAG Embedding</strong> để chấm điểm độ tin cậy từ{' '}
              <span className="font-semibold tabular-nums">0%</span> đến{' '}
              <span className="font-semibold tabular-nums">100%</span>.
            </p>
          </div>

          {/* Current Active Tiers Summary */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-stone-800">
              Bảng tóm tắt 4 phân tầng hiện hành
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {drafts.map((item) => {
                const theme = getTierThemeMeta(item.tier);
                return (
                  <div
                    key={item.tier}
                    className={cn(
                      'rounded-xl border border-[#EFEAE4] p-3 flex flex-col justify-between gap-1.5',
                      theme.headerBg
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('font-bold text-xs truncate', theme.titleColorClass)}>
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-bold tabular-nums shrink-0',
                          theme.rangePillClass
                        )}
                      >
                        {formatScoreValue(item.minScore)}% - {formatScoreValue(item.maxScore)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="truncate">
                        {resolveActionTriggerLabel(item.actionType)}
                      </span>
                      <span className="font-medium shrink-0">
                        {item.isActive ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset Defaults Section */}
          <div className="rounded-xl border border-[#EAE4DC] bg-stone-50/70 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-stone-900">
                  Khôi phục ngưỡng chuẩn mặc định
                </h4>
                <p className="text-[11.5px] text-stone-500">
                  Đặt lại cả 4 phân tầng về ngưỡng chuẩn ban đầu (0–50%, 50–80%, 80–90%, 90–100%) và kích hoạt toàn bộ phân tầng.
                </p>
              </div>
              {!confirmingReset && (
                <button
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.97] transition-all shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
                  <span>Đặt lại mặc định</span>
                </button>
              )}
            </div>

            {confirmingReset && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Xác nhận khôi phục toàn bộ 4 phân tầng về mặc định?</span>
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setConfirmingReset(false)}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleConfirmReset}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7F1D1D] active:scale-[0.97] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang khôi phục...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Đồng ý khôi phục</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-[#F0EBE6] bg-[#FAF8F5] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="inline-flex items-center justify-center rounded-xl bg-[#991B1B] px-4 py-2 min-h-[38px] text-xs font-semibold text-white hover:bg-[#7F1D1D] active:scale-[0.97] transition-all cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

