'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, Lock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { getAssessments } from '@/utils/assessmentUtils';
import type { Assessment, MockAttempt } from '@/types';

interface AttemptsTabProps {
  attempts: MockAttempt[];   // mock fallback — used when DB has no rows
  assessmentId: string;
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

export default function AttemptsTab({ attempts: mockFallback, assessmentId }: AttemptsTabProps) {
  const router = useRouter();
  const { user, isSubscribed } = useAppContext();
  const [dbAttempts, setDbAttempts] = useState<DbAttempt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [abandonTarget, setAbandonTarget] = useState<DbAttempt | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [assessmentMeta, setAssessmentMeta] = useState<Assessment | undefined>(undefined);
  const subscribed = isSubscribed(assessmentId);

  useEffect(() => {
    getAssessments().then((all) => setAssessmentMeta(all.find((a) => a.id === assessmentId)));
  }, [assessmentId]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

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

  // ── DB-first: if DB has rows, render those. Otherwise fall back to mock. ──
  const useDb = dbAttempts !== null && dbAttempts.length > 0;

  if (useDb) {
    const completedDb = dbAttempts!.filter((a) => a.status.toLowerCase() === 'completed');
    const bestScore =
      completedDb.length > 0
        ? Math.max(...completedDb.map((a) => a.score ?? 0))
        : null;

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
          {dbAttempts!.map((attempt) => {
            const statusLower = attempt.status.toLowerCase();
            const label = attempt.is_free_attempt
              ? 'Free Attempt'
              : `Attempt ${attempt.attempt_number}`;
            const scoreDisplay =
              statusLower === 'completed' && attempt.score !== null
                ? String(attempt.score)
                : '—';

            return (
              <div key={attempt.id} className="flex flex-wrap items-center gap-4 py-4 px-6">
                {/* Left */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                    {label}
                  </span>
                  {statusLower !== 'not_started' && (
                    <StatusBadge status={attempt.status} />
                  )}
                </div>

                {/* Middle */}
                <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {attempt.total_questions
                      ? `${attempt.total_questions} Questions`
                      : assessmentMeta
                        ? `${assessmentMeta.questionCount} Questions`
                        : '— Questions'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Score: {scoreDisplay}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {durationLabel(attempt.time_spent_seconds)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {statusLower === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/assessments/${assessmentId}?tab=analytics&attemptId=${attempt.id}`,
                        )
                      }
                      className="rounded-md border-zinc-200 text-zinc-700 text-sm"
                    >
                      View Analysis
                    </Button>
                  )}
                  {statusLower === 'in_progress' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/assessments/${assessmentId}/instructions`)
                        }
                        className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                      >
                        Resume Test
                      </Button>
                      <button
                        onClick={() => setAbandonTarget(attempt)}
                        className="text-xs text-rose-600 hover:text-rose-700 underline"
                      >
                        Abandon
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Locked rows — shown when not subscribed and DB has only free attempt */}
        {!subscribed && (
          <div className="bg-white shadow-sm rounded-md divide-y divide-zinc-100 mt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex flex-wrap items-center gap-4 py-4 px-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Lock className="w-4 h-4 text-zinc-300" />
                  <span className="text-sm font-medium text-zinc-400">
                    Attempt {i + 1}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm rounded-md text-zinc-400 border-zinc-200 shrink-0"
                  onClick={() => router.push('/plans')}
                >
                  Upgrade to Access
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Abandon confirmation */}
        <Dialog
          open={!!abandonTarget}
          onOpenChange={(open) => !open && setAbandonTarget(null)}
        >
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
              This will forfeit this attempt. Your score will be recorded as 0. This
              cannot be undone.
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

  // ── Mock fallback — no DB rows for this assessment ────────────────────────
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

  const paidAttempts = mockFallback.filter((a) => a.attemptNumber > 0);
  const completedMock = [freeAttempt, ...paidAttempts].filter(
    (a) => a.status === 'completed',
  );
  const bestScoreMock =
    completedMock.length > 0
      ? Math.max(...completedMock.map((a) => a.score ?? 0))
      : null;

  const freeScoreDisplay =
    freeAttempt.status === 'not_started' ||
    freeAttempt.status === 'in_progress' ||
    freeAttempt.score === null
      ? '—'
      : String(freeAttempt.score);

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
              {assessmentMeta ? `${assessmentMeta.questionCount} Questions` : '—'}
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
                  router.push(`/assessments/${assessmentId}?tab=analytics`)
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
                onClick={() =>
                  router.push(`/assessments/${assessmentId}/instructions`)
                }
                className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
              >
                Start Free Attempt
              </Button>
            )}
          </div>
        </div>

        {/* Paid attempts */}
        {subscribed &&
          paidAttempts.map((attempt, idx) => {
            const prev = idx === 0 ? freeAttempt : paidAttempts[idx - 1];
            const isLocked =
              attempt.status === 'not_started' &&
              prev.status !== 'completed' &&
              prev.status !== 'abandoned';
            const scoreDisplay =
              attempt.status === 'not_started' ||
              attempt.status === 'in_progress' ||
              attempt.score === null
                ? '—'
                : String(attempt.score);

            return (
              <div key={attempt.id} className="flex flex-wrap items-center gap-4 py-4 px-6">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                    Attempt {attempt.attemptNumber}
                  </span>
                  {!isLocked && attempt.status !== 'not_started' && (
                    <StatusBadge status={attempt.status} />
                  )}
                  {isLocked && (
                    <span className="text-xs text-zinc-400">
                      Complete Attempt {attempt.attemptNumber - 1} to unlock
                    </span>
                  )}
                </div>
                {!isLocked && (
                  <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {assessmentMeta ? `${assessmentMeta.questionCount} Questions` : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      Score: {scoreDisplay}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {attempt.durationMinutes ? `${attempt.durationMinutes} min` : '—'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 shrink-0">
                  {attempt.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/assessments/${assessmentId}?tab=analytics`)
                      }
                      className="rounded-md border-zinc-200 text-zinc-700 text-sm"
                    >
                      View Analysis
                    </Button>
                  )}
                  {attempt.status === 'in_progress' && (
                    <Button
                      size="sm"
                      className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                    >
                      Resume Test
                    </Button>
                  )}
                  {attempt.status === 'not_started' && !isLocked && (
                    <Button
                      size="sm"
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

      {!subscribed && (
        <div className="bg-white shadow-sm rounded-md divide-y divide-zinc-100 mt-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 py-4 px-6">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Lock className="w-4 h-4 text-zinc-300" />
                <span className="text-sm font-medium text-zinc-400">
                  Attempt {i + 1}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-sm rounded-md text-zinc-400 border-zinc-200 shrink-0"
                onClick={() => router.push('/plans')}
              >
                Upgrade to Access
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
