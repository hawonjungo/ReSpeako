import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import RotatingText from '../RotatingText';
import GooeyNav from '../GooeyNav';


const Header = () => {
    const { darkMode } = useContext(ThemeContext);
    const location = useLocation();

    // Icon mapping for different pages
    const getPageIcon = (pathname) => {
        const iconMap = {
            '/': '🎙️',
            '/learning': '📚',
            '/ipa-pronounce': '🔊',
            '/loop-lab': '🔄',
            '/word-formation': '🔤'
        };
        return iconMap[pathname] || '🎙️'; // Default to microphone icon
    };
    // sologan mapping for different pages
    const getPageSologan = (pathname) => {
        const sologanMap = {
            '/': 'Make Every Word Count!',
            '/learning': ' Unlock your English potential with interactive lessons!',
            '/ipa-pronounce': 'Speak clearly with the power of phonetics',
            '/loop-lab': 'Practice makes perfect',
            '/word-formation': ' Master the art of creating new words from existing ones'
        };
        return sologanMap[pathname] || 'Make Every Word Count!';
    };

    const items = [
        { label: "Home", href: "/" },
        { label: "Learning", href: "/learning" },
        { label: "Practicing", href: "/practicing" },
    ];

    return (
        <header
            className={`relative container mx-auto  py-4 flex flex-col items-center ${darkMode ? 'bg-cyan text-white' : 'bg-white text-black'} min-w-[320px]`}
        >
            <GooeyNav items={items} />            
            <img src="/rosaSinging.png" alt="Banner" className="my-4 max-w-full h-auto" />
            <h1 className=" text-2xl font-bold mb-2 text-center flex">
                {getPageIcon(location.pathname)} <span className='text-3xl'>Re</span>
                <RotatingText
                    texts={['Speako', 'Listeno', 'Pronuno']}
                    mainClassName="px-1 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded text-white"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    splitLevelClassName="overflow-hidden pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={5000}
                />
            </h1>
            <p className="w-full italic text-yellow-500 font-semibold text-sm text-center max-w-2xl">{getPageSologan(location.pathname)}</p>
        </header>
    );
};

export default Header;
