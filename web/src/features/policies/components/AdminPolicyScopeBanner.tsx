import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface AdminPolicyScopeBannerProps {
  onOpenLearnMore: () => void;
}

export const AdminPolicyScopeBanner: React.FC<AdminPolicyScopeBannerProps> = ({
  onOpenLearnMore,
}) => {
  return (
    <div className="rounded-2xl border border-[#EAE4DC] bg-[#F7F4F0] px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
        <div
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white border border-[#F2E2E2] shadow-2xs flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <ShieldAlert className="h-5 w-5 text-[#B91C1C]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[13.5px] sm:text-sm font-bold text-stone-900 leading-snug text-pretty">
            Phạm vi cấu hình phân quyền quản trị
          </h2>
          <p className="text-xs sm:text-[13px] text-stone-500 mt-0.5 leading-relaxed text-pretty">
            Thiết lập ngưỡng kiểm duyệt nội dung cho 4 phân tầng của AI Shield. Các phân hệ kỹ thuật và email thông báo được quản lý theo tiêu chuẩn nội bộ.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={onOpenLearnMore}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-2 min-h-[38px] text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-[transform,background-color,border-color] duration-150 ease-out shadow-2xs shrink-0 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]"
        >
          <Info className="h-3.5 w-3.5 text-stone-500 shrink-0" />
          <span>Tìm hiểu thêm</span>
        </button>
      </div>
    </div>
  );
};

