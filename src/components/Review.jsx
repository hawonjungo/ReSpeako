import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { scoreDictation } from '../utils/scoring';
import {
  getAllReviewItems,
  gradeReviewItem,
  previewSchedule,
  Rating,
  removeReviewItem,
  suggestRating,
} from '../utils/reviewStore';
import formatMessage from '../utils/formatMessage';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import PrimaryButton from './ui/PrimaryButton';
import EmptyState from './ui/EmptyState';
import ProgressSummary from './ProgressSummary';
import WordDiff from './pte/WordDiff';

const RATING_BUTTONS = [
  { rating: Rating.Again, key: 'again', className: 'border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300' },
  { rating: Rating.Hard, key: 'hard', className: 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300' },
  { rating: Rating.Good, key: 'good', className: 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300' },
  { rating: Rating.Easy, key: 'easy', className: 'border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-300' },
];

function formatInterval(from, to) {
  const minutes = Math.max(1, Math.round((new Date(to) - from) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function Review() {
  const { language } = useContext(LanguageContext);
  const t = translations[language].review;
  const { speak, stop } = useTextToSpeech();
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const { isListening, toggleListening, stopListening } = useSpeechRecognition({
    onTranscriptChange: (text) => {
      if (text) setAnswer(text);
    },
  });

  const loadItems = useCallback(async () => {
    const items = await getAllReviewItems();
    const now = new Date();
    setAllItems(items);
    setQueue(items.filter((item) => new Date(item.card.due) <= now));
    setIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => () => {
    stop();
  }, [stop]);

  const current = queue[index];
  const now = new Date();
  const dueCount = queue.length - index;
  const nextUpcoming = allItems.find((item) => new Date(item.card.due) > now);

  const handlePlay = async () => {
    if (!current) return;
    await speak(current.text, { rate: current.kind === 'word' ? 0.85 : 1.0 });
    inputRef.current?.focus();
  };

  const handleCheck = () => {
    if (!current) return;
    stopListening();
    const scored = scoreDictation(current.text, answer);
    setResult({ ...scored, suggested: suggestRating(scored.percent) });
  };

  const handleReveal = () => {
    if (!current) return;
    stopListening();
    setResult({ ...scoreDictation(current.text, ''), suggested: Rating.Again });
  };

  const goNext = () => {
    setAnswer('');
    setResult(null);
    setIndex((value) => value + 1);
  };

  const handleGrade = async (rating) => {
    if (!current) return;
    await gradeReviewItem(current, rating);
    setReviewedCount((count) => count + 1);
    goNext();
  };

  const handleRemove = async () => {
    if (!current) return;
    await removeReviewItem(current.id);
    setAllItems((items) => items.filter((item) => item.id !== current.id));
    goNext();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (result) {
      handleGrade(result.suggested);
    } else if (answer.trim()) {
      handleCheck();
    }
  };

  const previews = current && result ? previewSchedule(current, now) : null;

  return (
    <PageContainer title={t.pageTitle} description={t.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label={t.dueToday} value={loading ? '…' : Math.max(dueCount, 0)} />
          <StatTile label={t.total} value={loading ? '…' : allItems.length} />
        </div>

        <ProgressSummary t={translations[language].progress} language={language} />

        {!loading && !current && (
          <SectionCard>
            <div className="space-y-4">
              {reviewedCount > 0 ? (
                <EmptyState
                  title={t.doneTitle}
                  description={formatMessage(t.doneDescription, { count: reviewedCount })}
                />
              ) : (
                <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
              )}
              {nextUpcoming && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                  {formatMessage(t.nextDue, {
                    date: new Date(nextUpcoming.card.due).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US'),
                  })}
                </p>
              )}
              <div className="flex justify-center">
                <Link to="/pte/write-from-dictation">
                  <PrimaryButton>{t.startDictation}</PrimaryButton>
                </Link>
              </div>
            </div>
          </SectionCard>
        )}

        {current && (
          <SectionCard>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-200">
                  {t.kinds[current.kind]}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatMessage(t.mistakes, { count: current.mistakes || 1 })}
                </span>
              </div>

              {current.kind === 'pronunciation' ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t.sayPrompt}</p>
                  <p className="text-3xl font-semibold">{current.text}</p>
                  {current.note && (
                    <p className="font-ipa text-sm text-rose-700 dark:text-rose-300">
                      {t.weakSounds}: {current.note}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">{t.listenPrompt}</p>
              )}
              <PrimaryButton onClick={handlePlay} className="w-full sm:w-auto">{t.play}</PrimaryButton>

              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={handleKeyDown}
                readOnly={Boolean(result)}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                aria-label={t.placeholder}
                placeholder={t.placeholder}
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-base outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
              />

              {!result && (
                <div className="flex flex-wrap justify-end gap-2">
                  <PrimaryButton variant="secondary" onClick={toggleListening} aria-pressed={isListening}>
                    {isListening ? t.stopSpeaking : t.speakAnswer}
                  </PrimaryButton>
                  <PrimaryButton variant="ghost" onClick={handleReveal}>{t.showAnswer}</PrimaryButton>
                  <PrimaryButton onClick={handleCheck} disabled={!answer.trim()}>{t.check}</PrimaryButton>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {answer.trim() && <WordDiff parts={result.parts} />}
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-black/30">
                    <p><span className="font-semibold">{t.answer}:</span> {current.text}</p>
                    {current.note && (
                      <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-300">“{current.note}”</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t.howWell}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {RATING_BUTTONS.map(({ rating, key, className }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleGrade(rating)}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 ${className} ${
                            result.suggested === rating ? 'ring-2 ring-offset-1 ring-current dark:ring-offset-gray-900' : ''
                          }`}
                        >
                          <span className="block">{t.ratings[key]}</span>
                          <span className="block text-xs opacity-70">
                            {previews && formatInterval(now, previews[rating])}
                            {result.suggested === rating && ` · ${t.suggested}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
                >
                  {t.remove}
                </button>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
