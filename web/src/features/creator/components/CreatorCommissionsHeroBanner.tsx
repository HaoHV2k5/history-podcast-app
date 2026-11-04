import React from 'react';
import { ShieldCheck, ScrollText, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { HeritageAtmosphereWatermark } from '@/components/common/HeritageAtmosphereWatermark';

interface CreatorCommissionsHeroBannerProps {
  className?: string;
}

export const CreatorCommissionsHeroBanner: React.FC<CreatorCommissionsHeroBannerProps> = ({
  className,
}) => {
  return (
    <header
      aria-label="Tiêu đề Đơn Đặt Hàng & Lộ Trình Milestone"
      className={cn(
        'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E2D9] bg-[#FAF8F5] p-6 sm:p-7 md:p-8 shadow-xs min-h-[175px] flex flex-col justify-center',
        className
      )}
      data-motion-target="commissions-hero"
    >
      {/* Authentic Vietnamese Heritage Vector Watermark & Atmospheric Glow */}
      <HeritageAtmosphereWatermark
        tag="✦ SỬ KÝ STUDIO · HỢP ĐỒNG & KÝ QUỸ"
        variant="library"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Column: Masthead Titles */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEAE2] border border-[#E2DDD5] text-[11px] font-semibold uppercase tracking-wider text-[#8B2635] font-sans w-fit">
            <ScrollText className="h-3 w-3 text-[#8B2635]" />
            <span>Hợp Đồng &amp; Ký Quỹ Đặt Hàng</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1C1917] leading-tight">
            Đơn Đặt Hàng &amp; Hợp Đồng
          </h1>

          <p className="text-xs sm:text-[13px] text-[#696660] leading-relaxed font-sans pt-0.5 max-w-xl">
            Tiếp nhận yêu cầu nội dung từ khán giả, trao đổi trực tiếp, thiết lập lộ trình ký quỹ Escrow minh bạch và bàn giao nghiệm thu từng mốc sản phẩm.
          </p>
        </div>

        {/* Right Column: Escrow Trust Seal Plaque */}
        <div className="self-start lg:self-center shrink-0">
          <div className="rounded-2xl border border-[#E7E2D9] bg-white/90 p-4 shadow-2xs max-w-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FBF2EE] text-[#8B2635] border border-[#F0DDD8]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#1C1917] leading-none">Bảo Chứng Ký Quỹ Escrow</p>
                <p className="text-[10px] text-[#736B63] pt-0.5">An toàn tuyệt đối cho Nhà sáng tạo</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E7E2D9] text-[11px] text-[#5A534D] space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[#8B2635]" />
                <span>Tiền ký quỹ khóa an toàn trước khi bấm máy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#8B2635]" />
                <span>Tự động giải ngân theo từng Milestone nghiệm thu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
