import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import { diagnosticSentences, pronunciationSets } from '../../data/pronunciationSets';
import { getIpaPageSymbol, isPronunciationConfigured } from '../../utils/pronunciation';
import { getPhonemeStats, rankPhonemes } from '../../utils/phonemeStats';
import PageContainer from '../ui/PageContainer';
import SectionCard from '../ui/SectionCard';
import PrimaryButton from '../ui/PrimaryButton';
import StatusBanner from '../ui/StatusBanner';
import ListenDrill from './ListenDrill';
import SpeakDrill from './SpeakDrill';

const TABS = ['listen', 'say', 'shadow'];
const WEAK_LIMIT = 6;

function scoreTone(score) {
  if (score === null || score === undefined) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  if (score >= 80) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
  if (score >= 60) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200';
  return 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200';
}

/**
 * Pronunciation Coach: listen to contrasts, say minimal pairs, shadow
 * sentences with per-sound scores, and track the weakest sounds over time.
 */
export default function PronunciationCoach() {
  const { language } = useContext(LanguageContext);
  const t = { ...translations[language].coach, errors: translations[language].pronunciation.errors };
  const engine = isPronunciationConfigured() ? 'azure' : 'browser';

  const [view, setView] = useState({ mode: 'home' }); // home | set | diagnostic
  const [tab, setTab] = useState('listen');
  const [ranked, setRanked] = useState([]);

  useEffect(() => {
    if (view.mode !== 'home') return;
    getPhonemeStats().then((stats) => setRanked(rankPhonemes(stats))).catch(() => setRanked([]));
  }, [view.mode]);

  const averageBySymbol = useMemo(
    () => Object.fromEntries(ranked.map((entry) => [entry.phoneme, entry.average])),
    [ranked]
  );
  const setAverage = (set) => {
    const scores = set.symbols.map((symbol) => averageBySymbol[symbol]).filter((value) => value !== undefined);
    return scores.length === 0 ? null : Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  };
  const setForSymbol = (symbol) => pronunciationSets.find((set) => set.symbols.includes(symbol));

  const openSet = (setId) => {
    setTab('listen');
    setView({ mode: 'set', setId });
  };

  const currentSet = view.mode === 'set' ? pronunciationSets.find((set) => set.id === view.setId) : null;

  return (
    <PageContainer title={t.title} description={t.description}>
      <div className="mx-auto max-w-3xl space-y-4">
        {engine === 'browser' && (
          <StatusBanner type="warning" message={t.noAzure} />
        )}

        {view.mode === 'home' && (
          <>
            <SectionCard>
              <h2 className="text-lg font-semibold">{t.methodTitle}</h2>
              <ol className="mt-3 space-y-2 text-sm">
                {t.method.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                      {index + 1}
                    </span>
                    <span><span className="font-medium">{step.title}:</span> {step.text}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>

            <SectionCard>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{t.weakTitle}</h2>
                {ranked.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{engine === 'azure' ? t.weakEmpty : t.weakNeedsAzure}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ranked.slice(0, WEAK_LIMIT).map((entry) => {
                      const set = setForSymbol(entry.phoneme);
                      const ipaSymbol = getIpaPageSymbol(entry.phoneme);
                      const content = (
                        <span className={`inline-flex flex-col items-center rounded-xl px-3 py-2 ${scoreTone(entry.average)}`}>
                          <span className="font-ipa text-xl">/{entry.phoneme}/</span>
                          <span className="text-xs">{entry.average} · {entry.exampleWord}</span>
                        </span>
                      );
                      if (set) {
                        return <button key={entry.phoneme} type="button" onClick={() => openSet(set.id)}>{content}</button>;
                      }
                      return ipaSymbol
                        ? <Link key={entry.phoneme} to={`/ipa-pronounce?symbol=${encodeURIComponent(ipaSymbol)}`}>{content}</Link>
                        : <span key={entry.phoneme}>{content}</span>;
                    })}
                  </div>
                )}
                <PrimaryButton variant="secondary" onClick={() => setView({ mode: 'diagnostic' })}>{t.diagnostic}</PrimaryButton>
              </div>
            </SectionCard>

            <div className="grid gap-3 sm:grid-cols-2">
              {pronunciationSets.map((set) => {
                const average = setAverage(set);
                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => openSet(set.id)}
                    className="rounded-2xl border border-gray-200 bg-white/90 p-4 text-left shadow-sm transition hover:border-cyan-300 dark:border-gray-800 dark:bg-gray-900/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{set.title[language]}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-xs ${scoreTone(average)}`}>{average ?? t.notYet}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {set.pairs.slice(0, 3).map((pair) => pair.join(' / ')).join(' · ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view.mode === 'diagnostic' && (
          <SectionCard>
            <div className="space-y-4">
              <PrimaryButton variant="ghost" onClick={() => setView({ mode: 'home' })}>← {t.back}</PrimaryButton>
              <h2 className="text-lg font-semibold">{t.diagnostic}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t.diagnosticHint}</p>
              <SpeakDrill items={diagnosticSentences} mode="sentence" engine={engine} t={t} />
            </div>
          </SectionCard>
        )}

        {currentSet && (
          <SectionCard>
            <div className="space-y-4">
              <PrimaryButton variant="ghost" onClick={() => setView({ mode: 'home' })}>← {t.back}</PrimaryButton>
              <h2 className="text-xl font-semibold">{currentSet.title[language]}</h2>
              <div className="rounded-xl bg-cyan-50/70 p-3 text-sm leading-6 dark:bg-cyan-950/30">
                <p className="font-medium">{t.howTo}</p>
                <p className="mt-1">{currentSet.tip[language]}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentSet.symbols.map((symbol) => {
                    const ipaSymbol = getIpaPageSymbol(symbol);
                    return ipaSymbol ? (
                      <Link
                        key={symbol}
                        to={`/ipa-pronounce?symbol=${encodeURIComponent(ipaSymbol)}`}
                        className="rounded-md border border-cyan-300 px-2 py-0.5 font-ipa text-cyan-800 hover:bg-cyan-100 dark:border-cyan-700 dark:text-cyan-200 dark:hover:bg-cyan-900/40"
                      >
                        /{ipaSymbol}/ ↗
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800" role="tablist">
                {TABS.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={tab === name}
                    onClick={() => setTab(name)}
                    className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                      tab === name ? 'bg-white shadow-sm dark:bg-gray-900' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {index + 1}. {t.tabs[name]}
                  </button>
                ))}
              </div>

              {tab === 'listen' && <ListenDrill key={currentSet.id} pairs={currentSet.pairs} t={t} />}
              {tab === 'say' && (
                <SpeakDrill
                  key={`${currentSet.id}-say`}
                  items={currentSet.pairs.flat()}
                  contrasts={Object.fromEntries(currentSet.pairs.flatMap(([a, b]) => [[a, b], [b, a]]))}
                  symbols={currentSet.symbols}
                  mode="word"
                  engine={engine}
                  t={t}
                />
              )}
              {tab === 'shadow' && (
                <SpeakDrill
                  key={`${currentSet.id}-shadow`}
                  items={currentSet.sentences}
                  symbols={currentSet.symbols}
                  mode="sentence"
                  engine={engine}
                  t={t}
                />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.reviewHint} <Link to="/review" className="underline">{t.openReview}</Link>
              </p>
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
