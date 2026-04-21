'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface ExamCategory {
  id: string
  name: string
  display_name: string
  slug: string
  description: string | null
  display_order: number
  is_active: boolean
}

export function useExamCategories({ activeOnly = false }: { activeOnly?: boolean } = {}) {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase
      .from('exam_categories')
      .select('id, name, display_name, slug, description, display_order, is_active')
      .order('display_order', { ascending: true })
    if (activeOnly) query = query.eq('is_active', true)
    query.then(({ data }) => {
      setCategories((data ?? []) as ExamCategory[])
      setLoading(false)
    })
  }, [activeOnly])

  return { categories, loading }
}
