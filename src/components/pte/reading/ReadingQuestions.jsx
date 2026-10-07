// Reusable PTE reading question widgets, shared by practice pages and the mock test.
// Each is controlled: the parent owns the answer and passes `results` to show marking.
import { useState } from 'react';
import { splitPassage, stableShuffle } from '../../../utils/reading';

const blankBase = 'mx-1 inline-flex min-w-[6rem] items-center justify-center rounded-lg border px-2 py-0.5 align-baseline text-base';
const resultClass = (ok) => (ok
  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
  : 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200');

export function DropdownBlanks({ item, value, onChange, results, labels }) {
  return (
    <p className="text-lg leading-10">
      {splitPassage(item.text).map((part, index) => {
        if (part.text !== undefined) return <span key={index}>{part.text}</span>;
        const blank = item.blanks[part.blank];
        const shown = results ? resultClass(results[part.blank]) : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900';
        return (
          <span key={index} className="inline-flex flex-col">
            <select
              value={value[part.blank] || ''}
              disabled={Boolean(results)}
              onChange={(event) => {
                const next = [...value];
                next[part.blank] = event.target.value;
                onChange(next);
              }}
              aria-label={`${labels.blank} ${part.blank + 1}`}
              className={`${blankBase} ${shown}`}
            >
              <option value="">—</option>
              {blank.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {results && !results[part.blank] && (
              <span className="mx-1 text-xs text-emerald-700 dark:text-emerald-300">{blank.answer}</span>
            )}
          </span>
        );
      })}
    </p>
  );
}

export function WordBankBlanks({ item, value, onChange, results, labels }) {
  const [selectedWord, setSelectedWord] = useState('');
  const bank = stableShuffle([...item.answers, ...item.distractors], item.id);
  const used = new Set(value.filter(Boolean));

  const placeInBlank = (blankIndex) => {
    if (results) return;
    const next = [...value];
    if (selectedWord) {
      next[blankIndex] = selectedWord;
      setSelectedWord('');
    } else {
      next[blankIndex] = '';
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg leading-10">
        {splitPassage(item.text).map((part, index) => {
          if (part.text !== undefined) return <span key={index}>{part.text}</span>;
          const filled = value[part.blank];
          const shown = results
            ? resultClass(results[part.blank])
            : `border-dashed ${selectedWord ? 'border-cyan-500' : 'border-gray-400'}`;
          return (
            <span key={index} className="inline-flex flex-col">
              <button
                type="button"
                onClick={() => placeInBlank(part.blank)}
                disabled={Boolean(results)}
                aria-label={`${labels.blank} ${part.blank + 1}: ${filled || labels.empty}`}
                className={`${blankBase} ${shown}`}
              >
                {filled || ' '}
              </button>
              {results && !results[part.blank] && (
                <span className="mx-1 text-xs text-emerald-700 dark:text-emerald-300">{item.answers[part.blank]}</span>
              )}
            </span>
          );
        })}
      </p>
      {!results && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">{labels.wordBankHint}</p>
          <div className="flex flex-wrap gap-2">
            {bank.map((word) => (
              <button
                key={word}
                type="button"
                disabled={used.has(word)}
                onClick={() => setSelectedWord(word === selectedWord ? '' : word)}
                aria-pressed={word === selectedWord}
                className={`rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-30 ${
                  word === selectedWord
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReorderList({ item, order, onChange, results, labels }) {
  const move = (position, delta) => {
    const target = position + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[position], next[target]] = [next[target], next[position]];
    onChange(next);
  };

  return (
    <ol className="space-y-2">
      {order.map((paragraphIndex, position) => (
        <li key={paragraphIndex} className="space-y-1">
          <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold dark:bg-gray-800">
              {String.fromCharCode(65 + paragraphIndex)}
            </span>
            <p className="flex-1 text-sm leading-6">{item.paragraphs[paragraphIndex]}</p>
            {!results && (
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(position, -1)}
                  disabled={position === 0}
                  aria-label={labels.moveUp}
                  className="rounded-md border border-gray-300 px-2 text-sm disabled:opacity-30 dark:border-gray-700"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(position, 1)}
                  disabled={position === order.length - 1}
                  aria-label={labels.moveDown}
                  className="rounded-md border border-gray-300 px-2 text-sm disabled:opacity-30 dark:border-gray-700"
                >
                  ↓
                </button>
              </div>
            )}
          </div>
          {results && position < order.length - 1 && (
            <p className={`pl-8 text-xs ${results[position] ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {results[position] ? `✓ ${labels.pairCorrect}` : `✗ ${labels.pairWrong}`}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function MultipleChoice({ item, selected, onChange, showAnswers }) {
  const toggle = (optionId) => {
    if (showAnswers) return;
    if (!item.multiple) {
      onChange([optionId]);
      return;
    }
    onChange(selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId]);
  };

  return (
    <div className="space-y-4">
      <p className="leading-7">{item.passage}</p>
      <p className="font-medium">{item.question}</p>
      <div className="space-y-2">
        {item.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isAnswer = item.answers.includes(option.id);
          let tone = 'border-gray-200 dark:border-gray-800';
          if (showAnswers && isAnswer) tone = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40';
          else if (showAnswers && isSelected) tone = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40';
          else if (isSelected) tone = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40';
          return (
            <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${tone}`}>
              <input
                type={item.multiple ? 'checkbox' : 'radio'}
                name={item.id}
                checked={isSelected}
                disabled={showAnswers}
                onChange={() => toggle(option.id)}
                className="mt-1"
              />
              <span><span className="font-semibold">{option.id}.</span> {option.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
