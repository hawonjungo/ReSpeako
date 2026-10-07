// Client for the owner-only pronunciation Worker (Azure Pronunciation Assessment).
import { convertToWav16k } from './wav';

const ENDPOINT_KEY = 'respeako_pron_endpoint';
const TOKEN_KEY = 'respeako_pron_token';
const MAX_ASSESS_SECONDS = 30;
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

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function callWorker(path, init = {}) {
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
  eɪ: 'eɪ', oʊ: 'əʊ', əʊ: 'əʊ', aɪ: 'aɪ', aʊ: 'aʊ', ɔɪ: 'ɔɪ', ɪə: 'ɪə', eə: 'eə', ʊə: 'ʊə', l: 'l',
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

  return {
    status: 'Success',
    recognizedText: best.Display || json.DisplayText || '',
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

/** Convert a recording and score it against the reference text. */
export async function assessPronunciation({ blob, referenceText }) {
  if (!blob) throw new PronunciationError('no_audio');
  const { wav, truncated } = await convertToWav16k(blob, MAX_ASSESS_SECONDS);
  const body = await callWorker('/assess', {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/wav',
      'X-Reference-Text': encodeBase64Utf8(referenceText),
    },
    body: wav,
  });

  return { report: parseAzureResult(body.result), usage: body.usage, truncated };
}
