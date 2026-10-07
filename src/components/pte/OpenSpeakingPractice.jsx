import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import {
  describeImageBank,
  describeImageTemplate,
  retellLectureBank,
  retellLectureTemplate,
} from '../../data/pte/openSpeaking';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import useSpeakingAttempt from '../../hooks/useSpeakingAttempt';
import { scoreOpenSpeaking } from '../../utils/scoring';
import { logAttempt } from '../../utils/reviewStore';
import { resolveSpeakingEngine } from '../../utils/pronunciation';
import playBeep from '../../utils/beep';
import formatMessage from '../../utils/formatMessage';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import ChartImage from './ChartImage';
import EngineBadge from './EngineBadge';
import OpenSpeakingResult from './OpenSpeakingResult';
import RecordingPanel from './RecordingPanel';

// PTE timings for the two free-speaking tasks.
const TASKS = {
  di: { bank: describeImageBank, template: describeImageTemplate, prepSeconds: 25, answerSeconds: 40 },
  rl: { bank: retellLectureBank, template: retellLectureTemplate, prepSeconds: 10, answerSeconds: 40 },
};

/**
 * Describe Image ("di") and Retell Lecture ("rl"): no script to read, so the
 * answer is scored on key ideas covered, pace and (optionally) Azure pronunciation.
 */
export default function OpenSpeakingPractice({ task }) {
  const { language } = useContext(LanguageContext);
  const t = translations[language].speaking;
  const tt = translations[language].openSpeaking[task];
  const pronunciationErrors = translations[language].pronunciation.errors;
  const config = TASKS[task];
  const { speak, stop: stopSpeaking } = useTextToSpeech();

  const [engine] = useState(() => resolveSpeakingEngine());
  const [recordVoice, setRecordVoice] = useState(true);
  const attempt = useSpeakingAttempt({ maxSeconds: config.answerSeconds, recordAudio: recordVoice, engine });

  const [itemIndex, setItemIndex] = useState(0);
  const [stage, setStage] = useState('ready'); // ready | lecture | prep | answer | result
  const [prepLeft, setPrepLeft] = useState(config.prepSeconds);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const handledRef = useRef(false);
  const stageRef = useRef(stage);

  const item = config.bank[itemIndex];
  const isBusy = stage === 'lecture' || stage === 'prep' || stage === 'answer';

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => () => {
    stopSpeaking();
  }, [stopSpeaking]);

  const beginAnswer = async () => {
    setStage('answer');
    await playBeep();
    // No reference text: Azure runs an unscripted assessment.
    attempt.start('');
  };

  const beginAnswerRef = useRef(beginAnswer);
  useEffect(() => {
    beginAnswerRef.current = beginAnswer;
  });

  useEffect(() => {
    if (stage !== 'prep') return undefined;
    if (prepLeft <= 0) {
      beginAnswerRef.current();
      return undefined;
    }
    const timer = window.setTimeout(() => setPrepLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [prepLeft, stage]);

  useEffect(() => {
    if (stage !== 'answer' || attempt.phase !== 'done' || handledRef.current) return;
    handledRef.current = true;

    const scored = scoreOpenSpeaking(attempt.transcript, item.keyIdeas, attempt.speakingSeconds);
    setResult(scored);
    setStage('result');
    logAttempt({ task, itemId: item.id, correct: scored.correct, total: scored.total })
      .catch((err) => console.warn('Could not save speaking result.', err));
  }, [attempt.phase, attempt.speakingSeconds, attempt.transcript, item, stage, task]);

  const handleStart = async () => {
    handledRef.current = false;
    attempt.reset();
    setResult(null);
    setPrepLeft(config.prepSeconds);

    if (task === 'rl') {
      setNotes('');
      setStage('lecture');
      await speak(item.text);
      // The learner may have left or restarted while the lecture played.
      if (stageRef.current !== 'lecture') return;
    }
    setStage('prep');
  };

  const chooseItem = (nextIndex) => {
    stopSpeaking();
    attempt.reset();
    setItemIndex(nextIndex);
    setResult(null);
    setNotes('');
    setStage('ready');
  };

  return (
    <PageContainer title={tt.title} description={tt.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        <SectionCard>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="font-medium">{tt.choose}</span>
              <select
                value={itemIndex}
                disabled={isBusy}
                onChange={(event) => chooseItem(Number(event.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
              >
                {config.bank.map((entry, index) => (
                  <option key={entry.id} value={index}>{index + 1}. {entry.title}</option>
                ))}
              </select>
            </label>
            <EngineBadge engine={engine} t={t} />
            {engine === 'browser' && attempt.recordingAvailable && (
              <label className="flex items-center gap-2" title={t.recordHint}>
                <input
                  type="checkbox"
                  checked={recordVoice}
                  disabled={isBusy}
                  onChange={(event) => setRecordVoice(event.target.checked)}
                />
                {t.recordVoice}
              </label>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            {task === 'di' && <ChartImage chart={item} />}

            {stage === 'ready' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">{tt.instruction}</p>
                <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <summary className="cursor-pointer font-medium">{tt.templateTitle}</summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {config.template.map((line) => <li key={line}>{line}</li>)}
                  </ol>
                </details>
                <PrimaryButton onClick={handleStart}>{t.start}</PrimaryButton>
              </div>
            )}

            {stage === 'lecture' && <StatusBanner type="info" message={tt.listening} />}

            {stage === 'prep' && (
              <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-900 dark:bg-cyan-950/30" aria-live="polite">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-cyan-700 dark:text-cyan-300">{t.prep}</p>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMessage(t.timeLeft, { seconds: prepLeft })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{tt.prepHint}</p>
                <PrimaryButton variant="secondary" onClick={() => setPrepLeft(0)}>{t.startNow}</PrimaryButton>
              </div>
            )}

            {task === 'rl' && (stage === 'lecture' || stage === 'prep' || stage === 'answer') && (
              <label className="block space-y-1">
                <span className="text-sm font-medium">{tt.notes}</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
                />
              </label>
            )}

            {stage === 'answer' && <RecordingPanel attempt={attempt} maxSeconds={config.answerSeconds} t={t} />}

            {attempt.error && stage !== 'ready' && <StatusBanner type="error" message={attempt.error} />}
            {attempt.assessError && stage === 'result' && (
              <StatusBanner type="error" message={pronunciationErrors[attempt.assessError] || pronunciationErrors.default} />
            )}

            {stage === 'result' && result && (
              <div className="space-y-4">
                <OpenSpeakingResult
                  result={result}
                  attempt={attempt}
                  sample={item.sample}
                  source={task}
                  onPlaySample={() => speak(item.sample)}
                  t={{ ...t, ...tt }}
                />
                {task === 'rl' && (
                  <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <summary className="cursor-pointer font-medium">{tt.lectureText}</summary>
                    <p className="mt-2 leading-6">{item.text}</p>
                  </details>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to="/review">
                    <PrimaryButton variant="ghost">{t.goReview}</PrimaryButton>
                  </Link>
                  <PrimaryButton variant="secondary" onClick={handleStart}>{t.retry}</PrimaryButton>
                  <PrimaryButton onClick={() => chooseItem((itemIndex + 1) % config.bank.length)}>{t.next}</PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
