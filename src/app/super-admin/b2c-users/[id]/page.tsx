'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronRight, Loader2, X, AlertTriangle, CheckCircle2, Circle, CircleDot } from 'lucide-react'
import {
  fetchB2CUser,
  fetchUserAttempts,
  fetchUserCourseProgress,
  fetchCourseModuleProgress,
  suspendUser,
  unsuspendUser,
  type B2CUser,
  type UserAttempt,
  type UserCourseProgress,
  type CourseModule,
  type DisplayStatus,
} from '@/lib/supabase/b2c-users'
import { formatCourseType } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  free:         'bg-zinc-100 text-zinc-600',
  basic:        'bg-blue-50 text-blue-700',
  professional: 'bg-violet-50 text-violet-700',
  premium:      'bg-amber-50 text-amber-700',
}
const TIER_LABELS: Record<string, string> = {
  free: 'Free', basic: 'Basic', professional: 'Professional', premium: 'Premium',
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const styles: Record<DisplayStatus, string> = {
    ACTIVE: 'bg-green-50 text-green-700', INACTIVE: 'bg-amber-50 text-amber-700', SUSPENDED: 'bg-rose-50 text-rose-700',
  }
  const labels: Record<DisplayStatus, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive', SUSPENDED: 'Suspended' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${styles[status]}`}>{labels[status]}</span>
}

function isFullTest(assessmentType: string) {
  return assessmentType === 'full-test'
}

// ─── Suspend Modal ───────────────────────────────────────────────────────────

function SuspendModal({
  user,
  onClose,
  onConfirm,
}: {
  user: B2CUser
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try {
      await onConfirm(reason)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to suspend user.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Suspend User</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-rose-50 border border-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-rose-700">{user.displayName ?? user.email}</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  This user will be marked as suspended. They will not be able to access the platform.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Internal reason <span className="text-zinc-400 font-normal">(not sent to user)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Suspicious activity, policy violation…"
                rows={3}
                className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>
            <p className="text-xs text-zinc-400">
              Email notification to user is planned for V2. No email will be sent at this time.
            </p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Suspending…' : 'Suspend User'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Assessment Performance Section ─────────────────────────────────────────

function AssessmentPerformanceSection({ attempts }: { attempts: UserAttempt[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">Assessment Performance</h2>

      {attempts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-md px-4 py-10 text-center">
          <p className="text-sm text-zinc-400">No assessment attempts yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">ASSESSMENT</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">EXAM</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">ATTEMPT</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">ACCURACY</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">RESULT</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {attempts.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 max-w-0">
                    <span className="block truncate" title={a.assessmentTitle}>{a.assessmentTitle}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">{a.examType}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">#{a.attemptNumber || 1}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {a.accuracyPercent != null ? `${a.accuracyPercent.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {/* Full tests and CLAT: show score value, no pass/fail badge */}
                    {isFullTest(a.assessmentType) || a.passed === null ? (
                      <span className="text-xs text-zinc-500">
                        {a.correctCount != null && a.totalQuestions != null
                          ? `${a.correctCount}/${a.totalQuestions}`
                          : '—'}
                      </span>
                    ) : a.passed ? (
                      <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">Pass</span>
                    ) : (
                      <span className="text-xs font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md">Fail</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{fmt(a.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Course Performance Section ──────────────────────────────────────────────

function computeCourseProgress(modules: CourseModule[]): { pct: number; status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' } {
  if (modules.length === 0) return { pct: 0, status: 'NOT_STARTED' }
  const pct = Math.round(modules.reduce((s, m) => s + m.progressPct, 0) / modules.length)
  const allDone = modules.every((m) => m.status === 'COMPLETED')
  const anyProgress = modules.some((m) => m.status === 'IN_PROGRESS' || m.progressPct > 0)
  const status = allDone ? 'COMPLETED' : anyProgress ? 'IN_PROGRESS' : 'NOT_STARTED'
  return { pct, status }
}

function ModuleBreakdown({
  modules,
  loading,
}: {
  modules: CourseModule[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-4 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading modules…
      </div>
    )
  }
  if (modules.length === 0) {
    return (
      <p className="px-6 py-4 text-xs text-zinc-400">No module breakdown available for this course.</p>
    )
  }
  return (
    <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 space-y-3">
      {modules.map((mod) => (
        <div key={mod.id} className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          {/* Module header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              {mod.status === 'COMPLETED'
                ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                : mod.status === 'IN_PROGRESS'
                ? <CircleDot className="w-4 h-4 text-blue-700 shrink-0" />
                : <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
              }
              <span className="text-xs font-medium text-zinc-800">{mod.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-700"
                    style={{ width: `${mod.progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">{mod.progressPct}%</span>
              </div>
              {mod.status === 'COMPLETED' ? (
                <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">Done</span>
              ) : mod.status === 'IN_PROGRESS' ? (
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">In Progress</span>
              ) : (
                <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">Not Started</span>
              )}
            </div>
          </div>
          {/* Topics */}
          {mod.topics.length > 0 && (
            <ul className="divide-y divide-zinc-50">
              {mod.topics.map((topic) => (
                <li key={topic.id} className="flex items-center gap-2.5 px-4 py-2">
                  {topic.completed
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  }
                  <span className={`text-xs ${topic.completed ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {topic.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function CoursePerformanceSection({
  progress,
  userId,
}: {
  progress: UserCourseProgress[]
  userId: string
}) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [moduleData, setModuleData] = useState<Record<string, CourseModule[]>>({})
  const [loadingCourse, setLoadingCourse] = useState<string | null>(null)

  async function toggleCourse(courseId: string) {
    if (expandedCourse === courseId) {
      setExpandedCourse(null)
      return
    }
    setExpandedCourse(courseId)
    if (!moduleData[courseId]) {
      setLoadingCourse(courseId)
      try {
        const modules = await fetchCourseModuleProgress(courseId, userId)
        setModuleData((prev) => ({ ...prev, [courseId]: modules }))
      } finally {
        setLoadingCourse(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">Course Performance</h2>

      {progress.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-md px-4 py-10 text-center">
          <p className="text-sm text-zinc-400">Course completions will appear here once the learner completes a course.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="w-6 px-4 py-2.5" />
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">COURSE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TYPE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">PROGRESS</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STARTED</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">COMPLETED</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p) => {
                const isExpanded = expandedCourse === p.courseId
                const loadedModules = moduleData[p.courseId]
                const computed = loadedModules && loadedModules.length > 0
                  ? computeCourseProgress(loadedModules)
                  : null
                const displayPct = computed ? computed.pct : p.progressPct
                const displayStatus = computed ? computed.status : p.status
                return (
                  <Fragment key={p.id}>
                    <tr
                      onClick={() => toggleCourse(p.courseId)}
                      className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer${isExpanded ? ' bg-zinc-50' : ''}`}
                    >
                      <td className="px-4 py-3 w-6">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                        }
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 max-w-0">
                        <span className="block truncate" title={p.courseTitle}>{p.courseTitle}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                          {formatCourseType(p.courseType) ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-700"
                              style={{ width: `${displayPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-600">{displayPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {displayStatus === 'COMPLETED' ? (
                          <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">Completed</span>
                        ) : displayStatus === 'IN_PROGRESS' ? (
                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">In Progress</span>
                        ) : (
                          <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">Not Started</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{fmt(p.startedAt)}</td>
                      <td className="px-4 py-3 text-zinc-500">{fmt(p.completedAt)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-zinc-100">
                        <td colSpan={7} className="p-0">
                          <ModuleBreakdown
                            modules={moduleData[p.courseId] ?? []}
                            loading={loadingCourse === p.courseId}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Profile Page ───────────────────────────────────────────────────────

export default function B2CUserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [user, setUser] = useState<B2CUser | null>(null)
  const [attempts, setAttempts] = useState<UserAttempt[]>([])
  const [courseProgress, setCourseProgress] = useState<UserCourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadUser() {
    try {
      const [u, att, cp] = await Promise.all([
        fetchB2CUser(id),
        fetchUserAttempts(id),
        fetchUserCourseProgress(id),
      ])
      setUser(u)
      setAttempts(att)
      setCourseProgress(cp)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUser() }, [id])

  async function handleSuspend(reason: string) {
    await suspendUser(id)
    setShowSuspendModal(false)
    await loadUser()
  }

  async function handleUnsuspend() {
    setActionLoading(true)
    setError(null)
    try {
      await unsuspendUser(id)
      await loadUser()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove suspension.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading profile…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 text-sm text-zinc-500">User not found.</div>
    )
  }

  const isSuspended = user.displayStatus === 'SUSPENDED'

  return (
    <div className="p-6 space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.push('/super-admin/b2c-users')}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        B2C Users
      </button>

      {/* Profile header */}
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white text-base font-semibold shrink-0">
              {(user.displayName ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold text-zinc-900">{user.displayName ?? '—'}</h1>
                {isSuspended && (
                  <span className="text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
                    Account Suspended
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${TIER_BADGE[user.subscriptionTier] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier}
                </span>
                <StatusBadge status={user.displayStatus} />
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {isSuspended ? (
              <button
                onClick={handleUnsuspend}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium border border-zinc-200 text-zinc-600 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Remove Suspension
              </button>
            ) : (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors whitespace-nowrap"
              >
                Suspend User
              </button>
            )}
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
        </div>
      </div>

      {/* Section 1: Identity */}
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Identity</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'Full Name',    value: user.displayName ?? '—' },
            { label: 'Email',        value: user.email },
            { label: 'Joined',       value: fmt(user.createdAt) },
            { label: 'Last Active',  value: fmt(user.lastActiveDate) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-zinc-400">{label}</p>
              <p className="text-sm font-medium text-zinc-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Subscription */}
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">Subscription</h2>
          <span className="text-xs text-zinc-400">Managed via Stripe</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'Plan',                   value: TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier },
            { label: 'Subscription Status',    value: user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1) },
            { label: 'Stripe Subscription ID', value: user.stripeSubscriptionId ?? '—' },
            { label: 'Start Date',             value: fmt(user.subscriptionStartDate) },
            { label: 'End Date',               value: fmt(user.subscriptionEndDate) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-zinc-400">{label}</p>
              <p className={`text-sm font-medium mt-0.5 ${label === 'Stripe Subscription ID' ? 'text-zinc-500 font-mono text-xs' : 'text-zinc-900'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Assessment Performance */}
      <AssessmentPerformanceSection attempts={attempts} />

      {/* Section 4: Course Performance */}
      <CoursePerformanceSection progress={courseProgress} userId={user.id} />

      {/* Suspend modal */}
      {showSuspendModal && (
        <SuspendModal
          user={user}
          onClose={() => setShowSuspendModal(false)}
          onConfirm={handleSuspend}
        />
      )}
    </div>
  )
}
