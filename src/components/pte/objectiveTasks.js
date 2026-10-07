// Registry of auto-marked tasks (reading and listening) shared by the practice
// page and the mock test.
import { READING_TASKS } from './reading/readingTasks';
import { LISTENING_TASKS } from './listening/listeningTasks';
import { getBlanksReviewItems } from '../../utils/practiceRecords';

export const OBJECTIVE_TASKS = {
  ...Object.fromEntries(Object.entries(READING_TASKS).map(([task, config]) => [task, { ...config, section: 'reading' }])),
  ...Object.fromEntries(Object.entries(LISTENING_TASKS).map(([task, config]) => [task, { ...config, section: 'listening' }])),
};

const CHOICE_TASKS = new Set(['mc', 'smw', 'hcs']);

// Props for each widget: the answer and marking use different names per widget.
export function getWidgetProps(task, { item, answer, onChange, scored, labels }) {
  if (task === 'rop') return { item, order: answer, onChange, results: scored?.pairResults, labels };
  if (CHOICE_TASKS.has(task)) return { item, selected: answer, onChange, showAnswers: Boolean(scored) };
  if (task === 'hiw') return { item, value: answer, onChange, results: scored ? true : null };
  return { item, value: answer, onChange, results: scored?.results, labels };
}

// Missed blanks become word cards; other tasks have no single word to drill.
export function getObjectiveReviewItems(task, item, scored) {
  const config = OBJECTIVE_TASKS[task];
  return config.correctWords ? getBlanksReviewItems(task, item, config.correctWords(item), scored) : [];
}
