import './App.css'

import AppShell from './components/layouts/AppShell'

import ReSpeako from './components/ReSpeako'
import ThemeToggle from './components/ThemeToggle'
import ThemeProvider from './components/ThemeContext'
import LanguageProvider from './contexts/LanguageContext'
import CatPawBtn from './components/CatPawBtn'
import Header from './components/layouts/Header'

import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

// Every page except the home page loads on demand, keeping the first download small.
const IPAPronounce = lazy(() => import('./components/IPAPronounce'))
const LoopLab = lazy(() => import('./components/LoopLab'))
const Learning = lazy(() => import('./components/Learning'))
const WordFormation = lazy(() => import('./components/WordFormation'))
const WriteFromDictation = lazy(() => import('./components/pte/WriteFromDictation'))
const Review = lazy(() => import('./components/Review'))
const RepeatSentence = lazy(() => import('./components/pte/RepeatSentence'))
const ReadAloud = lazy(() => import('./components/pte/ReadAloud'))
const Settings = lazy(() => import('./components/Settings'))
const OpenSpeakingPractice = lazy(() => import('./components/pte/OpenSpeakingPractice'))
const MockTest = lazy(() => import('./components/pte/MockTest'))
const ObjectivePractice = lazy(() => import('./components/pte/ObjectivePractice'))
const WritingPractice = lazy(() => import('./components/pte/writing/WritingPractice'))

function PageLoading() {
  return (
    <div className="flex justify-center py-16" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  )
}

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
            <Suspense fallback={<PageLoading />}>
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
              <Route path="/settings" element={<Settings />} />
              <Route path="/pte/describe-image" element={<OpenSpeakingPractice key="di" task="di" />} />
              <Route path="/pte/retell-lecture" element={<OpenSpeakingPractice key="rl" task="rl" />} />
              <Route path="/pte/mock-test" element={<MockTest />} />
              {['rwfib', 'rfib', 'rop', 'mc'].map((task) => (
                <Route key={task} path={`/pte/reading/${task}`} element={<ObjectivePractice key={task} task={task} />} />
              ))}
              {['hiw', 'lfib', 'smw', 'hcs'].map((task) => (
                <Route key={task} path={`/pte/listening/${task}`} element={<ObjectivePractice key={task} task={task} />} />
              ))}
              <Route path="/pte/writing/swt" element={<WritingPractice key="swt" task="swt" />} />
              <Route path="/pte/writing/essay" element={<WritingPractice key="essay" task="essay" />} />
              <Route path="/pte/writing/sst" element={<WritingPractice key="sst" task="sst" />} />
            </Routes>
            </Suspense>
            <CatPawBtn />
          </div>
        </AppShell>
      </HashRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
