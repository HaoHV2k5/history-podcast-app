import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Layers,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyMilestoneFinancialResponse } from '@/types/contract';
import { formatVND } from '@/utils/formatters';

interface CreatorMilestoneEarningsBannerProps {
  financials?: MyMilestoneFinancialResponse | null;
  isLoading?: boolean;
}

export const CreatorMilestoneEarningsBanner: React.FC<CreatorMilestoneEarningsBannerProps> = ({
  financials,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const totalReleased = financials?.totalEarned ?? 0;
  const totalPending = financials?.pendingEarnings ?? 0;
  const activeCount = financials?.activeMilestonesCount ?? 0;
  const completedCount = financials?.completedMilestonesCount ?? 0;
  const platformFee = financials?.totalPlatformFeePaid ?? 0;

  return (
    <article
      aria-label="Tổng kết doanh thu đơn đặt làm nội dung & hợp đồng Milestone"
      className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4 hover:border-stone-300 transition-all duration-200"
      data-motion-target="balance-card-item"
    >
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-200/60 text-accent">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base font-bold text-ink">
                Doanh Thu Đơn Đặt Nội Dung &amp; Hợp Đồng Milestone
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" />
                Escrow 95% / 5%
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Khoản tiền bảo chứng từ các đơn đặt hàng cá nhân hóa và hợp đồng nhiều kỳ.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/creator/commissions')}
          className="h-8.5 px-3.5 text-xs rounded-xl bg-accent text-white hover:bg-accent-hover font-semibold shadow-xs flex items-center gap-1.5 active:scale-[0.98] transition-all self-start sm:self-auto shrink-0"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Quản lý Đơn &amp; Hợp đồng</span>
          <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
        </Button>
      </div>

      {/* KPI Financial Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Thực nhận tích lũy (95%) */}
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-emerald-800 block truncate">
            Thực nhận đã tất toán (95%)
          </span>
          <span className="text-lg font-bold font-mono text-emerald-700 block truncate">
            {isLoading ? '---' : formatVND(totalReleased)}
          </span>
          <span className="text-[10px] text-emerald-600 block truncate">
            {completedCount} mốc đã giải ngân vào ví
          </span>
        </div>

        {/* Metric 2: Đang giữ trong Escrow */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-amber-800 block truncate">
            Đang giữ trong Escrow
          </span>
          <span className="text-lg font-bold font-mono text-amber-700 block truncate">
            {isLoading ? '---' : formatVND(totalPending)}
          </span>
          <span className="text-[10px] text-amber-600 block truncate">
            {activeCount} mốc đang làm / chờ nghiệm thu
          </span>
        </div>

        {/* Metric 3: Phí nền tảng đã đóng góp (5%) */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-stone-600 block truncate">
            Phí nền tảng đã trích (5%)
          </span>
          <span className="text-lg font-bold font-mono text-stone-700 block truncate">
            {isLoading ? '---' : formatVND(platformFee)}
          </span>
          <span className="text-[10px] text-stone-400 block truncate">
            Thu tự động khi hoàn thành mốc
          </span>
        </div>

        {/* Metric 4: Cam kết SLA & Chính sách rút tiền */}
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-blue-800 block truncate">
            Chính sách rút doanh thu
          </span>
          <span className="text-xs font-bold text-blue-900 block truncate flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            0% Phí • Tối thiểu 50k
          </span>
          <span className="text-[10px] text-blue-700 block truncate flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            SLA tối đa 2 ngày làm việc
          </span>
        </div>
      </div>
    </article>
  );
};
