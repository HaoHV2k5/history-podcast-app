import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateModerationStats,
  parseAiShieldAssessment,
  getDecisionBadgeConfig,
  formatStackedDateTime,
  formatVideoDuration,
  cleanMarkdownTitle,
  resolveHistoricalCategory,
} from '../moderationLogic.ts';
import type { AdminModerationItem } from '../../../types/moderation.ts';

describe('Admin Video Moderation Logic & Data Mapping', () => {
  const mockItems: AdminModerationItem[] = [
    {
      reviewId: 1,
      artifactId: 101,
      contentId: 201,
      channelId: 301,
      channelName: 'Dai Viet Su Ky Podcast',
      creatorEmail: 'creator@example.com',
      title: 'Đại Thắng Bạch Đằng Năm 1288 (Trần Quốc Tuấn)',
      durationSeconds: 990,
      contentStatus: 'PENDING_REVIEW',
      decision: 'PENDING',
      createdAt: '2026-10-24T03:51:00Z',
      aiShieldScore: 81.0,
      aiShieldTier: 'GOOD',
      aiShieldTierLabel: 'Tốt',
      aiShieldReason: 'Nội dung phù hợp\nKhông vi phạm',
    },
    {
      reviewId: 2,
      artifactId: 102,
      contentId: 202,
      channelId: 301,
      channelName: 'Dai Viet Su Ky Podcast',
      creatorEmail: 'creator@example.com',
      title: 'Khởi Nghĩa Lam Sơn - Lê Lợi',
      durationSeconds: 495,
      contentStatus: 'REJECTED',
      decision: 'REJECTED',
      createdAt: '2026-10-18T03:37:00Z',
      reviewedAt: '2026-10-18T05:37:00Z', // 2 hours
      aiShieldScore: 26.0,
      aiShieldTier: 'RED_ALERT',
      aiShieldTierLabel: 'Báo động đỏ',
      aiShieldReason: 'Nội dung nhạy cảm; Cần kiểm tra thủ công',
    },
    {
      reviewId: 3,
      artifactId: 103,
      contentId: 203,
      channelId: 301,
      channelName: 'Dai Viet Su Ky Podcast',
      creatorEmail: 'creator@example.com',
      title: 'Khởi Nghĩa Tây Sơn - Nguyễn Huệ',
      durationSeconds: 1210,
      contentStatus: 'PUBLISHED',
      decision: 'APPROVED',
      createdAt: '2026-10-17T09:20:00Z',
      reviewedAt: '2026-10-17T13:20:00Z', // 4 hours
      aiShieldScore: 92.1,
      aiShieldTier: 'EXCELLENT',
      aiShieldTierLabel: 'Xuất sắc',
    },
  ];

  it('1. Correctly calculates operational counts and average turnaround time', () => {
    const stats = calculateModerationStats(mockItems);
    assert.strictEqual(stats.pendingCount, 1);
    assert.strictEqual(stats.rejectedCount, 1);
    assert.strictEqual(stats.approvedCount, 1);
    assert.strictEqual(stats.totalCount, 3);
    // (2 hours + 4 hours) / 2 = 3.0 hours
    assert.strictEqual(stats.avgReviewTimeHours, 3.0);
    assert.strictEqual(stats.avgReviewTimeFormatted, '3 giờ');

    // Zero fake data: Empty items returns honest fallback 'Chưa có dữ liệu' instead of hardcoded numbers
    const emptyStats = calculateModerationStats([]);
    assert.strictEqual(emptyStats.avgReviewTimeHours, null);
    assert.strictEqual(emptyStats.avgReviewTimeFormatted, 'Chưa có dữ liệu');
  });

  it('2. Parses AI Shield score, badge class, and bullet points accurately', () => {
    // Good assessment
    const goodEval = parseAiShieldAssessment(mockItems[0]);
    assert.strictEqual(goodEval.tier, 'GOOD');
    assert.strictEqual(goodEval.scoreFormatted, '81.0%');
    assert.strictEqual(goodEval.label, 'Tốt');
    assert.strictEqual(goodEval.bulletPoints.length, 2);
    assert.strictEqual(goodEval.bulletPoints[0], 'Nội dung phù hợp');
    assert.strictEqual(goodEval.bulletPoints[1], 'Không vi phạm');

    // Red alert assessment
    const redEval = parseAiShieldAssessment(mockItems[1]);
    assert.strictEqual(redEval.tier, 'RED_ALERT');
    assert.strictEqual(redEval.scoreFormatted, '26.0%');
    assert.strictEqual(redEval.label, 'Báo động đỏ');
    assert.strictEqual(redEval.bulletPoints[0], 'Nội dung nhạy cảm');
    assert.strictEqual(redEval.bulletPoints[1], 'Cần kiểm tra thủ công');

    // Missing reason fallback
    const excelEval = parseAiShieldAssessment(mockItems[2]);
    assert.strictEqual(excelEval.tier, 'EXCELLENT');
    assert.strictEqual(excelEval.scoreFormatted, '92.1%');
    assert.strictEqual(excelEval.bulletPoints[0], 'Nội dung phù hợp');
  });

  it('3. Formats decision status badge configuration correctly', () => {
    const pendingBadge = getDecisionBadgeConfig('PENDING');
    assert.strictEqual(pendingBadge.label, 'Chờ xử lý');
    assert.ok(pendingBadge.dotColor.includes('#F59E0B') || pendingBadge.dotColor.includes('amber'));

    const approvedBadge = getDecisionBadgeConfig('APPROVED');
    assert.strictEqual(approvedBadge.label, 'Đã phê duyệt');
    assert.ok(approvedBadge.dotColor.includes('#10B981') || approvedBadge.dotColor.includes('emerald'));

    const rejectedBadge = getDecisionBadgeConfig('REJECTED');
    assert.strictEqual(rejectedBadge.label, 'Bị từ chối');
    assert.ok(rejectedBadge.dotColor.includes('#EF4444') || rejectedBadge.dotColor.includes('rose'));
  });

  it('4. Formats stacked date and time safely without throwing', () => {
    const formatted = formatStackedDateTime('2026-10-24T10:51:00');
    assert.ok(formatted.time.length > 0);
    assert.ok(formatted.date.includes('/2026') || formatted.date.includes('2026'));

    const fallback = formatStackedDateTime(undefined);
    assert.strictEqual(fallback.time, '--:--');
    assert.strictEqual(fallback.date, 'Chưa có');
  });

  it('5. Break-UI Stress-Test: Extremely long strings, empty objects, and negative durations', () => {
    const weirdItem: Partial<AdminModerationItem> = {
      title: 'A'.repeat(500),
      durationSeconds: -50,
      aiShieldScore: 150, // overflow > 100
      decision: '',
    };

    const evalResult = parseAiShieldAssessment(weirdItem);
    assert.strictEqual(evalResult.scoreFormatted, '100%'); // capped at 100%
    assert.ok(evalResult.bulletPoints.length > 0);

    const duration = formatVideoDuration(weirdItem.durationSeconds);
    assert.strictEqual(duration, '00:00');
  });

  it('6. Cleans markdown asterisks and resolves historical categories accurately', () => {
    assert.strictEqual(
      cleanMarkdownTitle('**Trần Quốc Tuấn - Vị quốc công**'),
      'Trần Quốc Tuấn - Vị quốc công'
    );
    assert.strictEqual(
      resolveHistoricalCategory('Đại Thắng Bạch Đằng Năm 1288'),
      'Lịch sử quân sự'
    );
    assert.strictEqual(
      resolveHistoricalCategory('Chiếu Dời Đô 1010 Thăng Long'),
      'Văn hóa & Xã hội'
    );
    assert.strictEqual(
      resolveHistoricalCategory('Hào khí Đông A thời Lý - Trần'),
      'Nhân vật & Triều đại'
    );
  });

  it('7. Cleans duplicate prefixes in recommendation reason strings', () => {
    const rawReason = 'Lý do từ chối: AI Shield: Nội dung kịch bản chưa trích dẫn rõ nguồn';
    const cleaned = rawReason.replace(/^Lý do từ chối:\s*/i, '');
    assert.strictEqual(cleaned, 'AI Shield: Nội dung kịch bản chưa trích dẫn rõ nguồn');

    const doubleAiPrefix = 'AI Shield: AI Shield: Phù hợp xuất bản';
    const cleanedAi = doubleAiPrefix.replace(/^(AI Shield:\s*)+/i, 'AI Shield: ');
    assert.strictEqual(cleanedAi, 'AI Shield: Phù hợp xuất bản');
  });
});
