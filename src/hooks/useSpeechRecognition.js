import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { isMobileBrowser } from '../utils/platform';
import { joinText, sessionTranscript } from '../utils/speechText';

// Web Speech API error codes -> learner-facing messages. Codes mapped to '' are not failures.
const WEB_ERROR_MESSAGES = {
  aborted: '',
  'no-speech': '',
  'audio-capture': 'No microphone found, or it is being used by another app or tab.',
  'not-allowed': 'Microphone access is blocked. Allow it in the browser settings (the site must use HTTPS).',
  'service-not-allowed': 'Speech recognition is disabled in this browser. Try Chrome or Edge.',
  // The browser could not reach its vendor's speech service: usually a browser without
  // access to it (Brave, Opera, Chromium, embedded webviews) or a VPN/firewall block.
  network: "This browser can't reach its speech recognition service. Use Google Chrome or Microsoft Edge, and turn off VPN or ad-blocking for this site.",
  'language-not-supported': 'English speech recognition is not available in this browser.',
};

// Errors after which restarting would only fail again.
const FATAL_WEB_ERRORS = new Set([
  'audio-capture',
  'not-allowed',
  'service-not-allowed',
  'network',
  'language-not-supported',
]);

// Sessions that end this fast without any result count as failed restarts.
const QUICK_END_MS = 1000;
const MAX_QUICK_RESTARTS = 3;
// Chrome ends a silent session after ~8s; stop after this many silent sessions in a row.
const MAX_SILENT_SESSIONS = 3;

// The native plugin rejects with "No match" or similar when the learner stays silent.
const isNativeNoSpeech = (error) => /no match|no speech|didn't understand/i.test(String(error?.message || error));

export default function useSpeechRecognition({ onTranscriptChange }) {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const recognitionRef = useRef(null);
  // Text from earlier recognition sessions of the current take.
  const finalTextRef = useRef('');
  const userStoppedRef = useRef(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const isListeningRef = useRef(false);

  const updateListening = (value) => {
    isListeningRef.current = value;
    setIsListening(value);
  };

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

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
            updateListening(true);

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
                  ? 'No speech detected. Tap the mic and try again.'
                  : 'Speech recognition failed.');
              }
            } finally {
              updateListening(false);
            }
          },

          stop: async () => {
            userStoppedRef.current = true;
            try {
              await SpeechRecognition.stop();
            } catch (err) {
              console.warn('Stop speech failed:', err);
            } finally {
              updateListening(false);
            }
          },
        };
        return;
      }

      const WebSpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!WebSpeechRecognition) {
        setSpeechError('Speech recognition is not supported in this browser.');
        return;
      }

      const recognition = new WebSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // Continuous mode on mobile repeats earlier phrases in later results, so mobile
      // listens one phrase per session and the hook restarts it (as on desktop when
      // Chrome ends a session on its own after a pause).
      recognition.continuous = !isMobileBrowser;

      let sessionText = '';
      let sessionStartedAt = 0;
      let sessionHadResult = false;
      let quickRestarts = 0;
      let silentSessions = 0;
      let fatalError = false;

      const emit = () => {
        onTranscriptChangeRef.current?.(joinText(finalTextRef.current, sessionText));
      };

      // Keeps what the session heard, including unfinished interim text, before it is
      // replaced by a new session.
      const commitSession = () => {
        finalTextRef.current = joinText(finalTextRef.current, sessionText);
        sessionText = '';
      };

      const startSession = () => {
        sessionText = '';
        sessionHadResult = false;
        sessionStartedAt = Date.now();
        try {
          recognition.start();
          return true;
        } catch (err) {
          // InvalidStateError: the previous session is still running.
          if (err?.name === 'InvalidStateError') return true;
          console.warn('Speech recognition start failed:', err);
          setSpeechError('Speech recognition could not start.');
          return false;
        }
      };

      recognition.onresult = (event) => {
        sessionHadResult = true;
        sessionText = sessionTranscript(event.results);
        emit();
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error, event.message);
        if (FATAL_WEB_ERRORS.has(event.error)) fatalError = true;
        const message = WEB_ERROR_MESSAGES[event.error];
        if (message !== '') {
          setSpeechError(message ?? `Speech recognition failed (${event.error}).`);
        }
      };

      recognition.onend = () => {
        commitSession();

        const wantsMore = !userStoppedRef.current && !fatalError;
        if (wantsMore) {
          const endedQuickly = !sessionHadResult && Date.now() - sessionStartedAt < QUICK_END_MS;
          quickRestarts = endedQuickly ? quickRestarts + 1 : 0;
          silentSessions = sessionHadResult ? 0 : silentSessions + 1;

          const canRestart = quickRestarts <= MAX_QUICK_RESTARTS && silentSessions < MAX_SILENT_SESSIONS;
          if (canRestart && startSession()) return;
          if (quickRestarts > MAX_QUICK_RESTARTS) {
            setSpeechError('Speech recognition keeps stopping. Check the microphone and try again.');
          }
        }

        emit();
        updateListening(false);
      };

      if (cancelled) return;

      recognitionRef.current = {
        start: () => {
          if (isListeningRef.current) return;
          userStoppedRef.current = false;
          fatalError = false;
          quickRestarts = 0;
          silentSessions = 0;
          setSpeechError('');
          if (startSession()) updateListening(true);
        },
        stop: () => {
          userStoppedRef.current = true;
          try {
            recognition.stop();
          } catch (err) {
            console.warn('Speech recognition stop failed:', err);
            updateListening(false);
          }
        },
        raw: recognition,
      };
    };

    setupRecognition();

    return () => {
      cancelled = true;
      userStoppedRef.current = true;

      const recognition = recognitionRef.current?.raw;

      if (recognition) {
        try {
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
