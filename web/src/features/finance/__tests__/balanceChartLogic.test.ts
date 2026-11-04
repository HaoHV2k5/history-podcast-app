import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCompactVND,
  buildBalanceChartData,
} from '../balanceChartLogic.ts';
import type { WalletTransactionItem } from '../../../types/transaction.ts';

describe('Wallet Balance Chart Logic Test Suite', () => {
  it('1. Formats compact VND amounts correctly', () => {
    assert.equal(formatCompactVND(50_000), '50k đ');
    assert.equal(formatCompactVND(500_000), '500k đ');
    assert.equal(formatCompactVND(1_500_000), '1,5M đ');
    assert.equal(formatCompactVND(500), '500 đ');
    assert.equal(formatCompactVND(0), '0 đ');
  });

  it('2. Safely handles empty transactions array', () => {
    const data = buildBalanceChartData([]);
    assert.equal(data.points.length, 0);
    assert.equal(data.totalInflow, 0);
    assert.equal(data.totalOutflow, 0);
    assert.equal(data.netChange, 0);
    assert.equal(data.transactionCount, 0);
    assert.equal(data.svgLinePath, '');
    assert.equal(data.svgAreaPath, '');
  });

  it('3. Accurately calculates chronological running balance and inflow/outflow', () => {
    const mockTx: WalletTransactionItem[] = [
      {
        id: 1,
        walletId: 10,
        amount: 200_000,
        type: 'TOPUP',
        status: 'SUCCESS',
        description: 'Nạp tiền ví',
        createdAt: '2026-11-01T08:00:00Z',
      },
      {
        id: 2,
        walletId: 10,
        amount: -50_000,
        type: 'WITHDRAW',
        status: 'SUCCESS',
        description: 'Rút tiền',
        createdAt: '2026-11-02T09:00:00Z',
      },
      {
        id: 3,
        walletId: 10,
        amount: 100_000,
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        description: 'Doanh thu Hội viên',
        createdAt: '2026-11-03T10:00:00Z',
      },
    ];

    const data = buildBalanceChartData(mockTx);
    assert.equal(data.transactionCount, 3);
    assert.equal(data.totalInflow, 300_000);
    assert.equal(data.totalOutflow, 50_000);
    assert.equal(data.netChange, 250_000);

    // Verify chronological order and running balances
    assert.equal(data.points[0].id, 1);
    assert.equal(data.points[0].cumulativeBalance, 200_000);
    assert.equal(data.points[1].id, 2);
    assert.equal(data.points[1].cumulativeBalance, 150_000);
    assert.equal(data.points[2].id, 3);
    assert.equal(data.points[2].cumulativeBalance, 250_000);

    // Verify SVG paths are non-empty
    assert.ok(data.svgLinePath.startsWith('M'));
    assert.ok(data.svgAreaPath.endsWith('Z'));
    assert.ok(data.yTicks.length > 0);
  });

  it('4. Handles unsorted transaction input dates gracefully', () => {
    const unsortedTx: WalletTransactionItem[] = [
      {
        id: 3,
        walletId: 10,
        amount: 100_000,
        type: 'TOPUP',
        status: 'SUCCESS',
        createdAt: '2026-11-03T10:00:00Z',
      },
      {
        id: 1,
        walletId: 10,
        amount: 50_000,
        type: 'TOPUP',
        status: 'SUCCESS',
        createdAt: '2026-11-01T08:00:00Z',
      },
    ];

    const data = buildBalanceChartData(unsortedTx);
    assert.equal(data.points[0].id, 1);
    assert.equal(data.points[1].id, 3);
  });

  it('5. Generates valid SVG single-point line and area path for 1 transaction', () => {
    const singleTx: WalletTransactionItem[] = [
      {
        id: 1,
        walletId: 10,
        amount: 100_000,
        type: 'TOPUP',
        status: 'SUCCESS',
        createdAt: '2026-11-01T08:00:00Z',
      },
    ];

    const data = buildBalanceChartData(singleTx);
    assert.equal(data.points.length, 1);
    assert.ok(data.svgLinePath.startsWith('M'));
    assert.ok(data.svgAreaPath.endsWith('Z'));
  });
});
