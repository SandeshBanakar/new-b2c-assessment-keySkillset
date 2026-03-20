'use client'

import { BarChart2 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Insights and analytics for your organisation
        </p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-16 flex flex-col items-center justify-center text-center">
        <BarChart2 className="w-8 h-8 text-zinc-300 mb-3" />
        <p className="text-sm font-medium text-zinc-500">
          Reports — coming in KSS-CA-006
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Per-learner scores, content performance, certificates log, and activity log
        </p>
      </div>
    </div>
  )
}
