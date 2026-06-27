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

const READ_ALOUD_DURATION = 40;

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

  const [timeLeft, setTimeLeft] = useState(READ_ALOUD_DURATION);
  const [isReadAloudActive, setIsReadAloudActive] = useState(false);
   const [showTimerBadge, setShowTimerBadge] = useState(false);
  const timerRef = useRef(null);

  const startReadAloud = async () => {
    setTimeLeft(READ_ALOUD_DURATION);
    setIsReadAloudActive(true);
     setShowTimerBadge(true);
  };

  const stopReadAloud = async () => {
    setIsReadAloudActive(false);
  };

  useEffect(() => {
    if (!isReadAloudActive) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsReadAloudActive(false);
          setShowTimerBadge(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isReadAloudActive]);

  // ui state
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const { darkMode } = useContext(ThemeContext);
  const hasText = Boolean(text.trim());
  const transcript = text;

  const { speak, stop: stopSpeaking } = useTextToSpeech();
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
    stopSpeaking,
    onClearText: () => {
      setTimeLeft(READ_ALOUD_DURATION);
      setIsReadAloudActive(false);
      setShowTimerBadge(false);
    },
  });
  const handleListenAction = async () => {
    if (!isListening) {
      setTimeLeft(READ_ALOUD_DURATION);
      setIsReadAloudActive(true);
      setShowTimerBadge(true);
    } else {
      setShowTimerBadge(false);
      setIsReadAloudActive(false);
    }

    await handleListen();
  };
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

  const handleSpeakAction = async () => {
    setTimeLeft(READ_ALOUD_DURATION);
    setIsReadAloudActive(true);
    setShowTimerBadge(true);

    await handleSpeak();
  };

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
              showTimer={showTimerBadge}
              timeLeft={timeLeft}
            />
          </SectionCard>

          <SectionCard>
            <ActionBar
              isListening={isListening}
              hasText={hasText}
              onListen={handleListenAction}
              onSpeak={handleSpeakAction}
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
