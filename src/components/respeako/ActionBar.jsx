import { useContext } from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import { Mic, MicOff, SearchCheck, Volume2 } from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';

export default function ActionBar({
  isListening,
  hasText,
  onListen,
  onSpeak,
  onCheckIpa,
}) {
  const { language } = useContext(LanguageContext);
  const t = translations[language].reSpeako.actions;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={onListen}>
          {isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              {t.stop}
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              {t.speak}
            </>
          )}
        </PrimaryButton>

        <PrimaryButton onClick={onSpeak} disabled={!hasText}>
          <Volume2 className="h-5 w-5" />
          {t.play}
        </PrimaryButton>

        <PrimaryButton onClick={onCheckIpa} disabled={!hasText} className="ml-auto">
          <SearchCheck className="h-5 w-5" />
          {t.checkIpa}
        </PrimaryButton>
      </div>

      <StatusBanner
        type="info"
        message={
          isListening
            ? translations[language].reSpeako.status.listening
            : translations[language].reSpeako.status.idle
        }
      />
    </div>
  );
}
