import { Link } from 'react-router-dom';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import PrimaryButton from './ui/PrimaryButton';

const learningModules = [
  {
    title: 'Write from Dictation',
    description: 'PTE-style dictation: listen once, type the sentence, and see every missed word highlighted.',
    href: '/pte/write-from-dictation',
    accent: 'from-teal-500/15 to-emerald-500/10',
  },
  {
    title: 'Repeat Sentence',
    description: 'Hear a sentence once and say it back after the beep, with content and fluency feedback.',
    href: '/pte/repeat-sentence',
    accent: 'from-orange-500/15 to-amber-500/10',
  },
  {
    title: 'Read Aloud',
    description: 'Real exam timing: 35 seconds to prepare, 40 to read, and every skipped word highlighted.',
    href: '/pte/read-aloud',
    accent: 'from-blue-500/15 to-cyan-500/10',
  },
  {
    title: 'Describe Image',
    description: 'Charts drawn in the app: 25 seconds to study, 40 to describe, scored on key ideas and pace.',
    href: '/pte/describe-image',
    accent: 'from-emerald-500/15 to-teal-500/10',
  },
  {
    title: 'Retell Lecture',
    description: 'Hear a short academic lecture once, take notes, and retell the main points in 40 seconds.',
    href: '/pte/retell-lecture',
    accent: 'from-fuchsia-500/15 to-violet-500/10',
  },
  {
    title: 'Review Notebook',
    description: 'Your missed words and sentences return on a spaced-repetition schedule so they stick for good.',
    href: '/review',
    accent: 'from-indigo-500/15 to-purple-500/10',
  },
  {
    title: 'Word Formation',
    description: 'See how prefixes, suffixes, and roots help you decode and create new words faster.',
    href: '/learning/word-formation',
    accent: 'from-cyan-500/15 to-sky-500/10',
  },
  {
    title: 'Grammar Tips',
    description: 'Tighten the structure of everyday English so your sentences feel natural and clear.',
    comingSoon: true,
    accent: 'from-emerald-500/15 to-lime-500/10',
  },
  {
    title: 'Academic Writing',
    description: 'Shape ideas into stronger paragraphs, essays, and formal responses with more control.',
    comingSoon: true,
    accent: 'from-amber-500/15 to-orange-500/10',
  },
  {
    title: 'Vocabulary',
    description: 'Grow the words you can understand, remember, and actually use in real conversations.',
    comingSoon: true,
    accent: 'from-rose-500/15 to-red-500/10',
  },
  {
    title: 'Pronunciation',
    description: 'Train your ear and your voice so the words you know sound confident when you say them.',
    comingSoon: true,
    accent: 'from-fuchsia-500/15 to-pink-500/10',
  },
  {
    title: 'IPA Explorer',
    description: 'Learn the core English speech sounds and hear how each symbol connects to real words.',
    href: '/ipa-pronounce',
    accent: 'from-cyan-500/15 to-blue-500/10',
  },
  {
    title: 'Shadowing Lab',
    description: 'Loop short video segments, follow the subtitle, and practice speaking with natural rhythm.',
    href: '/loop-lab',
    accent: 'from-sky-500/15 to-cyan-500/10',
  },
  {
    title: 'Quizzes',
    description: 'Check what is sticking with quick review sessions that keep learning active and focused.',
    comingSoon: true,
    accent: 'from-violet-500/15 to-indigo-500/10',
  },
];

const productBenefits = [
  {
    title: 'Practice that feels focused',
    description: 'Each area is designed to help you work on one skill at a time without extra clutter.',
  },
  {
    title: 'Feedback you can use right away',
    description: 'Hear words, compare pronunciation, and keep moving while the idea is still fresh.',
  },
  {
    title: 'A clear path from basics to fluency',
    description: 'Start with foundations, revisit weak spots, and build a routine that compounds over time.',
  },
];

function SectionHeading({ eyebrow, title, description, maxWidth = 'max-w-3xl' }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className={`${maxWidth} text-sm text-gray-600 dark:text-gray-300 sm:text-base`}>
          {description}
        </p>
      )}
    </div>
  );
}

function LinkCard({ badge, title, description, href, cta, className = '', badgeClassName = '' }) {
  return (
    <SectionCard className={`h-full ${className}`}>
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="space-y-3">
          {badge && (
            <span className={badgeClassName}>
              {badge}
            </span>
          )}
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          </div>
        </div>
        {href ? (
          <Link to={href}>
            <PrimaryButton className="w-full">{cta}</PrimaryButton>
          </Link>
        ) : (
          <PrimaryButton className="w-full" variant="secondary" disabled>
            Coming soon
          </PrimaryButton>
        )}
      </div>
    </SectionCard>
  );
}

export default function Learning() {
  return (
    <PageContainer
      // title="Learning Hub"
      // description="A focused place to build stronger pronunciation, vocabulary, grammar, and writing habits."
    >
      <div className="space-y-6">


        <section className="space-y-4">
          <SectionHeading
            eyebrow="Learning Modules"
            title="Choose the skill you want to improve next"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {learningModules.map((module) => (
              <LinkCard
                key={module.title}
                badge="Module"
                title={module.title}
                description={module.description}
                href={module.href}
                cta="Start Module"
                className={`bg-gradient-to-br ${module.accent} to-transparent`}
                badgeClassName="inline-flex rounded-full border border-gray-300/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-600 dark:border-gray-700 dark:text-gray-300"
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Why ReSpeako"
            title="Designed for learners who want steady progress"
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {productBenefits.map((benefit) => (
              <SectionCard key={benefit.title} className="h-full">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </div>
              </SectionCard>
            ))}
          </div>
        </section>

        <SectionCard className="border-none bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-transparent">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                Final CTA
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">Start with one session and keep the streak going</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                Open a practice session, choose a module, and turn a few focused minutes into real progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/">
                <PrimaryButton className="w-full sm:w-auto">Go to Practice</PrimaryButton>
              </Link>
              <Link to="/pte/write-from-dictation">
                <PrimaryButton variant="secondary" className="w-full sm:w-auto">
                  Try Dictation
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
