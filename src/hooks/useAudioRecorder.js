import { useCallback, useEffect, useRef, useState } from 'react';

// Records the microphone with MediaRecorder so learners can replay their own voice.
export default function useAudioRecorder() {
  const [audioUrl, setAudioUrl] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const urlRef = useRef('');

  const isSupported = typeof window !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof window.MediaRecorder !== 'undefined';

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clear = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = '';
    setAudioUrl('');
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
      resolve('');
      return;
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudioUrl(url);
      releaseStream();
      recorderRef.current = null;
      resolve(url);
    };
    recorder.stop();
  }), []);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    releaseStream();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  return { audioUrl, isSupported, start, stop, clear };
}
