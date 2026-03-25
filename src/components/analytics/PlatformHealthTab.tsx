'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Loader2, TrendingUp, Users, UserPlus, Building2 } from 'lucide-react'
import { fetchPlatformHealth, type PlatformHealthData, type DateRange } from '@/lib/supabase/analytics'
import { chartColors } from '@/lib/chartColors'

// ─── Static trend badges (locked — one value regardless of date range) ────────
const TRENDS = {
  subscribers: { label: '646 total subscribers', positive: true },
  active:      { label: '+12% MoM engagement',   positive: true },
  signups:     { label: 'growing steadily',       positive: true },
  b2b:         { label: '2 active tenants',       positive: true },
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  trend: { label: string; positive: boolean }
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-900">{value.toLocaleString()}</p>
      <p className={`text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend.label}
      </p>
    </div>
  )
}

function formatAxisDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function PlatformHealthTab({ range }: { range: DateRange }) {
  const [data, setData]     = useState<PlatformHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await fetchPlatformHealth(range)
      if (!cancelled) { setData(result); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading platform health…
      </div>
    )
  }
  if (!data) return null

  // Merge dauSeries + newSignupsSeries by date for combined chart
  const dateSet = new Set([
    ...data.dauSeries.map((r) => r.date),
    ...data.newSignupsSeries.map((r) => r.date),
  ])
  const dauMap: Record<string, number> = {}
  const signupsMap: Record<string, number> = {}
  for (const r of data.dauSeries)       dauMap[r.date]     = r.count
  for (const r of data.newSignupsSeries) signupsMap[r.date] = r.count

  const combined = [...dateSet].sort().map((d) => ({
    date: d,
    dau: dauMap[d] ?? 0,
    newSignups: signupsMap[d] ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users}    label="Total B2C Subscribers" value={data.totalB2CSubscribers} trend={TRENDS.subscribers} />
        <KpiCard icon={TrendingUp} label="Active B2C Learners"  value={data.activeB2CLearners}   trend={TRENDS.active} />
        <KpiCard icon={UserPlus} label="New B2C Signups"        value={data.newB2CSignups}        trend={TRENDS.signups} />
        <KpiCard icon={Building2} label="Total B2B Learners"    value={data.totalB2BLearners}     trend={TRENDS.b2b} />
      </div>

      {/* Chart: DAU + New Sign-ups */}
      {combined.length > 0 ? (
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <p className="text-sm font-medium text-zinc-900">Daily Activity</p>
          <p className="text-xs text-zinc-400">Active learners and new B2C sign-ups per day</p>
          <div className="mt-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combined} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColors.blue700} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColors.blue700} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColors.emerald600} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColors.emerald600} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.zinc300} />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fontSize: 11, fill: chartColors.zinc500 }} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.zinc500 }} width={32} />
                <Tooltip
                  labelFormatter={(v) => formatAxisDate(v as string)}
                  contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="dau" name="Active Users (DAU)" stroke={chartColors.blue700} fill="url(#gradDau)" strokeWidth={2} />
                <Area type="monotone" dataKey="newSignups" name="New Sign-ups" stroke={chartColors.emerald600} fill="url(#gradSignups)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-md p-8 text-center text-sm text-zinc-400">
          No activity data in the selected date range.
        </div>
      )}
    </div>
  )
}
