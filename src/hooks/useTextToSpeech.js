import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { splitIntoChunks } from '../utils/speechText';

// Prefer a natural US English voice; voices can load after the first call.
const pickEnglishVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((voice) => /^en[-_]US/i.test(voice.lang));
  return english.find((voice) => /Google|Natural|Online|Samantha/i.test(voice.name))
    || english.find((voice) => voice.localService)
    || english[0]
    || voices.find((voice) => /^en/i.test(voice.lang))
    || null;
};

// Increments on every speak/stop so an older queue stops after its current chunk.
let webSpeechRun = 0;
// Utterances must stay referenced, or Chrome can garbage-collect them before onend fires.
const activeUtterances = new Set();

const speakChunk = (text, { rate, voice }) => new Promise((resolve) => {
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang || 'en-US';
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  activeUtterances.add(utterance);

  // Some browsers never fire onend, so fall back to an estimated duration.
  const wordCount = text.split(/\s+/).length;
  let fallback = 0;
  const finish = () => {
    window.clearTimeout(fallback);
    activeUtterances.delete(utterance);
    resolve();
  };
  fallback = window.setTimeout(finish, (wordCount * 600) / rate + 3000);
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
});

export default function useTextToSpeech() {
  // Stable references so callers can safely list them as effect dependencies.
  const stop = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop();
      } catch {
        // Ignore stop errors for this flow.
      }
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      webSpeechRun += 1;
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(async (text, { rate = 1.0 } = {}) => {
    if (!text?.trim()) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.speak({
          text,
          lang: 'en-US',
          rate,
          pitch: 1.0,
          volume: 1.0,
        });
        return;
      } catch {
        throw new Error('Text to speech failed.');
      }
    }

    if (
      typeof window === 'undefined' ||
      typeof window.speechSynthesis === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      throw new Error('Text to speech failed.');
    }

    // Cancel any queued speech so replays start immediately.
    webSpeechRun += 1;
    const run = webSpeechRun;
    window.speechSynthesis.cancel();
    // Chrome can drop an utterance queued in the same tick as cancel().
    await new Promise((resolve) => window.setTimeout(resolve, 50));

    const voice = pickEnglishVoice();
    // Resolve when all speech ends so callers can chain a beep or recording.
    for (const chunk of splitIntoChunks(text)) {
      if (run !== webSpeechRun) return;
      await speakChunk(chunk, { rate, voice });
    }
  }, []);

  return { speak, stop };
}
