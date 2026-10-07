import { describe, expect, it } from 'vitest';
import {
  alignWords, getTextSimilarityScore, matchKeyIdeas, normalizeText, scoreDictation, scoreOpenSpeaking, scoreSpeaking,
} from './scoring';

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

describe('scoreSpeaking', () => {
  it('gives full marks for every word at a natural pace', () => {
    // 6 words in 3 seconds = 120 wpm.
    const result = scoreSpeaking('The seminar starts at nine tomorrow', 'the seminar starts at nine tomorrow', 3);
    expect(result.contentBand).toBe(3);
    expect(result.content).toBe(90);
    expect(result.fluency).toBe(90);
    expect(result.overall).toBe(90);
  });

  it('lowers fluency for very slow speech', () => {
    // 6 words in 6 seconds = 60 wpm.
    const result = scoreSpeaking('The seminar starts at nine tomorrow', 'the seminar starts at nine tomorrow', 6);
    expect(result.fluency).toBeLessThan(30);
  });

  it('uses the PTE content bands', () => {
    expect(scoreSpeaking('one two three four', 'one two three', 2).contentBand).toBe(2);
    expect(scoreSpeaking('one two three four', 'one', 1).contentBand).toBe(1);
    expect(scoreSpeaking('one two three four', '', 0).overall).toBe(10);
  });
});

describe('matchKeyIdeas', () => {
  const groups = [
    { label: 'electric cars', any: ['electric'] },
    { label: 'rise', any: ['increas', 'rise', 'rose', 'grew', 'went up'] },
    { label: '2025', any: ['2025', 'twenty twenty five'] },
  ];

  it('accepts word forms and multi-word alternatives', () => {
    expect(matchKeyIdeas('Sales of electric cars went up a lot', groups).matched).toEqual(['electric cars', 'rise']);
    expect(matchKeyIdeas('It increased sharply by twenty twenty five', groups).matched).toEqual(['rise', '2025']);
  });

  it('does not match short words inside other words', () => {
    expect(matchKeyIdeas('the price was precise', [{ label: 'rise', any: ['rise'] }]).matched).toEqual([]);
  });
});

describe('scoreOpenSpeaking', () => {
  const groups = [{ label: 'a', any: ['alpha'] }, { label: 'b', any: ['beta'] }];
  const longAnswer = `alpha beta ${'word '.repeat(58)}`.trim(); // 60 words

  it('gives full marks for full coverage at a natural pace', () => {
    // 60 words in 30 s = 120 wpm.
    expect(scoreOpenSpeaking(longAnswer, groups, 30)).toMatchObject({ content: 90, fluency: 90, overall: 90 });
  });

  it('scales content down for very short answers', () => {
    expect(scoreOpenSpeaking('alpha beta', groups, 1).content).toBeLessThan(60);
  });

  it('scores silence as the minimum', () => {
    expect(scoreOpenSpeaking('', groups, 0).overall).toBe(10);
  });
});
