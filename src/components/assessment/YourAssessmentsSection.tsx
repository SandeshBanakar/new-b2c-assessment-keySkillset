'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAssessments } from '@/hooks/useAssessments';
import { getAttemptData } from '@/data/mockAttempts';
import AssessmentCard from '@/components/assessment/AssessmentCard';

export default function YourAssessmentsSection() {
  const { user } = useAppContext();
  const { assessments } = useAssessments();

  const [examFilter,   setExamFilter]   = useState<string>('all');
  const [typeFilter,   setTypeFilter]   = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!user) return null;

  // Show assessments with any activity (attempted or in progress)
  const active = assessments.filter((a) => {
    const attempt = getAttemptData(user.id, a.title);
    return attempt.attemptsUsed > 0 || attempt.status !== 'not_started';
  });

  // Apply filters
  const filtered = active.filter((a) => {
    if (examFilter !== 'all' && a.exam_type !== examFilter) return false;
    if (typeFilter !== 'all' && a.assessment_type !== typeFilter) return false;
    if (statusFilter !== 'all') {
      const s = getAttemptData(user.id, a.title).status;
      if (statusFilter === 'not_started' && s !== 'not_started') return false;
      if (statusFilter === 'in_progress'  && s !== 'inprogress')  return false;
      if (statusFilter === 'completed'    && s !== 'completed')   return false;
    }
    return true;
  });

  const hasActive = active.length > 0;

  return (
    <section className="mt-6">
      {/* Heading */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-medium text-zinc-900">Your Assessments</h2>
        <span className="text-sm text-zinc-500">
          {active.length} {active.length === 1 ? 'assessment' : 'assessments'}
        </span>
      </div>

      {/* Filter row — only if user has active assessments */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-3 mt-3 mb-4">
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-35 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            <option value="all">All Exams</option>
            <option value="SAT">SAT</option>
            <option value="IIT-JEE">IIT-JEE</option>
            <option value="NEET">NEET</option>
            <option value="PMP">PMP</option>
            <option value="CLAT">CLAT</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-35 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            <option value="all">All Types</option>
            <option value="full_test">Full Test</option>
            <option value="subject_test">Subject Test</option>
            <option value="chapter_test">Chapter Test</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-35 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
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
            Take a free test from the library below to get started.
          </p>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              attemptData={getAttemptData(user.id, assessment.title)}
              userTier={user.subscriptionTier}
            />
          ))}
        </div>
      )}
    </section>
  );
}
