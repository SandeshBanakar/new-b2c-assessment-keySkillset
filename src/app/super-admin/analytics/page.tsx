'use client'

import { useState, useMemo } from 'react'
import { buildRange, type DateRange } from '@/lib/supabase/analytics'
import PlatformHealthTab from '@/components/analytics/PlatformHealthTab'
import RevenueTab from '@/components/analytics/RevenueTab'
import ContentTab from '@/components/analytics/ContentTab'
import TenantsTab from '@/components/analytics/TenantsTab'

type Preset = '7d' | '30d' | '90d' | 'custom'
type TabId  = 'health' | 'revenue' | 'content' | 'tenants'

const TABS: { id: TabId; label: string }[] = [
  { id: 'health',  label: 'Platform Health' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'content', label: 'Content' },
  { id: 'tenants', label: 'Client Admins' },
]

const PRESET_LABELS: Record<string, string> = {
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

export default function AnalyticsPage() {
  const [preset, setPreset]         = useState<Preset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')
  const [activeTab, setActiveTab]   = useState<TabId>('health')

  const range = useMemo<DateRange>(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return buildRange('custom', {
        from: customFrom + 'T00:00:00.000Z',
        to:   customTo  + 'T23:59:59.999Z',
      })
    }
    return buildRange(preset === 'custom' ? '30d' : preset)
  }, [preset, customFrom, customTo])

  function handlePreset(p: Preset) {
    setPreset(p)
    if (p !== 'custom') { setCustomFrom(''); setCustomTo('') }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-zinc-900">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Platform-wide performance, revenue, and learner engagement.
        </p>
      </div>

      {/* Date range bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Period</span>
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              preset === p
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
        <button
          onClick={() => handlePreset('custom')}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            preset === 'custom'
              ? 'bg-blue-700 text-white border-blue-700'
              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Custom
        </button>

        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
            <span className="text-zinc-400 text-sm">–</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'health'  && <PlatformHealthTab range={range} />}
      {activeTab === 'revenue' && <RevenueTab range={range} />}
      {activeTab === 'content' && <ContentTab range={range} />}
      {activeTab === 'tenants' && <TenantsTab range={range} />}
    </div>
  )
}
