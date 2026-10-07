import { useEffect, useRef, useState } from 'react';
import useTextToSpeech from '../../../hooks/useTextToSpeech';
import { recordAnswer } from '../../../utils/practiceRecords';
import playBeep from '../../../utils/beep';
import PrimaryButton from '../../ui/PrimaryButton';
import StatusBanner from '../../ui/StatusBanner';
import { getObjectiveReviewItems, getWidgetProps, OBJECTIVE_TASKS } from '../objectiveTasks';

/**
 * One reading or listening question in the mock test. Listening audio plays
 * once automatically; the answer is marked silently on Next.
 */
export default function ObjectiveItemRunner({ type, item, onComplete, tm, labels }) {
  const config = OBJECTIVE_TASKS[type];
  const { speak } = useTextToSpeech();
  const [answer, setAnswer] = useState(() => config.initialAnswer(item));
  const [playing, setPlaying] = useState(Boolean(config.audioText));
  const startedRef = useRef(false);
  const { Widget } = config;

  // Play once on mount (the ref guards against StrictMode's double effect run).
  useEffect(() => {
    if (!config.audioText || startedRef.current) return;
    startedRef.current = true;
    const run = async () => {
      try {
        await speak(config.audioText(item));
        if (config.beepAfterAudio) await playBeep();
      } finally {
        setPlaying(false);
      }
    };
    run();
  }, [config, item, speak]);

  const handleNext = () => {
    const scored = config.score(answer, item);
    recordAnswer({
      task: type,
      itemId: item.id,
      correct: scored.correct,
      total: scored.total,
      reviewItems: getObjectiveReviewItems(type, item, scored),
    }).catch((err) => console.warn('Could not save mock answer.', err));
    onComplete({ type, itemId: item.id, correct: scored.correct, total: scored.total });
  };

  const instruction = type === 'mc' ? tm.instructions[item.multiple ? 'mcMultiple' : 'mcSingle'] : tm.instructions[type];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">{instruction}</p>
      {playing && <StatusBanner type="info" message={tm.audioPlaying} />}
      <Widget {...getWidgetProps(type, { item, answer, onChange: setAnswer, scored: null, labels })} />
      <div className="flex justify-end">
        <PrimaryButton onClick={handleNext} disabled={playing}>{tm.next}</PrimaryButton>
      </div>
    </div>
  );
}
