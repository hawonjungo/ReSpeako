// Listening tasks: bank, audio, empty answer, scoring and widget. See ../objectiveTasks.js.
import {
  highlightBank,
  listeningBlanksBank,
  missingWordBank,
  summaryChoiceBank,
} from '../../../data/pte/listening';
import { retellLectureBank } from '../../../data/pte/openSpeaking';
import { parseHighlightText, scoreHighlights, scoreTypedBlanks } from '../../../utils/listening';
import { fillPassage, scoreMultipleChoice } from '../../../utils/reading';
import { MultipleChoice } from '../reading/ReadingQuestions';
import { HighlightWords, TypedBlanks } from './ListeningQuestions';

const lectureText = (lectureId) => retellLectureBank.find((lecture) => lecture.id === lectureId)?.text || '';

export const LISTENING_TASKS = {
  hiw: {
    bank: highlightBank,
    audioText: (item) => parseHighlightText(item.text).spokenText,
    initialAnswer: () => [],
    score: (answer, item) => scoreHighlights(answer, parseHighlightText(item.text).wrongIndexes),
    isAnswered: () => true,
    Widget: HighlightWords,
  },
  lfib: {
    bank: listeningBlanksBank,
    audioText: (item) => fillPassage(item.text, item.answers),
    initialAnswer: (item) => Array(item.answers.length).fill(''),
    score: (answer, item) => scoreTypedBlanks(answer, item.answers),
    correctWords: (item) => item.answers,
    isAnswered: (answer) => answer.some((word) => word.trim()),
    Widget: TypedBlanks,
  },
  smw: {
    bank: missingWordBank,
    audioText: (item) => item.text,
    // A beep replaces the missing words, as in the exam.
    beepAfterAudio: true,
    initialAnswer: () => [],
    score: (answer, item) => scoreMultipleChoice(answer, item),
    isAnswered: (answer) => answer.length > 0,
    Widget: MultipleChoice,
  },
  hcs: {
    bank: summaryChoiceBank,
    audioText: (item) => lectureText(item.lectureId),
    initialAnswer: () => [],
    score: (answer, item) => scoreMultipleChoice(answer, item),
    isAnswered: (answer) => answer.length > 0,
    Widget: MultipleChoice,
  },
};
