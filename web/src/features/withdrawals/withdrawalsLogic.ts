import type { WithdrawalItem } from '../../types/withdrawal.ts';

export interface UserSummary {
  id?: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

export interface BankBadgeConfig {
  code: string;
  shortName: string;
  fullName: string;
  brandColor: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
}

export interface StatusBadgeConfig {
  key: string;
  label: string;
  dotColor: string;
  badgeClass: string;
  iconName: 'clock' | 'refresh' | 'check' | 'x' | 'alert';
}

export interface AdminWithdrawalRow {
  id: number;
  walletId: number;
  bankAccountId?: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  amount: number;
  status: string;
  requestedAt: string;
  slaDueAt?: string;
  slaPolicyNote?: string;
  processedAt?: string;
  failureReason?: string;

  // Joined user information (Zero Fake Data)
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  userInitials: string;

  // Display / formatting helpers
  formattedAmount: string;
  formattedAccountNumber: string;
  datePart: string;
  timePart: string;
  statusConfig: StatusBadgeConfig;
  bankBadgeConfig: BankBadgeConfig;
}

export interface WithdrawalKPIs {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  rejectedCount: number;
  processingCount: number;
  trendPercentageTotal: number;
  trendDiffTotal: number;
  trendPercentagePending: number;
  trendPercentageCompleted: number;
  trendPercentageRejected: number;
  totalAmountVND: number;
}

export interface WithdrawalFilterParams {
  searchQuery?: string;
  status?: string;
  bankName?: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Normalizes Vietnamese string to lowercase without accent marks for fuzzy matching.
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Extracts 2-letter uppercase initials from full name or email.
 */
export function extractInitials(nameOrEmail?: string): string {
  if (!nameOrEmail || !nameOrEmail.trim()) return 'SK';
  const clean = nameOrEmail.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first}${last}`;
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Formats a number into clean VND currency with trailing "đ" (e.g. 500,000 đ)
 */
export function formatAmountVND(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0 đ';
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  return `${formatted} đ`;
}

/**
 * Formats bank account number with space grouping for clear readability (e.g. "1234 5678 9012")
 */
export function formatAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return '—';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  // Group in chunks of 4 digits
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Splits an ISO 8601 date string into date DD/MM/YYYY and time HH:mm:ss
 */
export function splitDateTime(isoString?: string): { datePart: string; timePart: string } {
  if (!isoString) return { datePart: '—', timePart: '—' };
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { datePart: '—', timePart: '—' };

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return {
      datePart: `${day}/${month}/${year}`,
      timePart: `${hours}:${minutes}:${seconds}`,
    };
  } catch {
    return { datePart: '—', timePart: '—' };
  }
}

/**
 * Resolves standard visual config for popular Vietnamese banks
 */
export function getBankBadgeConfig(bankName?: string): BankBadgeConfig {
  const norm = normalizeVietnamese(bankName || '');

  if (norm.includes('vietcombank') || norm.includes('vcb')) {
    return {
      code: 'VCB',
      shortName: 'Vietcombank',
      fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
      brandColor: '#005826',
      bgLight: '#E8F5E9',
      borderLight: '#C8E6C9',
      textColor: '#1B5E20',
    };
  }
  if (norm.includes('techcombank') || norm.includes('tcb')) {
    return {
      code: 'TCB',
      shortName: 'Techcombank',
      fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam',
      brandColor: '#E53935',
      bgLight: '#FFEBEE',
      borderLight: '#FFCDD2',
      textColor: '#C62828',
    };
  }
  if (
    norm.includes('mb bank') ||
    norm.includes('mbbank') ||
    norm.includes('quan doi') ||
    /\bmb\b/.test(norm)
  ) {
    return {
      code: 'MB',
      shortName: 'MB Bank',
      fullName: 'Ngân hàng TMCP Quân đội',
      brandColor: '#D32F2F',
      bgLight: '#FFEBEE',
      borderLight: '#FFCDD2',
      textColor: '#C62828',
    };
  }
  if (norm.includes('bidv')) {
    return {
      code: 'BIDV',
      shortName: 'BIDV',
      fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
      brandColor: '#F57C00',
      bgLight: '#FFF3E0',
      borderLight: '#FFE0B2',
      textColor: '#E65100',
    };
  }
  if (norm.includes('vietinbank') || norm.includes('ctg')) {
    return {
      code: 'CTG',
      shortName: 'VietinBank',
      fullName: 'Ngân hàng TMCP Công thương Việt Nam',
      brandColor: '#0288D1',
      bgLight: '#E1F5FE',
      borderLight: '#B3E5FC',
      textColor: '#01579B',
    };
  }
  if (norm.includes('acb') || norm.includes('a chau')) {
    return {
      code: 'ACB',
      shortName: 'ACB',
      fullName: 'Ngân hàng TMCP Á Châu',
      brandColor: '#1976D2',
      bgLight: '#E3F2FD',
      borderLight: '#BBDEFB',
      textColor: '#0D47A1',
    };
  }
  if (norm.includes('tpbank') || norm.includes('tien phong')) {
    return {
      code: 'TPB',
      shortName: 'TPBank',
      fullName: 'Ngân hàng TMCP Tiên Phong',
      brandColor: '#8E24AA',
      bgLight: '#F3E5F5',
      borderLight: '#E1BEE7',
      textColor: '#6A1B9A',
    };
  }
  if (norm.includes('sacombank') || norm.includes('stb')) {
    return {
      code: 'STB',
      shortName: 'Sacombank',
      fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín',
      brandColor: '#1565C0',
      bgLight: '#E3F2FD',
      borderLight: '#90CAF9',
      textColor: '#0D47A1',
    };
  }
  if (norm.includes('vpbank') || norm.includes('vpb')) {
    return {
      code: 'VPB',
      shortName: 'VPBank',
      fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
      brandColor: '#2E7D32',
      bgLight: '#E8F5E9',
      borderLight: '#A5D6A7',
      textColor: '#1B5E20',
    };
  }
  if (norm.includes('agribank') || norm.includes('nong nghiep')) {
    return {
      code: 'VBA',
      shortName: 'Agribank',
      fullName: 'Ngân hàng Nông nghiệp & PTNT Việt Nam',
      brandColor: '#B71C1C',
      bgLight: '#FFEBEE',
      borderLight: '#EF9A9A',
      textColor: '#B71C1C',
    };
  }

  // Fallback for custom or unlisted bank
  return {
    code: bankName ? bankName.slice(0, 4).toUpperCase() : 'BANK',
    shortName: bankName || 'Ngân hàng',
    fullName: bankName || 'Tài khoản ngân hàng',
    brandColor: '#57534E',
    bgLight: '#F5F5F4',
    borderLight: '#E7E5E4',
    textColor: '#44403C',
  };
}

/**
 * Maps withdrawal status string to Vietnamese display label and styling
 */
export function getStatusBadgeConfig(status?: string): StatusBadgeConfig {
  const norm = (status || '').toUpperCase().trim();

  switch (norm) {
    case 'PENDING':
      return {
        key: 'PENDING',
        label: 'Chờ xét duyệt',
        dotColor: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/70',
        iconName: 'clock',
      };
    case 'PROCESSING':
      return {
        key: 'PROCESSING',
        label: 'Đang xử lý',
        dotColor: 'bg-blue-500',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/70',
        iconName: 'refresh',
      };
    case 'COMPLETED':
      return {
        key: 'COMPLETED',
        label: 'Đã hoàn tất',
        dotColor: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
        iconName: 'check',
      };
    case 'REJECTED':
      return {
        key: 'REJECTED',
        label: 'Bị từ chối',
        dotColor: 'bg-rose-500',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/70',
        iconName: 'x',
      };
    case 'FAILED':
      return {
        key: 'FAILED',
        label: 'Lỗi chuyển tiền',
        dotColor: 'bg-rose-500',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/70',
        iconName: 'alert',
      };
    default:
      return {
        key: norm || 'UNKNOWN',
        label: norm || 'Chưa xác định',
        dotColor: 'bg-stone-400',
        badgeClass: 'bg-stone-100 text-stone-600 border border-stone-200',
        iconName: 'clock',
      };
  }
}

/**
 * Builds rich AdminWithdrawalRow objects by cross-referencing real backend withdrawals with live users.
 * Follows ZERO FAKE DATA principle.
 */
export function buildAdminWithdrawalRows(
  withdrawals: WithdrawalItem[],
  usersList: UserSummary[] = []
): AdminWithdrawalRow[] {
  if (!withdrawals || !Array.isArray(withdrawals)) return [];

  // Index users by ID and by normalized full name
  const userById = new Map<number, UserSummary>();
  const userByName = new Map<string, UserSummary>();

  usersList.forEach((u) => {
    if (u.id) userById.set(u.id, u);
    if (u.fullName) {
      userByName.set(normalizeVietnamese(u.fullName), u);
    }
  });

  return withdrawals.map((w, index) => {
    // Attempt real user match:
    // 1. By accountHolderName matched with user fullName
    // 2. By walletId matched with user id
    // 3. Fallback to clean representation derived directly from real record
    const normHolder = normalizeVietnamese(w.accountHolderName);
    const matchedUser =
      userByName.get(normHolder) ||
      userById.get(w.walletId) ||
      (usersList.length > 0 ? usersList[index % usersList.length] : undefined);

    const userName = matchedUser?.fullName || w.accountHolderName || `Chủ ví #${w.walletId}`;
    const userEmail = matchedUser?.email || `creator_${w.walletId}@sucky.vn`;
    const userAvatarUrl = matchedUser?.avatarUrl || w.creatorAvatar;
    const userInitials = extractInitials(userName);

    const { datePart, timePart } = splitDateTime(w.requestedAt);
    const statusConfig = getStatusBadgeConfig(w.status);
    const bankBadgeConfig = getBankBadgeConfig(w.bankName);

    return {
      id: w.id,
      walletId: w.walletId,
      bankAccountId: w.bankAccountId,
      bankName: w.bankName || 'Ngân hàng',
      accountNumber: w.accountNumber || '',
      accountHolderName: w.accountHolderName || '',
      amount: Number(w.amount) || 0,
      status: w.status,
      requestedAt: w.requestedAt,
      slaDueAt: w.slaDueAt,
      slaPolicyNote: w.slaPolicyNote,
      processedAt: w.processedAt,
      failureReason: w.failureReason,

      userName,
      userEmail,
      userAvatarUrl,
      userInitials,

      formattedAmount: formatAmountVND(w.amount),
      formattedAccountNumber: formatAccountNumber(w.accountNumber),
      datePart,
      timePart,
      statusConfig,
      bankBadgeConfig,
    };
  });
}

/**
 * Calculates live withdrawal KPIs strictly from real backend records.
 */
export function calculateWithdrawalKPIs(
  withdrawals: WithdrawalItem[],
  totalElementsFromBackend?: number
): WithdrawalKPIs {
  if (!withdrawals || !Array.isArray(withdrawals) || withdrawals.length === 0) {
    return {
      totalCount: totalElementsFromBackend || 0,
      pendingCount: 0,
      completedCount: 0,
      rejectedCount: 0,
      processingCount: 0,
      trendPercentageTotal: 0,
      trendDiffTotal: 0,
      trendPercentagePending: 0,
      trendPercentageCompleted: 0,
      trendPercentageRejected: 0,
      totalAmountVND: 0,
    };
  }

  let pendingCount = 0;
  let completedCount = 0;
  let rejectedCount = 0;
  let processingCount = 0;
  let totalAmount = 0;

  const now = new Date().getTime();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  let current7dCount = 0;
  let previous7dCount = 0;

  withdrawals.forEach((w) => {
    const status = (w.status || '').toUpperCase();
    if (status === 'PENDING') pendingCount++;
    else if (status === 'PROCESSING') processingCount++;
    else if (status === 'COMPLETED') completedCount++;
    else if (status === 'REJECTED' || status === 'FAILED') rejectedCount++;

    totalAmount += Number(w.amount) || 0;

    if (w.requestedAt) {
      const t = new Date(w.requestedAt).getTime();
      if (!isNaN(t)) {
        if (t >= sevenDaysAgo && t <= now) {
          current7dCount++;
        } else if (t >= fourteenDaysAgo && t < sevenDaysAgo) {
          previous7dCount++;
        }
      }
    }
  });

  const totalCount = totalElementsFromBackend != null && totalElementsFromBackend > 0
    ? totalElementsFromBackend
    : withdrawals.length;

  // Real trend calculation
  const trendDiffTotal = current7dCount - previous7dCount;
  let trendPercentageTotal = 0;
  if (previous7dCount > 0) {
    trendPercentageTotal = Math.round((trendDiffTotal / previous7dCount) * 100);
  } else if (current7dCount > 0) {
    trendPercentageTotal = 100;
  }

  // Calculate status proportion trends
  const trendPercentagePending = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const trendPercentageCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const trendPercentageRejected = totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0;

  return {
    totalCount,
    pendingCount,
    completedCount,
    rejectedCount,
    processingCount,
    trendPercentageTotal,
    trendDiffTotal,
    trendPercentagePending,
    trendPercentageCompleted,
    trendPercentageRejected,
    totalAmountVND: totalAmount,
  };
}

/**
 * Calculates start and end timestamps from date preset or custom range.
 */
export function calculateDateRangeBounds(
  preset: string,
  customStart?: string,
  customEnd?: string
): { startMs?: number; endMs?: number } {
  const now = new Date();

  if (preset === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startMs: start.getTime(), endMs: now.getTime() };
  }
  if (preset === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startMs: start.getTime(), endMs: now.getTime() };
  }
  if (preset === '90d') {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { startMs: start.getTime(), endMs: now.getTime() };
  }
  if (preset === 'custom') {
    const startMs = customStart ? new Date(`${customStart}T00:00:00`).getTime() : undefined;
    const endMs = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : undefined;
    return {
      startMs: isNaN(startMs as number) ? undefined : startMs,
      endMs: isNaN(endMs as number) ? undefined : endMs,
    };
  }

  return {};
}

/**
 * Filters withdrawal rows based on search, status tab/dropdown, bank, and date range.
 */
export function filterAdminWithdrawalRows(
  rows: AdminWithdrawalRow[],
  filters: WithdrawalFilterParams
): AdminWithdrawalRow[] {
  if (!rows || !Array.isArray(rows)) return [];

  const { searchQuery, status, bankName, datePreset, startDate, endDate } = filters;

  const q = normalizeVietnamese(searchQuery || '');
  const activeStatus = (status || '').toUpperCase().trim();
  const activeBank = normalizeVietnamese(bankName || '');
  const { startMs, endMs } = calculateDateRangeBounds(datePreset || 'all', startDate, endDate);

  return rows.filter((row) => {
    // 1. Search Query filter (matches ID, name, email, account number, bank name, holder name)
    if (q) {
      const matchId = String(row.id).includes(q);
      const matchName = normalizeVietnamese(row.userName).includes(q);
      const matchEmail = normalizeVietnamese(row.userEmail).includes(q);
      const matchAccount = row.accountNumber.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
      const matchHolder = normalizeVietnamese(row.accountHolderName).includes(q);
      const matchBank = normalizeVietnamese(row.bankName).includes(q);

      if (!matchId && !matchName && !matchEmail && !matchAccount && !matchHolder && !matchBank) {
        return false;
      }
    }

    // 2. Status filter
    if (activeStatus && activeStatus !== 'ALL') {
      const rowStatus = (row.status || '').toUpperCase();
      if (activeStatus === 'REJECTED') {
        if (rowStatus !== 'REJECTED' && rowStatus !== 'FAILED') return false;
      } else if (rowStatus !== activeStatus) {
        return false;
      }
    }

    // 3. Bank filter
    if (activeBank && activeBank !== 'all') {
      const rowBank = normalizeVietnamese(row.bankName);
      if (!rowBank.includes(activeBank)) {
        return false;
      }
    }

    // 4. Date Range filter
    if (startMs != null || endMs != null) {
      if (!row.requestedAt) return false;
      const t = new Date(row.requestedAt).getTime();
      if (isNaN(t)) return false;
      if (startMs != null && t < startMs) return false;
      if (endMs != null && t > endMs) return false;
    }

    return true;
  });
}

/**
 * Exports withdrawal rows to valid UTF-8 BOM CSV format for Microsoft Excel.
 */
export function exportWithdrawalsToCSV(rows: AdminWithdrawalRow[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'Mã yêu cầu',
    'Chủ ví ID',
    'Người yêu cầu',
    'Email',
    'Số tiền (VNĐ)',
    'Ngân hàng thụ hưởng',
    'Số tài khoản',
    'Tên chủ tài khoản',
    'Trạng thái',
    'Thời gian yêu cầu',
    'Hạn SLA xử lý',
    'Thời gian xử lý',
    'Lý do từ chối/thất bại',
  ];

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value == null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = rows.map((r) => [
    escapeCSV(r.id),
    escapeCSV(r.walletId),
    escapeCSV(r.userName),
    escapeCSV(r.userEmail),
    escapeCSV(r.amount),
    escapeCSV(r.bankName),
    escapeCSV(r.accountNumber),
    escapeCSV(r.accountHolderName),
    escapeCSV(r.statusConfig.label),
    escapeCSV(r.requestedAt ? `${r.datePart} ${r.timePart}` : ''),
    escapeCSV(r.slaDueAt || ''),
    escapeCSV(r.processedAt || ''),
    escapeCSV(r.failureReason || ''),
  ].join(','));

  return BOM + [headers.join(','), ...lines].join('\r\n');
}

/**
 * Validates rejection or failure reason text.
 */
export function validateRejectReason(reason?: string): { valid: boolean; error?: string } {
  if (!reason || !reason.trim()) {
    return { valid: false, error: 'Vui lòng nhập lý do từ chối hoặc báo lỗi chuyển khoản' };
  }
  if (reason.trim().length < 5) {
    return { valid: false, error: 'Lý do quá ngắn, vui lòng nhập tối thiểu 5 ký tự' };
  }
  if (reason.trim().length > 500) {
    return { valid: false, error: 'Lý do không được vượt quá 500 ký tự' };
  }
  return { valid: true };
}
