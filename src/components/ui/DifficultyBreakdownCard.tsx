'use client';

export interface DiffMap {
  easy:   { correct: number; total: number };
  medium: { correct: number; total: number };
  hard:   { correct: number; total: number };
}

interface Props {
  diffMap: DiffMap;
  attemptNumber: number;
}

const DIFF_LABELS: { key: keyof DiffMap; label: string; bar: string; text: string }[] = [
  { key: 'easy',   label: 'Easy',   bar: 'bg-emerald-500', text: 'text-emerald-700' },
  { key: 'medium', label: 'Medium', bar: 'bg-amber-500',   text: 'text-amber-700'   },
  { key: 'hard',   label: 'Hard',   bar: 'bg-rose-500',    text: 'text-rose-700'    },
];

export default function DifficultyBreakdownCard({ diffMap, attemptNumber }: Props) {
  const hasData = Object.values(diffMap).some((d) => d.total > 0);

  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-medium text-zinc-900">Difficulty Breakdown</h3>
        <span className="text-xs text-zinc-400">Attempt {attemptNumber}</span>
      </div>

      {!hasData ? (
        <p className="text-sm text-zinc-400">No question data available for this attempt.</p>
      ) : (
        <div className="space-y-4">
          {DIFF_LABELS.map(({ key, label, bar, text }) => {
            const { correct, total } = diffMap[key];
            const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-zinc-700">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{correct}/{total} correct</span>
                    <span className={`text-xs font-medium ${text}`}>{pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${bar}`}
                    style={{ width: total > 0 ? `${pct}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
