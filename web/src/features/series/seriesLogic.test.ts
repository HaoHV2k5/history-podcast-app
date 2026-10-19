import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  canMoveUp,
  canMoveDown,
  reorderItems,
  extractContentIds,
  validateReorderPayload,
} from './seriesLogic';

describe('Creator Series Reorder Logic Unit Tests', () => {
  const mockEpisodes = [
    { id: 1, contentId: 101, title: 'Tập 1: Mở đầu' },
    { id: 2, contentId: 102, title: 'Tập 2: Diễn biến' },
    { id: 3, contentId: 103, title: 'Tập 3: Cao trào' },
    { id: 4, contentId: 104, title: 'Tập 4: Kết thúc' },
  ];

  it('Scenario 1: Moving an item up swaps with preceding item', () => {
    // Move item at index 2 (contentId: 103) up to index 1
    const reordered = reorderItems(mockEpisodes, 2, 1);
    assert.strictEqual(reordered.length, 4);
    assert.strictEqual(reordered[0].contentId, 101);
    assert.strictEqual(reordered[1].contentId, 103);
    assert.strictEqual(reordered[2].contentId, 102);
    assert.strictEqual(reordered[3].contentId, 104);
  });

  it('Scenario 2: Moving an item down swaps with following item', () => {
    // Move item at index 1 (contentId: 102) down to index 2
    const reordered = reorderItems(mockEpisodes, 1, 2);
    assert.strictEqual(reordered.length, 4);
    assert.strictEqual(reordered[0].contentId, 101);
    assert.strictEqual(reordered[1].contentId, 103);
    assert.strictEqual(reordered[2].contentId, 102);
    assert.strictEqual(reordered[3].contentId, 104);
  });

  it('Scenario 3: First and last item boundary checks (canMoveUp & canMoveDown)', () => {
    const total = mockEpisodes.length;

    // First item: cannot move up, can move down
    assert.strictEqual(canMoveUp(0), false);
    assert.strictEqual(canMoveDown(0, total), true);

    // Middle items: can move both up and down
    assert.strictEqual(canMoveUp(1), true);
    assert.strictEqual(canMoveDown(1, total), true);
    assert.strictEqual(canMoveUp(2), true);
    assert.strictEqual(canMoveDown(2, total), true);

    // Last item: can move up, cannot move down
    assert.strictEqual(canMoveUp(3), true);
    assert.strictEqual(canMoveDown(3, total), false);
  });

  it('Scenario 4: Empty list handling', () => {
    const emptyList: typeof mockEpisodes = [];
    assert.strictEqual(canMoveUp(0), false);
    assert.strictEqual(canMoveDown(0, 0), false);

    const reordered = reorderItems(emptyList, 0, 1);
    assert.deepStrictEqual(reordered, []);

    const extracted = extractContentIds(emptyList);
    assert.deepStrictEqual(extracted, []);

    const validation = validateReorderPayload(extracted);
    assert.strictEqual(validation.valid, false);
    assert.strictEqual(
      validation.error,
      'Danh sách ID video (contentIds) không được để trống'
    );
  });

  it('Scenario 5: Single-item list handling', () => {
    const single = [{ id: 1, contentId: 999, title: 'Tập Đơn' }];
    assert.strictEqual(canMoveUp(0), false);
    assert.strictEqual(canMoveDown(0, 1), false);

    const reordered = reorderItems(single, 0, 0);
    assert.deepStrictEqual(reordered, single);

    const ids = extractContentIds(single);
    assert.deepStrictEqual(ids, [999]);
    assert.strictEqual(validateReorderPayload(ids).valid, true);
  });

  it('Scenario 6: Out of bounds indices return shallow copy without throwing', () => {
    const negative = reorderItems(mockEpisodes, -1, 2);
    assert.deepStrictEqual(negative, mockEpisodes);

    const tooHigh = reorderItems(mockEpisodes, 1, 99);
    assert.deepStrictEqual(tooHigh, mockEpisodes);

    const same = reorderItems(mockEpisodes, 2, 2);
    assert.deepStrictEqual(same, mockEpisodes);
  });

  it('Scenario 7: Correct request payload extraction', () => {
    const reordered = reorderItems(mockEpisodes, 3, 0); // Move last to first
    const payload = extractContentIds(reordered);
    assert.deepStrictEqual(payload, [104, 101, 102, 103]);

    const validation = validateReorderPayload(payload);
    assert.strictEqual(validation.valid, true);
  });

  it('Scenario 8: Reorder payload validation rejects invalid content IDs or duplicates', () => {
    // Contains non-number or <= 0
    assert.strictEqual(validateReorderPayload([101, -1, 103]).valid, false);
    assert.strictEqual(validateReorderPayload([101, 0, 103]).valid, false);

    // Contains duplicates
    const duplicateValidation = validateReorderPayload([101, 102, 101]);
    assert.strictEqual(duplicateValidation.valid, false);
    assert.strictEqual(duplicateValidation.error, 'Danh sách chứa ID video trùng lặp');
  });
});
