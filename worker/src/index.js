// ReSpeako pronunciation and writing proxy (Cloudflare Worker).
// Keeps the Azure Speech and Gemini keys server-side and only serves requests that
// carry the owner's personal access token, with monthly usage caps.

import { getWritingUsage, handleWriting } from './writing';

const MAX_AUDIO_SECONDS = 30; // Azure pronunciation assessment limit (REST, short audio).
const WAV_HEADER_BYTES = 44;
const MAX_REFERENCE_CHARS = 1000;
const DEFAULT_MONTHLY_LIMIT_SECONDS = 4.5 * 3600; // Stay under the 5h F0 free tier.

function getAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  if (!origin || !getAllowedOrigins(env).includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Reference-Text',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// Constant-time comparison of SHA-256 digests so the token cannot be guessed byte by byte.
async function tokensMatch(provided, expected) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function getMonthKey(now = new Date()) {
  return `usage:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function getUsage(env) {
  const key = getMonthKey();
  const usedSeconds = Number(await env.USAGE.get(key)) || 0;
  const limitSeconds = Number(env.MONTHLY_LIMIT_SECONDS) || DEFAULT_MONTHLY_LIMIT_SECONDS;
  return { key, usedSeconds, limitSeconds };
}

// Validate a 16 kHz, mono, 16-bit PCM WAV and return its duration in seconds.
function getWavSeconds(buffer) {
  if (buffer.byteLength <= WAV_HEADER_BYTES) return null;
  const view = new DataView(buffer);
  const tag = (offset) => String.fromCharCode(
    view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3)
  );
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;

  const channels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  if (channels !== 1 || sampleRate !== 16000 || bitsPerSample !== 16) return null;

  return (buffer.byteLength - WAV_HEADER_BYTES) / (sampleRate * 2);
}

function decodeBase64Utf8(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function getAzureUrl(env) {
  const base = env.AZURE_SPEECH_ENDPOINT
    ? `${env.AZURE_SPEECH_ENDPOINT.replace(/\/$/, '')}/stt/speech/recognition/conversation/cognitiveservices/v1`
    : `https://${env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
  return `${base}?language=en-US&format=detailed`;
}

async function handleAssess(request, env, cors) {
  let referenceText = '';
  try {
    referenceText = decodeBase64Utf8(request.headers.get('X-Reference-Text') || '').trim();
  } catch {
    return json({ error: 'invalid_reference' }, 400, cors);
  }
  // No reference text = unscripted assessment (free speaking, e.g. Describe Image).
  if (referenceText.length > MAX_REFERENCE_CHARS) {
    return json({ error: 'invalid_reference' }, 400, cors);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  const maxBytes = WAV_HEADER_BYTES + MAX_AUDIO_SECONDS * 16000 * 2;
  if (contentLength > maxBytes) return json({ error: 'audio_too_long' }, 413, cors);

  const audio = await request.arrayBuffer();
  if (audio.byteLength > maxBytes) return json({ error: 'audio_too_long' }, 413, cors);
  const seconds = getWavSeconds(audio);
  if (seconds === null) return json({ error: 'invalid_audio' }, 400, cors);

  const usage = await getUsage(env);
  if (usage.usedSeconds + seconds > usage.limitSeconds) {
    return json({ error: 'monthly_limit_reached', usage }, 429, cors);
  }

  const config = {
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableProsodyAssessment: 'True',
    PhonemeAlphabet: 'IPA',
  };
  if (referenceText) {
    config.ReferenceText = referenceText;
    config.EnableMiscue = 'True';
  }
  const assessment = encodeBase64Utf8(JSON.stringify(config));

  const azureResponse = await fetch(getAzureUrl(env), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      Accept: 'application/json',
      'Pronunciation-Assessment': assessment,
    },
    body: audio,
  });

  if (!azureResponse.ok) {
    return json({ error: 'azure_error', status: azureResponse.status }, 502, cors);
  }

  const result = await azureResponse.json();
  const usedSeconds = usage.usedSeconds + seconds;
  await env.USAGE.put(usage.key, String(usedSeconds), { expirationTtl: 60 * 60 * 24 * 62 });

  return json({ result, usage: { usedSeconds, limitSeconds: usage.limitSeconds } }, 200, cors);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    // Browsers from other sites are refused outright; the token is still required for everyone.
    if (origin && !cors['Access-Control-Allow-Origin']) {
      return json({ error: 'origin_not_allowed' }, 403, {});
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Fail closed when the Worker is not fully configured.
    if (!env.APP_ACCESS_TOKEN || !env.USAGE) {
      return json({ error: 'server_not_configured' }, 500, cors);
    }

    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || !(await tokensMatch(token, env.APP_ACCESS_TOKEN))) {
      return json({ error: 'unauthorized' }, 401, cors);
    }

    const { pathname } = new URL(request.url);

    if (pathname === '/usage' && request.method === 'GET') {
      const { usedSeconds, limitSeconds } = await getUsage(env);
      const writing = await getWritingUsage(env);
      return json({
        usedSeconds,
        limitSeconds,
        writingUsed: writing.used,
        writingLimit: writing.limit,
        writingEnabled: Boolean(env.GEMINI_API_KEY),
      }, 200, cors);
    }

    if (pathname === '/assess' && request.method === 'POST') {
      if (!env.AZURE_SPEECH_KEY || (!env.AZURE_SPEECH_REGION && !env.AZURE_SPEECH_ENDPOINT)) {
        return json({ error: 'server_not_configured' }, 500, cors);
      }
      return handleAssess(request, env, cors);
    }

    if (pathname === '/writing' && request.method === 'POST') {
      return handleWriting(request, env, cors);
    }

    return json({ error: 'not_found' }, 404, cors);
  },
};
