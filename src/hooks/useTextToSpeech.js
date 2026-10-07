import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

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
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, stop };
}
