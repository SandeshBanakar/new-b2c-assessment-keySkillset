'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Loader2, IndianRupee, TrendingUp, Percent } from 'lucide-react'
import { fetchRevenue, type RevenueData, type DateRange } from '@/lib/supabase/analytics'
import { chartColors } from '@/lib/chartColors'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { PaginationBar } from '@/components/ui/PaginationBar'

const MRR_TREND  = '+₹8,940 MoM'
const CHURN_RATE = '2.8%'

const PAGE_SIZE_OPTIONS = [10, 15, 25]

const TOOLTIP_MRR = 'In production, MRR is pulled directly from Stripe. Calculated as: (Annual Revenue ÷ 12) × subscribers per plan, summed across all active B2C plans. Includes both assessment plans and course plans.'
const TOOLTIP_NEW_SUBS = 'In production, this value is pulled from Stripe and reflects the number of users who have completed a paid subscription in the selected period.'
const TOOLTIP_CHURN = 'In production, churn rate is pulled directly from Stripe. No manual calculation is applied.'
const TOOLTIP_PLAN = 'This column has entries of all course and assessment plans, including single course + bundle course + platform plans + category plans. The list is displayed with recently added as first.'

function formatAxisDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatInr(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RevenueTab({ range }: { range: DateRange }) {
  const [data, setData]         = useState<RevenueData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await fetchRevenue(range)
      if (!cancelled) { setData(result); setLoading(false); setPage(1) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading revenue…
      </div>
    )
  }
  if (!data) return null

  const totalPages = Math.ceil(data.planRows.length / pageSize)
  const pagedRows  = data.planRows.slice((page - 1) * pageSize, page * pageSize)
  const pageMrr    = pagedRows.reduce((s, r) => s + r.mrr, 0)

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total MRR</span>
            <InfoTooltip content={TOOLTIP_MRR} />
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{formatInr(data.totalMrr)}</p>
          <p className="text-xs font-medium text-emerald-600">{MRR_TREND}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">New Subscriptions</span>
            <InfoTooltip content={TOOLTIP_NEW_SUBS} />
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {data.newSubsSeries.reduce((s, r) => s + r.count, 0)}
          </p>
          <p className="text-xs font-medium text-zinc-400">in selected period</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Churn Rate</span>
            <InfoTooltip content={TOOLTIP_CHURN} />
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{CHURN_RATE}</p>
          <p className="text-xs font-medium text-zinc-400">static estimate</p>
        </div>
      </div>

      {/* Bar — MRR by plan */}
      <div className="bg-white border border-zinc-200 rounded-md p-4">
        <p className="text-sm font-medium text-zinc-900 mb-3">MRR by Plan</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.planRows.map((r) => ({ name: r.name, mrr: r.mrr }))}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.zinc300} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatInr(v)}
                tick={{ fontSize: 10, fill: chartColors.zinc500 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 10, fill: chartColors.zinc500 }}
              />
              <Tooltip
                formatter={(v) => [formatInr(Number(v)), 'MRR']}
                contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
              />
              <Bar dataKey="mrr" fill={chartColors.blue700} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New subscriptions over time */}
      {data.newSubsSeries.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md p-4">
          <p className="text-sm font-medium text-zinc-900">New Subscriptions Over Time</p>
          <p className="text-xs text-zinc-400">Based on subscription start date in selected period</p>
          <div className="mt-4" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.newSubsSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.zinc300} />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fontSize: 11, fill: chartColors.zinc500 }} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.zinc500 }} width={28} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => formatAxisDate(v as string)}
                  contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
                />
                <Bar dataKey="count" name="New Subscriptions" fill={chartColors.violet600} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Plan table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  PLAN
                  <InfoTooltip content={TOOLTIP_PLAN} />
                </div>
              </th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">BILLING</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">SUBSCRIBERS</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">PRICE</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">MRR</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">ADDED ON</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pagedRows.map((r) => (
              <tr key={r.planId} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                <td className="px-4 py-3 text-zinc-500">{r.billingCycle}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{r.subscriberCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-zinc-600">₹{r.price.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900">{formatInr(r.mrr)}</td>
                <td className="px-4 py-3 text-right text-zinc-400 text-xs">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 border-t border-zinc-200">
            <tr>
              <td colSpan={4} className="px-4 py-2.5 text-xs font-medium text-zinc-500">
                Page MRR ({pagedRows.length} plan{pagedRows.length !== 1 ? 's' : ''})
              </td>
              <td colSpan={2} className="px-4 py-2.5 text-right text-sm font-semibold text-zinc-900">
                {formatInr(pageMrr)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>
    </div>
  )
}
