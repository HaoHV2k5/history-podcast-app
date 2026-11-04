/**
 * Creator Studio Utility Functions
 * PRM232 - Sử Ký History Podcast Platform
 *
 * Provides pure, testable helper functions for media URL resolution,
 * text input classification (Branch A vs Branch B), scene image validation,
 * file type/size validation, and script formatting.
 */

import type { StoryboardScene, CreatorVoiceItem } from '../../types/creatorStudio';

/**
 * Resolves media URLs (video, audio, image, subtitle) against backend-supported public endpoints.
 *
 * In Spring Security (SecurityConfig.java:L43-L44):
 * - PUBLIC_ENDPOINTS = { ..., "/outputs/**", "/audio/**" }
 * - Calling `/outputs/...` or `/audio/...` does NOT require Bearer authorization headers,
 *   allowing native HTML5 <audio> and <video> tags to stream/play media without HTTP 401/403.
 * - Absolute Cloudinary/HTTPS URLs are preserved as-is.
 */
export const resolveMediaUrl = (url?: string, apiBaseUrl?: string): string => {
  if (!url) return '';

  // 1. Absolute URLs (Cloudinary CDN, external HTTPS audio/video, blob URLs, data URIs)
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  // Determine API Base URL (support injection for testing or fallback to Vite env)
  let apiBase = apiBaseUrl;
  if (apiBase === undefined) {
    try {
      apiBase = import.meta.env?.VITE_API_BASE_URL || '';
    } catch {
      apiBase = '';
    }
  }

  // Remove trailing slash from apiBase for clean concatenation
  if (apiBase.endsWith('/')) {
    apiBase = apiBase.slice(0, -1);
  }

  // 2. Normalize and resolve public endpoints
  // Note: WhiteboardMediaController maps both "/outputs/{jobId}/{fileName}" and
  // "/api/v1/creator/studio/outputs/{jobId}/{fileName}". However, only "/outputs/**"
  // is in SecurityConfig.PUBLIC_ENDPOINTS. Therefore, public routes must use "/outputs/".
  if (url.startsWith('/outputs/')) {
    return `${apiBase}${url}`;
  }

  if (url.startsWith('/audio/')) {
    return `${apiBase}${url}`;
  }

  // 3. API endpoints
  if (url.startsWith('/api/')) {
    return `${apiBase}${url}`;
  }

  // 4. Any other leading-slash relative URL
  if (url.startsWith('/')) {
    return `${apiBase}${url}`;
  }

  return `${apiBase}/${url}`;
};

export interface InputClassificationResult {
  isLongText: boolean;
  branch: 'BRANCH_A_SHORT_TITLE' | 'BRANCH_B_EXISTING_SCRIPT';
  reason: string;
  metrics: {
    length: number;
    hasNewline: boolean;
    periodCount: number;
  };
}

/**
 * Classifies creator input into Short Title (< 100 chars) vs Existing Script (> 100 chars or multiline).
 *
 * Aligns strictly with Python Engine server.py:L721:
 * `is_long_text = len(raw_input) > 100 or "\n" in raw_input or raw_input.count(".") >= 3`
 *
 * Note: Must be STRICTLY > 100, never >= 100.
 */
export const classifyInputText = (text: string): InputClassificationResult => {
  const rawInput = text.trim();
  const length = rawInput.length;
  const hasNewline = rawInput.includes('\n');
  const periodCount = (rawInput.match(/\./g) || []).length;

  const isOver100 = length > 100;
  const isLongText = isOver100 || hasNewline || periodCount >= 3;

  let reason = '';
  if (isOver100) {
    reason = `Độ dài ${length} ký tự (> 100 ký tự)`;
  } else if (hasNewline) {
    reason = 'Chứa ký tự xuống dòng (văn bản nhiều đoạn)';
  } else if (periodCount >= 3) {
    reason = `Chứa ${periodCount} dấu chấm câu (kịch bản nhiều câu)`;
  } else {
    reason = `Tiêu đề ngắn (${length} ký tự, <= 100 ký tự)`;
  }

  return {
    isLongText,
    branch: isLongText ? 'BRANCH_B_EXISTING_SCRIPT' : 'BRANCH_A_SHORT_TITLE',
    reason,
    metrics: {
      length,
      hasNewline,
      periodCount,
    },
  };
};

export interface SceneValidationResult {
  isValid: boolean;
  missingScenes: number[];
  totalScenes: number;
  assignedCount: number;
  message?: string;
}

/**
 * Validates that every scene in a storyboard has a corresponding uploaded image.
 *
 * For Whiteboard animation, each scene requires a dedicated 16:9 illustration.
 * Reusing a single cover image across all scenes or using Unsplash placeholders is disallowed.
 */
export const validateSceneImages = (
  scenes: StoryboardScene[] = [],
  sceneImages: Record<string, string> = {}
): SceneValidationResult => {
  if (!scenes || scenes.length === 0) {
    return {
      isValid: false,
      missingScenes: [],
      totalScenes: 0,
      assignedCount: 0,
      message: 'Chưa có phân cảnh nào được khởi tạo trong kịch bản.',
    };
  }

  const missingScenes: number[] = [];
  let assignedCount = 0;

  scenes.forEach((scene, idx) => {
    const sceneIndex = scene.scene_index || idx + 1;
    const key = String(sceneIndex);
    const imageUrl = sceneImages[key]?.trim();

    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      assignedCount++;
    } else {
      missingScenes.push(sceneIndex);
    }
  });

  const isValid = missingScenes.length === 0;
  const message = isValid
    ? undefined
    : `Cảnh ${missingScenes.join(', ')} chưa có hình ảnh minh họa. Chế độ Bảng Trắng yêu cầu đủ hình ảnh cho toàn bộ ${scenes.length} phân cảnh.`;

  return {
    isValid,
    missingScenes,
    totalScenes: scenes.length,
    assignedCount,
    message,
  };
};

export interface MediaFileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an uploaded media file before sending to Cloudinary upload endpoint.
 */
export const validateMediaFile = (
  file: File,
  options?: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  }
): MediaFileValidationResult => {
  const maxBytes = options?.maxSizeBytes ?? 10 * 1024 * 1024; // 10MB default
  const allowed = options?.allowedTypes ?? [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  if (!file) {
    return { isValid: false, error: 'Vui lòng chọn tệp tin hình ảnh.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'Tệp hình ảnh rỗng (0 bytes).' };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `Dung lượng tệp vượt quá giới hạn cho phép (${(file.size / (1024 * 1024)).toFixed(1)}MB > ${maxMb}MB).`,
    };
  }

  const fileType = file.type?.toLowerCase();
  const fileName = file.name?.toLowerCase() || '';
  const hasValidExt = /\.(png|jpe?g|webp)$/i.test(fileName);

  if (!allowed.includes(fileType) && !hasValidExt) {
    return {
      isValid: false,
      error: 'Định dạng hình ảnh không được hỗ trợ. Vui lòng chọn tệp PNG, JPG hoặc WebP.',
    };
  }

  return { isValid: true };
};

/**
 * Extracts narration text from storyboard elements for script preservation.
 */
export const extractNarrationFromStoryboard = (
  scenes: StoryboardScene[] = []
): string => {
  if (!scenes || scenes.length === 0) return '';
  const lines: string[] = [];

  scenes.forEach((sc) => {
    if (sc.narration_text?.trim()) {
      lines.push(sc.narration_text.trim());
    } else if (sc.elements && sc.elements.length > 0) {
      sc.elements.forEach((el) => {
        if (el.subtitle?.trim()) {
          lines.push(el.subtitle.trim());
        }
      });
    }
  });

  return lines.join('\n\n');
};

/**
 * Resolves a reliable video thumbnail URL.
 * 1. Uses explicit thumbnailUrl if provided.
 * 2. If missing and fileUrl is a Cloudinary video, automatically converts .mp4/.webm/.mov to .jpg poster frame.
 * 3. If missing and fileUrl is a local /outputs/ video, points to the cover/first scene artifact image.
 */
export const resolveVideoThumbnail = (
  thumbnailUrl?: string | null,
  fileUrl?: string | null,
  apiBaseUrl?: string
): string => {
  if (thumbnailUrl && thumbnailUrl.trim().length > 0) {
    return resolveMediaUrl(thumbnailUrl.trim(), apiBaseUrl);
  }
  if (!fileUrl) return '';

  const cleanFile = fileUrl.trim();
  // Cloudinary video poster snapshot: replace video extension with .jpg
  if (
    cleanFile.includes('cloudinary.com') &&
    (cleanFile.endsWith('.mp4') || cleanFile.endsWith('.webm') || cleanFile.endsWith('.mov'))
  ) {
    return cleanFile.replace(/\.(mp4|webm|mov)$/i, '.jpg');
  }

  // Local Python outputs video snapshot (cover.png)
  if (cleanFile.includes('/outputs/') && cleanFile.endsWith('.mp4')) {
    const coverPath = cleanFile.includes('final_whiteboard_video.mp4')
      ? cleanFile.replace(/final_whiteboard_video\.mp4$/i, 'cover.png')
      : cleanFile.replace(/\/[^/]+\.mp4$/i, '/cover.png');
    return resolveMediaUrl(coverPath, apiBaseUrl);
  }

  return '';
};

/**
 * Resolves a thumbnail for creator videos:
 * 1. User uploaded thumbnail (explicit thumbnailUrl).
 * 2. Generated video poster snapshot (Cloudinary .jpg or /outputs/.../cover.png).
 * 3. Historical topic curated artwork fallback (matching title keywords like Bạch Đằng, Thăng Long, Lam Sơn, Diên Hồng, Như Nguyệt).
 */
export const resolveHistoricalThumbnail = (
  title?: string | null,
  thumbnailUrl?: string | null,
  fileUrl?: string | null,
  apiBaseUrl?: string
): string => {
  const direct = resolveVideoThumbnail(thumbnailUrl, fileUrl, apiBaseUrl);
  if (direct && direct.trim().length > 0) {
    return direct;
  }

  const t = (title || '').toLowerCase();
  if (t.includes('bạch đằng 938') || (t.includes('bạch đằng') && t.includes('938'))) {
    return '/assets/studio/topic-bach-dang-938.png';
  }
  if (t.includes('bạch đằng 1288') || (t.includes('bạch đằng') && (t.includes('1288') || t.includes('trần quốc tuấn')))) {
    return '/assets/studio/topic-bach-dang-1288.png';
  }
  if (t.includes('chiếu dời đô') || t.includes('dời đô') || t.includes('thăng long')) {
    return '/assets/studio/topic-thang-long-banner.png';
  }
  if (t.includes('lam sơn') || t.includes('lê lợi')) {
    return '/assets/studio/topic-lam-son.png';
  }
  if (t.includes('diên hồng') || t.includes('trần thánh tông')) {
    return '/assets/studio/topic-dien-hong.png';
  }
  if (t.includes('như nguyệt') || t.includes('lý thường kiệt')) {
    return '/assets/studio/topic-nhu-nguyet.png';
  }
  if (t.includes('bạch đằng')) {
    return '/assets/studio/topic-bach-dang-938.png';
  }

  return '';
};

// ─── VOICE REGION & METADATA MAPPING UTILITIES ──────────────────────────────

export type VoiceRegion = 'mien-bac' | 'mien-trung' | 'mien-nam';

/**
 * Phân định vùng miền chuẩn xác theo dữ liệu giọng thực tế,
 * tập trung vào 3 miền chính của Việt Nam: Miền Bắc, Miền Trung, Miền Nam.
 * Khắc phục triệt để lỗi substring 'nam' (giới tính nam) bị nhầm với 'miền nam'.
 */
export const getVoiceRegion = (voice: CreatorVoiceItem): VoiceRegion => {
  const id = voice.id;

  // 1. Ánh xạ ưu tiên theo ID giọng
  if (
    id === 'vi-VN-NamMinhNeural' ||
    id === 'Liam' ||
    id === 'Laura' ||
    id === 'Roger' ||
    id === 'River' ||
    id === 'Rachel'
  ) {
    return 'mien-nam';
  }
  if (id === 'Callum' || id === 'Harry' || id === 'Lily') {
    return 'mien-trung';
  }
  if (
    id === 'vi-VN-HoaiMyNeural' ||
    id === 'Sarah' ||
    id === 'George' ||
    id === 'Bill' ||
    id === 'Alice' ||
    id === 'Matilda' ||
    id === 'Daniel' ||
    id === 'Brian' ||
    id === 'Adam' ||
    id === 'Will'
  ) {
    return 'mien-bac';
  }

  // 2. Kiểm tra danh sách tags từ hệ thống
  const tags = voice.tags || [];
  if (tags.includes('mien-nam')) return 'mien-nam';
  if (tags.includes('mien-trung')) return 'mien-trung';
  if (tags.includes('mien-bac')) return 'mien-bac';

  // 3. Phân tích cụm từ chính xác (không so khớp từ đơn 'nam' để tránh nhầm với giới tính)
  const acc = (voice.accent || '').toLowerCase();
  if (acc.includes('nam bộ') || acc.includes('miền nam') || acc.includes('sài gòn')) return 'mien-nam';
  if (acc.includes('miền trung') || acc.includes('trung bộ') || acc.includes('huế')) return 'mien-trung';
  if (acc.includes('chuẩn bắc') || acc.includes('miền bắc') || acc.includes('hà nội') || acc.includes('bắc bộ')) return 'mien-bac';

  return 'mien-bac';
};

/**
 * Ánh xạ trích đoạn âm thanh tiếng Anh gốc mà diễn viên ElevenLabs nói trong tệp previewUrl.
 * Giúp người dùng nắm bắt rõ âm sắc mẫu là tiếng Anh trong khi AI xuất bản sẽ đọc tiếng Việt.
 */
export const getElevenLabsSampleQuote = (voiceId: string): string => {
  switch (voiceId) {
    case 'Brian':
      return 'The thing always happens that you really believe in; and the belief in a thing makes it happen.';
    case 'Adam':
      return 'Our distrust is very expensive.';
    case 'Sarah':
      return 'The years teach much which the days never know.';
    case 'George':
      return 'God has given you one face, and you make yourself another.';
    case 'Laura':
      return 'Our distrust is very expensive.';
    case 'Liam':
      return "Life isn't about finding yourself. Life is about creating yourself.";
    case 'Callum':
      return 'Life without love is like a tree without blossoms or fruit.';
    case 'Bill':
      return 'As we are liberated from our own fear, our presence automatically liberates others.';
    case 'Alice':
      return 'Just trust yourself, then you will know how to live.';
    case 'River':
      return 'Nature is a mutable cloud which is always and never the same.';
    case 'Roger':
      return 'It is not so important to know everything as to appreciate what we learn.';
    case 'Harry':
      return 'Friends show their love in times of trouble, not in happiness.';
    case 'Matilda':
      return 'Ideas are the beginning points of all fortunes.';
    case 'Will':
      return 'We make our own fortunes, and we call them fate.';
    case 'Daniel':
      return 'The world is round, and the place which may seem like the end may also be the beginning.';
    case 'Lily':
      return "I have never been hurt by anything I didn't say.";
    case 'Rachel':
      return "If you spend your whole life waiting for the storm, you'll never enjoy the sunshine.";
    default:
      return 'Sample preview demonstrating authentic vocal timbre and natural pitch.';
  }
};

/**
 * Hiển thị mô tả sắc thái giọng đọc chuẩn Tiếng Việt, trong sáng và văn hóa lịch sử.
 */
export const getVoiceAccentDisplay = (voice: CreatorVoiceItem): string => {
  if (voice.id === 'vi-VN-NamMinhNeural') {
    return 'Giọng Nam Bộ truyền cảm, tự nhiên, gần gũi';
  }
  if (voice.id === 'vi-VN-HoaiMyNeural') {
    return 'Giọng Bắc chuẩn, dịu dàng, lắng đọng';
  }
  if (voice.id === 'Adam') {
    return 'Trầm ấm, sâu lắng, gần gũi, biểu cảm phong phú';
  }
  if (voice.id === 'Brian') {
    return 'Hào sảng, uy lực, trầm ấm, vang vọng sử thi';
  }
  return voice.accent || 'Giọng đọc chuẩn tiếng Việt';
};

export const getRegionLabel = (region: VoiceRegion): string => {
  switch (region) {
    case 'mien-bac':
      return 'Miền Bắc';
    case 'mien-trung':
      return 'Miền Trung';
    case 'mien-nam':
      return 'Miền Nam';
  }
};

export const getGenderLabel = (gender: string): string => {
  if (gender === 'male') return 'Giọng Nam';
  if (gender === 'female') return 'Giọng Nữ';
  if (gender === 'custom') return 'Giọng riêng';
  return 'Trung tính';
};

export const getEngineLabel = (engine: string): string => {
  if (engine === 'edge-tts') return 'Miễn phí (Edge-TTS)';
  if (engine === 'elevenlabs') return 'Cao cấp (ElevenLabs)';
  return engine;
};

/**
 * Trích xuất lời dẫn thực tế của một phân cảnh Whiteboard.
 * Ưu tiên sc.narration_text nếu tác giả đã biên tập, nếu chưa có sẽ tự động
 * gộp các câu subtitle từ các khối vẽ doodle của phân cảnh đó.
 */
export const getEffectiveSceneNarration = (scene?: {
  narration_text?: string;
  elements?: Array<{ subtitle?: string }>;
}): string => {
  if (!scene) return '';
  const direct = (scene.narration_text || '').trim();
  if (direct) return direct;
  if (!scene.elements || scene.elements.length === 0) return '';
  return scene.elements
    .map((e) => (e.subtitle || '').trim())
    .filter(Boolean)
    .join(' ');
};

/**
 * Phân tách một đoạn văn bản lời dẫn thành số lượng mệnh đề tương ứng với số khối vẽ (mặc định 3).
 * Dùng để đồng bộ lại subtitle của từng khối vẽ khi tác giả sửa lời dẫn tổng của phân cảnh.
 */
export const splitNarrationIntoElements = (
  narration: string,
  targetCount: number = 3
): string[] => {
  const text = (narration || '').trim();
  if (!text) {
    return Array.from({ length: targetCount }, () => '');
  }
  if (targetCount <= 1) return [text];

  // Tách theo dấu kết câu (.?! hoặc xuống dòng)
  const sentences = text
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === targetCount) {
    return sentences;
  }

  // Nếu số câu ít hơn số khối vẽ, thử tách tiếp theo dấu phẩy hoặc chấm phẩy
  if (sentences.length < targetCount) {
    const clauses = text
      .split(/(?<=[,;])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (clauses.length >= targetCount) {
      const result: string[] = [];
      const perSlot = Math.floor(clauses.length / targetCount);
      let remainder = clauses.length % targetCount;
      let curIdx = 0;
      for (let i = 0; i < targetCount; i++) {
        const take = perSlot + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        result.push(clauses.slice(curIdx, curIdx + take).join(', '));
        curIdx += take;
      }
      return result;
    }

    // Nếu văn bản quá ngắn, chia đều theo số từ
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= targetCount) {
      return Array.from({ length: targetCount }, (_, i) => words[i] || (i === 0 ? text : ''));
    }
    const perWord = Math.floor(words.length / targetCount);
    let remWords = words.length % targetCount;
    const res: string[] = [];
    let wIdx = 0;
    for (let i = 0; i < targetCount; i++) {
      const count = perWord + (remWords > 0 ? 1 : 0);
      remWords = Math.max(0, remWords - 1);
      res.push(words.slice(wIdx, wIdx + count).join(' '));
      wIdx += count;
    }
    return res;
  }

  // Nếu số câu nhiều hơn targetCount, gộp các câu cuối lại
  const res = sentences.slice(0, targetCount - 1);
  res.push(sentences.slice(targetCount - 1).join(' '));
  return res;
};

export interface ChronologyIssue {
  wrongYear: string;
  suggestedYear?: string;
  explanation: string;
}

export function detectHistoricalChronologyIssue(text: string): ChronologyIssue | null {
  if (!text || !text.trim()) return null;
  const regex = /\b(?:năm|vào năm|niên hiệu.*?năm|năm thứ)?\s*(\d{3,4})\b/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0].trim();
    const yrStr = match[1];
    const yr = parseInt(yrStr, 10);
    if (fullMatch.toLowerCase().includes('năm') || fullMatch.toLowerCase().includes('vào năm') || /^\d{3,4}$/.test(fullMatch)) {
      const lower = text.toLowerCase();
      const isOutOfLýTrần = yr < 1009 || yr > 1400;
      const isWrongDoiDo = yr !== 1010 && (lower.includes('dời đô') || (lower.includes('hoa lư') && lower.includes('thăng long')));
      const isWrongBachDang = yr !== 1288 && lower.includes('bạch đằng') && (lower.includes('trần hưng đạo') || lower.includes('trần quốc tuấn'));
      const isWrongHoaChau = yr !== 1353 && (lower.includes('trương hán siêu') || lower.includes('hóa châu')) && lower.includes('trần dụ tông');

      if (isOutOfLýTrần || isWrongDoiDo || isWrongBachDang || isWrongHoaChau) {
        let suggestedYear = '';
        let explanation = `Năm ${yr} nằm ngoài phạm vi chính sử hai triều đại hoàng kim Nhà Lý (1009 – 1225) và Nhà Trần (1225 – 1400).`;

        if (isWrongHoaChau || ((yr === 1453 || yr === 2000 || yr > 1400) && (lower.includes('trương hán siêu') || lower.includes('hóa châu') || lower.includes('trần dụ tông') || lower.includes('thần sách')))) {
          suggestedYear = '1353';
          explanation = `Sự kiện vua Trần Dụ Tông cử Trương Hán Siêu đem quân Thần Sách trấn giữ Hóa Châu diễn ra vào năm Quý Tỵ 1353 (thời Trần), không phải năm ${yr}.`;
        } else if (isWrongDoiDo || ((yr === 1012 || yr !== 1010) && (lower.includes('dời đô') || lower.includes('lý thái tổ') || lower.includes('lý công uẩn') || lower.includes('đại la') || lower.includes('thăng long')))) {
          suggestedYear = '1010';
          explanation = `Vua Lý Thái Tổ ban Chiếu Dời Đô từ Hoa Lư về Đại La vào mùa thu năm Canh Tuất 1010, không phải năm ${yr}.`;
        } else if (isWrongBachDang || (yr !== 1288 && lower.includes('bạch đằng') && (lower.includes('trần hưng đạo') || lower.includes('trần quốc tuấn') || lower.includes('ô mã nhi')))) {
          suggestedYear = '1288';
          explanation = `Trận thủy chiến Bạch Đằng do Trần Hưng Đạo lãnh đạo diễn ra vào năm 1288, không phải năm ${yr}.`;
        }

        return {
          wrongYear: yrStr,
          suggestedYear,
          explanation,
        };
      }
    }
  }
  return null;
}


