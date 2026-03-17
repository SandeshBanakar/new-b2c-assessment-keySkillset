'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { removeContentFromPlan, writePlanAuditLog } from '@/lib/supabase/plans'

interface Props {
  item: {
    pcmId: string
    title: string
    contentType: 'ASSESSMENT' | 'COURSE'
  }
  planId: string
  onClose: () => void
  onRemoved: () => void
}

export function RemoveFromPlanModal({ item, planId, onClose, onRemoved }: Props) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(false)

  const contentTypeLabel = item.contentType === 'ASSESSMENT' ? 'assessment' : 'course'

  const handleRemove = async () => {
    setRemoving(true)
    setError(false)
    try {
      await removeContentFromPlan(item.pcmId)
      await writePlanAuditLog(planId, 'CONTENT_REMOVED', {
        content_title: item.title,
        content_type: item.contentType,
      })
      onRemoved()
    } catch {
      setError(true)
      setRemoving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] bg-white rounded-md p-6 shadow-xl border border-zinc-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <h2 className="text-sm font-semibold text-zinc-900">
            Remove {contentTypeLabel} from plan?
          </h2>
        </div>
        <p className="text-sm text-zinc-600 mb-6">
          Removing &ldquo;{item.title}&rdquo; will revoke learner access to this{' '}
          {contentTypeLabel} for all subscribers of this plan.
        </p>
        {error && (
          <p className="text-sm text-rose-600 mb-4">Failed to remove. Try again.</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}
