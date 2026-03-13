import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QuizQuestionCard from './wordFormationQuiz/QuizQuestionCard';
import QuizResultCard from './wordFormationQuiz/QuizResultCard';
import QuizTopicCard from './wordFormationQuiz/QuizTopicCard';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import PrimaryButton from './ui/PrimaryButton';
import wordFormationQuizBank from '../data/wordFormationQuizBank';
import wordFormationTopics from '../data/wordFormationTopics';
import getQuizQuestions from '../utils/getQuizQuestions';

const whyItMatters = [
  {
    title: 'Grow vocabulary faster',
    description: 'When you understand word-building patterns, one root word can unlock a whole family of useful vocabulary.',
  },
  {
    title: 'Read with more confidence',
    description: 'You can often guess the meaning of unfamiliar words by spotting familiar prefixes, suffixes, and roots.',
  },
  {
    title: 'Write and speak more precisely',
    description: 'Word formation helps you choose the correct noun, adjective, or verb for the meaning you want to express.',
  },
];

const patternGroups = [
  {
    title: 'Verb to person or role',
    label: 'Agent nouns',
    description: 'These patterns create words for the person or thing that performs an action.',
    affixes: ['-er', '-or', '-ant', '-ent', '-ist'],
    examples: ['write -> writer', 'invent -> inventor', 'assist -> assistant', 'tour -> tourist'],
  },
  {
    title: 'Verb to action or result',
    label: 'Process nouns',
    description: 'These forms describe an action, event, or outcome rather than the person doing it.',
    affixes: ['-ion', '-ment', '-ance', '-ence'],
    examples: ['create -> creation', 'achieve -> achievement', 'perform -> performance', 'depend -> dependence'],
  },
  {
    title: 'Adjective to quality or state',
    label: 'Abstract nouns',
    description: 'These patterns turn descriptions into nouns that express a quality, condition, or idea.',
    affixes: ['-ness', '-ity', '-dom'],
    examples: ['happy -> happiness', 'popular -> popularity', 'free -> freedom', 'official -> officialdom'],
  },
  {
    title: 'Prefix patterns by meaning',
    label: 'Meaning changes',
    description: 'Prefixes usually change meaning while the word class often stays the same, so they are powerful vocabulary shortcuts.',
    affixes: ['un-', 're-', 'pre-', 'over-', 'under-', 'inter-', 'sub-'],
    examples: [
      'un-: happy -> unhappy',
      're-: write -> rewrite',
      'pre-: heat -> preheat',
      'over- / under-: cook -> overcook, estimate -> underestimate',
      'inter- / sub-: national -> international, marine -> submarine',
    ],
  },
  {
    title: 'Adjective to adverb',
    label: 'Manner words',
    description: 'The common -ly pattern helps adjectives describe how an action happens.',
    affixes: ['-ly'],
    examples: ['quick -> quickly', 'slow -> slowly', 'careful -> carefully', 'happy -> happily'],
  },
  {
    title: 'Verb to adjective',
    label: 'Describing actions or states',
    description: 'These forms help a verb describe something as possible, active, attractive, or complete.',
    affixes: ['-able', '-ive', '-ent', '-ing', '-ed'],
    examples: ['enjoy -> enjoyable', 'create -> creative', 'depend -> dependent', 'interest -> interesting'],
  },
  {
    title: 'Noun to adjective',
    label: 'Describing forms',
    description: 'These suffixes turn nouns into adjectives that describe qualities, style, or absence.',
    affixes: ['-ous', '-ful', '-less', '-al', '-ic'],
    examples: ['danger -> dangerous', 'care -> careful', 'hope -> hopeless', 'music -> musical'],
  },
  {
    title: 'Compound words',
    label: 'Two words together',
    description: 'Two familiar words can combine to create one new meaning that learners meet all the time.',
    affixes: [],
    examples: ['toothbrush', 'coffee shop', 'blackboard', 'sunlight', 'swimming pool'],
  },
  {
    title: 'Conversion',
    label: 'Zero derivation',
    description: 'Sometimes a word changes grammatical role without adding a prefix or suffix.',
    affixes: [],
    examples: ['email (noun) -> to email (verb)', 'text (noun) -> to text (verb)', 'run (verb) -> a run (noun)'],
  },
];

const learningExamples = [
  {
    base: 'create',
    transformation: 'creation',
    lesson: 'Use -ion when you want to turn a verb into the result or product of that action.',
  },
  {
    base: 'achieve',
    transformation: 'achievement',
    lesson: 'Use -ment when the new word refers to progress, completion, or a resulting state.',
  },
  {
    base: 'happy',
    transformation: 'happiness',
    lesson: 'Use -ness for common quality words when you want a simple noun form.',
  },
  {
    base: 'happy',
    transformation: 'unhappy',
    lesson: 'Prefixes like un- quickly reverse meaning while keeping the word as an adjective.',
  },
  {
    base: 'careful',
    transformation: 'carefully',
    lesson: 'The -ly pattern often turns adjectives into adverbs that explain how something is done.',
  },
  {
    base: 'create',
    transformation: 'creative',
    lesson: 'Verb to adjective forms like -ive help describe a person, object, or idea with that quality.',
  },
  {
    base: 'danger',
    transformation: 'dangerous',
    lesson: 'Noun to adjective patterns like -ous and -ful help you describe qualities more precisely.',
  },
  {
    base: 'email',
    transformation: 'to email',
    lesson: 'Conversion happens when a word changes role without adding anything new to its form.',
  },
];

const wordFamily = {
  root: 'create',
  members: ['creator', 'creative', 'creativity', 'creation', 'recreate'],
  explanation: 'When you can see a word family, one root becomes several useful forms for reading, writing, and speaking.',
};

const RECENT_QUIZ_STORAGE_KEY = 'respeako_recent_quiz_ids';
const MAX_RECENT_IDS = 24;

const quizModes = [
  {
    id: 'quick',
    title: 'Quick Quiz',
    description: 'A short focused check-in when you want fast practice.',
    count: 5,
    difficulty: '',
  },
  {
    id: 'standard',
    title: 'Standard Quiz',
    description: 'A longer session for deeper review on one topic.',
    count: 10,
    difficulty: '',
  },
  {
    id: 'challenge',
    title: 'Challenge Mode',
    description: 'Mixed topics at medium level for a broader review.',
    count: 10,
    difficulty: 'medium',
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function WordFormation() {
  const [quizView, setQuizView] = useState('topics');
  const [selectedModeId, setSelectedModeId] = useState('quick');
  const [quizSessionConfig, setQuizSessionConfig] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recentQuestionIds, setRecentQuestionIds] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedIds = window.localStorage.getItem(RECENT_QUIZ_STORAGE_KEY);
      if (!storedIds) return;

      const parsedIds = JSON.parse(storedIds);
      if (Array.isArray(parsedIds)) {
        setRecentQuestionIds(parsedIds);
      }
    } catch {
      setRecentQuestionIds([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      RECENT_QUIZ_STORAGE_KEY,
      JSON.stringify(recentQuestionIds.slice(0, MAX_RECENT_IDS))
    );
  }, [recentQuestionIds]);

  const startQuiz = (topicId, modeId = selectedModeId) => {
    const mode = quizModes.find((item) => item.id === modeId) || quizModes[0];
    const questions = getQuizQuestions({
      bank: wordFormationQuizBank,
      topic: mode.id === 'challenge' ? 'mixed_review' : topicId,
      difficulty: mode.difficulty,
      count: mode.count,
      excludeIds: recentQuestionIds,
    });

    if (questions.length === 0) {
      return;
    }

    setQuizSessionConfig({ topicId, modeId: mode.id });
    setQuizQuestions(questions);
    setQuizAnswers({});
    setCurrentQuestionIndex(0);
    setQuizView('session');
    setRecentQuestionIds((previous) => {
      const nextIds = [...questions.map((question) => question.id), ...previous];
      return [...new Set(nextIds)].slice(0, MAX_RECENT_IDS);
    });
  };

  const resetToTopics = () => {
    setQuizView('topics');
    setQuizQuestions([]);
    setQuizAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSessionConfig(null);
  };

  const restartQuiz = () => {
    if (!quizSessionConfig) {
      resetToTopics();
      return;
    }

    startQuiz(quizSessionConfig.topicId, quizSessionConfig.modeId);
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const topicCards = wordFormationTopics.filter((topic) => topic.id !== 'mixed_review');

  return (
    <PageContainer
      title="Word Formation"
      description="Learn how English words are built so you can expand vocabulary, understand meaning faster, and use language more precisely."
    >
      <div className="space-y-8">
        <SectionCard className="relative overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#083344_100%)] px-5 py-6 text-white shadow-[0_24px_80px_rgba(8,15,30,0.32)] sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_45%,transparent_100%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
                Build stronger word awareness
              </span>
              <div className="space-y-4">
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Understand how words change, and your vocabulary starts to grow with less effort.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Word formation gives you a practical system for reading, writing, and speaking with more
                  confidence. Instead of memorizing words one by one, you start to recognize patterns that repeat.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <PrimaryButton
                  variant="light"
                  className="shadow-lg shadow-cyan-950/20"
                  onClick={() => document.getElementById('patterns')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Patterns
                </PrimaryButton>
                <Link to="/practice">
                  <PrimaryButton variant="glass">
                    Go to Practice
                  </PrimaryButton>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Spot</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Notice roots, prefixes, and suffixes that repeat across many words.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Connect</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Link each pattern to its meaning so word families feel easier to remember.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Apply</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Use the right form when you need a person, an action, or a quality in context.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Why This Matters"
            title="Word formation gives you a system, not just a word list"
            description="This skill helps you move from memorizing isolated vocabulary to understanding how English builds meaning across related forms."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {whyItMatters.map((item) => (
              <SectionCard key={item.title} className="h-full border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
                </div>
              </SectionCard>
            ))}
          </div>
        </section>

        <section id="patterns" className="space-y-4">
          <SectionHeading
            eyebrow="Word Formation Patterns"
            title="Learn the main categories that appear again and again"
            description="These are some of the most useful patterns for changing meaning, changing word class, and recognizing how English builds new words."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {patternGroups.map((group) => (
              <SectionCard key={group.title} className="h-full border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
                      {group.label}
                    </span>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{group.title}</h3>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{group.description}</p>
                  </div>

                  <div className="space-y-3">
                    {group.affixes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {group.affixes.map((affix) => (
                          <span
                            key={affix}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                          >
                            {affix}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                      {group.examples.map((example) => (
                        <p key={example} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Learning Examples"
            title="Study a few transformations and notice the logic"
            description="These examples show how a base word can shift meaning, role, or form depending on what you want to say."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {learningExamples.map((example) => (
              <SectionCard key={`${example.base}-${example.transformation}`} className="h-full border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-cyan-100 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(240,249,255,0.85))] p-4 dark:border-cyan-900 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.4),rgba(15,23,42,0.65))]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                      Example
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{example.base}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">becomes</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{example.transformation}</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{example.lesson}</p>
                </div>
              </SectionCard>
            ))}
          </div>

          <SectionCard className="border-slate-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(240,249,255,0.85))] shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.4),rgba(15,23,42,0.65))] dark:shadow-none">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-slate-950/40 dark:text-cyan-200">
                  Word family awareness
                </span>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{wordFamily.root}</h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{wordFamily.explanation}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {wordFamily.members.map((member) => (
                  <div
                    key={member}
                    className="rounded-[18px] border border-slate-200 bg-white/85 px-4 py-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400">{wordFamily.root}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{member}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Mini Quiz"
            title="Practice in short, focused sessions"
            description="Use the mini quiz to study one topic at a time, avoid repetition, and build confidence through small review sessions."
          />

          {quizView === 'topics' && (
            <div className="space-y-5">
              <SectionCard className="border-slate-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(240,249,255,0.85))] shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.4),rgba(15,23,42,0.65))] dark:shadow-none">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-slate-950/40 dark:text-cyan-200">
                      Quick actions
                    </span>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Start a guided review</h3>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Jump into a short quiz, focus on prefixes, or review word families without leaving the lesson flow.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <PrimaryButton className="w-full sm:w-auto" onClick={() => startQuiz('mixed_review', 'quick')}>
                      Start Quick Quiz
                    </PrimaryButton>
                    <PrimaryButton
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => startQuiz('prefixes', 'quick')}
                    >
                      Practice Prefixes
                    </PrimaryButton>
                    <PrimaryButton
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => startQuiz('word_families', 'quick')}
                    >
                      Practice Word Families
                    </PrimaryButton>
                    <PrimaryButton
                      className="w-full border border-cyan-300 bg-cyan-50 text-cyan-900 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100 sm:w-auto"
                      onClick={() => startQuiz('mixed_review', 'challenge')}
                    >
                      Challenge Mode
                    </PrimaryButton>
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      Topic selection
                    </span>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Study by topic</h3>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Choose a quiz mode first, then start a topic card. Recent questions are filtered out automatically when possible.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {quizModes.map((mode) => {
                      const isSelected = selectedModeId === mode.id;

                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedModeId(mode.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-950/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">{mode.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {mode.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {topicCards.map((topic) => (
                      <QuizTopicCard
                        key={topic.id}
                        topic={topic}
                        onStart={(topicId) => startQuiz(topicId, selectedModeId === 'challenge' ? 'quick' : selectedModeId)}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {quizView === 'session' && currentQuestion && (
            <QuizQuestionCard
              question={currentQuestion}
              currentIndex={currentQuestionIndex}
              totalQuestions={quizQuestions.length}
              answer={quizAnswers[currentQuestion.id] || ''}
              onAnswerChange={(answer) =>
                setQuizAnswers((previous) => ({
                  ...previous,
                  [currentQuestion.id]: answer,
                }))
              }
              onNext={() => {
                if (currentQuestionIndex === quizQuestions.length - 1) {
                  setQuizView('result');
                  return;
                }

                setCurrentQuestionIndex((previous) => previous + 1);
              }}
            />
          )}

          {quizView === 'result' && (
            <QuizResultCard
              questions={quizQuestions}
              answers={quizAnswers}
              onRestart={restartQuiz}
              onBackToTopics={resetToTopics}
            />
          )}
        </section>

        <SectionCard className="border-none bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(14,165,233,0.08),rgba(255,255,255,0.55))] shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.4),rgba(15,23,42,0.6),rgba(2,6,23,0.72))] dark:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
                Final CTA
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Turn pattern awareness into everyday vocabulary growth
              </h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Revisit these formations, notice them in reading, and practice using the right word form when you
                speak or write.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/practice">
                <PrimaryButton className="w-full sm:w-auto">Practice With ReSpeako</PrimaryButton>
              </Link>
              <Link to="/learning">
                <PrimaryButton variant="secondary" className="w-full sm:w-auto">
                  Back to Learning Hub
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
