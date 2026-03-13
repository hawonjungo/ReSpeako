import PrimaryButton from '../ui/PrimaryButton';
import SectionCard from '../ui/SectionCard';

export default function QuizQuestionCard({
  question,
  currentIndex,
  totalQuestions,
  answer,
  onAnswerChange,
  onNext,
}) {
  const canContinue = typeof answer === 'string' && answer.trim().length > 0;

  return (
    <SectionCard className="border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
              {question.difficulty}
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-cyan-500 transition-all"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{question.question}</h3>
            {question.promptWord && (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Focus word: <span className="font-medium text-slate-900 dark:text-white">{question.promptWord}</span>
              </p>
            )}
          </div>

          {question.type === 'fill_blank' ? (
            <input
              type="text"
              value={answer || ''}
              onChange={(event) => onAnswerChange(event.target.value)}
              placeholder="Type your answer"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          ) : (
            <div className="grid gap-3">
              {question.options?.map((option) => {
                const isSelected = answer === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAnswerChange(option)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-cyan-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-900'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <PrimaryButton disabled={!canContinue} onClick={onNext}>
            {currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
          </PrimaryButton>
        </div>
      </div>
    </SectionCard>
  );
}
