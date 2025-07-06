import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import RotatingText from './RotatingText';
import StarBorder from './StarBorder';

const IPAPronounce = () => {

  const { darkMode } = useContext(ThemeContext);

  const ipaCharacters = [
    { symbol: "iː", label: "sheep", highlight: "ee", icon: "/assets/IPA-icons/sheep.png" },
    { symbol: "ɪ", label: "ship", highlight: "i", icon: "/assets/IPA-icons/ship.png" },
    { symbol: "e", label: "bed", highlight: "e", icon: "/assets/IPA-icons/bed.png" },
    { symbol: "æ", label: "cat", highlight: "a", icon: "/assets/IPA-icons/cat.png" },
    { symbol: "ɑː", label: "car", highlight: "a", icon: "/assets/IPA-icons/car.png" },
    { symbol: "ɒ", label: "hot", highlight: "o", icon: "/assets/IPA-icons/hot.png" },
    { symbol: "ɔː", label: "law", highlight: "aw", icon: "/assets/IPA-icons/law.png" },
    { symbol: "ʊ", label: "book", highlight: "oo", icon: "/assets/IPA-icons/book.png" },
    { symbol: "uː", label: "boot", highlight: "oo", icon: "/assets/IPA-icons/boot.png" },
    { symbol: "ʌ", label: "cup", highlight: "u", icon: "/assets/IPA-icons/cup.png" },
    { symbol: "ɜː", label: "bird", highlight: "ir", icon: "/assets/IPA-icons/bird.png" },
    { symbol: "ə", label: "teacher", highlight: "er", icon: "/assets/IPA-icons/teacher.png" }, 

    // Diphthongs
    { symbol: "eɪ", label: "face", highlight: "a", icon: "/assets/IPA-icons/face.png" },
    { symbol: "aɪ", label: "my", highlight: "y", icon: "/assets/IPA-icons/my.png" },
    { symbol: "ɔɪ", label: "boy", highlight: "oy", icon: "/assets/IPA-icons/boy.png" },
    { symbol: "aʊ", label: "cow", highlight: "ow", icon: "/assets/IPA-icons/cow.png" },
    { symbol: "əʊ", label: "go", highlight: "o", icon: "/assets/IPA-icons/go.png" },
    { symbol: "ɪə", label: "near", highlight: "ea", icon: "/assets/IPA-icons/near.png" },
    { symbol: "eə", label: "hair", highlight: "ai", icon: "/assets/IPA-icons/hair.png" },
    { symbol: "ʊə", label: "tour", highlight: "ou", icon: "/assets/IPA-icons/tour.png" },
  ];

  return (
    <div
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



      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2 p-2">
        {ipaCharacters.map((char, idx) => {
          const { label, highlight } = char;
          const parts = label.split(highlight);
          return (
            <StarBorder key={idx} >
              <div
                className="flex flex-col items-center justify-center w-max p-2 hover:bg-gray-100"
              >
                <span className="text-4xl font-bold  ">{char.symbol}</span>
              <span className="text-xl">
                {parts[0]}
                <span className="underline decoration-blue-500 underline-offset-2 text-red-600">
                  {highlight}
                </span>
                {parts[1]}
              </span>
              <img
                src={char.icon}
                alt={char.label}
                className="w-8 h-8 mt-1  object-contain"
              />
            </div>
            </StarBorder>
            
          )
        })}
      </div>
    </div>

  );
}

export default IPAPronounce