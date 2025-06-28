import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import './App.css'
import ReSpeako from './components/ReSpeako'
import ThemeToggle from './components/ThemeToggle'
import ThemeProvider from './components/ThemeContext'
import CatPawBtn from './components/CatpawBtn'

import { HashRouter, Routes, Route } from 'react-router-dom'
import IPAPronounce from './components/IPAPronounce' 

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
          <div className='absolute right-8 top-8 z-10'>
            <ThemeToggle />
          </div>
          <Routes>
            <Route path="/" element={<ReSpeako />} />
            <Route path="/ipa-pronounce" element={<IPAPronounce />} />
          </Routes>
          <div className='sticky bottom-0 left-0 right-0 z-10'>
            <CatPawBtn />
          </div>
        </div>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
