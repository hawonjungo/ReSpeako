import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import { Mic, MicOff, SearchCheck, Volume2 } from 'lucide-react';

export default function ActionBar({
  isListening,
  hasText,
  onListen,
  onSpeak,
  onCheckIpa,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={onListen}>
          {isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              Speak
            </>
          )}
        </PrimaryButton>

        <PrimaryButton onClick={onSpeak} disabled={!hasText}>
          <Volume2 className="h-5 w-5" />
          Play
        </PrimaryButton>

        <PrimaryButton onClick={onCheckIpa} disabled={!hasText} className="ml-auto">
          <SearchCheck className="h-5 w-5" />
          Check IPA
        </PrimaryButton>
      </div>

      <StatusBanner
        type="info"
        message={
          isListening
            ? 'Listening now. Speak clearly to capture your words.'
            : 'Tap the mic and start speaking.'
        }
      />
    </div>
  );
}
