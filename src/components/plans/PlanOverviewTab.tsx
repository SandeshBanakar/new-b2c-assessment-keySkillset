'use client'

import { useState } from 'react'
import { Copy, Pencil, AlertTriangle } from 'lucide-react'
import { PlanStatusBadge } from './PlanStatusBadge'
import { PlanTypeBadge } from './PlanTypeBadge'
import { EditPlanSlideOver, SingleCoursePlanEditSlideOver } from './EditPlanSlideOver'
import {
  updatePlan,
  writePlanAuditLog,
  derivePlanType,
  transitionSingleCoursePlanStatus,
} from '@/lib/supabase/plans'
import type { PlanDetail, SingleCoursePlanRow } from '@/lib/supabase/plans'

type Props = {
  plan: PlanDetail
  onRefresh: () => void
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

export function PlanOverviewTab({ plan, onRefresh }: Props) {
  const [showEdit, setShowEdit]                     = useState(false)
  const [showSetToDraftModal, setShowSetToDraftModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal]       = useState(false)
  const [transitioning, setTransitioning]           = useState(false)

  const isB2B          = plan.plan_audience === 'B2B'
  const isSingleCourse = plan.plan_category === 'SINGLE_COURSE_PLAN'
  const isLive         = plan.status === 'LIVE'
  const isDraft        = plan.status === 'DRAFT'
  const wasLive        = (plan as PlanDetail).was_live === true

  const stripeId = isLive
    ? `stripe_prod_DEMO_${plan.id.slice(0, 8)}`
    : null

  // ── Status transition helpers ──────────────────────────────────────────────

  async function handleSetLive() {
    setTransitioning(true)
    try {
      if (isSingleCourse) {
        await transitionSingleCoursePlanStatus(plan.id, 'LIVE', {
          price:           plan.price,
          price_usd:       (plan as PlanDetail).price_usd ?? null,
          stripe_price_id: (plan as PlanDetail).stripe_price_id ?? null,
        }, wasLive)
      } else {
        await updatePlan(plan.id, { status: 'LIVE', was_live: true })
      }
      await writePlanAuditLog(plan.id, 'LIVE', {
        stripe_product_id: `stripe_prod_DEMO_${plan.id.slice(0, 8)}`,
      })
      onRefresh()
    } finally {
      setTransitioning(false)
    }
  }

  async function handleSetToDraft() {
    setTransitioning(true)
    try {
      if (isSingleCourse) {
        await transitionSingleCoursePlanStatus(plan.id, 'DRAFT', {
          price:           plan.price,
          price_usd:       (plan as PlanDetail).price_usd ?? null,
          stripe_price_id: (plan as PlanDetail).stripe_price_id ?? null,
        }, true)
      } else {
        await updatePlan(plan.id, { status: 'DRAFT', was_live: true })
      }
      await writePlanAuditLog(plan.id, 'SET_TO_DRAFT', {
        note: 'Moved to draft by Super Admin — existing subscribers retain access',
      })
      onRefresh()
    } finally {
      setTransitioning(false)
      setShowSetToDraftModal(false)
    }
  }

  async function handleSoftDelete() {
    setTransitioning(true)
    try {
      if (isSingleCourse) {
        await transitionSingleCoursePlanStatus(plan.id, 'DELETED', {
          price:           plan.price,
          price_usd:       (plan as PlanDetail).price_usd ?? null,
          stripe_price_id: (plan as PlanDetail).stripe_price_id ?? null,
        }, wasLive)
      } else {
        await updatePlan(plan.id, { status: 'DELETED' })
      }
      await writePlanAuditLog(plan.id, 'DELETED', {
        note: 'Soft deleted by Super Admin',
      })
      onRefresh()
    } finally {
      setTransitioning(false)
      setShowDeleteModal(false)
    }
  }

  function handleEditDetailsClick() {
    if (isLive) {
      setShowSetToDraftModal(true)
    } else {
      setShowEdit(true)
    }
  }

  async function handleSetToDraftThenEdit() {
    await handleSetToDraft()
    setShowEdit(true)
  }

  // ── Summary cards ──────────────────────────────────────────────────────────

  const billingLabel = plan.billing_cycle === 'MONTHLY' ? 'MRR' : 'ARR'
  const revenueLabel = isSingleCourse
    ? (plan.billing_cycle === 'MONTHLY' ? 'MRR' : 'ARR')
    : 'Annual Revenue'

  const subscriberCount = plan.plan_subscribers?.subscriber_count ?? 0

  const summaryCards = (() => {
    const isFreeCoursePlan = isSingleCourse && (plan as PlanDetail).is_free
    if (plan.plan_category === 'COURSE_BUNDLE') {
      return [
        { label: 'Subscribers',   value: subscriberCount },
        { label: 'Annual Revenue', value: `₹${(subscriberCount * plan.price).toLocaleString('en-IN')}` },
        { label: 'Price (₹/yr)',  value: plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}` },
      ]
    }
    if (isFreeCoursePlan) {
      return [
        { label: 'Subscribers', value: subscriberCount },
        { label: 'Price',       value: 'Free' },
      ]
    }
    return [
      { label: 'Subscribers', value: subscriberCount },
      { label: revenueLabel,  value: `₹${(subscriberCount * plan.price).toLocaleString('en-IN')}` },
      { label: `Price (₹/${plan.billing_cycle === 'MONTHLY' ? 'mo' : 'yr'})`, value: `₹${plan.price.toLocaleString('en-IN')}` },
    ]
  })()

  // ── Compare-at pricing display ─────────────────────────────────────────────

  const compareAtInr = (plan as PlanDetail).compare_at_price
  const compareAtUsd = (plan as PlanDetail).compare_at_price_usd
  const hasCompareAt = isSingleCourse && compareAtInr != null && compareAtInr > 0

  const savingsPct = hasCompareAt && compareAtInr
    ? Math.round(((compareAtInr - plan.price) / compareAtInr) * 100)
    : null

  return (
    <div className="space-y-6">

      {/* Subscriber retention banner — shown when plan was previously live */}
      {isDraft && wasLive && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            This plan is in draft. Existing subscribers retain access until their billing period ends.
            New users cannot subscribe until the plan is set live again.
          </p>
        </div>
      )}

      {/* Status + actions strip */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-md px-5 py-4">
        <div className="flex items-center gap-3">
          <PlanStatusBadge status={plan.status} />
          <PlanTypeBadge type={derivePlanType(plan.scope)} />
          {plan.plan_category === 'COURSE_BUNDLE' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
              Course Bundle
            </span>
          )}
          {isSingleCourse && (plan as PlanDetail).is_free && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              Free
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {plan.status !== 'DELETED' && (
            <button
              onClick={handleEditDetailsClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Details
            </button>
          )}

          {isDraft && (
            <button
              onClick={handleSetLive}
              disabled={transitioning}
              className="px-3 py-1.5 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {transitioning ? 'Saving...' : 'Set Live'}
            </button>
          )}

          {isDraft && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors"
            >
              Delete Plan
            </button>
          )}

          {plan.status === 'DELETED' && (
            <span className="text-xs text-zinc-400">This plan has been deleted.</span>
          )}
        </div>
      </div>

      {/* B2B details grid */}
      {isB2B && (
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Plan Details</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Plan name" value={plan.name} />
            <Field
              label="Scope"
              value={plan.scope === 'PLATFORM_WIDE' ? 'Platform-wide' : `Category Bundle — ${plan.category ?? '—'}`}
            />
            <Field label="Description" value={plan.description || '—'} />
            <Field label="Max attempts per assessment" value={`${plan.max_attempts_per_assessment} per assessment`} />
            <Field
              label="Created"
              value={new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
          </div>
        </div>
      )}

      {/* B2C summary cards */}
      {!isB2B && (
        <div className={`grid gap-4 ${summaryCards.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {summaryCards.map((item) => (
            <div key={item.label} className="bg-white border border-zinc-200 rounded-md px-4 py-3">
              <p className="text-xs text-zinc-400">{item.label}</p>
              <p className="text-lg font-semibold text-zinc-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* B2C details grid */}
      {!isB2B && (
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Plan Details</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Plan name" value={plan.name} />
            <Field
              label="Scope"
              value={plan.scope === 'PLATFORM_WIDE' ? 'Platform-wide' : `Category Bundle — ${plan.category ?? '—'}`}
            />
            {plan.display_name && <Field label="Display name" value={plan.display_name} />}
            <Field label="Description" value={plan.description || '—'} />
            {plan.tagline && <Field label="Tagline" value={plan.tagline} />}
            <Field
              label="Billing cycle"
              value={plan.billing_cycle === 'MONTHLY' ? 'Monthly' : 'Annual'}
            />
            {plan.plan_category !== 'COURSE_BUNDLE' && (
              <Field label="Max paid attempts" value={`${plan.max_attempts_per_assessment} per assessment`} />
            )}
            <Field
              label="Created"
              value={new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
            <Field
              label={plan.plan_category === 'COURSE_BUNDLE' ? 'Stripe Price ID' : 'Stripe Product ID'}
              value={
                stripeId ? (
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-600">{stripeId}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(stripeId)}
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-zinc-400">— available after going live</span>
                )
              }
            />

            {/* Compare-at pricing — Single Course Plan only */}
            {isSingleCourse && !((plan as PlanDetail).is_free) && (
              <>
                <Field
                  label="Sale price (₹)"
                  value={
                    hasCompareAt ? (
                      <span className="flex items-center gap-2">
                        <span className="line-through text-zinc-400">₹{compareAtInr!.toLocaleString('en-IN')}</span>
                        <span className="text-zinc-900">₹{plan.price.toLocaleString('en-IN')}</span>
                        {savingsPct != null && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {savingsPct}% off
                          </span>
                        )}
                      </span>
                    ) : (
                      `₹${plan.price.toLocaleString('en-IN')}`
                    )
                  }
                />
                <Field
                  label="Sale price (USD)"
                  value={
                    hasCompareAt && compareAtUsd != null ? (
                      <span className="flex items-center gap-2">
                        <span className="line-through text-zinc-400">${compareAtUsd.toFixed(2)}</span>
                        <span className="text-zinc-900">${((plan as PlanDetail).price_usd ?? 0).toFixed(2)}</span>
                      </span>
                    ) : (
                      `$${((plan as PlanDetail).price_usd ?? 0).toFixed(2)}`
                    )
                  }
                />
              </>
            )}
          </div>
          {stripeId && (
            <p className="text-xs text-zinc-400 mt-4">Simulated — production connects to live Stripe</p>
          )}
        </div>
      )}

      {/* Set-to-Draft confirmation modal (Edit Details on LIVE plan) */}
      {showSetToDraftModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-md border border-zinc-200 shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">Move plan to draft?</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-zinc-700">
                Editing requires moving this plan back to <span className="font-medium">Draft</span>.
              </p>
              <p className="text-sm text-zinc-500">
                Existing subscribers will retain access until their billing period ends,
                but new users will not be able to subscribe until the plan is set live again.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setShowSetToDraftModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetToDraftThenEdit}
                disabled={transitioning}
                className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Moving to draft...' : 'Move to Draft & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-md border border-zinc-200 shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">Delete this plan?</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              {subscriberCount > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <span className="font-medium">{subscriberCount} active {subscriberCount === 1 ? 'subscriber' : 'subscribers'}</span> — they
                    retain access until their billing period ends. Production requires Stripe subscription cancellation.
                  </p>
                </div>
              )}
              <p className="text-sm text-zinc-700">
                The plan will be hidden from all B2C pages. This action can be reviewed in the audit log.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSoftDelete}
                disabled={transitioning}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Deleting...' : 'Delete Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit slide-over */}
      {showEdit && isSingleCourse && (
        <SingleCoursePlanEditSlideOver
          plan={{
            id:                   plan.id,
            name:                 plan.name,
            display_name:         plan.display_name,
            price:                plan.price,
            price_usd:            (plan as PlanDetail).price_usd ?? null,
            stripe_price_id:      (plan as PlanDetail).stripe_price_id ?? null,
            billing_cycle:        plan.billing_cycle as 'ANNUAL' | 'MONTHLY',
            compare_at_price:     (plan as PlanDetail).compare_at_price ?? null,
            compare_at_price_usd: (plan as PlanDetail).compare_at_price_usd ?? null,
            was_live:             wasLive,
            status:               plan.status,
            course_id:            null,
            course_name:          null,
            is_free:              (plan as PlanDetail).is_free ?? false,
          } as SingleCoursePlanRow}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onRefresh() }}
        />
      )}
      {showEdit && !isSingleCourse && (
        <EditPlanSlideOver
          plan={plan}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onRefresh() }}
        />
      )}

    </div>
  )
}
