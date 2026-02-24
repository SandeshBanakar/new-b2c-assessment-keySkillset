'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Star, Users } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import OverviewTab from '@/components/assessment-detail/OverviewTab';
import AttemptsTab from '@/components/assessment-detail/AttemptsTab';
import AnalyticsTab from '@/components/assessment-detail/AnalyticsTab';
import { useAppContext } from '@/context/AppContext';
import { mockAssessments } from '@/utils/assessmentUtils';
import { mockAttempts } from '@/data/assessments';

type Tab = 'overview' | 'attempts' | 'analytics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'attempts', label: 'Attempts' },
  { id: 'analytics', label: 'Analytics' },
];

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppContext();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const assessment = mockAssessments.find((a) => a.id === params.id);
  const attempts = mockAttempts.filter((a) => a.assessmentId === params.id);
  const userTier = user?.subscriptionTier ?? 'free';

  if (!assessment) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Assessment not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero band — dark bg, this section only */}
      <div className="bg-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push('/assessments')}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Assessments
          </button>

          <h1 className="text-2xl font-semibold text-white">{assessment.title}</h1>

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
          <AttemptsTab attempts={attempts} assessmentId={assessment.id} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            attempts={attempts}
            assessment={assessment}
            assessmentId={assessment.id}
            onSwitchToAttempts={() => setActiveTab('attempts')}
          />
        )}
      </PageWrapper>
    </div>
  );
}
