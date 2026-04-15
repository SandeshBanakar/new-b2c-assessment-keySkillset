'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAssessments } from '@/hooks/useAssessments';
import { useUserAttempts, DEFAULT_ATTEMPT } from '@/hooks/useUserAttempts';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import type { SupabaseAssessment } from '@/types/assessment';
import type { MockAttemptData } from '@/data/mockAttempts';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

type ActiveType = 'full-test' | 'subject-test' | 'chapter-test';

const TYPE_LABELS: Record<ActiveType, string> = {
  'full-test':    'Full Tests',
  'subject-test': 'Subject Tests',
  'chapter-test': 'Chapter Tests',
};

// Sort order for exam sections (alphabetical by display name)
const EXAM_SORT_ORDER = ['CLAT', 'IIT-JEE', 'NEET', 'PMP', 'SAT'];

// -------------------------------------------------------
// Per-exam category section
// -------------------------------------------------------

function ExamCategorySection({
  examType,
  items,
  attemptsMap,
  userTier,
  typeLabel,
}: {
  examType: string;
  items: SupabaseAssessment[];
  attemptsMap: Map<string, MockAttemptData>;
  userTier: Tier;
  typeLabel: string;
}) {
  const [showAll, setShowAll] = useState(false);

  const count     = items.length;
  const displayed = showAll ? items : items.slice(0, 4);
  const hasMore   = count > 4;

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-zinc-900">{examType}</h2>
        <span className="bg-zinc-100 text-zinc-500 text-xs px-2.5 py-1 rounded-full">
          {count} {count === 1 ? 'assessment' : 'assessments'}
        </span>
      </div>

      {/* Empty state */}
      {count === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-md py-8 text-center">
          <p className="text-sm text-zinc-500">
            No {examType} {typeLabel.toLowerCase()} match your current filters.
          </p>
        </div>
      )}

      {/* Card grid */}
      {count > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                attemptData={attemptsMap.get(assessment.id) ?? DEFAULT_ATTEMPT}
                userTier={userTier}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 text-blue-600 text-sm font-medium cursor-pointer hover:underline"
            >
              {showAll ? 'Show less' : `Show all ${count} →`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------
// Main section
// -------------------------------------------------------

export default function AssessmentLibrarySection() {
  const { user } = useAppContext();
  const { assessments, loading, error } = useAssessments();
  const { attemptsMap, loading: attemptsLoading } = useUserAttempts(user?.id);

  const [activeType,       setActiveType]       = useState<ActiveType>('full-test');
  const [selectedExam,     setSelectedExam]     = useState<string>('all');
  const [selectedProgress, setSelectedProgress] = useState<string>('all');

  if (!user) return null;

  const tier      = user.subscriptionTier;
  const userId    = user.id;
  const isPremium = tier === 'premium';

  if (loading || attemptsLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-24">
      <p className="text-sm text-rose-600 font-medium">Failed to load assessments.</p>
      <p className="text-xs text-zinc-400 mt-1">Please refresh the page.</p>
    </div>
  );

  // ── Filter by active type ─────────────────────────────────────────────────
  const filteredByType = assessments.filter(
    (a) => a.assessment_type === activeType,
  );

  // ── Derive unique exam groups, sorted ────────────────────────────────────
  const examsWithType = [
    ...new Set(filteredByType.map((a) => a.exam_type)),
  ].sort((a, b) => {
    const ai = EXAM_SORT_ORDER.indexOf(a);
    const bi = EXAM_SORT_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Apply exam dropdown filter
  const visibleExams =
    selectedExam !== 'all'
      ? examsWithType.filter((e) => e === selectedExam)
      : examsWithType;

  // ── Apply progress filter per exam section ────────────────────────────────
  const examSections = visibleExams.map((examType) => {
    let items = filteredByType.filter((a) => a.exam_type === examType);

    if (selectedProgress !== 'all') {
      items = items.filter((a) => {
        const attempt = attemptsMap.get(a.id) ?? DEFAULT_ATTEMPT;
        const status  = attempt.status;
        if (selectedProgress === 'not-started' && status !== 'not_started') return false;
        if (selectedProgress === 'in-progress'  && status !== 'inprogress')  return false;
        if (selectedProgress === 'completed'    && status !== 'completed')   return false;
        return true;
      });
    }

    return { examType, items };
  });

  const typeLabel = TYPE_LABELS[activeType];

  // ── All unique exam options for the dropdown ─────────────────────────────
  const allExamOptions = [
    ...new Set(assessments.map((a) => a.exam_type)),
  ].sort((a, b) => {
    const ai = EXAM_SORT_ORDER.indexOf(a);
    const bi = EXAM_SORT_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // -------------------------------------------------------
  return (
    <div>
      {/* ── Heading row ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Assessment Library</h1>
        {isPremium && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium ml-3 inline-flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Premium Member
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-600 mt-1 mb-6">
        Practice at every level — full tests, subjects, and chapters.
      </p>

      {/* ── Type tabs (ROW 1) ────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(TYPE_LABELS) as ActiveType[]).map((type) => {
          const active = type === activeType;
          return (
            <button
              key={type}
              onClick={() => {
                setActiveType(type as ActiveType);
                setSelectedExam('all');
                setSelectedProgress('all');
              }}
              className={
                active
                  ? 'bg-white border border-blue-300 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm'
                  : 'text-zinc-500 px-4 py-1.5 text-sm hover:text-zinc-700 cursor-pointer rounded-full'
              }
            >
              {TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* ── Dropdown filters (ROW 2) ─────────────────────────── */}
      <div className="mt-3 mb-6 flex items-center gap-3 flex-wrap">
        {/* Exam dropdown */}
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-35 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
        >
          <option value="all">All Exams</option>
          {allExamOptions.map((exam) => (
            <option key={exam} value={exam}>{exam}</option>
          ))}
        </select>

        {/* Progress dropdown */}
        <select
          value={selectedProgress}
          onChange={(e) => setSelectedProgress(e.target.value)}
          className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-700 min-w-35 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
        >
          <option value="all">All Progress</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* ── Category sections ────────────────────────────────── */}
      {examSections.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-md py-8 text-center mt-6">
          <p className="text-sm text-zinc-500">
            No {typeLabel.toLowerCase()} match your current filters.
          </p>
        </div>
      ) : (
        examSections.map(({ examType, items }) => (
          <ExamCategorySection
            key={examType}
            examType={examType}
            items={items}
            attemptsMap={attemptsMap}
            userTier={tier}
            typeLabel={typeLabel}
          />
        ))
      )}
    </div>
  );
}
