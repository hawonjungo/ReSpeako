// Mistake notebook (FSRS-scheduled) and practice history, persisted in IndexedDB.
import { createStore, del, get, set, values } from 'idb-keyval';
import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import { normalizeText } from './scoring';

export { Rating };

const scheduler = fsrs({ enable_fuzz: true });

let reviewStore;
let historyStore;
// In-memory fallback when IndexedDB is unavailable (private mode, old WebView).
const memoryReview = new Map();
const memoryHistory = new Map();

function getStores() {
  if (reviewStore === undefined) {
    try {
      reviewStore = createStore('respeako-review', 'items');
      historyStore = createStore('respeako-history', 'attempts');
    } catch {
      reviewStore = null;
      historyStore = null;
    }
  }
  return { reviewStore, historyStore };
}

async function safeCall(action, fallback) {
  try {
    return await action();
  } catch (error) {
    console.warn('IndexedDB unavailable, using memory storage.', error);
    reviewStore = null;
    historyStore = null;
    return fallback();
  }
}

async function readItem(id) {
  const { reviewStore: store } = getStores();
  if (!store) return memoryReview.get(id);
  return safeCall(() => get(id, store), () => memoryReview.get(id));
}

async function writeItem(item) {
  const { reviewStore: store } = getStores();
  if (!store) {
    memoryReview.set(item.id, item);
    return;
  }
  await safeCall(() => set(item.id, item, store), () => memoryReview.set(item.id, item));
}

export function getReviewItemId(kind, text) {
  return `${kind}:${normalizeText(text)}`;
}

/**
 * Add items to the notebook. Existing items keep their schedule but are
 * pulled forward to "due now", since the learner just got them wrong again.
 * @param {{ kind: 'word' | 'sentence', text: string, source: string, note?: string }[]} items
 */
export async function addReviewItems(items, now = new Date()) {
  let added = 0;

  for (const entry of items) {
    if (!normalizeText(entry.text)) continue;

    const id = getReviewItemId(entry.kind, entry.text);
    const existing = await readItem(id);

    if (existing) {
      await writeItem({
        ...existing,
        mistakes: (existing.mistakes || 1) + 1,
        card: { ...existing.card, due: now },
      });
      continue;
    }

    await writeItem({
      id,
      kind: entry.kind,
      text: entry.text.trim(),
      source: entry.source,
      note: entry.note || '',
      mistakes: 1,
      createdAt: now,
      card: createEmptyCard(now),
    });
    added += 1;
  }

  return added;
}

export async function getAllReviewItems() {
  const { reviewStore: store } = getStores();
  const items = store
    ? await safeCall(() => values(store), () => [...memoryReview.values()])
    : [...memoryReview.values()];

  return items.sort((a, b) => new Date(a.card.due) - new Date(b.card.due));
}

export async function getDueReviewItems(now = new Date()) {
  const items = await getAllReviewItems();
  return items.filter((item) => new Date(item.card.due) <= now);
}

// Preview the next due date for every rating, for labelling the grade buttons.
export function previewSchedule(item, now = new Date()) {
  const preview = scheduler.repeat(item.card, now);
  return {
    [Rating.Again]: preview[Rating.Again].card.due,
    [Rating.Hard]: preview[Rating.Hard].card.due,
    [Rating.Good]: preview[Rating.Good].card.due,
    [Rating.Easy]: preview[Rating.Easy].card.due,
  };
}

export async function gradeReviewItem(item, rating, now = new Date()) {
  const { card } = scheduler.next(item.card, now, rating);
  const updated = { ...item, card, lastReviewedAt: now };
  await writeItem(updated);
  return updated;
}

export async function removeReviewItem(id) {
  const { reviewStore: store } = getStores();
  memoryReview.delete(id);
  if (store) {
    await safeCall(() => del(id, store), () => undefined);
  }
}

// Suggest an FSRS rating from answer accuracy (0-100).
export function suggestRating(percent) {
  if (percent >= 100) return Rating.Good;
  if (percent >= 70) return Rating.Hard;
  return Rating.Again;
}

/**
 * Log one practice attempt for later progress stats.
 * @param {{ task: string, itemId: string, correct: number, total: number }} attempt
 */
export async function logAttempt(attempt, now = new Date()) {
  const record = { ...attempt, at: now };
  const key = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const { historyStore: store } = getStores();

  if (!store) {
    memoryHistory.set(key, record);
    return;
  }
  await safeCall(() => set(key, record, store), () => memoryHistory.set(key, record));
}

export async function getAttempts() {
  const { historyStore: store } = getStores();
  const records = store
    ? await safeCall(() => values(store), () => [...memoryHistory.values()])
    : [...memoryHistory.values()];
  return records.sort((a, b) => new Date(a.at) - new Date(b.at));
}
