import React from 'react';
import { Radio, Eye, Users, Layers } from 'lucide-react';
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Đang phát sóng */}
      <div className="group rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D6CCC2] flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FDF2F2] text-[#A11C27] border border-[#F8D7DA] transition-transform duration-200 group-hover:scale-105">
          <Radio className={`h-5 w-5 ${liveCount > 0 ? 'animate-pulse' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-[#786F6B]">
            Đang phát sóng
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-2xl font-bold text-[#1C1615] font-mono tabular-nums">
              {liveCount}
            </span>
            <span className="text-xs text-[#786F6B]">phiên live</span>
          </div>
        </div>
      </div>

      {/* 2. Tổng lượt xem */}
      <div className="group rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D6CCC2] flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] transition-transform duration-200 group-hover:scale-105">
          <Eye className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-[#786F6B]">
            Tổng lượt xem
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-2xl font-bold text-[#1C1615] font-mono tabular-nums">
              {formatLivestreamViewerCount(totalViewers)}
            </span>
            <span className="text-xs text-[#786F6B]">lượt (tất cả phiên)</span>
          </div>
        </div>
      </div>

      {/* 3. Tổng thính giả */}
      <div className="group rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D6CCC2] flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] transition-transform duration-200 group-hover:scale-105">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-[#786F6B]">
            Tổng thính giả
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-2xl font-bold text-[#1C1615] font-mono tabular-nums">
              {formatLivestreamViewerCount(peakListeners)}
            </span>
            <span className="text-xs text-[#786F6B]">người (đỉnh cao nhất)</span>
          </div>
        </div>
      </div>

      {/* 4. Tổng số phiên Live */}
      <div className="group rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D6CCC2] flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] transition-transform duration-200 group-hover:scale-105">
          <Layers className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-[#786F6B]">
            Tổng số phiên Live
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-2xl font-bold text-[#1C1615] font-mono tabular-nums">
              {totalSessions}
            </span>
            <span className="text-xs text-[#786F6B]">phiên đã phát</span>
          </div>
        </div>
      </div>
    </div>
  );
};
