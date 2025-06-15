import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import './App.css'
import ReSpeako from './components/ReSpeako'
import ThemeToggle from './components/ThemeToggle'
import ThemeProvider from './components/ThemeContext'

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
      <div className="flex flex-col min-h-screen relative">
        <div className='absolute right-8 top-8 z-10'>
          <ThemeToggle />
        </div>
        <div
          className="flex-1"
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            maxHeight: '100vh',
            paddingBottom: keyboardPadding,
            transition: 'padding-bottom 0.2s'
          }}
        >
          <ReSpeako />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
