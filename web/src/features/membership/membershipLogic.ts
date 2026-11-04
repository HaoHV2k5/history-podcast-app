import type { MembershipPaymentItem } from '../../types/membership.ts';
import { formatDateTime } from '../../utils/formatters.ts';

export interface MembershipKPIs {
  totalMembers: number;
  totalMembersTrend: string;
  totalMembersDiffText: string;
  monthlyRevenue: number;
  revenueTrend: string;
  revenueSubtext: string;
  paidCount: number;
  paidTrend: string;
  paidSubtext: string;
  pendingCount: number;
  pendingTrend: string;
  pendingSubtext: string;
}

export interface PaymentDisplayRow {
  id: number;
  membershipId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  paymentMethodType: 'vnpay' | 'momo' | 'bank' | 'wallet';
  status: string;
  statusLabel: string;
  statusVariant: 'success' | 'warning' | 'error' | 'neutral';
  paidAt?: string;
  creatorEarning: number;
  commissionAmount: number;
}

export interface MembershipTierConfig {
  id: string;
  channelId?: number;
  channelName?: string;
  badge: string;
  badgeType: 'basic' | 'popular' | 'vip';
  title: string;
  price: number;
  priceUnit: string;
  subscriberCount: number;
  thumbnail: string;
  perks: string[];
}

/**
 * 3 Đặc quyền Hội viên cốt lõi của Hệ thống (Cố định — Tự động kiểm soát bởi Backend, không thể xóa).
 */
export const SYSTEM_CORE_PERKS: readonly string[] = [
  'Nghe sớm các tập Podcast Hội viên (Early Access)',
  'Xem toàn bộ kho nội dung độc quyền (Members-Only)',
  'Huy hiệu Hội viên VIP nổi bật trong phòng Livestream & Bình luận',
];

const SYSTEM_CUSTOM_PERKS_STORAGE_KEY = 'suky_system_membership_perks_v1';
export const SYSTEM_PERKS_UPDATED_EVENT = 'suky-system-perks-updated';

/**
 * Kiểm tra xem 1 đặc quyền có phải là đặc quyền cốt lõi cố định của hệ thống hay không
 */
export function isCoreSystemPerk(perk: string): boolean {
  const norm = (perk || '').trim();
  return SYSTEM_CORE_PERKS.includes(norm);
}

/**
 * Lấy danh sách các đặc quyền bổ sung do Admin cấu hình thêm cho toàn hệ thống
 */
export function getCustomSystemPerks(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(SYSTEM_CUSTOM_PERKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => Boolean(item) && !SYSTEM_CORE_PERKS.includes(item));
  } catch {
    return [];
  }
}

/**
 * Lấy toàn bộ danh sách Đặc quyền Hội viên của Hệ thống (3 đặc quyền cốt lõi + đặc quyền mở rộng do Admin thêm)
 */
export function getSystemMembershipPerks(): string[] {
  const custom = getCustomSystemPerks();
  return [...SYSTEM_CORE_PERKS, ...custom];
}

/**
 * Lưu danh sách đặc quyền mở rộng của hệ thống và phát sự kiện đồng bộ tức thì sang cả Admin & Creator
 */
export function saveCustomSystemPerks(perksList: string[]): string[] {
  const cleanedCustom = Array.from(
    new Set(
      (perksList || [])
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter((p) => Boolean(p) && !SYSTEM_CORE_PERKS.includes(p))
    )
  );
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        SYSTEM_CUSTOM_PERKS_STORAGE_KEY,
        JSON.stringify(cleanedCustom)
      );
      window.dispatchEvent(new CustomEvent(SYSTEM_PERKS_UPDATED_EVENT));
    } catch {
      // Ignore storage quota errors
    }
  }
  return [...SYSTEM_CORE_PERKS, ...cleanedCustom];
}

/**
 * Danh sách gói hội viên khởi tạo: Mặc định là mảng rỗng [] (Zero Fake Data).
 */
export const DEFAULT_PLATFORM_TIERS: MembershipTierConfig[] = [];

/**
 * Tính toán KPIs từ dữ liệu thanh toán thực tế của hệ thống (Zero Fake Data)
 */
export function calculateMembershipKPIs(
  payments: MembershipPaymentItem[],
  tiers: MembershipTierConfig[] = DEFAULT_PLATFORM_TIERS
): MembershipKPIs {
  if (!payments || payments.length === 0) {
    const configuredSubscribers = tiers.reduce((acc, t) => acc + (t.subscriberCount || 0), 0);
    const configuredMonthlyRevenue = tiers.reduce(
      (acc, t) => acc + (t.subscriberCount || 0) * (t.price || 0),
      0
    );

    return {
      totalMembers: configuredSubscribers,
      totalMembersTrend: configuredSubscribers > 0 ? `+${configuredSubscribers}` : '',
      totalMembersDiffText:
        configuredSubscribers > 0 ? `+${configuredSubscribers} hội viên` : 'Chưa có hội viên',
      monthlyRevenue: configuredMonthlyRevenue,
      revenueTrend: configuredMonthlyRevenue > 0 ? '+100%' : '',
      revenueSubtext: configuredMonthlyRevenue > 0 ? 'Từ gói hội viên' : 'Chưa phát sinh doanh thu',
      paidCount: 0,
      paidTrend: '',
      paidSubtext: 'Giao dịch thành công',
      pendingCount: 0,
      pendingTrend: '',
      pendingSubtext: 'Giao dịch đang xác minh',
    };
  }

  const uniqueMemberIds = new Set(
    payments
      .map((p) => p.membershipId)
      .filter((id): id is number => typeof id === 'number' && id > 0)
  );
  const totalMembers = uniqueMemberIds.size > 0 ? uniqueMemberIds.size : payments.length;

  let monthlyRevenue = 0;
  let paidCount = 0;
  let pendingCount = 0;

  payments.forEach((p) => {
    const st = (p.status || '').toUpperCase();
    if (st === 'SUCCESS' || st === 'COMPLETED' || st === 'PAID') {
      paidCount += 1;
      monthlyRevenue += Number(p.amount || 0);
    } else if (st === 'PENDING' || st === 'PROCESSING' || st === 'WAITING') {
      pendingCount += 1;
    }
  });

  return {
    totalMembers,
    totalMembersTrend: totalMembers > 0 ? `↑ ${totalMembers}` : '',
    totalMembersDiffText:
      totalMembers > 0 ? `Tổng cộng ${totalMembers} hội viên` : 'Chưa có hội viên',
    monthlyRevenue,
    revenueTrend: monthlyRevenue > 0 ? '↑ Thực tế' : '',
    revenueSubtext: 'Từ gói hội viên',
    paidCount,
    paidTrend: paidCount > 0 ? `↑ ${paidCount}` : '',
    paidSubtext: 'Giao dịch thành công',
    pendingCount,
    pendingTrend: pendingCount > 0 ? `↓ ${pendingCount}` : '',
    pendingSubtext: 'Giao dịch đang xác minh',
  };
}

/**
 * Chuẩn hóa tiếng Việt không dấu cho tìm kiếm
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

/**
 * Ánh xạ trạng thái thanh toán sang nhãn và màu sắc chuẩn Sử Ký
 */
export function mapPaymentStatus(status?: string): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'neutral';
} {
  const st = (status || '').toUpperCase();
  switch (st) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'PAID':
      return { label: 'Thành công', variant: 'success' };
    case 'PENDING':
    case 'PROCESSING':
    case 'WAITING':
      return { label: 'Chờ xác minh', variant: 'warning' };
    case 'FAILED':
    case 'CANCELLED':
    case 'REJECTED':
      return { label: 'Thất bại', variant: 'error' };
    default:
      return { label: status || 'Không xác định', variant: 'neutral' };
  }
}

/**
 * Map tên gói hội viên dựa trên thông tin gói thực tế hoặc số tiền
 */
export function determinePlanName(amount: number, planName?: string): string {
  if (planName && planName.trim()) return planName.trim();
  if (amount >= 180000) return 'Hội Viên VIP';
  if (amount >= 90000) return 'Hội Viên Cao Cấp';
  return 'Hội Viên Thường';
}

/**
 * Map phương thức thanh toán sang nhãn chuẩn thực tế của Backend (Ví Sử Ký)
 */
export function determinePaymentMethod(
  method?: string,
  _index = 0
): { name: string; type: 'vnpay' | 'momo' | 'bank' | 'wallet' } {
  if (method) {
    const m = method.toUpperCase();
    if (m.includes('VN') || m.includes('VNPAY')) return { name: 'VNPAY', type: 'vnpay' };
    if (m.includes('MOMO')) return { name: 'MoMo', type: 'momo' };
    if (m.includes('BANK') || m.includes('NGAN_HANG')) return { name: 'Thẻ ngân hàng', type: 'bank' };
  }
  return { name: 'Ví Sử Ký', type: 'wallet' };
}

/**
 * Trích xuất 2 chữ cái viết tắt cho avatar fallback
 */
export function getAvatarInitials(name: string): string {
  if (!name || !name.trim()) return 'HV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[parts.length - 2]?.charAt(0) || '';
  const last = parts[parts.length - 1]?.charAt(0) || '';
  return (first + last).toUpperCase() || 'HV';
}

/**
 * Bộ lọc dữ liệu thanh toán
 */
export function filterMembershipPayments(
  payments: PaymentDisplayRow[],
  searchQuery = '',
  planFilter = 'all',
  statusFilter = 'all',
  startDate?: string,
  endDate?: string
): PaymentDisplayRow[] {
  if (!payments) return [];

  const normQuery = normalizeVietnamese(searchQuery);

  return payments.filter((item) => {
    if (normQuery) {
      const matchName = normalizeVietnamese(item.userName).includes(normQuery);
      const matchEmail = normalizeVietnamese(item.userEmail).includes(normQuery);
      const matchId = String(item.id).includes(normQuery);
      const matchMemId = String(item.membershipId).includes(normQuery);
      const matchPlan = normalizeVietnamese(item.planName).includes(normQuery);
      if (!matchName && !matchEmail && !matchId && !matchMemId && !matchPlan) {
        return false;
      }
    }

    if (planFilter && planFilter !== 'all') {
      const normPlan = normalizeVietnamese(item.planName);
      const normFilter = normalizeVietnamese(planFilter);
      if (!normPlan.includes(normFilter)) {
        return false;
      }
    }

    if (statusFilter && statusFilter !== 'all') {
      const itemStatus = (item.status || '').toUpperCase();
      const target = statusFilter.toUpperCase();
      if (itemStatus !== target) {
        return false;
      }
    }

    if (startDate && item.paidAt) {
      const itemTime = new Date(item.paidAt).getTime();
      const start = new Date(startDate).getTime();
      if (itemTime < start) return false;
    }

    if (endDate && item.paidAt) {
      const itemTime = new Date(item.paidAt).getTime();
      const end = new Date(endDate).getTime();
      if (itemTime > end) return false;
    }

    return true;
  });
}

/**
 * Xuất dữ liệu giao dịch ra file CSV UTF-8 kèm BOM
 */
export function exportMembershipPaymentsToCSV(payments: PaymentDisplayRow[]): string {
  const headers = [
    'Mã thanh toán',
    'Mã hội viên',
    'Tên người dùng',
    'Email người dùng',
    'Gói hội viên',
    'Số tiền (VNĐ)',
    'Thu nhập Creator (VNĐ)',
    'Phí nền tảng (VNĐ)',
    'Phương thức thanh toán',
    'Trạng thái',
    'Ngày thanh toán',
  ];

  const rows = payments.map((p) => [
    `#${p.id}`,
    `#${p.membershipId}`,
    `"${(p.userName || '').replace(/"/g, '""')}"`,
    `"${(p.userEmail || '').replace(/"/g, '""')}"`,
    `"${p.planName}"`,
    p.amount,
    p.creatorEarning,
    p.commissionAmount,
    p.paymentMethod,
    p.statusLabel,
    p.paidAt ? formatDateTime(p.paidAt) : '',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

/**
 * Tính toán khoảng ngày bắt đầu/kết thúc cho bộ lọc thời gian giao dịch
 */
export function calculateDateRangeBounds(
  preset: string,
  customStart?: string,
  customEnd?: string
): { startDate?: string; endDate?: string; label: string } {
  const now = new Date();

  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: 'Hôm nay' };
  }

  if (preset === '7days') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 60 * 1000);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: '7 ngày qua' };
  }

  if (preset === '30days') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 60 * 1000);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: '30 ngày gần đây' };
  }

  if (preset === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), label: 'Tháng này' };
  }

  if (preset === 'custom' && (customStart || customEnd)) {
    let startIso: string | undefined;
    let endIso: string | undefined;

    if (customStart) {
      const [y, m, d] = customStart.split('-').map(Number);
      if (y && m && d) {
        startIso = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
      } else {
        startIso = new Date(customStart).toISOString();
      }
    }

    if (customEnd) {
      const [y, m, d] = customEnd.split('-').map(Number);
      if (y && m && d) {
        endIso = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
      } else {
        endIso = new Date(customEnd).toISOString();
      }
    }

    if (startIso && endIso && new Date(startIso).getTime() > new Date(endIso).getTime()) {
      const temp = startIso;
      startIso = endIso;
      endIso = temp;
    }

    let label = 'Tùy chỉnh';
    if (customStart && customEnd) {
      label = `${customStart} → ${customEnd}`;
    } else if (customStart) {
      label = `Từ ${customStart}`;
    } else if (customEnd) {
      label = `Đến ${customEnd}`;
    }

    return { startDate: startIso, endDate: endIso, label };
  }

  return { label: 'Tất cả thời gian' };
}

export const MOCK_MEMBERSHIP_TEST_PAYMENTS: PaymentDisplayRow[] = [];
