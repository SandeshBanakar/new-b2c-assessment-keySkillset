'use client';

import { Zap } from 'lucide-react';

interface ConceptMastery {
  concept_tag: string;
  correct_count: number;
  total_count: number;
  mastery_percent: number | null;
}

interface Props {
  conceptMastery: ConceptMastery[];
  totalQuestions: number | null;
  isFullTest: boolean;
  attemptNumber: number;
}

const SAT_MATH_DOMAIN: Record<string, string> = {
  'Linear equations and inequalities': 'Algebra',
  'Systems of linear equations': 'Algebra',
  'Quadratic equations': 'Advanced Math',
  'Polynomial expressions and functions': 'Advanced Math',
  'Ratios, rates, and proportions': 'Problem Solving',
  'Probability': 'Problem Solving',
  'Properties of lines, angles, triangles, and circles': 'Geometry',
  'Coordinate geometry': 'Geometry',
};
const SAT_RW_DOMAIN: Record<string, string> = {
  'Central ideas and themes': 'Information & Ideas',
  'Reading comprehension': 'Information & Ideas',
  'Evidence-based questions': 'Information & Ideas',
  'Sentence structure': 'Standard English',
  'Punctuation': 'Standard English',
  'Transition words and logical flow': 'Expression of Ideas',
  'Concision': 'Expression of Ideas',
};

function impactScore(mastery: number, totalCount: number, isFullTest: boolean): number {
  const multiplier = isFullTest ? 12 : 14;
  return Math.min(50, Math.round((0.9 - mastery / 100) * totalCount * multiplier));
}

export default function SATLeveragePanel({
  conceptMastery,
  totalQuestions,
  isFullTest,
  attemptNumber,
}: Props) {
  const leveraged = conceptMastery
    .filter((m) => m.mastery_percent !== null && m.total_count > 0)
    .map((m) => ({
      ...m,
      impact: impactScore(m.mastery_percent!, m.total_count, isFullTest),
    }))
    .filter((m) => m.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  if (leveraged.length === 0) return null;

  return (
    <div className="bg-zinc-900 shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-base font-medium text-white">Leverage Points</h3>
        <span className="ml-auto text-xs text-zinc-500">Attempt {attemptNumber}</span>
      </div>
      <p className="text-xs text-zinc-400 mb-5">
        Fix these concepts for the biggest score jump
      </p>

      <div className="space-y-4">
        {leveraged.map((m, idx) => {
          const mastery = Math.round(m.mastery_percent!);
          const domain  = SAT_MATH_DOMAIN[m.concept_tag] ?? SAT_RW_DOMAIN[m.concept_tag] ?? '';

          return (
            <div key={m.concept_tag} className="relative">
              {/* Rank circle */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-white leading-snug">{m.concept_tag}</p>
                      {domain && <p className="text-xs text-zinc-500 mt-0.5">{domain}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
                        +{m.impact} pts
                      </span>
                    </div>
                  </div>

                  {/* Mastery bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-rose-400 transition-all"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-10 text-right shrink-0">
                      {mastery}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {m.correct_count}/{m.total_count} correct
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
