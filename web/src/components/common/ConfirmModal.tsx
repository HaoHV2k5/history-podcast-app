import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'destructive';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  quickReasons?: string[];
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Nhập lý do cụ thể...',
  quickReasons,
  isLoading = false,
}: ConfirmModalProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('Vui lòng nhập lý do trước khi tiếp tục');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-ink-muted">
              Lý do xem xét <span className="text-accent">*</span>
            </label>
            {quickReasons && quickReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {quickReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => {
                      setReason(qr);
                      setError('');
                    }}
                    className="rounded border border-border bg-surface-subtle px-2 py-1 text-[11px] text-muted hover:border-accent hover:text-accent transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              placeholder={reasonPlaceholder}
              error={!!error}
              rows={3}
            />
            {error && <p className="text-xs text-status-error-text">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="min-h-[44px]">
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            isLoading={isLoading}
            className="min-h-[44px]"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
