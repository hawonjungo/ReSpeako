// Scoring for PTE reading tasks (all deterministic, no AI needed).

/** Fill in the blanks: one point per correctly filled blank. */
export function scoreBlanks(answers, blanks) {
  const results = blanks.map((blank, index) => answers[index] === blank.answer);
  return {
    results,
    correct: results.filter(Boolean).length,
    total: blanks.length,
  };
}

/**
 * Reorder Paragraphs, PTE style: one point for every pair of adjacent
 * paragraphs that also appear next to each other, in that order, in the key.
 */
export function scoreReorder(order, correctOrder) {
  const correctPairs = new Set();
  for (let i = 0; i < correctOrder.length - 1; i += 1) {
    correctPairs.add(`${correctOrder[i]}>${correctOrder[i + 1]}`);
  }

  const pairResults = [];
  for (let i = 0; i < order.length - 1; i += 1) {
    pairResults.push(correctPairs.has(`${order[i]}>${order[i + 1]}`));
  }

  return {
    pairResults,
    correct: pairResults.filter(Boolean).length,
    total: Math.max(0, correctOrder.length - 1),
  };
}

/**
 * Multiple choice. Multiple answers use PTE negative marking:
 * +1 per correct option, -1 per wrong option, never below 0.
 */
export function scoreMultipleChoice(selected, item) {
  const correctSet = new Set(item.answers);
  const right = selected.filter((option) => correctSet.has(option)).length;
  const wrong = selected.length - right;

  if (!item.multiple) {
    return { correct: right === 1 && wrong === 0 ? 1 : 0, total: 1 };
  }
  return { correct: Math.max(0, right - wrong), total: item.answers.length };
}

// Split "text {0} more {1}" into strings and blank indexes.
export function splitPassage(text) {
  return text.split(/(\{\d+\})/).map((part) => {
    const match = part.match(/^\{(\d+)\}$/);
    return match ? { blank: Number(match[1]) } : { text: part };
  });
}

// Stable pseudo-random order per item id, so the layout does not jump between renders.
export function stableShuffle(list, seed) {
  let hash = 0;
  for (const char of seed) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    hash = (Math.imul(hash, 1103515245) + 12345) >>> 0;
    const j = hash % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Initial shuffled order of paragraph indexes, never already correct.
export function initialReorder(item) {
  const indexes = item.paragraphs.map((_, index) => index);
  const shuffled = stableShuffle(indexes, item.id);
  const alreadySorted = shuffled.every((value, index) => value === index);
  return alreadySorted ? [...shuffled.slice(1), shuffled[0]] : shuffled;
}

// Fill a passage's blanks with the given words.
export function fillPassage(text, words) {
  return text.replace(/\{(\d+)\}/g, (match, index) => words[Number(index)] || '____');
}
