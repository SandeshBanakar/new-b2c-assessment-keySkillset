'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Globe,
} from 'lucide-react';
import { SCORE_RANGES, mockSyllabus, DEMO_ATTEMPT_STATES } from '@/data/assessments';
import { useAppContext } from '@/context/AppContext';
import type { Assessment, MockAttempt, SyllabusSection, Tier } from '@/types';

interface OverviewTabProps {
  assessment: Assessment;
  userTier: Tier;
  attempts: MockAttempt[];
  onSwitchToAnalytics: () => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function tierAllowsType(tier: Tier, type: Assessment['type']): boolean {
  switch (tier) {
    case 'free': return false;
    case 'basic': return type === 'full-test';
    case 'professional': return type === 'full-test' || type === 'subject-test';
    case 'premium': return true;
  }
}

const WHAT_YOULL_GET = [
  '1 Free Attempt + 5 additional attempts',
  'Detailed analytics across all attempts',
  'Solutions & explanations for every question',
  'Performance reports with score trends',
  'Mobile friendly',
];

function SyllabusAccordion({ sections }: { sections: SyllabusSection[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-white shadow-sm rounded-md mt-6 divide-y divide-zinc-100">
      <div className="px-6 py-4">
        <h3 className="text-base font-medium text-zinc-900">Syllabus</h3>
      </div>
      {sections.map((section) => {
        const isOpen = openIndex === section.number;
        return (
          <div key={section.number}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : section.number)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-zinc-50 transition-colors"
            >
              <span className="text-sm font-medium text-zinc-900">
                {section.number}. {section.title}
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
              )}
            </button>
            {isOpen && (
              <ul className="px-6 pb-4 space-y-1.5">
                {section.topics.map((topic) => (
                  <li key={topic} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                    {topic}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OverviewTab({
  assessment,
  userTier,
}: OverviewTabProps) {
  const router = useRouter();
  const { user } = useAppContext();

  const tierAllows = tierAllowsType(userTier, assessment.type);
  const tierName = userTier.charAt(0).toUpperCase() + userTier.slice(1);
  const attemptRoute = `/assessments/${assessment.id}/attempt`;

  // Derive attempt state from mock data
  const userId = user?.id ?? '';
  const attemptState = DEMO_ATTEMPT_STATES[userId]?.[assessment.id] ?? {
    attemptsUsed: 0,
    freeAttemptUsed: false,
    status: 'not_started' as const,
    lastAccessedAt: null,
  };

  const attemptsUsed = attemptState.attemptsUsed;
  const freeAttemptUsed = attemptState.freeAttemptUsed;
  const inProgress = attemptState.status === 'in_progress';
  const allUsed = attemptsUsed >= 6;

  // ── Derive CTA ──────────────────────────────────────────
  let ctaContent: React.ReactNode;

  if (!tierAllows) {
    if (!freeAttemptUsed) {
      // STATE 1: Tier too low, free attempt not used
      ctaContent = (
        <>
          <button
            onClick={() => router.push(attemptRoute)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base transition-colors"
          >
            Take Free Test
          </button>
          <p className="text-xs text-zinc-500 text-center mt-2">
            Want full access?{' '}
            <span
              onClick={() => router.push('/plans')}
              className="text-blue-600 hover:underline cursor-pointer text-sm font-medium"
            >
              Upgrade to Access →
            </span>
          </p>
        </>
      );
    } else {
      // STATE 2: Tier too low, free attempt used
      ctaContent = (
        <>
          <button
            onClick={() => router.push(attemptRoute)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base transition-colors"
          >
            Continue Your Test
          </button>
          <p className="text-xs text-zinc-500 text-center mt-2">
            Unlock 5 more attempts.{' '}
            <span
              onClick={() => router.push('/plans')}
              className="text-blue-600 hover:underline cursor-pointer text-sm font-medium"
            >
              Upgrade to Access →
            </span>
          </p>
        </>
      );
    }
  } else if (allUsed) {
    // STATE 6: All 6/6 attempts used
    ctaContent = (
      <button
        onClick={() => router.push(`/assessments/${assessment.id}?tab=analytics`)}
        className="w-full border border-zinc-300 text-zinc-700 bg-white rounded-xl py-3 font-medium text-base hover:bg-zinc-50 transition-colors"
      >
        View Analysis
      </button>
    );
  } else if (inProgress) {
    // STATE 4: Tier allows, in progress
    ctaContent = (
      <button
        onClick={() => router.push(attemptRoute)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base transition-colors"
      >
        Resume Test
      </button>
    );
  } else if (attemptsUsed === 0) {
    // STATE 3: Tier allows, 0 attempts
    ctaContent = (
      <>
        <button
          onClick={() => router.push(attemptRoute)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base transition-colors"
        >
          Start Your Test
        </button>
        <p className="text-xs text-zinc-400 text-center mt-2">
          Included in your {tierName} plan. No extra charge.
        </p>
      </>
    );
  } else {
    // STATE 5: Tier allows, 1–5 attempts used, last completed
    ctaContent = (
      <>
        <button
          onClick={() => router.push(attemptRoute)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base transition-colors"
        >
          Start New Attempt
        </button>
        <p className="text-xs text-zinc-400 text-center mt-2">
          <span
            onClick={() => router.push(`/assessments/${assessment.id}?tab=attempts`)}
            className="text-blue-600 hover:underline cursor-pointer text-sm font-medium"
          >
            View Last Analysis →
          </span>
        </p>
      </>
    );
  }

  return (
    <div>
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Clock className="w-5 h-5 text-zinc-500" />,
            value: formatDuration(assessment.duration),
            label: 'Duration',
          },
          {
            icon: <FileText className="w-5 h-5 text-zinc-500" />,
            value: String(assessment.questionCount),
            label: 'Questions',
          },
          {
            icon: <BarChart2 className="w-5 h-5 text-zinc-500" />,
            value: SCORE_RANGES[assessment.exam] ?? '—',
            label: 'Score Range',
          },
          {
            icon: <Globe className="w-5 h-5 text-zinc-500" />,
            value: 'English',
            label: 'Language',
          },
        ].map(({ icon, value, label }) => (
          <div key={label} className="bg-white shadow-sm rounded-md p-4">
            <div className="mb-2">{icon}</div>
            <p className="text-base font-semibold text-zinc-900">{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-col layout */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* What you'll get — 2/3 width */}
        <div className="md:col-span-2 bg-white shadow-sm rounded-md p-6">
          <h3 className="text-base font-medium text-zinc-900 mb-4">What you&apos;ll get</h3>
          <ul className="space-y-3">
            {WHAT_YOULL_GET.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm text-zinc-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA panel — 1/3 width */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-center">
          {ctaContent}
        </div>
      </div>

      {/* Syllabus accordion */}
      <SyllabusAccordion sections={mockSyllabus} />
    </div>
  );
}
