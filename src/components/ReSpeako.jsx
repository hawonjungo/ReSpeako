import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { Capacitor } from '@capacitor/core';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import InputPanel from './respeako/InputPanel';
import ActionBar from './respeako/ActionBar';
import FeedbackPanel from './respeako/FeedbackPanel';

import useTextToSpeech from '../hooks/useTextToSpeech';
import useDictionaryIpa from '../hooks/useDictionaryIpa';
import useReSpeakoActions from '../hooks/useReSpeakoActions';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const initialFeedback = {
  status: 'idle',
  transcript: '',
  ipa: '',
  definition: '',
  message: '',
  source: '',
};

const ReSpeako = () => {
  // input state
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(initialFeedback);

  const handleTranscriptChange = (nextTranscript, source = 'input') => {
    setText(nextTranscript);
    setFeedback({
      ...initialFeedback,
      transcript: nextTranscript,
      source,
    });
  };

  // speech recognition state
  const {
    isListening,
    speechError,
    toggleListening,
    resetTranscriptBuffer,
  } = useSpeechRecognition({
    onTranscriptChange: (nextTranscript) => handleTranscriptChange(nextTranscript, 'speech'),
  });

  // ui state
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const { darkMode } = useContext(ThemeContext);
  const hasText = Boolean(text.trim());
  const transcript = text;

  const { speak } = useTextToSpeech();
  const { fetchIpa } = useDictionaryIpa();
  const {
    handleListen,
    handleSpeak,
    handleCheckIpa,
    clearText,
    setErrorFeedback,
  } = useReSpeakoActions({
    text,
    setText,
    setFeedback,
    initialFeedback,
    toggleListening,
    resetTranscriptBuffer,
    speak,
    fetchIpa,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let showListener;
    let hideListener;

    import('@capacitor/keyboard').then(({ Keyboard }) => {
      showListener = Keyboard.addListener('keyboardDidShow', (info) => {
        const keyboardHeight = info.keyboardHeight || 300;
        setKeyboardPadding(keyboardHeight + 40);
        setTimeout(() => {
          const active = document.activeElement;
          if (
            active &&
            (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
            typeof active.scrollIntoView === 'function'
          ) {
            active.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      });

      hideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardPadding(0);
      });
    });

    return () => {
      showListener?.then?.((listener) => listener.remove());
      hideListener?.then?.((listener) => listener.remove());
    };
  }, []);

  useEffect(() => {
    if (speechError) {
      setErrorFeedback(speechError, text, 'speech');
    }
  }, [setErrorFeedback, speechError, text]);

  return (
    <PageContainer
      title="Practice"
      description="Speak, type, and review pronunciation in one place."
    >
      <div
        ref={containerRef}
        className={`relative overflow-y-auto ${darkMode ? 'text-white' : 'text-black'}`}
        style={{ paddingBottom: keyboardPadding }}
      >
        <div className="mx-auto max-w-4xl space-y-4">
          <SectionCard>
            <InputPanel
              transcript={transcript}
              inputRef={inputRef}
              onTranscriptChange={handleTranscriptChange}
              onClear={clearText}
            />
          </SectionCard>

          <SectionCard>
            <ActionBar
              isListening={isListening}
              hasText={hasText}
              onListen={handleListen}
              onSpeak={handleSpeak}
              onCheckIpa={handleCheckIpa}
            />
          </SectionCard>

          <SectionCard>
            <FeedbackPanel feedback={feedback} />
          </SectionCard>
        </div>
      </div>
    </PageContainer>

  );
};

export default ReSpeako;
