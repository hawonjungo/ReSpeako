import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import { recordAnswer } from '../../utils/practiceRecords';
import playBeep from '../../utils/beep';
import formatMessage from '../../utils/formatMessage';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import { getObjectiveReviewItems, getWidgetProps, OBJECTIVE_TASKS } from './objectiveTasks';

/**
 * Practice page for one auto-marked task (reading or listening): optional
 * audio, answer, check, see marking, move on.
 */
export default function ObjectivePractice({ task }) {
  const { language } = useContext(LanguageContext);
  const config = OBJECTIVE_TASKS[task];
  const t = translations[language][config.section];
  const tt = t.tasks[task];
  const { speak, stop } = useTextToSpeech();

  const [itemIndex, setItemIndex] = useState(0);
  const item = config.bank[itemIndex];
  const [answer, setAnswer] = useState(() => config.initialAnswer(item));
  const [scored, setScored] = useState(null);
  const [addedCount, setAddedCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => () => {
    stop();
  }, [stop]);

  const chooseItem = (nextIndex) => {
    stop();
    setPlaying(false);
    setPlayCount(0);
    setItemIndex(nextIndex);
    setAnswer(config.initialAnswer(config.bank[nextIndex]));
    setScored(null);
    setAddedCount(0);
  };

  const handlePlay = async () => {
    setPlaying(true);
    setPlayCount((count) => count + 1);
    try {
      await speak(config.audioText(item));
      if (config.beepAfterAudio) await playBeep();
    } finally {
      setPlaying(false);
    }
  };

  const handleCheck = () => {
    stop();
    const result = config.score(answer, item);
    setScored(result);
    recordAnswer({
      task,
      itemId: item.id,
      correct: result.correct,
      total: result.total,
      reviewItems: getObjectiveReviewItems(task, item, result),
    })
      .then(setAddedCount)
      .catch((err) => console.warn('Could not save answer.', err));
  };

  const { Widget } = config;
  const instruction = task === 'mc' ? (item.multiple ? t.mcMultiple : t.mcSingle) : tt.instruction;

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
            <p className="text-sm text-gray-600 dark:text-gray-300">{instruction}</p>

            {config.audioText && (
              <div className="flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={handlePlay} disabled={playing}>
                  {playing ? t.playing : playCount > 0 ? t.replay : t.play}
                </PrimaryButton>
                {playCount > 1 && <span className="text-xs text-gray-500 dark:text-gray-400">{t.replayNote}</span>}
              </div>
            )}

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
                {tt.scoringNote && <p className="text-xs text-gray-500 dark:text-gray-400">{tt.scoringNote}</p>}
                {task === 'mc' && item.multiple && <p className="text-xs text-gray-500 dark:text-gray-400">{t.negativeMarking}</p>}
                {task === 'rop' && <p className="text-xs text-gray-500 dark:text-gray-400">{t.pairScoring}</p>}
                {addedCount > 0 && (
                  <StatusBanner type="info" message={formatMessage(t.addedToReview, { count: addedCount })} />
                )}
                {config.audioText && (
                  <details className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <summary className="cursor-pointer font-medium">{t.transcript}</summary>
                    <p className="mt-2 leading-6">{config.audioText(item)}</p>
                  </details>
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
