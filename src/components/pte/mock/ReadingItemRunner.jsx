import { useState } from 'react';
import { recordAnswer } from '../../../utils/practiceRecords';
import PrimaryButton from '../../ui/PrimaryButton';
import { getReadingReviewItems, getWidgetProps, READING_TASKS } from '../reading/readingTasks';

/** One reading question in the mock test: answer, then Next (no marking shown). */
export default function ReadingItemRunner({ type, item, onComplete, tm, labels }) {
  const config = READING_TASKS[type];
  const [answer, setAnswer] = useState(() => config.initialAnswer(item));
  const { Widget } = config;

  const handleNext = () => {
    const scored = config.score(answer, item);
    recordAnswer({
      task: type,
      itemId: item.id,
      correct: scored.correct,
      total: scored.total,
      reviewItems: getReadingReviewItems(type, item, scored),
    }).catch((err) => console.warn('Could not save mock answer.', err));
    onComplete({ type, itemId: item.id, correct: scored.correct, total: scored.total });
  };

  const instruction = type === 'mc' ? tm.instructions[item.multiple ? 'mcMultiple' : 'mcSingle'] : tm.instructions[type];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">{instruction}</p>
      <Widget {...getWidgetProps(type, { item, answer, onChange: setAnswer, scored: null, labels })} />
      <div className="flex justify-end">
        <PrimaryButton onClick={handleNext}>{tm.next}</PrimaryButton>
      </div>
    </div>
  );
}
