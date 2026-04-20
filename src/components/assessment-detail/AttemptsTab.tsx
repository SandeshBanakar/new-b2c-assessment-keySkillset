'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { TIER_ORDER } from '@/types/assessment';
import type { Assessment, MockAttempt, Tier, Exam, ActivePlanInfo } from '@/types';

interface AttemptsTabProps {
  attempts: MockAttempt[];
  assessmentId: string;
  assessment: Assessment;
  onSwitchToAnalytics?: (attemptId?: string) => void;
}

interface DbAttempt {
  id: string;
  attempt_number: number;
  status: string;
  score: number | null;
  total_questions: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  time_spent_seconds: number | null;
  is_free_attempt: boolean | null;
  started_at: string | null;
  completed_at: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  if (s === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        In Progress
      </span>
    );
  }
  if (s === 'abandoned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        Abandoned
      </span>
    );
  }
  return null;
}

function durationLabel(seconds: number | null): string {
  if (!seconds) return '— min';
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function computeHasPaidAccess(
  userTier: Tier,
  activePlanInfo: ActivePlanInfo | null | undefined,
  assessmentMinTier: Tier,
  assessmentExam: Exam,
): boolean {
  if (TIER_ORDER[userTier] >= TIER_ORDER[assessmentMinTier]) return true;
  if (
    activePlanInfo?.scope === 'CATEGORY_BUNDLE' &&
    activePlanInfo.category === assessmentExam
  ) {
    const catTierMap: Record<string, Tier> = {
      BASIC: 'basic',
      PRO: 'professional',
      PREMIUM: 'premium',
    };
    const effectiveTier = (catTierMap[activePlanInfo.tier ?? ''] ?? 'free') as Tier;
    return TIER_ORDER[effectiveTier] >= TIER_ORDER[assessmentMinTier];
  }
  return false;
}

export default function AttemptsTab({
  attempts: mockFallback,
  assessmentId,
  assessment,
  onSwitchToAnalytics,
}: AttemptsTabProps) {
  const router = useRouter();
  const { user } = useAppContext();
  const [dbAttempts, setDbAttempts] = useState<DbAttempt[] | null>(null);
  const [loading, setLoading] = useState(!!user?.id);
  const [abandonTarget, setAbandonTarget] = useState<DbAttempt | null>(null);
  const [abandoning, setAbandoning] = useState(false);

  const hasPaidAccess = computeHasPaidAccess(
    user?.subscriptionTier ?? 'free',
    user?.activePlanInfo,
    assessment.tier,
    assessment.exam,
  );

  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from('attempts')
      .select(
        'id, attempt_number, status, score, total_questions, correct_count, incorrect_count, time_spent_seconds, is_free_attempt, started_at, completed_at',
      )
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .order('attempt_number', { ascending: true })
      .then(({ data }) => {
        setDbAttempts(data ?? []);
        setLoading(false);
      });
  }, [user?.id, assessmentId]);

  async function handleAbandon() {
    if (!abandonTarget) return;
    setAbandoning(true);
    await supabase
      .from('attempts')
      .update({ status: 'abandoned', score: 0 })
      .eq('id', abandonTarget.id);
    setDbAttempts((prev) =>
      (prev ?? []).map((a) =>
        a.id === abandonTarget.id ? { ...a, status: 'abandoned', score: 0 } : a,
      ),
    );
    setAbandonTarget(null);
    setAbandoning(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const useDb = dbAttempts !== null && dbAttempts.length > 0;

  // ── DB path: real attempt rows exist ─────────────────────────────────────────
  if (useDb) {
    const dbFreeRow =
      dbAttempts.find((a) => a.is_free_attempt === true || a.attempt_number === 0) ?? null;

    const dbPaidMap: Record<number, DbAttempt> = {};
    dbAttempts.forEach((a) => {
      if (!(a.is_free_attempt === true || a.attempt_number === 0)) {
        dbPaidMap[a.attempt_number] = a;
      }
    });

    const allCompleted = dbAttempts.filter((a) => a.status.toLowerCase() === 'completed');
    const bestScore =
      allCompleted.length > 0
        ? Math.max(...allCompleted.map((a) => a.score ?? 0))
        : null;

    const freeStatus = dbFreeRow?.status?.toLowerCase() ?? 'not_started';

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-zinc-900">Your Attempts</h2>
          {bestScore !== null && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <Trophy className="w-4 h-4 text-amber-500" />
              Best: {bestScore}
            </span>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-md divide-y divide-zinc-100">
          {/* Free attempt row */}
          <div className="flex flex-wrap items-center gap-4 py-4 px-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                Free Attempt
              </span>
              {dbFreeRow && freeStatus !== 'not_started' && (
                <StatusBadge status={dbFreeRow.status} />
              )}
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {dbFreeRow?.total_questions ?? assessment.questionCount} Questions
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Score: {freeStatus === 'completed' && dbFreeRow?.score != null ? dbFreeRow.score : '—'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {durationLabel(dbFreeRow?.time_spent_seconds ?? null)}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {freeStatus === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onSwitchToAnalytics
                      ? onSwitchToAnalytics(dbFreeRow?.id)
                      : router.push(`/assessments/${assessmentId}?tab=analytics`)
                  }
                  className="rounded-md border-zinc-200 text-zinc-700 text-sm"
                >
                  View Analysis
                </Button>
              )}
              {freeStatus === 'in_progress' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                    className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                  >
                    Resume Test
                  </Button>
                  {dbFreeRow && (
                    <button
                      onClick={() => setAbandonTarget(dbFreeRow)}
                      className="text-xs text-rose-600 hover:text-rose-700 underline"
                    >
                      Abandon
                    </button>
                  )}
                </>
              )}
              {!dbFreeRow && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                  className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                >
                  Start Free Attempt
                </Button>
              )}
            </div>
          </div>

          {/* Paid attempt rows 1–5 */}
          {Array.from({ length: 5 }, (_, i) => {
            const num = i + 1;
            const dbRow = dbPaidMap[num] ?? null;
            const prevStatus =
              i === 0
                ? freeStatus
                : (dbPaidMap[i]?.status?.toLowerCase() ?? 'not_started');

            const isLocked = !hasPaidAccess;
            const isSequentiallyLocked =
              hasPaidAccess && !dbRow &&
              prevStatus !== 'completed' && prevStatus !== 'abandoned';
            const rowStatus = dbRow?.status?.toLowerCase() ?? 'not_started';
            const scoreDisplay =
              rowStatus === 'completed' && dbRow?.score != null ? String(dbRow.score) : '—';

            if (isLocked) {
              return (
                <div key={num} className="flex flex-wrap items-center gap-4 py-4 px-6 opacity-60">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                      Attempt {num}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  </div>
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/plans')}
                      className="rounded-md border-zinc-300 text-zinc-600 text-sm"
                    >
                      Upgrade to Unlock
                    </Button>
                  </div>
                </div>
              );
            }

            if (isSequentiallyLocked) {
              return (
                <div key={num} className="flex flex-wrap items-center gap-4 py-4 px-6 opacity-60">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                      Attempt {num}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Complete {num === 1 ? 'Free Attempt' : `Attempt ${num - 1}`} to unlock
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={num} className="flex flex-wrap items-center gap-4 py-4 px-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                    Attempt {num}
                  </span>
                  {dbRow && rowStatus !== 'not_started' && (
                    <StatusBadge status={dbRow.status} />
                  )}
                </div>
                <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {dbRow?.total_questions ?? assessment.questionCount} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Score: {scoreDisplay}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {durationLabel(dbRow?.time_spent_seconds ?? null)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {rowStatus === 'completed' && dbRow && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onSwitchToAnalytics
                          ? onSwitchToAnalytics(dbRow.id)
                          : router.push(`/assessments/${assessmentId}?tab=analytics&attemptId=${dbRow.id}`)
                      }
                      className="rounded-md border-zinc-200 text-zinc-700 text-sm"
                    >
                      View Analysis
                    </Button>
                  )}
                  {rowStatus === 'in_progress' && dbRow && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                        className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                      >
                        Resume Test
                      </Button>
                      <button
                        onClick={() => setAbandonTarget(dbRow)}
                        className="text-xs text-rose-600 hover:text-rose-700 underline"
                      >
                        Abandon
                      </button>
                    </>
                  )}
                  {rowStatus === 'not_started' && !dbRow && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                      className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                    >
                      Start Now
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Abandon confirmation */}
        <Dialog open={!!abandonTarget} onOpenChange={(open) => !open && setAbandonTarget(null)}>
          <DialogContent className="max-w-sm rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-zinc-900">
                Abandon{' '}
                {abandonTarget?.is_free_attempt
                  ? 'Free Attempt'
                  : `Attempt ${abandonTarget?.attempt_number}`}
                ?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-zinc-600 leading-relaxed">
              This will forfeit this attempt. Your score will be recorded as 0. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setAbandonTarget(null)}
                className="flex-1 rounded-md border-zinc-200 text-zinc-700"
              >
                Keep attempting
              </Button>
              <Button
                disabled={abandoning}
                onClick={handleAbandon}
                className="flex-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, abandon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Mock fallback: no DB rows for this assessment ─────────────────────────────
  const freeAttempt: MockAttempt =
    mockFallback.find((a) => a.attemptNumber === 0) ?? {
      id: `free-${assessmentId}`,
      assessmentId,
      attemptNumber: 0,
      status: 'not_started',
      score: 0,
      durationMinutes: null,
      correctCount: 0,
      incorrectCount: 0,
      startedAt: null,
      completedAt: null,
    };

  const paidMockMap: Record<number, MockAttempt> = {};
  mockFallback.filter((a) => a.attemptNumber > 0).forEach((a) => {
    paidMockMap[a.attemptNumber] = a;
  });

  const allMockAttempts = [freeAttempt, ...Object.values(paidMockMap)];
  const completedMock = allMockAttempts.filter((a) => a.status === 'completed');
  const bestScoreMock =
    completedMock.length > 0
      ? Math.max(...completedMock.map((a) => a.score ?? 0))
      : null;

  const freeScoreDisplay =
    freeAttempt.status === 'completed' && freeAttempt.score != null
      ? String(freeAttempt.score)
      : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-zinc-900">Your Attempts</h2>
        {bestScoreMock !== null && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <Trophy className="w-4 h-4 text-amber-500" />
            Best: {bestScoreMock}
          </span>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-md divide-y divide-zinc-100">
        {/* Free attempt */}
        <div className="flex flex-wrap items-center gap-4 py-4 px-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
              Free Attempt
            </span>
            {freeAttempt.status !== 'not_started' && (
              <StatusBadge status={freeAttempt.status} />
            )}
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {assessment.questionCount} Questions
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Score: {freeScoreDisplay}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {freeAttempt.durationMinutes ? `${freeAttempt.durationMinutes} min` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {freeAttempt.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onSwitchToAnalytics
                    ? onSwitchToAnalytics()
                    : router.push(`/assessments/${assessmentId}?tab=analytics`)
                }
                className="rounded-md border-zinc-200 text-zinc-700 text-sm"
              >
                View Analysis
              </Button>
            )}
            {freeAttempt.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
              >
                Resume Free Attempt
              </Button>
            )}
            {freeAttempt.status === 'not_started' && (
              <Button
                size="sm"
                onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
              >
                Start Free Attempt
              </Button>
            )}
          </div>
        </div>

        {/* Paid attempts 1–5 — always rendered */}
        {Array.from({ length: 5 }, (_, i) => {
          const num = i + 1;
          const existing = paidMockMap[num] ?? null;
          const prevAttempt =
            i === 0 ? freeAttempt : (paidMockMap[i] ?? null);
          const prevStatus = prevAttempt?.status ?? 'not_started';

          const isLocked = !hasPaidAccess;
          const isSequentiallyLocked =
            hasPaidAccess &&
            !existing &&
            prevStatus !== 'completed' &&
            prevStatus !== 'abandoned';

          const rowStatus = existing?.status ?? 'not_started';
          const scoreDisplay =
            rowStatus === 'completed' && (existing?.score ?? null) != null
              ? String(existing!.score)
              : '—';

          if (isLocked) {
            return (
              <div key={num} className="flex flex-wrap items-center gap-4 py-4 px-6 opacity-60">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                    Attempt {num}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Lock className="w-3 h-3" />
                    Locked
                  </span>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/plans')}
                    className="rounded-md border-zinc-300 text-zinc-600 text-sm"
                  >
                    Upgrade to Unlock
                  </Button>
                </div>
              </div>
            );
          }

          if (isSequentiallyLocked) {
            return (
              <div key={num} className="flex flex-wrap items-center gap-4 py-4 px-6 opacity-60">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                    Attempt {num}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Complete {num === 1 ? 'Free Attempt' : `Attempt ${num - 1}`} to unlock
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={num} className="flex flex-wrap items-center gap-4 py-4 px-6">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                  Attempt {num}
                </span>
                {existing && rowStatus !== 'not_started' && (
                  <StatusBadge status={existing.status} />
                )}
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {assessment.questionCount} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Score: {scoreDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {existing?.durationMinutes ? `${existing.durationMinutes} min` : '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {rowStatus === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onSwitchToAnalytics
                        ? onSwitchToAnalytics()
                        : router.push(`/assessments/${assessmentId}?tab=analytics`)
                    }
                    className="rounded-md border-zinc-200 text-zinc-700 text-sm"
                  >
                    View Analysis
                  </Button>
                )}
                {rowStatus === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                    className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                  >
                    Resume Test
                  </Button>
                )}
                {rowStatus === 'not_started' && !isSequentiallyLocked && (
                  <Button
                    size="sm"
                    onClick={() => router.push(`/assessments/${assessmentId}/instructions`)}
                    className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                  >
                    Start Now
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
