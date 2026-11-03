import type { KycProfile } from '../../types/kyc';

export interface KycStatsResult {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalTrend: string;
  pendingTrend: string;
  approvedTrend: string;
  rejectedTrend: string;
}

export interface VerificationMethodConfig {
  label: string;
  type: 'email' | 'phone' | 'cccd' | 'passport';
  description: string;
}

export interface KycStatusBadgeConfig {
  label: string;
  dotColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Deterministic color palette for avatar initials.
 * Reflects Sử Ký warm heritage tones (rose, amber, coral, purple, emerald, sky).
 */
export const AVATAR_PALETTES = [
  { bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]', border: 'border-[#FECDD3]' }, // Rose (LA)
  { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' }, // Amber (LH)
  { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', border: 'border-[#FED7AA]' }, // Coral
  { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]', border: 'border-[#DDD6FE]' }, // Purple (PT)
  { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]' }, // Emerald
  { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]' }, // Sky
];

/**
 * Calculate KYC operational KPI counts with fallback support.
 */
export function calculateKycStats(
  items: KycProfile[] = [],
  queryTotals?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  }
): KycStatsResult {
  const safeItems = Array.isArray(items) ? items : [];

  const total =
    queryTotals?.total !== undefined
      ? queryTotals.total
      : safeItems.length;

  const pending =
    queryTotals?.pending !== undefined
      ? queryTotals.pending
      : safeItems.filter((i) => i?.status?.toUpperCase() === 'PENDING').length;

  const approved =
    queryTotals?.approved !== undefined
      ? queryTotals.approved
      : safeItems.filter((i) => i?.status?.toUpperCase() === 'APPROVED').length;

  const rejected =
    queryTotals?.rejected !== undefined
      ? queryTotals.rejected
      : safeItems.filter((i) => i?.status?.toUpperCase() === 'REJECTED').length;

  return {
    total,
    pending,
    approved,
    rejected,
    totalTrend: '+12%',
    pendingTrend: '+2',
    approvedTrend: '+5',
    rejectedTrend: '+1',
  };
}

/**
 * Maps verification method string to visual configuration.
 */
export function getVerificationMethodBadge(method?: string | null): VerificationMethodConfig {
  const norm = (method || '').trim().toUpperCase();

  if (norm === 'PHONE' || norm === 'SMS' || norm === 'OTP_SMS') {
    return {
      label: 'OTP qua SMS',
      type: 'phone',
      description: 'Xác thực qua mã OTP gửi tới số điện thoại',
    };
  }

  if (norm === 'CCCD' || norm === 'CMND' || norm === 'ID_CARD') {
    return {
      label: 'CCCD/CMND',
      type: 'cccd',
      description: 'Căn cước công dân / Chứng minh nhân dân',
    };
  }

  if (norm === 'PASSPORT' || norm === 'HO_CHIEU') {
    return {
      label: 'Hộ chiếu',
      type: 'passport',
      description: 'Hộ chiếu phổ thông quốc tế',
    };
  }

  // Default to OTP qua Email
  return {
    label: 'OTP qua Email',
    type: 'email',
    description: 'Xác thực qua mã OTP gửi tới hộp thư điện tử',
  };
}

/**
 * Normalizes KYC status to display pill badge styling matching mockup.
 */
export function getKycStatusBadgeConfig(status?: string | null): KycStatusBadgeConfig {
  const norm = (status || '').trim().toUpperCase();

  switch (norm) {
    case 'APPROVED':
      return {
        label: 'Đã phê duyệt',
        dotColor: 'bg-[#10B981]',
        textColor: 'text-[#1E7E34]',
        bgColor: 'bg-[#EAF7EE]',
        borderColor: 'border-[#C7EED8]',
      };
    case 'REJECTED':
      return {
        label: 'Bị từ chối',
        dotColor: 'bg-[#EF4444]',
        textColor: 'text-[#DC2626]',
        bgColor: 'bg-[#FDECEC]',
        borderColor: 'border-[#FECACA]',
      };
    case 'PENDING':
    default:
      return {
        label: 'Chờ duyệt',
        dotColor: 'bg-[#F59E0B]',
        textColor: 'text-[#D97706]',
        bgColor: 'bg-[#FEF6EC]',
        borderColor: 'border-[#FDE68A]',
      };
  }
}

/**
 * Extracts 1 or 2 capital initials from a full name.
 * e.g. "Trần Thị Lan Anh" -> "LA", "Phạm Tuấn" -> "PT", "Tran Hung Dao" -> "HD".
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'SK';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SK';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 3) {
    // 3 words: Họ (parts[0]) + Tên (parts[2]), e.g. "Lê Quốc Huy" -> "LH"
    return (parts[0][0] + parts[2][0]).toUpperCase();
  }
  // 4 or more words: Tên đệm + Tên chính, e.g. "Trần Thị Lan Anh" -> "LA"
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministically picks an avatar color palette based on name or email hash.
 */
export function getAvatarColor(identifier?: string | null): (typeof AVATAR_PALETTES)[number] {
  if (!identifier) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Format ISO datetime into Vietnamese display: HH:mm dd/MM/yyyy
 * e.g. "2026-10-17T10:51:00Z" -> "10:51 17/10/2026"
 */
export function formatKycDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Safely format phone number with spacing e.g. "0912 345 678"
 */
export function formatPhoneSpaced(phone?: string | null): string {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Filters KYC profiles client-side for immediate responsive search & filter.
 */
export function filterKycProfiles(
  items: KycProfile[],
  filters: {
    search?: string;
    status?: string;
    method?: string;
    dateRange?: string;
  }
): KycProfile[] {
  if (!Array.isArray(items)) return [];

  const searchKeyword = (filters.search || '').trim().toLowerCase();
  const targetStatus = (filters.status || '').trim().toUpperCase();
  const targetMethod = (filters.method || '').trim().toUpperCase();

  return items.filter((item) => {
    // 1. Status Filter
    if (targetStatus && targetStatus !== 'ALL' && targetStatus !== '') {
      if ((item.status || '').toUpperCase() !== targetStatus) {
        return false;
      }
    }

    // 2. Verification Method Filter
    if (targetMethod && targetMethod !== 'ALL' && targetMethod !== '') {
      const itemMethod = (item.verificationMethod || '').toUpperCase();
      if (targetMethod === 'EMAIL' && itemMethod !== 'EMAIL') return false;
      if (targetMethod === 'PHONE' && itemMethod !== 'PHONE' && itemMethod !== 'SMS') return false;
      if (targetMethod === 'CCCD' && itemMethod !== 'CCCD' && itemMethod !== 'CMND' && itemMethod !== 'ID_CARD') return false;
      if (targetMethod === 'PASSPORT' && itemMethod !== 'PASSPORT' && itemMethod !== 'HO_CHIEU') return false;
    }

    // 3. Search Keyword Filter
    if (searchKeyword) {
      const fullName = (item.fullName || '').toLowerCase();
      const userEmail = (item.userEmail || '').toLowerCase();
      const contactEmail = (item.contactEmail || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const userId = String(item.userId || '').toLowerCase();
      const formattedUserId = `#${String(item.userId || '').padStart(3, '0')}`.toLowerCase();
      const id = String(item.id || '').toLowerCase();

      const matches =
        fullName.includes(searchKeyword) ||
        userEmail.includes(searchKeyword) ||
        contactEmail.includes(searchKeyword) ||
        phone.includes(searchKeyword) ||
        userId.includes(searchKeyword) ||
        formattedUserId.includes(searchKeyword) ||
        id.includes(searchKeyword);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Generates UTF-8 BOM CSV for downloading KYC list.
 */
export function generateKycProfilesCSV(items: KycProfile[]): string {
  const safeItems = Array.isArray(items) ? items : [];

  const headers = [
    'Mã hồ sơ',
    'User ID',
    'Họ và tên',
    'Email tài khoản',
    'Email liên hệ',
    'Số điện thoại',
    'Phương thức xác thực',
    'Trạng thái KYC',
    'Ngày nộp',
    'Ngày xác thực OTP',
    'Tên ngân hàng',
    'Số tài khoản ngân hàng',
    'Chủ tài khoản',
    'Lý do từ chối',
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = safeItems.map((item) => {
    const methodBadge = getVerificationMethodBadge(item.verificationMethod);
    const statusBadge = getKycStatusBadgeConfig(item.status);

    return [
      escapeCSV(item.id),
      escapeCSV(`#${String(item.userId).padStart(3, '0')}`),
      escapeCSV(item.fullName || 'Chưa cập nhật tên'),
      escapeCSV(item.userEmail || ''),
      escapeCSV(item.contactEmail || item.userEmail || ''),
      escapeCSV(item.phone || ''),
      escapeCSV(methodBadge.label),
      escapeCSV(statusBadge.label),
      escapeCSV(formatKycDateTime(item.createdAt)),
      escapeCSV(item.otpVerifiedAt ? formatKycDateTime(item.otpVerifiedAt) : 'Chưa xác thực'),
      escapeCSV(item.bankName || ''),
      escapeCSV(item.bankAccountNumber || ''),
      escapeCSV(item.bankAccountHolder || ''),
      escapeCSV(item.rejectionReason || ''),
    ].join(',');
  });

  // UTF-8 BOM prefix (\uFEFF) ensures Excel handles Vietnamese diacritics natively
  return '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
}

/**
 * Trigger browser file download from CSV text.
 */
export function downloadKycProfilesCSV(items: KycProfile[], filename?: string): void {
  const csvContent = generateKycProfilesCSV(items);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', filename || `danh-sach-kyc-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
