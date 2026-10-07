import { describe, expect, it } from 'vitest';
import { encodeWav } from './wav';
import {
  describeWeakSounds,
  resolveSpeakingEngine,
  getIpaPageSymbol,
  getWeakWords,
  parseAzureResult,
  toIpa,
} from './pronunciation';

const flatResponse = {
  RecognitionStatus: 'Success',
  DisplayText: 'Think about it.',
  NBest: [{
    Display: 'Think about it.',
    AccuracyScore: 72.4,
    FluencyScore: 90,
    CompletenessScore: 100,
    ProsodyScore: 81.2,
    PronScore: 80.6,
    Words: [
      {
        Word: 'think',
        Offset: 5_000_000,
        Duration: 4_000_000,
        AccuracyScore: 40,
        ErrorType: 'Mispronunciation',
        Phonemes: [
          { Phoneme: 'θ', AccuracyScore: 12 },
          { Phoneme: 'ɪ', AccuracyScore: 90 },
          { Phoneme: 'ŋ', AccuracyScore: 70 },
          { Phoneme: 'k', AccuracyScore: 95 },
        ],
      },
      { Word: 'about', Offset: 10_000_000, Duration: 5_000_000, AccuracyScore: 55, ErrorType: 'None', Phonemes: [] },
      { Word: 'it', AccuracyScore: 0, ErrorType: 'Omission', Phonemes: [] },
    ],
  }],
};

describe('parseAzureResult', () => {
  it('reads scores, words and phonemes from the flat format', () => {
    const report = parseAzureResult(flatResponse);
    expect(report).toMatchObject({ status: 'Success', accuracy: 72, prosody: 81, pronunciation: 81 });
    expect(report.words[0].phonemes[0]).toEqual({ phoneme: 'θ', accuracy: 12 });
    // From 0.5 s (think) to 1.5 s (end of about); the omitted word is ignored.
    expect(report.speechSeconds).toBeCloseTo(1);
  });

  it('reads the nested PronunciationAssessment format', () => {
    const report = parseAzureResult({
      RecognitionStatus: 'Success',
      NBest: [{
        Display: 'Hi.',
        PronunciationAssessment: { AccuracyScore: 88, FluencyScore: 70, CompletenessScore: 100, PronScore: 85 },
        Words: [{ Word: 'hi', PronunciationAssessment: { AccuracyScore: 88, ErrorType: 'None' }, Phonemes: [] }],
      }],
    });
    expect(report.accuracy).toBe(88);
    expect(report.words[0]).toMatchObject({ word: 'hi', accuracy: 88, errorType: 'None' });
  });

  it('reports failed recognition', () => {
    expect(parseAzureResult({ RecognitionStatus: 'InitialSilenceTimeout' }).status).toBe('InitialSilenceTimeout');
  });
});

describe('weak words', () => {
  it('keeps mispronounced and low-accuracy words but not omissions', () => {
    const weak = getWeakWords(parseAzureResult(flatResponse));
    expect(weak.map((word) => word.word)).toEqual(['think', 'about']);
    expect(describeWeakSounds(weak[0])).toBe('/θ/');
  });
});

describe('resolveSpeakingEngine', () => {
  const base = { preference: 'auto', configured: true, isNative: false, userAgent: 'Windows Chrome' };

  it('uses the browser when Azure is not configured', () => {
    expect(resolveSpeakingEngine({ ...base, configured: false, preference: 'azure' })).toBe('browser');
  });

  it('picks Azure automatically on Android only', () => {
    expect(resolveSpeakingEngine(base)).toBe('browser');
    expect(resolveSpeakingEngine({ ...base, isNative: true })).toBe('azure');
    expect(resolveSpeakingEngine({ ...base, userAgent: 'Linux; Android 14' })).toBe('azure');
  });

  it('respects an explicit choice', () => {
    expect(resolveSpeakingEngine({ ...base, preference: 'azure' })).toBe('azure');
    expect(resolveSpeakingEngine({ ...base, isNative: true, preference: 'browser' })).toBe('browser');
  });
});

describe('phoneme helpers', () => {
  it('maps SAPI phones to IPA and IPA to explorer cards', () => {
    expect(toIpa('th')).toBe('θ');
    expect(toIpa('θ')).toBe('θ');
    expect(getIpaPageSymbol('oʊ')).toBe('əʊ');
    expect(getIpaPageSymbol('ɹ')).toBe('r');
    expect(getIpaPageSymbol('x')).toBeNull();
  });
});

describe('encodeWav', () => {
  it('writes a 16 kHz mono PCM header', async () => {
    const blob = encodeWav(new Float32Array([0, 0.5, -0.5, 1]));
    const view = new DataView(await blob.arrayBuffer());
    expect(blob.size).toBe(44 + 8);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getInt16(44 + 6, true)).toBe(0x7fff);
  });
});
