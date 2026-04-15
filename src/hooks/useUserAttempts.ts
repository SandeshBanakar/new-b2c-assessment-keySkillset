'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { MockAttemptData } from '@/data/mockAttempts'

export const DEFAULT_ATTEMPT: MockAttemptData = {
  attemptsUsed: 0,
  status: 'not_started',
  isFreeAttempt: false,
  lastAccessedAt: null,
}

type AttemptRow = {
  assessment_id: string
  attempt_number: number
  is_free_attempt: boolean
  status: string
  score: number | null
  updated_at: string
}

function toStatus(dbStatus: string): MockAttemptData['status'] {
  const s = dbStatus.toUpperCase()
  if (s === 'COMPLETED') return 'completed'
  if (s === 'IN_PROGRESS') return 'inprogress'
  return 'not_started'
}

export function useUserAttempts(userId: string | undefined) {
  const [attemptsMap, setAttemptsMap] = useState<Map<string, MockAttemptData>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    supabase
      .from('attempts')
      .select('assessment_id, attempt_number, is_free_attempt, status, score, updated_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        const rows = (data ?? []) as AttemptRow[]

        const grouped = new Map<string, AttemptRow[]>()
        for (const row of rows) {
          const existing = grouped.get(row.assessment_id) ?? []
          existing.push(row)
          grouped.set(row.assessment_id, existing)
        }

        const result = new Map<string, MockAttemptData>()
        for (const [assessmentId, attempts] of grouped) {
          const sorted = [...attempts].sort((a, b) => b.attempt_number - a.attempt_number)
          const latest = sorted[0]
          result.set(assessmentId, {
            attemptsUsed: attempts.length,
            status: toStatus(latest.status),
            isFreeAttempt: attempts.some((a) => a.is_free_attempt),
            lastAccessedAt: latest.updated_at ? new Date(latest.updated_at).getTime() : null,
            score: latest.score ?? undefined,
          })
        }

        setAttemptsMap(result)
        setLoading(false)
      })
  }, [userId])

  return { attemptsMap, loading }
}
