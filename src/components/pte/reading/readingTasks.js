// Reading tasks: bank, empty answer, scoring and widget. See ../objectiveTasks.js.
import {
  fillBlanksBank,
  multipleChoiceBank,
  reorderBank,
  rwFillBlanksBank,
} from '../../../data/pte/reading';
import { initialReorder, scoreBlanks, scoreMultipleChoice, scoreReorder } from '../../../utils/reading';
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
