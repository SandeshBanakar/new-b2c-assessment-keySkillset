'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import {
  fetchAllAssessmentsForPlan,
  writePlanAuditLog,
} from '@/lib/supabase/plans'
import type { PlanDetail, PlanContentItem } from '@/lib/supabase/plans'

type Props = { plan: PlanDetail }

function deriveAutoIncluded(
  assessment: Omit<PlanContentItem, 'include_mode' | 'excluded'>,
  plan: PlanDetail
): boolean {
  if (!assessment.is_active) return false

  const typeMatch = (plan as unknown as {
    allowed_assessment_types?: string[]
  }).allowed_assessment_types?.includes(
    assessment.assessment_type.toUpperCase().replace('-', '_')
  ) ?? true

  if (plan.scope === 'PLATFORM_WIDE') return typeMatch

  return (
    assessment.exam_type.toUpperCase() ===
      (plan.category ?? '').toUpperCase() && typeMatch
  )
}

export function PlanContentTab({ plan }: Props) {
  const [allAssessments, setAllAssessments] = useState<
    Omit<PlanContentItem, 'include_mode' | 'excluded'>[]
  >([])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetchAllAssessmentsForPlan()
      .then(setAllAssessments)
      .finally(() => setLoading(false))
  }, [])

  const autoIncluded = useMemo(
    () =>
      allAssessments.filter(
        (a) => deriveAutoIncluded(a, plan) && !excluded.has(a.id)
      ),
    [allAssessments, plan, excluded]
  )

  const excludedItems = useMemo(
    () => allAssessments.filter((a) => excluded.has(a.id)),
    [allAssessments, excluded]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return autoIncluded
    const q = search.toLowerCase()
    return autoIncluded.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.exam_type.toLowerCase().includes(q)
    )
  }, [autoIncluded, search])

  async function handleExclude(id: string, title: string) {
    setExcluded((prev) => new Set([...prev, id]))
    await writePlanAuditLog(plan.id, 'CONTENT_REMOVED', {
      content_title: title,
    })
  }

  async function handleReinclude(id: string, title: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    await writePlanAuditLog(plan.id, 'CONTENT_ADDED', {
      content_title: title,
    })
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-400 py-8 text-center">
        Loading content...
      </p>
    )
  }

  return (
    <div className="space-y-6">

      {/* Auto-include explanation banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Auto-included by rule:</span>{' '}
          {plan.scope === 'PLATFORM_WIDE'
            ? 'All active assessments on the platform'
            : `All active ${plan.category} assessments`}{' '}
          matching this plan&apos;s allowed assessment types.
          Use the exclude button to remove individual items.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assessments..."
          className="w-full border border-zinc-200 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      {/* Auto-included list */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Included ({filtered.length})
          </h3>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 px-4 py-6 text-center">
            No assessments match this plan&apos;s rules.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-3 group hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{a.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {a.exam_type} · {a.assessment_type}
                  </p>
                </div>
                <button
                  onClick={() => handleExclude(a.id, a.title)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Exclude
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excluded items */}
      {excludedItems.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Excluded ({excludedItems.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {excludedItems.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-3 opacity-50 group hover:opacity-100 transition-opacity"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 line-through">
                    {a.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {a.exam_type} · {a.assessment_type}
                  </p>
                </div>
                <button
                  onClick={() => handleReinclude(a.id, a.title)}
                  className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                >
                  Re-include
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
