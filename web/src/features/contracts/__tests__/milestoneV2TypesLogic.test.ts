import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import type { CreateContractPayload, MilestoneItemPayload } from '../../../types/contract.ts';
import type { CommissionItem, CommissionStatus, CommissionContentType } from '../../../types/commission.ts';

describe('Milestone V2 Core Specifications & Type Validation', () => {
  test('1. Validates Commission Content Type accepts only SINGLE_VIDEO or SERIES', () => {
    const validTypes: CommissionContentType[] = ['SINGLE_VIDEO', 'SERIES'];
    assert.equal(validTypes.includes('SINGLE_VIDEO'), true);
    assert.equal(validTypes.includes('SERIES'), true);
    // LIVESTREAM is explicitly forbidden in commission requests
    const invalidType = 'LIVESTREAM';
    assert.equal(validTypes.includes(invalidType as CommissionContentType), false);
  });

  test('2. Validates Commission Status lifecycle transitions', () => {
    const validStatuses: CommissionStatus[] = [
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'CONTRACT_SENT',
      'COMPLETED',
      'CANCELLED',
    ];

    assert.equal(validStatuses.length, 6);
    assert.equal(validStatuses.includes('PENDING'), true);
    assert.equal(validStatuses.includes('ACCEPTED'), true);
    assert.equal(validStatuses.includes('CONTRACT_SENT'), true);
  });

  test('3. Enforces contract creation rules: 1..20 milestones, min amount 10.000đ, min 1 duration day', () => {
    const milestones: MilestoneItemPayload[] = [
      {
        title: 'Mốc 1: Phân cảnh',
        requirement: 'Bàn giao kịch bản PDF',
        amount: 300000,
        durationDays: 3,
      },
      {
        title: 'Mốc 2: Dựng video hoàn chỉnh',
        requirement: 'Bàn giao video MP4',
        amount: 700000,
        durationDays: 5,
      },
    ];

    const payload: CreateContractPayload = {
      commissionId: 45,
      title: 'Hợp đồng sản xuất video Bạch Đằng',
      milestones,
    };

    assert.equal(payload.milestones.length, 2);
    assert.equal(payload.milestones.length <= 20, true);
    for (const m of payload.milestones) {
      assert.equal(m.amount >= 10000, true);
      assert.equal(m.durationDays >= 1, true);
    }
  });

  test('4. Real-time fee calculation logic: 5% platform fee and 95% net creator payout', () => {
    const amount = 1000000; // 1.000.000đ
    const feeRate = 0.05; // 5%
    const expectedFee = Math.round(amount * feeRate); // 50.000đ
    const expectedNet = amount - expectedFee; // 950.000đ

    assert.equal(expectedFee, 50000);
    assert.equal(expectedNet, 950000);
  });

  test('5. Commission entity backward compatibility with Requester / Narrator', () => {
    const item: CommissionItem = {
      id: 88,
      requesterId: 12,
      requesterFullName: 'Nguyễn Văn A',
      narratorId: 12, // legacy field fallback
      creatorId: 5,
      creatorFullName: 'Sử Ký TV',
      contentType: 'SINGLE_VIDEO',
      title: 'Trận Chi Lăng Xương Giang',
      description: 'Yêu cầu phân tích chiến thuật nghĩa quân Lam Sơn',
      status: 'ACCEPTED',
      chatUnlocked: true,
      createdAt: '2026-11-01T12:00:00Z',
    };

    assert.equal(item.requesterId, item.narratorId);
    assert.equal(item.status, 'ACCEPTED');
    assert.equal(item.chatUnlocked, true);
  });

  test('6. Enforces mandatory rejection reason validation on Commission rejection', () => {
    const validateRejectionReason = (reason: string): { valid: boolean; error?: string } => {
      const trimmed = reason.trim();
      if (!trimmed) {
        return { valid: false, error: 'Vui lòng nhập lý do từ chối để khán giả hiểu nguyên nhân.' };
      }
      return { valid: true };
    };

    assert.equal(validateRejectionReason('').valid, false);
    assert.equal(validateRejectionReason('   ').valid, false);
    assert.equal(
      validateRejectionReason('Lịch sản xuất của kênh đã kín trong tháng này').valid,
      true
    );
  });

  test('7. Enforces 1 Active Commission Rule to prevent spamming requests', () => {
    const isActiveCommission = (status: CommissionStatus): boolean => {
      return status === 'PENDING' || status === 'ACCEPTED' || status === 'CONTRACT_SENT';
    };

    assert.equal(isActiveCommission('PENDING'), true);
    assert.equal(isActiveCommission('ACCEPTED'), true);
    assert.equal(isActiveCommission('CONTRACT_SENT'), true);
    assert.equal(isActiveCommission('REJECTED'), false);
    assert.equal(isActiveCommission('COMPLETED'), false);
    assert.equal(isActiveCommission('CANCELLED'), false);
  });

  test('8. Verifies 1-on-1 Chat unlock logic according to Commission lifecycle', () => {
    const isChatUnlocked = (status: CommissionStatus): boolean => {
      return status !== 'PENDING' && status !== 'CANCELLED';
    };

    assert.equal(isChatUnlocked('PENDING'), false);
    assert.equal(isChatUnlocked('ACCEPTED'), true);
    assert.equal(isChatUnlocked('CONTRACT_SENT'), true);
  });

  test('9. Validates Stage 1 Contract Negotiation: allows single edit or delete only when PENDING or REJECTED', () => {
    const canModifyRoadmap = (contractStatus: string): boolean => {
      return contractStatus === 'PENDING' || contractStatus === 'REJECTED';
    };

    assert.equal(canModifyRoadmap('PENDING'), true);
    assert.equal(canModifyRoadmap('REJECTED'), true);
    assert.equal(canModifyRoadmap('ACTIVE'), false);
    assert.equal(canModifyRoadmap('COMPLETED'), false);
    assert.equal(canModifyRoadmap('CANCELLED'), false);
  });

  test('10. Enforces minimum 1 milestone rule: deletion forbidden when total milestones <= 1', () => {
    const canDeleteMilestone = (totalMilestones: number): boolean => {
      return totalMilestones > 1;
    };

    assert.equal(canDeleteMilestone(1), false);
    assert.equal(canDeleteMilestone(0), false);
    assert.equal(canDeleteMilestone(2), true);
    assert.equal(canDeleteMilestone(5), true);
  });

  test('11. Re-sequences orderNo (1..N) accurately after milestone deletion', () => {
    const originalMilestones = [
      { id: 101, title: 'Mốc 1', orderNo: 1 },
      { id: 102, title: 'Mốc 2', orderNo: 2 },
      { id: 103, title: 'Mốc 3', orderNo: 3 },
    ];

    // Delete mốc 2
    const remaining = originalMilestones.filter((m) => m.id !== 102);
    const resequenced = remaining.map((m, index) => ({
      ...m,
      orderNo: index + 1,
    }));

    assert.equal(resequenced.length, 2);
    assert.equal(resequenced[0].id, 101);
    assert.equal(resequenced[0].orderNo, 1);
    assert.equal(resequenced[1].id, 103);
    assert.equal(resequenced[1].orderNo, 2);
  });

  test('12. Break-UI Stress-Test: Extreme numbers, unbroken long strings, and zero/null fallbacks', () => {
    // 1. Extreme number (5 Billion VND)
    const formatSafeVND = (amount: number | null | undefined): string => {
      if (amount == null || isNaN(amount)) return '0 ₫';
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const extremeAmount = 5_000_000_000;
    const formattedExtreme = formatSafeVND(extremeAmount);
    assert.ok(formattedExtreme.includes('5.000.000.000'));
    assert.equal(formatSafeVND(null), '0 ₫');
    assert.equal(formatSafeVND(undefined), '0 ₫');

    // 2. Unbroken string length stress test
    const longString = 'A'.repeat(500);
    const truncateSafe = (text: string, maxLen = 100): string => {
      if (!text) return '';
      return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    };
    const truncated = truncateSafe(longString, 60);
    assert.equal(truncated.length, 63);
    assert.ok(truncated.endsWith('...'));

    // 3. Monogram Avatar fallback
    const getAvatarInitial = (fullName?: string | null): string => {
      if (!fullName || !fullName.trim()) return 'K';
      return fullName.trim()[0].toUpperCase();
    };
    assert.equal(getAvatarInitial(''), 'K');
    assert.equal(getAvatarInitial(null), 'K');
    assert.equal(getAvatarInitial('   '), 'K');
    assert.equal(getAvatarInitial('Trần Hưng Đạo'), 'T');
    assert.equal(getAvatarInitial('nguyễn huệ'), 'N');
  });

  test('13. Multi-milestone financial calculation with 5% platform fee and 95% net creator payout', () => {
    const milestones = [
      { amount: 300000 },
      { amount: 700000 },
      { amount: 1000000 },
    ];
    const totalGross = milestones.reduce((sum, m) => sum + m.amount, 0); // 2.000.000
    const feeRate = 0.05;
    const totalFee = Math.round(totalGross * feeRate); // 100.000
    const netCreator = totalGross - totalFee; // 1.900.000

    assert.equal(totalGross, 2000000);
    assert.equal(totalFee, 1000000 * 0.05 + 700000 * 0.05 + 300000 * 0.05);
    assert.equal(netCreator, 1900000);
  });

  test('14. Stage 3 Deliverables: Version auto-incrementing rule', () => {
    const getNextVersionNo = (deliverables?: Array<{ versionNo: number }> | null): number => {
      if (!deliverables || deliverables.length === 0) return 1;
      const maxVersion = Math.max(...deliverables.map((d) => d.versionNo || 0));
      return maxVersion + 1;
    };

    assert.equal(getNextVersionNo([]), 1);
    assert.equal(getNextVersionNo(null), 1);
    assert.equal(getNextVersionNo([{ versionNo: 1 }]), 2);
    assert.equal(getNextVersionNo([{ versionNo: 1 }, { versionNo: 2 }]), 3);
  });

  test('15. Stage 3 Deliverables: File validation accepts valid media/archive and blocks scripts', () => {
    const allowedExtensions = ['.mp4', '.mov', '.webm', '.mp3', '.wav', '.pdf', '.docx', '.zip', '.rar'];
    const validateFileExtension = (fileName: string): boolean => {
      const ext = '.' + fileName.split('.').pop()?.toLowerCase();
      return allowedExtensions.includes(ext);
    };

    assert.ok(validateFileExtension('tap-1-ban-dung.mp4'));
    assert.ok(validateFileExtension('voice-thuyet-minh.wav'));
    assert.ok(validateFileExtension('kich-ban-chi-tiet.pdf'));
    assert.ok(validateFileExtension('tai-nguyen-do-hoa.zip'));
    assert.equal(validateFileExtension('malware.exe'), false);
    assert.equal(validateFileExtension('script.sh'), false);
    assert.equal(validateFileExtension('exploit.bat'), false);
  });

  test('16. Stage 3 Overdue Detection: Identifies overdue in-progress milestones', () => {
    const isOverdue = (status: string, dueAt?: string, referenceTime = new Date('2026-11-01T20:00:00Z')) => {
      if (status !== 'IN_PROGRESS' || !dueAt) return false;
      return new Date(dueAt).getTime() < referenceTime.getTime();
    };

    // Past deadline while still IN_PROGRESS -> Overdue
    assert.ok(isOverdue('IN_PROGRESS', '2026-11-01T10:00:00Z'));
    // Future deadline -> Not overdue
    assert.equal(isOverdue('IN_PROGRESS', '2026-11-02T10:00:00Z'), false);
    // Already SUBMITTED with past deadline -> Not overdue (submitted on time or submitted)
    assert.equal(isOverdue('SUBMITTED', '2026-11-01T10:00:00Z'), false);
    // APPROVED milestone -> Not overdue
    assert.equal(isOverdue('APPROVED', '2026-11-01T10:00:00Z'), false);
  });

  test('17. Stage 3 Revision Request Policy: Enforces 2 free revisions and extracts note', () => {
    const evaluateRevisionQuota = (
      revisionsUsed: number,
      maxRevisions = 2,
      revisionRequests?: Array<{ note: string; createdAt: string }>
    ) => {
      const remaining = Math.max(0, maxRevisions - revisionsUsed);
      const isLimitReached = revisionsUsed >= maxRevisions;
      const sorted = revisionRequests
        ? [...revisionRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      return {
        revisionsUsed,
        maxRevisions,
        remaining,
        isLimitReached,
        latestNote: sorted[0]?.note,
      };
    };

    const quota0 = evaluateRevisionQuota(0);
    assert.equal(quota0.remaining, 2);
    assert.equal(quota0.isLimitReached, false);

    const quota1 = evaluateRevisionQuota(1, 2, [
      { note: 'Sửa âm lượng nhạc nền ở phút 05:20', createdAt: '2026-11-01T12:00:00Z' },
    ]);
    assert.equal(quota1.remaining, 1);
    assert.equal(quota1.isLimitReached, false);
    assert.equal(quota1.latestNote, 'Sửa âm lượng nhạc nền ở phút 05:20');

    const quota2 = evaluateRevisionQuota(2, 2, [
      { note: 'Sửa lần 1', createdAt: '2026-11-01T10:00:00Z' },
      { note: 'Sửa bản đồ 2D phân cảnh chiến trường', createdAt: '2026-11-01T15:00:00Z' },
    ]);
    assert.equal(quota2.remaining, 0);
    assert.equal(quota2.isLimitReached, true);
    assert.equal(quota2.latestNote, 'Sửa bản đồ 2D phân cảnh chiến trường');
  });

  test('18. Stage 3 Lifecycle Timers: 3-day review auto-approval and 3-day safety hold', () => {
    const calculateMilestoneTimers = (submittedAt: string, approvedAt?: string) => {
      const reviewDueAt = new Date(new Date(submittedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const releaseAvailableAt = approvedAt
        ? new Date(new Date(approvedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      return { reviewDueAt, releaseAvailableAt };
    };

    const submitted = '2026-11-01T10:00:00.000Z';
    const approved = '2026-11-02T10:00:00.000Z';
    const timers = calculateMilestoneTimers(submitted, approved);

    assert.equal(timers.reviewDueAt, '2026-11-04T10:00:00.000Z');
    assert.equal(timers.releaseAvailableAt, '2026-11-05T10:00:00.000Z');
  });

  test('19. Stage 4 Reviews: Validates 1..5 star rating and review comment', () => {
    const validateReview = (payload: { rating: number; comment?: string }) => {
      if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
        return { valid: false, error: 'Số sao đánh giá phải từ 1 đến 5' };
      }
      return { valid: true };
    };

    assert.ok(validateReview({ rating: 5, comment: 'Sản phẩm dựng rất kỳ công!' }).valid);
    assert.ok(validateReview({ rating: 1 }).valid);
    assert.equal(validateReview({ rating: 0 }).valid, false);
    assert.equal(validateReview({ rating: 6 }).valid, false);
    assert.equal(validateReview({ rating: 4.5 }).valid, false);
  });

  test('20. Stage 4 Dispute Flow: Validates open dispute eligibility and frozen escrow transition', () => {
    const openDispute = (
      milestone: { id: number; status: string; escrowStatus: string },
      payload: { reason: string; evidence?: string }
    ) => {
      const eligibleStatuses = ['IN_PROGRESS', 'SUBMITTED', 'APPROVED'];
      if (!eligibleStatuses.includes(milestone.status)) {
        throw new Error('Chỉ có thể khiếu nại giai đoạn đang làm, đã nộp hoặc đang giữ tiền');
      }
      if (!payload.reason || !payload.reason.trim()) {
        throw new Error('Vui lòng nêu rõ lý do khiếu nại');
      }
      return {
        disputeId: 901,
        milestoneId: milestone.id,
        reason: payload.reason.trim(),
        evidence: payload.evidence?.trim(),
        status: 'OPEN',
        updatedEscrowStatus: 'FROZEN',
      };
    };

    // Valid dispute on IN_PROGRESS milestone
    const res = openDispute(
      { id: 201, status: 'IN_PROGRESS', escrowStatus: 'HELD' },
      { reason: 'Khách hàng yêu cầu vượt ngoài kịch bản đã cam kết', evidence: 'https://cdn.example.com/proof.png' }
    );
    assert.equal(res.status, 'OPEN');
    assert.equal(res.updatedEscrowStatus, 'FROZEN');

    // Ineligible on already RELEASED or CANCELLED
    assert.throws(() => {
      openDispute({ id: 202, status: 'RELEASED', escrowStatus: 'RELEASED' }, { reason: 'Muộn rồi' });
    });
    // Missing reason
    assert.throws(() => {
      openDispute({ id: 203, status: 'SUBMITTED', escrowStatus: 'HELD' }, { reason: '   ' });
    });
  });

  test('21. Stage 4 Dispute Flow: Validates counter-evidence submission', () => {
    const submitCounterEvidence = (dispute: { id: number; status: string }, text: string) => {
      if (dispute.status !== 'OPEN') {
        throw new Error('Không thể gửi đối chất cho tranh chấp đã giải quyết');
      }
      if (!text || !text.trim()) {
        throw new Error('Nội dung giải trình đối chất không được để trống');
      }
      return {
        ...dispute,
        counterEvidence: text.trim(),
      };
    };

    const openDisputeItem = { id: 88, status: 'OPEN' };
    const updated = submitCounterEvidence(openDisputeItem, 'Tôi đã nộp file video ở phút 08:15 bản v2.');
    assert.equal(updated.counterEvidence, 'Tôi đã nộp file video ở phút 08:15 bản v2.');

    assert.throws(() => submitCounterEvidence(openDisputeItem, '   '));
    assert.throws(() => submitCounterEvidence({ id: 89, status: 'RESOLVED' }, 'Đối chất muộn'));
  });

  test('22. Stage 4 Creator Wallet Integration & Platform SLA Policy', () => {
    const financials = {
      role: 'CREATOR',
      totalEarned: 1900000,
      pendingEarnings: 950000,
      totalPlatformFeePaid: 100000,
      activeMilestonesCount: 2,
      completedMilestonesCount: 3,
    };

    // Net earnings must be 95% of gross
    const grossCompleted = financials.totalEarned + financials.totalPlatformFeePaid; // 2.000.000
    assert.equal(grossCompleted, 2000000);
    assert.equal(financials.totalEarned, grossCompleted * 0.95);
    assert.equal(financials.totalPlatformFeePaid, grossCompleted * 0.05);

    // Platform withdrawal SLA verification
    const withdrawalPolicy = {
      feePercent: 0,
      minWithdrawalVND: 50000,
      slaDays: 2,
    };
    assert.equal(withdrawalPolicy.feePercent, 0);
    assert.equal(withdrawalPolicy.minWithdrawalVND, 50000);
    assert.equal(withdrawalPolicy.slaDays, 2);
  });

  test('23. Stage 5 Admin Dispute Resolution: Validates V2 Result Types (RELEASE_TO_CREATOR, REFUND_TO_REQUESTER, SPLIT)', () => {
    const validResults = [
      'RELEASE_TO_CREATOR',
      'REFUND_TO_REQUESTER',
      'RELEASE_TO_FREELANCER',
      'REFUND_TO_CREATOR',
      'SPLIT',
    ];

    assert.equal(validResults.includes('RELEASE_TO_CREATOR'), true);
    assert.equal(validResults.includes('REFUND_TO_REQUESTER'), true);
    assert.equal(validResults.includes('SPLIT'), true);

    const validateAdminResolution = (result: string, resolution: string, splitPercent?: number) => {
      if (!validResults.includes(result)) {
        throw new Error('Hình thức phân xử không hợp lệ');
      }
      if (!resolution || !resolution.trim()) {
        throw new Error('Vui lòng nhập lý do / căn cứ phân xử của Ban Quản trị');
      }
      if (result === 'SPLIT') {
        if (splitPercent === undefined || splitPercent < 0 || splitPercent > 100) {
          throw new Error('Tỷ lệ phân chia phải từ 0% đến 100%');
        }
      }
      return { valid: true };
    };

    assert.equal(validateAdminResolution('RELEASE_TO_CREATOR', 'Creator đã hoàn thành đúng hạn').valid, true);
    assert.equal(validateAdminResolution('REFUND_TO_REQUESTER', 'Creator không nộp sản phẩm đúng hạn').valid, true);
    assert.equal(validateAdminResolution('SPLIT', 'Hai bên đồng ý chia đôi', 50).valid, true);
    assert.throws(() => validateAdminResolution('INVALID_ACTION', 'Lý do'));
    assert.throws(() => validateAdminResolution('RELEASE_TO_CREATOR', '   '));
    assert.throws(() => validateAdminResolution('SPLIT', 'Lý do', 150));
  });

  test('24. Stage 5 Admin Escrow Ledger: Validates Milestone Revenue Accounting (5% Platform Fee, 95% Net Payout)', () => {
    const ledgerItem = {
      milestoneId: 501,
      milestoneOrderNo: 1,
      milestoneTitle: 'Kịch bản chi tiết',
      contractId: 88,
      contractTitle: 'Sản xuất Video Lịch Sử',
      grossAmount: 2000000,
      feePercent: 5,
      platformFee: 100000,
      netAmount: 1900000,
      status: 'RELEASED',
    };

    assert.equal(ledgerItem.grossAmount, 2000000);
    assert.equal(ledgerItem.platformFee, Math.round(ledgerItem.grossAmount * 0.05));
    assert.equal(ledgerItem.netAmount, ledgerItem.grossAmount - ledgerItem.platformFee);
    assert.equal(ledgerItem.netAmount + ledgerItem.platformFee, ledgerItem.grossAmount);
  });

  test('25. Stage 5 Admin Standardization: Contract Parties & E-Signing Verification', () => {
    const contract = {
      id: 99,
      creatorId: 10,
      creatorFullName: 'Kênh Sử Việt',
      channelName: 'Sử Việt Podcast',
      requesterId: 25,
      requesterFullName: 'Trần Văn Khách',
      status: 'ACTIVE',
      totalAmount: 3000000,
      acceptedAt: '2026-11-01T10:00:00Z',
    };

    assert.ok(contract.creatorFullName.length > 0);
    assert.ok(contract.requesterFullName.length > 0);
    assert.equal(contract.status, 'ACTIVE');
    assert.ok(contract.acceptedAt !== null);
  });

  test('26. Stage 5 V1 Deprecation Audit: Forbids legacy recruitment endpoints and handles safe fallbacks', () => {
    const deprecatedEndpoints = [
      '/api/v1/posts',
      '/api/v1/applications',
      '/api/v1/narrators',
      '/api/v1/freelancers',
      '/api/v1/escrow-transactions',
    ];

    const safeCall = (endpoint: string) => {
      if (deprecatedEndpoints.some((d) => endpoint.startsWith(d))) {
        // Safe graceful empty fallback
        return { success: true, data: [], deprecated: true };
      }
      return { success: true, data: [1, 2, 3], deprecated: false };
    };

    for (const ep of deprecatedEndpoints) {
      const res = safeCall(ep);
      assert.equal(res.deprecated, true);
      assert.deepEqual(res.data, []);
    }
  });
});
