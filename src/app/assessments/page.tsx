'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import AssessmentFilterBar, { type FilterState } from '@/components/assessment/AssessmentFilterBar';
import { getCardStatus, mockAssessments, mockProgressMap, mockUser } from '@/utils/assessmentUtils';
import type { AssessmentType, Exam } from '@/types';

export default function AssessmentsPage() {
  const [selectedExam, setSelectedExam] = useState<Exam | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AssessmentType | 'all'>('all');

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
    // Light mode page — bg-zinc-50 per design-system.md
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Page header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900">Assessment Library</h1>
          <p className="text-sm text-zinc-500">
            Logged in as <span className="font-medium text-zinc-700">{mockUser.name}</span>
            {' · '}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-600 text-white capitalize">
              {mockUser.tier}
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
            <p className="text-sm text-zinc-500 mt-1">
              Try adjusting the filters above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((assessment) => {
              const progress = mockProgressMap[assessment.id] ?? null;
              const status = getCardStatus(assessment, progress, mockUser.tier);
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
