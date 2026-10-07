// Progress stats derived from logged practice attempts.

export const DAILY_GOAL = 20;

function toDayKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}`;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

// Calendar arithmetic, so daylight-saving changes never skip a day.
function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * @param {{ task: string, correct: number, total: number, at: Date }[]} attempts
 */
export function computeProgress(attempts, now = new Date()) {
  const countsByDay = new Map();
  attempts.forEach((attempt) => {
    const key = toDayKey(attempt.at);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  });

  const today = startOfDay(now);
  const todayCount = countsByDay.get(toDayKey(today)) || 0;

  // A streak survives until the end of today, so start from yesterday if today is empty.
  let streak = 0;
  let cursor = todayCount > 0 ? today : addDays(today, -1);
  while (countsByDay.has(toDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const lastSevenDays = Array.from({ length: 7 }, (_, offset) => {
    const day = addDays(today, offset - 6);
    return { date: day, count: countsByDay.get(toDayKey(day)) || 0 };
  });

  const weekStart = addDays(today, -6).getTime();
  const byTask = {};
  attempts
    .filter((attempt) => new Date(attempt.at).getTime() >= weekStart)
    .forEach((attempt) => {
      const stats = byTask[attempt.task] || { attempts: 0, correct: 0, total: 0 };
      stats.attempts += 1;
      stats.correct += attempt.correct;
      stats.total += attempt.total;
      byTask[attempt.task] = stats;
    });

  Object.values(byTask).forEach((stats) => {
    stats.accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  });

  return { todayCount, streak, lastSevenDays, byTask, goal: DAILY_GOAL };
}
