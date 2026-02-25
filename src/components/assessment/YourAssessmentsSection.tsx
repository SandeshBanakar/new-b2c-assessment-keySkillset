'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import {
  ASSESSMENT_LIBRARY,
  DEMO_ATTEMPT_STATES,
  SUBSCRIBED_ASSESSMENTS,
} from '@/data/assessments';
import type { LibraryAssessment } from '@/data/assessments';

// -------------------------------------------------------
// Badge helpers
// -------------------------------------------------------

const EXAM_BADGE: Record<LibraryAssessment['exam'], string> = {
  SAT:  'bg-blue-100 text-blue-700',
  JEE:  'bg-amber-100 text-amber-700',
  NEET: 'bg-emerald-100 text-emerald-700',
  PMP:  'bg-violet-100 text-violet-700',
};

const TYPE_LABEL: Record<LibraryAssessment['type'], string> = {
  'full-test':    'Full Test',
  'subject-test': 'Subject Test',
  'chapter-test': 'Chapter Test',
};

const DIFF_BADGE: Record<LibraryAssessment['difficulty'], string> = {
  easy:   'bg-emerald-50 text-emerald-600',
  medium: 'bg-amber-50 text-amber-600',
  hard:   'bg-rose-50 text-rose-600',
};

// -------------------------------------------------------
// Subscribed assessment card
// -------------------------------------------------------

function SubscribedCard({ assessment, userId }: { assessment: LibraryAssessment; userId: string }) {
  const router = useRouter();
  const state = DEMO_ATTEMPT_STATES[userId]?.[assessment.id] ?? {
    attemptsUsed: 0,
    status: 'not_started' as const,
  };
  const { attemptsUsed, status } = state;
  const allUsed = attemptsUsed >= 5;
  const fillPct = (attemptsUsed / 5) * 100;

  let ctaLabel: string;
  let ctaClass: string;
  if (allUsed) {
    ctaLabel = 'View Analysis';
    ctaClass = 'border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50';
  } else if (status === 'in_progress') {
    ctaLabel = 'Continue Test';
    ctaClass = 'bg-blue-700 hover:bg-blue-800 text-white';
  } else if (status === 'completed') {
    ctaLabel = 'Retake';
    ctaClass = 'border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50';
  } else {
    ctaLabel = 'Start Now';
    ctaClass = 'bg-blue-700 hover:bg-blue-800 text-white';
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex flex-col">
      {/* Badges */}
      <div className="flex items-center flex-wrap gap-1.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EXAM_BADGE[assessment.exam]}`}>
          {assessment.exam}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
          {TYPE_LABEL[assessment.type]}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFF_BADGE[assessment.difficulty]}`}>
          {assessment.difficulty}
        </span>
      </div>

      {/* Title */}
      <p className="text-base font-semibold text-zinc-900 mt-2">{assessment.title}</p>

      {/* Meta */}
      <p className="text-sm text-zinc-500 mt-1">
        {assessment.questions} questions · {assessment.durationLabel}
      </p>

      {/* Attempts progress */}
      <div className="mt-3">
        <p className={`text-xs mt-1 ${allUsed ? 'text-rose-500' : 'text-zinc-500'}`}>
          {allUsed ? 'All attempts used' : `${attemptsUsed} / 5 attempts used`}
        </p>
        <div className="bg-zinc-100 rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full ${allUsed ? 'bg-rose-400' : 'bg-blue-600'}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Status badge */}
      {status === 'in_progress' && (
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
          In Progress
        </span>
      )}
      {status === 'completed' && (
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          Completed
        </span>
      )}

      {/* CTA */}
      <button
        onClick={() => router.push(`/assessments/${assessment.id}`)}
        className={`mt-4 w-full text-sm font-medium rounded-md px-4 py-2 transition-colors ${ctaClass}`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

// -------------------------------------------------------
// Main section
// -------------------------------------------------------

export default function YourAssessmentsSection() {
  const router = useRouter();
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
      const status = state?.status ?? 'not_started';
      if (statusFilter === 'not_started' && status !== 'not_started') return false;
      if (statusFilter === 'in_progress' && status !== 'in_progress') return false;
      if (statusFilter === 'completed' && status !== 'completed') return false;
    }
    return true;
  });

  const isFree = user.subscriptionTier === 'free';
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
            Browse the library below and subscribe to start practicing
          </p>

          {/* Upgrade nudge for free users */}
          {isFree && (
            <div className="bg-blue-50 border border-blue-100 rounded-md px-5 py-4 mt-4 max-w-md w-full text-left">
              <p className="flex items-center gap-1.5 text-sm font-medium text-blue-900">
                <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Upgrade your plan to subscribe to assessments
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Free users can take one free attempt from the library. Upgrade to subscribe and
                unlock 5 full attempts per assessment.
              </p>
              <Button
                onClick={() => router.push('/plans')}
                className="mt-3 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md px-4 py-2 h-auto"
              >
                Compare Plans →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((assessment) => (
            <SubscribedCard
              key={assessment.id}
              assessment={assessment}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
