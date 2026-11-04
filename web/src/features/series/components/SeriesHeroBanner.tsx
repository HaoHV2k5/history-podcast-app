import React from 'react';
import { BookOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeritageAtmosphereWatermark } from '@/components/common/HeritageAtmosphereWatermark';

interface SeriesHeroBannerProps {
  totalCount: number;
  onCreateClick: () => void;
}

export const SeriesHeroBanner: React.FC<SeriesHeroBannerProps> = ({
  totalCount,
  onCreateClick,
}) => {
  return (
    <section
      aria-label="Giới thiệu tuyển tập Sử Ký"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E2D9] bg-[#FAF8F5] p-6 sm:p-7 md:p-8 shadow-xs min-h-[175px] flex flex-col justify-center"
    >
      {/* Authentic Vietnamese Heritage Vector Watermark & Atmospheric Glow */}
      <HeritageAtmosphereWatermark
        tag="✦ ĐẠI VIỆT SỬ KÝ · TUYỂN TẬP CHUYÊN ĐỀ"
        variant="library"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Column: Masthead Titles */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAE2] border border-[#E2DDD5] text-[11px] font-semibold uppercase tracking-wider text-[#8B2635] font-sans w-fit">
            <BookOpen className="h-3 w-3 text-[#8B2635]" />
            <span>Tuyển Tập Chuyên Đề Sử Ký</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1C1917] leading-tight">
            Tuyển Tập Tác Phẩm
          </h1>

          <p className="text-xs sm:text-[13px] text-[#696660] leading-relaxed font-sans pt-0.5 max-w-lg">
            Khám phá các chuỗi podcast, trường ca lịch sử được tuyển chọn theo chủ đề và thời kỳ hoàng kim, giúp người nghe dễ dàng theo dõi liền mạch.
          </p>
        </div>

        {/* Right Column: Architectural Series Plaque & Creation Action */}
        <div className="rounded-2xl border border-[#E2DDD5] bg-white/85 backdrop-blur-xs p-4 sm:p-4.5 shadow-2xs shrink-0 flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-5">
          <div className="pr-4 sm:border-r border-[#EAE4D9]">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C7D70] block">
              Tổng số lưu trữ
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight tabular-nums">
                {totalCount}
              </span>
              <span className="text-[11px] text-[#A8A29E] font-sans">tuyển tập</span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onCreateClick}
            className="h-9 px-4 text-xs font-semibold bg-[#8B2635] hover:bg-[#731E2A] text-white shadow-xs rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98] gap-1.5"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Tạo tuyển tập mới</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
