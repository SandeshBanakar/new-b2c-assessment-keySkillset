'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import {
  ASSESSMENT_LIBRARY,
  SUBSCRIBED_ASSESSMENTS,
  DEMO_ATTEMPT_STATES,
} from '@/data/assessments';
import AssessmentCard, {
  deriveCardState,
  type CardState,
} from '@/components/assessment/AssessmentCard';
import type { LibraryAssessment, DemoAttemptState } from '@/data/assessments';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

type ActiveType = LibraryAssessment['type'];
type ExamKey   = LibraryAssessment['exam'];

const TYPE_LABELS: Record<ActiveType, string> = {
  'full-test':    'Full Tests',
  'subject-test': 'Subject Tests',
  'chapter-test': 'Chapter Tests',
};

// Display names shown in section headers and empty states
const EXAM_DISPLAY: Record<string, string> = {
  SAT:  'SAT',
  JEE:  'IIT-JEE',
  NEET: 'NEET',
  PMP:  'PMP',
  CLAT: 'CLAT',
};

// Sort order for exam sections (alphabetical by display name)
const EXAM_SORT_ORDER: ExamKey[] = ['JEE', 'NEET', 'PMP', 'SAT'];

// -------------------------------------------------------
// Progress group helper
// -------------------------------------------------------

function progressGroup(state: CardState): 'not-started' | 'in-progress' | 'completed' {
  if (state === 5) return 'in-progress';
  if (state === 6 || state === 7) return 'completed';
  return 'not-started'; // states 1, 2, 3, 4
}

// -------------------------------------------------------
// Enriched assessment type (pre-computed per render)
// -------------------------------------------------------

type EnrichedItem = {
  assessment: LibraryAssessment;
  isSubscribed: boolean;
  attemptsUsed: number;
  freeAttemptUsed: boolean;
  status: DemoAttemptState['status'];
  cardState: CardState;
};

// -------------------------------------------------------
// Per-exam category section (owns its own showAll state)
// -------------------------------------------------------

function ExamCategorySection({
  exam,
  items,
  userTier,
  typeLabel,
}: {
  exam: ExamKey;
  items: EnrichedItem[];
  userTier: Tier;
  typeLabel: string;
}) {
  const [showAll, setShowAll] = useState(false);

  const displayName = EXAM_DISPLAY[exam] ?? exam;
  const count       = items.length;
  const displayed   = showAll ? items : items.slice(0, 4);
  const hasMore     = count > 4;

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-zinc-900">{displayName}</h2>
        <span className="bg-zinc-100 text-zinc-500 text-xs px-2.5 py-1 rounded-full">
          {count} {count === 1 ? 'assessment' : 'assessments'}
        </span>
      </div>

      {/* Empty state */}
      {count === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-xl py-8 text-center">
          <p className="text-sm text-zinc-500">
            No {displayName} {typeLabel.toLowerCase()} match your current filters.
          </p>
        </div>
      )}

      {/* Card grid */}
      {count > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map(({ assessment, isSubscribed, attemptsUsed, freeAttemptUsed, status }) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                userTier={userTier}
                isSubscribed={isSubscribed}
                attemptsUsed={attemptsUsed}
                freeAttemptUsed={freeAttemptUsed}
                status={status}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 text-violet-600 text-sm font-medium cursor-pointer hover:underline"
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

  const [activeType,       setActiveType]       = useState<ActiveType>('full-test');
  const [selectedExam,     setSelectedExam]     = useState<string>('all');
  const [selectedProgress, setSelectedProgress] = useState<string>('all');

  if (!user) return null;

  const tier      = user.subscriptionTier;
  const userId    = user.id;
  const isPremium = tier === 'premium';

  // ── Enrich every assessment with derived card state ──────────────────────
  const enriched: EnrichedItem[] = ASSESSMENT_LIBRARY.map((assessment) => {
    const isSubscribed   = (SUBSCRIBED_ASSESSMENTS[userId] ?? []).includes(assessment.id);
    const state          = DEMO_ATTEMPT_STATES[userId]?.[assessment.id];
    const attemptsUsed   = state?.attemptsUsed   ?? 0;
    const freeAttemptUsed = state?.freeAttemptUsed ?? false;
    const status         = state?.status          ?? 'not_started';
    const cardState      = deriveCardState({
      userTier: tier,
      assessmentType: assessment.type,
      isSubscribed,
      attemptsUsed,
      freeAttemptUsed,
      status,
    });
    return { assessment, isSubscribed, attemptsUsed, freeAttemptUsed, status, cardState };
  });

  // ── Determine which exams to show (have ≥1 assessment of activeType) ────
  const examsWithType = [
    ...new Set(
      ASSESSMENT_LIBRARY.filter((a) => a.type === activeType).map((a) => a.exam),
    ),
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

  // ── Build per-section item lists (applying progress filter) ───────────────
  const examSections = visibleExams.map((exam) => {
    const items = enriched.filter((item) => {
      if (item.assessment.type  !== activeType) return false;
      if (item.assessment.exam  !== exam)       return false;
      if (selectedProgress !== 'all') {
        const pg = progressGroup(item.cardState);
        if (selectedProgress === 'not-started' && pg !== 'not-started') return false;
        if (selectedProgress === 'in-progress'  && pg !== 'in-progress')  return false;
        if (selectedProgress === 'completed'    && pg !== 'completed')    return false;
      }
      return true;
    });
    return { exam, items };
  });

  const typeLabel = TYPE_LABELS[activeType];

  // -------------------------------------------------------
  return (
    <div>
      {/* ── Heading row ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-zinc-900">Assessment Library</h1>
        {isPremium && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium ml-3 inline-flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Premium Member
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500 mt-1 mb-6">
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
                setActiveType(type);
                setSelectedExam('all');
                setSelectedProgress('all');
              }}
              className={
                active
                  ? 'bg-white border border-violet-300 text-violet-700 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm'
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
          className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="all">All Exams</option>
          <option value="SAT">SAT</option>
          <option value="JEE">IIT-JEE</option>
          <option value="NEET">NEET</option>
          <option value="PMP">PMP</option>
        </select>

        {/* Progress dropdown */}
        <select
          value={selectedProgress}
          onChange={(e) => setSelectedProgress(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 min-w-[140px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="all">All Progress</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* ── Category sections ────────────────────────────────── */}
      {examSections.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl py-8 text-center mt-6">
          <p className="text-sm text-zinc-500">
            No {typeLabel.toLowerCase()} match your current filters.
          </p>
        </div>
      ) : (
        examSections.map(({ exam, items }) => (
          <ExamCategorySection
            key={exam}
            exam={exam}
            items={items}
            userTier={tier}
            typeLabel={typeLabel}
          />
        ))
      )}
    </div>
  );
}
