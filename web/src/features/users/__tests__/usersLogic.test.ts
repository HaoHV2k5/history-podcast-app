import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateUserStats,
  filterUsers,
  getRoleBadgeConfig,
  getStatusPillConfig,
  formatUserDateTime,
  getAvatarInitials,
  formatChannelCount,
  exportUsersToCSV,
  validateCreateUserInput,
  sanitizeUserDisplay,
  formatUserProfileDetail,
  removeVietnameseTones,
} from '../usersLogic.ts';
import type { UserResponse } from '../../../types/auth.ts';

describe('Admin Users & Channels - usersLogic Test Suite', () => {
  const mockUsers: UserResponse[] = [
    {
      id: 1001,
      fullName: 'Nguyễn Hoàng Minh',
      email: 'minh.nguyen@example.com',
      phone: '0909 876 543',
      roleName: 'CREATOR',
      roles: ['CREATOR'],
      status: 'ACTIVE',
      createdAt: '2026-10-24T14:20:00Z',
    },
    {
      id: 1002,
      fullName: 'Trần Thị Lan Anh',
      email: 'lananh.tran@example.com',
      phone: '0987 654 321',
      roleName: 'CREATOR',
      roles: ['CREATOR'],
      status: 'ACTIVE',
      createdAt: '2026-10-23T10:15:00Z',
    },
    {
      id: 1003,
      fullName: 'Lê Quốc Huy',
      email: 'quochuy.le@example.com',
      phone: '0977 888 999',
      roleName: 'VIEWER',
      roles: ['VIEWER'],
      status: 'ACTIVE',
      createdAt: '2026-10-22T09:30:00Z',
    },
    {
      id: 1004,
      fullName: 'Phạm Minh Tâm',
      email: 'tam.pham@example.com',
      phone: '0966 111 222',
      roleName: 'CREATOR',
      roles: ['CREATOR'],
      status: 'TEMP_LOCKED',
      createdAt: '2026-10-20T16:45:00Z',
    },
    {
      id: 1006,
      fullName: 'Hoàng Văn Nam',
      email: 'nam.hoang@example.com',
      phone: '0912 345 678',
      roleName: 'USER',
      roles: ['USER'],
      status: 'LOCKED',
      createdAt: '2026-10-15T08:10:00Z',
    },
  ];

  it('1. Calculates live user KPI metrics correctly', () => {
    const stats = calculateUserStats({
      totalElements: 1284,
      activeCount: 1102,
      lockedCount: 24,
      usersList: mockUsers,
    });

    assert.strictEqual(stats.total, 1284);
    assert.strictEqual(stats.activeCount, 1102);
    assert.strictEqual(stats.lockedCount, 24);
    assert.ok(stats.totalTrend.includes('%'));
    assert.ok(stats.activeTrend.includes('%'));
    assert.ok(stats.lockedTrend.includes('%'));
    assert.ok(stats.totalSubtitle.includes('người dùng so với tháng trước'));
    assert.strictEqual(stats.newSubtitle, 'Trong 30 ngày qua');
  });

  it('2. Normalizes Vietnamese tones in search queries', () => {
    assert.strictEqual(removeVietnameseTones('Nguyễn Hoàng Minh'), 'Nguyen Hoang Minh');
    assert.strictEqual(removeVietnameseTones('Trần Thị Lan Anh'), 'Tran Thi Lan Anh');
    assert.strictEqual(removeVietnameseTones('Đỗ Quang Vinh'), 'Do Quang Vinh');
  });

  it('3. Filters users by keyword, role, and status accurately', () => {
    // Search by diacritic-free name
    const byName = filterUsers({ users: mockUsers, search: 'hoang minh' });
    assert.strictEqual(byName.length, 1);
    assert.strictEqual(byName[0].id, 1001);

    // Search by email
    const byEmail = filterUsers({ users: mockUsers, search: 'lananh.tran' });
    assert.strictEqual(byEmail.length, 1);
    assert.strictEqual(byEmail[0].id, 1002);

    // Filter by role
    const creators = filterUsers({ users: mockUsers, role: 'CREATOR' });
    assert.strictEqual(creators.length, 3);

    // Filter by status
    const locked = filterUsers({ users: mockUsers, status: 'LOCKED' });
    assert.strictEqual(locked.length, 1);
    assert.strictEqual(locked[0].id, 1006);
  });

  it('4. Configures role badges matching mockup color scheme', () => {
    const creatorBadge = getRoleBadgeConfig('CREATOR');
    assert.strictEqual(creatorBadge.label, 'CREATOR');
    assert.ok(creatorBadge.bg.includes('FFF1F2'));

    const userBadge = getRoleBadgeConfig('VIEWER');
    assert.strictEqual(userBadge.label, 'USER');
    assert.ok(userBadge.bg.includes('F1F5F9'));

    const adminBadge = getRoleBadgeConfig('ADMIN');
    assert.strictEqual(adminBadge.label, 'ADMIN');
  });

  it('5. Configures status pills matching mockup dot colors', () => {
    const activePill = getStatusPillConfig('ACTIVE');
    assert.strictEqual(activePill.label, 'Đang hoạt động');
    assert.ok(activePill.dotBg.includes('10B981'));

    const lockedPill = getStatusPillConfig('LOCKED');
    assert.strictEqual(lockedPill.label, 'Bị khóa');
    assert.ok(lockedPill.dotBg.includes('EF4444'));

    const tempLockedPill = getStatusPillConfig('TEMP_LOCKED');
    assert.strictEqual(tempLockedPill.label, 'Tạm khóa');
  });

  it('6. Formats date and time cleanly matching mockup columns', () => {
    const res = formatUserDateTime('2026-10-24T14:20:00Z');
    // We expect date to be present and time to be formatted
    assert.ok(res.date.includes('/'));
    assert.ok(res.time.includes(':'));

    // Null safety
    const nullRes = formatUserDateTime(null);
    assert.strictEqual(nullRes.date, '—');
    assert.strictEqual(nullRes.time, '—');
  });

  it('7. Extracts 2-letter initials for avatar fallback', () => {
    assert.strictEqual(getAvatarInitials('Lê Quốc Huy'), 'LH');
    assert.strictEqual(getAvatarInitials('Hoàng Văn Nam'), 'HN');
    assert.strictEqual(getAvatarInitials('Admin'), 'AD');
    assert.strictEqual(getAvatarInitials(null, 'test@example.com'), 'TE');
    assert.strictEqual(getAvatarInitials(null, null), 'U');
  });

  it('8. Validates channel count pill format', () => {
    const c3 = formatChannelCount(3);
    assert.strictEqual(c3.count, 3);
    assert.strictEqual(c3.label, '3 kênh');

    const c0 = formatChannelCount(0);
    assert.strictEqual(c0.count, 0);
    assert.strictEqual(c0.label, '0 kênh');
  });

  it('9. Exports users to valid UTF-8 BOM CSV', () => {
    const csv = exportUsersToCSV(mockUsers, { 1001: 3, 1002: 2 });
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Nguyễn Hoàng Minh'));
    assert.ok(csv.includes('minh.nguyen@example.com'));
    assert.ok(csv.includes('"3"'));
  });

  it('10. Validates new user input fields', () => {
    // Valid case
    const valid = validateCreateUserInput({
      email: 'creator@sucky.vn',
      password: 'password123',
      phone: '0901234567',
    });
    assert.strictEqual(valid.isValid, true);

    // Invalid email
    const invalidEmail = validateCreateUserInput({
      email: 'invalid-email',
      password: 'password123',
    });
    assert.strictEqual(invalidEmail.isValid, false);
    assert.ok(invalidEmail.errors.email);

    // Short password
    const shortPass = validateCreateUserInput({
      email: 'valid@example.com',
      password: '123',
    });
    assert.strictEqual(shortPass.isValid, false);
    assert.ok(shortPass.errors.password);
  });

  it('11. Break-UI: Gracefully sanitizes extreme and worst-case user data', () => {
    // Null object
    const nullUser = sanitizeUserDisplay(null);
    assert.strictEqual(nullUser.fullName, 'Chưa cập nhật tên');
    assert.strictEqual(nullUser.email, '—');
    assert.strictEqual(nullUser.initials, 'U');

    // Extreme string lengths
    const extremeUser = sanitizeUserDisplay({
      id: 999999999999,
      fullName: 'A'.repeat(500),
      email: 'extremely.long.unbreakable.email.address.' + 'x'.repeat(200) + '@domain.vn',
      phone: '0'.repeat(50),
      status: 'ACTIVE',
    });
    assert.strictEqual(extremeUser.id, 999999999999);
    assert.strictEqual(extremeUser.fullName.length, 500);
    assert.ok(extremeUser.initials.length <= 2);
  });

  it('12. User Detail Modal: Accurately formats profile details matching reference mockup', () => {
    // 1. Live User #8 real case from database
    const user8Profile = formatUserProfileDetail(
      {
        id: 8,
        fullName: 'Lê Trần Trường Hải',
        email: 'zapter0000@gmail.com',
        phone: '0356010883',
        bio: 'Nhà nghiên cứu và biên tập nội dung lịch sử Việt Nam thời kỳ phong kiến tự chủ, chuyên sản xuất podcast sử liệu chính thống.',
        status: 'ACTIVE',
        createdAt: '2026-10-27T12:48:47.861550Z',
        updatedAt: '2026-10-27T12:51:09.125913Z',
      },
      1
    );

    assert.strictEqual(user8Profile.id, 8);
    assert.strictEqual(user8Profile.displayName, 'Lê Trần Trường Hải');
    assert.strictEqual(user8Profile.email, 'zapter0000@gmail.com');
    assert.strictEqual(user8Profile.phone, '0356010883');
    assert.strictEqual(
      user8Profile.bio,
      'Nhà nghiên cứu và biên tập nội dung lịch sử Việt Nam thời kỳ phong kiến tự chủ, chuyên sản xuất podcast sử liệu chính thống.'
    );
    assert.strictEqual(user8Profile.channelText, '1 kênh phát thanh');
    assert.strictEqual(user8Profile.initials, 'LH');

    // 2. Null user fallback
    const nullProfile = formatUserProfileDetail(null, 0);
    assert.strictEqual(nullProfile.displayName, 'Chưa cập nhật tên');
    assert.strictEqual(nullProfile.phone, 'Chưa cập nhật SĐT');
    assert.strictEqual(nullProfile.bio, 'Chưa có phần giới thiệu bản thân.');
    assert.strictEqual(nullProfile.channelText, '0 kênh phát thanh');
    assert.strictEqual(nullProfile.createdFull, '—');
    assert.strictEqual(nullProfile.updatedFull, '—');

    // 3. User with no fullName and no bio
    const emptyProfile = formatUserProfileDetail(
      {
        id: 11,
        email: 'khachhang@historypodcast.com',
        createdAt: '2026-11-01T14:34:59.534734Z',
      },
      0
    );
    assert.strictEqual(emptyProfile.displayName, 'khachhang');
    assert.strictEqual(emptyProfile.bio, 'Chưa có phần giới thiệu bản thân.');
    assert.strictEqual(emptyProfile.phone, 'Chưa cập nhật SĐT');
    assert.strictEqual(emptyProfile.channelText, '0 kênh phát thanh');
  });
});
