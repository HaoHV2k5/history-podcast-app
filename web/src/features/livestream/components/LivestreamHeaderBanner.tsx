import React from 'react';
import { RefreshCw, Radio, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeritageAtmosphereWatermark } from '@/components/common/HeritageAtmosphereWatermark';

interface LivestreamHeaderBannerProps {
  onRefresh: () => void;
  onCreateClick: () => void;
  isFetching?: boolean;
}

export const LivestreamHeaderBanner: React.FC<LivestreamHeaderBannerProps> = ({
  onRefresh,
  onCreateClick,
  isFetching = false,
}) => {
  return (
    <section
      aria-label="Quản lý phát trực tiếp Sử Ký"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E2D9] bg-[#FAF8F5] p-6 sm:p-7 md:p-8 shadow-xs min-h-[175px] flex flex-col justify-center"
    >
      {/* Authentic Vietnamese Heritage Vector Watermark & Atmospheric Glow */}
      <HeritageAtmosphereWatermark
        tag="✦ SỬ KÝ STUDIO · TRƯỜNG QUAY TRỰC TIẾP"
        variant="studio"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Column: Masthead Titles */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAE2] border border-[#E2DDD5] text-[11px] font-semibold uppercase tracking-wider text-[#8B2635] font-sans w-fit">
            <Radio className="h-3 w-3 text-[#8B2635] animate-pulse" />
            <span>Diễn Đàn Trực Tiếp · Sử Ký Studio</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1C1917] leading-tight">
            Quản Lý Phát Trực Tiếp
          </h1>

          <p className="text-xs sm:text-[13px] text-[#696660] leading-relaxed font-sans pt-0.5 max-w-lg">
            Khởi tạo và điều phối các buổi đàm đạo podcast lịch sử trực tiếp, giao lưu và tương tác thời gian thực với cộng đồng thính giả Đại Việt.
          </p>
        </div>

        {/* Right Column: Actions */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="gap-2 text-xs h-10 px-4 bg-white/90 hover:bg-[#F5F2EC] text-[#2C2825] border-[#D9D3C7] shadow-2xs transition-all duration-150 active:scale-[0.98] rounded-xl font-medium"
            title="Làm mới danh sách phiên phát trực tiếp"
            aria-label="Làm mới danh sách phiên phát trực tiếp"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#5C524F] ${isFetching ? 'animate-spin text-[#8B2635]' : ''}`}
            />
            <span>Làm mới</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onCreateClick}
            className="gap-2 text-xs h-10 px-5 bg-[#8B2635] hover:bg-[#731E2A] text-white font-semibold rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98]"
            aria-label="Tạo phiên Live mới"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo phiên Live mới</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
