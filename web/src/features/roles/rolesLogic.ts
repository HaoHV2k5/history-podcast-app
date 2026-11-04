import type { RoleItem } from '../../types/role';
import type { UserResponse } from '../../types/auth';

export type CoreRoleCode = 'VIEWER' | 'CREATOR' | 'NARRATOR' | 'ADMIN' | 'FREELANCER';

export type RoleCategoryFilter =
  | 'ALL'
  | 'ADMIN_PRIVILEGE'
  | 'CREATOR_ECONOMY'
  | 'STANDARD_USER';

export type RoleUsageFilter =
  | 'ALL'
  | 'CORE'
  | 'CUSTOM'
  | 'WITH_USERS'
  | 'EMPTY_USERS';

export type RoleIconKind =
  | 'eye'
  | 'pencil'
  | 'mic'
  | 'settings'
  | 'briefcase'
  | 'shield';

export interface RoleDetailedPermission {
  scope: string;
  description: string;
  mechanism: string;
}

export interface AdminRoleRow {
  id: number;
  name: string;
  rawName: string;
  displayTitle: string;
  shortLabel: string;
  description: string;
  rawDescription: string;
  backendFlowSummary: string;
  permissionScopes: string[];
  detailedPermissions: RoleDetailedPermission[];
  iconKind: RoleIconKind;
  isCoreSystemRole: boolean;
  category: Exclude<RoleCategoryFilter, 'ALL'>;
  status: 'ACTIVE';
  statusLabel: string;
  userCount: number;
  primaryUserCount: number;
  secondaryUserCount: number;
  assignedUsers: UserResponse[];
}

export interface RoleKpis {
  totalRoles: number;
  activeRoles: number;
  disabledRoles: number;
  multiRoleAccountsCount: number;
  totalAccountsCount: number;
}

export interface RoleFilterOptions {
  searchQuery: string;
  categoryFilter: RoleCategoryFilter;
  usageFilter: RoleUsageFilter;
}

export interface RoleValidationResult {
  valid: boolean;
  normalizedName: string;
  trimmedDescription: string;
  error?: string;
}

const CORE_SYSTEM_ROLES = new Set<string>([
  'VIEWER',
  'CREATOR',
  'NARRATOR',
  'ADMIN',
  'FREELANCER',
]);

interface RoleStaticMeta {
  displayTitle: string;
  shortLabel: string;
  defaultVietnameseDescription: string;
  backendFlowSummary: string;
  iconKind: RoleIconKind;
  category: Exclude<RoleCategoryFilter, 'ALL'>;
  permissionScopes: string[];
  detailedPermissions: RoleDetailedPermission[];
}

const DEFAULT_ENGLISH_SEED_DESCRIPTIONS = new Set<string>([
  'default viewer and listener role',
  'default viewer role',
  'content creator role',
  'content creator',
  'voice narrator and voice actor role',
  'system administrator role',
  'freelancer role for taking jobs, submitting proposals and deliverables',
]);

const ROLE_METADATA_MAP: Record<CoreRoleCode, RoleStaticMeta> = {
  VIEWER: {
    displayTitle: 'Thính giả & Người dùng tiêu chuẩn',
    shortLabel: 'Thính giả',
    defaultVietnameseDescription:
      'Thính giả mặc định có quyền thưởng thức nội dung công khai, đăng ký gói hội viên kênh và gửi yêu cầu đặt làm nội dung theo chủ đề.',
    backendFlowSummary:
      'Mọi tài khoản khi đăng ký mới đều được máy chủ tự động cấp vai trò Thính giả làm vai trò chính và lưu vào danh sách đa vai trò. Người dùng có thể nghe nội dung công khai, mua gói hội viên kênh hoặc gửi đơn đặt hàng nội dung riêng tới các Nhà sáng tạo.',
    iconKind: 'eye',
    category: 'STANDARD_USER',
    permissionScopes: ['Xem nội dung', 'Nghe demo', 'Bình luận'],
    detailedPermissions: [
      {
        scope: 'Xem nội dung',
        description:
          'Thưởng thức các tập phát thanh lịch sử, chuỗi nhiều tập công khai, xem văn bản lời thoại và nội dung độc quyền khi đăng ký gói hội viên kênh.',
        mechanism: 'Phân hệ Nội dung, Chuỗi tập & Hội viên kênh',
      },
      {
        scope: 'Nghe demo',
        description:
          'Khám phá hồ sơ các kênh sáng tạo, nghe thử bản thu mẫu và gửi yêu cầu đặt làm nội dung riêng (tập lẻ hoặc chuỗi nhiều tập) tới nhà sáng tạo.',
        mechanism: 'Phân hệ Kênh sáng tạo & Đặt làm nội dung',
      },
      {
        scope: 'Bình luận',
        description:
          'Bình luận, bày tỏ cảm xúc, nạp tiền vào ví cá nhân, ký quỹ hợp đồng theo từng giai đoạn, nghiệm thu sản phẩm và gửi đánh giá hợp đồng.',
        mechanism: 'Phân hệ Tương tác, Ví cá nhân & Nghiệm thu hợp đồng',
      },
    ],
  },
  CREATOR: {
    displayTitle: 'Nhà sáng tạo nội dung Sử Ký',
    shortLabel: 'Nhà sáng tạo',
    defaultVietnameseDescription:
      'Nhà sáng tạo nội dung có quyền quản lý kênh, khởi tạo bản thảo phòng thu, phát sóng trực tiếp và nhận đơn đặt hàng làm nội dung.',
    backendFlowSummary:
      'Tài khoản được máy chủ tự động bổ sung vai trò Nhà sáng tạo vào tập hợp đa vai trò ngay sau khi xác thực số điện thoại hoặc được Quản trị viên phê duyệt hồ sơ định danh, đồng thời vẫn giữ nguyên quyền Thính giả ban đầu.',
    iconKind: 'pencil',
    category: 'CREATOR_ECONOMY',
    permissionScopes: ['Tạo nội dung', 'Quản lý bản thảo', 'Thuyết minh'],
    detailedPermissions: [
      {
        scope: 'Tạo nội dung',
        description:
          'Khởi tạo kênh sáng tạo cá nhân, thiết lập gói hội viên tháng, tổ chức chuỗi nhiều tập và mở phòng phát sóng trực tiếp giao lưu cùng hội viên.',
        mechanism: 'Phân hệ Quản lý Kênh, Chuỗi tập & Phát trực tiếp',
      },
      {
        scope: 'Quản lý bản thảo',
        description:
          'Biên tập kịch bản lịch sử, chuyển văn bản thành giọng đọc tự động, dựng video bảng trắng minh họa và gửi xuất bản qua bộ lọc kiểm duyệt tự động.',
        mechanism: 'Phân hệ Phòng thu sáng tạo & Kiểm duyệt nội dung',
      },
      {
        scope: 'Thuyết minh',
        description:
          'Tiếp nhận yêu cầu đặt làm nội dung từ người nghe, lập bảng báo giá hợp đồng từ 1 đến 20 giai đoạn, bàn giao sản phẩm và nhận giải ngân 95% về ví.',
        mechanism: 'Phân hệ Hợp đồng đặt hàng, Ký quỹ & Rút tiền',
      },
    ],
  },
  NARRATOR: {
    displayTitle: 'Thuyết minh viên & Giọng đọc',
    shortLabel: 'Thuyết minh viên',
    defaultVietnameseDescription:
      'Vai trò thuyết minh viên và diễn viên lồng tiếng trong danh mục phân quyền đa vai trò, hỗ trợ phân loại tài khoản chuyên môn giọng đọc.',
    backendFlowSummary:
      'Vai trò chuẩn thứ ba trong danh mục phân quyền của hệ thống. Quản trị viên có thể cấp vai trò này cho các tài khoản chuyên môn giọng đọc hoặc kết hợp đa vai trò cùng quyền Nhà sáng tạo và Thính giả.',
    iconKind: 'mic',
    category: 'CREATOR_ECONOMY',
    permissionScopes: ['Nhận dự án', 'Thu âm', 'Quản lý hồ sơ'],
    detailedPermissions: [
      {
        scope: 'Nhận dự án',
        description:
          'Định danh tài khoản thuộc nhóm chuyên môn giọng đọc và thuyết minh trong cơ chế phân quyền đa vai trò của nền tảng Sử Ký.',
        mechanism: 'Phân hệ Định danh & Phân quyền đa vai trò',
      },
      {
        scope: 'Thu âm',
        description:
          'Phối hợp thực hiện bản thu âm thuyết minh lịch sử, tham gia trao đổi trực tuyến và bàn giao tệp âm thanh theo thỏa thuận hợp đồng.',
        mechanism: 'Phân hệ Hợp tác sản xuất & Bàn giao sản phẩm',
      },
      {
        scope: 'Quản lý hồ sơ',
        description:
          'Quản lý thông tin hồ sơ cá nhân, ảnh đại diện, tiểu sử giới thiệu giọng đọc, liên kết tài khoản ngân hàng chính chủ và theo dõi số dư ví.',
        mechanism: 'Phân hệ Hồ sơ cá nhân & Ví thanh toán',
      },
    ],
  },
  ADMIN: {
    displayTitle: 'Quản trị viên toàn hệ thống',
    shortLabel: 'Quản trị viên',
    defaultVietnameseDescription:
      'Quản trị viên hệ thống có toàn quyền kiểm duyệt nội dung, quản lý tài khoản, phê duyệt định danh, phân xử tranh chấp và đối soát tài chính.',
    backendFlowSummary:
      'Vai trò có mức ưu tiên xác thực cao nhất trên toàn hệ thống. Máy chủ áp dụng quy tắc bảo vệ nghiêm ngặt: Quản trị viên đang đăng nhập không thể tự khóa, tự xóa hoặc tự hạ vai trò chính của chính mình.',
    iconKind: 'settings',
    category: 'ADMIN_PRIVILEGE',
    permissionScopes: ['Quản trị hệ thống', 'Quản lý người dùng', 'Toàn quyền'],
    detailedPermissions: [
      {
        scope: 'Quản trị hệ thống',
        description:
          'Kiểm duyệt nội dung xuất bản, cấu hình ngưỡng chặn tự động của lá chắn trí tuệ nhân tạo, quản lý biểu mẫu thư điện tử và thông số vận hành nền tảng.',
        mechanism: 'Phân hệ Kiểm duyệt, Cấu hình & Nhật ký hệ thống',
      },
      {
        scope: 'Quản lý người dùng',
        description:
          'Tra cứu, tạo mới, khóa hoặc mở khóa tài khoản, phê duyệt hồ sơ định danh nhà sáng tạo, quản lý danh mục vai trò và cấp quyền đa vai trò.',
        mechanism: 'Phân hệ Quản trị Tài khoản, Định danh & Phân quyền',
      },
      {
        scope: 'Toàn quyền',
        description:
          'Giám sát hợp đồng và khoản tiền ký quỹ, phân xử khiếu nại tranh chấp giữa người đặt và nhà sáng tạo, phê duyệt lệnh rút tiền và thống kê doanh thu.',
        mechanism: 'Phân hệ Giám sát Hợp đồng, Khiếu nại & Tài chính',
      },
    ],
  },
  FREELANCER: {
    displayTitle: 'Cộng tác viên & Đối tác hợp đồng',
    shortLabel: 'Cộng tác viên',
    defaultVietnameseDescription:
      'Vai trò cộng tác viên và đối tác hợp đồng trong mô hình đa vai trò, hỗ trợ tham gia giao dịch đặt hàng, bàn giao và nghiệm thu theo giai đoạn.',
    backendFlowSummary:
      'Vai trò mở rộng trong kiến trúc phân quyền nhiều - nhiều của máy chủ, có độ ưu tiên xác thực đứng ngay sau Quản trị viên và Nhà sáng tạo, đồng thời phục vụ thống kê đóng góp hợp đồng trên toàn sàn.',
    iconKind: 'briefcase',
    category: 'CREATOR_ECONOMY',
    permissionScopes: ['Nhận việc', 'Nộp đề xuất', 'Tải sản phẩm'],
    detailedPermissions: [
      {
        scope: 'Nhận việc',
        description:
          'Được hệ thống xác thực ưu tiên trong danh sách đa vai trò khi tham gia các giao dịch hợp đồng đặt làm nội dung theo giai đoạn.',
        mechanism: 'Phân hệ Xác thực phiên làm việc & Đa vai trò',
      },
      {
        scope: 'Nộp đề xuất',
        description:
          'Tham gia gửi yêu cầu đặt hàng, thương thảo lộ trình giai đoạn, nạp tiền ký quỹ an toàn hoặc trao đổi trực tiếp trong phòng trò chuyện hợp đồng.',
        mechanism: 'Phân hệ Yêu cầu đặt hàng, Ký quỹ & Trò chuyện',
      },
      {
        scope: 'Tải sản phẩm',
        description:
          'Truy cập, tải xuống hoặc bàn giao tệp thành phẩm của từng giai đoạn hợp đồng, thực hiện nghiệm thu, yêu cầu chỉnh sửa và đối soát doanh thu.',
        mechanism: 'Phân hệ Sản phẩm giai đoạn & Đối soát hợp đồng',
      },
    ],
  },
};

/**
 * Normalizes a role code string to trimmed uppercase.
 */
export function normalizeRoleCode(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toUpperCase();
}

/**
 * Removes Vietnamese diacritics for accent-insensitive search.
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
 * Extracts deduplicated uppercase roles for a user, ensuring Primary Role (`roleName`) is first.
 */
export function getUserRolesList(user?: UserResponse | null): string[] {
  if (!user) return [];
  const result: string[] = [];
  const seen = new Set<string>();

  const primary = normalizeRoleCode(user.roleName);
  if (primary) {
    seen.add(primary);
    result.push(primary);
  }

  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      const code = normalizeRoleCode(r);
      if (code && !seen.has(code)) {
        seen.add(code);
        result.push(code);
      }
    }
  }

  return result;
}

/**
 * Checks whether a user holds a given role (either as Primary Role `roleName` or in `roles` set).
 */
export function userHasRole(user: UserResponse | null | undefined, roleName: string): boolean {
  if (!user) return false;
  const target = normalizeRoleCode(roleName);
  if (!target) return false;
  return getUserRolesList(user).includes(target);
}

/**
 * Checks whether a user account holds 2 or more distinct roles in `user_roles`.
 */
export function isMultiRoleUser(user?: UserResponse | null): boolean {
  return getUserRolesList(user).length > 1;
}

/**
 * Resolves static UI & RBAC metadata for a role code.
 */
export function getRoleMetadata(roleName: string): RoleStaticMeta & { isCoreSystemRole: boolean } {
  const code = normalizeRoleCode(roleName);
  if (code in ROLE_METADATA_MAP) {
    return {
      ...ROLE_METADATA_MAP[code as CoreRoleCode],
      isCoreSystemRole: true,
    };
  }

  return {
    displayTitle: 'Vai trò tùy chỉnh mở rộng',
    shortLabel: 'Vai trò mở rộng',
    defaultVietnameseDescription:
      'Vai trò mở rộng được quản trị viên khởi tạo bổ sung trong danh mục vai trò hệ thống.',
    backendFlowSummary:
      'Vai trò mở rộng do Quản trị viên tạo mới. Khi gán cho tài khoản người dùng, máy chủ sẽ lưu vai trò này vào hồ sơ tài khoản và nạp quyền tương ứng vào phiên đăng nhập.',
    iconKind: 'shield',
    category: 'STANDARD_USER',
    isCoreSystemRole: CORE_SYSTEM_ROLES.has(code),
    permissionScopes: ['Quyền hạn tùy chỉnh'],
    detailedPermissions: [
      {
        scope: 'Quyền hạn tùy chỉnh',
        description:
          'Vai trò được tạo bổ sung trong danh mục vai trò. Khi gán cho tài khoản, hệ thống sẽ kích hoạt mã quyền tương ứng trong phiên đăng nhập.',
        mechanism: 'Phân hệ Mở rộng danh mục phân quyền',
      },
    ],
  };
}

/**
 * Returns the concise Vietnamese label for a role code (e.g. VIEWER -> "Thính giả").
 */
export function getRoleVietnameseLabel(roleName?: string | null): string {
  const code = normalizeRoleCode(roleName);
  if (!code) return 'Chưa xác định';
  return getRoleMetadata(code).shortLabel;
}

/**
 * Converts default English seed descriptions from Backend migrations (V2 / V13) into 100% Vietnamese,
 * while preserving any custom Vietnamese description updated by the Admin via PUT /api/v1/roles/{id}.
 */
export function localizeRoleDescription(
  roleName: string,
  rawDescription?: string | null
): string {
  const meta = getRoleMetadata(roleName);
  const trimmed = (rawDescription || '').trim();
  if (!trimmed) {
    return meta.defaultVietnameseDescription;
  }
  if (DEFAULT_ENGLISH_SEED_DESCRIPTIONS.has(trimmed.toLowerCase())) {
    return meta.defaultVietnameseDescription;
  }
  return trimmed;
}

/**
 * Maps a live backend RoleItem and live UserResponse list into an AdminRoleRow.
 */
export function mapRoleItemToAdminRow(
  item: RoleItem,
  users: UserResponse[] = []
): AdminRoleRow {
  const normalizedName = normalizeRoleCode(item.name) || `VAI_TRO_${item.id}`;
  const meta = getRoleMetadata(normalizedName);

  const safeUsers = Array.isArray(users) ? users : [];
  const assignedUsers = safeUsers.filter((u) => userHasRole(u, normalizedName));

  let primaryUserCount = 0;
  let secondaryUserCount = 0;

  for (const u of assignedUsers) {
    if (normalizeRoleCode(u.roleName) === normalizedName) {
      primaryUserCount += 1;
    } else {
      secondaryUserCount += 1;
    }
  }

  const rawDescription = (item.description || '').trim();
  const descriptionText = localizeRoleDescription(normalizedName, rawDescription);

  return {
    id: item.id,
    name: normalizedName,
    rawName: item.name || normalizedName,
    displayTitle: meta.displayTitle,
    shortLabel: meta.shortLabel,
    description: descriptionText,
    rawDescription,
    backendFlowSummary: meta.backendFlowSummary,
    permissionScopes: meta.permissionScopes,
    detailedPermissions: meta.detailedPermissions,
    iconKind: meta.iconKind,
    isCoreSystemRole: meta.isCoreSystemRole,
    category: meta.category,
    status: 'ACTIVE',
    statusLabel: 'Đang hoạt động',
    userCount: assignedUsers.length,
    primaryUserCount,
    secondaryUserCount,
    assignedUsers,
  };
}

/**
 * Builds the sorted list of AdminRoleRows from live backend RoleItem[] and UserResponse[].
 * Preserves natural ID ascending order (matching #1 VIEWER, #2 CREATOR, #3 NARRATOR, #4 ADMIN, #5 FREELANCER).
 */
export function buildAdminRoleRows(
  roles?: RoleItem[] | null,
  users?: UserResponse[] | null
): AdminRoleRow[] {
  if (!Array.isArray(roles) || roles.length === 0) return [];
  const safeUsers = Array.isArray(users) ? users : [];

  return [...roles]
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    .map((role) => mapRoleItemToAdminRow(role, safeUsers));
}

/**
 * Calculates the 4 KPI Stat Card metrics strictly from live Backend data (Zero Fake Data).
 */
export function calculateRoleKpis(
  rows: AdminRoleRow[],
  users?: UserResponse[] | null,
  totalElementsFromPage?: number | null
): RoleKpis {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const totalRoles = safeRows.length;
  const activeRoles = safeRows.filter((r) => r.status === 'ACTIVE').length;
  const disabledRoles = Math.max(0, totalRoles - activeRoles);
  const multiRoleAccountsCount = safeUsers.filter((u) => isMultiRoleUser(u)).length;
  const totalAccountsCount = Math.max(
    safeUsers.length,
    typeof totalElementsFromPage === 'number' && totalElementsFromPage > 0
      ? totalElementsFromPage
      : 0
  );

  return {
    totalRoles,
    activeRoles,
    disabledRoles,
    multiRoleAccountsCount,
    totalAccountsCount,
  };
}

/**
 * Filters AdminRoleRows by search query, category filter, and usage filter.
 */
export function filterRoleRows(
  rows: AdminRoleRow[],
  options: RoleFilterOptions
): AdminRoleRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const rawQuery = (options.searchQuery || '').trim().toLowerCase();
  const normalizedQuery = removeVietnameseTones(rawQuery).toLowerCase();

  return rows.filter((row) => {
    // 1. Category filter
    if (options.categoryFilter && options.categoryFilter !== 'ALL') {
      if (row.category !== options.categoryFilter) return false;
    }

    // 2. Usage filter
    if (options.usageFilter && options.usageFilter !== 'ALL') {
      if (options.usageFilter === 'CORE' && !row.isCoreSystemRole) return false;
      if (options.usageFilter === 'CUSTOM' && row.isCoreSystemRole) return false;
      if (options.usageFilter === 'WITH_USERS' && row.userCount === 0) return false;
      if (options.usageFilter === 'EMPTY_USERS' && row.userCount > 0) return false;
    }

    // 3. Search query across name, ID, description, displayTitle, and permissionScopes
    if (rawQuery) {
      const searchableFields = [
        row.name,
        row.shortLabel,
        `ma #${row.id}`,
        `id #${row.id}`,
        `#${row.id}`,
        String(row.id),
        row.description,
        row.rawDescription,
        row.displayTitle,
        ...row.permissionScopes,
      ]
        .join(' ')
        .toLowerCase();

      const toneFreeFields = removeVietnameseTones(searchableFields).toLowerCase();
      if (
        !searchableFields.includes(rawQuery) &&
        !toneFreeFields.includes(normalizedQuery)
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Validates Create / Update Role payload before calling POST /api/v1/roles or PUT /api/v1/roles/{id}.
 */
export function validateRoleFormInput(
  input: { name: string; description: string },
  existingRoles: RoleItem[] = [],
  editingRoleId?: number
): RoleValidationResult {
  const normalizedName = normalizeRoleCode(input.name).replace(/\s+/g, '_');
  const trimmedDescription = (input.description || '').trim();

  if (!normalizedName) {
    return {
      valid: false,
      normalizedName,
      trimmedDescription,
      error: 'Vui lòng nhập mã định danh vai trò (ví dụ: KIEM_DUYET_VIEN).',
    };
  }

  if (normalizedName.length < 2 || normalizedName.length > 50) {
    return {
      valid: false,
      normalizedName,
      trimmedDescription,
      error: 'Tên vai trò phải có độ dài từ 2 đến 50 ký tự.',
    };
  }

  if (!/^[A-Z0-9_]+$/.test(normalizedName)) {
    return {
      valid: false,
      normalizedName,
      trimmedDescription,
      error: 'Mã vai trò chỉ được chứa chữ cái in hoa (A-Z), chữ số (0-9) và dấu gạch dưới (_).',
    };
  }

  const duplicate = existingRoles.find(
    (r) =>
      normalizeRoleCode(r.name) === normalizedName &&
      (editingRoleId === undefined || r.id !== editingRoleId)
  );
  if (duplicate) {
    return {
      valid: false,
      normalizedName,
      trimmedDescription,
      error: `Vai trò "${normalizedName}" đã tồn tại trên hệ thống (Mã #${duplicate.id}).`,
    };
  }

  if (!trimmedDescription) {
    return {
      valid: false,
      normalizedName,
      trimmedDescription,
      error: 'Vui lòng nhập mô tả chức năng và phạm vi cho vai trò này.',
    };
  }

  if (trimmedDescription.length > 500) {
    return {
      valid: false,
      normalizedName,
      trimmedDescription,
      error: 'Mô tả vai trò không được vượt quá 500 ký tự.',
    };
  }

  return {
    valid: true,
    normalizedName,
    trimmedDescription,
  };
}

/**
 * Determines whether a role can be safely deleted without breaking core RBAC or active users.
 */
export function canDeleteRole(row: AdminRoleRow): { allowed: boolean; reason?: string } {
  if (row.isCoreSystemRole) {
    return {
      allowed: false,
      reason: `Vai trò "${row.shortLabel}" là vai trò cốt lõi của hệ thống nên được khóa bảo vệ để đảm bảo an toàn phân quyền.`,
    };
  }

  if (row.userCount > 0) {
    return {
      allowed: false,
      reason: `Vai trò "${row.shortLabel}" hiện đang được gán cho ${row.userCount} tài khoản. Vui lòng chuyển vai trò của các tài khoản này trước khi xóa.`,
    };
  }

  return { allowed: true };
}

/**
 * Enforces Backend UserServiceImpl.adminUpdateRole self-demotion guard (ErrorCode.CANNOT_MODIFY_OWN_ROLE - AUTH_2016):
 * An Admin cannot change their own primary role to anything other than ADMIN.
 */
export function canModifyUserPrimaryRole(
  targetUser: Pick<UserResponse, 'email'> | null | undefined,
  targetRoleName: string,
  currentAdminEmail?: string | null
): { allowed: boolean; reason?: string } {
  if (!targetUser) {
    return {
      allowed: false,
      reason: 'Vui lòng chọn một tài khoản người dùng để phân quyền.',
    };
  }

  const normalizedRole = normalizeRoleCode(targetRoleName);
  if (!normalizedRole) {
    return {
      allowed: false,
      reason: 'Vui lòng chọn vai trò cần thiết lập cho tài khoản.',
    };
  }

  const userEmail = (targetUser.email || '').trim().toLowerCase();
  const adminEmail = (currentAdminEmail || '').trim().toLowerCase();

  if (userEmail && adminEmail && userEmail === adminEmail && normalizedRole !== 'ADMIN') {
    return {
      allowed: false,
      reason:
        'Quy tắc bảo vệ an toàn hệ thống: Quản trị viên đang đăng nhập không thể tự hạ Vai trò chính của chính mình khỏi quyền Quản trị viên.',
    };
  }

  return { allowed: true };
}

/**
 * Grapheme-safe user initials extractor (handles Vietnamese diacritics, single-letter names, emoji).
 */
export function extractUserInitials(
  user?: Pick<UserResponse, 'fullName' | 'email'> | null
): string {
  if (!user) return 'SK';
  const rawName = (user.fullName || '').trim();
  const source = rawName || (user.email || '').split('@')[0] || 'SK';

  const rawWords = source
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);

  const words =
    rawWords.length > 0
      ? rawWords
      : source
          .trim()
          .split(/\s+/)
          .filter(Boolean);

  const firstGrapheme = (str: string): string => {
    const chars = Array.from(str);
    return (chars[0] || '').toUpperCase();
  };

  if (words.length >= 2) {
    const first = firstGrapheme(words[0]);
    const last = firstGrapheme(words[words.length - 1]);
    return `${first}${last}` || 'SK';
  }

  if (words.length === 1) {
    const chars = Array.from(words[0]);
    return chars.slice(0, 2).join('').toUpperCase() || 'SK';
  }

  return 'SK';
}

/**
 * Generates UTF-8 BOM CSV content for exporting role definitions & user assignment metrics.
 */
export function generateRolesCsv(rows: AdminRoleRow[]): string {
  const headers = [
    'STT',
    'Mã định danh',
    'Tên vai trò',
    'Danh xưng hệ thống',
    'Mô tả',
    'Phạm vi quyền hạn',
    'Trạng thái',
    'Tổng số người dùng',
    'Số tài khoản giữ làm Vai trò chính',
    'Số tài khoản giữ làm Vai trò kiêm nhiệm',
  ];

  const escapeCsvCell = (val: string | number): string => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = rows.map((row, idx) =>
    [
      idx + 1,
      `#${row.id}`,
      row.name,
      row.displayTitle,
      row.description,
      row.permissionScopes.join('; '),
      row.statusLabel,
      row.userCount,
      row.primaryUserCount,
      row.secondaryUserCount,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return `\uFEFF${headers.map(escapeCsvCell).join(',')}\n${lines.join('\n')}`;
}
