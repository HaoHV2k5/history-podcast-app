import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { reviewsApi } from '@/services/api/reviews';
import { MilestoneItem } from '@/types/contract';
import { cn } from '@/utils/cn';

interface CreatorMilestoneReviewModalProps {
  milestone: MilestoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorMilestoneReviewModal: React.FC<CreatorMilestoneReviewModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!milestone) throw new Error('Không có milestone');
      return reviewsApi.createMilestoneReview(milestone.id, {
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-my-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['creator-contracts-me'] });
      setComment('');
      setError(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi đánh giá');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }
    reviewMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-stone-200/90 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-stone-200/70">
          <div className="flex items-center gap-2 text-amber-500">
            <Sparkles className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Đánh giá giai đoạn Milestone
            </span>
          </div>
          <DialogTitle className="text-base font-bold font-serif text-ink">
            Đánh giá Giai đoạn #{milestone?.orderNo}: {milestone?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Phản hồi về sự phối hợp và tương tác với khách hàng trong giai đoạn này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Star selector */}
          <div className="flex flex-col items-center justify-center gap-2 py-3 bg-stone-50/70 rounded-xl border border-stone-200/60">
            <span className="text-xs font-semibold text-stone-700">Mức độ hài lòng</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-hidden transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300'
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] font-medium text-stone-500 font-serif">
              {rating === 5 && 'Rất tuyệt vời (5/5)'}
              {rating === 4 && 'Hài lòng (4/5)'}
              {rating === 3 && 'Bình thường (3/5)'}
              {rating === 2 && 'Cần cải thiện (2/5)'}
              {rating === 1 && 'Không hài lòng (1/5)'}
            </span>
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">
              Nhận xét / Lời nhắn
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Khách hàng phản hồi rất nhanh, hướng dẫn chi tiết và thanh toán đúng hẹn..."
              className="text-xs min-h-[80px] rounded-xl border-stone-300 focus:border-accent resize-none"
              disabled={reviewMutation.isPending}
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
              disabled={reviewMutation.isPending}
              className="text-xs h-9 px-4 rounded-xl border-stone-300 text-stone-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={reviewMutation.isPending}
              className="text-xs h-9 px-5 rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold transition-all shadow-xs"
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi đánh giá'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
