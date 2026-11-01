import React, { useRef } from 'react';
import { Camera, Edit3, Upload, Loader2 } from 'lucide-react';
import { ChannelItem } from '@/types/channel';
import { formatDate } from '@/utils/formatters';
import { ChannelBrandLogo } from './ChannelBrandLogo';
import { cn } from '@/utils/cn';

interface ChannelShowcaseCardProps {
  channel: ChannelItem;
  onSelectAvatar: (file: File) => void;
  onSelectCover: (file: File) => void;
  isUploadingAvatar?: boolean;
  isUploadingCover?: boolean;
  onEditClick?: () => void;
  className?: string;
}

export const ChannelShowcaseCard: React.FC<ChannelShowcaseCardProps> = ({
  channel,
  onSelectAvatar,
  onSelectCover,
  isUploadingAvatar = false,
  isUploadingCover = false,
  onEditClick,
  className,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectAvatar(file);
    }
    // Reset value so identical file selection triggers onChange
    e.target.value = '';
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectCover(file);
    }
    e.target.value = '';
  };

  const isChannelActive = channel.status === 'ACTIVE' || channel.status === 'PUBLISHED';

  return (
    <article
      aria-label="Thông tin nhận diện Kênh"
      className={cn(
        'relative rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-2xs overflow-hidden',
        className
      )}
      data-motion-target="showcase"
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden="true"
        onChange={handleAvatarChange}
      />
      <input
        type="file"
        ref={coverInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden="true"
        onChange={handleCoverChange}
      />

      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Channel Avatar with Interactive Overlay */}
        <div className="relative group/avatar shrink-0 select-none">
          <ChannelBrandLogo
            avatarUrl={channel.avatarUrl}
            name={channel.name}
            size="md"
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl shadow-xs transition-transform duration-200 group-hover/avatar:scale-[1.02]"
          />

          {/* Avatar Hover Upload Overlay */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            aria-label="Cập nhật ảnh đại diện kênh"
            className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition-opacity duration-200 cursor-pointer shadow-md backdrop-blur-2xs focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
            ) : (
              <>
                <Camera className="h-5 w-5 mb-1 text-white/90" />
                <span>Đổi ảnh</span>
              </>
            )}
          </button>
        </div>

        {/* Channel Details */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Top Line: Name + Edit icon + Status badge + Change Cover Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <h2
                className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1F1A19] truncate"
                title={channel.name}
              >
                {channel.name}
              </h2>

              {/* Edit Pencil Icon (Focuses Edit Form) */}
              {onEditClick && (
                <button
                  type="button"
                  onClick={onEditClick}
                  title="Chỉnh sửa tên và mô tả kênh"
                  aria-label="Chỉnh sửa tên và mô tả kênh"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#A31D24] hover:bg-[#FDF2F2] transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}

              {/* Status Badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold select-none',
                  isChannelActive
                    ? 'bg-[#EDFDF2] border border-[#A6E9B9] text-[#168A4E]'
                    : 'bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309]'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isChannelActive ? 'bg-[#168A4E]' : 'bg-[#B45309]'
                  )}
                  aria-hidden="true"
                />
                <span>
                  {isChannelActive ? 'Kênh đang hoạt động' : `Trạng thái: ${channel.status}`}
                </span>
              </span>
            </div>

            {/* Upload Cover Action Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#38302E] shadow-2xs hover:bg-[#FAF8F5] hover:border-[#D6CEBF] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]"
              >
                {isUploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#A31D24]" />
                ) : (
                  <Upload className="h-4 w-4 text-[#786D66]" />
                )}
                <span>Đổi ảnh bìa</span>
              </button>
            </div>
          </div>

          {/* Metadata Row: ID, Creator ID, Created Date */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#786D66] font-medium">
            <span>
              Mã kênh: <strong className="text-[#38302E]">#{channel.id}</strong>
            </span>
            <span aria-hidden="true" className="text-[#D6CEBF]">
              •
            </span>
            <span>
              Tác giả ID: <strong className="text-[#38302E]">#{channel.creatorId}</strong>
            </span>
            <span aria-hidden="true" className="text-[#D6CEBF]">
              •
            </span>
            <span>
              Ngày tạo:{' '}
              <strong className="text-[#38302E]">{formatDate(channel.createdAt)}</strong>
            </span>
          </div>

          {/* Channel Description Preview */}
          <p className="text-xs sm:text-[13px] text-[#5C524C] leading-relaxed pt-1 line-clamp-3">
            {channel.description || 'Chưa có mô tả cho kênh podcast này.'}
          </p>
        </div>
      </div>
    </article>
  );
};
