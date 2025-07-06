import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import RotatingText from './RotatingText';
import StarBorder from './StarBorder';

const ReSpeako = () => {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [word, setWord] = useState('');
  const [ipa, setIpa] = useState('');
  const [definition, setDefinition] = useState('');
  const [ipaError, setIpaError] = useState('');
  const recognitionRef = useRef(null);
  const finalTextRef = useRef('');
  const userStoppedRef = useRef(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const ipaInputRef = useRef(null); // 👈 ref mới cho input IPA
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const { darkMode } = useContext(ThemeContext);

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
            if (listening) return;
            userStoppedRef.current = false;
            setListening(true);
            try {
              const result = await SpeechRecognition.start({
                language: 'en-US',
                popup: false,
                partialResults: false,
              });
              setText(result.matches?.[0] || '');
              setTimeout(() => {
                if (listening && !userStoppedRef.current) recognitionRef.current.start();
              }, 300);
            } catch (error) {
              if (!userStoppedRef.current && listening) {
                setTimeout(() => {
                  if (listening && !userStoppedRef.current) recognitionRef.current.start();
                }, 500);
              }
            } finally {
              setListening(false);
            }
          },
          stop: async () => {
            userStoppedRef.current = true;
            await SpeechRecognition.stop();
            setListening(false);
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
          alert('Your browser does not support Speech Recognition');
          return;
        }

        const recognition = new WebSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        finalTextRef.current = '';

        recognition.onstart = () => setListening(true);

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

        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
      }
    };

    setupRecognition();
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not ready.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop?.();
    } else {
      if (Capacitor.getPlatform() === 'web') finalTextRef.current = '';
      setText('');
      recognitionRef.current.start?.();
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;
    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.speak({ text, lang: 'en-US', rate: 1.0, pitch: 1.0, volume: 1.0 });
      } catch (err) {
        alert('Text to Speech failed.');
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchIPA = async () => {
    if (!word.trim()) return;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const phonetic = data[0]?.phonetics?.find(p => p.text)?.text || data[0]?.phonetic || 'No IPA found';
        setIpa(phonetic);
        setDefinition(data[0]?.meanings[0]?.definitions[0]?.definition || '');
        setIpaError('');
      } else {
        setIpa('');
        setDefinition('');
        setIpaError("Can't find IPA");
      }
    } catch {
      setIpa('');
      setDefinition('');
      setIpaError('Error fetching IPA');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen pb-40 p-8 flex flex-col items-center justify-start ${darkMode ? 'bg-cyan text-white' : 'bg-white text-black'} min-w-[320px] pt-2 overflow-y-auto`}
      style={{ paddingBottom: keyboardPadding }}
    >
      <img src="/rosaSinging.png" alt="Banner" />
      <h1 className="md:text-6xl text-4xl font-bold mb-2 text-center flex">🎙️ Re
        <RotatingText
          texts={['Speako', 'Listeno', 'Pronuno']}
          mainClassName="px-2 md:px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded relative group transition text-white"
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          splitLevelClassName="overflow-hidden pb-1"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={5000}
        />
      </h1>

      <p className="italic text-yellow-500 font-semibold text-sm text-center mb-6 max-w-2xl">Make Every Word Count!</p>

      <div className="w-full max-w-md mb-8 mt-12">
        <h2 className="font-semibold mb-2">🎤 Speech to Text</h2>
        <StarBorder color="cyan" speed="3s">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full h-24 p-3 rounded text-lg outline-none"
            placeholder="Speak Up with Confidence..."
            onFocus={() => {
              setTimeout(() => {
                inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 500);
            }}
          />

        </StarBorder>
        <div className='flex gap-4 justify-between mt-4'>
          <button onClick={handleListen} className="p-[3px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
            <div className="px-4 py-2 bg-black rounded relative text-white">{listening ? 'Listening...' : 'Start Record'}</div>
          </button>
          <button onClick={handleSpeak} className="p-[3px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
            <div className="px-4 py-2 bg-black rounded relative text-white">Speak</div>
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        <h2 className="font-semibold mb-2">🧾 Check IPA</h2>
        <input
          ref={ipaInputRef}
          type="text"
          value={word}
          onChange={e => setWord(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Enter a word (English)..."
          onFocus={() => {
            setTimeout(() => {
              ipaInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
          }}
        />
        <button onClick={fetchIPA} className="p-[3px] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
          <div className="px-8 py-2 bg-black rounded relative text-white">Check IPA</div>
        </button>
        {ipa && (
          <div className="mt-4 text-left">
            <p className="text-lg"><strong>IPA:</strong> <span className="font-ipa text-xl">{ipa}</span></p>
            {definition && <p className="text-gray-700 mt-1"><strong>Meaning:</strong> {definition}</p>}
          </div>
        )}
        {ipaError && <p className="text-red-600 mt-2">{ipaError}</p>}
      </div>
    </div>
  );
};

export default ReSpeako;
