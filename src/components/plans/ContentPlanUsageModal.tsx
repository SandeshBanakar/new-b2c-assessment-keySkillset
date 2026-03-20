'use client'

import { useEffect, useState } from 'react'
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import {
  fetchPlansContainingContent,
  removeContentFromPlan,
  type PlanUsageItem,
} from '@/lib/supabase/plans'

interface Props {
  contentId: string
  contentTitle: string
  tenantId?: string   // scoped to tenant's plans; omit for platform-wide
  onClose: () => void
  onRemoved: () => void
}

function AudienceBadge({ audience }: { audience: 'B2C' | 'B2B' }) {
  return (
    <span className={`text-xs font-medium border rounded-md px-2 py-0.5 ${
      audience === 'B2B'
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      {audience}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  const cls =
    s === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'DRAFT'     ? 'bg-zinc-50 text-zinc-500 border-zinc-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${cls}`}>
      {status}
    </span>
  )
}

export function ContentPlanUsageModal({
  contentId,
  contentTitle,
  tenantId,
  onClose,
  onRemoved,
}: Props) {
  const [plans, setPlans] = useState<PlanUsageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<PlanUsageItem | null>(null)
  const [removing, setRemoving] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setPlans(await fetchPlansContainingContent(contentId, tenantId))
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load plan usage.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [contentId, tenantId])

  const handleRemove = async () => {
    if (!confirmRemove) return
    setRemoving(true)
    try {
      await removeContentFromPlan(confirmRemove.pcmId)
      const updated = plans.filter((p) => p.pcmId !== confirmRemove.pcmId)
      setPlans(updated)
      onRemoved()
      if (updated.length < 2) onClose()
    } finally {
      setRemoving(false)
      setConfirmRemove(null)
    }
  }

  const scopeLabel = tenantId ? 'this tenant' : 'platform-wide'

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-lg">

          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-200">
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold text-zinc-900 truncate" title={contentTitle}>
                {contentTitle}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {loading
                  ? 'Loading…'
                  : `Appears in ${plans.length} plan${plans.length !== 1 ? 's' : ''} (${scopeLabel})`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 shrink-0 mt-0.5"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 min-h-[100px]">
            {confirmRemove ? (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-700">
                  Remove{' '}
                  <span className="font-semibold text-zinc-900">{contentTitle}</span>{' '}
                  from{' '}
                  <span className="font-semibold text-zinc-900">{confirmRemove.planName}</span>?
                  {' '}Learners in this plan will lose access immediately.
                </p>
              </div>
            ) : loadError ? (
              <p className="text-sm text-rose-600 text-center py-4">{loadError}</p>
            ) : loading ? (
              <div className="space-y-2 py-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-9 rounded bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">No plan overlap found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left text-xs font-medium text-zinc-500 pb-2.5 pr-4">Plan</th>
                    <th className="text-left text-xs font-medium text-zinc-500 pb-2.5 pr-4">Audience</th>
                    <th className="text-left text-xs font-medium text-zinc-500 pb-2.5 pr-4">Status</th>
                    <th className="pb-2.5 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.pcmId} className="border-b border-zinc-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">{p.planName}</td>
                      <td className="py-3 pr-4"><AudienceBadge audience={p.planAudience} /></td>
                      <td className="py-3 pr-4"><StatusBadge status={p.planStatus} /></td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setConfirmRemove(p)}
                          className="text-zinc-300 hover:text-rose-600 transition-colors"
                          title={`Remove from ${p.planName}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50 rounded-b-md flex items-center justify-between gap-4">
            {confirmRemove ? (
              <>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmRemove(null)}
                    className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {removing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-400">
                  Removing from a plan revokes learner access immediately.
                </p>
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-100 shrink-0"
                >
                  Close
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
