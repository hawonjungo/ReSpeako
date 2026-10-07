// Shared text comparison helpers for dictation, shadowing and review tasks.

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeWords(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ') : [];
}

// Longest-common-subsequence table so a missed or extra word does not shift
// every following word out of alignment.
function buildLcsTable(a, b) {
  const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  return table;
}

function getMatchedPairs(a, b) {
  const table = buildLcsTable(a, b);
  const pairs = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return pairs;
}

function getEditDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }

  return previous[b.length];
}

function getCharSimilarity(a, b) {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - getEditDistance(a, b) / longest;
}

// Inside a gap between matched words, pair each typed word with the most
// similar reference word (order preserved) so "submitt" lines up with "submit".
function alignGap(gapRef, gapTyped) {
  const rows = gapRef.length;
  const cols = gapTyped.length;
  const best = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      // Small bonus so pairing is preferred over leaving both words unpaired.
      const pairScore = getCharSimilarity(gapRef[i], gapTyped[j]) + 0.1 + best[i + 1][j + 1];
      best[i][j] = Math.max(best[i + 1][j], best[i][j + 1], pairScore);
    }
  }

  const parts = [];
  let i = 0;
  let j = 0;

  while (i < rows || j < cols) {
    if (i < rows && j < cols) {
      const pairScore = getCharSimilarity(gapRef[i], gapTyped[j]) + 0.1 + best[i + 1][j + 1];
      if (best[i][j] === pairScore) {
        parts.push({ status: 'wrong', word: gapRef[i], typed: gapTyped[j] });
        i += 1;
        j += 1;
        continue;
      }
    }

    if (i < rows && (j >= cols || best[i][j] === best[i + 1][j])) {
      parts.push({ status: 'missing', word: gapRef[i] });
      i += 1;
    } else {
      parts.push({ status: 'extra', typed: gapTyped[j] });
      j += 1;
    }
  }

  return parts;
}

/**
 * Align typed words against the reference.
 * Returns parts with status: correct | wrong (misspelled) | missing | extra.
 */
export function alignWords(referenceText, typedText) {
  const reference = tokenizeWords(referenceText);
  const typed = tokenizeWords(typedText);
  const pairs = [...getMatchedPairs(reference, typed), [reference.length, typed.length]];
  const parts = [];
  let refIndex = 0;
  let typedIndex = 0;

  pairs.forEach(([nextRef, nextTyped]) => {
    parts.push(...alignGap(reference.slice(refIndex, nextRef), typed.slice(typedIndex, nextTyped)));

    if (nextRef < reference.length) {
      parts.push({ status: 'correct', word: reference[nextRef], typed: typed[nextTyped] });
    }

    refIndex = nextRef + 1;
    typedIndex = nextTyped + 1;
  });

  return parts;
}

// 0..1 similarity based on words matched in order.
export function getTextSimilarityScore(referenceText, heardText) {
  const reference = tokenizeWords(referenceText);
  const heard = tokenizeWords(heardText);

  if (reference.length === 0 || heard.length === 0) {
    return 0;
  }

  const matched = getMatchedPairs(reference, heard).length;
  return matched / Math.max(reference.length, heard.length);
}

/**
 * PTE-style Write from Dictation scoring: one point per correctly spelled
 * reference word. Extra words do not cost points, as in the real exam.
 */
export function scoreDictation(referenceText, typedText) {
  const parts = alignWords(referenceText, typedText);
  const total = tokenizeWords(referenceText).length;
  const correct = parts.filter((part) => part.status === 'correct').length;
  const missedWords = parts
    .filter((part) => part.status === 'missing' || part.status === 'wrong')
    .map((part) => part.word);

  return {
    parts,
    correct,
    total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
    missedWords,
  };
}
