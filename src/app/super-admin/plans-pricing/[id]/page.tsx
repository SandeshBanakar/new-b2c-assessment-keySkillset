'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { fetchPlanById } from '@/lib/supabase/plans'
import type { PlanDetail } from '@/lib/supabase/plans'
import { PlanOverviewTab }    from '@/components/plans/PlanOverviewTab'
import { PlanContentTab }     from '@/components/plans/PlanContentTab'
import { PlanSubscribersTab } from '@/components/plans/PlanSubscribersTab'
import { PlanAuditLogTab }    from '@/components/plans/PlanAuditLogTab'
import { PlanStatusBadge }    from '@/components/plans/PlanStatusBadge'

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'content',     label: 'Content' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'audit-log',   label: 'Audit Log' },
] as const

type TabId = (typeof TABS)[number]['id']

function PlanDetailInner() {
  const { id }       = useParams<{ id: string }>()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeTab    = (searchParams.get('tab') as TabId) ?? 'overview'

  // loading initialised true — no synchronous setState needed in effect
  const [plan, setPlan]         = useState<PlanDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Passed to child tabs as onRefresh — increments key to re-run effect
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // All setState calls happen in async callbacks — no sync setState in body
  useEffect(() => {
    fetchPlanById(id)
      .then(setPlan)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, refreshKey])

  function setTab(tab: TabId) {
    router.push(`/super-admin/plans-pricing/${id}?tab=${tab}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400 text-sm">Loading plan...</p>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-rose-600 text-sm">{error ?? 'Plan not found.'}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/super-admin/plans-pricing')}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Plans & Pricing
      </button>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">{plan.name}</h1>
        <PlanStatusBadge status={plan.status} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <PlanOverviewTab plan={plan} onRefresh={refresh} />
      )}
      {activeTab === 'content' && (
        <PlanContentTab plan={plan} />
      )}
      {activeTab === 'subscribers' && (
        <PlanSubscribersTab plan={plan} />
      )}
      {activeTab === 'audit-log' && (
        <PlanAuditLogTab planId={plan.id} />
      )}

    </div>
  )
}

export default function PlanDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400 text-sm">Loading plan...</p>
        </div>
      }
    >
      <PlanDetailInner />
    </Suspense>
  )
}
