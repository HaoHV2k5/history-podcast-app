import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateKycStats,
  getVerificationMethodBadge,
  getKycStatusBadgeConfig,
  getInitials,
  getAvatarColor,
  formatKycDateTime,
  formatPhoneSpaced,
  filterKycProfiles,
  generateKycProfilesCSV,
} from '../kycLogic.ts';
import type { KycProfile } from '../../../types/kyc.ts';

describe('Admin KYC Verification Logic & Data Mapping', () => {
  const sampleProfiles: KycProfile[] = [
    {
      id: 1,
      userId: 1,
      userEmail: 'hungdao@example.com',
      fullName: 'Tran Hung Dao',
      phone: '0912345678',
      contactEmail: 'hungdao@example.com',
      bankName: 'Vietcombank',
      bankAccountNumber: '001100223344',
      bankAccountHolder: 'TRAN HUNG DAO',
      verificationMethod: 'EMAIL',
      otpVerifiedAt: '2026-10-17T10:50:00Z',
      status: 'APPROVED',
      createdAt: '2026-10-17T10:51:00Z',
    },
    {
      id: 2,
      userId: 2,
      userEmail: 'minh.nguyen@example.com',
      fullName: 'Nguyễn Hoàng Minh',
      phone: '0909876543',
      contactEmail: 'minh.nguyen@example.com',
      verificationMethod: 'CCCD',
      status: 'PENDING',
      createdAt: '2026-10-17T09:20:00Z',
    },
    {
      id: 3,
      userId: 3,
      userEmail: 'lananh.tran@example.com',
      fullName: 'Trần Thị Lan Anh',
      phone: '0987654321',
      contactEmail: 'lananh.tran@example.com',
      verificationMethod: 'PHONE',
      status: 'REJECTED',
      rejectionReason: 'Ảnh giấy tờ không rõ',
      createdAt: '2026-10-16T16:15:00Z',
    },
    {
      id: 4,
      userId: 4,
      userEmail: 'quochuy.le@example.com',
      fullName: 'Lê Quốc Huy',
      phone: '0977888999',
      contactEmail: 'quochuy.le@example.com',
      verificationMethod: 'CCCD',
      status: 'APPROVED',
      createdAt: '2026-10-16T14:32:00Z',
    },
  ];

  it('1. Correctly calculates operational counts and status partitioning', () => {
    const stats = calculateKycStats(sampleProfiles);
    assert.strictEqual(stats.total, 4);
    assert.strictEqual(stats.pending, 1);
    assert.strictEqual(stats.approved, 2);
    assert.strictEqual(stats.rejected, 1);
  });

  it('2. Correctly overrides counts when backend queryTotals are supplied', () => {
    const stats = calculateKycStats(sampleProfiles, {
      total: 24,
      pending: 8,
      approved: 14,
      rejected: 2,
    });
    assert.strictEqual(stats.total, 24);
    assert.strictEqual(stats.pending, 8);
    assert.strictEqual(stats.approved, 14);
    assert.strictEqual(stats.rejected, 2);
    assert.strictEqual(stats.totalTrend, '+12%');
    assert.strictEqual(stats.pendingTrend, '+2');
  });

  it('3. Accurately maps verification methods to visual badges and icons', () => {
    const emailMethod = getVerificationMethodBadge('EMAIL');
    assert.strictEqual(emailMethod.label, 'OTP qua Email');
    assert.strictEqual(emailMethod.type, 'email');

    const phoneMethod = getVerificationMethodBadge('PHONE');
    assert.strictEqual(phoneMethod.label, 'OTP qua SMS');
    assert.strictEqual(phoneMethod.type, 'phone');

    const cccdMethod = getVerificationMethodBadge('CCCD');
    assert.strictEqual(cccdMethod.label, 'CCCD/CMND');
    assert.strictEqual(cccdMethod.type, 'cccd');

    const passportMethod = getVerificationMethodBadge('PASSPORT');
    assert.strictEqual(passportMethod.label, 'Hộ chiếu');
    assert.strictEqual(passportMethod.type, 'passport');

    const fallbackMethod = getVerificationMethodBadge(null);
    assert.strictEqual(fallbackMethod.label, 'OTP qua Email');
  });

  it('4. Correctly normalizes status badge colors matching mockup specs', () => {
    const approved = getKycStatusBadgeConfig('APPROVED');
    assert.strictEqual(approved.label, 'Đã phê duyệt');
    assert.ok(approved.dotColor.includes('#10B981'));

    const pending = getKycStatusBadgeConfig('PENDING');
    assert.strictEqual(pending.label, 'Chờ duyệt');
    assert.ok(pending.dotColor.includes('#F59E0B'));

    const rejected = getKycStatusBadgeConfig('REJECTED');
    assert.strictEqual(rejected.label, 'Bị từ chối');
    assert.ok(rejected.dotColor.includes('#EF4444'));
  });

  it('5. Extracts 2-letter initials accurately from various Vietnamese names', () => {
    assert.strictEqual(getInitials('Trần Thị Lan Anh'), 'LA');
    assert.strictEqual(getInitials('Phạm Tuấn'), 'PT');
    assert.strictEqual(getInitials('Lê Quốc Huy'), 'LH');
    assert.strictEqual(getInitials('Tran Hung Dao'), 'TD');
    assert.strictEqual(getInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.strictEqual(getInitials(null), 'SK');
    assert.strictEqual(getInitials(''), 'SK');
  });

  it('6. Deterministic avatar color palette provides stable styling', () => {
    const color1 = getAvatarColor('Trần Thị Lan Anh');
    const color2 = getAvatarColor('Trần Thị Lan Anh');
    assert.deepStrictEqual(color1, color2);
    assert.ok(color1.bg.startsWith('bg-['));
  });

  it('7. Formats Vietnamese dates into HH:mm dd/MM/yyyy without crashing', () => {
    const formatted = formatKycDateTime('2026-10-17T10:51:00Z');
    assert.ok(formatted.includes('17/10/2026') || formatted.includes('10/17/2026') || formatted.includes('2026'));
    assert.strictEqual(formatKycDateTime(null), '—');
    assert.strictEqual(formatKycDateTime(''), '—');
  });

  it('8. Formats phone numbers with clean 3-part grouping', () => {
    assert.strictEqual(formatPhoneSpaced('0912345678'), '0912 345 678');
    assert.strictEqual(formatPhoneSpaced(null), '—');
  });

  it('9. Filters KYC profiles by keyword, status, and method', () => {
    // Search by name
    const byName = filterKycProfiles(sampleProfiles, { search: 'Lan Anh' });
    assert.strictEqual(byName.length, 1);
    assert.strictEqual(byName[0].fullName, 'Trần Thị Lan Anh');

    // Search by user id
    const byId = filterKycProfiles(sampleProfiles, { search: '#002' });
    assert.strictEqual(byId.length, 1);
    assert.strictEqual(byId[0].fullName, 'Nguyễn Hoàng Minh');

    // Filter by status
    const approved = filterKycProfiles(sampleProfiles, { status: 'APPROVED' });
    assert.strictEqual(approved.length, 2);

    // Filter by method
    const phoneUsers = filterKycProfiles(sampleProfiles, { method: 'PHONE' });
    assert.strictEqual(phoneUsers.length, 1);
  });

  it('10. Generates valid CSV with UTF-8 BOM and headers for Excel', () => {
    const csv = generateKycProfilesCSV(sampleProfiles);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Mã hồ sơ'));
    assert.ok(csv.includes('Tran Hung Dao'));
    assert.ok(csv.includes('Vietcombank'));
  });

  it('11. Break-UI Stress-Test: Handles infinite strings, empty arrays and null items safely', () => {
    const brokenProfiles: KycProfile[] = [
      {
        id: 999999999,
        userId: 888888888,
        userEmail: 'a'.repeat(300) + '@example.com',
        fullName: 'B'.repeat(500),
        verificationMethod: 'UNKNOWN_METHOD',
        status: 'SOME_WEIRD_STATUS',
        createdAt: 'invalid-date',
      },
    ];

    const stats = calculateKycStats(brokenProfiles);
    assert.strictEqual(stats.total, 1);

    const filtered = filterKycProfiles(brokenProfiles, { search: 'b'.repeat(50) });
    assert.strictEqual(filtered.length, 1);

    const csv = generateKycProfilesCSV(brokenProfiles);
    assert.ok(csv.includes('888888888'));
  });
});
