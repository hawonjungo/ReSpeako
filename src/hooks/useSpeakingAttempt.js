import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import useSpeechRecognition from './useSpeechRecognition';
import useAudioRecorder from './useAudioRecorder';
import { assessPronunciation, PronunciationError } from '../utils/pronunciation';
import { createVoiceDetector } from '../utils/voiceActivity';

// Interim results arrive a little after the learner starts talking.
const RECOGNITION_LAG_MS = 500;
const STOP_TIMEOUT_MS = 2500;
const TICK_MS = 100;

/**
 * One timed speaking response, PTE style. Closes the mic after `maxSeconds`
 * or after `silenceMs` without speech.
 *
 * engine 'browser': live speech recognition, optional recording for playback.
 * engine 'azure': records audio only (no mic conflict on Android), detects
 *   silence from the input level, then Azure recognises and scores it.
 */
export default function useSpeakingAttempt({
  maxSeconds,
  silenceMs = 3000,
  recordAudio = true,
  engine = 'browser',
}) {
  const [phase, setPhase] = useState('idle'); // idle | recording | stopping | assessing | done
  const [transcript, setTranscript] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [speakingSeconds, setSpeakingSeconds] = useState(0);
  const [assessment, setAssessment] = useState(null);
  const [assessError, setAssessError] = useState('');

  const phaseRef = useRef('idle');
  const transcriptRef = useRef('');
  const startAtRef = useRef(0);
  const firstSpeechAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const sawListeningRef = useRef(false);
  const intervalRef = useRef(null);
  const stopTimeoutRef = useRef(null);
  const referenceTextRef = useRef('');
  const runIdRef = useRef(0);

  const useAzure = engine === 'azure';
  const recorder = useAudioRecorder();
  // In browser mode, native speech recognition holds the mic, so recording is web-only.
  const recordingAvailable = recorder.isSupported && (useAzure || !Capacitor.isNativePlatform());
  const canRecord = useAzure ? recorder.isSupported : recordAudio && recordingAvailable;

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
      if (useAzure) return;
      if (phaseRef.current !== 'recording' && phaseRef.current !== 'stopping') return;
      if (!text || text === transcriptRef.current) return;

      const now = Date.now();
      if (!firstSpeechAtRef.current) firstSpeechAtRef.current = now;
      lastSpeechAtRef.current = now;
      transcriptRef.current = text;
      setTranscript(text);
    },
  });

  const measuredSeconds = () => {
    const first = firstSpeechAtRef.current;
    const last = lastSpeechAtRef.current;
    if (first && last > first) return (last - first + (useAzure ? 0 : RECOGNITION_LAG_MS)) / 1000;
    // Native recognition returns one final result, so time from mic open.
    if (last) return (last - startAtRef.current) / 1000;
    return 0;
  };

  const finalize = useCallback(() => {
    if (phaseRef.current !== 'stopping') return;
    window.clearTimeout(stopTimeoutRef.current);
    setSpeakingSeconds(measuredSeconds());
    updatePhase('done');
    // measuredSeconds only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAzureAssessment = async (blob, runId) => {
    updatePhase('assessing');
    try {
      if (!blob) throw new PronunciationError('mic_unavailable');
      const result = await assessPronunciation({ blob, referenceText: referenceTextRef.current });
      if (runId !== runIdRef.current) return;
      if (result.report.status !== 'Success') throw new PronunciationError('no_speech');

      transcriptRef.current = result.report.lexicalText;
      setTranscript(result.report.lexicalText);
      setAssessment(result);
      setSpeakingSeconds(result.report.speechSeconds || measuredSeconds());
    } catch (error) {
      if (runId !== runIdRef.current) return;
      setAssessError(error instanceof PronunciationError ? error.code : 'decode_failed');
      setSpeakingSeconds(measuredSeconds());
    }
    updatePhase('done');
  };

  const stop = useCallback(async () => {
    if (phaseRef.current !== 'recording') return;
    updatePhase('stopping');
    window.clearInterval(intervalRef.current);

    if (useAzure) {
      const runId = runIdRef.current;
      const blob = await recorder.stop();
      if (runId === runIdRef.current) await runAzureAssessment(blob, runId);
      return;
    }

    stopTimeoutRef.current = window.setTimeout(finalize, STOP_TIMEOUT_MS);
    stopListening();
    if (canRecord) await recorder.stop();
    // runAzureAssessment only uses refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRecord, finalize, recorder, stopListening, useAzure]);

  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const start = useCallback(async (referenceText = '') => {
    runIdRef.current += 1;
    referenceTextRef.current = referenceText;
    transcriptRef.current = '';
    firstSpeechAtRef.current = 0;
    lastSpeechAtRef.current = 0;
    sawListeningRef.current = false;
    setTranscript('');
    setElapsed(0);
    setSpeakingSeconds(0);
    setAssessment(null);
    setAssessError('');
    resetTranscriptBuffer();

    const recording = canRecord ? await recorder.start() : false;
    if (useAzure && !recording) {
      setAssessError('mic_unavailable');
      updatePhase('done');
      return;
    }

    updatePhase('recording');
    startAtRef.current = Date.now();
    // Not awaited: on native, start() resolves only when recognition ends.
    if (!useAzure) startListening();

    const voice = createVoiceDetector();
    window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const seconds = (now - startAtRef.current) / 1000;
      setElapsed(Math.min(seconds, maxSeconds));

      if (useAzure && voice.update(recorder.getLevel(), now)) {
        if (!firstSpeechAtRef.current) firstSpeechAtRef.current = voice.firstVoiceAt;
        lastSpeechAtRef.current = voice.lastVoiceAt;
      }

      const silentTooLong = lastSpeechAtRef.current && now - lastSpeechAtRef.current >= silenceMs;
      if (seconds >= maxSeconds || silentTooLong) {
        stopRef.current();
      }
    }, TICK_MS);
  }, [canRecord, maxSeconds, recorder, resetTranscriptBuffer, silenceMs, startListening, useAzure]);

  // Browser mode: recognition can end by itself (or finish after stop); react to either.
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
    runIdRef.current += 1;
    window.clearInterval(intervalRef.current);
    window.clearTimeout(stopTimeoutRef.current);
    if (phaseRef.current === 'recording') {
      if (useAzure) recorder.stop();
      else stopListening();
    }
    recorder.clear();
    transcriptRef.current = '';
    setTranscript('');
    setElapsed(0);
    setSpeakingSeconds(0);
    setAssessment(null);
    setAssessError('');
    updatePhase('idle');
  }, [recorder, stopListening, useAzure]);

  useEffect(() => () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(stopTimeoutRef.current);
  }, []);

  return {
    phase,
    transcript,
    elapsed,
    speakingSeconds,
    assessment,
    assessError,
    audioUrl: recorder.audioUrl,
    audioBlob: recorder.audioBlob,
    recordingAvailable,
    engine,
    error: useAzure ? '' : speechError,
    start,
    stop,
    reset,
  };
}
