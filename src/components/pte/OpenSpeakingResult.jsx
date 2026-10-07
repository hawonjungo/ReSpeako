import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import formatMessage from '../../utils/formatMessage';
import PronunciationReport from './PronunciationReport';

function ScoreTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

export default function OpenSpeakingResult({ result, attempt, sample, source, onPlaySample, t }) {
  if (!attempt.transcript.trim()) {
    return <StatusBanner type="warning" message={t.nothingHeard} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ScoreTile label={t.overall} value={`${result.overall}/90`} />
        <ScoreTile label={t.content} value={`${result.content}/90`} />
        <ScoreTile label={t.fluency} value={`${result.fluency}/90`} />
        <ScoreTile label={t.pace} value={formatMessage(t.wpm, { wpm: result.wpm })} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {formatMessage(t.keyIdeasCovered, { correct: result.correct, total: result.total })}
        </p>
        <div className="flex flex-wrap gap-1.5 text-sm">
          {result.matched.map((label) => (
            <span key={label} className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              ✓ {label}
            </span>
          ))}
          {result.missed.map((label) => (
            <span key={label} className="rounded-md border border-dashed border-amber-400 px-2 py-0.5 text-amber-700 dark:text-amber-300">
              {label}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatMessage(t.wordCount, { count: result.wordCount })}
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-black/30">
        <span className="font-semibold">{t.heard}:</span> {attempt.transcript}
      </div>

      {attempt.audioUrl && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{t.yourVoice}:</span>
          <audio controls src={attempt.audioUrl} className="h-10 max-w-full" />
        </div>
      )}

      <details className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
        <summary className="cursor-pointer text-sm font-medium">{t.sampleAnswer}</summary>
        <p className="mt-2 text-sm leading-6">{sample}</p>
        <PrimaryButton variant="secondary" className="mt-2" onClick={onPlaySample}>{t.modelAudio}</PrimaryButton>
      </details>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t.openEstimateNote}</p>

      <PronunciationReport
        key={attempt.audioUrl || 'none'}
        audioBlob={attempt.audioBlob}
        initialResult={attempt.assessment}
        referenceText=""
        source={source}
      />
    </div>
  );
}
