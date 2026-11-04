import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canMoveUp,
  canMoveDown,
  reorderItems,
  extractContentIds,
  validateReorderPayload,
} from '../seriesLogic.ts';

const normalizeText = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

describe('Series & Episode Management Logic', () => {
  describe('1. Diacritics-insensitive text search normalization', () => {
    it('matches Vietnamese names regardless of accents or casing', () => {
      const target = 'Lý Thường Kiệt - Chiến Thắng Sông Như Nguyệt';
      const norm = normalizeText(target);

      assert.strictEqual(norm.includes(normalizeText('ly thuong kiet')), true);
      assert.strictEqual(norm.includes(normalizeText('NHU NGUYET')), true);
      assert.strictEqual(norm.includes(normalizeText('chiến thắng')), true);
      assert.strictEqual(norm.includes(normalizeText('chien thang')), true);
      assert.strictEqual(norm.includes(normalizeText('Quang Trung')), false);
    });

    it('matches special characters and letter d/đ properly', () => {
      const target = 'Bạch Đằng Giang 1288';
      const norm = normalizeText(target);

      assert.strictEqual(norm.includes(normalizeText('bach dang')), true);
      assert.strictEqual(norm.includes(normalizeText('đằng giang')), true);
      assert.strictEqual(norm.includes(normalizeText('1288')), true);
    });
  });

  describe('2. Episode Content ID Partitioning & Map Resolution', () => {
    const seriesItems = [
      { id: 101, contentId: 10, title: 'Tập 1: Chiếu Dời Đô', durationSeconds: 300 },
      { id: 102, contentId: 25, title: 'Tập 2: Sông Như Nguyệt', durationSeconds: 450 },
    ];

    const creatorVideos = [
      { contentId: 10, title: 'Chiếu Dời Đô', durationSeconds: 300, status: 'PUBLISHED' },
      { contentId: 25, title: 'Sông Như Nguyệt', durationSeconds: 450, status: 'PUBLISHED' },
      { contentId: 30, title: 'Bạch Đằng Giang', durationSeconds: 500, status: 'PUBLISHED' },
      { contentId: 40, title: 'Hịch Tướng Sĩ', durationSeconds: 200, status: 'DRAFT' },
    ];

    it('creates an accurate lookup map of contentId to 1-based order number', () => {
      const map = new Map<number, number>();
      seriesItems.forEach((it, idx) => map.set(it.contentId, idx + 1));

      assert.strictEqual(map.get(10), 1);
      assert.strictEqual(map.get(25), 2);
      assert.strictEqual(map.has(30), false);
      assert.strictEqual(map.has(40), false);
    });

    it('filters unadded videos accurately', () => {
      const map = new Map<number, number>();
      seriesItems.forEach((it, idx) => map.set(it.contentId, idx + 1));

      const unadded = creatorVideos.filter((v) => !map.has(v.contentId));
      assert.strictEqual(unadded.length, 2);
      assert.strictEqual(unadded[0].contentId, 30);
      assert.strictEqual(unadded[1].contentId, 40);
    });

    it('calculates total duration across all episodes in seconds', () => {
      const totalSeconds = seriesItems.reduce((acc, it) => acc + (it.durationSeconds || 0), 0);
      assert.strictEqual(totalSeconds, 750);
    });
  });

  describe('3. Reordering business rules', () => {
    it('enforces canMoveUp boundaries', () => {
      assert.strictEqual(canMoveUp(0), false);
      assert.strictEqual(canMoveUp(1), true);
      assert.strictEqual(canMoveUp(2), true);
    });

    it('enforces canMoveDown boundaries', () => {
      const total = 3;
      assert.strictEqual(canMoveDown(0, total), true);
      assert.strictEqual(canMoveDown(1, total), true);
      assert.strictEqual(canMoveDown(2, total), false);
    });

    it('immutably swaps items without modifying source', () => {
      const original = [
        { contentId: 1 },
        { contentId: 2 },
        { contentId: 3 },
      ];
      const reordered = reorderItems(original, 0, 2);
      assert.deepStrictEqual(extractContentIds(reordered), [2, 3, 1]);
      assert.deepStrictEqual(extractContentIds(original), [1, 2, 3]);
    });

    it('validates reorder payload rejecting duplicates and non-positives', () => {
      assert.strictEqual(validateReorderPayload([1, 2, 3]).valid, true);
      assert.strictEqual(validateReorderPayload([1, 2, 2]).valid, false);
      assert.strictEqual(validateReorderPayload([]).valid, false);
      assert.strictEqual(validateReorderPayload([0, 1]).valid, false);
    });
  });
});
