'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { SupabaseAssessment } from '@/types/assessment'

export function useAssessments() {
  const [assessments, setAssessments] = useState<SupabaseAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('assessments')
      .select(
        'id, title, description, exam_type, assessment_type, subject, difficulty, duration_minutes, total_questions, min_tier, is_active, thumbnail_url, created_at, slug',
      )
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setAssessments((data ?? []) as unknown as SupabaseAssessment[])
        }
        setLoading(false)
      })
  }, [])

  return { assessments, loading, error }
}
