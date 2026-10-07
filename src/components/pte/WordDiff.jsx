const statusStyles = {
  correct: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  wrong: 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
  missing: 'border border-dashed border-amber-400 text-amber-700 dark:text-amber-300',
  extra: 'text-gray-400 line-through dark:text-gray-500',
};

export function WordDiffLegend({ labels }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {['correct', 'wrong', 'missing', 'extra'].map((status) => (
        <span key={status} className={`rounded-md px-2 py-0.5 ${statusStyles[status]}`}>
          {labels[status]}
        </span>
      ))}
    </div>
  );
}

// Renders alignWords() output: misspelled words show what was typed and the fix.
export default function WordDiff({ parts }) {
  return (
    <p className="flex flex-wrap gap-1.5 text-base leading-8">
      {parts.map((part, index) => (
        <span key={index} className={`rounded-md px-1.5 ${statusStyles[part.status]}`}>
          {part.status === 'wrong' && (
            <>
              <span className="line-through opacity-70">{part.typed}</span>{' '}
              <span className="font-semibold">{part.word}</span>
            </>
          )}
          {part.status === 'extra' && part.typed}
          {(part.status === 'correct' || part.status === 'missing') && part.word}
        </span>
      ))}
    </p>
  );
}
