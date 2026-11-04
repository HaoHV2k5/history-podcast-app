import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { AuditLogItem } from '../../../types/audit.ts';
import type { UserResponse } from '../../../types/auth.ts';
import {
  buildAdminAuditLogRows,
  buildUnifiedRealAuditLogRows,
  calculateAuditLogKpis,
  extractActorInitials,
  extractRealIpAddress,
  extractUniqueActors,
  filterAuditLogRows,
  formatAuditTimestampParts,
  generateAuditLogsCsv,
  getActorRoleVietnameseLabel,
  normalizeAuditNoteToVietnamese,
  resolveActorRoleBadges,
  resolveActorStatusMeta,
  resolveAuditActionMeta,
  resolveAuditLogCategory,
  resolveAuditTargetMeta,
} from '../auditLogsLogic.ts';

describe('Admin Audit Logs - auditLogsLogic Test Suite (100% Real Backend Data & Pure Vietnamese)', () => {
  const sampleUsers: UserResponse[] = [
    {
      id: 1,
      email: 'admin@suky.vn',
      fullName: 'Nguyễn Hoàng Minh',
      roleName: 'ADMIN',
      roles: ['ADMIN'],
      isAdmin: true,
      status: 'ACTIVE',
      avatarUrl: 'https://example.com/avatar1.png',
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 2,
      email: 'lananh.tran@suky.vn',
      fullName: 'Trần Thị Lan Anh',
      roleName: 'VIEWER',
      roles: ['VIEWER', 'CREATOR'],
      isCreator: true,
      status: 'ACTIVE',
      createdAt: '2026-10-02T08:00:00Z',
    },
    {
      id: 3,
      email: 'huy.le@suky.vn',
      fullName: 'Lê Quốc Huy',
      roleName: 'FREELANCER',
      roles: ['FREELANCER'],
      isFreelancer: true,
      status: 'LOCKED',
      createdAt: '2026-10-03T08:00:00Z',
    },
  ];

  test('1. Returns empty array and zero KPIs when backend returns empty or null data (Zero Fake Data)', () => {
    assert.deepEqual(buildAdminAuditLogRows([], sampleUsers), []);
    assert.deepEqual(buildAdminAuditLogRows(null, sampleUsers), []);
    assert.deepEqual(buildAdminAuditLogRows(undefined, undefined), []);
    assert.deepEqual(buildUnifiedRealAuditLogRows({}), []);

    const emptyKpis = calculateAuditLogKpis([]);
    assert.deepEqual(emptyKpis, {
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
    });
  });

  test('2. Maps actionType codes to pure Vietnamese labels and icons accurately', () => {
    assert.deepEqual(resolveAuditActionMeta('UPDATE'), {
      kind: 'UPDATE',
      label: 'Cập nhật',
    });
    assert.deepEqual(resolveAuditActionMeta('APPROVE'), {
      kind: 'APPROVE',
      label: 'Duyệt',
    });
    assert.deepEqual(resolveAuditActionMeta('LOGIN'), {
      kind: 'LOGIN',
      label: 'Đăng nhập',
    });
    assert.deepEqual(resolveAuditActionMeta('CREATE'), {
      kind: 'CREATE',
      label: 'Tạo mới',
    });
    assert.deepEqual(resolveAuditActionMeta('DELETE'), {
      kind: 'DELETE',
      label: 'Xóa',
    });
    assert.deepEqual(resolveAuditActionMeta('REJECT'), {
      kind: 'REJECT',
      label: 'Từ chối',
    });
    assert.deepEqual(resolveAuditActionMeta('GRANT_ROLE'), {
      kind: 'GRANT_ROLE',
      label: 'Phân quyền',
    });
    assert.deepEqual(resolveAuditActionMeta('LOGOUT'), {
      kind: 'LOGOUT',
      label: 'Đăng xuất',
    });
  });

  test('3. Maps targetType and targetId to 100% pure Vietnamese labels, subtitles, and Admin routes', () => {
    const policyTarget = resolveAuditTargetMeta('AI_SHIELD_POLICY', null, 'UPDATE');
    assert.equal(policyTarget.label, 'Chính sách hệ thống');
    assert.equal(policyTarget.subtitle, 'Cấu hình Lá chắn kiểm duyệt');
    assert.equal(policyTarget.route, '/admin/policies');

    const narratorTarget = resolveAuditTargetMeta('NARRATOR_PROFILE', 125, 'APPROVE');
    assert.equal(narratorTarget.label, 'Hồ sơ thuyết minh');
    assert.equal(narratorTarget.subtitle, 'Mã số: TM00125');
    assert.equal(narratorTarget.route, '/admin/narrators');

    const contractTarget = resolveAuditTargetMeta('CONTRACT', 128, 'CREATE');
    assert.equal(contractTarget.label, 'Hợp đồng thu âm');
    assert.equal(contractTarget.subtitle, 'Mã số: HD00128');
    assert.equal(contractTarget.route, '/admin/contracts');

    const membershipTarget = resolveAuditTargetMeta('MEMBERSHIP_PLAN', 1, 'UPDATE');
    assert.equal(membershipTarget.label, 'Gói hội viên');
    assert.equal(membershipTarget.subtitle, 'Mã số: GV001');
    assert.equal(membershipTarget.route, '/admin/membership');

    const withdrawalTarget = resolveAuditTargetMeta('WITHDRAWAL', 156, 'REJECT');
    assert.equal(withdrawalTarget.label, 'Yêu cầu rút tiền');
    assert.equal(withdrawalTarget.subtitle, 'Mã số: RT00156');
    assert.equal(withdrawalTarget.route, '/admin/withdrawals');

    const kycTarget = resolveAuditTargetMeta('KYC_PROFILE', 42, 'APPROVE');
    assert.equal(kycTarget.label, 'Hồ sơ định danh');
    assert.equal(kycTarget.subtitle, 'Mã số: DD0042');
    assert.equal(kycTarget.route, '/admin/kyc');

    assert.deepEqual(resolveAuditLogCategory('LOGIN', 'LOGIN', 'SYSTEM'), {
      category: 'SECURITY',
      label: 'Bảo mật',
    });
    assert.deepEqual(resolveAuditLogCategory('UPDATE', 'UPDATE', 'POLICY'), {
      category: 'SYSTEM',
      label: 'Hệ thống',
    });
    assert.deepEqual(resolveAuditLogCategory('APPROVE', 'APPROVE', 'NARRATOR_PROFILE'), {
      category: 'USER',
      label: 'Người dùng',
    });
  });

  test('4. Resolves actor multi-role badges and account status in 100% pure Vietnamese', () => {
    const multiRoleBadges = resolveActorRoleBadges(sampleUsers[1]);
    assert.deepEqual(
      multiRoleBadges.map((b) => b.label),
      ['Thính giả • Chính', 'Nhà sáng tạo']
    );

    const adminBadges = resolveActorRoleBadges(sampleUsers[0]);
    assert.deepEqual(
      adminBadges.map((b) => b.label),
      ['Quản trị viên • Chính']
    );

    assert.deepEqual(resolveActorStatusMeta(sampleUsers[0]), {
      label: 'Hoạt động',
      tone: 'emerald',
    });
    assert.deepEqual(resolveActorStatusMeta(sampleUsers[2]), {
      label: 'Bị khóa',
      tone: 'rose',
    });
    assert.deepEqual(resolveActorStatusMeta(undefined), {
      label: 'Tự động',
      tone: 'emerald',
    });

    assert.equal(
      normalizeAuditNoteToVietnamese(
        'Đăng nhập vào hệ thống (Admin) và cấp quyền ROLE_CREATOR trên AI Shield'
      ),
      'Đăng nhập vào hệ thống (Quản trị viên) và cấp quyền Nhà sáng tạo trên Lá chắn kiểm duyệt'
    );
  });

  test('5. Never invents fake IP addresses when DTO has no IP field', () => {
    const noIp = extractRealIpAddress(undefined, 'Thay đổi ngưỡng kiểm duyệt từ 70% → 80%');
    assert.equal(noIp.cleanIp, null);
    assert.equal(noIp.cleanNote, 'Thay đổi ngưỡng kiểm duyệt từ 70% → 80%');

    const withNoteIp = extractRealIpAddress(
      undefined,
      'Đăng nhập vào hệ thống [IP: 192.168.1.35]'
    );
    assert.equal(withNoteIp.cleanIp, '192.168.1.35');
    assert.equal(withNoteIp.cleanNote, 'Đăng nhập vào hệ thống');
  });

  test('6. Enriches audit logs with live User profiles and computes accurate KPIs', () => {
    const now = new Date('2026-10-25T12:00:00Z').getTime();
    const rawLogs: AuditLogItem[] = [
      {
        id: 1,
        actorId: 1,
        actionType: 'UPDATE',
        targetType: 'POLICY',
        targetId: null,
        note: 'Thay đổi ngưỡng kiểm duyệt từ 70% → 80%',
        createdAt: '2026-10-24T07:32:21Z',
      },
      {
        id: 2,
        actorId: 2,
        actionType: 'APPROVE',
        targetType: 'NARRATOR_PROFILE',
        targetId: 125,
        note: 'Duyệt hồ sơ thuyết minh: "Việt Nam Thời Lý"',
        createdAt: '2026-10-24T06:18:45Z',
      },
      {
        id: 3,
        actorId: 3,
        actionType: 'LOGIN',
        targetType: 'SYSTEM',
        targetId: null,
        note: 'Đăng nhập vào hệ thống (Admin)',
        createdAt: '2026-10-15T04:05:12Z',
      },
    ];

    const rows = buildAdminAuditLogRows(rawLogs, sampleUsers);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].rawAuditLogId, 1);
    assert.equal(rows[0].actorName, 'Nguyễn Hoàng Minh');
    assert.equal(rows[0].actorEmail, 'admin@suky.vn');
    assert.equal(rows[0].actorRoleLabel, 'Quản trị viên');
    assert.equal(rows[0].actorStatusLabel, 'Hoạt động');
    assert.equal(rows[0].ipAddress, null);
    assert.equal(rows[0].ipDisplayLabel, 'Chưa ghi nhận');

    // Note on row 2 (id=3) is normalized to pure Vietnamese
    const loginRow = rows.find((r) => r.id === 3)!;
    assert.equal(loginRow.detailText, 'Đăng nhập vào hệ thống (Quản trị viên)');
    assert.equal(loginRow.actorStatusLabel, 'Bị khóa');

    const kpis = calculateAuditLogKpis(rows, now);
    assert.equal(kpis.totalLogs, 3);
    assert.equal(kpis.systemLogsCount, 1);
    assert.equal(kpis.userLogsCount, 1);
    assert.equal(kpis.securityLogsCount, 1);
    assert.equal(kpis.recent7dCount, 2);
    assert.equal(kpis.prev7dCount, 1);
    assert.equal(kpis.diff7dCount, 1);
    assert.equal(kpis.totalTrendPercent, 100);
  });

  test('7. Aggregates 100% real Backend domain records accurately via buildUnifiedRealAuditLogRows', () => {
    const unified = buildUnifiedRealAuditLogRows({
      auditLogs: [
        {
          id: 5,
          actorId: 1,
          actionType: 'UPDATE',
          targetType: 'POLICY',
          targetId: 1,
          note: 'Cập nhật cấu hình kiểm duyệt từ bảng audit_logs',
          createdAt: '2026-10-25T10:00:00Z',
        },
      ],
      users: sampleUsers,
      refreshTokens: [
        {
          id: 10,
          userId: 1,
          tokenHash: 'hash-1',
          expiresAt: '2026-11-01T10:00:00Z',
          revokedAt: null,
          createdAt: '2026-10-25T09:00:00Z',
        },
      ],
      policyConfigs: [
        {
          id: 1,
          tier: 'RED',
          label: 'Mức đỏ',
          minScore: 0,
          maxScore: 40,
          description: 'Chặn tự động',
          updatedAt: '2026-10-25T08:00:00Z',
        },
      ],
      withdrawals: [
        {
          id: 156,
          walletId: 2,
          amount: 1500000,
          bankName: 'Vietcombank',
          accountNumber: '0123456789',
          accountHolderName: 'TRAN THI LAN ANH',
          status: 'COMPLETED',
          processedAt: '2026-10-25T07:30:00Z',
          requestedAt: '2026-10-24T07:30:00Z',
        },
      ],
    });

    // 1 raw audit log + 6 user role/account events + 1 refresh token + 1 policy config + 1 withdrawal = 10 real rows
    assert.equal(unified.length, 10);

    // First row is the newest (2026-10-25T10:00:00Z) from audit_logs
    assert.equal(unified[0].rawAuditLogId, 5);
    assert.equal(unified[0].sourceModuleLabel, 'Phân hệ Chính sách & Cấu hình thẩm định');

    // Second row is from refresh_tokens (2026-10-25T09:00:00Z) with rawAuditLogId = null
    assert.equal(unified[1].rawAuditLogId, null);
    assert.equal(unified[1].actionKind, 'LOGIN');
    assert.equal(unified[1].category, 'SECURITY');
    assert.equal(unified[1].actorName, 'Nguyễn Hoàng Minh');
    assert.equal(unified[1].sourceModuleLabel, 'Phân hệ Xác thực & Bảo mật phiên làm việc');
  });

  test('8. Filters rows by Vietnamese accent-insensitive search, category, action, actor, and date range', () => {
    const now = new Date('2026-10-25T12:00:00Z').getTime();
    const rawLogs: AuditLogItem[] = [
      {
        id: 10,
        actorId: 1,
        actionType: 'UPDATE',
        targetType: 'POLICY',
        targetId: 1,
        note: 'Thay đổi ngưỡng kiểm duyệt từ 70% → 80%',
        createdAt: '2026-10-24T07:32:21Z',
      },
      {
        id: 11,
        actorId: 2,
        actionType: 'REJECT',
        targetType: 'WITHDRAWAL',
        targetId: 156,
        note: 'Từ chối yêu cầu rút tiền do thiếu thông tin',
        createdAt: '2026-09-01T09:18:54Z',
      },
    ];

    const rows = buildAdminAuditLogRows(rawLogs, sampleUsers);

    const bySearch = filterAuditLogRows(
      rows,
      {
        searchQuery: 'nguong kiem duyet',
        categoryFilter: 'ALL',
        actionFilter: 'ALL',
        actorFilter: 'ALL',
        dateRangePreset: 'all',
      },
      now
    );
    assert.equal(bySearch.length, 1);
    assert.equal(bySearch[0].id, 10);

    const byCategory = filterAuditLogRows(
      rows,
      {
        searchQuery: '',
        categoryFilter: 'USER',
        actionFilter: 'ALL',
        actorFilter: 'ALL',
        dateRangePreset: 'all',
      },
      now
    );
    assert.equal(byCategory.length, 1);
    assert.equal(byCategory[0].id, 11);

    const by7d = filterAuditLogRows(
      rows,
      {
        searchQuery: '',
        categoryFilter: 'ALL',
        actionFilter: 'ALL',
        actorFilter: 'ALL',
        dateRangePreset: '7d',
      },
      now
    );
    assert.equal(by7d.length, 1);
    assert.equal(by7d[0].id, 10);

    const actors = extractUniqueActors(rows);
    assert.equal(actors.length, 2);
  });

  test('9. Break-UI stress-test: handles 1-char names, long unbreakable strings, null fields, invalid dates', () => {
    assert.equal(extractActorInitials('A'), 'A');
    assert.equal(
      extractActorInitials('', 'bartholomew.fitzgerald@northwind.example.com'),
      'BA'
    );
    assert.equal(extractActorInitials(null, null), 'HT');
    assert.equal(getActorRoleVietnameseLabel('ROLE_FREELANCER'), 'Cộng tác viên');
    assert.equal(formatAuditTimestampParts('invalid-date').datePart, '—');

    const worstLogs: AuditLogItem[] = [
      {
        id: 999999,
        actorId: null,
        actionType: null,
        targetType: null,
        targetId: null,
        note: 'A'.repeat(600),
        createdAt: null,
      },
    ];
    const rows = buildAdminAuditLogRows(worstLogs, []);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].actorName, 'Hệ thống Sử Ký');
    assert.equal(rows[0].detailText.length, 600);
    assert.equal(rows[0].datePart, '—');

    const csv = generateAuditLogsCsv(rows);
    assert.equal(csv.startsWith('\uFEFF'), true);
    assert.equal(csv.includes('#999999'), true);
  });
});
