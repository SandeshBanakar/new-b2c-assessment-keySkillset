'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  fetchAvailableB2BPlansForTenant,
  assignPlanToTenant,
  type AvailableB2BPlan,
} from '@/lib/supabase/plans'

interface Props {
  tenantId: string
  onClose: () => void
  onAssigned: () => void
}

export function AssignPlanSlideOver({ tenantId, onClose, onAssigned }: Props) {
  const [plans, setPlans] = useState<AvailableB2BPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAvailableB2BPlansForTenant(tenantId)
      .then(setPlans)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tenantId])

  const handleAssign = async () => {
    if (!selectedPlanId) { setError('Please select a plan.'); return }
    setSaving(true)
    setError('')
    try {
      await assignPlanToTenant(tenantId, selectedPlanId)
      const plan = plans.find((p) => p.id === selectedPlanId)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'PLAN_ASSIGNED_TO_TENANT',
        entity_type: 'Plan',
        entity_id: selectedPlanId,
        before_state: null,
        after_state: { plan_name: plan?.name ?? selectedPlanId },
      })
      onAssigned()
    } catch {
      setError('Failed to assign plan. Please try again.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-120 bg-white shadow-xl flex flex-col z-50">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
          <p className="text-base font-semibold text-zinc-900">Assign Plan</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <p className="text-sm text-zinc-500">
            Select a B2B plan to assign to this tenant. Learners will immediately gain access to the plan&apos;s content.
          </p>

          {loading ? (
            <div className="h-10 animate-pulse bg-zinc-100 rounded-md" />
          ) : plans.length === 0 ? (
            <div className="rounded-md bg-zinc-50 border border-zinc-200 px-4 py-4">
              <p className="text-sm text-zinc-500">
                All available B2B plans are already assigned to this tenant, or no B2B plans exist yet.
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Create B2B plans from the Plans &amp; Pricing page.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                Plan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => { setSelectedPlanId(e.target.value); setError('') }}
                className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-700 outline-none"
              >
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={saving || plans.length === 0}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Assign Plan
          </button>
        </div>
      </div>
    </>
  )
}
