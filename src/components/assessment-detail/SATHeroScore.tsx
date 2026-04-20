'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Edit2, X, Check } from 'lucide-react';
import ScoreTrajectoryChart from '@/components/ui/ScoreTrajectoryChart';

interface DbAttempt {
  id: string;
  attempt_number: number;
  score: number | null;
  score_rw: number | null;
  score_math: number | null;
  completed_at: string | null;
}

interface Props {
  attempts: DbAttempt[];
  selectedAttempt: DbAttempt;
  isFullTest: boolean;
  scoreMax: number;
  targetScore: number | null;
  onSaveTarget: (score: number | null) => Promise<void>;
  compositeGain: number | null;
}

function scoreDelta(a: number | null, b: number | null) {
  if (a === null || b === null) return null;
  return b - a;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <TrendingUp className="w-3 h-3" />+{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
        <TrendingDown className="w-3 h-3" />{delta}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5">
      <Minus className="w-3 h-3" />No change
    </span>
  );
}

function targetOptions(scoreMax: number): number[] {
  const min = scoreMax === 1600 ? 1000 : 500;
  const opts: number[] = [];
  for (let s = min; s <= scoreMax; s += 50) opts.push(s);
  return opts;
}

export default function SATHeroScore({
  attempts,
  selectedAttempt,
  isFullTest,
  scoreMax,
  targetScore,
  onSaveTarget,
  compositeGain,
}: Props) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [pickedTarget, setPickedTarget]   = useState<number>(targetScore ?? scoreMax);
  const [saving, setSaving]               = useState(false);

  const firstAttempt = attempts[0];
  const lastAttempt  = attempts[attempts.length - 1];
  const latestScore  = lastAttempt.score;

  async function handleSave(score: number | null) {
    setSaving(true);
    await onSaveTarget(score);
    setSaving(false);
    setEditingTarget(false);
  }

  const targetPct =
    targetScore !== null && latestScore !== null
      ? Math.min(100, Math.round((latestScore / targetScore) * 100))
      : null;

  const opts = targetOptions(scoreMax);

  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">Score Progression</h3>
        {attempts.length >= 2 && compositeGain !== null && (
          <div className="ml-auto">
            <DeltaBadge delta={compositeGain} />
          </div>
        )}
      </div>

      {/* Hero score */}
      <div className="flex items-start gap-6 mb-5">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-semibold text-zinc-900 tracking-tight">
              {latestScore ?? '—'}
            </span>
            <span className="text-lg text-zinc-400">/{scoreMax}</span>
          </div>
          {isFullTest && (lastAttempt.score_rw !== null || lastAttempt.score_math !== null) && (
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-xs text-zinc-400">R&amp;W</p>
                <p className="text-sm font-medium text-zinc-700">
                  {lastAttempt.score_rw ?? '—'}
                  <span className="text-xs font-normal text-zinc-400">/800</span>
                </p>
              </div>
              <div className="w-px bg-zinc-200" />
              <div>
                <p className="text-xs text-zinc-400">Math</p>
                <p className="text-sm font-medium text-zinc-700">
                  {lastAttempt.score_math ?? '—'}
                  <span className="text-xs font-normal text-zinc-400">/800</span>
                </p>
              </div>
              {isFullTest && attempts.length >= 2 && (
                <>
                  <div className="w-px bg-zinc-200" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      R&amp;W <DeltaBadge delta={scoreDelta(firstAttempt.score_rw, lastAttempt.score_rw)} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      Math <DeltaBadge delta={scoreDelta(firstAttempt.score_math, lastAttempt.score_math)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Trajectory chart */}
        {attempts.length >= 2 && (
          <div className="flex-1 min-w-0">
            <ScoreTrajectoryChart
              attempts={attempts}
              scoreMax={scoreMax}
              target={targetScore}
            />
          </div>
        )}
      </div>

      {/* Target score section */}
      {targetScore === null ? (
        /* Touch 2: Inline prompt */
        <div className="border border-dashed border-zinc-200 rounded-md px-4 py-3 bg-zinc-50">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Set a target score</p>
          <div className="flex items-center gap-2">
            <select
              className="text-sm border border-zinc-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={pickedTarget}
              onChange={(e) => setPickedTarget(Number(e.target.value))}
            >
              {opts.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              disabled={saving}
              onClick={() => handleSave(pickedTarget)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-md hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      ) : editingTarget ? (
        /* Touch 3 editing state */
        <div className="border border-dashed border-violet-200 rounded-md px-4 py-3 bg-violet-50">
          <p className="text-xs text-violet-700 mb-2 font-medium">Edit target score</p>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="text-sm border border-violet-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={pickedTarget}
              onChange={(e) => setPickedTarget(Number(e.target.value))}
            >
              {opts.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              disabled={saving}
              onClick={() => handleSave(pickedTarget)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-700 text-white text-xs font-medium rounded-md hover:bg-violet-800 transition-colors disabled:opacity-60"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => handleSave(null)}
              className="text-xs text-zinc-400 hover:text-rose-500 transition-colors"
            >
              Remove target
            </button>
            <button
              onClick={() => setEditingTarget(false)}
              className="ml-auto text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Touch 3: Progress bar + edit */
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-600">Progress to target</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                {latestScore ?? '—'} / <span className="text-violet-700 font-medium">{targetScore}</span>
              </span>
              <button
                onClick={() => { setPickedTarget(targetScore); setEditingTarget(true); }}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Edit target score"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-violet-500 transition-all"
              style={{ width: `${targetPct ?? 0}%` }}
            />
          </div>
          {targetPct !== null && (
            <p className="text-xs text-zinc-400 mt-1">{targetPct}% of the way there</p>
          )}
        </div>
      )}
    </div>
  );
}
