import { useCallback, useEffect, useRef, useState } from 'react';

// Records the microphone with MediaRecorder so learners can replay their own voice,
// and exposes the live input level for silence detection.
export default function useAudioRecorder() {
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const urlRef = useRef('');
  const levelContextRef = useRef(null);
  const analyserRef = useRef(null);
  const levelBufferRef = useRef(null);

  const isSupported = typeof window !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof window.MediaRecorder !== 'undefined';

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    levelContextRef.current?.close().catch(() => undefined);
    levelContextRef.current = null;
    analyserRef.current = null;
  };

  const startLevelMeter = (stream) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    context.createMediaStreamSource(stream).connect(analyser);
    levelContextRef.current = context;
    analyserRef.current = analyser;
    levelBufferRef.current = new Float32Array(analyser.fftSize);
  };

  // Current RMS input level (0..1), or null when no meter is running.
  const getLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return null;
    const buffer = levelBufferRef.current;
    analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
    return Math.sqrt(sum / buffer.length);
  }, []);

  const clear = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = '';
    setAudioUrl('');
    setAudioBlob(null);
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return false;
    clear();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      startLevelMeter(stream);
      recorder.start();
      return true;
    } catch (error) {
      console.warn('Audio recording unavailable.', error);
      releaseStream();
      return false;
    }
  }, [clear, isSupported]);

  const stop = useCallback(() => new Promise((resolve) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      releaseStream();
      resolve(null);
      return;
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudioUrl(url);
      setAudioBlob(blob);
      releaseStream();
      recorderRef.current = null;
      resolve(blob);
    };
    recorder.stop();
  }), []);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    releaseStream();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  return { audioUrl, audioBlob, isSupported, start, stop, clear, getLevel };
}
