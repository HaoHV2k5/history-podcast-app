import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractListFromApiResponse,
  calculatePendingCount,
  buildAdminNotificationSummary,
  buildAdminNotificationItems,
  safeParseReadIds,
  serializeReadIds,
} from '../adminNotificationLogic.ts';

test('adminNotificationLogic - safeParseReadIds & serializeReadIds', () => {
  // Empty / null / corrupted inputs
  assert.equal(safeParseReadIds(null).size, 0);
  assert.equal(safeParseReadIds(undefined as any).size, 0);
  assert.equal(safeParseReadIds('').size, 0);
  assert.equal(safeParseReadIds('not-json').size, 0);
  assert.equal(safeParseReadIds('{"key":"value"}').size, 0);

  // Valid array serialization & parsing
  const initialSet = new Set(['mod-10', 'kyc-2', 'with-5']);
  const serialized = serializeReadIds(initialSet);
  const parsed = safeParseReadIds(serialized);

  assert.equal(parsed.size, 3);
  assert.ok(parsed.has('mod-10'));
  assert.ok(parsed.has('kyc-2'));
  assert.ok(parsed.has('with-5'));
  assert.ok(!parsed.has('mod-999'));
});

test('adminNotificationLogic - extractListFromApiResponse', () => {
  assert.deepEqual(extractListFromApiResponse(null), []);
  assert.deepEqual(extractListFromApiResponse(undefined), []);
  assert.deepEqual(extractListFromApiResponse([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(extractListFromApiResponse({ items: ['a', 'b'] }), ['a', 'b']);
  assert.deepEqual(extractListFromApiResponse({ content: ['x', 'y'] }), ['x', 'y']);
  assert.deepEqual(extractListFromApiResponse({ data: { items: ['z'] } }), ['z']);
});

test('adminNotificationLogic - calculatePendingCount', () => {
  assert.equal(calculatePendingCount({ totalElements: 5 }), 5);
  assert.equal(calculatePendingCount({ data: { totalElements: 8 } }), 8);

  const rawList = [
    { id: 1, status: 'PENDING' },
    { id: 2, status: 'COMPLETED' },
    { id: 3, status: 'PENDING' },
  ];
  assert.equal(
    calculatePendingCount(rawList, (item) => item.status === 'PENDING'),
    2
  );
  assert.equal(calculatePendingCount(null), 0);
  assert.equal(calculatePendingCount([]), 0);
});

test('adminNotificationLogic - buildAdminNotificationItems - Granular & Zero Fake Data', () => {
  // Empty queues return 0 items
  const emptyItems = buildAdminNotificationItems({});
  assert.equal(emptyItems.length, 0);

  // Real backend payload representation
  const queues = {
    moderationData: {
      items: [
        { reviewId: 101, contentId: 55, title: 'Bạch Đằng Giang', decision: 'PENDING', createdAt: '2026-03-01T10:00:00Z' },
        { reviewId: 102, contentId: 56, title: 'Lam Sơn Khởi Nghĩa', decision: 'APPROVED', createdAt: '2026-03-01T09:00:00Z' },
      ],
    },
    kycData: {
      items: [
        { id: 201, fullName: 'Nguyễn Văn A', status: 'PENDING', phone: '0901234567', updatedAt: '2026-03-01T11:00:00Z' },
      ],
    },
    withdrawalsData: {
      items: [
        { id: 301, amount: 500000, accountHolderName: 'Trần Thị B', bankName: 'Vietcombank', status: 'PENDING', requestedAt: '2026-03-01T12:00:00Z' },
        { id: 302, amount: 200000, status: 'COMPLETED', requestedAt: '2026-03-01T08:00:00Z' },
      ],
    },
    disputesData: [
      { id: 401, reason: 'Chất lượng âm thanh không đạt', status: 'OPEN', createdAt: '2026-03-01T07:00:00Z' },
    ],
    membershipData: [
      { id: 501, amount: 50000, status: 'PENDING', paidAt: '2026-03-01T13:00:00Z' },
    ],
  };

  const items = buildAdminNotificationItems(queues);
  // Total pending items: 1 mod + 1 kyc + 1 with + 1 disp + 1 mem = 5
  assert.equal(items.length, 5);

  // Test item ordering: newest first (membership 13:00 -> withdrawal 12:00 -> kyc 11:00 -> mod 10:00 -> dispute 07:00)
  assert.equal(items[0].id, 'mem-501');
  assert.equal(items[1].id, 'with-301');
  assert.equal(items[2].id, 'kyc-201');
  assert.equal(items[3].id, 'mod-101');
  assert.equal(items[4].id, 'disp-401');

  // Verify item properties
  assert.equal(items[3].title, 'Bạch Đằng Giang');
  assert.equal(items[3].link, '/admin/moderation');
  assert.equal(items[2].title, 'Nguyễn Văn A');
  assert.equal(items[2].link, '/admin/kyc');
});

test('adminNotificationLogic - buildAdminNotificationSummary - Zero Fake Data', () => {
  const emptySummary = buildAdminNotificationSummary({
    moderationCount: 0,
    kycCount: 0,
    withdrawalCount: 0,
    disputeCount: 0,
    membershipCount: 0,
  });
  assert.equal(emptySummary.totalPending, 0);
  assert.equal(emptySummary.hasPending, false);
  assert.equal(emptySummary.activeCategories.length, 0);

  const mixedSummary = buildAdminNotificationSummary({
    moderationCount: 2,
    kycCount: 1,
    withdrawalCount: 0,
    disputeCount: 0,
    membershipCount: 3,
  });
  assert.equal(mixedSummary.totalPending, 6);
  assert.equal(mixedSummary.hasPending, true);
  assert.equal(mixedSummary.activeCategories.length, 3);
});
