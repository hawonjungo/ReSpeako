import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import { readAloudBank } from '../../data/pte/speaking';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import useSpeakingAttempt from '../../hooks/useSpeakingAttempt';
import { normalizeText, scoreSpeaking } from '../../utils/scoring';
import { addReviewItems, logAttempt } from '../../utils/reviewStore';
import playBeep from '../../utils/beep';
import formatMessage from '../../utils/formatMessage';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import RecordingPanel from './RecordingPanel';
import SpeakingResult from './SpeakingResult';

const PREP_SECONDS = 35;
const ANSWER_SECONDS = 40;
const SKIP_WORD_CARDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'and', 'or',
  'is', 'are', 'was', 'be', 'it', 'its', 'as', 'has', 'have', 'will', 'that', 'they',
]);

// The sentence containing a missed word gives the review card some context.
function findSentenceWithWord(passage, word) {
  const sentences = passage.match(/[^.!?]+[.!?]?/g) || [passage];
  return (sentences.find((sentence) => normalizeText(sentence).split(' ').includes(word)) || '').trim();
}

export default function ReadAloud() {
  const { language } = useContext(LanguageContext);
  const t = translations[language].speaking;
  const { speak, stop: stopSpeaking } = useTextToSpeech();

  const [recordVoice, setRecordVoice] = useState(true);
  const attempt = useSpeakingAttempt({ maxSeconds: ANSWER_SECONDS, recordAudio: recordVoice });

  const [passageIndex, setPassageIndex] = useState(0);
  const [stage, setStage] = useState('ready'); // ready | prep | answer | result
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [result, setResult] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const handledRef = useRef(false);

  const passage = readAloudBank[passageIndex];

  useEffect(() => () => {
    stopSpeaking();
  }, [stopSpeaking]);

  const beginAnswer = async () => {
    setStage('answer');
    await playBeep();
    attempt.start();
  };

  const beginAnswerRef = useRef(beginAnswer);
  useEffect(() => {
    beginAnswerRef.current = beginAnswer;
  });

  // Preparation countdown; recording starts automatically when it ends.
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

    const scored = scoreSpeaking(passage.text, attempt.transcript, attempt.speakingSeconds);
    setResult(scored);
    setStage('result');

    const save = async () => {
      await logAttempt({ task: 'ra', itemId: passage.id, correct: scored.correct, total: scored.total });
      // Only save misses when something was heard; silence means a mic problem.
      if (!attempt.transcript.trim()) return;
      const items = [...new Set(scored.missedWords)]
        .filter((word) => !SKIP_WORD_CARDS.has(word))
        .map((word) => ({
          kind: 'word',
          text: word,
          source: 'ra',
          note: findSentenceWithWord(passage.text, word),
        }));
      setAddedCount(await addReviewItems(items));
    };
    save().catch((err) => console.warn('Could not save read aloud result.', err));
  }, [attempt.phase, attempt.speakingSeconds, attempt.transcript, passage, stage]);

  const handleStart = () => {
    handledRef.current = false;
    attempt.reset();
    setResult(null);
    setAddedCount(0);
    setPrepLeft(PREP_SECONDS);
    setStage('prep');
  };

  const choosePassage = (nextIndex) => {
    attempt.reset();
    setPassageIndex(nextIndex);
    setResult(null);
    setStage('ready');
  };

  const isBusy = stage === 'prep' || stage === 'answer';

  return (
    <PageContainer title={t.raTitle} description={t.raDescription}>
      <div className="mx-auto max-w-3xl space-y-4">
        <SectionCard>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="font-medium">{t.choosePassage}</span>
              <select
                value={passageIndex}
                disabled={isBusy}
                onChange={(event) => choosePassage(Number(event.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
              >
                {readAloudBank.map((item, itemIndex) => (
                  <option key={item.id} value={itemIndex}>{itemIndex + 1}. {item.title}</option>
                ))}
              </select>
            </label>
            {attempt.recordingAvailable && (
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
            <p className="text-lg leading-8">{passage.text}</p>

            {stage === 'ready' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">{t.raInstruction}</p>
                <PrimaryButton onClick={handleStart}>{t.start}</PrimaryButton>
              </div>
            )}

            {stage === 'prep' && (
              <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-900 dark:bg-cyan-950/30" aria-live="polite">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-cyan-700 dark:text-cyan-300">{t.prep}</p>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMessage(t.timeLeft, { seconds: prepLeft })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{t.prepHint}</p>
                <PrimaryButton variant="secondary" onClick={() => setPrepLeft(0)}>{t.startNow}</PrimaryButton>
              </div>
            )}

            {stage === 'answer' && <RecordingPanel attempt={attempt} maxSeconds={ANSWER_SECONDS} t={t} />}

            {attempt.error && stage !== 'ready' && <StatusBanner type="error" message={attempt.error} />}

            {stage === 'result' && result && (
              <div className="space-y-4">
                <SpeakingResult
                  result={result}
                  transcript={attempt.transcript}
                  audioUrl={attempt.audioUrl}
                  audioBlob={attempt.audioBlob}
                  referenceText={passage.text}
                  source="ra"
                  onPlayModel={() => speak(passage.text)}
                  t={t}
                />
                {addedCount > 0 && (
                  <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to="/review">
                    <PrimaryButton variant="ghost">{t.goReview}</PrimaryButton>
                  </Link>
                  <PrimaryButton variant="secondary" onClick={handleStart}>{t.retry}</PrimaryButton>
                  <PrimaryButton onClick={() => choosePassage((passageIndex + 1) % readAloudBank.length)}>
                    {t.next}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
