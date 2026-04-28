'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronDown, ChevronRight, Loader2, X, AlertTriangle,
  CheckCircle2, Circle, CircleDot, Info, Award,
} from 'lucide-react'
import {
  fetchB2CUser,
  fetchUserCourseProgress,
  fetchUserAssessmentSubscriptions,
  fetchUserCourseSubscriptions,
  fetchPlanAssessments,
  fetchAssessmentAttempts,
  fetchFreeAccessAttempts,
  fetchPlanCoveredAssessmentIds,
  fetchB2CCertificate,
  fetchCourseModuleProgress,
  suspendUser,
  unsuspendUser,
  type B2CUser,
  type UserCourseProgress,
  type CourseModule,
  type DisplayStatus,
  type AssessmentSubscription,
  type CourseSubscription,
  type PlanAssessmentRow,
  type AttemptRow,
  type B2CCertificate,
} from '@/lib/supabase/b2c-users'
import { formatCourseType } from '@/lib/utils'

// ─── Bundle Courses — Hardcoded demo data ────────────────────────────────────

interface BundleTopicItem { id: string; title: string; completed: boolean }
interface BundleModuleItem { id: string; title: string; progressPct: number; status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'; topics: BundleTopicItem[] }
interface BundleCourseItem { id: string; title: string; progressPct: number; status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'; modules: BundleModuleItem[] }
interface BundleData { bundleId: string; bundleName: string; purchasedAt: string; courses: BundleCourseItem[] }

const BUNDLE_DATA: Record<string, BundleData[]> = {
  'Divya Patel': [{
    bundleId: 'excel-bundle-dp',
    bundleName: 'Excel Bundle',
    purchasedAt: '2026-01-15',
    courses: [
      {
        id: 'eb-c1', title: 'Excel Basics', progressPct: 100, status: 'COMPLETED',
        modules: [
          { id: 'm1', title: 'Introduction to Excel', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 't1', title: 'Navigating the Interface', completed: true },
            { id: 't2', title: 'Rows, Columns & Cells', completed: true },
            { id: 't3', title: 'Saving & Workbook Basics', completed: true },
          ]},
          { id: 'm2', title: 'Data Entry & Formatting', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 't4', title: 'Entering and Editing Data', completed: true },
            { id: 't5', title: 'Cell Formatting & Borders', completed: true },
            { id: 't6', title: 'Conditional Formatting', completed: true },
          ]},
          { id: 'm3', title: 'Basic Formulas', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 't7', title: 'SUM, AVERAGE, COUNT', completed: true },
            { id: 't8', title: 'IF Statements', completed: true },
            { id: 't9', title: 'Cell References', completed: true },
          ]},
        ],
      },
      {
        id: 'eb-c2', title: 'Excel Intermediate', progressPct: 65, status: 'IN_PROGRESS',
        modules: [
          { id: 'm4', title: 'Lookup Functions', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 't10', title: 'VLOOKUP Fundamentals', completed: true },
            { id: 't11', title: 'HLOOKUP & INDEX-MATCH', completed: true },
            { id: 't12', title: 'Nested Lookups', completed: true },
          ]},
          { id: 'm5', title: 'Data Analysis Tools', progressPct: 33, status: 'IN_PROGRESS', topics: [
            { id: 't13', title: 'Sorting & Filtering', completed: true },
            { id: 't14', title: 'Data Validation', completed: false },
            { id: 't15', title: 'Text Functions', completed: false },
          ]},
        ],
      },
      {
        id: 'eb-c3', title: 'Excel Advanced', progressPct: 0, status: 'NOT_STARTED',
        modules: [
          { id: 'm6', title: 'Power Pivot', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 't16', title: 'Data Modelling Concepts', completed: false },
            { id: 't17', title: 'Relationships & DAX Basics', completed: false },
          ]},
          { id: 'm7', title: 'VBA Introduction', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 't18', title: 'Macros & the VBA Editor', completed: false },
            { id: 't19', title: 'Writing Your First Script', completed: false },
          ]},
        ],
      },
      {
        id: 'eb-c4', title: 'VLOOKUP Mastery', progressPct: 0, status: 'NOT_STARTED',
        modules: [
          { id: 'm8', title: 'Core VLOOKUP Patterns', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 't20', title: 'Exact & Approximate Match', completed: false },
            { id: 't21', title: 'Multi-column Lookups', completed: false },
          ]},
          { id: 'm9', title: 'Advanced VLOOKUP Techniques', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 't22', title: 'Dynamic Range References', completed: false },
            { id: 't23', title: 'Error Handling with IFERROR', completed: false },
          ]},
        ],
      },
      {
        id: 'eb-c5', title: 'Pivot Tables', progressPct: 0, status: 'NOT_STARTED',
        modules: [
          { id: 'm10', title: 'Creating Pivot Tables', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 't24', title: 'Source Data & Layout', completed: false },
            { id: 't25', title: 'Rows, Columns & Values', completed: false },
          ]},
          { id: 'm11', title: 'Customising & Analysing', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 't26', title: 'Slicers & Timelines', completed: false },
            { id: 't27', title: 'Calculated Fields', completed: false },
          ]},
        ],
      },
    ],
  }],
  'Siddharth Bose': [{
    bundleId: 'excel-bundle-sb',
    bundleName: 'Excel Bundle',
    purchasedAt: '2025-11-20',
    courses: [
      {
        id: 'sb-c1', title: 'Excel Basics', progressPct: 100, status: 'COMPLETED',
        modules: [
          { id: 'sm1', title: 'Introduction to Excel', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 'st1', title: 'Navigating the Interface', completed: true },
            { id: 'st2', title: 'Rows, Columns & Cells', completed: true },
            { id: 'st3', title: 'Saving & Workbook Basics', completed: true },
          ]},
          { id: 'sm2', title: 'Data Entry & Formatting', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 'st4', title: 'Entering and Editing Data', completed: true },
            { id: 'st5', title: 'Cell Formatting & Borders', completed: true },
            { id: 'st6', title: 'Conditional Formatting', completed: true },
          ]},
          { id: 'sm3', title: 'Basic Formulas', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 'st7', title: 'SUM, AVERAGE, COUNT', completed: true },
            { id: 'st8', title: 'IF Statements', completed: true },
            { id: 'st9', title: 'Cell References', completed: true },
          ]},
        ],
      },
      {
        id: 'sb-c2', title: 'Excel Intermediate', progressPct: 100, status: 'COMPLETED',
        modules: [
          { id: 'sm4', title: 'Lookup Functions', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 'st10', title: 'VLOOKUP Fundamentals', completed: true },
            { id: 'st11', title: 'HLOOKUP & INDEX-MATCH', completed: true },
            { id: 'st12', title: 'Nested Lookups', completed: true },
          ]},
          { id: 'sm5', title: 'Data Analysis Tools', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 'st13', title: 'Sorting & Filtering', completed: true },
            { id: 'st14', title: 'Data Validation', completed: true },
            { id: 'st15', title: 'Text Functions', completed: true },
          ]},
        ],
      },
      {
        id: 'sb-c3', title: 'Excel Advanced', progressPct: 40, status: 'IN_PROGRESS',
        modules: [
          { id: 'sm6', title: 'Power Pivot', progressPct: 100, status: 'COMPLETED', topics: [
            { id: 'st16', title: 'Data Modelling Concepts', completed: true },
            { id: 'st17', title: 'Relationships & DAX Basics', completed: true },
          ]},
          { id: 'sm7', title: 'VBA Introduction', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 'st18', title: 'Macros & the VBA Editor', completed: false },
            { id: 'st19', title: 'Writing Your First Script', completed: false },
          ]},
        ],
      },
      {
        id: 'sb-c4', title: 'VLOOKUP Mastery', progressPct: 0, status: 'NOT_STARTED',
        modules: [
          { id: 'sm8', title: 'Core VLOOKUP Patterns', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 'st20', title: 'Exact & Approximate Match', completed: false },
            { id: 'st21', title: 'Multi-column Lookups', completed: false },
          ]},
          { id: 'sm9', title: 'Advanced VLOOKUP Techniques', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 'st22', title: 'Dynamic Range References', completed: false },
            { id: 'st23', title: 'Error Handling with IFERROR', completed: false },
          ]},
        ],
      },
      {
        id: 'sb-c5', title: 'Pivot Tables', progressPct: 0, status: 'NOT_STARTED',
        modules: [
          { id: 'sm10', title: 'Creating Pivot Tables', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 'st24', title: 'Source Data & Layout', completed: false },
            { id: 'st25', title: 'Rows, Columns & Values', completed: false },
          ]},
          { id: 'sm11', title: 'Customising & Analysing', progressPct: 0, status: 'NOT_STARTED', topics: [
            { id: 'st26', title: 'Slicers & Timelines', completed: false },
            { id: 'st27', title: 'Calculated Fields', completed: false },
          ]},
        ],
      },
    ],
  }],
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

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

function fmtPeriod(start: string | null, end: string | null) {
  if (!start || !end) return '—'
  const s = new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${s} – ${e}`
}

function fmtPrice(priceUsd: number | null, billingInterval: string) {
  if (priceUsd == null) return '—'
  return `$${priceUsd.toFixed(2)} / ${billingInterval === 'year' ? 'yr' : 'mo'}`
}

function fmtTime(seconds: number | null): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ─── Badge Components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DisplayStatus }) {
  const styles: Record<DisplayStatus, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    INACTIVE: 'bg-amber-50 text-amber-700',
    SUSPENDED: 'bg-rose-50 text-rose-700',
  }
  const labels: Record<DisplayStatus, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive', SUSPENDED: 'Suspended' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${styles[status]}`}>{labels[status]}</span>
}

function SubStatusBadge({
  status, cancelAtPeriodEnd, currentPeriodEnd,
}: { status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null }) {
  const styles: Record<string, string> = {
    active:     'bg-green-50 text-green-700',
    canceled:   'bg-zinc-100 text-zinc-500',
    past_due:   'bg-amber-50 text-amber-700',
    trialing:   'bg-blue-50 text-blue-700',
    incomplete: 'bg-zinc-100 text-zinc-500',
    unpaid:     'bg-rose-50 text-rose-700',
  }
  const labels: Record<string, string> = {
    active: 'Active', canceled: 'Cancelled', past_due: 'Past Due',
    trialing: 'Trial', incomplete: 'Incomplete', unpaid: 'Unpaid',
  }
  return (
    <div className="space-y-1">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${styles[status] ?? 'bg-zinc-100 text-zinc-500'}`}>
        {labels[status] ?? status}
      </span>
      {status === 'active' && cancelAtPeriodEnd && currentPeriodEnd && (
        <p className="text-xs text-amber-600 whitespace-nowrap">Cancels {fmt(currentPeriodEnd)}</p>
      )}
    </div>
  )
}

// ─── Suspend Modal ────────────────────────────────────────────────────────────

function SuspendModal({
  user, onClose, onConfirm,
}: { user: B2CUser; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try { await onConfirm(reason) } catch (e) {
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
              disabled={saving || !reason.trim()}
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

// ─── Unsuspend Modal ──────────────────────────────────────────────────────────

function UnsuspendModal({
  user, onClose, onConfirm,
}: { user: B2CUser; onClose: () => void; onConfirm: (reason: string | null) => Promise<void> }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try { await onConfirm(reason.trim() || null) } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove suspension.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Remove Suspension</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 border border-blue-100">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700">{user.displayName ?? user.email}</p>
                <p className="text-xs text-blue-600 mt-0.5">Suspension will be lifted immediately. The user will regain access to the platform.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Reason for lifting suspension <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Issue resolved, false positive…"
                rows={3}
                className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-700 resize-none"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Removing…' : 'Remove Suspension'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Attempt History Slide-over ───────────────────────────────────────────────

function AttemptHistorySlideOver({
  assessmentId,
  assessmentTitle,
  userId,
  onClose,
}: {
  assessmentId: string
  assessmentTitle: string
  userId: string
  onClose: () => void
}) {
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessmentAttempts(userId, assessmentId)
      .then(setAttempts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load attempts.'))
      .finally(() => setLoading(false))
  }, [userId, assessmentId])

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl flex flex-col border-l border-zinc-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Attempt History</h2>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{assessmentTitle}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 gap-2 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading attempts…
            </div>
          ) : error ? (
            <p className="px-6 py-6 text-sm text-rose-600">{error}</p>
          ) : attempts.length === 0 ? (
            <p className="px-6 py-6 text-sm text-zinc-400">No completed attempts found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-medium text-zinc-500 px-6 py-2.5">ATTEMPT</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">DATE</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">ACCURACY</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">SCORE</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-xs font-medium text-zinc-700">#{a.attemptNumber}</span>
                      {a.attemptNumber === 1 && (
                        <span className="ml-1.5 text-xs text-zinc-400">(free)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fmt(a.completedAt)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {a.accuracyPercent != null ? `${a.accuracyPercent.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {a.correctCount != null && a.totalQuestions != null
                        ? `${a.correctCount} / ${a.totalQuestions}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fmtTime(a.timeSpentSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
          <p className="text-xs text-zinc-400">Attempt #1 is always the free attempt. Attempts #2–6 are paid.</p>
        </div>
      </div>
    </>
  )
}

// ─── Assessment Grid (shared by plan rows and free access) ────────────────────

const NOT_STARTED_PAGE_SIZE = 20

function AssessmentGrid({
  attempted,
  notStarted,
  maxAttempts,
  isCancelled,
  onViewAttempts,
}: {
  attempted: PlanAssessmentRow[]
  notStarted: { assessmentId: string; title: string; category: string }[]
  maxAttempts: number | null
  isCancelled: boolean
  onViewAttempts: (assessmentId: string, title: string) => void
}) {
  const [notStartedOpen, setNotStartedOpen] = useState(false)
  const [notStartedPage, setNotStartedPage] = useState(1)

  const totalNSPages = Math.ceil(notStarted.length / NOT_STARTED_PAGE_SIZE)
  const paginatedNS = notStarted.slice(
    (notStartedPage - 1) * NOT_STARTED_PAGE_SIZE,
    notStartedPage * NOT_STARTED_PAGE_SIZE,
  )

  function fmtAttempts(used: number) {
    if (maxAttempts == null) return `${used} / —`
    return `${used} / ${maxAttempts}`
  }

  return (
    <div className="space-y-4 px-4 py-4 bg-zinc-50 border-t border-zinc-200">

      {/* Attempted sub-section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Attempted</span>
          <span className="text-xs font-medium bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-md">
            {attempted.length}
          </span>
        </div>

        {attempted.length === 0 ? (
          <p className="text-xs text-zinc-400 py-2">No assessments attempted under this plan yet.</p>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ASSESSMENT</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">CATEGORY</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ATTEMPTS</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">BEST ACCURACY</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">LAST ATTEMPTED</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {attempted.map((row) => (
                  <tr key={row.assessmentId} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 max-w-0">
                      <span className="block truncate" title={row.title}>{row.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 font-medium">
                      {fmtAttempts(row.attemptsUsed)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.bestAccuracy != null ? `${row.bestAccuracy.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fmt(row.lastAttempted)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewAttempts(row.assessmentId, row.title)}
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                      >
                        View Attempts
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Not Yet Started sub-section — always visible */}
      <div className="space-y-2">
        <button
          onClick={() => setNotStartedOpen((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide hover:text-zinc-600 transition-colors"
        >
          {notStartedOpen
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
          }
          Not Yet Started
          <span className="text-xs font-medium bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded-md">
            {notStarted.length}
          </span>
        </button>

        {notStartedOpen && (
          <>
            {notStarted.length === 0 ? (
              <p className="text-xs text-zinc-400 py-1">All assessments in this plan have been attempted.</p>
            ) : (
            <div className="space-y-2">
              {isCancelled && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Plan cancelled — these assessments are no longer accessible to this user.
                  </p>
                </div>
              )}
              <div className={`bg-white border border-zinc-200 rounded-md overflow-hidden ${isCancelled ? 'opacity-60' : ''}`}>
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ASSESSMENT</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">CATEGORY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedNS.map((row) => (
                      <tr key={row.assessmentId}>
                        <td className="px-4 py-2.5 text-zinc-600 text-xs max-w-0">
                          <span className="block truncate" title={row.title}>{row.title}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">
                            {row.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalNSPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100">
                    <p className="text-xs text-zinc-400">
                      {(notStartedPage - 1) * NOT_STARTED_PAGE_SIZE + 1}–{Math.min(notStartedPage * NOT_STARTED_PAGE_SIZE, notStarted.length)} of {notStarted.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNotStartedPage((p) => p - 1)}
                        disabled={notStartedPage === 1}
                        className="px-2.5 py-1 text-xs font-medium border border-zinc-200 rounded-md disabled:opacity-40 hover:bg-zinc-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-zinc-400">{notStartedPage} / {totalNSPages}</span>
                      <button
                        onClick={() => setNotStartedPage((p) => p + 1)}
                        disabled={notStartedPage === totalNSPages}
                        className="px-2.5 py-1 text-xs font-medium border border-zinc-200 rounded-md disabled:opacity-40 hover:bg-zinc-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Assessment Plan Row ──────────────────────────────────────────────────────

function AssessmentPlanRow({
  sub,
  userId,
  onViewAttempts,
}: {
  sub: AssessmentSubscription
  userId: string
  onViewAttempts: (assessmentId: string, title: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [planData, setPlanData] = useState<{
    attempted: PlanAssessmentRow[]
    notStarted: { assessmentId: string; title: string; category: string }[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function handleExpand() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (planData || !sub.planId) return
    setLoading(true)
    try {
      const data = await fetchPlanAssessments(sub.planId, userId)
      setPlanData(data)
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load plan assessments.')
    } finally {
      setLoading(false)
    }
  }

  const isCancelled = sub.status === 'canceled'

  return (
    <div className="border border-zinc-200 rounded-md overflow-hidden">
      {/* Row header */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        <span className="text-zinc-400 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0 grid grid-cols-5 gap-4 items-center">
          <div className="col-span-2 min-w-0">
            <span className="text-sm font-medium text-zinc-900 truncate block">{sub.productName}</span>
          </div>
          <span className="text-sm text-zinc-600">{fmtPrice(sub.priceUsd, sub.billingInterval)}</span>
          <span className="text-xs text-zinc-500">{fmtPeriod(sub.currentPeriodStart, sub.currentPeriodEnd)}</span>
          <div className="flex justify-end">
            <SubStatusBadge
              status={sub.status}
              cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
              currentPeriodEnd={sub.currentPeriodEnd}
            />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          {!sub.planId ? (
            <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-200">
              <p className="text-xs text-zinc-400">
                Plan data unavailable — this plan has been retired. Subscription billing history is preserved above.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 px-4 py-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading assessments…
            </div>
          ) : fetchError ? (
            <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-200">
              <p className="text-xs text-rose-600">{fetchError}</p>
            </div>
          ) : planData ? (
            <AssessmentGrid
              attempted={planData.attempted}
              notStarted={planData.notStarted}
              maxAttempts={sub.maxAttempts}
              isCancelled={isCancelled}
              onViewAttempts={onViewAttempts}
            />
          ) : null}
        </>
      )}
    </div>
  )
}

// ─── Module Breakdown ─────────────────────────────────────────────────────────

function ModuleBreakdown({ modules, loading }: { modules: CourseModule[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading modules…
      </div>
    )
  }
  if (modules.length === 0) {
    return <p className="py-4 text-xs text-zinc-400">No module breakdown available for this course.</p>
  }
  return (
    <div className="space-y-2 mt-3">
      {modules.map((mod) => (
        <div key={mod.id} className="bg-white border border-zinc-200 rounded-md overflow-hidden">
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
                  <div className="h-full rounded-full bg-blue-700" style={{ width: `${mod.progressPct}%` }} />
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

// ─── Course Plan Row ──────────────────────────────────────────────────────────

function CoursePlanRow({
  sub,
  courseProgress,
  userId,
}: {
  sub: CourseSubscription
  courseProgress: UserCourseProgress | undefined
  userId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [modules, setModules] = useState<CourseModule[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [cert, setCert] = useState<B2CCertificate | null | 'loading'>('loading')

  async function handleExpand() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (!sub.courseId) return

    // Lazy load both modules and cert in parallel
    const promises: Promise<void>[] = []

    if (modules.length === 0 && courseProgress) {
      setLoadingModules(true)
      promises.push(
        fetchCourseModuleProgress(sub.courseId, userId)
          .then(setModules)
          .finally(() => setLoadingModules(false))
      )
    }

    if (cert === 'loading') {
      promises.push(
        fetchB2CCertificate(userId, sub.courseId)
          .then(setCert)
      )
    }

    await Promise.all(promises)
  }

  const displayName = sub.status === 'canceled' ? 'Course Plan [Cancelled]' : sub.productName
  const isCompleted = courseProgress?.status === 'COMPLETED'

  return (
    <div className="border border-zinc-200 rounded-md overflow-hidden">
      {/* Row header */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        <span className="text-zinc-400 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0 grid grid-cols-5 gap-4 items-center">
          <div className="col-span-2 min-w-0">
            <span className={`text-sm font-medium truncate block ${sub.status === 'canceled' ? 'text-zinc-400' : 'text-zinc-900'}`}>
              {displayName}
            </span>
          </div>
          <span className="text-sm text-zinc-600">{fmtPrice(sub.priceUsd, sub.billingInterval)}</span>
          <span className="text-xs text-zinc-500">{fmtPeriod(sub.currentPeriodStart, sub.currentPeriodEnd)}</span>
          <div className="flex justify-end">
            <SubStatusBadge
              status={sub.status}
              cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
              currentPeriodEnd={sub.currentPeriodEnd}
            />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-200 space-y-4">
          {/* Subscription meta */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 rounded-md px-4 py-3">
              <p className="text-xs text-zinc-400 mb-1">Started</p>
              <p className="text-sm font-medium text-zinc-900">{fmt(sub.currentPeriodStart)}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-md px-4 py-3">
              <p className="text-xs text-zinc-400 mb-1">Next Renewal</p>
              <p className="text-sm font-medium text-zinc-900">
                {sub.status === 'active' && !sub.cancelAtPeriodEnd ? fmt(sub.currentPeriodEnd) : '—'}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-md px-4 py-3">
              <p className="text-xs text-zinc-400 mb-1">Certificate</p>
              {cert === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300 mt-1" />
              ) : cert ? (
                <div className="flex items-start gap-1.5">
                  <Award className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-green-700">{cert.certificateNumber}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Issued {fmt(cert.issuedAt)}</p>
                  </div>
                </div>
              ) : isCompleted ? (
                <p className="text-xs text-zinc-400">Completed — no certificate on record</p>
              ) : (
                <p className="text-xs text-zinc-400">Not yet issued</p>
              )}
            </div>
          </div>

          {/* Module breakdown */}
          {courseProgress ? (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Module Progress</p>
              <ModuleBreakdown modules={modules} loading={loadingModules} />
            </div>
          ) : (
            <p className="text-xs text-zinc-400">No course progress recorded yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Free Access Activity ─────────────────────────────────────────────────────

function FreeAccessActivity({
  userId,
  assessmentSubIds,
  onViewAttempts,
}: {
  userId: string
  assessmentSubIds: string[]  // plan_ids from user's assessment subscriptions
  onViewAttempts: (assessmentId: string, title: string) => void
}) {
  const [rows, setRows] = useState<PlanAssessmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const coveredIds = await fetchPlanCoveredAssessmentIds(assessmentSubIds)
        const freeRows = await fetchFreeAccessAttempts(userId, coveredIds)
        setRows(freeRows)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, assessmentSubIds.join(',')])

  if (loading) return null  // Render nothing while loading — section appears after
  if (rows.length === 0) return null  // No free access attempts — section hidden

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Free Access Activity</h3>
        <p className="text-xs text-zinc-400 mt-1">
          One free attempt is available on every assessment. Attempts shown here are not covered by any active plan.
        </p>
      </div>
      <div className="border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm bg-white">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ASSESSMENT</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">CATEGORY</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ATTEMPTS</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">BEST ACCURACY</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">LAST ATTEMPTED</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.assessmentId} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900 max-w-0">
                  <span className="block truncate" title={row.title}>{row.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                    {row.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-medium text-zinc-600">
                  {row.attemptsUsed} / 1
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {row.bestAccuracy != null ? `${row.bestAccuracy.toFixed(1)}%` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{fmt(row.lastAttempted)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewAttempts(row.assessmentId, row.title)}
                    className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                  >
                    View Attempts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Bundle Course Components ─────────────────────────────────────────────────

function BundleModuleBreakdown({ modules }: { modules: BundleModuleItem[] }) {
  return (
    <div className="space-y-2 mt-3">
      {modules.map((mod) => (
        <div key={mod.id} className="bg-white border border-zinc-200 rounded-md overflow-hidden">
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
                  <div className="h-full rounded-full bg-blue-700" style={{ width: `${mod.progressPct}%` }} />
                </div>
                <span className="text-xs text-zinc-500">{mod.progressPct}%</span>
              </div>
              {mod.status === 'COMPLETED'
                ? <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">Done</span>
                : mod.status === 'IN_PROGRESS'
                ? <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">In Progress</span>
                : <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">Not Started</span>
              }
            </div>
          </div>
          {mod.topics.length > 0 && (
            <ul className="divide-y divide-zinc-50">
              {mod.topics.map((topic) => (
                <li key={topic.id} className="flex items-center gap-2.5 px-4 py-2">
                  {topic.completed
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  }
                  <span className={`text-xs ${topic.completed ? 'text-zinc-700' : 'text-zinc-400'}`}>{topic.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function BundleCourseRow({ course }: { course: BundleCourseItem }) {
  const [expanded, setExpanded] = useState(false)

  const completedModules = course.modules.filter((m) => m.status === 'COMPLETED').length

  return (
    <div className="border border-zinc-200 rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        <span className="text-zinc-400 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-900 min-w-0 truncate">{course.title}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-20 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
              <div className="h-full rounded-full bg-blue-700" style={{ width: `${course.progressPct}%` }} />
            </div>
            <span className="text-xs text-zinc-500 w-8">{course.progressPct}%</span>
          </div>
          <span className="text-xs text-zinc-400 shrink-0">{completedModules}/{course.modules.length} modules</span>
        </div>
        <div className="shrink-0">
          {course.status === 'COMPLETED'
            ? <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">Completed</span>
            : course.status === 'IN_PROGRESS'
            ? <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">In Progress</span>
            : <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">Not Started</span>
          }
        </div>
      </button>
      {expanded && (
        <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-200">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Module Progress</p>
          <BundleModuleBreakdown modules={course.modules} />
        </div>
      )}
    </div>
  )
}

function BundleRow({ bundle }: { bundle: BundleData }) {
  const [expanded, setExpanded] = useState(false)
  const completedCourses = bundle.courses.filter((c) => c.status === 'COMPLETED').length

  return (
    <div className="border border-zinc-200 rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        <span className="text-zinc-400 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0 grid grid-cols-3 gap-4 items-center">
          <div className="min-w-0">
            <span className="text-sm font-medium text-zinc-900 truncate block">{bundle.bundleName}</span>
          </div>
          <span className="text-xs text-zinc-500">
            {completedCourses}/{bundle.courses.length} courses completed
          </span>
          <span className="text-xs text-zinc-400">
            Purchased {fmt(bundle.purchasedAt)}
          </span>
        </div>
        <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md shrink-0">
          Active
        </span>
      </button>
      {expanded && (
        <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-200 space-y-2">
          {bundle.courses.map((course) => (
            <BundleCourseRow key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function B2CUserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [user, setUser] = useState<B2CUser | null>(null)
  const [courseProgress, setCourseProgress] = useState<UserCourseProgress[]>([])
  const [assessmentSubs, setAssessmentSubs] = useState<AssessmentSubscription[]>([])
  const [courseSubs, setCourseSubs] = useState<CourseSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Attempt history slide-over state — single instance at page level
  const [slideOver, setSlideOver] = useState<{ assessmentId: string; title: string } | null>(null)

  async function loadUser() {
    try {
      const [u, cp, aSubs, cSubs] = await Promise.all([
        fetchB2CUser(id),
        fetchUserCourseProgress(id),
        fetchUserAssessmentSubscriptions(id),
        fetchUserCourseSubscriptions(id),
      ])
      setUser(u)
      setCourseProgress(cp)
      setAssessmentSubs(aSubs)
      setCourseSubs(cSubs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUser() }, [id])

  async function handleSuspend(reason: string) {
    await suspendUser(id, reason)
    setShowSuspendModal(false)
    await loadUser()
  }

  async function handleUnsuspend(reason: string | null) {
    await unsuspendUser(id, reason)
    setShowUnsuspendModal(false)
    await loadUser()
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
    return <div className="p-6 text-sm text-zinc-500">User not found.</div>
  }

  const isSuspended = user.displayStatus === 'SUSPENDED'

  // Collect plan IDs for free access computation
  const assessmentPlanIds = assessmentSubs
    .map((s) => s.planId)
    .filter((id): id is string => id !== null)

  // Build course progress lookup by courseId
  const courseProgressMap = new Map(courseProgress.map((p) => [p.courseId, p]))

  return (
    <div className="p-6 space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        B2C Users
      </button>

      {/* Profile header */}
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
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
              {isSuspended && (user.suspensionReason || user.suspendedAt || user.suspendedByName) && (
                <div className="mt-2 space-y-0.5">
                  {user.suspensionReason && (
                    <p className="text-xs text-rose-700">
                      <span className="font-medium">Reason:</span> {user.suspensionReason}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500">
                    {user.suspendedAt && (
                      <span>Suspended on {new Date(user.suspendedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                    {user.suspendedAt && user.suspendedByName && <span> · </span>}
                    {user.suspendedByName && <span>by {user.suspendedByName}</span>}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${TIER_BADGE[user.subscriptionTier] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier}
                </span>
                <StatusBadge status={user.displayStatus} />
              </div>
            </div>
          </div>

          {/* Action button */}
          {isSuspended ? (
            <button
              onClick={() => setShowUnsuspendModal(true)}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors shrink-0"
            >
              Remove Suspension
            </button>
          ) : (
            <button
              onClick={() => setShowSuspendModal(true)}
              className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors shrink-0"
            >
              Suspend User
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      {/* Identity card */}
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Identity</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Full Name</p>
            <p className="text-sm font-medium text-zinc-900">{user.displayName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Email</p>
            <p className="text-sm font-medium text-zinc-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Joined</p>
            <p className="text-sm font-medium text-zinc-900">{fmt(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Last Active</p>
            <p className="text-sm font-medium text-zinc-900">{fmt(user.lastActiveDate)}</p>
          </div>
        </div>
      </div>

      {/* Subscriptions & Activity — unified section */}
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Subscriptions & Activity</h2>
          <span className="text-xs text-zinc-400">Managed via Stripe</span>
        </div>

        {/* Stripe callout */}
        <div className="flex gap-2.5 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            In production, subscription data is written via Stripe webhook events
            (customer.subscription.created / updated / deleted). Expand any row to view assessments and attempt history. Demo data is seeded.
          </p>
        </div>

        {/* Assessment Plans */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Assessment Plans</h3>
          {assessmentSubs.length === 0 ? (
            <div className="border border-zinc-100 rounded-md px-4 py-6 text-center">
              <p className="text-sm text-zinc-400">No assessment plan subscriptions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assessmentSubs.map((sub) => (
                <AssessmentPlanRow
                  key={sub.id}
                  sub={sub}
                  userId={id}
                  onViewAttempts={(assessmentId, title) => setSlideOver({ assessmentId, title })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Course Plans */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Course Plans</h3>
            {courseSubs.length > 0 && (
              <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                {courseSubs.length}
              </span>
            )}
          </div>
          {courseSubs.length === 0 ? (
            <div className="border border-zinc-100 rounded-md px-4 py-6 text-center">
              <p className="text-sm text-zinc-400">No course plan subscriptions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {courseSubs.map((sub) => (
                <CoursePlanRow
                  key={sub.id}
                  sub={sub}
                  courseProgress={sub.courseId ? courseProgressMap.get(sub.courseId) : undefined}
                  userId={id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bundle Courses — hardcoded demo for seeded Premium users */}
        {user.displayName && BUNDLE_DATA[user.displayName] && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Bundle Courses</h3>
              <span className="text-xs font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md">
                {BUNDLE_DATA[user.displayName].length} bundle{BUNDLE_DATA[user.displayName].length !== 1 ? 's' : ''}
              </span>
            </div>
            {BUNDLE_DATA[user.displayName].map((bundle) => (
              <BundleRow key={bundle.bundleId} bundle={bundle} />
            ))}
          </div>
        )}

        {/* Free Access Activity — lazy, only shown if orphaned attempts exist */}
        <FreeAccessActivity
          userId={id}
          assessmentSubIds={assessmentPlanIds}
          onViewAttempts={(assessmentId, title) => setSlideOver({ assessmentId, title })}
        />
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <SuspendModal
          user={user}
          onClose={() => setShowSuspendModal(false)}
          onConfirm={handleSuspend}
        />
      )}

      {/* Unsuspend Modal */}
      {showUnsuspendModal && (
        <UnsuspendModal
          user={user}
          onClose={() => setShowUnsuspendModal(false)}
          onConfirm={handleUnsuspend}
        />
      )}

      {/* Attempt History Slide-over */}
      {slideOver && (
        <AttemptHistorySlideOver
          assessmentId={slideOver.assessmentId}
          assessmentTitle={slideOver.title}
          userId={id}
          onClose={() => setSlideOver(null)}
        />
      )}
    </div>
  )
}
