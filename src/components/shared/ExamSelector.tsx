'use client';

import { Check } from 'lucide-react';
import type { Exam } from '@/types';

interface ExamOption {
  value: Exam;
  label: string;
  description: string;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    value: 'SAT',
    label: 'SAT',
    description: 'College readiness · Math & Reading & Writing',
  },
  {
    value: 'JEE',
    label: 'IIT-JEE',
    description: 'Engineering entrance · Physics, Chemistry, Math',
  },
  {
    value: 'NEET',
    label: 'NEET',
    description: 'Medical entrance · Biology, Physics, Chemistry',
  },
  {
    value: 'PMP',
    label: 'PMP',
    description: 'Project management certification',
  },
];

interface ExamSelectorProps {
  selectedExams: Exam[];
  onToggle: (exam: Exam) => void;
}

export default function ExamSelector({ selectedExams, onToggle }: ExamSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {EXAM_OPTIONS.map(({ value, label, description }) => {
        const isSelected = selectedExams.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`relative text-left rounded-xl border-2 px-4 py-4 transition-all ${
              isSelected
                ? 'border-violet-600 bg-violet-50'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            {/* Checkmark */}
            {isSelected && (
              <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-violet-600">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
            )}
            <p className={`text-base font-semibold ${isSelected ? 'text-violet-700' : 'text-zinc-900'}`}>
              {label}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
          </button>
        );
      })}
    </div>
  );
}
