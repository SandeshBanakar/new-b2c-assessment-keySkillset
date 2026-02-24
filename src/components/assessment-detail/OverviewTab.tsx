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
import { Button } from '@/components/ui/button';
import { SCORE_RANGES, mockSyllabus } from '@/data/assessments';
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
                <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <ul className="px-6 pb-4 space-y-1.5">
                {section.topics.map((topic) => (
                  <li key={topic} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
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
  attempts,
  onSwitchToAnalytics,
}: OverviewTabProps) {
  const router = useRouter();
  const isFree = userTier === 'free';
  const inProgress = attempts.find((a) => a.status === 'in_progress');
  const completedCount = attempts.filter((a) => a.status === 'completed').length;
  const freeAttemptUsed = attempts.some((a) => a.attemptNumber === 0 && a.status !== 'not_started');
  const allUsed = completedCount >= 5;

  // Derive CTA
  let ctaContent: React.ReactNode;
  if (isFree && !freeAttemptUsed) {
    ctaContent = (
      <>
        <Button
          onClick={() => router.push(`/quiz/daily`)}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md"
        >
          Start Free Attempt →
        </Button>
        <p className="text-xs text-zinc-400 mt-2 text-center">
          No plan needed for your first attempt
        </p>
      </>
    );
  } else if (isFree && freeAttemptUsed) {
    ctaContent = (
      <>
        <Button
          onClick={() => router.push('/plans')}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md"
        >
          Upgrade to unlock more attempts
        </Button>
        <p className="text-xs text-zinc-400 mt-2 text-center">
          You&apos;ve used your free attempt
        </p>
      </>
    );
  } else if (inProgress) {
    ctaContent = (
      <>
        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md">
          Resume Test →
        </Button>
        <p className="text-xs text-zinc-400 mt-2 text-center">
          You have an attempt in progress
        </p>
      </>
    );
  } else if (!allUsed) {
    ctaContent = (
      <>
        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md">
          Start Attempt →
        </Button>
        <p className="text-xs text-zinc-400 mt-2 text-center">
          {completedCount} of 5 attempts used
        </p>
      </>
    );
  } else {
    ctaContent = (
      <>
        <p className="text-sm text-zinc-500 text-center mb-3">All attempts completed</p>
        <Button
          variant="outline"
          onClick={onSwitchToAnalytics}
          className="w-full rounded-md border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        >
          View Analytics →
        </Button>
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
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-zinc-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA — 1/3 width */}
        <div className="bg-white shadow-sm rounded-md p-6 flex flex-col justify-center">
          {ctaContent}
        </div>
      </div>

      {/* Syllabus accordion */}
      <SyllabusAccordion sections={mockSyllabus} />
    </div>
  );
}
