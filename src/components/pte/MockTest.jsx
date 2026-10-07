import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import { readAloudBank, repeatSentenceBank } from '../../data/pte/speaking';
import { describeImageBank, retellLectureBank } from '../../data/pte/openSpeaking';
import { writeFromDictationBank } from '../../data/pte/writeFromDictation';
import { OBJECTIVE_TASKS } from './objectiveTasks';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import { buildMockTest, computeMockScores, MOCK_STRUCTURE, SKILLS } from '../../utils/mockTest';
import { getAttempts, logAttempt } from '../../utils/reviewStore';
import { resolveSpeakingEngine } from '../../utils/pronunciation';
import formatMessage from '../../utils/formatMessage';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import EngineBadge from './EngineBadge';
import SpeakingItemRunner from './mock/SpeakingItemRunner';
import DictationItemRunner from './mock/DictationItemRunner';
import ObjectiveItemRunner from './mock/ObjectiveItemRunner';

const BANKS = {
  ra: readAloudBank,
  rs: repeatSentenceBank,
  di: describeImageBank,
  rl: retellLectureBank,
  wfd: writeFromDictationBank,
  ...Object.fromEntries(Object.entries(OBJECTIVE_TASKS).map(([type, config]) => [type, config.bank])),
};
const HISTORY_SIZE = 5;

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function SkillBar({ label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 font-medium">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div className="h-full bg-cyan-500" style={{ width: `${value === null ? 0 : (value / 90) * 100}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right font-semibold tabular-nums">{value ?? '–'}</span>
    </div>
  );
}

function MockHistory({ history, tm, language }) {
  if (history.length === 0) return null;
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{tm.history}</h3>
      <ul className="divide-y divide-gray-200 text-sm dark:divide-gray-800">
        {history.map((entry) => (
          <li key={new Date(entry.at).getTime()} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="text-gray-600 dark:text-gray-300">{new Date(entry.at).toLocaleString(locale)}</span>
            <span className="tabular-nums">
              <span className="font-semibold">{entry.correct}/90</span>
              {entry.skills && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {SKILLS.map((skill) => `${tm.skillShort[skill]} ${entry.skills[skill] ?? '–'}`).join(' · ')}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MockTest() {
  const { language } = useContext(LanguageContext);
  const t = translations[language].speaking;
  const tm = translations[language].mockTest;
  const { stop: stopSpeaking } = useTextToSpeech();

  const [engine] = useState(() => resolveSpeakingEngine());
  const [stage, setStage] = useState('intro'); // intro | running | results
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [scores, setScores] = useState(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(() => {
    getAttempts()
      .then((attempts) => setHistory(attempts.filter((entry) => entry.task === 'mock').slice(-HISTORY_SIZE).reverse()))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => () => {
    stopSpeaking();
  }, [stopSpeaking]);

  useEffect(() => {
    if (stage !== 'running') return undefined;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [stage, startedAt]);

  const handleStart = () => {
    setItems(buildMockTest(BANKS));
    setIndex(0);
    setResults([]);
    setScores(null);
    setStartedAt(Date.now());
    setElapsed(0);
    setConfirmQuit(false);
    setStage('running');
  };

  const finish = (allResults) => {
    const nextScores = computeMockScores(allResults);
    setScores(nextScores);
    setStage('results');
    if (nextScores.overall !== null) {
      logAttempt({
        task: 'mock',
        itemId: 'mock',
        correct: nextScores.overall,
        total: 90,
        skills: nextScores,
        durationSeconds: Math.floor((Date.now() - startedAt) / 1000),
      })
        .then(loadHistory)
        .catch((err) => console.warn('Could not save mock test.', err));
    }
  };

  const handleItemComplete = (result) => {
    const nextResults = [...results, result];
    setResults(nextResults);
    setConfirmQuit(false);
    if (index + 1 >= items.length) {
      finish(nextResults);
    } else {
      setIndex(index + 1);
    }
  };

  const handleQuit = () => {
    if (!confirmQuit) {
      setConfirmQuit(true);
      return;
    }
    stopSpeaking();
    // Score whatever was answered so the effort still counts.
    if (results.length > 0) finish(results);
    else setStage('intro');
  };

  const current = items[index];
  const totalItems = MOCK_STRUCTURE.reduce((sum, section) => sum + section.count, 0);

  return (
    <PageContainer title={tm.title} description={tm.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        {stage === 'intro' && (
          <SectionCard>
            <div className="space-y-4">
              <ol className="space-y-1 text-sm">
                {MOCK_STRUCTURE.map(({ type, count }) => (
                  <li key={type} className="flex justify-between gap-3 border-b border-gray-100 py-1.5 dark:border-gray-800">
                    <span>{tm.taskNames[type]}</span>
                    <span className="tabular-nums text-gray-600 dark:text-gray-300">×{count}</span>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatMessage(tm.introSummary, { count: totalItems })}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                {tm.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <EngineBadge engine={engine} t={t} />
                <PrimaryButton onClick={handleStart}>{tm.start}</PrimaryButton>
              </div>
              <MockHistory history={history} tm={tm} language={language} />
            </div>
          </SectionCard>
        )}

        {stage === 'running' && current && (
          <SectionCard>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {formatMessage(tm.progress, { current: index + 1, total: items.length })}
                  </p>
                  <h2 className="text-lg font-semibold">{tm.taskNames[current.type]}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums" aria-label={tm.elapsed}>⏱ {formatClock(elapsed)}</span>
                  <PrimaryButton variant={confirmQuit ? 'primary' : 'ghost'} onClick={handleQuit}>
                    {confirmQuit ? tm.confirmQuit : tm.quit}
                  </PrimaryButton>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${(index / items.length) * 100}%` }} />
              </div>

              {current.type === 'wfd' && (
                <DictationItemRunner key={index} item={current.item} onComplete={handleItemComplete} tm={tm} />
              )}
              {OBJECTIVE_TASKS[current.type] && (
                <ObjectiveItemRunner
                  key={index}
                  type={current.type}
                  item={current.item}
                  onComplete={handleItemComplete}
                  tm={tm}
                  labels={translations[language].reading.labels}
                />
              )}
              {['ra', 'rs', 'di', 'rl'].includes(current.type) && (
                <SpeakingItemRunner
                  key={index}
                  type={current.type}
                  item={current.item}
                  engine={engine}
                  onComplete={handleItemComplete}
                  t={t}
                  tm={tm}
                />
              )}
            </div>
          </SectionCard>
        )}

        {stage === 'results' && scores && (
          <SectionCard>
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{tm.overall}</p>
                <p className="text-5xl font-bold">{scores.overall ?? '–'}<span className="text-xl font-medium text-gray-500">/90</span></p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {formatMessage(tm.resultSummary, { answered: results.length, total: items.length, time: formatClock(elapsed) })}
                </p>
              </div>

              <div className="space-y-2">
                {SKILLS.map((skill) => <SkillBar key={skill} label={tm.skills[skill]} value={scores[skill]} />)}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">{tm.estimateNote}</p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <PrimaryButton onClick={handleStart}>{tm.again}</PrimaryButton>
                <Link to="/review">
                  <PrimaryButton variant="secondary" className="w-full">{t.goReview}</PrimaryButton>
                </Link>
              </div>

              <MockHistory history={history} tm={tm} language={language} />
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
