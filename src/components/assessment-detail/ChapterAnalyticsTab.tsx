'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
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
import AttemptPillFilter from '@/components/ui/AttemptPillFilter';
import type { Assessment } from '@/types';

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

export interface ChapterAnalyticsTabProps {
  assessment: Assessment;
  assessmentId: string;
  onSwitchToAttempts: () => void;
}

function masteryBarClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-200';
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function formatTime(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function ChapterAnalyticsTab({
  assessment,
  assessmentId,
  onSwitchToAttempts,
}: ChapterAnalyticsTabProps) {
  const router = useRouter();
  const { user } = useAppContext();
  const [loading, setLoading]                         = useState(true);
  const [attempts, setAttempts]                       = useState<DbAttempt[]>([]);
  const [conceptMastery, setConceptMastery]           = useState<ConceptMastery[]>([]);
  const [allInsights, setAllInsights]                 = useState<Record<string, AiInsight>>({});
  const [selectedAttemptId, setSelectedAttemptId]     = useState<string>('');
  const [assessmentQuestions, setAssessmentQuestions] = useState<DbQuestion[]>([]);
  const [allUserAnswers, setAllUserAnswers]            = useState<Record<string, UserAnswer[]>>({});

  const isAiEligible =
    user?.subscriptionTier === 'professional' ||
    user?.subscriptionTier === 'premium';

  const negMark = NEG_MARKS[assessment.exam ?? ''] ?? 0;

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
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

      setSelectedAttemptId(completed[completed.length - 1].id);
      const attemptIds = completed.map((a) => a.id);

      const { data: masteryData } = await supabase
        .from('user_concept_mastery')
        .select('concept_tag, attempt_number, correct_count, total_count, mastery_percent')
        .eq('user_id', user!.id)
        .eq('assessment_id', assessmentId)
        .order('concept_tag');
      setConceptMastery(masteryData ?? []);

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
      }

      const { data: questionsData } = await supabase
        .from('assessment_question_map')
        .select(
          'question_id, order_index, questions(id, question_type, module_name, question_order, question_text, passage_text, options, correct_answer, explanation, concept_tag)',
        )
        .eq('assessment_id', assessmentId)
        .order('order_index', { ascending: true });

      const questions: DbQuestion[] = (questionsData ?? [])
        .map((row) => {
          const q = row.questions as unknown as DbQuestion | null;
          return q ?? null;
        })
        .filter(Boolean) as DbQuestion[];
      setAssessmentQuestions(questions);

      if (attemptIds.length > 0) {
        const { data: answersData } = await supabase
          .from('attempt_answers')
          .select('attempt_id, question_id, user_answer, is_correct, is_skipped')
          .in('attempt_id', attemptIds);

        const answersMap: Record<string, UserAnswer[]> = {};
        for (const row of answersData ?? []) {
          const aid = row.attempt_id as string;
          if (!answersMap[aid]) answersMap[aid] = [];
          answersMap[aid].push({
            question_id: row.question_id as string,
            user_answer: row.user_answer as string | null,
            is_correct: row.is_correct as boolean | null,
            is_skipped: row.is_skipped as boolean | null,
          });
        }
        setAllUserAnswers(answersMap);
      }

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, assessmentId, isAiEligible]);

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
        <button onClick={onSwitchToAttempts} className="text-sm text-blue-700 hover:underline">
          Go to Attempts →
        </button>
      </div>
    );
  }

  const selectedAttempt  = attempts.find((a) => a.id === selectedAttemptId) ?? attempts[attempts.length - 1];
  const selectedAnswers  = allUserAnswers[selectedAttempt.id] ?? [];
  const aiInsight        = allInsights[selectedAttempt.id] ?? null;

  const accuracy = selectedAttempt.accuracy_percent !== null
    ? Math.round(selectedAttempt.accuracy_percent)
    : selectedAttempt.correct_count !== null && selectedAttempt.total_questions
      ? Math.round((selectedAttempt.correct_count / selectedAttempt.total_questions) * 100)
      : null;

  const marksLost = negMark > 0 && selectedAttempt.incorrect_count
    ? Math.round(selectedAttempt.incorrect_count * negMark * 10) / 10
    : 0;

  const selectedConceptMastery = conceptMastery.filter(
    (m) => m.attempt_number === selectedAttempt.attempt_number,
  );

  return (
    <div className="space-y-4">

      {/* ── Block 1: Attempt Summary ─────────────────────────────────────────── */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-medium text-zinc-900">Attempt Summary</h3>
          <span className="ml-auto text-xs text-zinc-400">
            Attempt {selectedAttempt.attempt_number}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-md bg-zinc-50 border border-zinc-100">
            <p className="text-2xl font-semibold text-zinc-900">
              {accuracy !== null ? `${accuracy}%` : '—'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Accuracy</p>
          </div>
          <div className="text-center p-3 rounded-md bg-emerald-50 border border-emerald-100">
            <p className="text-2xl font-semibold text-emerald-700">
              {selectedAttempt.correct_count ?? '—'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Correct</p>
          </div>
          <div className="text-center p-3 rounded-md bg-rose-50 border border-rose-100">
            <p className="text-2xl font-semibold text-rose-700">
              {selectedAttempt.incorrect_count ?? '—'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Incorrect</p>
          </div>
          <div className="text-center p-3 rounded-md bg-zinc-50 border border-zinc-100">
            <p className="text-2xl font-semibold text-zinc-500">
              {selectedAttempt.skipped_count ?? '—'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Skipped</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-zinc-400">Time Spent</p>
            <p className="text-sm font-medium text-zinc-700 mt-0.5">
              {formatTime(selectedAttempt.time_spent_seconds)}
            </p>
          </div>
          {selectedAttempt.total_questions && (
            <div>
              <p className="text-xs text-zinc-400">Questions</p>
              <p className="text-sm font-medium text-zinc-700 mt-0.5">
                {selectedAttempt.total_questions}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Block 2: Attempt Pill Filter ─────────────────────────────────────── */}
      {attempts.length > 1 && (
        <AttemptPillFilter
          attempts={attempts}
          selectedId={selectedAttemptId}
          onChange={setSelectedAttemptId}
        />
      )}

      {/* ── Block 3: Marks Lost (NEET/JEE only) ─────────────────────────────── */}
      {negMark > 0 && marksLost > 0 && (
        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-medium text-zinc-900">Marks Lost to Negative Marking</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center p-4 rounded-md bg-rose-50 border border-rose-100">
              <p className="text-2xl font-semibold text-rose-700">-{marksLost}</p>
              <p className="text-xs text-zinc-400 mt-1">Marks lost</p>
            </div>
            <p className="text-sm text-zinc-500">
              {selectedAttempt.incorrect_count} wrong answers × {negMark} mark{negMark !== 1 ? 's' : ''} each
            </p>
          </div>
        </div>
      )}

      {/* ── Block 4: Concept Performance ────────────────────────────────────── */}
      {selectedConceptMastery.length > 0 && (
        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-medium text-zinc-900">Concept Performance</h3>
            <span className="ml-auto text-xs text-zinc-400">
              Attempt {selectedAttempt.attempt_number}
            </span>
          </div>
          <div className="space-y-3">
            {selectedConceptMastery.map((c) => {
              const pct = c.mastery_percent !== null ? Math.round(c.mastery_percent) : null;
              return (
                <div key={c.concept_tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-700">{c.concept_tag}</span>
                    <span className="text-xs text-zinc-500">
                      {c.correct_count}/{c.total_count} · {pct !== null ? `${pct}%` : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${masteryBarClass(pct)}`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Block 5: Solutions Panel ─────────────────────────────────────────── */}
      <SolutionsPanel
        questions={assessmentQuestions}
        userAnswers={selectedAnswers}
        isFullTest={false}
      />

      {/* ── Block 6: AI Insight ──────────────────────────────────────────────── */}
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
          <p className="text-sm text-zinc-400">Insights are being prepared for this attempt...</p>
        ) : (
          <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              Upgrade to Pro or Premium to unlock personalized AI-generated feedback for every attempt.
            </p>
            <button
              onClick={() => router.push('/plans')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
