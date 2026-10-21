import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Sparkles,
  AlertCircle,
  Loader2,
  Crown,
  Image as ImageIcon,
  Upload,
  X,
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
import { creatorStudioApi } from '@/services/api/creatorStudio';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setIsUploadingThumbnail(false);
    setIsExclusive(false);
    setFieldErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    if (createMutation.isPending || isUploadingThumbnail) return;
    resetForm();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({
        ...prev,
        thumbnailUrl: 'Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        thumbnailUrl: 'Kích thước ảnh không được vượt quá 10MB.',
      }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, thumbnailUrl: '' }));
    setIsUploadingThumbnail(true);
    try {
      const res = await creatorStudioApi.uploadSceneImage(file);
      if (res?.data?.imageUrl) {
        setThumbnailUrl(res.data.imageUrl);
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          thumbnailUrl: 'Tải ảnh lên không thành công. Vui lòng thử lại.',
        }));
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Không thể tải ảnh thu nhỏ lên. Vui lòng thử lại hoặc dán đường dẫn ảnh.';
      setFieldErrors((prev) => ({
        ...prev,
        thumbnailUrl: msg,
      }));
    } finally {
      setIsUploadingThumbnail(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (input: {
      channelId: number;
      title: string;
      description?: string;
      thumbnailUrl?: string;
      isExclusive: boolean;
    }) => {
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

    if (!channel?.id) {
      setSubmitError('Không tìm thấy thông tin kênh phát sóng của bạn.');
      return;
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
      return;
    }

    createMutation.mutate(input);
  };

  const safeChannelName = channel?.name || 'Kênh của bạn';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        maxWidth="max-w-lg"
        className="max-h-[88vh] flex flex-col p-4 sm:p-5 gap-3 overflow-hidden"
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2.5 pr-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base">Tạo phiên Phát trực tiếp mới</DialogTitle>
              <DialogDescription className="text-xs">
                Khởi tạo phòng phát trực tiếp trên kênh podcast của bạn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-3">
          {/* Scrollable Form Body with negative-margin + padding so focus rings are never clipped */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2 py-1 space-y-3 min-h-0">
            {/* Channel Banner / Guard */}
            {isLoadingChannel ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-subtle p-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-xs text-muted">Đang tải thông tin kênh phát sóng...</span>
              </div>
            ) : !channel ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Chưa tìm thấy kênh phát sóng</p>
                    <p className="mt-0.5">
                      Bạn cần sở hữu ít nhất một kênh đã thiết lập để có thể phát sóng trực tiếp.
                    </p>
                    <a
                      href="/creator/channel"
                      className="mt-1.5 inline-flex items-center gap-1 font-medium text-accent underline hover:text-accent-hover"
                    >
                      Đến trang Quản lý Kênh để tạo kênh ngay &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle/60 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {channel.avatarUrl ? (
                    <img
                      src={channel.avatarUrl}
                      alt={safeChannelName}
                      className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-canvas text-xs font-bold">
                      {safeChannelName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block leading-none">
                      Kênh phát sóng
                    </span>
                    <p className="text-xs font-bold text-ink truncate mt-0.5">{safeChannelName}</p>
                  </div>
                </div>
                <span className="rounded-xs bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200 shrink-0">
                  Đã sẵn sàng
                </span>
              </div>
            )}

            {submitError && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="livestream-title" className="text-xs font-medium text-ink">
                  Tiêu đề buổi phát sóng <span className="text-accent">*</span>
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
                className={fieldErrors.title ? 'border-rose-500 focus-visible:ring-rose-500 h-9 text-xs' : 'h-9 text-xs'}
                maxLength={150}
                required
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="livestream-description" className="text-xs font-medium text-ink">
                  Mô tả nội dung (Tùy chọn)
                </label>
                <span className="text-[11px] text-muted">{description.length}/1000</span>
              </div>
              <Textarea
                id="livestream-description"
                placeholder="Tóm tắt ngắn gọn chủ đề đàm đạo hoặc câu hỏi gửi tới khán giả..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createMutation.isPending || !channel}
                rows={2}
                maxLength={1000}
                className="text-xs"
              />
              {fieldErrors.description && (
                <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.description}</p>
              )}
            </div>

            {/* Thumbnail Upload & URL */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="livestream-thumbnail" className="text-xs font-medium text-ink">
                  Ảnh thu nhỏ / Thumbnail (Tùy chọn)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={createMutation.isPending || isUploadingThumbnail || !channel}
                  className="h-6.5 px-2 text-[11px] gap-1"
                >
                  {isUploadingThumbnail ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      <span>Đang tải ảnh...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 text-accent" />
                      <span>Tải ảnh từ máy</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="livestream-thumbnail"
                    type="url"
                    placeholder="Tải ảnh từ máy hoặc dán đường dẫn https://..."
                    value={thumbnailUrl}
                    onChange={(e) => {
                      setThumbnailUrl(e.target.value);
                      if (fieldErrors.thumbnailUrl) {
                        setFieldErrors((prev) => ({ ...prev, thumbnailUrl: '' }));
                      }
                    }}
                    disabled={createMutation.isPending || isUploadingThumbnail || !channel}
                    className={fieldErrors.thumbnailUrl ? 'border-rose-500 focus-visible:ring-rose-500 pr-7 h-9 text-xs' : 'pr-7 h-9 text-xs'}
                  />
                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 cursor-pointer"
                      title="Xóa ảnh thu nhỏ"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {thumbnailUrl && (
                  <div className="h-9 w-14 shrink-0 rounded border border-border overflow-hidden bg-surface-subtle flex items-center justify-center">
                    <img
                      src={thumbnailUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <ImageIcon className="h-3.5 w-3.5 text-muted" />
                  </div>
                )}
              </div>
              {fieldErrors.thumbnailUrl && (
                <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.thumbnailUrl}</p>
              )}
            </div>

            {/* VIP Exclusive Toggle */}
            <div className="rounded-lg border border-border bg-surface-subtle/40 px-3 py-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
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
                  <p className="mt-0.5 text-[11px] text-muted leading-snug">
                    Chỉ thính giả có gói Hội viên đang hoạt động của kênh mới được tham gia xem buổi phát sóng này.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={createMutation.isPending || isUploadingThumbnail}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || isUploadingThumbnail || !channel}
              className="gap-1.5 bg-accent hover:bg-accent-hover text-canvas"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
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
