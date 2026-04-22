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

  // Deduplicate by id to prevent duplicate pills from stale data
  const seen = new Set<string>();
  const unique = attempts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const latestId = unique[unique.length - 1].id;

  function label(attempt: { id: string; attempt_number: number }) {
    return attempt.attempt_number === 1 ? 'Free Attempt' : `Attempt ${attempt.attempt_number}`;
  }

  return (
    <div className="bg-white shadow-sm rounded-md px-6 py-4">
      <p className="text-xs font-medium text-zinc-500 mb-3">Viewing attempt</p>
      <div className="flex flex-wrap gap-2">
        {unique.map((attempt) => {
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
              {label(attempt)}
              {isLatest && unique.length > 1 && (
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
