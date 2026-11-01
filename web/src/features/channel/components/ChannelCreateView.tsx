import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Radio, PlusCircle, Camera, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ChannelBrandLogo } from './ChannelBrandLogo';
import { cn } from '@/utils/cn';

const channelCreateSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên kênh phải có ít nhất 3 ký tự')
    .max(100, 'Tên kênh không được vượt quá 100 ký tự'),
  description: z
    .string()
    .min(10, 'Mô tả kênh phải có ít nhất 10 ký tự')
    .max(500, 'Mô tả kênh không được vượt quá 500 ký tự'),
});

export type ChannelCreateFormData = z.infer<typeof channelCreateSchema>;

interface ChannelCreateViewProps {
  onSubmit: (data: ChannelCreateFormData) => void;
  isSubmitting?: boolean;
  avatarFile: File | null;
  avatarPreview: string | null;
  coverFile: File | null;
  coverPreview: string | null;
  onFileSelect: (file: File | undefined, type: 'avatar' | 'cover') => void;
  error?: string | null;
}

export const ChannelCreateView: React.FC<ChannelCreateViewProps> = ({
  onSubmit,
  isSubmitting = false,
  avatarFile,
  avatarPreview,
  coverFile,
  coverPreview,
  onFileSelect,
  error,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChannelCreateFormData>({
    resolver: zodResolver(channelCreateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const watchedName = watch('name') || '';
  const watchedDescription = watch('description') || '';

  return (
    <div className="space-y-6">
      {/* KYC Confirmed Banner */}
      <div className="rounded-xl border border-[#A6E9B9] bg-[#EDFDF2] p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#168A4E] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#168A4E] block">
              Đủ điều kiện khởi tạo Kênh (Đã xác thực KYC)
            </span>
            <span className="text-[#168A4E]/80">
              Mỗi tài khoản nhà sáng tạo được tạo 1 kênh podcast chính thức gắn liền với định danh tác giả.
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-xs flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <article className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19] border-b border-[#F0EBE1] pb-3 flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#A31D24]" />
                <span>Thông tin nhận diện Kênh mới</span>
              </h3>

              {/* Channel Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1A19] block">
                  Tên Kênh Podcast <span className="text-[#A31D24]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C827A]">
                    <Radio className="h-4 w-4" />
                  </div>
                  <input
                    {...register('name')}
                    placeholder="Ví dụ: Đại Việt Sử Ký, Huyền Sử Thăng Long..."
                    maxLength={100}
                    className={cn(
                      'w-full pl-9 pr-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-[#1F1A19] bg-white placeholder:text-[#A89F97] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                      errors.name ? 'border-[#DC2626]' : 'border-[#E5E0D8]'
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  {errors.name ? (
                    <span className="text-[#DC2626] font-medium">{errors.name.message}</span>
                  ) : (
                    <span className="text-[#8C827A]">Từ 3 đến 100 ký tự. Tên kênh là duy nhất.</span>
                  )}
                  <span className="text-[#8C827A] font-mono tabular-nums">
                    {watchedName.length}/100
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1A19] block">
                  Mô tả định hướng & chủ đề của kênh <span className="text-[#A31D24]">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  maxLength={500}
                  placeholder="Kênh podcast chuyên sâu về lịch sử và các chiến dịch dựng nước, giữ nước của dân tộc Việt Nam..."
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-[#1F1A19] bg-white placeholder:text-[#A89F97] leading-relaxed transition-all resize-y focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                    errors.description ? 'border-[#DC2626]' : 'border-[#E5E0D8]'
                  )}
                />
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  {errors.description ? (
                    <span className="text-[#DC2626] font-medium">{errors.description.message}</span>
                  ) : (
                    <span className="text-[#8C827A]">Tối đa 500 ký tự.</span>
                  )}
                  <span className="text-[#8C827A] font-mono tabular-nums">
                    {watchedDescription.length}/500
                  </span>
                </div>
              </div>

              {/* Visual Media Pickers */}
              <div className="pt-4 border-t border-[#F0EBE1] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#786D66]">
                  Hình ảnh nhận diện kênh (Tùy chọn)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Avatar Picker */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#1F1A19] block">
                      Ảnh đại diện Kênh (1:1)
                    </span>
                    <div className="flex items-center gap-3">
                      <ChannelBrandLogo
                        avatarUrl={avatarPreview}
                        name={watchedName || 'Kênh mới'}
                        size="md"
                        className="h-16 w-16 rounded-xl"
                      />
                      <div className="space-y-1">
                        <input
                          type="file"
                          ref={avatarInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => onFileSelect(e.target.files?.[0], 'avatar')}
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E0D8] bg-white text-[#38302E] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>{avatarFile ? 'Đổi ảnh' : 'Chọn ảnh'}</span>
                        </button>
                        <p className="text-[10px] text-[#8C827A]">Khuyến nghị tỉ lệ 1:1</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Picker */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#1F1A19] block">
                      Ảnh bìa Kênh (16:9)
                    </span>
                    <div className="space-y-1.5">
                      <div className="h-16 w-full rounded-xl border border-[#EBE4D8] overflow-hidden bg-[#FAF8F5]">
                        {coverPreview ? (
                          <img
                            src={coverPreview}
                            alt="Cover Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[11px] text-[#8C827A]">
                            Chưa chọn ảnh bìa
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => onFileSelect(e.target.files?.[0], 'cover')}
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E0D8] bg-white text-[#38302E] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{coverFile ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-[#F0EBE1] flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[#85171D] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <PlusCircle className="h-4 w-4 text-white" />
                  )}
                  <span>Hoàn tất & Khởi tạo Kênh</span>
                </button>
              </div>
            </article>
          </form>
        </div>

        {/* Right Preview: 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[#EBE4D8] bg-white p-4 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#786D66] block">
              Bản xem trước kênh
            </span>

            <div className="rounded-xl border border-[#EFE9DF] bg-[#FAF8F5] overflow-hidden text-center p-4">
              <div className="flex justify-center mb-2">
                <ChannelBrandLogo
                  avatarUrl={avatarPreview}
                  name={watchedName || 'Kênh mới'}
                  size="md"
                  className="h-20 w-20 rounded-xl"
                />
              </div>
              <h4 className="font-serif text-base font-bold text-[#1F1A19]">
                {watchedName || 'Tên Kênh Podcast'}
              </h4>
              <p className="text-xs text-[#5C524C] mt-1 leading-relaxed line-clamp-3">
                {watchedDescription ||
                  'Mô tả kênh podcast chuyên sâu về lịch sử và các chiến dịch dựng nước, giữ nước.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
