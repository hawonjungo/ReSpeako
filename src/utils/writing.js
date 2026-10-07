// Local checks for PTE writing tasks: word counts and the Form trait.

export function countWords(text) {
  const words = String(text || '').trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  return words ? words.length : 0;
}

// Sentence-ending punctuation followed by a space and a new word, or the end of the text.
// Common abbreviations are ignored so "e.g. the" does not count as a new sentence.
export function countSentences(text) {
  const cleaned = String(text || '')
    .replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Prof|approx)\./gi, '$1')
    .trim();
  if (!cleaned) return 0;
  const endings = cleaned.match(/[.!?]+(?=\s+\S|$)/g) || [];
  return Math.max(1, endings.length + (/[.!?]$/.test(cleaned) ? 0 : 1));
}

export function countParagraphs(text) {
  return String(text || '').split(/\n\s*\n/).filter((block) => block.trim()).length;
}

/**
 * Summarize Written Text form (0-1): one sentence of 5-75 words.
 * As in PTE, a zero for form means the response gets no other credit.
 */
export function checkSummaryForm(text) {
  const words = countWords(text);
  const sentences = countSentences(text);
  const issues = [];
  if (words < 5) issues.push('tooShort');
  if (words > 75) issues.push('tooLong');
  if (sentences !== 1) issues.push('notOneSentence');
  return { words, sentences, form: issues.length === 0 ? 1 : 0, max: 1, issues, blocksScoring: issues.length > 0 };
}

/**
 * Essay form (0-2): 200-300 words = 2, 120-199 or 301-380 = 1, otherwise 0.
 * Outside 120-380 words PTE gives no credit for the other traits.
 */
export function checkEssayForm(text) {
  const words = countWords(text);
  const paragraphs = countParagraphs(text);
  let form = 0;
  if (words >= 200 && words <= 300) form = 2;
  else if ((words >= 120 && words < 200) || (words > 300 && words <= 380)) form = 1;

  const issues = [];
  if (words < 200) issues.push('tooShort');
  if (words > 300) issues.push('tooLong');
  if (paragraphs < 3) issues.push('fewParagraphs');
  return { words, paragraphs, form, max: 2, issues, blocksScoring: form === 0 };
}

/** Convert trait points to an indicative 10-90 score. */
export function toWritingScale(points, maxPoints) {
  if (!maxPoints) return 10;
  return Math.round(10 + 80 * Math.max(0, Math.min(1, points / maxPoints)));
}

/**
 * Summarize Spoken Text form (0-2): 50-70 words = 2, 40-49 or 71-100 = 1, otherwise 0.
 * Under 40 or over 100 words PTE gives no credit for the other traits.
 */
export function checkSpokenSummaryForm(text) {
  const words = countWords(text);
  let form = 0;
  if (words >= 50 && words <= 70) form = 2;
  else if ((words >= 40 && words < 50) || (words > 70 && words <= 100)) form = 1;

  const issues = [];
  if (words < 50) issues.push('tooShort');
  if (words > 70) issues.push('tooLong');
  return { words, form, max: 2, issues, blocksScoring: form === 0 };
}
