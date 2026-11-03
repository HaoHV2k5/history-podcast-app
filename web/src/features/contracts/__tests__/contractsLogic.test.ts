import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeContractStatus,
  getContractStatusBadgeConfig,
  extractInitials,
  formatContractCode,
  splitDateTime,
  buildAdminContractRow,
  calculateContractKPIs,
  normalizeVietnamese,
  filterAdminContractRows,
  exportContractsToCSV,
  generateMockupSampleContracts,
  type AdminContractRow,
} from '../contractsLogic.ts';
import type { ContractItem } from '../../../types/contract.ts';

describe('Admin Recording Contracts - contractsLogic Test Suite', () => {
  it('1. Normalizes various contract status strings accurately', () => {
    assert.strictEqual(normalizeContractStatus('ACTIVE'), 'ACTIVE');
    assert.strictEqual(normalizeContractStatus('in_progress'), 'ACTIVE');
    assert.strictEqual(normalizeContractStatus('DANG_THUC_HIEN'), 'ACTIVE');
    assert.strictEqual(normalizeContractStatus('COMPLETED'), 'COMPLETED');
    assert.strictEqual(normalizeContractStatus('da_hoan_thanh'), 'COMPLETED');
    assert.strictEqual(normalizeContractStatus('RELEASED'), 'COMPLETED');
    assert.strictEqual(normalizeContractStatus('PENDING'), 'PENDING');
    assert.strictEqual(normalizeContractStatus('WAITING'), 'PENDING');
    assert.strictEqual(normalizeContractStatus('CANCELLED'), 'CANCELLED');
    assert.strictEqual(normalizeContractStatus('REJECTED'), 'CANCELLED');
    assert.strictEqual(normalizeContractStatus('DISPUTED'), 'DISPUTED');
    assert.strictEqual(normalizeContractStatus(null), 'PENDING');
    assert.strictEqual(normalizeContractStatus(undefined), 'PENDING');
  });

  it('2. Maps contract statuses to Vietnamese labels and dot colors', () => {
    const active = getContractStatusBadgeConfig('ACTIVE');
    assert.strictEqual(active.label, 'Đang thực hiện');
    assert.strictEqual(active.bg, '#FEF3C7');
    assert.strictEqual(active.dot, 'bg-amber-500');

    const completed = getContractStatusBadgeConfig('COMPLETED');
    assert.strictEqual(completed.label, 'Đã hoàn thành');
    assert.strictEqual(completed.bg, '#ECFDF5');
    assert.strictEqual(completed.dot, 'bg-emerald-500');

    const pending = getContractStatusBadgeConfig('PENDING');
    assert.strictEqual(pending.label, 'Chờ ký');
    assert.strictEqual(pending.bg, '#EFF6FF');
    assert.strictEqual(pending.dot, 'bg-blue-500');

    const cancelled = getContractStatusBadgeConfig('CANCELLED');
    assert.strictEqual(cancelled.label, 'Đã hủy');
    assert.strictEqual(cancelled.bg, '#FEF2F2');
    assert.strictEqual(cancelled.dot, 'bg-rose-500');
  });

  it('3. Extracts 2-letter uppercase initials for avatar badges', () => {
    assert.strictEqual(extractInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.strictEqual(extractInitials('Trần Thị Lan Anh'), 'TA');
    assert.strictEqual(extractInitials('Lê'), 'LÊ');
    assert.strictEqual(extractInitials(''), 'SK');
    assert.strictEqual(extractInitials(null), 'SK');
    assert.strictEqual(extractInitials(undefined), 'SK');
  });

  it('4. Formats contract code with HD prefix and 5 digits padding', () => {
    assert.strictEqual(formatContractCode(128), 'HD00128');
    assert.strictEqual(formatContractCode(7), 'HD00007');
    assert.strictEqual(formatContractCode('125'), 'HD00125');
    assert.strictEqual(formatContractCode('HD00128'), 'HD00128');
  });

  it('5. Splits ISO date string into DD/MM/YYYY date and HH:mm:ss time', () => {
    const iso = '2026-10-24T14:32:21.000Z';
    const { dateStr, timeStr } = splitDateTime(iso);
    assert.ok(dateStr.includes('/'));
    assert.ok(timeStr.includes(':'));

    const empty = splitDateTime(null);
    assert.strictEqual(empty.dateStr, '—');
    assert.strictEqual(empty.timeStr, '—');
  });

  it('6. Builds AdminContractRow from raw ContractItem with fallbacks', () => {
    const raw: ContractItem = {
      id: 128,
      title: 'Đại Thắng Bạch Đằng Năm 1288',
      channelName: 'Dai Viet Su Ky Podcast',
      freelancerFullName: 'Nguyễn Hoàng Minh',
      requesterEmail: 'minh.nguyen@example.com',
      creatorFullName: 'Sử Ký Studio',
      totalAmount: 2000000,
      status: 'ACTIVE',
      createdAt: '2026-10-24T14:32:21.000Z',
    };

    const row = buildAdminContractRow(raw);
    assert.strictEqual(row.id, 128);
    assert.strictEqual(row.code, 'HD00128');
    assert.strictEqual(row.title, 'Đại Thắng Bạch Đằng Năm 1288');
    assert.strictEqual(row.narratorName, 'Nguyễn Hoàng Minh');
    assert.strictEqual(row.narratorInitials, 'NM');
    assert.strictEqual(row.status, 'ACTIVE');
    assert.strictEqual(row.statusLabel, 'Đang thực hiện');
    assert.strictEqual(row.totalAmount, 2000000);
    assert.strictEqual(row.platformFee, 100000); // 5% of 2M
    assert.strictEqual(row.netAmount, 1900000);
  });

  it('7. Calculates contract KPIs strictly from contract rows', () => {
    const sampleRows: AdminContractRow[] = [
      {
        id: 1,
        code: 'HD00001',
        title: 'Tác phẩm 1',
        channelOrSeries: 'Kênh 1',
        narratorName: 'A',
        narratorEmail: 'a@ex.com',
        narratorInitials: 'A',
        creatorName: 'Creator',
        creatorEmail: 'c@ex.com',
        signedDate: new Date().toISOString(),
        dateStr: '01/01/2026',
        timeStr: '10:00:00',
        totalAmount: 1000000,
        totalAmountFormatted: '1,000,000 đ',
        platformFee: 50000,
        netAmount: 950000,
        status: 'ACTIVE',
        statusLabel: 'Đang thực hiện',
        statusConfig: getContractStatusBadgeConfig('ACTIVE'),
        milestonesCount: 2,
        completedMilestonesCount: 1,
        rawContract: { id: 1, status: 'ACTIVE', createdAt: new Date().toISOString() },
      },
      {
        id: 2,
        code: 'HD00002',
        title: 'Tác phẩm 2',
        channelOrSeries: 'Kênh 2',
        narratorName: 'B',
        narratorEmail: 'b@ex.com',
        narratorInitials: 'B',
        creatorName: 'Creator',
        creatorEmail: 'c@ex.com',
        signedDate: new Date().toISOString(),
        dateStr: '01/01/2026',
        timeStr: '10:00:00',
        totalAmount: 2000000,
        totalAmountFormatted: '2,000,000 đ',
        platformFee: 100000,
        netAmount: 1900000,
        status: 'COMPLETED',
        statusLabel: 'Đã hoàn thành',
        statusConfig: getContractStatusBadgeConfig('COMPLETED'),
        milestonesCount: 2,
        completedMilestonesCount: 2,
        rawContract: { id: 2, status: 'COMPLETED', createdAt: new Date().toISOString() },
      },
      {
        id: 3,
        code: 'HD00003',
        title: 'Tác phẩm 3',
        channelOrSeries: 'Kênh 3',
        narratorName: 'C',
        narratorEmail: 'c@ex.com',
        narratorInitials: 'C',
        creatorName: 'Creator',
        creatorEmail: 'c@ex.com',
        signedDate: new Date().toISOString(),
        dateStr: '01/01/2026',
        timeStr: '10:00:00',
        totalAmount: 500000,
        totalAmountFormatted: '500,000 đ',
        platformFee: 25000,
        netAmount: 475000,
        status: 'CANCELLED',
        statusLabel: 'Đã hủy',
        statusConfig: getContractStatusBadgeConfig('CANCELLED'),
        milestonesCount: 1,
        completedMilestonesCount: 0,
        rawContract: { id: 3, status: 'CANCELLED', createdAt: new Date().toISOString() },
      },
    ];

    const kpis = calculateContractKPIs(sampleRows);
    assert.strictEqual(kpis.totalCount, 3);
    assert.strictEqual(kpis.activeCount, 1);
    assert.strictEqual(kpis.completedCount, 1);
    assert.strictEqual(kpis.cancelledCount, 1);
    assert.strictEqual(kpis.newContractsCount, 3);
  });

  it('8. Safely handles empty contract rows returning zero KPIs (Zero Fake Data)', () => {
    const kpis = calculateContractKPIs([]);
    assert.strictEqual(kpis.totalCount, 0);
    assert.strictEqual(kpis.activeCount, 0);
    assert.strictEqual(kpis.completedCount, 0);
    assert.strictEqual(kpis.cancelledCount, 0);
    assert.strictEqual(kpis.totalTrend, 0);
    assert.strictEqual(kpis.activeTrend, 0);
    assert.strictEqual(kpis.completedTrend, 0);
    assert.strictEqual(kpis.cancelledTrend, 0);
  });

  it('9. Filters rows by keyword, statusTab, narrator and date range', () => {
    const all = generateMockupSampleContracts();
    assert.ok(all.length >= 8);

    // Filter by keyword "Bạch Đằng"
    const bd = filterAdminContractRows(all, { searchQuery: 'Bạch Đằng' });
    assert.ok(bd.length >= 2);
    bd.forEach((r) => {
      assert.ok(
        normalizeVietnamese(r.title).includes('bach dang') ||
        normalizeVietnamese(r.code).includes('bach dang')
      );
    });

    // Filter by status tab ACTIVE
    const active = filterAdminContractRows(all, { statusTab: 'ACTIVE' });
    active.forEach((r) => {
      assert.strictEqual(r.status, 'ACTIVE');
    });

    // Filter by narrator name
    const minh = filterAdminContractRows(all, { narratorFilter: 'Nguyễn Hoàng Minh' });
    minh.forEach((r) => {
      assert.ok(r.narratorName.includes('Minh'));
    });
  });

  it('10. Generates valid UTF-8 BOM CSV export string for Microsoft Excel', () => {
    const all = generateMockupSampleContracts();
    const csv = exportContractsToCSV(all.slice(0, 3));
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Mã hợp đồng'));
    assert.ok(csv.includes('Tác phẩm'));
    assert.ok(csv.includes('HD00128'));
  });

  it('11. Generates dynamic relative timestamps adhering to AGENTS.md rule #6', () => {
    const samples = generateMockupSampleContracts();
    assert.strictEqual(samples.length, 128);

    const now = Date.now();
    for (const sample of samples) {
      const timeMs = new Date(sample.signedDate).getTime();
      assert.ok(!isNaN(timeMs));
      // All dates must be in the past relative to now, not fixed hardcoded strings
      assert.ok(timeMs <= now);
      assert.ok(timeMs > now - 100 * 24 * 60 * 60 * 1000);
    }
  });

  it('12. Break-UI Stress-Test: Gracefully sanitizes extreme amounts, unbroken strings, and empty data', () => {
    const extremeItem: ContractItem = {
      id: 999999999,
      title: 'A'.repeat(500),
      channelName: 'B'.repeat(300),
      freelancerFullName: 'C'.repeat(200),
      requesterEmail: 'unbreakable.email.' + 'x'.repeat(200) + '@domain.superlongtld',
      creatorFullName: 'SuperCreator',
      totalAmount: 999999999999999,
      status: 'UNKNOWN_STATUS_VALUE',
      createdAt: 'invalid-date-string',
    };

    const row = buildAdminContractRow(extremeItem);
    assert.strictEqual(row.id, 999999999);
    assert.strictEqual(row.status, 'PENDING');
    assert.strictEqual(row.dateStr, '—');
    assert.strictEqual(row.timeStr, '—');
    assert.ok(row.totalAmountFormatted.length > 0);

    const filtered = filterAdminContractRows([row], { searchQuery: 'A'.repeat(10) });
    assert.strictEqual(filtered.length, 1);

    const csv = exportContractsToCSV([row]);
    assert.ok(csv.includes('999999999'));
  });
});
