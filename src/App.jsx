import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import './App.css'
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
  const [count, setCount] = useState(0)
  const [keyboardPadding, setKeyboardPadding] = useState(0)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardPadding(info.keyboardHeight || 300)
        })
        Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardPadding(0)
        })
      })
    }
  }, [])

  return (
    <ThemeProvider>
      <HashRouter>
        <div className="flex flex-col min-h-screen relative">
          <Header />
          <div className='absolute right-4 top-24 z-10'>
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
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
