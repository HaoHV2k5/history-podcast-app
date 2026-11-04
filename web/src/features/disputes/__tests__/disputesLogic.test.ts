import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDisputeId,
  formatContractCode,
  extractInitials,
  getAvatarBg,
  splitDateTime,
  inferDisputeType,
  inferDisputePriority,
  mapBackendItemToDisputeRow,
  calculateDisputeKpis,
  filterDisputeRows,
  generateDisputeCsv,
  getDisputeStatusConfig,
  getDisputePriorityConfig,
  copyToClipboard,
  type AdminDisputeRow,
} from '../disputesLogic.ts';
import type { DisputeItem } from '../../../types/dispute.ts';

describe('Admin Complaints & Disputes - disputesLogic Test Suite', () => {
  test('1. Formats dispute IDs with KN prefix and contract codes with HD prefix', () => {
    assert.equal(formatDisputeId(56), 'KN00056');
    assert.equal(formatDisputeId('56'), 'KN00056');
    assert.equal(formatDisputeId('KN00056'), 'KN00056');
    assert.equal(formatDisputeId(12345), 'KN12345');

    assert.equal(formatContractCode(128), 'HD00128');
    assert.equal(formatContractCode('128'), 'HD00128');
    assert.equal(formatContractCode('HD00128'), 'HD00128');
  });

  test('2. Extracts initials and background colors for avatars', () => {
    assert.equal(extractInitials('Nguyễn Hoàng Minh'), 'NM');
    assert.equal(extractInitials('Trần Thị Lan Anh'), 'TA');
    assert.equal(extractInitials('Admin'), 'AD');
    assert.equal(extractInitials(''), 'SK');

    const bg1 = getAvatarBg('Nguyễn Hoàng Minh');
    const bg2 = getAvatarBg('Nguyễn Hoàng Minh');
    assert.equal(bg1, bg2); // Stable hashing
    assert.ok(typeof bg1 === 'string' && bg1.includes('bg-'));
  });

  test('3. Splits ISO datetime string into DD/MM/YYYY date and HH:mm:ss time', () => {
    const iso = '2026-10-24T14:32:21.000Z';
    const res = splitDateTime(iso);
    assert.ok(res.date.includes('/2026'));
    assert.ok(res.time.includes(':'));

    const invalid = splitDateTime('invalid-date');
    assert.equal(invalid.date, '—');
    assert.equal(invalid.time, '—');
  });

  test('4. Correctly categorizes dispute type and priority from reason keywords', () => {
    assert.equal(inferDisputeType('Âm thanh bị rè, chất lượng thu âm kém'), 'Chất lượng thu âm');
    assert.equal(inferDisputeType('Yêu cầu hoàn tiền ký quỹ do quá hạn'), 'Yêu cầu hoàn tiền ký quỹ');
    assert.equal(inferDisputeType('Nội dung sai sự thật về lịch sử triều Trần'), 'Nội dung thuyết minh sai sự thật');
    assert.equal(inferDisputeType('Vi phạm bản quyền hình ảnh và giọng nói'), 'Vi phạm bản quyền nội dung');
    assert.equal(inferDisputeType('Đối tác không thanh toán sau khi nộp file'), 'Không thanh toán sau khi hoàn thành');
    assert.equal(inferDisputeType('Yêu cầu hủy hợp đồng do bận việc'), 'Yêu cầu hủy hợp đồng');
    assert.equal(inferDisputeType('Tranh chấp phân chia doanh thu podcast'), 'Tranh chấp phân chia doanh thu');
    assert.equal(inferDisputeType('Giọng đọc ngọng, sai ngữ điệu'), 'Khiếu nại về giọng đọc');

    assert.equal(inferDisputePriority('Chất lượng thu âm kém rè tiếng', 'OPEN'), 'HIGH');
    assert.equal(inferDisputePriority('Hủy hợp đồng do đổi kế hoạch', 'OPEN'), 'MEDIUM');
    assert.equal(inferDisputePriority('Vi phạm bản quyền hình ảnh', 'RESOLVED'), 'LOW');
    assert.equal(inferDisputePriority('Giọng đọc hơi trầm', 'RESOLVED'), 'LOW');
  });

  test('5. Maps backend DisputeItem to AdminDisputeRow with full fidelity', () => {
    const backendItem: DisputeItem = {
      id: 56,
      contractId: 128,
      contractTitle: 'Đại Thắng Bạch Đằng',
      milestoneId: 1,
      milestoneTitle: 'Giai đoạn 1',
      raisedByUserId: 101,
      raisedByUserFullName: 'Nguyễn Hoàng Minh',
      reason: 'Tranh chấp chất lượng thu âm: Âm thanh bị rè',
      evidence: 'https://example.com/audio.mp3',
      counterEvidence: 'https://example.com/counter.pdf',
      status: 'OPEN',
      result: undefined,
      createdAt: '2026-10-24T14:32:21.000Z',
    };

    const row = mapBackendItemToDisputeRow(backendItem, 0);
    assert.equal(row.id, 'KN00056');
    assert.equal(row.rawId, 56);
    assert.equal(row.contractCode, 'HD00128');
    assert.equal(row.workTitle, 'Đại Thắng Bạch Đằng');
    assert.equal(row.title, 'Tranh chấp chất lượng thu âm');
    assert.equal(row.summary, 'Âm thanh bị rè');
    assert.equal(row.senderName, 'Nguyễn Hoàng Minh');
    assert.equal(row.status, 'OPEN');
    assert.equal(row.priority, 'HIGH');
  });

  test('6. Computes dispute KPIs accurately and safely with Zero Fake Data', () => {
    const sampleRows = getMockupDisputeSampleData();
    const kpis = calculateDisputeKpis(sampleRows);

    assert.equal(kpis.totalCount, 8);
    assert.equal(kpis.openCount, 4);
    assert.equal(kpis.resolvedCount, 3);
    assert.equal(kpis.cancelledCount, 1);
    assert.equal(kpis.openCount + kpis.resolvedCount + kpis.cancelledCount, kpis.totalCount);

    // Empty array must return all zeros
    const emptyKpis = calculateDisputeKpis([]);
    assert.equal(emptyKpis.totalCount, 0);
    assert.equal(emptyKpis.openCount, 0);
    assert.equal(emptyKpis.resolvedCount, 0);
    assert.equal(emptyKpis.cancelledCount, 0);
    assert.equal(emptyKpis.trendTotal, 0);
  });

  function getMockupDisputeSampleData(): AdminDisputeRow[] {
    const now = Date.now();
    const getIso = (daysAgo: number) => new Date(now - daysAgo * 86400 * 1000).toISOString();
    return [
      {
        id: 'KN00056',
        rawId: 56,
        contractId: 128,
        contractCode: 'HD00128',
        workTitle: 'Đại Thắng Bạch Đằng',
        title: 'Tranh chấp chất lượng thu âm',
        summary: 'Âm thanh bị rè, không đúng yêu cầu kỹ thuật ban đầu',
        disputeType: 'Chất lượng thu âm',
        senderName: 'Nguyễn Hoàng Minh',
        senderRole: 'Người dùng',
        senderId: 101,
        status: 'OPEN',
        priority: 'HIGH',
        reason: 'Tranh chấp chất lượng thu âm',
        milestoneId: 1,
        milestoneTitle: 'Giai đoạn 1: Thu âm thô',
        createdAt: getIso(1),
        date: '03/11/2026',
        time: '14:32',
      },
      {
        id: 'KN00055',
        rawId: 55,
        contractId: 127,
        contractCode: 'HD00127',
        workTitle: 'Hào Khí Đông A',
        title: 'Trễ hạn bàn giao bản thu',
        summary: 'Quá hạn 5 ngày so với mốc thỏa thuận',
        disputeType: 'Trễ hạn',
        senderName: 'Trần Thị Lan Anh',
        senderRole: 'Người dùng',
        senderId: 102,
        status: 'OPEN',
        priority: 'MEDIUM',
        reason: 'Trễ hạn bàn giao bản thu',
        milestoneId: 2,
        milestoneTitle: 'Giai đoạn 2: Hậu kỳ',
        createdAt: getIso(2),
        date: '02/11/2026',
        time: '11:20',
      },
      {
        id: 'KN00054',
        rawId: 54,
        contractId: 126,
        contractCode: 'HD00126',
        workTitle: 'Chiếu Dời Đô',
        title: 'Yêu cầu hoàn tiền cọc',
        summary: 'Đơn phương hủy hợp đồng',
        disputeType: 'Hủy hợp đồng',
        senderName: 'Lê Văn Cường',
        senderRole: 'Người dùng',
        senderId: 103,
        status: 'RESOLVED',
        priority: 'HIGH',
        reason: 'Yêu cầu hoàn tiền cọc',
        result: 'REFUND_TO_REQUESTER',
        milestoneId: 1,
        milestoneTitle: 'Giai đoạn 1',
        createdAt: getIso(3),
        date: '01/11/2026',
        time: '09:18',
      },
      {
        id: 'KN00053',
        rawId: 53,
        contractId: 125,
        contractCode: 'HD00125',
        workTitle: 'Nam Quốc Sơn Hà',
        title: 'Vi phạm bản quyền nội dung',
        summary: 'Sử dụng nhạc chưa có bản quyền',
        disputeType: 'Bản quyền',
        senderName: 'Phạm Đức Duy',
        senderRole: 'Người dùng',
        senderId: 104,
        status: 'CANCELLED',
        priority: 'LOW',
        reason: 'Vi phạm bản quyền',
        result: 'RELEASE_TO_CREATOR',
        milestoneId: 3,
        milestoneTitle: 'Giai đoạn 3',
        createdAt: getIso(4),
        date: '31/10/2026',
        time: '16:04',
      },
      {
        id: 'KN00052',
        rawId: 52,
        contractId: 124,
        contractCode: 'HD00124',
        workTitle: 'Việt Nam Thời Lý',
        title: 'Không thanh toán sau khi hoàn thành',
        summary: 'Chưa thanh toán mốc công việc cuối',
        disputeType: 'Thanh toán',
        senderName: 'Nguyễn Thu Trang',
        senderRole: 'Creator',
        senderId: 105,
        status: 'OPEN',
        priority: 'HIGH',
        reason: 'Không thanh toán sau khi hoàn thành',
        milestoneId: 2,
        milestoneTitle: 'Giai đoạn 2',
        createdAt: getIso(7),
        date: '28/10/2026',
        time: '10:33',
      },
      {
        id: 'KN00051',
        rawId: 51,
        contractId: 123,
        contractCode: 'HD00123',
        workTitle: 'Truyền Thuyết Sơn Tinh',
        title: 'Thay đổi kịch bản',
        summary: 'Thay đổi hơn 50% kịch bản',
        disputeType: 'Kịch bản',
        senderName: 'Đặng Tuấn Anh',
        senderRole: 'Creator',
        senderId: 106,
        status: 'RESOLVED',
        priority: 'MEDIUM',
        reason: 'Thay đổi kịch bản',
        result: 'RELEASE_TO_CREATOR',
        milestoneId: 1,
        milestoneTitle: 'Giai đoạn 1',
        createdAt: getIso(12),
        date: '23/10/2026',
        time: '14:11',
      },
      {
        id: 'KN00050',
        rawId: 50,
        contractId: 122,
        contractCode: 'HD00122',
        workTitle: 'Văn Hóa Thăng Long',
        title: 'Tranh chấp phân chia doanh thu',
        summary: 'Tỷ lệ phân chia không đúng',
        disputeType: 'Phân chia doanh thu',
        senderName: 'Phan Thị Mai',
        senderRole: 'Creator',
        senderId: 107,
        status: 'OPEN',
        priority: 'MEDIUM',
        reason: 'Tranh chấp phân chia doanh thu',
        milestoneId: 2,
        milestoneTitle: 'Giai đoạn 2',
        createdAt: getIso(18),
        date: '17/10/2026',
        time: '09:55',
      },
      {
        id: 'KN00049',
        rawId: 49,
        contractId: 121,
        contractCode: 'HD00121',
        workTitle: 'Nguyễn Trãi',
        title: 'Khiếu nại về giọng đọc',
        summary: 'Giọng đọc không đúng mô tả âm sắc',
        disputeType: 'Giọng đọc',
        senderName: 'Hoàng Văn Nam',
        senderRole: 'Creator',
        senderId: 108,
        status: 'RESOLVED',
        priority: 'LOW',
        reason: 'Khiếu nại về giọng đọc',
        result: 'SPLIT',
        milestoneId: 1,
        milestoneTitle: 'Giai đoạn 1',
        createdAt: getIso(25),
        date: '10/10/2026',
        time: '13:27',
      },
    ];
  }

  test('7. Mockup-Aligned sample data returns 8 rows with dynamic relative timestamps', () => {
    const sample = getMockupDisputeSampleData();
    assert.equal(sample.length, 8);
    assert.equal(sample[0].id, 'KN00056');
    assert.equal(sample[1].id, 'KN00055');
    assert.equal(sample[2].id, 'KN00054');
    assert.equal(sample[3].id, 'KN00053');
    assert.equal(sample[4].id, 'KN00052');
    assert.equal(sample[5].id, 'KN00051');
    assert.equal(sample[6].id, 'KN00050');
    assert.equal(sample[7].id, 'KN00049');

    // Check dynamic dates (not static hardcoded past year)
    const t0 = new Date(sample[0].createdAt).getTime();
    const now = Date.now();
    assert.ok(now - t0 < 3 * 86400 * 1000); // 1-2 days ago
  });

  test('8. Filters dispute rows by search query, status tab, type, and date presets', () => {
    const sample = getMockupDisputeSampleData();

    // Search by code
    const byCode = filterDisputeRows(sample, { searchQuery: 'KN00056' });
    assert.equal(byCode.length, 1);
    assert.equal(byCode[0].id, 'KN00056');

    // Search by name
    const byName = filterDisputeRows(sample, { searchQuery: 'Lan Anh' });
    assert.equal(byName.length, 1);
    assert.equal(byName[0].senderName, 'Trần Thị Lan Anh');

    // Filter by Status Tab
    const openRows = filterDisputeRows(sample, { statusTab: 'OPEN' });
    assert.equal(openRows.length, 4);

    const resolvedRows = filterDisputeRows(sample, { statusTab: 'RESOLVED' });
    assert.equal(resolvedRows.length, 3);

    const cancelledRows = filterDisputeRows(sample, { statusTab: 'CANCELLED' });
    assert.equal(cancelledRows.length, 1);

    // Filter by Date Range preset 7_DAYS
    const sevenDays = filterDisputeRows(sample, { dateRangePreset: '7_DAYS' });
    assert.ok(sevenDays.length >= 4 && sevenDays.length <= 5);
  });

  test('9. Generates valid UTF-8 BOM CSV export string for Excel', () => {
    const sample = getMockupDisputeSampleData().slice(0, 2);
    const csv = generateDisputeCsv(sample);

    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('KN00056'));
    assert.ok(csv.includes('Nguyễn Hoàng Minh'));
    assert.ok(csv.includes('Đại Thắng Bạch Đằng'));
  });

  test('10. Status and Priority visual configurations return valid tokens', () => {
    const openCfg = getDisputeStatusConfig('OPEN');
    assert.equal(openCfg.label, 'Đang thụ lý');
    assert.ok(openCfg.dotColor.includes('bg-[#3B82F6]'));

    const resolvedCfg = getDisputeStatusConfig('RESOLVED');
    assert.equal(resolvedCfg.label, 'Đã giải quyết');

    const cancelledCfg = getDisputeStatusConfig('CANCELLED');
    assert.equal(cancelledCfg.label, 'Đã hủy');

    const highPrio = getDisputePriorityConfig('HIGH');
    assert.equal(highPrio.label, 'Cao');
    assert.ok(highPrio.colorClass.includes('text-[#DC2626]'));
  });

  test('11. Break-UI Stress-Test: Gracefully sanitizes extreme strings and unusual payloads', () => {
    const extremeItem: DisputeItem = {
      id: 999999999,
      contractId: 888888888,
      contractTitle: 'A'.repeat(500),
      raisedByUserId: 7777777,
      raisedByUserFullName: 'B'.repeat(300),
      reason: 'C'.repeat(2000),
      status: 'UNKNOWN_STATUS_VALUE',
      createdAt: 'invalid-iso',
    };

    const row = mapBackendItemToDisputeRow(extremeItem, 0);
    assert.ok(row.id.startsWith('KN'));
    assert.equal(row.status, 'OPEN'); // Safe fallback
    assert.equal(row.date, '—');
    assert.equal(row.time, '—');

    // Filtering must not throw
    const filtered = filterDisputeRows([row], { searchQuery: 'A'.repeat(100) });
    assert.equal(filtered.length, 1);

    // CSV generation must not throw
    const csv = generateDisputeCsv([row]);
    assert.ok(csv.includes('KN999999999'));
  });

  test('12. Safe clipboard copy: Handles empty text and environments gracefully', async () => {
    // Empty text returns false immediately
    const resEmpty = await copyToClipboard('');
    assert.equal(resEmpty, false);

    // In Node.js environment without DOM navigator.clipboard, gracefully falls back and returns false
    const resNode = await copyToClipboard('KN00056');
    assert.equal(typeof resNode, 'boolean');
  });
});
