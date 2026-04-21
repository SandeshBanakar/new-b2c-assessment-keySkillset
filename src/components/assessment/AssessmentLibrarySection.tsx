'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAssessments } from '@/hooks/useAssessments';
import { useUserAttempts, DEFAULT_ATTEMPT } from '@/hooks/useUserAttempts';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import type { SupabaseAssessment } from '@/types/assessment';
import type { MockAttemptData } from '@/data/mockAttempts';
import type { Tier, ActivePlanInfo } from '@/types';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

type ActiveType = 'full-test' | 'subject-test' | 'chapter-test';

const TYPE_LABELS: Record<ActiveType, string> = {
  'full-test':    'Full Tests',
  'subject-test': 'Subject Tests',
  'chapter-test': 'Chapter Tests',
};

// -------------------------------------------------------
// Per-exam category section
// -------------------------------------------------------

function ExamCategorySection({
  examDisplayName,
  items,
  attemptsMap,
  userTier,
  typeLabel,
  activePlanInfo,
}: {
  examDisplayName: string;
  items: SupabaseAssessment[];
  attemptsMap: Map<string, MockAttemptData>;
  userTier: Tier;
  typeLabel: string;
  activePlanInfo?: ActivePlanInfo | null;
}) {
  const [showAll, setShowAll] = useState(false);

  const count     = items.length;
  const displayed = showAll ? items : items.slice(0, 4);
  const hasMore   = count > 4;

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-zinc-900">{examDisplayName}</h2>
        <span className="bg-zinc-100 text-zinc-500 text-xs px-2.5 py-1 rounded-full">
          {count} {count === 1 ? 'assessment' : 'assessments'}
        </span>
      </div>

      {/* Empty state */}
      {count === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-md py-8 text-center">
          <p className="text-sm text-zinc-500">
            No {examDisplayName} {typeLabel.toLowerCase()} match your current filters.
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
                activePlanInfo={activePlanInfo}
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

type ExamGroup = { name: string; displayName: string; displayOrder: number }

function buildExamGroups(assessments: SupabaseAssessment[]): ExamGroup[] {
  const map = new Map<string, ExamGroup>()
  for (const a of assessments) {
    const key = a.exam_categories?.name ?? 'Other'
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        displayName: a.exam_categories?.display_name ?? key,
        displayOrder: a.exam_categories?.display_order ?? 999,
      })
    }
  }
  return [...map.values()].sort((a, b) => a.displayOrder - b.displayOrder)
}

export default function AssessmentLibrarySection() {
  const { user } = useAppContext();
  const { assessments, loading, error } = useAssessments();
  const { attemptsMap, loading: attemptsLoading } = useUserAttempts(user?.id);

  const [activeType,       setActiveType]       = useState<ActiveType>('full-test');
  const [selectedExam,     setSelectedExam]     = useState<string>('all');
  const [selectedProgress, setSelectedProgress] = useState<string>('all');

  if (!user) return null;

  const tier           = user.subscriptionTier;
  const isPremium      = tier === 'premium';
  const activePlanInfo = user.activePlanInfo ?? null;

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

  // Filter out inactive exam categories, then filter by assessment type
  const activeAssessments = assessments.filter(a => a.exam_categories?.is_active !== false);
  const filteredByType    = activeAssessments.filter(a => a.assessment_type === activeType);

  // Derive sorted exam groups from filtered list
  const examGroups = buildExamGroups(filteredByType);

  // Apply exam dropdown filter (by name/code)
  const visibleGroups = selectedExam !== 'all'
    ? examGroups.filter(g => g.name === selectedExam)
    : examGroups;

  // Apply progress filter per exam section
  const examSections = visibleGroups.map(({ name, displayName }) => {
    let items = filteredByType.filter(a => (a.exam_categories?.name ?? 'Other') === name);

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

    return { examDisplayName: displayName, items };
  });

  const typeLabel = TYPE_LABELS[activeType];

  // All unique exam options for dropdown (from all assessments, sorted by display_order)
  const allExamOptions = buildExamGroups(activeAssessments);

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
          {allExamOptions.map((g) => (
            <option key={g.name} value={g.name}>{g.displayName}</option>
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
        examSections.map(({ examDisplayName, items }) => (
          <ExamCategorySection
            key={examDisplayName}
            examDisplayName={examDisplayName}
            items={items}
            attemptsMap={attemptsMap}
            userTier={tier}
            typeLabel={typeLabel}
            activePlanInfo={activePlanInfo}
          />
        ))
      )}
    </div>
  );
}
