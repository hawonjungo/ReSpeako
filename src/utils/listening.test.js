import { describe, expect, it } from 'vitest';
import { parseHighlightText, scoreHighlights, scoreTypedBlanks } from './listening';
import { checkSpokenSummaryForm } from './writing';

describe('parseHighlightText', () => {
  it('builds the shown words, the spoken text and the wrong positions', () => {
    const parsed = parseHighlightText('The {library|museum} opens at {nine.|ten.}');
    expect(parsed.tokens).toEqual(['The', 'library', 'opens', 'at', 'nine.']);
    expect(parsed.spokenText).toBe('The museum opens at ten.');
    expect(parsed.wrongIndexes).toEqual([1, 4]);
  });

  it('keeps punctuation around a changed word', () => {
    const parsed = parseHighlightText('(the {rapid|slow}) growth');
    expect(parsed.tokens[1]).toBe('rapid)');
    expect(parsed.spokenText).toBe('(the slow) growth');
  });
});

describe('scoreHighlights', () => {
  it('applies negative marking', () => {
    expect(scoreHighlights([1, 4], [1, 4])).toMatchObject({ correct: 2, total: 2 });
    expect(scoreHighlights([1, 2], [1, 4])).toMatchObject({ correct: 0, hits: 1, falseClicks: 1 });
    expect(scoreHighlights([0, 2, 3], [1, 4]).correct).toBe(0);
  });
});

describe('scoreTypedBlanks', () => {
  it('needs exact spelling but ignores case and trailing punctuation', () => {
    const scored = scoreTypedBlanks(['Climate.', 'enviroment'], ['climate', 'environment']);
    expect(scored).toEqual({ results: [true, false], correct: 1, total: 2 });
  });
});

describe('checkSpokenSummaryForm', () => {
  const words = (count) => Array(count).fill('word').join(' ');

  it('applies the PTE 50-70 word bands', () => {
    expect(checkSpokenSummaryForm(words(60)).form).toBe(2);
    expect(checkSpokenSummaryForm(words(45)).form).toBe(1);
    expect(checkSpokenSummaryForm(words(90)).form).toBe(1);
    expect(checkSpokenSummaryForm(words(30))).toMatchObject({ form: 0, blocksScoring: true });
  });
});
