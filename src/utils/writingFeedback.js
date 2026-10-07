// AI writing feedback through the owner-only Worker (Gemini).
import { callWorker } from './pronunciation';

/**
 * @param {{ task: 'swt' | 'essay', prompt: string, answer: string, language: 'en' | 'vi' }} request
 * @returns {Promise<{ feedback: object, usage: { used: number, limit: number } }>}
 */
export function requestWritingFeedback({ task, prompt, answer, language }) {
  return callWorker('/writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, prompt, answer, language }),
  });
}

// Corrections become short sentence cards so the better phrasing gets practised.
const MAX_CORRECTION_WORDS = 12;
const MAX_CORRECTION_CARDS = 5;

export function getCorrectionReviewItems(task, corrections) {
  return corrections
    .filter((item) => item.suggestion.trim().split(/\s+/).length <= MAX_CORRECTION_WORDS)
    .slice(0, MAX_CORRECTION_CARDS)
    .map((item) => ({
      kind: 'sentence',
      text: item.suggestion,
      source: task,
      note: `✗ ${item.original} — ${item.explanation}`,
    }));
}
