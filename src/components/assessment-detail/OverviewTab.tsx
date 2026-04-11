'use client';

import { useRouter } from 'next/navigation';
import {
  Award,
  Clock,
  FileText,
  Navigation2,
} from 'lucide-react';
import { DEMO_ATTEMPT_STATES } from '@/data/assessments';
import { useAppContext } from '@/context/AppContext';
import type { Assessment, MockAttempt, Tier } from '@/types';
import { DisplayConfigPreview } from './DisplayConfigPreview';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  assessment: Assessment;
  userTier: Tier;
  attempts: MockAttempt[];
  onSwitchToAnalytics: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function navPolicyLabel(policy: string | null | undefined): string {
  switch (policy) {
    case 'FREE':           return 'Free Navigation';
    case 'LINEAR':         return 'Adaptive';
    case 'SECTION_LOCKED': return 'Section Lock';
    default:               return '—';
  }
}

function tierAllowsType(tier: Tier, type: Assessment['type']): boolean {
  switch (tier) {
    case 'free':         return false;
    case 'basic':        return type === 'full-test';
    case 'professional': return type === 'full-test' || type === 'subject-test';
    case 'premium':      return true;
  }
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

function StatCards({ assessment }: { assessment: Assessment }) {
  // For content_items rows: read from assessment_config
  // For legacy assessments rows: read from existing fields
  const isContentItem = assessment._source === 'assessment_items';

  const duration      = isContentItem
    ? (assessment.assessment_config?.duration_minutes ?? 0)
    : assessment.duration;
  const questionCount = isContentItem
    ? (assessment.assessment_config?.total_questions ?? 0)
    : assessment.questionCount;
  const totalMarks    = isContentItem
    ? (assessment.assessment_config?.total_marks ?? null)
    : null;
  const navPolicy     = isContentItem
    ? (assessment.assessment_config?.navigation_policy ?? null)
    : null;

  const cards = [
    {
      icon: <Clock className="w-5 h-5 text-zinc-500" />,
      value: formatDuration(duration),
      label: 'Duration',
    },
    {
      icon: <FileText className="w-5 h-5 text-zinc-500" />,
      value: questionCount ? String(questionCount) : '—',
      label: 'Questions',
    },
    {
      icon: <Award className="w-5 h-5 text-zinc-500" />,
      value: totalMarks != null ? String(totalMarks) : '—',
      label: 'Total Marks',
    },
    {
      icon: <Navigation2 className="w-5 h-5 text-zinc-500" />,
      value: navPolicy ? navPolicyLabel(navPolicy) : '—',
      label: 'Navigation',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ icon, value, label }) => (
        <div key={label} className="bg-white shadow-sm rounded-md p-4">
          <div className="mb-2">{icon}</div>
          <p className="text-base font-semibold text-zinc-900">{value}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OverviewTab({ assessment, userTier, attempts }: OverviewTabProps) {
  const router = useRouter();
  const { user } = useAppContext();

  const tierAllows  = tierAllowsType(userTier, assessment.type);
  const tierName    = userTier.charAt(0).toUpperCase() + userTier.slice(1);
  const attemptRoute = `/assessments/${assessment.slug ?? assessment.id}/instructions`;

  const userId       = user?.id ?? '';
  const attemptState = DEMO_ATTEMPT_STATES[userId]?.[assessment.id] ?? {
    attemptsUsed: 0,
    freeAttemptUsed: false,
    status: 'not_started' as const,
    lastAccessedAt: null,
  };

  const attemptsUsed    = attemptState.attemptsUsed;
  const freeAttemptUsed = attemptState.freeAttemptUsed;
  const inProgress      = attemptState.status === 'in_progress';
  const allUsed         = attemptsUsed >= 6;

  // ── CTA ──────────────────────────────────────────────────────────────────

  let ctaContent: React.ReactNode;

  if (!tierAllows) {
    if (!freeAttemptUsed) {
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
            <span onClick={() => router.push('/plans')} className="text-blue-600 hover:underline cursor-pointer text-sm font-medium">
              Upgrade to Access →
            </span>
          </p>
        </>
      );
    } else {
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
            <span onClick={() => router.push('/plans')} className="text-blue-600 hover:underline cursor-pointer text-sm font-medium">
              Upgrade to Access →
            </span>
          </p>
        </>
      );
    }
  } else if (allUsed) {
    ctaContent = (
      <button
        onClick={() => router.push(`/assessments/${assessment.id}?tab=analytics`)}
        className="w-full border border-zinc-300 text-zinc-700 bg-white rounded-xl py-3 font-medium text-base hover:bg-zinc-50 transition-colors"
      >
        View Analysis
      </button>
    );
  } else if (inProgress) {
    ctaContent = (
      <button
        onClick={() => router.push(attemptRoute)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-base transition-colors"
      >
        Resume Test
      </button>
    );
  } else if (attemptsUsed === 0) {
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

  // ── Derive display_config ────────────────────────────────────────────────

  const dc = assessment.display_config ?? {};
  const whatYoullGet  = dc.what_youll_get ?? [];
  const topicsCovered = dc.topics_covered ?? [];
  const language      = dc.language ?? null;
  const description   = assessment.description ?? null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Stat cards */}
      <StatCards assessment={assessment} />

      {/* What You'll Get + CTA */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DisplayConfigPreview
            description={description}
            language={language}
            whatYoullGet={whatYoullGet}
            topicsCovered={topicsCovered}
            testType={
              assessment.type === 'full-test'    ? 'FULL_TEST'    :
              assessment.type === 'subject-test' ? 'SUBJECT_TEST' :
              assessment.type === 'chapter-test' ? 'CHAPTER_TEST' : undefined
            }
          />
        </div>

        {/* CTA panel */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-center">
          {ctaContent}
        </div>
      </div>
    </div>
  );
}
