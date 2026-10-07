import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import {
  assessPronunciation,
  describeWeakSounds,
  getIpaPageSymbol,
  getWeakWords,
  isPronunciationConfigured,
  PronunciationError,
} from '../../utils/pronunciation';
import { addReviewItems } from '../../utils/reviewStore';
import formatMessage from '../../utils/formatMessage';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';

function accuracyClass(accuracy) {
  if (accuracy >= 80) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
  if (accuracy >= 60) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200';
  return 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200';
}

function wordClass(word) {
  if (word.errorType === 'Omission') return 'border border-dashed border-gray-400 text-gray-500';
  if (word.errorType === 'Insertion') return 'text-gray-400 line-through';
  return accuracyClass(word.accuracy);
}

function ScoreTile({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold">{value}/100</p>
    </div>
  );
}

// `initialResult` is passed when the attempt was already scored by Azure (Azure engine).
export default function PronunciationReport({ audioBlob, referenceText, source, initialResult = null }) {
  const { language } = useContext(LanguageContext);
  const t = translations[language].pronunciation;
  const { speak } = useTextToSpeech();

  const [status, setStatus] = useState(initialResult ? 'done' : 'idle'); // idle | loading | done | error
  const [data, setData] = useState(initialResult);
  const [errorCode, setErrorCode] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const savedRef = useRef(false);

  const saveWeakWords = async (report) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const weakWords = getWeakWords(report);
    const added = await addReviewItems(weakWords.map((word) => ({
      kind: 'pronunciation',
      text: word.word,
      source,
      note: describeWeakSounds(word),
    })));
    setAddedCount(added);
  };

  useEffect(() => {
    if (initialResult) {
      saveWeakWords(initialResult.report).catch((err) => console.warn('Could not save weak words.', err));
    }
    // Runs once per report; the component is keyed by recording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isPronunciationConfigured()) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t.notConfigured}{' '}
        <Link to="/settings" className="font-medium text-cyan-700 underline dark:text-cyan-300">{t.openSettings}</Link>
      </p>
    );
  }

  if (!audioBlob) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t.needsRecording}</p>;
  }

  const handleAssess = async () => {
    setStatus('loading');
    setErrorCode('');
    try {
      const result = await assessPronunciation({ blob: audioBlob, referenceText });
      if (result.report.status !== 'Success') {
        setErrorCode('no_speech');
        setStatus('error');
        return;
      }
      setData(result);
      setStatus('done');
      await saveWeakWords(result.report);
    } catch (error) {
      setErrorCode(error instanceof PronunciationError ? error.code : 'decode_failed');
      setStatus('error');
    }
  };

  if (status !== 'done') {
    return (
      <div className="space-y-2">
        <PrimaryButton onClick={handleAssess} disabled={status === 'loading'}>
          {status === 'loading' ? t.assessing : t.assess}
        </PrimaryButton>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t.quotaHint}</p>
        {status === 'error' && <StatusBanner type="error" message={t.errors[errorCode] || t.errors.default} />}
      </div>
    );
  }

  const { report, usage, truncated } = data;
  const selected = selectedIndex === null ? null : report.words[selectedIndex];

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-200 p-4 dark:border-indigo-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{t.title}</h3>
        {usage && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessage(t.usage, {
              used: Math.round(usage.usedSeconds / 60),
              limit: Math.round(usage.limitSeconds / 60),
            })}
          </span>
        )}
      </div>

      {truncated && <StatusBanner type="warning" message={t.truncated} />}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <ScoreTile label={t.scores.pronunciation} value={report.pronunciation} />
        <ScoreTile label={t.scores.accuracy} value={report.accuracy} />
        <ScoreTile label={t.scores.fluency} value={report.fluency} />
        <ScoreTile label={t.scores.completeness} value={report.completeness} />
        <ScoreTile label={t.scores.prosody} value={report.prosody} />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t.tapWord}</p>
        <div className="flex flex-wrap gap-1.5">
          {report.words.map((word, index) => (
            <button
              key={`${word.word}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index === selectedIndex ? null : index)}
              className={`rounded-md px-1.5 py-0.5 text-base ${wordClass(word)} ${
                index === selectedIndex ? 'ring-2 ring-indigo-500' : ''
              }`}
              aria-pressed={index === selectedIndex}
            >
              {word.word}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t.legend}</p>
      </div>

      {selected && (
        <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-black/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {selected.word}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {t.errorTypes[selected.errorType] || selected.errorType} · {selected.accuracy}/100
              </span>
            </p>
            <PrimaryButton variant="secondary" onClick={() => speak(selected.word, { rate: 0.8 })}>
              {t.hearWord}
            </PrimaryButton>
          </div>
          {selected.phonemes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.phonemes.map((phoneme, index) => {
                const symbol = getIpaPageSymbol(phoneme.phoneme);
                const chip = (
                  <span className={`inline-flex flex-col items-center rounded-lg px-2 py-1 ${accuracyClass(phoneme.accuracy)}`}>
                    <span className="font-ipa text-lg">/{phoneme.phoneme}/</span>
                    <span className="text-xs">{phoneme.accuracy}</span>
                  </span>
                );
                return symbol && phoneme.accuracy < 80 ? (
                  <Link
                    key={index}
                    to={`/ipa-pronounce?symbol=${encodeURIComponent(symbol)}`}
                    title={t.practiseSound}
                    className="underline-offset-2 hover:opacity-80"
                  >
                    {chip}
                  </Link>
                ) : (
                  <span key={index}>{chip}</span>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t.phonemeHint}</p>
        </div>
      )}

      {addedCount > 0 && (
        <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
      )}
    </div>
  );
}
