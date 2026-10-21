import React from 'react';
import { AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisputeItem, DisputeResult } from '@/types/dispute';
import { formatDisputeResult } from './disputeResolutionLogic';

interface DisputeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  dispute: DisputeItem;
  selectedResult: DisputeResult;
  splitPercent?: number;
  resolutionNote: string;
  errorMessage?: string | null;
}

export const DisputeConfirmationModal: React.FC<DisputeConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  dispute,
  selectedResult,
  splitPercent,
  resolutionNote,
  errorMessage,
}) => {
  const resultInfo = formatDisputeResult(selectedResult);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent maxWidth="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-error-bg text-status-error-text">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-serif font-bold text-ink">
                Xác nhận Phân xử Tranh chấp
              </DialogTitle>
              <DialogDescription className="text-xs text-muted">
                Khiếu nại #{dispute.id} • Hợp đồng #{dispute.contractId}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Critical Financial Safety Warning */}
          <div className="flex items-start gap-2.5 rounded-lg border border-status-pending-text/30 bg-status-pending-bg/40 p-3 text-status-pending-text leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-status-pending-text" />
            <div>
              <p className="font-semibold text-[11px] uppercase tracking-wider">
                Cảnh báo an toàn tài chính:
              </p>
              <p className="mt-0.5 text-xs">
                Quyết định này có thể thay đổi số dư ví và trạng thái tiền ký quỹ.
                Thao tác phân xử tài chính không thể hoàn tác sau khi hệ thống ghi nhận giao dịch ví.
                Vui lòng kiểm tra kỹ trước khi xác nhận.
              </p>
            </div>
          </div>

          {/* Decision Summary */}
          <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted font-semibold uppercase">Quyết định:</span>
              <Badge variant={resultInfo.variant as 'success' | 'pending' | 'accent' | 'default' | 'outline'}>
                {resultInfo.label}
              </Badge>
            </div>

            {selectedResult === 'SPLIT' && splitPercent !== undefined && (
              <div className="flex items-center justify-between font-mono">
                <span className="text-[11px] text-muted">Tỷ lệ phân chia:</span>
                <span className="font-semibold text-ink">
                  Thuyết minh {splitPercent}% / Nhà sáng tạo {100 - splitPercent}%
                </span>
              </div>
            )}

            <div className="space-y-1 pt-1 border-t border-border">
              <span className="text-[11px] text-muted font-semibold uppercase block">
                Căn cứ & Ghi chú phân xử:
              </span>
              <p className="text-ink bg-surface p-2.5 rounded border border-border leading-relaxed whitespace-pre-line text-xs font-sans">
                {resolutionNote}
              </p>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-3 text-xs text-status-error-text">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="text-xs min-h-[40px] px-4"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="text-xs min-h-[40px] px-5 bg-accent hover:bg-accent-hover text-white shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span>Đang xử lý phân xử...</span>
                </>
              ) : (
                <span>Xác nhận phân xử</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
