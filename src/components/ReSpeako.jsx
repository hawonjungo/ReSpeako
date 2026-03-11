import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import InputPanel from './respeako/InputPanel';
import ActionBar from './respeako/ActionBar';
import FeedbackPanel from './respeako/FeedbackPanel';
import useTextToSpeech from '../hooks/useTextToSpeech';


const ReSpeako = () => {
  // input state
  const [text, setText] = useState('');

  // speech recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const finalTextRef = useRef('');
  const userStoppedRef = useRef(false);

  // ipa result state
  const [ipa, setIpa] = useState('');
  const [definition, setDefinition] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ui state
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const { darkMode } = useContext(ThemeContext);
  const hasText = Boolean(text.trim());
  const transcript = text;

  const { speak } = useTextToSpeech();

  useEffect(() => {
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

        recognitionRef.current = {
          start: async () => {
            if (isListening) return;
            userStoppedRef.current = false;
            setIsListening(true);
            try {
              const result = await SpeechRecognition.start({
                language: 'en-US',
                popup: false,
                partialResults: false,
              });
              setText(result.matches?.[0] || '');
              setTimeout(() => {
                if (isListening && !userStoppedRef.current) recognitionRef.current.start();
              }, 300);
            } catch (error) {
              if (!userStoppedRef.current && isListening) {
                setTimeout(() => {
                  if (isListening && !userStoppedRef.current) recognitionRef.current.start();
                }, 500);
              }
            } finally {
              setIsListening(false);
            }
          },
          stop: async () => {
            userStoppedRef.current = true;
            await SpeechRecognition.stop();
            setIsListening(false);
          }
        };

        import('@capacitor/keyboard').then(({ Keyboard }) => {
          Keyboard.addListener('keyboardDidShow', (info) => {
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

          Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardPadding(0);
          });
        });
      } else {
        const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!WebSpeechRecognition) {
          setErrorMessage('Speech recognition is not supported in this browser.');
          return;
        }

        const recognition = new WebSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        finalTextRef.current = '';

        recognition.onstart = () => setIsListening(true);

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
          setText((finalTextRef.current + interimTranscript).trim());
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    };

    setupRecognition();
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not ready yet.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop?.();
    } else {
      if (Capacitor.getPlatform() === 'web') finalTextRef.current = '';
      setErrorMessage('');
      setText('');
      recognitionRef.current.start?.();
    }
  };

  const handleSpeak = async () => {
    try {
      await speak(text);
    } catch (err) {
      setErrorMessage(err.message || 'Text to speech failed.');
    }
  };

  const fetchIPA = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const phonetic = data[0]?.phonetics?.find(p => p.text)?.text || data[0]?.phonetic || 'No IPA found';
        setIpa(phonetic);
        setDefinition(data[0]?.meanings[0]?.definitions[0]?.definition || '');
        setErrorMessage('');
      } else {
        setIpa('');
        setDefinition('');
        setErrorMessage("Can't find IPA, should be one word.");
      }
    } catch {
      setIpa('');
      setDefinition('');
      setErrorMessage('Error fetching IPA');
    }
  };
  const clearText = () => {
    setText('');
    setIpa('');
    setDefinition('');
    setErrorMessage('');
    finalTextRef.current = '';
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
              onTranscriptChange={setText}
              onClear={clearText}
            />
          </SectionCard>

          <SectionCard>
            <ActionBar
              isListening={isListening}
              hasText={hasText}
              onListen={handleListen}
              onSpeak={handleSpeak}
              onCheckIpa={fetchIPA}
            />
          </SectionCard>

          <SectionCard>
            <FeedbackPanel
              transcript={transcript}
              ipa={ipa}
              definition={definition}
              errorMessage={errorMessage}
            />
          </SectionCard>
        </div>
      </div>
    </PageContainer>

  );
};

export default ReSpeako;
