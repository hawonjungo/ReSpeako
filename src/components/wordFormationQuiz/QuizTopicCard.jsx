import PrimaryButton from '../ui/PrimaryButton';
import SectionCard from '../ui/SectionCard';

export default function QuizTopicCard({ topic, onStart }) {
  return (
    <SectionCard className="h-full border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
            {topic.recommendedCount} questions
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{topic.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {topic.description}
            </p>
          </div>
        </div>

        <PrimaryButton className="w-full" onClick={() => onStart(topic.id)}>
          Start Topic
        </PrimaryButton>
      </div>
    </SectionCard>
  );
}
