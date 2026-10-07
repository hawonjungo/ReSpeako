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

const QUIET_WINDOW_SECONDS = 0.1;
const SPLIT_SEARCH_SECONDS = 4;

// Index of the quietest 100 ms window near `target`, so a split lands in a pause.
export function findQuietSplit(samples, target, sampleRate = TARGET_SAMPLE_RATE) {
  const windowSize = Math.round(QUIET_WINDOW_SECONDS * sampleRate);
  const radius = Math.round(SPLIT_SEARCH_SECONDS * sampleRate);
  const from = Math.max(0, target - radius);
  const to = Math.min(samples.length - windowSize, target + radius);
  let bestIndex = target;
  let bestEnergy = Infinity;

  for (let start = from; start <= to; start += windowSize) {
    let energy = 0;
    for (let i = start; i < start + windowSize; i += 1) energy += samples[i] * samples[i];
    if (energy < bestEnergy) {
      bestEnergy = energy;
      bestIndex = start + Math.floor(windowSize / 2);
    }
  }
  return bestIndex;
}

/**
 * Split audio into chunks no longer than `maxChunkSeconds`, cutting at pauses.
 * Returns [{ samples, startSeconds }].
 */
export function splitAtPauses(samples, maxChunkSeconds = 30, sampleRate = TARGET_SAMPLE_RATE) {
  const maxChunk = Math.floor(maxChunkSeconds * sampleRate);
  if (samples.length <= maxChunk) return [{ samples, startSeconds: 0 }];

  const chunkCount = Math.ceil(samples.length / maxChunk);
  const evenSize = Math.ceil(samples.length / chunkCount);
  // Leave room for the pause search so no chunk can exceed the limit.
  const slack = Math.min(SPLIT_SEARCH_SECONDS * sampleRate, Math.floor((maxChunk - evenSize) / 2));
  const chunks = [];
  let start = 0;

  for (let index = 1; index < chunkCount; index += 1) {
    const target = index * evenSize;
    let cut = slack > 0 ? findQuietSplit(samples, target, sampleRate) : target;
    cut = Math.min(Math.max(cut, target - slack), target + slack, start + maxChunk);
    chunks.push({ samples: samples.subarray(start, cut), startSeconds: start / sampleRate });
    start = cut;
  }
  chunks.push({ samples: samples.subarray(start), startSeconds: start / sampleRate });
  return chunks;
}

/** Decode, downmix and resample a recording to 16 kHz mono, keeping at most `maxSeconds`. */
export async function decodeToPcm16k(blob, maxSeconds) {
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
    samples: rendered.getChannelData(0),
    seconds,
    truncated: decoded.duration > maxSeconds,
  };
}
