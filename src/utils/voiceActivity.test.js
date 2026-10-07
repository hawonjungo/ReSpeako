import { describe, expect, it } from 'vitest';
import { createVoiceDetector } from './voiceActivity';

describe('createVoiceDetector', () => {
  it('ignores steady background noise', () => {
    const detector = createVoiceDetector();
    for (let t = 0; t < 2000; t += 100) detector.update(0.004, t);
    expect(detector.firstVoiceAt).toBe(0);
  });

  it('tracks first and last speech over the noise floor', () => {
    const detector = createVoiceDetector();
    detector.update(0.004, 0);
    detector.update(0.005, 100);
    expect(detector.update(0.08, 200)).toBe(true);
    detector.update(0.06, 300);
    detector.update(0.005, 400);
    expect(detector.firstVoiceAt).toBe(200);
    expect(detector.lastVoiceAt).toBe(300);
  });

  it('raises the bar in a noisy room', () => {
    const detector = createVoiceDetector();
    detector.update(0.02, 0);
    expect(detector.update(0.03, 100)).toBe(false);
    expect(detector.update(0.09, 200)).toBe(true);
  });

  it('keeps detecting speech during a long answer', () => {
    const detector = createVoiceDetector();
    detector.update(0.004, 0);
    // 40 seconds of continuous speech sampled every 100 ms.
    for (let t = 100; t <= 40000; t += 100) detector.update(0.02, t);
    expect(detector.lastVoiceAt).toBe(40000);
  });

  it('skips missing readings', () => {
    expect(createVoiceDetector().update(null, 0)).toBe(false);
  });
});
