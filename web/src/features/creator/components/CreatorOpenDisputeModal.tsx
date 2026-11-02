import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
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
import { MilestoneItem } from '@/types/contract';

interface CreatorOpenDisputeModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorOpenDisputeModal: React.FC<CreatorOpenDisputeModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState<string | null>(null);

  const disputeMutation = useMutation({
    mutationFn: () => {
      if (!milestone) throw new Error('Không tìm thấy thông tin Milestone');
      if (!reason.trim()) throw new Error('Vui lòng nêu rõ lý do mở khiếu nại tranh chấp.');

      return disputesApi.openDispute({
        milestoneId: milestone.id,
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-contract-detail', milestone?.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract-disputes', milestone?.contractId] });
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      setReason('');
      setEvidence('');
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu khiếu nại');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do khiếu nại chi tiết.');
      return;
    }
    disputeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Khiếu nại &amp; Tranh chấp Escrow
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink break-words">
            Mở Khiếu Nại — Giai đoạn #{milestone?.orderNo}: {milestone?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            Khoản tiền bảo chứng của giai đoạn này sẽ được <strong>đóng băng an toàn (FROZEN)</strong> để Admin nền tảng thụ lý và phân xử công bằng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Lý do khiếu nại <span className="text-accent">*</span></span>
              <span className="text-[10px] text-stone-400">Tối thiểu 10 ký tự</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ bất đồng hoặc vi phạm cam kết (ví dụ: Khách yêu cầu sửa đổi vượt quá thỏa thuận kịch bản ban đầu)..."
              className="text-xs min-h-[85px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={disputeMutation.isPending}
            />
          </div>

          {/* Evidence */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Bằng chứng &amp; Giải trình đối soát</span>
              <span className="text-[10px] text-stone-400">Văn bản / Link ảnh chụp màn hình</span>
            </label>
            <Textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Trích dẫn mốc thời gian, nội dung chat đã thỏa thuận, hoặc đường dẫn ảnh chụp màn hình bằng chứng..."
              className="text-xs min-h-[75px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={disputeMutation.isPending}
            />
          </div>

          {/* Policy Notice Box */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Quy trình xử lý tranh chấp của Admin:</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Sau khi bạn gửi khiếu nại, đối tác sẽ nhận được thông báo để gửi bằng chứng đối chất. Admin sẽ căn cứ vào kịch bản gốc và thành phẩm để ra quyết định phân xử (Giải ngân, Hoàn tiền hoặc Chia tỷ lệ).
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={disputeMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={disputeMutation.isPending || !reason.trim()}
              className="text-xs h-9 px-5 rounded-xl bg-rose-700 text-white hover:bg-rose-800 font-semibold transition-all shadow-xs active:scale-[0.98]"
            >
              {disputeMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang gửi khiếu nại...
                </>
              ) : (
                'Gửi khiếu nại'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

