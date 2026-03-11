import { Capacitor } from '@capacitor/core';

export default function useTextToSpeech() {
  const speak = async (text) => {
    if (!text?.trim()) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.speak({
          text,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
        });
      } catch (err) {
        throw new Error('Text to speech failed.');
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return { speak };
}