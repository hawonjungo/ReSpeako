import './App.css'

import AppShell from './components/layouts/AppShell'

import ReSpeako from './components/ReSpeako'
import ThemeToggle from './components/ThemeToggle'
import ThemeProvider from './components/ThemeContext'
import LanguageProvider from './contexts/LanguageContext'
import CatPawBtn from './components/CatPawBtn'
import Header from './components/layouts/Header'

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import IPAPronounce from './components/IPAPronounce'
import LoopLab from './components/LoopLab'
import Learning from './components/Learning'
import WordFormation from './components/WordFormation'
import WriteFromDictation from './components/pte/WriteFromDictation'
import Review from './components/Review'
import RepeatSentence from './components/pte/RepeatSentence'
import ReadAloud from './components/pte/ReadAloud'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <HashRouter>
        <AppShell header={<Header />}>
          <div className="relative">
            <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-5">
              <ThemeToggle />
            </div>
            <Routes>
              <Route path="/" element={<ReSpeako />} />
              <Route path="/practice" element={<Navigate to="/" replace />} />
              <Route path="/ipa-pronounce" element={<IPAPronounce />} />
              <Route path="/loop-lab" element={<LoopLab />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/word-formation" element={<WordFormation />} />
              <Route path="/pte/write-from-dictation" element={<WriteFromDictation />} />
              <Route path="/review" element={<Review />} />
              <Route path="/pte/repeat-sentence" element={<RepeatSentence />} />
              <Route path="/pte/read-aloud" element={<ReadAloud />} />
            </Routes>
            <CatPawBtn />
          </div>
        </AppShell>
      </HashRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
