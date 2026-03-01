'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { ASSESSMENT_LIBRARY, DEMO_ATTEMPT_STATES } from '@/data/assessments';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import type { LibraryAssessment } from '@/data/assessments';

export default function AssessmentLibrarySection() {
  const { user, isSubscribed, subscribeVersion } = useAppContext();
  // subscribeVersion read to trigger re-render on subscribe
  void subscribeVersion;

  const [examFilter, setExamFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<LibraryAssessment['type']>('full-test');

  if (!user) return null;

  const tier = user.subscriptionTier;

  // Library shows assessments NOT yet subscribed to
  const libraryItems = ASSESSMENT_LIBRARY.filter((a) => {
    if (isSubscribed(a.id)) return false;
    if (examFilter !== 'all' && a.exam !== examFilter) return false;
    if (a.type !== typeFilter) return false;
    return true;
  });

  return (
    <section className="mt-10">
      {/* Heading */}
      <div className="flex items-center flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-zinc-900">Assessment Library</h2>
        {tier === 'premium' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 ml-1">
            <Trophy className="w-3 h-3" />
            Premium Member
          </span>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mt-3 mb-4">
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
        >
          <option value="all">All Exams</option>
          <option value="SAT">SAT</option>
          <option value="JEE">JEE</option>
          <option value="NEET">NEET</option>
          <option value="PMP">PMP</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as LibraryAssessment['type'])}
          className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
        >
          <option value="full-test">Full Test</option>
          <option value="subject-test">Subject Test</option>
          <option value="chapter-test">Chapter Test</option>
        </select>
      </div>

      {/* Empty state */}
      {libraryItems.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-zinc-500">No more assessments to browse</p>
          <p className="text-xs text-zinc-400 mt-1">
            You&apos;ve subscribed to all available assessments in this category.
          </p>
        </div>
      )}

      {/* Cards grid */}
      {libraryItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraryItems.map((assessment) => {
            const state = DEMO_ATTEMPT_STATES[user.id]?.[assessment.id];
            return (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                userTier={tier}
                isSubscribed={false}
                attemptsUsed={state?.attemptsUsed ?? 0}
                freeAttemptUsed={state?.freeAttemptUsed ?? false}
                status={state?.status ?? 'not_started'}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
