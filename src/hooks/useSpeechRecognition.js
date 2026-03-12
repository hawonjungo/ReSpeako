import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

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
          const hasPermission = await SpeechRecognition.hasPermission();
          if (!hasPermission.granted) {
            await SpeechRecognition.requestPermission();
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
                setSpeechError('Speech recognition failed.');
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

        recognition.onerror = () => {
          setSpeechError('Speech recognition failed.');
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        if (!cancelled) {
          recognitionRef.current = recognition;
        }
      }
    };

    setupRecognition();

    return () => {
      cancelled = true;

      const recognition = recognitionRef.current;

      if (recognition) {
        try {
          recognition.onstart = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          recognition.stop?.();
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

  return {
    isListening,
    speechError,
    toggleListening,
    resetTranscriptBuffer,
  };
}