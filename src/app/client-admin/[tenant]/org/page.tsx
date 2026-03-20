'use client'

import { Building2 } from 'lucide-react'

export default function OrgPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Departments & Teams</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your organisation structure
        </p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-16 flex flex-col items-center justify-center text-center">
        <Building2 className="w-8 h-8 text-zinc-300 mb-3" />
        <p className="text-sm font-medium text-zinc-500">
          Organisation management — coming in KSS-CA-002
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Create departments, manage teams, and assign learners
        </p>
      </div>
    </div>
  )
}
