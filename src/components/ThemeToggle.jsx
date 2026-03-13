import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800"
      onClick={() => setDarkMode(!darkMode)}
    >
      {darkMode ? 'Light' : 'Dark'}
    </button>
  );
}
