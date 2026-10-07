import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { translations } from '../../../i18n/translations';
import { recordAnswer } from '../../../utils/practiceRecords';
import formatMessage from '../../../utils/formatMessage';
import PageContainer from '../../ui/PageContainer';
import SectionCard from '../../ui/SectionCard';
import PrimaryButton from '../../ui/PrimaryButton';
import StatusBanner from '../../ui/StatusBanner';
import { getReadingReviewItems, getWidgetProps, READING_TASKS } from './readingTasks';

/** Practice page for one reading task type: answer, check, see marking, move on. */
export default function ReadingPractice({ task }) {
  const { language } = useContext(LanguageContext);
  const t = translations[language].reading;
  const tt = t.tasks[task];
  const config = READING_TASKS[task];

  const [itemIndex, setItemIndex] = useState(0);
  const item = config.bank[itemIndex];
  const [answer, setAnswer] = useState(() => config.initialAnswer(item));
  const [scored, setScored] = useState(null);
  const [addedCount, setAddedCount] = useState(0);

  const chooseItem = (nextIndex) => {
    setItemIndex(nextIndex);
    setAnswer(config.initialAnswer(config.bank[nextIndex]));
    setScored(null);
    setAddedCount(0);
  };

  const handleCheck = () => {
    const result = config.score(answer, item);
    setScored(result);
    recordAnswer({
      task,
      itemId: item.id,
      correct: result.correct,
      total: result.total,
      reviewItems: getReadingReviewItems(task, item, result),
    })
      .then(setAddedCount)
      .catch((err) => console.warn('Could not save reading result.', err));
  };

  const { Widget } = config;

  return (
    <PageContainer title={tt.title} description={tt.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        <SectionCard>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{t.choose}</span>
            <select
              value={itemIndex}
              onChange={(event) => chooseItem(Number(event.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
            >
              {config.bank.map((entry, index) => (
                <option key={entry.id} value={index}>{index + 1}. {entry.title}</option>
              ))}
            </select>
          </label>
        </SectionCard>

        <SectionCard>
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {task === 'mc' ? (item.multiple ? t.mcMultiple : t.mcSingle) : tt.instruction}
            </p>

            <Widget
              key={item.id}
              {...getWidgetProps(task, { item, answer, onChange: setAnswer, scored, labels: t.labels })}
            />

            {scored && (
              <div className="space-y-2">
                <StatusBanner
                  type={scored.correct === scored.total ? 'success' : 'info'}
                  message={formatMessage(t.score, { correct: scored.correct, total: scored.total })}
                />
                {task === 'mc' && item.multiple && <p className="text-xs text-gray-500 dark:text-gray-400">{t.negativeMarking}</p>}
                {task === 'rop' && <p className="text-xs text-gray-500 dark:text-gray-400">{t.pairScoring}</p>}
                {addedCount > 0 && (
                  <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {scored ? (
                <>
                  <Link to="/review"><PrimaryButton variant="ghost">{t.goReview}</PrimaryButton></Link>
                  <PrimaryButton variant="secondary" onClick={() => chooseItem(itemIndex)}>{t.retry}</PrimaryButton>
                  <PrimaryButton onClick={() => chooseItem((itemIndex + 1) % config.bank.length)}>{t.next}</PrimaryButton>
                </>
              ) : (
                <PrimaryButton onClick={handleCheck} disabled={!config.isAnswered(answer)}>{t.check}</PrimaryButton>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
