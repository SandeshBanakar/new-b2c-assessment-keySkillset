'use client';

export interface AttemptPillFilterProps {
  attempts: Array<{
    id: string;
    attempt_number: number;
  }>;
  selectedId: string;
  onChange: (id: string) => void;
}

export default function AttemptPillFilter({ attempts, selectedId, onChange }: AttemptPillFilterProps) {
  if (attempts.length === 0) return null;

  const latestId = attempts[attempts.length - 1].id;

  return (
    <div className="bg-white shadow-sm rounded-md px-6 py-4">
      <p className="text-xs font-medium text-zinc-500 mb-3">Viewing attempt</p>
      <div className="flex flex-wrap gap-2">
        {attempts.map((attempt) => {
          const isSelected = attempt.id === selectedId;
          const isLatest = attempt.id === latestId;
          return (
            <button
              key={attempt.id}
              onClick={() => onChange(attempt.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              Attempt {attempt.attempt_number}
              {isLatest && (
                <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-zinc-400'}`}>
                  (Latest)
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
