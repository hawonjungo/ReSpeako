import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  addReviewItems,
  getAllReviewItems,
  getDueReviewItems,
  getReviewItemId,
  gradeReviewItem,
  Rating,
  suggestRating,
} from './reviewStore';

describe('reviewStore', () => {
  it('adds new items as due and de-duplicates by normalized text', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const added = await addReviewItems([
      { kind: 'word', text: 'Library', source: 'wfd' },
      { kind: 'word', text: 'library!', source: 'wfd' },
    ], now);

    expect(added).toBe(1);
    const items = await getAllReviewItems();
    const item = items.find((entry) => entry.id === getReviewItemId('word', 'library'));
    expect(item.mistakes).toBe(2);
    expect(await getDueReviewItems(now)).toHaveLength(1);
  });

  it('schedules a Good answer into the future', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const [item] = await getDueReviewItems(now);
    const updated = await gradeReviewItem(item, Rating.Good, now);

    expect(new Date(updated.card.due).getTime()).toBeGreaterThan(now.getTime());
    expect(await getDueReviewItems(now)).toHaveLength(0);
  });

  it('maps accuracy to a suggested rating', () => {
    expect(suggestRating(100)).toBe(Rating.Good);
    expect(suggestRating(80)).toBe(Rating.Hard);
    expect(suggestRating(40)).toBe(Rating.Again);
  });
});
