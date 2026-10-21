import type { MilestoneItem } from '../../types/contract.ts';
import { formatVND, formatDateTime } from '../../utils/formatters.ts';

export interface EscrowFinancialBreakdown {
  totalMilestones: number;
  totalGross: number;
  currentlyHeld: number;
  currentlyFrozen: number;
  totalReleasedNet: number;
  totalPlatformFee: number;
  totalRefunded: number;
  totalSplitRefund: number;
  unfundedAmount: number;
  isBalanced: boolean;
}

export type StatusBadgeVariant =
  | 'default'
  | 'outline'
  | 'success'
  | 'pending'
  | 'error'
  | 'processing'
  | 'accent';

export interface StatusPresentation {
  label: string;
  variant: StatusBadgeVariant;
  description: string;
}

/**
 * Calculates comprehensive escrow financial breakdown from a list of milestones.
 * Strictly guarantees ZERO double counting by partitioning financial buckets by `escrowStatus`,
 * while reconciling partial releases resulting from dispute SPLIT settlements.
 */
export function calculateEscrowBreakdown(
  milestones?: MilestoneItem[] | null
): EscrowFinancialBreakdown {
  if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
    return {
      totalMilestones: 0,
      totalGross: 0,
      currentlyHeld: 0,
      currentlyFrozen: 0,
      totalReleasedNet: 0,
      totalPlatformFee: 0,
      totalRefunded: 0,
      totalSplitRefund: 0,
      unfundedAmount: 0,
      isBalanced: true,
    };
  }

  let totalGross = 0;
  let currentlyHeld = 0;
  let currentlyFrozen = 0;
  let totalReleasedNet = 0;
  let totalPlatformFee = 0;
  let totalRefunded = 0;
  let totalSplitRefund = 0;
  let unfundedAmount = 0;

  for (const m of milestones) {
    const amount = Number(m.amount) || 0;
    totalGross += amount;

    const escrowStatus = (m.escrowStatus || '').toUpperCase();

    switch (escrowStatus) {
      case 'HELD':
        // Money is locked in escrow waiting for delivery/review/release
        currentlyHeld += amount;
        break;

      case 'FROZEN':
        // Milestone escrow is frozen due to dispute
        currentlyFrozen += amount;
        break;

      case 'RELEASED': {
        // Released: Split into platform fee and narrator net payout
        const fee = m.platformFee != null ? Number(m.platformFee) : 0;
        const net = m.netAmount != null ? Number(m.netAmount) : Math.max(0, amount - fee);
        totalReleasedNet += net;
        totalPlatformFee += fee;

        // Reconcile dispute SPLIT partial releases:
        // When a dispute is settled via SPLIT, the remaining portion was refunded to the Creator.
        const splitRefund = Math.max(0, amount - (net + fee));
        if (splitRefund > 0) {
          totalRefunded += splitRefund;
          totalSplitRefund += splitRefund;
        }
        break;
      }

      case 'REFUNDED':
        // Milestone escrow has been refunded to creator
        totalRefunded += amount;
        break;

      case 'UNFUNDED':
      default:
        // Not yet funded into escrow
        unfundedAmount += amount;
        break;
    }
  }

  // Verification: Sum of parts should match totalGross within 1 VND rounding threshold
  const sumOfParts =
    currentlyHeld +
    currentlyFrozen +
    (totalReleasedNet + totalPlatformFee) +
    totalRefunded +
    unfundedAmount;

  const isBalanced = Math.abs(totalGross - sumOfParts) <= 1;

  return {
    totalMilestones: milestones.length,
    totalGross,
    currentlyHeld,
    currentlyFrozen,
    totalReleasedNet,
    totalPlatformFee,
    totalRefunded,
    totalSplitRefund,
    unfundedAmount,
    isBalanced,
  };
}

/**
 * Maps work status (MilestoneStatus) to Vietnamese display label and badge variant.
 * Keeps work progress separate from financial escrow status.
 */
export function formatMilestoneWorkStatus(status?: string | null): StatusPresentation {
  if (!status) {
    return {
      label: 'Chưa có dữ liệu',
      variant: 'outline',
      description: 'Chưa có trạng thái tiến độ',
    };
  }

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'WAITING':
      return {
        label: 'Chờ thực hiện',
        variant: 'outline',
        description: 'Chờ hoàn thành các cột mốc trước đó',
      };
    case 'UNFUNDED':
      return {
        label: 'Chờ ký quỹ',
        variant: 'pending',
        description: 'Creator chưa nạp tiền bảo chứng vào Escrow',
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang thực hiện',
        variant: 'processing',
        description: 'Thuyết minh viên đang ghi âm sản phẩm',
      };
    case 'SUBMITTED':
      return {
        label: 'Đã nộp bài',
        variant: 'accent',
        description: 'Đã gửi bản thu, chờ Creator nghiệm thu',
      };
    case 'APPROVED':
      return {
        label: 'Đã nghiệm thu',
        variant: 'success',
        description: 'Creator đã chấp thuận chất lượng âm thanh',
      };
    case 'RELEASED':
      return {
        label: 'Đã hoàn tất',
        variant: 'success',
        description: 'Cột mốc hoàn thành và đã thanh toán',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        variant: 'error',
        description: 'Cột mốc đã bị hủy',
      };
    default:
      return {
        label: status,
        variant: 'outline',
        description: `Trạng thái: ${status}`,
      };
  }
}

/**
 * Maps escrow financial status to Vietnamese display label and badge variant.
 * Explicitly distinguishes HELD, FROZEN, RELEASED, REFUNDED, UNFUNDED.
 */
export function formatMilestoneEscrowStatus(status?: string | null): StatusPresentation {
  if (!status) {
    return {
      label: 'Chưa có dữ liệu',
      variant: 'outline',
      description: 'Chưa có trạng thái ký quỹ',
    };
  }

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'UNFUNDED':
      return {
        label: 'Chưa ký quỹ',
        variant: 'outline',
        description: 'Chưa có tiền bảo chứng trong Escrow',
      };
    case 'HELD':
      return {
        label: 'Đang giữ ký quỹ (Held)',
        variant: 'processing',
        description: 'Tiền bảo chứng đang được hệ thống khóa an toàn',
      };
    case 'FROZEN':
      return {
        label: 'Tạm đóng băng (Frozen)',
        variant: 'error',
        description: 'Đang có tranh chấp khiếu nại, tiền bị đóng băng',
      };
    case 'RELEASED':
      return {
        label: 'Đã giải ngân (Released)',
        variant: 'success',
        description: 'Đã chuyển tiền vào ví Thuyết minh viên sau khi trừ phí sàn',
      };
    case 'REFUNDED':
      return {
        label: 'Đã hoàn trả (Refunded)',
        variant: 'pending',
        description: 'Tiền đã được hoàn lại vào ví Creator',
      };
    default:
      return {
        label: status,
        variant: 'outline',
        description: `Ký quỹ: ${status}`,
      };
  }
}

/**
 * Validates that a milestone belongs to the specified contract.
 */
export function validateContractMilestoneAssociation(
  contractId: number,
  milestone: MilestoneItem
): boolean {
  if (!contractId || !milestone) return false;
  return Number(milestone.contractId) === Number(contractId);
}

/**
 * Safely formats date/time string, returning neutral fallback "Chưa có dữ liệu" if missing.
 */
export function formatDateOrFallback(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa có dữ liệu';
  try {
    return formatDateTime(dateStr);
  } catch {
    return 'Chưa có dữ liệu';
  }
}

/**
 * Safely formats currency VND, returning neutral fallback "Chưa có dữ liệu" if missing or undefined.
 */
export function formatVNDOrFallback(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return 'Chưa có dữ liệu';
  return formatVND(amount);
}

/**
 * Calculates Creator refund portion from a milestone that was partially released via SPLIT dispute resolution.
 * If the milestone escrowStatus is RELEASED and the sum of netAmount and platformFee is less than gross amount,
 * the remaining difference was refunded to the Creator.
 * Strictly prevents confusing a SPLIT partial release with a full 100% payment to Freelancer.
 */
export function getMilestoneSplitRefund(milestone?: MilestoneItem | null): number {
  if (!milestone) return 0;
  const amount = Number(milestone.amount) || 0;
  const net = Number(milestone.netAmount) || 0;
  const fee = Number(milestone.platformFee) || 0;
  const escrowStatus = (milestone.escrowStatus || '').toUpperCase();
  if (escrowStatus === 'RELEASED') {
    const refund = amount - (net + fee);
    return refund > 1 ? refund : 0;
  }
  return 0;
}

export interface AutoReleaseIndicator {
  isWaitingRelease: boolean;
  isDue: boolean;
  message: string;
  badgeVariant: StatusBadgeVariant;
  formattedReleaseAt: string;
}

/**
 * Checks whether a milestone is in the 3-day hold period waiting for automatic escrow release.
 * Backend business rule: When Creator approves work, status = 'APPROVED', escrowStatus remains 'HELD',
 * and releaseAt is scheduled (e.g. approvedAt + 3 days).
 */
export function getAutoReleaseIndicator(
  milestone?: MilestoneItem | null,
  referenceTime: Date = new Date()
): AutoReleaseIndicator | null {
  if (!milestone) return null;
  const workStatus = (milestone.status || '').toUpperCase();
  const escrowStatus = (milestone.escrowStatus || '').toUpperCase();

  if (workStatus === 'APPROVED' && escrowStatus === 'HELD' && milestone.releaseAt) {
    const releaseTime = new Date(milestone.releaseAt).getTime();
    const now = referenceTime.getTime();
    const diffMs = releaseTime - now;

    if (diffMs <= 0) {
      return {
        isWaitingRelease: true,
        isDue: true,
        message: 'Đến hạn tự động giải ngân',
        badgeVariant: 'success',
        formattedReleaseAt: formatDateOrFallback(milestone.releaseAt),
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let countdownText = '';
    if (diffDays > 0) {
      countdownText = `còn ${diffDays} ngày`;
    } else {
      countdownText = `còn ${Math.max(1, diffHours)} giờ`;
    }

    return {
      isWaitingRelease: true,
      isDue: false,
      message: `Chờ tự động giải ngân (${countdownText})`,
      badgeVariant: 'pending',
      formattedReleaseAt: formatDateOrFallback(milestone.releaseAt),
    };
  }

  return null;
}

/**
 * Generates CSV string for Milestone Escrow reconciliation.
 * Uses UTF-8 with BOM (\uFEFF) for Vietnamese characters compatibility in Excel.
 */
export function generateMilestoneEscrowCSV(
  contractId: number,
  contractTitle: string | undefined,
  milestones: MilestoneItem[],
  breakdown: EscrowFinancialBreakdown
): string {
  const headers = [
    'STT Cột mốc',
    'Tên Cột mốc',
    'Giá trị bảo chứng (Gross VND)',
    'Phí sàn (%)',
    'Phí sàn khấu trừ (VND)',
    'Thực nhận Thuyết minh (Net VND)',
    'Phân chia hoàn Creator (VND)',
    'Trạng thái Ký quỹ (Escrow)',
    'Trạng thái Tiến độ (Work)',
    'Thời điểm Ký quỹ',
    'Hạn nộp sản phẩm',
    'Thời điểm Tất toán / Giải ngân',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val == null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = milestones.map((m) => {
    const splitRefund = getMilestoneSplitRefund(m);
    const feeRate = m.feePercent != null ? `${m.feePercent}%` : 'Theo hợp đồng';
    const releasedOrRefunded = m.releasedAt || m.refundedAt || '';

    return [
      escapeCSV(m.orderNo || '#'),
      escapeCSV(m.title || `Cột mốc #${m.orderNo}`),
      escapeCSV(m.amount || 0),
      escapeCSV(feeRate),
      escapeCSV(m.platformFee || 0),
      escapeCSV(m.netAmount || 0),
      escapeCSV(splitRefund),
      escapeCSV(m.escrowStatus || 'UNFUNDED'),
      escapeCSV(m.status || 'WAITING'),
      escapeCSV(m.fundedAt ? formatDateTime(m.fundedAt) : 'Chưa nạp'),
      escapeCSV(m.dueAt ? formatDateTime(m.dueAt) : 'Chưa có'),
      escapeCSV(releasedOrRefunded ? formatDateTime(releasedOrRefunded) : 'Chưa tất toán'),
    ].join(',');
  });

  // Summary row
  const summaryRow = [
    escapeCSV('TỔNG CỘNG'),
    escapeCSV(`${breakdown.totalMilestones} Cột mốc`),
    escapeCSV(breakdown.totalGross),
    escapeCSV('—'),
    escapeCSV(breakdown.totalPlatformFee),
    escapeCSV(breakdown.totalReleasedNet),
    escapeCSV(breakdown.totalSplitRefund),
    escapeCSV(`HELD: ${breakdown.currentlyHeld} | FROZEN: ${breakdown.currentlyFrozen}`),
    escapeCSV('—'),
    escapeCSV('—'),
    escapeCSV('—'),
    escapeCSV(`Đã hoàn: ${breakdown.totalRefunded}`),
  ].join(',');

  const titleRow = `"BÁO CÁO ĐỐI SOÁT KÝ QUỸ CỘT MỐC - HỢP ĐỒNG #${contractId} - ${contractTitle ? contractTitle.replace(/"/g, '""') : ''}"`;
  const exportTimeRow = `"Thời điểm xuất báo cáo: ${formatDateTime(new Date().toISOString())}"`;

  return `\uFEFF${titleRow}\n${exportTimeRow}\n\n${headers.join(',')}\n${rows.join('\n')}\n${summaryRow}\n`;
}

/**
 * Triggers browser download for generated CSV content.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
