'use client'

import { useState } from 'react'
import { buildRange, type DateRange } from '@/lib/supabase/analytics'
import PlatformHealthTab from '@/components/analytics/PlatformHealthTab'
import RevenueTab from '@/components/analytics/RevenueTab'
import TenantsTab from '@/components/analytics/TenantsTab'
import AssessmentsTab from '@/components/analytics/AssessmentsTab'

type TabId = 'health' | 'revenue' | 'tenants' | 'assessments'

const TABS: { id: TabId; label: string }[] = [
  { id: 'health',      label: 'Platform Health' },
  { id: 'revenue',     label: 'Revenue' },
  { id: 'tenants',     label: 'Client Admins' },
  { id: 'assessments', label: 'Assessments' },
]

type Preset = '7d' | '30d' | '90d'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('health')
  const [preset, setPreset]       = useState<Preset>('30d')
  const [range, setRange]         = useState<DateRange>(() => buildRange('30d'))

  function handlePreset(p: Preset) {
    setPreset(p)
    setRange(buildRange(p))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Platform metrics and analytics</p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-1">
          {(['7d', '30d', '90d'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                preset === p
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'health'      && <PlatformHealthTab range={range} />}
      {activeTab === 'revenue'     && <RevenueTab        range={range} />}
      {activeTab === 'tenants'     && <TenantsTab        range={range} />}
      {activeTab === 'assessments' && <AssessmentsTab    range={range} />}
    </div>
  )
}
