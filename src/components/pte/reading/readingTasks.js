// One place describing each reading task: its bank, empty answer, scoring and widget.
import {
  fillBlanksBank,
  multipleChoiceBank,
  reorderBank,
  rwFillBlanksBank,
} from '../../../data/pte/reading';
import { initialReorder, scoreBlanks, scoreMultipleChoice, scoreReorder } from '../../../utils/reading';
import { getBlanksReviewItems } from '../../../utils/practiceRecords';
import { DropdownBlanks, MultipleChoice, ReorderList, WordBankBlanks } from './ReadingQuestions';

export const READING_TASKS = {
  rwfib: {
    bank: rwFillBlanksBank,
    initialAnswer: (item) => Array(item.blanks.length).fill(''),
    score: (answer, item) => scoreBlanks(answer, item.blanks),
    correctWords: (item) => item.blanks.map((blank) => blank.answer),
    isAnswered: (answer) => answer.some(Boolean),
    Widget: DropdownBlanks,
  },
  rfib: {
    bank: fillBlanksBank,
    initialAnswer: (item) => Array(item.answers.length).fill(''),
    score: (answer, item) => scoreBlanks(answer, item.answers.map((word) => ({ answer: word }))),
    correctWords: (item) => item.answers,
    isAnswered: (answer) => answer.some(Boolean),
    Widget: WordBankBlanks,
  },
  rop: {
    bank: reorderBank,
    initialAnswer: initialReorder,
    score: (answer, item) => scoreReorder(answer, item.paragraphs.map((_, index) => index)),
    isAnswered: () => true,
    Widget: ReorderList,
  },
  mc: {
    bank: multipleChoiceBank,
    initialAnswer: () => [],
    score: (answer, item) => scoreMultipleChoice(answer, item),
    isAnswered: (answer) => answer.length > 0,
    Widget: MultipleChoice,
  },
};

// Props for each widget: the answer and marking use different names per widget.
export function getWidgetProps(task, { item, answer, onChange, scored, labels }) {
  switch (task) {
    case 'rop':
      return { item, order: answer, onChange, results: scored?.pairResults, labels };
    case 'mc':
      return { item, selected: answer, onChange, showAnswers: Boolean(scored) };
    default:
      return { item, value: answer, onChange, results: scored?.results, labels };
  }
}

// Missed blanks become word cards; ordering and multiple choice have no word to drill.
export function getReadingReviewItems(task, item, scored) {
  const config = READING_TASKS[task];
  return config.correctWords ? getBlanksReviewItems(task, item, config.correctWords(item), scored) : [];
}
