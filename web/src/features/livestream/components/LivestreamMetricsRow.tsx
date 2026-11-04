import React from 'react';
import { Radio, Eye, Users, Layers, Activity } from 'lucide-react';
import { formatLivestreamViewerCount } from '../livestreamLogic';

interface LivestreamMetricsRowProps {
  liveCount: number;
  totalViewers: number;
  totalSessions: number;
  peakListeners?: number;
}

export const LivestreamMetricsRow: React.FC<LivestreamMetricsRowProps> = ({
  liveCount,
  totalViewers,
  totalSessions,
  peakListeners = 0,
}) => {
  return (
    <div
      aria-label="Thống kê tổng quan phát trực tiếp"
      className="rounded-2xl border border-[#E7E2D9] bg-[#FAF8F5]/95 p-4 sm:p-5 shadow-2xs"
    >
      {/* Plaque Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E7E2D9]/80">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[#8B2635]" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-[#736B63] uppercase">
            ✦ Chỉ Số Phát Sóng Trực Tiếp
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFEAE2] text-[#4A453F] border border-[#E2DDD5]">
            <span className={`h-1.5 w-1.5 rounded-full ${liveCount > 0 ? 'bg-[#8B2635] animate-ping' : 'bg-stone-400'}`} />
            {liveCount > 0 ? `${liveCount} luồng trực tiếp` : 'Sẵn sàng phát'}
          </span>
        </div>
      </div>

      {/* 4 Segmented Ledger Metrics Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x divide-[#E7E2D9]">
        {/* Metric 1: Đang phát sóng */}
        <div className="lg:px-4 first:lg:pl-0 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Radio className={`h-3.5 w-3.5 ${liveCount > 0 ? 'text-[#8B2635]' : 'text-stone-400'}`} />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Đang phát sóng
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-serif text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${liveCount > 0 ? 'text-[#8B2635]' : 'text-[#1C1917]'}`}>
              {liveCount}
            </span>
            <span className="text-[11px] text-[#736B63] font-sans">phiên live</span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            {liveCount > 0 ? 'Đang tương tác thời gian thực' : 'Chưa có phòng live mở'}
          </p>
        </div>

        {/* Metric 2: Tổng lượt xem */}
        <div className="lg:px-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Eye className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Tổng lượt xem
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#1C1917] tracking-tight">
              {formatLivestreamViewerCount(totalViewers)}
            </span>
            <span className="text-[11px] text-[#736B63] font-sans">lượt ghé thăm</span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            Tích lũy từ mọi phiên phát
          </p>
        </div>

        {/* Metric 3: Đỉnh điểm thính giả */}
        <div className="lg:px-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Users className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Đỉnh thính giả
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#1C1917] tracking-tight">
              {formatLivestreamViewerCount(peakListeners)}
            </span>
            <span className="text-[11px] text-[#736B63] font-sans">đồng thời cao nhất</span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            Kỷ lục lắng nghe cùng lúc
          </p>
        </div>

        {/* Metric 4: Tổng số phiên phát */}
        <div className="lg:px-4 last:lg:pr-0 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#736B63]">
              Tổng phiên live
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold tabular-nums text-[#1C1917] tracking-tight">
              {totalSessions}
            </span>
            <span className="text-[11px] text-[#736B63] font-sans">phiên tổ chức</span>
          </div>
          <p className="text-[11px] text-[#8C827A] pt-1">
            Đã lưu trữ vào lịch sử kênh
          </p>
        </div>
      </div>
    </div>
  );
};
