import React, { useRef } from 'react';
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
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
  category: string;
  onCategoryChange: (val: string) => void;
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
  category,
  onCategoryChange,
  error,
  isSubmitting,
  isUploadingCover,
  onUploadCover,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-[#1C1615]">
            {isEdit ? 'Chỉnh Sửa Tuyển Tập' : 'Tạo Tuyển Tập Mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5C524F]">
            Điền thông tin chủ đề, mô tả và tải lên ảnh bìa để tuyển tập hiển thị nổi bật trên kênh Sử Ký.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2 text-left">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615]">
              Tiêu đề tuyển tập <span className="text-red-600">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Triều Lý: Khởi nguồn Đại Việt"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              className="h-10 text-xs sm:text-sm rounded-xl border-[#EBE4D8]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615]">
              Mô tả ngắn tuyển tập
            </label>
            <Textarea
              rows={3}
              placeholder="Tóm tắt bối cảnh lịch sử, triều đại hoặc các nhân vật tiêu biểu trong chuỗi podcast này..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="text-xs sm:text-sm rounded-xl border-[#EBE4D8]"
            />
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615]">
              Chủ đề & Thời kỳ lịch sử
            </label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#EBE4D8] bg-white text-xs sm:text-sm text-[#1C1615] focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20"
            >
              <option value="TRIEU_LY">Triều Lý</option>
              <option value="TRIEU_TRAN">Triều Trần</option>
              <option value="CHIEN_TRANH">Chiến tranh & Thủy chiến</option>
              <option value="NHAN_VAT">Nhân vật lịch sử</option>
              <option value="VAN_HOA">Văn hóa & Đời sống</option>
              <option value="KHAC">Di sản & Khác</option>
            </select>
          </div>

          {/* Cover Image Upload (16:9 ratio) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[#1C1615] flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-[#A31D24]" />
                <span>Ảnh bìa tuyển tập (16:9)</span>
              </label>
              <span className="text-[11px] text-[#786C68] bg-[#F5F2EB] px-2 py-0.5 rounded-md border border-[#EBE4D8]">
                Khuyên dùng 1280×720px
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
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#EBE4D8] bg-stone-900 group shadow-2xs">
                <img
                  src={coverUrl}
                  alt="Xem trước ảnh bìa tuyển tập"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingCover}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs gap-1.5 bg-white text-[#1C1615] border-stone-200"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#A31D24]" />
                    <span>Đổi ảnh khác</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingCover}
                    onClick={() => onCoverUrlChange('')}
                    className="h-8 text-xs gap-1 bg-white text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Gỡ</span>
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploadingCover}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-[#EBE4D8] hover:border-[#A31D24]/50 bg-[#FAF8F5] hover:bg-[#FDF2F2]/40 p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="h-5 w-5 text-[#A31D24] animate-spin" />
                    <span className="text-xs font-semibold text-[#A31D24]">
                      Đang tải ảnh bìa lên...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#A31D24]" />
                    <span className="text-xs font-semibold text-[#1C1615]">
                      Bấm để chọn ảnh bìa từ máy tính
                    </span>
                    <span className="text-[11px] text-[#786C68]">
                      JPG, PNG, WebP (tối đa 10MB)
                    </span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Hoặc dán URL ảnh có sẵn (https://...)"
                value={coverUrl}
                onChange={(e) => onCoverUrlChange(e.target.value)}
                className="text-xs h-8 rounded-lg border-[#EBE4D8]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingCover}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 h-8 px-3 text-xs gap-1.5 border-[#EBE4D8] text-[#A31D24] hover:bg-[#FDF2F2]"
                title="Bấm để chọn file ảnh bìa từ máy tính"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Chọn ảnh</span>
              </Button>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615]">
              Trạng thái xuất bản
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onStatusChange('PUBLISHED')}
                title="Đặt trạng thái công khai cho mọi người cùng nghe"
                className={`h-9 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                  status === 'PUBLISHED'
                    ? 'bg-[#A31D24] text-white border-[#A31D24] shadow-xs'
                    : 'bg-white border-[#EBE4D8] text-[#5C524F] hover:bg-[#F5F2EB]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Công khai</span>
              </button>
              <button
                type="button"
                onClick={() => onStatusChange('HIDDEN')}
                title="Đặt trạng thái tạm ẩn để không xuất hiện công khai"
                className={`h-9 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                  status === 'HIDDEN'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-white border-[#EBE4D8] text-[#5C524F] hover:bg-[#F5F2EB]'
                }`}
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Tạm ẩn</span>
              </button>
              <button
                type="button"
                onClick={() => onStatusChange('DRAFT')}
                title="Đặt trạng thái bản nháp để tiếp tục hoàn thiện sau"
                className={`h-9 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                  status === 'DRAFT'
                    ? 'bg-stone-700 text-white border-stone-700 shadow-xs'
                    : 'bg-white border-[#EBE4D8] text-[#5C524F] hover:bg-[#F5F2EB]'
                }`}
              >
                <span>Bản nháp</span>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-[#EBE4D8]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl border-[#EBE4D8]"
              title="Hủy bỏ và đóng hộp thoại"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#A31D24] hover:bg-[#8B181E] text-white rounded-xl gap-2 cursor-pointer shadow-xs"
              title={isEdit ? 'Lưu các cập nhật cho tuyển tập' : 'Tạo mới tuyển tập này'}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEdit ? 'Lưu thay đổi' : 'Tạo tuyển tập'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
