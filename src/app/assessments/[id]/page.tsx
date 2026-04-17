'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Lock, Star, Users } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { BackButton } from '@/components/navigation/BackButton';
import OverviewTab from '@/components/assessment-detail/OverviewTab';
import AttemptsTab from '@/components/assessment-detail/AttemptsTab';
import AnalyticsTab from '@/components/assessment-detail/AnalyticsTab';
import SATAnalyticsTab from '@/components/assessment-detail/SATAnalyticsTab';
import { useAppContext } from '@/context/AppContext';
import { getAssessmentBySlug, isFreeAttemptExhausted } from '@/utils/assessmentUtils';
import type { Assessment } from '@/types';
import { mockAttempts } from '@/data/assessments';

type Tab = 'overview' | 'attempts' | 'analytics';

const ALL_TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'attempts', label: 'Attempts' },
  { id: 'analytics', label: 'Analytics' },
];

function AssessmentDetailPageInner() {
  const params = useParams<{ id: string }>();
  const { user } = useAppContext();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const attemptIdParam = searchParams.get('attemptId') ?? undefined;

  const userTier = user?.subscriptionTier ?? 'free';
  // Analytics tab always visible for all tiers — AI Insights section is gated inside AnalyticsTab
  const TABS = ALL_TABS;

  const validTabs: Tab[] = TABS.map((t) => t.id);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (tabParam && validTabs.includes(tabParam)) return tabParam;
    return 'overview';
  });
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | undefined>(attemptIdParam);

  // AI Insights locked for free + basic tiers
  const isAiLocked = userTier === 'free' || userTier === 'basic';

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentsLoaded, setAssessmentsLoaded] = useState(false);

  useEffect(() => {
    getAssessmentBySlug(params.id).then((data) => {
      setAssessment(data);
      setAssessmentsLoaded(true);
    });
  }, [params.id]);

  const attempts = mockAttempts.filter((a) => a.assessmentId === params.id);
  const router = useRouter();
  const showUpgradeBanner =
    userTier === 'free' && isFreeAttemptExhausted(params.id, attempts);

  if (!assessmentsLoaded) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Assessment not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero band */}
      <div className="bg-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <BackButton className="mb-4 text-zinc-400 hover:text-white" />

          {showUpgradeBanner && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-3">
              <p className="text-sm font-medium text-amber-300">
                You&apos;ve used your free attempt
              </p>
              <button
                onClick={() => router.push('/plans')}
                className="text-sm font-medium text-amber-300 hover:text-amber-100 transition-colors shrink-0"
              >
                Upgrade →
              </button>
            </div>
          )}

          <h1 className="text-2xl font-semibold text-white">
            {assessment.title}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {assessment.exam} &middot;{' '}
            {assessment.type
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </p>
          <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              4.8
            </span>
            <span className="text-zinc-600">·</span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-zinc-400" />
              500+ Users
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar — sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-blue-700 border-blue-700 font-medium'
                    : 'text-zinc-500 border-transparent hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* AI Insights nudge — shown in tab bar only when on analytics tab and tier is free/basic */}
            {isAiLocked && activeTab === 'analytics' && (
              <button
                onClick={() => router.push('/plans')}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
              >
                <Lock className="w-3 h-3" />
                Unlock AI Insights
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <PageWrapper>
        {activeTab === 'overview' && (
          <OverviewTab
            assessment={assessment}
            userTier={userTier}
            attempts={attempts}
            onSwitchToAnalytics={() => setActiveTab('analytics')}
          />
        )}
        {activeTab === 'attempts' && (
          <AttemptsTab
            attempts={attempts}
            assessmentId={assessment.id}
            onSwitchToAnalytics={(attemptId) => {
              setSelectedAttemptId(attemptId);
              setActiveTab('analytics');
            }}
          />
        )}
        {activeTab === 'analytics' && (
          assessment.exam === 'SAT' &&
          (assessment.type === 'full-test' || assessment.type === 'subject-test')
            ? (
              <SATAnalyticsTab
                assessment={assessment}
                assessmentId={assessment.id}
                onSwitchToAttempts={() => setActiveTab('attempts')}
              />
            ) : (
              <AnalyticsTab
                assessment={assessment}
                assessmentId={assessment.id}
                onSwitchToAttempts={() => setActiveTab('attempts')}
                initialAttemptId={selectedAttemptId}
                userTier={userTier}
              />
            )
        )}
      </PageWrapper>
    </div>
  );
}

export default function AssessmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AssessmentDetailPageInner />
    </Suspense>
  );
}
