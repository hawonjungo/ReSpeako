// Short PTE-style mock test: structure, item selection and skill scoring.
import shuffleArray from './shuffleArray';

// Exam order (speaking, reading, listening), trimmed to about 30 minutes.
export const MOCK_STRUCTURE = [
  { type: 'ra', count: 2 },
  { type: 'rs', count: 3 },
  { type: 'di', count: 1 },
  { type: 'rl', count: 1 },
  { type: 'rwfib', count: 1 },
  { type: 'mc', count: 1 },
  { type: 'rop', count: 1 },
  { type: 'rfib', count: 1 },
  { type: 'wfd', count: 3 },
];

// Integrated scoring: like PTE, one task counts towards several skills.
export const SKILL_MAP = {
  ra: ['speaking', 'reading'],
  rs: ['speaking', 'listening'],
  di: ['speaking'],
  rl: ['speaking', 'listening'],
  rwfib: ['reading', 'writing'],
  mc: ['reading'],
  rop: ['reading'],
  rfib: ['reading'],
  wfd: ['listening', 'writing'],
};

const SPEAKING_TYPES = new Set(['ra', 'rs', 'di', 'rl']);

export const SKILLS = ['speaking', 'listening', 'reading', 'writing'];

/** @param {Record<string, object[]>} banks item banks keyed by task type */
export function buildMockTest(banks, shuffle = shuffleArray) {
  return MOCK_STRUCTURE.flatMap(({ type, count }) => (
    shuffle(banks[type]).slice(0, count).map((item) => ({ type, item }))
  ));
}

/**
 * 0..1 performance for one answered item. Reading and dictation use points
 * scored; speaking items use the 10-90 estimate, blended with Azure
 * pronunciation when available.
 */
export function getItemFactor(result) {
  if (!SPEAKING_TYPES.has(result.type)) {
    return result.total === 0 ? 0 : result.correct / result.total;
  }

  const estimate = Math.max(0, Math.min(1, (result.overall - 10) / 80));
  if (typeof result.pronunciation === 'number') {
    return (estimate * 2 + result.pronunciation / 100) / 3;
  }
  return estimate;
}

export function computeMockScores(results) {
  const scores = {};

  SKILLS.forEach((skill) => {
    const factors = results
      .filter((result) => SKILL_MAP[result.type]?.includes(skill))
      .map(getItemFactor);
    scores[skill] = factors.length === 0
      ? null
      : Math.round(10 + 80 * (factors.reduce((sum, value) => sum + value, 0) / factors.length));
  });

  const available = SKILLS.map((skill) => scores[skill]).filter((value) => value !== null);
  scores.overall = available.length === 0
    ? null
    : Math.round(available.reduce((sum, value) => sum + value, 0) / available.length);

  return scores;
}
