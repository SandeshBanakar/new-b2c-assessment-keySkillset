'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BookOpen,
  FileQuestion,
  Users,
  BarChart2,
  Award,
  CheckCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
}: {
  label: string
  value: number | string | null
  icon: React.ElementType
  subtext?: string
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-700" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-zinc-900">
          {value === null ? '—' : value}
        </p>
        <p className="text-sm text-zinc-500">{label}</p>
        {subtext && <p className="text-xs text-zinc-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

// ─── RUN_ONLY: 3 cards ────────────────────────────────────────────────────────

function RunOnlyStats({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState<{
    activeLearners: number | null
    coursesCompleted: number | null
    coursesAssigned: number | null
    certificatesGenerated: number | null
  }>({ activeLearners: null, coursesCompleted: null, coursesAssigned: null, certificatesGenerated: null })

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase
        .from('learners')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE'),
      supabase
        .from('learner_course_progress')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'COMPLETED'),
      supabase
        .from('content_assignments')
        .select('content_id')
        .eq('tenant_id', tenantId)
        .eq('content_type', 'COURSE')
        .is('removed_at', null),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]).then(([learners, completed, assignments, certs]) => {
      const uniqueAssigned = new Set(
        (assignments.data ?? []).map((r: { content_id: string }) => r.content_id)
      ).size
      setStats({
        activeLearners: learners.count ?? 0,
        coursesCompleted: completed.count ?? 0,
        coursesAssigned: uniqueAssigned,
        certificatesGenerated: certs.count ?? 0,
      })
    })
  }, [tenantId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Active Learners" value={stats.activeLearners} icon={Users} />
      <StatCard
        label="Courses Completed"
        value={stats.coursesCompleted}
        icon={CheckCircle}
        subtext={
          stats.coursesAssigned !== null
            ? `out of ${stats.coursesAssigned} assigned`
            : undefined
        }
      />
      <StatCard label="Certificates Generated" value={stats.certificatesGenerated} icon={Award} />
    </div>
  )
}

// ─── FULL_CREATOR: 6 cards (unified fetch) ────────────────────────────────────

function FullCreatorStats({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState<{
    courses: number | null
    assessments: number | null
    questions: number | null
    activeLearners: number | null
    coursesCompleted: number | null
    coursesAssigned: number | null
    certificatesGenerated: number | null
  }>({
    courses: null,
    assessments: null,
    questions: null,
    activeLearners: null,
    coursesCompleted: null,
    coursesAssigned: null,
    certificatesGenerated: null,
  })

  useEffect(() => {
    if (!tenantId) return

    const questionsQuery = supabase
      .from('admin_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'CONTENT_CREATOR')
      .then(async ({ data: ccUsers }) => {
        if (!ccUsers || ccUsers.length === 0) return { count: 0 }
        const ccIds = ccUsers.map((u: { id: string }) => u.id)
        const { count } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .in('created_by', ccIds)
        return { count: count ?? 0 }
      })

    Promise.all([
      supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('assessment_items')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_scope_id', tenantId),
      questionsQuery,
      supabase
        .from('learners')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE'),
      supabase
        .from('learner_course_progress')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'COMPLETED'),
      supabase
        .from('content_assignments')
        .select('content_id')
        .eq('tenant_id', tenantId)
        .eq('content_type', 'COURSE')
        .is('removed_at', null),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]).then(([courses, assessments, questions, learners, completed, assignments, certs]) => {
      const uniqueAssigned = new Set(
        (assignments.data ?? []).map((r: { content_id: string }) => r.content_id)
      ).size
      setStats({
        courses: courses.count ?? 0,
        assessments: assessments.count ?? 0,
        questions: questions.count ?? 0,
        activeLearners: learners.count ?? 0,
        coursesCompleted: completed.count ?? 0,
        coursesAssigned: uniqueAssigned,
        certificatesGenerated: certs.count ?? 0,
      })
    })
  }, [tenantId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Courses Created" value={stats.courses} icon={BookOpen} />
      <StatCard
        label="Assessments Created"
        value={stats.assessments}
        icon={FileQuestion}
        subtext="Adaptive & Linear"
      />
      <StatCard
        label="Questions Added"
        value={stats.questions}
        icon={BarChart2}
        subtext="By Content Creators"
      />
      <StatCard label="Active Learners" value={stats.activeLearners} icon={Users} />
      <StatCard
        label="Courses Completed"
        value={stats.coursesCompleted}
        icon={CheckCircle}
        subtext={
          stats.coursesAssigned !== null
            ? `out of ${stats.coursesAssigned} assigned`
            : undefined
        }
      />
      <StatCard label="Certificates Generated" value={stats.certificatesGenerated} icon={Award} />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UnifiedDashboard() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [tenantMode, setTenantMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!tenantId)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('tenants')
      .select('feature_toggle_mode')
      .eq('id', tenantId)
      .single()
      .then(({ data }) => {
        setTenantMode(data?.feature_toggle_mode ?? null)
        setLoading(false)
      })
  }, [tenantId])

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    )
  }

  const isFullCreator = tenantMode === 'FULL_CREATOR'

  return (
    <div className="px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {isFullCreator
            ? 'Monitor your content creation and learner progress'
            : 'Monitor your learner progress and performance'}
        </p>
      </div>
      {tenantId && (
        isFullCreator
          ? <FullCreatorStats tenantId={tenantId} />
          : <RunOnlyStats tenantId={tenantId} />
      )}
    </div>
  )
}
