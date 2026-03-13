import shuffleArray from './shuffleArray';

export default function getQuizQuestions({
  bank,
  topic,
  difficulty,
  count = 5,
  excludeIds = [],
}) {
  const activeQuestions = bank.filter((question) => question.isActive);
  const topicFiltered =
    topic && topic !== 'mixed_review'
      ? activeQuestions.filter((question) => question.topic === topic)
      : activeQuestions;

  const difficultyFiltered = difficulty
    ? topicFiltered.filter((question) => question.difficulty === difficulty)
    : topicFiltered;

  const filteredWithoutRecent = difficultyFiltered.filter(
    (question) => !excludeIds.includes(question.id)
  );

  const sourcePool =
    filteredWithoutRecent.length >= count ? filteredWithoutRecent : difficultyFiltered;

  return shuffleArray(sourcePool).slice(0, count);
}
