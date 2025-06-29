import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import RotatingText from './RotatingText'

import StarBorder from './StarBorder'

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
              console.error('SpeechRecognition error:', error);
              if (
                !userStoppedRef.current &&
                listening &&
                (error?.message?.toLowerCase().includes('no match') ||
                  error?.message?.toLowerCase().includes("didn't understand"))
              ) {
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
          Keyboard.addListener('keyboardWillShow', () => {
            setTimeout(() => {
              if (containerRef.current && typeof containerRef.current.scrollIntoView === 'function') {
                containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
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

        recognition.onstart = () => {
          setListening(true);
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
          setText((finalTextRef.current + interimTranscript).trim());
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          alert(`Speech recognition error: ${event.error}`);
          setListening(false);
        };

        recognition.onend = () => {
          setListening(false);
        };

        recognitionRef.current = recognition;
      }
    };

    setupRecognition();
  }, []);

  // Scroll container to view when resize (keyboard show/hide)
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported or not ready.');
      return;
    }

    if (listening) {
      recognitionRef.current.stop?.();
    } else {
      if (Capacitor.getPlatform() === 'web') {
        finalTextRef.current = '';
      }
      setText('');
      recognitionRef.current.start?.();
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.speak({
          text: text,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0
        });
      } catch (err) {
        alert('Text to Speech failed on native device');
        console.error(err);
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
    } catch (err) {
      setIpa('');
      setDefinition('');
      setIpaError('Error when fetching IPA');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full pb-40 p-8  flex flex-col items-center justify-start  
      ${darkMode ? 'bg-cyan text-white' : 'bg-white text-black'} min-w-[320px] pt-2
      overflow-y-auto`}
    >
      <img src="/rosaSinging.png" alt="Banner" />
      <h1 className="md:text-6xl text-4xl font-bold mb-2 text-center items-center flex flex-nowrap">🎙️ Re  <RotatingText

        texts={['Speako', 'Listeno', 'Pronuno',]}
        mainClassName=" px-2 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[6px] relative group transition duration-200 text-white hover:bg-transparent"
        staggerFrom={"last"}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-120%" }}
        staggerDuration={0.025}
        splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        rotationInterval={5000}
      /></h1>
      <p className="italic text-yellow-500 font-semibold italic text-sm text-center mb-6 max-w-2xl">
        Make Every Word Count!
      </p>



      {/* 🎤 Speech to Text */}
      <div className="w-full max-w-md mb-8 mt-12">
        <h2 className="font-semibold mb-2">🎤 Speech to Text </h2>
        <StarBorder
          color="cyan"
          speed="3s"
        >
          <textarea
            id="speech-text"
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full h-24 p-3 border-none  outline-none focus:outline-none rounded mb-2 text-lg"
            placeholder="Speak Up with Confidence..."
            onFocus={e => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 400);
            }}
          />
        </StarBorder>
        <div className='flex  sm:flex-row gap-4 items-center justify-between mt-4'>
          <button className="p-[3px] relative" onClick={handleListen}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
            <div className="px-4 py-2 bg-black rounded-[6px] relative group transition duration-200 text-white hover:bg-transparent">
              {listening ? 'Listening...' : 'Start Record'}
            </div>
          </button>
          <button className="p-[3px] relative" onClick={handleSpeak}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
            <div className="px-4 py-2 bg-black rounded-[6px] relative group transition duration-200 text-white hover:bg-transparent">
              Speak
            </div>
          </button>
        </div>

      </div>


      {/* 🧾 Check IPA */}
      <div className="w-full max-w-md">
        <h2 className="font-semibold mb-2">🧾 Check IPA</h2>
        <input
          type="text"
          value={word}
          onChange={e => setWord(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-2 text-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)]"
          placeholder="Enter a word (English)..."
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
          }}
        />
        <button className="p-[3px] relative" onClick={fetchIPA}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
          <div className="px-8 py-2 bg-black rounded-[6px] relative group transition duration-200 text-white hover:bg-transparent">
            Check IPA
          </div>
        </button>
        {ipa && (
          <div className="mt-4 text-left">
            <p className="text-lg">
              <strong>IPA:</strong> <span className="font-ipa text-xl">{ipa}</span>
            </p>
            {definition && (
              <p className="text-gray-700 mt-1">
                <strong>Meaning:</strong> {definition}
              </p>
            )}
          </div>
        )}
        {ipaError && <p className="text-red-600 mt-2">{ipaError}</p>}
      </div>
    </div>
  );
};

export default ReSpeako;
