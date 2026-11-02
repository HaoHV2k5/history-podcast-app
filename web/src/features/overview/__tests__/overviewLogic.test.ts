import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getInitials,
  getAvatarColor,
  formatMaskedAccountNumber,
  getModerationStatusBadge,
  getKycStatusBadge,
  getWithdrawalStatusBadge,
  buildRecentActivities,
  filterActivities,
  AVATAR_PALETTES,
} from '../overviewLogic.ts';
import type { AdminModerationItem } from '../../../types/moderation.ts';
import type { KycProfile } from '../../../types/kyc.ts';
import type { WithdrawalItem } from '../../../types/withdrawal.ts';
import type { DisputeItem } from '../../../types/dispute.ts';

describe('Admin Overview Logic & Data Transformation Tests', () => {
  it('1. Generates 2-letter uppercase initials accurately for full names', () => {
    assert.equal(getInitials('Trần Thị Lan Anh'), 'LA');
    assert.equal(getInitials('Nguyễn Hoàng Minh'), 'HM');
    assert.equal(getInitials('Lê Quốc Huy'), 'QH');
    assert.equal(getInitials('Phạm Tuấn'), 'PT');
    assert.equal(getInitials('Nguyễn Hữu Long'), 'HL');
    assert.equal(getInitials('Võ'), 'V');
    assert.equal(getInitials(''), 'SK');
    assert.equal(getInitials(null), 'SK');
    assert.equal(getInitials(undefined), 'SK');
  });

  it('2. Deterministically hashes names into Sử Ký heritage avatar palettes', () => {
    const color1 = getAvatarColor('Trần Thị Lan Anh');
    const color2 = getAvatarColor('Trần Thị Lan Anh');
    assert.deepEqual(color1, color2);
    assert.ok(AVATAR_PALETTES.some((p) => p.bg === color1.bg && p.text === color1.text));

    // Fallback for null
    const colorNull = getAvatarColor(null);
    assert.deepEqual(colorNull, AVATAR_PALETTES[0]);
  });

  it('3. Accurately masks bank account numbers for secure admin overview', () => {
    assert.equal(formatMaskedAccountNumber('123456789'), '**** 6789');
    assert.equal(formatMaskedAccountNumber('0011004567'), '**** 4567');
    assert.equal(formatMaskedAccountNumber('1234'), '**** 1234');
    assert.equal(formatMaskedAccountNumber(''), '**** 0000');
    assert.equal(formatMaskedAccountNumber(null), '**** 0000');
    assert.equal(formatMaskedAccountNumber(undefined), '**** 0000');
  });

  it('4. Correctly normalizes Video Moderation status badges', () => {
    assert.deepEqual(getModerationStatusBadge('PENDING'), { label: 'Chờ xử lý', variant: 'pending' });
    assert.deepEqual(getModerationStatusBadge('REJECTED'), { label: 'Cần chỉnh sửa', variant: 'error' });
    assert.deepEqual(getModerationStatusBadge('NEEDS_EDIT'), { label: 'Cần chỉnh sửa', variant: 'error' });
    assert.deepEqual(getModerationStatusBadge('APPROVED'), { label: 'Đã duyệt', variant: 'success' });
    assert.deepEqual(getModerationStatusBadge(null), { label: 'Chờ xử lý', variant: 'pending' });
  });

  it('5. Correctly normalizes KYC status badges', () => {
    assert.deepEqual(getKycStatusBadge('PENDING'), { label: 'Chờ xác thực', variant: 'pending' });
    assert.deepEqual(getKycStatusBadge('PROCESSING'), { label: 'Đang xem xét', variant: 'processing' });
    assert.deepEqual(getKycStatusBadge('REJECTED'), { label: 'Cần bổ sung', variant: 'error' });
    assert.deepEqual(getKycStatusBadge('APPROVED'), { label: 'Đã xác thực', variant: 'success' });
  });

  it('6. Correctly normalizes Withdrawal status badges', () => {
    assert.deepEqual(getWithdrawalStatusBadge('PENDING'), { label: 'Chờ duyệt', variant: 'pending' });
    assert.deepEqual(getWithdrawalStatusBadge('PROCESSING'), { label: 'Đang xử lý', variant: 'processing' });
    assert.deepEqual(getWithdrawalStatusBadge('FAILED'), { label: 'Cần xác minh', variant: 'error' });
    assert.deepEqual(getWithdrawalStatusBadge('REJECTED'), { label: 'Cần xác minh', variant: 'error' });
    assert.deepEqual(getWithdrawalStatusBadge('COMPLETED'), { label: 'Đã duyệt', variant: 'success' });
  });

  it('7. Combines real live system entities into a unified Recent Activity feed sorted by timestamp descending', () => {
    const modItems: AdminModerationItem[] = [
      {
        reviewId: 101,
        artifactId: 1,
        contentId: 1,
        channelId: 1,
        channelName: 'Dai Viet Su Ky',
        creatorEmail: 'creator@example.com',
        title: 'Đại Chiến Bạch Đằng Năm 1288',
        contentStatus: 'PENDING_REVIEW',
        decision: 'PENDING',
        createdAt: '2026-10-24T10:51:00Z',
      },
    ];

    const kycItems: KycProfile[] = [
      {
        id: 201,
        userId: 2,
        userEmail: 'quan.le@example.com',
        fullName: 'Lê Minh Quân',
        verificationMethod: 'EMAIL',
        status: 'APPROVED',
        createdAt: '2026-10-24T08:20:00Z',
      },
    ];

    const withdrawalItems: WithdrawalItem[] = [
      {
        id: 301,
        walletId: 5,
        bankName: 'Vietcombank',
        accountNumber: '1234',
        accountHolderName: 'Nguyễn Hữu Long',
        amount: 2500000,
        status: 'PENDING',
        requestedAt: '2026-10-24T09:10:00Z',
      },
    ];

    const disputeItems: DisputeItem[] = [
      {
        id: 401,
        contractId: 10,
        contractTitle: 'Hợp đồng thu âm số 1',
        raisedByUserId: 12,
        status: 'OPEN',
        reason: 'Tranh chấp bản quyền nội dung',
        createdAt: '2026-10-23T15:35:00Z',
      },
    ];

    const feed = buildRecentActivities({
      moderationItems: modItems,
      kycItems: kycItems,
      withdrawalItems: withdrawalItems,
      disputeItems: disputeItems,
    });

    assert.equal(feed.length, 4);
    // Order: 10:51 (mod) -> 09:10 (with) -> 08:20 (kyc) -> 23/10 15:35 (disp)
    assert.equal(feed[0].type, 'MODERATION');
    assert.equal(feed[0].title, 'Video mới chờ duyệt');
    assert.equal(feed[0].description, 'Đại Chiến Bạch Đằng Năm 1288');

    assert.equal(feed[1].type, 'WITHDRAWAL');
    assert.equal(feed[1].title, 'Yêu cầu rút tiền mới');
    assert.ok(feed[1].description.includes('Nguyễn Hữu Long'));

    assert.equal(feed[2].type, 'KYC');
    assert.equal(feed[2].title, 'Nhà sáng tạo hoàn thành KYC');
    assert.equal(feed[2].description, 'Lê Minh Quân');

    assert.equal(feed[3].type, 'DISPUTE');
    assert.equal(feed[3].title, 'Khiếu nại mới');
    assert.equal(feed[3].description, 'Tranh chấp bản quyền nội dung');
  });

  it('8. Filters recent activities accurately by category filter', () => {
    const feed = buildRecentActivities({
      moderationItems: [{
        reviewId: 1,
        artifactId: 1,
        contentId: 1,
        channelId: 1,
        channelName: '',
        creatorEmail: '',
        title: 'Video 1',
        contentStatus: 'PENDING_REVIEW',
        decision: 'PENDING',
        createdAt: '2026-10-24T10:00:00Z',
      }],
      withdrawalItems: [{
        id: 1,
        walletId: 1,
        bankName: '',
        accountNumber: '1234',
        accountHolderName: 'User A',
        amount: 1000000,
        status: 'PENDING',
        requestedAt: '2026-10-24T09:00:00Z',
      }],
    });

    assert.equal(filterActivities(feed, 'ALL').length, 2);
    assert.equal(filterActivities(feed, 'MODERATION').length, 1);
    assert.equal(filterActivities(feed, 'WITHDRAWAL').length, 1);
    assert.equal(filterActivities(feed, 'KYC').length, 0);
    assert.equal(filterActivities(feed, 'DISPUTE').length, 0);
  });

  it('9. Break-UI Stress-Test: Extremely long strings, huge numbers, null and undefined resilience', () => {
    const longName = 'A'.repeat(500);
    const initials = getInitials(longName);
    assert.ok(initials.length <= 2);

    const hugeNumber = formatMaskedAccountNumber('9'.repeat(100));
    assert.equal(hugeNumber, '**** 9999');

    // Empty parameters to feed builder
    const emptyFeed = buildRecentActivities({});
    assert.deepEqual(emptyFeed, []);

    // Dirty objects with null/undefined values
    const dirtyFeed = buildRecentActivities({
      moderationItems: [{
        reviewId: 0,
        artifactId: 0,
        contentId: 0,
        channelId: 0,
        channelName: '',
        creatorEmail: '',
        title: '',
        contentStatus: '',
        decision: '',
        createdAt: '',
      }],
    });
    assert.equal(dirtyFeed.length, 1);
    assert.equal(dirtyFeed[0].description, 'Nội dung chưa đặt tiêu đề');
  });
});
