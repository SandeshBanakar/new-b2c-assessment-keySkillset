'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'

interface Props {
  item: {
    ccmId: string
    title: string
    contentType: 'ASSESSMENT' | 'COURSE'
  }
  onClose: () => void
  onRemoved: () => void
}

export default function RemoveContentModal({ item, onClose, onRemoved }: Props) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    setError(false)

    const { error: removeError } = await supabase
      .from('contract_content_map')
      .delete()
      .eq('id', item.ccmId)

    if (removeError) {
      setError(true)
      setRemoving(false)
      return
    }

    onRemoved()
  }

  const contentTypeLabel = item.contentType === 'ASSESSMENT' ? 'Assessment' : 'Course'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] bg-white rounded-md p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} className="text-rose-600" />
          <h2 className="text-base font-semibold text-zinc-900">
            Remove {contentTypeLabel}?
          </h2>
        </div>
        <p className="text-sm text-zinc-600 mb-6">
          Removing &ldquo;{item.title}&rdquo; will immediately revoke learner access to
          this content for all users in this tenant.
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
