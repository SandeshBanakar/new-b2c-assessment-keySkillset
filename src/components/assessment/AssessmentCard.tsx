'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LibraryAssessment } from '@/data/assessments';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Tier access helper
// -------------------------------------------------------

export function tierAllowsType(tier: Tier, type: LibraryAssessment['type']): boolean {
  switch (tier) {
    case 'free':         return false;
    case 'basic':        return type === 'full-test';
    case 'professional': return type === 'full-test' || type === 'subject-test';
    case 'premium':      return true;
  }
}

// -------------------------------------------------------
// Badge tokens
// -------------------------------------------------------

const EXAM_BADGE: Record<LibraryAssessment['exam'], string> = {
  SAT:  'bg-blue-100 text-blue-700 border border-blue-200',
  JEE:  'bg-amber-100 text-amber-700 border border-amber-200',
  NEET: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  PMP:  'bg-violet-100 text-violet-700 border border-violet-200',
};

const DIFF_BADGE: Record<LibraryAssessment['difficulty'], string> = {
  easy:   'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  hard:   'bg-rose-50 text-rose-700',
};

// -------------------------------------------------------
// Card state derivation — 7 states per spec
// -------------------------------------------------------

export type CardState = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function deriveCardState({
  userTier,
  assessmentType,
  isSubscribed,
  attemptsUsed,
  freeAttemptUsed,
  status,
}: {
  userTier: Tier;
  assessmentType: LibraryAssessment['type'];
  isSubscribed: boolean;
  attemptsUsed: number;
  freeAttemptUsed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
}): CardState {
  // STATE 7: all 6 attempts consumed
  if (attemptsUsed >= 6) return 7;

  // Premium override: unlocks all types, always sees states 4–7
  if (userTier === 'premium') {
    if (attemptsUsed === 0) return 4;
    if (status === 'in_progress') return 5;
    return 6;
  }

  // Subscribed assessments: states 4–6
  if (isSubscribed) {
    if (attemptsUsed === 0) return 4;
    if (status === 'in_progress') return 5;
    return 6;
  }

  // Not subscribed — check tier access
  if (!tierAllowsType(userTier, assessmentType)) {
    return freeAttemptUsed ? 2 : 1;
  }

  // Tier allows, not yet subscribed
  return 3;
}

// -------------------------------------------------------
// Props
// -------------------------------------------------------

export interface AssessmentCardProps {
  assessment: LibraryAssessment;
  userTier: Tier;
  isSubscribed: boolean;
  attemptsUsed: number;
  freeAttemptUsed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export default function AssessmentCard({
  assessment,
  userTier,
  isSubscribed,
  attemptsUsed,
  freeAttemptUsed,
  status,
}: AssessmentCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const cardState = deriveCardState({
    userTier,
    assessmentType: assessment.type,
    isSubscribed,
    attemptsUsed,
    freeAttemptUsed,
    status,
  });

  const detailHref = `/assessments/${assessment.id}`;

  // Chips: only in states 1, 2, 3
  const showFreeAttemptChip = cardState === 1 || cardState === 3;
  const showExhaustedChip   = cardState === 2;

  // Progress bar: only in states 5, 6, 7
  const showProgressBar = cardState === 5 || cardState === 6 || cardState === 7;
  const fillPct = Math.min((attemptsUsed / 6) * 100, 100);

  return (
    <div
      className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(detailHref)}
    >
      {/* Image section */}
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assessment.thumbnailUrl}
          alt={assessment.title}
          className="w-full h-40 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-40 bg-zinc-100" />
      )}

      {/* Content section */}
      <div className="p-4 flex flex-col gap-3">

        {/* Row 1 — Chips */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EXAM_BADGE[assessment.exam]}`}>
            {assessment.exam}
          </span>
          {showFreeAttemptChip && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700">
              1 Free Attempt
            </span>
          )}
          {showExhaustedChip && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              Free Attempt Exhausted
            </span>
          )}
        </div>

        {/* Row 2 — Title */}
        <h3 className="text-base font-bold text-zinc-900">{assessment.title}</h3>

        {/* Row 3 — Metadata */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          <span>{assessment.questions} questions</span>
          <span>{assessment.durationLabel}</span>
          <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${DIFF_BADGE[assessment.difficulty]}`}>
            {assessment.difficulty}
          </span>
        </div>

        {/* Row 4 — Progress bar (states 5, 6, 7) */}
        {showProgressBar && (
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Attempts</span>
              <span>{attemptsUsed}/6 used</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full">
              <div
                className="h-1.5 bg-violet-500 rounded-full"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Row 5 — CTAs */}

        {/* STATE 1: Locked, free attempt available */}
        {cardState === 1 && (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="bg-violet-600 hover:bg-violet-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              Take Free Test
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); router.push('/plans'); }}
              className="border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 w-full rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Upgrade to Access
            </button>
          </div>
        )}

        {/* STATE 2: Free attempt exhausted, tier still locked */}
        {cardState === 2 && (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="bg-violet-600 hover:bg-violet-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              Continue Your Test
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); router.push('/plans'); }}
              className="border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 w-full rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Upgrade to Access
            </button>
          </div>
        )}

        {/* STATE 3: Tier allows, not subscribed, free attempt available */}
        {cardState === 3 && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            Take Free Test
          </button>
        )}

        {/* STATE 4: Subscribed / Premium, 0 attempts */}
        {cardState === 4 && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            Start Your Test
          </button>
        )}

        {/* STATE 5: Subscribed, in progress */}
        {cardState === 5 && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
            className="border border-violet-600 text-violet-600 bg-white hover:bg-violet-50 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            Resume Test
          </button>
        )}

        {/* STATE 6: Subscribed, completed, attempts remain */}
        {cardState === 6 && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              View Analysis
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="flex-1 border border-zinc-300 text-zinc-600 bg-white hover:bg-zinc-50 rounded-lg py-2.5 text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* STATE 7: All 6 attempts used */}
        {cardState === 7 && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
            className="border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 w-full rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            View Analysis
          </button>
        )}

      </div>
    </div>
  );
}
