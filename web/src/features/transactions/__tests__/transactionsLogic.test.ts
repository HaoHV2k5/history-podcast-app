import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatTxnType,
  formatTxnStatus,
  formatAmountDisplay,
  getAvatarInitials,
  splitDateTime,
  calculateDateRangeBounds,
  buildAdminTransactionRows,
  calculateTransactionsKPIs,
  filterAdminTransactionRows,
  exportTransactionsToCSV,
} from '../transactionsLogic.ts';
import type { WalletTransactionItem } from '../../../types/transaction.ts';
import type { UserResponse } from '../../../types/auth.ts';

describe('Admin Transactions - transactionsLogic Test Suite', () => {
  it('1. Maps transaction types to Vietnamese labels and visual tokens', () => {
    assert.strictEqual(formatTxnType('TOPUP').label, 'Nạp tiền');
    assert.strictEqual(formatTxnType('DEPOSIT').label, 'Nạp tiền');
    assert.strictEqual(formatTxnType('WITHDRAW').label, 'Rút tiền');
    assert.strictEqual(formatTxnType('ESCROW_RELEASE').label, 'Phân phối');
    assert.strictEqual(formatTxnType('DISTRIBUTION').label, 'Phân phối');
    assert.strictEqual(formatTxnType('ESCROW_HOLD').label, 'Ký quỹ');
    assert.strictEqual(formatTxnType('FUND_ESCROW').label, 'Ký quỹ');
    assert.strictEqual(formatTxnType('ESCROW').label, 'Ký quỹ');
    assert.strictEqual(formatTxnType('MEMBERSHIP').label, 'Hội viên');
    assert.strictEqual(formatTxnType('DONATION').label, 'Ủng hộ');
    assert.strictEqual(formatTxnType('REFUND').label, 'Hoàn tiền');
    assert.strictEqual(formatTxnType('CUSTOM_TYPE').label, 'CUSTOM_TYPE');
  });

  it('2. Maps transaction statuses to Vietnamese labels and dot colors', () => {
    assert.strictEqual(formatTxnStatus('SUCCESS').label, 'Thành công');
    assert.strictEqual(formatTxnStatus('SUCCESS').dotColor, 'bg-emerald-500');
    assert.strictEqual(formatTxnStatus('PENDING').label, 'Đang xử lý');
    assert.strictEqual(formatTxnStatus('PENDING').dotColor, 'bg-amber-500');
    assert.strictEqual(formatTxnStatus('FAILED').label, 'Thất bại');
    assert.strictEqual(formatTxnStatus('FAILED').dotColor, 'bg-rose-500');
    assert.strictEqual(formatTxnStatus('UNKNOWN').label, 'UNKNOWN');
  });

  it('3. Formats amount display with correct inflow (+) and outflow (-) signs', () => {
    // Deposit: Inflow (+)
    const topup = formatAmountDisplay(200000, 'TOPUP');
    assert.strictEqual(topup.sign, '+');
    assert.strictEqual(topup.isPositive, true);
    assert.ok(topup.formatted.includes('200.000'));

    // Withdraw: Outflow (-)
    const withdraw = formatAmountDisplay(50000, 'WITHDRAW');
    assert.strictEqual(withdraw.sign, '-');
    assert.strictEqual(withdraw.isPositive, false);
    assert.ok(withdraw.formatted.includes('50.000'));

    // Escrow Lock: Outflow (-)
    const lock = formatAmountDisplay(1500000, 'ESCROW_LOCK');
    assert.strictEqual(lock.sign, '-');
    assert.strictEqual(lock.isPositive, false);

    // Explicit negative amount: Outflow (-)
    const negative = formatAmountDisplay(-300000, 'OTHER');
    assert.strictEqual(negative.sign, '-');
    assert.strictEqual(negative.isPositive, false);
    assert.ok(negative.formatted.includes('300.000'));
  });

  it('4. Extracts 2-letter uppercase initials for avatar badges', () => {
    assert.strictEqual(getAvatarInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.strictEqual(getAvatarInitials('Trần Thị Lan Anh'), 'TA');
    assert.strictEqual(getAvatarInitials('Admin'), 'AD');
    assert.strictEqual(getAvatarInitials(''), 'SK');
    assert.strictEqual(getAvatarInitials(undefined), 'SK');
  });

  it('5. Splits ISO date string into DD/MM/YYYY date and HH:mm:ss time', () => {
    const res = splitDateTime('2026-10-24T14:32:21Z');
    assert.ok(res.dateStr.includes('2026') || res.dateStr.includes('24'));
    assert.ok(res.timeStr.includes(':'));

    const invalid = splitDateTime('invalid-date');
    assert.strictEqual(invalid.dateStr, '—');
    assert.strictEqual(invalid.timeStr, '—');
  });

  it('6. Calculates date range bounds with presets and custom dates', () => {
    const allBounds = calculateDateRangeBounds('all');
    assert.strictEqual(allBounds.start, null);
    assert.strictEqual(allBounds.end, null);

    const sevenDays = calculateDateRangeBounds('7d');
    assert.ok(sevenDays.start instanceof Date);
    assert.ok(sevenDays.end instanceof Date);
    assert.ok(sevenDays.end.getTime() > sevenDays.start.getTime());

    const custom = calculateDateRangeBounds('custom', '2026-10-01', '2026-10-15');
    assert.ok(custom.start instanceof Date);
    assert.ok(custom.end instanceof Date);
    assert.strictEqual(custom.start.getDate(), 1);
    assert.strictEqual(custom.end.getDate(), 15);
  });

  it('7. Joins raw live transactions with live users data without fake data', () => {
    const mockTx: WalletTransactionItem[] = [
      {
        id: 101,
        walletId: 1,
        type: 'TOPUP',
        amount: 200000,
        status: 'SUCCESS',
        description: 'Nạp tiền qua VNPay',
        merchantTxnRef: 'VNP_123',
        createdAt: '2026-10-24T14:32:21Z',
      },
      {
        id: 102,
        walletId: 2,
        type: 'WITHDRAW',
        amount: 50000,
        status: 'PENDING',
        description: 'Rút tiền ngân hàng',
        createdAt: '2026-10-23T11:20:10Z',
      },
    ];

    const mockUsers: UserResponse[] = [
      {
        id: 1,
        fullName: 'Nguyễn Hoàng Minh',
        email: 'minh.nguyen@example.com',
        roleName: 'VIEWER',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        fullName: 'Trần Thị Lan Anh',
        email: 'lananh.tran@example.com',
        roleName: 'CREATOR',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    const rows = buildAdminTransactionRows(mockTx, mockUsers);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].id, 101);
    assert.strictEqual(rows[0].userName, 'Nguyễn Hoàng Minh');
    assert.strictEqual(rows[0].userEmail, 'minh.nguyen@example.com');
    assert.strictEqual(rows[0].typeLabel, 'Nạp tiền');
    assert.strictEqual(rows[0].sign, '+');

    assert.strictEqual(rows[1].id, 102);
    assert.strictEqual(rows[1].userName, 'Trần Thị Lan Anh');
    assert.strictEqual(rows[1].typeLabel, 'Rút tiền');
    assert.strictEqual(rows[1].sign, '-');
  });

  it('8. Calculates financial KPIs strictly from live transactions', () => {
    const txList: WalletTransactionItem[] = [
      { id: 1, walletId: 1, type: 'TOPUP', amount: 500000, status: 'SUCCESS', createdAt: '' },
      { id: 2, walletId: 1, type: 'TOPUP', amount: 300000, status: 'SUCCESS', createdAt: '' },
      { id: 3, walletId: 2, type: 'WITHDRAW', amount: 200000, status: 'SUCCESS', createdAt: '' },
      { id: 4, walletId: 3, type: 'ESCROW_RELEASE', amount: 150000, status: 'SUCCESS', createdAt: '' },
      { id: 5, walletId: 3, type: 'DONATION', amount: 50000, status: 'SUCCESS', createdAt: '' },
      { id: 6, walletId: 4, type: 'TOPUP', amount: 100000, status: 'FAILED', createdAt: '' }, // FAILED not counted in balance
    ];

    const kpis = calculateTransactionsKPIs(txList);
    assert.strictEqual(kpis.totalDeposits, 800000);
    assert.strictEqual(kpis.depositCount, 3);
    assert.strictEqual(kpis.totalWithdrawals, 200000);
    assert.strictEqual(kpis.withdrawalCount, 1);
    assert.strictEqual(kpis.totalRevenueDistributed, 200000); // 150000 + 50000
    assert.strictEqual(kpis.distributedCount, 2);
    assert.strictEqual(kpis.totalSystemBalance, 600000); // 800000 - 200000
  });

  it('9. Handles empty transactions array safely returning zeros (Empty State safety)', () => {
    const kpis = calculateTransactionsKPIs([]);
    assert.strictEqual(kpis.totalSystemBalance, 0);
    assert.strictEqual(kpis.totalDeposits, 0);
    assert.strictEqual(kpis.depositCount, 0);
    assert.strictEqual(kpis.totalWithdrawals, 0);
    assert.strictEqual(kpis.withdrawalCount, 0);
    assert.strictEqual(kpis.totalRevenueDistributed, 0);
    assert.strictEqual(kpis.distributedCount, 0);
  });

  it('10. Filters rows by search query, transaction type, status, and date range', () => {
    const rows = [
      {
        id: 1001,
        walletId: 1,
        type: 'TOPUP',
        typeLabel: 'Nạp tiền',
        typeColor: 'bg-emerald-500',
        amount: 200000,
        amountDisplay: '+ 200.000 ₫',
        isPositive: true,
        sign: '+' as const,
        balanceAfterDisplay: '—',
        description: 'Nạp tiền VNPay',
        merchantTxnRef: 'VNP_ABC',
        gatewayProvider: 'VNPAY',
        status: 'SUCCESS',
        statusLabel: 'Thành công',
        statusColor: 'bg-emerald-500',
        createdAt: '2026-10-24T10:00:00Z',
        formattedDate: '24/10/2026',
        formattedTime: '10:00:00',
        userName: 'Nguyễn Hoàng Minh',
        userEmail: 'minh.nguyen@example.com',
      },
      {
        id: 1002,
        walletId: 2,
        type: 'WITHDRAW',
        typeLabel: 'Rút tiền',
        typeColor: 'bg-rose-500',
        amount: 50000,
        amountDisplay: '- 50.000 ₫',
        isPositive: false,
        sign: '-' as const,
        balanceAfterDisplay: '—',
        description: 'Rút tiền Vietcombank',
        merchantTxnRef: 'VCB_XYZ',
        gatewayProvider: 'BANK',
        status: 'PENDING',
        statusLabel: 'Đang xử lý',
        statusColor: 'bg-amber-500',
        createdAt: '2026-10-20T10:00:00Z',
        formattedDate: '20/10/2026',
        formattedTime: '10:00:00',
        userName: 'Trần Thị Lan Anh',
        userEmail: 'lananh.tran@example.com',
      },
    ];

    // Search by name
    const searchName = filterAdminTransactionRows(rows, 'Minh', 'all', 'all', { start: null, end: null });
    assert.strictEqual(searchName.length, 1);
    assert.strictEqual(searchName[0].id, 1001);

    // Search by merchant ref
    const searchRef = filterAdminTransactionRows(rows, 'XYZ', 'all', 'all', { start: null, end: null });
    assert.strictEqual(searchRef.length, 1);
    assert.strictEqual(searchRef[0].id, 1002);

    // Filter by type: TOPUP
    const filterTopup = filterAdminTransactionRows(rows, '', 'TOPUP', 'all', { start: null, end: null });
    assert.strictEqual(filterTopup.length, 1);
    assert.strictEqual(filterTopup[0].id, 1001);

    // Filter by status: PENDING
    const filterPending = filterAdminTransactionRows(rows, '', 'all', 'PENDING', { start: null, end: null });
    assert.strictEqual(filterPending.length, 1);
    assert.strictEqual(filterPending[0].id, 1002);
  });

  it('11. Generates valid UTF-8 BOM CSV export string for Excel compatibility', () => {
    const rows = [
      {
        id: 99,
        walletId: 5,
        type: 'TOPUP',
        typeLabel: 'Nạp tiền',
        typeColor: 'bg-emerald-500',
        amount: 500000,
        amountDisplay: '+ 500.000 ₫',
        isPositive: true,
        sign: '+' as const,
        balanceAfterDisplay: '—',
        description: 'Nạp tiền ví "Demo"',
        merchantTxnRef: 'VNP_99',
        gatewayProvider: 'VNPAY',
        status: 'SUCCESS',
        statusLabel: 'Thành công',
        statusColor: 'bg-emerald-500',
        createdAt: '2026-10-24T10:00:00Z',
        formattedDate: '24/10/2026',
        formattedTime: '10:00:00',
        userName: 'Lê Quốc Huy',
        userEmail: 'quochuy.le@example.com',
      },
    ];

    const csv = exportTransactionsToCSV(rows);
    assert.ok(csv.startsWith('\uFEFF'), 'Must contain UTF-8 BOM');
    assert.ok(csv.includes('"Mã GD"'));
    assert.ok(csv.includes('"Lê Quốc Huy"'));
    assert.ok(csv.includes('"500000"'));
    assert.ok(csv.includes('""Demo""'), 'Must escape internal quotes');
  });

  it('12. Break-UI Stress-Test: Handles extreme amounts, unbroken strings, and empty data gracefully', () => {
    // Extreme 12-digit number (hundreds of billions VND)
    const extremeAmount = formatAmountDisplay(1284650000000, 'TOPUP');
    assert.ok(extremeAmount.formatted.length > 0);
    assert.strictEqual(extremeAmount.sign, '+');

    // 1000-character unbroken string in description
    const longDesc = 'A'.repeat(1000);
    const mockRow: WalletTransactionItem = {
      id: 999999,
      walletId: 888888,
      type: 'TOPUP',
      amount: 100000,
      status: 'SUCCESS',
      description: longDesc,
      createdAt: '2026-10-24T10:00:00Z',
    };

    const rows = buildAdminTransactionRows([mockRow]);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].description.length, 1000);

    // Empty list
    const emptyRows = buildAdminTransactionRows([]);
    assert.strictEqual(emptyRows.length, 0);

    // CSV with extreme numbers
    const csvExtreme = exportTransactionsToCSV(rows);
    assert.ok(csvExtreme.length > 1000);
  });
});
