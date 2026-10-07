import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import { repeatSentenceBank } from '../../data/pte/speaking';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import useSpeakingAttempt from '../../hooks/useSpeakingAttempt';
import { scoreSpeaking } from '../../utils/scoring';
import { addReviewItems, logAttempt } from '../../utils/reviewStore';
import shuffleArray from '../../utils/shuffleArray';
import playBeep from '../../utils/beep';
import formatMessage from '../../utils/formatMessage';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import RecordingPanel from './RecordingPanel';
import SpeakingResult from './SpeakingResult';
import EngineBadge from './EngineBadge';
import { resolveSpeakingEngine } from '../../utils/pronunciation';

const SESSION_SIZE = 10;
const ANSWER_SECONDS = 15;

export default function RepeatSentence() {
  const { language } = useContext(LanguageContext);
  const t = translations[language].speaking;
  const { speak, stop: stopSpeaking } = useTextToSpeech();

  const [recordVoice, setRecordVoice] = useState(true);
  const [engine] = useState(() => resolveSpeakingEngine());
  const attempt = useSpeakingAttempt({ maxSeconds: ANSWER_SECONDS, recordAudio: recordVoice, engine });
  const pronunciationErrors = translations[language].pronunciation.errors;

  const [session, setSession] = useState(() => shuffleArray(repeatSentenceBank).slice(0, SESSION_SIZE));
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState('ready'); // ready | playing | answer | result | finished
  const [result, setResult] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const [scores, setScores] = useState([]);
  const handledRef = useRef(false);

  const current = session[index];
  const isLast = index === session.length - 1;

  useEffect(() => () => {
    stopSpeaking();
  }, [stopSpeaking]);

  // Score once the mic has closed.
  useEffect(() => {
    if (stage !== 'answer' || attempt.phase !== 'done' || handledRef.current) return;
    handledRef.current = true;

    const scored = scoreSpeaking(current.text, attempt.transcript, attempt.speakingSeconds);
    setResult(scored);
    setScores((prev) => [...prev, scored.overall]);
    setStage('result');

    const save = async () => {
      await logAttempt({ task: 'rs', itemId: current.id, correct: scored.correct, total: scored.total });
      // Silence usually means a mic problem, not a memory gap.
      if (attempt.transcript.trim() && scored.contentBand < 3) {
        setAddedCount(await addReviewItems([{ kind: 'sentence', text: current.text, source: 'rs' }]));
      }
    };
    save().catch((err) => console.warn('Could not save repeat sentence result.', err));
  }, [attempt.phase, attempt.speakingSeconds, attempt.transcript, current, stage]);

  const handleStart = async () => {
    if (!current) return;
    handledRef.current = false;
    setResult(null);
    setAddedCount(0);
    attempt.reset();
    setStage('playing');
    await speak(current.text);
    await playBeep();
    setStage('answer');
    attempt.start(current.text);
  };

  const handleNext = () => {
    attempt.reset();
    setResult(null);
    if (isLast) {
      setStage('finished');
      return;
    }
    setIndex((value) => value + 1);
    setStage('ready');
  };

  const handleRestart = () => {
    attempt.reset();
    setSession(shuffleArray(repeatSentenceBank).slice(0, SESSION_SIZE));
    setIndex(0);
    setScores([]);
    setResult(null);
    setStage('ready');
  };

  const average = scores.length === 0 ? 0 : Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);

  return (
    <PageContainer title={t.rsTitle} description={t.rsDescription}>
      <div className="mx-auto max-w-3xl space-y-4">
        {stage === 'finished' ? (
          <SectionCard>
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-semibold">{t.summaryTitle}</h2>
              <p className="text-gray-600 dark:text-gray-300">{formatMessage(t.summaryScore, { score: average })}</p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <PrimaryButton onClick={handleRestart}>{t.restart}</PrimaryButton>
                <Link to="/review">
                  <PrimaryButton variant="secondary" className="w-full">{t.goReview}</PrimaryButton>
                </Link>
              </div>
            </div>
          </SectionCard>
        ) : current && (
          <SectionCard>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-medium text-gray-600 dark:text-gray-300">
                  {formatMessage(t.progress, { current: index + 1, total: session.length })}
                </p>
                <EngineBadge engine={engine} t={t} />
                {engine === 'browser' && attempt.recordingAvailable && (
                  <label className="flex items-center gap-2" title={t.recordHint}>
                    <input
                      type="checkbox"
                      checked={recordVoice}
                      disabled={stage === 'playing' || stage === 'answer'}
                      onChange={(event) => setRecordVoice(event.target.checked)}
                    />
                    {t.recordVoice}
                  </label>
                )}
              </div>

              {stage === 'ready' && (
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-300">{t.rsInstruction}</p>
                  <PrimaryButton onClick={handleStart}>{t.start}</PrimaryButton>
                </div>
              )}

              {stage === 'playing' && <StatusBanner type="info" message={t.listening} />}

              {stage === 'answer' && <RecordingPanel attempt={attempt} maxSeconds={ANSWER_SECONDS} t={t} />}

              {attempt.error && stage !== 'ready' && <StatusBanner type="error" message={attempt.error} />}
              {attempt.assessError && stage === 'result' && (
                <StatusBanner type="error" message={pronunciationErrors[attempt.assessError] || pronunciationErrors.default} />
              )}

              {stage === 'result' && result && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-black/30">
                    <span className="font-semibold">{t.answer}:</span> {current.text}
                  </div>
                  <SpeakingResult
                    result={result}
                    transcript={attempt.transcript}
                    audioUrl={attempt.audioUrl}
                    audioBlob={attempt.audioBlob}
                    assessment={attempt.assessment}
                    referenceText={current.text}
                    source="rs"
                    onPlayModel={() => speak(current.text)}
                    showBand
                    t={t}
                  />
                  {addedCount > 0 && (
                    <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
                    <PrimaryButton variant="secondary" onClick={handleStart}>{t.retry}</PrimaryButton>
                    <PrimaryButton onClick={handleNext}>{isLast ? t.finish : t.next}</PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
