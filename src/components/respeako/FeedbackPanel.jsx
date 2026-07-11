import { useContext } from 'react';
import EmptyState from '../ui/EmptyState';
import StatusBanner from '../ui/StatusBanner';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';

export default function FeedbackPanel({ feedback }) {
  const { language } = useContext(LanguageContext);
  const t = translations[language].reSpeako;
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
        <h2 className="text-lg font-semibold">{t.headings.pronunciationFeedback}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t.headings.feedbackDescription}
        </p>
      </div>

      {status === 'idle' && !transcript && (
        <EmptyState
          title={t.status.noResultsTitle}
          description={t.status.noResultsDescription}
        />
      )}

      {status === 'loading' && (
        <StatusBanner type="info" message={message || t.status.loading} />
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
                <strong>{language === 'vi' ? 'Nghĩa:' : 'Meaning:'}</strong> {definition}
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-gray-600 dark:text-gray-300">
            {t.status.nextStep}
          </div>
        </>
      )}
    </div>
  );
}
