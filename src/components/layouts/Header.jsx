import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import RotatingText from '../RotatingText';
import GooeyNav from '../GooeyNav';


const Header = () => {
    const { darkMode } = useContext(ThemeContext);
    const { language, setLanguage } = useContext(LanguageContext);
    const location = useLocation();
    const t = translations[language];

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
        return t.header.slogans[pathname] || t.header.slogans['/'];
    };

    const items = [
        { label: t.common.home, href: "/" },
        { label: t.common.learning, href: "/learning" },
    ];

    return (
        <header
            className={`relative container mx-auto  py-4 flex flex-col items-center ${darkMode ? 'bg-cyan text-white' : 'bg-white text-black'} min-w-[320px]`}
        >
            <div className="mb-3 flex w-full items-center justify-end">
                <button
                    type="button"
                    onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                    className="rounded-full border border-cyan-500/30 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-400/40 dark:bg-cyan-950/40 dark:text-cyan-200"
                >
                    {language === 'en' ? t.common.vietnamese : t.common.english}
                </button>
            </div>
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
