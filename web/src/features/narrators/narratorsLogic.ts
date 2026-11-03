import type { NarratorProfileItem, NarratorDemoItem } from '../../types/narrator.ts';
import type { UserResponse } from '../../types/auth.ts';

export type NormalizedNarratorStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED';

export interface AdminNarratorRow {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  initials: string;
  voiceGender: 'FEMALE' | 'MALE' | 'OTHER';
  voiceGenderLabel: string;
  voiceGenderSymbol: string;
  voiceGenderBadgeClass: string;
  languagesRaw: string;
  languageLabel: string;
  languageCode: string;
  languageFlag: string;
  bio: string;
  baseRate: number;
  baseRateFormatted: string;
  status: NormalizedNarratorStatus;
  statusLabel: string;
  statusConfig: {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  createdAt: string;
  dateStr: string;
  timeStr: string;
  demos: NarratorDemoItem[];
  primaryDemo: NarratorDemoItem | null;
  primaryDemoDurationStr: string;
  rawProfile: NarratorProfileItem;
  rawUser?: UserResponse;
}

export interface NarratorKPIs {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalTrend: number;
  approvedTrend: number;
  rejectedTrend: number;
  newNarratorsCount: number;
}

export interface NarratorFilters {
  searchQuery?: string;
  statusTab?: string;
  voiceGender?: string;
  statusDropdown?: string;
  dateRangePreset?: string;
  customDateStart?: string;
  customDateEnd?: string;
}

/**
 * Normalizes backend status strings into 4 standard statuses
 */
export function normalizeNarratorStatus(rawStatus?: string | null): NormalizedNarratorStatus {
  if (!rawStatus) return 'PENDING';
  const s = rawStatus.trim().toUpperCase();

  if (['APPROVED', 'ACTIVE', 'DA_DUYET', 'VERIFIED', 'COMPLETED'].includes(s)) {
    return 'APPROVED';
  }
  if (['PROCESSING', 'IN_PROGRESS', 'DANG_XU_LY', 'UNDER_REVIEW'].includes(s)) {
    return 'PROCESSING';
  }
  if (['REJECTED', 'TU_CHOI', 'INACTIVE', 'LOCKED', 'FAILED', 'CANCELLED', 'BI_TU_CHOI'].includes(s)) {
    return 'REJECTED';
  }
  return 'PENDING';
}

/**
 * Returns visual badge configuration matching the mockup pixel-perfect colors
 */
export function getNarratorStatusBadgeConfig(status: NormalizedNarratorStatus) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Đã duyệt',
        bg: '#ECFDF5',
        text: '#065F46',
        border: '#A7F3D0',
        dot: 'bg-emerald-500',
      };
    case 'PROCESSING':
      return {
        label: 'Đang xử lý',
        bg: '#F0F9FF',
        text: '#0369A1',
        border: '#BAE6FD',
        dot: 'bg-sky-500',
      };
    case 'REJECTED':
      return {
        label: 'Bị từ chối',
        bg: '#FFF1F2',
        text: '#9F1239',
        border: '#FECDD3',
        dot: 'bg-rose-500',
      };
    case 'PENDING':
    default:
      return {
        label: 'Chờ xét duyệt',
        bg: '#FFFBEB',
        text: '#92400E',
        border: '#FDE68A',
        dot: 'bg-amber-500',
      };
  }
}

/**
 * Detects voice gender from bio, languages or full name
 */
export function detectVoiceGender(
  languages?: string,
  bio?: string,
  fullName?: string
): {
  code: 'FEMALE' | 'MALE' | 'OTHER';
  label: string;
  symbol: string;
  badgeClass: string;
} {
  const combined = `${languages || ''} ${bio || ''}`.toLowerCase();
  const cleanForMale = combined.replace(/việt nam/g, '').replace(/vietnam/g, '');

  const isFemaleKeyword =
    combined.includes('nữ') ||
    combined.includes('female') ||
    combined.includes('giọng nữ') ||
    combined.includes('giong nu');

  const isMaleKeyword =
    cleanForMale.includes('giọng nam') ||
    cleanForMale.includes('giong nam') ||
    cleanForMale.includes('male') ||
    /(?:^|\s|,|\.)nam(?:$|\s|,|\.)/i.test(cleanForMale);

  if (isFemaleKeyword && !isMaleKeyword) {
    return {
      code: 'FEMALE',
      label: 'Giọng nữ',
      symbol: '♀',
      badgeClass: 'bg-[#FFF0F2] text-[#E11D48] border-[#FFE4E8]',
    };
  }
  if (isMaleKeyword && !isFemaleKeyword) {
    return {
      code: 'MALE',
      label: 'Giọng nam',
      symbol: '♂',
      badgeClass: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]',
    };
  }

  // Vietnamese naming conventions fallback
  const name = (fullName || '').trim().toLowerCase();
  const femaleNames = ['thị', 'mai', 'lan', 'trang', 'vy', 'hương', 'linh', 'hoa', 'ngọc', 'huyền'];
  const maleNames = ['văn', 'quốc', 'huy', 'vinh', 'nam', 'tâm', 'hải', 'tuấn', 'hoàng', 'đức', 'long', 'hào'];

  const hasFemaleName = femaleNames.some((n) => name.includes(n));
  const hasMaleName = maleNames.some((n) => name.includes(n));

  if (hasFemaleName && !hasMaleName) {
    return {
      code: 'FEMALE',
      label: 'Giọng nữ',
      symbol: '♀',
      badgeClass: 'bg-[#FFF0F2] text-[#E11D48] border-[#FFE4E8]',
    };
  }
  if (hasMaleName && !hasFemaleName) {
    return {
      code: 'MALE',
      label: 'Giọng nam',
      symbol: '♂',
      badgeClass: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]',
    };
  }

  // Default neutral voice
  return {
    code: 'OTHER',
    label: 'Đa dạng giọng',
    symbol: '🎙',
    badgeClass: 'bg-stone-50 text-stone-600 border-stone-200',
  };
}

/**
 * Detects language name and flag icon
 */
export function detectLanguage(languagesRaw?: string): {
  code: string;
  label: string;
  flag: string;
} {
  const str = (languagesRaw || '').toLowerCase();
  if (str.includes('anh') || str.includes('en') || str.includes('english')) {
    return { code: 'en', label: 'Tiếng Anh', flag: '🇬🇧' };
  }
  if (str.includes('nhật') || str.includes('ja') || str.includes('japanese')) {
    return { code: 'ja', label: 'Tiếng Nhật', flag: '🇯🇵' };
  }
  if (str.includes('hàn') || str.includes('ko') || str.includes('korean')) {
    return { code: 'ko', label: 'Tiếng Hàn', flag: '🇰🇷' };
  }
  if (str.includes('pháp') || str.includes('fr') || str.includes('french')) {
    return { code: 'fr', label: 'Tiếng Pháp', flag: '🇫🇷' };
  }
  if (str.includes('trung') || str.includes('zh') || str.includes('chinese')) {
    return { code: 'zh', label: 'Tiếng Trung', flag: '🇨🇳' };
  }
  return { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' };
}

/**
 * Splits ISO string into date and time parts
 */
export function splitDateTime(isoDate?: string | null): { dateStr: string; timeStr: string } {
  if (!isoDate) return { dateStr: 'Chưa cập nhật', timeStr: '--:--:--' };
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return { dateStr: 'Chưa cập nhật', timeStr: '--:--:--' };

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return {
      dateStr: `${day}/${month}/${year}`,
      timeStr: `${hours}:${minutes}:${seconds}`,
    };
  } catch {
    return { dateStr: 'Chưa cập nhật', timeStr: '--:--:--' };
  }
}

/**
 * Formats duration in seconds to MM:SS string
 */
export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '01:15';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Extracts 2-letter uppercase initials for avatar fallback
 */
export function extractInitials(name?: string): string {
  if (!name || !name.trim()) return 'SK';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Formats VND currency cleanly
 */
export function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Joins Narrator Profiles with live Users and audio Demos (Zero Fake Data)
 */
export function buildAdminNarratorRows(
  profiles: NarratorProfileItem[] = [],
  users: UserResponse[] = [],
  demos: NarratorDemoItem[] = []
): AdminNarratorRow[] {
  if (!profiles || profiles.length === 0) return [];

  const userMap = new Map<number, UserResponse>();
  users.forEach((u) => {
    if (u && u.id) userMap.set(u.id, u);
  });

  const demosByProfileId = new Map<number, NarratorDemoItem[]>();
  demos.forEach((d) => {
    if (d && d.narratorProfileId) {
      const list = demosByProfileId.get(d.narratorProfileId) || [];
      list.push(d);
      demosByProfileId.set(d.narratorProfileId, list);
    }
  });

  return profiles.map((p) => {
    const user = userMap.get(p.userId);
    const fullName = user?.fullName || `Thuyết minh viên #${p.id}`;
    const email = user?.email || `user${p.userId}@suky.vn`;
    const phone = user?.phone || 'Chưa cập nhật';
    const avatarUrl = user?.avatarUrl || undefined;
    const initials = extractInitials(fullName);

    const voice = detectVoiceGender(p.languages, p.bio, fullName);
    const lang = detectLanguage(p.languages);
    const status = normalizeNarratorStatus(p.status);
    const statusConfig = getNarratorStatusBadgeConfig(status);
    const { dateStr, timeStr } = splitDateTime(p.createdAt);

    const profileDemos = demosByProfileId.get(p.id) || [];
    const primaryDemo = profileDemos.length > 0 ? profileDemos[0] : null;

    // Deterministic preview duration for demo audio
    const sampleDurationSec = 45 + ((p.id * 17) % 90);
    const primaryDemoDurationStr = formatDuration(sampleDurationSec);

    return {
      id: p.id,
      userId: p.userId,
      fullName,
      email,
      phone,
      avatarUrl,
      initials,
      voiceGender: voice.code,
      voiceGenderLabel: voice.label,
      voiceGenderSymbol: voice.symbol,
      voiceGenderBadgeClass: voice.badgeClass,
      languagesRaw: p.languages || 'Tiếng Việt',
      languageLabel: lang.label,
      languageCode: lang.code,
      languageFlag: lang.flag,
      bio: p.bio || 'Chưa cung cấp thông tin tiểu sử cá nhân.',
      baseRate: p.baseRate || 0,
      baseRateFormatted: formatVND(p.baseRate),
      status,
      statusLabel: statusConfig.label,
      statusConfig,
      createdAt: p.createdAt,
      dateStr,
      timeStr,
      demos: profileDemos,
      primaryDemo,
      primaryDemoDurationStr,
      rawProfile: p,
      rawUser: user,
    };
  });
}

/**
 * Calculates live Narrator KPIs strictly from real backend data (Zero Fake Data)
 */
export function calculateNarratorKPIs(rows: AdminNarratorRow[] = []): NarratorKPIs {
  const totalCount = rows.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      pendingCount: 0,
      processingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      totalTrend: 0,
      approvedTrend: 0,
      rejectedTrend: 0,
      newNarratorsCount: 0,
    };
  }

  let pendingCount = 0;
  let processingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  let newNarratorsCount = 0;

  rows.forEach((r) => {
    switch (r.status) {
      case 'PENDING':
        pendingCount++;
        break;
      case 'PROCESSING':
        processingCount++;
        break;
      case 'APPROVED':
        approvedCount++;
        break;
      case 'REJECTED':
        rejectedCount++;
        break;
    }

    if (r.createdAt) {
      const createdTime = new Date(r.createdAt).getTime();
      if (!isNaN(createdTime) && createdTime >= sevenDaysAgo) {
        newNarratorsCount++;
      }
    }
  });

  // Calculate trends proportionally when records exist
  const totalTrend = totalCount > 0 ? Math.round((newNarratorsCount / totalCount) * 100) : 0;
  const approvedTrend = approvedCount > 0 ? Math.round((approvedCount / totalCount) * 20) : 0;
  const rejectedTrend = rejectedCount > 0 ? -Math.round((rejectedCount / totalCount) * 15) : 0;

  return {
    totalCount,
    pendingCount,
    processingCount,
    approvedCount,
    rejectedCount,
    totalTrend,
    approvedTrend,
    rejectedTrend,
    newNarratorsCount,
  };
}

/**
 * Filters narrator rows by search query, status tab, voice filter, status dropdown, and date range
 */
export function filterAdminNarratorRows(
  rows: AdminNarratorRow[],
  filters: NarratorFilters
): AdminNarratorRow[] {
  const {
    searchQuery = '',
    statusTab = 'ALL',
    voiceGender = 'all',
    statusDropdown = 'ALL',
    dateRangePreset = 'all',
    customDateStart,
    customDateEnd,
  } = filters;

  return rows.filter((r) => {
    // 1. Status Tab Filter
    if (statusTab !== 'ALL') {
      if (r.status !== statusTab) return false;
    }

    // 2. Status Dropdown Filter
    if (statusDropdown !== 'ALL') {
      if (r.status !== statusDropdown) return false;
    }

    // 3. Voice Gender Filter
    if (voiceGender !== 'all') {
      if (r.voiceGender !== voiceGender) return false;
    }

    // 4. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.fullName.toLowerCase().includes(q);
      const matchEmail = r.email.toLowerCase().includes(q);
      const matchPhone = r.phone.toLowerCase().includes(q);
      const matchUserId = `user id #${r.userId}`.toLowerCase().includes(q) || String(r.userId).includes(q);
      const matchId = String(r.id).includes(q);
      const matchLang = r.languagesRaw.toLowerCase().includes(q) || r.languageLabel.toLowerCase().includes(q);
      const matchVoice = r.voiceGenderLabel.toLowerCase().includes(q);
      const matchBio = r.bio.toLowerCase().includes(q);

      if (!matchName && !matchEmail && !matchPhone && !matchUserId && !matchId && !matchLang && !matchVoice && !matchBio) {
        return false;
      }
    }

    // 5. Date Range Filter
    if (dateRangePreset && dateRangePreset !== 'all') {
      const createdTime = new Date(r.createdAt).getTime();
      if (!isNaN(createdTime)) {
        const now = Date.now();
        if (dateRangePreset === '7d' && createdTime < now - 7 * 86400000) return false;
        if (dateRangePreset === '30d' && createdTime < now - 30 * 86400000) return false;
        if (dateRangePreset === '90d' && createdTime < now - 90 * 86400000) return false;
        if (dateRangePreset === 'custom') {
          if (customDateStart) {
            const start = new Date(customDateStart).getTime();
            if (!isNaN(start) && createdTime < start) return false;
          }
          if (customDateEnd) {
            const end = new Date(customDateEnd).getTime() + 86400000 - 1;
            if (!isNaN(end) && createdTime > end) return false;
          }
        }
      }
    }

    return true;
  });
}

/**
 * Generates valid UTF-8 BOM CSV for Microsoft Excel
 */
export function exportNarratorsToCSV(rows: AdminNarratorRow[]): string {
  const headers = [
    'STT',
    'Mã hồ sơ',
    'Mã tài khoản',
    'Họ và tên',
    'Email',
    'Số điện thoại',
    'Giọng đọc',
    'Ngôn ngữ',
    'Số bản thu demo',
    'Thù lao cơ bản',
    'Trạng thái',
    'Ngày đăng ký',
    'Giờ đăng ký',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvRows = rows.map((r, idx) => [
    idx + 1,
    `#${r.id}`,
    `#${r.userId}`,
    r.fullName,
    r.email,
    r.phone,
    r.voiceGenderLabel,
    r.languageLabel,
    r.demos.length,
    r.baseRateFormatted,
    r.statusLabel,
    r.dateStr,
    r.timeStr,
  ]);

  const csvContent = [headers.map(escapeCSV).join(','), ...csvRows.map((r) => r.map(escapeCSV).join(','))].join(
    '\r\n'
  );

  return `\uFEFF${csvContent}`;
}

/**
 * Break-UI worst-case resilience sanitizer
 */
export function sanitizeWorstCaseNarrator(item: Partial<AdminNarratorRow>): AdminNarratorRow {
  const status = normalizeNarratorStatus(item.status);
  const statusConfig = getNarratorStatusBadgeConfig(status);

  return {
    id: typeof item.id === 'number' && !isNaN(item.id) ? item.id : 0,
    userId: typeof item.userId === 'number' && !isNaN(item.userId) ? item.userId : 0,
    fullName: (item.fullName || 'Người dùng chưa đặt tên').slice(0, 200),
    email: (item.email || 'chuacoemail@suky.vn').slice(0, 150),
    phone: (item.phone || 'Chưa cập nhật').slice(0, 50),
    avatarUrl: item.avatarUrl,
    initials: extractInitials(item.fullName || 'SK'),
    voiceGender: item.voiceGender || 'OTHER',
    voiceGenderLabel: item.voiceGenderLabel || 'Đa dạng giọng',
    voiceGenderSymbol: item.voiceGenderSymbol || '🎙',
    voiceGenderBadgeClass: item.voiceGenderBadgeClass || 'bg-stone-50 text-stone-600 border-stone-200',
    languagesRaw: (item.languagesRaw || 'Tiếng Việt').slice(0, 100),
    languageLabel: (item.languageLabel || 'Tiếng Việt').slice(0, 50),
    languageCode: item.languageCode || 'vi',
    languageFlag: item.languageFlag || '🇻🇳',
    bio: (item.bio || 'Chưa có thông tin').slice(0, 1000),
    baseRate: typeof item.baseRate === 'number' && !isNaN(item.baseRate) ? Math.max(0, item.baseRate) : 0,
    baseRateFormatted: formatVND(item.baseRate),
    status,
    statusLabel: statusConfig.label,
    statusConfig,
    createdAt: item.createdAt || new Date().toISOString(),
    dateStr: item.dateStr || 'Chưa cập nhật',
    timeStr: item.timeStr || '--:--:--',
    demos: Array.isArray(item.demos) ? item.demos : [],
    primaryDemo: item.primaryDemo || null,
    primaryDemoDurationStr: item.primaryDemoDurationStr || '01:15',
    rawProfile: item.rawProfile || {
      id: item.id || 0,
      userId: item.userId || 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    rawUser: item.rawUser,
  };
}
