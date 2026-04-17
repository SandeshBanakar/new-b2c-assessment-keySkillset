'use client';

import { useState, useEffect } from 'react';
import { CircleAlert as AlertCircle, ChartBar as BarChart2, CircleCheck as CheckCircle, Lightbulb, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import SolutionsPanel, {
  QUESTION_TYPE_LABELS,
  SAT_SOLUTION_QUESTIONS,
  type SolutionQuestionType,
} from '@/components/assessment-detail/SolutionsPanel';
import SATScoringTable from '@/components/assessment-detail/SATScoringTable';
import type { Assessment } from '@/types';

// ─── SAT domain taxonomy (client-side grouping — no DB column) ─────────────────

const SAT_MATH_DOMAIN_MAP: Record<string, string> = {
  'Linear equations and inequalities':                    'Algebra',
  'Systems of linear equations':                         'Algebra',
  'Linear functions':                                    'Algebra',
  'Word problems involving linear relationships':         'Algebra',
  'Quadratic equations':                                 'Advanced Math',
  'Polynomial expressions and functions':                'Advanced Math',
  'Exponential functions and equations':                 'Advanced Math',
  'Rational expressions':                                'Advanced Math',
  'Radical expressions':                                 'Advanced Math',
  'Function notation and transformations':               'Advanced Math',
  'Solving equations involving absolute value or higher powers': 'Advanced Math',
  'Ratios, rates, and proportions':                      'Problem Solving & Data Analysis',
  'Percentages':                                         'Problem Solving & Data Analysis',
  'Units and unit conversions':                          'Problem Solving & Data Analysis',
  'Tables, graphs, and data interpretation':             'Problem Solving & Data Analysis',
  'Mean, median, mode, and range':                       'Problem Solving & Data Analysis',
  'Probability':                                         'Problem Solving & Data Analysis',
  'Scatterplots and trend lines':                        'Problem Solving & Data Analysis',
  'Statistical concepts':                                'Problem Solving & Data Analysis',
  'Properties of lines, angles, triangles, and circles': 'Geometry & Trigonometry',
  'Area, perimeter, and volume formulas':                'Geometry & Trigonometry',
  'The Pythagorean theorem':                             'Geometry & Trigonometry',
  'Similarity and congruence':                           'Geometry & Trigonometry',
  'Basic trigonometry':                                  'Geometry & Trigonometry',
  'Coordinate geometry':                                 'Geometry & Trigonometry',
};

const SAT_RW_DOMAIN_MAP: Record<string, string> = {
  'Central ideas and themes':                            'Craft & Structure',
  'Text structure and organization':                     'Craft & Structure',
  'Word choice in context':                              'Craft & Structure',
  'Point of view and purpose':                          'Craft & Structure',
  'Textual relationships':                               'Craft & Structure',
  'Reading comprehension':                               'Information & Ideas',
  'Evidence-based questions':                            'Information & Ideas',
  'Data interpretation in context':                      'Information & Ideas',
  'Logical connections between ideas':                   'Information & Ideas',
  'Sentence structure':                                  'Standard English Conventions',
  'Punctuation':                                         'Standard English Conventions',
  'Verb tense and agreement':                            'Standard English Conventions',
  'Pronoun usage and agreement':                         'Standard English Conventions',
  'Modifier placement':                                  'Standard English Conventions',
  'Parallel structure':                                  'Standard English Conventions',
  'Transition words and logical flow':                   'Expression of Ideas',
  'Concision':                                           'Expression of Ideas',
  'Style and tone appropriateness':                      'Expression of Ideas',
  'Sentence and paragraph organization':                 'Expression of Ideas',
  'Effective introduction and conclusion sentences':      'Expression of Ideas',
};

// Display order for domains
const MATH_DOMAIN_ORDER = [
  'Algebra',
  'Advanced Math',
  'Problem Solving & Data Analysis',
  'Geometry & Trigonometry',
];
const RW_DOMAIN_ORDER = [
  'Craft & Structure',
  'Information & Ideas',
  'Standard English Conventions',
  'Expression of Ideas',
];

// Section display order for attempt section results
const FULL_TEST_SECTION_ORDER = ['rw_module_1', 'rw_module_2', 'math_module_1', 'math_module_2'];
const MATH_SECTION_ORDER      = ['algebra', 'advanced_math', 'psda', 'geometry_trig'];
const RW_SECTION_ORDER        = ['craft_structure', 'info_ideas', 'sec', 'expression_ideas'];

const SOLUTION_FILTERS: { label: string; value: 'ALL' | SolutionQuestionType }[] = [
  { label: 'All question types', value: 'ALL' },
  { label: 'MCQ Single', value: 'mcq-single' },
  { label: 'MCQ Multiple', value: 'mcq-multiple' },
  { label: 'Passage Single', value: 'passage-single' },
  { label: 'Passage Multiple', value: 'passage-multi' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DbAttempt {
  id: string;
  attempt_number: number;
  status: string;
  score: number | null;
  score_rw: number | null;
  score_math: number | null;
  total_questions: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  skipped_count: number | null;
  accuracy_percent: number | null;
  time_spent_seconds: number | null;
  completed_at: string | null;
}

interface SectionResult {
  section_id: string;
  section_label: string;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  marks_scored: number;
  marks_possible: number;
  time_spent_seconds: number;
  accuracy_percent: number | null;
}

interface ConceptMastery {
  concept_tag: string;
  attempt_number: number;
  correct_count: number;
  total_count: number;
  mastery_percent: number | null;
}

interface AiInsight {
  what_went_well: string;
  next_steps: string;
}

export interface SATAnalyticsTabProps {
  assessment: Assessment;
  assessmentId: string;
  onSwitchToAttempts: () => void;
}

// ─── Colour helpers ────────────────────────────────────────────────────────────

function masteryBadgeClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-100 text-zinc-400';
  if (pct >= 80)   return 'bg-emerald-100 text-emerald-700';
  if (pct >= 60)   return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function masteryBarClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-200';
  if (pct >= 80)   return 'bg-emerald-500';
  if (pct >= 60)   return 'bg-amber-500';
  return 'bg-rose-500';
}

function sectionBarClass(pct: number): string {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupTagsByDomain(
  tags: string[],
  domainMap: Record<string, string>,
  domainOrder: string[],
): { domain: string; tags: string[] }[] {
  const grouped: Record<string, string[]> = {};
  for (const tag of tags) {
    const domain = domainMap[tag];
    if (!domain) continue;
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(tag);
  }
  return domainOrder
    .filter((d) => grouped[d]?.length)
    .map((d) => ({ domain: d, tags: grouped[d] }));
}

function formatScore(score: number | null, max: number): string {
  if (score === null) return '—';
  return `${score}`;
}

function scoreDelta(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return b - a;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <TrendingUp className="w-3 h-3" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
      <TrendingDown className="w-3 h-3" />{delta}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5">
      <Minus className="w-3 h-3" />No change
    </span>
  );
}

// ─── Concept Mastery Panel ─────────────────────────────────────────────────────

function ConceptMasteryPanel({
  title,
  groups,
  conceptMastery,
  attemptNumbers,
}: {
  title: string;
  groups: { domain: string; tags: string[] }[];
  conceptMastery: ConceptMastery[];
  attemptNumbers: number[];
}) {
  function getMastery(tag: string, n: number): number | null {
    return conceptMastery.find(
      (m) => m.concept_tag === tag && m.attempt_number === n,
    )?.mastery_percent ?? null;
  }

  if (groups.length === 0) return null;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-zinc-700 mb-3">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-zinc-400 pb-2 pr-4 min-w-[160px]">
                Skill
              </th>
              {attemptNumbers.map((n) => (
                <th
                  key={n}
                  className="text-center text-xs font-medium text-zinc-400 pb-2 px-2 whitespace-nowrap"
                >
                  Attempt {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(({ domain, tags }) => (
              <>
                <tr key={`domain-${domain}`}>
                  <td
                    colSpan={attemptNumbers.length + 1}
                    className="text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-50 px-2 py-1.5 border-t border-zinc-100"
                  >
                    {domain}
                  </td>
                </tr>
                {tags.map((tag) => (
                  <tr key={tag} className="border-t border-zinc-50">
                    <td className="text-xs text-zinc-600 py-2 pr-4 pl-2 leading-snug">
                      {tag}
                    </td>
                    {attemptNumbers.map((n) => {
                      const pct = getMastery(tag, n);
                      return (
                        <td key={n} className="text-center py-2 px-2">
                          <span
                            className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${masteryBadgeClass(pct)}`}
                          >
                            {pct !== null ? `${Math.round(pct)}%` : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-100">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />&ge;80% — strong
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />60–79% — developing
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />&lt;60% — needs work
        </span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SATAnalyticsTab({
  assessment,
  assessmentId,
  onSwitchToAttempts,
}: SATAnalyticsTabProps) {
  const { user } = useAppContext();
  const [loading, setLoading]                   = useState(true);
  const [attempts, setAttempts]                 = useState<DbAttempt[]>([]);
  const [allSections, setAllSections]           = useState<Record<string, SectionResult[]>>({});
  const [conceptMastery, setConceptMastery]     = useState<ConceptMastery[]>([]);
  const [allInsights, setAllInsights]           = useState<Record<string, AiInsight>>({});
  const [selectedAttemptIdx, setSelectedAttemptIdx] = useState(0);
  const [filter, setFilter]                     = useState<'ALL' | SolutionQuestionType>('ALL');

  const isAiEligible =
    user?.subscriptionTier === 'professional' ||
    user?.subscriptionTier === 'premium';

  const isFullTest   = assessment.type === 'full-test';
  const showMath     = isFullTest || assessment.subject === 'Math';
  const showRw       = isFullTest || assessment.subject === 'Reading & Writing';
  const scoreMax     = isFullTest ? 1600 : 800;
  const sectionOrder = isFullTest
    ? FULL_TEST_SECTION_ORDER
    : assessment.subject === 'Math'
      ? MATH_SECTION_ORDER
      : RW_SECTION_ORDER;

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      setLoading(true);

      // 1. All completed attempts
      const { data: attemptsData } = await supabase
        .from('attempts')
        .select(
          'id, attempt_number, status, score, score_rw, score_math, total_questions, correct_count, incorrect_count, skipped_count, accuracy_percent, time_spent_seconds, completed_at',
        )
        .eq('user_id', user!.id)
        .eq('assessment_id', assessmentId)
        .in('status', ['COMPLETED', 'completed'])
        .order('attempt_number', { ascending: true });

      const completed: DbAttempt[] = attemptsData ?? [];
      setAttempts(completed);

      if (completed.length === 0) {
        setLoading(false);
        return;
      }

      const attemptIds = completed.map((a) => a.id);

      // 2. Section results for ALL attempts
      const { data: sectionsData } = await supabase
        .from('attempt_section_results')
        .select(
          'attempt_id, section_id, section_label, correct_count, incorrect_count, skipped_count, marks_scored, marks_possible, time_spent_seconds, accuracy_percent',
        )
        .in('attempt_id', attemptIds);

      const sectionsMap: Record<string, SectionResult[]> = {};
      for (const row of sectionsData ?? []) {
        const aid = row.attempt_id as string;
        if (!sectionsMap[aid]) sectionsMap[aid] = [];
        sectionsMap[aid].push(row as unknown as SectionResult);
      }
      // Sort each attempt's sections in display order
      const orderMap = Object.fromEntries(sectionOrder.map((id, i) => [id, i]));
      for (const aid of Object.keys(sectionsMap)) {
        sectionsMap[aid].sort(
          (a, b) => (orderMap[a.section_id] ?? 99) - (orderMap[b.section_id] ?? 99),
        );
      }
      setAllSections(sectionsMap);

      // 3. Concept mastery — all attempt numbers
      const { data: masteryData } = await supabase
        .from('user_concept_mastery')
        .select('concept_tag, attempt_number, correct_count, total_count, mastery_percent')
        .eq('user_id', user!.id)
        .eq('assessment_id', assessmentId)
        .order('concept_tag');
      setConceptMastery(masteryData ?? []);

      // 4. AI insights for all attempts — premium/pro only
      if (isAiEligible) {
        const { data: insightsData } = await supabase
          .from('attempt_ai_insights')
          .select('attempt_id, what_went_well, next_steps')
          .in('attempt_id', attemptIds);

        const insightsMap: Record<string, AiInsight> = {};
        for (const row of insightsData ?? []) {
          insightsMap[row.attempt_id as string] = {
            what_went_well: row.what_went_well as string,
            next_steps: row.next_steps as string,
          };
        }
        setAllInsights(insightsMap);
      } else {
        setAllInsights({});
      }

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, assessmentId, isAiEligible]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── No attempts ────────────────────────────────────────────────────────────
  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart2 className="w-8 h-8 text-zinc-300 mb-3" />
        <p className="text-sm text-zinc-500 mb-2">
          Complete your first attempt to see analytics
        </p>
        <button
          onClick={onSwitchToAttempts}
          className="text-sm text-blue-700 hover:underline"
        >
          Go to Attempts →
        </button>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const selectedAttempt  = attempts[Math.min(selectedAttemptIdx, attempts.length - 1)];
  const sectionResults   = allSections[selectedAttempt.id] ?? [];
  const aiInsight        = allInsights[selectedAttempt.id] ?? null;

  const filteredSolutions = SAT_SOLUTION_QUESTIONS.filter(
    (item) => filter === 'ALL' || item.type === filter,
  );
  const allowedConceptTags = new Set(filteredSolutions.map((item) => item.conceptTag));
  const filteredConceptMastery = conceptMastery.filter(
    (m) => filter === 'ALL' || allowedConceptTags.has(m.concept_tag),
  );

  const attemptNumbers = [...new Set(filteredConceptMastery.map((m) => m.attempt_number))].sort((a, b) => a - b);
  const allConceptTags = [...new Set(filteredConceptMastery.map((m) => m.concept_tag))];

  // "Where You Lost Points" — weak sub-skills for the selected attempt
  const weakConcepts = filteredConceptMastery
    .filter(
      (m) =>
        m.attempt_number === selectedAttempt.attempt_number &&
        m.mastery_percent !== null &&
        (m.mastery_percent as number) < 60,
    )
    .sort((a, b) => (a.mastery_percent ?? 0) - (b.mastery_percent ?? 0))
    .slice(0, 6);

  // Domain grouping for heatmap panels
  const mathGroups = groupTagsByDomain(allConceptTags, SAT_MATH_DOMAIN_MAP, MATH_DOMAIN_ORDER);
  const rwGroups   = groupTagsByDomain(allConceptTags, SAT_RW_DOMAIN_MAP,   RW_DOMAIN_ORDER);

  // Score progression values
  const firstAttempt = attempts[0];
  const lastAttempt  = attempts[attempts.length - 1];
  const compositeGain = scoreDelta(firstAttempt.score, lastAttempt.score);

  return (
    <div className="space-y-4">

      {/* ── Block 1: Score Progression (STATIC — not filtered) ───────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-medium text-zinc-900">Score Progression</h3>
          {attempts.length >= 2 && compositeGain !== null && (
            <div className="ml-auto">
              <DeltaBadge delta={compositeGain} />
            </div>
          )}
        </div>

        <div className={`grid gap-4 ${attempts.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'}`}>
          {attempts.map((a) => (
            <div
              key={a.id}
              className="border border-zinc-100 rounded-md p-4 bg-zinc-50"
            >
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                Attempt {a.attempt_number}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-semibold text-zinc-900">
                  {formatScore(a.score, scoreMax)}
                </span>
                <span className="text-sm text-zinc-400">/ {scoreMax}</span>
              </div>

              {/* For full test: RW + Math section split */}
              {isFullTest && (a.score_rw !== null || a.score_math !== null) && (
                <div className="flex gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400">Reading & Writing</p>
                    <p className="text-base font-medium text-zinc-700">
                      {a.score_rw ?? '—'}
                      <span className="text-xs font-normal text-zinc-400">/800</span>
                    </p>
                  </div>
                  <div className="w-px bg-zinc-200 self-stretch" />
                  <div className="text-center">
                    <p className="text-xs text-zinc-400">Math</p>
                    <p className="text-base font-medium text-zinc-700">
                      {a.score_math ?? '—'}
                      <span className="text-xs font-normal text-zinc-400">/800</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Section-level delta for full test */}
        {isFullTest && attempts.length >= 2 && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">R&W</span>
              <DeltaBadge delta={scoreDelta(firstAttempt.score_rw, lastAttempt.score_rw)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Math</span>
              <DeltaBadge delta={scoreDelta(firstAttempt.score_math, lastAttempt.score_math)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Block 2: Attempt filter + Section Breakdown ────────────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-zinc-900">Section Breakdown</h3>
          {attempts.length > 1 && (
            <select
              value={selectedAttemptIdx}
              onChange={(e) => setSelectedAttemptIdx(Number(e.target.value))}
              className="text-sm text-zinc-700 border border-zinc-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {attempts.map((a, i) => (
                <option key={a.id} value={i}>
                  Attempt {a.attempt_number}
                </option>
              ))}
            </select>
          )}
        </div>

        {sectionResults.length === 0 ? (
          <p className="text-sm text-zinc-400">No section data for this attempt.</p>
        ) : (
          <div className="space-y-5">
            {/* For full test: group modules under RW / Math headers */}
            {isFullTest ? (
              <>
                {/* R&W Modules */}
                {sectionResults.filter((s) => s.section_id.startsWith('rw')).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                      Reading & Writing
                    </p>
                    <div className="space-y-4 pl-0.5">
                      {sectionResults
                        .filter((s) => s.section_id.startsWith('rw'))
                        .map((sec) => <SectionRow key={sec.section_id} sec={sec} />)}
                    </div>
                  </div>
                )}
                {/* Math Modules */}
                {sectionResults.filter((s) => s.section_id.startsWith('math')).length > 0 && (
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                      Math
                    </p>
                    <div className="space-y-4 pl-0.5">
                      {sectionResults
                        .filter((s) => s.section_id.startsWith('math'))
                        .map((sec) => <SectionRow key={sec.section_id} sec={sec} />)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Subject test: flat list of 4 domain sections
              <div className="space-y-5">
                {sectionResults.map((sec) => <SectionRow key={sec.section_id} sec={sec} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filter dropdown for analytics + solutions ───────────────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">Analytics filter</p>
            <p className="text-xs text-zinc-500">
              Narrow the view to a specific question type for the concept heatmap and solutions panel.
            </p>
          </div>
          <label className="relative inline-flex items-center w-full sm:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'ALL' | SolutionQuestionType)}
              className="w-full sm:w-64 pl-4 pr-4 py-2 border border-zinc-200 rounded-md text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SOLUTION_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ── Block 3: Concept Mastery Heatmap (all attempts — filtered by question type) ──── */}
      {filteredConceptMastery.length > 0 && (
        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-medium text-zinc-900">Concept Mastery</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Showing tags for {filter === 'ALL' ? 'all question types' : QUESTION_TYPE_LABELS[filter]}.
              </p>
            </div>
            {filter !== 'ALL' && (
              <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-1">
                {QUESTION_TYPE_LABELS[filter]}
              </span>
            )}
          </div>

          {attemptNumbers.length >= 2 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-zinc-400 pb-2 pr-4 min-w-[160px]">
                      Skill
                    </th>
                    {attemptNumbers.map((n) => (
                      <th
                        key={n}
                        className="text-center text-xs font-medium text-zinc-400 pb-2 px-2 whitespace-nowrap"
                      >
                        Attempt {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allConceptTags.map((tag) => (
                    <tr key={tag} className="border-t border-zinc-50">
                      <td className="text-xs font-medium text-zinc-700 py-2 pr-4">
                        {tag}
                      </td>
                      {attemptNumbers.map((n) => {
                        const pct = filteredConceptMastery.find(
                          (m) => m.concept_tag === tag && m.attempt_number === n,
                        )?.mastery_percent ?? null;
                        return (
                          <td key={n} className="text-center py-2 px-2">
                            <span
                              className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${masteryBadgeClass(pct)}`}
                            >
                              {pct !== null ? `${Math.round(pct)}%` : '—'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {allConceptTags.map((tag) => {
                const pct = filteredConceptMastery.find(
                  (m) => m.concept_tag === tag && m.attempt_number === attemptNumbers[0],
                )?.mastery_percent ?? null;
                return (
                  <div key={tag}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-700">{tag}</span>
                      <span className="text-xs text-zinc-500">
                        {pct !== null ? `${Math.round(pct)}%` : '—'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${masteryBarClass(pct)}`}
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-100">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              &ge;80% — strong
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              60–79% — developing
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              &lt;60% — needs work
            </span>
          </div>
        </div>
      )}

      <SolutionsPanel solutions={filteredSolutions} />

      {/* ── Block 4: Where You Lost Points (computed — responds to filter) ──── */}
      {weakConcepts.length > 0 && (
        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-base font-medium text-zinc-900">Where You Lost Points</h3>
            <span className="ml-auto text-xs text-zinc-400">
              Attempt {selectedAttempt.attempt_number} — sub-skills below 60%
            </span>
          </div>
          <div className="space-y-4">
            {weakConcepts.map((c) => {
              const domain =
                SAT_MATH_DOMAIN_MAP[c.concept_tag] ??
                SAT_RW_DOMAIN_MAP[c.concept_tag] ??
                '';
              const pct = Math.round(c.mastery_percent ?? 0);
              return (
                <div key={c.concept_tag}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-zinc-800">
                        {c.concept_tag}
                      </span>
                      {domain && (
                        <span className="ml-2 text-xs text-zinc-400">{domain}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-zinc-500">
                        {c.correct_count}/{c.total_count} correct
                      </span>
                      <span className="text-xs font-medium text-rose-600">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-rose-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Block 5: SAT Scoring Reference (always visible, collapsible) ──────── */}
      <SATScoringTable />

      {/* ── Block 6: AI Insight Panel (responds to attempt filter) ───────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-medium text-zinc-900">AI Insight</h3>
          {isAiEligible && (
            <span className="ml-auto text-xs text-zinc-400">
              Attempt {selectedAttempt.attempt_number} · Powered by Claude
            </span>
          )}
        </div>

        {isAiEligible && aiInsight ? (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-700">What You Did Well</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">{aiInsight.what_went_well}</p>
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-sm font-medium text-blue-700">How to Improve</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">{aiInsight.next_steps}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-700">What You Did Well</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">
                We are thrilled to say that you are doing well but to get AI insights, you may need to upgrade your plan.
              </p>
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Target className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-sm font-medium text-blue-700">How to Improve</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed mb-4">
                Unlock personalized AI insights to accelerate your learning journey.
              </p>
              <button
                onClick={() => window.location.href = '/plans'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Section Row sub-component ─────────────────────────────────────────────────

function SectionRow({ sec }: { sec: SectionResult }) {
  const pct =
    sec.marks_possible > 0
      ? Math.round((sec.marks_scored / sec.marks_possible) * 100)
      : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-zinc-700">{sec.section_label}</span>
        <span className="text-sm font-medium text-zinc-900">
          {sec.marks_scored}/{sec.marks_possible}
          <span className="text-xs font-normal text-zinc-400 ml-1">marks</span>
        </span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-2 mb-1.5">
        <div
          className={`h-2 rounded-full transition-all ${sectionBarClass(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-600">{sec.correct_count} correct</span>
        <span className="text-rose-600">{sec.incorrect_count} wrong</span>
        <span className="text-zinc-400">{sec.skipped_count} skipped</span>
        <span className="ml-auto text-zinc-500">{pct}%</span>
      </div>
    </div>
  );
}
