'use client'

import { ClipboardList } from 'lucide-react'

export default function AuditLogPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Activity history for your organisation
        </p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-16 flex flex-col items-center justify-center text-center">
        <ClipboardList className="w-8 h-8 text-zinc-300 mb-3" />
        <p className="text-sm font-medium text-zinc-500">
          Audit Log — coming soon
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Tenant-scoped activity trail
        </p>
      </div>
    </div>
  )
}
