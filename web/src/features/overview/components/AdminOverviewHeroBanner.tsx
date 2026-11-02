import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown';
import { getTodayFormatted } from '../overviewLogic';

interface AdminOverviewHeroBannerProps {
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
}

const DATE_PRESETS = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7days', label: '7 ngày qua' },
  { id: '30days', label: '30 ngày qua' },
  { id: 'thisMonth', label: 'Tháng này' },
  { id: 'allTime', label: 'Toàn thời gian' },
];

export const AdminOverviewHeroBanner: React.FC<AdminOverviewHeroBannerProps> = ({
  selectedRange = 'today',
  onRangeChange,
}) => {
  const [activeRange, setActiveRange] = useState(selectedRange);
  const todayFormatted = getTodayFormatted();

  const handleSelect = (id: string) => {
    setActiveRange(id);
    onRangeChange?.(id);
  };

  const currentLabel = DATE_PRESETS.find((p) => p.id === activeRange)?.label || 'Hôm nay';

  return (
    <div className="relative flex items-center justify-between py-2 select-none min-h-[145px] sm:min-h-[155px] overflow-hidden">
      {/* 1. Full-Width Heritage Panorama Artwork Backdrop (Pure painting: Sun, Swallows, Pagoda, Watercolor Mist - Zero Text) */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full select-none hidden md:block overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/admin-overview-hero-panorama.png?v=20261102d"
          alt=""
          className="h-full w-full object-cover object-[52%_center] opacity-95 select-none pointer-events-none"
        />
      </div>

      {/* 2. Left Column: Badge, Heading & Subtitle */}
      <div className="relative z-10 space-y-1.5 shrink-0 max-w-xl">
        {/* Badge: TỔNG QUAN HỆ THỐNG */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#B91C1C] tracking-wider uppercase">
          <svg
            className="h-4 w-4 text-[#B91C1C]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s-6-4.5-6-10a6 6 0 0 1 12 0c0 5.5-6 10-6 10z" />
            <path d="M12 11a3 3 0 0 0-3-3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3 3z" />
          </svg>
          <span>Tổng quan hệ thống</span>
        </div>

        {/* Large Serif Title */}
        <h1 className="font-serif text-[32px] sm:text-[34px] font-bold text-[#1C1917] tracking-tight leading-tight">
          Tổng quan Vận hành
        </h1>

        {/* Subtitle */}
        <p className="text-[13px] text-[#57534E] leading-relaxed font-sans max-w-xl">
          Bảng điều phối các hoạt động, kiểm duyệt và yêu cầu cần xử lý trên nền tảng Sử Ký.
        </p>
      </div>

      {/* 3. Right Side: Real HTML Title / Slogan Typography & Interactive Date Selector */}
      <div className="relative z-10 flex items-center justify-end gap-5 sm:gap-7 shrink-0">
        {/* Real HTML Calligraphic Slogan Typography (Vector, crisp on all resolutions) */}
        <div className="hidden xl:flex flex-col items-center justify-center text-center select-none pr-1">
          <span className="font-serif text-[15px] font-medium italic text-[#8B1D2C] tracking-wide leading-tight">
            “Bảo tồn lịch sử
          </span>
          <span className="font-serif text-[15px] font-semibold italic text-[#8B1D2C] tracking-wide leading-tight mt-0.5">
            Lan tỏa tri thức Việt”
          </span>
          <div className="mt-2.5 h-[2px] w-8 rounded-full bg-[#8B1D2C]" />
        </div>

        {/* Interactive Date Range Selector Dropdown */}
        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex items-center gap-3 rounded-xl border border-[#E0DDD7] bg-white px-3.5 py-2 shadow-2xs transition-all duration-150 hover:border-[#B91C1C]/40 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                aria-label="Chọn khoảng thời gian lọc dữ liệu"
              >
                <div className="flex items-center justify-center text-[#1C1917] group-hover:text-accent transition-colors">
                  <Calendar className="h-4 w-4" />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-medium text-[#78716C] leading-none">
                    {currentLabel}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1C1917] leading-tight mt-0.5">
                    {todayFormatted}
                  </span>
                </div>

                <ChevronDown className="h-4 w-4 text-[#78716C] group-hover:text-ink transition-transform duration-150 group-data-[state=open]:rotate-180 ml-1" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              {DATE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className="flex items-center justify-between text-xs cursor-pointer py-2"
                >
                  <span className={activeRange === preset.id ? 'font-bold text-accent' : 'text-ink'}>
                    {preset.label}
                  </span>
                  {activeRange === preset.id && (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
