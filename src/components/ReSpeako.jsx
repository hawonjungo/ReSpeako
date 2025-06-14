import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext'
const ReSpeako = () => {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [speakText, setSpeakText] = useState('');
  const [word, setWord] = useState('');
  const [ipa, setIpa] = useState('');
  const [definition, setDefinition] = useState('');
  const [ipaError, setIpaError] = useState('');
  const recognitionRef = useRef(null);

   const { darkMode } = useContext(ThemeContext);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const handleListen = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSpeak = () => {
    if (!speakText.trim()) return;
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const fetchIPA = async () => {
    if (!word.trim()) return;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setIpa(data[0]?.phonetic || 'No IPA found');
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
    <div className={`min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-start ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} min-w-[320px] pt-24`}>
      <h1 className="md:text-6xl text-4xl font-bold mb-6 text-center">🎙️ ReSpeako</h1>

      {/* 🎤 Speech to Text */}
      <div className="w-full max-w-md mb-8">
        <h2 className="font-semibold mb-2">🎤 Speech to Text</h2>
        <textarea
          value={text}
          readOnly
          className="w-full h-24 p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Your speech will appear here..."
        />
        <button
          onClick={handleListen}
          disabled={listening}
          className={`w-full py-2 text-white rounded ${
            listening ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {listening ? 'Listening...' : 'Start Speaking'}
        </button>
      </div>

      {/* 🔊 Text to Speech */}
      <div className="w-full max-w-md mb-8">
        <h2 className="font-semibold mb-2">🔊 Text to Speech</h2>
        <textarea
          value={speakText}
          onChange={(e) => setSpeakText(e.target.value)}
          className="w-full h-24 p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Type something and click to speak..."
        />
        <button
          onClick={handleSpeak}
          className="w-full py-2 text-white bg-green-600 hover:bg-green-700 rounded"
        >
          Speak This Text
        </button>
      </div>

      {/* 🧾 Tra phiên âm IPA */}
      <div className="w-full max-w-md">
        <h2 className="font-semibold mb-2">🧾 Check IPA</h2>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-2 text-lg"
          placeholder="Enter a word (English)..."
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
              <strong>IPA:</strong> <span className="font-mono">{ipa}</span>
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
