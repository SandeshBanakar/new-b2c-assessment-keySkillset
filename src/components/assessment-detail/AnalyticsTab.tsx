'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { tiptapToPlainText } from '@/utils/tiptapUtils';
import type { Assessment } from '@/types';

// ── Negative marks per exam ───────────────────────────────────────────────────
const NEG_MARKS: Record<string, number> = {
  NEET: 1,
  JEE: 1,
  CLAT: 0.25,
  SAT: 0,
  PMP: 0,
};

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface SectionTab {
  section_name: string;
  q_count: number;
  sort_order: number;
}

interface DbQuestion {
  id: string;
  question_type: string;
  question_text: unknown;
  passage_text: unknown;
  options: { key: string; text: unknown }[];
  correct_answer: string[] | null;
  explanation: unknown;
  concept_tag: string | null;
  section_name: string;
  order_index: number;
}

interface UserAnswer {
  question_id: string;
  user_answer: string | null;
  is_correct: boolean;
  is_skipped: boolean;
  marks_awarded: number;
}

interface SectionCache {
  questions: DbQuestion[];
  userAnswers: UserAnswer[];
}

interface AnalyticsTabProps {
  assessment: Assessment;
  assessmentId: string;
  onSwitchToAttempts: () => void;
  initialAttemptId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsTab({
  assessment,
  assessmentId,
  onSwitchToAttempts,
  initialAttemptId,
}: AnalyticsTabProps) {
  const { user } = useAppContext();

  // ── Core attempt state ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<DbAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    initialAttemptId ?? null,
  );

  // ── Per-attempt analytics (re-fetched on selectedAttemptId change) ─────────
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Concept mastery — all attempts, loaded once ────────────────────────────
  const [conceptMastery, setConceptMastery] = useState<ConceptMastery[]>([]);

  // ── Solutions panel ────────────────────────────────────────────────────────
  const [sectionTabs, setSectionTabs] = useState<SectionTab[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sectionCache, setSectionCache] = useState<
    Map<string, SectionCache | 'loading'>
  >(new Map());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

  // ── Initial load — all completed attempts ─────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    async function loadAttempts() {
      setLoading(true);

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

      // Initialise selected attempt: URL param → latest
      const initId =
        initialAttemptId && completed.find((a) => a.id === initialAttemptId)
          ? initialAttemptId
          : completed[completed.length - 1].id;
      setSelectedAttemptId(initId);

      // Concept mastery — all attempts (for heatmap + delta)
      const attemptNums = completed.map((a) => a.attempt_number);
      const { data: masteryData } = await supabase
        .from('user_concept_mastery')
        .select(
          'concept_tag, attempt_number, correct_count, total_count, mastery_percent',
        )
        .eq('user_id', user!.id)
        .eq('assessment_id', assessmentId)
        .in('attempt_number', attemptNums)
        .order('concept_tag');
      setConceptMastery(masteryData ?? []);

      // Section tabs — derived from question map
      const { data: tabData } = await supabase
        .from('assessment_question_map')
        .select('section_name, order_index')
        .eq('assessment_id', assessmentId);

      if (tabData && tabData.length > 0) {
        const tabMap = new Map<string, { count: number; minOrder: number }>();
        for (const row of tabData) {
          const existing = tabMap.get(row.section_name);
          if (!existing) {
            tabMap.set(row.section_name, { count: 1, minOrder: row.order_index ?? 999 });
          } else {
            existing.count += 1;
            existing.minOrder = Math.min(existing.minOrder, row.order_index ?? 999);
          }
        }
        const tabs: SectionTab[] = Array.from(tabMap.entries())
          .map(([section_name, { count, minOrder }]) => ({
            section_name,
            q_count: count,
            sort_order: minOrder,
          }))
          .sort((a, b) => a.sort_order - b.sort_order);
        setSectionTabs(tabs);
        if (tabs.length > 0) setSelectedSection(tabs[0].section_name);
      }

      setLoading(false);
    }

    loadAttempts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, assessmentId]);

  // ── Per-attempt data — re-fetch on selectedAttemptId change ───────────────
  useEffect(() => {
    if (!selectedAttemptId) return;

    async function loadAttemptData() {
      setAnalyticsLoading(true);

      const [sectionsRes, insightRes] = await Promise.all([
        supabase
          .from('attempt_section_results')
          .select(
            'section_id, section_label, correct_count, incorrect_count, skipped_count, marks_scored, marks_possible, time_spent_seconds, accuracy_percent',
          )
          .eq('attempt_id', selectedAttemptId!)
          .order('section_id'),
        supabase
          .from('attempt_ai_insights')
          .select('what_went_well, next_steps, model_used')
          .eq('attempt_id', selectedAttemptId!)
          .maybeSingle(),
      ]);

      setSectionResults(sectionsRes.data ?? []);
      setAiInsight(insightRes.data ?? null);
      setAnalyticsLoading(false);
    }

    loadAttemptData();
  }, [selectedAttemptId]);

  // ── Lazy-load section questions + user answers ────────────────────────────
  const loadSection = useCallback(
    async (sectionName: string) => {
      if (sectionCache.has(sectionName) || !selectedAttemptId) return;

      setSectionCache((prev) => new Map(prev).set(sectionName, 'loading'));

      // Questions for this section
      const { data: qData } = await supabase
        .from('assessment_question_map')
        .select(
          `order_index, section_name,
           questions (
             id, question_type, question_text, passage_text,
             options, correct_answer, explanation, concept_tag
           )`,
        )
        .eq('assessment_id', assessmentId)
        .eq('section_name', sectionName)
        .order('order_index');

      const questions: DbQuestion[] = (qData ?? [])
        .filter((row) => row.questions)
        .map((row) => ({
          ...(row.questions as unknown as Omit<DbQuestion, 'section_name' | 'order_index'>),
          section_name: row.section_name,
          order_index: row.order_index,
        }));

      // User answers for this attempt × these questions
      let userAnswers: UserAnswer[] = [];
      if (questions.length > 0) {
        const qIds = questions.map((q) => q.id);
        const { data: ansData } = await supabase
          .from('attempt_answers')
          .select('question_id, user_answer, is_correct, is_skipped, marks_awarded')
          .eq('attempt_id', selectedAttemptId)
          .in('question_id', qIds);
        userAnswers = ansData ?? [];
      }

      setSectionCache((prev) =>
        new Map(prev).set(sectionName, { questions, userAnswers }),
      );
    },
    [assessmentId, selectedAttemptId, sectionCache],
  );

  // Load first section automatically when tabs arrive
  useEffect(() => {
    if (selectedSection) loadSection(selectedSection);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, selectedAttemptId]);

  // Bust section cache when selected attempt changes
  useEffect(() => {
    setSectionCache(new Map());
    setExpandedQuestions(new Set());
  }, [selectedAttemptId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  // ── Derived values ────────────────────────────────────────────────────────
  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) ?? attempts[attempts.length - 1];
  const isLatest = selectedAttempt.id === attempts[attempts.length - 1].id;
  const isAiEligible =
    user?.subscriptionTier === 'professional' ||
    user?.subscriptionTier === 'premium';

  const negMark = NEG_MARKS[assessment.exam] ?? 0;
  const latestIncorrect = sectionResults.reduce(
    (s, r) => s + r.incorrect_count,
    0,
  );
  const marksLost = Math.round(latestIncorrect * negMark * 100) / 100;

  // Concept mastery for selected attempt
  const selAttemptNum = selectedAttempt.attempt_number;
  const selAttemptMastery = conceptMastery.filter(
    (m) => m.attempt_number === selAttemptNum,
  );

  // Attempt 1 baseline for delta
  const attempt1Mastery = conceptMastery.filter((m) => m.attempt_number === 1);
  const mastery1Map = new Map(attempt1Mastery.map((m) => [m.concept_tag, m.mastery_percent]));

  // Heatmap: all unique attempt numbers across all mastery rows
  const allAttemptNums = [
    ...new Set(conceptMastery.map((m) => m.attempt_number)),
  ].sort((a, b) => a - b);
  const allConceptTags = [...new Set(conceptMastery.map((m) => m.concept_tag))];

  function getMastery(tag: string, attemptNum: number): number | null {
    return (
      conceptMastery.find(
        (m) => m.concept_tag === tag && m.attempt_number === attemptNum,
      )?.mastery_percent ?? null
    );
  }

  // Strengths and weak spots for selected attempt
  const strengths = selAttemptMastery
    .filter((m) => (m.mastery_percent ?? 0) >= 80)
    .sort((a, b) => (b.mastery_percent ?? 0) - (a.mastery_percent ?? 0))
    .slice(0, 3);
  const weakSpots = selAttemptMastery
    .filter((m) => (m.mastery_percent ?? 0) < 60)
    .sort((a, b) => (a.mastery_percent ?? 0) - (b.mastery_percent ?? 0))
    .slice(0, 3);

  // Solutions panel helpers
  const currentSection = selectedSection
    ? sectionCache.get(selectedSection)
    : undefined;
  const sectionData =
    currentSection && currentSection !== 'loading' ? currentSection : null;

  function getOption(q: DbQuestion, key: string): string {
    const opt = q.options?.find((o) => o.key === key);
    return opt ? tiptapToPlainText(opt.text) : key;
  }

  function getUserAnswer(q: DbQuestion): string | null {
    return sectionData?.userAnswers.find((a) => a.question_id === q.id)?.user_answer ?? null;
  }

  function isUserAnswerCorrect(q: DbQuestion): boolean {
    return sectionData?.userAnswers.find((a) => a.question_id === q.id)?.is_correct ?? false;
  }

  function isSkipped(q: DbQuestion): boolean {
    return sectionData?.userAnswers.find((a) => a.question_id === q.id)?.is_skipped ?? false;
  }

  function toggleQuestion(id: string) {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">

      {/* ── Attempt pill selector ───────────────────────────────────────────── */}
      <div className="bg-white shadow-sm rounded-md px-6 py-4">
        <p className="text-xs font-medium text-zinc-500 mb-3">Viewing attempt</p>
        <div className="flex flex-wrap gap-2">
          {attempts.map((attempt) => {
            const isSelected = attempt.id === selectedAttemptId;
            const isLatestPill = attempt.id === attempts[attempts.length - 1].id;
            return (
              <button
                key={attempt.id}
                onClick={() => setSelectedAttemptId(attempt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                Attempt {attempt.attempt_number}
                {isLatestPill && (
                  <span
                    className={`text-xs ${isSelected ? 'text-blue-200' : 'text-zinc-400'}`}
                  >
                    (Latest)
                  </span>
                )}
                {attempt.score !== null && (
                  <span
                    className={`text-xs font-medium ${isSelected ? 'text-blue-200' : 'text-zinc-400'}`}
                  >
                    · {attempt.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {analyticsLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!analyticsLoading && (
        <>
          {/* ── Block 1: Score Summary ────────────────────────────────────────── */}
          <div className="bg-white shadow-sm rounded-md p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-2xl font-semibold text-zinc-900">
                    {selectedAttempt.score ?? selectedAttempt.correct_count ?? 0}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {selectedAttempt.score !== null ? 'Score' : 'Correct'}
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-zinc-900 mb-1">
                  {selectedAttempt.accuracy_percent !== null
                    ? `${Math.round(selectedAttempt.accuracy_percent)}%`
                    : selectedAttempt.correct_count !== null &&
                      selectedAttempt.incorrect_count !== null
                    ? `${Math.round(
                        (selectedAttempt.correct_count /
                          Math.max(
                            1,
                            selectedAttempt.correct_count +
                              selectedAttempt.incorrect_count,
                          )) *
                          100,
                      )}%`
                    : '—'}
                </p>
                <p className="text-xs text-zinc-400">Accuracy</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-zinc-900 mb-1">
                  {attempts.length}
                </p>
                <p className="text-xs text-zinc-400">
                  {attempts.length === 1 ? 'Attempt' : 'Total Attempts'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Block 2: Marks Lost — hero, negative-marking exams only ──────── */}
          {negMark > 0 && marksLost > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-md p-5">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-base font-semibold text-rose-700">
                    You left {marksLost} marks on the table
                  </p>
                  <p className="text-sm text-rose-600 mt-0.5 leading-relaxed">
                    {latestIncorrect} incorrect answers &times; {negMark} negative mark.
                    Cutting wrong answers by half recovers{' '}
                    {Math.round(marksLost / 2)} marks immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Block 3: Strengths + Weak Spots ──────────────────────────────── */}
          {(strengths.length > 0 || weakSpots.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-white shadow-sm rounded-md p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-medium text-zinc-900">Strengths</h3>
                </div>
                {strengths.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    Score above 80% on any concept to see strengths.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {strengths.map((m) => (
                      <div key={m.concept_tag} className="flex items-center justify-between">
                        <span className="text-xs text-zinc-700">{m.concept_tag}</span>
                        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                          {Math.round(m.mastery_percent ?? 0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weak Spots */}
              <div className="bg-white shadow-sm rounded-md p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-medium text-zinc-900">Needs Work</h3>
                </div>
                {weakSpots.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    No concepts below 60% — well done.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {weakSpots.map((m) => (
                      <div key={m.concept_tag} className="flex items-center justify-between">
                        <span className="text-xs text-zinc-700">{m.concept_tag}</span>
                        <span className="text-xs font-medium bg-rose-100 text-rose-700 rounded-full px-2 py-0.5">
                          {Math.round(m.mastery_percent ?? 0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Block 4: Section Breakdown ────────────────────────────────────── */}
          {sectionResults.length > 0 && (
            <div className="bg-white shadow-sm rounded-md p-6">
              <h3 className="text-base font-medium text-zinc-900 mb-4">
                Section Breakdown
              </h3>
              <div className="space-y-5">
                {sectionResults.map((sec) => {
                  const pct =
                    sec.marks_possible > 0
                      ? Math.round(
                          (sec.marks_scored / sec.marks_possible) * 100,
                        )
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
                        <span className="text-emerald-600">
                          {sec.correct_count} correct
                        </span>
                        <span className="text-rose-600">
                          {sec.incorrect_count} wrong
                        </span>
                        <span className="text-zinc-400">
                          {sec.skipped_count} skipped
                        </span>
                        <span className="ml-auto text-zinc-500">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Block 5: Concept Mastery ──────────────────────────────────────── */}
          {allConceptTags.length > 0 && (
            <div className="bg-white shadow-sm rounded-md p-6">
              <div className="mb-4">
                <h3 className="text-base font-medium text-zinc-900">
                  Concept Mastery
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  All concepts across attempts. Arrows show change since Attempt 1.
                </p>
              </div>

              {allAttemptNums.length >= 2 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-zinc-400 pb-2 pr-6">
                          Concept
                        </th>
                        {allAttemptNums.map((n) => (
                          <th
                            key={n}
                            className="text-center text-xs font-medium text-zinc-400 pb-2 px-3"
                          >
                            Attempt {n}
                          </th>
                        ))}
                        {selAttemptNum > 1 && (
                          <th className="text-center text-xs font-medium text-zinc-400 pb-2 px-3">
                            Trend
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {allConceptTags.map((tag) => {
                        const base = mastery1Map.get(tag) ?? null;
                        const current = getMastery(tag, selAttemptNum);
                        const delta =
                          selAttemptNum > 1 && base !== null && current !== null
                            ? Math.round(current - base)
                            : null;

                        return (
                          <tr key={tag}>
                            <td className="text-xs font-medium text-zinc-700 py-2 pr-6">
                              {tag}
                            </td>
                            {allAttemptNums.map((n) => {
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
                            {selAttemptNum > 1 && (
                              <td className="text-center py-2 px-3">
                                {delta === null ? (
                                  <span className="text-xs text-zinc-400">—</span>
                                ) : delta > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                                    <TrendingUp className="w-3 h-3" />
                                    +{delta}%
                                  </span>
                                ) : delta < 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-rose-600">
                                    <TrendingDown className="w-3 h-3" />
                                    {delta}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-400">→</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  {allConceptTags.map((tag) => {
                    const pct = getMastery(tag, allAttemptNums[0] ?? 1);
                    return (
                      <div key={tag}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-zinc-700">
                            {tag}
                          </span>
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

          {/* ── Block 6: AI Insight Panel ─────────────────────────────────────── */}
          <div className="bg-white shadow-sm rounded-md p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-medium text-zinc-900">AI Insight</h3>
              {isAiEligible && (
                <span className="ml-auto text-xs text-zinc-400">
                  Powered by Claude
                </span>
              )}
            </div>

            {isAiEligible && aiInsight ? (
              <div className="space-y-4">
                <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700">
                      What went well
                    </p>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {aiInsight.what_went_well}
                  </p>
                </div>
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
            ) : (
              <div className="space-y-4">
                <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700">
                      What went well
                    </p>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    You are making progress. Upgrade to Pro or Premium for full AI-powered insights.
                  </p>
                </div>
                <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-sm font-medium text-blue-700">Next Steps</p>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed mb-4">
                    Unlock personalised AI insights and next-step recommendations.
                  </p>
                  <button
                    onClick={() => (window.location.href = '/plans')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Block 7: Solutions Panel ──────────────────────────────────────── */}
          {sectionTabs.length > 0 && (
            <div className="bg-white shadow-sm rounded-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-medium text-zinc-900">
                  Solutions
                </h3>
                {!isLatest && (
                  <span className="ml-auto text-xs text-zinc-400">
                    Showing correct answers · your answers for Attempt {selAttemptNum}
                  </span>
                )}
              </div>

              {/* Section tabs — horizontal scrollable */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-5 border-b border-zinc-100 scrollbar-none">
                {sectionTabs.map((tab) => {
                  const isActive = tab.section_name === selectedSection;
                  return (
                    <button
                      key={tab.section_name}
                      onClick={() => {
                        setSelectedSection(tab.section_name);
                        loadSection(tab.section_name);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors shrink-0 ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {tab.section_name}
                      <span
                        className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${
                          isActive
                            ? 'bg-blue-600 text-blue-100'
                            : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {tab.q_count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Questions for selected section */}
              {currentSection === 'loading' && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {currentSection === undefined && (
                <p className="text-sm text-zinc-400 text-center py-8">
                  Select a section to view questions and solutions.
                </p>
              )}

              {sectionData && sectionData.questions.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-8">
                  No questions seeded for this section yet.
                </p>
              )}

              {sectionData && sectionData.questions.length > 0 && (
                <div className="space-y-3">
                  {sectionData.questions.map((q, idx) => {
                    const isExpanded = expandedQuestions.has(q.id);
                    const userAns = getUserAnswer(q);
                    const correct = isUserAnswerCorrect(q);
                    const skipped = isSkipped(q);
                    const correctKeys = q.correct_answer ?? [];

                    return (
                      <div
                        key={q.id}
                        className="border border-zinc-100 rounded-md overflow-hidden"
                      >
                        {/* Question header — always visible */}
                        <button
                          onClick={() => toggleQuestion(q.id)}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                        >
                          <span className="shrink-0 text-xs font-medium text-zinc-400 mt-0.5 w-6">
                            Q{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 leading-relaxed line-clamp-2">
                              {tiptapToPlainText(q.question_text) || '(Question text)'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {userAns !== null && !skipped ? (
                                <span
                                  className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                                    correct
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {correct ? 'Correct' : `Your answer: ${userAns}`}
                                </span>
                              ) : skipped ? (
                                <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-zinc-100 text-zinc-500">
                                  Skipped
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-400">
                                  No answer data
                                </span>
                              )}
                              {q.concept_tag && (
                                <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                                  {q.concept_tag}
                                </span>
                              )}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          )}
                        </button>

                        {/* Expanded: passage + options + explanation */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-3">
                            {/* Passage */}
                            {q.passage_text != null && (
                              <div className="rounded-md bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700 leading-relaxed">
                                <p className="font-medium text-zinc-600 mb-1">Passage</p>
                                {tiptapToPlainText(q.passage_text)}
                              </div>
                            )}

                            {/* Full question text (if truncated above) */}
                            <p className="text-sm text-zinc-800 leading-relaxed">
                              {tiptapToPlainText(q.question_text)}
                            </p>

                            {/* Options */}
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-1.5">
                                {q.options.map((opt) => {
                                  const isCorrect = correctKeys.includes(opt.key);
                                  const isUserChoice = userAns === opt.key;
                                  return (
                                    <div
                                      key={opt.key}
                                      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                          : isUserChoice && !isCorrect
                                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                                          : 'bg-white border-zinc-200 text-zinc-700'
                                      }`}
                                    >
                                      <span className="font-medium shrink-0">
                                        {opt.key}.
                                      </span>
                                      <span>{tiptapToPlainText(opt.text)}</span>
                                      {isCorrect && (
                                        <span className="ml-auto text-xs text-emerald-600 shrink-0">
                                          ✓ Correct
                                        </span>
                                      )}
                                      {isUserChoice && !isCorrect && (
                                        <span className="ml-auto text-xs text-rose-600 shrink-0">
                                          Your answer
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Explanation */}
                            {q.explanation != null && (
                              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-zinc-700">
                                <p className="font-medium text-blue-700 mb-1 text-xs">
                                  Explanation
                                </p>
                                {tiptapToPlainText(q.explanation)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fallback if no questions seeded yet */}
          {sectionTabs.length === 0 && (
            <div className="bg-white shadow-sm rounded-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-medium text-zinc-500">Solutions</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Questions are being seeded for this assessment. Check back soon.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
