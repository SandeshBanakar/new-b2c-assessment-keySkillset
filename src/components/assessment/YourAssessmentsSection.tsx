'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import {
  ASSESSMENT_LIBRARY,
  DEMO_ATTEMPT_STATES,
  SUBSCRIBED_ASSESSMENTS,
} from '@/data/assessments';
import AssessmentCard from '@/components/assessment/AssessmentCard';

export default function YourAssessmentsSection() {
  const { user, subscribeVersion } = useAppContext();
  // subscribeVersion read to trigger re-render on subscribe
  void subscribeVersion;

  const [examFilter, setExamFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!user) return null;

  const subscribedIds = SUBSCRIBED_ASSESSMENTS[user.id] ?? [];
  const subscribedAssessments = ASSESSMENT_LIBRARY.filter((a) =>
    subscribedIds.includes(a.id),
  );

  // Apply filters
  const filtered = subscribedAssessments.filter((a) => {
    if (examFilter !== 'all' && a.exam !== examFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (statusFilter !== 'all') {
      const state = DEMO_ATTEMPT_STATES[user.id]?.[a.id];
      const s = state?.status ?? 'not_started';
      if (statusFilter === 'not_started' && s !== 'not_started') return false;
      if (statusFilter === 'in_progress' && s !== 'in_progress') return false;
      if (statusFilter === 'completed' && s !== 'completed') return false;
    }
    return true;
  });

  const hasSubscribed = subscribedIds.length > 0;

  return (
    <section className="mt-6">
      {/* Heading */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-xl font-semibold text-zinc-900">Your Assessments</h2>
        <span className="text-sm text-zinc-500">
          {subscribedIds.length} {subscribedIds.length === 1 ? 'assessment' : 'assessments'}
        </span>
      </div>

      {/* Filter row — only if user has subscribed assessments */}
      {hasSubscribed && (
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
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            <option value="all">All Types</option>
            <option value="full-test">Full Test</option>
            <option value="subject-test">Subject Test</option>
            <option value="chapter-test">Chapter Test</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-10 flex flex-col items-center text-center">
          <ClipboardList className="w-8 h-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500 mt-3">No assessments yet</p>
          <p className="text-xs text-zinc-400 mt-1">
            Take a free test from the library below, or upgrade to subscribe.
          </p>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((assessment) => {
            const state = DEMO_ATTEMPT_STATES[user.id]?.[assessment.id];
            return (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                userTier={user.subscriptionTier}
                isSubscribed={true}
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
