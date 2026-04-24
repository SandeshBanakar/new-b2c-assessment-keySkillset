'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, FileText, HelpCircle, BarChart2, Award, PlayCircle } from 'lucide-react';
import { getAssessmentBySlug } from '@/utils/assessmentUtils';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';
import type { Assessment } from '@/types';

interface LearnerAttempt {
  id: string;
  assessment_id: string;
  score: number;
  score_rw?: number;
  score_math?: number;
  passed: boolean;
  completed_at: string;
  is_free_attempt: boolean;
  attempt_number: number;
  time_taken_seconds: number;
}

type Tab = 'overview' | 'attempts' | 'analytics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'attempts', label: 'Attempts' },
  { id: 'analytics', label: 'Analytics' },
];

function OverviewTab({ assessment }: { assessment: Assessment }) {
  const assessmentAny = assessment as any;
  return (
    <div className="space-y-6">
      {assessmentAny.thumbnail_url && (
        <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden">
          <img
            src={assessmentAny.thumbnail_url}
            alt={assessment.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{assessment.title}</h1>
        <p className="text-sm text-zinc-500 mt-1 capitalize">
          {assessment.exam} {assessment.type}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-50 rounded-lg p-4">
          <Clock className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-semibold text-zinc-900">
            {assessment.duration} min
          </p>
          <p className="text-xs text-zinc-500">Duration</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-4">
          <HelpCircle className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-semibold text-zinc-900">
            {assessment.questionCount}
          </p>
          <p className="text-xs text-zinc-500">Questions</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-4">
          <BarChart2 className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-semibold text-zinc-900">
            {assessment.questionCount}
          </p>
          <p className="text-xs text-zinc-500">Total Marks</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-4">
          <Award className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-semibold text-zinc-900">
            {assessment.isPuzzleMode ? 'Yes' : 'No'}
          </p>
          <p className="text-xs text-zinc-500">Puzzle Mode</p>
        </div>
      </div>

      {assessmentAny.description && (
        <div>
          <h2 className="text-lg font-medium text-zinc-900 mb-2">About this assessment</h2>
          <p className="text-sm text-zinc-600">{assessmentAny.description}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors flex items-center gap-2">
          <PlayCircle className="w-4 h-4" />
          Start Assessment
        </button>
      </div>
    </div>
  );
}

function AttemptsTab({ assessmentId }: { assessmentId: string }) {
  const attempts: LearnerAttempt[] = [];
  const hasAttempts = attempts.length > 0;

  if (!hasAttempts) {
    return (
      <div className="text-center py-12 bg-zinc-50 rounded-lg">
        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-500">No attempts yet</p>
        <p className="text-xs text-zinc-400 mt-1">
          Start the assessment to see your attempts here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attempts.map((attempt, index) => (
        <div
          key={attempt.id}
          className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-zinc-900">
              Attempt {attempt.attempt_number}
              {attempt.is_free_attempt && (
                <span className="ml-2 text-xs text-zinc-500">(Free)</span>
              )}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(attempt.completed_at).toLocaleDateString()} •{' '}
              {Math.round(attempt.time_taken_seconds / 60)} min
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-semibold ${
                attempt.passed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {attempt.score}%
            </p>
            <p className="text-xs text-zinc-500">
              {attempt.passed ? 'Passed' : 'Failed'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ assessmentId }: { assessmentId: string }) {
  return (
    <div className="text-center py-12 bg-zinc-50 rounded-lg">
      <BarChart2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-zinc-500">Complete an assessment</p>
      <p className="text-xs text-zinc-400 mt-1">
        Your performance analytics will appear here.
      </p>
    </div>
  );
}

function B2bAssessmentDetail() {
  const params = useParams<{ tenant: string; id: string }>();
  const assessmentId = params.id;
  const { tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!assessmentId) return;
    getAssessmentBySlug(assessmentId).then((data) => {
      setAssessment(data);
      setLoading(false);
    });
  }, [assessmentId]);

  if (loading) {
    return (
      <>
        <B2BNavbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  if (!assessment) {
    return (
      <>
        <B2BNavbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500">Assessment not found.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/b2b-learner/${tenantSlug}/assessments`)}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </button>

          <div className="border-b border-zinc-200 mb-6">
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-700 text-teal-700'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeTab === 'overview' && <OverviewTab assessment={assessment} />}
            {activeTab === 'attempts' && <AttemptsTab assessmentId={assessmentId} />}
            {activeTab === 'analytics' && <AnalyticsTab assessmentId={assessmentId} />}
          </div>
        </div>
      </main>
    </>
  );
}

export default function B2bAssessmentDetailPage() {
  return (
    <B2BAuthGuard>
      <Suspense>
        <B2bAssessmentDetail />
      </Suspense>
    </B2BAuthGuard>
  );
}