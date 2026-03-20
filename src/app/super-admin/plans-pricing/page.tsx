'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, LayoutGrid, Users, BookOpen, Pencil } from 'lucide-react'
import {
  fetchPlans,
  derivePlanType,
  fetchB2BPlansForGrid,
  fetchB2CCoursesForPricing,
  updateCoursePricing,
  fetchCourseBundlePlans,
  type PlanRow,
  type B2BPlanCard,
  type CoursePricingRow,
  type CourseBundlePlanRow,
} from '@/lib/supabase/plans'
import { PlanStatusBadge } from '@/components/plans/PlanStatusBadge'
import { PlanTypeBadge } from '@/components/plans/PlanTypeBadge'
import { EditPlanSlideOver } from '@/components/plans/EditPlanSlideOver'

type Tab = 'assessment-plans' | 'course-plans' | 'b2b-plans'

// Tier column order for the B2C swimlane — maps tier DB value to display label
const B2C_TIERS = [
  { tier: 'BASIC',   label: 'Basic' },
  { tier: 'PRO',     label: 'Professional' },
  { tier: 'PREMIUM', label: 'Premium' },
] as const

function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

// ─── Free column (read-only reference, no plan record) ────────────────────────
function FreeTierColumn() {
  return (
    <div className="flex flex-col">
      <div className="px-4 h-15 bg-zinc-50 border-b border-zinc-200 flex flex-col items-center justify-center">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Free</p>
        <p className="text-xs text-zinc-400 mt-0.5">Default</p>
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-500">₹0</div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-400">—</div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-400">—</div>
      <div className="px-4 h-11 flex items-center justify-center">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
          Read-only
        </span>
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-400">—</div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-400">1 attempt</div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-400">—</div>
    </div>
  )
}

// ─── Swimlane column for a B2C tier plan ──────────────────────────────────────
function PlanColumn({
  plan,
  label,
  onEdit,
}: {
  plan: PlanRow | undefined
  label: string
  onEdit: (plan: PlanRow) => void
}) {
  if (!plan) {
    return (
      <div className="flex flex-col">
        <div className="px-4 h-15 bg-zinc-50 border-b border-zinc-200 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</p>
          <p className="text-xs text-zinc-300 mt-0.5">Not configured</p>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-4 h-11 flex items-center justify-center text-sm text-zinc-300">—</div>
        ))}
      </div>
    )
  }

  const sub = plan.plan_subscribers
  const bulletCount = Array.isArray(plan.feature_bullets) ? plan.feature_bullets.length : 0

  return (
    <div className="flex flex-col group">
      <div className="px-4 h-15 bg-zinc-50 border-b border-zinc-200 flex flex-col items-center justify-center">
        <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">{label}</p>
        <button
          onClick={() => onEdit(plan)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-700 font-medium">
        {plan.price === 0 ? 'Free' : `${formatINR(plan.price)}/mo`}
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-600">
        {sub?.subscriber_count ?? 0}
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-600">
        {formatINR(sub?.mock_mrr ?? 0)}
      </div>
      <div className="px-4 h-11 flex items-center justify-center">
        <PlanStatusBadge status={plan.status} />
      </div>
      <div className="px-4 h-11 flex items-center justify-center">
        <PlanTypeBadge type={derivePlanType(plan.scope)} />
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-600">
        {plan.max_attempts_per_assessment ?? '—'}
      </div>
      <div className="px-4 h-11 flex items-center justify-center text-sm text-zinc-600">
        {bulletCount > 0 ? `${bulletCount} bullet${bulletCount !== 1 ? 's' : ''}` : '—'}
      </div>
    </div>
  )
}

const SWIMLANE_ROW_LABELS = [
  'Price',
  'Subscribers',
  'MRR',
  'Status',
  'Scope',
  'Max Attempts',
  'Feature Bullets',
]

// ─── Tab 1: Assessment Plans ──────────────────────────────────────────────────
function AssessmentPlansTab({
  plans,
  onEdit,
  onCreateB2C,
}: {
  plans: PlanRow[]
  onEdit: (plan: PlanRow) => void
  onCreateB2C: () => void
}) {
  const b2cPlans = plans.filter((p) => p.plan_audience === 'B2C')
  const platformPlans = b2cPlans.filter((p) => p.scope === 'PLATFORM_WIDE')
  const categoryPlans = b2cPlans.filter((p) => p.scope === 'CATEGORY_BUNDLE')

  const planByTier = (tier: string) => platformPlans.find((p) => p.tier === tier)

  const b2cMRR = b2cPlans.reduce(
    (sum, p) => sum + (p.plan_subscribers?.mock_mrr ?? 0),
    0
  )

  return (
    <div>
      {/* MRR strip — inside Tab 1 only, B2C plans only */}
      <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700">B2C Platform MRR</span>
          <span className="text-sm font-semibold text-zinc-900">{formatINR(b2cMRR)}</span>
        </div>
        <span className="text-xs text-zinc-400">Demo data — live figures in production</span>
      </div>

      {/* Section header + Create button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-700">Platform Plans</h2>
        <button
          onClick={onCreateB2C}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assess Plan
        </button>
      </div>

      {/* Swimlane */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-x-auto mb-8">
        <div className="grid grid-cols-[140px_1fr_1fr_1fr_1fr] min-w-175 divide-x divide-zinc-200">
          {/* Row label column */}
          <div className="flex flex-col">
            <div className="px-4 py-3 h-15 bg-zinc-50 border-b border-zinc-200 flex items-center">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Plan</p>
            </div>
            {SWIMLANE_ROW_LABELS.map((row) => (
              <div key={row} className="px-4 h-11 flex items-center text-xs font-medium text-zinc-500">
                {row}
              </div>
            ))}
          </div>

          {/* Free column */}
          <FreeTierColumn />

          {/* B2C tier columns */}
          {B2C_TIERS.map((t) => (
            <PlanColumn
              key={t.tier}
              plan={planByTier(t.tier)}
              label={t.label}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>

      {/* Category Plans */}
      {categoryPlans.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">Category Plans</h2>
          <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {['Plan', 'Price', 'Subscribers', 'MRR', 'Status', 'Scope', 'Max Attempts', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide ${h === 'Plan' || h === '' ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categoryPlans.map((plan) => {
                  const sub = plan.plan_subscribers
                  return (
                    <tr key={plan.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-4 py-3 font-medium text-zinc-900">{plan.name}</td>
                      <td className="px-4 py-3 text-right text-zinc-700">
                        {plan.price === 0 ? 'Free' : `${formatINR(plan.price)}/mo`}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600">{sub?.subscriber_count ?? 0}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{formatINR(sub?.mock_mrr ?? 0)}</td>
                      <td className="px-4 py-3 text-right"><PlanStatusBadge status={plan.status} /></td>
                      <td className="px-4 py-3 text-right"><PlanTypeBadge type={derivePlanType(plan.scope)} /></td>
                      <td className="px-4 py-3 text-right text-zinc-600">{plan.max_attempts_per_assessment ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onEdit(plan)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-700 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab 2: Course Plans ──────────────────────────────────────────────────────

function IndividualCoursePricingSection() {
  const [courses, setCourses] = useState<CoursePricingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<CoursePricingRow>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchB2CCoursesForPricing()
      .then(setCourses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(course: CoursePricingRow) {
    setEditingId(course.id)
    setEditDraft({
      price:                       course.price,
      is_individually_purchasable: course.is_individually_purchasable,
      stripe_price_id:             course.stripe_price_id,
    })
  }

  function cancelEdit() { setEditingId(null); setEditDraft({}) }

  async function saveEdit(courseId: string) {
    setSaving(true)
    try {
      await updateCoursePricing(courseId, {
        price:                       editDraft.price ?? null,
        is_individually_purchasable: editDraft.is_individually_purchasable ?? false,
        stripe_price_id:             editDraft.stripe_price_id ?? null,
      })
      setCourses((prev) =>
        prev.map((c) => c.id === courseId ? { ...c, ...editDraft } as CoursePricingRow : c)
      )
      cancelEdit()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-20 flex items-center justify-center"><p className="text-sm text-zinc-400">Loading...</p></div>
  if (error) return <div className="h-20 flex items-center justify-center"><p className="text-sm text-rose-600">{error}</p></div>
  if (courses.length === 0) return (
    <div className="flex flex-col items-center justify-center h-28 gap-1">
      <BookOpen className="w-6 h-6 text-zinc-300" />
      <p className="text-sm text-zinc-500">No courses available for pricing.</p>
      <p className="text-xs text-zinc-400">Promote courses to Live in the Content Bank first.</p>
    </div>
  )

  return (
    <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Course</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Price (₹)</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Purchasable</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Stripe Price ID</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {courses.map((course) => {
            const isEditing = editingId === course.id
            return (
              <tr key={course.id} className={`transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-zinc-50'}`}>
                <td className="px-4 py-3 font-medium text-zinc-900">{course.title}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{course.course_type}</td>
                {isEditing ? (
                  <>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number" min={0} value={editDraft.price ?? ''}
                        onChange={(e) => setEditDraft((d) => ({ ...d, price: e.target.value === '' ? null : Number(e.target.value) }))}
                        className="w-24 border border-zinc-200 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox" checked={editDraft.is_individually_purchasable ?? false}
                        onChange={(e) => setEditDraft((d) => ({ ...d, is_individually_purchasable: e.target.checked }))}
                        className="accent-blue-700 w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text" value={editDraft.stripe_price_id ?? ''}
                        onChange={(e) => setEditDraft((d) => ({ ...d, stripe_price_id: e.target.value || null }))}
                        className="w-full border border-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="price_annual_..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={cancelEdit} className="text-xs text-zinc-500 hover:text-zinc-800">Cancel</button>
                        <button
                          onClick={() => saveEdit(course.id)} disabled={saving}
                          className="text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-md disabled:opacity-50"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      {course.price != null ? formatINR(course.price) : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {course.is_individually_purchasable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Yes</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono truncate max-w-45">{course.stripe_price_id ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(course)} className="text-xs text-blue-700 hover:text-blue-800 font-medium">Edit</button>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-xs text-zinc-400">
          Stripe Price ID must be a recurring annual price ID. Price (₹) is the source of truth for Stripe checkout and B2C pricing page display.
        </p>
      </div>
    </div>
  )
}

function CourseBundlePlansSection({ onCreateCoursePlan }: { onCreateCoursePlan: () => void }) {
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
    <div className="flex flex-col items-center justify-center h-28 gap-2">
      <LayoutGrid className="w-6 h-6 text-zinc-300" />
      <p className="text-sm text-zinc-500">No course bundle plans yet.</p>
      <button
        onClick={onCreateCoursePlan}
        className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Create Course Plan
      </button>
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

function CoursePlansTab({ onCreateCoursePlan }: { onCreateCoursePlan: () => void }) {
  return (
    <div className="space-y-8">
      {/* Individual Course Pricing section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700">Individual Course Pricing</h2>
          <button
            onClick={onCreateCoursePlan}
            className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Course Plan
          </button>
        </div>
        <IndividualCoursePricingSection />
      </div>

      {/* Course Bundle Plans section */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 mb-4">Course Bundle Plans</h2>
        <CourseBundlePlansSection onCreateCoursePlan={onCreateCoursePlan} />
      </div>
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
    { id: 'assessment-plans', label: 'Assessment Plans' },
    { id: 'course-plans',     label: 'Course Plans' },
    { id: 'b2b-plans',        label: 'B2B Plans' },
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
        />
      )}
      {activeTab === 'course-plans' && (
        <CoursePlansTab
          onCreateCoursePlan={() => router.push('/super-admin/plans-pricing/new?audience=B2C&category=COURSE_BUNDLE')}
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
