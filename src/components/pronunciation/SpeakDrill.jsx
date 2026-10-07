import { useEffect, useRef, useState } from 'react';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import useSpeakingAttempt from '../../hooks/useSpeakingAttempt';
import { normalizeText, scoreSpeaking } from '../../utils/scoring';
import { focusSoundScore } from '../../utils/phonemeStats';
import { logAttempt } from '../../utils/reviewStore';
import formatMessage from '../../utils/formatMessage';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import PronunciationReport from '../pte/PronunciationReport';
import WordDiff from '../pte/WordDiff';

export const PASS_SCORE = 80;
const FOCUS_PASS_SCORE = 70;

/** Score one take: overall 0-100, the focus sounds' score, and what was heard. */
function scoreTake(attempt, target, symbols, mode) {
  const report = attempt.assessment?.report;
  if (report?.status === 'Success') {
    const overall = mode === 'word'
      ? (report.words.find((word) => normalizeText(word.word) === normalizeText(target))?.accuracy ?? report.accuracy)
      : report.pronunciation;
    return {
      overall: overall ?? 0,
      focus: symbols.length > 0 ? focusSoundScore(report, symbols) : null,
      heard: report.lexicalText,
      misheard: mode === 'word' && normalizeText(report.lexicalText) !== normalizeText(target),
      detailed: true,
    };
  }

  // Browser recognition only tells us which words were heard, not how they sounded.
  const scored = scoreSpeaking(target, attempt.transcript, attempt.speakingSeconds);
  return {
    overall: scored.total === 0 ? 0 : Math.round((scored.correct / scored.total) * 100),
    focus: null,
    heard: attempt.transcript,
    misheard: mode === 'word' && normalizeText(attempt.transcript) !== normalizeText(target),
    detailed: false,
    parts: scored.parts,
  };
}

/**
 * Steps 2 and 3: say minimal-pair words (mode "word") or shadow sentences
 * (mode "sentence"), with scores for the sounds being practised.
 */
export default function SpeakDrill({ items, contrasts = {}, symbols = [], mode, engine, t }) {
  const { speak, stop } = useTextToSpeech();
  const attempt = useSpeakingAttempt({
    maxSeconds: mode === 'word' ? 5 : 15,
    silenceMs: mode === 'word' ? 1200 : 1800,
    recordAudio: true,
    engine,
  });

  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState({});
  const [tries, setTries] = useState(0);
  const handledRef = useRef(true);

  const target = items[index];
  const passed = result && result.overall >= PASS_SCORE && (result.focus === null || result.focus >= FOCUS_PASS_SCORE);
  const busy = attempt.phase === 'recording' || attempt.phase === 'stopping' || attempt.phase === 'assessing';

  useEffect(() => () => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (attempt.phase !== 'done' || handledRef.current) return;
    handledRef.current = true;
    const scored = scoreTake(attempt, target, symbols, mode);
    setResult(scored);
    setBest((previous) => ({ ...previous, [index]: Math.max(previous[index] ?? 0, scored.overall) }));
    logAttempt({ task: 'coach', itemId: target, correct: scored.overall, total: 100 })
      .catch((err) => console.warn('Could not save pronunciation practice.', err));
  }, [attempt, index, mode, symbols, target]);

  const handleRecord = async () => {
    stop();
    handledRef.current = false;
    setResult(null);
    setTries((count) => count + 1);
    await attempt.start(target);
  };

  const goTo = (nextIndex) => {
    stop();
    attempt.reset();
    handledRef.current = true;
    setIndex(nextIndex);
    setResult(null);
    setTries(0);
  };

  const passedCount = Object.values(best).filter((score) => score >= PASS_SCORE).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{formatMessage(t.itemProgress, { current: index + 1, total: items.length })}</span>
        <span>{formatMessage(t.passedCount, { count: passedCount, total: items.length })}</span>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 text-center dark:border-gray-800">
        <p className={mode === 'word' ? 'text-4xl font-semibold' : 'text-xl leading-8'}>{target}</p>
        {mode === 'word' && contrasts[target] && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatMessage(t.contrastWith, { word: contrasts[target] })}</p>
        )}
        {best[index] !== undefined && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatMessage(t.bestScore, { score: best[index] })}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <PrimaryButton variant="secondary" onClick={() => speak(target)} disabled={busy}>{t.listenNormal}</PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => speak(target, { rate: 0.65 })} disabled={busy}>{t.listenSlow}</PrimaryButton>
        <PrimaryButton onClick={handleRecord} disabled={busy}>
          {busy ? (attempt.phase === 'assessing' ? t.scoring : t.recording) : (tries > 0 ? t.recordAgain : t.record)}
        </PrimaryButton>
        {attempt.phase === 'recording' && (
          <PrimaryButton variant="ghost" onClick={attempt.stop}>{t.stop}</PrimaryButton>
        )}
      </div>

      {attempt.phase === 'recording' && (
        <p className="text-center text-sm text-rose-600 dark:text-rose-400" aria-live="polite">● {t.speakNow}</p>
      )}

      {attempt.assessError && attempt.phase === 'done' && (
        <StatusBanner type="error" message={t.errors[attempt.assessError] || t.errors.default} />
      )}
      {attempt.error && <StatusBanner type="error" message={attempt.error} />}

      {result && attempt.phase === 'done' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{mode === 'word' ? t.wordScore : t.sentenceScore}</p>
              <p className="text-3xl font-semibold">{result.overall}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {formatMessage(t.focusScore, { sounds: symbols.map((symbol) => `/${symbol}/`).join(' ') || '–' })}
              </p>
              <p className="text-3xl font-semibold">{result.focus ?? '–'}</p>
            </div>
          </div>

          <StatusBanner
            type={passed ? 'success' : 'info'}
            message={passed ? t.passed : formatMessage(t.keepGoing, { target: PASS_SCORE })}
          />
          {result.misheard && result.heard && (
            <p className="text-center text-sm text-amber-700 dark:text-amber-300">{formatMessage(t.heardAs, { text: result.heard })}</p>
          )}

          {attempt.audioUrl && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="font-medium">{t.yourVoice}:</span>
              <audio controls src={attempt.audioUrl} className="h-10 max-w-full" />
            </div>
          )}

          {result.detailed ? (
            <PronunciationReport
              key={attempt.audioUrl || `${index}-${tries}`}
              audioBlob={attempt.audioBlob}
              initialResult={attempt.assessment}
              referenceText={target}
              source="coach"
            />
          ) : (
            <div className="space-y-2">
              {result.parts && <WordDiff parts={result.parts} />}
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.browserNote}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <PrimaryButton variant="ghost" onClick={() => goTo(index - 1)} disabled={index === 0 || busy}>{t.previous}</PrimaryButton>
        <PrimaryButton variant={passed ? 'primary' : 'secondary'} onClick={() => goTo((index + 1) % items.length)} disabled={busy}>
          {t.nextItem}
        </PrimaryButton>
      </div>
    </div>
  );
}
