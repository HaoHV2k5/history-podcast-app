/**
 * Admin Notification & Pending Task Aggregation Logic
 * Zero Fake Data - strictly computes live operational queues from real backend responses.
 * Implements read/unread tracking inspired by Creator moderation tracker.
 */

import { formatVND, formatDateTime } from '../../utils/formatters.ts';

export const ADMIN_READ_IDS_KEY_PREFIX = 'admin_read_notification_ids_';

export interface AdminNotificationItem {
  id: string;
  category: 'moderation' | 'kyc' | 'withdrawals' | 'disputes' | 'membership';
  categoryLabel: string;
  title: string;
  subtitle: string;
  timeText: string;
  link: string;
  badgeLabel: string;
  badgeType: 'amber' | 'blue' | 'emerald' | 'rose' | 'red';
  timestampRaw: number;
}

export interface AdminTaskCategorySummary {
  id: 'moderation' | 'kyc' | 'withdrawals' | 'disputes' | 'membership';
  title: string;
  count: number;
  description: string;
  link: string;
  badgeLabel: string;
  urgency: 'high' | 'medium' | 'info';
}

/**
 * Safely parses read notification IDs from JSON array string.
 */
export function safeParseReadIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

/**
 * Serializes read notification IDs set to JSON array string.
 */
export function serializeReadIds(set: Set<string>): string {
  return JSON.stringify(Array.from(set));
}

/**
 * Extracts items safely from either raw array or Spring Page response (items/content).
 */
export function extractListFromApiResponse<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  if (data.data) return extractListFromApiResponse<T>(data.data);
  return [];
}

/**
 * Safely calculates count of pending items with an optional predicate.
 */
export function calculatePendingCount<T = any>(
  rawResponse: any,
  predicate?: (item: T) => boolean
): number {
  if (!rawResponse) return 0;

  if (!predicate && typeof rawResponse.totalElements === 'number') {
    return Math.max(0, rawResponse.totalElements);
  }
  if (!predicate && rawResponse.data && typeof rawResponse.data.totalElements === 'number') {
    return Math.max(0, rawResponse.data.totalElements);
  }

  const list = extractListFromApiResponse<T>(rawResponse);
  if (!predicate) return list.length;
  return list.filter(predicate).length;
}

export interface RawAdminQueues {
  moderationData?: any;
  kycData?: any;
  withdrawalsData?: any;
  disputesData?: any;
  membershipData?: any;
}

/**
 * Builds individual actionable notifications from live backend data.
 * Zero Fake Data: If backend returns empty lists, returns empty array.
 */
export function buildAdminNotificationItems(queues: RawAdminQueues): AdminNotificationItem[] {
  const items: AdminNotificationItem[] = [];

  // 1. Moderation items (decision = WAITING_REVIEW or PENDING)
  const modItems = extractListFromApiResponse(queues.moderationData);
  const pendingMod = modItems.filter(
    (m: any) =>
      m &&
      (m.decision?.toUpperCase() === 'PENDING' ||
        m.decision?.toUpperCase() === 'WAITING_REVIEW' ||
        m.contentStatus?.toUpperCase() === 'PENDING_REVIEW')
  );
  pendingMod.forEach((m: any) => {
    const rawTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
    items.push({
      id: `mod-${m.reviewId || m.contentId || m.artifactId}`,
      category: 'moderation',
      categoryLabel: 'Kiểm duyệt',
      title: m.title || `Tác phẩm chờ kiểm duyệt #${m.contentId || m.reviewId}`,
      subtitle: `Kênh: ${m.channelName || m.creatorEmail || 'Nhà sáng tạo'}`,
      timeText: formatDateTime(m.createdAt),
      link: '/admin/moderation',
      badgeLabel: 'Chờ thẩm định',
      badgeType: 'amber',
      timestampRaw: rawTime || Date.now(),
    });
  });

  // 2. KYC Profiles (status = PENDING or SUBMITTED)
  const kycItems = extractListFromApiResponse(queues.kycData);
  const pendingKyc = kycItems.filter(
    (k: any) =>
      k &&
      (k.status?.toUpperCase() === 'PENDING' || k.status?.toUpperCase() === 'SUBMITTED')
  );
  pendingKyc.forEach((k: any) => {
    const rawTime = k.updatedAt || k.createdAt ? new Date(k.updatedAt || k.createdAt).getTime() : 0;
    items.push({
      id: `kyc-${k.id}`,
      category: 'kyc',
      categoryLabel: 'Xác thực KYC',
      title: k.fullName || k.userEmail || `Hồ sơ định danh #${k.id}`,
      subtitle: k.phone ? `SĐT: ${k.phone}` : k.bankName ? `Ngân hàng: ${k.bankName}` : 'Chờ đối soát thông tin cá nhân',
      timeText: formatDateTime(k.updatedAt || k.createdAt),
      link: '/admin/kyc',
      badgeLabel: 'Chờ đối soát',
      badgeType: 'blue',
      timestampRaw: rawTime || Date.now(),
    });
  });

  // 3. Withdrawals (status = PENDING)
  const withItems = extractListFromApiResponse(queues.withdrawalsData);
  const pendingWith = withItems.filter((w: any) => w && w.status?.toUpperCase() === 'PENDING');
  pendingWith.forEach((w: any) => {
    const rawTime = w.requestedAt ? new Date(w.requestedAt).getTime() : 0;
    items.push({
      id: `with-${w.id}`,
      category: 'withdrawals',
      categoryLabel: 'Rút tiền',
      title: `Yêu cầu rút ${formatVND(w.amount)}`,
      subtitle: `${w.accountHolderName || 'Creator'} • ${w.bankName || 'Ngân hàng'}`,
      timeText: formatDateTime(w.requestedAt),
      link: '/admin/withdrawals',
      badgeLabel: 'Chờ giải ngân',
      badgeType: 'emerald',
      timestampRaw: rawTime || Date.now(),
    });
  });

  // 4. Disputes (status = OPEN or not RESOLVED)
  const dispItems = extractListFromApiResponse(queues.disputesData);
  const pendingDisp = dispItems.filter((d: any) => d && d.status?.toUpperCase() !== 'RESOLVED');
  pendingDisp.forEach((d: any) => {
    const rawTime = d.createdAt ? new Date(d.createdAt).getTime() : 0;
    items.push({
      id: `disp-${d.id}`,
      category: 'disputes',
      categoryLabel: 'Khiếu nại',
      title: `Tranh chấp hợp đồng #${d.id}`,
      subtitle: d.reason ? `Lý do: ${d.reason}` : 'Cần trọng tài đối soát bằng chứng',
      timeText: formatDateTime(d.createdAt),
      link: '/admin/disputes',
      badgeLabel: 'Chờ trọng tài',
      badgeType: 'rose',
      timestampRaw: rawTime || Date.now(),
    });
  });

  // 5. Membership payments (status = PENDING)
  const memItems = extractListFromApiResponse(queues.membershipData);
  const pendingMem = memItems.filter((p: any) => p && p.status?.toUpperCase() === 'PENDING');
  pendingMem.forEach((p: any) => {
    const rawTime = p.paidAt ? new Date(p.paidAt).getTime() : 0;
    items.push({
      id: `mem-${p.id}`,
      category: 'membership',
      categoryLabel: 'Gói hội viên',
      title: `Giao dịch hội viên #${p.id} (${formatVND(p.amount)})`,
      subtitle: 'Trạng thái: Chờ xác nhận thanh toán',
      timeText: formatDateTime(p.paidAt),
      link: '/admin/membership',
      badgeLabel: 'Chờ xác nhận',
      badgeType: 'red',
      timestampRaw: rawTime || Date.now(),
    });
  });

  // Sort newest first
  return items.sort((a, b) => b.timestampRaw - a.timestampRaw);
}

export interface AdminPendingCountsInput {
  moderationCount: number;
  kycCount: number;
  withdrawalCount: number;
  disputeCount: number;
  membershipCount: number;
}

/**
 * Consolidates real backend task counts into category summaries.
 */
export function buildAdminNotificationSummary(counts: AdminPendingCountsInput): {
  totalPending: number;
  hasPending: boolean;
  activeCategories: AdminTaskCategorySummary[];
} {
  const safeMod = Math.max(0, counts.moderationCount || 0);
  const safeKyc = Math.max(0, counts.kycCount || 0);
  const safeWith = Math.max(0, counts.withdrawalCount || 0);
  const safeDisp = Math.max(0, counts.disputeCount || 0);
  const safeMem = Math.max(0, counts.membershipCount || 0);

  const totalPending = safeMod + safeKyc + safeWith + safeDisp + safeMem;
  const activeCategories: AdminTaskCategorySummary[] = [];

  if (safeMod > 0) {
    activeCategories.push({
      id: 'moderation',
      title: 'Kiểm duyệt nội dung',
      count: safeMod,
      description: `${safeMod} video/podcast đang chờ AI Shield & Quản trị viên duyệt`,
      link: '/admin/moderation',
      badgeLabel: 'Chờ thẩm định',
      urgency: 'high',
    });
  }

  if (safeKyc > 0) {
    activeCategories.push({
      id: 'kyc',
      title: 'Hồ sơ KYC Creator',
      count: safeKyc,
      description: `${safeKyc} hồ sơ định danh Creator gửi lên đang chờ đối soát CCCD/Passport`,
      link: '/admin/kyc',
      badgeLabel: 'Chờ xác thực',
      urgency: 'medium',
    });
  }

  if (safeWith > 0) {
    activeCategories.push({
      id: 'withdrawals',
      title: 'Yêu cầu rút tiền',
      count: safeWith,
      description: `${safeWith} lệnh rút tiền từ số dư ví Creator cần xét duyệt giải ngân`,
      link: '/admin/withdrawals',
      badgeLabel: 'Chờ giải ngân',
      urgency: 'high',
    });
  }

  if (safeDisp > 0) {
    activeCategories.push({
      id: 'disputes',
      title: 'Xử lý Khiếu nại hợp đồng',
      count: safeDisp,
      description: `${safeDisp} tranh chấp hợp đồng thu âm đang chờ trọng tài xử lý`,
      link: '/admin/disputes',
      badgeLabel: 'Chờ trọng tài',
      urgency: 'high',
    });
  }

  if (safeMem > 0) {
    activeCategories.push({
      id: 'membership',
      title: 'Giao dịch gói hội viên',
      count: safeMem,
      description: `${safeMem} giao dịch đăng ký gói hội viên đang ở trạng thái chờ xác minh`,
      link: '/admin/membership',
      badgeLabel: 'Chờ xác nhận',
      urgency: 'info',
    });
  }

  return {
    totalPending,
    hasPending: totalPending > 0,
    activeCategories,
  };
}
