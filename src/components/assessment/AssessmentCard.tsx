'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tierAllows } from '@/types/assessment';
import type { SupabaseAssessment } from '@/types/assessment';
import type { MockAttemptData } from '@/data/mockAttempts';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Badge tokens
// -------------------------------------------------------

const EXAM_BADGE: Record<string, string> = {
  SAT:      'bg-blue-50 text-blue-700 border border-blue-200',
  'IIT-JEE':'bg-orange-50 text-orange-700 border border-orange-200',
  NEET:     'bg-green-50 text-green-700 border border-green-200',
  PMP:      'bg-purple-50 text-purple-700 border border-purple-200',
  CLAT:     'bg-rose-50 text-rose-700 border border-rose-200',
};

const DIFF_BADGE: Record<string, string> = {
  easy:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  hard:   'bg-red-50 text-red-700 border border-red-200',
};

// -------------------------------------------------------
// Gradient placeholder per exam type
// -------------------------------------------------------

const EXAM_GRADIENT: Record<string, string> = {
  SAT:      'from-blue-100 to-blue-200',
  'IIT-JEE':'from-orange-100 to-orange-200',
  NEET:     'from-green-100 to-green-200',
  PMP:      'from-purple-100 to-purple-200',
  CLAT:     'from-rose-100 to-rose-200',
};

// -------------------------------------------------------
// Card state derivation — 6 states
// -------------------------------------------------------

export type CardState = 1 | 2 | 4 | 5 | 6 | 7;

export function deriveCardState({
  userTier,
  assessment,
  attemptData,
}: {
  userTier: Tier;
  assessment: SupabaseAssessment;
  attemptData: MockAttemptData;
}): CardState {
  const tierAllowsAccess = tierAllows(userTier, assessment.min_tier);
  const attemptsUsed = attemptData.attemptsUsed;
  const freeAttemptUsed = attemptData.isFreeAttempt && attemptsUsed > 0;
  const status = attemptData.status;

  // State 7: all 6 attempts consumed
  if (attemptsUsed >= 6) return 7;

  // Tier allows → subscribed states 4–6
  if (tierAllowsAccess) {
    if (attemptsUsed === 0) return 4;
    if (status === 'inprogress') return 5;
    return 6; // completed, attempts remain
  }

  // Tier does not allow
  if (!freeAttemptUsed) return 1; // free attempt available
  return 2;                        // free attempt exhausted
}

// -------------------------------------------------------
// Props
// -------------------------------------------------------

export interface AssessmentCardProps {
  assessment: SupabaseAssessment;
  attemptData: MockAttemptData;
  userTier: Tier;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export default function AssessmentCard({
  assessment,
  attemptData,
  userTier,
}: AssessmentCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const cardState = deriveCardState({ userTier, assessment, attemptData });
  const detailHref = `/assessments/${assessment.slug ?? assessment.id}?from=assessments`;

  const showFreeAttemptChip = cardState === 1;
  const showExhaustedChip   = cardState === 2;
  const showProgressBar     = cardState === 5 || cardState === 6 || cardState === 7;
  const fillPct = Math.min((attemptData.attemptsUsed / 6) * 100, 100);

  const gradientClass = EXAM_GRADIENT[assessment.exam_type] ?? 'from-zinc-100 to-zinc-200';
  const examBadgeClass = EXAM_BADGE[assessment.exam_type] ?? 'bg-zinc-50 text-zinc-700 border border-zinc-200';
  const diffBadgeClass = DIFF_BADGE[assessment.difficulty] ?? 'bg-zinc-50 text-zinc-700 border border-zinc-200';

  const showPlaceholder = !assessment.thumbnail_url || imgError;

  return (
    <div
      className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      onClick={() => router.push(detailHref)}
    >
      {/* Image / gradient placeholder */}
      {showPlaceholder ? (
        <div
          className={`w-full h-40 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
        >
          <span className="text-2xl font-bold text-white opacity-40">
            {assessment.exam_type}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assessment.thumbnail_url!}
          alt={assessment.title}
          className="w-full h-40 object-cover cursor-pointer"
          onError={() => setImgError(true)}
        />
      )}

      {/* Content section */}
      <div className="p-4 flex flex-col gap-3">

        {/* Row 1 — Chips */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${examBadgeClass}`}>
            {assessment.exam_type}
          </span>
          {showFreeAttemptChip && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
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
        <h3 className="text-base font-medium text-zinc-900">{assessment.title}</h3>

        {/* Row 3 — Metadata */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          <span>{assessment.total_questions} questions</span>
          <span>{assessment.duration_minutes}m</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${diffBadgeClass}`}>
            {assessment.difficulty}
          </span>
        </div>

        {/* Row 4 — Progress bar (states 5, 6, 7) */}
        {showProgressBar && (
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Attempts</span>
              <span>{attemptData.attemptsUsed}/6 used</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full">
              <div
                className="h-1.5 bg-blue-500 rounded-full"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Row 5 — CTAs */}

        {/* STATE 1: Tier locked, free attempt available */}
        {cardState === 1 && (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
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

        {/* STATE 2: Tier locked, free attempt exhausted */}
        {cardState === 2 && (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
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

        {/* STATE 4: Tier allows, 0 attempts */}
        {cardState === 4 && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            Start Your Test
          </button>
        )}

        {/* STATE 5: Tier allows, in progress */}
        {cardState === 5 && (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
            className="border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            Resume Test
          </button>
        )}

        {/* STATE 6: Tier allows, completed, attempts remain */}
        {cardState === 6 && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(detailHref); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
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
