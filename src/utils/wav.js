// Convert recorder output (webm/ogg) into the 16 kHz mono PCM WAV Azure expects.

export const TARGET_SAMPLE_RATE = 16000;

export function encodeWav(samples, sampleRate = TARGET_SAMPLE_RATE) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeTag = (offset, tag) => {
    for (let i = 0; i < tag.length; i += 1) view.setUint8(offset + i, tag.charCodeAt(i));
  };

  writeTag(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeTag(8, 'WAVE');
  writeTag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeTag(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Decode, downmix and resample a recording, keeping at most `maxSeconds`.
 * Returns { wav, seconds, truncated }.
 */
export async function convertToWav16k(blob, maxSeconds = 30) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const decoder = new AudioContextClass();
  let decoded;
  try {
    decoded = await decoder.decodeAudioData(await blob.arrayBuffer());
  } finally {
    decoder.close();
  }

  const seconds = Math.min(decoded.duration, maxSeconds);
  const frameCount = Math.ceil(seconds * TARGET_SAMPLE_RATE);
  // A mono offline context downmixes and resamples in one pass.
  const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  return {
    wav: encodeWav(rendered.getChannelData(0)),
    seconds,
    truncated: decoded.duration > maxSeconds,
  };
}
