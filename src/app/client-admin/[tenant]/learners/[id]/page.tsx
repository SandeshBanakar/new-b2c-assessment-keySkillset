'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Building2,
  Users,
  Phone,
  Mail,
  Hash,
  FileText,
  BookOpen,
  Calendar,
  StickyNote,
  AlertTriangle,
  Award,
  BarChart2,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'
import { getDialCode } from '@/components/PhoneInputField'
import { formatCourseType } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LearnerDetail {
  id: string
  full_name: string
  email: string
  phone: string | null
  phone_country_code: string | null
  status: 'ACTIVE' | 'INACTIVE'
  employee_roll_number: string | null
  notes: string | null
  created_at: string
  last_active_at: string | null
  department_id: string | null
  team_id: string | null
  departmentName?: string
  teamName?: string
}

interface AssessmentAttemptRow {
  content_id: string
  title: string
  category: string
  attempts: number
  best_score: number | null
  last_attempted: string
}

interface CoursePerformanceRow {
  course_id: string
  title: string
  course_type: string
  progress_pct: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  started_at: string | null
  completed_at: string | null
  certificate_number: string | null
}

interface AssignedContent {
  id: string
  title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  granted_at: string
  source: 'DIRECT' | 'TEAM' | 'DEPARTMENT'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
      {children}
    </p>
  )
}

function InfoGrid({
  items,
}: {
  items: { label: string; value: React.ReactNode }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-zinc-400">{label}</p>
          <div className="text-sm font-medium text-zinc-900 mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  )
}

function EmptySection({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub?: string }) {
  return (
    <div className="px-5 py-10 flex flex-col items-center text-center">
      <Icon className="w-7 h-7 text-zinc-300 mb-2" />
      <p className="text-sm font-medium text-zinc-500">{message}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return status === 'ACTIVE' ? (
    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
      Inactive
    </span>
  )
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-violet-500' : 'bg-zinc-200'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-100 rounded-full h-1.5 max-w-20">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-600 shrink-0">{pct}%</span>
    </div>
  )
}

function CourseStatusBadge({ status }: { status: CoursePerformanceRow['status'] }) {
  if (status === 'COMPLETED') return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  )
  if (status === 'IN_PROGRESS') return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <Clock className="w-3 h-3" /> In Progress
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
      Not Started
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearnerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenant as string
  const learnerId = params.id as string
  const tenantId = getTenantId(tenantSlug)

  const [learner, setLearner] = useState<LearnerDetail | null>(null)
  const [assessmentPerf, setAssessmentPerf] = useState<AssessmentAttemptRow[]>([])
  const [coursePerf, setCoursePerf] = useState<CoursePerformanceRow[]>([])
  const [content, setContent] = useState<AssignedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId || !learnerId) { setLoading(false); return }

    async function load() {
      setLoading(true)

      // ── 1. Learner row ──────────────────────────────────────────────────────
      const { data: l } = await supabase
        .from('learners')
        .select('id, full_name, email, phone, phone_country_code, status, employee_roll_number, notes, created_at, last_active_at, department_id, team_id')
        .eq('id', learnerId)
        .eq('tenant_id', tenantId)
        .single()

      if (!l) { setLoading(false); return }

      const [deptResult, teamResult] = await Promise.all([
        l.department_id
          ? supabase.from('departments').select('name').eq('id', l.department_id).single()
          : Promise.resolve({ data: null }),
        l.team_id
          ? supabase.from('teams').select('name').eq('id', l.team_id).single()
          : Promise.resolve({ data: null }),
      ])

      setLearner({ ...l, departmentName: deptResult.data?.name, teamName: teamResult.data?.name })

      // ── 2. All attempts for this learner + tenant ───────────────────────────
      const { data: attempts } = await supabase
        .from('learner_attempts')
        .select('learner_id, content_id, content_type, score_pct, attempted_at, time_taken_seconds')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .order('attempted_at', { ascending: false })

      const assessmentIds = [...new Set((attempts ?? []).filter(a => a.content_type === 'ASSESSMENT').map(a => a.content_id))]
      const courseIds = [...new Set((attempts ?? []).filter(a => a.content_type === 'COURSE').map(a => a.content_id))]

      // ── 3. Assessment performance ───────────────────────────────────────────
      if (assessmentIds.length > 0) {
        const [{ data: ciRows }, { data: catRows }] = await Promise.all([
          supabase.from('content_items').select('id, title, exam_category_id').in('id', assessmentIds),
          supabase.from('exam_categories').select('id, name'),
        ])

        const catMap: Record<string, string> = {}
        for (const c of catRows ?? []) catMap[c.id] = c.name

        const rows: AssessmentAttemptRow[] = assessmentIds.map(cid => {
          const ci = ciRows?.find(r => r.id === cid)
          const cAttempts = (attempts ?? []).filter(a => a.content_id === cid && a.content_type === 'ASSESSMENT')
          const scores = cAttempts.map(a => a.score_pct).filter((s): s is number => s != null)
          const lastAttempt = cAttempts[0]?.attempted_at ?? ''
          return {
            content_id: cid,
            title: ci?.title ?? 'Unknown Assessment',
            category: ci?.exam_category_id ? (catMap[ci.exam_category_id] ?? '—') : '—',
            attempts: cAttempts.length,
            best_score: scores.length > 0 ? Math.max(...scores) : null,
            last_attempted: lastAttempt,
          }
        }).sort((a, b) => (b.last_attempted > a.last_attempted ? 1 : -1))

        setAssessmentPerf(rows)
      }

      // ── 4. Course performance ───────────────────────────────────────────────
      if (courseIds.length > 0) {
        const [{ data: courseRows }, { data: progressRows }, { data: certRows }] = await Promise.all([
          supabase.from('courses').select('id, title, course_type').in('id', courseIds),
          supabase.from('learner_course_progress')
            .select('course_id, status, progress_pct, started_at, completed_at')
            .eq('learner_id', learnerId)
            .eq('tenant_id', tenantId)
            .in('course_id', courseIds),
          supabase.from('certificates')
            .select('content_id, certificate_number')
            .eq('learner_id', learnerId)
            .eq('tenant_id', tenantId)
            .in('content_id', courseIds),
        ])

        const certMap: Record<string, string> = {}
        for (const c of certRows ?? []) certMap[c.content_id] = c.certificate_number

        const perfMap: Record<string, typeof progressRows extends Array<infer T> | null ? T : never> = {}
        for (const p of progressRows ?? []) perfMap[p.course_id] = p

        const cRows: CoursePerformanceRow[] = courseIds.map(cid => {
          const course = courseRows?.find(r => r.id === cid)
          const perf = perfMap[cid]
          const courseAttempts = (attempts ?? []).filter(a => a.content_id === cid && a.content_type === 'COURSE')
          const latestAttempt = courseAttempts[0]

          let status: CoursePerformanceRow['status'] = 'NOT_STARTED'
          let progress_pct = 0
          let started_at: string | null = null
          let completed_at: string | null = null

          if (perf) {
            status = perf.status as CoursePerformanceRow['status']
            progress_pct = perf.progress_pct
            started_at = perf.started_at
            completed_at = perf.completed_at
          } else if (latestAttempt) {
            const score = latestAttempt.score_pct ?? 0
            status = score >= 100 ? 'COMPLETED' : score > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
            progress_pct = Math.min(100, score)
            started_at = latestAttempt.attempted_at
            completed_at = score >= 100 ? latestAttempt.attempted_at : null
          }

          return {
            course_id: cid,
            title: course?.title ?? 'Unknown Course',
            course_type: course?.course_type ?? '',
            progress_pct,
            status,
            started_at,
            completed_at,
            certificate_number: certMap[cid] ?? null,
          }
        })

        setCoursePerf(cRows)
      }

      // ── 5. Assigned content (learner_content_access) ────────────────────────
      const { data: accessRows } = await supabase
        .from('learner_content_access')
        .select('content_id, content_type, granted_at, source_assignment_id')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .is('revoked_at', null)

      if (accessRows?.length) {
        const assignmentIds = accessRows.map(r => r.source_assignment_id).filter(Boolean) as string[]
        const { data: assignments } = assignmentIds.length > 0
          ? await supabase.from('content_assignments').select('id, target_type').in('id', assignmentIds)
          : { data: [] }

        const assignmentTargetMap: Record<string, string> = {}
        for (const a of assignments ?? []) assignmentTargetMap[a.id] = a.target_type

        const aIds = accessRows.filter(r => r.content_type === 'ASSESSMENT').map(r => r.content_id)
        const cIds = accessRows.filter(r => r.content_type === 'COURSE').map(r => r.content_id)

        const [{ data: ciRows }, { data: cRows }] = await Promise.all([
          aIds.length > 0 ? supabase.from('content_items').select('id, title').in('id', aIds) : Promise.resolve({ data: [] }),
          cIds.length > 0 ? supabase.from('courses').select('id, title').in('id', cIds) : Promise.resolve({ data: [] }),
        ])

        const titleMap: Record<string, string> = {}
        for (const ci of ciRows ?? []) titleMap[ci.id] = ci.title
        for (const c of cRows ?? []) titleMap[c.id] = c.title

        const merged: AssignedContent[] = accessRows
          .filter(r => titleMap[r.content_id])
          .map(r => {
            const targetType = r.source_assignment_id ? assignmentTargetMap[r.source_assignment_id] : 'INDIVIDUAL'
            const source: 'DIRECT' | 'TEAM' | 'DEPARTMENT' =
              targetType === 'TEAM' ? 'TEAM' : targetType === 'DEPARTMENT' ? 'DEPARTMENT' : 'DIRECT'
            return {
              id: r.content_id,
              title: titleMap[r.content_id],
              content_type: r.content_type as 'ASSESSMENT' | 'COURSE',
              granted_at: r.granted_at,
              source,
            }
          })

        setContent(merged)
      }

      setLoading(false)
    }

    void load()
  }, [learnerId, tenantId])

  async function handleToggleStatus() {
    if (!learner) return
    setSaving(true)
    const newStatus = learner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await supabase.from('learners').update({ status: newStatus }).eq('id', learner.id)
    setLearner(prev => prev ? { ...prev, status: newStatus } : prev)
    setSaving(false)
    setConfirmDeactivate(false)
  }

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    )
  }

  if (!learner) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-zinc-500">Learner not found.</p>
        <Link href={`/client-admin/${tenantSlug}/learners`} className="text-sm text-violet-700 hover:underline mt-2 inline-block">
          ← Back to Learners
        </Link>
      </div>
    )
  }

  const sourceLabel: Record<string, string> = { DIRECT: 'Individual', TEAM: 'Team', DEPARTMENT: 'Department' }

  return (
    <div className="px-8 py-8">

      {/* Back link */}
      <Link
        href={`/client-admin/${tenantSlug}/learners`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Learners
      </Link>

      {/* Profile header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-violet-100 flex items-center justify-center text-lg font-semibold text-violet-700 shrink-0">
            {learner.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{learner.full_name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{learner.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={learner.status} />
          {learner.status === 'ACTIVE' ? (
            <button
              onClick={() => setConfirmDeactivate(true)}
              className="px-3 py-1.5 text-sm font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleToggleStatus}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium text-violet-700 border border-violet-200 rounded-md hover:bg-violet-50 transition-colors disabled:opacity-50"
            >
              {saving ? 'Reactivating…' : 'Reactivate'}
            </button>
          )}
        </div>
      </div>

      {/* Identity + Organisation cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Identity */}
        <div className="bg-white border border-zinc-200 rounded-md px-5 py-4">
          <SectionHeader>Identity</SectionHeader>
          <InfoGrid items={[
            { label: 'Full Name', value: learner.full_name },
            { label: 'Email', value: <span className="text-zinc-600 font-normal">{learner.email}</span> },
            {
              label: 'Phone',
              value: learner.phone
                ? <span className="font-normal">{learner.phone_country_code ? `${getDialCode(learner.phone_country_code)} ` : ''}{learner.phone}</span>
                : <span className="text-zinc-400 font-normal">—</span>,
            },
            {
              label: 'Employee ID',
              value: learner.employee_roll_number
                ? <span className="font-normal">{learner.employee_roll_number}</span>
                : <span className="text-zinc-400 font-normal">—</span>,
            },
            { label: 'Joined', value: <span className="font-normal">{formatDate(learner.created_at)}</span> },
            {
              label: 'Last Active',
              value: learner.last_active_at
                ? <span className="font-normal">{formatDate(learner.last_active_at)}</span>
                : <span className="text-zinc-400 font-normal">—</span>,
            },
          ]} />
        </div>

        {/* Organisation */}
        <div className="bg-white border border-zinc-200 rounded-md px-5 py-4">
          <SectionHeader>Organisation</SectionHeader>
          <InfoGrid items={[
            {
              label: 'Department',
              value: learner.departmentName
                ? <span className="flex items-center gap-1.5 font-normal"><Building2 className="w-3.5 h-3.5 text-zinc-400" />{learner.departmentName}</span>
                : <span className="text-zinc-400 font-normal">Not assigned</span>,
            },
            {
              label: 'Team',
              value: learner.teamName
                ? <span className="flex items-center gap-1.5 font-normal"><Users className="w-3.5 h-3.5 text-zinc-400" />{learner.teamName}</span>
                : <span className="text-zinc-400 font-normal">Not assigned</span>,
            },
            ...(learner.notes ? [{
              label: 'Notes',
              value: <span className="text-zinc-700 font-normal flex items-start gap-1.5"><StickyNote className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />{learner.notes}</span>,
            }] : []),
          ]} />
        </div>
      </div>

      {/* Assessment Performance */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700">
            Assessment Performance
            {assessmentPerf.length > 0 && (
              <span className="text-zinc-400 font-normal ml-1">({assessmentPerf.length})</span>
            )}
          </p>
        </div>

        {assessmentPerf.length === 0 ? (
          <EmptySection
            icon={BarChart2}
            message="No assessment attempts yet"
            sub="Attempts will appear here once this learner takes an assigned assessment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Assessment</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Attempts</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Best Score</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Attempted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assessmentPerf.map(row => (
                  <tr key={row.content_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-zinc-900">{row.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{row.category}</td>
                    <td className="px-5 py-3 text-right text-zinc-700 font-medium">{row.attempts}</td>
                    <td className="px-5 py-3 text-right">
                      {row.best_score != null ? (
                        <span className={`font-medium ${row.best_score >= 60 ? 'text-green-700' : 'text-rose-600'}`}>
                          {row.best_score.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{formatDate(row.last_attempted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Performance */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700">
            Course Performance
            {coursePerf.length > 0 && (
              <span className="text-zinc-400 font-normal ml-1">({coursePerf.length})</span>
            )}
          </p>
        </div>

        {coursePerf.length === 0 ? (
          <EmptySection
            icon={BookOpen}
            message="No course activity yet"
            sub="Course progress will appear here once this learner starts an assigned course."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Course</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Progress</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Completed</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {coursePerf.map(row => (
                  <tr key={row.course_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="font-medium text-zinc-900">{row.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{formatCourseType(row.course_type)}</td>
                    <td className="px-5 py-3">
                      <ProgressBar pct={row.progress_pct} />
                    </td>
                    <td className="px-5 py-3">
                      <CourseStatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">
                      {formatDate(row.completed_at)}
                    </td>
                    <td className="px-5 py-3">
                      {row.certificate_number ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                          <Award className="w-3 h-3" />
                          {row.certificate_number}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Content */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
          <Hash className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700">
            Content Access
            <span className="text-zinc-400 font-normal ml-1">({content.length})</span>
          </p>
        </div>

        {content.length === 0 ? (
          <EmptySection
            icon={FileText}
            message="No content assigned yet."
            sub="Go to the catalog to assign content to this learner."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Via</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {content.map(c => (
                  <tr key={`${c.id}-${c.source}`} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {c.content_type === 'ASSESSMENT'
                          ? <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          : <BookOpen className="w-4 h-4 text-violet-500 shrink-0" />}
                        <span className="font-medium text-zinc-900">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {c.content_type === 'ASSESSMENT' ? 'Assessment' : 'Course'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {sourceLabel[c.source]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{formatDate(c.granted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deactivate confirm modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Deactivate learner?</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    <span className="font-medium">{learner.full_name}</span> will lose access to all assigned content. This can be reversed.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button onClick={() => setConfirmDeactivate(false)} className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleToggleStatus} disabled={saving} className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50">
                {saving ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
