import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Radio, Save, Loader2, BookOpen } from 'lucide-react';
import { ChannelItem } from '@/types/channel';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const channelUpdateSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên kênh phải có ít nhất 3 ký tự')
    .max(100, 'Tên kênh không được vượt quá 100 ký tự'),
  description: z
    .string()
    .min(10, 'Mô tả kênh phải có ít nhất 10 ký tự')
    .max(500, 'Mô tả kênh không được vượt quá 500 ký tự'),
});

export type ChannelUpdateFormData = z.infer<typeof channelUpdateSchema>;

export interface ChannelMetadataFormCardRef {
  focusNameInput: () => void;
}

interface ChannelMetadataFormCardProps {
  channel: ChannelItem;
  onSubmit: (data: ChannelUpdateFormData) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const ChannelMetadataFormCard = forwardRef<
  ChannelMetadataFormCardRef,
  ChannelMetadataFormCardProps
>(({ channel, onSubmit, isSubmitting = false, className }, ref) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChannelUpdateFormData>({
    resolver: zodResolver(channelUpdateSchema),
    defaultValues: {
      name: channel.name || '',
      description: channel.description || '',
    },
  });

  const watchedName = watch('name') || '';
  const watchedDescription = watch('description') || '';

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focusNameInput: () => {
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    },
  }));

  const { ref: formNameRef, ...restNameRegister } = register('name');

  return (
    <article
      aria-label="Chỉnh sửa thông tin Kênh"
      className={cn(
        'relative rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs space-y-5',
        className
      )}
      data-motion-target="form"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#F0EBE1] pb-3.5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FDF2F2] text-[#A31D24]"
            aria-hidden="true"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19]">
            Chỉnh sửa thông tin Kênh
          </h3>
        </div>

        <span className="text-xs text-[#8C827A] font-medium">
          Cập nhật lần cuối: {formatDate(channel.updatedAt || channel.createdAt)}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Channel Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="channel-name-input" className="text-xs font-semibold text-[#1F1A19] block">
            Tên Kênh Podcast <span className="text-[#A31D24]">*</span>
          </label>

          <div className="relative">
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C827A]"
              aria-hidden="true"
            >
              <Radio className="h-4 w-4" />
            </div>

            <input
              id="channel-name-input"
              {...restNameRegister}
              ref={(el) => {
                formNameRef(el);
                nameInputRef.current = el;
              }}
              placeholder="Nhập tên kênh podcast..."
              maxLength={100}
              className={cn(
                'w-full pl-9 pr-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-[#1F1A19] bg-white placeholder:text-[#A89F97] transition-all focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
                errors.name
                  ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                  : 'border-[#E5E0D8]'
              )}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            {errors.name ? (
              <span className="text-[#DC2626] font-medium">{errors.name.message}</span>
            ) : (
              <span className="text-[#8C827A]">Từ 3 đến 100 ký tự.</span>
            )}
            <span className="text-[#8C827A] font-mono tabular-nums">
              {watchedName.length}/100
            </span>
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <label htmlFor="channel-desc-input" className="text-xs font-semibold text-[#1F1A19] block">
            Mô tả Kênh <span className="text-[#A31D24]">*</span>
          </label>

          <textarea
            id="channel-desc-input"
            {...register('description')}
            rows={4}
            maxLength={500}
            placeholder="Kênh podcast chuyên sâu về lịch sử và các chiến dịch dựng nước, giữ nước của dân tộc Việt Nam..."
            className={cn(
              'w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-[#1F1A19] bg-white placeholder:text-[#A89F97] leading-relaxed transition-all resize-y focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]',
              errors.description
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                : 'border-[#E5E0D8]'
            )}
          />

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            {errors.description ? (
              <span className="text-[#DC2626] font-medium">{errors.description.message}</span>
            ) : (
              <span className="text-[#8C827A]">
                Mô tả ngắn gọn, thể hiện tôn chỉ và chủ đề của kênh.
              </span>
            )}
            <span className="text-[#8C827A] font-mono tabular-nums">
              {watchedDescription.length}/500
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[#85171D] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24] focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Save className="h-4 w-4 text-white" />
            )}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </article>
  );
});

ChannelMetadataFormCard.displayName = 'ChannelMetadataFormCard';
