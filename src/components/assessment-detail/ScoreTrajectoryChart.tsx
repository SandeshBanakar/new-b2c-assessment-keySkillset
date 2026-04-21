'use client';

import { useState, useRef } from 'react';
import { Target } from 'lucide-react';

interface AttemptSlot {
  id: string;
  attempt_number: number;
  score: number | null;
  accuracy_percent: number | null;
  completed_at: string | null;
  is_free_attempt: boolean;
}

interface ScoreTrajectoryChartProps {
  attempts: AttemptSlot[];
  exam: string;
  targetScore: number | null;
  onSetTarget: (score: number) => void;
  scoreMax: number;
}

const EXAM_ACCENT: Record<string, string> = {
  NEET: '#10b981',  // emerald-500
  JEE:  '#3b82f6',  // blue-500
  CLAT: '#8b5cf6',  // violet-500
};

function getAccent(exam: string): string {
  return EXAM_ACCENT[exam] ?? '#6366f1';
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getDisplayValue(slot: AttemptSlot, scoreMax: number): number | null {
  if (slot.score !== null) return slot.score;
  if (slot.accuracy_percent !== null) return Math.round(slot.accuracy_percent * scoreMax / 100);
  return null;
}

const SLOT_COUNT = 6;
const CHART_W = 560;
const CHART_H = 180;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 20;
const PAD_BOT = 36;
const PLOT_W = CHART_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOT;

export default function ScoreTrajectoryChart({
  attempts,
  exam,
  targetScore,
  onSetTarget,
  scoreMax,
}: ScoreTrajectoryChartProps) {
  const [targetInput, setTargetInput] = useState('');
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = getAccent(exam);

  // Build 6-slot array
  const slots: (AttemptSlot | null)[] = Array.from({ length: SLOT_COUNT }, (_, i) => {
    return attempts.find((a) => a.attempt_number === i + 1) ?? null;
  });

  // Y helpers
  const toY = (val: number) => PAD_TOP + PLOT_H - (val / scoreMax) * PLOT_H;
  const xForSlot = (i: number) => PAD_LEFT + (i / (SLOT_COUNT - 1)) * PLOT_W;

  // Points for filled slots
  const filledPoints = slots
    .map((s, i) => {
      if (!s) return null;
      const val = getDisplayValue(s, scoreMax);
      if (val === null) return null;
      return { x: xForSlot(i), y: toY(val), val, slot: s, idx: i };
    })
    .filter(Boolean) as { x: number; y: number; val: number; slot: AttemptSlot; idx: number }[];

  // Polyline path
  const linePath = filledPoints.length >= 2
    ? filledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    : '';

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: toY(f * scoreMax),
    label: Math.round(f * scoreMax),
  }));

  // Target Y
  const targetY = targetScore !== null ? toY(targetScore) : null;

  function handleSetTarget() {
    const val = parseInt(targetInput, 10);
    if (isNaN(val) || val < 0 || val > scoreMax) {
      setInputError(`Enter a value between 0 and ${scoreMax}`);
      return;
    }
    setInputError('');
    setTargetInput('');
    onSetTarget(val);
  }

  const useAccuracy = attempts.length > 0 && attempts[0].score === null;

  return (
    <div className="bg-white shadow-sm rounded-md p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Score Trajectory</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {useAccuracy ? 'Accuracy across attempts' : 'Score across attempts'} · {exam}
          </p>
        </div>
        {targetScore !== null && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
            <Target className="w-3 h-3" />
            Target: {targetScore}
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          style={{ minWidth: 280, maxHeight: 200 }}
          aria-label="Score trajectory chart"
        >
          {/* Y-axis grid lines + labels */}
          {yTicks.map((t) => (
            <g key={t.label}>
              <line
                x1={PAD_LEFT}
                y1={t.y}
                x2={CHART_W - PAD_RIGHT}
                y2={t.y}
                stroke="#f4f4f5"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 6}
                y={t.y + 4}
                textAnchor="end"
                fontSize={9}
                fill="#a1a1aa"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Target line */}
          {targetY !== null && (
            <g>
              <line
                x1={PAD_LEFT}
                y1={targetY}
                x2={CHART_W - PAD_RIGHT}
                y2={targetY}
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              <text
                x={CHART_W - PAD_RIGHT + 2}
                y={targetY + 4}
                fontSize={8}
                fill="#10b981"
              >
                ▶
              </text>
            </g>
          )}

          {/* Empty slot placeholders */}
          {slots.map((s, i) => {
            if (s !== null) return null;
            const cx = xForSlot(i);
            return (
              <g key={`empty-${i}`}>
                <rect
                  x={cx - 12}
                  y={PAD_TOP}
                  width={24}
                  height={PLOT_H}
                  fill="#f4f4f5"
                  opacity={0.5}
                  rx={3}
                />
              </g>
            );
          })}

          {/* Connecting line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={accent}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Data points */}
          {filledPoints.map((p) => (
            <g key={p.slot.id}>
              <circle cx={p.x} cy={p.y} r={5} fill={accent} />
              <circle cx={p.x} cy={p.y} r={3} fill="white" />
              {/* Score label above point */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize={9}
                fontWeight="600"
                fill={accent}
              >
                {p.val}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {slots.map((s, i) => {
            const cx = xForSlot(i);
            const isFirst = i === 0;
            return (
              <g key={`xlabel-${i}`}>
                <text
                  x={cx}
                  y={CHART_H - PAD_BOT + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill={s ? '#71717a' : '#d4d4d8'}
                >
                  {isFirst ? 'Free' : `A${i + 1}`}
                </text>
                {s && (
                  <text
                    x={cx}
                    y={CHART_H - PAD_BOT + 24}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#a1a1aa"
                  >
                    {formatDate(s.completed_at)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Target set prompt */}
      {targetScore === null && (
        <div className="mt-3 pt-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 mb-2">
            Set a target score to track your goal
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={scoreMax}
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                setInputError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSetTarget()}
              placeholder={`0 – ${scoreMax}`}
              className="w-28 text-xs border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              onClick={handleSetTarget}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            >
              Set target
            </button>
          </div>
          {inputError && (
            <p className="text-xs text-rose-600 mt-1">{inputError}</p>
          )}
        </div>
      )}
    </div>
  );
}
