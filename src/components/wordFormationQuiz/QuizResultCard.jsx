import PrimaryButton from '../ui/PrimaryButton';
import SectionCard from '../ui/SectionCard';

export default function QuizResultCard({
  questions,
  answers,
  onRestart,
  onBackToTopics,
}) {
  const results = questions.map((question) => {
    const userAnswer = answers[question.id];
    const normalizedUserAnswer =
      question.type === 'fill_blank' && typeof userAnswer === 'string'
        ? userAnswer.trim().toLowerCase()
        : userAnswer;
    const normalizedCorrectAnswer =
      question.type === 'fill_blank'
        ? question.correctAnswer.trim().toLowerCase()
        : question.correctAnswer;

    return {
      ...question,
      userAnswer,
      isCorrect: normalizedUserAnswer === normalizedCorrectAnswer,
    };
  });

  const score = results.filter((result) => result.isCorrect).length;

  return (
    <SectionCard className="border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
            Quiz complete
          </span>
          <h3 className="text-3xl font-semibold text-slate-950 dark:text-white">
            {score} / {questions.length}
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Review each answer and use the explanations to lock in the pattern.
          </p>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`rounded-2xl border p-4 ${
                result.isCorrect
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20'
              }`}
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Question {index + 1}
                </p>
                <h4 className="font-semibold text-slate-950 dark:text-white">{result.question}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your answer:{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {result.userAnswer || 'No answer'}
                  </span>
                </p>
                {!result.isCorrect && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Correct answer:{' '}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {result.correctAnswer}
                    </span>
                  </p>
                )}
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{result.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <PrimaryButton
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onBackToTopics}
          >
            Back to Topics
          </PrimaryButton>
          <PrimaryButton className="w-full sm:w-auto" onClick={onRestart}>
            Try Another Quiz
          </PrimaryButton>
        </div>
      </div>
    </SectionCard>
  );
}
