import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyMilestoneFinancialResponse } from '@/types/contract';
import { formatVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface CreatorMilestoneEarningsBannerProps {
  financials?: MyMilestoneFinancialResponse | null;
  isLoading?: boolean;
  className?: string;
}

export const CreatorMilestoneEarningsBanner: React.FC<CreatorMilestoneEarningsBannerProps> = ({
  financials,
  isLoading = false,
  className,
}) => {
  const navigate = useNavigate();

  const totalReleased = financials?.totalEarned ?? 0;
  const totalPending = financials?.pendingEarnings ?? 0;
  const activeCount = financials?.activeMilestonesCount ?? 0;
  const completedCount = financials?.completedMilestonesCount ?? 0;
  const platformFee = financials?.totalPlatformFeePaid ?? 0;
  const totalContractValue = totalReleased + totalPending + platformFee;

  return (
    <article
      data-ui="milestone-earnings-panel"
      data-motion-target="balance-card-item"
      aria-label="Tổng kết doanh thu đơn đặt làm nội dung & hợp đồng Milestone"
      className={cn(
        'rounded-2xl border border-[#E5E0D8] bg-white p-5 sm:p-7 shadow-2xs flex flex-col justify-between space-y-5',
        className
      )}
    >
      {/* Header: Title, Safe Escrow Badge & Nav Button */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-[#1F1A19]">
              Doanh Thu Hợp Đồng Milestone
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#168A4E] border border-[#C6EBD0]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#168A4E]" />
              Ký quỹ an toàn
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/creator/commissions')}
            className="h-8 px-2.5 text-xs text-[#981B1E] hover:text-[#801619] hover:bg-[#FAF8F5] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Quản lý</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-[#786D66]">
          Tiền bảo chứng từ các đơn đặt hàng cá nhân hóa &amp; hợp đồng nhiều kỳ.
        </p>
      </div>

      {/* 3-Row Clean Ledger Breakdown (Positive & Clear Metrics) */}
      <div className="space-y-2.5 py-1">
        {/* Row 1: Doanh thu đã giải ngân */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5]/80 border border-[#EFEAE2]">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-[#1F1A19] block">
              Doanh thu đã giải ngân
            </span>
            <span className="text-[11px] text-[#786D66] block">
              {completedCount} mốc đã chuyển vào ví
            </span>
          </div>
          <span className="font-serif text-base font-bold text-[#168A4E] tabular-nums">
            {isLoading ? '---' : formatVND(totalReleased)}
          </span>
        </div>

        {/* Row 2: Đang ký quỹ bảo chứng */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5]/80 border border-[#EFEAE2]">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-[#1F1A19] block">
              Đang ký quỹ bảo chứng
            </span>
            <span className="text-[11px] text-[#786D66] block">
              {activeCount} mốc đang làm / chờ nghiệm thu
            </span>
          </div>
          <span className="font-serif text-base font-bold text-[#B45309] tabular-nums">
            {isLoading ? '---' : formatVND(totalPending)}
          </span>
        </div>

        {/* Row 3: Tổng giá trị hợp đồng */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5]/80 border border-[#EFEAE2]">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-[#1F1A19] block">
              Tổng giá trị hợp đồng
            </span>
            <span className="text-[11px] text-[#786D66] block">
              Đã ký kết qua hệ thống bảo chứng
            </span>
          </div>
          <span className="font-serif text-base font-bold text-[#1F1A19] tabular-nums">
            {isLoading ? '---' : formatVND(totalContractValue)}
          </span>
        </div>
      </div>

      {/* Policy Footnote */}
      <div className="border-t border-[#EFEAE2] pt-3 text-[11px] text-[#786D66] leading-relaxed">
        Chính sách rút: 0% phí · Tối thiểu 50.000 đ · SLA xử lý tối đa 2 ngày làm việc.
      </div>
    </article>
  );
};
