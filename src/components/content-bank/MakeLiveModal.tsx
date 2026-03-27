'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { ContentBankItem } from '@/lib/supabase/content-bank'
import { makeLive } from '@/lib/supabase/content-bank'

type Props = {
  item: ContentBankItem
  onClose: () => void
  onMadeLive: () => void
}

const AUDIENCE_OPTIONS = [
  {
    value: 'B2C_ONLY',
    label: 'B2C Only',
    description: 'Visible to B2C learners via Plans & Pricing. Not accessible to B2B tenants.',
  },
  {
    value: 'B2B_ONLY',
    label: 'B2B Only',
    description: 'Accessible to B2B tenants via plan assignment. Not visible to B2C learners.',
  },
  {
    value: 'BOTH',
    label: 'Both',
    description: 'Accessible to all learners (B2C and B2B).',
  },
]

export function MakeLiveModal({ item, onClose, onMadeLive }: Props) {
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!selectedAudience) return
    setSaving(true)
    setError(null)
    try {
      await makeLive(item.id, item.contentType, selectedAudience)
      onMadeLive()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to make live.')
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = item.contentType === 'ASSESSMENT' ? 'Assessment' : 'Course'
  const categoryLabel = item.contentType === 'ASSESSMENT'
    ? (item.category ?? '—') + (item.testType ? ` · ${item.testType}` : '')
    : (item.courseType ?? '—')

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
            <h2 className="text-sm font-semibold text-zinc-900">Make Live</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            {/* Part 1 — Metadata summary */}
            <div className="bg-zinc-50 rounded-md border border-zinc-200 px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Content Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div>
                  <p className="text-xs text-zinc-400">Title</p>
                  <p className="text-sm font-medium text-zinc-900 leading-snug">{item.title}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Type</p>
                  <p className="text-sm font-medium text-zinc-900">{typeLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">{item.contentType === 'ASSESSMENT' ? 'Category · Test Type' : 'Course Type'}</p>
                  <p className="text-sm font-medium text-zinc-900">{categoryLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Status</p>
                  <p className="text-sm font-medium text-zinc-500">INACTIVE → LIVE</p>
                </div>
              </div>
            </div>

            {/* Part 2 — Audience selection */}
            <div>
              <p className="text-xs font-semibold text-zinc-900 mb-3">
                Select audience <span className="text-rose-500">*</span>
              </p>
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedAudience === opt.value
                        ? 'border-blue-700 bg-blue-50'
                        : 'border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={opt.value}
                      checked={selectedAudience === opt.value}
                      onChange={() => setSelectedAudience(opt.value)}
                      className="mt-0.5 accent-blue-700 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{opt.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-rose-600">{error}</p>
            )}
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
              disabled={!selectedAudience || saving}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Making Live...' : 'Make Live'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
