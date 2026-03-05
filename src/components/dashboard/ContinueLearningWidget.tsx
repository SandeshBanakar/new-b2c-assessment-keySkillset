'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAssessments } from '@/hooks/useAssessments';
import { getAttemptData } from '@/data/mockAttempts';
import { tierAllows } from '@/types/assessment';
import { EmptyStateAction } from '@/components/shared/EmptyStateAction';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

const EXAM_BADGE: Record<string, string> = {
  SAT:      'bg-blue-50 text-blue-700',
  'IIT-JEE':'bg-orange-50 text-orange-700',
  NEET:     'bg-green-50 text-green-700',
  PMP:      'bg-purple-50 text-purple-700',
  CLAT:     'bg-rose-50 text-rose-700',
};

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
  const { assessments } = useAssessments();

  const { inProgress, recentlyCompleted } = useMemo(() => {
    if (!user) return { inProgress: [], recentlyCompleted: [] };

    const inProgress = assessments
      .filter((a) => {
        const attempt = getAttemptData(user.id, a.title);
        if (attempt.status !== 'inprogress') return false;
        if (attempt.lastAccessedAt === null) return false;
        const isFreeAndInProgress = attempt.isFreeAttempt && attempt.status === 'inprogress';
        const isPaidAndAccessible =
          tierAllows(user.subscriptionTier, a.min_tier) && attempt.status === 'inprogress';
        return isFreeAndInProgress || isPaidAndAccessible;
      })
      .map((a) => ({
        assessment: a,
        attempt: getAttemptData(user.id, a.title),
        lastAccessedAt: getAttemptData(user.id, a.title).lastAccessedAt as number,
      }))
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 3);

    const recentlyCompleted = assessments
      .filter((a) => {
        const attempt = getAttemptData(user.id, a.title);
        return attempt.status === 'completed' && attempt.lastAccessedAt !== null;
      })
      .map((a) => ({
        assessment: a,
        attempt: getAttemptData(user.id, a.title),
        lastAccessedAt: getAttemptData(user.id, a.title).lastAccessedAt as number,
      }))
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 3);

    return { inProgress, recentlyCompleted };
  }, [user, assessments]);

  const [userTab, setUserTab] = useState<Tab | null>(null);

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
        <span className="text-base font-medium text-zinc-900">
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
          <div
            className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {inProgress.map(({ assessment, attempt, lastAccessedAt }) => {
              const fillPct = Math.min((attempt.attemptsUsed / 6) * 100, 100);
              const badgeClass = EXAM_BADGE[assessment.exam_type] ?? 'bg-zinc-50 text-zinc-700';
              return (
                <div
                  key={assessment.id}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 flex-shrink-0"
                  style={{ minWidth: 260, maxWidth: 260, scrollSnapAlign: 'start' }}
                >
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 w-fit ${badgeClass}`}>
                    {assessment.exam_type}
                  </span>
                  <p className="text-sm font-medium text-zinc-900 leading-snug">
                    {assessment.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Last accessed {relativeTime(lastAccessedAt)}
                  </p>
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Attempts</span>
                      <span>{attempt.attemptsUsed}/6 used</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full">
                      <div
                        className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/assessments/${assessment.id}?from=dashboard`)}
                    className="bg-blue-600 text-white text-xs font-semibold rounded-md px-4 py-2 w-full mt-1 hover:bg-blue-700 transition-colors"
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
          <div
            className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {recentlyCompleted.map(({ assessment, lastAccessedAt }) => {
              const badgeClass = EXAM_BADGE[assessment.exam_type] ?? 'bg-zinc-50 text-zinc-700';
              return (
                <div
                  key={assessment.id}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 flex-shrink-0"
                  style={{ minWidth: 260, maxWidth: 260, scrollSnapAlign: 'start' }}
                >
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 w-fit ${badgeClass}`}>
                    {assessment.exam_type}
                  </span>
                  <p className="text-sm font-medium text-zinc-900 leading-snug">
                    {assessment.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Last accessed {relativeTime(lastAccessedAt)}
                  </p>
                  <button
                    onClick={() => router.push(`/assessments/${assessment.id}?from=dashboard`)}
                    className="border border-zinc-300 text-zinc-700 text-xs font-medium rounded-md px-4 py-2 w-full mt-1 hover:bg-zinc-50 transition-colors"
                  >
                    View Analysis
                  </button>
                </div>
              );
            })}
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
