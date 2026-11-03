import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMembershipKPIs,
  normalizeVietnamese,
  mapPaymentStatus,
  determinePlanName,
  determinePaymentMethod,
  getAvatarInitials,
  filterMembershipPayments,
  exportMembershipPaymentsToCSV,
  calculateDateRangeBounds,
  MOCK_MEMBERSHIP_TEST_PAYMENTS,
} from '../membershipLogic.ts';
import type { PaymentDisplayRow } from '../membershipLogic.ts';
import type { MembershipPaymentItem } from '../../../types/membership.ts';

describe('Admin Membership - membershipLogic Test Suite', () => {
  const mockPayments: MembershipPaymentItem[] = [
    {
      id: 1,
      membershipId: 101,
      amount: 100000,
      commissionAmount: 10000,
      creatorEarning: 90000,
      status: 'SUCCESS',
      paidAt: '2026-10-24T14:20:00Z',
    },
    {
      id: 2,
      membershipId: 102,
      amount: 50000,
      commissionAmount: 5000,
      creatorEarning: 45000,
      status: 'SUCCESS',
      paidAt: '2026-10-23T10:15:00Z',
    },
    {
      id: 3,
      membershipId: 103,
      amount: 200000,
      commissionAmount: 20000,
      creatorEarning: 180000,
      status: 'PENDING',
      paidAt: '2026-10-22T09:30:00Z',
    },
    {
      id: 4,
      membershipId: 104,
      amount: 100000,
      commissionAmount: 10000,
      creatorEarning: 90000,
      status: 'FAILED',
      paidAt: '2026-10-20T16:45:00Z',
    },
  ];

  it('1. Calculates live membership KPI metrics correctly', () => {
    const kpis = calculateMembershipKPIs(mockPayments);
    assert.equal(kpis.totalMembers, 4);
    assert.equal(kpis.paidCount, 2);
    assert.equal(kpis.pendingCount, 1);
    assert.equal(kpis.monthlyRevenue, 150000); // 100k + 50k từ 2 giao dịch SUCCESS
  });

  it('2. Gracefully handles empty payments array for KPIs with Zero Fake Data', () => {
    const kpis = calculateMembershipKPIs([]);
    assert.equal(kpis.totalMembers, 0);
    assert.equal(kpis.monthlyRevenue, 0);
    assert.equal(kpis.paidCount, 0);
    assert.equal(kpis.pendingCount, 0);
    assert.equal(kpis.totalMembersTrend, '');
    assert.equal(kpis.revenueTrend, '');
    assert.equal(kpis.totalMembersDiffText, 'Chưa có hội viên');
  });

  it('3. Normalizes Vietnamese characters for robust searching', () => {
    assert.equal(normalizeVietnamese('Nguyễn Hoàng Minh'), 'nguyen hoang minh');
    assert.equal(normalizeVietnamese('Đặng Đình Đô'), 'dang dinh do');
    assert.equal(normalizeVietnamese('HỘI VIÊN CAO CẤP'), 'hoi vien cao cap');
  });

  it('4. Maps payment statuses accurately to Vietnamese labels and variants', () => {
    const success = mapPaymentStatus('SUCCESS');
    assert.equal(success.label, 'Thành công');
    assert.equal(success.variant, 'success');

    const pending = mapPaymentStatus('PENDING');
    assert.equal(pending.label, 'Chờ xác minh');
    assert.equal(pending.variant, 'warning');

    const failed = mapPaymentStatus('FAILED');
    assert.equal(failed.label, 'Thất bại');
    assert.equal(failed.variant, 'error');
  });

  it('5. Infers membership plan name by amount accurately', () => {
    assert.equal(determinePlanName(200000), 'Hội Viên VIP');
    assert.equal(determinePlanName(100000), 'Hội Viên Cao Cấp');
    assert.equal(determinePlanName(50000), 'Hội Viên Thường');
    assert.equal(determinePlanName(30000, 'Gói Đồng Hào Hùng'), 'Gói Đồng Hào Hùng');
  });

  it('6. Determines payment method badge accurately', () => {
    assert.equal(determinePaymentMethod('VNPAY').name, 'VNPAY');
    assert.equal(determinePaymentMethod('MOMO').name, 'MoMo');
    assert.equal(determinePaymentMethod('BANK_TRANSFER').name, 'Thẻ ngân hàng');
  });

  it('7. Extracts 2-letter initials for avatar fallback', () => {
    assert.equal(getAvatarInitials('Nguyễn Hoàng Minh'), 'HM');
    assert.equal(getAvatarInitials('Trần Thị Lan Anh'), 'LA');
    assert.equal(getAvatarInitials('Huy'), 'HU');
    assert.equal(getAvatarInitials(''), 'HV');
  });

  it('8. Filters payments by keyword, plan, and status', () => {
    const rows: PaymentDisplayRow[] = [
      {
        id: 1,
        membershipId: 101,
        userName: 'Nguyễn Hoàng Minh',
        userEmail: 'minh.nguyen@example.com',
        planName: 'Hội Viên Cao Cấp',
        amount: 100000,
        paymentMethod: 'VNPAY',
        paymentMethodType: 'vnpay',
        status: 'SUCCESS',
        statusLabel: 'Thành công',
        statusVariant: 'success',
        paidAt: '2026-10-24T14:20:00Z',
        creatorEarning: 90000,
        commissionAmount: 10000,
      },
      {
        id: 2,
        membershipId: 102,
        userName: 'Trần Thị Lan Anh',
        userEmail: 'lananh.tran@example.com',
        planName: 'Hội Viên Thường',
        amount: 50000,
        paymentMethod: 'MoMo',
        paymentMethodType: 'momo',
        status: 'SUCCESS',
        statusLabel: 'Thành công',
        statusVariant: 'success',
        paidAt: '2026-10-23T10:15:00Z',
        creatorEarning: 45000,
        commissionAmount: 5000,
      },
    ];

    // Filter by search name
    const res1 = filterMembershipPayments(rows, 'Minh');
    assert.equal(res1.length, 1);
    assert.equal(res1[0].userName, 'Nguyễn Hoàng Minh');

    // Filter by plan
    const res2 = filterMembershipPayments(rows, '', 'Thường');
    assert.equal(res2.length, 1);
    assert.equal(res2[0].userName, 'Trần Thị Lan Anh');

    // Filter by status
    const res3 = filterMembershipPayments(rows, '', 'all', 'SUCCESS');
    assert.equal(res3.length, 2);

    const res4 = filterMembershipPayments(rows, '', 'all', 'FAILED');
    assert.equal(res4.length, 0);
  });

  it('9. Exports membership payments to valid UTF-8 BOM CSV', () => {
    const rows: PaymentDisplayRow[] = [
      {
        id: 1,
        membershipId: 101,
        userName: 'Nguyễn Hoàng Minh',
        userEmail: 'minh.nguyen@example.com',
        planName: 'Hội Viên Cao Cấp',
        amount: 100000,
        paymentMethod: 'VNPAY',
        paymentMethodType: 'vnpay',
        status: 'SUCCESS',
        statusLabel: 'Thành công',
        statusVariant: 'success',
        paidAt: '2026-10-24T14:20:00Z',
        creatorEarning: 90000,
        commissionAmount: 10000,
      },
    ];

    const csv = exportMembershipPaymentsToCSV(rows);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('Nguyễn Hoàng Minh'));
    assert.ok(csv.includes('100000'));
    assert.ok(csv.includes('VNPAY'));
  });

  it('10. Break-UI: Stress-tests worst-case data (extreme numbers, huge strings, nulls)', () => {
    const extremeRow: PaymentDisplayRow = {
      id: 9999999999,
      membershipId: 8888888888,
      userName: 'A'.repeat(500),
      userEmail: 'long_email_without_break_'.repeat(20) + '@example.com',
      planName: 'Gói '.repeat(50),
      amount: 999999999999999,
      paymentMethod: 'VNPAY',
      paymentMethodType: 'vnpay',
      status: 'UNKNOWN_STATUS',
      statusLabel: 'Chưa rõ',
      statusVariant: 'neutral',
      creatorEarning: 899999999999999,
      commissionAmount: 100000000000000,
    };

    assert.doesNotThrow(() => {
      filterMembershipPayments([extremeRow], 'A'.repeat(100));
      exportMembershipPaymentsToCSV([extremeRow]);
      mapPaymentStatus(undefined);
      getAvatarInitials('   ');
      determinePlanName(0);
    });
  });

  it('11. Validates Date Range Bounds and Mock Test Payments', () => {
    // Presets
    const today = calculateDateRangeBounds('today');
    assert.equal(today.label, 'Hôm nay');
    assert.ok(today.startDate);

    const sevenDays = calculateDateRangeBounds('7days');
    assert.equal(sevenDays.label, '7 ngày qua');
    assert.ok(sevenDays.startDate);

    const thirtyDays = calculateDateRangeBounds('30days');
    assert.equal(thirtyDays.label, '30 ngày gần đây');
    assert.ok(thirtyDays.startDate);

    const thisMonth = calculateDateRangeBounds('this_month');
    assert.equal(thisMonth.label, 'Tháng này');
    assert.ok(thisMonth.startDate);

    const custom = calculateDateRangeBounds('custom', '2026-10-01', '2026-10-31');
    assert.equal(custom.label, '2026-10-01 → 2026-10-31');
    assert.ok(custom.startDate);
    assert.ok(custom.endDate);

    const all = calculateDateRangeBounds('all');
    assert.equal(all.label, 'Tất cả thời gian');
    assert.equal(all.startDate, undefined);

    // Zero Fake Data: Mock test payments array is completely cleaned and empty
    assert.equal(MOCK_MEMBERSHIP_TEST_PAYMENTS.length, 0);
  });
});
