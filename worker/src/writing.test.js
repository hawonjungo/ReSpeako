import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { normaliseFeedback } from './writing';

const TOKEN = 'owner-secret-token';

function createEnv(overrides = {}) {
  const store = new Map();
  return {
    APP_ACCESS_TOKEN: TOKEN,
    GEMINI_API_KEY: 'gemini-key',
    MONTHLY_WRITING_LIMIT: '2',
    USAGE: {
      get: async (key) => store.get(key) ?? null,
      put: async (key, value) => store.set(key, value),
    },
    ...overrides,
  };
}

function writingRequest(body, token = TOKEN) {
  return new Request('https://worker.example/writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

const swtBody = {
  task: 'swt',
  prompt: 'Bees pollinate many crops...',
  answer: 'Bees are vital because they pollinate a third of crops.',
  language: 'vi',
};

function geminiReply(payload) {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
  }));
}

describe('writing feedback endpoint', () => {
  let geminiFetch;

  beforeEach(() => {
    geminiFetch = vi.fn(async () => geminiReply({
      traits: {
        content: { score: 2, comment: 'Tốt' },
        grammar: { score: 5, comment: 'Out of range' },
        vocabulary: { score: 1, comment: 'Ổn' },
      },
      corrections: [{ original: 'vital', suggestion: 'essential', explanation: 'Tự nhiên hơn' }],
      overallComment: 'Khá tốt',
      improvedVersion: 'Bees are essential because they pollinate a third of crops.',
    }));
    vi.stubGlobal('fetch', geminiFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requires the access token', async () => {
    const response = await worker.fetch(writingRequest(swtBody, 'wrong'), createEnv());
    expect(response.status).toBe(401);
    expect(geminiFetch).not.toHaveBeenCalled();
  });

  it('reports when Gemini is not configured', async () => {
    const response = await worker.fetch(writingRequest(swtBody), createEnv({ GEMINI_API_KEY: '' }));
    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe('ai_not_configured');
  });

  it('rejects unknown tasks and oversized answers', async () => {
    const env = createEnv();
    expect((await worker.fetch(writingRequest({ ...swtBody, task: 'poem' }), env)).status).toBe(400);
    expect((await worker.fetch(writingRequest({ ...swtBody, answer: 'x'.repeat(5000) }), env)).status).toBe(400);
    expect(geminiFetch).not.toHaveBeenCalled();
  });

  it('returns clamped feedback and counts usage', async () => {
    const response = await worker.fetch(writingRequest(swtBody), createEnv());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.feedback.traits.find((trait) => trait.name === 'grammar').score).toBe(2);
    expect(body.usage).toEqual({ used: 1, limit: 2 });

    const [url, init] = geminiFetch.mock.calls[0];
    expect(url).toContain('gemini-3.8-flash:generateContent');
    expect(init.headers['x-goog-api-key']).toBe('gemini-key');
    const sent = JSON.parse(init.body);
    expect(sent.systemInstruction.parts[0].text).toContain('Vietnamese');
    expect(sent.contents[0].parts[0].text).toContain('<CANDIDATE_RESPONSE>');
  });

  it('stops at the monthly limit', async () => {
    const env = createEnv({ MONTHLY_WRITING_LIMIT: '1' });
    expect((await worker.fetch(writingRequest(swtBody), env)).status).toBe(200);
    expect((await worker.fetch(writingRequest(swtBody), env)).status).toBe(429);
    expect(geminiFetch).toHaveBeenCalledTimes(1);
  });

  it('maps Gemini rate limiting to a busy error without counting usage', async () => {
    geminiFetch.mockResolvedValueOnce(new Response('{}', { status: 429 }));
    const env = createEnv();
    const response = await worker.fetch(writingRequest(swtBody), env);
    expect(response.status).toBe(503);
    expect(await env.USAGE.get(`writing:${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`)).toBeNull();
  });
});

describe('normaliseFeedback', () => {
  it('fills missing traits with zero and drops empty corrections', () => {
    const feedback = normaliseFeedback('essay', { traits: { content: { score: '3' } }, corrections: [{ original: '' }] });
    expect(feedback.traits).toHaveLength(6);
    expect(feedback.traits[0]).toMatchObject({ name: 'content', score: 3, max: 3 });
    expect(feedback.traits[1].score).toBe(0);
    expect(feedback.corrections).toEqual([]);
  });
});
