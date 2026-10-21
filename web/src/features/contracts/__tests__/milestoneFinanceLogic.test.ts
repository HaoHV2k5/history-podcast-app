import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEscrowBreakdown,
  formatMilestoneWorkStatus,
  formatMilestoneEscrowStatus,
  formatDateOrFallback,
  formatVNDOrFallback,
  validateContractMilestoneAssociation,
  getMilestoneSplitRefund,
  getAutoReleaseIndicator,
  generateMilestoneEscrowCSV,
} from '../milestoneFinanceLogic.ts';
import type { MilestoneItem } from '../../../types/contract.ts';

describe('PRM232 M19-A1 Admin Contract Milestone & Escrow Financial Logic', () => {
  // Test 1: Milestone Data Mapping
  test('1. Correct milestone data mapping in calculateEscrowBreakdown', () => {
    const milestones: MilestoneItem[] = [
      {
        id: 101,
        contractId: 10,
        orderNo: 1,
        title: 'Bản thu âm tập 1',
        amount: 1500000,
        feePercent: 5,
        platformFee: 75000,
        netAmount: 1425000,
        status: 'RELEASED',
        escrowStatus: 'RELEASED',
      },
    ];

    const result = calculateEscrowBreakdown(milestones);
    assert.equal(result.totalMilestones, 1);
    assert.equal(result.totalGross, 1500000);
    assert.equal(result.totalPlatformFee, 75000);
    assert.equal(result.totalReleasedNet, 1425000);
    assert.equal(result.currentlyHeld, 0);
    assert.equal(result.isBalanced, true);
  });

  // Test 2: Separate Lifecycle (Work) and Escrow Statuses
  test('2. Keeps work status and escrow status visually and logically separate (APPROVED does not infer RELEASED)', () => {
    // Crucial rule: Creator APPROVED the work, but system holds money in Escrow for 3 days (HELD)
    const approvedHeldMilestone: MilestoneItem = {
      id: 102,
      contractId: 10,
      orderNo: 2,
      title: 'Bản thu âm tập 2 - Chờ giải ngân',
      amount: 2000000,
      feePercent: 5,
      platformFee: 100000,
      netAmount: 1900000,
      status: 'APPROVED',
      escrowStatus: 'HELD', // Still held in escrow during 3-day hold window!
    };

    const workPresentation = formatMilestoneWorkStatus(approvedHeldMilestone.status);
    const escrowPresentation = formatMilestoneEscrowStatus(approvedHeldMilestone.escrowStatus);

    assert.equal(workPresentation.label, 'Đã nghiệm thu');
    assert.equal(workPresentation.variant, 'success');

    assert.equal(escrowPresentation.label, 'Đang giữ ký quỹ (Held)');
    assert.equal(escrowPresentation.variant, 'processing');

    const breakdown = calculateEscrowBreakdown([approvedHeldMilestone]);
    // The money MUST be in currentlyHeld, NOT in releasedNet!
    assert.equal(breakdown.currentlyHeld, 2000000);
    assert.equal(breakdown.totalReleasedNet, 0);
    assert.equal(breakdown.totalPlatformFee, 0);
    assert.equal(breakdown.isBalanced, true);
  });

  // Test 3: Complete Coverage of Milestone Work Statuses
  test('3. Maps all defined Milestone Work Statuses correctly', () => {
    assert.equal(formatMilestoneWorkStatus('WAITING').label, 'Chờ thực hiện');
    assert.equal(formatMilestoneWorkStatus('UNFUNDED').label, 'Chờ ký quỹ');
    assert.equal(formatMilestoneWorkStatus('IN_PROGRESS').label, 'Đang thực hiện');
    assert.equal(formatMilestoneWorkStatus('SUBMITTED').label, 'Đã nộp bài');
    assert.equal(formatMilestoneWorkStatus('APPROVED').label, 'Đã nghiệm thu');
    assert.equal(formatMilestoneWorkStatus('RELEASED').label, 'Đã hoàn tất');
    assert.equal(formatMilestoneWorkStatus('CANCELLED').label, 'Đã hủy');
  });

  // Test 4: Complete Coverage of Milestone Escrow Statuses
  test('4. Maps all defined Escrow Financial Statuses accurately', () => {
    assert.equal(formatMilestoneEscrowStatus('UNFUNDED').label, 'Chưa ký quỹ');
    assert.equal(formatMilestoneEscrowStatus('HELD').label, 'Đang giữ ký quỹ (Held)');
    assert.equal(formatMilestoneEscrowStatus('FROZEN').label, 'Tạm đóng băng (Frozen)');
    assert.equal(formatMilestoneEscrowStatus('RELEASED').label, 'Đã giải ngân (Released)');
    assert.equal(formatMilestoneEscrowStatus('REFUNDED').label, 'Đã hoàn trả (Refunded)');
  });

  // Test 5: VND Amount Formatting
  test('5. Formats VND currency correctly and safely', () => {
    const formatted = formatVNDOrFallback(1500000);
    assert.ok(formatted.includes('1.500.000') || formatted.includes('1,500,000'));
    assert.ok(formatted.includes('₫') || formatted.includes('VND'));

    const zeroFormatted = formatVNDOrFallback(0);
    assert.ok(zeroFormatted.includes('0'));
  });

  // Test 6: Null and Missing Optional Fields Handling
  test('6. Returns neutral fallback "Chưa có dữ liệu" for missing/null optional fields', () => {
    assert.equal(formatDateOrFallback(null), 'Chưa có dữ liệu');
    assert.equal(formatDateOrFallback(undefined), 'Chưa có dữ liệu');
    assert.equal(formatDateOrFallback(''), 'Chưa có dữ liệu');

    assert.equal(formatVNDOrFallback(null), 'Chưa có dữ liệu');
    assert.equal(formatVNDOrFallback(undefined), 'Chưa có dữ liệu');

    assert.equal(formatMilestoneWorkStatus(null).label, 'Chưa có dữ liệu');
    assert.equal(formatMilestoneEscrowStatus(null).label, 'Chưa có dữ liệu');
  });

  // Test 7: Empty Milestone Lists
  test('7. Safely handles empty or undefined milestone lists without throwing errors', () => {
    const emptyResult = calculateEscrowBreakdown([]);
    assert.equal(emptyResult.totalMilestones, 0);
    assert.equal(emptyResult.totalGross, 0);
    assert.equal(emptyResult.currentlyHeld, 0);
    assert.equal(emptyResult.totalReleasedNet, 0);
    assert.equal(emptyResult.isBalanced, true);

    const nullResult = calculateEscrowBreakdown(null);
    assert.equal(nullResult.totalMilestones, 0);
    assert.equal(nullResult.totalGross, 0);
    assert.equal(nullResult.isBalanced, true);

    const undefResult = calculateEscrowBreakdown(undefined);
    assert.equal(undefResult.totalMilestones, 0);
    assert.equal(undefResult.isBalanced, true);
  });

  // Test 8: Aggregation Without Double Counting
  test('8. Strictly partitions financial amounts by escrow status, guaranteeing ZERO double counting', () => {
    const mixedMilestones: MilestoneItem[] = [
      {
        id: 1,
        contractId: 50,
        orderNo: 1,
        title: 'M1 - Released',
        amount: 2000000,
        platformFee: 100000,
        netAmount: 1900000,
        status: 'RELEASED',
        escrowStatus: 'RELEASED',
      },
      {
        id: 2,
        contractId: 50,
        orderNo: 2,
        title: 'M2 - Currently in Progress (Held in Escrow)',
        amount: 1500000,
        status: 'IN_PROGRESS',
        escrowStatus: 'HELD',
      },
      {
        id: 3,
        contractId: 50,
        orderNo: 3,
        title: 'M3 - In Dispute (Frozen in Escrow)',
        amount: 500000,
        status: 'SUBMITTED',
        escrowStatus: 'FROZEN',
      },
      {
        id: 4,
        contractId: 50,
        orderNo: 4,
        title: 'M4 - Overdue Cancelled (Refunded to Creator)',
        amount: 600000,
        status: 'CANCELLED',
        escrowStatus: 'REFUNDED',
      },
      {
        id: 5,
        contractId: 50,
        orderNo: 5,
        title: 'M5 - Waiting to be funded',
        amount: 1000000,
        status: 'UNFUNDED',
        escrowStatus: 'UNFUNDED',
      },
    ];

    const breakdown = calculateEscrowBreakdown(mixedMilestones);

    assert.equal(breakdown.totalMilestones, 5);
    // Total gross = 2,000,000 + 1,500,000 + 500,000 + 600,000 + 1,000,000 = 5,600,000
    assert.equal(breakdown.totalGross, 5600000);

    // Each bucket must strictly account for its own status:
    assert.equal(breakdown.totalReleasedNet, 1900000);
    assert.equal(breakdown.totalPlatformFee, 100000);
    assert.equal(breakdown.currentlyHeld, 1500000);
    assert.equal(breakdown.currentlyFrozen, 500000);
    assert.equal(breakdown.totalRefunded, 600000);
    assert.equal(breakdown.unfundedAmount, 1000000);

    // Sum of all distinct partitions equals gross amount
    const sumPartitions =
      breakdown.totalReleasedNet +
      breakdown.totalPlatformFee +
      breakdown.currentlyHeld +
      breakdown.currentlyFrozen +
      breakdown.totalRefunded +
      breakdown.unfundedAmount;

    assert.equal(sumPartitions, breakdown.totalGross);
    assert.equal(breakdown.isBalanced, true);
  });

  // Test 9: Contract-to-Milestone Association Validation
  test('9. Validates contract-to-milestone association accurately', () => {
    const validMilestone: MilestoneItem = {
      id: 201,
      contractId: 42,
      orderNo: 1,
      title: 'Milestone của Hợp đồng 42',
      amount: 1000000,
      status: 'IN_PROGRESS',
      escrowStatus: 'HELD',
    };

    assert.equal(validateContractMilestoneAssociation(42, validMilestone), true);
    assert.equal(validateContractMilestoneAssociation(99, validMilestone), false);
    assert.equal(validateContractMilestoneAssociation(0, validMilestone), false);
  });

  // Test 10: SPLIT Partial Settlement Reconciliation
  test('10. Accurately reconciles SPLIT settlement where escrowStatus is RELEASED but creator received refund', () => {
    // Backend EscrowServiceImpl.splitMilestoneEscrow:
    // Sets escrowStatus = RELEASED, platformFee = 60,000, netAmount = 1,140,000
    // The residual 800,000 was refunded to Creator via wallet transaction.
    const splitMilestone: MilestoneItem = {
      id: 301,
      contractId: 77,
      orderNo: 1,
      title: 'Tập 1 - Đã phân xử SPLIT 60/40',
      amount: 2000000,
      feePercent: 5,
      platformFee: 60000,
      netAmount: 1140000,
      status: 'RELEASED',
      escrowStatus: 'RELEASED',
    };

    const breakdown = calculateEscrowBreakdown([splitMilestone]);

    assert.equal(breakdown.totalGross, 2000000);
    assert.equal(breakdown.totalReleasedNet, 1140000);
    assert.equal(breakdown.totalPlatformFee, 60000);
    // Residual refund must be accurately identified and counted in totalRefunded:
    assert.equal(breakdown.totalRefunded, 800000);
    assert.equal(breakdown.totalSplitRefund, 800000);
    assert.equal(breakdown.currentlyHeld, 0);
    assert.equal(breakdown.currentlyFrozen, 0);

    // Sum must perfectly match totalGross (zero double-counting or loss)
    const sum =
      breakdown.totalReleasedNet +
      breakdown.totalPlatformFee +
      breakdown.totalRefunded;
    assert.equal(sum, breakdown.totalGross);
    assert.equal(breakdown.isBalanced, true);
  });

  // Test 11: Dynamic platform fee on individual milestone
  test('11. Dynamic platform fee rate (e.g. 8% or 10%) correctly aggregates without assuming hardcoded 5%', () => {
    const dynamicMilestone: MilestoneItem = {
      id: 302,
      contractId: 88,
      orderNo: 1,
      title: 'Tập VIP - Phí sàn thỏa thuận riêng 8%',
      amount: 10000000,
      feePercent: 8,
      platformFee: 800000,
      netAmount: 9200000,
      status: 'RELEASED',
      escrowStatus: 'RELEASED',
    };

    const breakdown = calculateEscrowBreakdown([dynamicMilestone]);
    assert.equal(breakdown.totalGross, 10000000);
    assert.equal(breakdown.totalPlatformFee, 800000);
    assert.equal(breakdown.totalReleasedNet, 9200000);
    assert.equal(breakdown.totalRefunded, 0);
    assert.equal(breakdown.isBalanced, true);
  });

  // Test 12: getMilestoneSplitRefund safely isolates creator refund portion
  test('12. getMilestoneSplitRefund accurately calculates Creator refund on SPLIT settlement', () => {
    // 12.1. Non-RELEASED milestone returns 0 refund
    const heldMilestone: MilestoneItem = {
      id: 401,
      contractId: 99,
      orderNo: 1,
      title: 'Milestone 1',
      status: 'IN_PROGRESS',
      amount: 1000000,
      escrowStatus: 'HELD',
    };
    assert.equal(getMilestoneSplitRefund(heldMilestone), 0);

    // 12.2. Standard 100% full release milestone returns 0 refund
    const fullReleaseMilestone: MilestoneItem = {
      id: 402,
      contractId: 99,
      orderNo: 2,
      title: 'Milestone 2',
      status: 'RELEASED',
      amount: 1000000,
      platformFee: 50000,
      netAmount: 950000,
      escrowStatus: 'RELEASED',
    };
    assert.equal(getMilestoneSplitRefund(fullReleaseMilestone), 0);

    // 12.3. SPLIT 60/40 release (1,000,000 gross, 570,000 net, 30,000 fee) -> 400,000 refund to creator
    const splitMilestone: MilestoneItem = {
      id: 403,
      contractId: 99,
      orderNo: 3,
      title: 'Milestone 3',
      status: 'RELEASED',
      amount: 1000000,
      platformFee: 30000,
      netAmount: 570000,
      escrowStatus: 'RELEASED',
    };
    assert.equal(getMilestoneSplitRefund(splitMilestone), 400000);

    // 12.4. Null or undefined milestone returns 0 safely
    assert.equal(getMilestoneSplitRefund(null), 0);
    assert.equal(getMilestoneSplitRefund(undefined), 0);
  });

  // Test 13: getAutoReleaseIndicator logic
  test('13. getAutoReleaseIndicator accurately detects auto-release countdown and due status', () => {
    const baseNow = new Date('2026-10-22T10:00:00Z');

    // 13.1. Null/undefined returns null
    assert.equal(getAutoReleaseIndicator(null, baseNow), null);
    assert.equal(getAutoReleaseIndicator(undefined, baseNow), null);

    // 13.2. Not APPROVED (e.g. IN_PROGRESS) returns null even if releaseAt exists
    const inProgressMilestone: MilestoneItem = {
      id: 501,
      contractId: 100,
      orderNo: 1,
      title: 'M1',
      amount: 1000000,
      status: 'IN_PROGRESS',
      escrowStatus: 'HELD',
      releaseAt: '2026-10-24T10:00:00Z',
    };
    assert.equal(getAutoReleaseIndicator(inProgressMilestone, baseNow), null);

    // 13.3. Already RELEASED returns null
    const releasedMilestone: MilestoneItem = {
      id: 502,
      contractId: 100,
      orderNo: 2,
      title: 'M2',
      amount: 1000000,
      status: 'APPROVED',
      escrowStatus: 'RELEASED',
      releaseAt: '2026-10-20T10:00:00Z',
    };
    assert.equal(getAutoReleaseIndicator(releasedMilestone, baseNow), null);

    // 13.4. APPROVED + HELD + Future releaseAt (2 days away)
    const waiting2Days: MilestoneItem = {
      id: 503,
      contractId: 100,
      orderNo: 3,
      title: 'M3',
      amount: 1000000,
      status: 'APPROVED',
      escrowStatus: 'HELD',
      releaseAt: '2026-10-24T10:00:00Z', // 2 days ahead of baseNow
    };
    const ind2Days = getAutoReleaseIndicator(waiting2Days, baseNow);
    assert.notEqual(ind2Days, null);
    assert.equal(ind2Days?.isWaitingRelease, true);
    assert.equal(ind2Days?.isDue, false);
    assert.equal(ind2Days?.message.includes('còn 2 ngày'), true);
    assert.equal(ind2Days?.badgeVariant, 'pending');

    // 13.5. APPROVED + HELD + Future releaseAt (5 hours away)
    const waiting5Hours: MilestoneItem = {
      id: 504,
      contractId: 100,
      orderNo: 4,
      title: 'M4',
      amount: 1000000,
      status: 'APPROVED',
      escrowStatus: 'HELD',
      releaseAt: '2026-10-22T15:00:00Z', // 5 hours ahead of baseNow
    };
    const ind5Hours = getAutoReleaseIndicator(waiting5Hours, baseNow);
    assert.notEqual(ind5Hours, null);
    assert.equal(ind5Hours?.isWaitingRelease, true);
    assert.equal(ind5Hours?.isDue, false);
    assert.equal(ind5Hours?.message.includes('còn 5 giờ'), true);

    // 13.6. APPROVED + HELD + Past/Due releaseAt (now is equal to or past releaseAt)
    const pastMilestone: MilestoneItem = {
      id: 505,
      contractId: 100,
      orderNo: 5,
      title: 'M5',
      amount: 1000000,
      status: 'APPROVED',
      escrowStatus: 'HELD',
      releaseAt: '2026-10-21T10:00:00Z', // 1 day before baseNow
    };
    const indDue = getAutoReleaseIndicator(pastMilestone, baseNow);
    assert.notEqual(indDue, null);
    assert.equal(indDue?.isWaitingRelease, true);
    assert.equal(indDue?.isDue, true);
    assert.equal(indDue?.message, 'Đến hạn tự động giải ngân');
    assert.equal(indDue?.badgeVariant, 'success');
  });

  // Test 14: generateMilestoneEscrowCSV export logic
  test('14. generateMilestoneEscrowCSV generates valid UTF-8 BOM CSV with complete financial reconciliation', () => {
    const milestones: MilestoneItem[] = [
      {
        id: 601,
        contractId: 150,
        orderNo: 1,
        title: 'Tập 1 - Hùng Vương',
        amount: 2000000,
        feePercent: 5,
        platformFee: 100000,
        netAmount: 1900000,
        status: 'RELEASED',
        escrowStatus: 'RELEASED',
        fundedAt: '2026-10-01T10:00:00Z',
        releasedAt: '2026-10-05T10:00:00Z',
      },
      {
        id: 602,
        contractId: 150,
        orderNo: 2,
        title: 'Tập 2 - Hai Bà Trưng (SPLIT)',
        amount: 2000000,
        feePercent: 5,
        platformFee: 60000,
        netAmount: 1140000,
        status: 'RELEASED',
        escrowStatus: 'RELEASED',
        fundedAt: '2026-10-01T10:00:00Z',
        releasedAt: '2026-10-08T10:00:00Z',
      },
    ];

    const breakdown = calculateEscrowBreakdown(milestones);
    const csvContent = generateMilestoneEscrowCSV(150, 'Hợp đồng Podcast Sử Ký', milestones, breakdown);

    // 14.1. Must start with UTF-8 BOM (\uFEFF) for Excel Vietnamese character compatibility
    assert.equal(csvContent.startsWith('\uFEFF'), true);

    // 14.2. Must contain contract title & ID in the header title row
    assert.equal(csvContent.includes('HỢP ĐỒNG #150'), true);
    assert.equal(csvContent.includes('Hợp đồng Podcast Sử Ký'), true);

    // 14.3. Must contain column headers
    assert.equal(csvContent.includes('STT Cột mốc'), true);
    assert.equal(csvContent.includes('Giá trị bảo chứng (Gross VND)'), true);
    assert.equal(csvContent.includes('Phí sàn (%)'), true);
    assert.equal(csvContent.includes('Thực nhận Thuyết minh (Net VND)'), true);
    assert.equal(csvContent.includes('Phân chia hoàn Creator (VND)'), true);

    // 14.4. Must contain milestone rows with correct numbers
    assert.equal(csvContent.includes('"Tập 1 - Hùng Vương"'), true);
    assert.equal(csvContent.includes('"Tập 2 - Hai Bà Trưng (SPLIT)"'), true);
    assert.equal(csvContent.includes('"800000"'), true); // 800,000 SPLIT refund to Creator

    // 14.5. Must contain summary row
    assert.equal(csvContent.includes('"TỔNG CỘNG"'), true);
    assert.equal(csvContent.includes('"4000000"'), true); // total gross
    assert.equal(csvContent.includes('"3040000"'), true); // total net
    assert.equal(csvContent.includes('"160000"'), true); // total fee
  });
});

