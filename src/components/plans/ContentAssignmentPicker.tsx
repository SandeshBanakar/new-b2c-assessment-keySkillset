'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { fetchLiveAssessments } from '@/lib/supabase/plans'

type Assessment = {
  id: string
  title: string
  exam_type: string
  assessment_type: string
}

type Props = {
  selected: string[]
  onChange: (ids: string[]) => void
}

export function ContentAssignmentPicker({ selected, onChange }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveAssessments()
      .then(setAssessments)
      .finally(() => setLoading(false))
  }, [])

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    )
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-400">Loading assessments...</p>
    )
  }

  if (assessments.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        No live assessments available. Publish assessments in the
        Content Bank first.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
      {assessments.map((a) => {
        const isSelected = selected.includes(a.id)
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-md border text-left transition-colors ${
              isSelected
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <div>
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {a.exam_type} · {a.assessment_type}
              </p>
            </div>
            {isSelected && (
              <Check className="w-4 h-4 text-blue-600 shrink-0 ml-3" />
            )}
          </button>
        )
      })}
    </div>
  )
}
