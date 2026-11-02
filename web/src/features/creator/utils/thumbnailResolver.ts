/**
 * Resolves authentic historical artwork thumbnails for commissions and contracts.
 * Matches local artwork assets in /assets/studio/ based on content analysis.
 */
export function resolveCommissionThumbnail(title?: string, contentType?: string): string {
  const t = (title || '').toLowerCase();

  // Bạch Đằng / Thủy chiến
  if (t.includes('bạch đằng') || t.includes('938') || t.includes('1288') || t.includes('thủy chiến') || t.includes('cọc ngầm')) {
    return '/assets/studio/topic-bach-dang-938.png';
  }

  // Nam Hán / Ngô Quyền / Như Nguyệt / Lý Thường Kiệt
  if (
    t.includes('nam hán') ||
    t.includes('ngô quyền') ||
    t.includes('như nguyệt') ||
    t.includes('lý thường kiệt') ||
    t.includes('vương triều')
  ) {
    return '/assets/studio/topic-nhu-nguyet.png';
  }

  // Khởi nghĩa Lam Sơn / Lê Lợi / Nguyễn Trãi
  if (t.includes('lam sơn') || t.includes('lê lợi') || t.includes('nguyễn trãi') || t.includes('bình ngô')) {
    return '/assets/studio/topic-lam-son.png';
  }

  // Hội nghị Diên Hồng / Nhà Trần / Ba lần kháng Nguyên Mông
  if (t.includes('diên hồng') || t.includes('nhà trần') || t.includes('nguyên mông') || t.includes('hưng đạo')) {
    return '/assets/studio/topic-dien-hong.png';
  }

  // Thăng Long / Hà Nội / Đô thành
  if (t.includes('thăng long') || t.includes('kinh thành') || t.includes('hà nội') || t.includes('đại việt')) {
    return '/assets/studio/topic-thang-long-banner.png';
  }

  // Series fallback vs single video fallback
  return contentType === 'SERIES'
    ? '/assets/studio/topic-nhu-nguyet.png'
    : '/assets/studio/topic-bach-dang-938.png';
}

