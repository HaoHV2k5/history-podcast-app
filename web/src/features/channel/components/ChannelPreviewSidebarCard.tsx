import React from 'react';
import { Award, CheckCircle2, Play } from 'lucide-react';
import { ChannelItem } from '@/types/channel';
import { ChannelBrandLogo } from './ChannelBrandLogo';
import { cn } from '@/utils/cn';

interface ChannelPreviewSidebarCardProps {
  channel: ChannelItem;
  totalEpisodes?: number;
  completedEpisodes?: number;
  onPreviewClick?: () => void;
  onListenClick?: () => void;
  className?: string;
}

export const ChannelPreviewSidebarCard: React.FC<ChannelPreviewSidebarCardProps> = ({
  channel,
  totalEpisodes = 0,
  completedEpisodes = 0,
  onPreviewClick,
  onListenClick,
  className,
}) => {
  // Generate clean handle from channel name
  const handle = `@${(channel.name || 'daivietsuky')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')}`;

  return (
    <article
      aria-label="Xem trước Kênh của bạn"
      className={cn(
        'relative rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-2xs space-y-4',
        className
      )}
      data-motion-target="preview"
    >
      {/* Header with Title and Platform Preview Action */}
      <div className="flex items-center justify-between gap-2 border-b border-[#F0EBE1] pb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Award className="h-4 w-4 text-[#A31D24] shrink-0" />
          <h3 className="font-serif text-sm font-bold text-[#1F1A19] truncate">
            Xem trước Kênh của bạn
          </h3>
        </div>

        {/* Outline Action Button */}
        <button
          type="button"
          onClick={onPreviewClick}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E0D8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#38302E] shadow-2xs hover:bg-[#FAF8F5] hover:border-[#D6CEBF] transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]"
        >
          <span>Xem trên nền tảng</span>
        </button>
      </div>

      {/* Embedded Live Platform Card Simulation */}
      <div className="rounded-xl border border-[#EFE9DF] bg-[#FAF8F5] overflow-hidden shadow-2xs">
        {/* Cover Landscape Banner */}
        <div className="relative h-28 sm:h-32 w-full bg-[#E8DDD2] overflow-hidden">
          {channel.coverUrl ? (
            <img
              src={channel.coverUrl}
              alt={channel.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src="/assets/studio/header-landscape-warm.png"
              alt=""
              className="h-full w-full object-cover object-center opacity-85"
            />
          )}

          {/* Soft vignette gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-black/20 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Channel Profile Content */}
        <div className="px-4 pb-4 pt-0 text-center relative">
          {/* Overlapping Centered Avatar */}
          <div className="flex justify-center -mt-10 sm:-mt-12 mb-2 relative z-10">
            <div className="rounded-2xl p-1 bg-[#FAF8F5] shadow-xs">
              <ChannelBrandLogo
                avatarUrl={channel.avatarUrl}
                name={channel.name}
                size="md"
                className="h-20 w-20 sm:h-22 sm:w-22 rounded-xl"
              />
            </div>
          </div>

          {/* Name & Handle */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <h4 className="font-serif text-base sm:text-lg font-bold text-[#1F1A19] truncate max-w-[220px]">
                {channel.name}
              </h4>
              <CheckCircle2 className="h-4 w-4 text-[#168A4E] shrink-0 fill-[#EDFDF2]" />
            </div>

            <p className="text-xs text-[#786D66] font-mono">{handle}</p>
          </div>

          {/* Bio snippet */}
          <p className="mt-2 text-xs text-[#5C524C] leading-relaxed line-clamp-3 px-1 text-center">
            {channel.description ||
              'Kênh podcast chuyên sâu về lịch sử và các chiến dịch dựng nước, giữ nước của dân tộc Việt Nam. Được bảo trợ bởi Sử Ký Studio.'}
          </p>

          {/* 3 Metric Columns: 100% Real System Data */}
          <div className="grid grid-cols-3 gap-2 border-y border-[#EBE4D8] py-2.5 my-3.5 bg-white/70 rounded-lg">
            <div className="text-center">
              <span className="block font-serif text-base font-bold text-[#1F1A19] tabular-nums">
                {totalEpisodes}
              </span>
              <span className="block text-[10.5px] text-[#786D66] font-medium">
                Tập podcast
              </span>
            </div>
            <div className="text-center border-x border-[#EBE4D8]">
              <span className="block font-serif text-base font-bold text-[#1F1A19] tabular-nums">
                {completedEpisodes}
              </span>
              <span className="block text-[10.5px] text-[#786D66] font-medium">
                Đã hoàn tất
              </span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xs sm:text-sm font-bold text-[#168A4E] truncate pt-0.5">
                {channel.status === 'ACTIVE' ? 'Hoạt động' : channel.status || 'Chờ duyệt'}
              </span>
              <span className="block text-[10.5px] text-[#786D66] font-medium">
                Trạng thái
              </span>
            </div>
          </div>

          {/* Play/Listen Button */}
          <button
            type="button"
            onClick={onListenClick}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#A31D24] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[#85171D] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24] focus-visible:ring-offset-1"
          >
            <Play className="h-4 w-4 fill-white text-white" />
            <span>Nghe kênh</span>
          </button>
        </div>
      </div>
    </article>
  );
};
