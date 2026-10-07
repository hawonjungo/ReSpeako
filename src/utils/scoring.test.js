import { describe, expect, it } from 'vitest';
import { alignWords, getTextSimilarityScore, normalizeText, scoreDictation } from './scoring';

describe('normalizeText', () => {
  it('lowercases, strips punctuation and collapses spaces', () => {
    expect(normalizeText('  Hello,   World! ')).toBe('hello world');
  });
});

describe('getTextSimilarityScore', () => {
  it('returns 1 for identical text ignoring case and punctuation', () => {
    expect(getTextSimilarityScore('The cat sat.', 'the cat sat')).toBe(1);
  });

  it('does not collapse when the first word is missing', () => {
    expect(getTextSimilarityScore('the cat sat on the mat', 'cat sat on the mat')).toBeCloseTo(5 / 6);
  });

  it('returns 0 when either side is empty', () => {
    expect(getTextSimilarityScore('', 'hello')).toBe(0);
    expect(getTextSimilarityScore('hello', '')).toBe(0);
  });
});

describe('alignWords', () => {
  it('marks misspelled, missing and extra words', () => {
    const parts = alignWords('students must submit essays', 'students submitt essays today');
    expect(parts).toEqual([
      { status: 'correct', word: 'students', typed: 'students' },
      { status: 'missing', word: 'must' },
      { status: 'wrong', word: 'submit', typed: 'submitt' },
      { status: 'correct', word: 'essays', typed: 'essays' },
      { status: 'extra', typed: 'today' },
    ]);
  });
});

describe('scoreDictation', () => {
  it('gives one point per correct reference word', () => {
    const result = scoreDictation('The library closes at nine.', 'the libary closes at nine');
    expect(result.correct).toBe(4);
    expect(result.total).toBe(5);
    expect(result.percent).toBe(80);
    expect(result.missedWords).toEqual(['library']);
  });

  it('does not penalise extra words', () => {
    expect(scoreDictation('research is vital', 'the research is very vital').correct).toBe(3);
  });

  it('scores empty answers as zero', () => {
    expect(scoreDictation('research is vital', '').percent).toBe(0);
  });
});
