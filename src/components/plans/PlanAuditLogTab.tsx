'use client'

import { useEffect, useState } from 'react'
import { fetchPlanAuditLogs } from '@/lib/supabase/plans'
import type { PlanAuditEntry } from '@/lib/supabase/plans'

type Props = { planId: string }

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATED:         { label: 'Created',        color: 'text-blue-700 bg-blue-50 border-blue-200' },
  PUBLISHED:       { label: 'Published',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  LIVE:            { label: 'Set Live',         color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ARCHIVED:        { label: 'Archived',         color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
  DELETED:         { label: 'Deleted',          color: 'text-rose-600 bg-rose-50 border-rose-200' },
  SET_TO_DRAFT:    { label: 'Set to Draft',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  UPDATED:         { label: 'Updated',         color: 'text-amber-700 bg-amber-50 border-amber-200' },
  CONTENT_ADDED:   { label: 'Content added',   color: 'text-violet-700 bg-violet-50 border-violet-200' },
  CONTENT_REMOVED: { label: 'Content removed', color: 'text-rose-700 bg-rose-50 border-rose-200' },
}

export function PlanAuditLogTab({ planId }: Props) {
  const [entries, setEntries] = useState<PlanAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlanAuditLogs(planId)
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [planId])

  if (loading) {
    return (
      <p className="text-sm text-zinc-400 py-8 text-center">
        Loading audit log...
      </p>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-400 py-8 text-center">
        No changes recorded yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const cfg = ACTION_LABELS[entry.action] ?? {
          label: entry.action,
          color: 'text-zinc-600 bg-zinc-100 border-zinc-200',
        }
        return (
          <div
            key={entry.id}
            className="bg-white border border-zinc-200 rounded-md px-4 py-3 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-0.5 shrink-0 ${cfg.color}`}
              >
                {cfg.label}
              </span>
              <div>
                <p className="text-sm text-zinc-700">{entry.actor_email}</p>
                {entry.metadata && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {Object.entries(entry.metadata)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-400 shrink-0">
              {new Date(entry.created_at).toLocaleDateString('en-IN', {
                day:   'numeric',
                month: 'short',
                year:  'numeric',
              })}
            </p>
          </div>
        )
      })}
    </div>
  )
}
