import React from 'react';
import {
  Radio,
  PlusCircle,
  MessageSquare,
  BookOpen,
  Heart,
  Sparkles,
  CheckCircle2,
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
      className="relative overflow-hidden rounded-2xl border border-[#E7E2D9] bg-white p-5 sm:p-6 lg:p-7 shadow-xs"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        {/* Left Column: Call-to-action & core values */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
          {/* Top section: Radio badge, title & button */}
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Live broadcast seal */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FBF2EE] text-[#8B2635] border border-[#F0DDD8] shadow-2xs">
              <Radio className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.2] animate-pulse" />
            </div>

            {/* Title, description & CTA Button */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] text-[10px] font-mono font-bold uppercase tracking-wider text-[#736B63]">
                <Sparkles className="h-3 w-3 text-[#8B2635]" />
                <span>Trường Quay Trực Tiếp</span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] leading-snug">
                Bắt Đầu Phiên Phát Trực Tiếp Mới
              </h2>

              <p className="text-xs sm:text-[13px] text-[#696660] leading-relaxed max-w-xl">
                Mở phòng phát sóng âm thanh và hình ảnh để cùng cộng đồng thính giả bàn luận sâu sắc về các triều đại, chiến dịch hào hùng và nhân vật lịch sử Việt Nam.
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={onCreateClick}
                  className="gap-2 text-xs sm:text-sm h-10 px-5 bg-[#8B2635] hover:bg-[#731E2A] text-white font-semibold rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Tạo phiên Live ngay</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 3 Core Value Items */}
          <div className="pt-3 border-t border-[#E7E2D9]/70 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/70 px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FBF2EE] text-[#8B2635]">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#1C1917] leading-tight">Tương tác thực</p>
                <p className="text-[10px] text-[#8C827A] truncate">Trò chuyện cùng thính giả</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/70 px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FBF2EE] text-[#8B2635]">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#1C1917] leading-tight">Chính sử chuẩn xác</p>
                <p className="text-[10px] text-[#8C827A] truncate">Cung cấp tri thức hào hùng</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/70 px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FBF2EE] text-[#8B2635]">
                <Heart className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#1C1917] leading-tight">Cộng đồng bền vững</p>
                <p className="text-[10px] text-[#8C827A] truncate">Gắn kết người yêu sử</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Suggested Topics Card */}
        <div className="lg:col-span-4 rounded-xl border border-[#E7E2D9] bg-[#FAF8F5] p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D9]">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#8B2635]" />
                <span className="font-mono text-[11px] font-bold tracking-wider text-[#1C1917] uppercase">
                  Gợi Ý Đàm Đạo
                </span>
              </div>
              <span className="text-[10px] text-[#8C827A] font-medium">Chủ đề thịnh hành</span>
            </div>

            <ul className="space-y-2 text-xs text-[#2C2825]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2635] shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#4A453F] leading-snug">
                  Đại phá quân Nguyên Mông &amp; Hào khí Đông A
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2635] shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#4A453F] leading-snug">
                  Chiếu dời đô 1010 và định hình Thăng Long
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2635] shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#4A453F] leading-snug">
                  Phòng tuyến Như Nguyệt &amp; Bản tuyên ngôn Nam Quốc Sơn Hà
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2635] shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#4A453F] leading-snug">
                  Giải đáp câu hỏi và giao lưu cùng thính giả
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#E7E2D9] mt-3 flex items-center justify-between text-[11px] text-[#736B63]">
            <span>Độ dài đề xuất: 45 - 90 phút</span>
            <span className="font-mono font-semibold text-[#8B2635]">Live HD 1080p</span>
          </div>
        </div>
      </div>
    </section>
  );
};
