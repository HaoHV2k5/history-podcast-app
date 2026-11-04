import type { WalletTransactionItem } from '../../types/transaction.ts';
import { formatTransactionBadge } from './financeLogic.ts';

export interface BalanceChartPoint {
  id: number;
  date: string;
  formattedDate: string;
  formattedTime: string;
  type: string;
  typeLabel: string;
  description: string;
  amount: number;
  isPositive: boolean;
  cumulativeBalance: number;
  x: number;
  y: number;
}

export interface BalanceChartData {
  points: BalanceChartPoint[];
  totalInflow: number;
  totalOutflow: number;
  netChange: number;
  transactionCount: number;
  minBalance: number;
  maxBalance: number;
  svgLinePath: string;
  svgAreaPath: string;
  yTicks: { value: number; label: string; y: number }[];
}

/**
 * Formats a currency amount into a compact readable string (e.g. 50k, 1.2M, 500.000 đ)
 */
export function formatCompactVND(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const formatted = (value / 1_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    });
    return `${formatted}M đ`;
  }
  if (abs >= 1_000) {
    const formatted = (value / 1_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 0,
    });
    return `${formatted}k đ`;
  }
  return `${value.toLocaleString('vi-VN')} đ`;
}

/**
 * Builds points and coordinates for an SVG balance trend chart from transaction items.
 */
export function buildBalanceChartData(
  transactions: WalletTransactionItem[],
  width = 800,
  height = 240,
  padding = { top: 25, right: 30, bottom: 35, left: 60 }
): BalanceChartData {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      points: [],
      totalInflow: 0,
      totalOutflow: 0,
      netChange: 0,
      transactionCount: 0,
      minBalance: 0,
      maxBalance: 0,
      svgLinePath: '',
      svgAreaPath: '',
      yTicks: [],
    };
  }

  // 1. Sort transactions chronologically (oldest to newest)
  const sorted = [...transactions].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  let runningBalance = 0;
  let totalInflow = 0;
  let totalOutflow = 0;

  // Compute running balance & inflow/outflow
  const rawPoints = sorted.map((tx) => {
    const badge = formatTransactionBadge(tx.type);
    const isPositive = tx.amount > 0 || badge.isPositive;
    const absAmount = Math.abs(tx.amount);

    if (isPositive) {
      totalInflow += absAmount;
      runningBalance += absAmount;
    } else {
      totalOutflow += absAmount;
      runningBalance = Math.max(0, runningBalance - absAmount);
    }

    const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
    const formattedDate = !isNaN(txDate.getTime())
      ? `${String(txDate.getDate()).padStart(2, '0')}/${String(
          txDate.getMonth() + 1
        ).padStart(2, '0')}`
      : '--/--';
    const formattedTime = !isNaN(txDate.getTime())
      ? `${String(txDate.getHours()).padStart(2, '0')}:${String(
          txDate.getMinutes()
        ).padStart(2, '0')}`
      : '--:--';

    return {
      id: tx.id,
      date: tx.createdAt || '',
      formattedDate,
      formattedTime,
      type: tx.type,
      typeLabel: badge.label,
      description: tx.description || 'Giao dịch biến động ví',
      amount: tx.amount,
      isPositive,
      cumulativeBalance: runningBalance,
    };
  });

  const netChange = totalInflow - totalOutflow;

  // 2. Compute min & max bounds for coordinates
  const balances = rawPoints.map((p) => p.cumulativeBalance);
  let minBal = 0; // always anchor baseline to 0 for financial clarity
  let maxBal = Math.max(...balances, 100_000); // minimum scale ceiling

  // Add a 10% breathing room to max
  maxBal = Math.ceil(maxBal * 1.1);

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // 3. Map to SVG coordinates
  const points: BalanceChartPoint[] = rawPoints.map((pt, idx) => {
    const xFraction = rawPoints.length > 1 ? idx / (rawPoints.length - 1) : 0.5;
    const x = padding.left + xFraction * plotWidth;

    const yFraction = (pt.cumulativeBalance - minBal) / (maxBal - minBal);
    // In SVG, Y is 0 at top, height at bottom
    const y = padding.top + (1 - yFraction) * plotHeight;

    return {
      ...pt,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    };
  });

  // 4. Construct smooth SVG line and area path
  let svgLinePath = '';
  let svgAreaPath = '';

  if (points.length === 1) {
    const pt = points[0];
    svgLinePath = `M ${padding.left} ${pt.y} L ${width - padding.right} ${pt.y}`;
    const baselineY = height - padding.bottom;
    svgAreaPath = `M ${padding.left} ${baselineY} L ${padding.left} ${pt.y} L ${
      width - padding.right
    } ${pt.y} L ${width - padding.right} ${baselineY} Z`;
  } else if (points.length > 1) {
    // Build smooth cubic bezier curve
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    svgLinePath = d;

    // Area closes to the bottom baseline
    const baselineY = height - padding.bottom;
    svgAreaPath = `${d} L ${points[points.length - 1].x} ${baselineY} L ${
      points[0].x
    } ${baselineY} Z`;
  }

  // 5. Generate 4 evenly-spaced Y ticks
  const yTicks: { value: number; label: string; y: number }[] = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const val = minBal + (maxBal - minBal) * (i / tickCount);
    const y = padding.top + (1 - i / tickCount) * plotHeight;
    yTicks.push({
      value: Math.round(val),
      label: formatCompactVND(Math.round(val)),
      y: Math.round(y * 10) / 10,
    });
  }

  return {
    points,
    totalInflow,
    totalOutflow,
    netChange,
    transactionCount: transactions.length,
    minBalance: minBal,
    maxBalance: maxBal,
    svgLinePath,
    svgAreaPath,
    yTicks,
  };
}
