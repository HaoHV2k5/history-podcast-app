/**
 * Creator Studio Utility Functions
 * PRM232 - Sử Ký History Podcast Platform
 *
 * Provides pure, testable helper functions for media URL resolution,
 * text input classification (Branch A vs Branch B), scene image validation,
 * file type/size validation, and script formatting.
 */

import type { StoryboardScene } from '../../types/creatorStudio';

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

  // Local Python outputs video snapshot
  if (cleanFile.includes('/outputs/') && cleanFile.endsWith('.mp4')) {
    return resolveMediaUrl(
      cleanFile.replace(/final_whiteboard_video\.mp4$/i, 'cover.png'),
      apiBaseUrl
    );
  }

  return '';
};
