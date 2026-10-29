import React from 'react';
import { BookOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className="relative overflow-hidden rounded-2xl border border-[#EBE4D8] bg-[#F7F2EA] p-6 sm:p-7 md:p-8 shadow-xs min-h-[195px] flex flex-col justify-center"
    >
      {/* Historical Landscape Panorama - Microphone, Ancient Scroll, Pagoda & Sun matching reference */}
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-3/5 lg:w-[55%] bg-contain bg-right bg-no-repeat pointer-events-none mix-blend-multiply opacity-95"
        style={{
          backgroundImage: `url('/assets/studio/series-hero-illustration.png')`,
        }}
        aria-hidden="true"
      />

      {/* Gentle Left Protective Wash for flawless text contrast */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/5 md:w-1/2 bg-gradient-to-r from-[#F7F2EA] via-[#F7F2EA]/95 via-60% to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col justify-center min-h-[140px]">
        <div className="space-y-2 max-w-xl">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2 text-[#A31D24]">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="font-serif text-xs font-bold tracking-wider uppercase">
              TUYỂN TẬP SỬ KÝ
            </span>
          </div>

          {/* Main Title & Count Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-[32px] font-bold tracking-tight text-[#1C1615] leading-tight">
              Tuyển tập tác phẩm
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#FDF2F2] px-3 py-0.5 text-xs font-semibold text-[#A31D24] border border-[#F8D7DA] shadow-2xs">
              {totalCount} tuyển tập
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#5C524F] leading-relaxed max-w-lg">
            Khám phá các tuyển tập podcast được tuyển chọn theo chủ đề và thời kỳ lịch sử,
            giúp bạn dễ dàng theo dõi và sáng tạo nội dung chất lượng hơn.
          </p>
        </div>
      </div>
    </section>
  );
};
