import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import type { WalletTransactionItem } from '@/types/transaction';
import {
  buildBalanceChartData,
  BalanceChartPoint,
} from '../balanceChartLogic';
import { cn } from '@/utils/cn';
import gsap from 'gsap';

interface WalletBalanceChartProps {
  transactions: WalletTransactionItem[];
  className?: string;
}

export const WalletBalanceChart: React.FC<WalletBalanceChartProps> = ({
  transactions,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotsGroupRef = useRef<SVGGElement>(null);

  const [activePoint, setActivePoint] = useState<BalanceChartPoint | null>(null);

  const chartData = useMemo(() => {
    return buildBalanceChartData(transactions, 800, 240, {
      top: 30,
      right: 35,
      bottom: 35,
      left: 65,
    });
  }, [transactions]);

  // GSAP Path Draw & Point Reveal Animation
  useEffect(() => {
    const pathEl = pathRef.current;
    const areaEl = areaRef.current;
    const dotsEl = dotsGroupRef.current;

    if (!pathEl || chartData.points.length === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    try {
      const length = pathEl.getTotalLength();
      if (length > 0) {
        gsap.fromTo(
          pathEl,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration: 0.85, ease: 'power2.out' }
        );
      }
    } catch {
      // Fallback for non-rendered SVG geometry
    }

    if (areaEl) {
      gsap.fromTo(
        areaEl,
        { opacity: 0 },
        { opacity: 0.1, duration: 0.7, delay: 0.15, ease: 'power1.out' }
      );
    }

    if (dotsEl && dotsEl.children.length > 0) {
      gsap.fromTo(
        dotsEl.children,
        { scale: 0, opacity: 0, transformOrigin: 'center' },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          stagger: 0.03,
          ease: 'back.out(1.8)',
          delay: 0.2,
        }
      );
    }
  }, [chartData]);

  const formatVND = (num: number) => {
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  if (transactions.length === 0) {
    return (
      <div
        className={cn(
          'p-10 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]',
          className
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EBE4D8] flex items-center justify-center text-[#786D66] shadow-2xs">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h4 className="font-serif text-sm font-bold text-[#1F1A19]">
            Chưa có đủ dữ liệu biến động để vẽ biểu đồ
          </h4>
          <p className="text-xs text-[#786D66] leading-relaxed">
            Các phiên nạp tiền, rút tiền và nhận giải ngân sẽ được tự động mô phỏng thành đường xu hướng tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-ui="wallet-balance-chart"
      className={cn('p-5 sm:p-6 space-y-5', className)}
    >
      {/* ─── 1. Financial KPI Summary Header ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pb-4 border-b border-[#EFEAE2]">
        {/* KPI 1: Inflow */}
        <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#786D66]">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#168A4E]" />
            <span>Tổng tiền vào</span>
          </div>
          <div className="font-serif text-sm sm:text-base font-bold text-[#168A4E] tabular-nums">
            + {formatVND(chartData.totalInflow)}
          </div>
        </div>

        {/* KPI 2: Outflow */}
        <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#786D66]">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#981B1E]" />
            <span>Tổng tiền ra</span>
          </div>
          <div className="font-serif text-sm sm:text-base font-bold text-[#981B1E] tabular-nums">
            - {formatVND(chartData.totalOutflow)}
          </div>
        </div>

        {/* KPI 3: Net change */}
        <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#786D66]">
            <TrendingUp className="w-3.5 h-3.5 text-[#1F1A19]" />
            <span>Biến động ròng</span>
          </div>
          <div
            className={cn(
              'font-serif text-sm sm:text-base font-bold tabular-nums',
              chartData.netChange >= 0 ? 'text-[#168A4E]' : 'text-[#981B1E]'
            )}
          >
            {chartData.netChange >= 0 ? '+ ' : ''}
            {formatVND(chartData.netChange)}
          </div>
        </div>

        {/* KPI 4: Transaction count */}
        <div className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/80 p-3 space-y-1">
          <div className="text-[11px] font-medium text-[#786D66]">
            Số phiên biến động
          </div>
          <div className="font-serif text-sm sm:text-base font-bold text-[#1F1A19] tabular-nums">
            {chartData.transactionCount} giao dịch
          </div>
        </div>
      </div>

      {/* ─── 2. Interactive SVG Trend Canvas ─── */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox="0 0 800 240"
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseLeave={() => setActivePoint(null)}
          aria-label="Biểu đồ biến động số dư theo thời gian"
          role="img"
        >
          <defs>
            {/* Soft vertical gradient for area fill under the trend line */}
            <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#168A4E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#168A4E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Y-Grid lines and values */}
          {chartData.yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={65}
                y1={tick.y}
                x2={765}
                y2={tick.y}
                stroke="#EFEAE2"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={55}
                y={tick.y + 3}
                textAnchor="end"
                className="text-[10px] fill-[#786D66] font-medium tabular-nums"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area under the line */}
          {chartData.svgAreaPath && (
            <path
              ref={areaRef}
              d={chartData.svgAreaPath}
              fill="url(#balanceAreaGrad)"
            />
          )}

          {/* The Trend Line */}
          {chartData.svgLinePath && (
            <path
              ref={pathRef}
              d={chartData.svgLinePath}
              fill="none"
              stroke="#168A4E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active Hover Guide Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={30}
              x2={activePoint.x}
              y2={205}
              stroke="#981B1E"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points on the line */}
          <g ref={dotsGroupRef}>
            {chartData.points.map((pt) => {
              const isActive = activePoint?.id === pt.id;
              return (
                <g
                  key={pt.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setActivePoint(pt)}
                >
                  {/* Invisible larger hover hit area */}
                  <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

                  {/* Outer ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 6 : 4}
                    fill="#FFFFFF"
                    stroke={pt.isPositive ? '#168A4E' : '#981B1E'}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-[r,stroke-width] duration-150"
                  />

                  {/* Inner dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 2.5 : 1.5}
                    fill={pt.isPositive ? '#168A4E' : '#981B1E'}
                  />
                </g>
              );
            })}
          </g>

          {/* X-Axis bottom date labels */}
          {chartData.points.map((pt, idx) => {
            // Show label for first, last, and every few points to avoid crowding
            const total = chartData.points.length;
            const step = Math.max(1, Math.floor(total / 6));
            const shouldShow =
              idx === 0 || idx === total - 1 || idx % step === 0;

            if (!shouldShow) return null;

            return (
              <text
                key={pt.id}
                x={pt.x}
                y={225}
                textAnchor="middle"
                className="text-[10px] fill-[#786D66] font-medium tabular-nums"
              >
                {pt.formattedDate}
              </text>
            );
          })}
        </svg>

        {/* ─── 3. Floating Tooltip Popover ─── */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-20 top-2 rounded-xl border border-[#DDD7CD] bg-white p-2.5 shadow-md text-xs space-y-1 transform -translate-x-1/2 min-w-[190px]"
            style={{
              left: `${(activePoint.x / 800) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#EFEAE2] pb-1">
              <span className="text-[10px] font-semibold text-[#786D66] tabular-nums">
                {activePoint.formattedDate} • {activePoint.formattedTime}
              </span>
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.2 rounded-full border',
                  activePoint.isPositive
                    ? 'bg-[#EDFDF2] text-[#168A4E] border-[#A6E9B9]'
                    : 'bg-[#FFF8F8] text-[#981B1E] border-[#F9D2D4]'
                )}
              >
                {activePoint.typeLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] text-[#786D66]">Biến động:</span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  activePoint.isPositive ? 'text-[#168A4E]' : 'text-[#981B1E]'
                )}
              >
                {activePoint.isPositive ? '+ ' : '- '}
                {formatVND(Math.abs(activePoint.amount))}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[#786D66]">Số dư sau GD:</span>
              <span className="font-bold text-[#1F1A19] tabular-nums">
                {formatVND(activePoint.cumulativeBalance)}
              </span>
            </div>

            <p className="text-[10px] text-[#786D66] truncate pt-0.5 italic">
              {activePoint.description}
            </p>
          </div>
        )}
      </div>

      {/* Chart Footer Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-[#EFEAE2] text-[11px] text-[#786D66]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#168A4E] rounded-full" />
            <span>Đường xu hướng số dư</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#168A4E] border border-white" />
            <span>Tiền vào (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#981B1E] border border-white" />
            <span>Tiền ra (-)</span>
          </div>
        </div>
        <span className="italic text-[10px]">
          Rê chuột vào điểm dữ liệu để xem chi tiết
        </span>
      </div>
    </div>
  );
};

