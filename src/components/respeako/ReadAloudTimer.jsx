export default function ReadAloudTimer({ timeLeft, isActive }) {
  const isLowTime = isActive && timeLeft <= 10;
  console.debug('ReadAloudTimer render: isActive=', isActive, 'timeLeft=', timeLeft);

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
        isLowTime
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
          : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200'
      }`}
    >
      {isActive ? `${timeLeft}s` : 'Ready'}
    </div>
  );
}
