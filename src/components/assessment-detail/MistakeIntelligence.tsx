'use client';

export interface MIAttemptAnswer {
  question_id: string;
  is_correct: boolean;
  is_skipped: boolean;
  time_spent_seconds: number;
  marks_awarded: number;
  concept_tag: string | null;
  section_id?: string | null;
}

type CategoryKey =
  | 'careless'
  | 'conceptGap'
  | 'panicSkip'
  | 'knowledgeSkip'
  | 'fragileCorrect'
  | 'confidentCorrect';

interface CategoryMeta {
  label: string;
  description: string;
  tip: string;
  colorClass: string;
  bgClass: string;
  icon: string;
}

const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  careless: {
    label: 'Careless Mistake',
    description: 'Wrong, but answered quickly — rushed without reading carefully.',
    tip: 'Slow down on the first read. Verify before moving on.',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
    icon: '⚡',
  },
  conceptGap: {
    label: 'Concept Gap',
    description: 'Spent time, still got it wrong — genuine knowledge gap.',
    tip: 'Add this topic to your revision list immediately.',
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
    icon: '🧩',
  },
  panicSkip: {
    label: 'Panic Skip',
    description: 'Skipped quickly — anxiety response, not knowledge.',
    tip: 'Practice timed exposure to unfamiliar question formats.',
    colorClass: 'text-violet-700',
    bgClass: 'bg-violet-50 border-violet-200',
    icon: '😰',
  },
  knowledgeSkip: {
    label: 'Knowledge Skip',
    description: "Tried and gave up — partial knowledge exists.",
    tip: "Review the underlying concept. You're close to getting it.",
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
    icon: '🔍',
  },
  fragileCorrect: {
    label: 'Fragile Correct',
    description: 'Right but very slow — will break under real exam pressure.',
    tip: "Drill this type until it's reflex. Speed it up.",
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50 border-orange-200',
    icon: '⏱️',
  },
  confidentCorrect: {
    label: 'Confident Correct',
    description: 'Correct and fast — genuinely mastered.',
    tip: "Maintain this. Don't over-revise what's already solid.",
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    icon: '✅',
  },
};

function classify(
  answers: MIAttemptAnswer[],
  globalAvg: number,
): Record<CategoryKey, number> {
  const counts: Record<CategoryKey, number> = {
    careless: 0, conceptGap: 0, panicSkip: 0,
    knowledgeSkip: 0, fragileCorrect: 0, confidentCorrect: 0,
  };

  for (const a of answers) {
    const t = a.time_spent_seconds ?? 0;
    if (a.is_skipped) {
      if (t < 15) counts.panicSkip += 1;
      else if (t > 60) counts.knowledgeSkip += 1;
    } else if (!a.is_correct) {
      if (t < globalAvg * 0.4) counts.careless += 1;
      else if (t > globalAvg * 1.2) counts.conceptGap += 1;
    } else {
      if (t > globalAvg * 1.8) counts.fragileCorrect += 1;
      else if (t < globalAvg * 0.6) counts.confidentCorrect += 1;
    }
  }
  return counts;
}

interface MistakeIntelligenceProps {
  // null = still loading; [] = loaded but empty (empty state)
  attemptAnswers: MIAttemptAnswer[] | null;
  exam: string;
  negMark: number;
}

const CATEGORY_ORDER: CategoryKey[] = [
  'careless', 'conceptGap', 'panicSkip', 'knowledgeSkip', 'fragileCorrect', 'confidentCorrect',
];

export default function MistakeIntelligence({ attemptAnswers, exam, negMark }: MistakeIntelligenceProps) {
  if (attemptAnswers === null) {
    return (
      <div className="bg-white shadow-sm rounded-md p-5">
        <div className="h-4 w-40 bg-zinc-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-50 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = attemptAnswers.length > 0;
  const totalQ = attemptAnswers.length;
  const totalTime = attemptAnswers.reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0);
  const globalAvg = totalQ > 0 ? totalTime / totalQ : 60;

  const counts = hasData
    ? classify(attemptAnswers, globalAvg)
    : { careless: 0, conceptGap: 0, panicSkip: 0, knowledgeSkip: 0, fragileCorrect: 0, confidentCorrect: 0 };

  const marksAtRisk = negMark > 0 ? (counts.careless + counts.conceptGap) * negMark : 0;

  return (
    <div className="bg-white shadow-sm rounded-md p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">Mistake Intelligence</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          How your time and outcomes combined across {exam} questions
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORY_ORDER.map((key) => {
          const meta = CATEGORY_META[key];
          const count = counts[key];
          return (
            <div key={key} className={`border rounded-md p-3 ${meta.bgClass}`}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-base">{meta.icon}</span>
                <span className={`text-xl font-semibold ${meta.colorClass}`}>
                  {hasData ? count : '—'}
                </span>
              </div>
              <p className={`text-xs font-medium ${meta.colorClass} mb-1`}>{meta.label}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{meta.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100">
        {!hasData ? (
          <p className="text-xs text-zinc-400 text-center">
            Detailed answer tracking is not available for this attempt.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>{totalQ} questions analysed</span>
            {marksAtRisk > 0 && (
              <span className="text-rose-600 font-medium">
                {counts.careless + counts.conceptGap} questions cost ~{marksAtRisk} marks
              </span>
            )}
            {counts.fragileCorrect > 0 && (
              <span className="text-orange-600">
                {counts.fragileCorrect} correct answers are fragile under exam pressure
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
