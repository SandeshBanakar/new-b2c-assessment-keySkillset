'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { DEMO_ATTEMPT_STATES, ASSESSMENT_LIBRARY } from '@/data/assessments';
import { EmptyStateAction } from '@/components/shared/EmptyStateAction';
import type { Tier } from '@/types';
import type { LibraryAssessment } from '@/data/assessments';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

const EXAM_BADGE: Record<LibraryAssessment['exam'], string> = {
  SAT:  'bg-blue-100 text-blue-700',
  JEE:  'bg-amber-100 text-amber-700',
  NEET: 'bg-emerald-100 text-emerald-700',
  PMP:  'bg-violet-100 text-violet-700',
};

function tierAllowsType(tier: Tier, type: LibraryAssessment['type']): boolean {
  if (tier === 'free')         return false;
  if (tier === 'basic')        return type === 'full-test';
  if (tier === 'professional') return type === 'full-test' || type === 'subject-test';
  return true; // premium
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(diff / 86400000);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

type Tab = 'in-progress' | 'recently-completed';

export default function ContinueLearningWidget() {
  const router = useRouter();
  const { user } = useAppContext();

  const { inProgress, recentlyCompleted } = useMemo(() => {
    if (!user) return { inProgress: [], recentlyCompleted: [] };

    const attempts = DEMO_ATTEMPT_STATES[user.id] ?? {};

    const inProgress = Object.entries(attempts)
      .filter(([assessmentId, attempt]) => {
        if (attempt.status !== 'in_progress') return false;
        if (attempt.lastAccessedAt === null) return false;
        const lib = ASSESSMENT_LIBRARY.find((a) => a.id === assessmentId);
        if (!lib) return false;
        return attempt.freeAttemptUsed || tierAllowsType(user.subscriptionTier, lib.type);
      })
      .map(([assessmentId, attempt]) => ({
        assessment: ASSESSMENT_LIBRARY.find((a) => a.id === assessmentId)!,
        attempt,
        lastAccessedAt: attempt.lastAccessedAt as number,
      }))
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 3);

    const recentlyCompleted = Object.entries(attempts)
      .filter(([assessmentId, attempt]) => {
        if (attempt.status !== 'completed') return false;
        if (attempt.lastAccessedAt === null) return false;
        return !!ASSESSMENT_LIBRARY.find((a) => a.id === assessmentId);
      })
      .map(([assessmentId, attempt]) => ({
        assessment: ASSESSMENT_LIBRARY.find((a) => a.id === assessmentId)!,
        attempt,
        lastAccessedAt: attempt.lastAccessedAt as number,
      }))
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 3);

    return { inProgress, recentlyCompleted };
  }, [user]);

  // Explicit user selection (null = no preference yet)
  const [userTab, setUserTab] = useState<Tab | null>(null);

  // Derive effective tab without side effects:
  // If user wants in-progress (or has no preference) but there are no in-progress items,
  // fall back to recently-completed. This also handles the tier-switch scenario.
  const activeTab: Tab =
    (userTab === null || userTab === 'in-progress') && inProgress.length === 0
      ? 'recently-completed'
      : (userTab ?? 'in-progress');

  // Hidden entirely when no data in either tab
  if (inProgress.length === 0 && recentlyCompleted.length === 0) return null;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-bold text-zinc-900">
          Continue Where You Left Off
        </span>
      </div>

      {/* Tab row */}
      <div className="flex gap-1 bg-zinc-100 rounded-full p-1 w-fit mb-4">
        <button
          onClick={() => setUserTab('in-progress')}
          className={
            activeTab === 'in-progress'
              ? 'bg-white text-zinc-900 shadow-sm rounded-full px-3 py-1 text-xs font-semibold'
              : 'text-zinc-500 px-3 py-1 text-xs cursor-pointer hover:text-zinc-700'
          }
        >
          In Progress
        </button>
        <button
          onClick={() => setUserTab('recently-completed')}
          className={
            activeTab === 'recently-completed'
              ? 'bg-white text-zinc-900 shadow-sm rounded-full px-3 py-1 text-xs font-semibold'
              : 'text-zinc-500 px-3 py-1 text-xs cursor-pointer hover:text-zinc-700'
          }
        >
          Recently Completed
        </button>
      </div>

      {/* In Progress tab */}
      {activeTab === 'in-progress' && (
        inProgress.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
               style={{ scrollSnapType: 'x mandatory' }}>
            {inProgress.map(({ assessment, attempt, lastAccessedAt }) => {
              const fillPct = Math.min((attempt.attemptsUsed / 6) * 100, 100);
              return (
                <div
                  key={assessment.id}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 flex-shrink-0"
                  style={{ minWidth: 260, maxWidth: 260, scrollSnapAlign: 'start' }}
                >
                  {/* Exam badge */}
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 w-fit ${EXAM_BADGE[assessment.exam]}`}>
                    {assessment.exam}
                  </span>
                  {/* Title */}
                  <p className="text-sm font-bold text-zinc-900 leading-snug">
                    {assessment.title}
                  </p>
                  {/* Last accessed */}
                  <p className="text-xs text-zinc-400">
                    Last accessed {relativeTime(lastAccessedAt)}
                  </p>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Attempts</span>
                      <span>{attempt.attemptsUsed}/6 used</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full">
                      <div
                        className="h-1.5 bg-violet-500 rounded-full"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  {/* CTA */}
                  <button
                    onClick={() => router.push(`/assessments/${assessment.id}`)}
                    className="bg-violet-600 text-white text-xs font-semibold rounded-lg px-4 py-2 w-full mt-1 hover:bg-violet-700 transition-colors"
                  >
                    Resume Test
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyStateAction
            heading="Your learning queue is clear. Ready to change that?"
            ctaLabel="Browse Assessment Library"
            ctaHref="/assessments"
            icon={<BookOpen className="w-8 h-8" />}
          />
        )
      )}

      {/* Recently Completed tab */}
      {activeTab === 'recently-completed' && (
        recentlyCompleted.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
               style={{ scrollSnapType: 'x mandatory' }}>
            {recentlyCompleted.map(({ assessment, lastAccessedAt }) => (
              <div
                key={assessment.id}
                className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 flex-shrink-0"
                style={{ minWidth: 260, maxWidth: 260, scrollSnapAlign: 'start' }}
              >
                {/* Exam badge */}
                <span className={`text-xs font-medium rounded-full px-2 py-0.5 w-fit ${EXAM_BADGE[assessment.exam]}`}>
                  {assessment.exam}
                </span>
                {/* Title */}
                <p className="text-sm font-bold text-zinc-900 leading-snug">
                  {assessment.title}
                </p>
                {/* Last accessed */}
                <p className="text-xs text-zinc-400">
                  Last accessed {relativeTime(lastAccessedAt)}
                </p>
                {/* CTA */}
                <button
                  onClick={() => router.push(`/assessments/${assessment.id}`)}
                  className="border border-zinc-300 text-zinc-700 text-xs font-medium rounded-lg px-4 py-2 w-full mt-1 hover:bg-zinc-50 transition-colors"
                >
                  View Analysis
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateAction
            heading="No completed tests yet."
            ctaLabel="Start your first test"
            ctaHref="/assessments"
          />
        )
      )}
    </div>
  );
}
