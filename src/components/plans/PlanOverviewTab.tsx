'use client'

import { useState } from 'react'
import { Copy, Pencil } from 'lucide-react'
import { PlanStatusBadge } from './PlanStatusBadge'
import { PlanTypeBadge } from './PlanTypeBadge'
import { EditPlanSlideOver } from './EditPlanSlideOver'
import { updatePlan, writePlanAuditLog, derivePlanType } from '@/lib/supabase/plans'
import type { PlanDetail } from '@/lib/supabase/plans'

type Props = {
  plan: PlanDetail
  onRefresh: () => void
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

export function PlanOverviewTab({ plan, onRefresh }: Props) {
  const [showEdit, setShowEdit]               = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [transitioning, setTransitioning]     = useState(false)

  const stripeId = plan.status === 'PUBLISHED'
    ? `stripe_prod_DEMO_${plan.id.slice(0, 8)}`
    : null

  async function handlePublish() {
    setTransitioning(true)
    try {
      await updatePlan(plan.id, { status: 'PUBLISHED' })
      await writePlanAuditLog(plan.id, 'PUBLISHED', {
        stripe_product_id: `stripe_prod_DEMO_${plan.id.slice(0, 8)}`,
      })
      onRefresh()
    } finally {
      setTransitioning(false)
    }
  }

  async function handleArchive() {
    setTransitioning(true)
    try {
      await updatePlan(plan.id, { status: 'ARCHIVED' })
      await writePlanAuditLog(plan.id, 'ARCHIVED', {
        note: 'Archived by Super Admin',
      })
      onRefresh()
    } finally {
      setTransitioning(false)
      setShowArchiveModal(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Status + actions strip */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-md px-5 py-4">
        <div className="flex items-center gap-3">
          <PlanStatusBadge status={plan.status} />
          <PlanTypeBadge type={derivePlanType(plan.name)} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Details
          </button>

          {plan.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              disabled={transitioning}
              className="px-3 py-1.5 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {transitioning ? 'Publishing...' : 'Publish Plan'}
            </button>
          )}

          {plan.status === 'PUBLISHED' && (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors"
            >
              Archive Plan
            </button>
          )}

          {plan.status === 'ARCHIVED' && (
            <span className="text-xs text-zinc-400">
              Archived — duplicate to create a new version
            </span>
          )}
        </div>
      </div>

      {/* MRR summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Subscribers',
            value: plan.plan_subscribers?.subscriber_count ?? 0,
          },
          {
            label: 'MRR',
            value: `₹${(
              plan.plan_subscribers?.mock_mrr ?? 0
            ).toLocaleString('en-IN')}`,
          },
          {
            label: 'Price',
            value: plan.price === 0 ? 'Free' : `₹${plan.price}/mo`,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-zinc-200 rounded-md px-4 py-3"
          >
            <p className="text-xs text-zinc-400">{item.label}</p>
            <p className="text-lg font-semibold text-zinc-900 mt-0.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
          Plan Details
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Plan name" value={plan.name} />
          <Field
            label="Scope"
            value={
              plan.scope === 'PLATFORM_WIDE'
                ? 'Platform-wide'
                : `Category Bundle — ${plan.category ?? '—'}`
            }
          />
          <Field
            label="Description"
            value={plan.description || '—'}
          />
          <Field label="Billing cycle" value="Monthly" />
          <Field
            label="Audience"
            value={plan.audience_type ?? 'B2C'}
          />
          <Field
            label="Max paid attempts"
            value={`${plan.max_attempts_per_assessment} per assessment`}
          />
          <Field
            label="Created"
            value={new Date(plan.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
          <Field
            label="Stripe Product ID"
            value={
              stripeId ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-600">
                    {stripeId}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(stripeId)}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-zinc-400">— available after publishing</span>
              )
            }
          />
        </div>
        {stripeId && (
          <p className="text-xs text-zinc-400 mt-4">
            Simulated — production connects to live Stripe
          </p>
        )}
      </div>

      {/* Archive confirmation modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-md border border-zinc-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-2">
              Archive this plan?
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Archiving will remove this plan from the B2C plans page.
              Existing subscribers retain access until their billing period ends.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={transitioning}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {transitioning ? 'Archiving...' : 'Archive Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit slide-over */}
      {showEdit && (
        <EditPlanSlideOver
          plan={plan}
          onClose={() => setShowEdit(false)}
          onSaved={onRefresh}
        />
      )}

    </div>
  )
}
