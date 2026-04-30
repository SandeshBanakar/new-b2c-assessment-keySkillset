'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Lock,
  Target,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { tiptapToPlainText } from '@/utils/tiptapUtils';
import AttemptPillFilter from '@/components/ui/AttemptPillFilter';
import ScoreTrajectoryChart from '@/components/assessment-detail/ScoreTrajectoryChart';
import RankPredictionCard, { type RankLookupRow } from '@/components/assessment-detail/RankPredictionCard';
import MistakeIntelligence, { type MIAttemptAnswer } from '@/components/assessment-detail/MistakeIntelligence';
import ConceptMasteryPanel from '@/components/assessment-detail/ConceptMasteryPanel';
import type { Assessment } from '@/types';

// ── Local types for DB-sourced exam config ────────────────────────────────────
interface ExamCatConfig {
  id: string;
}

interface AssessmentItemConfig {
  assessment_config: {
    total_marks?: number | null;
    negative_marks?: number | null;
  } | null;
}

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

interface DbSubQuestion {
  id: string;
  parent_question_id: string;
  question_type: string;
  question_text: unknown;
  options: { key: string; text: unknown }[];
  correct_answer: string[] | null;
  explanation: unknown;
  order_index: number;
}

interface DbQuestion {
  id: string;
  question_type: string;
  question_text: unknown;
  passage_text: unknown;
  options: { key: string; text: unknown }[];
  correct_answer: string[] | null;
  acceptable_answers: string[] | null;
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
  subQuestions: Map<string, DbSubQuestion[]>;
}

interface AnalyticsTabProps {
  assessment: Assessment;
  assessmentId: string;
  onSwitchToAttempts: () => void;
  initialAttemptId?: string;
  userTier: string;
}

type QuestionOption = {
  key?: string | null;
  text: unknown;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionBarClass(pct: number): string {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

/** Returns the display string for a question's correct answer key(s). */
function getCorrectDisplay(q: DbQuestion): string {
  if (q.question_type === 'NUMERIC') {
    if (Array.isArray(q.acceptable_answers) && q.acceptable_answers.length > 0) {
      return q.acceptable_answers[0];
    }
    return '—';
  }
  if (Array.isArray(q.correct_answer) && q.correct_answer.length > 0) {
    return q.correct_answer.join(', ');
  }
  return '—';
}

function getOptionMeta(opt: QuestionOption, index: number) {
  const trimmedKey = typeof opt.key === 'string' ? opt.key.trim() : '';
  if (trimmedKey) {
    return {
      optionKey: trimmedKey,
      optionLabel: trimmedKey,
    };
  }

  const fallbackKey = `option-${index + 1}`;
  return {
    optionKey: fallbackKey,
    optionLabel: `${index + 1}`,
  };
}

/** Collapsed-row status badge: always shows outcome + answer summary. */
function QuestionStatusBadge({
  userAns,
  isCorrect,
  isSkipped,
  correctDisplay,
  hasData,
}: {
  userAns: string | null;
  isCorrect: boolean;
  isSkipped: boolean;
  correctDisplay: string;
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <span className="text-xs text-zinc-400">No answer data</span>
    );
  }

  if (isSkipped) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-zinc-100 text-zinc-500">
        — Skipped · Correct: {correctDisplay}
      </span>
    );
  }

  if (userAns === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-zinc-100 text-zinc-500">
        — Not answered · Correct: {correctDisplay}
      </span>
    );
  }

  if (isCorrect) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700">
        ✓ Correct · Your answer: {userAns}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-rose-50 text-rose-700">
      ✗ Wrong · Your answer: {userAns} · Correct: {correctDisplay}
    </span>
  );
}

/** Two-column marks display for expanded accordion. */
function MarksRow({ marksAwarded }: { marksAwarded: number }) {
  const earned = marksAwarded > 0 ? marksAwarded : 0;
  const lost = marksAwarded < 0 ? Math.abs(marksAwarded) : 0;

  return (
    <div className="flex rounded-md border border-zinc-100 overflow-hidden">
      <div className="flex-1 text-center py-2.5">
        <p className={`text-sm font-semibold ${earned > 0 ? 'text-emerald-600' : 'text-zinc-400'}`}>
          +{earned}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">Marks Earned</p>
      </div>
      <div className="w-px bg-zinc-100" />
      <div className="flex-1 text-center py-2.5">
        <p className={`text-sm font-semibold ${lost > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
          −{lost}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">Marks Lost</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsTab({
  assessment,
  assessmentId,
  onSwitchToAttempts,
  initialAttemptId,
  userTier,
}: AnalyticsTabProps) {
  const { user, updateTargetScore } = useAppContext();

  // AI Insights: Pro and Premium only — completely hidden for Free/Basic
  const isAiEligible = userTier === 'professional' || userTier === 'premium';

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

  // ── Rank prediction lookup (once on mount) ────────────────────────────────
  const [rankLookup, setRankLookup] = useState<RankLookupRow[]>([]);
  const [rankDataYear, setRankDataYear] = useState<number>(2025);

  // ── Attempt answers — used by MistakeIntelligence ────────────────────────
  const [attemptAnswers, setAttemptAnswers] = useState<MIAttemptAnswer[] | null>(null);

  // ── Exam config from DB — replaces hardcoded NEG_MARKS / SCORE_MAX ────────
  const [scoreMax, setScoreMax] = useState<number>(100);
  const [negMark, setNegMark] = useState<number>(0);
  const [dbTagSectionMap, setDbTagSectionMap] = useState<Record<string, string>>({});
  const [dbSectionOrder, setDbSectionOrder] = useState<string[]>([]);

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

      // Concept mastery + exam category config + assessment_items config — fetched in parallel
      const attemptNums = completed.map((a) => a.attempt_number);
      const [masteryRes, examCatRes, itemRes] = await Promise.all([
        supabase
          .from('user_concept_mastery')
          .select('concept_tag, attempt_number, correct_count, total_count, mastery_percent')
          .eq('user_id', user!.id)
          .eq('assessment_id', assessmentId)
          .in('attempt_number', attemptNums)
          .order('concept_tag'),
        supabase
          .from('exam_categories')
          .select('id')
          .eq('slug', assessment.exam.toLowerCase())
          .maybeSingle(),
        supabase
          .from('assessment_items')
          .select('assessment_config')
          .eq('assessments_id', assessmentId)
          .maybeSingle(),
      ]);
      setConceptMastery(masteryRes.data ?? []);

      // Source neg_mark and score_max from assessment_items.assessment_config JSONB
      const itemData = itemRes.data as AssessmentItemConfig | null;
      const negMarkValue = itemData?.assessment_config?.negative_marks ?? 0;
      const scoreTotalMarks = itemData?.assessment_config?.total_marks ?? null;
      setNegMark(negMarkValue);
      setScoreMax(scoreTotalMarks ?? assessment.questionCount ?? 100);

      // Exam config: tag→section map, rank prediction (needs exam_categories.id only)
      const examCat = examCatRes.data as ExamCatConfig | null;
      if (examCat) {

        const [tagMapRes, rankRes] = await Promise.all([
          supabase
            .from('concept_tag_section_map')
            .select('concept_tag, section_name, section_display_order')
            .eq('exam_category_id', examCat.id)
            .order('section_display_order'),
          supabase
            .from('rank_prediction_tables')
            .select('data, year')
            .eq('exam_category_id', examCat.id)
            .eq('is_active', true)
            .maybeSingle(),
        ]);

        if (tagMapRes.data && tagMapRes.data.length > 0) {
          const tagMap: Record<string, string> = {};
          const seenSections = new Map<string, number>();
          for (const row of tagMapRes.data) {
            tagMap[row.concept_tag] = row.section_name;
            if (!seenSections.has(row.section_name)) {
              seenSections.set(row.section_name, row.section_display_order ?? 0);
            }
          }
          setDbTagSectionMap(tagMap);
          setDbSectionOrder(
            [...seenSections.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name),
          );
        }

        if (rankRes.data) {
          setRankLookup(rankRes.data.data as RankLookupRow[]);
          setRankDataYear(rankRes.data.year as number);
        }
      }

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
      setAttemptAnswers(null); // reset to loading state

      const [sectionsRes, insightRes, answersRes] = await Promise.all([
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
        supabase
          .from('attempt_answers')
          .select('question_id, is_correct, is_skipped, time_spent_seconds, marks_awarded, concept_tag, section_id')
          .eq('attempt_id', selectedAttemptId!),
      ]);

      setSectionResults(sectionsRes.data ?? []);
      setAiInsight(insightRes.data ?? null);
      setAttemptAnswers(
        (answersRes.data ?? []).map((r) => ({
          question_id:        r.question_id as string,
          is_correct:         r.is_correct as boolean,
          is_skipped:         r.is_skipped as boolean,
          time_spent_seconds: r.time_spent_seconds as number,
          marks_awarded:      r.marks_awarded as number,
          concept_tag:        r.concept_tag as string | null,
          section_id:         r.section_id as string | null,
        })),
      );
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
      // concept_tag column does not exist on questions table (it's concept_tag_id uuid);
      // omitting it prevents a PostgREST 400 that silently nulls the entire result.
      const { data: qData } = await supabase
        .from('assessment_question_map')
        .select(
          `order_index, section_name,
           questions (
             id, question_type, question_text, passage_text,
             options, correct_answer, acceptable_answers,
             explanation
           )`,
        )
        .eq('assessment_id', assessmentId)
        .eq('section_name', sectionName)
        .order('order_index');

      const questions: DbQuestion[] = (qData ?? [])
        .filter((row) => row.questions)
        .map((row) => ({
          ...(row.questions as unknown as Omit<DbQuestion, 'section_name' | 'order_index'>),
          concept_tag: null,
          section_name: row.section_name,
          order_index: row.order_index,
        }));

      // Fetch sub-questions for any PASSAGE_MULTI questions
      const passageMultiIds = questions
        .filter((q) => q.question_type === 'PASSAGE_MULTI')
        .map((q) => q.id);

      const subQuestions = new Map<string, DbSubQuestion[]>();
      if (passageMultiIds.length > 0) {
        const { data: subData } = await supabase
          .from('passage_sub_questions')
          .select('id, parent_question_id, question_text, options, correct_answer, explanation, order_index')
          .in('parent_question_id', passageMultiIds)
          .order('order_index');
        // passage_sub_questions are always MCQ — assign a stable question_type

        for (const sub of subData ?? []) {
          const typed: DbSubQuestion = { ...sub as Omit<DbSubQuestion,'question_type'>, question_type: 'MCQ_SINGLE' };
          const existing = subQuestions.get(sub.parent_question_id) ?? [];
          subQuestions.set(sub.parent_question_id, [...existing, typed]);
        }
      }

      // User answers for this attempt × these questions + sub-questions
      let userAnswers: UserAnswer[] = [];
      const allQuestionIds = [
        ...questions.map((q) => q.id),
        ...Array.from(subQuestions.values()).flat().map((sq) => sq.id),
      ];

      if (allQuestionIds.length > 0) {
        const { data: ansData } = await supabase
          .from('attempt_answers')
          .select('question_id, user_answer, is_correct, is_skipped, marks_awarded')
          .eq('attempt_id', selectedAttemptId)
          .in('question_id', allQuestionIds);
        userAnswers = ansData ?? [];
      }

      setSectionCache((prev) =>
        new Map(prev).set(sectionName, { questions, userAnswers, subQuestions }),
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

  const targetScore =
    assessment.exam === 'NEET' ? (user?.targetNeetScore ?? null) :
    assessment.exam === 'JEE'  ? (user?.targetJeeScore ?? null) :
    assessment.exam === 'CLAT' ? (user?.targetClatScore ?? null) :
    null;

  const isLatest = selectedAttempt.id === attempts[attempts.length - 1].id;
  const selAttemptNum = selectedAttempt.attempt_number;

  // ── Concept mastery section mapping ───────────────────────────────────────
  // Primary: section_id from attempt_answers → section_label (real exam-engine data)
  // Secondary: concept_tag_section_map from DB (loaded in loadAttempts)
  const dynamicTagSectionMap: Record<string, string> = {};
  for (const ans of attemptAnswers ?? []) {
    if (ans.concept_tag && ans.section_id) {
      const label = sectionResults.find((s) => s.section_id === ans.section_id)?.section_label ?? ans.section_id;
      dynamicTagSectionMap[ans.concept_tag] = label;
    }
  }
  const resolvedTagSectionMap = Object.keys(dynamicTagSectionMap).length > 0
    ? dynamicTagSectionMap
    : dbTagSectionMap;

  const hasSections = Object.keys(resolvedTagSectionMap).length > 0;
  const masteryTagSectionMap = hasSections
    ? resolvedTagSectionMap
    : Object.fromEntries(conceptMastery.map((m) => [m.concept_tag, 'All Topics']));
  const masterySections = hasSections
    ? (sectionResults.length > 0
        ? [...new Set(sectionResults.map((s) => s.section_label))]
        : (dbSectionOrder.length > 0 ? dbSectionOrder : ['All Topics']))
    : ['All Topics'];

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

  function getAnswerForQuestion(questionId: string): UserAnswer | undefined {
    return sectionData?.userAnswers.find((a) => a.question_id === questionId);
  }

  function toggleQuestion(id: string) {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Renders a single question row (used for both top-level and sub-questions)
  function renderQuestionRow(
    q: { id: string; question_type: string; question_text: unknown; options: { key: string; text: unknown }[]; correct_answer: string[] | null; acceptable_answers?: string[] | null; explanation: unknown; concept_tag?: string | null },
    idx: number,
    label: string,
    isSubQuestion = false,
  ) {
    const ans = getAnswerForQuestion(q.id);
    const hasData = ans !== undefined;
    const userAns = ans?.user_answer ?? null;
    const isCorrect = ans?.is_correct ?? false;
    const isSkipped = ans?.is_skipped ?? false;
    const marksAwarded = ans?.marks_awarded ?? 0;
    const correctKeys = q.correct_answer ?? [];
    const acceptableAnswers = (q as DbQuestion).acceptable_answers ?? null;
    const correctDisplay =
      q.question_type === 'NUMERIC'
        ? (acceptableAnswers?.[0] ?? '—')
        : (correctKeys.join(', ') || '—');

    const isExpanded = expandedQuestions.has(q.id);

    return (
      <div
        key={q.id}
        className={`border border-zinc-100 rounded-md overflow-hidden ${isSubQuestion ? 'ml-4 border-zinc-200' : ''}`}
      >
        {/* Question header — always visible */}
        <button
          onClick={() => toggleQuestion(q.id)}
          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
        >
          <span className="shrink-0 text-xs font-medium text-zinc-400 mt-0.5 w-6">
            {label}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-800 leading-relaxed line-clamp-2">
              {tiptapToPlainText(q.question_text) || '(Question text)'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <QuestionStatusBadge
                userAns={userAns}
                isCorrect={isCorrect}
                isSkipped={isSkipped}
                correctDisplay={correctDisplay}
                hasData={hasData}
              />
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

        {/* Expanded: full content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-3">
            {/* Full question text */}
            <p className="text-sm text-zinc-800 leading-relaxed">
              {tiptapToPlainText(q.question_text)}
            </p>

            {/* Options */}
            {q.options && q.options.length > 0 && (
              <div className="space-y-1.5">
                {q.options.map((opt, index) => {
                  const { optionKey, optionLabel } = getOptionMeta(opt, index);
                  const isCorrectOpt = correctKeys.includes(optionKey);
                  const isUserChoice = userAns === optionKey;
                  return (
                    <div
                      key={`${q.id}-${optionKey}-${index}`}
                      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                        isCorrectOpt
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : isUserChoice && !isCorrectOpt
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-white border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <span className="font-medium shrink-0">{optionLabel}.</span>
                      <span>{tiptapToPlainText(opt.text)}</span>
                      {isCorrectOpt && (
                        <span className="ml-auto text-xs text-emerald-600 shrink-0">
                          ✓ Correct
                        </span>
                      )}
                      {isUserChoice && !isCorrectOpt && (
                        <span className="ml-auto text-xs text-rose-600 shrink-0">
                          Your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Marks row — two column */}
            {hasData && (
              <MarksRow marksAwarded={marksAwarded} />
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
  }

  return (
    <div className="space-y-4">

      {/* ── Attempt pill selector ───────────────────────────────────────────── */}
      <AttemptPillFilter
        attempts={attempts}
        selectedId={selectedAttemptId ?? ''}
        onChange={setSelectedAttemptId}
      />

      {analyticsLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!analyticsLoading && (
        <>
          {/* ── Block 3: Score Trajectory ─────────────────────────────────────── */}
          <ScoreTrajectoryChart
            attempts={attempts.map((a) => ({
              id: a.id,
              attempt_number: a.attempt_number,
              score: a.score,
              accuracy_percent: a.accuracy_percent,
              completed_at: a.completed_at,
              is_free_attempt: a.attempt_number === 1,
            }))}
            exam={assessment.exam}
            targetScore={targetScore}
            onSetTarget={(score) => updateTargetScore(assessment.exam as 'NEET' | 'JEE' | 'CLAT', score)}
            scoreMax={scoreMax}
          />

          {/* ── Block 4: Rank Prediction — shown when DB has rank data for this exam ── */}
          {rankLookup.length > 0 && (
            <RankPredictionCard
              exam={assessment.exam as 'NEET' | 'JEE' | 'CLAT'}
              currentScore={selectedAttempt.score}
              targetScore={targetScore}
              lookupData={rankLookup}
              dataYear={rankDataYear}
            />
          )}

          {/* ── Block 5: Section Breakdown ────────────────────────────────────── */}
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

          {/* ── Block 7: Mistake Intelligence ────────────────────────────────── */}
          <MistakeIntelligence
            attemptAnswers={attemptAnswers}
            exam={assessment.exam}
            negMark={negMark}
          />

          {/* ── Block 8: Concept Mastery ──────────────────────────────────────── */}
          <ConceptMasteryPanel
            conceptMastery={conceptMastery}
            tagSectionMap={masteryTagSectionMap}
            sections={masterySections}
            attempts={attempts.map((a) => ({
              attempt_number: a.attempt_number,
              completed_at: a.completed_at,
            }))}
          />

          {/* ── Block 10: AI Insight — Pro/Premium only ───────────────────────── */}
          {isAiEligible ? (
            <div className="bg-white shadow-sm rounded-md p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-medium text-zinc-900">AI Insight</h3>
                <span className="ml-auto text-xs text-zinc-400">
                  Powered by Claude
                </span>
              </div>

              {aiInsight ? (
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
                <p className="text-sm text-zinc-400">
                  AI insights are not available for this attempt.
                </p>
              )}
            </div>
          ) : (
            /* Locked panel for Free/Basic — clear gate, no misleading teaser */
            <div className="bg-white shadow-sm rounded-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-zinc-300" />
                <h3 className="text-base font-medium text-zinc-400">AI Insights</h3>
                <Lock className="w-3.5 h-3.5 text-zinc-300 ml-0.5" />
              </div>
              <div className="rounded-md bg-zinc-50 border border-zinc-200 p-5 text-center">
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Upgrade to Pro or Premium to unlock personalised AI insights
                  powered by Claude — including what went well and targeted next steps.
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
                    Showing answers for Attempt {selAttemptNum}
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
                    const subQs = sectionData.subQuestions.get(q.id) ?? [];
                    const isPassageMulti = q.question_type === 'PASSAGE_MULTI';

                    // Passage text shown above question for PASSAGE_SINGLE / PASSAGE_MULTI
                    const hasPassage = q.passage_text != null;

                    if (isPassageMulti && subQs.length > 0) {
                      // PASSAGE_MULTI: render passage header + nested sub-question rows
                      return (
                        <div key={q.id} className="border border-zinc-100 rounded-md overflow-hidden">
                          {/* Passage header */}
                          <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100">
                            <p className="text-xs font-medium text-zinc-500 mb-1">
                              Passage {idx + 1}
                            </p>
                            {hasPassage && (
                              <p className="text-sm text-zinc-700 leading-relaxed">
                                {tiptapToPlainText(q.passage_text)}
                              </p>
                            )}
                          </div>
                          {/* Sub-questions */}
                          <div className="space-y-2 p-3">
                            {subQs.map((sq, sqIdx) =>
                              renderQuestionRow(
                                { ...sq, concept_tag: q.concept_tag, acceptable_answers: null as string[] | null },
                                sqIdx,
                                `${idx + 1}.${sqIdx + 1}`,
                                true,
                              )
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Standard question (MCQ_SINGLE, MCQ_MULTI, NUMERIC, PASSAGE_SINGLE)
                    return (
                      <div
                        key={q.id}
                        className="border border-zinc-100 rounded-md overflow-hidden"
                      >
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
                              {(() => {
                                const ans = getAnswerForQuestion(q.id);
                                const hasData = ans !== undefined;
                                const userAns = ans?.user_answer ?? null;
                                const isCorrect = ans?.is_correct ?? false;
                                const isSkipped = ans?.is_skipped ?? false;
                                const correctDisplay = getCorrectDisplay(q);
                                return (
                                  <QuestionStatusBadge
                                    userAns={userAns}
                                    isCorrect={isCorrect}
                                    isSkipped={isSkipped}
                                    correctDisplay={correctDisplay}
                                    hasData={hasData}
                                  />
                                );
                              })()}
                              {q.concept_tag && (
                                <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                                  {q.concept_tag}
                                </span>
                              )}
                            </div>
                          </div>
                          {expandedQuestions.has(q.id) ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          )}
                        </button>

                        {expandedQuestions.has(q.id) && (
                          <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-3">
                            {/* Passage (PASSAGE_SINGLE) */}
                            {hasPassage && (
                              <div className="rounded-md bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700 leading-relaxed">
                                <p className="font-medium text-zinc-600 mb-1">Passage</p>
                                {tiptapToPlainText(q.passage_text)}
                              </div>
                            )}

                            {/* Full question text */}
                            <p className="text-sm text-zinc-800 leading-relaxed">
                              {tiptapToPlainText(q.question_text)}
                            </p>

                            {/* Options */}
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-1.5">
                                {q.options.map((opt, index) => {
                                  const correctKeys = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                                  const ans = getAnswerForQuestion(q.id);
                                  const userAns = ans?.user_answer ?? null;
                                  const { optionKey, optionLabel } = getOptionMeta(opt, index);
                                  const isCorrectOpt = correctKeys.includes(optionKey);
                                  const isUserChoice = userAns === optionKey;
                                  return (
                                    <div
                                      key={`${q.id}-${optionKey}-${index}`}
                                      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                                        isCorrectOpt
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                          : isUserChoice && !isCorrectOpt
                                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                                          : 'bg-white border-zinc-200 text-zinc-700'
                                      }`}
                                    >
                                      <span className="font-medium shrink-0">
                                        {optionLabel}.
                                      </span>
                                      <span>{tiptapToPlainText(opt.text)}</span>
                                      {isCorrectOpt && (
                                        <span className="ml-auto text-xs text-emerald-600 shrink-0">
                                          ✓ Correct
                                        </span>
                                      )}
                                      {isUserChoice && !isCorrectOpt && (
                                        <span className="ml-auto text-xs text-rose-600 shrink-0">
                                          Your answer
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Marks — two column */}
                            {(() => {
                              const ans = getAnswerForQuestion(q.id);
                              return ans !== undefined ? (
                                <MarksRow marksAwarded={ans.marks_awarded} />
                              ) : null;
                            })()}

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
