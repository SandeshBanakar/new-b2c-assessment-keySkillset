'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { MockAttempt } from '@/types';

interface AttemptsTabProps {
  attempts: MockAttempt[];
  assessmentId: string;
}

function StatusBadge({ status }: { status: MockAttempt['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        In Progress
      </span>
    );
  }
  if (status === 'abandoned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        Abandoned
      </span>
    );
  }
  return null;
}

export default function AttemptsTab({ attempts, assessmentId }: AttemptsTabProps) {
  const router = useRouter();
  const [localAttempts, setLocalAttempts] = useState<MockAttempt[]>(attempts);
  const [abandonTarget, setAbandonTarget] = useState<MockAttempt | null>(null);
  const [abandoning, setAbandoning] = useState(false);

  const completedAttempts = localAttempts.filter((a) => a.status === 'completed');
  const bestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((a) => a.score))
    : null;

  async function handleAbandon() {
    if (!abandonTarget) return;
    setAbandoning(true);

    try {
      const supabase = createClient();
      await supabase
        .from('attempts')
        .update({ status: 'abandoned', score: 0 })
        .eq('id', abandonTarget.id);
    } catch {
      // Proceed with optimistic update regardless
    }

    // Optimistic update
    setLocalAttempts((prev) =>
      prev.map((a) =>
        a.id === abandonTarget.id ? { ...a, status: 'abandoned', score: 0 } : a
      )
    );
    setAbandonTarget(null);
    setAbandoning(false);
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-zinc-900">Your Attempts</h2>
        {bestScore !== null && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <Trophy className="w-4 h-4 text-amber-500" />
            Best: {bestScore}
          </span>
        )}
      </div>

      {/* Attempt rows */}
      <div className="bg-white shadow-sm rounded-md divide-y divide-zinc-100">
        {localAttempts.map((attempt, idx) => {
          const label = attempt.attemptNumber === 0 ? 'Free Attempt' : `Attempt ${attempt.attemptNumber}`;
          const isLocked =
            attempt.status === 'not_started' &&
            idx > 0 &&
            localAttempts[idx - 1].status !== 'completed' &&
            localAttempts[idx - 1].status !== 'abandoned';

          const scoreDisplay =
            attempt.status === 'not_started' ? '—'
            : attempt.status === 'in_progress' ? '—'
            : String(attempt.score);

          return (
            <div
              key={attempt.id}
              className="flex flex-wrap items-center gap-4 py-4 px-6"
            >
              {/* Left */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                  {label}
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

              {/* Middle — hidden on mobile */}
              {!isLocked && (
                <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {attempts[0]?.assessmentId ? '98 Questions' : '— Questions'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Score: {scoreDisplay}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {attempt.durationMinutes ? `${attempt.durationMinutes} min` : '— min'}
                  </span>
                </div>
              )}

              {/* Right — actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {attempt.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/assessments/${assessmentId}/analysis/${attempt.id}`)
                    }
                    className="rounded-md border-zinc-200 text-zinc-700 text-sm"
                  >
                    View Analysis
                  </Button>
                )}

                {attempt.status === 'in_progress' && (
                  <>
                    <Button
                      size="sm"
                      className="rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
                    >
                      Resume Test
                    </Button>
                    <button
                      onClick={() => setAbandonTarget(attempt)}
                      className="text-xs text-rose-600 hover:text-rose-700 underline"
                    >
                      Abandon attempt
                    </button>
                  </>
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

      {/* Abandon confirmation dialog */}
      <Dialog open={!!abandonTarget} onOpenChange={(open) => !open && setAbandonTarget(null)}>
        <DialogContent className="max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-zinc-900">
              Abandon{' '}
              {abandonTarget?.attemptNumber === 0
                ? 'Free Attempt'
                : `Attempt ${abandonTarget?.attemptNumber}`}
              ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 leading-relaxed">
            This will forfeit this attempt. Your score will be recorded as 0. This cannot be
            undone.
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
