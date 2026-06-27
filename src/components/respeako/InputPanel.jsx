import StarBorder from '../StarBorder';
import ReadAloudTimer from './ReadAloudTimer';
import { MessageCircleX } from 'lucide-react';

export default function InputPanel({ transcript, inputRef, onTranscriptChange, onClear, showTimer, timeLeft }) {
  console.debug('InputPanel render: showTimer=', showTimer, 'timeLeft=', timeLeft);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Speech to Text</h2>
        <div className="ml-auto flex items-center gap-2">
          {showTimer ? <ReadAloudTimer timeLeft={timeLeft} isActive={showTimer} /> : null}
          {transcript && (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <MessageCircleX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <StarBorder color="cyan" speed="3s">
        <textarea
          ref={inputRef}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          className="w-full min-h-[200px] rounded bg-transparent p-3 px-[26px] py-[16px] text-lg outline-none"
          placeholder="Speak Up with Confidence..."
          onFocus={() => {
            setTimeout(() => {
              inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
          }}
        />
      </StarBorder>
    </div>
  );
}
