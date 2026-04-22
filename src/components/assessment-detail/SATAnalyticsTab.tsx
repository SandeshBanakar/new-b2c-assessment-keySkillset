'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChartBar as BarChart2,
  CircleCheck as CheckCircle,
  Lightbulb,
  Target,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import SolutionsPanel, {
  type DbQuestion,
  type UserAnswer,
} from '@/components/assessment-detail/SolutionsPanel';
import SATScoringTable from '@/components/assessment-detail/SATScoringTable';
import ConceptMasteryPanel from '@/components/assessment-detail/ConceptMasteryPanel';
import AttemptPillFilter from '@/components/ui/AttemptPillFilter';
import SATHeroScore from '@/components/assessment-detail/SATHeroScore';
import SATCollegeLadder, { type TierBand, type College } from '@/components/assessment-detail/SATCollegeLadder';
import DifficultyBreakdownCard, { type DiffMap } from '@/components/ui/DifficultyBreakdownCard';
import type { Assessment } from '@/types';

// ─── SAT domain taxonomy ───────────────────────────────────────────────────────

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

const FULL_TEST_SECTION_ORDER = ['rw_module_1', 'rw_module_2', 'math_module_1', 'math_module_2'];
const MATH_SECTION_ORDER      = ['algebra', 'advanced_math', 'psda', 'geometry_trig'];
const RW_SECTION_ORDER        = ['craft_structure', 'info_ideas', 'sec', 'expression_ideas'];

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

function sectionBarClass(pct: number): string {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function scoreDelta(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return b - a;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-emerald-600">{sec.correct_count} correct</span>
        <span className="text-rose-600">{sec.incorrect_count} wrong</span>
        <span className="text-zinc-400">{sec.skipped_count} skipped</span>
        {sec.time_spent_seconds > 0 && (
          <span className="text-zinc-400">{formatTime(sec.time_spent_seconds)}</span>
        )}
        <span className="ml-auto text-zinc-500">{pct}%</span>
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
  const router = useRouter();
  const { user, updateUser } = useAppContext();
  const [loading, setLoading]                         = useState(true);
  const [attempts, setAttempts]                       = useState<DbAttempt[]>([]);
  const [allSections, setAllSections]                 = useState<Record<string, SectionResult[]>>({});
  const [conceptMastery, setConceptMastery]           = useState<ConceptMastery[]>([]);
  const [allInsights, setAllInsights]                 = useState<Record<string, AiInsight>>({});
  const [selectedAttemptId, setSelectedAttemptId]     = useState<string>('');
  const [assessmentQuestions, setAssessmentQuestions] = useState<DbQuestion[]>([]);
  const [allUserAnswers, setAllUserAnswers]            = useState<Record<string, UserAnswer[]>>({});
  const [tierBands, setTierBands]                     = useState<TierBand[]>([]);
  const [colleges, setColleges]                       = useState<College[]>([]);

  const isAiEligible =
    user?.subscriptionTier === 'professional' ||
    user?.subscriptionTier === 'premium';

  const isFullTest   = assessment.type === 'full-test';
  const scoreMax     = isFullTest ? 1600 : 800;
  const sectionOrder = isFullTest
    ? FULL_TEST_SECTION_ORDER
    : assessment.subject === 'Math'
      ? MATH_SECTION_ORDER
      : RW_SECTION_ORDER;

  const targetScore = isFullTest
    ? (user?.targetSatScore ?? null)
    : (user?.targetSatSubjectScore ?? null);

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

      setSelectedAttemptId(completed[completed.length - 1].id);
      const attemptIds = completed.map((a) => a.id);

      // 2–6. Core analytics data in parallel
      const [
        sectionsResult,
        masteryResult,
        insightsResult,
        questionsResult,
        answersResult,
      ] = await Promise.all([
        // 2. Section results
        supabase
          .from('attempt_section_results')
          .select('attempt_id, section_id, section_label, correct_count, incorrect_count, skipped_count, marks_scored, marks_possible, time_spent_seconds, accuracy_percent')
          .in('attempt_id', attemptIds),

        // 3. Concept mastery
        supabase
          .from('user_concept_mastery')
          .select('concept_tag, attempt_number, correct_count, total_count, mastery_percent')
          .eq('user_id', user!.id)
          .eq('assessment_id', assessmentId)
          .order('concept_tag'),

        // 4. AI insights (pro/premium only)
        isAiEligible
          ? supabase
              .from('attempt_ai_insights')
              .select('attempt_id, what_went_well, next_steps')
              .in('attempt_id', attemptIds)
          : Promise.resolve({ data: null }),

        // 5. Assessment questions with difficulty
        supabase
          .from('assessment_question_map')
          .select('question_id, order_index, questions(id, question_type, difficulty, module_name, question_order, question_text, passage_text, options, correct_answer, explanation, concept_tag)')
          .eq('assessment_id', assessmentId)
          .order('order_index', { ascending: true }),

        // 6. User answers
        supabase
          .from('attempt_answers')
          .select('attempt_id, question_id, section_id, user_answer, is_correct, is_skipped, time_spent_seconds, marks_awarded')
          .in('attempt_id', attemptIds),
      ]);

      // Process sections
      const sectionsMap: Record<string, SectionResult[]> = {};
      for (const row of sectionsResult.data ?? []) {
        const aid = row.attempt_id as string;
        if (!sectionsMap[aid]) sectionsMap[aid] = [];
        sectionsMap[aid].push(row as unknown as SectionResult);
      }
      const orderMap = Object.fromEntries(sectionOrder.map((id, i) => [id, i]));
      for (const aid of Object.keys(sectionsMap)) {
        sectionsMap[aid].sort(
          (a, b) => (orderMap[a.section_id] ?? 99) - (orderMap[b.section_id] ?? 99),
        );
      }
      setAllSections(sectionsMap);

      // Process mastery
      setConceptMastery(masteryResult.data ?? []);

      // Process insights
      if (isAiEligible && insightsResult.data) {
        const insightsMap: Record<string, AiInsight> = {};
        for (const row of insightsResult.data) {
          insightsMap[row.attempt_id as string] = {
            what_went_well: row.what_went_well as string,
            next_steps: row.next_steps as string,
          };
        }
        setAllInsights(insightsMap);
      }

      // Process questions
      const questions: DbQuestion[] = (questionsResult.data ?? [])
        .map((row) => {
          const q = row.questions as unknown as DbQuestion | null;
          return q ?? null;
        })
        .filter(Boolean) as DbQuestion[];
      setAssessmentQuestions(questions);

      // Process answers
      const answersMap: Record<string, UserAnswer[]> = {};
      for (const row of answersResult.data ?? []) {
        const aid = row.attempt_id as string;
        if (!answersMap[aid]) answersMap[aid] = [];
        answersMap[aid].push({
          question_id: row.question_id as string,
          section_id: row.section_id as string | null,
          user_answer: row.user_answer as string | null,
          is_correct: row.is_correct as boolean | null,
          is_skipped: row.is_skipped as boolean | null,
          time_spent_seconds: row.time_spent_seconds as number | null,
          marks_awarded: row.marks_awarded as number | null,
        });
      }
      setAllUserAnswers(answersMap);

      // 7. Tier bands + colleges (Full Test only)
      if (isFullTest) {
        const [bandsResult, collegesResult] = await Promise.all([
          supabase.from('sat_tier_bands').select('*').order('display_order'),
          supabase.from('sat_colleges').select('*').eq('is_active', true).order('cutoff_score', { ascending: false }),
        ]);
        setTierBands((bandsResult.data as TierBand[] | null) ?? []);
        setColleges((collegesResult.data as College[] | null) ?? []);
      }

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, assessmentId, isAiEligible]);

  // ── Save target score ──────────────────────────────────────────────────────
  async function onSaveTarget(score: number | null) {
    if (!user?.id) return;
    const col = isFullTest ? 'target_sat_score' : 'target_sat_subject_score';
    await supabase.from('users').update({ [col]: score }).eq('id', user.id);
    updateUser(
      isFullTest
        ? { targetSatScore: score }
        : { targetSatSubjectScore: score },
    );
  }

  // ── Hooks that must be declared before early returns ──────────────────────
  // Derive the active attempt ID without creating a nullable selectedAttempt
  const _activeId = selectedAttemptId || (attempts.length > 0 ? attempts[attempts.length - 1].id : '');
  const sectionResults  = allSections[_activeId] ?? [];
  const selectedAnswers = allUserAnswers[_activeId] ?? [];

  const derivedSectionResults = useMemo<SectionResult[]>(() => {
    if (selectedAnswers.length === 0) return sectionResults;
    const stats: Record<string, { correct: number; wrong: number; skipped: number; time: number }> = {};
    for (const a of selectedAnswers) {
      const sid = a.section_id;
      if (!sid) continue;
      if (!stats[sid]) stats[sid] = { correct: 0, wrong: 0, skipped: 0, time: 0 };
      if (a.is_skipped) stats[sid].skipped++;
      else if (a.is_correct) stats[sid].correct++;
      else stats[sid].wrong++;
      stats[sid].time += a.time_spent_seconds ?? 0;
    }
    return sectionResults.map((sec) => {
      const d = stats[sec.section_id];
      if (!d) return sec;
      const total = d.correct + d.wrong;
      return {
        ...sec,
        correct_count: d.correct,
        incorrect_count: d.wrong,
        skipped_count: d.skipped,
        time_spent_seconds: d.time > 0 ? d.time : sec.time_spent_seconds,
        accuracy_percent: total > 0 ? Math.round((d.correct / total) * 10000) / 100 : sec.accuracy_percent,
      };
    });
  }, [selectedAnswers, sectionResults]);

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

  // ── Post-early-return derived values ───────────────────────────────────────
  // selectedAttempt is non-null here — attempts.length === 0 already returned early
  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) ?? attempts[attempts.length - 1];
  const aiInsight = allInsights[selectedAttempt.id] ?? null;

  const firstAttempt  = attempts[0];
  const lastAttempt   = attempts[attempts.length - 1];
  const compositeGain = scoreDelta(firstAttempt.score, lastAttempt.score);

  // Difficulty breakdown from attempt_answers + question difficulty
  const difficultyMap: DiffMap = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  for (const answer of selectedAnswers) {
    const q = assessmentQuestions.find((q) => q.id === answer.question_id);
    if (!q) continue;
    const d = ((q.difficulty ?? 'medium') as string).toLowerCase() as keyof DiffMap;
    if (d in difficultyMap) {
      difficultyMap[d].total++;
      if (answer.is_correct) difficultyMap[d].correct++;
    }
  }
  const hasDiffData = Object.values(difficultyMap).some((v) => v.total > 0);

  // Concept mastery for selected attempt
  const selectedConceptMastery = conceptMastery.filter(
    (m) => m.attempt_number === selectedAttempt?.attempt_number,
  );

  // Build tagSectionMap and sections for ConceptMasteryPanel
  const tagSectionMap: Record<string, string> = {};
  for (const tag of Object.keys(SAT_MATH_DOMAIN_MAP)) tagSectionMap[tag] = 'Math';
  for (const tag of Object.keys(SAT_RW_DOMAIN_MAP))   tagSectionMap[tag] = 'Reading & Writing';

  const sections = isFullTest
    ? ['Reading & Writing', 'Math']
    : assessment.subject === 'Math'
      ? ['Math']
      : ['Reading & Writing'];

  return (
    <div className="space-y-4">

      {/* ── Block 1: Hero Score ───────────────────────────────────────────────── */}
      <SATHeroScore
        attempts={attempts}
        selectedAttempt={selectedAttempt}
        isFullTest={isFullTest}
        scoreMax={scoreMax}
        targetScore={targetScore}
        onSaveTarget={onSaveTarget}
        compositeGain={compositeGain}
      />

      {/* ── Block 2: Attempt Pill Filter ──────────────────────────────────────── */}
      {attempts.length > 1 && (
        <AttemptPillFilter
          attempts={attempts}
          selectedId={selectedAttemptId}
          onChange={setSelectedAttemptId}
        />
      )}

      {/* ── Block 3: College Ladder (Full Test only) ──────────────────────────── */}
      {isFullTest && tierBands.length > 0 && lastAttempt.score !== null && (
        <SATCollegeLadder
          score={lastAttempt.score}
          target={targetScore}
          tiers={tierBands}
          colleges={colleges}
        />
      )}

      {/* ── Block 4: Section Breakdown ────────────────────────────────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-zinc-900">Section Breakdown</h3>
          <span className="text-xs text-zinc-400">Attempt {selectedAttempt.attempt_number}</span>
        </div>

        {derivedSectionResults.length === 0 ? (
          <p className="text-sm text-zinc-400">No section data for this attempt.</p>
        ) : (
          <div className="space-y-5">
            {derivedSectionResults.map((sec) => <SectionRow key={sec.section_id} sec={sec} />)}
          </div>
        )}
      </div>

      {/* ── Block 5: Difficulty Breakdown ─────────────────────────────────────── */}
      {hasDiffData && (
        <DifficultyBreakdownCard
          diffMap={difficultyMap}
          attemptNumber={selectedAttempt.attempt_number}
        />
      )}

      {/* ── Block 7: Concept Mastery ──────────────────────────────────────────── */}
      {conceptMastery.length > 0 && (
        <ConceptMasteryPanel
          conceptMastery={conceptMastery}
          tagSectionMap={tagSectionMap}
          sections={sections}
          attempts={attempts.map((a) => ({
            attempt_number: a.attempt_number,
            completed_at: a.completed_at,
          }))}
        />
      )}

      {/* ── Block 10: SAT Scoring Reference (Full Test only) ─────────────────── */}
      {isFullTest && <SATScoringTable />}

      {/* ── Block 11: Solutions Panel ─────────────────────────────────────────── */}
      <SolutionsPanel
        questions={assessmentQuestions}
        userAnswers={selectedAnswers}
        isFullTest={isFullTest}
      />

      {/* ── Block 12: AI Insight Panel ────────────────────────────────────────── */}
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
        ) : isAiEligible && !aiInsight ? (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-700">What You Did Well</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">
                Insights are being prepared for this attempt...
              </p>
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-sm font-medium text-blue-700">How to Improve</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">
                Insights are being prepared for this attempt...
              </p>
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
                Upgrade to unlock personalized AI-generated feedback on your strengths.
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
                onClick={() => router.push('/plans')}
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
