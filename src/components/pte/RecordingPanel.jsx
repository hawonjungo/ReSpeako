import PrimaryButton from '../ui/PrimaryButton';
import formatMessage from '../../utils/formatMessage';

// Live mic status for a timed speaking answer.
export default function RecordingPanel({ attempt, maxSeconds, t }) {
  const secondsLeft = Math.max(0, Math.ceil(maxSeconds - attempt.elapsed));
  const isRecording = attempt.phase === 'recording';

  return (
    <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/30" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-medium text-rose-700 dark:text-rose-300">
          <span className={`h-2.5 w-2.5 rounded-full bg-rose-500 ${isRecording ? 'animate-pulse' : ''}`} />
          {isRecording ? t.recording : t.processing}
        </p>
        <span className="text-sm font-semibold tabular-nums">
          {formatMessage(t.timeLeft, { seconds: secondsLeft })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950">
        <div
          className="h-full bg-rose-500 transition-all"
          style={{ width: `${(attempt.elapsed / maxSeconds) * 100}%` }}
        />
      </div>
      {attempt.transcript && (
        <p className="text-sm text-gray-700 dark:text-gray-200">{attempt.transcript}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t.autoStopHint}</p>
        <PrimaryButton variant="secondary" onClick={attempt.stop} disabled={!isRecording}>
          {t.stopNow}
        </PrimaryButton>
      </div>
    </div>
  );
}
