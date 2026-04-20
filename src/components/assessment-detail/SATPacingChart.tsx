'use client';

import { Clock } from 'lucide-react';

interface QuestionDot {
  i: number;
  sec: number;
  correct: boolean;
}

interface Module {
  key: string;
  label: string;
  target: number;
  data: QuestionDot[];
}

// Demo pacing data — hardcoded until exam engine records per-question time
function mkPace(n: number, avgTarget: number, variance: number, wrongRate: number): QuestionDot[] {
  const out: QuestionDot[] = [];
  for (let i = 0; i < n; i++) {
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * variance;
    const surge = i > n - 5 ? (i - (n - 5)) * 12 : 0;
    out.push({
      i: i + 1,
      sec: Math.max(15, Math.round(avgTarget + noise + surge)),
      correct: Math.random() > wrongRate,
    });
  }
  return out;
}

const DEMO_MODULES: Module[] = [
  { key: 'rw1',   label: 'R&W · Module 1',  target: 71, data: mkPace(27, 62, 18, 0.18) },
  { key: 'rw2',   label: 'R&W · Module 2',  target: 71, data: mkPace(27, 74, 22, 0.30) },
  { key: 'math1', label: 'Math · Module 1', target: 95, data: mkPace(22, 88, 25, 0.20) },
  { key: 'math2', label: 'Math · Module 2', target: 95, data: mkPace(22, 102, 30, 0.35) },
];

function dotColor(sec: number, target: number, correct: boolean): string {
  if (!correct) return 'bg-rose-400';
  if (sec > target * 1.3) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function ModuleBar({ mod }: { mod: Module }) {
  const avg = Math.round(mod.data.reduce((s, d) => s + d.sec, 0) / mod.data.length);
  const overTarget = mod.data.filter((d) => d.sec > mod.target * 1.3).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-700">{mod.label}</span>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>avg {avg}s</span>
          <span className="text-zinc-300">·</span>
          <span>target {mod.target}s</span>
          {overTarget > 0 && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-amber-600">{overTarget} slow</span>
            </>
          )}
        </div>
      </div>

      {/* Dot grid */}
      <div className="flex flex-wrap gap-1">
        {mod.data.map((d) => (
          <div
            key={d.i}
            title={`Q${d.i}: ${d.sec}s (target ${mod.target}s)`}
            className={`w-4 h-4 rounded-sm ${dotColor(d.sec, mod.target, d.correct)} opacity-90`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-1.5 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />On pace</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Slow</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Wrong</span>
      </div>
    </div>
  );
}

export default function SATPacingChart() {
  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">Pacing Analysis</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-5">
        Each square = one question. Color shows pace and correctness.
      </p>

      <div className="space-y-5">
        {DEMO_MODULES.map((mod) => (
          <ModuleBar key={mod.key} mod={mod} />
        ))}
      </div>
    </div>
  );
}
