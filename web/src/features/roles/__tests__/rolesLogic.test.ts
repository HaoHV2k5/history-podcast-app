import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRoleCode,
  removeVietnameseTones,
  getUserRolesList,
  userHasRole,
  isMultiRoleUser,
  getRoleMetadata,
  getRoleVietnameseLabel,
  localizeRoleDescription,
  mapRoleItemToAdminRow,
  buildAdminRoleRows,
  calculateRoleKpis,
  filterRoleRows,
  validateRoleFormInput,
  canDeleteRole,
  canModifyUserPrimaryRole,
  extractUserInitials,
  generateRolesCsv,
} from '../rolesLogic.ts';
import type { RoleItem } from '../../../types/role.ts';
import type { UserResponse } from '../../../types/auth.ts';

describe('Admin Role & Permissions - rolesLogic Test Suite', () => {
  const sampleBackendRoles: RoleItem[] = [
    { id: 4, name: 'ADMIN', description: 'System administrator role' },
    { id: 1, name: 'VIEWER', description: 'Default viewer and listener role' },
    { id: 2, name: 'CREATOR', description: 'Content creator role' },
    { id: 3, name: 'NARRATOR', description: 'Voice narrator and voice actor role' },
    {
      id: 5,
      name: 'FREELANCER',
      description: 'Freelancer role for taking jobs, submitting proposals and deliverables',
    },
  ];

  const sampleBackendUsers: UserResponse[] = [
    {
      id: 101,
      email: 'admin@suky.vn',
      fullName: 'Quản Trị Viên Chính',
      roleName: 'ADMIN',
      roles: ['ADMIN'],
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 102,
      email: 'creator.narrator@suky.vn',
      fullName: 'Nguyễn Hoàng Minh',
      roleName: 'CREATOR',
      roles: ['CREATOR', 'NARRATOR', 'VIEWER'],
      status: 'ACTIVE',
      createdAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 103,
      email: 'narrator.freelancer@suky.vn',
      fullName: 'Đặng Thị Ngọc Hân',
      roleName: 'NARRATOR',
      roles: ['NARRATOR', 'FREELANCER'],
      status: 'ACTIVE',
      createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 104,
      email: 'viewer.only@suky.vn',
      fullName: 'Lê Quốc Huy',
      roleName: 'VIEWER',
      roles: ['VIEWER'],
      status: 'ACTIVE',
      createdAt: '2026-10-12T11:00:00Z',
    },
  ];

  test('1. Returns empty array safely when roles input is null, undefined, or empty (Zero Fake Data)', () => {
    assert.deepEqual(buildAdminRoleRows(null, sampleBackendUsers), []);
    assert.deepEqual(buildAdminRoleRows(undefined, sampleBackendUsers), []);
    assert.deepEqual(buildAdminRoleRows([], sampleBackendUsers), []);
    assert.equal(normalizeRoleCode('  creator '), 'CREATOR');
    assert.equal(removeVietnameseTones('Phân quyền & Vai trò'), 'Phan quyen & Vai tro');
    assert.deepEqual(getUserRolesList(sampleBackendUsers[1]), ['CREATOR', 'NARRATOR', 'VIEWER']);
    assert.equal(userHasRole(sampleBackendUsers[1], 'narrator'), true);
    assert.equal(isMultiRoleUser(sampleBackendUsers[1]), true);
    assert.equal(getRoleMetadata('CUSTOM_ROLE').isCoreSystemRole, false);
  });

  test('2. Sorts roles by ID ascending matching #1 VIEWER, #2 CREATOR, #3 NARRATOR, #4 ADMIN, #5 FREELANCER', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    assert.deepEqual(
      rows.map((r) => ({ id: r.id, name: r.name })),
      [
        { id: 1, name: 'VIEWER' },
        { id: 2, name: 'CREATOR' },
        { id: 3, name: 'NARRATOR' },
        { id: 4, name: 'ADMIN' },
        { id: 5, name: 'FREELANCER' },
      ]
    );
  });

  test('3. Maps permission scopes and icons accurately for the 5 standard RoleEnum roles', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));

    assert.equal(byName.VIEWER.iconKind, 'eye');
    assert.deepEqual(byName.VIEWER.permissionScopes, [
      'Xem nội dung',
      'Nghe demo',
      'Bình luận',
    ]);

    assert.equal(byName.CREATOR.iconKind, 'pencil');
    assert.deepEqual(byName.CREATOR.permissionScopes, [
      'Tạo nội dung',
      'Quản lý bản thảo',
      'Thuyết minh',
    ]);

    assert.equal(byName.NARRATOR.iconKind, 'mic');
    assert.deepEqual(byName.NARRATOR.permissionScopes, [
      'Nhận dự án',
      'Thu âm',
      'Quản lý hồ sơ',
    ]);

    assert.equal(byName.ADMIN.iconKind, 'settings');
    assert.deepEqual(byName.ADMIN.permissionScopes, [
      'Quản trị hệ thống',
      'Quản lý người dùng',
      'Toàn quyền',
    ]);

    assert.equal(byName.FREELANCER.iconKind, 'briefcase');
    assert.deepEqual(byName.FREELANCER.permissionScopes, [
      'Nhận việc',
      'Nộp đề xuất',
      'Tải sản phẩm',
    ]);
  });

  test('4. Distinguishes Primary Role (users.role_id) vs Secondary Role (user_roles) counts accurately', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));

    // VIEWER: user #104 has VIEWER as primary; user #102 has VIEWER in user_roles (secondary)
    assert.equal(byName.VIEWER.userCount, 2);
    assert.equal(byName.VIEWER.primaryUserCount, 1);
    assert.equal(byName.VIEWER.secondaryUserCount, 1);

    // NARRATOR: user #103 has NARRATOR as primary; user #102 has NARRATOR in user_roles (secondary)
    assert.equal(byName.NARRATOR.userCount, 2);
    assert.equal(byName.NARRATOR.primaryUserCount, 1);
    assert.equal(byName.NARRATOR.secondaryUserCount, 1);

    // FREELANCER: user #103 has FREELANCER as secondary only
    assert.equal(byName.FREELANCER.userCount, 1);
    assert.equal(byName.FREELANCER.primaryUserCount, 0);
    assert.equal(byName.FREELANCER.secondaryUserCount, 1);
  });

  test('5. Calculates 4 KPI Stat Card metrics strictly from live data without fake numbers', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    const kpis = calculateRoleKpis(rows, sampleBackendUsers);

    assert.equal(kpis.totalRoles, 5);
    assert.equal(kpis.activeRoles, 5);
    assert.equal(kpis.disabledRoles, 0);
    // Users #102 and #103 have > 1 role
    assert.equal(kpis.multiRoleAccountsCount, 2);
    assert.equal(kpis.totalAccountsCount, 4);

    // Empty fallback check
    const emptyKpis = calculateRoleKpis([], []);
    assert.equal(emptyKpis.totalRoles, 0);
    assert.equal(emptyKpis.activeRoles, 0);
    assert.equal(emptyKpis.disabledRoles, 0);
    assert.equal(emptyKpis.multiRoleAccountsCount, 0);
  });

  test('6. Filters roles by search query (including Vietnamese diacritics & permission scopes), category, and usage', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);

    // Search by permission scope without diacritics ("quan ly ban thao" -> CREATOR)
    const byScope = filterRoleRows(rows, {
      searchQuery: 'quan ly ban thao',
      categoryFilter: 'ALL',
      usageFilter: 'ALL',
    });
    assert.equal(byScope.length, 1);
    assert.equal(byScope[0].name, 'CREATOR');

    // Filter by category ADMIN_PRIVILEGE
    const byAdminCategory = filterRoleRows(rows, {
      searchQuery: '',
      categoryFilter: 'ADMIN_PRIVILEGE',
      usageFilter: 'ALL',
    });
    assert.equal(byAdminCategory.length, 1);
    assert.equal(byAdminCategory[0].name, 'ADMIN');
  });

  test('7. Validates Role create/edit input and prevents duplicate role names', () => {
    // Empty name
    const emptyRes = validateRoleFormInput(
      { name: '   ', description: 'Valid description' },
      sampleBackendRoles
    );
    assert.equal(emptyRes.valid, false);

    // Duplicate role name when creating
    const dupRes = validateRoleFormInput(
      { name: 'creator', description: 'Duplicate role' },
      sampleBackendRoles
    );
    assert.equal(dupRes.valid, false);

    // Editing same role ID allows keeping its own name
    const editRes = validateRoleFormInput(
      { name: 'CREATOR', description: 'Updated content creator description' },
      sampleBackendRoles,
      2
    );
    assert.equal(editRes.valid, true);
    assert.equal(editRes.normalizedName, 'CREATOR');
  });

  test('8. Protects core RoleEnum roles and roles with assigned users from accidental deletion', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    const adminRow = rows.find((r) => r.name === 'ADMIN')!;
    assert.equal(canDeleteRole(adminRow).allowed, false);

    // Custom role with 0 users is allowed to be deleted
    const customEmptyRow = mapRoleItemToAdminRow(
      { id: 99, name: 'CUSTOM_AUDITOR', description: 'Custom auditor' },
      sampleBackendUsers
    );
    assert.equal(customEmptyRow.isCoreSystemRole, false);
    assert.equal(customEmptyRow.userCount, 0);
    assert.equal(canDeleteRole(customEmptyRow).allowed, true);
  });

  test('9. Stress-tests worst-case user strings (break-ui catalog: emoji, 1-letter names, long emails)', () => {
    assert.equal(
      extractUserInitials({ fullName: '🦊 Fox', email: 'fox@example.com' }),
      'FO'
    );
    assert.equal(
      extractUserInitials({ fullName: 'J', email: 'j@b.co' }),
      'J'
    );
    assert.equal(
      extractUserInitials({
        fullName: 'Aleksandra Wiśniewska-Kowalczyk',
        email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
      }),
      'AW'
    );
    assert.equal(
      extractUserInitials({ fullName: '', email: 'ops@example.com' }),
      'OP'
    );
  });

  test('10. Generates UTF-8 BOM CSV export accurately', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    const csv = generateRolesCsv(rows);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('"VIEWER"'));
    assert.ok(csv.includes('"FREELANCER"'));
  });

  test('11. Enforces Backend CANNOT_MODIFY_OWN_ROLE self-demotion guard accurately in pure Vietnamese', () => {
    const adminUser = sampleBackendUsers[0]; // admin@suky.vn
    const otherUser = sampleBackendUsers[1]; // creator.narrator@suky.vn

    // Admin trying to downgrade their own primary role from ADMIN to VIEWER -> blocked
    const selfDowngrade = canModifyUserPrimaryRole(
      adminUser,
      'VIEWER',
      'admin@suky.vn'
    );
    assert.equal(selfDowngrade.allowed, false);
    assert.ok(selfDowngrade.reason?.includes('Quản trị viên đang đăng nhập không thể tự hạ'));

    // Admin keeping their own primary role as ADMIN -> allowed
    const selfKeepAdmin = canModifyUserPrimaryRole(
      adminUser,
      'ADMIN',
      'admin@suky.vn'
    );
    assert.equal(selfKeepAdmin.allowed, true);

    // Admin changing another user's primary role -> allowed
    const modifyOther = canModifyUserPrimaryRole(
      otherUser,
      'FREELANCER',
      'admin@suky.vn'
    );
    assert.equal(modifyOther.allowed, true);
  });

  test('12. Localizes default English seed descriptions from Backend migrations into 100% Vietnamese while preserving custom Vietnamese edits', () => {
    const rows = buildAdminRoleRows(sampleBackendRoles, sampleBackendUsers);
    for (const r of rows) {
      // None of the 5 rows should retain the raw English migration strings
      assert.equal(r.description.includes('Default viewer'), false);
      assert.equal(r.description.includes('Content creator role'), false);
      assert.equal(r.description.includes('Voice narrator'), false);
      assert.equal(r.description.includes('System administrator'), false);
      assert.equal(r.description.includes('Freelancer role for taking jobs'), false);
      assert.ok(r.backendFlowSummary.length > 20);
    }

    assert.equal(getRoleVietnameseLabel('VIEWER'), 'Thính giả');
    assert.equal(getRoleVietnameseLabel('CREATOR'), 'Nhà sáng tạo');
    assert.equal(getRoleVietnameseLabel('NARRATOR'), 'Thuyết minh viên');
    assert.equal(getRoleVietnameseLabel('ADMIN'), 'Quản trị viên');
    assert.equal(getRoleVietnameseLabel('FREELANCER'), 'Cộng tác viên');

    // Custom Vietnamese description saved by Admin via PUT /api/v1/roles/{id} is preserved
    const customDesc = 'Mô tả tiếng Việt đã được quản trị viên cập nhật riêng.';
    assert.equal(localizeRoleDescription('CREATOR', customDesc), customDesc);
  });
});
