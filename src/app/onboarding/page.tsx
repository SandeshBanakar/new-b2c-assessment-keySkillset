'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ExamSelector from '@/components/shared/ExamSelector';
import type { Exam } from '@/types';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const GOAL_OPTIONS = [
  'Crack SAT',
  'Crack IIT-JEE',
  'Crack NEET',
  'PMP Certification',
  'General Skill Building',
];

// -------------------------------------------------------
// Progress dots
// -------------------------------------------------------

function ProgressDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2].map((n) => (
        <span
          key={n}
          className={`block rounded-full transition-all ${
            n === step
              ? 'w-6 h-2 bg-blue-700'
              : n < step
              ? 'w-2 h-2 bg-blue-400'
              : 'w-2 h-2 bg-zinc-200'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-zinc-400">Step {step} of 2</span>
    </div>
  );
}

// -------------------------------------------------------
// Page
// -------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedExams, setSelectedExams] = useState<Exam[]>([]);

  function toggleExam(exam: Exam) {
    setSelectedExams((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  }

  function handleSubmit() {
    if (selectedExams.length === 0) return;
    router.push('/assessments');
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-md shadow-sm p-8">

        <ProgressDots step={step} />

        {/* ── Step 1 — Name + Goal ── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 text-center">
              Welcome to keySkillset
            </h1>
            <p className="text-sm text-zinc-500 text-center mt-1 mb-8">
              Let&apos;s set up your profile
            </p>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                />
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  What&apos;s your goal?
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                >
                  <option value="">Select your goal…</option>
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!displayName.trim() || !goal}
              className="w-full mt-8 bg-blue-700 hover:bg-blue-800 text-white rounded-md disabled:opacity-40"
            >
              Next →
            </Button>
          </div>
        )}

        {/* ── Step 2 — Exam Selection ── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 text-center">
              Which exams are you preparing for?
            </h1>
            <p className="text-sm text-zinc-500 text-center mt-1 mb-8">
              Select all that apply
            </p>

            <ExamSelector selectedExams={selectedExams} onToggle={toggleExam} />

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-md border-zinc-200 text-zinc-600"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedExams.length === 0}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-md disabled:opacity-40"
              >
                Start Learning →
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
