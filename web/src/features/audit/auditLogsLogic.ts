import type {
  AuditLogItem,
  RefreshTokenAuditItem,
  SystemConfigAuditItem,
} from '../../types/audit';
import type { UserResponse } from '../../types/auth';

export type AuditLogCategory = 'SYSTEM' | 'USER' | 'SECURITY';
export type AuditLogCategoryFilter = 'ALL' | AuditLogCategory;

export type AuditActionKind =
  | 'UPDATE'
  | 'APPROVE'
  | 'LOGIN'
  | 'CREATE'
  | 'DELETE'
  | 'REJECT'
  | 'GRANT_ROLE'
  | 'LOGOUT'
  | 'OTHER';

export type AuditActionFilter = 'ALL' | AuditActionKind;

export type AuditTargetIconKind = 'document' | 'settings' | 'user' | 'shield';

export type AuditActorBadgeTone =
  | 'amber'
  | 'rose'
  | 'purple'
  | 'emerald'
  | 'blue'
  | 'stone';

export type AuditActorStatusTone = 'emerald' | 'rose' | 'stone';
export type AuditRoleBadgeTone = 'crimson' | 'amber' | 'emerald' | 'stone';

export interface AuditActorRoleBadge {
  code: string;
  label: string;
  isPrimary: boolean;
  tone: AuditRoleBadgeTone;
}

export interface AdminAuditLogRow {
  id: number;
  rawAuditLogId: number | null;
  raw: AuditLogItem;
  actorId: number | null;
  actorUser: UserResponse | null;
  actorName: string;
  actorEmail: string;
  actorPhone: string | null;
  actorAvatarUrl: string | null;
  actorInitials: string;
  actorBadgeTone: AuditActorBadgeTone;
  actorRoleLabel: string;
  actorRoleBadges: AuditActorRoleBadge[];
  actorStatusLabel: string;
  actorStatusTone: AuditActorStatusTone;
  actionCode: string;
  actionKind: AuditActionKind;
  actionLabel: string;
  targetCode: string;
  targetId: number | null;
  targetLabel: string;
  targetSubtitle: string;
  targetIconKind: AuditTargetIconKind;
  targetRoute: string | null;
  detailText: string;
  category: AuditLogCategory;
  categoryLabel: string;
  sourceModuleLabel: string;
  backendFlowSummary: string;
  ipAddress: string | null;
  ipDisplayLabel: string;
  createdAtIso: string | null;
  createdAtMs: number;
  datePart: string;
  timePart: string;
  fullDateTime: string;
}

export interface AuditLogKpis {
  totalLogs: number;
  userLogsCount: number;
  systemLogsCount: number;
  securityLogsCount: number;
  recent7dCount: number;
  prev7dCount: number;
  diff7dCount: number;
  totalTrendPercent: number;
  userTrendPercent: number;
  systemTrendPercent: number;
  securityTrendPercent: number;
}

export interface AuditLogFilterState {
  searchQuery: string;
  categoryFilter: AuditLogCategoryFilter;
  actionFilter: AuditActionFilter;
  actorFilter: string;
  dateRangePreset: string;
  customDateStart?: string;
  customDateEnd?: string;
}

export interface AuditActorOption {
  value: string;
  label: string;
  email: string;
  count: number;
}

export interface RealDomainAuditSources {
  auditLogs?: AuditLogItem[] | null;
  users?: UserResponse[] | null;
  refreshTokens?: RefreshTokenAuditItem[] | null;
  policyConfigs?: Array<{
    id?: number | null;
    tier?: string | null;
    label?: string | null;
    minScore?: number | null;
    maxScore?: number | null;
    description?: string | null;
    actionType?: string | null;
    isActive?: boolean | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }> | null;
  systemConfigs?: SystemConfigAuditItem[] | null;
  moderationReviews?: Array<{
    reviewId?: number | null;
    contentId?: number | null;
    artifactId?: number | null;
    title?: string | null;
    channelName?: string | null;
    creatorEmail?: string | null;
    decision?: string | null;
    adminReason?: string | null;
    moderatorEmail?: string | null;
    aiShieldTierLabel?: string | null;
    aiShieldScore?: number | null;
    createdAt?: string | null;
    reviewedAt?: string | null;
  }> | null;
  moderationItems?: Array<{
    reviewId?: number | null;
    contentId?: number | null;
    artifactId?: number | null;
    title?: string | null;
    channelName?: string | null;
    creatorEmail?: string | null;
    decision?: string | null;
    adminReason?: string | null;
    moderatorEmail?: string | null;
    aiShieldTierLabel?: string | null;
    aiShieldScore?: number | null;
    createdAt?: string | null;
    reviewedAt?: string | null;
  }> | null;
  kycProfiles?: Array<{
    id?: number | null;
    userId?: number | null;
    userEmail?: string | null;
    fullName?: string | null;
    bankName?: string | null;
    status?: string | null;
    rejectionReason?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }> | null;
  contracts?: Array<{
    id?: number | null;
    title?: string | null;
    channelName?: string | null;
    creatorId?: number | null;
    creatorFullName?: string | null;
    requesterId?: number | null;
    requesterFullName?: string | null;
    totalAmount?: number | null;
    status?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }> | null;
  withdrawals?: Array<{
    id?: number | null;
    walletId?: number | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    amount?: number | null;
    status?: string | null;
    failureReason?: string | null;
    requestedAt?: string | null;
    processedAt?: string | null;
  }> | null;
  disputes?: Array<{
    id?: number | null;
    contractId?: number | null;
    raisedByUserId?: number | null;
    reason?: string | null;
    status?: string | null;
    resolutionNote?: string | null;
    createdAt?: string | null;
    resolvedAt?: string | null;
  }> | null;
}

const TONE_PALETTE: AuditActorBadgeTone[] = [
  'amber',
  'rose',
  'purple',
  'emerald',
  'blue',
  'stone',
];

/**
 * Loại bỏ dấu tiếng Việt để hỗ trợ tìm kiếm không dấu chính xác.
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Trích xuất chữ cái viết tắt từ tên người thực hiện (hỗ trợ Unicode & tên 1 ký tự).
 */
export function extractActorInitials(
  fullName?: string | null,
  email?: string | null
): string {
  const cleanName = (fullName || '').trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = Array.from(parts[0])[0] || '';
      const last = Array.from(parts[parts.length - 1])[0] || '';
      return `${first}${last}`.toUpperCase();
    }
    const chars = Array.from(parts[0]);
    return chars.slice(0, 2).join('').toUpperCase();
  }
  const cleanEmail = (email || '').trim();
  if (cleanEmail) {
    return Array.from(cleanEmail).slice(0, 2).join('').toUpperCase();
  }
  return 'HT';
}

/**
 * Chọn tông màu pastel cố định cho avatar chữ viết tắt dựa theo mã số hoặc tên.
 */
export function resolveActorBadgeTone(
  actorId?: number | null,
  name?: string | null
): AuditActorBadgeTone {
  if (typeof actorId === 'number' && Number.isFinite(actorId) && actorId > 0) {
    return TONE_PALETTE[Math.abs(actorId) % TONE_PALETTE.length];
  }
  const str = (name || 'HT').trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return TONE_PALETTE[Math.abs(hash) % TONE_PALETTE.length];
}

/**
 * Chuẩn hóa nhãn vai trò sang 100% tiếng Việt thuần túy (Tuyệt đối không trộn mã tiếng Anh).
 */
export function getActorRoleVietnameseLabel(roleCode?: string | null): string {
  const code = (roleCode || '')
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, '');
  switch (code) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'CREATOR':
      return 'Nhà sáng tạo';
    case 'VOICER':
    case 'NARRATOR':
      return 'Thuyết minh viên';
    case 'FREELANCER':
      return 'Cộng tác viên';
    case 'VIEWER':
    case 'USER':
      return 'Thính giả';
    default:
      return code ? 'Vai trò mở rộng' : 'Hệ thống';
  }
}

function resolveRoleBadgeTone(code: string): AuditRoleBadgeTone {
  const upper = code.toUpperCase();
  if (upper === 'ADMIN') return 'crimson';
  if (upper === 'CREATOR') return 'amber';
  if (upper === 'FREELANCER' || upper === 'NARRATOR' || upper === 'VOICER') {
    return 'emerald';
  }
  return 'stone';
}

/**
 * Trích xuất danh sách huy hiệu đa vai trò của người thực hiện từ UserResponse thực tế trên Backend.
 */
export function resolveActorRoleBadges(
  user?: UserResponse | null,
  fallbackRoleLabel: string = 'Quản trị viên'
): AuditActorRoleBadge[] {
  if (!user) {
    return [
      {
        code: 'SYSTEM',
        label: fallbackRoleLabel,
        isPrimary: true,
        tone: 'stone',
      },
    ];
  }

  const orderedCodes: string[] = [];
  const seen = new Set<string>();

  const addCode = (raw?: string | null) => {
    const clean = (raw || '')
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, '');
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      orderedCodes.push(clean);
    }
  };

  addCode(user.roleName);
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      addCode(r);
    }
  }
  if (user.isAdmin) addCode('ADMIN');
  if (user.isCreator) addCode('CREATOR');
  if (user.isFreelancer) addCode('FREELANCER');

  if (orderedCodes.length === 0) {
    orderedCodes.push('VIEWER');
  }

  const primaryCode =
    (user.roleName || '')
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, '') || orderedCodes[0];

  return orderedCodes.map((code) => {
    const baseLabel = getActorRoleVietnameseLabel(code);
    const isPrimary = code === primaryCode;
    return {
      code,
      label: isPrimary ? `${baseLabel} • Chính` : baseLabel,
      isPrimary,
      tone: resolveRoleBadgeTone(code),
    };
  });
}

export function resolvePrimaryActorRoleLabel(
  user?: UserResponse | null,
  fallbackRoleLabel: string = 'Quản trị viên'
): string {
  if (!user) return fallbackRoleLabel;
  const badges = resolveActorRoleBadges(user, fallbackRoleLabel);
  const codes = badges.map((b) => b.code);
  if (codes.includes('ADMIN')) return 'Quản trị viên';
  if (codes.includes('CREATOR')) return 'Nhà sáng tạo';
  if (codes.includes('NARRATOR') || codes.includes('VOICER')) {
    return 'Thuyết minh viên';
  }
  if (codes.includes('FREELANCER')) return 'Cộng tác viên';
  return getActorRoleVietnameseLabel(user.roleName || codes[0]);
}

/**
 * Chuẩn hóa trạng thái tài khoản người thực hiện từ UserResponse thực tế trên Backend.
 */
export function resolveActorStatusMeta(user?: UserResponse | null): {
  label: string;
  tone: AuditActorStatusTone;
} {
  if (!user) {
    return { label: 'Tự động', tone: 'emerald' };
  }
  const status = (user.status || 'ACTIVE').trim().toUpperCase();
  if (status === 'LOCKED' || status === 'TEMP_LOCKED' || status === 'BANNED') {
    return { label: 'Bị khóa', tone: 'rose' };
  }
  if (status === 'INACTIVE' || status === 'DISABLED') {
    return { label: 'Ngưng hoạt động', tone: 'stone' };
  }
  return { label: 'Hoạt động', tone: 'emerald' };
}

/**
 * Làm sạch và chuyển đổi mọi thuật ngữ tiếng Anh còn sót trong ghi chú sang 100% tiếng Việt chuẩn hóa.
 */
export function normalizeAuditNoteToVietnamese(rawNote?: string | null): string {
  const trimmed = (rawNote || '').trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/\bAI Shield\b/gi, 'Lá chắn kiểm duyệt')
    .replace(/\bROLE_ADMIN\b|\bADMIN\b/gi, 'Quản trị viên')
    .replace(/\bROLE_CREATOR\b|\bCREATOR\b/gi, 'Nhà sáng tạo')
    .replace(/\bROLE_NARRATOR\b|\bNARRATOR\b|\bVOICER\b/gi, 'Thuyết minh viên')
    .replace(/\bROLE_FREELANCER\b|\bFREELANCER\b/gi, 'Cộng tác viên')
    .replace(/\bROLE_VIEWER\b|\bVIEWER\b/gi, 'Thính giả')
    .replace(/\bPremium\b/gi, 'Cao cấp')
    .replace(/\bKYC\b/gi, 'định danh')
    .replace(/\bEscrow\b/gi, 'ký quỹ')
    .replace(/\bMANUAL_REVIEW\b/gi, 'kiểm duyệt thủ công')
    .replace(/\bAUTO_APPROVE\b/gi, 'tự động phê duyệt')
    .replace(/\bAUTO_REJECT\b/gi, 'tự động từ chối');
}

/**
 * Phân loại hành động chuẩn hóa 100% tiếng Việt theo bộ quy chiếu Sử Ký.
 */
export function resolveAuditActionMeta(
  actionType?: string | null,
  note?: string | null
): {
  kind: AuditActionKind;
  label: string;
} {
  const raw = (actionType || '').trim();
  const upper = removeVietnameseTones(raw).toUpperCase().replace(/[\s-]+/g, '_');
  const noteUpper = removeVietnameseTones(note || '').toUpperCase();

  if (
    upper.includes('GRANT') ||
    upper.includes('ASSIGN_ROLE') ||
    upper.includes('UPDATE_ROLE') ||
    upper.includes('ROLE') ||
    upper.includes('PERMISSION') ||
    upper.includes('PHAN_QUYEN') ||
    upper.includes('CAP_QUYEN')
  ) {
    return { kind: 'GRANT_ROLE', label: 'Phân quyền' };
  }

  if (
    upper === 'LOGIN' ||
    upper.includes('SIGN_IN') ||
    upper.includes('LOG_IN') ||
    upper.includes('DANG_NHAP')
  ) {
    return { kind: 'LOGIN', label: 'Đăng nhập' };
  }

  if (
    upper === 'LOGOUT' ||
    upper.includes('SIGN_OUT') ||
    upper.includes('LOG_OUT') ||
    upper.includes('REVOKE') ||
    upper.includes('DANG_XUAT')
  ) {
    return { kind: 'LOGOUT', label: 'Đăng xuất' };
  }

  if (
    upper.includes('APPROVE') ||
    upper.includes('ACCEPT') ||
    upper.includes('VERIFY') ||
    upper.includes('COMPLETE') ||
    upper === 'DUYET' ||
    upper.includes('PHE_DUYET')
  ) {
    return { kind: 'APPROVE', label: 'Duyệt' };
  }

  if (
    upper.includes('REJECT') ||
    upper.includes('DECLINE') ||
    upper.includes('DENY') ||
    upper.includes('FAIL') ||
    upper.includes('CANCEL') ||
    upper.includes('TU_CHOI')
  ) {
    return { kind: 'REJECT', label: 'Từ chối' };
  }

  if (
    upper.includes('DELETE') ||
    upper.includes('REMOVE') ||
    upper === 'XOA' ||
    upper.includes('XOA_')
  ) {
    return { kind: 'DELETE', label: 'Xóa' };
  }

  if (
    upper.includes('CREATE') ||
    upper.includes('INSERT') ||
    upper.includes('ADD') ||
    upper.includes('REGISTER') ||
    upper.includes('SUBMIT') ||
    upper.includes('TAO_MOI') ||
    upper === 'TAO'
  ) {
    return { kind: 'CREATE', label: 'Tạo mới' };
  }

  if (
    upper.includes('UPDATE') ||
    upper.includes('EDIT') ||
    upper.includes('MODIFY') ||
    upper.includes('PATCH') ||
    upper.includes('CONFIG') ||
    upper.includes('RESET') ||
    upper.includes('CAP_NHAT') ||
    upper.includes('CHINH_SUA')
  ) {
    return { kind: 'UPDATE', label: 'Cập nhật' };
  }

  if (noteUpper.includes('DANG NHAP')) return { kind: 'LOGIN', label: 'Đăng nhập' };
  if (noteUpper.includes('DANG XUAT')) return { kind: 'LOGOUT', label: 'Đăng xuất' };
  if (noteUpper.includes('CAP QUYEN') || noteUpper.includes('PHAN QUYEN')) {
    return { kind: 'GRANT_ROLE', label: 'Phân quyền' };
  }
  if (noteUpper.includes('TU CHOI')) return { kind: 'REJECT', label: 'Từ chối' };
  if (noteUpper.includes('DUYET')) return { kind: 'APPROVE', label: 'Duyệt' };
  if (noteUpper.includes('XOA')) return { kind: 'DELETE', label: 'Xóa' };
  if (noteUpper.includes('TAO ')) return { kind: 'CREATE', label: 'Tạo mới' };

  return { kind: 'UPDATE', label: 'Cập nhật' };
}

/**
 * Chuẩn hóa đối tượng bị tác động sang 100% tiếng Việt kèm biểu tượng, đường dẫn điều hướng và mô tả luồng Backend.
 */
export function resolveAuditTargetMeta(
  targetType?: string | null,
  targetId?: number | null,
  actionKind?: AuditActionKind,
  note?: string | null
): {
  label: string;
  subtitle: string;
  iconKind: AuditTargetIconKind;
  route: string | null;
  sourceModuleLabel: string;
  backendFlowSummary: string;
} {
  const raw = (targetType || '').trim();
  const upper = removeVietnameseTones(raw).toUpperCase().replace(/[\s-]+/g, '_');
  const hasId =
    typeof targetId === 'number' && Number.isFinite(targetId) && targetId > 0;

  if (
    upper.includes('POLICY') ||
    upper.includes('AI_SHIELD') ||
    upper.includes('CONFIG') ||
    upper.includes('CHINH_SACH')
  ) {
    return {
      label: 'Chính sách hệ thống',
      subtitle: hasId
        ? `Mã số: CS${String(targetId).padStart(4, '0')}`
        : 'Cấu hình Lá chắn kiểm duyệt',
      iconKind: 'document',
      route: '/admin/policies',
      sourceModuleLabel: 'Phân hệ Chính sách & Cấu hình thẩm định',
      backendFlowSummary:
        'Quản trị viên cập nhật ngưỡng điểm tin cậy tối thiểu và tối đa cho từng phân tầng kiểm duyệt hoặc tham số vận hành. Máy chủ kiểm tra tính hợp lệ của dải điểm (0% – 100%) và áp dụng ngay cho luồng đánh giá nội dung tự động.',
    };
  }

  if (
    upper.includes('NARRATOR') ||
    upper.includes('VOICER') ||
    upper.includes('HO_SO_THUYET_MINH')
  ) {
    return {
      label: 'Hồ sơ thuyết minh',
      subtitle: hasId
        ? `Mã số: TM${String(targetId).padStart(5, '0')}`
        : 'Hồ sơ giọng đọc',
      iconKind: 'document',
      route: '/admin/narrators',
      sourceModuleLabel: 'Phân hệ Quản lý Hồ sơ Thuyết minh viên',
      backendFlowSummary:
        'Quản trị viên thẩm định hồ sơ năng lực và bản thu mẫu của nghệ sĩ giọng đọc để phê duyệt hoạt động trên danh bạ thuyết minh viên Sử Ký.',
    };
  }

  if (upper.includes('CONTRACT') || upper.includes('HOP_DONG')) {
    return {
      label: 'Hợp đồng thu âm',
      subtitle: hasId
        ? `Mã số: HD${String(targetId).padStart(5, '0')}`
        : 'Hợp đồng dịch vụ',
      iconKind: 'document',
      route: '/admin/contracts',
      sourceModuleLabel: 'Phân hệ Hợp đồng & Lộ trình giai đoạn',
      backendFlowSummary:
        'Người đặt nội dung và Nhà sáng tạo xác lập hợp đồng sản xuất theo từng giai đoạn. Máy chủ tự động tính toán tổng giá trị, phí vận hành nền tảng (5%) và khoản thù lao thực nhận (95%).',
    };
  }

  if (
    upper.includes('MEMBERSHIP') ||
    upper.includes('PLAN') ||
    upper.includes('PACKAGE') ||
    upper.includes('GOI_HOI_VIEN')
  ) {
    return {
      label: 'Gói hội viên',
      subtitle: hasId
        ? `Mã số: GV${String(targetId).padStart(3, '0')}`
        : 'Gói dịch vụ kênh',
      iconKind: 'settings',
      route: '/admin/membership',
      sourceModuleLabel: 'Phân hệ Quản lý Gói hội viên kênh',
      backendFlowSummary:
        'Cập nhật thông số mức phí định kỳ, thời hạn hiệu lực và danh sách đặc quyền dành cho thính giả đăng ký gói hội viên trên kênh sáng tạo.',
    };
  }

  if (upper.includes('WITHDRAW') || upper.includes('RUT_TIEN')) {
    return {
      label: 'Yêu cầu rút tiền',
      subtitle: hasId
        ? `Mã số: RT${String(targetId).padStart(5, '0')}`
        : 'Lệnh giải ngân',
      iconKind: 'document',
      route: '/admin/withdrawals',
      sourceModuleLabel: 'Phân hệ Ví thanh toán & Đối soát giải ngân',
      backendFlowSummary:
        'Nhà sáng tạo gửi yêu cầu rút tiền từ số dư khả dụng về tài khoản ngân hàng chính chủ. Khi Quản trị viên xác nhận hoàn tất thì số dư được tất toán; nếu từ chối hoặc lỗi giao dịch, máy chủ tự động hoàn trả số tiền về ví.',
    };
  }

  if (
    upper.includes('ROLE') ||
    upper.includes('ACCOUNT') ||
    upper.includes('TAI_KHOAN') ||
    actionKind === 'GRANT_ROLE'
  ) {
    return {
      label: upper.includes('ROLE') && !hasId ? 'Phân quyền vai trò' : 'Tài khoản',
      subtitle: hasId
        ? `Mã số: TK${String(targetId).padStart(4, '0')}`
        : 'Phân quyền hệ thống',
      iconKind: 'user',
      route: '/admin/roles',
      sourceModuleLabel: 'Phân hệ Định danh & Phân quyền đa vai trò',
      backendFlowSummary:
        'Quản trị viên cấp hoặc điều chỉnh vai trò cho tài khoản người dùng. Máy chủ lưu vai trò vào bảng liên kết đa vai trò và áp dụng quy tắc bảo vệ không cho phép Quản trị viên tự hạ quyền của chính mình.',
    };
  }

  if (upper.includes('USER') || upper.includes('NGUOI_DUNG')) {
    return {
      label: 'Người dùng',
      subtitle: hasId
        ? `Mã số: TK${String(targetId).padStart(4, '0')}`
        : 'Hồ sơ người dùng',
      iconKind: 'user',
      route: '/admin/users',
      sourceModuleLabel: 'Phân hệ Quản trị Tài khoản người dùng',
      backendFlowSummary:
        'Quản lý vòng đời tài khoản người dùng trên nền tảng. Khi tài khoản bị chuyển sang trạng thái khóa hoặc ngưng hoạt động, máy chủ lập tức thu hồi toàn bộ phiên đăng nhập hiện hành.',
    };
  }

  if (
    upper.includes('CONTENT') ||
    upper.includes('ARTIFACT') ||
    upper.includes('VIDEO') ||
    upper.includes('PODCAST') ||
    upper.includes('MODERATION') ||
    upper.includes('NOI_DUNG')
  ) {
    return {
      label: 'Nội dung thuyết minh',
      subtitle: hasId
        ? `Mã số: ND${String(targetId).padStart(4, '0')}`
        : 'Tác phẩm nội dung',
      iconKind: 'document',
      route: '/admin/moderation',
      sourceModuleLabel: 'Phân hệ Kiểm duyệt & Xuất bản nội dung',
      backendFlowSummary:
        'Tác phẩm âm thanh và video lịch sử sau khi qua bộ lọc đánh giá tự động sẽ được Quản trị viên thẩm định để phê duyệt xuất bản công khai hoặc từ chối kèm lý do chỉnh sửa.',
    };
  }

  if (upper.includes('KYC') || upper.includes('XAC_THUC') || upper.includes('DINH_DANH')) {
    return {
      label: 'Hồ sơ định danh',
      subtitle: hasId
        ? `Mã số: DD${String(targetId).padStart(4, '0')}`
        : 'Định danh nhà sáng tạo',
      iconKind: 'shield',
      route: '/admin/kyc',
      sourceModuleLabel: 'Phân hệ Xác thực định danh Nhà sáng tạo',
      backendFlowSummary:
        'Đối soát thông tin cá nhân, phương thức xác thực và tài khoản ngân hàng thụ hưởng của ứng viên. Khi được phê duyệt, máy chủ kích hoạt tư cách Nhà sáng tạo cho tài khoản.',
    };
  }

  if (upper.includes('ESCROW') || upper.includes('KY_QUY')) {
    return {
      label: 'Khoản tiền ký quỹ',
      subtitle: hasId
        ? `Mã số: KQ${String(targetId).padStart(4, '0')}`
        : 'Sổ cái ký quỹ',
      iconKind: 'shield',
      route: '/admin/escrow',
      sourceModuleLabel: 'Phân hệ Quản lý Ký quỹ đảm bảo',
      backendFlowSummary:
        'Khoản tiền của người đặt nội dung được phong tỏa an toàn trên sổ cái ký quỹ theo từng giai đoạn hợp đồng và chỉ giải ngân khi sản phẩm được nghiệm thu.',
    };
  }

  if (upper.includes('DISPUTE') || upper.includes('KHIEU_NAI')) {
    return {
      label: 'Khiếu nại hợp đồng',
      subtitle: hasId
        ? `Mã số: KN${String(targetId).padStart(4, '0')}`
        : 'Hồ sơ tranh chấp',
      iconKind: 'document',
      route: '/admin/disputes',
      sourceModuleLabel: 'Phân hệ Trọng tài & Giải quyết tranh chấp',
      backendFlowSummary:
        'Ghi nhận tranh chấp phát sinh trong quá trình thực hiện hợp đồng thu âm. Quản trị viên đối soát bằng chứng từ hai bên và ban hành phán quyết xử lý khoản tiền ký quỹ.',
    };
  }

  if (
    upper.includes('WALLET') ||
    upper.includes('TRANSACTION') ||
    upper.includes('BIEN_DONG')
  ) {
    return {
      label: 'Biến động số dư',
      subtitle: hasId
        ? `Mã số: GD${String(targetId).padStart(5, '0')}`
        : 'Sổ cái giao dịch',
      iconKind: 'document',
      route: '/admin/transactions',
      sourceModuleLabel: 'Phân hệ Sổ cái Giao dịch & Biến động ví',
      backendFlowSummary:
        'Lưu vết toàn bộ giao dịch nạp tiền, khóa ký quỹ, nhận thù lao và rút tiền trên ví điện tử của người dùng.',
    };
  }

  if (
    upper.includes('SYSTEM') ||
    upper.includes('AUTH') ||
    upper.includes('SESSION') ||
    upper.includes('TOKEN') ||
    upper.includes('HE_THONG') ||
    actionKind === 'LOGIN' ||
    actionKind === 'LOGOUT'
  ) {
    return {
      label: 'Hệ thống',
      subtitle: hasId
        ? `Phiên số: #${targetId}`
        : 'Cổng xác thực Sử Ký',
      iconKind: 'shield',
      route: null,
      sourceModuleLabel: 'Phân hệ Xác thực & Bảo mật phiên làm việc',
      backendFlowSummary:
        'Khi người dùng đăng nhập hợp lệ, máy chủ kiểm tra trạng thái tài khoản, nạp danh sách đa vai trò và khởi tạo mã phiên làm việc. Khi đăng xuất, đổi mật khẩu hoặc khóa tài khoản, phiên làm việc được thu hồi ngay lập tức.',
    };
  }

  const fallbackNote = (note || '').trim();
  return {
    label: 'Hệ thống',
    subtitle: hasId
      ? `Mã số: #${targetId}`
      : fallbackNote
        ? 'Bản ghi vận hành'
        : 'Toàn hệ thống',
    iconKind: 'document',
    route: null,
    sourceModuleLabel: 'Phân hệ Nhật ký kiểm toán trung tâm',
    backendFlowSummary:
      'Bản ghi lịch sử thao tác hành chính và biến động dữ liệu được lưu trữ chỉ đọc trong sổ cái kiểm toán của nền tảng Sử Ký.',
  };
}

/**
 * Phân loại Loại nhật ký (Hệ thống / Người dùng / Bảo mật) từ hành động và đối tượng thực tế.
 */
export function resolveAuditLogCategory(
  actionKind: AuditActionKind,
  actionType?: string | null,
  targetType?: string | null,
  note?: string | null
): {
  category: AuditLogCategory;
  label: string;
} {
  const upperAction = removeVietnameseTones(actionType || '').toUpperCase();
  const upperTarget = removeVietnameseTones(targetType || '').toUpperCase();
  const upperNote = removeVietnameseTones(note || '').toUpperCase();

  // 1. Bảo mật (SECURITY): Đăng nhập, đăng xuất, xác thực phiên, mật khẩu, thu hồi phiên
  if (
    actionKind === 'LOGIN' ||
    actionKind === 'LOGOUT' ||
    upperAction.includes('AUTH') ||
    upperAction.includes('SECURITY') ||
    upperAction.includes('PASSWORD') ||
    upperAction.includes('TOKEN') ||
    upperAction.includes('OTP') ||
    upperTarget.includes('AUTH') ||
    upperTarget.includes('SECURITY') ||
    upperTarget.includes('SESSION') ||
    upperTarget.includes('TOKEN') ||
    upperNote.includes('BAO MAT') ||
    upperNote.includes('DANG NHAP') ||
    upperNote.includes('DANG XUAT')
  ) {
    return { category: 'SECURITY', label: 'Bảo mật' };
  }

  // 2. Hệ thống (SYSTEM): Cấu hình chính sách, gói hội viên, phân quyền, xóa tài khoản, vận hành hệ thống
  if (
    actionKind === 'GRANT_ROLE' ||
    actionKind === 'DELETE' ||
    upperTarget.includes('POLICY') ||
    upperTarget.includes('AI_SHIELD') ||
    upperTarget.includes('CONFIG') ||
    upperTarget.includes('SYSTEM') ||
    upperTarget.includes('MEMBERSHIP') ||
    upperTarget.includes('PLAN') ||
    upperTarget.includes('PACKAGE') ||
    upperTarget.includes('ROLE') ||
    upperTarget.includes('ACCOUNT') ||
    upperTarget.includes('CHINH_SACH') ||
    upperTarget.includes('GOI_HOI_VIEN')
  ) {
    return { category: 'SYSTEM', label: 'Hệ thống' };
  }

  // 3. Người dùng (USER): Thao tác hồ sơ thuyết minh, hợp đồng, rút tiền, nội dung, kênh, định danh...
  return { category: 'USER', label: 'Người dùng' };
}

/**
 * Trích xuất địa chỉ mạng thực tế nếu có trong bản ghi hoặc chuỗi ghi chú (Tuyệt đối không tự tạo địa chỉ giả).
 */
export function extractRealIpAddress(
  rawIp?: string | null,
  note?: string | null
): { cleanIp: string | null; cleanNote: string } {
  const rawNote = (note || '').trim();
  if (rawIp && rawIp.trim()) {
    return {
      cleanIp: rawIp.trim(),
      cleanNote: normalizeAuditNoteToVietnamese(rawNote),
    };
  }

  const ipMatch = rawNote.match(
    /(?:\[?\bIP\s*:\s*|\bfrom\s+)(\d{1,3}(?:\.\d{1,3}){3})\]?/i
  );
  if (ipMatch && ipMatch[1]) {
    const stripped = rawNote
      .replace(ipMatch[0], '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s•|-]+|[\s•|-]+$/g, '')
      .trim();
    return {
      cleanIp: ipMatch[1],
      cleanNote: normalizeAuditNoteToVietnamese(stripped || rawNote),
    };
  }

  return {
    cleanIp: null,
    cleanNote: normalizeAuditNoteToVietnamese(rawNote),
  };
}

/**
 * Định dạng ngày và giờ chuẩn tiếng Việt (DD/MM/YYYY và HH:mm:ss).
 */
export function formatAuditTimestampParts(iso?: string | null): {
  ms: number;
  datePart: string;
  timePart: string;
  fullDateTime: string;
} {
  if (!iso) {
    return {
      ms: 0,
      datePart: '—',
      timePart: '—',
      fullDateTime: 'Chưa ghi nhận thời gian',
    };
  }
  const date = new Date(iso);
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    return {
      ms: 0,
      datePart: '—',
      timePart: '—',
      fullDateTime: 'Chưa ghi nhận thời gian',
    };
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const datePart = `${day}/${month}/${year}`;
  const timePart = `${hours}:${minutes}:${seconds}`;
  return {
    ms,
    datePart,
    timePart,
    fullDateTime: `${datePart} ${timePart}`,
  };
}

function createAuditRowFromItem(
  item: AuditLogItem,
  userMapById: Map<number, UserResponse>,
  rawAuditLogId: number | null
): AdminAuditLogRow {
  const actorId =
    typeof item.actorId === 'number' && Number.isFinite(item.actorId)
      ? item.actorId
      : null;
  const matchedUser = actorId !== null ? userMapById.get(actorId) || null : null;

  const actorName = matchedUser?.fullName?.trim()
    ? matchedUser.fullName.trim()
    : matchedUser?.email?.trim()
      ? matchedUser.email.split('@')[0]
      : actorId !== null
        ? `Tài khoản #${actorId}`
        : 'Hệ thống Sử Ký';

  const actorEmail = matchedUser?.email?.trim()
    ? matchedUser.email.trim()
    : actorId !== null
      ? `Mã định danh tác nhân #${actorId}`
      : 'Tự động vận hành nền tảng';

  const actorPhone = matchedUser?.phone?.trim() || null;
  const actorAvatarUrl = matchedUser?.avatarUrl?.trim() || null;
  const actorInitials = extractActorInitials(
    matchedUser?.fullName || (actorId !== null ? `TK ${actorId}` : 'Hệ Thống'),
    matchedUser?.email
  );
  const actorBadgeTone = resolveActorBadgeTone(actorId, actorName);

  const fallbackRole = actorId !== null ? 'Quản trị viên' : 'Hệ thống tự động';
  const actorRoleBadges = resolveActorRoleBadges(matchedUser, fallbackRole);
  const primaryRoleLabel = resolvePrimaryActorRoleLabel(
    matchedUser,
    fallbackRole
  );
  const statusMeta = resolveActorStatusMeta(matchedUser);

  const { cleanIp, cleanNote } = extractRealIpAddress(item.ipAddress, item.note);
  const actionMeta = resolveAuditActionMeta(item.actionType, cleanNote);
  const targetMeta = resolveAuditTargetMeta(
    item.targetType,
    item.targetId,
    actionMeta.kind,
    cleanNote
  );
  const categoryMeta = resolveAuditLogCategory(
    actionMeta.kind,
    item.actionType,
    item.targetType,
    cleanNote
  );

  const detailText =
    cleanNote ||
    `${actionMeta.label} trên đối tượng ${targetMeta.label.toLowerCase()}${
      item.targetId ? ` (#${item.targetId})` : ''
    }`;

  const timeInfo = formatAuditTimestampParts(item.createdAt);

  return {
    id: item.id,
    rawAuditLogId,
    raw: item,
    actorId,
    actorUser: matchedUser,
    actorName,
    actorEmail,
    actorPhone,
    actorAvatarUrl,
    actorInitials,
    actorBadgeTone,
    actorRoleLabel: primaryRoleLabel,
    actorRoleBadges,
    actorStatusLabel: statusMeta.label,
    actorStatusTone: statusMeta.tone,
    actionCode: (item.actionType || 'UPDATE').trim(),
    actionKind: actionMeta.kind,
    actionLabel: actionMeta.label,
    targetCode: (item.targetType || 'SYSTEM').trim(),
    targetId:
      typeof item.targetId === 'number' && Number.isFinite(item.targetId)
        ? item.targetId
        : null,
    targetLabel: targetMeta.label,
    targetSubtitle: targetMeta.subtitle,
    targetIconKind: targetMeta.iconKind,
    targetRoute: targetMeta.route,
    detailText,
    category: categoryMeta.category,
    categoryLabel: categoryMeta.label,
    sourceModuleLabel: targetMeta.sourceModuleLabel,
    backendFlowSummary: targetMeta.backendFlowSummary,
    ipAddress: cleanIp,
    ipDisplayLabel: cleanIp || 'Chưa ghi nhận',
    createdAtIso: item.createdAt || null,
    createdAtMs: timeInfo.ms,
    datePart: timeInfo.datePart,
    timePart: timeInfo.timePart,
    fullDateTime: timeInfo.fullDateTime,
  };
}

/**
 * Xây dựng danh sách dòng hiển thị Nhật ký hệ thống từ bảng audit_logs kết hợp danh sách người dùng thực tế.
 * Tuyệt đối không dùng dữ liệu mẫu hay mảng giả định (Zero Fake Data).
 */
export function buildAdminAuditLogRows(
  rawLogs: AuditLogItem[] | null | undefined,
  users: UserResponse[] | null | undefined = []
): AdminAuditLogRow[] {
  if (!Array.isArray(rawLogs) || rawLogs.length === 0) {
    return [];
  }

  const userMapById = new Map<number, UserResponse>();
  if (Array.isArray(users)) {
    for (const u of users) {
      if (u && typeof u.id === 'number') {
        userMapById.set(u.id, u);
      }
    }
  }

  const rows: AdminAuditLogRow[] = rawLogs
    .filter((item): item is AuditLogItem => Boolean(item && typeof item.id === 'number'))
    .map((item) => createAuditRowFromItem(item, userMapById, item.id));

  return rows.sort((a, b) => {
    if (b.createdAtMs !== a.createdAtMs) {
      return b.createdAtMs - a.createdAtMs;
    }
    return b.id - a.id;
  });
}

/**
 * Tổng hợp toàn bộ lịch sử hoạt động thực tế từ các phân hệ trên Máy chủ (100% Real Backend Data, Zero Seed/Fake Data).
 * Vì các dịch vụ nghiệp vụ trên Backend (AuthServiceImpl, UserServiceImpl, AiShieldPolicyServiceImpl,
 * AdminModerationServiceImpl, KycProfileServiceImpl, ContractServiceImpl, WithdrawalServiceImpl, DisputeServiceImpl)
 * lưu vết thời gian và tác nhân trực tiếp vào các bảng nghiệp vụ tương ứng bên cạnh bảng audit_logs,
 * hàm này đồng bộ hóa toàn bộ các sự kiện thực tế đó thành sổ cái Nhật ký hệ thống hợp nhất.
 */
export function buildUnifiedRealAuditLogRows(
  sources: RealDomainAuditSources
): AdminAuditLogRow[] {
  const userMapById = new Map<number, UserResponse>();
  const userMapByEmail = new Map<string, UserResponse>();
  let primaryAdminUser: UserResponse | null = null;

  if (Array.isArray(sources.users)) {
    for (const u of sources.users) {
      if (!u || typeof u.id !== 'number') continue;
      userMapById.set(u.id, u);
      if (u.email) {
        userMapByEmail.set(u.email.trim().toLowerCase(), u);
      }
      const isUserAdmin =
        u.isAdmin ||
        (u.roleName || '').toUpperCase().includes('ADMIN') ||
        (Array.isArray(u.roles) &&
          u.roles.some((r) => (r || '').toUpperCase().includes('ADMIN')));
      if (isUserAdmin && !primaryAdminUser) {
        primaryAdminUser = u;
      }
    }
  }

  const allRows: AdminAuditLogRow[] = [];

  // 1. Bản ghi trực tiếp từ bảng audit_logs (GET /api/v1/audit-logs)
  if (Array.isArray(sources.auditLogs)) {
    for (const item of sources.auditLogs) {
      if (item && typeof item.id === 'number') {
        allRows.push(createAuditRowFromItem(item, userMapById, item.id));
      }
    }
  }

  let syntheticIdCounter = 100000;
  const nextSyntheticId = () => {
    syntheticIdCounter += 1;
    return syntheticIdCounter;
  };

  // 2. Nhật ký Bảo mật thực tế từ bảng refresh_tokens (GET /api/v1/refresh-tokens)
  if (Array.isArray(sources.refreshTokens)) {
    for (const rt of sources.refreshTokens) {
      if (!rt || typeof rt.id !== 'number') continue;
      const actorId = typeof rt.userId === 'number' ? rt.userId : null;
      const actor = actorId !== null ? userMapById.get(actorId) || null : null;
      const primaryRoleLabel = resolvePrimaryActorRoleLabel(actor, 'Thính giả');
      const issuedTimestamp = rt.issuedAt || rt.createdAt;

      if (issuedTimestamp) {
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId,
              actionType: 'LOGIN',
              targetType: 'SYSTEM_AUTH',
              targetId: rt.id,
              note: `Đăng nhập vào hệ thống (${primaryRoleLabel})`,
              createdAt: issuedTimestamp,
            },
            userMapById,
            null
          )
        );
      }

      if ((rt.revoked || rt.revokedAt) && rt.revokedAt) {
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId,
              actionType: 'LOGOUT',
              targetType: 'SYSTEM_AUTH',
              targetId: rt.id,
              note: `Đăng xuất và thu hồi phiên làm việc (${primaryRoleLabel})`,
              createdAt: rt.revokedAt,
            },
            userMapById,
            null
          )
        );
      }
    }
  }

  // 3. Nhật ký Hệ thống thực tế từ bảng ai_shield_policy_configs (GET /api/v1/admin/moderation/policy-configs)
  if (Array.isArray(sources.policyConfigs)) {
    for (const cfg of sources.policyConfigs) {
      if (!cfg) continue;
      const timestamp = cfg.updatedAt || cfg.createdAt;
      if (!timestamp) continue;
      const min = cfg.minScore ?? 0;
      const max = cfg.maxScore ?? 100;
      const tierLabel = (cfg.label || 'Kiểm duyệt nội dung').trim();
      allRows.push(
        createAuditRowFromItem(
          {
            id: nextSyntheticId(),
            actorId: primaryAdminUser?.id ?? null,
            actionType: 'UPDATE',
            targetType: 'POLICY',
            targetId: typeof cfg.id === 'number' ? cfg.id : null,
            note: `Cấu hình ngưỡng điểm phân tầng "${tierLabel}" trong dải từ ${min}% → ${max}%`,
            createdAt: timestamp,
          },
          userMapById,
          null
        )
      );
    }
  }

  // 4. Nhật ký Hệ thống thực tế từ bảng system_configs (GET /api/v1/system-configs)
  if (Array.isArray(sources.systemConfigs)) {
    for (const sys of sources.systemConfigs) {
      if (!sys || !sys.updatedAt) continue;
      const actorId =
        typeof sys.updatedByUserId === 'number'
          ? sys.updatedByUserId
          : (primaryAdminUser?.id ?? null);
      allRows.push(
        createAuditRowFromItem(
          {
            id: nextSyntheticId(),
            actorId,
            actionType: 'UPDATE',
            targetType: 'POLICY',
            targetId: typeof sys.id === 'number' ? sys.id : null,
            note: `Cập nhật tham số cấu hình hệ thống (${sys.key || 'Tham số vận hành'})`,
            createdAt: sys.updatedAt,
          },
          userMapById,
          null
        )
      );
    }
  }

  // 5. Nhật ký Phân quyền & Tài khoản thực tế từ bảng users & user_roles (GET /api/v1/admin/users)
  if (Array.isArray(sources.users)) {
    for (const u of sources.users) {
      if (!u || typeof u.id !== 'number') continue;
      const badges = resolveActorRoleBadges(u, 'Thính giả');
      const primaryRoleLabel = resolvePrimaryActorRoleLabel(u, 'Thính giả');
      const hasElevatedOrMultiRole =
        badges.length > 1 ||
        badges.some((b) => b.code !== 'VIEWER' && b.code !== 'USER');

      if (hasElevatedOrMultiRole && (u.updatedAt || u.createdAt)) {
        const roleNamesJoined = badges.map((b) => b.label).join(', ');
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: primaryAdminUser?.id ?? u.id,
              actionType: 'GRANT_ROLE',
              targetType: 'ACCOUNT',
              targetId: u.id,
              note: `Cấp quyền ${roleNamesJoined} cho tài khoản ${u.fullName || u.email}`,
              createdAt: u.updatedAt || u.createdAt,
            },
            userMapById,
            null
          )
        );
      }

      const statusUpper = (u.status || 'ACTIVE').toUpperCase();
      if (statusUpper !== 'ACTIVE' && (u.updatedAt || u.createdAt)) {
        const statusVn =
          statusUpper === 'LOCKED' ? 'khóa bảo mật' : 'ngưng hoạt động';
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: primaryAdminUser?.id ?? u.id,
              actionType: 'UPDATE',
              targetType: 'USER',
              targetId: u.id,
              note: `Chuyển trạng thái tài khoản ${u.fullName || u.email} sang ${statusVn}`,
              createdAt: u.updatedAt || u.createdAt,
            },
            userMapById,
            null
          )
        );
      } else if (u.createdAt) {
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: u.id,
              actionType: 'CREATE',
              targetType: 'USER',
              targetId: u.id,
              note: `Khởi tạo tài khoản ${primaryRoleLabel.toLowerCase()} mới trên nền tảng Sử Ký`,
              createdAt: u.createdAt,
            },
            userMapById,
            null
          )
        );
      }
    }
  }

  // 6. Nhật ký Kiểm duyệt Nội dung thực tế từ bảng moderation_reviews (GET /api/v1/admin/moderation/reviews)
  const moderationSourceList =
    sources.moderationReviews ?? sources.moderationItems;
  if (Array.isArray(moderationSourceList)) {
    for (const mod of moderationSourceList) {
      if (!mod) continue;
      const decision = (mod.decision || 'PENDING').toUpperCase();
      const targetId = mod.contentId ?? mod.reviewId ?? mod.artifactId ?? null;
      const title = (mod.title || 'Tác phẩm lịch sử').trim();

      if ((decision === 'APPROVED' || decision === 'REJECTED') && (mod.reviewedAt || mod.createdAt)) {
        const moderator =
          (mod.moderatorEmail &&
            userMapByEmail.get(mod.moderatorEmail.trim().toLowerCase())) ||
          primaryAdminUser;
        const actionType = decision === 'APPROVED' ? 'APPROVE' : 'REJECT';
        const reasonSuffix = mod.adminReason?.trim()
          ? ` (${mod.adminReason.trim()})`
          : '';
        const noteText =
          decision === 'APPROVED'
            ? `Phê duyệt xuất bản nội dung thuyết minh: "${title}"${reasonSuffix}`
            : `Từ chối nội dung thuyết minh: "${title}"${reasonSuffix}`;

        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: moderator?.id ?? null,
              actionType,
              targetType: 'CONTENT',
              targetId,
              note: noteText,
              createdAt: mod.reviewedAt || mod.createdAt,
            },
            userMapById,
            null
          )
        );
      } else if (mod.createdAt) {
        const creator =
          (mod.creatorEmail &&
            userMapByEmail.get(mod.creatorEmail.trim().toLowerCase())) ||
          null;
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: creator?.id ?? null,
              actionType: 'CREATE',
              targetType: 'CONTENT',
              targetId,
              note: `Gửi thẩm định nội dung thuyết minh: "${title}"`,
              createdAt: mod.createdAt,
            },
            userMapById,
            null
          )
        );
      }
    }
  }

  // 7. Nhật ký Định danh Nhà sáng tạo thực tế từ bảng kyc_profiles (GET /api/v1/kyc-profiles)
  if (Array.isArray(sources.kycProfiles)) {
    for (const kyc of sources.kycProfiles) {
      if (!kyc || typeof kyc.id !== 'number') continue;
      const status = (kyc.status || 'PENDING').toUpperCase();
      const candidateName = (kyc.fullName || kyc.userEmail || `Hồ sơ #${kyc.id}`).trim();

      if (status === 'APPROVED' && (kyc.updatedAt || kyc.createdAt)) {
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: primaryAdminUser?.id ?? kyc.userId ?? null,
              actionType: 'APPROVE',
              targetType: 'KYC',
              targetId: kyc.id,
              note: `Phê duyệt hồ sơ định danh Nhà sáng tạo: "${candidateName}"`,
              createdAt: kyc.updatedAt || kyc.createdAt,
            },
            userMapById,
            null
          )
        );
      } else if (status === 'REJECTED' && (kyc.updatedAt || kyc.createdAt)) {
        const reason = kyc.rejectionReason?.trim()
          ? `: ${kyc.rejectionReason.trim()}`
          : '';
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: primaryAdminUser?.id ?? kyc.userId ?? null,
              actionType: 'REJECT',
              targetType: 'KYC',
              targetId: kyc.id,
              note: `Từ chối hồ sơ định danh của "${candidateName}"${reason}`,
              createdAt: kyc.updatedAt || kyc.createdAt,
            },
            userMapById,
            null
          )
        );
      } else if (kyc.createdAt) {
        allRows.push(
          createAuditRowFromItem(
            {
              id: nextSyntheticId(),
              actorId: kyc.userId ?? null,
              actionType: 'CREATE',
              targetType: 'KYC',
              targetId: kyc.id,
              note: `Nộp hồ sơ xác thực định danh Nhà sáng tạo: "${candidateName}"`,
              createdAt: kyc.createdAt,
            },
            userMapById,
            null
          )
        );
      }
    }
  }

  // 8. Nhật ký Hợp đồng thu âm thực tế từ bảng contracts (GET /api/v1/contracts)
  if (Array.isArray(sources.contracts)) {
    for (const c of sources.contracts) {
      if (!c || typeof c.id !== 'number') continue;
      const timestamp = c.updatedAt || c.createdAt;
      if (!timestamp) continue;
      const status = (c.status || 'PENDING').toUpperCase();
      const title = (c.title || `Hợp đồng #${c.id}`).trim();
      const actorId = c.requesterId ?? c.creatorId ?? primaryAdminUser?.id ?? null;

      let actionType = 'CREATE';
      let noteText = `Tạo hợp đồng thu âm mới cho dự án "${title}"`;
      if (status === 'COMPLETED' || status === 'APPROVED') {
        actionType = 'APPROVE';
        noteText = `Hoàn tất nghiệm thu hợp đồng thu âm dự án "${title}"`;
      } else if (status === 'CANCELLED' || status === 'REJECTED') {
        actionType = 'REJECT';
        noteText = `Hủy bỏ hợp đồng thu âm dự án "${title}"`;
      } else if (c.updatedAt && c.updatedAt !== c.createdAt) {
        actionType = 'UPDATE';
        noteText = `Cập nhật lộ trình thực hiện hợp đồng thu âm "${title}"`;
      }

      allRows.push(
        createAuditRowFromItem(
          {
            id: nextSyntheticId(),
            actorId,
            actionType,
            targetType: 'CONTRACT',
            targetId: c.id,
            note: noteText,
            createdAt: timestamp,
          },
          userMapById,
          null
        )
      );
    }
  }

  // 9. Nhật ký Yêu cầu rút tiền thực tế từ bảng withdrawals (GET /api/v1/withdrawals/admin)
  if (Array.isArray(sources.withdrawals)) {
    for (const w of sources.withdrawals) {
      if (!w || typeof w.id !== 'number') continue;
      const status = (w.status || 'PENDING').toUpperCase();
      const timestamp = w.processedAt || w.requestedAt;
      if (!timestamp) continue;
      const holder = (w.accountHolderName || 'Nhà sáng tạo').trim();
      const bank = (w.bankName || 'Ngân hàng').trim();

      let actionType = 'CREATE';
      let noteText = `Khởi tạo yêu cầu rút tiền về ${bank} (${holder})`;
      if (status === 'COMPLETED' || status === 'APPROVED') {
        actionType = 'APPROVE';
        noteText = `Phê duyệt và hoàn tất giải ngân yêu cầu rút tiền qua ${bank} (${holder})`;
      } else if (status === 'REJECTED' || status === 'FAILED') {
        actionType = 'REJECT';
        const reason = w.failureReason?.trim()
          ? ` do ${w.failureReason.trim()}`
          : ' do thông tin thụ hưởng chưa hợp lệ';
        noteText = `Từ chối yêu cầu rút tiền${reason}`;
      }

      allRows.push(
        createAuditRowFromItem(
          {
            id: nextSyntheticId(),
            actorId: primaryAdminUser?.id ?? null,
            actionType,
            targetType: 'WITHDRAWAL',
            targetId: w.id,
            note: noteText,
            createdAt: timestamp,
          },
          userMapById,
          null
        )
      );
    }
  }

  // 10. Nhật ký Khiếu nại hợp đồng thực tế từ bảng disputes (GET /api/v1/disputes)
  if (Array.isArray(sources.disputes)) {
    for (const d of sources.disputes) {
      if (!d || typeof d.id !== 'number') continue;
      const status = (d.status || 'OPEN').toUpperCase();
      const timestamp = d.resolvedAt || d.createdAt;
      if (!timestamp) continue;

      const isResolved = status === 'RESOLVED' || status === 'CLOSED';
      const actorId = isResolved
        ? (primaryAdminUser?.id ?? d.raisedByUserId ?? null)
        : (d.raisedByUserId ?? primaryAdminUser?.id ?? null);

      const noteText = isResolved
        ? `Ban hành phán quyết xử lý khiếu nại hợp đồng${
            d.resolutionNote?.trim() ? `: ${d.resolutionNote.trim()}` : ''
          }`
        : `Gửi hồ sơ khiếu nại hợp đồng${
            d.reason?.trim() ? `: ${d.reason.trim()}` : ''
          }`;

      allRows.push(
        createAuditRowFromItem(
          {
            id: nextSyntheticId(),
            actorId,
            actionType: isResolved ? 'APPROVE' : 'CREATE',
            targetType: 'DISPUTE',
            targetId: d.id,
            note: noteText,
            createdAt: timestamp,
          },
          userMapById,
          null
        )
      );
    }
  }

  // Sắp xếp mới nhất lên đầu theo thời gian thực tế
  return allRows.sort((a, b) => {
    if (b.createdAtMs !== a.createdAtMs) {
      return b.createdAtMs - a.createdAtMs;
    }
    return b.id - a.id;
  });
}

function computeWindowTrendPercent(
  currentCount: number,
  previousCount: number
): number {
  if (previousCount <= 0 || currentCount <= 0) {
    return 0;
  }
  const diff = currentCount - previousCount;
  if (diff === 0) return 0;
  return Math.round((diff / previousCount) * 100);
}

/**
 * Tính toán các chỉ số thẻ thống kê (Stat Cards) 100% từ dữ liệu thực.
 * Tuyệt đối không hardcode phần trăm giả khi cơ sở dữ liệu rỗng hoặc không có dữ liệu kỳ trước.
 */
export function calculateAuditLogKpis(
  rows: AdminAuditLogRow[],
  nowMs: number = Date.now()
): AuditLogKpis {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      totalLogs: 0,
      userLogsCount: 0,
      systemLogsCount: 0,
      securityLogsCount: 0,
      recent7dCount: 0,
      prev7dCount: 0,
      diff7dCount: 0,
      totalTrendPercent: 0,
      userTrendPercent: 0,
      systemTrendPercent: 0,
      securityTrendPercent: 0,
    };
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const recentWindowStart = nowMs - 7 * DAY_MS;
  const prevWindowStart = nowMs - 14 * DAY_MS;

  let userLogsCount = 0;
  let systemLogsCount = 0;
  let securityLogsCount = 0;

  let recent7dCount = 0;
  let prev7dCount = 0;

  let recentUser = 0;
  let prevUser = 0;
  let recentSys = 0;
  let prevSys = 0;
  let recentSec = 0;
  let prevSec = 0;

  for (const row of rows) {
    if (row.category === 'USER') userLogsCount++;
    else if (row.category === 'SYSTEM') systemLogsCount++;
    else if (row.category === 'SECURITY') securityLogsCount++;

    if (row.createdAtMs > 0) {
      if (row.createdAtMs >= recentWindowStart && row.createdAtMs <= nowMs + DAY_MS) {
        recent7dCount++;
        if (row.category === 'USER') recentUser++;
        else if (row.category === 'SYSTEM') recentSys++;
        else if (row.category === 'SECURITY') recentSec++;
      } else if (
        row.createdAtMs >= prevWindowStart &&
        row.createdAtMs < recentWindowStart
      ) {
        prev7dCount++;
        if (row.category === 'USER') prevUser++;
        else if (row.category === 'SYSTEM') prevSys++;
        else if (row.category === 'SECURITY') prevSec++;
      }
    }
  }

  return {
    totalLogs: rows.length,
    userLogsCount,
    systemLogsCount,
    securityLogsCount,
    recent7dCount,
    prev7dCount,
    diff7dCount: recent7dCount - prev7dCount,
    totalTrendPercent: computeWindowTrendPercent(recent7dCount, prev7dCount),
    userTrendPercent: computeWindowTrendPercent(recentUser, prevUser),
    systemTrendPercent: computeWindowTrendPercent(recentSys, prevSys),
    securityTrendPercent: computeWindowTrendPercent(recentSec, prevSec),
  };
}

/**
 * Trích xuất danh sách người thực hiện duy nhất từ dữ liệu thực để hiển thị trong bộ lọc.
 */
export function extractUniqueActors(
  rows: AdminAuditLogRow[]
): AuditActorOption[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const map = new Map<string, AuditActorOption>();
  for (const row of rows) {
    const key =
      row.actorId !== null
        ? `id:${row.actorId}`
        : `name:${row.actorName.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        value: key,
        label: row.actorName,
        email: row.actorEmail,
        count: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/**
 * Tính khoảng thời gian (startMs, endMs) cho bộ lọc ngày.
 */
export function resolveDateRangeBounds(
  preset: string,
  customStart?: string,
  customEnd?: string,
  nowMs: number = Date.now()
): { startMs: number | null; endMs: number | null } {
  const DAY_MS = 24 * 60 * 60 * 1000;

  if (!preset || preset === 'all') {
    return { startMs: null, endMs: null };
  }

  if (preset === 'today') {
    const d = new Date(nowMs);
    d.setHours(0, 0, 0, 0);
    return { startMs: d.getTime(), endMs: nowMs + DAY_MS };
  }

  if (preset === '7d') {
    return { startMs: nowMs - 7 * DAY_MS, endMs: nowMs + DAY_MS };
  }

  if (preset === '30d') {
    return { startMs: nowMs - 30 * DAY_MS, endMs: nowMs + DAY_MS };
  }

  if (preset === '90d') {
    return { startMs: nowMs - 90 * DAY_MS, endMs: nowMs + DAY_MS };
  }

  if (preset === 'custom') {
    let startMs: number | null = null;
    let endMs: number | null = null;

    if (customStart && customStart.trim()) {
      const parsedStart = new Date(`${customStart.trim()}T00:00:00`);
      if (!Number.isNaN(parsedStart.getTime())) {
        startMs = parsedStart.getTime();
      }
    }
    if (customEnd && customEnd.trim()) {
      const parsedEnd = new Date(`${customEnd.trim()}T23:59:59.999`);
      if (!Number.isNaN(parsedEnd.getTime())) {
        endMs = parsedEnd.getTime();
      }
    }
    return { startMs, endMs };
  }

  return { startMs: null, endMs: null };
}

/**
 * Lọc danh sách bản ghi Nhật ký hệ thống theo từ khóa, phân loại, hành động, người thực hiện và khoảng thời gian.
 */
export function filterAuditLogRows(
  rows: AdminAuditLogRow[],
  filters: AuditLogFilterState,
  nowMs: number = Date.now()
): AdminAuditLogRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const rawQuery = (filters.searchQuery || '').trim().toLowerCase();
  const normQuery = removeVietnameseTones(rawQuery).toLowerCase();
  const { startMs, endMs } = resolveDateRangeBounds(
    filters.dateRangePreset,
    filters.customDateStart,
    filters.customDateEnd,
    nowMs
  );

  return rows.filter((row) => {
    if (
      filters.categoryFilter !== 'ALL' &&
      row.category !== filters.categoryFilter
    ) {
      return false;
    }

    if (filters.actionFilter !== 'ALL' && row.actionKind !== filters.actionFilter) {
      return false;
    }

    if (filters.actorFilter && filters.actorFilter !== 'ALL') {
      const rowActorKey =
        row.actorId !== null
          ? `id:${row.actorId}`
          : `name:${row.actorName.toLowerCase()}`;
      if (rowActorKey !== filters.actorFilter) {
        return false;
      }
    }

    if (startMs !== null || endMs !== null) {
      if (row.createdAtMs <= 0) return false;
      if (startMs !== null && row.createdAtMs < startMs) return false;
      if (endMs !== null && row.createdAtMs > endMs) return false;
    }

    if (rawQuery) {
      const haystack = [
        `#${row.id}`,
        String(row.id),
        row.actorName,
        row.actorEmail,
        row.actorRoleLabel,
        ...row.actorRoleBadges.map((b) => b.label),
        row.actionLabel,
        row.targetLabel,
        row.targetSubtitle,
        row.detailText,
        row.categoryLabel,
        row.sourceModuleLabel,
        row.ipAddress || '',
        row.fullDateTime,
      ]
        .join(' ')
        .toLowerCase();

      const normHaystack = removeVietnameseTones(haystack).toLowerCase();
      if (!haystack.includes(rawQuery) && !normHaystack.includes(normQuery)) {
        return false;
      }
    }

    return true;
  });
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Tạo nội dung tệp bảng tính báo cáo Nhật ký hệ thống chuẩn tiếng Việt.
 */
export function generateAuditLogsCsv(rows: AdminAuditLogRow[]): string {
  const headers = [
    'Số thứ tự',
    'Mã nhật ký',
    'Thời gian ghi nhận',
    'Người thực hiện',
    'Thư điện tử',
    'Vai trò',
    'Trạng thái tài khoản',
    'Hành động',
    'Đối tượng tác động',
    'Định danh đối tượng',
    'Chi tiết nội dung',
    'Phân loại nhật ký',
    'Phân hệ máy chủ',
    'Địa chỉ mạng',
  ];

  const lines = [headers.join(',')];
  rows.forEach((row, index) => {
    lines.push(
      [
        index + 1,
        `#${row.id}`,
        escapeCsvCell(row.fullDateTime),
        escapeCsvCell(row.actorName),
        escapeCsvCell(row.actorEmail),
        escapeCsvCell(row.actorRoleBadges.map((b) => b.label).join(' | ')),
        escapeCsvCell(row.actorStatusLabel),
        escapeCsvCell(row.actionLabel),
        escapeCsvCell(row.targetLabel),
        escapeCsvCell(row.targetSubtitle),
        escapeCsvCell(row.detailText),
        escapeCsvCell(row.categoryLabel),
        escapeCsvCell(row.sourceModuleLabel),
        escapeCsvCell(row.ipDisplayLabel),
      ].join(',')
    );
  });

  return `\uFEFF${lines.join('\n')}`;
}
