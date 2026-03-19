'use client'

import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import {
  fetchAvailableAssessmentsForPlan,
  fetchAvailableCoursesForPlan,
  addContentToPlan,
  writePlanAuditLog,
} from '@/lib/supabase/plans'

interface Props {
  planId: string
  contentType: 'ASSESSMENT' | 'COURSE'
  planAudience?: 'B2C' | 'B2B'
  onClose: () => void
  onAdded: () => void
}

export function AddContentSlideOver({ planId, contentType, planAudience = 'B2C', onClose, onAdded }: Props) {
  const isAssessment = contentType === 'ASSESSMENT'
  const label = isAssessment ? 'Assessment' : 'Course'

  const [items, setItems] = useState<
    { id: string; title: string; sub: string; disabled?: boolean }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (isAssessment) {
          const data = await fetchAvailableAssessmentsForPlan(planId, planAudience)
          setItems(
            data.map((a) => ({
              id: a.id,
              title: a.title,
              sub: `${a.examType} · ${a.assessmentType}`,
            }))
          )
        } else {
          const data = await fetchAvailableCoursesForPlan(planId)
          setItems(
            data.map((c) => ({
              id: c.id,
              title: c.title,
              sub: c.courseType,
              disabled: c.isIndividuallyPurchasable,
            }))
          )
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [planId, isAssessment])

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item?.disabled) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setSaving(true)
    setSaveError(false)
    try {
      await Promise.all(
        Array.from(selected).map((id) => addContentToPlan(planId, id, contentType))
      )
      await writePlanAuditLog(planId, 'CONTENT_ADDED', {
        content_type: contentType,
        count: String(selected.size),
      })
      onAdded()
    } catch {
      setSaveError(true)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-[480px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Add {label}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-md text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">
              {items.length === 0
                ? `All available ${label.toLowerCase()}s are already added to this plan.`
                : `No ${label.toLowerCase()}s match your search.`}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  title={item.disabled ? 'This course is sold individually and cannot be added to a plan' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-50 cursor-pointer'}`}
                  onClick={() => !item.disabled && toggleSelect(item.id)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => !item.disabled && toggleSelect(item.id)}
                    disabled={item.disabled}
                    className="accent-blue-700 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.title}</p>
                    <p className="text-xs text-zinc-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-4 flex flex-col gap-2">
          {saveError && (
            <p className="text-sm text-rose-600">Failed to add content. Try again.</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">{selected.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0 || saving}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : `Add Selected`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
