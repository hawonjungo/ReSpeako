import { describe, expect, it } from 'vitest';
import { joinText, sessionTranscript, splitIntoChunks } from './speechText';

const result = (transcript, isFinal) => Object.assign([{ transcript }], { isFinal });

describe('sessionTranscript', () => {
  it('joins final results and appends the interim tail', () => {
    const results = [result('Hello there', true), result(' how are', true), result('you to', false)];
    expect(sessionTranscript(results)).toBe('Hello there how are you to');
  });

  it('gives the same text when the same results are delivered again', () => {
    const results = [result('one two', true), result('three', false)];
    expect(sessionTranscript(results)).toBe(sessionTranscript(results));
  });

  it('handles an empty list', () => {
    expect(sessionTranscript([])).toBe('');
  });
});

describe('joinText', () => {
  it('skips empty parts and trims spaces', () => {
    expect(joinText(' first ', '', 'second')).toBe('first second');
  });
});

describe('splitIntoChunks', () => {
  it('keeps short text as one chunk', () => {
    expect(splitIntoChunks('Hello world. How are you?')).toEqual(['Hello world. How are you?']);
  });

  it('splits long text at sentence ends and keeps every word', () => {
    const sentence = 'This sentence is part of a long reading passage for practice. ';
    const text = sentence.repeat(10);
    const chunks = splitIntoChunks(text);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => expect(chunk.length).toBeLessThanOrEqual(180));
    expect(chunks.join(' ')).toBe(text.trim());
  });

  it('splits a long sentence without punctuation at spaces', () => {
    const text = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ');
    const chunks = splitIntoChunks(text);

    chunks.forEach((chunk) => expect(chunk.length).toBeLessThanOrEqual(180));
    expect(chunks.join(' ')).toBe(text);
  });
});
