'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { updatePlan, writePlanAuditLog } from '@/lib/supabase/plans'
import type { PlanDetail } from '@/lib/supabase/plans'

type Props = {
  plan: PlanDetail
  onClose: () => void
  onSuccess: () => void
}

export function EditPlanSlideOver({ plan, onClose, onSuccess }: Props) {
  const [name, setName]               = useState(plan.name)
  const [description, setDescription] = useState(plan.description ?? '')
  const [price, setPrice]             = useState(plan.price)
  const [maxAttempts, setMaxAttempts] = useState(
    plan.max_attempts_per_assessment
  )
  const [scope, setScope]             = useState<
    'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
  >(plan.scope as 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE')
  const [category, setCategory]       = useState<string | null>(
    plan.category
  )
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Plan name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updatePlan(plan.id, {
        name:                        name.trim(),
        description:                 description.trim(),
        price,
        max_attempts_per_assessment: maxAttempts,
        scope,
        category: scope === 'PLATFORM_WIDE' ? null : category,
      })
      await writePlanAuditLog(plan.id, 'UPDATED', {
        field: 'plan_details',
        note:  'Fields updated via Edit Details',
      })
      onSuccess()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white border-l border-zinc-200 z-50 flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900">
            Edit Plan Details
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Plan name <span className="text-rose-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Price (₹/month)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Max attempts */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Max paid attempts per assessment
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-24 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Plan scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'PLATFORM_WIDE', label: 'Platform-wide' },
                  { value: 'CATEGORY_BUNDLE', label: 'Category Bundle' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setScope(opt.value)
                    if (opt.value === 'PLATFORM_WIDE') setCategory(null)
                  }}
                  className={`px-3 py-2 rounded-md border text-sm font-medium text-left transition-colors ${
                    scope === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category — conditional */}
          {scope === 'CATEGORY_BUNDLE' && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Exam category
              </label>
              <div className="flex flex-wrap gap-2">
                {['SAT', 'NEET', 'JEE', 'CLAT', 'PMP'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      category === cat
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </>
  )
}
