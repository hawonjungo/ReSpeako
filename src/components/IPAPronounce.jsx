import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import RotatingText from './RotatingText';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react";

const IPAPronounce = () => {

  const { darkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("vowels");
  const data = [
    {
      title: "Vowels",
      value: "vowels",
      ipa: [
        { id: 1, symbol: "iː", label: "sheep", highlight: "ee", icon: "/assets/IPA-icons/sheep.png" },
        { id: 2, symbol: "ɪ", label: "ship", highlight: "i", icon: "/assets/IPA-icons/ship.png" },
        { id: 3, symbol: "ʊ", label: "book", highlight: "oo", icon: "/assets/IPA-icons/book.png" },
        { id: 4, symbol: "uː", label: "boot", highlight: "oo", icon: "/assets/IPA-icons/boot.png" },
        { id: 5, symbol: "e", label: "bed", highlight: "e", icon: "/assets/IPA-icons/bed.png" },
        { id: 6, symbol: "ə", label: "teacher", highlight: "er", icon: "/assets/IPA-icons/teacher.png" },
        { id: 7, symbol: "ɜː", label: "bird", highlight: "ir", icon: "/assets/IPA-icons/bird.png" },
        { id: 8, symbol: "ɔː", label: "law", highlight: "aw", icon: "/assets/IPA-icons/law.png" },
        { id: 9, symbol: "æ", label: "cat", highlight: "a", icon: "/assets/IPA-icons/cat.png" },
        { id: 10, symbol: "ʌ", label: "cup", highlight: "u", icon: "/assets/IPA-icons/cup.png" },
        { id: 11, symbol: "ɑː", label: "car", highlight: "a", icon: "/assets/IPA-icons/car.png" },
        { id: 12, symbol: "ɒ", label: "hot", highlight: "o", icon: "/assets/IPA-icons/hot.png" },
      ],

    },
    {
      title: "Dipthongs",
      value: "dipthongs",
      ipa: [
        { id: 13, symbol: "ɪə", label: "near", highlight: "ea", icon: "/assets/IPA-icons/near.png" },
        { id: 14, symbol: "eɪ", label: "face", highlight: "a", icon: "/assets/IPA-icons/face.png" },
        { id: 15, symbol: "ʊə", label: "tour", highlight: "ou", icon: "/assets/IPA-icons/tour.png" },
        { id: 16, symbol: "ɔɪ", label: "boy", highlight: "oy", icon: "/assets/IPA-icons/boy.png" },
        { id: 17, symbol: "əʊ", label: "go", highlight: "o", icon: "/assets/IPA-icons/go.png" },
        { id: 18, symbol: "eə", label: "hair", highlight: "ai", icon: "/assets/IPA-icons/hair.png" },
        { id: 19, symbol: "aɪ", label: "my", highlight: "y", icon: "/assets/IPA-icons/my.png" },
        { id: 20, symbol: "aʊ", label: "cow", highlight: "ow", icon: "/assets/IPA-icons/cow.png" },
      ],

    },
    {
      title: "Consonants",
      value: "consonants",
      ipa: [{ symbol: "l", label: "lazy", highlight: "l", icon: "/assets/IPA-icons/my.png" },],
    },

  ];

  const audioCache = useRef({});

  const ipaSound = (id) => {
    const audio = new Audio(`/assets/IPA-sounds/${id}.mp3`);
    audio.play().catch((error) => {
      console.error("Error playing sound:", error);
    });
  };

  return (
    <div
      className={`relative h-full pb-40 p-8  flex flex-col items-center justify-start  
      ${darkMode ? 'bg-cyan text-white' : 'bg-white text-black'} min-w-[320px] pt-2
      overflow-y-auto`}
    >
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        id="custom-animation"
        className={`mx-auto ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-black'}`}
      >
        <TabsHeader indicatorProps={{
          className: `${darkMode ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-indigo-200/80'} z-0`,
          style: { height: '2px', borderRadius: '0px' }
        }}>
          {data.map(({ title, value }) => (
            <Tab
              key={value}
              value={value}
              className={`bg-transparent ${darkMode ? 'text-white' : 'text-black'} border-b-2 border-gray-300`}
            >
              {title}
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody
          animate={{
            initial: { y: 250 },
            mount: { y: 0 },
            unmount: { y: 250 },
          }}
        >
          {data.map(({ title, value, ipa }) => (
            <TabPanel key={value} value={value}>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-2 w-max mx-auto">
                {ipa.map((char, idx) => {
                  const { label, highlight } = char;
                  const parts = label.split(highlight);
                  return (
                    <div key={idx}
                      onClick={() => ipaSound(char.id)}
                      className="flex flex-col items-center justify-center min-w-24 p-2 bg-gradient-to-b from-gray-100 to-gray-300 text-black border-gray-200 hover:-translate-y-1 transform duration-200 rounded-lg cursor-pointer"
                    >
                      <span className="text-4xl font-bold">{char.symbol}</span>
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
                        className="w-8 h-8 mt-1 object-contain"
                      />
                    </div>
                  )
                })}
              </div>
            </TabPanel>
          ))}
        </TabsBody>
      </Tabs>
    </div>
  );
}

export default IPAPronounce