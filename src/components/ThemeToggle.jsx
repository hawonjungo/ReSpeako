import { useContext } from 'react'
import { ThemeContext } from './ThemeContext'

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useContext(ThemeContext)

  return (
    <button
      className="px-4 py-1 rounded-full border text-sm transition-colors duration-300 border-gray-300 

             hover:bg-gray-500             
             hover:text-gray-800 

             dark:bg-gray-800
             dark:text-gray-200
             dark:hover:bg-white
             dark:border-gray-500"
      onClick={() => setDarkMode(!darkMode)}
    >
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}


