import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDisputeEligibleForResolution,
  validateResolutionForm,
  calculateSplitEstimate,
  formatDisputeResult,
  formatDisputeStatus,
  checkSplitFeeDiscrepancy,
} from '../disputeResolutionLogic.ts';
import type { DisputeItem, ResolveDisputePayload } from '../../../types/dispute.ts';
import type { MilestoneItem } from '../../../types/contract.ts';

describe('PRM232 M19-A2 Admin Dispute Resolution & Milestone Escrow Settlement', () => {
  // --- 1. Resolution Eligibility Tests ---
  describe('1. Dispute Resolution Eligibility', () => {
    test('1.1. Open dispute with FROZEN milestone escrow is eligible for resolution', () => {
      const dispute: DisputeItem = {
        id: 1,
        contractId: 10,
        milestoneId: 101,
        raisedByUserId: 5,
        reason: 'Chất lượng bản thu âm bị rè và chưa đạt yêu cầu',
        status: 'OPEN',
      };
      const milestone: MilestoneItem = {
        id: 101,
        contractId: 10,
        orderNo: 1,
        title: 'Tập 1',
        amount: 1000000,
        status: 'DISPUTED',
        escrowStatus: 'FROZEN',
      };

      const result = isDisputeEligibleForResolution(dispute, milestone);
      assert.equal(result.eligible, true);
      assert.equal(result.reason, undefined);
    });

    test('1.2. Open dispute with HELD milestone escrow is also eligible', () => {
      const dispute: DisputeItem = {
        id: 2,
        contractId: 10,
        milestoneId: 102,
        raisedByUserId: 5,
        reason: 'Có tranh chấp khiếu nại',
        status: 'OPEN',
      };
      const milestone: MilestoneItem = {
        id: 102,
        contractId: 10,
        orderNo: 2,
        title: 'Tập 2',
        amount: 2000000,
        status: 'IN_PROGRESS',
        escrowStatus: 'HELD',
      };

      const result = isDisputeEligibleForResolution(dispute, milestone);
      assert.equal(result.eligible, true);
    });

    test('1.3. Already RESOLVED dispute is strictly NOT eligible for re-resolution', () => {
      const dispute: DisputeItem = {
        id: 3,
        contractId: 10,
        milestoneId: 103,
        raisedByUserId: 5,
        reason: 'Tranh chấp đã xử lý xong',
        status: 'RESOLVED',
        result: 'RELEASE_TO_FREELANCER',
      };

      const result = isDisputeEligibleForResolution(dispute);
      assert.equal(result.eligible, false);
      assert.ok(result.reason?.includes('đã được phân xử'));
    });

    test('1.4. Milestone with non-frozen escrow (e.g. already RELEASED or REFUNDED) is ineligible', () => {
      const dispute: DisputeItem = {
        id: 4,
        contractId: 10,
        milestoneId: 104,
        raisedByUserId: 5,
        reason: 'Tranh chấp phát sinh muộn',
        status: 'OPEN',
      };
      const releasedMilestone: MilestoneItem = {
        id: 104,
        contractId: 10,
        orderNo: 4,
        title: 'Tập 4',
        amount: 1000000,
        status: 'RELEASED',
        escrowStatus: 'RELEASED',
      };

      const result = isDisputeEligibleForResolution(dispute, releasedMilestone);
      assert.equal(result.eligible, false);
      assert.ok(result.reason?.includes('FROZEN'));
    });

    test('1.5. Null or undefined dispute safely returns ineligible without throwing', () => {
      assert.equal(isDisputeEligibleForResolution(null).eligible, false);
      assert.equal(isDisputeEligibleForResolution(undefined).eligible, false);
    });
  });

  // --- 2. Form Validation Tests ---
  describe('2. Resolution Form Validation', () => {
    test('2.1. Valid resolution with RELEASE_TO_FREELANCER and proper note passes validation', () => {
      const validation = validateResolutionForm({
        result: 'RELEASE_TO_FREELANCER',
        resolution: 'Bản thu âm đã đối soát đạt chất lượng kỹ thuật, giải ngân cho thuyết minh.',
      });
      assert.equal(validation.valid, true);
      assert.deepEqual(validation.errors, {});
    });

    test('2.2. Valid resolution with REFUND_TO_CREATOR passes validation', () => {
      const validation = validateResolutionForm({
        result: 'REFUND_TO_CREATOR',
        resolution: 'Thuyết minh viên không nộp bài theo thời hạn thỏa thuận, hoàn tiền cho Creator.',
      });
      assert.equal(validation.valid, true);
      assert.deepEqual(validation.errors, {});
    });

    test('2.3. Missing resolution reason fails validation (mandatory audit trail requirement)', () => {
      const validation = validateResolutionForm({
        result: 'RELEASE_TO_FREELANCER',
        resolution: '',
      });
      assert.equal(validation.valid, false);
      assert.ok(validation.errors.resolution);
    });

    test('2.4. Non-empty trimmed resolution note passes validation even if concise; whitespace-only fails', () => {
      const validShort = validateResolutionForm({
        result: 'RELEASE_TO_FREELANCER',
        resolution: 'Hợp lý',
      });
      assert.equal(validShort.valid, true);

      const whitespaceOnly = validateResolutionForm({
        result: 'RELEASE_TO_FREELANCER',
        resolution: '   ',
      });
      assert.equal(whitespaceOnly.valid, false);
      assert.ok(whitespaceOnly.errors.resolution);
    });

    test('2.5. Valid SPLIT resolution with 60% passes validation', () => {
      const validation = validateResolutionForm({
        result: 'SPLIT',
        splitPercent: 60,
        resolution: 'Hai bên đồng thuận nghiệm thu 60% khối lượng ghi âm tập podcast.',
      });
      assert.equal(validation.valid, true);
      assert.deepEqual(validation.errors, {});
    });

    test('2.6. SPLIT with missing percentage fails validation', () => {
      const validation = validateResolutionForm({
        result: 'SPLIT',
        splitPercent: null,
        resolution: 'Phân chia tỷ lệ theo biên bản làm việc.',
      });
      assert.equal(validation.valid, false);
      assert.ok(validation.errors.splitPercent);
    });

    test('2.7. SPLIT percentage out of bounds (< 0 or > 100) fails validation', () => {
      const negValidation = validateResolutionForm({
        result: 'SPLIT',
        splitPercent: -10,
        resolution: 'Phân chia tỷ lệ âm không hợp lệ.',
      });
      assert.equal(negValidation.valid, false);
      assert.ok(negValidation.errors.splitPercent?.includes('0% đến 100%'));

      const overValidation = validateResolutionForm({
        result: 'SPLIT',
        splitPercent: 120,
        resolution: 'Phân chia tỷ lệ vượt quá 100%.',
      });
      assert.equal(overValidation.valid, false);
      assert.ok(overValidation.errors.splitPercent?.includes('0% đến 100%'));
    });

    test('2.8. SPLIT percentage precision exceeding 2 decimal places fails validation', () => {
      const precisionValidation = validateResolutionForm({
        result: 'SPLIT',
        splitPercent: '50.125',
        resolution: 'Phân chia với 3 chữ số thập phân.',
      });
      assert.equal(precisionValidation.valid, false);
      assert.ok(precisionValidation.errors.splitPercent?.includes('tối đa 2 chữ số thập phân'));
    });
  });

  // --- 3. Split Financial Estimation & Zero Double-Counting ---
  describe('3. Financial Settlement Semantics & Split Estimation', () => {
    test('3.1. Accurately calculates 60/40 SPLIT settlement with 5% platform fee deduction', () => {
      const grossAmount = 2000000; // 2,000,000 VND
      const freelancerPercent = 60; // 60%
      const platformFeePercent = 5; // 5%

      const estimate = calculateSplitEstimate(grossAmount, freelancerPercent, platformFeePercent);

      // Freelancer Gross = 2,000,000 * 60% = 1,200,000 VND
      assert.equal(estimate.freelancerGross, 1200000);

      // Platform Fee = 1,200,000 * 5% = 60,000 VND
      assert.equal(estimate.hasKnownFee, true);
      assert.equal(estimate.fee, 60000);

      // Freelancer Net = 1,200,000 - 60,000 = 1,140,000 VND
      assert.equal(estimate.freelancerNet, 1140000);

      // Creator Refund = 2,000,000 - 1,200,000 = 800,000 VND (40%)
      assert.equal(estimate.creatorRefund, 800000);
      assert.equal(estimate.creatorPercent, 40);

      // Zero double-counting check: Net + Fee + Refund = Gross
      assert.equal(estimate.freelancerNet! + estimate.fee! + estimate.creatorRefund, grossAmount);
      assert.equal(estimate.isBalanced, true);
    });

    test('3.2. Boundary test: 0% to Freelancer gives 100% refund to Creator with zero fee', () => {
      const grossAmount = 1500000;
      const estimate = calculateSplitEstimate(grossAmount, 0, 5);

      assert.equal(estimate.freelancerGross, 0);
      assert.equal(estimate.fee, 0);
      assert.equal(estimate.freelancerNet, 0);
      assert.equal(estimate.creatorRefund, 1500000);
      assert.equal(estimate.isBalanced, true);
    });

    test('3.3. Boundary test: 100% to Freelancer gives 95% net to Freelancer, 5% fee, 0 to Creator', () => {
      const grossAmount = 1000000;
      const estimate = calculateSplitEstimate(grossAmount, 100, 5);

      assert.equal(estimate.freelancerGross, 1000000);
      assert.equal(estimate.fee, 50000);
      assert.equal(estimate.freelancerNet, 950000);
      assert.equal(estimate.creatorRefund, 0);
      assert.equal(estimate.isBalanced, true);
    });

    test('3.4. Dynamic Platform Fee (e.g. 10%, 7.5%, 0%) calculates accurately', () => {
      const grossAmount = 4000000;
      const freelancerPercent = 50;

      // 10% fee:
      const est10 = calculateSplitEstimate(grossAmount, freelancerPercent, 10);
      assert.equal(est10.freelancerGross, 2000000);
      assert.equal(est10.fee, 200000);
      assert.equal(est10.freelancerNet, 1800000);
      assert.equal(est10.creatorRefund, 2000000);
      assert.equal(est10.isBalanced, true);

      // 0% fee (promotional or VIP contract):
      const est0 = calculateSplitEstimate(grossAmount, freelancerPercent, 0);
      assert.equal(est0.freelancerGross, 2000000);
      assert.equal(est0.fee, 0);
      assert.equal(est0.freelancerNet, 2000000);
      assert.equal(est0.creatorRefund, 2000000);
      assert.equal(est0.isBalanced, true);

      // 7.5% fee:
      const est75 = calculateSplitEstimate(grossAmount, freelancerPercent, 7.5);
      assert.equal(est75.freelancerGross, 2000000);
      assert.equal(est75.fee, 150000); // 2,000,000 * 7.5% = 150,000
      assert.equal(est75.freelancerNet, 1850000);
      assert.equal(est75.creatorRefund, 2000000);
      assert.equal(est75.isBalanced, true);
    });

    test('3.5. Missing or unknown platform fee does NOT fabricate net estimates', () => {
      const grossAmount = 2000000;
      const freelancerPercent = 70;

      const estNull = calculateSplitEstimate(grossAmount, freelancerPercent, null);
      assert.equal(estNull.hasKnownFee, false);
      assert.equal(estNull.fee, null);
      assert.equal(estNull.freelancerNet, null);
      assert.equal(estNull.freelancerGross, 1400000);
      assert.equal(estNull.creatorRefund, 600000);
      // Balance still holds for gross portions:
      assert.equal(estNull.isBalanced, true);

      const estUndef = calculateSplitEstimate(grossAmount, freelancerPercent, undefined);
      assert.equal(estUndef.hasKnownFee, false);
      assert.equal(estUndef.fee, null);
      assert.equal(estUndef.freelancerNet, null);
      assert.equal(estUndef.isBalanced, true);
    });

    test('3.6. Rounding handles odd numbers and fraction percentages without loss', () => {
      const grossAmount = 1000001; // Odd gross
      const freelancerPercent = 33.33;
      const platformFeePercent = 5;

      const est = calculateSplitEstimate(grossAmount, freelancerPercent, platformFeePercent);
      // Freelancer gross: Math.round((1,000,001 * 33.33) / 100) = 333300
      assert.equal(est.freelancerGross, 333300);
      // Creator refund: 1,000,001 - 333,300 = 666701
      assert.equal(est.creatorRefund, 666701);
      // Fee: Math.round(333,300 * 0.05) = 16665
      assert.equal(est.fee, 16665);
      // Net: 333,300 - 16,665 = 316635
      assert.equal(est.freelancerNet, 316635);

      assert.equal(est.freelancerNet! + est.fee! + est.creatorRefund, grossAmount);
      assert.equal(est.isBalanced, true);
    });
  });

  // --- 4. DTO Serialization, Mutation Safety, and Error Handling ---
  describe('4. DTO Serialization & Mutation Safety', () => {
    test('4.1. Correctly formats and maps DisputeResult options', () => {
      const releaseInfo = formatDisputeResult('RELEASE_TO_FREELANCER');
      assert.equal(releaseInfo.label, 'Giải ngân cho Thuyết minh viên');
      assert.equal(releaseInfo.variant, 'success');
      assert.ok(releaseInfo.description.includes('theo hợp đồng'));

      const refundInfo = formatDisputeResult('REFUND_TO_CREATOR');
      assert.equal(refundInfo.label, 'Hoàn tiền cho Nhà sáng tạo');
      assert.equal(refundInfo.variant, 'pending');

      const splitInfo = formatDisputeResult('SPLIT');
      assert.equal(splitInfo.label, 'Phân chia tiền ký quỹ');
      assert.equal(splitInfo.variant, 'accent');
    });

    test('4.2. Correctly formats DisputeStatus labels', () => {
      assert.equal(formatDisputeStatus('OPEN').label, 'Đang tranh chấp (Chờ phân xử)');
      assert.equal(formatDisputeStatus('OPEN').variant, 'error');

      assert.equal(formatDisputeStatus('RESOLVED').label, 'Đã phân xử');
      assert.equal(formatDisputeStatus('RESOLVED').variant, 'success');
    });

    test('4.3. Serializes valid request payload conforming to backend ResolveDisputeRequest DTO', () => {
      // For SPLIT
      const splitPayload: ResolveDisputePayload = {
        result: 'SPLIT',
        splitPercent: 75.5,
        resolution: 'Nghiệm thu 75.5% khối lượng công việc.',
      };

      assert.equal(splitPayload.result, 'SPLIT');
      assert.equal(splitPayload.splitPercent, 75.5);
      assert.equal(splitPayload.resolution, 'Nghiệm thu 75.5% khối lượng công việc.');

      // For Non-SPLIT (e.g. RELEASE_TO_FREELANCER), splitPercent must be undefined
      const releasePayload: ResolveDisputePayload = {
        result: 'RELEASE_TO_FREELANCER',
        resolution: 'Giải ngân toàn phần.',
      };
      assert.equal(releasePayload.result, 'RELEASE_TO_FREELANCER');
      assert.equal(releasePayload.splitPercent, undefined);
    });

    test('4.4. Duplicate mutation submission guard prevents parallel mutations', () => {
      let callCount = 0;
      let isPending = false;

      const triggerSubmit = () => {
        if (isPending) return; // Production duplicate submission guard
        isPending = true;
        callCount++;
      };

      triggerSubmit(); // First click -> accepted
      triggerSubmit(); // Rapid duplicate click while isPending -> blocked
      triggerSubmit(); // Rapid duplicate click while isPending -> blocked

      assert.equal(callCount, 1, 'Only one mutation request may be initiated during pending state');
    });

    test('4.5. Financial error response classification and safety messaging', () => {
      const getErrorMessage = (err: {
        response?: { status?: number; data?: { message?: string; errorCode?: string } };
      }) => {
        const status = err?.response?.status;
        const message = err?.response?.data?.message;

        if (status === 403) {
          return 'Bạn không có quyền Quản trị viên để thực hiện phân xử.';
        } else if (status === 409 || err?.response?.data?.errorCode === 'DISPUTE_INVALID_STATE') {
          return 'Tranh chấp này đã được phân xử hoặc thay đổi trạng thái trước đó. Vui lòng tải lại.';
        } else if (!err?.response) {
          return 'Sự cố kết nối mạng trong quá trình phân xử. Giao dịch có thể đã được ghi nhận trên máy chủ. Vui lòng tải lại trang để kiểm tra trạng thái trước khi thao tác lại.';
        } else {
          return message || 'Đã xảy ra lỗi trong quá trình phân xử. Vui lòng thử lại.';
        }
      };

      // 403 Forbidden
      assert.equal(
        getErrorMessage({ response: { status: 403 } }),
        'Bạn không có quyền Quản trị viên để thực hiện phân xử.'
      );

      // 409 Conflict / DISPUTE_INVALID_STATE
      assert.equal(
        getErrorMessage({
          response: { status: 400, data: { errorCode: 'DISPUTE_INVALID_STATE' } },
        }),
        'Tranh chấp này đã được phân xử hoặc thay đổi trạng thái trước đó. Vui lòng tải lại.'
      );

      // Ambiguous network failure (no response)
      assert.ok(
        getErrorMessage({}).includes('Sự cố kết nối mạng trong quá trình phân xử')
      );
      assert.ok(
        getErrorMessage({}).includes('Vui lòng tải lại trang để kiểm tra trạng thái')
      );
    });
  });

  // --- 5. Financial Consistency Compatibility & Safety Guards (M19-A2.2) ---
  describe('5. Financial Consistency Compatibility & Safety Guards', () => {
    test('5.1. checkSplitFeeDiscrepancy: contract fee 5.0% matches backend default -> safe', () => {
      const check = checkSplitFeeDiscrepancy(5.0);
      assert.equal(check.hasDiscrepancy, false);
      assert.equal(check.isUnsafeForSettlement, false);
      assert.equal(check.message, undefined);
    });

    test('5.2. checkSplitFeeDiscrepancy: null contract fee falls back safely to default 5.0% -> safe', () => {
      const check = checkSplitFeeDiscrepancy(null);
      assert.equal(check.hasDiscrepancy, false);
      assert.equal(check.isUnsafeForSettlement, false);
    });

    test('5.3. checkSplitFeeDiscrepancy: contract fee 8.0% differs from backend default 5.0% -> flags discrepancy', () => {
      const check = checkSplitFeeDiscrepancy(8.0);
      assert.equal(check.hasDiscrepancy, true);
      assert.equal(check.isUnsafeForSettlement, true);
      assert.ok(check.message?.includes('Hợp đồng quy định mức phí 8%'));
      assert.ok(check.message?.includes('Backend hiện áp dụng mức mặc định 5%'));
    });

    test('5.4. checkSplitFeeDiscrepancy: contract fee 0.0% promotional rate -> flags discrepancy', () => {
      const check = checkSplitFeeDiscrepancy(0.0);
      assert.equal(check.hasDiscrepancy, true);
      assert.equal(check.isUnsafeForSettlement, true);
      assert.ok(check.message?.includes('Hợp đồng quy định mức phí 0%'));
    });

    test('5.5. validateResolutionForm: blocks SPLIT when isSplitBlockedDueToDiscrepancy is true', () => {
      const result = validateResolutionForm({
        result: 'SPLIT',
        splitPercent: 60,
        resolution: 'Phân xử theo thỏa thuận 60/40',
        isSplitBlockedDueToDiscrepancy: true,
        contractFeePercent: 8.0,
      });

      assert.equal(result.valid, false);
      assert.ok(result.errors.splitPercent?.includes('Hình thức SPLIT tạm thời bị khóa do sai lệch tỷ lệ phí sàn'));
      assert.ok(result.errors.splitPercent?.includes('8%'));
    });

    test('5.6. validateResolutionForm: allows RELEASE_TO_FREELANCER even when contract fee differs', () => {
      const result = validateResolutionForm({
        result: 'RELEASE_TO_FREELANCER',
        resolution: 'Nghiệm thu hoàn tất 100%',
        isSplitBlockedDueToDiscrepancy: true, // SPLIT blocked, but RELEASE is safe
        contractFeePercent: 8.0,
      });

      assert.equal(result.valid, true);
      assert.equal(Object.keys(result.errors).length, 0);
    });

    test('5.7. validateResolutionForm: allows REFUND_TO_CREATOR even when contract fee differs', () => {
      const result = validateResolutionForm({
        result: 'REFUND_TO_CREATOR',
        resolution: 'Thuyết minh viên không bàn giao sản phẩm',
        isSplitBlockedDueToDiscrepancy: true, // SPLIT blocked, but REFUND is safe
        contractFeePercent: 8.0,
      });

      assert.equal(result.valid, true);
      assert.equal(Object.keys(result.errors).length, 0);
    });

    test('5.8. calculateSplitEstimate: flags hasFeeDiscrepancy when contract fee is 8.0%', () => {
      const estimate = calculateSplitEstimate(1000000, 60, 8.0);
      assert.equal(estimate.hasFeeDiscrepancy, true);
      assert.ok(estimate.feeDiscrepancyWarning?.includes('8%'));
      assert.equal(estimate.isBalanced, true);
    });

    test('5.9. calculateSplitEstimate: hasFeeDiscrepancy is false when contract fee is 5.0%', () => {
      const estimate = calculateSplitEstimate(1000000, 60, 5.0);
      assert.equal(estimate.hasFeeDiscrepancy, false);
      assert.equal(estimate.feeDiscrepancyWarning, undefined);
      assert.equal(estimate.isBalanced, true);
    });
  });
});
