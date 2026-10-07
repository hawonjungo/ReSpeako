import { describe, expect, it } from 'vitest';
import { scoreDictation, scoreSpeaking } from './scoring';
import {
  findSentenceWithWord,
  getDictationReviewItems,
  getReadAloudReviewItems,
  getRepeatSentenceReviewItems,
  getWeakPronunciationItems,
} from './practiceRecords';

const sentence = { text: 'The library closes at nine.' };

describe('practice review rules', () => {
  it('saves missed content words and the sentence for dictation', () => {
    const items = getDictationReviewItems(sentence, scoreDictation(sentence.text, 'library closes at nine'));
    expect(items).toEqual([{ kind: 'sentence', text: sentence.text, source: 'wfd' }]);

    const misspelled = getDictationReviewItems(sentence, scoreDictation(sentence.text, 'the libary closes at nine'));
    expect(misspelled.map((item) => item.text)).toEqual(['library', sentence.text]);
  });

  it('skips repeat sentence cards for silence or a perfect answer', () => {
    expect(getRepeatSentenceReviewItems(sentence, scoreSpeaking(sentence.text, '', 0), '')).toEqual([]);
    expect(getRepeatSentenceReviewItems(sentence, scoreSpeaking(sentence.text, sentence.text, 2), sentence.text)).toEqual([]);
    expect(getRepeatSentenceReviewItems(sentence, scoreSpeaking(sentence.text, 'the library', 1), 'the library')).toHaveLength(1);
  });

  it('gives read aloud word cards their sentence as context', () => {
    const passage = { text: 'Bees pollinate flowers. Farmers depend on them.' };
    const transcript = 'bees pollinate flowers farmers on them';
    const items = getReadAloudReviewItems(passage, scoreSpeaking(passage.text, transcript, 3), transcript);
    expect(items).toEqual([{ kind: 'word', text: 'depend', source: 'ra', note: 'Farmers depend on them.' }]);
    expect(findSentenceWithWord(passage.text, 'bees')).toBe('Bees pollinate flowers.');
  });

  it('turns weak Azure words into pronunciation cards', () => {
    const assessment = {
      report: {
        status: 'Success',
        words: [
          { word: 'think', accuracy: 40, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'θ', accuracy: 10 }] },
          { word: 'well', accuracy: 95, errorType: 'None', phonemes: [] },
        ],
      },
    };
    expect(getWeakPronunciationItems(assessment, 'di')).toEqual([
      { kind: 'pronunciation', text: 'think', source: 'di', note: '/θ/' },
    ]);
    expect(getWeakPronunciationItems(null, 'di')).toEqual([]);
  });
});
