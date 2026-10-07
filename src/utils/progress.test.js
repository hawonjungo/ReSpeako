import { describe, expect, it } from 'vitest';
import { computeProgress } from './progress';

const now = new Date(2026, 9, 7, 15, 0);
const daysAgo = (days, hour = 10) => new Date(2026, 9, 7 - days, hour, 0);

describe('computeProgress', () => {
  it('counts a streak of consecutive days including today', () => {
    const attempts = [0, 1, 2, 4].map((days) => ({ task: 'wfd', correct: 1, total: 2, at: daysAgo(days) }));
    const progress = computeProgress(attempts, now);
    expect(progress.streak).toBe(3);
    expect(progress.todayCount).toBe(1);
  });

  it('keeps yesterday\'s streak alive before practising today', () => {
    const attempts = [1, 2].map((days) => ({ task: 'wfd', correct: 1, total: 1, at: daysAgo(days) }));
    expect(computeProgress(attempts, now).streak).toBe(2);
  });

  it('aggregates accuracy per task for the last 7 days only', () => {
    const attempts = [
      { task: 'wfd', correct: 8, total: 10, at: daysAgo(0) },
      { task: 'wfd', correct: 6, total: 10, at: daysAgo(3) },
      { task: 'wfd', correct: 0, total: 10, at: daysAgo(10) },
      { task: 'rs', correct: 5, total: 5, at: daysAgo(1) },
    ];
    const { byTask, lastSevenDays } = computeProgress(attempts, now);
    expect(byTask.wfd).toMatchObject({ attempts: 2, accuracy: 70 });
    expect(byTask.rs.accuracy).toBe(100);
    expect(lastSevenDays).toHaveLength(7);
    expect(lastSevenDays[6].count).toBe(1);
  });
});
