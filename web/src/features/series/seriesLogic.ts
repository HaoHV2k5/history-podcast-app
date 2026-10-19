/**
 * Pure functions and business rules for Creator Series management and episode reordering.
 */

export interface HasContentId {
  contentId: number;
}

/**
 * Checks if an item at the given index can be moved up.
 */
export function canMoveUp(index: number): boolean {
  return index > 0;
}

/**
 * Checks if an item at the given index can be moved down.
 */
export function canMoveDown(index: number, totalItems: number): boolean {
  return index >= 0 && totalItems > 0 && index < totalItems - 1;
}

/**
 * Immutably moves an item in an array from fromIndex to toIndex.
 * If either index is out of bounds or equal, returns a shallow copy of the original array.
 */
export function reorderItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (!Array.isArray(items) || items.length <= 1) {
    return Array.isArray(items) ? [...items] : [];
  }
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }

  const result = [...items];
  const [movedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);
  return result;
}

/**
 * Extracts an ordered list of contentIds from an array of series item details.
 */
export function extractContentIds(items: HasContentId[]): number[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => item.contentId);
}

/**
 * Validates the payload for PUT /api/v1/creator/series/{seriesId}/reorder.
 * Matches backend validation constraints defined in ReorderSeriesItemsRequest.java.
 */
export function validateReorderPayload(contentIds: number[]): { valid: boolean; error?: string } {
  if (!Array.isArray(contentIds) || contentIds.length === 0) {
    return {
      valid: false,
      error: 'Danh sách ID video (contentIds) không được để trống',
    };
  }

  for (const id of contentIds) {
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
      return {
        valid: false,
        error: 'ID video không hợp lệ',
      };
    }
  }

  const unique = new Set(contentIds);
  if (unique.size !== contentIds.length) {
    return {
      valid: false,
      error: 'Danh sách chứa ID video trùng lặp',
    };
  }

  return { valid: true };
}
