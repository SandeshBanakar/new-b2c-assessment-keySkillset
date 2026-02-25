'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Trophy } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { ASSESSMENT_LIBRARY } from '@/data/assessments';
import SubscribeModal from './SubscribeModal';
import type { LibraryAssessment } from '@/data/assessments';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Tier access helper
// -------------------------------------------------------

function tierAllowsType(tier: Tier, type: LibraryAssessment['type']): boolean {
  switch (tier) {
    case 'free':         return false;
    case 'basic':        return type === 'full-test';
    case 'professional': return type === 'full-test' || type === 'subject-test';
    case 'premium':      return true;
  }
}

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
// Library card
// -------------------------------------------------------

function LibraryCard({
  assessment,
  isAccessible,
  isAlreadySubscribed,
  onSubscribeClick,
}: {
  assessment: LibraryAssessment;
  isAccessible: boolean;
  isAlreadySubscribed: boolean;
  onSubscribeClick: (a: LibraryAssessment) => void;
}) {
  const router = useRouter();

  return (
    <div className="relative bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex flex-col overflow-hidden">
      {/* Lock badge */}
      {!isAccessible && (
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-zinc-100 text-zinc-500 rounded-full px-2 py-1 text-xs">
          <Lock className="w-3 h-3" />
          Locked
        </span>
      )}

      {/* Badges */}
      <div className="flex items-center flex-wrap gap-1.5 pr-16">
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

      {/* CTA buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {/* Primary — always shown */}
        <button
          onClick={() => router.push(`/assessments/${assessment.id}`)}
          className="w-full text-sm font-medium rounded-md px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white transition-colors"
        >
          Take Free Test
        </button>

        {/* Secondary — conditional */}
        {isAlreadySubscribed ? null : isAccessible ? (
          <button
            onClick={() => onSubscribeClick(assessment)}
            className="w-full text-sm font-medium rounded-md px-4 py-2 border border-blue-700 text-blue-700 bg-white hover:bg-blue-50 transition-colors"
          >
            Subscribe Now
          </button>
        ) : (
          <button
            onClick={() => router.push('/plans')}
            className="w-full text-sm font-medium rounded-md px-4 py-2 border border-zinc-300 text-zinc-500 bg-white hover:bg-zinc-50 transition-colors"
          >
            Upgrade to Access
          </button>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Main section
// -------------------------------------------------------

export default function AssessmentLibrarySection() {
  const { user, isSubscribed, subscribeVersion } = useAppContext();
  // subscribeVersion read to trigger re-render on subscribe
  void subscribeVersion;

  const [examFilter, setExamFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<LibraryAssessment['type']>('full-test');
  const [pendingSubscribe, setPendingSubscribe] = useState<LibraryAssessment | null>(null);

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
          {libraryItems.map((assessment) => (
            <LibraryCard
              key={assessment.id}
              assessment={assessment}
              isAccessible={tierAllowsType(tier, assessment.type)}
              isAlreadySubscribed={isSubscribed(assessment.id)}
              onSubscribeClick={setPendingSubscribe}
            />
          ))}
        </div>
      )}

      {/* Subscribe modal */}
      {pendingSubscribe && (
        <SubscribeModal
          assessment={pendingSubscribe}
          onClose={() => setPendingSubscribe(null)}
        />
      )}
    </section>
  );
}
