import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultLoopLabTranscript } from '../data/loopLabTranscript';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import PrimaryButton from './ui/PrimaryButton';

const MIN_SEGMENT_DURATION = 1.5;

const howItWorksSteps = [
  {
    step: '1',
    title: 'Seek to the right moment',
    description:
      'Play or scrub through the video until you reach the line you want to practice.',
  },
  {
    step: '2',
    title: 'Set your segment',
    description:
      'Use Set Start and Set End from the player time, then fine-tune the segment in mm:ss if needed.',
  },
  {
    step: '3',
    title: 'Loop, shadow, and compare',
    description:
      'Repeat the same clip, type what you heard, and compare it with the reference text.',
  },
];

const tipPanels = [
  {
    title: 'Start with one sentence',
    description:
      'Short segments are easier to repeat accurately and help you notice rhythm, stress, and linking.',
  },
  {
    title: 'Use the reference after listening',
    description:
      'Try hearing the line first, then compare with the reference text to confirm what you missed.',
  },
  {
    title: 'Adjust by one second',
    description:
      'Small timing changes often matter more than long practice sessions. Tight loops produce clearer repetition.',
  },
];

function formatSecondsToTime(value) {
  const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = Math.floor(safeValue % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseTimeToSeconds(value) {
  const input = String(value || '').trim();

  if (!input) {
    return 0;
  }

  if (/^\d+(\.\d+)?$/.test(input)) {
    return Number(input);
  }

  const parts = input.split(':').map((part) => part.trim());

  if (parts.length === 2 && parts.every((part) => /^\d+$/.test(part))) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    return minutes * 60 + seconds;
  }

  if (parts.length === 3 && parts.every((part) => /^\d+$/.test(part))) {
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return Number.NaN;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalizeFirstCharacter(value) {
  const input = String(value || '');

  if (!input) {
    return '';
  }

  return input.charAt(0).toUpperCase() + input.slice(1);
}

function getTextSimilarityScore(referenceText, heardText) {
  const normalizedReference = normalizeText(referenceText);
  const normalizedHeard = normalizeText(heardText);

  if (!normalizedReference || !normalizedHeard) {
    return 0;
  }

  if (normalizedReference === normalizedHeard) {
    return 1;
  }

  const referenceWords = normalizedReference.split(' ');
  const heardWords = normalizedHeard.split(' ');
  const maxLength = Math.max(referenceWords.length, heardWords.length);
  let sharedWords = 0;

  for (let index = 0; index < Math.min(referenceWords.length, heardWords.length); index += 1) {
    if (referenceWords[index] === heardWords[index]) {
      sharedWords += 1;
    }
  }

  return maxLength === 0 ? 0 : sharedWords / maxLength;
}

function extractYouTubeVideoId(value) {
  const input = String(value || '').trim();

  if (!input) {
    return '';
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').trim();
    }

    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }

  return '';
}

function getSentenceRules(value) {
  const input = String(value || '').trim();
  const issues = [];

  if (!input) {
    return issues;
  }

  if (input[0] !== input[0].toUpperCase()) {
    issues.push('The first character should be capitalized.');
  }

  if (!input.endsWith('.')) {
    issues.push('The sentence should end with a period.');
  }

  return issues;
}

function getHighlightedTypedParts(referenceText, typedText) {
  const referenceTokens = String(referenceText || '').match(/\S+|\s+/g) || [];
  const typedTokens = String(typedText || '').match(/\S+|\s+/g) || [];
  const parts = [];
  let wordIndex = 0;

  typedTokens.forEach((token) => {
    if (/^\s+$/.test(token)) {
      parts.push({ text: token, wrong: false });
      return;
    }

    const referenceToken = referenceTokens.filter((item) => !/^\s+$/.test(item))[wordIndex] || '';
    wordIndex += 1;

    if (!referenceToken) {
      parts.push({ text: token, wrong: true });
      return;
    }

    const typedLower = token.toLowerCase();
    const referenceLower = referenceToken.toLowerCase();

    if (typedLower === referenceLower) {
      parts.push({ text: token, wrong: false });
      return;
    }

    let prefixLength = 0;
    while (
      prefixLength < token.length &&
      prefixLength < referenceToken.length &&
      typedLower[prefixLength] === referenceLower[prefixLength]
    ) {
      prefixLength += 1;
    }

    let suffixLength = 0;
    while (
      suffixLength < token.length - prefixLength &&
      suffixLength < referenceToken.length - prefixLength &&
      typedLower[token.length - 1 - suffixLength] === referenceLower[referenceToken.length - 1 - suffixLength]
    ) {
      suffixLength += 1;
    }

    const safeMiddleEnd = Math.max(prefixLength, token.length - suffixLength);
    const before = token.slice(0, prefixLength);
    const changed = token.slice(prefixLength, safeMiddleEnd);
    const after = token.slice(safeMiddleEnd);

    if (before) {
      parts.push({ text: before, wrong: false });
    }

    if (changed) {
      parts.push({ text: changed, wrong: true });
    }

    if (after) {
      parts.push({ text: after, wrong: false });
    }
  });

  return parts;
}

function getComparisonResult(referenceText, heardText) {
  const normalizedReference = normalizeText(referenceText);
  const normalizedHeard = normalizeText(heardText);

  if (!normalizedReference || !normalizedHeard) {
    return {
      status: 'idle',
      title: 'Nothing to compare yet',
      description:
        'Type what you heard and click Check Answer to see the result right away.',
      score: null,
      scriptText: referenceText,
      typedText: heardText,
      rules: getSentenceRules(heardText),
    };
  }

  if (normalizedReference === normalizedHeard) {
    return {
      status: 'exact',
      title: 'Exact match',
      description: 'Your typed line matches the reference after normalization.',
      score: 100,
      scriptText: referenceText,
      typedText: heardText,
      rules: getSentenceRules(heardText),
    };
  }

  const similarity = getTextSimilarityScore(referenceText, heardText);
  const score = Math.round(similarity * 100);

  if (similarity >= 0.7) {
    return {
      status: 'close',
      title: 'Close match',
      description:
        'You captured most of the line. Review the words that changed or were missed.',
      score,
      scriptText: referenceText,
      typedText: heardText,
      rules: getSentenceRules(heardText),
    };
  }

  return {
    status: 'review',
    title: 'Needs review',
    description:
      'The line is still meaningfully different. Slow down the loop and focus on smaller chunks.',
    score,
    scriptText: referenceText,
    typedText: heardText,
    rules: getSentenceRules(heardText),
  };
}

function getSegmentValidationMessage(startTime, endTime) {
  if (startTime < 0) {
    return 'Start time cannot be negative.';
  }

  if (endTime <= startTime) {
    return 'End time must be later than start time.';
  }

  if (endTime - startTime < MIN_SEGMENT_DURATION) {
    return 'Choose a slightly longer segment so the loop is easier to practice.';
  }

  return '';
}

function parseTimestampLabel(value) {
  const parts = String(value || '')
    .trim()
    .split(':')
    .map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return Number.NaN;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return Number.NaN;
}

function parseTranscriptFile(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      segments: [],
      error: 'This transcript file is empty.',
    };
  }

  const timestampPattern = /^\d{1,2}:\d{2}(?::\d{2})?$/;
  const segments = [];
  let currentStart = null;
  let currentLines = [];

  const pushSegment = (nextStart = null) => {
    if (currentStart === null) {
      return;
    }

    const textValue = currentLines.join(' ').trim();
    segments.push({
      start: currentStart,
      end: nextStart ?? currentStart + 5,
      text: textValue,
    });
  };

  lines.forEach((line) => {
    if (timestampPattern.test(line)) {
      const nextStart = parseTimestampLabel(line);

      if (!Number.isNaN(nextStart)) {
        pushSegment(nextStart);
        currentStart = nextStart;
        currentLines = [];
      }

      return;
    }

    if (currentStart !== null) {
      currentLines.push(line);
    }
  });

  pushSegment();

  const filteredSegments = segments.filter((segment) => segment.text);

  if (!filteredSegments.length) {
    return {
      segments: [],
      error: 'No timestamped transcript lines were found. Use lines like 0:16 followed by transcript text.',
    };
  }

  return {
    segments: filteredSegments,
    error: '',
  };
}

function getBestReferenceTextForRange(segments, startTime, endTime, heardText = '') {
  if (!segments.length) {
    return '';
  }

  const overlappingSegments = segments.filter(
    (segment) => segment.end > startTime && segment.start < endTime
  );

  if (!overlappingSegments.length) {
    return '';
  }

  if (overlappingSegments.length === 1) {
    return overlappingSegments[0].text;
  }

  if (normalizeText(heardText)) {
    return [...overlappingSegments]
      .sort((left, right) => {
        const rightScore = getTextSimilarityScore(right.text, heardText);
        const leftScore = getTextSimilarityScore(left.text, heardText);

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return left.start - right.start;
      })[0].text;
  }

  const loopMidpoint = startTime + (endTime - startTime) / 2;

  return [...overlappingSegments]
    .sort((left, right) => {
      const leftDistance = Math.abs((left.start + left.end) / 2 - loopMidpoint);
      const rightDistance = Math.abs((right.start + right.end) / 2 - loopMidpoint);
      return leftDistance - rightDistance;
    })[0].text;
}

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

function FieldLabel({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function TimeAdjustButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
    >
      {children}
    </button>
  );
}

function SegmentTimeField({
  label,
  value,
  onChange,
  onBlur,
  onDecrement,
  onIncrement,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="min-w-[3rem] text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="00:00:00"
          className="w-[8.5rem] max-w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        <div className="flex gap-1.5">
          <TimeAdjustButton onClick={onDecrement}>-1s</TimeAdjustButton>
          <TimeAdjustButton onClick={onIncrement}>+1s</TimeAdjustButton>
        </div>
      </div>
    </div>
  );
}

function SegmentHeader({ currentPlayerTime, playerReady, onSetStart, onSetEnd }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-2 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Current Time
          </p>
          <p className="mt-0.5 text-lg font-semibold text-slate-950 dark:text-white">
            {formatSecondsToTime(currentPlayerTime)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <PrimaryButton
          variant="secondary"
          onClick={onSetStart}
          disabled={!playerReady}
          className="px-3 py-2 text-xs"
        >
          Set Start
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          onClick={onSetEnd}
          disabled={!playerReady}
          className="px-3 py-2 text-xs"
        >
          Set End
        </PrimaryButton>
      </div>
    </div>
  );
}

function LoopOptions({
  loopDelayInput,
  onLoopDelayChange,
  commitLoopDelayInput,
  loopForever,
  setLoopForever,
  stopLoop,
}) {
  return (
    <div className="grid gap-2 border-t border-slate-200 pt-2 dark:border-slate-800 md:grid-cols-[auto_1fr] md:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-[3rem] text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Delay
        </p>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={loopDelayInput}
            onChange={onLoopDelayChange}
            onBlur={commitLoopDelayInput}
            placeholder="00:00:00"
            className="w-[8.5rem] max-w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Delay restart</span>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={loopForever}
          onChange={(event) => {
            setLoopForever(event.target.checked);
            if (!event.target.checked) {
              stopLoop();
            }
          }}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span>Loop</span>
      </label>
    </div>
  );
}

function LoopActions({ playerReady, validationMessage, isLooping, handleStartLoop, stopLoop }) {
  return (
    <div className="grid grid-cols-[1.35fr_1fr] gap-2">
      <PrimaryButton
        onClick={handleStartLoop}
        disabled={!playerReady || Boolean(validationMessage)}
        className="w-full px-3 py-2 text-sm shadow-lg shadow-cyan-950/10"
      >
        {isLooping ? 'Restart Loop' : 'Start Loop'}
      </PrimaryButton>
      <PrimaryButton onClick={stopLoop} variant="secondary" className="w-full px-3 py-2 text-sm">
        Stop
      </PrimaryButton>
    </div>
  );
}

function SpeechInputPanel({
  isListening,
  speechError,
  onStartSpeaking,
  onStopSpeaking,
}) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Speak Instead
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Use speech input as an optional assistive tool.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PrimaryButton
            onClick={onStartSpeaking}
            disabled={isListening}
            className="px-3 py-2 text-xs"
          >
            Start Speaking
          </PrimaryButton>
          <PrimaryButton
            onClick={onStopSpeaking}
            variant="secondary"
            disabled={!isListening}
            className="px-3 py-2 text-xs"
          >
            Stop
          </PrimaryButton>
        </div>
      </div>

      {speechError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {speechError}
        </div>
      ) : null}
    </div>
  );
}

function VideoSourcePanel({
  playerReady,
  videoTitle,
  currentPlayerTime,
  startTime,
  endTime,
}) {
  return (
    <SectionCard className="space-y-6 border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
            Active lesson
          </span>
          <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
            {playerReady ? 'Player ready' : 'Loading player'}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
          {videoTitle || 'Shadowing practice video'}
        </h3>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Seek in the player to find a useful sentence, then set start and end points from the
          current playback time.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-2 shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:shadow-none">
        <div className="relative w-full overflow-hidden rounded-[22px] bg-black">
          <div className="aspect-video">
            <div id="player" className="h-full w-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/80">
          <InfoChip label="Current Time" value={formatSecondsToTime(currentPlayerTime)} />
          <InfoChip label="Start" value={formatSecondsToTime(startTime)} />
          <InfoChip label="End" value={formatSecondsToTime(endTime)} />
        </div>
      </div>
    </SectionCard>
  );
}

function VideoUrlPanel({
  videoUrlInput,
  onVideoUrlChange,
  onLoadVideo,
  videoUrlError,
  transcriptFileName,
  transcriptError,
  onOpenFilePicker,
}) {
  return (
    <SectionCard className="border-slate-200/80 bg-white/95 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Video Source
        </p>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <FieldLabel label="YouTube Video URL">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={videoUrlInput}
                onChange={onVideoUrlChange}
                placeholder="Paste a YouTube URL or video id"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <PrimaryButton onClick={onLoadVideo} variant="secondary" className="sm:min-w-[132px]">
                Load Video
              </PrimaryButton>
            </div>
          </FieldLabel>

          <FieldLabel label="Transcript">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <PrimaryButton onClick={onOpenFilePicker} variant="secondary" className="sm:min-w-[170px]">
                Add Transcript File
              </PrimaryButton>
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                {transcriptFileName || 'Default PTE transcript loaded'}
              </div>
            </div>
          </FieldLabel>
        </div>
        {videoUrlError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {videoUrlError}
          </div>
        ) : null}
        {transcriptError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {transcriptError}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function SegmentControlsPanel({
  playerReady,
  currentPlayerTime,
  startInput,
  endInput,
  loopDelayInput,
  onStartInputChange,
  onEndInputChange,
  onLoopDelayChange,
  commitStartInput,
  commitEndInput,
  commitLoopDelayInput,
  onSetStart,
  onSetEnd,
  onAdjustStart,
  onAdjustEnd,
  validationMessage,
  isLooping,
  loopForever,
  setLoopForever,
  handleStartLoop,
  stopLoop,
}) {
  return (
    <SectionCard className="space-y-2 border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.92))] p-3 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] dark:shadow-none sm:p-4">
      <div className="space-y-0.5">
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Segment controls
        </span>
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">Build your loop</h3>
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
          Seek, set the range, then loop the clip.
        </p>
      </div>

      <div className="space-y-2 border-t border-slate-200 pt-2 dark:border-slate-800">
        <SegmentHeader
          currentPlayerTime={currentPlayerTime}
          playerReady={playerReady}
          onSetStart={onSetStart}
          onSetEnd={onSetEnd}
        />

        <div className="grid gap-1.5 md:grid-cols-2">
          <SegmentTimeField
            label="Start"
            value={startInput}
            onChange={onStartInputChange}
            onBlur={commitStartInput}
            onDecrement={() => onAdjustStart(-1)}
            onIncrement={() => onAdjustStart(1)}
          />

          <SegmentTimeField
            label="End"
            value={endInput}
            onChange={onEndInputChange}
            onBlur={commitEndInput}
            onDecrement={() => onAdjustEnd(-1)}
            onIncrement={() => onAdjustEnd(1)}
          />
        </div>

        <LoopOptions
          loopDelayInput={loopDelayInput}
          onLoopDelayChange={onLoopDelayChange}
          commitLoopDelayInput={commitLoopDelayInput}
          loopForever={loopForever}
          setLoopForever={setLoopForever}
          stopLoop={stopLoop}
        />

        {validationMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {validationMessage}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
            Ready to loop this segment.
          </div>
        )}

        <LoopActions
          playerReady={playerReady}
          validationMessage={validationMessage}
          isLooping={isLooping}
          handleStartLoop={handleStartLoop}
          stopLoop={stopLoop}
        />
      </div>
    </SectionCard>
  );
}

function TranscriptComparePanel({
  heardText,
  setHeardText,
  comparison,
  onCheckComparison,
  isListening,
  speechError,
  onStartSpeaking,
  onStopSpeaking,
}) {
  const statusStyles = {
    idle: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200',
    exact:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
    close:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    review:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200',
  };
  const highlightedTypedParts = getHighlightedTypedParts(comparison.scriptText, comparison.typedText);

  return (
    <SectionCard className="space-y-5 border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="space-y-2">
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Transcript compare
        </span>
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
          Compare what you heard with the reference
        </h3>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          The transcript for the current loop is used automatically. Type what you heard, then
          check your answer to see the score and the exact differences.
        </p>
      </div>

      <div className="grid gap-4">
        <FieldLabel label="What I Heard">
          <textarea
            rows={6}
            value={heardText}
            onChange={(event) => setHeardText(event.target.value)}
            placeholder="Type what you heard from the loop."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </FieldLabel>

        <SpeechInputPanel
          isListening={isListening}
          speechError={speechError}
          onStartSpeaking={onStartSpeaking}
          onStopSpeaking={onStopSpeaking}
        />
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={onCheckComparison}>
          Check Answer
        </PrimaryButton>
      </div>

      <div className={`rounded-2xl border px-4 py-4 ${statusStyles[comparison.status]}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Comparison Result</p>
        <p className="mt-2 text-lg font-semibold">{comparison.title}</p>
        {comparison.score !== null ? (
          <p className="mt-1 text-2xl font-semibold">{comparison.score}% correct</p>
        ) : null}
        <p className="mt-1 text-sm leading-6">{comparison.description}</p>
        {comparison.scriptText || comparison.typedText ? (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Sentence comparison</p>
            <div className="space-y-2">
              <div className="rounded-xl border border-current/20 bg-white/40 px-3 py-2 dark:bg-slate-950/20">
                <p className="text-xs font-semibold">Script</p>
                <p className="text-sm">{comparison.scriptText || 'No matching script found for this loop.'}</p>
              </div>
              <div className="rounded-xl border border-current/20 bg-white/40 px-3 py-2 dark:bg-slate-950/20">
                <p className="text-xs font-semibold">You typed</p>
                <p className="text-sm leading-6">
                  {comparison.typedText ? (
                    highlightedTypedParts.map((part, index) => (
                      <span
                        key={`${part.text}-${index}`}
                        className={
                          part.wrong
                            ? 'rounded bg-rose-200/80 px-0.5 text-rose-800 dark:bg-rose-400/20 dark:text-rose-200'
                            : ''
                        }
                      >
                        {part.text}
                      </span>
                    ))
                  ) : (
                    'Nothing entered yet.'
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {comparison.rules?.length ? (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Sentence rules</p>
            <div className="space-y-2">
              {comparison.rules.map((rule) => (
                <div
                  key={rule}
                  className="rounded-xl border border-current/20 bg-white/40 px-3 py-2 text-sm dark:bg-slate-950/20"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

export default function LoopLab() {
  const playerRef = useRef(null);
  const loopIntervalRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const transcriptInputRef = useRef(null);
  const speechBaseTextRef = useRef('');
  const defaultTranscript = parseTranscriptFile(defaultLoopLabTranscript.transcriptText);

  const [playerReady, setPlayerReady] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [loopDelay, setLoopDelay] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [loopForever, setLoopForever] = useState(true);
  const [videoId, setVideoId] = useState(
    extractYouTubeVideoId(defaultLoopLabTranscript.videoUrl) || 'jU9ssDa_IVY'
  );
  const [videoUrlInput, setVideoUrlInput] = useState(defaultLoopLabTranscript.videoUrl);
  const [videoUrlError, setVideoUrlError] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [currentPlayerTime, setCurrentPlayerTime] = useState(0);
  const [transcriptSegments, setTranscriptSegments] = useState(defaultTranscript.segments);
  const [transcriptFileName, setTranscriptFileName] = useState(defaultLoopLabTranscript.title);
  const [transcriptError, setTranscriptError] = useState('');
  const [heardText, setHeardText] = useState('');
  const [comparison, setComparison] = useState({
    status: 'idle',
    title: 'Press check to compare',
    description: 'Type what you heard and click Check Answer to see the result right away.',
    score: null,
    scriptText: '',
    typedText: '',
    rules: [],
  });
  const [startInput, setStartInput] = useState(formatSecondsToTime(0));
  const [endInput, setEndInput] = useState(formatSecondsToTime(30));
  const [loopDelayInput, setLoopDelayInput] = useState('00:00:00');

  const {
    isListening: isSpeechListening,
    speechError,
    toggleListening,
    resetTranscriptBuffer,
  } = useSpeechRecognition({
    onTranscriptChange: (nextTranscript) => {
      const cleanedTranscript = nextTranscript.trim();
      const baseText = speechBaseTextRef.current.trim();
      const mergedText = baseText ? `${baseText} ${cleanedTranscript}`.trim() : cleanedTranscript;
      setHeardText(capitalizeFirstCharacter(mergedText));
    },
  });

  useEffect(() => {
    function onYouTubeIframeAPIReady() {
        playerRef.current = new window.YT.Player('player', {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: 0,
            cc_load_policy: 1,
          },
          events: {
            onReady: () => {
              setPlayerReady(true);
              fetchVideoTitle(videoId);
            },
          },
        });
    }

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    } else {
      onYouTubeIframeAPIReady();
    }

    return () => {
      window.clearInterval(loopIntervalRef.current);
      window.clearTimeout(restartTimeoutRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    setStartInput(formatSecondsToTime(startTime));
  }, [startTime]);

  useEffect(() => {
    setEndInput(formatSecondsToTime(endTime));
  }, [endTime]);

  useEffect(() => {
    setLoopDelayInput(formatSecondsToTime(loopDelay));
  }, [loopDelay]);

  async function fetchVideoTitle(currentVideoId) {
    try {
      const response = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${currentVideoId}`
      );
      const data = await response.json();
      setVideoTitle(data.title || '');
    } catch (error) {
      console.error('Failed to fetch video title:', error);
    }
  }

  useEffect(() => {
    window.clearInterval(loopIntervalRef.current);
    window.clearTimeout(restartTimeoutRef.current);

    if (!playerReady || !playerRef.current?.getCurrentTime) {
      return undefined;
    }

    loopIntervalRef.current = window.setInterval(() => {
      const time = playerRef.current.getCurrentTime();
      setCurrentPlayerTime(time);

      if (isLooping && time >= endTime) {
        playerRef.current.pauseVideo();

        if (loopForever) {
          restartTimeoutRef.current = window.setTimeout(() => {
            if (playerRef.current?.seekTo) {
              playerRef.current.seekTo(startTime, true);
              playerRef.current.playVideo();
            }
          }, loopDelay * 1000);
        } else {
          setIsLooping(false);
        }
      }
    }, 150);

    return () => {
      window.clearInterval(loopIntervalRef.current);
      window.clearTimeout(restartTimeoutRef.current);
    };
  }, [playerReady, isLooping, startTime, endTime, loopDelay, loopForever, transcriptSegments]);

  const validationMessage = getSegmentValidationMessage(startTime, endTime);
  const referenceText = getBestReferenceTextForRange(
    transcriptSegments,
    startTime,
    endTime,
    heardText
  );

  useEffect(() => {
    setComparison({
      status: 'idle',
      title: 'Press check to compare',
      description: 'Type what you heard and click Check Answer to see the result right away.',
      score: null,
      scriptText: referenceText,
      typedText: heardText,
      rules: [],
    });
  }, [referenceText, heardText]);

  function stopLoop() {
    setIsLooping(false);
    window.clearInterval(loopIntervalRef.current);
    window.clearTimeout(restartTimeoutRef.current);
  }

  function commitStartInput() {
    const nextValue = parseTimeToSeconds(startInput);

    if (Number.isNaN(nextValue)) {
      setStartInput(formatSecondsToTime(startTime));
      return;
    }

    setStartTime(Math.max(0, nextValue));
  }

  function commitEndInput() {
    const nextValue = parseTimeToSeconds(endInput);

    if (Number.isNaN(nextValue)) {
      setEndInput(formatSecondsToTime(endTime));
      return;
    }

    setEndTime(Math.max(0, nextValue));
  }

  function commitLoopDelayInput(value) {
    const nextValue = parseTimeToSeconds(value);

    if (Number.isNaN(nextValue)) {
      setLoopDelayInput(formatSecondsToTime(loopDelay));
      return null;
    }

    setLoopDelay(Math.max(0, nextValue));
    return Math.max(0, nextValue);
  }

  function setSegmentStartFromPlayer() {
    setStartTime(Math.max(0, currentPlayerTime));
  }

  function setSegmentEndFromPlayer() {
    setEndTime(Math.max(0, currentPlayerTime));
  }

  function adjustStartTime(delta) {
    setStartTime((current) => Math.max(0, current + delta));
  }

  function adjustEndTime(delta) {
    setEndTime((current) => Math.max(0, current + delta));
  }

  function handleStartLoop() {
    if (!playerReady || !playerRef.current?.seekTo) {
      return;
    }

    const nextDelay = commitLoopDelayInput(loopDelayInput);

    if (nextDelay === null) {
      return;
    }

    if (validationMessage) {
      return;
    }

    setIsLooping(true);
    playerRef.current.seekTo(startTime, true);
    playerRef.current.playVideo();
  }

  function handleLoadVideo() {
    const nextVideoId = extractYouTubeVideoId(videoUrlInput);

    if (!nextVideoId) {
      setVideoUrlError('Please enter a valid YouTube URL or video id.');
      return;
    }

    setVideoUrlError('');
    setVideoId(nextVideoId);
    setStartTime(0);
    setEndTime(30);
    setCurrentPlayerTime(0);
    setIsLooping(false);
  }

  async function handleStartSpeaking() {
    speechBaseTextRef.current = heardText.trim();
    resetTranscriptBuffer();

    if (!isSpeechListening) {
      await toggleListening();
    }
  }

  async function handleStopSpeaking() {
    if (isSpeechListening) {
      await toggleListening();
    }
  }

  function handleCheckComparison() {
    setComparison(getComparisonResult(referenceText, heardText));
  }

  async function handleTranscriptFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const { segments: parsedSegments, error } = parseTranscriptFile(text);

      if (!parsedSegments.length) {
          setTranscriptSegments([]);
          setTranscriptFileName(file.name);
          setTranscriptError(error || 'This file did not contain readable timestamped transcript segments.');
          return;
        }

      setTranscriptSegments(parsedSegments);
      setTranscriptFileName(file.name);
      setTranscriptError('');
    } catch (error) {
      console.error('Failed to read transcript file:', error);
      setTranscriptSegments([]);
      setTranscriptFileName('');
      setTranscriptError('Could not read this file. Please try a plain .txt transcript.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <PageContainer
      
    >
      <div className="space-y-8">
        <section id="loop-workspace" className="space-y-4">
          <SectionHeading
            eyebrow="Main Workspace"
            title="Set the loop, practice the line, and compare your result"
          />

          <VideoUrlPanel
            videoUrlInput={videoUrlInput}
            onVideoUrlChange={(event) => setVideoUrlInput(event.target.value)}
            onLoadVideo={handleLoadVideo}
            videoUrlError={videoUrlError}
            transcriptFileName={transcriptFileName}
            transcriptError={transcriptError}
            onOpenFilePicker={() => transcriptInputRef.current?.click()}
          />

          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
            <VideoSourcePanel
              playerReady={playerReady}
              videoTitle={videoTitle}
              currentPlayerTime={currentPlayerTime}
              startTime={startTime}
              endTime={endTime}
            />

            <SegmentControlsPanel
              playerReady={playerReady}
              currentPlayerTime={currentPlayerTime}
              startInput={startInput}
              endInput={endInput}
              loopDelayInput={loopDelayInput}
              onStartInputChange={(event) => setStartInput(event.target.value)}
              onEndInputChange={(event) => setEndInput(event.target.value)}
              onLoopDelayChange={(event) => setLoopDelayInput(event.target.value)}
              commitStartInput={commitStartInput}
              commitEndInput={commitEndInput}
              commitLoopDelayInput={() => commitLoopDelayInput(loopDelayInput)}
              onSetStart={setSegmentStartFromPlayer}
              onSetEnd={setSegmentEndFromPlayer}
              onAdjustStart={adjustStartTime}
              onAdjustEnd={adjustEndTime}
              validationMessage={validationMessage}
              isLooping={isLooping}
              loopForever={loopForever}
              setLoopForever={setLoopForever}
              handleStartLoop={handleStartLoop}
              stopLoop={stopLoop}
            />
          </div>

          <div className="grid gap-5">
            <TranscriptComparePanel
              heardText={heardText}
              setHeardText={setHeardText}
              comparison={comparison}
              onCheckComparison={handleCheckComparison}
              isListening={isSpeechListening}
              speechError={speechError}
              onStartSpeaking={handleStartSpeaking}
              onStopSpeaking={handleStopSpeaking}
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Helper Panels"
            title="Tips to make each loop more useful"
            description="A few simple habits make shadowing sessions cleaner and more effective."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {tipPanels.map((panel) => (
              <SectionCard
                key={panel.title}
                className="h-full border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none"
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{panel.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {panel.description}
                  </p>
                </div>
              </SectionCard>
            ))}
          </div>
        </section>

        <SectionCard className="border-none bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(14,165,233,0.08),rgba(255,255,255,0.55))] shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.4),rgba(15,23,42,0.6),rgba(2,6,23,0.72))] dark:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
                Final CTA
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Keep each shadowing session focused and repeatable
              </h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Once the segment feels clear, move to a new line and repeat the same routine. Small,
                consistent loops build better listening control over time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton
                className="w-full sm:w-auto"
                onClick={() =>
                  document.getElementById('loop-workspace')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Return to Workspace
              </PrimaryButton>
              <Link to="/learning">
                <PrimaryButton variant="secondary" className="w-full sm:w-auto">
                  Explore Learning Hub
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
      <input
        ref={transcriptInputRef}
        type="file"
        accept=".txt,text/plain"
        className="sr-only"
        onChange={handleTranscriptFileChange}
      />
    </PageContainer>
  );
}
