'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, AlertTriangle, User, BookOpen, FileQuestion, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getTenantId } from '@/lib/client-admin/tenants';
import { useB2BLearner, type B2BLearner } from '@/context/B2BLearnerContext';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── Persona guide ──

type PersonaState = 'completed' | 'in_progress' | 'empty';

interface GuideRow {
  state: PersonaState;
  courseLabel: string;
  assessmentLabel: string;
}

const STATE_BADGE: Record<PersonaState, { label: string; cls: string }> = {
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  empty:       { label: 'Empty State', cls: 'bg-zinc-100 text-zinc-500' },
};

function PersonaGuide({
  learners,
  guideData,
}: {
  learners: B2BLearner[];
  guideData: Record<string, GuideRow>;
}) {
  if (learners.length === 0 || Object.keys(guideData).length === 0) return null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Demo Persona Guide</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">Learner</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">State</th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Course</span>
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> Assessments</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {learners.map((l) => {
              const row = guideData[l.id];
              if (!row) return null;
              const badge = STATE_BADGE[row.state];
              return (
                <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-zinc-800">{l.full_name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{row.courseLabel}</td>
                  <td className="px-4 py-2.5 text-zinc-600">{row.assessmentLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function B2BLoginPage() {
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;
  const tenantId = getTenantId(tenantSlug);
  const router = useRouter();
  const { login, tenantInfo } = useB2BLearner();

  const [learners, setLearners] = useState<B2BLearner[]>([]);
  const [guideData, setGuideData] = useState<Record<string, GuideRow>>({});
  const [loading, setLoading] = useState(!!tenantId);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchAll() {
      const { data: learnersData } = await supabase
        .from('learners')
        .select('id, full_name, email, tenant_id, department_id')
        .eq('tenant_id', tenantId!)
        .eq('status', 'ACTIVE')
        .order('full_name');

      const learnersList = (learnersData ?? []) as B2BLearner[];
      if (learnersList.length === 0) return { learners: learnersList, guide: {} };

      const learnerIds = learnersList.map((l) => l.id);

      const [progressRes, attemptsRes] = await Promise.all([
        supabase
          .from('learner_course_progress')
          .select('learner_id, course_id, status, progress_pct')
          .eq('tenant_id', tenantId!)
          .in('learner_id', learnerIds),
        supabase
          .from('learner_attempts')
          .select('learner_id, content_id')
          .eq('tenant_id', tenantId!)
          .eq('content_type', 'ASSESSMENT')
          .in('learner_id', learnerIds),
      ]);

      const courseIds = [...new Set((progressRes.data ?? []).map((p) => p.course_id))];
      const coursesRes = courseIds.length > 0
        ? await supabase.from('courses').select('id, title').in('id', courseIds)
        : { data: [] };

      const courseTitleMap: Record<string, string> = {};
      (coursesRes.data ?? []).forEach((c) => { courseTitleMap[c.id] = c.title; });

      const guide: Record<string, GuideRow> = {};
      learnersList.forEach((l) => {
        const progressRows = (progressRes.data ?? []).filter((p) => p.learner_id === l.id);
        const attemptCount = new Set(
          (attemptsRes.data ?? []).filter((a) => a.learner_id === l.id).map((a) => a.content_id)
        ).size;

        let state: PersonaState = 'empty';
        let courseLabel = 'No course progress';

        const completedRow = progressRows.find((p) => p.status === 'COMPLETED');
        const inProgressRow = progressRows.find((p) => p.status === 'IN_PROGRESS');

        if (completedRow) {
          state = 'completed';
          const title = courseTitleMap[completedRow.course_id] ?? 'Course';
          courseLabel = `${title} — 100%`;
        } else if (inProgressRow) {
          state = 'in_progress';
          const title = courseTitleMap[inProgressRow.course_id] ?? 'Course';
          courseLabel = `${title} — ${inProgressRow.progress_pct}%`;
        }

        guide[l.id] = {
          state,
          courseLabel,
          assessmentLabel: attemptCount > 0
            ? `${attemptCount} assessment${attemptCount !== 1 ? 's' : ''} attempted`
            : 'No attempts',
        };
      });

      return { learners: learnersList, guide };
    }

    fetchAll().then(({ learners: l, guide }) => {
      setLearners(l);
      setGuideData(guide);
      setLoading(false);
    });
  }, [tenantId]);

  function handleSelect(l: B2BLearner) {
    login(l);
    router.push(`/b2b-learner/${tenantSlug}`);
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <p className="text-sm text-zinc-500">Unknown tenant: {tenantSlug}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {tenantInfo?.logo_url ? (
              <img src={tenantInfo.logo_url} alt={tenantInfo.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 bg-teal-700 rounded-md flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-sm font-semibold text-zinc-900">
              {tenantInfo?.name ?? tenantSlug}
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back To Personas</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Demo warning */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Demo login only.</span> Click any learner card to sign in as that person. This flow is not intended for production use.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Persona guide — dynamic from DB */}
            <PersonaGuide learners={learners} guideData={guideData} />

            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Select your profile</h1>
              <p className="text-sm text-zinc-500 mt-1">Who are you learning as today?</p>
            </div>

            {learners.length === 0 ? (
              <div className="text-center py-16">
                <User className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No active learners found for this organisation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {learners.map((l, i) => {
                  const guideRow = guideData[l.id];
                  return (
                    <button
                      key={l.id}
                      onClick={() => handleSelect(l)}
                      className="flex items-center gap-4 bg-white border border-zinc-200 rounded-lg p-4 text-left hover:border-teal-300 hover:shadow-sm transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(i)}`}>
                        {getInitials(l.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-teal-700 transition-colors">
                          {l.full_name}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">{l.email}</p>
                      </div>
                      {guideRow && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATE_BADGE[guideRow.state].cls}`}>
                          {STATE_BADGE[guideRow.state].label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
