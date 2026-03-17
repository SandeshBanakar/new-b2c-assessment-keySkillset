'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, LayoutGrid, BookOpen, AlertCircle } from 'lucide-react'
import { fetchTenantPlansWithContent } from '@/lib/supabase/plans'
import type { TenantPlanSection } from '@/lib/supabase/plans'

interface Props {
  tenantId: string
  onGoToPlans: () => void
}

export default function ContentTab({ tenantId, onGoToPlans }: Props) {
  const [sections, setSections] = useState<TenantPlanSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [allCollapsed, setAllCollapsed] = useState(false)
  const [planFilter, setPlanFilter] = useState<string>('ALL')

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchTenantPlansWithContent(tenantId)
      setSections(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const toggleCollapse = (planId: string) => {
    setCollapsed((prev) => ({ ...prev, [planId]: !prev[planId] }))
  }

  const toggleAll = () => {
    const next = !allCollapsed
    setAllCollapsed(next)
    const newState: Record<string, boolean> = {}
    sections.forEach((s) => { newState[s.planId] = next })
    setCollapsed(newState)
  }

  // Compute duplicate badge: content_id appears in more than one plan for this tenant
  const contentIdPlanCount: Record<string, number> = {}
  sections.forEach((section) => {
    section.assessments.forEach((a) => {
      contentIdPlanCount[a.contentId] = (contentIdPlanCount[a.contentId] ?? 0) + 1
    })
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((s) => (
          <div key={s} className="space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-100 animate-pulse" />
            {[0, 1, 2].map((r) => (
              <div key={r} className="h-10 rounded bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        <AlertCircle size={16} />
        Failed to load content. Refresh to retry.
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <LayoutGrid size={32} className="text-zinc-300" />
        <p className="text-sm font-medium text-zinc-500">No plans assigned to this tenant yet.</p>
        <p className="text-sm text-zinc-400">
          Assign plans in the Plans tab to make content available to learners.
        </p>
        <button
          onClick={onGoToPlans}
          className="mt-2 px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
        >
          Go to Plans tab
        </button>
      </div>
    )
  }

  const totalItems = sections.reduce((sum, s) => sum + s.assessments.length, 0)
  const visibleSections =
    planFilter === 'ALL' ? sections : sections.filter((s) => s.planId === planFilter)

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleAll}
          className="text-sm text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
        >
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </button>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <option value="ALL">All Plans ({totalItems} items)</option>
          {sections.map((s) => (
            <option key={s.planId} value={s.planId}>
              {s.planName} ({s.assessments.length} items)
            </option>
          ))}
        </select>
      </div>

      {/* Plan sections */}
      {visibleSections.map((section) => {
        const isCollapsed = collapsed[section.planId] ?? false
        const itemCount = section.assessments.length

        return (
          <div key={section.planId} className="border border-zinc-200 rounded-md overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleCollapse(section.planId)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-zinc-400 shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-zinc-400 shrink-0" />
              )}
              <span className="text-sm font-semibold text-zinc-900">{section.planName}</span>
              <span className="text-sm text-zinc-400">
                — {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
            </button>

            {!isCollapsed && (
              <div>
                {/* Assessments sub-section */}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                    Assessments
                  </p>
                </div>

                {section.assessments.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-zinc-400">No assessments in this plan.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-zinc-100">
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">
                          TITLE
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">
                          CATEGORY
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">
                          TYPE
                        </th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.assessments.map((item) => {
                        const planCount = contentIdPlanCount[item.contentId] ?? 1
                        return (
                          <tr key={item.pcmId} className="border-t border-zinc-100">
                            <td className="px-4 py-3 font-medium text-zinc-900">
                              <span className="flex items-center gap-2 flex-wrap">
                                {item.title}
                                {planCount > 1 && (
                                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                    ⚠ In {planCount} plans
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-600">{item.examType}</td>
                            <td className="px-4 py-3 text-zinc-600">{item.assessmentType}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                LIVE
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}

                {/* Courses sub-section — placeholder per spec */}
                <div className="border-t border-zinc-100 px-4 pt-3 pb-4">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                    Courses
                  </p>
                  <div className="flex items-center gap-2 text-zinc-400 py-1">
                    <BookOpen size={16} />
                    <span className="text-sm">Courses module coming soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
