import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// Web Speech API error codes -> learner-facing messages. Codes mapped to '' are not failures.
const WEB_ERROR_MESSAGES = {
  aborted: '',
  'no-speech': 'No speech detected. Tap the mic and try again.',
  'audio-capture': 'No microphone found, or it is being used by another app or tab.',
  'not-allowed': 'Microphone access is blocked. Allow it in the browser settings (the site must use HTTPS).',
  'service-not-allowed': 'Speech recognition is disabled in this browser. Try Chrome or Edge.',
  // The browser could not reach its vendor's speech service: usually a browser without
  // access to it (Brave, Opera, Chromium, embedded webviews) or a VPN/firewall block.
  network: "This browser can't reach its speech recognition service. Use Google Chrome or Microsoft Edge, and turn off VPN or ad-blocking for this site.",
  'language-not-supported': 'English speech recognition is not available in this browser.',
};

// The native plugin rejects with "No match" or similar when the learner stays silent.
const isNativeNoSpeech = (error) => /no match|no speech|didn't understand/i.test(String(error?.message || error));

export default function useSpeechRecognition({ onTranscriptChange }) {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const recognitionRef = useRef(null);
  const finalTextRef = useRef('');
  const userStoppedRef = useRef(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const isListeningRef = useRef(false);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    let cancelled = false;

    const setupRecognition = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await SpeechRecognition.checkPermissions();
          if (status.speechRecognition !== 'granted') {
            await SpeechRecognition.requestPermissions();
          }
        } catch (err) {
          console.warn('Permission error:', err);
        }

        if (cancelled) return;

        recognitionRef.current = {
          start: async () => {
            if (isListeningRef.current) return;

            userStoppedRef.current = false;
            setSpeechError('');
            setIsListening(true);

            try {
              const result = await SpeechRecognition.start({
                language: 'en-US',
                popup: false,
                partialResults: false,
              });

              const transcript = result.matches?.[0] || '';
              onTranscriptChangeRef.current?.(transcript);
            } catch (error) {
              if (!userStoppedRef.current) {
                console.warn('Native speech recognition error:', error);
                setSpeechError(isNativeNoSpeech(error)
                  ? WEB_ERROR_MESSAGES['no-speech']
                  : 'Speech recognition failed.');
              }
            } finally {
              setIsListening(false);
            }
          },

          stop: async () => {
            userStoppedRef.current = true;
            try {
              await SpeechRecognition.stop();
            } catch (err) {
              console.warn('Stop speech failed:', err);
            } finally {
              setIsListening(false);
            }
          },
        };
      } else {
        const WebSpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!WebSpeechRecognition) {
          setSpeechError('Speech recognition is not supported in this browser.');
          return;
        }

        const recognition = new WebSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
          setSpeechError('');
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTextRef.current += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          onTranscriptChangeRef.current?.(
            (finalTextRef.current + interimTranscript).trim()
          );
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error, event.message);
          const message = WEB_ERROR_MESSAGES[event.error];
          setSpeechError(message ?? `Speech recognition failed (${event.error}).`);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        if (!cancelled) {
          recognitionRef.current = {
            start: () => {
              try {
                recognition.start();
              } catch (err) {
                // InvalidStateError: a session is still running or closing.
                console.warn('Speech recognition start failed:', err);
                if (err?.name !== 'InvalidStateError') {
                  setSpeechError('Speech recognition could not start.');
                }
              }
            },
            stop: () => recognition.stop(),
            raw: recognition,
          };
        }
      }
    };

    setupRecognition();

    return () => {
      cancelled = true;

      const recognition = recognitionRef.current?.raw;

      if (recognition) {
        try {
          recognition.onstart = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          recognition.abort?.();
        } catch (err) {
          console.warn('Cleanup speech recognition failed:', err);
        }
      }
    };
  }, []);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not ready yet.');
      return;
    }

    if (isListeningRef.current) {
      await recognitionRef.current.stop?.();
    } else {
      finalTextRef.current = '';
      setSpeechError('');
      onTranscriptChangeRef.current?.('');
      await recognitionRef.current.start?.();
    }
  };

  const resetTranscriptBuffer = () => {
    finalTextRef.current = '';
  };

  const startListening = async () => {
    if (!isListeningRef.current) await toggleListening();
  };

  const stopListening = async () => {
    if (isListeningRef.current) await toggleListening();
  };

  return {
    isListening,
    speechError,
    toggleListening,
    startListening,
    stopListening,
    resetTranscriptBuffer,
  };
}