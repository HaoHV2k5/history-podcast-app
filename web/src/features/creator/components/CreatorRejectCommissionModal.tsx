import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { commissionsApi } from '@/services/api/commissions';
import { CommissionItem } from '@/types/commission';

interface CreatorRejectCommissionModalProps {
  commission: CommissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorRejectCommissionModal: React.FC<CreatorRejectCommissionModalProps> = ({
  commission,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!commission) throw new Error('Không có đơn được chọn');
      return commissionsApi.rejectCommission(commission.id, {
        rejectionReason: rejectionReason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-commissions-received'] });
      queryClient.invalidateQueries({ queryKey: ['creator-commissions-me'] });
      setRejectionReason('');
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi từ chối đơn.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối để khán giả hiểu nguyên nhân.');
      return;
    }
    setError(null);
    rejectMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-stone-200/90 shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-accent mb-1 border border-rose-200/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink">
            Từ chối Đơn đặt làm nội dung
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            Bạn đang từ chối yêu cầu &ldquo;{commission?.title}&rdquo;. Khán giả sẽ nhận được thông báo kèm lý do của bạn và giải phóng giới hạn để đặt kênh khác.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Lý do từ chối <span className="text-accent">*</span></span>
              <span className="text-[10px] text-stone-400 font-normal">Bắt buộc</span>
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ví dụ: Hiện tại lịch sản xuất của kênh đã kín trong tháng này, hẹn bạn dịp khác nhé!"
              className="text-xs min-h-[100px] border-stone-300 rounded-xl focus:border-accent focus:ring-accent resize-none"
              disabled={rejectMutation.isPending}
            />
          </div>

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={rejectMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="text-xs h-9 px-4 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận từ chối'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
