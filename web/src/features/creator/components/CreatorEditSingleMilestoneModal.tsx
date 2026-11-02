import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { milestonesApi } from '@/services/api/milestones';
import { MilestoneItem } from '@/types/contract';
import { formatVND } from '@/utils/formatters';

interface CreatorEditSingleMilestoneModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorEditSingleMilestoneModal: React.FC<CreatorEditSingleMilestoneModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [amount, setAmount] = useState<number>(500000);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title || '');
      setRequirement(milestone.requirement || '');
      setAmount(milestone.amount || 10000);
      setDurationDays(milestone.durationDays || 3);
      setError(null);
    }
  }, [milestone, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!milestone) throw new Error('Không có milestone');
      if (!title.trim()) throw new Error('Vui lòng nhập tên giai đoạn');
      if (!requirement.trim()) throw new Error('Vui lòng nhập cam kết bàn giao');
      if (amount < 10000) throw new Error('Số tiền tối thiểu là 10.000 VNĐ');
      if (durationDays < 1) throw new Error('Thời gian thực hiện tối thiểu là 1 ngày');

      return milestonesApi.updateMilestone(milestone.id, {
        title: title.trim(),
        requirement: requirement.trim(),
        amount,
        durationDays,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-contract-detail'] });
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật giai đoạn');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const platformFee = Math.round(amount * 0.05);
  const netAmount = amount - platformFee;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-accent">
            <Edit3 className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              Chỉnh sửa Giai đoạn #{milestone?.orderNo}
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink">
            Cập nhật chi tiết Milestone
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Hệ thống sẽ tự động tính lại tổng tiền hợp đồng và đặt lại hạn duyệt 48 giờ cho khán giả.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Tên giai đoạn *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kịch bản phân cảnh chi tiết"
              className="text-xs h-9 rounded-xl border-stone-300"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Cam kết sản phẩm bàn giao *</label>
            <Textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="Ví dụ: Bàn giao file PDF kịch bản phân cảnh 3 tập..."
              className="text-xs min-h-[80px] rounded-xl border-stone-300 resize-none"
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Số tiền (VNĐ) *</label>
              <Input
                type="number"
                min={10000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="text-xs h-9 rounded-xl font-mono border-stone-300"
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Thời gian (Ngày) *</label>
              <Input
                type="number"
                min={1}
                max={90}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="text-xs h-9 rounded-xl font-mono border-stone-300"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          {/* Real-time calculated fee */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs space-y-1">
            <div className="flex items-center justify-between text-stone-600">
              <span>Phí sàn nền tảng (5%):</span>
              <span className="font-mono text-rose-700">-{formatVND(platformFee)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-stone-800 pt-1 border-t border-stone-200/50">
              <span>Bạn thực nhận (95%):</span>
              <span className="font-mono text-emerald-700">{formatVND(netAmount)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs text-accent bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold shadow-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

