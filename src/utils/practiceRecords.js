// Shared rules for logging an answer and sending its mistakes to the review notebook,
// so practice pages and the mock test treat mistakes the same way.
import { normalizeText } from './scoring';
import { addReviewItems, logAttempt } from './reviewStore';
import { describeWeakSounds, getWeakWords } from './pronunciation';

// Function words are not worth a flashcard on their own; sentence cards cover them.
const SKIP_WORD_CARDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'and', 'or',
  'is', 'are', 'was', 'be', 'it', 'its', 'as', 'has', 'have', 'will', 'that', 'they',
]);

// The sentence containing a missed word gives the review card some context.
export function findSentenceWithWord(passage, word) {
  const sentences = passage.match(/[^.!?]+[.!?]?/g) || [passage];
  return (sentences.find((sentence) => normalizeText(sentence).split(' ').includes(word)) || '').trim();
}

export function getDictationReviewItems(item, scored) {
  const items = [...new Set(scored.missedWords)]
    .filter((word) => !SKIP_WORD_CARDS.has(word))
    .map((word) => ({ kind: 'word', text: word, source: 'wfd', note: item.text }));
  if (scored.percent < 100) items.push({ kind: 'sentence', text: item.text, source: 'wfd' });
  return items;
}

export function getReadAloudReviewItems(passage, scored, transcript) {
  // Silence usually means a mic problem, not a reading problem.
  if (!transcript.trim()) return [];
  return [...new Set(scored.missedWords)]
    .filter((word) => !SKIP_WORD_CARDS.has(word))
    .map((word) => ({ kind: 'word', text: word, source: 'ra', note: findSentenceWithWord(passage.text, word) }));
}

export function getRepeatSentenceReviewItems(item, scored, transcript) {
  if (!transcript.trim() || scored.contentBand >= 3) return [];
  return [{ kind: 'sentence', text: item.text, source: 'rs' }];
}

export function getWeakPronunciationItems(assessment, source) {
  if (!assessment?.report || assessment.report.status !== 'Success') return [];
  return getWeakWords(assessment.report).map((word) => ({
    kind: 'pronunciation',
    text: word.word,
    source,
    note: describeWeakSounds(word),
  }));
}

/** Log the attempt and save review items; returns how many new cards were added. */
export async function recordAnswer({ task, itemId, correct, total, reviewItems = [] }) {
  await logAttempt({ task, itemId, correct, total });
  return reviewItems.length > 0 ? addReviewItems(reviewItems) : 0;
}
