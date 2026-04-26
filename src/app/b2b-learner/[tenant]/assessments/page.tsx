'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileQuestion, ChevronRight, BarChart2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';

// Gradient placeholder per exam category
const EXAM_GRADIENT: Record<string, string> = {
  SAT:   'from-blue-100 to-blue-200',
  JEE:   'from-orange-100 to-orange-200',
  NEET:  'from-green-100 to-green-200',
  PMP:   'from-purple-100 to-purple-200',
  CLAT:  'from-rose-100 to-rose-200',
  BANK:  'from-teal-100 to-teal-200',
  SSC:   'from-amber-100 to-amber-200',
};

const EXAM_BADGE: Record<string, string> = {
  SAT:   'bg-blue-50 text-blue-700 border border-blue-200',
  JEE:   'bg-orange-50 text-orange-700 border border-orange-200',
  NEET:  'bg-green-50 text-green-700 border border-green-200',
  PMP:   'bg-purple-50 text-purple-700 border border-purple-200',
  CLAT:  'bg-rose-50 text-rose-700 border border-rose-200',
  BANK:  'bg-teal-50 text-teal-700 border border-teal-200',
  SSC:   'bg-amber-50 text-amber-700 border border-amber-200',
};

interface Assessment {
  id: string;
  title: string;
  test_type: string;
  exam_categories: { name: string }[] | null;
}

interface LearnerAttempt {
  id: string;
  content_id: string;
  score_pct: number;
  passed: boolean;
  attempted_at: string;
}

function AttemptsSummaryPanel({
  assessments,
  attemptMap,
}: {
  assessments: Assessment[];
  attemptMap: Record<string, LearnerAttempt>;
}) {
  const attempted = Object.keys(attemptMap).length;
  const passed = Object.values(attemptMap).filter((a) => a.passed).length;
  const scores = Object.values(attemptMap).map((a) => a.score_pct);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null;

  if (attempted === 0) return null;

  return (
    <div className="bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-teal-700" />
        <h2 className="text-sm font-semibold text-teal-900">Your Progress Summary</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-teal-700">{attempted}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Attempted</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{passed}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Passed</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-zinc-800">{avgScore !== null ? `${avgScore}%` : '—'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
        </div>
      </div>
      {attempted < assessments.length && (
        <p className="text-xs text-teal-600 mt-3">
          {assessments.length - attempted} assessment{assessments.length - attempted !== 1 ? 's' : ''} not yet attempted
        </p>
      )}
    </div>
  );
}

function AssessmentCard({
  assessment,
  attempt,
  tenantSlug,
}: {
  assessment: Assessment;
  attempt: LearnerAttempt | undefined;
  tenantSlug: string;
}) {
  const router = useRouter();
  const categoryName = assessment.exam_categories?.[0]?.name ?? '';
  const gradient = EXAM_GRADIENT[categoryName] ?? 'from-zinc-100 to-zinc-200';
  const examBadgeClass = EXAM_BADGE[categoryName] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  const testTypeLabel = assessment.test_type?.replace(/_/g, ' ') ?? '—';

  return (
    <div
      onClick={() => router.push(`/b2b-learner/${tenantSlug}/assessments/${assessment.id}`)}
      className="bg-white border border-zinc-200 rounded-xl overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group"
    >
      {/* Gradient header strip */}
      <div className={`h-2 bg-linear-to-r ${gradient}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + content */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center shrink-0 mt-0.5`}>
              <FileQuestion className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-teal-700 transition-colors truncate">
                {assessment.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {categoryName && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${examBadgeClass}`}>
                    {categoryName}
                  </span>
                )}
                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium capitalize">
                  {testTypeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Attempt chip */}
          <div className="shrink-0">
            {attempt ? (
              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1 text-sm font-bold ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {attempt.passed
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : <XCircle className="w-3.5 h-3.5" />}
                  {attempt.score_pct}%
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="w-3 h-3" />
                  {new Date(attempt.attempted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <span>Start</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Attempt status bar */}
        {attempt && (
          <div className={`mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs`}>
            <span className={`font-medium ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
              {attempt.passed ? '✓ Passed' : '✗ Did not pass'}
            </span>
            <span className="text-zinc-400">Last attempt</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AssessmentsContent() {
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attemptMap, setAttemptMap] = useState<Record<string, LearnerAttempt>>({});
  const [loading, setLoading] = useState(true);

  const learnerId = learner!.id;

  useEffect(() => {
    if (!tenantId || !learnerId) return;

    Promise.all([
      supabase
        .from('assessment_items')
        .select('id, title, test_type, exam_categories(name)')
        .eq('status', 'LIVE')
        .order('created_at', { ascending: false }),
      supabase
        .from('learner_attempts')
        .select('id, content_id, score_pct, passed, attempted_at')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .eq('content_type', 'ASSESSMENT'),
    ]).then(([assessRes, attemptsRes]) => {
      const assessData = (assessRes.data ?? []) as Assessment[];
      const attemptData = attemptsRes.data ?? [];

      const map: Record<string, LearnerAttempt> = {};
      attemptData.forEach((a: LearnerAttempt) => {
        if (!map[a.content_id] || new Date(a.attempted_at) > new Date(map[a.content_id].attempted_at)) {
          map[a.content_id] = a;
        }
      });

      setAssessments(assessData);
      setAttemptMap(map);
      setLoading(false);
    });
  }, [tenantId, learnerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Assessments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {assessments.length} available · {Object.keys(attemptMap).length} attempted
          </p>
        </div>
        <button
          onClick={() => router.push(`/b2b-learner/${tenantSlug}/certificates`)}
          className="px-3 py-1.5 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors"
        >
          Report Card
        </button>
      </div>

      {/* Attempt summary panel — only shown if there are attempts */}
      <AttemptsSummaryPanel assessments={assessments} attemptMap={attemptMap} />

      {assessments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
          <FileQuestion className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No assessments available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              attempt={attemptMap[assessment.id]}
              tenantSlug={tenantSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function B2bAssessmentsPage() {
  return (
    <B2BAuthGuard>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <AssessmentsContent />
      </main>
    </B2BAuthGuard>
  );
}
