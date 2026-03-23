'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { ContentBankItem, PlanMembership } from '@/lib/supabase/content-bank'
import { fetchContentPlanMembership, reclassifyAudience } from '@/lib/supabase/content-bank'

type Props = {
  item: ContentBankItem
  onClose: () => void
  onReclassified: () => void
}

const AUDIENCE_OPTIONS = [
  { value: 'B2C_ONLY', label: 'B2C Only' },
  { value: 'B2B_ONLY', label: 'B2B Only' },
  { value: 'BOTH',     label: 'Both' },
]

function audienceLabel(val: string | null): string {
  if (val === 'B2C_ONLY') return 'B2C Only'
  if (val === 'B2B_ONLY') return 'B2B Only'
  if (val === 'BOTH')     return 'Both'
  return 'Unset'
}

function compatibleAudiences(audienceType: string): string[] {
  if (audienceType === 'BOTH')     return ['B2C', 'B2B']
  if (audienceType === 'B2C_ONLY') return ['B2C']
  return ['B2B']
}

export function ReclassifyModal({ item, onClose, onReclassified }: Props) {
  const [membership, setMembership] = useState<PlanMembership[]>([])
  const [loadingMembership, setLoadingMembership] = useState(true)
  const [selectedAudience, setSelectedAudience] = useState<string>(item.audienceType ?? 'B2C_ONLY')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContentPlanMembership(item.id, item.contentType)
      .then(setMembership)
      .catch(() => setMembership([]))
      .finally(() => setLoadingMembership(false))
  }, [item.id, item.contentType])

  const compatible = compatibleAudiences(selectedAudience)
  const stayIn      = membership.filter((m) => compatible.includes(m.planAudience))
  const removedFrom = membership.filter((m) => !compatible.includes(m.planAudience))

  const unchanged = selectedAudience === item.audienceType

  async function handleConfirm() {
    if (unchanged) { onClose(); return }
    setSaving(true)
    setError(null)
    try {
      await reclassifyAudience(
        item.id,
        item.contentType,
        selectedAudience,
        removedFrom.map((m) => m.pcmId),
      )
      onReclassified()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reclassify.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-lg">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Reclassify Audience</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Item summary */}
            <div>
              <p className="text-sm font-medium text-zinc-900">{item.title}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Current audience: <span className="font-medium text-zinc-600">{audienceLabel(item.audienceType)}</span>
              </p>
            </div>

            {/* Audience selector */}
            <div>
              <p className="text-xs font-semibold text-zinc-900 mb-2">New audience</p>
              <div className="flex gap-2">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedAudience(opt.value)}
                    className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${
                      selectedAudience === opt.value
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan impact preview */}
            {!loadingMembership && (
              <div className="rounded-md border border-zinc-200 divide-y divide-zinc-100">
                {stayIn.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Stays in</p>
                    <div className="space-y-1">
                      {stayIn.map((m) => (
                        <div key={m.pcmId} className="flex items-center gap-2">
                          <span className="text-green-600 text-sm">✓</span>
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
                )}

                {removedFrom.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-2">Removed from</p>
                    <div className="space-y-1">
                      {removedFrom.map((m) => (
                        <div key={m.pcmId} className="flex items-center gap-2">
                          <span className="text-rose-500 text-sm">✕</span>
                          <span className="text-sm text-zinc-700">{m.planName}</span>
                          <span className={`text-xs font-medium rounded-md px-1.5 py-0.5 ${
                            m.planAudience === 'B2B'
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>{m.planAudience}</span>
                          <span className="text-xs text-zinc-400">— audience conflict</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stayIn.length === 0 && removedFrom.length === 0 && (
                  <div className="px-4 py-3">
                    <p className="text-sm text-zinc-400">This content is not in any plans.</p>
                  </div>
                )}
              </div>
            )}

            {loadingMembership && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading plan membership...
              </div>
            )}

            {unchanged && (
              <p className="text-xs text-zinc-400">Select a different audience to see the impact.</p>
            )}

            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || unchanged}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : removedFrom.length > 0 ? 'Confirm & Save' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
