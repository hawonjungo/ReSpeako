// Client for the owner-only pronunciation Worker (Azure Pronunciation Assessment).
import { Capacitor } from '@capacitor/core';
import { decodeToPcm16k, encodeWav, splitAtPauses } from './wav';
import { recordPhonemeScores } from './phonemeStats';

const ENDPOINT_KEY = 'respeako_pron_endpoint';
const TOKEN_KEY = 'respeako_pron_token';
const ENGINE_KEY = 'respeako_speaking_engine';
const TICKS_PER_SECOND = 10_000_000; // Azure offsets are in 100 ns units.
const MAX_ASSESS_SECONDS = 30;
// Free speaking (no reference) can be split into 30 s chunks, so allow longer answers.
const MAX_UNSCRIPTED_SECONDS = 60;
export const WEAK_WORD_THRESHOLD = 60;

export class PronunciationError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Storage blocked (private mode); settings just will not persist.
  }
}

// The token lives only on this device; it is never part of the built app.
export function getPronunciationConfig() {
  return {
    endpoint: readStorage(ENDPOINT_KEY) || import.meta.env.VITE_PRONUNCIATION_API_URL || '',
    token: readStorage(TOKEN_KEY),
  };
}

export function savePronunciationConfig({ endpoint, token }) {
  writeStorage(ENDPOINT_KEY, endpoint.trim().replace(/\/$/, ''));
  writeStorage(TOKEN_KEY, token.trim());
}

export function isPronunciationConfigured() {
  const { endpoint, token } = getPronunciationConfig();
  return Boolean(endpoint && token);
}

export const SPEAKING_ENGINES = ['auto', 'browser', 'azure'];

export function getSpeakingEnginePreference() {
  const stored = readStorage(ENGINE_KEY);
  return SPEAKING_ENGINES.includes(stored) ? stored : 'auto';
}

export function saveSpeakingEnginePreference(value) {
  writeStorage(ENGINE_KEY, value === 'auto' ? '' : value);
}

/**
 * Which engine scores speaking tasks: 'azure' records audio only and lets Azure
 * recognise it; 'browser' uses live speech recognition. Auto picks Azure on
 * Android, where live recognition and recording fight over the microphone.
 */
export function resolveSpeakingEngine({
  preference = getSpeakingEnginePreference(),
  configured = isPronunciationConfigured(),
  isNative = Capacitor.isNativePlatform(),
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
} = {}) {
  if (!configured || preference === 'browser') return 'browser';
  if (preference === 'azure') return 'azure';
  return isNative || /Android/i.test(userAgent) ? 'azure' : 'browser';
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export async function callWorker(path, init = {}) {
  const { endpoint, token } = getPronunciationConfig();
  if (!endpoint || !token) throw new PronunciationError('not_configured');

  let response;
  try {
    response = await fetch(`${endpoint}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new PronunciationError('network');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new PronunciationError(body.error || 'server_error', body);
  return body;
}

export function fetchPronunciationUsage() {
  return callWorker('/usage');
}

// Azure returns SAPI phones when IPA is not applied; map en-US SAPI to IPA.
const SAPI_TO_IPA = {
  aa: 'ɑ', ae: 'æ', ah: 'ʌ', ao: 'ɔ', aw: 'aʊ', ax: 'ə', ay: 'aɪ', b: 'b', ch: 'tʃ', d: 'd',
  dh: 'ð', eh: 'ɛ', er: 'ɝ', ey: 'eɪ', f: 'f', g: 'ɡ', h: 'h', ih: 'ɪ', iy: 'i', jh: 'dʒ',
  k: 'k', l: 'l', m: 'm', n: 'n', ng: 'ŋ', ow: 'oʊ', oy: 'ɔɪ', p: 'p', r: 'ɹ', s: 's',
  sh: 'ʃ', t: 't', th: 'θ', uh: 'ʊ', uw: 'u', v: 'v', w: 'w', y: 'j', z: 'z', zh: 'ʒ',
};

export function toIpa(phoneme) {
  const value = String(phoneme || '');
  return SAPI_TO_IPA[value.toLowerCase()] || value;
}

// American IPA from Azure -> symbols that have a card on the IPA Explorer page.
const IPA_PAGE_SYMBOLS = {
  i: 'iː', 'iː': 'iː', ɪ: 'ɪ', ʊ: 'ʊ', u: 'uː', 'uː': 'uː', ɛ: 'e', e: 'e', ə: 'ə', ɚ: 'ə',
  ɝ: 'ɜː', 'ɜː': 'ɜː', æ: 'æ', ʌ: 'ʌ', ɑ: 'ɑː', 'ɑː': 'ɑː', ɔ: 'ɔː', 'ɔː': 'ɔː', ɒ: 'ɒ',
  eɪ: 'eɪ', oʊ: 'əʊ', əʊ: 'əʊ', aɪ: 'aɪ', aʊ: 'aʊ', ɔɪ: 'ɔɪ', ɪə: 'ɪə', eə: 'eə', ʊə: 'ʊə',
  p: 'p', b: 'b', t: 't', d: 'd', k: 'k', ɡ: 'ɡ', g: 'ɡ', tʃ: 'tʃ', dʒ: 'dʒ', f: 'f', v: 'v',
  θ: 'θ', ð: 'ð', s: 's', z: 'z', ʃ: 'ʃ', ʒ: 'ʒ', h: 'h', m: 'm', n: 'n', ŋ: 'ŋ', l: 'l',
  r: 'r', ɹ: 'r', w: 'w', j: 'j',
};

export function getIpaPageSymbol(phoneme) {
  return IPA_PAGE_SYMBOLS[phoneme] || null;
}

const scoreOf = (node, key) => {
  const value = node?.PronunciationAssessment?.[key] ?? node?.[key];
  return typeof value === 'number' ? Math.round(value) : null;
};

/** Normalise an Azure detailed response into a compact report. */
export function parseAzureResult(json) {
  const best = json?.NBest?.[0];
  if (json?.RecognitionStatus !== 'Success' || !best) {
    return { status: json?.RecognitionStatus || 'Error', words: [] };
  }

  // Speaking time from the first to the last spoken word.
  const timedWords = (best.Words || []).filter((word) => (
    typeof word.Offset === 'number' && typeof word.Duration === 'number'
    && (word.PronunciationAssessment?.ErrorType || word.ErrorType) !== 'Omission'
  ));
  const speechSeconds = timedWords.length === 0 ? 0 : (
    timedWords[timedWords.length - 1].Offset + timedWords[timedWords.length - 1].Duration - timedWords[0].Offset
  ) / TICKS_PER_SECOND;

  return {
    status: 'Success',
    recognizedText: best.Display || json.DisplayText || '',
    // Lexical form keeps numbers as words ("nine", not "9") to match reference text.
    lexicalText: best.Lexical || best.Display || json.DisplayText || '',
    speechSeconds,
    accuracy: scoreOf(best, 'AccuracyScore'),
    fluency: scoreOf(best, 'FluencyScore'),
    completeness: scoreOf(best, 'CompletenessScore'),
    prosody: scoreOf(best, 'ProsodyScore'),
    pronunciation: scoreOf(best, 'PronScore'),
    words: (best.Words || []).map((word) => ({
      word: word.Word,
      accuracy: scoreOf(word, 'AccuracyScore') ?? 0,
      errorType: word.PronunciationAssessment?.ErrorType || word.ErrorType || 'None',
      phonemes: (word.Phonemes || []).map((phoneme) => ({
        phoneme: toIpa(phoneme.Phoneme),
        accuracy: scoreOf(phoneme, 'AccuracyScore') ?? 0,
      })),
    })),
  };
}

// Words worth a pronunciation flashcard: mispronounced, or spoken but low accuracy.
export function getWeakWords(report, threshold = WEAK_WORD_THRESHOLD) {
  const seen = new Set();
  return report.words.filter((word) => {
    const key = word.word.toLowerCase();
    const weak = word.errorType === 'Mispronunciation'
      || (word.errorType === 'None' && word.accuracy < threshold);
    if (!weak || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function describeWeakSounds(word, threshold = WEAK_WORD_THRESHOLD) {
  return word.phonemes
    .filter((phoneme) => phoneme.accuracy < threshold)
    .map((phoneme) => `/${phoneme.phoneme}/`)
    .join(' ');
}

const SCORE_KEYS = ['accuracy', 'fluency', 'completeness', 'prosody', 'pronunciation'];

/** Combine reports from consecutive audio chunks into one, weighting scores by speaking time. */
export function mergeReports(reports) {
  const successful = reports.filter((report) => report.status === 'Success');
  if (successful.length === 0) return reports[0] || { status: 'Error', words: [] };
  if (successful.length === 1) return successful[0];

  const weightOf = (report) => report.speechSeconds || report.words.length || 1;
  const merged = {
    status: 'Success',
    recognizedText: successful.map((report) => report.recognizedText).join(' ').trim(),
    lexicalText: successful.map((report) => report.lexicalText).join(' ').trim(),
    speechSeconds: successful.reduce((sum, report) => sum + (report.speechSeconds || 0), 0),
    words: successful.flatMap((report) => report.words),
  };

  SCORE_KEYS.forEach((key) => {
    const scored = successful.filter((report) => typeof report[key] === 'number');
    const totalWeight = scored.reduce((sum, report) => sum + weightOf(report), 0);
    merged[key] = totalWeight === 0 ? null : Math.round(
      scored.reduce((sum, report) => sum + report[key] * weightOf(report), 0) / totalWeight
    );
  });

  return merged;
}

/**
 * Convert a recording and score it. With reference text it is a scripted
 * assessment (max 30 s); without, an unscripted one split at pauses.
 */
export async function assessPronunciation({ blob, referenceText = '' }) {
  if (!blob) throw new PronunciationError('no_audio');
  const scripted = Boolean(referenceText.trim());
  const { samples, truncated } = await decodeToPcm16k(
    blob,
    scripted ? MAX_ASSESS_SECONDS : MAX_UNSCRIPTED_SECONDS
  );
  const chunks = scripted ? [{ samples }] : splitAtPauses(samples, MAX_ASSESS_SECONDS);

  const reports = [];
  let usage = null;
  for (const chunk of chunks) {
    const headers = { 'Content-Type': 'audio/wav' };
    if (scripted) headers['X-Reference-Text'] = encodeBase64Utf8(referenceText);
    const body = await callWorker('/assess', { method: 'POST', headers, body: encodeWav(chunk.samples) });
    reports.push(parseAzureResult(body.result));
    usage = body.usage;
  }

  const report = mergeReports(reports);
  // Every assessment feeds the per-sound stats used by the Pronunciation Coach.
  recordPhonemeScores(report).catch(() => undefined);
  return { report, usage, truncated };
}
