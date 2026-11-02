import type { AdminModerationItem } from '../../types/moderation.ts';
import type { KycProfile } from '../../types/kyc.ts';
import type { WithdrawalItem } from '../../types/withdrawal.ts';
import type { DisputeItem } from '../../types/dispute.ts';
import { formatVND, formatDate } from '../../utils/formatters.ts';

export type ActivityFilterType = 'ALL' | 'MODERATION' | 'KYC' | 'WITHDRAWAL' | 'DISPUTE';

export interface OverviewActivityItem {
  id: string;
  type: 'MODERATION' | 'KYC' | 'WITHDRAWAL' | 'DISPUTE';
  title: string;
  description: string;
  timestamp: string;
  targetUrl: string;
}

export interface DateFilterPreset {
  id: string;
  label: string;
  displayDate: string;
}

/**
 * Deterministic color palette for avatar initials.
 * Avoids jarring random colors and stays within the Sử Ký warm heritage palette.
 */
export const AVATAR_PALETTES = [
  { bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' }, // Rose (e.g. LA - Trần Thị Lan Anh)
  { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' }, // Amber (e.g. LH - Lê Quốc Huy)
  { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]' }, // Coral (e.g. NH - Nguyễn Hữu Long)
  { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' }, // Purple (e.g. PT - Phạm Tuấn)
  { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' }, // Emerald
  { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' }, // Sky
];

/**
 * Extracts 1 or 2 capital initials from a full name (e.g. "Trần Thị Lan Anh" -> "LA", "Phạm Tuấn" -> "PT").
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'SK';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SK';
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  const first = parts[parts.length - 2][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * Deterministically picks an avatar color palette based on name hash.
 */
export function getAvatarColor(name?: string | null): { bg: string; text: string } {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Masks account number for banking display, e.g. "123456789" -> "**** 6789".
 */
export function formatMaskedAccountNumber(accountNo?: string | null): string {
  if (!accountNo) return '**** 0000';
  const clean = String(accountNo).replace(/\s+/g, '');
  if (clean.length <= 4) return `**** ${clean}`;
  return `**** ${clean.slice(-4)}`;
}

/**
 * Normalizes video moderation status badge.
 */
export function getModerationStatusBadge(decision?: string | null): {
  label: string;
  variant: 'pending' | 'error' | 'success';
} {
  const norm = (decision || '').toUpperCase();
  if (norm === 'REJECTED' || norm === 'NEEDS_EDIT') {
    return { label: 'Cần chỉnh sửa', variant: 'error' };
  }
  if (norm === 'APPROVED') {
    return { label: 'Đã duyệt', variant: 'success' };
  }
  return { label: 'Chờ xử lý', variant: 'pending' };
}

/**
 * Normalizes KYC status badge.
 */
export function getKycStatusBadge(status?: string | null): {
  label: string;
  variant: 'pending' | 'processing' | 'error' | 'success';
} {
  const norm = (status || '').toUpperCase();
  if (norm === 'APPROVED') {
    return { label: 'Đã xác thực', variant: 'success' };
  }
  if (norm === 'PROCESSING' || norm === 'IN_PROGRESS' || norm === 'REVIEWING') {
    return { label: 'Đang xem xét', variant: 'processing' };
  }
  if (norm === 'REJECTED' || norm === 'NEEDS_SUPPLEMENT' || norm === 'ACTION_REQUIRED') {
    return { label: 'Cần bổ sung', variant: 'error' };
  }
  return { label: 'Chờ xác thực', variant: 'pending' };
}

/**
 * Normalizes Withdrawal status badge.
 */
export function getWithdrawalStatusBadge(status?: string | null): {
  label: string;
  variant: 'pending' | 'processing' | 'error' | 'success';
} {
  const norm = (status || '').toUpperCase();
  if (norm === 'COMPLETED' || norm === 'APPROVED') {
    return { label: 'Đã duyệt', variant: 'success' };
  }
  if (norm === 'PROCESSING' || norm === 'IN_PROGRESS') {
    return { label: 'Đang xử lý', variant: 'processing' };
  }
  if (norm === 'REJECTED' || norm === 'FAILED' || norm === 'NEEDS_VERIFICATION') {
    return { label: 'Cần xác minh', variant: 'error' };
  }
  return { label: 'Chờ duyệt', variant: 'pending' };
}

/**
 * Combines live system entities into a unified chronological Recent Activity feed.
 * Completely driven by real queries without mock/fake data.
 */
export function buildRecentActivities(params: {
  moderationItems?: AdminModerationItem[];
  kycItems?: KycProfile[];
  withdrawalItems?: WithdrawalItem[];
  disputeItems?: DisputeItem[];
}): OverviewActivityItem[] {
  const activities: OverviewActivityItem[] = [];

  // 1. Moderation items
  if (Array.isArray(params.moderationItems)) {
    params.moderationItems.forEach((mod) => {
      activities.push({
        id: `mod-${mod.reviewId || mod.contentId || Math.random()}`,
        type: 'MODERATION',
        title: mod.decision === 'APPROVED' ? 'Video đã duyệt' : 'Video mới chờ duyệt',
        description: mod.title || 'Nội dung chưa đặt tiêu đề',
        timestamp: mod.createdAt || new Date().toISOString(),
        targetUrl: `/admin/moderation/${mod.reviewId || ''}`,
      });
    });
  }

  // 2. KYC profiles
  if (Array.isArray(params.kycItems)) {
    params.kycItems.forEach((kyc) => {
      const isDone = (kyc.status || '').toUpperCase() === 'APPROVED';
      activities.push({
        id: `kyc-${kyc.id || Math.random()}`,
        type: 'KYC',
        title: isDone ? 'Nhà sáng tạo hoàn thành KYC' : 'Hồ sơ KYC mới nộp',
        description: kyc.fullName || kyc.userEmail || 'Ứng viên sáng tạo',
        timestamp: kyc.createdAt || new Date().toISOString(),
        targetUrl: `/admin/kyc/${kyc.id || ''}`,
      });
    });
  }

  // 3. Withdrawals
  if (Array.isArray(params.withdrawalItems)) {
    params.withdrawalItems.forEach((withItem) => {
      activities.push({
        id: `with-${withItem.id || Math.random()}`,
        type: 'WITHDRAWAL',
        title: 'Yêu cầu rút tiền mới',
        description: `${withItem.accountHolderName || 'Nhà sáng tạo'} – ${formatVND(withItem.amount || 0)}`,
        timestamp: withItem.requestedAt || new Date().toISOString(),
        targetUrl: `/admin/withdrawals/${withItem.id || ''}`,
      });
    });
  }

  // 4. Disputes
  if (Array.isArray(params.disputeItems)) {
    params.disputeItems.forEach((disp) => {
      activities.push({
        id: `disp-${disp.id || Math.random()}`,
        type: 'DISPUTE',
        title: 'Khiếu nại mới',
        description: disp.reason || disp.milestoneTitle || disp.contractTitle || 'Tranh chấp hợp đồng thu âm cần giải quyết',
        timestamp: disp.createdAt || new Date().toISOString(),
        targetUrl: `/admin/disputes`,
      });
    });
  }

  // Sort descending by timestamp
  activities.sort((a, b) => {
    const tA = new Date(a.timestamp).getTime();
    const tB = new Date(b.timestamp).getTime();
    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
  });

  return activities;
}

/**
 * Filters the activity feed by selected category.
 */
export function filterActivities(
  activities: OverviewActivityItem[],
  filter: ActivityFilterType
): OverviewActivityItem[] {
  if (filter === 'ALL') return activities;
  return activities.filter((act) => act.type === filter);
}

/**
 * Formats a timestamp for the Withdrawal Table: "DD/MM/YYYY HH:mm" (e.g. "24/10/2026 09:14").
 */
export function formatWithdrawalDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(isoString);
  }
}

/**
 * Splits timestamp into two lines for Recent Activity feed: time "HH:mm" and date "DD/MM/YYYY".
 */
export function formatActivitySplitDateTime(isoString?: string | null): {
  time: string;
  date: string;
} {
  if (!isoString) return { time: '—', date: '—' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { time: '—', date: String(isoString) };
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return {
      time: `${hours}:${minutes}`,
      date: `${day}/${month}/${year}`,
    };
  } catch {
    return { time: '—', date: String(isoString) };
  }
}

/**
 * Returns today's formatted date string e.g. "24/10/2026".
 */
export function getTodayFormatted(): string {
  return formatDate(new Date().toISOString());
}
