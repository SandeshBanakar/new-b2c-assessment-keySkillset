'use client';

import type { AssessmentType, Exam } from '@/types';

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface FilterState {
  exam: Exam | 'all';
  type: AssessmentType | 'all';
}

interface AssessmentFilterBarProps {
  selectedExam: Exam | 'all';
  selectedType: AssessmentType | 'all';
  onChange: (filters: FilterState) => void;
}

// -------------------------------------------------------
// Static filter options
// -------------------------------------------------------

const examOptions: Array<{ value: Exam | 'all'; label: string }> = [
  { value: 'all', label: 'All Exams' },
  { value: 'SAT', label: 'SAT' },
  { value: 'JEE', label: 'JEE' },
  { value: 'NEET', label: 'NEET' },
  { value: 'PMP', label: 'PMP' },
];

const typeOptions: Array<{ value: AssessmentType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'full-test', label: 'Full Test' },
  { value: 'subject-test', label: 'Subject Test' },
  { value: 'chapter-test', label: 'Chapter Test' },
];

// -------------------------------------------------------
// Pill button helper
// -------------------------------------------------------

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-700 text-white'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export default function AssessmentFilterBar({
  selectedExam,
  selectedType,
  onChange,
}: AssessmentFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Exam filter row */}
      <div className="flex flex-wrap gap-2">
        {examOptions.map(({ value, label }) => (
          <FilterPill
            key={value}
            label={label}
            active={selectedExam === value}
            onClick={() => onChange({ exam: value, type: selectedType })}
          />
        ))}
      </div>

      {/* Type filter row */}
      <div className="flex flex-wrap gap-2">
        {typeOptions.map(({ value, label }) => (
          <FilterPill
            key={value}
            label={label}
            active={selectedType === value}
            onClick={() => onChange({ exam: selectedExam, type: value })}
          />
        ))}
      </div>
    </div>
  );
}
