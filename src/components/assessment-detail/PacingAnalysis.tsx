'use client';

import { Clock } from 'lucide-react';

interface QuestionPace {
  questionNum: number;
  timeSeconds: number;
  isCorrect: boolean;
  isSkipped: boolean;
}

interface PacingAnalysisProps {
  questions: QuestionPace[];
  totalQuestions: number;
  targetSecondsPerQuestion: number;
  sectionLabel?: string;
}

function dotColor(time: number, target: number, correct: boolean, skipped: boolean): string {
  if (skipped) return 'bg-zinc-300';
  if (!correct) return 'bg-rose-400';
  if (time > target * 1.5) return 'bg-amber-400';
  return 'bg-emerald-500';
}

export default function PacingAnalysis({
  questions,
  totalQuestions,
  targetSecondsPerQuestion,
  sectionLabel,
}: PacingAnalysisProps) {
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-medium text-zinc-900">Pacing Analysis</h3>
        </div>
        <p className="text-sm text-zinc-400">
          No pacing data available for this attempt.
        </p>
      </div>
    );
  }

  const avgTime = Math.round(
    questions.reduce((sum, q) => sum + q.timeSeconds, 0) / questions.length
  );
  const onPace = questions.filter(
    (q) => !q.isSkipped && q.timeSeconds <= targetSecondsPerQuestion * 1.5
  ).length;
  const slow = questions.filter(
    (q) => !q.isSkipped && q.timeSeconds > targetSecondsPerQuestion * 1.5
  ).length;
  const wrong = questions.filter((q) => !q.isCorrect && !q.isSkipped).length;
  const skipped = questions.filter((q) => q.isSkipped).length;

  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">Pacing Analysis</h3>
        {sectionLabel && (
          <span className="text-xs text-zinc-400 ml-2">{sectionLabel}</span>
        )}
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        Each square = one question. Color shows pace and correctness.
      </p>

      {/* Summary stats */}
      <div className="flex gap-4 mb-4 text-xs">
        <div>
          <span className="text-zinc-500">Avg:</span>{' '}
          <span className="font-medium text-zinc-700">{avgTime}s</span>
        </div>
        <div>
          <span className="text-zinc-500">Target:</span>{' '}
          <span className="font-medium text-zinc-700">{targetSecondsPerQuestion}s</span>
        </div>
        <div className="text-zinc-300">|</div>
        <div className="text-emerald-600">{onPace} on pace</div>
        <div className="text-amber-600">{slow} slow</div>
        <div className="text-rose-600">{wrong} wrong</div>
        {skipped > 0 && <div className="text-zinc-400">{skipped} skipped</div>}
      </div>

      {/* Dot grid - one row of questions */}
      <div className="flex flex-wrap gap-1">
        {questions.map((q, idx) => (
          <div
            key={idx}
            title={`Q${idx + 1}: ${q.timeSeconds}s (target ${targetSecondsPerQuestion}s) - ${
              q.isSkipped ? 'Skipped' : q.isCorrect ? 'Correct' : 'Wrong'
            }`}
            className={`w-4 h-4 rounded-sm ${dotColor(
              q.timeSeconds,
              targetSecondsPerQuestion,
              q.isCorrect,
              q.isSkipped
            )} opacity-90`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          On pace
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
          Slow
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
          Wrong
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-300 inline-block" />
          Skipped
        </span>
      </div>
    </div>
  );
}