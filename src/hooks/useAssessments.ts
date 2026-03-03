'use client'
import type { SupabaseAssessment } from '@/types/assessment'
import ASSESSMENTS from '@/data/assessments'

export function useAssessments() {
  // Local data — no network call needed
  // Initialize with filtered active assessments
  const assessments: SupabaseAssessment[] = ASSESSMENTS.filter(a => a.is_active)

  // No loading needed for sync local data
  const loading = false
  const error = null

  return { assessments, loading, error }
}

// PRODUCTION NOTE:
// When ready for production, swap this hook body with:
// import { useState, useEffect } from 'react'
// const [assessments, setAssessments] = useState<SupabaseAssessment[]>(() => [])
// const [loading, setLoading] = useState(true)
// const [error, setError] = useState<string | null>(null)
// useEffect(() => {
//   const supabase = createClient()
//   const { data, error } = await supabase
//     .from('assessments').select('*').eq('is_active', true)
//   if (error) {
//     setError(error.message)
//   } else {
//     setAssessments(data ?? [])
//   }
//   setLoading(false)
// }, [])
// The rest of the codebase stays identical.
