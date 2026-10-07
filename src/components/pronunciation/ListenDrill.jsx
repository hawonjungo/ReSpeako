import { useEffect, useState } from 'react';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import formatMessage from '../../utils/formatMessage';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';

const ROUNDS = 10;
const PASS_PERCENT = 80;

function makeRound(pairs) {
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const target = pair[Math.random() < 0.5 ? 0 : 1];
  return { pair, target };
}

/**
 * Step 1, perception: hear one word of a minimal pair and pick which it was.
 * If the ear cannot tell the sounds apart, the mouth will not either.
 */
export default function ListenDrill({ pairs, t }) {
  const { speak, stop } = useTextToSpeech();
  const [round, setRound] = useState(() => makeRound(pairs));
  const [roundIndex, setRoundIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => () => {
    stop();
  }, [stop]);

  const finished = roundIndex >= ROUNDS;
  const percent = Math.round((correctCount / ROUNDS) * 100);

  const play = () => speak(round.target, { rate: 0.85 }).catch(() => undefined);

  const handleChoice = (word) => {
    if (choice) return;
    setChoice(word);
    if (word === round.target) setCorrectCount((count) => count + 1);
  };

  const handleNext = () => {
    setRound(makeRound(pairs));
    setChoice('');
    setRoundIndex((index) => index + 1);
  };

  const restart = () => {
    setRound(makeRound(pairs));
    setChoice('');
    setRoundIndex(0);
    setCorrectCount(0);
  };

  if (finished) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-3xl font-semibold">{percent}%</p>
        <StatusBanner
          type={percent >= PASS_PERCENT ? 'success' : 'info'}
          message={percent >= PASS_PERCENT ? t.listenPassed : t.listenMore}
        />
        <PrimaryButton onClick={restart}>{t.again}</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">{t.listenInstruction}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatMessage(t.round, { current: roundIndex + 1, total: ROUNDS })} · ✓ {correctCount}
        </span>
        <PrimaryButton onClick={play}>{t.playWord}</PrimaryButton>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {round.pair.map((word) => {
          let tone = 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800';
          if (choice && word === round.target) tone = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40';
          else if (choice === word) tone = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40';
          return (
            <button
              key={word}
              type="button"
              onClick={() => handleChoice(word)}
              disabled={Boolean(choice)}
              className={`rounded-xl border-2 px-4 py-6 text-2xl font-semibold transition ${tone}`}
            >
              {word}
            </button>
          );
        })}
      </div>
      {choice && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">{choice === round.target ? `✓ ${t.correct}` : formatMessage(t.itWas, { word: round.target })}</span>
          <div className="flex gap-2">
            <PrimaryButton variant="secondary" onClick={() => speak(round.pair[0], { rate: 0.85 }).then(() => speak(round.pair[1], { rate: 0.85 }))}>
              {t.compare}
            </PrimaryButton>
            <PrimaryButton onClick={handleNext}>{t.next}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
