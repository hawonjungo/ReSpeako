import { useEffect, useRef, useState } from 'react';
import useTextToSpeech from '../../../hooks/useTextToSpeech';
import { scoreDictation } from '../../../utils/scoring';
import { getDictationReviewItems, recordAnswer } from '../../../utils/practiceRecords';
import PrimaryButton from '../../ui/PrimaryButton';
import StatusBanner from '../../ui/StatusBanner';

/** One Write from Dictation question: audio plays once, type, then Next. */
export default function DictationItemRunner({ item, onComplete, tm }) {
  const { speak } = useTextToSpeech();
  const [answer, setAnswer] = useState('');
  const [playing, setPlaying] = useState(true);
  const startedRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    speak(item.text)
      .catch(() => undefined)
      .finally(() => {
        setPlaying(false);
        inputRef.current?.focus();
      });
  }, [item.text, speak]);

  const handleSubmit = () => {
    const scored = scoreDictation(item.text, answer);
    recordAnswer({
      task: 'wfd',
      itemId: item.id,
      correct: scored.correct,
      total: scored.total,
      reviewItems: getDictationReviewItems(item, scored),
    }).catch((err) => console.warn('Could not save mock answer.', err));
    onComplete({ type: 'wfd', itemId: item.id, correct: scored.correct, total: scored.total });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">{tm.instructions.wfd}</p>
      {playing && <StatusBanner type="info" message={tm.audioPlaying} />}
      <textarea
        ref={inputRef}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        rows={3}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        aria-label={tm.typeHere}
        placeholder={tm.typeHere}
        className="w-full rounded-xl border border-gray-300 bg-white p-3 text-base outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950"
      />
      <div className="flex justify-end">
        <PrimaryButton onClick={handleSubmit} disabled={playing}>{tm.next}</PrimaryButton>
      </div>
    </div>
  );
}
