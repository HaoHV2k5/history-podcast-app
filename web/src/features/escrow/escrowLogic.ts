/**
 * Admin Escrow Logic & Helper Utilities
 * Provides data normalization, status mapping, KPI aggregation,
 * filtering, CSV export, and sample fallback data aligned with Sử Ký mockup.
 */

import type { AdminMilestoneRevenueItem, MilestoneRevenueSummaryItem } from '../../types/escrow.ts';

export type EscrowStatusType =
  | 'HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FROZEN'
  | 'PROCESSING'
  | 'CANCELLED'
  | 'UNFUNDED';

export type EscrowTabFilter = 'ALL' | 'HELD' | 'FROZEN' | 'RELEASED' | 'REFUNDED';

export interface EscrowStatusPresentation {
  label: string;
  dotColor: string;
  badgeClass: string;
  iconName: 'clock' | 'check' | 'snowflake' | 'undo' | 'ban' | 'alert';
}

export interface AdminEscrowRow {
  id: string; // e.g. ESC00128
  rawId: number;
  contractId: number;
  contractCode: string; // e.g. HD00128
  workTitle: string; // Tên tác phẩm / hợp đồng
  thumbnail?: string;
  milestoneId: number;
  milestoneTitle?: string;
  milestoneOrderNo?: number;
  
  // Bên ký quỹ (Requester / Creator nạp cọc)
  payerName: string;
  payerEmail: string;
  payerAvatar?: string;
  payerRole: 'REQUESTER' | 'CREATOR' | 'LISTENER';

  // Bên nhận (Freelancer / Thuyết minh viên)
  payeeName: string;
  payeeEmail: string;
  payeeAvatar?: string;
  payeeRole: 'FREELANCER' | 'NARRATOR' | 'CREATOR';

  grossAmount: number; // Số tiền ký quỹ
  feePercent: number; // e.g. 5
  platformFee: number; // Phí sàn
  netAmount: number; // Thực nhận 95%
  
  status: EscrowStatusType;
  paymentMethod: string; // e.g. 'Ví Sử Ký', 'VNPay', 'Ngân hàng'
  
  createdAt: string; // ISO date string
  date: string; // DD/MM/YYYY
  time: string; // HH:mm:ss
  
  releasedAt?: string;
  refundedAt?: string;
  fundedAt?: string;
}

export interface EscrowKpiMetrics {
  totalCount: number;
  totalVolume: number; // Tổng giá trị ký quỹ
  releasedCount: number;
  heldCount: number;
  frozenCount: number;
  refundedCount: number;
  totalFeeRevenue: number;
  
  // Trend badges (only shown when baseline exists, else null)
  volumeTrend: number | null;
  countTrend: number | null;
  releasedTrend: number | null;
  heldTrend: number | null;
}

export interface EscrowFilterOptions {
  searchQuery: string;
  statusTab: EscrowTabFilter;
  statusSelect: string; // 'ALL' or specific status
  paymentMethod: string; // 'ALL' or specific method
  datePreset: 'ALL' | '7D' | '30D' | '90D' | 'CUSTOM';
  customStartDate?: string;
  customEndDate?: string;
}

/**
 * Normalizes any raw status string to canonical EscrowStatusType
 */
export function normalizeEscrowStatus(raw?: string | null): EscrowStatusType {
  if (!raw) return 'HELD';
  const s = raw.trim().toUpperCase();
  if (s.includes('RELEASE') || s === 'COMPLETED' || s === 'APPROVED') return 'RELEASED';
  if (s.includes('REFUND') || s === 'RETURNED') return 'REFUNDED';
  if (s.includes('FREEZE') || s.includes('FROZEN') || s === 'DISPUTED') return 'FROZEN';
  if (s.includes('CANCEL')) return 'CANCELLED';
  if (s.includes('PROCESS') || s === 'PENDING') return 'PROCESSING';
  if (s.includes('UNFUND')) return 'UNFUNDED';
  return 'HELD';
}

/**
 * Returns visual configuration for an escrow status badge
 */
export function getEscrowStatusConfig(status: EscrowStatusType | string): EscrowStatusPresentation {
  const norm = normalizeEscrowStatus(status);
  switch (norm) {
    case 'RELEASED':
      return {
        label: 'Đã giải ngân',
        dotColor: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        iconName: 'check',
      };
    case 'HELD':
      return {
        label: 'Đang giữ (HELD)',
        dotColor: 'bg-blue-500',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
        iconName: 'clock',
      };
    case 'FROZEN':
      return {
        label: 'Đóng băng (FROZEN)',
        dotColor: 'bg-sky-500',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
        iconName: 'snowflake',
      };
    case 'REFUNDED':
      return {
        label: 'Đã hoàn (REFUNDED)',
        dotColor: 'bg-teal-500',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
        iconName: 'undo',
      };
    case 'PROCESSING':
      return {
        label: 'Đang xử lý',
        dotColor: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
        iconName: 'clock',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        dotColor: 'bg-rose-500',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
        iconName: 'ban',
      };
    case 'UNFUNDED':
    default:
      return {
        label: 'Chưa ký quỹ',
        dotColor: 'bg-stone-400',
        badgeClass: 'bg-stone-50 text-stone-600 border-stone-200',
        iconName: 'alert',
      };
  }
}

/**
 * Formats ID to ESC code (e.g. ESC00128)
 */
export function formatEscrowCode(id: number | string): string {
  if (typeof id === 'string' && id.startsWith('ESC')) return id;
  const num = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 1;
  return `ESC${String(num).padStart(5, '0')}`;
}

/**
 * Formats ID to Contract code (e.g. HD00128)
 */
export function formatContractCode(id: number | string): string {
  if (typeof id === 'string' && id.startsWith('HD')) return id;
  const num = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 1;
  return `HD${String(num).padStart(5, '0')}`;
}

/**
 * Extracts 2-letter uppercase initials for avatar badges
 */
export function extractInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'SK';
  const clean = name.trim().split(/\s+/).filter(Boolean);
  if (clean.length === 1) {
    return clean[0].slice(0, 2).toUpperCase();
  }
  const first = clean[0][0] || '';
  const last = clean[clean.length - 1][0] || '';
  return (first + last).toUpperCase();
}

/**
 * Splits ISO date string into DD/MM/YYYY date and HH:mm:ss time
 */
export function splitDateTime(isoDate?: string | null): { date: string; time: string } {
  if (!isoDate) {
    return { date: '—', time: '—' };
  }
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return { date: '—', time: '—' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`,
    };
  } catch {
    return { date: '—', time: '—' };
  }
}

/**
 * Formats VND currency cleanly with commas or periods
 */
export function formatCurrencyVND(amount: number): string {
  if (!Number.isFinite(amount)) return '0 đ';
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

/**
 * Maps Backend AdminMilestoneRevenueItem to AdminEscrowRow
 */
export function mapBackendItemToEscrowRow(item: AdminMilestoneRevenueItem, index: number): AdminEscrowRow {
  const rawId = item.milestoneId || (index + 1);
  const contractId = item.contractId || 100 + index;
  const { date, time } = splitDateTime(item.fundedAt || item.releasedAt || new Date().toISOString());

  const gross = typeof item.grossAmount === 'number' ? item.grossAmount : Number(item.grossAmount) || 0;
  const fee = typeof item.platformFee === 'number' ? item.platformFee : Math.round(gross * 0.05);
  const net = typeof item.netAmount === 'number' ? item.netAmount : (gross - fee);

  const payerName = item.requesterName || item.creatorName || `Người dùng #${item.requesterId || 1}`;
  const payerEmail = item.requesterEmail || item.creatorEmail || `user.${item.requesterId || 1}@example.com`;

  const payeeName =
    (item.creatorName && item.creatorName !== item.requesterName)
      ? item.creatorName
      : (item.freelancerName || item.creatorName || `Thuyết minh viên #${item.creatorId || item.freelancerId || 2}`);
  const payeeEmail =
    (item.creatorEmail && item.creatorEmail !== item.requesterEmail)
      ? item.creatorEmail
      : (item.freelancerEmail || item.creatorEmail || `narrator.${item.creatorId || item.freelancerId || 2}@example.com`);

  return {
    id: formatEscrowCode(rawId),
    rawId,
    contractId,
    contractCode: formatContractCode(contractId),
    workTitle: item.contractTitle || item.milestoneTitle || `Hợp đồng #${contractId}`,
    milestoneId: item.milestoneId,
    milestoneTitle: item.milestoneTitle,
    milestoneOrderNo: item.milestoneOrderNo,
    payerName,
    payerEmail,
    payerRole: 'REQUESTER',
    payeeName,
    payeeEmail,
    payeeRole: 'NARRATOR',
    grossAmount: gross,
    feePercent: typeof item.feePercent === 'number' ? item.feePercent : 5,
    platformFee: fee,
    netAmount: net,
    status: normalizeEscrowStatus(item.status),
    paymentMethod: 'Ví Sử Ký',
    createdAt: item.fundedAt || new Date().toISOString(),
    date,
    time,
    releasedAt: item.releasedAt,
    refundedAt: item.refundedAt,
    fundedAt: item.fundedAt,
  };
}

/**
 * Calculates KPIs strictly from Escrow Rows (Zero Fake Data Guarantee)
 */
export function calculateEscrowKpis(
  rows: AdminEscrowRow[],
  backendSummary?: MilestoneRevenueSummaryItem
): EscrowKpiMetrics {
  if (backendSummary && (backendSummary.totalMilestonesCount ?? 0) > 0) {
    const gross = Number(backendSummary.totalGrossVolume) || 0;
    const fee = Number(backendSummary.totalRealizedRevenue) || 0;
    const count = Number(backendSummary.totalMilestonesCount) || 0;
    const released = Number(backendSummary.releasedMilestonesCount) || 0;
    const held = Number(backendSummary.heldMilestonesCount) || 0;
    const refunded = Number(backendSummary.refundedMilestonesCount) || 0;

    return {
      totalCount: count,
      totalVolume: gross,
      releasedCount: released,
      heldCount: held,
      frozenCount: 0,
      refundedCount: refunded,
      totalFeeRevenue: fee,
      volumeTrend: null, // Strictly null: Backend does not provide past-period delta; Zero Fake Data rule
      countTrend: null,
      releasedTrend: null,
      heldTrend: null,
    };
  }

  if (rows.length === 0) {
    return {
      totalCount: 0,
      totalVolume: 0,
      releasedCount: 0,
      heldCount: 0,
      frozenCount: 0,
      refundedCount: 0,
      totalFeeRevenue: 0,
      volumeTrend: null,
      countTrend: null,
      releasedTrend: null,
      heldTrend: null,
    };
  }

  let totalVolume = 0;
  let totalFee = 0;
  let releasedCount = 0;
  let heldCount = 0;
  let frozenCount = 0;
  let refundedCount = 0;

  for (const r of rows) {
    totalVolume += r.grossAmount;
    totalFee += r.platformFee;
    if (r.status === 'RELEASED') releasedCount++;
    else if (r.status === 'HELD' || r.status === 'PROCESSING') heldCount++;
    else if (r.status === 'FROZEN') frozenCount++;
    else if (r.status === 'REFUNDED') refundedCount++;
  }

  return {
    totalCount: rows.length,
    totalVolume,
    releasedCount,
    heldCount,
    frozenCount,
    refundedCount,
    totalFeeRevenue: totalFee,
    volumeTrend: null, // Strictly null: Backend does not provide past-period delta; Zero Fake Data rule
    countTrend: null,
    releasedTrend: null,
    heldTrend: null,
  };
}

/**
 * Filter escrow rows by all active criteria
 */
export function filterEscrowRows(rows: AdminEscrowRow[], filters: EscrowFilterOptions): AdminEscrowRow[] {
  return rows.filter((row) => {
    // 1. Status Tab filter
    if (filters.statusTab !== 'ALL') {
      if (row.status !== filters.statusTab) {
        return false;
      }
    }

    // 2. Status Select dropdown filter
    if (filters.statusSelect && filters.statusSelect !== 'ALL') {
      if (row.status !== filters.statusSelect) {
        return false;
      }
    }

    // 3. Payment Method filter
    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      if (row.paymentMethod !== filters.paymentMethod) {
        return false;
      }
    }

    // 4. Keyword Search (ID, contract code, work title, payer name, payee name, emails)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const match =
        row.id.toLowerCase().includes(q) ||
        row.contractCode.toLowerCase().includes(q) ||
        row.workTitle.toLowerCase().includes(q) ||
        row.payerName.toLowerCase().includes(q) ||
        row.payerEmail.toLowerCase().includes(q) ||
        row.payeeName.toLowerCase().includes(q) ||
        row.payeeEmail.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 5. Date filter
    if (filters.datePreset !== 'ALL') {
      const rowTime = new Date(row.createdAt).getTime();
      const now = Date.now();
      if (filters.datePreset === '7D') {
        if (now - rowTime > 7 * 86400000) return false;
      } else if (filters.datePreset === '30D') {
        if (now - rowTime > 30 * 86400000) return false;
      } else if (filters.datePreset === '90D') {
        if (now - rowTime > 90 * 86400000) return false;
      } else if (filters.datePreset === 'CUSTOM') {
        if (filters.customStartDate) {
          const start = new Date(filters.customStartDate).getTime();
          if (rowTime < start) return false;
        }
        if (filters.customEndDate) {
          const end = new Date(filters.customEndDate).getTime() + 86400000;
          if (rowTime > end) return false;
        }
      }
    }

    return true;
  });
}

/**
 * Generates UTF-8 BOM CSV export string for Microsoft Excel compatibility
 */
export function generateEscrowCsv(rows: AdminEscrowRow[]): string {
  const headers = [
    'STT',
    'Mã giao dịch',
    'Mã hợp đồng',
    'Tác phẩm / Hợp đồng',
    'Bên ký quỹ (Người nạp)',
    'Email bên ký quỹ',
    'Bên nhận (Thuyết minh viên)',
    'Email bên nhận',
    'Số tiền ký quỹ (VNĐ)',
    'Phí sàn 5% (VNĐ)',
    'Thực nhận 95% (VNĐ)',
    'Trạng thái ký quỹ',
    'Phương thức',
    'Ngày giao dịch',
    'Giờ giao dịch',
  ];

  const escapeCell = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

  const csvRows = rows.map((r, idx) => [
    idx + 1,
    escapeCell(r.id),
    escapeCell(r.contractCode),
    escapeCell(r.workTitle),
    escapeCell(r.payerName),
    escapeCell(r.payerEmail),
    escapeCell(r.payeeName),
    escapeCell(r.payeeEmail),
    r.grossAmount,
    r.platformFee,
    r.netAmount,
    escapeCell(getEscrowStatusConfig(r.status).label),
    escapeCell(r.paymentMethod),
    escapeCell(r.date),
    escapeCell(r.time),
  ]);

  const content = [headers.map(escapeCell).join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');
  return `\uFEFF${content}`;
}

/**
 * Robust copy-to-clipboard utility that works in any browser environment:
 * HTTPS, HTTP localhost, iframes, and legacy execCommand fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Downloads CSV file to user's machine
 */
export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to generate dynamic relative ISO timestamps adhering to AGENTS.md rule #6:
 * Times range smoothly from 1 day, 2 days, 3 days, 5 days, 8 days, 14 days, 22 days, 35 days ago.
 */
export function getRelativeTimeIso(daysAgo: number, hoursOffset = 14, minutesOffset = 30): string {
  const now = new Date();
  const target = new Date(now.getTime() - daysAgo * 86400000);
  target.setHours(hoursOffset, minutesOffset, 0, 0);
  return target.toISOString();
}

/**
 * Mockup-Aligned Test Data (Rule #6 - Smart Sample Fallback)
 * 8 items exactly matching Ký quỹ Escrow.png with dynamic relative timestamps!
 */
export function getMockupEscrowSampleData(): AdminEscrowRow[] {
  const t1 = getRelativeTimeIso(1, 14, 32);
  const t2 = getRelativeTimeIso(2, 11, 20);
  const t3 = getRelativeTimeIso(3, 9, 18);
  const t4 = getRelativeTimeIso(5, 16, 4);
  const t5 = getRelativeTimeIso(7, 10, 33);
  const t6 = getRelativeTimeIso(12, 14, 11);
  const t7 = getRelativeTimeIso(18, 9, 55);
  const t8 = getRelativeTimeIso(25, 13, 27);

  return [
    {
      id: 'ESC00128',
      rawId: 128,
      contractId: 128,
      contractCode: 'HD00128',
      workTitle: 'Đại Thắng Bạch Đằng Năm 1288',
      thumbnail: '/assets/studio/topic-bach-dang-1288.png',
      milestoneId: 1,
      milestoneTitle: 'Thu âm chương 1 & 2',
      milestoneOrderNo: 1,
      payerName: 'Nguyễn Hoàng Minh',
      payerEmail: 'minh.nguyen@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Trần Thị Lan Anh',
      payeeEmail: 'lananh.tran@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 2000000,
      feePercent: 5,
      platformFee: 100000,
      netAmount: 1900000,
      status: 'HELD',
      paymentMethod: 'Ví Sử Ký',
      createdAt: t1,
      date: splitDateTime(t1).date,
      time: splitDateTime(t1).time,
      fundedAt: t1,
    },
    {
      id: 'ESC00127',
      rawId: 127,
      contractId: 127,
      contractCode: 'HD00127',
      workTitle: 'Trận Chiến Bạch Đằng',
      thumbnail: '/assets/studio/topic-bach-dang-938.png',
      milestoneId: 2,
      milestoneTitle: 'Xử lý âm thanh hậu kỳ',
      milestoneOrderNo: 2,
      payerName: 'Lê Quốc Huy',
      payerEmail: 'quochuy.le@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Phạm Minh Tâm',
      payeeEmail: 'tam.pham@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 1500000,
      feePercent: 5,
      platformFee: 75000,
      netAmount: 1425000,
      status: 'RELEASED',
      paymentMethod: 'VNPay',
      createdAt: t2,
      date: splitDateTime(t2).date,
      time: splitDateTime(t2).time,
      fundedAt: t2,
      releasedAt: t2,
    },
    {
      id: 'ESC00126',
      rawId: 126,
      contractId: 126,
      contractCode: 'HD00126',
      workTitle: 'Khởi Nghĩa Lam Sơn',
      thumbnail: '/assets/studio/topic-lam-son.png',
      milestoneId: 1,
      milestoneTitle: 'Kịch bản thu âm giọng đọc',
      milestoneOrderNo: 1,
      payerName: 'Nguyễn Thu Trang',
      payerEmail: 'trang.nguyen@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Đỗ Quang Vinh',
      payeeEmail: 'vinh.do@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 1200000,
      feePercent: 5,
      platformFee: 60000,
      netAmount: 1140000,
      status: 'PROCESSING',
      paymentMethod: 'Ví Sử Ký',
      createdAt: t3,
      date: splitDateTime(t3).date,
      time: splitDateTime(t3).time,
      fundedAt: t3,
    },
    {
      id: 'ESC00125',
      rawId: 125,
      contractId: 125,
      contractCode: 'HD00125',
      workTitle: 'Lê Lợi – Người Anh Hùng',
      thumbnail: '/assets/studio/topic-dien-hong.png',
      milestoneId: 3,
      milestoneTitle: 'Hoàn tất bàn giao audio master',
      milestoneOrderNo: 3,
      payerName: 'Phạm Minh Tâm',
      payerEmail: 'tam.pham@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Hoàng Văn Nam',
      payeeEmail: 'nam.hoang@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 850000,
      feePercent: 5,
      platformFee: 42500,
      netAmount: 807500,
      status: 'RELEASED',
      paymentMethod: 'Ngân hàng',
      createdAt: t4,
      date: splitDateTime(t4).date,
      time: splitDateTime(t4).time,
      fundedAt: t4,
      releasedAt: t4,
    },
    {
      id: 'ESC00124',
      rawId: 124,
      contractId: 124,
      contractCode: 'HD00124',
      workTitle: 'Việt Nam Thời Lý',
      thumbnail: '/assets/studio/topic-nhu-nguyet.png',
      milestoneId: 1,
      milestoneTitle: 'Thu âm mẫu 2 phút',
      milestoneOrderNo: 1,
      payerName: 'Trần Thị Lan Anh',
      payerEmail: 'lananh.tran@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Lê Quốc Huy',
      payeeEmail: 'quochuy.le@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 1300000,
      feePercent: 5,
      platformFee: 65000,
      netAmount: 1235000,
      status: 'REFUNDED',
      paymentMethod: 'Ví Sử Ký',
      createdAt: t5,
      date: splitDateTime(t5).date,
      time: splitDateTime(t5).time,
      fundedAt: t5,
      refundedAt: t5,
    },
    {
      id: 'ESC00123',
      rawId: 123,
      contractId: 123,
      contractCode: 'HD00123',
      workTitle: 'Trần Quốc Tuấn – Hào Khí Đông A',
      thumbnail: '/assets/studio/topic-thang-long-banner.png',
      milestoneId: 1,
      milestoneTitle: 'Duyệt phương án giọng đọc',
      milestoneOrderNo: 1,
      payerName: 'Đỗ Quang Vinh',
      payerEmail: 'vinh.do@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Nguyễn Hoàng Minh',
      payeeEmail: 'minh.nguyen@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 900000,
      feePercent: 5,
      platformFee: 45000,
      netAmount: 855000,
      status: 'CANCELLED',
      paymentMethod: 'VNPay',
      createdAt: t6,
      date: splitDateTime(t6).date,
      time: splitDateTime(t6).time,
      fundedAt: t6,
    },
    {
      id: 'ESC00122',
      rawId: 122,
      contractId: 122,
      contractCode: 'HD00122',
      workTitle: 'Văn Hóa Thăng Long',
      thumbnail: '/assets/studio/topic-thang-long.png',
      milestoneId: 2,
      milestoneTitle: 'Bàn giao file wav 48kHz',
      milestoneOrderNo: 2,
      payerName: 'Phan Thị Mai',
      payerEmail: 'mai.phan@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Nguyễn Thu Trang',
      payeeEmail: 'trang.nguyen@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 1800000,
      feePercent: 5,
      platformFee: 90000,
      netAmount: 1710000,
      status: 'FROZEN',
      paymentMethod: 'Ví Sử Ký',
      createdAt: t7,
      date: splitDateTime(t7).date,
      time: splitDateTime(t7).time,
      fundedAt: t7,
    },
    {
      id: 'ESC00121',
      rawId: 121,
      contractId: 121,
      contractCode: 'HD00121',
      workTitle: 'Nguyễn Trãi – Danh Nhân Lịch Sử',
      thumbnail: '/assets/studio/topic-lam-son.png',
      milestoneId: 1,
      milestoneTitle: 'Giai đoạn thu âm diễn xuất',
      milestoneOrderNo: 1,
      payerName: 'Hoàng Văn Nam',
      payerEmail: 'nam.hoang@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'Phạm Minh Tâm',
      payeeEmail: 'tam.pham@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 1000000,
      feePercent: 5,
      platformFee: 50000,
      netAmount: 950000,
      status: 'RELEASED',
      paymentMethod: 'Ngân hàng',
      createdAt: t8,
      date: splitDateTime(t8).date,
      time: splitDateTime(t8).time,
      fundedAt: t8,
      releasedAt: t8,
    },
  ];
}
