import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNarratorStatus,
  getNarratorStatusBadgeConfig,
  detectVoiceGender,
  detectLanguage,
  splitDateTime,
  extractInitials,
  formatVND,
  buildAdminNarratorRows,
  calculateNarratorKPIs,
  filterAdminNarratorRows,
  exportNarratorsToCSV,
  sanitizeWorstCaseNarrator,
} from '../narratorsLogic.ts';
import type { NarratorProfileItem, NarratorDemoItem } from '../../../types/narrator.ts';
import type { UserResponse } from '../../../types/auth.ts';

describe('Admin Narrators - narratorsLogic Test Suite', () => {
  it('1. Normalizes narrator status strings properly', () => {
    assert.equal(normalizeNarratorStatus('APPROVED'), 'APPROVED');
    assert.equal(normalizeNarratorStatus('active'), 'APPROVED');
    assert.equal(normalizeNarratorStatus('DA_DUYET'), 'APPROVED');

    assert.equal(normalizeNarratorStatus('PROCESSING'), 'PROCESSING');
    assert.equal(normalizeNarratorStatus('in_progress'), 'PROCESSING');
    assert.equal(normalizeNarratorStatus('DANG_XU_LY'), 'PROCESSING');

    assert.equal(normalizeNarratorStatus('REJECTED'), 'REJECTED');
    assert.equal(normalizeNarratorStatus('tu_choi'), 'REJECTED');
    assert.equal(normalizeNarratorStatus('LOCKED'), 'REJECTED');

    assert.equal(normalizeNarratorStatus('PENDING'), 'PENDING');
    assert.equal(normalizeNarratorStatus(''), 'PENDING');
    assert.equal(normalizeNarratorStatus(null), 'PENDING');
  });

  it('2. Maps narrator status badge config correctly with pixel-perfect tokens', () => {
    const approved = getNarratorStatusBadgeConfig('APPROVED');
    assert.equal(approved.label, 'Đã duyệt');
    assert.equal(approved.dot, 'bg-emerald-500');

    const pending = getNarratorStatusBadgeConfig('PENDING');
    assert.equal(pending.label, 'Chờ xét duyệt');
    assert.equal(pending.dot, 'bg-amber-500');

    const processing = getNarratorStatusBadgeConfig('PROCESSING');
    assert.equal(processing.label, 'Đang xử lý');
    assert.equal(processing.dot, 'bg-sky-500');

    const rejected = getNarratorStatusBadgeConfig('REJECTED');
    assert.equal(rejected.label, 'Bị từ chối');
    assert.equal(rejected.dot, 'bg-rose-500');
  });

  it('3. Detects voice gender from keywords and Vietnamese name heuristics', () => {
    const f1 = detectVoiceGender('Giọng nữ miền Bắc', 'Nhiều năm kinh nghiệm');
    assert.equal(f1.code, 'FEMALE');
    assert.equal(f1.label, 'Giọng nữ');

    const m1 = detectVoiceGender('Tiếng Việt', 'Chuyên giọng nam trầm ấm');
    assert.equal(m1.code, 'MALE');
    assert.equal(m1.label, 'Giọng nam');

    const f2 = detectVoiceGender('', '', 'Trần Thị Lan Anh');
    assert.equal(f2.code, 'FEMALE');

    const m2 = detectVoiceGender('', '', 'Lê Quốc Huy');
    assert.equal(m2.code, 'MALE');

    const other = detectVoiceGender('', '', 'Agency Voice Studio');
    assert.equal(other.code, 'OTHER');
    assert.equal(other.label, 'Đa dạng giọng');
  });

  it('4. Detects languages and flag icons accurately', () => {
    assert.equal(detectLanguage('Tiếng Anh (Bản xứ)').label, 'Tiếng Anh');
    assert.equal(detectLanguage('Tiếng Anh').flag, '🇬🇧');

    assert.equal(detectLanguage('Tiếng Nhật N1').label, 'Tiếng Nhật');
    assert.equal(detectLanguage('Tiếng Nhật').flag, '🇯🇵');

    assert.equal(detectLanguage('Tiếng Hàn Topik 6').label, 'Tiếng Hàn');
    assert.equal(detectLanguage('Tiếng Hàn').flag, '🇰🇷');

    assert.equal(detectLanguage('Tiếng Việt chuẩn').label, 'Tiếng Việt');
    assert.equal(detectLanguage('Tiếng Việt').flag, '🇻🇳');
  });

  it('5. Splits ISO date string into DD/MM/YYYY date and HH:mm:ss time', () => {
    const res = splitDateTime('2026-10-24T14:32:21.000Z');
    assert.match(res.dateStr, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.match(res.timeStr, /^\d{2}:\d{2}:\d{2}$/);

    const fallback = splitDateTime(null);
    assert.equal(fallback.dateStr, 'Chưa cập nhật');
    assert.equal(fallback.timeStr, '--:--:--');
  });

  it('6. Extracts initials for avatar fallback', () => {
    assert.equal(extractInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.equal(extractInitials('Đỗ Quang Vinh'), 'ĐV');
    assert.equal(extractInitials('Hải'), 'HẢ');
    assert.equal(extractInitials(''), 'SK');
  });

  it('7. Formats VND currency cleanly', () => {
    assert.equal(formatVND(0), '0 ₫');
    assert.match(formatVND(500000), /500\.000/);
    assert.equal(formatVND(null), '0 đ');
  });

  it('8. Joins raw backend narrators with live users and audio demos (Zero Fake Data)', () => {
    const rawProfiles: NarratorProfileItem[] = [
      {
        id: 1,
        userId: 101,
        bio: 'Nghệ sĩ lồng tiếng phim tài liệu lịch sử',
        languages: 'Tiếng Việt, Giọng nữ',
        baseRate: 200000,
        status: 'APPROVED',
        createdAt: '2026-10-24T14:32:21Z',
      },
    ];

    const rawUsers: UserResponse[] = [
      {
        id: 101,
        fullName: 'Nguyễn Hoàng Minh',
        email: 'minh.nguyen@example.com',
        phone: '0912 345 678',
        roleId: 2,
        roleName: 'NARRATOR',
        roles: ['NARRATOR'],
        isCreator: false,
        isFreelancer: true,
        isAdmin: false,
        status: 'ACTIVE',
        createdAt: '2026-10-24T14:32:21Z',
      },
    ];

    const rawDemos: NarratorDemoItem[] = [
      {
        id: 501,
        narratorProfileId: 1,
        title: 'Demo Giọng đọc Sử Ký Bạch Đằng',
        fileUrl: 'https://cdn.suky.vn/audio/demo-bach-dang.mp3',
        uploadedAt: '2026-10-24T15:00:00Z',
      },
    ];

    const rows = buildAdminNarratorRows(rawProfiles, rawUsers, rawDemos);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].fullName, 'Nguyễn Hoàng Minh');
    assert.equal(rows[0].email, 'minh.nguyen@example.com');
    assert.equal(rows[0].phone, '0912 345 678');
    assert.equal(rows[0].voiceGender, 'FEMALE');
    assert.equal(rows[0].status, 'APPROVED');
    assert.equal(rows[0].statusLabel, 'Đã duyệt');
    assert.equal(rows[0].demos.length, 1);
    assert.equal(rows[0].primaryDemo?.title, 'Demo Giọng đọc Sử Ký Bạch Đằng');
  });

  it('9. Safely handles empty narrator profiles array returning zeros (Empty State safety)', () => {
    const rows = buildAdminNarratorRows([], [], []);
    assert.equal(rows.length, 0);

    const kpis = calculateNarratorKPIs(rows);
    assert.equal(kpis.totalCount, 0);
    assert.equal(kpis.pendingCount, 0);
    assert.equal(kpis.approvedCount, 0);
    assert.equal(kpis.rejectedCount, 0);
    assert.equal(kpis.totalTrend, 0);
  });

  it('10. Filters rows by search query, status tab, voice gender, and date range', () => {
    const rows = buildAdminNarratorRows(
      [
        {
          id: 1,
          userId: 1,
          languages: 'Tiếng Việt',
          bio: 'Giọng nữ ngọt ngào',
          status: 'APPROVED',
          createdAt: '2026-10-24T14:32:21Z',
        },
        {
          id: 2,
          userId: 2,
          languages: 'Tiếng Anh',
          bio: 'Giọng nam trầm ấm',
          status: 'PENDING',
          createdAt: '2026-10-23T11:20:10Z',
        },
      ],
      [
        { id: 1, fullName: 'Lan Anh', email: 'lananh@example.com', status: 'ACTIVE', createdAt: '2026-10-24T14:32:21Z' },
        { id: 2, fullName: 'Quốc Huy', email: 'quochuy@example.com', status: 'ACTIVE', createdAt: '2026-10-24T14:32:21Z' },
      ],
      []
    );

    // Search query filter
    const searchMatch = filterAdminNarratorRows(rows, { searchQuery: 'Lan Anh' });
    assert.equal(searchMatch.length, 1);
    assert.equal(searchMatch[0].fullName, 'Lan Anh');

    // Status Tab filter
    const pendingOnly = filterAdminNarratorRows(rows, { statusTab: 'PENDING' });
    assert.equal(pendingOnly.length, 1);
    assert.equal(pendingOnly[0].fullName, 'Quốc Huy');

    // Voice Gender filter
    const femaleOnly = filterAdminNarratorRows(rows, { voiceGender: 'FEMALE' });
    assert.equal(femaleOnly.length, 1);
    assert.equal(femaleOnly[0].fullName, 'Lan Anh');
  });

  it('11. Generates valid UTF-8 BOM CSV export string for Excel compatibility', () => {
    const rows = buildAdminNarratorRows(
      [
        {
          id: 1,
          userId: 101,
          languages: 'Tiếng Việt',
          bio: 'Giọng đọc thời sự',
          baseRate: 250000,
          status: 'APPROVED',
          createdAt: '2026-10-24T14:32:21Z',
        },
      ],
      [{ id: 101, fullName: 'Nguyễn Hoàng Minh', email: 'minh.nguyen@example.com', status: 'ACTIVE', createdAt: '2026-10-24T14:32:21Z' }],
      []
    );

    const csv = exportNarratorsToCSV(rows);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Nguyễn Hoàng Minh'));
    assert.ok(csv.includes('Đã duyệt'));
  });

  it('12. Break-UI Stress-Test: Handles extreme strings, missing fields, and extreme values gracefully', () => {
    const extremeItem = sanitizeWorstCaseNarrator({
      id: 999999999999,
      userId: 888888888888,
      fullName: 'A'.repeat(500),
      email: 'extreme.narrator.with.very.long.domain.name@superlongdomainnamefortestingpurposeonly.suky.vn',
      bio: 'B'.repeat(2000),
      baseRate: 999999999999999,
      status: 'APPROVED',
    });

    assert.ok(extremeItem.fullName.length <= 200);
    assert.ok(extremeItem.email.length <= 150);
    assert.ok(extremeItem.bio.length <= 1000);
    assert.ok(extremeItem.initials.length <= 2);
    assert.equal(extremeItem.status, 'APPROVED');
  });
});
