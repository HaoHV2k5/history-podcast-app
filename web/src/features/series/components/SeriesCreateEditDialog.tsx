import React, { useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  Link2,
} from 'lucide-react';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface SeriesCreateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  coverUrl: string;
  onCoverUrlChange: (val: string) => void;
  status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT';
  onStatusChange: (val: 'PUBLISHED' | 'HIDDEN' | 'DRAFT') => void;
  error: string | null;
  isSubmitting: boolean;
  isUploadingCover: boolean;
  onUploadCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SeriesCreateEditDialog: React.FC<SeriesCreateEditDialogProps> = ({
  open,
  onOpenChange,
  isEdit,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  coverUrl,
  onCoverUrlChange,
  status,
  onStatusChange,
  error,
  isSubmitting,
  isUploadingCover,
  onUploadCover,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // GSAP Smooth Stagger Entrance Animation when dialog opens
  useEffect(() => {
    if (!open || isReducedMotion() || !formRef.current) return;

    const elements = formRef.current.querySelectorAll('[data-motion-field]');
    if (!elements || elements.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          stagger: 0.045,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    }, formRef);

    return () => ctx.revert();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto bg-[#FAF8F5] border border-[#E7E2D9] p-6 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xl">
        {/* Editorial Header */}
        <DialogHeader className="space-y-1.5 pb-2 border-b border-[#E7E2D9]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFEAE2] border border-[#E2DDD5] text-[10px] font-semibold uppercase tracking-wider text-[#8B2635] font-sans w-fit">
            <Sparkles className="h-3 w-3 text-[#8B2635]" />
            <span>Sử Ký Studio · Tuyển Tập Chuyên Đề</span>
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] leading-tight">
            {isEdit ? 'Chỉnh Sửa Tuyển Tập' : 'Tạo Tuyển Tập Tác Phẩm Mới'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-[13px] text-[#696660] leading-relaxed font-sans">
            Gom nhóm các tập podcast và video liên quan thành một chuỗi tác phẩm hoàn chỉnh, giúp khán giả theo dõi liền mạch theo trình tự thời gian.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4 pt-3 text-left">
          {error && (
            <div
              data-motion-field
              className="flex items-start gap-2.5 rounded-xl bg-[#FDF2F2] border border-[#F8D7DA] p-3 text-xs text-[#8B2635] font-medium leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#8B2635]" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Title */}
          <div data-motion-field className="space-y-1.5">
            <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono flex items-center justify-between">
              <span>
                Tiêu đề tuyển tập <span className="text-[#8B2635]">*</span>
              </span>
              <span className="text-[10px] text-[#8C827A] normal-case font-sans">
                {title.length}/100 ký tự
              </span>
            </label>
            <Input
              placeholder="Ví dụ: Triều Đại Lý — Trần: 400 Năm Hào Khí Đông A"
              value={title}
              maxLength={100}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              className="h-10 text-xs sm:text-sm rounded-xl border-[#E7E2D9] bg-white text-[#1C1917] focus:ring-2 focus:ring-[#8B2635]/20 focus:border-[#8B2635] shadow-2xs placeholder:text-stone-400"
            />
          </div>

          {/* 2. Description */}
          <div data-motion-field className="space-y-1.5">
            <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono">
              Mô tả nội dung tuyển tập
            </label>
            <Textarea
              rows={3}
              placeholder="Tóm tắt bối cảnh lịch sử, triều đại hoặc các nhân vật tiêu biểu trong chuỗi tác phẩm này..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="text-xs sm:text-sm rounded-xl border-[#E7E2D9] bg-white text-[#1C1917] focus:ring-2 focus:ring-[#8B2635]/20 focus:border-[#8B2635] shadow-2xs leading-relaxed placeholder:text-stone-400"
            />
          </div>

          {/* 3. Cover Artwork (16:9 ratio) */}
          <div data-motion-field className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-[#8B2635]" />
                <span>Ảnh bìa đại diện (16:9)</span>
              </label>
              <span className="text-[10px] text-[#736B63] bg-[#EFEAE2] px-2 py-0.5 rounded-full border border-[#E2DDD5] font-mono">
                1280 × 720 px (Chuẩn HD)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onUploadCover}
              className="hidden"
            />

            {coverUrl ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#E7E2D9] bg-[#1C1917] group shadow-xs">
                <img
                  src={coverUrl}
                  alt="Xem trước ảnh bìa tuyển tập"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <span className="text-[11px] text-white/90 font-medium truncate max-w-[200px]">
                    Ảnh bìa đã chọn
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploadingCover}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs gap-1.5 bg-white/95 text-[#1C1917] hover:bg-white border-white/80 rounded-xl font-medium shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#8B2635]" />
                      <span>Đổi ảnh khác</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploadingCover}
                      onClick={() => onCoverUrlChange('')}
                      className="h-8 text-xs gap-1 bg-white/95 text-red-600 border-red-200 hover:bg-red-50 rounded-xl font-medium shadow-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Gỡ</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploadingCover}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-[#D9D3C7] hover:border-[#8B2635]/60 bg-white hover:bg-[#FBF2EE]/30 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-60 group shadow-2xs"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="h-6 w-6 text-[#8B2635] animate-spin" />
                    <span className="text-xs font-semibold text-[#8B2635]">
                      Đang xử lý và tải ảnh bìa lên hệ thống...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBF2EE] text-[#8B2635] border border-[#F0DDD8] group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-[#1C1917] group-hover:text-[#8B2635] transition-colors">
                      Bấm để tải ảnh bìa từ máy tính
                    </span>
                    <span className="text-[11px] text-[#786C68]">
                      Định dạng JPG, PNG hoặc WebP (Dung lượng tối đa 10MB)
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Optional URL input fallback */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                <Input
                  placeholder="Hoặc dán trực tiếp liên kết URL ảnh bìa (https://...)"
                  value={coverUrl}
                  onChange={(e) => onCoverUrlChange(e.target.value)}
                  className="text-xs h-9 pl-8 rounded-xl border-[#E7E2D9] bg-white text-[#1C1917] placeholder:text-stone-400 focus:ring-2 focus:ring-[#8B2635]/20 focus:border-[#8B2635]"
                />
              </div>
            </div>
          </div>

          {/* 4. Publication Status Selector */}
          <div data-motion-field className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono">
              Trạng thái xuất bản
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onStatusChange('PUBLISHED')}
                className={`h-10 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  status === 'PUBLISHED'
                    ? 'bg-[#8B2635] text-white border-[#8B2635] shadow-xs'
                    : 'bg-white border-[#E7E2D9] text-[#5C524F] hover:bg-[#F5F2EC]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Công khai</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('HIDDEN')}
                className={`h-10 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  status === 'HIDDEN'
                    ? 'bg-[#A85822] text-white border-[#A85822] shadow-xs'
                    : 'bg-white border-[#E7E2D9] text-[#5C524F] hover:bg-[#F5F2EC]'
                }`}
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Tạm ẩn</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('DRAFT')}
                className={`h-10 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  status === 'DRAFT'
                    ? 'bg-[#524B46] text-white border-[#524B46] shadow-xs'
                    : 'bg-white border-[#E7E2D9] text-[#5C524F] hover:bg-[#F5F2EC]'
                }`}
              >
                <span>Bản nháp</span>
              </button>
            </div>
          </div>

          {/* Dialog Action Footer */}
          <DialogFooter className="pt-4 mt-2 border-t border-[#E7E2D9] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl border-[#E7E2D9] bg-white text-[#5C524F] hover:bg-[#F5F2EC] text-xs h-10 px-4 font-medium"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#8B2635] hover:bg-[#731E2A] text-white rounded-xl gap-2 cursor-pointer shadow-xs text-xs h-10 px-5 font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEdit ? 'Lưu cập nhật' : 'Tạo tuyển tập ngay'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
