// Per-sound pronunciation statistics, built from every Azure assessment.
import { createStore, get, set } from 'idb-keyval';

const STATS_KEY = 'stats';
// Only the most recent scores count, so the stats follow your progress.
const RECENT_LIMIT = 30;
// A sound needs a few samples before it is ranked.
export const MIN_SAMPLES = 3;

let store;
let memoryStats = {};

function getStore() {
  if (store === undefined) {
    try {
      store = createStore('respeako-phonemes', 'stats');
    } catch {
      store = null;
    }
  }
  return store;
}

/** Fold one report's phoneme scores into the stats object (pure). */
export function aggregatePhonemes(stats, report) {
  const next = { ...stats };
  (report?.words || []).forEach((word) => {
    if (word.errorType === 'Omission' || word.errorType === 'Insertion') return;
    (word.phonemes || []).forEach(({ phoneme, accuracy }) => {
      if (!phoneme || typeof accuracy !== 'number') return;
      const recent = [...(next[phoneme]?.recent || []), accuracy].slice(-RECENT_LIMIT);
      next[phoneme] = { recent, word: word.word };
    });
  });
  return next;
}

/** Sounds ranked weakest first, with average accuracy over recent samples. */
export function rankPhonemes(stats, minSamples = MIN_SAMPLES) {
  return Object.entries(stats)
    .map(([phoneme, entry]) => ({
      phoneme,
      samples: entry.recent.length,
      average: Math.round(entry.recent.reduce((sum, value) => sum + value, 0) / entry.recent.length),
      exampleWord: entry.word,
    }))
    .filter((entry) => entry.samples >= minSamples)
    .sort((a, b) => a.average - b.average);
}

/** Average accuracy of the given sounds within one report, or null if none occur. */
export function focusSoundScore(report, symbols) {
  const wanted = new Set(symbols);
  const scores = (report?.words || [])
    .flatMap((word) => word.phonemes || [])
    .filter((phoneme) => wanted.has(phoneme.phoneme))
    .map((phoneme) => phoneme.accuracy);
  return scores.length === 0 ? null : Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

export async function getPhonemeStats() {
  const target = getStore();
  if (!target) return memoryStats;
  try {
    return (await get(STATS_KEY, target)) || {};
  } catch {
    return memoryStats;
  }
}

export async function recordPhonemeScores(report) {
  if (report?.status !== 'Success') return;
  const next = aggregatePhonemes(await getPhonemeStats(), report);
  memoryStats = next;
  const target = getStore();
  if (!target) return;
  try {
    await set(STATS_KEY, next, target);
  } catch {
    // Storage blocked: keep the in-memory copy for this session.
  }
}
