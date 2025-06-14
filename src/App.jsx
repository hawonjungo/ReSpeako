import { useState } from 'react'
import './App.css'
import ReSpeako from './components/ReSpeako'
import ThemeToggle from './components/ThemeToggle'
import  ThemeProvider from './components/ThemeContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <div className='absolute right-8 top-8'>
          <ThemeToggle />
        </div>
        
        <ReSpeako />
      </div>
    </ThemeProvider>
  )
}

export default App
