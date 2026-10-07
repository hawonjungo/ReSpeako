import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import useSpeechRecognition from './useSpeechRecognition';
import useAudioRecorder from './useAudioRecorder';

// Interim results arrive a little after the learner starts talking.
const RECOGNITION_LAG_MS = 500;
const STOP_TIMEOUT_MS = 2500;

/**
 * One timed speaking response, PTE style: listens with speech recognition,
 * optionally records audio for playback, and closes the mic after
 * `maxSeconds` or after `silenceMs` without new words.
 */
export default function useSpeakingAttempt({ maxSeconds, silenceMs = 3000, recordAudio = true }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | stopping | done
  const [transcript, setTranscript] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [speakingSeconds, setSpeakingSeconds] = useState(0);

  const phaseRef = useRef('idle');
  const transcriptRef = useRef('');
  const startAtRef = useRef(0);
  const firstSpeechAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const sawListeningRef = useRef(false);
  const intervalRef = useRef(null);
  const stopTimeoutRef = useRef(null);

  const recorder = useAudioRecorder();
  // Native speech recognition holds the mic, so playback recording is web-only.
  const recordingAvailable = recorder.isSupported && !Capacitor.isNativePlatform();
  const canRecord = recordAudio && recordingAvailable;

  const updatePhase = (next) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const {
    isListening,
    speechError,
    startListening,
    stopListening,
    resetTranscriptBuffer,
  } = useSpeechRecognition({
    onTranscriptChange: (text) => {
      if (phaseRef.current !== 'recording' && phaseRef.current !== 'stopping') return;
      if (!text || text === transcriptRef.current) return;

      const now = Date.now();
      if (!firstSpeechAtRef.current) firstSpeechAtRef.current = now;
      lastSpeechAtRef.current = now;
      transcriptRef.current = text;
      setTranscript(text);
    },
  });

  const finalize = useCallback(() => {
    if (phaseRef.current !== 'stopping') return;
    window.clearTimeout(stopTimeoutRef.current);

    const first = firstSpeechAtRef.current;
    const last = lastSpeechAtRef.current;
    let seconds = 0;
    if (first && last > first) {
      seconds = (last - first + RECOGNITION_LAG_MS) / 1000;
    } else if (last) {
      // Native recognition returns one final result, so time from mic open.
      seconds = (last - startAtRef.current) / 1000;
    }

    setSpeakingSeconds(seconds);
    updatePhase('done');
  }, []);

  const stop = useCallback(async () => {
    if (phaseRef.current !== 'recording') return;
    updatePhase('stopping');
    window.clearInterval(intervalRef.current);
    stopTimeoutRef.current = window.setTimeout(finalize, STOP_TIMEOUT_MS);
    stopListening();
    if (canRecord) await recorder.stop();
  }, [canRecord, finalize, recorder, stopListening]);

  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const start = useCallback(async () => {
    transcriptRef.current = '';
    firstSpeechAtRef.current = 0;
    lastSpeechAtRef.current = 0;
    sawListeningRef.current = false;
    setTranscript('');
    setElapsed(0);
    setSpeakingSeconds(0);
    resetTranscriptBuffer();

    if (canRecord) await recorder.start();

    updatePhase('recording');
    startAtRef.current = Date.now();
    // Not awaited: on native, start() resolves only when recognition ends.
    startListening();

    window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const seconds = (now - startAtRef.current) / 1000;
      setElapsed(Math.min(seconds, maxSeconds));

      const silentTooLong = lastSpeechAtRef.current && now - lastSpeechAtRef.current >= silenceMs;
      if (seconds >= maxSeconds || silentTooLong) {
        stopRef.current();
      }
    }, 250);
  }, [canRecord, maxSeconds, recorder, resetTranscriptBuffer, silenceMs, startListening]);

  // Recognition can end by itself (or finish after stop); react to either.
  useEffect(() => {
    if (isListening) {
      sawListeningRef.current = true;
      return;
    }
    if (!sawListeningRef.current) return;

    if (phaseRef.current === 'recording') {
      stopRef.current();
    } else if (phaseRef.current === 'stopping') {
      finalize();
    }
  }, [finalize, isListening]);

  const reset = useCallback(() => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(stopTimeoutRef.current);
    if (phaseRef.current === 'recording') stopListening();
    recorder.clear();
    transcriptRef.current = '';
    setTranscript('');
    setElapsed(0);
    setSpeakingSeconds(0);
    updatePhase('idle');
  }, [recorder, stopListening]);

  useEffect(() => () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(stopTimeoutRef.current);
  }, []);

  return {
    phase,
    transcript,
    elapsed,
    speakingSeconds,
    audioUrl: recorder.audioUrl,
    recordingAvailable,
    error: speechError,
    start,
    stop,
    reset,
  };
}
