import React from 'react';
import { Headphones, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChannelHelpCardProps {
  onContactClick?: () => void;
  className?: string;
}

export const ChannelHelpCard: React.FC<ChannelHelpCardProps> = ({
  onContactClick,
  className,
}) => {
  return (
    <aside
      aria-label="Cần hỗ trợ"
      className={cn(
        'relative rounded-2xl border border-[#F0E8DC] bg-[#FFFDFB] p-5 shadow-2xs overflow-hidden select-none',
        className
      )}
      data-motion-target="help"
    >
      {/* Historical Open Scroll / Book Watermark Illustration */}
      <div
        className="absolute -bottom-2 -right-3 h-28 w-36 pointer-events-none select-none opacity-40 mix-blend-multiply overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/kyc-approved-scroll-clean.png"
          alt=""
          className="h-full w-full object-contain object-bottom-right"
        />
      </div>

      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706]"
            aria-hidden="true"
          >
            <Headphones className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-serif text-sm font-bold text-[#843812]">
            Cần hỗ trợ?
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-[#5C524C] leading-relaxed max-w-[280px]">
          Nếu bạn có thắc mắc về việc thiết lập kênh hoặc gói hội viên, đội ngũ Sử Ký luôn sẵn sàng hỗ trợ.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onContactClick}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#38302E] shadow-2xs hover:bg-[#FAF8F5] hover:border-[#D6CEBF] transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A31D24]"
        >
          <Headphones className="h-3.5 w-3.5 text-[#786D66]" />
          <span>Liên hệ hỗ trợ</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#786D66]" />
        </button>
      </div>
    </aside>
  );
};
