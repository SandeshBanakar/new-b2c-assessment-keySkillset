'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BookOpen,
  FileQuestion,
  Users,
  BarChart2,
  Award,
  Activity,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

type FullCreatorTab = 'content' | 'analytics'
type RunOnlyTab = 'overview' | 'performance'

// ─── Shared UI Components ────────────────────────────────────────────────────

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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-violet-700 text-white'
          : 'text-zinc-600 hover:bg-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}

// ─── FULL_CREATOR: Content Tab ───────────────────────────────────────────────

function ContentStats({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState<{
    courses: number
    assessments: number
    questions: number
  }>({ courses: 0, assessments: 0, questions: 0 })

  useEffect(() => {
    if (!tenantId) return

    Promise.all([
      // Courses created by this tenant
      supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      // Assessments created by this tenant (tenant_scope_id)
      supabase
        .from('assessment_items')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_scope_id', tenantId),
      // Questions created by Content Creators in this tenant
      supabase
        .from('admin_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('role', 'CONTENT_CREATOR')
        .then(async ({ data: ccUsers }) => {
          if (!ccUsers || ccUsers.length === 0) return { count: 0 }
          const ccIds = ccUsers.map((u: { id: string }) => u.id)
          const questionsRes = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .in('created_by', ccIds)
          return { count: questionsRes.count ?? 0 }
        }),
    ]).then(([courses, assessments, questions]) => {
      setStats({
        courses: courses.count ?? 0,
        assessments: assessments.count ?? 0,
        questions: questions.count ?? 0,
      })
    })
  }, [tenantId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Courses Created"
        value={stats.courses}
        icon={BookOpen}
      />
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
    </div>
  )
}

// ─── RUN_ONLY: Overview Tab ──────────────────────────────────────────────────

function OverviewStats({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState<{
    activeLearners: number
    completionRate: number
    certificateRate: number
    avgScore: number
    totalAttempts: number
  }>({
    activeLearners: 0,
    completionRate: 0,
    certificateRate: 0,
    avgScore: 0,
    totalAttempts: 0,
  })

  useEffect(() => {
    if (!tenantId) return

    Promise.all([
      // Active learners
      supabase
        .from('learners')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE'),
      // Learners with completed attempts - get all and count unique in JS
      supabase
        .from('learner_attempts')
        .select('learner_id')
        .eq('tenant_id', tenantId),
      // Learners with certificates - get all and count unique in JS
      supabase
        .from('certificates')
        .select('learner_id')
        .eq('tenant_id', tenantId),
      // Total active learners for rate calculation
      supabase
        .from('learners')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE'),
      // Average score from attempts
      supabase
        .from('learner_attempts')
        .select('score')
        .eq('tenant_id', tenantId)
        .not('score', 'is', null),
      // Total attempts
      supabase
        .from('learner_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]).then(([activeLearners, completedAttempts, certificates, totalLearners, scores, attempts]) => {
      const total = totalLearners.count ?? 0
      
      // Count unique learners from attempts
      const attemptData = completedAttempts.data ?? []
      const uniqueCompletedLearners = new Set(attemptData.map((r: { learner_id: string }) => r.learner_id)).size
      
      // Count unique learners from certificates
      const certData = certificates.data ?? []
      const uniqueCertLearners = new Set(certData.map((r: { learner_id: string }) => r.learner_id)).size
      
      // Calculate average score
      const scoreData = scores.data ?? []
      const avgScore = scoreData.length > 0
        ? Math.round(scoreData.reduce((sum: number, r: { score: number }) => sum + (r.score ?? 0), 0) / scoreData.length)
        : 0

      setStats({
        activeLearners: activeLearners.count ?? 0,
        completionRate: total > 0 ? Math.round((uniqueCompletedLearners / total) * 100) : 0,
        certificateRate: total > 0 ? Math.round((uniqueCertLearners / total) * 100) : 0,
        avgScore,
        totalAttempts: attempts.count ?? 0,
      })
    })
  }, [tenantId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Active Learners"
        value={stats.activeLearners}
        icon={Users}
      />
      <StatCard
        label="Completion Rate"
        value={`${stats.completionRate}%`}
        icon={Activity}
        subtext="Learners with ≥1 completed attempt"
      />
      <StatCard
        label="Certificate Rate"
        value={`${stats.certificateRate}%`}
        icon={Award}
        subtext="Learners who earned a certificate"
      />
      <StatCard
        label="Average Score"
        value={stats.avgScore ? `${stats.avgScore}%` : '—'}
        icon={BarChart2}
      />
      <StatCard
        label="Total Attempts"
        value={stats.totalAttempts}
        icon={FileQuestion}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UnifiedDashboard() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [tenantMode, setTenantMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!tenantId)

  // Tab state
  const [fullCreatorTab, setFullCreatorTab] = useState<FullCreatorTab>('content')
  const [runOnlyTab, setRunOnlyTab] = useState<RunOnlyTab>('overview')

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
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {isFullCreator
            ? 'Monitor your content and learner analytics'
            : 'Monitor your learner progress and performance'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
        {isFullCreator ? (
          <>
            <TabButton
              active={fullCreatorTab === 'content'}
              onClick={() => setFullCreatorTab('content')}
            >
              Content
            </TabButton>
            <TabButton
              active={fullCreatorTab === 'analytics'}
              onClick={() => setFullCreatorTab('analytics')}
            >
              Analytics
            </TabButton>
          </>
        ) : (
          <>
            <TabButton
              active={runOnlyTab === 'overview'}
              onClick={() => setRunOnlyTab('overview')}
            >
              Overview
            </TabButton>
            <TabButton
              active={runOnlyTab === 'performance'}
              onClick={() => setRunOnlyTab('performance')}
            >
              Performance
            </TabButton>
          </>
        )}
      </div>

      {/* Tab Content */}
      {isFullCreator ? (
        fullCreatorTab === 'content' ? (
          <ContentStats tenantId={tenantId!} />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-md px-6 py-12 flex flex-col items-center justify-center text-center">
            <BarChart2 className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="text-sm font-medium text-zinc-500">
              Analytics features coming soon
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Full analytics available at /reports
            </p>
          </div>
        )
      ) : (
        runOnlyTab === 'overview' ? (
          <OverviewStats tenantId={tenantId!} />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-md px-6 py-12 flex flex-col items-center justify-center text-center">
            <BarChart2 className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="text-sm font-medium text-zinc-500">
              Performance analytics coming soon
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Full reports available at /reports
            </p>
          </div>
        )
      )}
    </div>
  )
}
