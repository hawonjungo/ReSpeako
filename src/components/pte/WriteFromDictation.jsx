import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import { writeFromDictationBank } from '../../data/pte/writeFromDictation';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import { scoreDictation } from '../../utils/scoring';
import { addReviewItems, logAttempt } from '../../utils/reviewStore';
import shuffleArray from '../../utils/shuffleArray';
import formatMessage from '../../utils/formatMessage';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import WordDiff, { WordDiffLegend } from './WordDiff';

const SESSION_SIZE = 10;
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];
// Function words are not worth a flashcard on their own; the sentence card covers them.
const SKIP_WORD_CARDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'and', 'or',
  'is', 'are', 'was', 'be', 'it', 'its', 'as', 'has', 'have', 'will',
]);

function buildSession(difficulty) {
  const pool = difficulty === 'all'
    ? writeFromDictationBank
    : writeFromDictationBank.filter((item) => item.difficulty === difficulty);
  return shuffleArray(pool).slice(0, SESSION_SIZE);
}

export default function WriteFromDictation() {
  const { language } = useContext(LanguageContext);
  const t = translations[language].dictation;
  const { speak, stop } = useTextToSpeech();
  const inputRef = useRef(null);

  const [difficulty, setDifficulty] = useState('all');
  const [examMode, setExamMode] = useState(false);
  const [slow, setSlow] = useState(false);
  const [session, setSession] = useState(() => buildSession('all'));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [playCount, setPlayCount] = useState(0);
  const [result, setResult] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const [totals, setTotals] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');

  const current = session[index];
  const isLast = index === session.length - 1;
  const canPlay = !examMode || playCount === 0;

  useEffect(() => () => {
    stop();
  }, [stop]);

  const resetQuestion = () => {
    setAnswer('');
    setPlayCount(0);
    setResult(null);
    setAddedCount(0);
    setError('');
  };

  const restart = (nextDifficulty = difficulty) => {
    stop();
    setSession(buildSession(nextDifficulty));
    setIndex(0);
    setTotals({ correct: 0, total: 0 });
    setFinished(false);
    resetQuestion();
  };

  const handlePlay = async () => {
    if (!current || !canPlay) return;
    setPlayCount((count) => count + 1);
    try {
      await speak(current.text, { rate: slow ? 0.75 : 1.0 });
    } catch (err) {
      setError(err.message);
    }
    inputRef.current?.focus();
  };

  const handleCheck = async () => {
    if (!current || result) return;

    const scored = scoreDictation(current.text, answer);
    setResult(scored);
    setTotals((prev) => ({
      correct: prev.correct + scored.correct,
      total: prev.total + scored.total,
    }));

    const reviewItems = scored.missedWords
      .filter((word) => !SKIP_WORD_CARDS.has(word))
      .map((word) => ({ kind: 'word', text: word, source: 'wfd', note: current.text }));

    if (scored.percent < 100) {
      reviewItems.push({ kind: 'sentence', text: current.text, source: 'wfd' });
    }

    try {
      await logAttempt({
        task: 'wfd',
        itemId: current.id,
        correct: scored.correct,
        total: scored.total,
      });
      setAddedCount(await addReviewItems(reviewItems));
    } catch (err) {
      console.warn('Could not save dictation result.', err);
    }
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    resetQuestion();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (result) {
      handleNext();
    } else if (answer.trim()) {
      handleCheck();
    }
  };

  const summaryPercent = totals.total === 0 ? 0 : Math.round((totals.correct / totals.total) * 100);

  return (
    <PageContainer title={t.pageTitle} description={t.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        <SectionCard>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="font-medium">{t.difficulty}</span>
              <select
                value={difficulty}
                onChange={(event) => {
                  setDifficulty(event.target.value);
                  restart(event.target.value);
                }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
              >
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>{t.difficulties[level]}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2" title={t.examModeHint}>
              <input type="checkbox" checked={examMode} onChange={(event) => setExamMode(event.target.checked)} />
              {t.examMode}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={slow} onChange={(event) => setSlow(event.target.checked)} />
              {t.slow}
            </label>
          </div>
        </SectionCard>

        {finished ? (
          <SectionCard>
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-semibold">{t.summaryTitle}</h2>
              <p className="text-gray-600 dark:text-gray-300">
                {formatMessage(t.summaryScore, { ...totals, percent: summaryPercent })}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <PrimaryButton onClick={() => restart()}>{t.restart}</PrimaryButton>
                <Link to="/review">
                  <PrimaryButton variant="secondary" className="w-full">{t.goReview}</PrimaryButton>
                </Link>
              </div>
            </div>
          </SectionCard>
        ) : current && (
          <SectionCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {formatMessage(t.progress, { current: index + 1, total: session.length })}
                </p>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${((index + (result ? 1 : 0)) / session.length) * 100}%` }}
                  />
                </div>
              </div>

              <PrimaryButton onClick={handlePlay} disabled={!canPlay} className="w-full sm:w-auto">
                {!canPlay ? t.played : playCount > 0 ? t.replay : t.play}
              </PrimaryButton>

              <textarea
                ref={inputRef}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={handleKeyDown}
                readOnly={Boolean(result)}
                rows={3}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                aria-label={t.placeholder}
                placeholder={t.placeholder}
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-base outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
              />

              {error && <StatusBanner type="error" message={error} />}

              {result && (
                <div className="space-y-3">
                  <p className="text-lg font-semibold">
                    {formatMessage(t.score, result)}
                    <span className="ml-2 text-sm font-normal text-gray-500">({result.percent}%)</span>
                  </p>
                  <WordDiff parts={result.parts} />
                  <WordDiffLegend labels={t.legend} />
                  <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-black/30">
                    <span className="font-semibold">{t.answer}:</span> {current.text}
                  </div>
                  {result.percent === 100
                    ? <StatusBanner type="success" message={t.perfect} />
                    : addedCount > 0 && (
                      <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
                    )}
                </div>
              )}

              <div className="flex justify-end">
                {result ? (
                  <PrimaryButton onClick={handleNext}>{isLast ? t.finish : t.next}</PrimaryButton>
                ) : (
                  <PrimaryButton onClick={handleCheck} disabled={!answer.trim()}>{t.check}</PrimaryButton>
                )}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
