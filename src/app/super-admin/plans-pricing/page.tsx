'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, LayoutGrid, Users, BookOpen, MoreVertical, Eye, Pencil, Archive, AlertTriangle, X, Loader2, FileText } from 'lucide-react'
import {
  fetchPlans,
  fetchAssessmentCountsByPlan,
  fetchAssessmentsInPlan,
  fetchB2BPlansForGrid,
  fetchCourseBundlePlans,
  fetchSingleCoursePlans,
  updatePlan,
  type PlanRow,
  type B2BPlanCard,
  type CourseBundlePlanRow,
  type SingleCoursePlanRow,
  type AssessmentInPlan,
} from '@/lib/supabase/plans'
import { PlanStatusBadge } from '@/components/plans/PlanStatusBadge'
import { EditPlanSlideOver, SingleCoursePlanEditSlideOver } from '@/components/plans/EditPlanSlideOver'

type Tab = 'assessment-plans' | 'single-course-plan' | 'course-bundle-plans' | 'b2b-plans'

function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

// ─── Archive Warning Modal ────────────────────────────────────────────────────
function ArchivePlanModal({
  plan,
  onClose,
  onConfirm,
}: {
  plan: PlanRow
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const subscriberCount = plan.plan_subscribers?.subscriber_count ?? 0

  async function handleConfirm() {
    setSaving(true)
    try { await onConfirm() } finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Archive Plan</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-rose-50 border border-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-rose-700">{plan.name}</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  {subscriberCount > 0
                    ? `${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''} on this plan.`
                    : 'No active subscribers on this plan.'}
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-700">
              This action is destructive. Make sure you inform the users via Salesforce about this action.
            </p>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Archiving…' : 'Archive Plan'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Plan Actions 3-dot menu ──────────────────────────────────────────────────
function PlanActionsMenu({
  plan,
  onView,
  onEdit,
  onArchive,
}: {
  plan: PlanRow
  onView: () => void
  onEdit: () => void
  onArchive: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const isArchived = plan.status === 'ARCHIVED'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 w-36 bg-white border border-zinc-200 rounded-md shadow-md py-1">
          <button
            onClick={() => { setOpen(false); onView() }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" /> View
          </button>
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-400" /> Edit
          </button>
          {!isArchived && (
            <button
              onClick={() => { setOpen(false); onArchive() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Plan Assessments Slide-Over ─────────────────────────────────────────────
function PlanAssessmentsSlideOver({
  planId,
  planName,
  onClose,
}: {
  planId: string
  planName: string
  onClose: () => void
}) {
  const [items, setItems] = useState<AssessmentInPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssessmentsInPlan(planId)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [planId])

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Assessments in Plan</p>
            <p className="text-xs text-zinc-500 mt-0.5">{planName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <FileText className="w-6 h-6 text-zinc-300" />
              <p className="text-sm text-zinc-500">No assessments in this plan.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {items.map((item) => (
                <div key={item.id} className="px-6 py-3">
                  <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.category_name && (
                      <span className="text-xs text-zinc-500">{item.category_name}</span>
                    )}
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500">{item.test_type}</span>
                    {item.audience_type && (
                      <span className="text-xs font-medium bg-green-50 text-green-700 rounded px-1.5 py-0.5">
                        {item.audience_type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Assessment Plan Card ─────────────────────────────────────────────────────
const TIER_BADGE: Record<string, string> = {
  BASIC:      'bg-zinc-100 text-zinc-600',
  PRO:        'bg-blue-50 text-blue-700',
  PREMIUM:    'bg-amber-50 text-amber-700',
  ENTERPRISE: 'bg-violet-50 text-violet-700',
}

function AssessmentPlanCard({
  plan,
  assessmentCount,
  onView,
  onEdit,
  onArchive,
  onCountClick,
}: {
  plan: PlanRow
  assessmentCount: number
  onView: () => void
  onEdit: () => void
  onArchive: () => void
  onCountClick: () => void
}) {
  const subscribers = plan.plan_subscribers?.subscriber_count ?? 0

  return (
    <div className="bg-white border border-zinc-200 rounded-md p-5 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-semibold text-zinc-900 leading-snug pr-2">
          {plan.display_name ?? plan.name}
        </p>
        <PlanStatusBadge status={plan.status} />
      </div>
      {plan.tier && (
        <span className={`text-xs font-medium rounded px-1.5 py-0.5 w-fit mb-3 ${TIER_BADGE[plan.tier] ?? 'bg-zinc-100 text-zinc-600'}`}>
          {plan.tier}
        </span>
      )}
      <div className="flex items-center gap-4 text-xs text-zinc-500 mt-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onCountClick() }}
          className="flex items-center gap-1 hover:text-blue-700 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          {assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}
        </button>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {subscribers} subscriber{subscribers !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
        <button
          onClick={onView}
          className="text-xs text-blue-700 hover:text-blue-800 font-medium"
        >
          View
        </button>
        <PlanActionsMenu
          plan={plan}
          onView={onView}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      </div>
    </div>
  )
}

// ─── Assessment Plan Card Grid ────────────────────────────────────────────────
function AssessmentPlanCardGrid({
  plans,
  counts,
  onView,
  onEdit,
  onArchive,
}: {
  plans: PlanRow[]
  counts: Record<string, number>
  onView: (plan: PlanRow) => void
  onEdit: (plan: PlanRow) => void
  onArchive: (plan: PlanRow) => void
}) {
  const [viewingPlan, setViewingPlan] = useState<PlanRow | null>(null)

  if (plans.length === 0) return (
    <p className="text-sm text-zinc-400 py-6 text-center">No plans found.</p>
  )

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => (
          <AssessmentPlanCard
            key={plan.id}
            plan={plan}
            assessmentCount={counts[plan.id] ?? 0}
            onView={() => onView(plan)}
            onEdit={() => onEdit(plan)}
            onArchive={() => onArchive(plan)}
            onCountClick={() => setViewingPlan(plan)}
          />
        ))}
      </div>
      {viewingPlan && (
        <PlanAssessmentsSlideOver
          planId={viewingPlan.id}
          planName={viewingPlan.display_name ?? viewingPlan.name}
          onClose={() => setViewingPlan(null)}
        />
      )}
    </>
  )
}

// ─── Tab 1: Assessment Plans ──────────────────────────────────────────────────
function AssessmentPlansTab({
  plans,
  onEdit,
  onCreateB2C,
  onPlanArchived,
}: {
  plans: PlanRow[]
  onEdit: (plan: PlanRow) => void
  onCreateB2C: () => void
  onPlanArchived: () => void
}) {
  const router = useRouter()
  const [archivingPlan, setArchivingPlan] = useState<PlanRow | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchAssessmentCountsByPlan().then(setCounts)
  }, [])

  const b2cPlans = plans.filter((p) => p.plan_audience === 'B2C' && p.plan_category === 'ASSESSMENT')
  const platformPlans = b2cPlans.filter((p) => p.scope === 'PLATFORM_WIDE')
  const categoryPlans = b2cPlans.filter((p) => p.scope === 'CATEGORY_BUNDLE')

  const b2cMRR = b2cPlans.reduce(
    (sum, p) => sum + (p.price ?? 0) * (p.plan_subscribers?.subscriber_count ?? 0),
    0
  )

  async function handleArchive(plan: PlanRow) {
    await updatePlan(plan.id, { status: 'ARCHIVED' })
    setArchivingPlan(null)
    onPlanArchived()
  }

  return (
    <div>
      {/* MRR strip — inside Tab 1 only */}
      <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700">B2C Platform MRR</span>
          <span className="text-sm font-semibold text-zinc-900">{formatINR(b2cMRR)}</span>
        </div>
        <span className="text-xs text-zinc-400">Demo data — live figures in production</span>
      </div>

      {/* Platform Plans */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-700">Platform Plans</h2>
        <button
          onClick={onCreateB2C}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assessment Plan
        </button>
      </div>
      <div className="mb-10">
        <AssessmentPlanCardGrid
          plans={platformPlans}
          counts={counts}
          onView={(p) => router.push(`/super-admin/plans-pricing/${p.id}`)}
          onEdit={onEdit}
          onArchive={setArchivingPlan}
        />
      </div>

      {/* Category Plans */}
      <h2 className="text-sm font-semibold text-zinc-700 mb-4">Category Plans</h2>
      <AssessmentPlanCardGrid
        plans={categoryPlans}
        counts={counts}
        onView={(p) => router.push(`/super-admin/plans-pricing/${p.id}`)}
        onEdit={onEdit}
        onArchive={setArchivingPlan}
      />

      {/* Archive modal */}
      {archivingPlan && (
        <ArchivePlanModal
          plan={archivingPlan}
          onClose={() => setArchivingPlan(null)}
          onConfirm={() => handleArchive(archivingPlan)}
        />
      )}
    </div>
  )
}

// ─── Tab 2: Course Plans ──────────────────────────────────────────────────────


function CourseBundlePlansSection() {
  const router = useRouter()
  const [bundles, setBundles] = useState<CourseBundlePlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourseBundlePlans()
      .then(setBundles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-20 flex items-center justify-center"><p className="text-sm text-zinc-400">Loading...</p></div>
  if (error) return <div className="h-20 flex items-center justify-center"><p className="text-sm text-rose-600">{error}</p></div>
  if (bundles.length === 0) return (
    <div className="flex flex-col items-center justify-center h-28 gap-1">
      <LayoutGrid className="w-6 h-6 text-zinc-300" />
      <p className="text-sm text-zinc-500">No bundle plans yet.</p>
      <p className="text-xs text-zinc-400">Use the &quot;Create Bundle Plan&quot; button above to add one.</p>
    </div>
  )

  return (
    <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Display Name</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Price (₹/year)</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Courses</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {bundles.map((bundle) => (
            <tr key={bundle.id} className="hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3 font-medium text-zinc-900">{bundle.name}</td>
              <td className="px-4 py-3 text-zinc-600">{bundle.display_name ?? <span className="text-zinc-400">—</span>}</td>
              <td className="px-4 py-3 text-right text-zinc-700 font-medium">{formatINR(bundle.price)}</td>
              <td className="px-4 py-3 text-center text-zinc-600">{bundle.course_count}</td>
              <td className="px-4 py-3 text-center">
                <PlanStatusBadge status={bundle.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => router.push(`/super-admin/plans-pricing/${bundle.id}`)}
                  className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab 2: Single Course Plan ────────────────────────────────────────────────

function SingleCoursePlansSection({ onCreateSingleCoursePlan }: { onCreateSingleCoursePlan: () => void }) {
  const router = useRouter()
  const [plans, setPlans] = useState<SingleCoursePlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<SingleCoursePlanRow | null>(null)

  function loadPlans() {
    setLoading(true)
    fetchSingleCoursePlans()
      .then(setPlans)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlans() }, [])

  if (loading) return <div className="h-16 flex items-center justify-center"><p className="text-sm text-zinc-400">Loading...</p></div>
  if (error) return <div className="h-16 flex items-center justify-center"><p className="text-sm text-rose-600">{error}</p></div>
  if (plans.length === 0) return (
    <div className="flex flex-col items-center justify-center h-24 gap-1">
      <BookOpen className="w-5 h-5 text-zinc-300" />
      <p className="text-sm text-zinc-500">No single course plans yet.</p>
      <p className="text-xs text-zinc-400">Use the &quot;Create Single Course Plan&quot; button above to add one.</p>
    </div>
  )

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Course Name</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Price (USD)</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{plan.name}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {plan.course_name ?? <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-zinc-700 font-medium">
                  {plan.price_usd != null ? `$${Number(plan.price_usd).toFixed(2)}` : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <PlanStatusBadge status={plan.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => router.push(`/super-admin/plans-pricing/${plan.id}`)}
                      className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="text-xs text-zinc-500 hover:text-zinc-800 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPlan && (
        <SingleCoursePlanEditSlideOver
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={() => { setEditingPlan(null); loadPlans() }}
        />
      )}
    </>
  )
}

function SingleCoursePlanTab({ onCreateSingleCoursePlan }: { onCreateSingleCoursePlan: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-sm font-semibold text-zinc-700">Plan Records</h2>
        <button
          onClick={onCreateSingleCoursePlan}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Single Course Plan
        </button>
      </div>
      <SingleCoursePlansSection onCreateSingleCoursePlan={onCreateSingleCoursePlan} />
    </div>
  )
}

// ─── Tab 3: Course Bundle Plans ───────────────────────────────────────────────
function CourseBundlePlansTab({ onCreateBundlePlan }: { onCreateBundlePlan: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-700">Course Bundle Plans</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Annual B2C plans containing curated course collections.</p>
        </div>
        <button
          onClick={onCreateBundlePlan}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Bundle Plan
        </button>
      </div>
      <CourseBundlePlansSection />
    </div>
  )
}

// ─── Tab 3: B2B Plans card grid ───────────────────────────────────────────────
function B2BPlansTab({ onCreateB2B }: { onCreateB2B: () => void }) {
  const router = useRouter()
  const [cards, setCards] = useState<B2BPlanCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchB2BPlansForGrid()
      .then(setCards)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-36 rounded-md bg-zinc-100 animate-pulse" />
      ))}
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-sm text-rose-600">{error}</p>
    </div>
  )

  return (
    <div>
      {/* Info strip + Create button */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3 mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-600">
          B2B plan pricing is managed per-tenant via the Contract tab.
        </p>
        <button
          onClick={onCreateB2B}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors shrink-0 ml-4"
        >
          <Plus className="w-4 h-4" />
          Create B2B Plan
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <LayoutGrid className="w-8 h-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">No B2B plans yet.</p>
          <p className="text-xs text-zinc-400">Create a plan to assign to tenants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => router.push(`/super-admin/plans-pricing/${card.id}`)}
              className="bg-white border border-zinc-200 rounded-md p-5 text-left hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-zinc-900 leading-snug">{card.name}</p>
                <PlanStatusBadge status={card.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {card.tenant_count} tenant{card.tenant_count !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {card.content_count} item{card.content_count !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Via tenant contract</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PlansPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('assessment-plans')
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null)

  const loadPlans = useCallback(() => {
    setLoading(true)
    fetchPlans()
      .then(setPlans)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])

  const TABS: { id: Tab; label: string }[] = [
    { id: 'assessment-plans',   label: 'Assessment Plans' },
    { id: 'single-course-plan', label: 'Single Course Plan' },
    { id: 'course-bundle-plans', label: 'Course Bundle Plans' },
    { id: 'b2b-plans',          label: 'B2B Plans' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-zinc-400 text-sm">Loading plans...</p>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-rose-600 text-sm">Error: {error}</p>
    </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header — no global Create button */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Plans &amp; Pricing</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage B2C and B2B subscription plans and content entitlements
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'assessment-plans' && (
        <AssessmentPlansTab
          plans={plans}
          onEdit={setEditingPlan}
          onCreateB2C={() => router.push('/super-admin/plans-pricing/new?audience=B2C')}
          onPlanArchived={loadPlans}
        />
      )}
      {activeTab === 'single-course-plan' && (
        <SingleCoursePlanTab
          onCreateSingleCoursePlan={() => router.push('/super-admin/plans-pricing/new?audience=B2C&category=SINGLE_COURSE_PLAN')}
        />
      )}
      {activeTab === 'course-bundle-plans' && (
        <CourseBundlePlansTab
          onCreateBundlePlan={() => router.push('/super-admin/plans-pricing/new?audience=B2C&category=COURSE_BUNDLE')}
        />
      )}
      {activeTab === 'b2b-plans' && (
        <B2BPlansTab
          onCreateB2B={() => router.push('/super-admin/plans-pricing/new?audience=B2B')}
        />
      )}

      {/* Edit slide-over (B2C plans only) */}
      {editingPlan && (
        <EditPlanSlideOver
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={() => { setEditingPlan(null); loadPlans() }}
        />
      )}
    </div>
  )
}
