import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { translations } from '../../../i18n/translations';
import { essayBank, summarizeBank } from '../../../data/pte/writing';
import { retellLectureBank } from '../../../data/pte/openSpeaking';
import useTextToSpeech from '../../../hooks/useTextToSpeech';
import {
  checkEssayForm, checkSpokenSummaryForm, checkSummaryForm, countParagraphs, countSentences, countWords, toWritingScale,
} from '../../../utils/writing';
import { getCorrectionReviewItems, requestWritingFeedback } from '../../../utils/writingFeedback';
import { isPronunciationConfigured, PronunciationError } from '../../../utils/pronunciation';
import { recordAnswer } from '../../../utils/practiceRecords';
import { addReviewItems } from '../../../utils/reviewStore';
import formatMessage from '../../../utils/formatMessage';
import PageContainer from '../../ui/PageContainer';
import SectionCard from '../../ui/SectionCard';
import PrimaryButton from '../../ui/PrimaryButton';
import StatusBanner from '../../ui/StatusBanner';

const TASKS = {
  swt: { bank: summarizeBank, minutes: 10, check: checkSummaryForm, promptOf: (item) => item.passage },
  essay: { bank: essayBank, minutes: 20, check: checkEssayForm, promptOf: (item) => item.prompt },
  // Summarize Spoken Text reuses the lectures; the lecture plays once before writing.
  sst: { bank: retellLectureBank, minutes: 10, check: checkSpokenSummaryForm, promptOf: (item) => item.text, audio: true },
};

function formatClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function Counter({ label, value, ok }) {
  return (
    <span className={`rounded-md px-2 py-0.5 ${ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
      {label}: <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

/** Summarize Written Text ("swt") and Write Essay ("essay") practice with timer and AI feedback. */
export default function WritingPractice({ task }) {
  const { language } = useContext(LanguageContext);
  const t = translations[language].writing;
  const tt = t.tasks[task];
  const config = TASKS[task];

  const [itemIndex, setItemIndex] = useState(0);
  const [stage, setStage] = useState('ready'); // ready | listening (SST) | writing | submitted
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(config.minutes * 60);
  const [form, setForm] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState('idle'); // idle | loading | done | error
  const [errorCode, setErrorCode] = useState('');
  const [usage, setUsage] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lecturePlaying, setLecturePlaying] = useState(false);
  const { speak, stop: stopSpeaking } = useTextToSpeech();
  const textRef = useRef('');
  const submitRef = useRef(null);
  const recordedRef = useRef(false);

  const item = config.bank[itemIndex];
  const aiAvailable = isPronunciationConfigured();
  const words = countWords(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => () => {
    stopSpeaking();
  }, [stopSpeaking]);

  // Summarize Spoken Text: play the lecture once, then the writing time starts.
  const handleStart = async () => {
    if (!config.audio) {
      setStage('writing');
      return;
    }
    setStage('listening');
    setLecturePlaying(true);
    await speak(item.text);
    setLecturePlaying(false);
    setStage((current) => (current === 'listening' ? 'writing' : current));
  };

  // Countdown; the answer is submitted automatically when time runs out, as in the exam.
  useEffect(() => {
    if (stage !== 'writing') return undefined;
    if (timeLeft <= 0) {
      submitRef.current?.();
      return undefined;
    }
    const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [stage, timeLeft]);

  // Log each submission once; later AI feedback (e.g. a retry) only adds review cards.
  const saveRecord = (points, maxPoints, reviewItems = []) => {
    const save = recordedRef.current
      ? (reviewItems.length > 0 ? addReviewItems(reviewItems) : Promise.resolve(0))
      : recordAnswer({ task, itemId: item.id, correct: points, total: maxPoints, reviewItems });
    recordedRef.current = true;
    save
      .then(setAddedCount)
      .catch((err) => console.warn('Could not save writing result.', err));
  };

  const fetchFeedback = async (formResult) => {
    setFeedbackStatus('loading');
    setErrorCode('');
    try {
      const response = await requestWritingFeedback({
        task,
        prompt: config.promptOf(item),
        answer: textRef.current,
        language,
      });
      setFeedback(response.feedback);
      setUsage(response.usage);
      setFeedbackStatus('done');

      const traitPoints = response.feedback.traits.reduce((sum, trait) => sum + trait.score, 0);
      const traitMax = response.feedback.traits.reduce((sum, trait) => sum + trait.max, 0);
      const points = formResult.blocksScoring ? 0 : formResult.form + traitPoints;
      saveRecord(points, formResult.max + traitMax, getCorrectionReviewItems(task, response.feedback.corrections));
    } catch (error) {
      setErrorCode(error instanceof PronunciationError ? error.code : 'default');
      setFeedbackStatus('error');
      saveRecord(formResult.blocksScoring ? 0 : formResult.form, formResult.max);
    }
  };

  const handleSubmit = () => {
    if (stage !== 'writing') return;
    const formResult = config.check(textRef.current);
    setForm(formResult);
    setStage('submitted');

    if (aiAvailable && !formResult.blocksScoring && countWords(textRef.current) > 0) {
      fetchFeedback(formResult);
    } else {
      saveRecord(formResult.blocksScoring ? 0 : formResult.form, formResult.max);
    }
  };
  submitRef.current = handleSubmit;

  const chooseItem = (nextIndex) => {
    stopSpeaking();
    setLecturePlaying(false);
    setNotes('');
    recordedRef.current = false;
    setItemIndex(nextIndex);
    setStage('ready');
    setText('');
    setTimeLeft(config.minutes * 60);
    setForm(null);
    setFeedback(null);
    setFeedbackStatus('idle');
    setErrorCode('');
    setAddedCount(0);
  };

  const traitPoints = feedback ? feedback.traits.reduce((sum, trait) => sum + trait.score, 0) : 0;
  const traitMax = feedback ? feedback.traits.reduce((sum, trait) => sum + trait.max, 0) : 0;
  const totalPoints = form ? (form.blocksScoring ? 0 : form.form + traitPoints) : 0;
  const totalMax = form ? form.max + traitMax : 0;

  const countersOk = {
    swt: { words: words >= 5 && words <= 75, sentences: countSentences(text) === 1 },
    essay: { words: words >= 200 && words <= 300, paragraphs: countParagraphs(text) >= 3 },
    sst: { words: words >= 50 && words <= 70 },
  }[task];

  return (
    <PageContainer title={tt.title} description={tt.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        <SectionCard>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{t.choose}</span>
            <select
              value={itemIndex}
              disabled={stage === 'writing' || stage === 'listening'}
              onChange={(event) => chooseItem(Number(event.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
            >
              {config.bank.map((entry, index) => (
                <option key={entry.id} value={index}>{index + 1}. {entry.title}</option>
              ))}
            </select>
          </label>
          {!aiAvailable && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {t.aiOff}{' '}
              <Link to="/settings" className="font-medium text-cyan-700 underline dark:text-cyan-300">{t.openSettings}</Link>
            </p>
          )}
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">{tt.instruction}</p>
            {task === 'swt' && <p className="leading-7">{item.passage}</p>}
            {task === 'essay' && <p className="font-medium leading-7">{item.prompt}</p>}
            {task === 'sst' && stage === 'listening' && (
              <StatusBanner type="info" message={lecturePlaying ? tt.listening : tt.ready} />
            )}
            {task === 'sst' && (stage === 'listening' || stage === 'writing') && (
              <label className="block space-y-1">
                <span className="text-sm font-medium">{tt.notes}</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
                />
              </label>
            )}

            {task === 'essay' && stage !== 'submitted' && (
              <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                <summary className="cursor-pointer font-medium">{t.ideas}</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {item.ideas.map((idea) => <li key={idea}>{idea}</li>)}
                </ul>
              </details>
            )}

            {stage === 'ready' && (
              <PrimaryButton onClick={handleStart}>
                {formatMessage(tt.startLabel || t.start, { minutes: config.minutes })}
              </PrimaryButton>
            )}

            {(stage === 'writing' || stage === 'submitted') && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Counter label={t.words} value={words} ok={countersOk.words} />
                    {task === 'swt' && <Counter label={t.sentences} value={countSentences(text)} ok={countersOk.sentences} />}
                    {task === 'essay' && <Counter label={t.paragraphs} value={countParagraphs(text)} ok={countersOk.paragraphs} />}
                  </div>
                  {stage === 'writing' && (
                    <span className={`font-mono tabular-nums ${timeLeft <= 60 ? 'text-rose-600' : ''}`} aria-label={t.timeLeft}>
                      ⏱ {formatClock(timeLeft)}
                    </span>
                  )}
                </div>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  readOnly={stage === 'submitted'}
                  rows={task === 'swt' ? 5 : 14}
                  spellCheck={false}
                  autoCorrect="off"
                  aria-label={tt.title}
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-base leading-7 outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{tt.rangeHint}</p>
                {stage === 'writing' && (
                  <div className="flex justify-end">
                    <PrimaryButton onClick={handleSubmit} disabled={words === 0}>{t.submit}</PrimaryButton>
                  </div>
                )}
              </>
            )}

            {stage === 'submitted' && form && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                  <p className="font-semibold">{formatMessage(t.formScore, { score: form.form, max: form.max })}</p>
                  {form.issues.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-amber-700 dark:text-amber-300">
                      {form.issues.map((issue) => <li key={issue}>{t.issues[issue]}</li>)}
                    </ul>
                  )}
                  {form.blocksScoring && <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{tt.zeroRule}</p>}
                </div>

                {feedbackStatus === 'loading' && <StatusBanner type="info" message={t.aiLoading} />}
                {feedbackStatus === 'error' && <StatusBanner type="error" message={t.errors[errorCode] || t.errors.default} />}
                {aiAvailable && feedbackStatus !== 'loading' && feedbackStatus !== 'done' && (
                  <PrimaryButton variant="secondary" onClick={() => fetchFeedback(form)}>
                    {feedbackStatus === 'error' ? t.retryAi : t.getAiAnyway}
                  </PrimaryButton>
                )}

                {feedback && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-2xl font-semibold">
                        {formatMessage(t.estimate, { score: toWritingScale(totalPoints, totalMax), points: totalPoints, max: totalMax })}
                      </p>
                      {usage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessage(t.usage, usage)}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {feedback.traits.map((trait) => (
                        <li key={trait.name} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                          <p className="flex justify-between gap-2 font-medium">
                            <span>{t.traits[trait.name] || trait.name}</span>
                            <span className="tabular-nums">{trait.score}/{trait.max}</span>
                          </p>
                          {trait.comment && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{trait.comment}</p>}
                        </li>
                      ))}
                    </ul>

                    {feedback.overallComment && (
                      <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-black/30">{feedback.overallComment}</div>
                    )}

                    {feedback.corrections.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">{t.corrections}</h3>
                        <ul className="space-y-2 text-sm">
                          {feedback.corrections.map((correction, index) => (
                            <li key={index} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                              <p>
                                <span className="text-rose-700 line-through dark:text-rose-300">{correction.original}</span>
                                {' → '}
                                <span className="font-medium text-emerald-700 dark:text-emerald-300">{correction.suggestion}</span>
                              </p>
                              {correction.explanation && (
                                <p className="mt-1 text-gray-600 dark:text-gray-300">{correction.explanation}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.improvedVersion && (
                      <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                        <summary className="cursor-pointer font-medium">{t.improved}</summary>
                        <p className="mt-2 whitespace-pre-line leading-6">{feedback.improvedVersion}</p>
                      </details>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiNote}</p>
                  </div>
                )}

                {(task === 'swt' || task === 'sst') && (
                  <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <summary className="cursor-pointer font-medium">{t.sample}</summary>
                    <p className="mt-2 leading-6">{item.sample}</p>
                  </details>
                )}
                {task === 'sst' && (
                  <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <summary className="cursor-pointer font-medium">{tt.transcript}</summary>
                    <p className="mt-2 leading-6">{item.text}</p>
                  </details>
                )}

                {addedCount > 0 && (
                  <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <PrimaryButton variant="secondary" onClick={() => chooseItem(itemIndex)}>{t.retry}</PrimaryButton>
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
