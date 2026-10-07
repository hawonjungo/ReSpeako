import { describe, expect, it } from 'vitest';
import {
  fillPassage, initialReorder, scoreBlanks, scoreMultipleChoice, scoreReorder, splitPassage, stableShuffle,
} from './reading';
import {
  checkEssayForm,
  checkSummaryForm,
  countParagraphs,
  countSentences,
  countWords,
  toWritingScale,
} from './writing';

describe('reading scoring', () => {
  it('counts correct blanks', () => {
    const blanks = [{ answer: 'despite' }, { answer: 'rapid' }];
    expect(scoreBlanks(['despite', 'quick'], blanks)).toEqual({ results: [true, false], correct: 1, total: 2 });
  });

  it('scores reorder by correct adjacent pairs', () => {
    expect(scoreReorder(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']).correct).toBe(3);
    // b>c is still a correct pair even though the paragraphs moved.
    expect(scoreReorder(['b', 'c', 'a', 'd'], ['a', 'b', 'c', 'd'])).toMatchObject({ correct: 1, total: 3 });
  });

  it('applies negative marking to multiple answers', () => {
    const item = { multiple: true, answers: ['A', 'C'] };
    expect(scoreMultipleChoice(['A', 'C'], item)).toEqual({ correct: 2, total: 2 });
    expect(scoreMultipleChoice(['A', 'B'], item)).toEqual({ correct: 0, total: 2 });
    expect(scoreMultipleChoice(['A', 'B', 'D'], item)).toEqual({ correct: 0, total: 2 });
  });

  it('scores single answers as right or wrong', () => {
    const item = { multiple: false, answers: ['B'] };
    expect(scoreMultipleChoice(['B'], item).correct).toBe(1);
    expect(scoreMultipleChoice(['A'], item).correct).toBe(0);
  });
});

describe('writing checks', () => {
  it('counts words, sentences and paragraphs', () => {
    expect(countWords("Students' well-being isn't optional.")).toBe(4);
    expect(countSentences('One idea, e.g. sleep, matters. Another follows')).toBe(2);
    expect(countSentences('A single sentence without a full stop')).toBe(1);
    expect(countParagraphs('First.\n\nSecond.\n \nThird.')).toBe(3);
  });

  it('requires one sentence of 5-75 words for a summary', () => {
    expect(checkSummaryForm('Bees pollinate a third of the crops we eat.').form).toBe(1);
    expect(checkSummaryForm('Bees matter. They pollinate crops.').issues).toContain('notOneSentence');
    expect(checkSummaryForm('Too short.').blocksScoring).toBe(true);
  });

  it('applies the PTE essay length bands', () => {
    const essay = (count) => Array(count).fill('word').join(' ');
    expect(checkEssayForm(essay(250)).form).toBe(2);
    expect(checkEssayForm(essay(150)).form).toBe(1);
    expect(checkEssayForm(essay(350)).form).toBe(1);
    expect(checkEssayForm(essay(100))).toMatchObject({ form: 0, blocksScoring: true });
  });

  it('maps trait points to 10-90', () => {
    expect(toWritingScale(15, 15)).toBe(90);
    expect(toWritingScale(0, 15)).toBe(10);
  });
});

describe('reading helpers', () => {
  it('splits a passage into text and blanks', () => {
    expect(splitPassage('A {0} b {1}.')).toEqual([{ text: 'A ' }, { blank: 0 }, { text: ' b ' }, { blank: 1 }, { text: '.' }]);
  });

  it('shuffles the same way every time for the same id', () => {
    expect(stableShuffle([1, 2, 3, 4, 5], 'x')).toEqual(stableShuffle([1, 2, 3, 4, 5], 'x'));
    expect([...stableShuffle([1, 2, 3, 4, 5], 'x')].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('never starts reorder tasks already solved', () => {
    ['rop-001', 'rop-002', 'rop-003', 'a', 'b', 'c'].forEach((id) => {
      const order = initialReorder({ id, paragraphs: ['p', 'q', 'r', 's'] });
      expect(order).not.toEqual([0, 1, 2, 3]);
    });
  });

  it('fills blanks back into the passage', () => {
    expect(fillPassage('A {0} b {1}.', ['x'])).toBe('A x b ____.');
  });
});
