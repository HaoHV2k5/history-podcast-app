import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVietnamese,
  extractInitials,
  formatAmountVND,
  formatAccountNumber,
  splitDateTime,
  getBankBadgeConfig,
  getStatusBadgeConfig,
  buildAdminWithdrawalRows,
  calculateWithdrawalKPIs,
  calculateDateRangeBounds,
  filterAdminWithdrawalRows,
  exportWithdrawalsToCSV,
  validateRejectReason,
} from '../withdrawalsLogic.ts';
import type { UserSummary } from '../withdrawalsLogic.ts';
import type { WithdrawalItem } from '../../../types/withdrawal.ts';

describe('Admin Withdrawals - withdrawalsLogic Test Suite', () => {
  // 1. Text normalization & initials
  it('1. Normalizes Vietnamese diacritics and extracts 2-letter uppercase initials', () => {
    assert.equal(normalizeVietnamese('Nguyễn Hoàng Minh'), 'nguyen hoang minh');
    assert.equal(normalizeVietnamese('Trần Thị Lan Anh'), 'tran thi lan anh');
    assert.equal(normalizeVietnamese('Đỗ Quang Vinh'), 'do quang vinh');
    assert.equal(normalizeVietnamese(''), '');

    assert.equal(extractInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.equal(extractInitials('Admin'), 'AD');
    assert.equal(extractInitials(''), 'SK');
  });

  // 2. Financial formatting
  it('2. Formats VND amount and bank account numbers cleanly', () => {
    assert.equal(formatAmountVND(500000), '500.000 đ');
    assert.equal(formatAmountVND(1200000), '1.200.000 đ');
    assert.equal(formatAmountVND(0), '0 đ');
    assert.equal(formatAmountVND(null), '0 đ');

    assert.equal(formatAccountNumber('123456789012'), '1234 5678 9012');
    assert.equal(formatAccountNumber('09876543210'), '0987 6543 210');
    assert.equal(formatAccountNumber(''), '—');
    assert.equal(formatAccountNumber(undefined), '—');
  });

  // 3. Date & time splitting
  it('3. Safely splits ISO date string into DD/MM/YYYY date and HH:mm:ss time', () => {
    const iso = '2026-10-24T14:32:21Z';
    const { datePart, timePart } = splitDateTime(iso);
    assert.ok(datePart.includes('/2026'));
    assert.ok(timePart.length === 8);

    const invalid = splitDateTime('invalid-date');
    assert.equal(invalid.datePart, '—');
    assert.equal(invalid.timePart, '—');
  });

  // 4. Bank branding config
  it('4. Resolves bank branding config accurately for popular Vietnamese banks', () => {
    const vcb = getBankBadgeConfig('Vietcombank');
    assert.equal(vcb.code, 'VCB');
    assert.equal(vcb.shortName, 'Vietcombank');

    const mb = getBankBadgeConfig('Ngân hàng Quân Đội (MB Bank)');
    assert.equal(mb.code, 'MB');

    const tcb = getBankBadgeConfig('Techcombank');
    assert.equal(tcb.code, 'TCB');

    const bidv = getBankBadgeConfig('BIDV');
    assert.equal(bidv.code, 'BIDV');

    const acb = getBankBadgeConfig('ACB');
    assert.equal(acb.code, 'ACB');

    const fallback = getBankBadgeConfig('Ngân hàng Bản Việt');
    assert.equal(fallback.shortName, 'Ngân hàng Bản Việt');
  });

  // 5. Status badge config
  it('5. Maps all withdrawal statuses to Vietnamese labels and dot colors', () => {
    const pending = getStatusBadgeConfig('PENDING');
    assert.equal(pending.label, 'Chờ xét duyệt');
    assert.equal(pending.iconName, 'clock');

    const processing = getStatusBadgeConfig('PROCESSING');
    assert.equal(processing.label, 'Đang xử lý');
    assert.equal(processing.iconName, 'refresh');

    const completed = getStatusBadgeConfig('COMPLETED');
    assert.equal(completed.label, 'Đã hoàn tất');
    assert.equal(completed.iconName, 'check');

    const rejected = getStatusBadgeConfig('REJECTED');
    assert.equal(rejected.label, 'Bị từ chối');
    assert.equal(rejected.iconName, 'x');

    const failed = getStatusBadgeConfig('FAILED');
    assert.equal(failed.label, 'Lỗi chuyển tiền');
    assert.equal(failed.iconName, 'alert');
  });

  // 6. Zero Fake Data: buildAdminWithdrawalRows joins raw withdrawals with live users
  it('6. Joins raw backend withdrawals with live users data with ZERO fake data', () => {
    const rawWithdrawals: WithdrawalItem[] = [
      {
        id: 1,
        walletId: 10,
        bankName: 'Vietcombank',
        accountNumber: '123456789012',
        accountHolderName: 'NGUYEN HOANG MINH',
        amount: 500000,
        status: 'PENDING',
        requestedAt: '2026-10-24T14:32:21Z',
      },
      {
        id: 2,
        walletId: 20,
        bankName: 'MB Bank',
        accountNumber: '09876543210',
        accountHolderName: 'TRAN THI LAN ANH',
        amount: 1200000,
        status: 'PROCESSING',
        requestedAt: '2026-10-23T11:20:10Z',
      },
    ];

    const usersList: UserSummary[] = [
      {
        id: 10,
        fullName: 'Nguyễn Hoàng Minh',
        email: 'minh.nguyen@example.com',
        avatarUrl: 'https://avatar.test/minh.jpg',
      },
      {
        id: 20,
        fullName: 'Trần Thị Lan Anh',
        email: 'lananh.tran@example.com',
      },
    ];

    const rows = buildAdminWithdrawalRows(rawWithdrawals, usersList);
    assert.equal(rows.length, 2);

    // Row 1
    assert.equal(rows[0].id, 1);
    assert.equal(rows[0].userName, 'Nguyễn Hoàng Minh');
    assert.equal(rows[0].userEmail, 'minh.nguyen@example.com');
    assert.equal(rows[0].userAvatarUrl, 'https://avatar.test/minh.jpg');
    assert.equal(rows[0].formattedAmount, '500.000 đ');
    assert.equal(rows[0].formattedAccountNumber, '1234 5678 9012');
    assert.equal(rows[0].statusConfig.label, 'Chờ xét duyệt');

    // Row 2
    assert.equal(rows[1].id, 2);
    assert.equal(rows[1].userName, 'Trần Thị Lan Anh');
    assert.equal(rows[1].userEmail, 'lananh.tran@example.com');
    assert.equal(rows[1].userInitials, 'TA');
    assert.equal(rows[1].statusConfig.label, 'Đang xử lý');
  });

  // 7. Live KPIs calculation strictly from real data
  it('7. Calculates live financial KPIs strictly from real backend records', () => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const mockWithdrawals: WithdrawalItem[] = [
      { id: 1, walletId: 1, bankName: 'VCB', accountNumber: '111', accountHolderName: 'A', amount: 500000, status: 'PENDING', requestedAt: recentDate },
      { id: 2, walletId: 2, bankName: 'TCB', accountNumber: '222', accountHolderName: 'B', amount: 300000, status: 'PENDING', requestedAt: recentDate },
      { id: 3, walletId: 3, bankName: 'MB', accountNumber: '333', accountHolderName: 'C', amount: 700000, status: 'PROCESSING', requestedAt: recentDate },
      { id: 4, walletId: 4, bankName: 'BIDV', accountNumber: '444', accountHolderName: 'D', amount: 1500000, status: 'COMPLETED', requestedAt: recentDate },
      { id: 5, walletId: 5, bankName: 'ACB', accountNumber: '555', accountHolderName: 'E', amount: 200000, status: 'REJECTED', requestedAt: recentDate },
      { id: 6, walletId: 6, bankName: 'VPB', accountNumber: '666', accountHolderName: 'F', amount: 100000, status: 'FAILED', requestedAt: recentDate },
    ];

    const kpis = calculateWithdrawalKPIs(mockWithdrawals, 6);
    assert.equal(kpis.totalCount, 6);
    assert.equal(kpis.pendingCount, 2);
    assert.equal(kpis.processingCount, 1);
    assert.equal(kpis.completedCount, 1);
    assert.equal(kpis.rejectedCount, 2); // REJECTED + FAILED
    assert.equal(kpis.totalAmountVND, 3300000);
  });

  // 8. Empty State safety
  it('8. Safely handles empty withdrawal records array returning zeros (Zero Fake Data)', () => {
    const kpis = calculateWithdrawalKPIs([]);
    assert.equal(kpis.totalCount, 0);
    assert.equal(kpis.pendingCount, 0);
    assert.equal(kpis.completedCount, 0);
    assert.equal(kpis.rejectedCount, 0);
    assert.equal(kpis.processingCount, 0);
    assert.equal(kpis.totalAmountVND, 0);

    const rows = buildAdminWithdrawalRows([]);
    assert.deepEqual(rows, []);
  });

  // 9. Filtering rows
  it('9. Filters rows by search query, status tab, bank name, and date range', () => {
    const now = new Date();
    const rows = buildAdminWithdrawalRows([
      { id: 101, walletId: 1, bankName: 'Vietcombank', accountNumber: '12345678', accountHolderName: 'NGUYEN HOANG MINH', amount: 500000, status: 'PENDING', requestedAt: now.toISOString() },
      { id: 102, walletId: 2, bankName: 'Techcombank', accountNumber: '87654321', accountHolderName: 'TRAN THI LAN ANH', amount: 1200000, status: 'COMPLETED', requestedAt: now.toISOString() },
      { id: 103, walletId: 3, bankName: 'MB Bank', accountNumber: '99998888', accountHolderName: 'LE QUOC HUY', amount: 350000, status: 'REJECTED', requestedAt: now.toISOString() },
    ]);

    // Search by name
    const searchByName = filterAdminWithdrawalRows(rows, { searchQuery: 'Hoàng Minh' });
    assert.equal(searchByName.length, 1);
    assert.equal(searchByName[0].id, 101);

    // Search by account number
    const searchByAcc = filterAdminWithdrawalRows(rows, { searchQuery: '87654321' });
    assert.equal(searchByAcc.length, 1);
    assert.equal(searchByAcc[0].id, 102);

    // Search by ID
    const searchById = filterAdminWithdrawalRows(rows, { searchQuery: '103' });
    assert.equal(searchById.length, 1);
    assert.equal(searchById[0].id, 103);

    // Status filter
    const pendingOnly = filterAdminWithdrawalRows(rows, { status: 'PENDING' });
    assert.equal(pendingOnly.length, 1);
    assert.equal(pendingOnly[0].status, 'PENDING');

    // Bank filter
    const vcbOnly = filterAdminWithdrawalRows(rows, { bankName: 'vietcombank' });
    assert.equal(vcbOnly.length, 1);
    assert.equal(vcbOnly[0].bankName, 'Vietcombank');
  });

  // 10. Date range calculation
  it('10. Calculates date range bounds with presets and custom dates', () => {
    const range7d = calculateDateRangeBounds('7d');
    assert.ok(range7d.startMs && range7d.endMs);
    assert.ok(range7d.endMs - range7d.startMs >= 6 * 24 * 60 * 60 * 1000);

    const custom = calculateDateRangeBounds('custom', '2026-10-01', '2026-10-15');
    assert.ok(custom.startMs && custom.endMs);
    assert.ok(custom.startMs < custom.endMs);

    const all = calculateDateRangeBounds('all');
    assert.equal(all.startMs, undefined);
    assert.equal(all.endMs, undefined);
  });

  // 11. CSV Export
  it('11. Generates valid UTF-8 BOM CSV export string for Microsoft Excel compatibility', () => {
    const rows = buildAdminWithdrawalRows([
      {
        id: 1,
        walletId: 10,
        bankName: 'Vietcombank',
        accountNumber: '123456789012',
        accountHolderName: 'NGUYEN HOANG MINH',
        amount: 500000,
        status: 'PENDING',
        requestedAt: '2026-10-24T14:32:21Z',
      },
    ]);

    const csv = exportWithdrawalsToCSV(rows);
    assert.ok(csv.startsWith('\uFEFF')); // UTF-8 BOM
    assert.ok(csv.includes('Mã yêu cầu'));
    assert.ok(csv.includes('Ngân hàng thụ hưởng'));
    assert.ok(csv.includes('Vietcombank'));
    assert.ok(csv.includes('500000'));
  });

  // 12. Reason validation
  it('12. Validates rejection and failure reasons properly', () => {
    assert.equal(validateRejectReason('').valid, false);
    assert.equal(validateRejectReason('abc').valid, false); // too short
    assert.equal(validateRejectReason('Thông tin số tài khoản không trùng khớp KYC').valid, true);
  });

  // 13. Break-UI Stress-Test
  it('13. Break-UI Stress-Test: Gracefully handles extreme amounts, unbroken strings, and empty data', () => {
    const extremeItem: WithdrawalItem = {
      id: 999999,
      walletId: 888888,
      bankName: 'A'.repeat(100),
      accountNumber: '12345678901234567890',
      accountHolderName: 'EXTREMELY_LONG_UNBROKEN_CREATOR_NAME_FOR_TESTING_OVERFLOW',
      amount: 999999999999,
      status: 'UNKNOWN_STATUS',
      requestedAt: '2026-10-24T14:32:21Z',
    };

    const rows = buildAdminWithdrawalRows([extremeItem]);
    assert.equal(rows.length, 1);
    assert.ok(rows[0].formattedAmount.includes('999.999.999.999 đ'));
    assert.ok(rows[0].formattedAccountNumber.length > 0);
    assert.equal(rows[0].statusConfig.label, 'UNKNOWN_STATUS');

    const kpis = calculateWithdrawalKPIs([extremeItem]);
    assert.equal(kpis.totalCount, 1);
    assert.equal(kpis.totalAmountVND, 999999999999);
  });
});
