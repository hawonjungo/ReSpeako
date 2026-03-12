import EmptyState from '../ui/EmptyState';
import StatusBanner from '../ui/StatusBanner';

export default function FeedbackPanel({ feedback }) {
  const {
    status,
    transcript,
    ipa,
    definition,
    message,
  } = feedback;

  return (
    <div className="w-full text-left">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Pronunciation Feedback</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Review the phonetic result and word meaning here.
        </p>
      </div>

      {status === 'idle' && !transcript && (
        <EmptyState
          title="No results yet"
          description="Type a word or start speaking to see pronunciation feedback."
        />
      )}

      {status === 'loading' && (
        <StatusBanner type="info" message={message || 'Checking pronunciation...'} />
      )}

      {status === 'error' && (
        <StatusBanner type="error" message={message} />
      )}

      {status === 'success' && ipa && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/30">
            <p className="text-lg">
              <strong>IPA:</strong> <span className="font-ipa text-xl">{ipa}</span>
            </p>
            {definition && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                <strong>Meaning:</strong> {definition}
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-gray-600 dark:text-gray-300">
            Next step: listen to the word again and repeat it slowly.
          </div>
        </>
      )}
    </div>
  );
}
