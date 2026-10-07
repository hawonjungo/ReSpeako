import { useEffect, useState } from 'react';
import { getAttempts } from '../utils/reviewStore';
import { computeProgress } from '../utils/progress';
import formatMessage from '../utils/formatMessage';
import SectionCard from './ui/SectionCard';

const TASK_ORDER = ['ra', 'rs', 'di', 'rl', 'rwfib', 'rfib', 'rop', 'mc', 'swt', 'essay', 'wfd', 'looplab', 'wordformation'];

export default function ProgressSummary({ t, language }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAttempts()
      .then((attempts) => {
        if (!cancelled) setProgress(computeProgress(attempts));
      })
      .catch(() => {
        if (!cancelled) setProgress(computeProgress([]));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!progress) return null;

  const maxDayCount = Math.max(1, ...progress.lastSevenDays.map((day) => day.count));
  const goalPercent = Math.min(100, Math.round((progress.todayCount / progress.goal) * 100));
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const tasks = TASK_ORDER.filter((task) => progress.byTask[task]);

  return (
    <SectionCard>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.streak}</p>
            <p className="text-2xl font-semibold">{formatMessage(t.streakDays, { count: progress.streak })}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.todayGoal}</p>
            <p className="text-2xl font-semibold">{progress.todayCount}/{progress.goal}</p>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${goalPercent}%` }} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.lastSevenDays}</p>
          <div className="flex h-24 items-end gap-2">
            {progress.lastSevenDays.map((day) => (
              <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{day.count || ''}</span>
                <div
                  className="w-full rounded-t-md bg-cyan-500/80"
                  style={{ height: `${Math.max(4, (day.count / maxDayCount) * 64)}px`, opacity: day.count ? 1 : 0.25 }}
                  title={`${day.count}`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {day.date.toLocaleDateString(locale, { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {tasks.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t.accuracyByTask}</p>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0">{t.tasks[task]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div className="h-full bg-indigo-500" style={{ width: `${progress.byTask[task].accuracy}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums text-gray-600 dark:text-gray-300">
                    {progress.byTask[task].accuracy}% · {progress.byTask[task].attempts}×
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
