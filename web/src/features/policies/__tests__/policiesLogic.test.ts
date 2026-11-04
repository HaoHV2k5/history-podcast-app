import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePolicyConfigs,
  validatePolicyDraft,
  isPolicyDraftDirty,
  buildUpdatePolicyPayload,
  resolveActionTriggerLabel,
  togglePolicyActionType,
  formatScoreValue,
  getTierThemeMeta,
  analyzeTierCoverage,
  MAX_POLICY_DESCRIPTION_LENGTH,
  type PolicyCardDraft,
} from '../policiesLogic.ts';
import type { AiShieldPolicyConfig } from '../../../types/moderation.ts';

describe('Admin Policies & Settings - policiesLogic Test Suite', () => {
  const sampleBackendConfigs: AiShieldPolicyConfig[] = [
    {
      id: 3,
      tier: 'GOOD',
      label: 'Tốt',
      minScore: 80,
      maxScore: 90,
      description: 'Điểm từ 80% đến 90% - Tốt, đạt chuẩn xuất bản',
      actionType: 'MANUAL_REVIEW',
      isActive: true,
      displayOrder: 3,
    },
    {
      id: 1,
      tier: 'RED_ALERT',
      label: 'Báo động đỏ',
      minScore: 0,
      maxScore: 50,
      description:
        'Điểm dưới 50% - Báo động đỏ, nội dung vi phạm hoặc sai lệch sử liệu nghiêm trọng',
      actionType: 'MANUAL_REVIEW',
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 4,
      tier: 'EXCELLENT',
      label: 'Xuất sắc',
      minScore: 90,
      maxScore: 100,
      description: 'Điểm trên 90% - Xuất sắc, chất lượng tư liệu rất cao',
      actionType: 'MANUAL_REVIEW',
      isActive: true,
      displayOrder: 4,
    },
    {
      id: 2,
      tier: 'FAIR',
      label: 'Khá',
      minScore: 50,
      maxScore: 80,
      description: 'Điểm từ 50% đến dưới 80% - Khá, cần rà soát và hoàn thiện thêm',
      actionType: 'MANUAL_REVIEW',
      isActive: true,
      displayOrder: 2,
    },
  ];

  test('1. Returns empty array safely when input is null, undefined, or empty (Zero Fake Data)', () => {
    assert.deepEqual(normalizePolicyConfigs(null), []);
    assert.deepEqual(normalizePolicyConfigs(undefined), []);
    assert.deepEqual(normalizePolicyConfigs([]), []);
  });

  test('2. Sorts tiers in canonical order RED_ALERT -> FAIR -> GOOD -> EXCELLENT', () => {
    const normalized = normalizePolicyConfigs(sampleBackendConfigs);
    assert.deepEqual(
      normalized.map((item) => item.tier),
      ['RED_ALERT', 'FAIR', 'GOOD', 'EXCELLENT']
    );
  });

  test('3. Preserves real backend fields accurately without fake data', () => {
    const normalized = normalizePolicyConfigs(sampleBackendConfigs);
    assert.deepEqual(normalized[0], {
      id: 1,
      tier: 'RED_ALERT',
      label: 'Báo động đỏ',
      minScore: 0,
      maxScore: 50,
      actionType: 'MANUAL_REVIEW',
      description:
        'Điểm dưới 50% - Báo động đỏ, nội dung vi phạm hoặc sai lệch sử liệu nghiêm trọng',
      isActive: true,
      displayOrder: 1,
      updatedAt: undefined,
    });
  });

  test('4. Maps default MANUAL_REVIEW or empty string to Chưa định nghĩa hành động without inventing fake options', () => {
    assert.equal(resolveActionTriggerLabel('MANUAL_REVIEW'), 'Chưa định nghĩa hành động');
    assert.equal(resolveActionTriggerLabel(''), 'Chưa định nghĩa hành động');
    assert.equal(resolveActionTriggerLabel(null), 'Chưa định nghĩa hành động');
    assert.equal(resolveActionTriggerLabel('CUSTOM_ACTION'), 'CUSTOM_ACTION');
  });

  test('5. Supports Toggle-Off when clicking the already active non-default action', () => {
    assert.equal(togglePolicyActionType('AUTO_FLAG', 'AUTO_FLAG'), 'MANUAL_REVIEW');
    assert.equal(togglePolicyActionType('MANUAL_REVIEW', 'AUTO_FLAG'), 'AUTO_FLAG');
    assert.equal(togglePolicyActionType('MANUAL_REVIEW', 'MANUAL_REVIEW'), 'MANUAL_REVIEW');
  });

  test('6. Validates policy draft score ranges and description limits matching Backend rules', () => {
    const validDraft: PolicyCardDraft = {
      id: 1,
      tier: 'RED_ALERT',
      label: 'Báo động đỏ',
      minScore: 0,
      maxScore: 50,
      actionType: 'MANUAL_REVIEW',
      description: 'Điểm dưới 50% - Báo động đỏ',
      isActive: true,
      displayOrder: 1,
    };

    const validRes = validatePolicyDraft(validDraft);
    assert.equal(validRes.isValid, true);
    assert.equal(validRes.scoreError, undefined);

    const equalRes = validatePolicyDraft({ ...validDraft, minScore: 50, maxScore: 50 });
    assert.equal(equalRes.isValid, false);
    assert.ok(equalRes.scoreError?.includes('nhỏ hơn'));

    const greaterRes = validatePolicyDraft({ ...validDraft, minScore: 60, maxScore: 50 });
    assert.equal(greaterRes.isValid, false);

    assert.equal(validatePolicyDraft({ ...validDraft, minScore: -5 }).isValid, false);
    assert.equal(validatePolicyDraft({ ...validDraft, maxScore: 105 }).isValid, false);

    const tooLong = 'A'.repeat(MAX_POLICY_DESCRIPTION_LENGTH + 1);
    const longRes = validatePolicyDraft({ ...validDraft, description: tooLong });
    assert.equal(longRes.isValid, false);
    assert.ok(Boolean(longRes.descriptionError));

    const emptyLabelRes = validatePolicyDraft({ ...validDraft, label: '   ' });
    assert.equal(emptyLabelRes.isValid, false);
    assert.ok(Boolean(emptyLabelRes.labelError));
  });

  test('7. Detects dirty state accurately and builds valid PUT payload', () => {
    const baseDraft: PolicyCardDraft = {
      id: 1,
      tier: 'RED_ALERT',
      label: 'Báo động đỏ',
      minScore: 0,
      maxScore: 50,
      actionType: 'MANUAL_REVIEW',
      description: 'Mô tả gốc',
      isActive: true,
      displayOrder: 1,
    };

    assert.equal(isPolicyDraftDirty(baseDraft, { ...baseDraft }), false);
    assert.equal(isPolicyDraftDirty(baseDraft, { ...baseDraft, maxScore: 55 }), true);
    assert.equal(isPolicyDraftDirty(baseDraft, { ...baseDraft, isActive: false }), true);
    assert.equal(
      isPolicyDraftDirty(baseDraft, { ...baseDraft, actionType: 'BLOCK_VIDEO' }),
      true
    );

    const payload = buildUpdatePolicyPayload({
      ...baseDraft,
      minScore: 10,
      maxScore: 45,
      actionType: 'BLOCK_VIDEO',
      isActive: false,
    });
    assert.deepEqual(payload, {
      tier: 'RED_ALERT',
      label: 'Báo động đỏ',
      minScore: 10,
      maxScore: 45,
      description: 'Mô tả gốc',
      actionType: 'BLOCK_VIDEO',
      isActive: false,
      displayOrder: 1,
    });
  });

  test('8. Formats score values and resolves tier theme metadata', () => {
    assert.equal(formatScoreValue(0), '0');
    assert.equal(formatScoreValue(50), '50');
    assert.equal(formatScoreValue(85.5), '85.5');

    assert.equal(getTierThemeMeta('RED_ALERT').iconType, 'shield-alert');
    assert.equal(getTierThemeMeta('FAIR').iconType, 'alert-triangle');
    assert.equal(getTierThemeMeta('GOOD').iconType, 'shield-check');
    assert.equal(getTierThemeMeta('EXCELLENT').iconType, 'star');
  });

  test('9. Analyzes tier coverage for contiguous ranges, gaps, overlaps, and all-disabled states', () => {
    const normalized = normalizePolicyConfigs(sampleBackendConfigs);
    const cleanCoverage = analyzeTierCoverage(normalized);
    assert.equal(cleanCoverage.hasIssue, false);
    assert.deepEqual(cleanCoverage.messages, []);

    // Create a gap between RED_ALERT (0-40) and FAIR (50-80)
    const gapDrafts = normalized.map((d) =>
      d.tier === 'RED_ALERT' ? { ...d, maxScore: 40 } : d
    );
    const gapCoverage = analyzeTierCoverage(gapDrafts);
    assert.equal(gapCoverage.hasIssue, true);
    assert.ok(gapCoverage.messages.some((m) => m.includes('Khoảng trống ngưỡng điểm từ 40% đến 50%')));

    // Create an overlap between RED_ALERT (0-60) and FAIR (50-80)
    const overlapDrafts = normalized.map((d) =>
      d.tier === 'RED_ALERT' ? { ...d, maxScore: 60 } : d
    );
    const overlapCoverage = analyzeTierCoverage(overlapDrafts);
    assert.equal(overlapCoverage.hasIssue, true);
    assert.ok(overlapCoverage.messages.some((m) => m.includes('Chồng lấn ngưỡng điểm từ 50% đến 60%')));

    // All disabled
    const disabledDrafts = normalized.map((d) => ({ ...d, isActive: false }));
    const disabledCoverage = analyzeTierCoverage(disabledDrafts);
    assert.equal(disabledCoverage.hasIssue, true);
  });
});
