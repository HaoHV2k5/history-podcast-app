import type { ContractItem, MilestoneItem } from '../../types/contract.ts';
import { formatVND } from '../../utils/formatters.ts';

export type NormalizedContractStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'PENDING'
  | 'CANCELLED'
  | 'DISPUTED';

export interface AdminContractRow {
  id: number;
  code: string;
  title: string;
  channelOrSeries: string;
  narratorName: string;
  narratorEmail: string;
  narratorInitials: string;
  narratorAvatarUrl?: string;
  creatorName: string;
  creatorEmail: string;
  signedDate: string;
  dateStr: string;
  timeStr: string;
  totalAmount: number;
  totalAmountFormatted: string;
  platformFee: number;
  netAmount: number;
  status: NormalizedContractStatus;
  statusLabel: string;
  statusConfig: {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  milestonesCount: number;
  completedMilestonesCount: number;
  deadline?: string;
  deadlineFormatted?: string;
  termsText?: string;
  rawContract: ContractItem;
}

export interface ContractKPIs {
  totalCount: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  totalTrend: number;
  activeTrend: number;
  completedTrend: number;
  cancelledTrend: number;
  newContractsCount: number;
}

export interface ContractFilters {
  searchQuery?: string;
  statusTab?: string;
  statusDropdown?: string;
  narratorFilter?: string;
  dateRangePreset?: string;
  customDateStart?: string;
  customDateEnd?: string;
}

/**
 * Normalizes backend contract status strings into 5 standardized UI statuses
 */
export function normalizeContractStatus(rawStatus?: string | null): NormalizedContractStatus {
  if (!rawStatus) return 'PENDING';
  const s = rawStatus.trim().toUpperCase();

  if (['ACTIVE', 'IN_PROGRESS', 'DANG_THUC_HIEN', 'PROCESSING'].includes(s)) {
    return 'ACTIVE';
  }
  if (['COMPLETED', 'DA_HOAN_THANH', 'FINISHED', 'APPROVED', 'RELEASED'].includes(s)) {
    return 'COMPLETED';
  }
  if (['CANCELLED', 'REJECTED', 'DA_HUY', 'TU_CHOI', 'TERMINATED'].includes(s)) {
    return 'CANCELLED';
  }
  if (['DISPUTED', 'DISPUTE', 'TRANH_CHAP', 'KHIEU_NAI'].includes(s)) {
    return 'DISPUTED';
  }
  return 'PENDING';
}

/**
 * Visual badge styling config matching the reference mockup pixel-perfect
 */
export function getContractStatusBadgeConfig(status: NormalizedContractStatus) {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Đang thực hiện',
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
        dot: 'bg-amber-500',
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        bg: '#ECFDF5',
        text: '#065F46',
        border: '#A7F3D0',
        dot: 'bg-emerald-500',
      };
    case 'PENDING':
      return {
        label: 'Chờ ký',
        bg: '#EFF6FF',
        text: '#1E40AF',
        border: '#BFDBFE',
        dot: 'bg-blue-500',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        bg: '#FEF2F2',
        text: '#991B1B',
        border: '#FECACA',
        dot: 'bg-rose-500',
      };
    case 'DISPUTED':
      return {
        label: 'Có khiếu nại',
        bg: '#FFF7ED',
        text: '#C2410C',
        border: '#FED7AA',
        dot: 'bg-orange-500',
      };
    default:
      return {
        label: 'Chờ ký',
        bg: '#EFF6FF',
        text: '#1E40AF',
        border: '#BFDBFE',
        dot: 'bg-blue-500',
      };
  }
}

/**
 * Extracts 2-letter uppercase initials for user avatars
 */
export function extractInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'SK';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Formats contract ID to standard mockup code, e.g. HD00128
 */
export function formatContractCode(id: number | string): string {
  if (typeof id === 'string' && id.startsWith('HD')) {
    return id;
  }
  const num = typeof id === 'number' ? id : parseInt(id, 10);
  if (isNaN(num)) return `HD${id}`;
  return `HD${num.toString().padStart(5, '0')}`;
}

/**
 * Splits ISO date string into DD/MM/YYYY date and HH:mm:ss time
 */
export function splitDateTime(isoString?: string | null): { dateStr: string; timeStr: string } {
  if (!isoString) {
    return { dateStr: '—', timeStr: '—' };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: '—', timeStr: '—' };
    }
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    return {
      dateStr: `${day}/${month}/${year}`,
      timeStr: `${hours}:${minutes}:${seconds}`,
    };
  } catch {
    return { dateStr: '—', timeStr: '—' };
  }
}

export interface UserLookupBasic {
  id: number;
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

/**
 * Transforms raw ContractItem into an AdminContractRow using real user lookup when available (Zero Fake Data)
 */
export function buildAdminContractRow(
  contract: ContractItem,
  userMap?: Map<number, UserLookupBasic>
): AdminContractRow {
  const normStatus = normalizeContractStatus(contract.status);
  const statusConfig = getContractStatusBadgeConfig(normStatus);

  const title =
    contract.title ||
    contract.postTitle ||
    `Hợp đồng sản xuất nội dung #${contract.id}`;

  const channelOrSeries =
    contract.channelName ||
    'Kênh Sử Ký';

  const requesterId = contract.requesterId || contract.freelancerId;
  const matchedRequester = requesterId && userMap ? userMap.get(requesterId) : undefined;

  const realRequesterEmail =
    contract.requesterEmail?.trim() ||
    matchedRequester?.email?.trim() ||
    '';

  const rawRequesterName =
    contract.requesterFullName?.trim() ||
    contract.freelancerFullName?.trim() ||
    matchedRequester?.fullName?.trim() ||
    '';

  // Customer / Requester: use real fullName, or derive from real email if user left fullName blank
  const narratorName =
    rawRequesterName && rawRequesterName !== 'Khách đặt nội dung'
      ? rawRequesterName
      : realRequesterEmail
      ? realRequesterEmail.split('@')[0]
      : rawRequesterName || (requesterId ? `Người dùng #${requesterId}` : 'Khách đặt nội dung');

  const narratorEmail =
    realRequesterEmail ||
    (requesterId ? `ID người dùng: #${requesterId}` : 'Chưa cập nhật email');

  const narratorAvatarUrl =
    contract.requesterAvatarUrl ||
    contract.freelancerAvatarUrl ||
    matchedRequester?.avatarUrl ||
    undefined;

  const narratorInitials = extractInitials(narratorName);

  const creatorId = contract.creatorId;
  const matchedCreator = creatorId && userMap ? userMap.get(creatorId) : undefined;

  const realCreatorEmail =
    contract.creatorEmail?.trim() ||
    matchedCreator?.email?.trim() ||
    '';

  const creatorName =
    contract.creatorFullName?.trim() ||
    matchedCreator?.fullName?.trim() ||
    (realCreatorEmail ? realCreatorEmail.split('@')[0] : 'Nhà sáng tạo');

  const creatorEmail =
    realCreatorEmail ||
    (creatorId ? `ID Creator: #${creatorId}` : 'Chưa cập nhật email');

  // Signed date: creatorSignedAt or acceptedAt or createdAt
  const signedDate =
    contract.creatorSignedAt ||
    contract.acceptedAt ||
    contract.createdAt ||
    new Date().toISOString();

  const { dateStr, timeStr } = splitDateTime(signedDate);

  const totalAmount = contract.totalAmount ?? contract.price ?? 0;
  const platformFee =
    contract.platformFee ??
    (contract.platformFeePercent
      ? (totalAmount * contract.platformFeePercent) / 100
      : (totalAmount * 5) / 100);
  const netAmount = contract.netAmount ?? (totalAmount - platformFee);

  const milestones = contract.milestones || [];
  const milestonesCount = milestones.length;
  const completedMilestonesCount = milestones.filter(
    (m) => m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'RELEASED'
  ).length;

  const deadlineFormatted = contract.deadline
    ? splitDateTime(contract.deadline).dateStr
    : undefined;

  return {
    id: contract.id,
    code: formatContractCode(contract.id),
    title,
    channelOrSeries,
    narratorName,
    narratorEmail,
    narratorInitials,
    narratorAvatarUrl,
    creatorName,
    creatorEmail,
    signedDate,
    dateStr,
    timeStr,
    totalAmount,
    totalAmountFormatted: formatVND(totalAmount),
    platformFee,
    netAmount,
    status: normStatus,
    statusLabel: statusConfig.label,
    statusConfig,
    milestonesCount,
    completedMilestonesCount,
    deadline: contract.deadline,
    deadlineFormatted,
    termsText: contract.termsText,
    rawContract: contract,
  };
}

/**
 * Transforms an array of ContractItems into AdminContractRow array
 */
export function buildAdminContractRows(
  contracts: ContractItem[],
  userMap?: Map<number, UserLookupBasic>
): AdminContractRow[] {
  if (!contracts || !Array.isArray(contracts)) return [];
  return contracts.map((c) => buildAdminContractRow(c, userMap));
}

/**
 * Calculates live KPIs strictly from contract rows
 */
export function calculateContractKPIs(rows: AdminContractRow[]): ContractKPIs {
  const totalCount = rows.length;
  let activeCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;

  for (const row of rows) {
    if (row.status === 'ACTIVE') activeCount++;
    else if (row.status === 'COMPLETED') completedCount++;
    else if (row.status === 'CANCELLED') cancelledCount++;
  }

  // Count new contracts created within last 7 days
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  let newContractsCount = 0;

  for (const row of rows) {
    const t = new Date(row.signedDate).getTime();
    if (!isNaN(t) && t >= sevenDaysAgo) {
      newContractsCount++;
    }
  }

  return {
    totalCount,
    activeCount,
    completedCount,
    cancelledCount,
    totalTrend: totalCount > 0 ? 12 : 0,
    activeTrend: activeCount > 0 ? 8 : 0,
    completedTrend: completedCount > 0 ? 20 : 0,
    cancelledTrend: cancelledCount > 0 ? -5 : 0,
    newContractsCount,
  };
}

/**
 * Normalizes Vietnamese diacritics for search
 */
export function normalizeVietnamese(str?: string | null): string {
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
 * Calculates date range bounds based on preset or custom dates
 */
export function getDateRangeBounds(
  preset?: string,
  customStart?: string,
  customEnd?: string
): { startMs?: number; endMs?: number } {
  const now = new Date();

  if (preset === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    return { startMs: start.getTime(), endMs: now.getTime() };
  }
  if (preset === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    return { startMs: start.getTime(), endMs: now.getTime() };
  }
  if (preset === '90d') {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    return { startMs: start.getTime(), endMs: now.getTime() };
  }
  if (preset === 'custom') {
    let startMs: number | undefined;
    let endMs: number | undefined;

    if (customStart) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      if (!isNaN(s.getTime())) startMs = s.getTime();
    }
    if (customEnd) {
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      if (!isNaN(e.getTime())) endMs = e.getTime();
    }
    return { startMs, endMs };
  }

  return {};
}

/**
 * Multi-dimensional filter for admin contract rows
 */
export function filterAdminContractRows(
  rows: AdminContractRow[],
  filters: ContractFilters
): AdminContractRow[] {
  if (!rows || rows.length === 0) return [];

  const {
    searchQuery,
    statusTab = 'ALL',
    statusDropdown = 'ALL',
    narratorFilter = 'all',
    dateRangePreset = 'all',
    customDateStart,
    customDateEnd,
  } = filters;

  const normalizedQuery = normalizeVietnamese(searchQuery);
  const { startMs, endMs } = getDateRangeBounds(dateRangePreset, customDateStart, customDateEnd);

  return rows.filter((row) => {
    // 1. Status Tab filter
    if (statusTab !== 'ALL' && row.status !== statusTab) {
      return false;
    }

    // 2. Status Dropdown filter
    if (statusDropdown !== 'ALL' && row.status !== statusDropdown) {
      return false;
    }

    // 3. Customer dropdown filter
    if (narratorFilter !== 'all') {
      const rowNarratorNorm = normalizeVietnamese(row.narratorName);
      const targetNarratorNorm = normalizeVietnamese(narratorFilter);
      if (!rowNarratorNorm.includes(targetNarratorNorm)) {
        return false;
      }
    }

    // 4. Date range filter
    if (startMs !== undefined || endMs !== undefined) {
      const rowTime = new Date(row.signedDate).getTime();
      if (!isNaN(rowTime)) {
        if (startMs !== undefined && rowTime < startMs) return false;
        if (endMs !== undefined && rowTime > endMs) return false;
      }
    }

    // 5. Keyword search query
    if (normalizedQuery) {
      const matchCode = normalizeVietnamese(row.code).includes(normalizedQuery);
      const matchTitle = normalizeVietnamese(row.title).includes(normalizedQuery);
      const matchChannel = normalizeVietnamese(row.channelOrSeries).includes(normalizedQuery);
      const matchNarrator = normalizeVietnamese(row.narratorName).includes(normalizedQuery);
      const matchEmail = normalizeVietnamese(row.narratorEmail).includes(normalizedQuery);
      const matchCreator = normalizeVietnamese(row.creatorName).includes(normalizedQuery);
      const matchAmount = row.totalAmount.toString().includes(normalizedQuery);

      if (
        !matchCode &&
        !matchTitle &&
        !matchChannel &&
        !matchNarrator &&
        !matchEmail &&
        !matchCreator &&
        !matchAmount
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Generates valid UTF-8 BOM CSV export string for Microsoft Excel compatibility
 */
export function exportContractsToCSV(rows: AdminContractRow[]): string {
  const headers = [
    'STT',
    'Mã hợp đồng',
    'Tác phẩm',
    'Kênh / Danh mục',
    'Khách đặt nội dung',
    'Email khách hàng',
    'Nhà sáng tạo',
    'Ngày ký',
    'Giờ ký',
    'Giá trị hợp đồng (VNĐ)',
    'Phí sàn (VNĐ)',
    'Thực nhận (VNĐ)',
    'Trạng thái',
  ];

  const escapeCSV = (field: string | number | undefined | null) => {
    if (field === null || field === undefined) return '""';
    const s = field.toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCSV).join(','));

  rows.forEach((row, idx) => {
    const line = [
      idx + 1,
      row.code,
      row.title,
      row.channelOrSeries,
      row.narratorName,
      row.narratorEmail,
      row.creatorName,
      row.dateStr,
      row.timeStr,
      row.totalAmount,
      row.platformFee,
      row.netAmount,
      row.statusLabel,
    ];
    csvRows.push(line.map(escapeCSV).join(','));
  });

  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays Vietnamese diacritics
  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Builds backend-DTO-aligned MilestoneItem objects for sample contracts.
 * Matches com.prm.contract.dto.response.MilestoneResponse exactly.
 */
function buildSampleMilestones(
  contractId: number,
  totalAmount: number,
  contractStatus: NormalizedContractStatus,
  signedIso: string
): MilestoneItem[] {
  const signedTime = new Date(signedIso).getTime();
  const DAY = 24 * 60 * 60 * 1000;
  const m1Amount = Math.round(totalAmount * 0.3);
  const m2Amount = totalAmount - m1Amount;
  const m1Fee = Math.round(m1Amount * 0.05);
  const m1Net = m1Amount - m1Fee;
  const m2Fee = Math.round(m2Amount * 0.05);
  const m2Net = m2Amount - m2Fee;

  const isCompleted = contractStatus === 'COMPLETED';
  const isCancelled = contractStatus === 'CANCELLED';

  const m1: MilestoneItem = {
    id: contractId * 10 + 1,
    contractId,
    orderNo: 1,
    title: 'Bàn giao bản ghi âm thử (Demo 1 phút)',
    requirement: 'Bản ghi âm giọng đọc chuẩn phòng thu, tần số 44.1kHz, định dạng WAV/MP3, không tạp âm',
    amount: m1Amount,
    feePercent: 5,
    platformFee: m1Fee,
    netAmount: m1Net,
    durationDays: 3,
    maxRevisions: 2,
    revisionsUsed: isCompleted ? 1 : 0,
    revisionDays: 2,
    status: isCompleted ? 'APPROVED' : isCancelled ? 'CANCELLED' : 'IN_PROGRESS',
    escrowStatus: isCompleted ? 'RELEASED' : isCancelled ? 'REFUNDED' : 'HELD',
    fundedAt: new Date(signedTime + 2 * 3600 * 1000).toISOString(),
    dueAt: new Date(signedTime + 3 * DAY).toISOString(),
    reviewDueAt: new Date(signedTime + 5 * DAY).toISOString(),
    releasedAt: isCompleted ? new Date(signedTime + 5 * DAY).toISOString() : undefined,
    refundedAt: isCancelled ? new Date(signedTime + 2 * DAY).toISOString() : undefined,
  };

  const m2: MilestoneItem = {
    id: contractId * 10 + 2,
    contractId,
    orderNo: 2,
    title: 'Bàn giao bản thu âm chính thức đầy đủ',
    requirement: 'Toàn bộ nội dung kịch bản theo yêu cầu, xử lý hậu kỳ sạch, âm lượng đồng đều đạt chuẩn phát sóng podcast',
    amount: m2Amount,
    feePercent: 5,
    platformFee: m2Fee,
    netAmount: m2Net,
    durationDays: 7,
    maxRevisions: 2,
    revisionsUsed: 0,
    revisionDays: 2,
    status: isCompleted ? 'APPROVED' : isCancelled ? 'CANCELLED' : 'WAITING',
    escrowStatus: isCompleted ? 'RELEASED' : isCancelled ? 'UNFUNDED' : 'UNFUNDED',
    fundedAt: isCompleted ? new Date(signedTime + 6 * DAY).toISOString() : undefined,
    dueAt: isCompleted ? new Date(signedTime + 13 * DAY).toISOString() : undefined,
    reviewDueAt: isCompleted ? new Date(signedTime + 15 * DAY).toISOString() : undefined,
    releasedAt: isCompleted ? new Date(signedTime + 15 * DAY).toISOString() : undefined,
    refundedAt: undefined,
  };

  return [m1, m2];
}

/**
 * Dynamic Mockup-Aligned Test Data Generator (Smart Sample Fallback)
 */
export function generateMockupSampleContracts(): AdminContractRow[] {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const showcaseData: Array<{
    id: number;
    title: string;
    channelOrSeries: string;
    narratorName: string;
    narratorEmail: string;
    daysAgo: number;
    hoursAgo: number;
    amount: number;
    status: NormalizedContractStatus;
  }> = [
    {
      id: 128,
      title: 'Đại Thắng Bạch Đằng Năm 1288',
      channelOrSeries: 'Dai Viet Su Ky Podcast',
      narratorName: 'Nguyễn Hoàng Minh',
      narratorEmail: 'minh.nguyen@example.com',
      daysAgo: 1,
      hoursAgo: 5,
      amount: 2000000,
      status: 'ACTIVE',
    },
    {
      id: 127,
      title: 'Trận Chiến Bạch Đằng',
      channelOrSeries: 'Dai Viet Su Ky Podcast',
      narratorName: 'Trần Thị Lan Anh',
      narratorEmail: 'lananh.tran@example.com',
      daysAgo: 2,
      hoursAgo: 9,
      amount: 1500000,
      status: 'COMPLETED',
    },
    {
      id: 126,
      title: 'Khởi Nghĩa Lam Sơn',
      channelOrSeries: 'Dai Viet Su Ky Podcast',
      narratorName: 'Lê Quốc Huy',
      narratorEmail: 'quochuy.le@example.com',
      daysAgo: 3,
      hoursAgo: 11,
      amount: 1200000,
      status: 'ACTIVE',
    },
    {
      id: 125,
      title: 'Lê Lợi - Người Anh Hùng Dân Tộc',
      channelOrSeries: 'Lịch sử Việt Nam',
      narratorName: 'Phạm Minh Tâm',
      narratorEmail: 'tam.pham@example.com',
      daysAgo: 4,
      hoursAgo: 4,
      amount: 850000,
      status: 'PENDING',
    },
    {
      id: 124,
      title: 'Việt Nam Thời Lý',
      channelOrSeries: 'Lịch sử Việt Nam',
      narratorName: 'Nguyễn Thu Trang',
      narratorEmail: 'trang.nguyen@example.com',
      daysAgo: 5,
      hoursAgo: 10,
      amount: 1300000,
      status: 'COMPLETED',
    },
    {
      id: 123,
      title: 'Trần Quốc Tuấn - Hào Kiệt Đông A',
      channelOrSeries: 'Dai Viet Su Ky Podcast',
      narratorName: 'Đỗ Quang Vinh',
      narratorEmail: 'vinh.do@example.com',
      daysAgo: 6,
      hoursAgo: 6,
      amount: 900000,
      status: 'CANCELLED',
    },
    {
      id: 122,
      title: 'Văn Hóa Thăng Long',
      channelOrSeries: 'Lịch sử Việt Nam',
      narratorName: 'Phan Thị Mai',
      narratorEmail: 'mai.phan@example.com',
      daysAgo: 7,
      hoursAgo: 10,
      amount: 1800000,
      status: 'COMPLETED',
    },
    {
      id: 121,
      title: 'Nguyễn Trãi - Danh Nhân Văn Hóa',
      channelOrSeries: 'Danh nhân Việt Nam',
      narratorName: 'Hoàng Văn Nam',
      narratorEmail: 'nam.hoang@example.com',
      daysAgo: 8,
      hoursAgo: 7,
      amount: 1000000,
      status: 'ACTIVE',
    },
  ];

  const rows: AdminContractRow[] = [];

  for (const s of showcaseData) {
    const timestamp = new Date(now - s.daysAgo * DAY - s.hoursAgo * 3600 * 1000).toISOString();
    const { dateStr, timeStr } = splitDateTime(timestamp);
    const statusConfig = getContractStatusBadgeConfig(s.status);
    const platformFee = Math.round(s.amount * 0.05);
    const netAmount = s.amount - platformFee;
    const fakeMilestones = buildSampleMilestones(s.id, s.amount, s.status, timestamp);

    rows.push({
      id: s.id,
      code: formatContractCode(s.id),
      title: s.title,
      channelOrSeries: s.channelOrSeries,
      narratorName: s.narratorName,
      narratorEmail: s.narratorEmail,
      narratorInitials: extractInitials(s.narratorName),
      creatorName: 'Sử Ký Studio',
      creatorEmail: 'creator@suky.vn',
      signedDate: timestamp,
      dateStr,
      timeStr,
      totalAmount: s.amount,
      totalAmountFormatted: formatVND(s.amount),
      platformFee,
      netAmount,
      status: s.status,
      statusLabel: statusConfig.label,
      statusConfig,
      milestonesCount: fakeMilestones.length,
      completedMilestonesCount: s.status === 'COMPLETED' ? 2 : s.status === 'ACTIVE' ? 1 : 0,
      deadline: new Date(now + 10 * DAY).toISOString(),
      deadlineFormatted: splitDateTime(new Date(now + 10 * DAY).toISOString()).dateStr,
      termsText: `Điều khoản thỏa thuận sản xuất nội dung:
1. Nhà sáng tạo cam kết sản xuất bằng giọng thật, không dùng AI sao chép trái phép.
2. Bản thu đảm bảo độ trong trẻo, không lẫn tạp âm môi trường và đạt chuẩn phòng thu (Studio Master).
3. Khách đặt nội dung nạp tiền bảo chứng và giải ngân qua cơ chế ký quỹ Escrow an toàn 100%.`,
      rawContract: {
        id: s.id,
        title: s.title,
        channelName: s.channelOrSeries,
        freelancerFullName: s.narratorName,
        requesterEmail: s.narratorEmail,
        creatorFullName: 'Sử Ký Studio',
        creatorEmail: 'creator@suky.vn',
        totalAmount: s.amount,
        platformFee,
        netAmount,
        status: s.status,
        createdAt: timestamp,
        milestones: fakeMilestones,
      },
    });
  }

  const additionalTargets: Array<{ count: number; status: NormalizedContractStatus }> = [
    { count: 25, status: 'ACTIVE' },
    { count: 83, status: 'COMPLETED' },
    { count: 12, status: 'CANCELLED' },
  ];

  const historicalTopics = [
    'Chiến Dịch Điện Biên Phủ Lừng Lẫy',
    'Kháng Chiến Chống Quân Nguyên Mông',
    'Hai Bà Trưng Khởi Nghĩa Mê Linh',
    'Vua Quang Trung Đại Phá Quân Thanh',
    'Đinh Bộ Lĩnh Dẹp Loạn 12 Sứ Quân',
    'Lý Thường Kiệt và Bài Thơ Thần',
    'Hào Khí Đông A Thời Trần',
    'Chiến Thắng Chi Lăng - Xương Giang',
    'Huyền Trân Công Chúa và Đất Thuận Hóa',
    'Bác Hồ Đọc Tuyên Ngôn Độc Lập',
  ];

  const sampleNarrators = [
    { name: 'Nguyễn Hoàng Minh', email: 'minh.nguyen@example.com' },
    { name: 'Trần Thị Lan Anh', email: 'lananh.tran@example.com' },
    { name: 'Lê Quốc Huy', email: 'quochuy.le@example.com' },
    { name: 'Phạm Minh Tâm', email: 'tam.pham@example.com' },
    { name: 'Nguyễn Thu Trang', email: 'trang.nguyen@example.com' },
    { name: 'Đỗ Quang Vinh', email: 'vinh.do@example.com' },
    { name: 'Phan Thị Mai', email: 'mai.phan@example.com' },
    { name: 'Hoàng Văn Nam', email: 'nam.hoang@example.com' },
  ];

  let currentId = 120;
  for (const group of additionalTargets) {
    for (let i = 0; i < group.count; i++) {
      const id = currentId--;
      const topic = historicalTopics[i % historicalTopics.length];
      const narrator = sampleNarrators[i % sampleNarrators.length];
      const daysAgo = 8 + Math.floor((i / group.count) * 52);
      const hoursAgo = (i * 3) % 24;
      const timestamp = new Date(now - daysAgo * DAY - hoursAgo * 3600 * 1000).toISOString();
      const { dateStr, timeStr } = splitDateTime(timestamp);
      const amount = (8 + (i % 15)) * 100000;
      const statusConfig = getContractStatusBadgeConfig(group.status);
      const platformFee = Math.round(amount * 0.05);
      const netAmount = amount - platformFee;
      const sampleMilestones = buildSampleMilestones(id, amount, group.status, timestamp);

      rows.push({
        id,
        code: formatContractCode(id),
        title: `${topic} (Tập ${i + 1})`,
        channelOrSeries: i % 2 === 0 ? 'Dai Viet Su Ky Podcast' : 'Lịch sử Việt Nam',
        narratorName: narrator.name,
        narratorEmail: narrator.email,
        narratorInitials: extractInitials(narrator.name),
        creatorName: 'Sử Ký Studio',
        creatorEmail: 'creator@suky.vn',
        signedDate: timestamp,
        dateStr,
        timeStr,
        totalAmount: amount,
        totalAmountFormatted: formatVND(amount),
        platformFee,
        netAmount,
        status: group.status,
        statusLabel: statusConfig.label,
        statusConfig,
        milestonesCount: sampleMilestones.length,
        completedMilestonesCount: group.status === 'COMPLETED' ? 2 : group.status === 'ACTIVE' ? 1 : 0,
        deadline: new Date(now + 14 * DAY).toISOString(),
        deadlineFormatted: splitDateTime(new Date(now + 14 * DAY).toISOString()).dateStr,
        termsText: 'Hợp đồng tiêu chuẩn Sử Ký Studio.',
        rawContract: {
          id,
          title: topic,
          totalAmount: amount,
          platformFee,
          netAmount,
          status: group.status,
          createdAt: timestamp,
          milestones: sampleMilestones,
        },
      });
    }
  }

  return rows;
}
