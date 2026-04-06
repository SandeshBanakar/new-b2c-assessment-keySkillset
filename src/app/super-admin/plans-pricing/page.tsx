'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, LayoutGrid, Users, BookOpen, AlertTriangle, X, Loader2, FileText } from 'lucide-react'
import {
  fetchPlatformAssessmentPlansPaginated,
  fetchCategoryAssessmentPlansPaginated,
  fetchSingleCoursePlansPaginated,
  fetchCourseBundlePlansPaginated,
  fetchB2BPlansForGridPaginated,
  fetchAssessmentCountsForPlans,
  updatePlan,
  type PlanRow,
  type B2BPlanCard,
  type CourseBundlePlanRow,
  type SingleCoursePlanRow,
  type AssessmentInPlan,
  fetchAssessmentsInPlan,
} from '@/lib/supabase/plans'
import { PlanStatusBadge } from '@/components/plans/PlanStatusBadge'
import { PaginationBar } from '@/components/ui/PaginationBar'

type Tab = 'assessment-plans' | 'single-course-plan' | 'course-bundle-plans' | 'b2b-plans'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const CARD_PAGE_SIZE    = 12

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

// ─── Plan Assessments Slide-Over ──────────────────────────────────────────────
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
  onArchive,
  onCountClick,
}: {
  plan: PlanRow
  assessmentCount: number
  onView: () => void
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
      <div className="mt-4 pt-3 border-t border-zinc-100">
        <button
          onClick={onView}
          className="text-xs text-blue-700 hover:text-blue-800 font-medium"
        >
          View
        </button>
      </div>
    </div>
  )
}

// ─── Assessment Plan Card Grid (with pagination) ──────────────────────────────
function AssessmentPlanCardGrid({
  plans,
  counts,
  onView,
  onArchive,
}: {
  plans: PlanRow[]
  counts: Record<string, number>
  onView: (plan: PlanRow) => void
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

// ─── Assessment Plan Section (one per scope) ──────────────────────────────────
function AssessmentPlanSection({
  title,
  fetchFn,
  page,
  onPageChange,
  onArchive,
}: {
  title: string
  fetchFn: (page: number, pageSize: number) => Promise<{ data: PlanRow[]; count: number }>
  page: number
  onPageChange: (p: number) => void
  onArchive: (plan: PlanRow) => void
}) {
  const router = useRouter()
  const [plans, setPlans]     = useState<PlanRow[]>([])
  const [counts, setCounts]   = useState<Record<string, number>>({})
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / CARD_PAGE_SIZE))

  const load = useCallback(() => {
    setLoading(true)
    fetchFn(page, CARD_PAGE_SIZE)
      .then(async ({ data, count }) => {
        setPlans(data)
        setTotal(count)
        const ids = data.map((p) => p.id)
        const c = await fetchAssessmentCountsForPlans(ids)
        setCounts(c)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchFn, page])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-md bg-zinc-100 animate-pulse" />)}
    </div>
  )
  if (error) return <p className="text-sm text-rose-600 py-4">{error}</p>

  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-700 mb-4">{title}</h2>
      <AssessmentPlanCardGrid
        plans={plans}
        counts={counts}
        onView={(p) => router.push(`/super-admin/plans-pricing/${p.id}`)}
        onArchive={onArchive}
      />
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}

// ─── Tab 1: Assessment Plans ──────────────────────────────────────────────────
function AssessmentPlansTab({
  platformPage,
  categoryPage,
  onPlatformPageChange,
  onCategoryPageChange,
  onCreateB2C,
}: {
  platformPage: number
  categoryPage: number
  onPlatformPageChange: (p: number) => void
  onCategoryPageChange: (p: number) => void
  onCreateB2C: () => void
}) {
  const [archivingPlan, setArchivingPlan] = useState<PlanRow | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleArchive(plan: PlanRow) {
    await updatePlan(plan.id, { status: 'ARCHIVED' })
    setArchivingPlan(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div>
      {/* Platform Plans */}
      <div className="flex items-center justify-between mb-4">
        <span />
        <button
          onClick={onCreateB2C}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assessment Plan
        </button>
      </div>

      <div key={`platform-${refreshKey}`} className="mb-10">
        <AssessmentPlanSection
          title="Platform Plans"
          fetchFn={fetchPlatformAssessmentPlansPaginated}
          page={platformPage}
          onPageChange={onPlatformPageChange}
          onArchive={setArchivingPlan}
        />
      </div>

      <div key={`category-${refreshKey}`}>
        <AssessmentPlanSection
          title="Category Plans"
          fetchFn={fetchCategoryAssessmentPlansPaginated}
          page={categoryPage}
          onPageChange={onCategoryPageChange}
          onArchive={setArchivingPlan}
        />
      </div>

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

// ─── Tab 2: Single Course Plan ────────────────────────────────────────────────
function SingleCoursePlanTab({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onCreateSingleCoursePlan,
}: {
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onCreateSingleCoursePlan: () => void
}) {
  const router = useRouter()
  const [plans, setPlans]     = useState<SingleCoursePlanRow[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setLoading(true)
    fetchSingleCoursePlansPaginated(page, pageSize)
      .then(({ data, count }) => { setPlans(data); setTotal(count) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, pageSize])

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

      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      ) : error ? (
        <div className="h-16 flex items-center justify-center">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 gap-1">
          <BookOpen className="w-5 h-5 text-zinc-300" />
          <p className="text-sm text-zinc-500">No single course plans yet.</p>
          <p className="text-xs text-zinc-400">Use the &quot;Create Single Course Plan&quot; button above to add one.</p>
        </div>
      ) : (
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
                      {plan.is_free
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">Free</span>
                        : plan.price_usd != null ? `$${Number(plan.price_usd).toFixed(2)}` : <span className="text-zinc-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PlanStatusBadge status={plan.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => router.push(`/super-admin/plans-pricing/${plan.id}`)}
                        className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                      >
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </div>
  )
}

// ─── Tab 3: Course Bundle Plans ───────────────────────────────────────────────
function CourseBundlePlansTab({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onCreateBundlePlan,
}: {
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onCreateBundlePlan: () => void
}) {
  const router = useRouter()
  const [bundles, setBundles] = useState<CourseBundlePlanRow[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setLoading(true)
    fetchCourseBundlePlansPaginated(page, pageSize)
      .then(({ data, count }) => { setBundles(data); setTotal(count) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, pageSize])

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

      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      ) : error ? (
        <div className="h-20 flex items-center justify-center">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : bundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 gap-1">
          <LayoutGrid className="w-6 h-6 text-zinc-300" />
          <p className="text-sm text-zinc-500">No bundle plans yet.</p>
          <p className="text-xs text-zinc-400">Use the &quot;Create Bundle Plan&quot; button above to add one.</p>
        </div>
      ) : (
        <>
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
                    <td className="px-4 py-3 text-right text-zinc-700 font-medium">₹{bundle.price.toLocaleString('en-IN')}</td>
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
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </div>
  )
}

// ─── Tab 4: B2B Plans ─────────────────────────────────────────────────────────
function B2BPlansTab({
  page,
  onPageChange,
  onCreateB2B,
}: {
  page: number
  onPageChange: (p: number) => void
  onCreateB2B: () => void
}) {
  const router = useRouter()
  const [cards, setCards]     = useState<B2BPlanCard[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / CARD_PAGE_SIZE))

  useEffect(() => {
    setLoading(true)
    fetchB2BPlansForGridPaginated(page, CARD_PAGE_SIZE)
      .then(({ data, count }) => { setCards(data); setTotal(count) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
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

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-md bg-zinc-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <LayoutGrid className="w-8 h-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">No B2B plans yet.</p>
          <p className="text-xs text-zinc-400">Create a plan to assign to tenants.</p>
        </div>
      ) : (
        <>
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
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}

// ─── Inner page (needs useSearchParams — must be inside Suspense) ─────────────
function PlansPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const activeTab = (searchParams.get('tab') as Tab | null) ?? 'assessment-plans'

  const platformPage   = Math.max(1, parseInt(searchParams.get('platformPage') ?? '1'))
  const categoryPage   = Math.max(1, parseInt(searchParams.get('categoryPage') ?? '1'))
  const scPage         = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const scPageSize     = PAGE_SIZE_OPTIONS.includes(parseInt(searchParams.get('pageSize') ?? ''))
    ? parseInt(searchParams.get('pageSize')!)
    : 25

  const TABS: { id: Tab; label: string }[] = [
    { id: 'assessment-plans',    label: 'Assessment Plans' },
    { id: 'single-course-plan',  label: 'Single Course Plan' },
    { id: 'course-bundle-plans', label: 'Course Bundle Plans' },
    { id: 'b2b-plans',           label: 'B2B Plans' },
  ]

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function setTab(tab: Tab) {
    updateParams({ tab, platformPage: null, categoryPage: null, page: null, pageSize: null })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Plans &amp; Pricing</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage B2C and B2B subscription plans and content entitlements
        </p>
      </div>

      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
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
          platformPage={platformPage}
          categoryPage={categoryPage}
          onPlatformPageChange={(p) => updateParams({ platformPage: String(p) })}
          onCategoryPageChange={(p) => updateParams({ categoryPage: String(p) })}
          onCreateB2C={() => router.push('/super-admin/plans-pricing/new?audience=B2C')}
        />
      )}
      {activeTab === 'single-course-plan' && (
        <SingleCoursePlanTab
          page={scPage}
          pageSize={scPageSize}
          onPageChange={(p) => updateParams({ page: String(p) })}
          onPageSizeChange={(s) => updateParams({ pageSize: String(s), page: '1' })}
          onCreateSingleCoursePlan={() => router.push('/super-admin/plans-pricing/new?audience=B2C&category=SINGLE_COURSE_PLAN')}
        />
      )}
      {activeTab === 'course-bundle-plans' && (
        <CourseBundlePlansTab
          page={scPage}
          pageSize={scPageSize}
          onPageChange={(p) => updateParams({ page: String(p) })}
          onPageSizeChange={(s) => updateParams({ pageSize: String(s), page: '1' })}
          onCreateBundlePlan={() => router.push('/super-admin/plans-pricing/new?audience=B2C&category=COURSE_BUNDLE')}
        />
      )}
      {activeTab === 'b2b-plans' && (
        <B2BPlansTab
          page={scPage}
          onPageChange={(p) => updateParams({ page: String(p) })}
          onCreateB2B={() => router.push('/super-admin/plans-pricing/new?audience=B2B')}
        />
      )}
    </div>
  )
}

// ─── Page export — Suspense required for useSearchParams ─────────────────────
export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400 text-sm">Loading plans...</p>
      </div>
    }>
      <PlansPageInner />
    </Suspense>
  )
}
