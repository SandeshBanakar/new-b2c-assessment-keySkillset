'use client';

import type { MIAttemptAnswer } from './MistakeIntelligence';

interface ConceptMastery {
  concept_tag: string;
  attempt_number: number;
  correct_count: number;
  total_count: number;
  mastery_percent: number | null;
}

interface LeverageActionsProps {
  conceptMastery: ConceptMastery[];
  selectedAttemptNum: number;
  attemptAnswers: MIAttemptAnswer[] | null; // null = not yet loaded (fallback mode)
  exam: string;
  negMark: number;
}

const EXAM_SECTION_COLOR: Record<string, string> = {
  NEET: 'bg-emerald-100 text-emerald-700',
  JEE:  'bg-blue-100 text-blue-700',
  CLAT: 'bg-violet-100 text-violet-700',
};

function sectionBadgeClass(exam: string): string {
  return EXAM_SECTION_COLOR[exam] ?? 'bg-zinc-100 text-zinc-600';
}

interface LeverageItem {
  conceptTag: string;
  marksLost: number | null;
  masteryPct: number | null;
  questionsToRecover: number;
  timeInsight: string;
}

function computeRichPath(
  mastery: ConceptMastery[],
  attemptNum: number,
  answers: MIAttemptAnswer[],
): LeverageItem[] {
  // Group answers by concept_tag
  const byTag = new Map<string, MIAttemptAnswer[]>();
  for (const a of answers) {
    if (!a.concept_tag) continue;
    const existing = byTag.get(a.concept_tag) ?? [];
    byTag.set(a.concept_tag, [...existing, a]);
  }

  const selMastery = mastery.filter((m) => m.attempt_number === attemptNum);

  const items: LeverageItem[] = selMastery.map((m) => {
    const tagAnswers = byTag.get(m.concept_tag) ?? [];
    const wrongAnswers = tagAnswers.filter((a) => !a.is_correct && !a.is_skipped);
    const totalMarksLost = wrongAnswers.length; // 1 mark lost per wrong (before neg deduction; kept simple)

    // Time insight
    const avgTime = tagAnswers.length > 0
      ? tagAnswers.reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0) / tagAnswers.length
      : 0;
    const wrongAvgTime = wrongAnswers.length > 0
      ? wrongAnswers.reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0) / wrongAnswers.length
      : 0;

    let timeInsight = '📖 Review this concept';
    if (wrongAnswers.length > 0) {
      if (wrongAvgTime < avgTime * 0.5) timeInsight = '⚡ Likely careless — slow down and verify';
      else if (wrongAvgTime > avgTime * 1.2) timeInsight = '🧩 Concept gap — needs targeted revision';
    }

    return {
      conceptTag: m.concept_tag,
      marksLost: totalMarksLost,
      masteryPct: m.mastery_percent,
      questionsToRecover: wrongAnswers.length,
      timeInsight,
    };
  });

  return items
    .filter((i) => (i.marksLost ?? 0) > 0)
    .sort((a, b) => (b.marksLost ?? 0) - (a.marksLost ?? 0))
    .slice(0, 3);
}

function computeFallbackPath(
  mastery: ConceptMastery[],
  attemptNum: number,
): LeverageItem[] {
  const selMastery = mastery.filter((m) => m.attempt_number === attemptNum);
  return selMastery
    .filter((m) => (m.mastery_percent ?? 100) < 80)
    .sort((a, b) => (a.mastery_percent ?? 0) - (b.mastery_percent ?? 0))
    .slice(0, 3)
    .map((m) => ({
      conceptTag: m.concept_tag,
      marksLost: null,
      masteryPct: m.mastery_percent,
      questionsToRecover: Math.round(m.total_count * (1 - (m.mastery_percent ?? 0) / 100)),
      timeInsight: '📖 Review this concept',
    }));
}

export default function LeverageActions({
  conceptMastery,
  selectedAttemptNum,
  attemptAnswers,
  exam,
  negMark,
}: LeverageActionsProps) {
  const hasAnswers = attemptAnswers !== null && attemptAnswers.length > 0;
  const items = hasAnswers
    ? computeRichPath(conceptMastery, selectedAttemptNum, attemptAnswers!)
    : computeFallbackPath(conceptMastery, selectedAttemptNum);

  if (items.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-md p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">Leverage Actions</h3>
        <p className="text-xs text-zinc-400">
          No weak concepts found for this attempt — all concepts are above 80% mastery.
        </p>
      </div>
    );
  }

  const totalRecoverable = items.reduce((s, i) => s + (i.marksLost ?? 0), 0);
  const totalWithNeg = negMark > 0 ? totalRecoverable * (1 + negMark) : totalRecoverable;
  const badgeClass = sectionBadgeClass(exam);

  return (
    <div className="bg-white shadow-sm rounded-md p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Leverage Actions</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Highest-ROI concepts to fix first</p>
        </div>
        {hasAnswers && totalRecoverable > 0 && (
          <span className="text-xs text-rose-600 bg-rose-50 rounded-full px-2.5 py-1 font-medium shrink-0">
            Fix these 3 → recover ~{Math.round(totalWithNeg)} marks
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div
            key={item.conceptTag}
            className="border border-zinc-100 rounded-md p-4 relative"
          >
            {/* Rank badge */}
            <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-zinc-800 text-white text-xs flex items-center justify-center font-semibold">
              {idx + 1}
            </div>

            <p className="text-xs font-semibold text-zinc-900 mb-1.5 pr-2 leading-snug">
              {item.conceptTag}
            </p>

            <span className={`inline-block text-xs rounded-full px-2 py-0.5 mb-2 ${badgeClass}`}>
              {exam}
            </span>

            {item.marksLost !== null ? (
              <p className="text-sm font-semibold text-rose-600">
                {item.marksLost} marks lost
              </p>
            ) : (
              <p className="text-sm font-semibold text-amber-600">
                {item.masteryPct !== null ? `${Math.round(item.masteryPct)}% mastery` : '—'}
              </p>
            )}

            {item.questionsToRecover > 0 && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {item.questionsToRecover} qs to recover
              </p>
            )}

            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {item.timeInsight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
