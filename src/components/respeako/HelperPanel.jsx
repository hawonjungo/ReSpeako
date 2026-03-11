import StatusBanner from '../ui/StatusBanner';

export default function HelperPanel({
  isListening,
  hasText,
  transcript,
  ipa,
  definition,
  errorMessage,
}) {
  const hasFeedback = Boolean(ipa || definition);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Practice Guide</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Use this side panel as lightweight guidance while keeping the speaking flow on the left.
        </p>
      </div>

      <StatusBanner
        type={isListening ? 'success' : 'info'}
        message={
          isListening
            ? 'Microphone is active. Finish speaking, then review the captured text.'
            : 'Start with the mic or type directly into the input box.'
        }
      />

      <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
        <p className="font-medium">Suggested flow</p>
        <p className="mt-2">1. Capture or type a word or phrase.</p>
        <p className="mt-1">2. Play it back to hear the pronunciation.</p>
        <p className="mt-1">3. Check IPA to compare sound and meaning.</p>
      </div>

      <div className="rounded-2xl bg-gray-100 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {!hasText && 'No text yet. This panel will become more useful after you capture your first word.'}
        {hasText && !hasFeedback && !errorMessage && 'You already have input text. The next useful step is checking IPA or replaying audio.'}
        {hasFeedback && `Feedback is ready for "${transcript}". Review the IPA and meaning, then compare it with your pronunciation.`}
        {errorMessage && 'IPA lookup did not return a usable result yet. Try a single word and run the check again.'}
      </div>
    </div>
  );
}
