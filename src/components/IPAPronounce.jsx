import { useRef } from 'react';
import { Link } from 'react-router-dom';
import IpaSymbolCard from './IpaSymbolCard';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import PrimaryButton from './ui/PrimaryButton';

const ipaGroups = [
  {
    title: 'Short Vowels',
    description: 'These are quick vowel sounds that often appear in short, clipped syllables.',
    items: [
      { id: 2, symbol: 'ɪ', label: 'ship', highlight: 'i', icon: '/assets/IPA-icons/ship.png' },
      { id: 3, symbol: 'ʊ', label: 'book', highlight: 'oo', icon: '/assets/IPA-icons/book.png' },
      { id: 5, symbol: 'e', label: 'bed', highlight: 'e', icon: '/assets/IPA-icons/bed.png' },
      { id: 6, symbol: 'ə', label: 'teacher', highlight: 'er', icon: '/assets/IPA-icons/teacher.png' },
      { id: 9, symbol: 'æ', label: 'cat', highlight: 'a', icon: '/assets/IPA-icons/cat.png' },
      { id: 10, symbol: 'ʌ', label: 'cup', highlight: 'u', icon: '/assets/IPA-icons/cup.png' },
      { id: 12, symbol: 'ɒ', label: 'hot', highlight: 'o', icon: '/assets/IPA-icons/hot.png' },
    ],
  },
  {
    title: 'Long Vowels',
    description: 'These sounds are held slightly longer, which can change the meaning of a word.',
    items: [
      { id: 1, symbol: 'iː', label: 'sheep', highlight: 'ee', icon: '/assets/IPA-icons/sheep.png' },
      { id: 4, symbol: 'uː', label: 'boot', highlight: 'oo', icon: '/assets/IPA-icons/boot.png' },
      { id: 7, symbol: 'ɜː', label: 'bird', highlight: 'ir', icon: '/assets/IPA-icons/bird.png' },
      { id: 8, symbol: 'ɔː', label: 'law', highlight: 'aw', icon: '/assets/IPA-icons/law.png' },
      { id: 11, symbol: 'ɑː', label: 'car', highlight: 'a', icon: '/assets/IPA-icons/car.png' },
    ],
  },
  {
    title: 'Diphthongs',
    description: 'These sounds glide from one vowel shape to another as you speak.',
    items: [
      { id: 13, symbol: 'ɪə', label: 'near', highlight: 'ea', icon: '/assets/IPA-icons/near.png' },
      { id: 14, symbol: 'eɪ', label: 'face', highlight: 'a', icon: '/assets/IPA-icons/face.png' },
      { id: 15, symbol: 'ʊə', label: 'tour', highlight: 'ou', icon: '/assets/IPA-icons/tour.png' },
      { id: 16, symbol: 'ɔɪ', label: 'boy', highlight: 'oy', icon: '/assets/IPA-icons/boy.png' },
      { id: 17, symbol: 'əʊ', label: 'go', highlight: 'o', icon: '/assets/IPA-icons/go.png' },
      { id: 18, symbol: 'eə', label: 'hair', highlight: 'ai', icon: '/assets/IPA-icons/hair.png' },
      { id: 19, symbol: 'aɪ', label: 'my', highlight: 'y', icon: '/assets/IPA-icons/my.png' },
      { id: 20, symbol: 'aʊ', label: 'cow', highlight: 'ow', icon: '/assets/IPA-icons/cow.png' },
    ],
  },
  {
    title: 'Consonants',
    description: 'Use these to focus on mouth position, tongue placement, and clear articulation.',
    items: [
      {
        id: 21,
        symbol: 'l',
        label: 'lazy',
        highlight: 'l',
        icon: '/assets/IPA-icons/my.png',
        soundFile: '21-ph.mp3',
      },
    ],
  },
];

const howToUseSteps = [
  {
    title: 'Pick one group',
    description: 'Start with short vowels or long vowels so your ear is focused on one sound family.',
  },
  {
    title: 'Tap and listen',
    description: 'Play the sound, study the example word, and notice the highlighted spelling pattern.',
  },
  {
    title: 'Repeat out loud',
    description: 'Say the sound slowly, then the full word, and compare how it feels in your mouth.',
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-300 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function IPAPronounce() {
  const audioCache = useRef({});

  const playIpaSound = (item) => {
    const soundFile = item.soundFile || `${item.id}.mp3`;

    if (!audioCache.current[soundFile]) {
      audioCache.current[soundFile] = new Audio(`/assets/IPA-sounds/${soundFile}`);
    }

    const audio = audioCache.current[soundFile];
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  };

  return (
    <PageContainer
      title="IPA Explorer"
      description="Listen to key English speech sounds, compare example words, and build stronger pronunciation habits."
    >
      <div className="space-y-6">
        <SectionCard className="overflow-hidden border-none bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                Hear the sounds behind the words
              </span>
              <div className="space-y-3">
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Explore IPA sounds in a way that feels practical, visual, and easy to repeat.
                </h2>
                <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
                  This page turns phonetic symbols into a guided learning tool. Listen to a sound, match it to
                  a word, and train your ear one group at a time.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  variant="light"
                  onClick={() => document.getElementById('ipa-groups')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Sounds
                </PrimaryButton>
                <Link to="/practice">
                  <PrimaryButton variant="glass">
                    Practice Speaking
                  </PrimaryButton>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Listen</p>
                <p className="mt-2 text-sm text-slate-100">
                  Tap any card to hear the sound connected to the symbol and example word.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Notice</p>
                <p className="mt-2 text-sm text-slate-100">
                  Use the highlighted letters to connect spelling patterns with pronunciation.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Repeat</p>
                <p className="mt-2 text-sm text-slate-100">
                  Replay tricky sounds until they feel more natural and easier to recognize.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="How To Use"
            title="A simple routine for learning IPA without the overwhelm"
            description="You do not need to memorize everything at once. Move through one sound family, listen carefully, and repeat until the contrast becomes clear."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {howToUseSteps.map((step, index) => (
              <SectionCard key={step.title} className="h-full">
                <div className="space-y-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        </section>

        <section id="ipa-groups" className="space-y-4">
          <SectionHeading
            eyebrow="Grouped IPA Sections"
            title="Study sounds by category"
            description="Grouping sounds makes it easier to hear the small differences that matter in real speech."
          />

          <div className="space-y-4">
            {ipaGroups.map((group) => (
              <SectionCard key={group.title}>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
                      {group.title}
                    </div>
                    <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-300">{group.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {group.items.map((item) => (
                      <IpaSymbolCard key={`${group.title}-${item.id}`} item={item} onPlay={playIpaSound} />
                    ))}
                  </div>
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
              <h2 className="text-2xl font-semibold tracking-tight">Turn sound recognition into speaking confidence</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                After exploring the symbols here, move into practice and say the sounds out loud while they are
                still fresh in your ear.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton
                className="w-full sm:w-auto"
                onClick={() => document.getElementById('ipa-groups')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Review Sounds Again
              </PrimaryButton>
              <Link to="/practice">
                <PrimaryButton variant="secondary" className="w-full sm:w-auto">
                  Go to Practice
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
