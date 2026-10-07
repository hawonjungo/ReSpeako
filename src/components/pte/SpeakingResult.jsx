import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import formatMessage from '../../utils/formatMessage';
import WordDiff, { WordDiffLegend } from './WordDiff';

function ScoreTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

export default function SpeakingResult({ result, transcript, audioUrl, onPlayModel, showBand, t }) {
  if (!transcript.trim()) {
    return <StatusBanner type="warning" message={t.nothingHeard} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ScoreTile label={t.overall} value={`${result.overall}/90`} />
        <ScoreTile
          label={t.content}
          value={`${result.content}/90`}
          hint={showBand ? formatMessage(t.band, { band: result.contentBand }) : `${result.correct}/${result.total}`}
        />
        <ScoreTile label={t.fluency} value={`${result.fluency}/90`} />
        <ScoreTile label={t.pace} value={formatMessage(t.wpm, { wpm: result.wpm })} />
      </div>

      <WordDiff parts={result.parts} />
      <WordDiffLegend labels={t.legend} />

      <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-black/30">
        <span className="font-semibold">{t.heard}:</span> {transcript}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <PrimaryButton variant="secondary" onClick={onPlayModel}>{t.modelAudio}</PrimaryButton>
        {audioUrl && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{t.yourVoice}:</span>
            <audio controls src={audioUrl} className="h-10 max-w-full" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t.estimateNote}</p>
    </div>
  );
}
