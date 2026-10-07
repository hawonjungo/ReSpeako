// Parsing and scoring for PTE listening tasks (deterministic, no AI needed).

/**
 * Highlight Incorrect Words source format: "The {library|museum} opens at nine."
 * shows "library" on screen while the audio says "museum".
 */
export function parseHighlightText(text) {
  const tokens = [];
  const spoken = [];
  const wrongIndexes = [];

  text.split(/\s+/).filter(Boolean).forEach((raw) => {
    const match = raw.match(/^([^{]*)\{([^|}]+)\|([^}]+)\}(.*)$/);
    if (match) {
      const [, before, shown, said, after] = match;
      wrongIndexes.push(tokens.length);
      tokens.push(`${before}${shown}${after}`);
      spoken.push(`${before}${said}${after}`);
    } else {
      tokens.push(raw);
      spoken.push(raw);
    }
  });

  return { tokens, spokenText: spoken.join(' '), wrongIndexes };
}

/** +1 for each correctly highlighted word, -1 for each wrong highlight, minimum 0. */
export function scoreHighlights(selected, wrongIndexes) {
  const wrongSet = new Set(wrongIndexes);
  const hits = selected.filter((index) => wrongSet.has(index)).length;
  const falseClicks = selected.length - hits;
  return {
    correct: Math.max(0, hits - falseClicks),
    total: wrongIndexes.length,
    hits,
    falseClicks,
  };
}

const normaliseTyped = (value) => String(value || '').trim().toLowerCase().replace(/[.,;:!?]+$/, '');

/** Listening Fill in the Blanks: exact spelling required, case and trailing punctuation ignored. */
export function scoreTypedBlanks(answers, correctWords) {
  const results = correctWords.map((word, index) => normaliseTyped(answers[index]) === normaliseTyped(word));
  return { results, correct: results.filter(Boolean).length, total: correctWords.length };
}
