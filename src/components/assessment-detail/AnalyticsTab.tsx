'use client';

import { BarChart2, CheckCircle, Clock, Trophy, XCircle } from 'lucide-react';
import type { Assessment, MockAttempt } from '@/types';

interface AnalyticsTabProps {
  attempts: MockAttempt[];
  assessment: Assessment;
  assessmentId: string;
  onSwitchToAttempts: () => void;
}

const MAX_SCORES: Record<string, number> = {
  SAT: 1600,
  JEE: 360,
  NEET: 720,
  PMP: 100,
};

export default function AnalyticsTab({
  attempts,
  assessment,
  onSwitchToAttempts,
}: AnalyticsTabProps) {
  const completed = attempts.filter((a) => a.status === 'completed');

  if (completed.length === 0) {
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

  const scores = completed.map((a) => a.score);
  const bestScore = Math.max(...scores);
  const avgScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  const maxScore = MAX_SCORES[assessment.exam] ?? 100;

  const totalCorrect = completed.reduce((s, a) => s + a.correctCount, 0);
  const totalIncorrect = completed.reduce((s, a) => s + a.incorrectCount, 0);
  const totalAnswered = totalCorrect + totalIncorrect;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Section breakdown for SAT
  const rwScores = completed.filter((a) => a.scoreRw != null).map((a) => a.scoreRw!);
  const mathScores = completed.filter((a) => a.scoreMath != null).map((a) => a.scoreMath!);
  const avgRw = rwScores.length > 0 ? Math.round(rwScores.reduce((s, v) => s + v, 0) / rwScores.length) : null;
  const avgMath = mathScores.length > 0 ? Math.round(mathScores.reduce((s, v) => s + v, 0) / mathScores.length) : null;

  return (
    <div>
      {/* Score overview */}
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
            <p className="text-xl font-medium text-zinc-600 mb-1">{avgScore}</p>
            <p className="text-xs text-zinc-400">Average Score</p>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-1">
              {completed.length} / 6
            </p>
            <p className="text-xs text-zinc-400">Attempts completed</p>
          </div>
        </div>
      </div>

      {/* Score trend */}
      <div className="bg-white shadow-sm rounded-md p-6 mt-4">
        <h3 className="text-base font-medium text-zinc-900 mb-4">Score Trend</h3>
        <div className="space-y-3">
          {completed.map((attempt) => {
            const pct = Math.round((attempt.score / maxScore) * 100);
            const label =
              attempt.attemptNumber === 0 ? 'Free' : `Attempt ${attempt.attemptNumber}`;
            return (
              <div key={attempt.id} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-16 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-zinc-100 rounded-full h-2">
                  <div
                    className="bg-blue-700 h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-700 w-12 text-right flex-shrink-0">
                  {attempt.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accuracy */}
      <div className="bg-white shadow-sm rounded-md p-6 mt-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center gap-1">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-lg font-semibold text-zinc-900">{totalCorrect}</span>
            <span className="text-xs text-zinc-400">Correct</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span className="text-lg font-semibold text-zinc-900">{totalIncorrect}</span>
            <span className="text-xs text-zinc-400">Incorrect</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-zinc-500" />
            <span className="text-lg font-semibold text-zinc-900">~82s</span>
            <span className="text-xs text-zinc-400">Avg Time/Q</span>
          </div>
        </div>
        <div className="text-center border-t border-zinc-100 pt-4">
          <span className="text-2xl font-semibold text-zinc-900">{accuracy}%</span>
          <p className="text-xs text-zinc-400 mt-0.5">Overall Accuracy</p>
        </div>
      </div>

      {/* Section breakdown — SAT */}
      {assessment.exam === 'SAT' && (avgRw !== null || avgMath !== null) && (
        <div className="bg-white shadow-sm rounded-md p-6 mt-4">
          <h3 className="text-base font-medium text-zinc-900 mb-4">Section Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {avgRw !== null && (
              <div className="border border-zinc-200 rounded-md p-4">
                <p className="text-sm font-medium text-zinc-700 mb-2">Reading & Writing</p>
                <p className="text-xl font-semibold text-zinc-900">{avgRw}</p>
                <p className="text-xs text-zinc-400 mt-1">Avg section score (200–800)</p>
              </div>
            )}
            {avgMath !== null && (
              <div className="border border-zinc-200 rounded-md p-4">
                <p className="text-sm font-medium text-zinc-700 mb-2">Math</p>
                <p className="text-xl font-semibold text-zinc-900">{avgMath}</p>
                <p className="text-xs text-zinc-400 mt-1">Avg section score (200–800)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-SAT section breakdown placeholder */}
      {assessment.exam !== 'SAT' && (
        <div className="bg-white shadow-sm rounded-md p-6 mt-4">
          <h3 className="text-base font-medium text-zinc-900 mb-2">Section Breakdown</h3>
          <p className="text-sm text-zinc-500">
            Subject-level breakdown will appear here after you complete attempts.
          </p>
        </div>
      )}
    </div>
  );
}
