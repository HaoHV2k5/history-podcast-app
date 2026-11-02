import type { AdminModerationItem, AiShieldTier } from '../../types/moderation.ts';
import { formatDuration } from '../../utils/formatters.ts';

export interface ModerationStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  avgReviewTimeHours: number | null;
  avgReviewTimeFormatted: string;
}

export interface AiShieldAssessmentResult {
  tier: AiShieldTier | 'UNKNOWN';
  label: string;
  scoreNumber: number | null;
  scoreFormatted: string;
  pillClasses: string;
  iconType: 'check' | 'alert' | 'danger';
  bulletPoints: string[];
}

/**
 * Calculates operational stats from moderation items.
 * Includes total, pending, approved, rejected, and average turnaround time.
 */
export function calculateModerationStats(
  items: AdminModerationItem[],
  knownCounts?: { pending?: number; approved?: number; rejected?: number; total?: number }
): ModerationStats {
  const pendingCount =
    knownCounts?.pending ??
    items.filter((i) => i.decision?.toUpperCase() === 'PENDING').length;
  const approvedCount =
    knownCounts?.approved ??
    items.filter((i) => i.decision?.toUpperCase() === 'APPROVED').length;
  const rejectedCount =
    knownCounts?.rejected ??
    items.filter((i) => i.decision?.toUpperCase() === 'REJECTED').length;
  const totalCount =
    knownCounts?.total ?? (pendingCount + approvedCount + rejectedCount);

  // Compute average turnaround time for items with both createdAt and reviewedAt
  const reviewedItemsWithDuration = items.filter((item) => {
    if (!item.createdAt || !item.reviewedAt) return false;
    const start = new Date(item.createdAt).getTime();
    const end = new Date(item.reviewedAt).getTime();
    return !isNaN(start) && !isNaN(end) && end >= start;
  });

  let avgReviewTimeHours: number | null = null;
  let avgReviewTimeFormatted = 'Chưa có dữ liệu';

  if (reviewedItemsWithDuration.length > 0) {
    const totalDurationMs = reviewedItemsWithDuration.reduce((acc, cur) => {
      const start = new Date(cur.createdAt).getTime();
      const end = new Date(cur.reviewedAt!).getTime();
      return acc + (end - start);
    }, 0);
    const avgMs = totalDurationMs / reviewedItemsWithDuration.length;
    const hours = avgMs / (1000 * 60 * 60);
    avgReviewTimeHours = Number(hours.toFixed(1));
    avgReviewTimeFormatted = `${avgReviewTimeHours} giờ`;
  }

  return {
    pendingCount,
    approvedCount,
    rejectedCount,
    totalCount,
    avgReviewTimeHours,
    avgReviewTimeFormatted,
  };
}

/**
 * Parses and evaluates AI Shield results into structured badges and bullet points.
 */
export function parseAiShieldAssessment(
  item: Partial<AdminModerationItem>
): AiShieldAssessmentResult {
  const rawScore = item.aiShieldScore;
  const scoreNum =
    rawScore !== undefined && rawScore !== null ? Number(rawScore) : null;
  const scoreFormatted =
    scoreNum !== null && !isNaN(scoreNum)
      ? `${scoreNum > 100 ? 100 : scoreNum < 0 ? 0 : scoreNum.toFixed(1)}%`
      : '';

  // Determine Tier
  let tier: AiShieldTier | 'UNKNOWN' = 'UNKNOWN';
  if (item.aiShieldTier) {
    tier = item.aiShieldTier;
  } else if (scoreNum !== null) {
    if (scoreNum >= 85) tier = 'EXCELLENT';
    else if (scoreNum >= 70) tier = 'GOOD';
    else if (scoreNum >= 45) tier = 'FAIR';
    else tier = 'RED_ALERT';
  }

  // Determine Label
  let label = item.aiShieldTierLabel || '';
  if (!label) {
    switch (tier) {
      case 'EXCELLENT':
        label = 'Xuất sắc';
        break;
      case 'GOOD':
        label = 'Tốt';
        break;
      case 'FAIR':
        label = 'Cần xem xét';
        break;
      case 'RED_ALERT':
        label = 'Báo động đỏ';
        break;
      default:
        label = 'Đang thẩm định';
    }
  }

  // Parse Bullets from reason or contextual fallback
  let bulletPoints: string[] = [];
  if (item.aiShieldReason && item.aiShieldReason.trim().length > 0) {
    // Strip redundant bracket prefixes like [Xuất sắc - 95.0%] or [Khá - 70.0%]
    const cleanReason = item.aiShieldReason
      .replace(/^\[[^\]]+\]\s*/i, '')
      .trim();

    let lines = cleanReason
      .split(/[\n;•]+/)
      .map((s) => s.replace(/^\[[^\]]+\]\s*/i, '').trim())
      .filter((s) => s.length > 0);

    // If only 1 long line, split by comma or period for clean multi-line display
    if (lines.length === 1 && lines[0].length > 25 && /[,.]/.test(lines[0])) {
      const subParts = lines[0]
        .split(/[,.]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (subParts.length >= 2) {
        lines = subParts;
      }
    }

    if (lines.length > 0) {
      bulletPoints.push(lines[0]);
      if (lines.length > 1) {
        bulletPoints.push(lines[1]);
      }
    }
  }

  // Ensure exactly 2 professional bullet points matching design mockup
  if (bulletPoints.length === 0) {
    switch (tier) {
      case 'EXCELLENT':
      case 'GOOD':
        bulletPoints = ['Nội dung phù hợp', 'Không vi phạm'];
        break;
      case 'FAIR':
        bulletPoints = ['Một số yếu tố nhạy cảm', 'Đề xuất kiểm tra'];
        break;
      case 'RED_ALERT':
        bulletPoints = ['Nội dung nhạy cảm', 'Cần kiểm tra thủ công'];
        break;
      default:
        bulletPoints = ['Đang đối chiếu dữ liệu', 'Chờ xử lý'];
    }
  } else if (bulletPoints.length === 1) {
    switch (tier) {
      case 'EXCELLENT':
      case 'GOOD':
        bulletPoints.push('Chất lượng tốt');
        break;
      case 'FAIR':
        bulletPoints.push('Đề xuất kiểm tra');
        break;
      case 'RED_ALERT':
        bulletPoints.push('Cần kiểm tra thủ công');
        break;
      default:
        bulletPoints.push('Chờ xác minh');
    }
  }

  // Styles according to tier
  let pillClasses = 'bg-[#F5F2EB] text-[#57534E] border-[#E0DDD7]';
  let iconType: 'check' | 'alert' | 'danger' = 'check';

  if (tier === 'EXCELLENT' || tier === 'GOOD') {
    pillClasses = 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
    iconType = 'check';
  } else if (tier === 'FAIR') {
    pillClasses = 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
    iconType = 'alert';
  } else if (tier === 'RED_ALERT') {
    pillClasses = 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
    iconType = 'danger';
  }

  return {
    tier,
    label,
    scoreNumber: scoreNum,
    scoreFormatted,
    pillClasses,
    iconType,
    bulletPoints,
  };
}

/**
 * Returns dot, badge, and label styling for decision statuses.
 */
export function getDecisionBadgeConfig(decision?: string) {
  const norm = (decision || '').toUpperCase();
  if (norm === 'APPROVED' || norm === 'PUBLISHED') {
    return {
      label: 'Đã phê duyệt',
      dotColor: 'bg-[#10B981]',
      badgeClasses: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    };
  }
  if (norm === 'REJECTED') {
    return {
      label: 'Bị từ chối',
      dotColor: 'bg-[#EF4444]',
      badgeClasses: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    };
  }
  return {
    label: 'Chờ xử lý',
    dotColor: 'bg-[#F59E0B]',
    badgeClasses: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  };
}

/**
 * Formats submission timestamp into stacked time & date.
 */
export function formatStackedDateTime(isoString?: string): { time: string; date: string } {
  if (!isoString) return { time: '--:--', date: 'Chưa có' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { time: '--:--', date: 'Chưa có' };

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return {
      time: `${hours}:${minutes}`,
      date: `${day}/${month}/${year}`,
    };
  } catch {
    return { time: '--:--', date: 'Chưa có' };
  }
}

/**
 * Formats duration seconds into readable time (e.g. 16:30, 01:00:21).
 */
export function formatVideoDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '00:00';
  return formatDuration(seconds);
}

/**
 * Cleans raw markdown syntax (e.g. **bold**, *italic*) from video titles.
 */
export function cleanMarkdownTitle(rawTitle?: string): string {
  if (!rawTitle) return 'Nội dung chưa đặt tiêu đề';
  return rawTitle.replace(/\*\*/g, '').replace(/\*/g, '').trim();
}

/**
 * Resolves a reliable and diverse historical thumbnail artwork for table rows.
 */
export function resolveModerationRowThumbnail(
  title?: string,
  explicitUrl?: string,
  index = 0
): string {
  // If explicitUrl is a valid web image and not a generic placeholder
  if (
    explicitUrl &&
    explicitUrl.trim().length > 0 &&
    !explicitUrl.endsWith('.mp4') &&
    !explicitUrl.includes('video_thumb_default')
  ) {
    return explicitUrl;
  }

  // If explicitUrl is a Cloudinary video, derive its video frame snapshot (.jpg)
  if (
    explicitUrl &&
    explicitUrl.includes('res.cloudinary.com') &&
    explicitUrl.endsWith('.mp4')
  ) {
    return explicitUrl.replace(/\.mp4$/i, '.jpg');
  }

  const t = (title || '').toLowerCase();
  if (t.includes('bạch đằng 1288') || (t.includes('bạch đằng') && t.includes('trần quốc tuấn'))) {
    return '/assets/studio/topic-bach-dang-1288.png';
  }
  if (t.includes('trần quốc tuấn') || t.includes('vị quốc công')) {
    return '/assets/studio/topic-bach-dang-1288.png';
  }
  if (t.includes('lam sơn') || t.includes('lê lợi')) {
    return '/assets/studio/topic-lam-son.png';
  }
  if (t.includes('thăng long') || t.includes('dời đô') || t.includes('lý thái tổ')) {
    return '/assets/studio/topic-thang-long-banner.png';
  }
  if (t.includes('như nguyệt') || t.includes('lý thường kiệt')) {
    return '/assets/studio/topic-nhu-nguyet.png';
  }
  if (t.includes('diên hồng') || t.includes('đông a') || t.includes('tây sơn') || t.includes('thời lý - trần')) {
    return '/assets/studio/topic-dien-hong.png';
  }
  if (t.includes('bạch đằng')) {
    return '/assets/studio/topic-bach-dang-938.png';
  }

  // Graceful multi-topic artwork rotation by index to prevent monotone repetition
  const TOPIC_ARTWORKS = [
    '/assets/studio/topic-bach-dang-1288.png',
    '/assets/studio/topic-lam-son.png',
    '/assets/studio/topic-thang-long-banner.png',
    '/assets/studio/topic-dien-hong.png',
    '/assets/studio/topic-nhu-nguyet.png',
  ];
  return TOPIC_ARTWORKS[index % TOPIC_ARTWORKS.length];
}

/**
 * Resolves historical topic category label based on title keywords.
 */
export function resolveHistoricalCategory(title?: string): string {
  const t = (title || '').toLowerCase();
  if (
    t.includes('bạch đằng') ||
    t.includes('chiến') ||
    t.includes('quân sự') ||
    t.includes('như nguyệt') ||
    t.includes('lam sơn')
  ) {
    return 'Lịch sử quân sự';
  }
  if (t.includes('thăng long') || t.includes('dời đô') || t.includes('văn hóa')) {
    return 'Văn hóa & Xã hội';
  }
  if (t.includes('triều đại') || t.includes('đông a') || t.includes('lý - trần') || t.includes('nhân vật')) {
    return 'Nhân vật & Triều đại';
  }
  return 'Lịch sử';
}
