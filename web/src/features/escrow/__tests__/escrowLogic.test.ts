import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEscrowStatus,
  getEscrowStatusConfig,
  formatEscrowCode,
  formatContractCode,
  extractInitials,
  splitDateTime,
  formatCurrencyVND,
  mapBackendItemToEscrowRow,
  calculateEscrowKpis,
  filterEscrowRows,
  generateEscrowCsv,
  getMockupEscrowSampleData,
  type AdminEscrowRow,
} from '../escrowLogic.ts';

describe('Admin Escrow - escrowLogic Test Suite', () => {
  test('1. Normalizes various escrow status strings accurately', () => {
    assert.equal(normalizeEscrowStatus('HELD'), 'HELD');
    assert.equal(normalizeEscrowStatus('held'), 'HELD');
    assert.equal(normalizeEscrowStatus('RELEASED'), 'RELEASED');
    assert.equal(normalizeEscrowStatus('approved'), 'RELEASED');
    assert.equal(normalizeEscrowStatus('COMPLETED'), 'RELEASED');
    assert.equal(normalizeEscrowStatus('REFUNDED'), 'REFUNDED');
    assert.equal(normalizeEscrowStatus('returned'), 'REFUNDED');
    assert.equal(normalizeEscrowStatus('FROZEN'), 'FROZEN');
    assert.equal(normalizeEscrowStatus('disputed'), 'FROZEN');
    assert.equal(normalizeEscrowStatus('PROCESSING'), 'PROCESSING');
    assert.equal(normalizeEscrowStatus('pending'), 'PROCESSING');
    assert.equal(normalizeEscrowStatus('CANCELLED'), 'CANCELLED');
    assert.equal(normalizeEscrowStatus('UNFUNDED'), 'UNFUNDED');
    assert.equal(normalizeEscrowStatus(null), 'HELD');
    assert.equal(normalizeEscrowStatus(''), 'HELD');
  });

  test('2. Maps escrow statuses to Vietnamese labels and dot colors', () => {
    const held = getEscrowStatusConfig('HELD');
    assert.equal(held.label, 'Đang giữ (HELD)');
    assert.equal(held.dotColor, 'bg-blue-500');

    const released = getEscrowStatusConfig('RELEASED');
    assert.equal(released.label, 'Đã giải ngân');
    assert.equal(released.dotColor, 'bg-emerald-500');

    const frozen = getEscrowStatusConfig('FROZEN');
    assert.equal(frozen.label, 'Đóng băng (FROZEN)');
    assert.equal(frozen.dotColor, 'bg-sky-500');

    const refunded = getEscrowStatusConfig('REFUNDED');
    assert.equal(refunded.label, 'Đã hoàn (REFUNDED)');
    assert.equal(refunded.dotColor, 'bg-teal-500');

    const processing = getEscrowStatusConfig('PROCESSING');
    assert.equal(processing.label, 'Đang xử lý');
    assert.equal(processing.dotColor, 'bg-amber-500');

    const cancelled = getEscrowStatusConfig('CANCELLED');
    assert.equal(cancelled.label, 'Đã hủy');
    assert.equal(cancelled.dotColor, 'bg-rose-500');
  });

  test('3. Formats escrow codes (ESC00128) and contract codes (HD00128)', () => {
    assert.equal(formatEscrowCode(128), 'ESC00128');
    assert.equal(formatEscrowCode(1), 'ESC00001');
    assert.equal(formatEscrowCode('ESC00128'), 'ESC00128');
    assert.equal(formatEscrowCode('12345'), 'ESC12345');

    assert.equal(formatContractCode(128), 'HD00128');
    assert.equal(formatContractCode(7), 'HD00007');
    assert.equal(formatContractCode('HD00128'), 'HD00128');
  });

  test('4. Extracts 2-letter uppercase initials for avatar badges', () => {
    assert.equal(extractInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.equal(extractInitials('Đỗ Quang Vinh'), 'ĐV');
    assert.equal(extractInitials('Lê Quốc Huy'), 'LH');
    assert.equal(extractInitials('Sử Ký'), 'SK');
    assert.equal(extractInitials('Admin'), 'AD');
    assert.equal(extractInitials(''), 'SK');
    assert.equal(extractInitials(null), 'SK');
  });

  test('5. Splits ISO date string into DD/MM/YYYY date and HH:mm:ss time', () => {
    const iso = '2026-10-24T14:32:21.000Z';
    const res = splitDateTime(iso);
    assert.ok(res.date.includes('2026'));
    assert.ok(res.time.includes(':'));

    const invalid = splitDateTime('invalid-date');
    assert.equal(invalid.date, '—');
    assert.equal(invalid.time, '—');

    const empty = splitDateTime(null);
    assert.equal(empty.date, '—');
  });

  test('6. Formats VND currency cleanly', () => {
    assert.equal(formatCurrencyVND(2000000), '2.000.000 đ');
    assert.equal(formatCurrencyVND(850000), '850.000 đ');
    assert.equal(formatCurrencyVND(0), '0 đ');
    assert.equal(formatCurrencyVND(NaN), '0 đ');
  });

  test('7. Maps backend AdminMilestoneRevenueItem to AdminEscrowRow', () => {
    const rawItem = {
      milestoneId: 128,
      milestoneOrderNo: 1,
      milestoneTitle: 'Chương 1',
      contractId: 128,
      contractTitle: 'Đại Thắng Bạch Đằng Năm 1288',
      serviceType: 'VOICE' as const,
      creatorId: 10,
      creatorName: 'Lê Quốc Huy',
      creatorEmail: 'huy.le@example.com',
      requesterId: 5,
      requesterName: 'Nguyễn Hoàng Minh',
      requesterEmail: 'minh.nguyen@example.com',
      freelancerId: 10,
      freelancerName: 'Trần Thị Lan Anh',
      freelancerEmail: 'lananh.tran@example.com',
      grossAmount: 2000000,
      feePercent: 5,
      platformFee: 100000,
      netAmount: 1900000,
      status: 'HELD' as const,
      fundedAt: '2026-10-24T14:32:21.000Z',
    };

    const row = mapBackendItemToEscrowRow(rawItem, 0);
    assert.equal(row.id, 'ESC00128');
    assert.equal(row.contractCode, 'HD00128');
    assert.equal(row.workTitle, 'Đại Thắng Bạch Đằng Năm 1288');
    assert.equal(row.payerName, 'Nguyễn Hoàng Minh');
    assert.equal(row.payeeName, 'Lê Quốc Huy');
    assert.equal(row.grossAmount, 2000000);
    assert.equal(row.platformFee, 100000);
    assert.equal(row.netAmount, 1900000);
    assert.equal(row.status, 'HELD');
  });

  test('8. Calculates escrow KPIs strictly from escrow rows (Zero Fake Data)', () => {
    const sample = getMockupEscrowSampleData();
    const kpis = calculateEscrowKpis(sample);

    assert.equal(kpis.totalCount, 8);
    assert.equal(kpis.totalVolume, 2000000 + 1500000 + 1200000 + 850000 + 1300000 + 900000 + 1800000 + 1000000);
    assert.equal(kpis.releasedCount, 3);
    assert.equal(kpis.heldCount, 2); // HELD and PROCESSING
    assert.equal(kpis.frozenCount, 1);
    assert.equal(kpis.refundedCount, 1);
    assert.equal(kpis.volumeTrend, null, 'Trend must be null when no baseline delta exists (Zero Fake Data)');
  });

  test('9. Safely handles empty escrow rows returning zero KPIs (Zero Fake Data)', () => {
    const kpis = calculateEscrowKpis([]);
    assert.equal(kpis.totalCount, 0);
    assert.equal(kpis.totalVolume, 0);
    assert.equal(kpis.releasedCount, 0);
    assert.equal(kpis.heldCount, 0);
    assert.equal(kpis.frozenCount, 0);
    assert.equal(kpis.refundedCount, 0);
    assert.equal(kpis.volumeTrend, null);
    assert.equal(kpis.countTrend, null);
  });

  test('10. Filters rows by keyword, statusTab, paymentMethod, and dateRange', () => {
    const sample = getMockupEscrowSampleData();

    // Keyword filter
    const keywordRes = filterEscrowRows(sample, {
      searchQuery: 'Bạch Đằng',
      statusTab: 'ALL',
      statusSelect: 'ALL',
      paymentMethod: 'ALL',
      datePreset: 'ALL',
    });
    assert.equal(keywordRes.length, 2);

    // Status Tab filter
    const heldRes = filterEscrowRows(sample, {
      searchQuery: '',
      statusTab: 'HELD',
      statusSelect: 'ALL',
      paymentMethod: 'ALL',
      datePreset: 'ALL',
    });
    assert.equal(heldRes.length, 1);

    // Released filter
    const releasedRes = filterEscrowRows(sample, {
      searchQuery: '',
      statusTab: 'RELEASED',
      statusSelect: 'ALL',
      paymentMethod: 'ALL',
      datePreset: 'ALL',
    });
    assert.equal(releasedRes.length, 3);

    // Payment method filter
    const vnpayRes = filterEscrowRows(sample, {
      searchQuery: '',
      statusTab: 'ALL',
      statusSelect: 'ALL',
      paymentMethod: 'VNPay',
      datePreset: 'ALL',
    });
    assert.equal(vnpayRes.length, 2);
  });

  test('11. Generates valid UTF-8 BOM CSV export string for Microsoft Excel', () => {
    const sample = getMockupEscrowSampleData().slice(0, 2);
    const csv = generateEscrowCsv(sample);

    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('ESC00128'));
    assert.ok(csv.includes('HD00128'));
    assert.ok(csv.includes('Đại Thắng Bạch Đằng Năm 1288'));
    assert.ok(csv.includes('Nguyễn Hoàng Minh'));
    assert.ok(csv.includes('2000000'));
  });

  test('12. Generates dynamic relative timestamps adhering to AGENTS.md rule #6', () => {
    const sample = getMockupEscrowSampleData();
    const now = Date.now();

    // Verify all records have valid timestamps relative to current time
    for (const r of sample) {
      const t = new Date(r.createdAt).getTime();
      assert.ok(t <= now, 'Timestamp must be in the past');
      assert.ok(now - t < 45 * 86400000, 'Timestamp must be within the last 45 days');
    }

    // Verify that date filter 30D includes items within 30 days
    const filtered30d = filterEscrowRows(sample, {
      searchQuery: '',
      statusTab: 'ALL',
      statusSelect: 'ALL',
      paymentMethod: 'ALL',
      datePreset: '30D',
    });
    assert.ok(filtered30d.length >= 7, '30D filter should capture almost all recent sample items');
  });

  test('13. Break-UI Stress-Test: Gracefully handles extreme amounts, unbroken strings, and empty data', () => {
    const extremeRow: AdminEscrowRow = {
      id: 'ESC999999999',
      rawId: 999999999,
      contractId: 888888888,
      contractCode: 'HD888888888',
      milestoneId: 1,
      workTitle: 'SiêuTácPhẩm'.repeat(20), // Unbroken long string
      payerName: 'SuperLongPayerName'.repeat(10),
      payerEmail: 'payer.super.long.unbroken.domain.address@example.com',
      payerRole: 'REQUESTER',
      payeeName: 'SuperLongPayeeName'.repeat(10),
      payeeEmail: 'payee.super.long.unbroken.domain.address@example.com',
      payeeRole: 'NARRATOR',
      grossAmount: 999999999999, // 1 trillion VND
      feePercent: 5,
      platformFee: 49999999999,
      netAmount: 950000000000,
      status: 'HELD',
      paymentMethod: 'Ví Sử Ký',
      createdAt: new Date().toISOString(),
      date: '03/11/2026',
      time: '22:30:00',
    };

    const formattedVnd = formatCurrencyVND(extremeRow.grossAmount);
    assert.ok(formattedVnd.includes('999.999.999.999'));

    const kpis = calculateEscrowKpis([extremeRow]);
    assert.equal(kpis.totalCount, 1);
    assert.equal(kpis.totalVolume, 999999999999);

    const csv = generateEscrowCsv([extremeRow]);
    assert.ok(csv.includes('ESC999999999'));
    assert.ok(csv.includes('999999999999'));
  });
});
