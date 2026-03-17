'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ChevronDown, ChevronRight, LayoutGrid, BookOpen } from 'lucide-react'

interface Assessment {
  id: string
  title: string
  category: string
  test_type: string
  status: string
}

interface PlanSection {
  planId: string
  planName: string
  assessments: (Assessment & { planCount: number })[]
}

interface Props {
  tenantId: string
  onGoToPlans: () => void
}

export default function ContentTab({ tenantId, onGoToPlans }: Props) {
  const [sections, setSections] = useState<PlanSection[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [allCollapsed, setAllCollapsed] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('all')

  useEffect(() => {
    async function fetchContent() {
      setLoading(true)

      // Step 1: get plans assigned to this tenant
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('id, name')
        .eq('tenant_id', tenantId)

      if (plansError || !plans || plans.length === 0) {
        setSections([])
        setLoading(false)
        return
      }

      const planIds = plans.map((p: { id: string }) => p.id)

      // Step 2: get plan_content_map for these plans
      const { data: mappings, error: mapError } = await supabase
        .from('plan_content_map')
        .select('content_id, content_type, plan_id, excluded')
        .in('plan_id', planIds)
        .eq('excluded', false)
        .eq('content_type', 'ASSESSMENT')

      if (mapError || !mappings || mappings.length === 0) {
        setSections([])
        setLoading(false)
        return
      }

      // Step 3: count how many plans each content_id appears in
      const contentPlanCount: Record<string, number> = {}
      mappings.forEach((m: { content_id: string }) => {
        contentPlanCount[m.content_id] = (contentPlanCount[m.content_id] || 0) + 1
      })

      // Step 4: fetch content_items for all content_ids
      const contentIds = [...new Set(mappings.map((m: { content_id: string }) => m.content_id))]
      const { data: items } = await supabase
        .from('content_items')
        .select('id, title, test_type, status, exam_categories ( name )')
        .in('id', contentIds)
        .eq('status', 'LIVE')

      if (!items) {
        setSections([])
        setLoading(false)
        return
      }

      const itemMap = Object.fromEntries(
        (items as { id: string }[]).map(i => [i.id, i])
      )

      // Step 5: group by plan
      const built: PlanSection[] = (plans as { id: string; name: string }[])
        .map(plan => {
          const planMappings = mappings.filter(
            (m: { plan_id: string }) => m.plan_id === plan.id
          )
          const assessments = planMappings
            .map((m: { content_id: string }) => {
              const item = itemMap[m.content_id] as {
                id: string
                title: string
                test_type: string
                status: string
                exam_categories: { name: string } | null
              } | undefined
              if (!item) return null
              return {
                id: item.id,
                title: item.title,
                category: item.exam_categories?.name ?? '—',
                test_type: item.test_type,
                status: item.status,
                planCount: contentPlanCount[m.content_id] ?? 1,
              }
            })
            .filter(Boolean) as (Assessment & { planCount: number })[]

          return { planId: plan.id, planName: plan.name, assessments }
        })
        .filter(s => s.assessments.length > 0)

      setSections(built)
      setLoading(false)
    }

    fetchContent()
  }, [tenantId])

  const toggleSection = (planId: string) => {
    setCollapsed(prev => ({ ...prev, [planId]: !prev[planId] }))
  }

  const toggleAll = () => {
    const next = !allCollapsed
    setAllCollapsed(next)
    const newState: Record<string, boolean> = {}
    sections.forEach(s => { newState[s.planId] = next })
    setCollapsed(newState)
  }

  const visibleSections =
    selectedPlan === 'all'
      ? sections
      : sections.filter(s => s.planId === selectedPlan)

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-zinc-400">
        Loading content...
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-2">
        <LayoutGrid size={32} className="text-zinc-300" />
        <p className="text-sm font-medium text-zinc-500">
          No plans assigned to this tenant yet.
        </p>
        <p className="text-sm text-zinc-400">
          Assign plans in the Plans tab to make content available to learners.
        </p>
        <button
          onClick={onGoToPlans}
          className="mt-3 text-sm text-blue-700 underline cursor-pointer hover:text-blue-800"
        >
          Go to Plans tab
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Controls row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleAll}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </button>
        <select
          value={selectedPlan}
          onChange={e => setSelectedPlan(e.target.value)}
          className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <option value="all">All Plans</option>
          {sections.map(s => (
            <option key={s.planId} value={s.planId}>
              {s.planName}
            </option>
          ))}
        </select>
      </div>

      {/* Plan sections */}
      {visibleSections.map(section => {
        const isCollapsed = collapsed[section.planId] ?? false
        return (
          <div key={section.planId} className="mb-4">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.planId)}
              className="w-full flex items-center gap-2 px-2 py-2 hover:bg-zinc-50 rounded-md text-left"
            >
              {isCollapsed
                ? <ChevronRight size={16} className="text-zinc-400" />
                : <ChevronDown size={16} className="text-zinc-400" />
              }
              <span className="text-sm font-semibold text-zinc-900">
                {section.planName}
              </span>
              <span className="text-sm text-zinc-400">
                — {section.assessments.length} item{section.assessments.length !== 1 ? 's' : ''}
              </span>
            </button>

            {/* Section content */}
            {!isCollapsed && (
              <div className="mt-1 ml-6">
                {/* Assessments */}
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 mt-2">
                  Assessments
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left text-xs text-zinc-400 font-medium pb-2 pr-4 w-1/2">
                        TITLE
                      </th>
                      <th className="text-left text-xs text-zinc-400 font-medium pb-2 pr-4">
                        CATEGORY
                      </th>
                      <th className="text-left text-xs text-zinc-400 font-medium pb-2 pr-4">
                        TYPE
                      </th>
                      <th className="text-left text-xs text-zinc-400 font-medium pb-2">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.assessments.map(item => (
                      <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-zinc-900">
                            {item.title}
                          </span>
                          {item.planCount > 1 && (
                            <span className="ml-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              ⚠ In {item.planCount} plans
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-sm text-zinc-600">{item.category}</td>
                        <td className="py-3 pr-4 text-sm text-zinc-600">{item.test_type}</td>
                        <td className="py-3">
                          <span className="text-xs font-medium text-green-600">LIVE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Courses placeholder */}
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 mt-4">
                  Courses
                </p>
                <div className="flex flex-col items-center py-4 text-zinc-400 gap-1">
                  <BookOpen size={20} className="text-zinc-300" />
                  <p className="text-sm">Courses module coming soon</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
