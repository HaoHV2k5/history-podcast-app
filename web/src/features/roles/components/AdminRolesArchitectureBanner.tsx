import React from 'react';
import { Info, Check } from 'lucide-react';

interface AdminRolesArchitectureBannerProps {
  onOpenLearnMore: () => void;
}

export const AdminRolesArchitectureBanner: React.FC<AdminRolesArchitectureBannerProps> = ({
  onOpenLearnMore,
}) => {
  return (
    <div className="rounded-2xl border border-[#EAE4DC] bg-[#F6F3EE] p-4 sm:p-5 space-y-3.5 font-sans">
      {/* Top Row: Title + Subtitle + Tìm hiểu thêm button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Info className="h-4 w-4 text-[#B91C1C] shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <h2 className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug">
              Nguyên tắc Phân quyền Đa vai trò trên Hệ thống
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed text-pretty">
              Hệ thống Sử Ký áp dụng mô hình phân quyền đa vai trò (nhiều - nhiều). Một tài khoản có thể đồng thời sở hữu nhiều vai trò, ví dụ vừa là{' '}
              <strong className="font-bold text-stone-800">Nhà sáng tạo</strong> vừa là{' '}
              <strong className="font-bold text-stone-800">Thuyết minh viên</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLearnMore}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all shadow-2xs shrink-0 cursor-pointer self-start sm:self-center"
        >
          <Info className="h-3.5 w-3.5 text-stone-500 shrink-0" />
          <span>Tìm hiểu thêm</span>
        </button>
      </div>

      {/* Bottom 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Vai trò chính */}
        <div className="rounded-xl border border-[#ECE7E0] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="h-8 w-8 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="text-xs font-bold text-stone-900 block">
              Vai trò chính của tài khoản
            </span>
            <p className="text-[11.5px] text-stone-500 leading-snug text-pretty">
              Được gắn trực tiếp trên hồ sơ tài khoản, dùng để xác định không gian làm việc mặc định khi người dùng đăng nhập.
            </p>
          </div>
        </div>

        {/* Card 2: Tập hợp vai trò */}
        <div className="rounded-xl border border-[#ECE7E0] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="h-8 w-8 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="text-xs font-bold text-stone-900 block">
              Tập hợp các vai trò kiêm nhiệm
            </span>
            <p className="text-[11.5px] text-stone-500 leading-snug text-pretty">
              Được lưu trong danh sách đa vai trò của tài khoản, cho phép người dùng mở khóa đồng thời đầy đủ các quyền hạn bổ sung.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
