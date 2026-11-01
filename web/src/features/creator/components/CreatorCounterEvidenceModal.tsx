import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { disputesApi } from '@/services/api/disputes';
import { DisputeItem } from '@/types/dispute';

interface CreatorCounterEvidenceModalProps {
  dispute: DisputeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorCounterEvidenceModal: React.FC<CreatorCounterEvidenceModalProps> = ({
  dispute,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [counterEvidence, setCounterEvidence] = useState('');
  const [error, setError] = useState<string | null>(null);

  const counterEvidenceMutation = useMutation({
    mutationFn: () => {
      if (!dispute) throw new Error('Không tìm thấy thông tin khiếu nại');
      if (!counterEvidence.trim()) throw new Error('Vui lòng nhập nội dung giải trình đối chất.');

      return disputesApi.submitCounterEvidence(dispute.id, {
        counterEvidence: counterEvidence.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-contract-detail', dispute?.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-disputes', dispute?.contractId] });
      setCounterEvidence('');
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi bằng chứng đối chất');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterEvidence.trim()) {
      setError('Vui lòng nhập nội dung giải trình đối chất chi tiết.');
      return;
    }
    counterEvidenceMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Bằng chứng đối chất tranh chấp #{dispute?.id}
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink break-words">
            Giải Trình Đối Chất — {dispute?.milestoneTitle || `Cột mốc #${dispute?.milestoneId}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            Người khiếu nại: <strong>{dispute?.raisedByUserFullName || 'Đối tác'}</strong>.
            Cung cấp căn cứ thực tế để Admin xem xét khách quan trước khi ra quyết định giải ngân hoặc hoàn tiền.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Dispute Context */}
          {dispute?.reason && (
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1 break-words">
              <span className="font-bold text-[10px] uppercase text-rose-700">
                Lý do khiếu nại ban đầu:
              </span>
              <p className="italic text-rose-800 leading-relaxed">&ldquo;{dispute.reason}&rdquo;</p>
              {dispute.evidence && (
                <p className="text-[11px] text-stone-600 pt-1 border-t border-rose-100">
                  <strong>Bằng chứng kèm theo:</strong> {dispute.evidence}
                </p>
              )}
            </div>
          )}

          {/* Counter Evidence Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Nội dung giải trình đối chất của bạn <span className="text-accent">*</span></span>
              <span className="text-[10px] text-stone-400">Văn bản / Link chứng minh</span>
            </label>
            <Textarea
              value={counterEvidence}
              onChange={(e) => setCounterEvidence(e.target.value)}
              placeholder="Giải trình cụ thể các điểm đối chất (ví dụ: Tôi đã nộp file video hoàn chỉnh ở bản v2 và phản hồi đúng thỏa thuận)..."
              className="text-xs min-h-[95px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={counterEvidenceMutation.isPending}
            />
          </div>

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={counterEvidenceMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={counterEvidenceMutation.isPending || !counterEvidence.trim()}
              className="text-xs h-9 px-5 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs active:scale-[0.98]"
            >
              {counterEvidenceMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang gửi đối chất...
                </>
              ) : (
                'Gửi giải trình'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

