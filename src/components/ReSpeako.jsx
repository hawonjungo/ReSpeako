import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const ReSpeako = () => {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speakText, setSpeakText] = useState('');
  const [word, setWord] = useState('');
  const [ipa, setIpa] = useState('');
  const [definition, setDefinition] = useState('');
  const [ipaError, setIpaError] = useState('');
  const [slogan, setSlogan] = useState('Speak Clearly, Sound Brilliant.');
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
    if (!speakText.trim()) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.speak({
          text: speakText,
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
      const utterance = new SpeechSynthesisUtterance(speakText);
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
      className={`h-full p-8 flex flex-col items-center justify-start
      ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'} min-w-[320px] pt-2
      overflow-y-auto`}
    >
      <img src="/rosaSinging.png" alt="Banner" />
      <h1 className="md:text-6xl text-4xl font-bold mb-2 text-center">🎙️ ReSpeako</h1>
      <p className="text-center italic text-gray-500 mb-6">{slogan}</p>

      {/* 🎤 Speech to Text */}
      <div className="w-full max-w-md mb-8">
        <h2 className="font-semibold mb-2">🎤 Speech to Text </h2>
        <textarea
          value={text}
          readOnly
          className="w-full h-24 p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Your speech will appear here..."
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
          }}
        />
        <button
          onClick={handleListen}
          className={`w-full py-2 text-white rounded
            ${listening ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {listening ? 'Listening...' : 'Start Speaking'}
        </button>
      </div>

      {/* 🔊 Text to Speech */}
      <div className="w-full max-w-md mb-8">
        <h2 className="font-semibold mb-2">🔊 Text to Speech</h2>
        <textarea
          value={speakText}
          onChange={e => setSpeakText(e.target.value)}
          className="w-full h-24 p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Type something and click to hear..."
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
          }}
        />
        <button
          onClick={handleSpeak}
          className="w-full py-2 text-white bg-green-600 hover:bg-green-700 rounded"
        >
          Speak This Text
        </button>
      </div>

      {/* 🧾 Check IPA */}
      <div className="w-full max-w-md">
        <h2 className="font-semibold mb-2">🧾 Check IPA</h2>
        <input
          type="text"
          value={word}
          onChange={e => setWord(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Enter a word (English)..."
          onFocus={e => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
          }}
        />
        <button
          onClick={fetchIPA}
          className="w-full py-2 text-white bg-purple-600 hover:bg-purple-700 rounded"
        >
          Check IPA
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
