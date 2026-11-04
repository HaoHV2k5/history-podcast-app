import type {
  AiShieldPolicyConfig,
  AiShieldPolicyConfigPayload,
  AiShieldTier,
} from '../../types/moderation.ts';

export const TIER_ORDER: AiShieldTier[] = ['RED_ALERT', 'FAIR', 'GOOD', 'EXCELLENT'];

export const MAX_POLICY_DESCRIPTION_LENGTH = 200;

export interface PolicyTierThemeMeta {
  tier: AiShieldTier;
  defaultLabel: string;
  subtitle: string;
  iconType: 'shield-alert' | 'alert-triangle' | 'shield-check' | 'star';
  headerBg: string;
  iconCircleClass: string;
  titleColorClass: string;
  rangePillClass: string;
  switchActiveClass: string;
  saveBtnClass: string;
}

export const POLICY_TIER_THEMES: Record<AiShieldTier, PolicyTierThemeMeta> = {
  RED_ALERT: {
    tier: 'RED_ALERT',
    defaultLabel: 'Báo động đỏ',
    subtitle: 'Nguy cơ rất cao, vi phạm nghiêm trọng',
    iconType: 'shield-alert',
    headerBg: 'bg-[#FDF2F3]',
    iconCircleClass: 'bg-[#FCE4E6] border-[#F8C9CE] text-[#B91C1C]',
    titleColorClass: 'text-[#B91C1C]',
    rangePillClass: 'bg-[#FADCE0] text-[#991B1B]',
    switchActiveClass: 'bg-[#B91C1C]',
    saveBtnClass: 'bg-[#FCE8EB] hover:bg-[#F9D5DB] text-[#991B1B] border-[#F5C6CE]',
  },
  FAIR: {
    tier: 'FAIR',
    defaultLabel: 'Khá',
    subtitle: 'Nguy cơ trung bình, cần rà soát',
    iconType: 'alert-triangle',
    headerBg: 'bg-[#FEF9EE]',
    iconCircleClass: 'bg-[#FDF0D5] border-[#F9DFAD] text-[#D97706]',
    titleColorClass: 'text-[#92400E]',
    rangePillClass: 'bg-[#FDECC8] text-[#92400E]',
    switchActiveClass: 'bg-[#D97706]',
    saveBtnClass: 'bg-[#FEF3D6] hover:bg-[#FDE6B0] text-[#92400E] border-[#FBD992]',
  },
  GOOD: {
    tier: 'GOOD',
    defaultLabel: 'Tốt',
    subtitle: 'Nội dung đạt chuẩn, an toàn',
    iconType: 'shield-check',
    headerBg: 'bg-[#F2FBF6]',
    iconCircleClass: 'bg-[#DCFCE7] border-[#BBF7D0] text-[#059669]',
    titleColorClass: 'text-[#065F46]',
    rangePillClass: 'bg-[#D1FAE5] text-[#065F46]',
    switchActiveClass: 'bg-[#15803D]',
    saveBtnClass: 'bg-[#E6F7ED] hover:bg-[#D1F0DE] text-[#065F46] border-[#B8E6CB]',
  },
  EXCELLENT: {
    tier: 'EXCELLENT',
    defaultLabel: 'Xuất sắc',
    subtitle: 'Nội dung chất lượng cao',
    iconType: 'star',
    headerBg: 'bg-[#FDF2F4]',
    iconCircleClass: 'bg-[#FCE4E8] border-[#F8C9D1] text-[#BE123C]',
    titleColorClass: 'text-[#9F1239]',
    rangePillClass: 'bg-[#FADCE1] text-[#9F1239]',
    switchActiveClass: 'bg-[#BE123C]',
    saveBtnClass: 'bg-[#FCE8EB] hover:bg-[#F9D5DB] text-[#9F1239] border-[#F5C6CE]',
  },
};

export interface PolicyActionOption {
  value: string;
  triggerLabel: string;
  menuLabel: string;
  description: string;
}

export const POLICY_ACTION_OPTIONS: PolicyActionOption[] = [
  {
    value: 'MANUAL_REVIEW',
    triggerLabel: 'Chưa định nghĩa hành động',
    menuLabel: 'Chưa định nghĩa hành động tự động (MANUAL_REVIEW)',
    description:
      'Mặc định Backend: Gắn nhãn phân tầng AI Shield và đưa vào hàng đợi Kiểm duyệt thủ công',
  },
];

export interface TierCoverageWarning {
  hasIssue: boolean;
  messages: string[];
}

export function analyzeTierCoverage(drafts: PolicyCardDraft[]): TierCoverageWarning {
  const messages: string[] = [];
  if (!drafts || drafts.length === 0) {
    return { hasIssue: false, messages };
  }

  const activeDrafts = drafts
    .filter((d) => d.isActive)
    .sort((a, b) => a.minScore - b.minScore || a.displayOrder - b.displayOrder);

  if (activeDrafts.length === 0) {
    messages.push(
      'Tất cả 4 phân tầng đang tắt. Backend (AiShieldPolicyServiceImpl) sẽ tự động dùng ngưỡng dự phòng mặc định (0–50–80–90–100%).'
    );
    return { hasIssue: true, messages };
  }

  if (activeDrafts[0].minScore > 0) {
    messages.push(
      `Khoảng điểm từ 0% đến ${formatScoreValue(activeDrafts[0].minScore)}% chưa có phân tầng mở.`
    );
  }

  for (let i = 0; i < activeDrafts.length - 1; i++) {
    const current = activeDrafts[i];
    const next = activeDrafts[i + 1];
    if (current.maxScore < next.minScore) {
      messages.push(
        `Khoảng trống ngưỡng điểm từ ${formatScoreValue(current.maxScore)}% đến ${formatScoreValue(next.minScore)}% giữa "${current.label}" và "${next.label}" (Backend sẽ dùng ngưỡng dự phòng cho điểm rơi vào khoảng này).`
      );
    } else if (current.maxScore > next.minScore) {
      messages.push(
        `Chồng lấn ngưỡng điểm từ ${formatScoreValue(next.minScore)}% đến ${formatScoreValue(current.maxScore)}% giữa "${current.label}" và "${next.label}" (Backend sẽ ưu tiên phân tầng có thứ tự đứng trước).`
      );
    }
  }

  const highestMax = Math.max(...activeDrafts.map((d) => d.maxScore));
  if (highestMax < 100) {
    messages.push(
      `Khoảng điểm từ ${formatScoreValue(highestMax)}% đến 100% chưa có phân tầng bao phủ.`
    );
  }

  return {
    hasIssue: messages.length > 0,
    messages,
  };
}

export interface PolicyCardDraft {
  id?: number;
  tier: AiShieldTier;
  label: string;
  minScore: number;
  maxScore: number;
  actionType: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt?: string;
}

export interface PolicyValidationResult {
  isValid: boolean;
  scoreError?: string;
  labelError?: string;
  descriptionError?: string;
}

export function getTierThemeMeta(tier?: AiShieldTier | string): PolicyTierThemeMeta {
  const key = (tier || 'RED_ALERT').toUpperCase() as AiShieldTier;
  return POLICY_TIER_THEMES[key] || POLICY_TIER_THEMES.RED_ALERT;
}

export function resolveActionTriggerLabel(actionType?: string | null): string {
  const clean = (actionType || '').trim();
  if (!clean || clean === 'MANUAL_REVIEW') {
    return 'Chưa định nghĩa hành động';
  }
  const found = POLICY_ACTION_OPTIONS.find(
    (opt) => opt.value.toUpperCase() === clean.toUpperCase()
  );
  return found ? found.triggerLabel : clean;
}

export function togglePolicyActionType(currentAction: string, clickedAction: string): string {
  const normalizedCurrent = (currentAction || 'MANUAL_REVIEW').trim().toUpperCase();
  const normalizedClicked = (clickedAction || 'MANUAL_REVIEW').trim().toUpperCase();
  if (normalizedCurrent === normalizedClicked && normalizedClicked !== 'MANUAL_REVIEW') {
    return 'MANUAL_REVIEW';
  }
  return clickedAction || 'MANUAL_REVIEW';
}

export function mapConfigToDraft(cfg: AiShieldPolicyConfig, index = 0): PolicyCardDraft {
  const theme = getTierThemeMeta(cfg.tier);
  const rawMin = Number(cfg.minScore);
  const rawMax = Number(cfg.maxScore);
  const minScore = Number.isFinite(rawMin) ? Math.round(rawMin * 100) / 100 : 0;
  const maxScore = Number.isFinite(rawMax) ? Math.round(rawMax * 100) / 100 : 100;
  const rawAction = (cfg.actionType ?? cfg.action ?? 'MANUAL_REVIEW').trim();

  return {
    id: cfg.id,
    tier: cfg.tier,
    label: (cfg.label || theme.defaultLabel).trim(),
    minScore,
    maxScore,
    actionType: rawAction || 'MANUAL_REVIEW',
    description: cfg.description ?? '',
    isActive: cfg.isActive !== undefined && cfg.isActive !== null ? Boolean(cfg.isActive) : true,
    displayOrder: cfg.displayOrder ?? index + 1,
    updatedAt: cfg.updatedAt,
  };
}

export function normalizePolicyConfigs(
  configs?: AiShieldPolicyConfig[] | null
): PolicyCardDraft[] {
  if (!configs || !Array.isArray(configs) || configs.length === 0) {
    return [];
  }

  const mapped = configs
    .filter((item): item is AiShieldPolicyConfig => Boolean(item && item.tier))
    .map((item, idx) => mapConfigToDraft(item, idx));

  return mapped.sort((a, b) => {
    const orderA = TIER_ORDER.indexOf(a.tier);
    const orderB = TIER_ORDER.indexOf(b.tier);
    if (orderA !== -1 && orderB !== -1 && orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
}

export function validatePolicyDraft(draft: PolicyCardDraft): PolicyValidationResult {
  const result: PolicyValidationResult = { isValid: true };

  if (!draft.label || !draft.label.trim()) {
    result.isValid = false;
    result.labelError = 'Nhãn hiển thị của phân tầng không được để trống.';
  }

  if (
    typeof draft.minScore !== 'number' ||
    typeof draft.maxScore !== 'number' ||
    Number.isNaN(draft.minScore) ||
    Number.isNaN(draft.maxScore)
  ) {
    result.isValid = false;
    result.scoreError = 'Ngưỡng điểm tối thiểu và tối đa không được để trống.';
  } else if (draft.minScore < 0 || draft.maxScore > 100 || draft.minScore > 100 || draft.maxScore < 0) {
    result.isValid = false;
    result.scoreError = 'Ngưỡng điểm phải nằm trong khoảng từ 0% đến 100%.';
  } else if (draft.minScore >= draft.maxScore) {
    result.isValid = false;
    result.scoreError = 'Mức điểm tối thiểu phải nhỏ hơn mức điểm tối đa.';
  }

  if ((draft.description || '').length > MAX_POLICY_DESCRIPTION_LENGTH) {
    result.isValid = false;
    result.descriptionError = `Mô tả tiêu chuẩn không vượt quá ${MAX_POLICY_DESCRIPTION_LENGTH} ký tự.`;
  }

  return result;
}

export function isPolicyDraftDirty(
  original: PolicyCardDraft | undefined,
  current: PolicyCardDraft
): boolean {
  if (!original) return false;
  return (
    original.minScore !== current.minScore ||
    original.maxScore !== current.maxScore ||
    original.actionType !== current.actionType ||
    original.description !== current.description ||
    original.isActive !== current.isActive ||
    original.label !== current.label
  );
}

export function buildUpdatePolicyPayload(draft: PolicyCardDraft): AiShieldPolicyConfigPayload {
  const theme = getTierThemeMeta(draft.tier);
  return {
    tier: draft.tier,
    label: (draft.label || theme.defaultLabel).trim(),
    minScore: Number(draft.minScore),
    maxScore: Number(draft.maxScore),
    description: (draft.description || '').trim(),
    actionType: (draft.actionType || 'MANUAL_REVIEW').trim(),
    isActive: Boolean(draft.isActive),
    displayOrder: draft.displayOrder,
  };
}

export function formatScoreValue(score: number): string {
  if (!Number.isFinite(score)) return '0';
  return Number.isInteger(score) ? String(score) : String(Math.round(score * 100) / 100);
}
