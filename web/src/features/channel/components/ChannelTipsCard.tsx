import React from 'react';
import { Lightbulb, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChannelTipsCardProps {
  className?: string;
}

const OPTIMIZATION_TIPS = [
  'Sử dụng ảnh bìa kích thước 16:9, tối thiểu 1920x1080.',
  'Mô tả kênh ngắn gọn, thể hiện chủ đề và giá trị cốt lõi.',
  'Thiết lập gói hội viên với đặc quyền hấp dẫn.',
  'Cập nhật thông tin liên tục để thu hút thính giả.',
];

export const ChannelTipsCard: React.FC<ChannelTipsCardProps> = ({ className }) => {
  return (
    <aside
      aria-label="Mẹo tối ưu kênh"
      className={cn(
        'rounded-2xl border border-[#F5E8DC] bg-[#FFFBF7] p-5 shadow-2xs space-y-3.5 select-none',
        className
      )}
      data-motion-target="tips"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#F5EAE0] pb-2.5">
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#FEF3C7] text-[#D97706]"
          aria-hidden="true"
        >
          <Lightbulb className="h-3.5 w-3.5 fill-[#D97706]" />
        </div>
        <h3 className="font-serif text-sm font-bold text-[#843812]">
          Mẹo tối ưu kênh
        </h3>
      </div>

      {/* 4 Checklist Points */}
      <ul className="space-y-2.5">
        {OPTIMIZATION_TIPS.map((tip, index) => (
          <li key={index} className="flex items-start gap-2.5">
            {/* Solid crimson circular checkmark */}
            <div
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#A31D24] text-white shadow-2xs mt-0.5"
              aria-hidden="true"
            >
              <Check className="h-2.5 w-2.5 stroke-[2.5]" />
            </div>
            <span className="text-xs text-[#38302E] font-medium leading-snug">
              {tip}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
