import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  aggregatePhonemes,
  focusSoundScore,
  getPhonemeStats,
  rankPhonemes,
  recordPhonemeScores,
} from './phonemeStats';

const report = (entries) => ({
  status: 'Success',
  words: entries.map(([word, phonemes, errorType = 'None']) => ({
    word,
    errorType,
    phonemes: phonemes.map(([phoneme, accuracy]) => ({ phoneme, accuracy })),
  })),
});

describe('phoneme statistics', () => {
  it('collects scores per sound and skips omitted words', () => {
    const stats = aggregatePhonemes({}, report([
      ['think', [['θ', 20], ['ɪ', 90]]],
      ['three', [['θ', 40]], 'Omission'],
    ]));
    expect(stats['θ'].recent).toEqual([20]);
    expect(stats['ɪ'].recent).toEqual([90]);
  });

  it('ranks the weakest sounds first once they have enough samples', () => {
    let stats = {};
    for (let i = 0; i < 3; i += 1) {
      stats = aggregatePhonemes(stats, report([['think', [['θ', 30], ['ɪ', 90]]], ['ship', [['ʃ', 60]]]]));
    }
    stats = aggregatePhonemes(stats, report([['red', [['ɹ', 5]]]]));
    const ranked = rankPhonemes(stats);
    expect(ranked.map((entry) => entry.phoneme)).toEqual(['θ', 'ʃ', 'ɪ']);
    expect(ranked[0]).toMatchObject({ average: 30, samples: 3, exampleWord: 'think' });
  });

  it('scores only the focus sounds of a sentence', () => {
    const sentence = report([['three', [['θ', 50], ['ɹ', 90], ['i', 80]]], ['things', [['θ', 70]]]]);
    expect(focusSoundScore(sentence, ['θ'])).toBe(60);
    expect(focusSoundScore(sentence, ['ʒ'])).toBeNull();
  });

  it('persists recorded reports', async () => {
    await recordPhonemeScores(report([['think', [['θ', 25]]]]));
    expect((await getPhonemeStats())['θ'].recent).toEqual([25]);
  });
});
