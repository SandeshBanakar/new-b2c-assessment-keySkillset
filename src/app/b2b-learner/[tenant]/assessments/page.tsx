'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileQuestion, BarChart2, Clock, HelpCircle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';

const EXAM_GRADIENT_STYLE: Record<string, React.CSSProperties> = {
  SAT:  { background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
  JEE:  { background: 'linear-gradient(135deg, #f97316, #dc2626)' },
  NEET: { background: 'linear-gradient(135deg, #22c55e, #059669)' },
  PMP:  { background: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
  CLAT: { background: 'linear-gradient(135deg, #f43f5e, #db2777)' },
  BANK: { background: 'linear-gradient(135deg, #14b8a6, #0891b2)' },
  SSC:  { background: 'linear-gradient(135deg, #f59e0b, #ca8a04)' },
};
const DEFAULT_GRADIENT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #a1a1aa, #52525b)',
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

const MAX_ATTEMPTS = 5;

interface AssessmentMeta {
  duration_minutes: number | null;
  total_questions: number | null;
  difficulty: string | null;
}

interface AssessmentItemRaw {
  id: string;
  title: string;
  test_type: string;
  assessments_id: string | null;
  exam_categories: { name: string; display_name: string | null }[] | null;
}

interface AssessmentItem extends AssessmentItemRaw {
  assessments: AssessmentMeta | null;
}

interface LearnerAttempt {
  id: string;
  content_id: string;
  score_pct: number;
  passed: boolean;
  attempted_at: string;
}

function AttemptsSummaryPanel({
  totalAssessments,
  countMap,
  latestMap,
}: {
  totalAssessments: number;
  countMap: Record<string, number>;
  latestMap: Record<string, LearnerAttempt>;
}) {
  const attemptedCount = Object.values(countMap).filter((n) => n > 0).length;
  const passedCount = Object.values(latestMap).filter((a) => a.passed).length;
  const scores = Object.values(latestMap).map((a) => a.score_pct);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
      : null;

  if (attemptedCount === 0) return null;

  return (
    <div className="border border-teal-200 rounded-xl p-4" style={{ background: 'linear-gradient(to right, #f0fdfa, #ecfdf5)' }}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-teal-700" />
        <h2 className="text-sm font-semibold text-teal-900">Your Progress Summary</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-teal-700">{attemptedCount}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Attempted</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{passedCount}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Passed</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-zinc-800">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
        </div>
      </div>
      {attemptedCount < totalAssessments && (
        <p className="text-xs text-teal-600 mt-3">
          {totalAssessments - attemptedCount} assessment
          {totalAssessments - attemptedCount !== 1 ? 's' : ''} not yet attempted
        </p>
      )}
    </div>
  );
}

function AssessmentCard({
  assessment,
  attemptCount,
  tenantSlug,
}: {
  assessment: AssessmentItem;
  attemptCount: number;
  tenantSlug: string;
}) {
  const router = useRouter();
  const categoryName = assessment.exam_categories?.[0]?.name ?? '';
  const gradientStyle = EXAM_GRADIENT_STYLE[categoryName] ?? DEFAULT_GRADIENT_STYLE;
  const examBadgeClass =
    EXAM_BADGE[categoryName] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  const testTypeLabel = assessment.test_type?.replace(/_/g, ' ') ?? '—';
  const meta = assessment.assessments;
  const isExhausted = attemptCount >= MAX_ATTEMPTS;
  const hasAttempts = attemptCount > 0;

  const detailUrl = `/b2b-learner/${tenantSlug}/assessments/${assessment.id}`;
  const ctaUrl = isExhausted ? `${detailUrl}?tab=attempts` : detailUrl;

  function handleCta(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(ctaUrl);
  }

  return (
    <div
      onClick={() => router.push(detailUrl)}
      className="bg-white border border-zinc-200 rounded-xl overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-md transition-all flex flex-col"
    >
      {/* Gradient header */}
      <div
        className="h-20 flex items-center justify-center relative"
        style={gradientStyle}
      >
        <FileQuestion className="w-8 h-8 text-white/80" />
        {isExhausted && (
          <div className="absolute top-2 right-2 bg-black/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            All Done
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categoryName && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${examBadgeClass}`}>
              {categoryName}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium capitalize">
            {testTypeLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2">
          {assessment.title}
        </h3>

        {/* Metadata row */}
        {meta && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
            {meta.total_questions !== null && (
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 shrink-0" />
                {meta.total_questions} questions
              </span>
            )}
            {meta.duration_minutes !== null && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {meta.duration_minutes} min
                </span>
              </>
            )}
            {meta.difficulty && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 shrink-0" />
                  {meta.difficulty}
                </span>
              </>
            )}
          </div>
        )}

        {/* Attempt progress — shown when at least one attempt exists */}
        {hasAttempts && (
          <div className="mt-auto space-y-1">
            <p className="text-xs text-zinc-500">
              {attemptCount}/{MAX_ATTEMPTS} attempts used
            </p>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isExhausted ? 'bg-rose-500' : 'bg-teal-600'
                }`}
                style={{ width: `${(attemptCount / MAX_ATTEMPTS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={handleCta}
          className={`w-full mt-auto py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isExhausted
              ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              : 'bg-blue-700 text-white hover:bg-blue-800'
          }`}
        >
          {attemptCount === 0 ? (
            'Start Assessment'
          ) : isExhausted ? (
            'View Analysis'
          ) : (
            <>
              Start New Attempt
              <span className="bg-white/25 text-xs px-1.5 py-0.5 rounded-full font-normal">
                {MAX_ATTEMPTS - attemptCount} left
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function AssessmentsContent() {
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [countMap, setCountMap] = useState<Record<string, number>>({});
  const [latestMap, setLatestMap] = useState<Record<string, LearnerAttempt>>({});
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'EXHAUSTED'>('ALL');

  const learnerId = learner!.id;

  useEffect(() => {
    if (!tenantId || !learnerId) return;

    async function doFetch() {
      const { data: accessData } = await supabase
        .from('learner_content_access')
        .select('content_id')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .eq('content_type', 'ASSESSMENT')
        .is('revoked_at', null);

      const assessmentIds = (accessData ?? []).map(
        (a: { content_id: string }) => a.content_id,
      );

      if (assessmentIds.length === 0) {
        return { assessments: [], countMap: {}, latestMap: {} };
      }

      // Step 1 — fetch assessment_items + attempts in parallel
      const [itemsRes, attemptsRes] = await Promise.all([
        supabase
          .from('assessment_items')
          .select('id, title, test_type, assessments_id, exam_categories(name, display_name)')
          .in('id', assessmentIds),
        supabase
          .from('learner_attempts')
          .select('id, content_id, score_pct, passed, attempted_at')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId)
          .eq('content_type', 'ASSESSMENT'),
      ]);

      const rawItems = (itemsRes.data ?? []) as AssessmentItemRaw[];

      // Step 2 — fetch assessments metadata for any linked assessment_ids
      const linkedIds = [...new Set(rawItems.map((i) => i.assessments_id).filter((id): id is string => !!id))];
      let metaMap: Record<string, AssessmentMeta> = {};

      if (linkedIds.length > 0) {
        const metaRes = await supabase
          .from('assessments')
          .select('id, duration_minutes, total_questions, difficulty')
          .in('id', linkedIds);
        (metaRes.data ?? []).forEach((m: AssessmentMeta & { id: string }) => {
          metaMap[m.id] = { duration_minutes: m.duration_minutes, total_questions: m.total_questions, difficulty: m.difficulty };
        });
      }

      const mergedItems: AssessmentItem[] = rawItems.map((item) => ({
        ...item,
        assessments: item.assessments_id ? (metaMap[item.assessments_id] ?? null) : null,
      }));

      const cMap: Record<string, number> = {};
      const lMap: Record<string, LearnerAttempt> = {};

      (attemptsRes.data ?? []).forEach((a: LearnerAttempt) => {
        cMap[a.content_id] = (cMap[a.content_id] ?? 0) + 1;
        if (
          !lMap[a.content_id] ||
          new Date(a.attempted_at) > new Date(lMap[a.content_id].attempted_at)
        ) {
          lMap[a.content_id] = a;
        }
      });

      return {
        assessments: mergedItems,
        countMap: cMap,
        latestMap: lMap,
      };
    }

    doFetch().then(({ assessments, countMap, latestMap }) => {
      setAssessments(assessments);
      setCountMap(countMap);
      setLatestMap(latestMap);
      setLoading(false);
    });
  }, [tenantId, learnerId]);

  const categories = useMemo(() => {
    const cats = new Set(
      assessments
        .map((a) => a.exam_categories?.[0]?.name)
        .filter((c): c is string => !!c),
    );
    return ['ALL', ...Array.from(cats).sort()];
  }, [assessments]);

  const statusOf = (id: string) => {
    const n = countMap[id] ?? 0;
    if (n === 0) return 'NOT_STARTED';
    if (n >= MAX_ATTEMPTS) return 'EXHAUSTED';
    return 'IN_PROGRESS';
  };

  const countByStatus = (s: 'NOT_STARTED' | 'IN_PROGRESS' | 'EXHAUSTED') =>
    assessments.filter((a) => statusOf(a.id) === s).length;

  const filtered = assessments.filter((a) => {
    const cat = a.exam_categories?.[0]?.name ?? '';
    const matchesCat = categoryFilter === 'ALL' || cat === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || statusOf(a.id) === statusFilter;
    return matchesCat && matchesStatus;
  });

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
            {assessments.length} assigned ·{' '}
            {Object.values(countMap).filter((n) => n > 0).length} attempted
          </p>
        </div>
        <button
          onClick={() => router.push(`/b2b-learner/${tenantSlug}/certificates`)}
          className="px-3 py-1.5 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors"
        >
          Report Card
        </button>
      </div>

      <AttemptsSummaryPanel
        totalAssessments={assessments.length}
        countMap={countMap}
        latestMap={latestMap}
      />

      {/* Filters */}
      {assessments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}

          {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'EXHAUSTED'] as const).map((s) => {
            const label =
              s === 'ALL'         ? 'All' :
              s === 'NOT_STARTED' ? 'Not Started' :
              s === 'IN_PROGRESS' ? 'In Progress' : 'Exhausted';
            const count = s === 'ALL' ? assessments.length : countByStatus(s);
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  statusFilter === s
                    ? 'bg-teal-700 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {assessments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
          <FileQuestion className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            No assessments assigned yet. Contact your administrator.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
          <FileQuestion className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No assessments match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              attemptCount={countMap[assessment.id] ?? 0}
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
