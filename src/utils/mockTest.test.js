import { describe, expect, it } from 'vitest';
import { buildMockTest, computeMockScores, getItemFactor, MOCK_STRUCTURE } from './mockTest';

const bank = (prefix) => Array.from({ length: 5 }, (_, index) => ({ id: `${prefix}-${index}` }));
const banks = { ra: bank('ra'), rs: bank('rs'), di: bank('di'), rl: bank('rl'), wfd: bank('wfd') };

describe('buildMockTest', () => {
  it('follows the exam order and section sizes', () => {
    const items = buildMockTest(banks, (list) => list);
    const expected = MOCK_STRUCTURE.flatMap(({ type, count }) => Array(count).fill(type));
    expect(items.map((entry) => entry.type)).toEqual(expected);
    expect(new Set(items.map((entry) => entry.item.id)).size).toBe(items.length);
  });
});

describe('getItemFactor', () => {
  it('uses word accuracy for dictation', () => {
    expect(getItemFactor({ type: 'wfd', correct: 6, total: 8 })).toBe(0.75);
  });

  it('maps the 10-90 estimate and blends in Azure pronunciation', () => {
    expect(getItemFactor({ type: 'rs', overall: 90 })).toBe(1);
    expect(getItemFactor({ type: 'rs', overall: 50 })).toBe(0.5);
    expect(getItemFactor({ type: 'ra', overall: 90, pronunciation: 40 })).toBeCloseTo(0.8);
  });
});

describe('computeMockScores', () => {
  it('counts each task towards all of its skills', () => {
    const scores = computeMockScores([
      { type: 'rs', overall: 90 }, // speaking + listening
      { type: 'wfd', correct: 0, total: 5 }, // listening + writing
    ]);
    expect(scores.speaking).toBe(90);
    expect(scores.listening).toBe(50);
    expect(scores.writing).toBe(10);
    expect(scores.reading).toBeNull();
    expect(scores.overall).toBe(50);
  });

  it('returns nulls when nothing was answered', () => {
    expect(computeMockScores([]).overall).toBeNull();
  });
});
