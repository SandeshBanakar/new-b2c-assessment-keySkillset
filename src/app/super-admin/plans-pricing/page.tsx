'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp } from 'lucide-react'
import { fetchPlans, derivePlanType, type PlanRow } from '@/lib/supabase/plans'
import { PlanStatusBadge } from '@/components/plans/PlanStatusBadge'
import { PlanTypeBadge } from '@/components/plans/PlanTypeBadge'

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
type TypeFilter = 'ALL' | 'WHOLE_PLATFORM' | 'CATEGORY_BUNDLE'

function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = plans.filter((p) => {
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchType =
      typeFilter === 'ALL' || derivePlanType(p.name) === typeFilter
    return matchStatus && matchType
  })

  const totalMRR = plans.reduce(
    (sum, p) => sum + (p.plan_subscribers?.mock_mrr ?? 0),
    0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400 text-sm">Loading plans...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-rose-600 text-sm">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Plans & Pricing
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage B2C subscription plans and content entitlements
          </p>
        </div>
        <button
          onClick={() => router.push('/super-admin/plans-pricing/new')}
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* MRR summary strip */}
      <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700">
            Total Platform MRR
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            {formatINR(totalMRR)}
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          Demo data — live figures in production
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-6 mb-4">

        {/* Status pills */}
        <div className="flex items-center gap-1">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-zinc-200" />

        {/* Type pills */}
        <div className="flex items-center gap-1">
          {(['ALL', 'WHOLE_PLATFORM', 'CATEGORY_BUNDLE'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {t === 'ALL'
                ? 'All Types'
                : t === 'WHOLE_PLATFORM'
                ? 'Whole Platform'
                : 'Category Bundle'}
            </button>
          ))}
        </div>

      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Plan
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Type
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Price
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Subscribers
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                MRR
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-400 text-sm">
                  No plans match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                  onClick={() =>
                    router.push(`/super-admin/plans-pricing/${plan.id}`)
                  }
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {plan.name}
                  </td>
                  <td className="px-4 py-3">
                    <PlanTypeBadge type={derivePlanType(plan.name)} />
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {plan.price === 0 ? 'Free' : `${formatINR(plan.price)}/mo`}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {plan.plan_subscribers?.subscriber_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {formatINR(plan.plan_subscribers?.mock_mrr ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <PlanStatusBadge status={plan.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/super-admin/plans-pricing/${plan.id}`)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-700 hover:text-blue-800 font-medium"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-zinc-400">
            {filtered.length} of {plans.length} plans shown
          </span>
          <span className="text-xs text-zinc-400">
            Demo data — live figures in production
          </span>
        </div>

      </div>
    </div>
  )
}
