'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2,
  CheckCircle,
  Filter,
  Lightbulb,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import SolutionsPanel, {
  QUESTION_TYPE_LABELS,
  SOLUTION_QUESTIONS,
  type SolutionQuestionType,
} from '@/components/assessment-detail/SolutionsPanel';
import type { Assessment } from '@/types';

// Negative marks per incorrect answer, by exam
const NEG_MARKS: Record<string, number> = {
  NEET: 1,
  JEE: 1,
  CLAT: 0.25,
  SAT: 0,
  PMP: 0,
};

interface DbAttempt {
  id: string;
  attempt_number: number;
  status: string;
  score: number | null;
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
  model_used: string;
}

type AnalyticsFilter = 'ALL' | SolutionQuestionType;

const SOLUTION_FILTERS: { label: string; value: AnalyticsFilter }[] = [
  { label: 'All question types', value: 'ALL' },
  { label: 'MCQ Single', value: 'mcq-single' },
  { label: 'MCQ Multiple', value: 'mcq-multiple' },
  { label: 'Passage Single', value: 'passage-single' },
  { label: 'Passage Multiple', value: 'passage-multi' },
];

interface AnalyticsTabProps {
  assessment: Assessment;
  assessmentId: string;
  onSwitchToAttempts: () => void;
}

function masteryBadgeClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-100 text-zinc-400';
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700';
  if (pct >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function masteryBarClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-200';
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function sectionBarClass(pct: number): string {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

export default function AnalyticsTab({
  assessment,
  assessmentId,
  onSwitchToAttempts,
}: AnalyticsTabProps) {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<DbAttempt[]>([]);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [conceptMastery, setConceptMastery] = useState<ConceptMastery[]>([]);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [filter, setFilter] = useState<AnalyticsFilter>('ALL');

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      setLoading(true);

      // 1. All completed attempts for this user + assessment
      const { data: attemptsData } = await supabase
        .from('attempts')
        .select(
          'id, attempt_number, status, score, total_questions, correct_count, incorrect_count, skipped_count, accuracy_percent, time_spent_seconds, completed_at',
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

      const latest = completed[completed.length - 1];

      // 2. Section results for latest attempt
      const { data: sectionsData } = await supabase
        .from('attempt_section_results')
        .select(
          'section_id, section_label, correct_count, incorrect_count, skipped_count, marks_scored, marks_possible, time_spent_seconds, accuracy_percent',
        )
        .eq('attempt_id', latest.id)
        .order('section_id');
      setSectionResults(sectionsData ?? []);

      // 3. Concept mastery — all attempt numbers for this user + assessment
      const attemptNums = completed.map((a) => a.attempt_number);
      const { data: masteryData } = await supabase
        .from('user_concept_mastery')
        .select('concept_tag, attempt_number, correct_count, total_count, mastery_percent')
        .eq('user_id', user!.id)
        .eq('assessment_id', assessmentId)
        .in('attempt_number', attemptNums)
        .order('concept_tag');
      setConceptMastery(masteryData ?? []);

      // 4. AI insight for latest attempt
      const { data: insightData } = await supabase
        .from('attempt_ai_insights')
        .select('what_went_well, next_steps, model_used')
        .eq('attempt_id', latest.id)
        .maybeSingle();
      setAiInsight(insightData);

      setLoading(false);
    }

    load();
  }, [user?.id, assessmentId]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── No attempts yet ──────────────────────────────────────────────────────────
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

  // ── Computed values ──────────────────────────────────────────────────────────
  const bestScore = Math.max(...attempts.map((a) => a.score ?? 0));
  const totalCorrect = attempts.reduce((s, a) => s + (a.correct_count ?? 0), 0);
  const totalIncorrect = attempts.reduce((s, a) => s + (a.incorrect_count ?? 0), 0);
  const totalAnswered = totalCorrect + totalIncorrect;
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const negMark = NEG_MARKS[assessment.exam] ?? 0;
  const latestIncorrect = sectionResults.reduce((s, r) => s + r.incorrect_count, 0);
  const marksLost = Math.round(latestIncorrect * negMark * 100) / 100;

  const filteredSolutions = SOLUTION_QUESTIONS.filter(
    (item) => filter === 'ALL' || item.type === filter,
  );
  const allowedConceptTags = new Set(filteredSolutions.map((item) => item.conceptTag));
  const filteredConceptMastery = conceptMastery.filter(
    (m) => filter === 'ALL' || allowedConceptTags.has(m.concept_tag),
  );
  const attemptNumbers = [
    ...new Set(filteredConceptMastery.map((m) => m.attempt_number)),
  ].sort((a, b) => a - b);
  const conceptTags = [...new Set(filteredConceptMastery.map((m) => m.concept_tag))];

  function getMastery(tag: string, attemptNum: number): number | null {
    return (
      filteredConceptMastery.find(
        (m) => m.concept_tag === tag && m.attempt_number === attemptNum,
      )?.mastery_percent ?? null
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Block 1: Score Summary ─────────────────────────────────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-semibold text-zinc-900">{bestScore}</span>
            </div>
            <p className="text-xs text-zinc-400">Best Score</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-900 mb-1">{overallAccuracy}%</p>
            <p className="text-xs text-zinc-400">Overall Accuracy</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-900 mb-1">{attempts.length}</p>
            <p className="text-xs text-zinc-400">
              {attempts.length === 1 ? 'Attempt' : 'Attempts'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter dropdown for analytics + solutions ───────────────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">Analytics filter</p>
            <p className="text-xs text-zinc-500">
              Narrow the analytics view and solution panel by question type.
            </p>
          </div>
          <label className="relative inline-flex items-center w-full sm:w-auto">
            <Filter className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as AnalyticsFilter)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-zinc-200 rounded-md text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

      {/* ── Block 2: Marks Lost — prominent rose, negative-marking exams only ─ */}
      {negMark > 0 && marksLost > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-md p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-semibold text-rose-700">
                You left {marksLost} marks on the table
              </p>
              <p className="text-sm text-rose-600 mt-0.5 leading-relaxed">
                {latestIncorrect} incorrect answers &times; {negMark} negative mark in your
                latest attempt. Cutting wrong answers by half recovers{' '}
                {Math.round(marksLost / 2)} marks immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Block 3: Section Breakdown (latest attempt) ───────────────────── */}
      {sectionResults.length > 0 && (
        <div className="bg-white shadow-sm rounded-md p-6">
          <h3 className="text-base font-medium text-zinc-900 mb-4">
            Section Breakdown
            <span className="ml-2 text-xs font-normal text-zinc-400">
              (latest attempt)
            </span>
          </h3>
          <div className="space-y-5">
            {sectionResults.map((sec) => {
              const pct =
                sec.marks_possible > 0
                  ? Math.round((sec.marks_scored / sec.marks_possible) * 100)
                  : 0;
              return (
                <div key={sec.section_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-zinc-700">
                      {sec.section_label}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">
                      {sec.marks_scored}/{sec.marks_possible}
                      <span className="text-xs font-normal text-zinc-400 ml-1">
                        marks
                      </span>
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
            })}
          </div>
        </div>
      )}

      {/* ── Block 4: Concept Mastery ──────────────────────────────────────── */}
      {conceptTags.length > 0 && (
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
            /* Heatmap — 2 or more attempts */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-zinc-400 pb-2 pr-6">
                      Concept
                    </th>
                    {attemptNumbers.map((n) => (
                      <th
                        key={n}
                        className="text-center text-xs font-medium text-zinc-400 pb-2 px-3"
                      >
                        Attempt {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {conceptTags.map((tag) => (
                    <tr key={tag}>
                      <td className="text-xs font-medium text-zinc-700 py-2 pr-6">
                        {tag}
                      </td>
                      {attemptNumbers.map((n) => {
                        const pct = getMastery(tag, n);
                        return (
                          <td key={n} className="text-center py-2 px-3">
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
            /* Horizontal bars — 1 attempt */
            <div className="space-y-3">
              {conceptTags.map((tag) => {
                const pct = getMastery(tag, attemptNumbers[0]);
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

          {/* Legend */}
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

      {/* ── Block 5: AI Insight Panel ─────────────────────────────────────── */}
      {aiInsight && (
        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-medium text-zinc-900">AI Insight</h3>
            <span className="ml-auto text-xs text-zinc-400">Powered by Claude</span>
          </div>

          <div className="space-y-5">
            {/* What went well */}
            <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-700">What went well</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {aiInsight.what_went_well}
              </p>
            </div>

            {/* Next Steps */}
            <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-sm font-medium text-blue-700">Next Steps</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {aiInsight.next_steps}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
