import { useEffect, useRef, useState } from 'react';
import useTextToSpeech from '../../../hooks/useTextToSpeech';
import useSpeakingAttempt from '../../../hooks/useSpeakingAttempt';
import { scoreOpenSpeaking, scoreSpeaking } from '../../../utils/scoring';
import {
  getReadAloudReviewItems,
  getRepeatSentenceReviewItems,
  getWeakPronunciationItems,
  recordAnswer,
} from '../../../utils/practiceRecords';
import playBeep from '../../../utils/beep';
import formatMessage from '../../../utils/formatMessage';
import PrimaryButton from '../../ui/PrimaryButton';
import StatusBanner from '../../ui/StatusBanner';
import ChartImage from '../ChartImage';
import RecordingPanel from '../RecordingPanel';

// Exam timing per task; `listenFirst` plays the prompt audio before preparation.
const TASK_CONFIG = {
  ra: { prepSeconds: 35, answerSeconds: 40, listenFirst: false, scripted: true },
  rs: { prepSeconds: 0, answerSeconds: 15, listenFirst: true, scripted: true },
  di: { prepSeconds: 25, answerSeconds: 40, listenFirst: false, scripted: false },
  rl: { prepSeconds: 10, answerSeconds: 40, listenFirst: true, scripted: false },
};

function scoreAnswer(type, item, transcript, speakingSeconds) {
  return TASK_CONFIG[type].scripted
    ? scoreSpeaking(item.text, transcript, speakingSeconds)
    : scoreOpenSpeaking(transcript, item.keyIdeas, speakingSeconds);
}

function getReviewItems(type, item, scored, transcript, assessment) {
  const content = {
    ra: () => getReadAloudReviewItems(item, scored, transcript),
    rs: () => getRepeatSentenceReviewItems(item, scored, transcript),
  }[type]?.() || [];
  return [...content, ...getWeakPronunciationItems(assessment, type)];
}

/**
 * One speaking question in the mock test. Runs automatically, exam style:
 * no replays, no feedback until the end. Calls onComplete(result) on Next.
 */
export default function SpeakingItemRunner({ type, item, engine, onComplete, t, tm }) {
  const config = TASK_CONFIG[type];
  const { speak } = useTextToSpeech();
  const attempt = useSpeakingAttempt({ maxSeconds: config.answerSeconds, recordAudio: false, engine });

  const [stage, setStage] = useState('starting'); // starting | listening | prep | answer | done
  const [prepLeft, setPrepLeft] = useState(config.prepSeconds);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const startedRef = useRef(false);
  const handledRef = useRef(false);

  const beginAnswer = async () => {
    setStage('answer');
    await playBeep();
    attempt.start(config.scripted ? item.text : '');
  };

  const beginAnswerRef = useRef(beginAnswer);
  useEffect(() => {
    beginAnswerRef.current = beginAnswer;
  });

  // Start once on mount (the ref guards against StrictMode's double effect run).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      if (config.listenFirst) {
        setStage('listening');
        await speak(item.text);
      }
      setStage('prep');
    };
    run();
  }, [config.listenFirst, item.text, speak]);

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

    const scored = scoreAnswer(type, item, attempt.transcript, attempt.speakingSeconds);
    const pronunciation = attempt.assessment?.report?.pronunciation;
    setResult({
      type,
      itemId: item.id,
      overall: scored.overall,
      correct: scored.correct,
      total: scored.total,
      pronunciation: typeof pronunciation === 'number' ? pronunciation : undefined,
      heardSomething: Boolean(attempt.transcript.trim()),
    });
    setStage('done');

    recordAnswer({
      task: type,
      itemId: item.id,
      correct: scored.correct,
      total: scored.total,
      reviewItems: getReviewItems(type, item, scored, attempt.transcript, attempt.assessment),
    }).catch((err) => console.warn('Could not save mock answer.', err));
  }, [attempt.assessment, attempt.phase, attempt.speakingSeconds, attempt.transcript, item, stage, type]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">{tm.instructions[type]}</p>

      {type === 'ra' && <p className="text-lg leading-8">{item.text}</p>}
      {type === 'di' && <ChartImage chart={item} />}

      {stage === 'listening' && <StatusBanner type="info" message={t.listening} />}

      {stage === 'prep' && config.prepSeconds > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-900 dark:bg-cyan-950/30" aria-live="polite">
          <p className="font-medium text-cyan-700 dark:text-cyan-300">{t.prep}</p>
          <span className="text-sm font-semibold tabular-nums">{formatMessage(t.timeLeft, { seconds: prepLeft })}</span>
        </div>
      )}

      {type === 'rl' && stage !== 'done' && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">{tm.notes}</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
          />
        </label>
      )}

      {stage === 'answer' && <RecordingPanel attempt={attempt} maxSeconds={config.answerSeconds} t={t} />}

      {stage === 'done' && result && (
        <div className="space-y-3">
          <StatusBanner
            type={result.heardSomething ? 'success' : 'warning'}
            message={result.heardSomething ? tm.answerSaved : t.nothingHeard}
          />
          <div className="flex justify-end">
            <PrimaryButton onClick={() => onComplete(result)}>{tm.next}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
