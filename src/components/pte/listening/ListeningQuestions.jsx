// PTE listening question widgets, controlled like the reading widgets.
import { parseHighlightText } from '../../../utils/listening';
import { splitPassage } from '../../../utils/reading';

/** Highlight Incorrect Words: tap the words that differ from the audio. */
export function HighlightWords({ item, value, onChange, results }) {
  const { tokens, wrongIndexes } = parseHighlightText(item.text);
  const wrongSet = new Set(wrongIndexes);

  const toggle = (index) => {
    if (results) return;
    onChange(value.includes(index) ? value.filter((entry) => entry !== index) : [...value, index]);
  };

  return (
    <p className="flex flex-wrap gap-x-1 gap-y-2 text-lg leading-8">
      {tokens.map((token, index) => {
        const selected = value.includes(index);
        let tone = selected ? 'bg-amber-200 dark:bg-amber-700/60' : 'hover:bg-gray-100 dark:hover:bg-gray-800';
        if (results) {
          if (wrongSet.has(index)) tone = selected ? 'bg-emerald-200 dark:bg-emerald-800/70' : 'bg-rose-200 dark:bg-rose-800/60';
          else tone = selected ? 'bg-gray-300 line-through dark:bg-gray-700' : '';
        }
        return (
          <button
            key={index}
            type="button"
            onClick={() => toggle(index)}
            disabled={Boolean(results)}
            aria-pressed={selected}
            className={`rounded px-0.5 ${tone}`}
          >
            {token}
          </button>
        );
      })}
    </p>
  );
}

/** Listening Fill in the Blanks: type each missing word. */
export function TypedBlanks({ item, value, onChange, results, labels }) {
  return (
    <p className="text-lg leading-10">
      {splitPassage(item.text).map((part, index) => {
        if (part.text !== undefined) return <span key={index}>{part.text}</span>;
        const tone = results
          ? (results[part.blank]
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
            : 'border-rose-400 bg-rose-50 dark:bg-rose-950/40')
          : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900';
        return (
          <span key={index} className="inline-flex flex-col">
            <input
              type="text"
              value={value[part.blank] || ''}
              readOnly={Boolean(results)}
              onChange={(event) => {
                const next = [...value];
                next[part.blank] = event.target.value;
                onChange(next);
              }}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              aria-label={`${labels.blank} ${part.blank + 1}`}
              className={`mx-1 w-32 rounded-lg border px-2 py-0.5 text-base ${tone}`}
            />
            {results && !results[part.blank] && (
              <span className="mx-1 text-xs text-emerald-700 dark:text-emerald-300">{item.answers[part.blank]}</span>
            )}
          </span>
        );
      })}
    </p>
  );
}
