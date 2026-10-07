// Level-based voice activity detection, used when no live transcript exists
// (Azure mode records audio only and recognises it afterwards).

const MIN_VOICE_LEVEL = 0.015;
const NOISE_MULTIPLIER = 3;

export function createVoiceDetector() {
  let noiseFloor = null;
  let firstVoiceAt = 0;
  let lastVoiceAt = 0;

  return {
    /** Feed one RMS reading; returns true when it counts as speech. */
    update(level, now) {
      if (level === null || level === undefined) return false;

      if (noiseFloor === null) noiseFloor = level;
      const isVoice = level >= Math.max(MIN_VOICE_LEVEL, noiseFloor * NOISE_MULTIPLIER);

      // Learn the room's background noise only from non-speech readings, so a
      // long answer never raises the bar above the speaker's own voice.
      if (!isVoice) noiseFloor = Math.min(level, noiseFloor * 1.05 + 0.0001);

      if (isVoice) {
        if (!firstVoiceAt) firstVoiceAt = now;
        lastVoiceAt = now;
      }
      return isVoice;
    },
    get firstVoiceAt() {
      return firstVoiceAt;
    },
    get lastVoiceAt() {
      return lastVoiceAt;
    },
  };
}
