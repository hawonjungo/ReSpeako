import { useCallback } from 'react';

export default function useReSpeakoActions({
  text,
  setText,
  setFeedback,
  initialFeedback,
  toggleListening,
  resetTranscriptBuffer,
  speak,
  fetchIpa,
}) {
  const resetFeedback = useCallback((transcript = '') => {
    setFeedback({
      ...initialFeedback,
      transcript,
    });
  }, [initialFeedback, setFeedback]);

  const setLoadingFeedback = useCallback((
    transcript,
    message = 'Checking pronunciation...',
    source = 'dictionary'
  ) => {
    setFeedback({
      status: 'loading',
      transcript,
      ipa: '',
      definition: '',
      message,
      source,
    });
  }, [setFeedback]);

  const setErrorFeedback = useCallback((message, transcript = '', source = '') => {
    setFeedback({
      status: 'error',
      transcript,
      ipa: '',
      definition: '',
      message,
      source,
    });
  }, [setFeedback]);

  const setSuccessFeedback = useCallback(({
    transcript,
    ipa,
    definition,
    message = '',
    source = 'dictionary',
  }) => {
    setFeedback({
      status: 'success',
      transcript,
      ipa,
      definition,
      message,
      source,
    });
  }, [setFeedback]);

  const handleListen = useCallback(() => {
    resetFeedback('');
    toggleListening();
  }, [resetFeedback, toggleListening]);

  const handleSpeak = useCallback(async () => {
    try {
      await speak(text);
    } catch (err) {
      setErrorFeedback(err.message || 'Text to speech failed.', text, 'tts');
    }
  }, [setErrorFeedback, speak, text]);

  const handleCheckIpa = useCallback(async () => {
    if (!text.trim()) return;

    try {
      setLoadingFeedback(text);
      const result = await fetchIpa(text);
      setSuccessFeedback({
        transcript: text,
        ipa: result.ipa,
        definition: result.definition,
      });
    } catch (err) {
      setErrorFeedback(err.message || 'Error fetching IPA.', text, 'dictionary');
    }
  }, [fetchIpa, setErrorFeedback, setLoadingFeedback, setSuccessFeedback, text]);

  const clearText = useCallback(() => {
    setText('');
    resetFeedback();
    resetTranscriptBuffer();
  }, [resetFeedback, resetTranscriptBuffer, setText]);

  return {
    handleListen,
    handleSpeak,
    handleCheckIpa,
    clearText,
    setErrorFeedback,
  };
}
