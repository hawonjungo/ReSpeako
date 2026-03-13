import './App.css'

import AppShell from './components/layouts/AppShell'

import ReSpeako from './components/ReSpeako'
import ThemeToggle from './components/ThemeToggle'
import ThemeProvider from './components/ThemeContext'
import CatPawBtn from './components/CatPawBtn'
import Header from './components/layouts/Header'

import { HashRouter, Routes, Route } from 'react-router-dom'
import IPAPronounce from './components/IPAPronounce'
import LoopLab from './components/LoopLab'
import Learning from './components/Learning'
import WordFormation from './components/WordFormation'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppShell header={<Header />}>
          <div className="relative">
            <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-5">
              <ThemeToggle />
            </div>
            <Routes>
              <Route path="/" element={<ReSpeako />} />
              <Route path="/ipa-pronounce" element={<IPAPronounce />} />
              <Route path="/loop-lab" element={<LoopLab />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/word-formation" element={<WordFormation />} />
            </Routes>
            <CatPawBtn />
          </div>
        </AppShell>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
