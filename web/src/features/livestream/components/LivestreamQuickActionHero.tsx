import React from 'react';
import {
  Radio,
  PlusCircle,
  MessageSquare,
  BookOpen,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivestreamQuickActionHeroProps {
  onCreateClick: () => void;
}

export const LivestreamQuickActionHero: React.FC<LivestreamQuickActionHeroProps> = ({
  onCreateClick,
}) => {
  return (
    <section
      aria-label="Khởi tạo phiên phát trực tiếp mới"
      className="rounded-2xl border border-[#EDE6DD] bg-gradient-to-r from-[#FFF5F4] via-[#FAF7F2] to-[#F6F1EB] p-5 sm:p-6 lg:p-7 shadow-xs relative overflow-hidden"
    >
      {/* Historical Pagoda Artwork faintly in background between left CTA and right card */}
      <div
        className="absolute right-[32%] sm:right-[34%] md:right-[35%] lg:right-[36%] top-4 sm:top-5 w-56 sm:w-64 lg:w-72 h-44 sm:h-52 lg:h-56 bg-contain bg-center bg-no-repeat pointer-events-none mix-blend-multiply opacity-45 select-none"
        style={{
          backgroundImage: `url('/assets/studio/livestream-hero-pagoda.png?v=5')`,
        }}
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-stretch relative z-10">
        {/* Left Column: Call-to-action & core values */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
          {/* Top section: Radio icon on left, title & button on right */}
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Big circular live broadcast icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27] border border-[#F8D7DA] shadow-2xs">
              <Radio className="h-7 w-7 stroke-[2.2]" />
            </div>

            {/* Title, description & CTA Button */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#A11C27]">
                Bắt đầu phiên phát trực tiếp mới
              </h2>
              <p className="text-xs sm:text-[13px] xl:text-sm text-[#5C524F] leading-relaxed xl:whitespace-nowrap text-pretty">
                Chia sẻ kiến thức lịch sử, thảo luận cùng cộng đồng thính giả theo thời&nbsp;gian&nbsp;thực.
              </p>

              {/* CTA Button */}
              <div className="pt-2 sm:pt-2.5">
                <Button
                  type="button"
                  onClick={onCreateClick}
                  className="gap-2 text-xs sm:text-sm h-10 px-5 bg-[#A11C27] hover:bg-[#85151E] text-white font-semibold rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Tạo phiên Live mới</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 3 Core Value Items - Always in 1 Single Horizontal Row without divider line */}
          <div className="pt-2 grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 items-center">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27]">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-[#3E3836] leading-tight text-pretty">
                Tương tác trực tiếp<br className="hidden sm:inline" /> với thính giả
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27]">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-[#3E3836] leading-tight text-pretty">
                Chia sẻ kiến thức<br className="hidden sm:inline" /> lịch sử
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27]">
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-[#3E3836] leading-tight text-pretty">
                Xây dựng cộng đồng<br className="hidden sm:inline" /> yêu sử
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Suggested Topics Card with Ink & Scroll Illustration */}
        <div className="lg:col-span-4 relative overflow-hidden rounded-2xl border border-[#EDE6DD] bg-white p-5 sm:p-5 shadow-2xs flex flex-col justify-between">
          {/* Ancient Inks, Scroll and Brush Artwork in bottom-right corner */}
          <div
            className="absolute right-0 bottom-0 w-64 sm:w-72 md:w-80 h-44 sm:h-52 md:h-56 bg-contain bg-right-bottom bg-no-repeat pointer-events-none mix-blend-multiply opacity-95 select-none"
            style={{
              backgroundImage: `url('/assets/studio/livestream-quick-action-brushes.png?v=5')`,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center gap-2 text-[#A11C27]">
              <BookOpen className="h-4 w-4 shrink-0 stroke-[2.2]" />
              <h3 className="font-bold text-sm sm:text-base text-[#1C1615] tracking-tight">
                Gợi ý nội dung Live
              </h3>
            </div>
            <p className="text-xs text-[#6B6360] whitespace-nowrap">
              Một số chủ đề phổ biến được cộng đồng quan tâm:
            </p>

            <ul className="space-y-2 pt-1 text-xs text-[#2E2827]">
              <li className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27] text-[9px] font-bold">
                  ✓
                </span>
                <span className="font-medium text-[#2E2827] whitespace-nowrap">Phân tích trận chiến lịch sử</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27] text-[9px] font-bold">
                  ✓
                </span>
                <span className="font-medium text-[#2E2827] whitespace-nowrap">Đàm đạo nhân vật lịch sử nổi bật</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27] text-[9px] font-bold">
                  ✓
                </span>
                <span className="font-medium text-[#2E2827] whitespace-nowrap">Giải đáp câu hỏi từ thính giả</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#FCEBEB] text-[#A11C27] text-[9px] font-bold">
                  ✓
                </span>
                <span className="font-medium text-[#2E2827] whitespace-nowrap">Thảo luận các góc nhìn lịch sử thú vị</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
