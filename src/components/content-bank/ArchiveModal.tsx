'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import type { ContentBankItem, PlanMembership } from '@/lib/supabase/content-bank'
import { fetchContentPlanMembership, archiveContent } from '@/lib/supabase/content-bank'

type Props = {
  item: ContentBankItem
  onClose: () => void
  onArchived: () => void
}

export function ArchiveModal({ item, onClose, onArchived }: Props) {
  const [membership, setMembership] = useState<PlanMembership[]>([])
  const [loadingMembership, setLoadingMembership] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContentPlanMembership(item.id, item.contentType)
      .then(setMembership)
      .catch(() => setMembership([]))
      .finally(() => setLoadingMembership(false))
  }, [item.id, item.contentType])

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try {
      await archiveContent(item.id, item.contentType)
      onArchived()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to archive.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
            <h2 className="text-sm font-semibold text-zinc-900">Archive Content</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Warning callout */}
            <div className="flex items-start gap-3 p-3 rounded-md bg-rose-50 border border-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-rose-700">{item.title}</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  This content will be archived and removed from all plans. Attempt history is retained. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Plan impact — Removed from */}
            {loadingMembership ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking plan membership...
              </div>
            ) : (
              <div className="rounded-md border border-zinc-200">
                {membership.length > 0 ? (
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-2">Removed from</p>
                    <div className="space-y-1">
                      {membership.map((m) => (
                        <div key={m.pcmId} className="flex items-center gap-2">
                          <span className="text-rose-500 text-sm">✕</span>
                          <span className="text-sm text-zinc-700">{m.planName}</span>
                          <span className={`text-xs font-medium rounded-md px-1.5 py-0.5 ${
                            m.planAudience === 'B2B'
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>{m.planAudience}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-sm text-zinc-400">This content is not in any plans.</p>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || loadingMembership}
              className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Archiving...' : 'Confirm Archive'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
