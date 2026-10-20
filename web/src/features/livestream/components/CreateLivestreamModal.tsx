import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Sparkles,
  AlertCircle,
  Loader2,
  Crown,
  Image as ImageIcon,
  Tv,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { livestreamApi } from '@/services/api/livestream';
import { ChannelItem } from '@/types/channel';
import { LivestreamSession } from '@/types/livestream';
import {
  validateCreateLivestreamInput,
  interpretLivestreamError,
} from '../livestreamLogic';

interface CreateLivestreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: LivestreamSession) => void;
  channel: ChannelItem | null | undefined;
  isLoadingChannel?: boolean;
}

export const CreateLivestreamModal: React.FC<CreateLivestreamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  channel,
  isLoadingChannel = false,
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setIsExclusive(false);
    setFieldErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!channel?.id) {
        throw new Error('Không tìm thấy thông tin kênh phát sóng của bạn.');
      }

      const input = {
        channelId: channel.id,
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        isExclusive,
      };

      const validation = validateCreateLivestreamInput(input);
      if (!validation.valid) {
        setFieldErrors(validation.errors);
        throw new Error('Vui lòng kiểm tra lại các trường thông tin');
      }

      const res = await livestreamApi.createSession(input);
      return res.data;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['creator-livestreams'] });
      resetForm();
      onSuccess(newSession);
    },
    onError: (err: unknown) => {
      const errObj = err as { errorCode?: string; message?: string };
      const msg = interpretLivestreamError(
        errObj.errorCode,
        errObj.message || 'Không thể tạo phiên phát sóng trực tiếp. Vui lòng thử lại.'
      );
      setSubmitError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent maxWidth="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle>Tạo phiên Livestream mới</DialogTitle>
              <DialogDescription>
                Khởi tạo phòng phát trực tiếp trên kênh podcast của bạn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Channel Banner / Guard */}
        {isLoadingChannel ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-subtle p-3.5">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-xs text-muted">Đang tải thông tin kênh phát sóng...</span>
          </div>
        ) : !channel ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Chưa tìm thấy kênh phát sóng</p>
                <p className="mt-1">
                  Bạn cần sở hữu ít nhất một kênh đã thiết lập để có thể phát sóng trực tiếp.
                </p>
                <a
                  href="/creator/channel"
                  className="mt-2 inline-flex items-center gap-1 font-medium text-accent underline hover:text-accent-hover"
                >
                  Đến trang Quản lý Kênh để tạo kênh ngay &rarr;
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle/60 p-3">
            <div className="flex items-center gap-2.5">
              {channel.avatarUrl ? (
                <img
                  src={channel.avatarUrl}
                  alt={channel.name}
                  className="h-8 w-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-canvas text-xs font-bold">
                  {channel.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Kênh phát sóng
                </span>
                <p className="text-xs font-bold text-ink truncate">{channel.name}</p>
              </div>
            </div>
            <span className="rounded-xs bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
              Đã sẵn sàng
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="livestream-title" className="text-xs font-medium text-ink">
                Tiêu đề buổi Livestream <span className="text-accent">*</span>
              </label>
              <span className="text-[11px] text-muted">{title.length}/150</span>
            </div>
            <Input
              id="livestream-title"
              placeholder="VD: Đàm đạo Sử Ký: Khởi nghĩa Lam Sơn & Nghệ thuật Quân sự"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              disabled={createMutation.isPending || !channel}
              className={fieldErrors.title ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              maxLength={150}
              required
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="livestream-description" className="text-xs font-medium text-ink">
                Mô tả nội dung (Tùy chọn)
              </label>
              <span className="text-[11px] text-muted">{description.length}/1000</span>
            </div>
            <Textarea
              id="livestream-description"
              placeholder="Tóm tắt ngắn gọn chủ đề đàm đạo, tài liệu tham khảo hoặc câu hỏi gửi tới khán giả..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending || !channel}
              rows={3}
              maxLength={1000}
            />
            {fieldErrors.description && (
              <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.description}</p>
            )}
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1.5">
            <label htmlFor="livestream-thumbnail" className="text-xs font-medium text-ink">
              Đường dẫn Ảnh thu nhỏ / Thumbnail (Tùy chọn)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="livestream-thumbnail"
                type="url"
                placeholder="https://cdn.example.com/thumbnail.jpg"
                value={thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  if (fieldErrors.thumbnailUrl) {
                    setFieldErrors((prev) => ({ ...prev, thumbnailUrl: '' }));
                  }
                }}
                disabled={createMutation.isPending || !channel}
                className={fieldErrors.thumbnailUrl ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {thumbnailUrl && (
                <div className="h-10 w-16 shrink-0 rounded border border-border overflow-hidden bg-surface-subtle flex items-center justify-center">
                  <img
                    src={thumbnailUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <ImageIcon className="h-4 w-4 text-muted" />
                </div>
              )}
            </div>
            {fieldErrors.thumbnailUrl && (
              <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.thumbnailUrl}</p>
            )}
            <p className="text-[11px] text-muted">
              Định dạng hình ảnh JPG, PNG hoặc WEBP hiển thị tại trang danh sách.
            </p>
          </div>

          {/* VIP Exclusive Toggle */}
          <div className="rounded-lg border border-border bg-surface-subtle/40 p-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="livestream-exclusive"
                checked={isExclusive}
                onChange={(e) => setIsExclusive(e.target.checked)}
                disabled={createMutation.isPending || !channel}
                className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-ink">
                    Phát sóng độc quyền cho Hội viên VIP
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                  Chỉ những thính giả có gói Hội viên đang hoạt động của kênh mới có quyền nhận Token xem luồng trực tiếp này.
                </p>
              </div>
            </label>
          </div>

          {/* Backend Status Note */}
          <div className="rounded-md border border-sky-100 bg-sky-50/80 p-3 text-[11px] text-sky-800 flex items-start gap-2">
            <Tv className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Lưu ý:</strong> Phiên phát trực tiếp sẽ được máy chủ khởi tạo ngay ở trạng thái{' '}
              <span className="font-semibold text-rose-700">LIVE</span>. Sau khi khởi tạo, bạn có thể vào ngay Studio để chuẩn bị Camera & Micro và phát sóng tới thính giả.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !channel}
              className="gap-2 bg-accent hover:bg-accent-hover text-canvas"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Khởi tạo phiên Live</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
