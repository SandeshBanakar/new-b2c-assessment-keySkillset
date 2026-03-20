'use client'

import { BookOpen } from 'lucide-react'

export default function CatalogPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Catalog</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Browse and assign content to your learners
        </p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-md px-6 py-16 flex flex-col items-center justify-center text-center">
        <BookOpen className="w-8 h-8 text-zinc-300 mb-3" />
        <p className="text-sm font-medium text-zinc-500">
          Content catalog — coming in KSS-CA-004
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Assign assessments and courses to departments, teams, or individuals
        </p>
      </div>
    </div>
  )
}
