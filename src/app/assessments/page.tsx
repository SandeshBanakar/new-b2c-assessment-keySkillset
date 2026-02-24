'use client';

import { useState } from 'react';
import { CheckCircle2, SlidersHorizontal, Trophy, X } from 'lucide-react';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import AssessmentFilterBar, { type FilterState } from '@/components/assessment/AssessmentFilterBar';
import AssessmentLibraryBanner from '@/components/shared/AssessmentLibraryBanner';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { getCardStatus, mockAssessments, mockProgressMap } from '@/utils/assessmentUtils';
import { useAppContext } from '@/context/AppContext';
import type { AssessmentType, Exam } from '@/types';

function AssessmentsContent() {
  const { user } = useAppContext();
  const tier = user?.subscriptionTier ?? 'free';

  const [selectedExam, setSelectedExam] = useState<Exam | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AssessmentType | 'all'>('all');
  const [planBanner, setPlanBanner] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const msg = sessionStorage.getItem('plan_banner');
    if (msg) sessionStorage.removeItem('plan_banner');
    return msg;
  });

  function handleFilterChange({ exam, type }: FilterState) {
    setSelectedExam(exam);
    setSelectedType(type);
  }

  const filtered = mockAssessments.filter((a) => {
    if (selectedExam !== 'all' && a.exam !== selectedExam) return false;
    if (selectedType !== 'all' && a.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Plan success banner */}
        {planBanner && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {planBanner}
            </p>
            <button
              onClick={() => setPlanBanner(null)}
              className="text-emerald-500 hover:text-emerald-700 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upgrade / tier banner */}
        <AssessmentLibraryBanner />

        {/* Page header */}
        <div className="mb-6 space-y-1">
          <h1 className="flex items-center flex-wrap gap-2 text-2xl font-semibold text-zinc-900">
            Assessment Library
            {tier === 'premium' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5">
                <Trophy className="w-3 h-3" /> Premium Member
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500">
            {user?.displayName && (
              <>
                Logged in as{' '}
                <span className="font-medium text-zinc-700">{user.displayName}</span>
                {' · '}
              </>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-700 text-white capitalize">
              {tier}
            </span>
          </p>
        </div>

        {/* Filter bar */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-zinc-900">Filter</h2>
          </div>
          <AssessmentFilterBar
            selectedExam={selectedExam}
            selectedType={selectedType}
            onChange={handleFilterChange}
          />
        </section>

        {/* Results count */}
        <p className="text-sm text-zinc-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'assessment' : 'assessments'} found
        </p>

        {/* Assessment grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-base font-semibold text-zinc-900">No assessments found</p>
            <p className="text-sm text-zinc-500 mt-1">Try adjusting the filters above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((assessment) => {
              const progress = mockProgressMap[assessment.id] ?? null;
              const status = getCardStatus(assessment, progress, tier);
              return (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  progress={progress}
                  status={status}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  return (
    <AuthGuard>
      <AssessmentsContent />
    </AuthGuard>
  );
}
