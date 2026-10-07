import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

const TOKEN = 'owner-secret-token';
const ORIGIN = 'https://respeako.relifes.net';

function createEnv(overrides = {}) {
  const store = new Map();
  return {
    APP_ACCESS_TOKEN: TOKEN,
    AZURE_SPEECH_KEY: 'azure-key',
    AZURE_SPEECH_REGION: 'southeastasia',
    ALLOWED_ORIGINS: `${ORIGIN},https://localhost`,
    MONTHLY_LIMIT_SECONDS: '60',
    USAGE: {
      get: async (key) => store.get(key) ?? null,
      put: async (key, value) => store.set(key, value),
    },
    ...overrides,
  };
}

// Minimal 16 kHz mono 16-bit WAV with `seconds` of silence.
function createWav(seconds, { sampleRate = 16000, channels = 1 } = {}) {
  const dataBytes = Math.round(seconds * sampleRate * 2 * channels);
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const write = (offset, text) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2 * channels, true);
  view.setUint16(32, 2 * channels, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, dataBytes, true);
  return buffer;
}

function assessRequest({ token = TOKEN, origin = ORIGIN, body = createWav(2), reference = 'Good morning' } = {}) {
  const headers = { 'Content-Type': 'audio/wav' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  if (reference !== null) headers['X-Reference-Text'] = btoa(reference);
  return new Request('https://worker.example/assess', { method: 'POST', headers, body });
}

describe('pronunciation worker', () => {
  let azureFetch;

  beforeEach(() => {
    azureFetch = vi.fn(async () => new Response(JSON.stringify({ RecognitionStatus: 'Success', NBest: [] })));
    vi.stubGlobal('fetch', azureFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers CORS preflight for allowed origins', async () => {
    const response = await worker.fetch(
      new Request('https://worker.example/assess', { method: 'OPTIONS', headers: { Origin: ORIGIN } }),
      createEnv()
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('rejects other websites', async () => {
    const response = await worker.fetch(assessRequest({ origin: 'https://evil.example' }), createEnv());
    expect(response.status).toBe(403);
    expect(azureFetch).not.toHaveBeenCalled();
  });

  it('rejects missing or wrong tokens without calling Azure', async () => {
    const env = createEnv();
    expect((await worker.fetch(assessRequest({ token: '' }), env)).status).toBe(401);
    expect((await worker.fetch(assessRequest({ token: 'guess' }), env)).status).toBe(401);
    expect(azureFetch).not.toHaveBeenCalled();
  });

  it('fails closed when the access token is not configured', async () => {
    const response = await worker.fetch(assessRequest(), createEnv({ APP_ACCESS_TOKEN: '' }));
    expect(response.status).toBe(500);
    expect(azureFetch).not.toHaveBeenCalled();
  });

  it('rejects audio that is not 16 kHz mono WAV', async () => {
    const response = await worker.fetch(assessRequest({ body: createWav(1, { sampleRate: 44100 }) }), createEnv());
    expect(response.status).toBe(400);
  });

  it('forwards valid audio to Azure and counts usage', async () => {
    const env = createEnv();
    const response = await worker.fetch(assessRequest(), env);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.usage.usedSeconds).toBeCloseTo(2);
    const [url, init] = azureFetch.mock.calls[0];
    expect(url).toContain('southeastasia.stt.speech.microsoft.com');
    expect(init.headers['Ocp-Apim-Subscription-Key']).toBe('azure-key');
    expect(JSON.parse(atob(init.headers['Pronunciation-Assessment'])).ReferenceText).toBe('Good morning');
  });

  it('stops at the monthly limit', async () => {
    const env = createEnv({ MONTHLY_LIMIT_SECONDS: '3' });
    expect((await worker.fetch(assessRequest(), env)).status).toBe(200);
    expect((await worker.fetch(assessRequest(), env)).status).toBe(429);
    expect(azureFetch).toHaveBeenCalledTimes(1);
  });

  it('reports usage to the owner', async () => {
    const response = await worker.fetch(
      new Request('https://worker.example/usage', { headers: { Authorization: `Bearer ${TOKEN}` } }),
      createEnv()
    );
    expect(await response.json()).toEqual({ usedSeconds: 0, limitSeconds: 60 });
  });
});
