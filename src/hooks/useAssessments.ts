'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseAssessment } from '@/types/assessment';

export function useAssessments() {
  const [assessments, setAssessments] = useState<SupabaseAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessments() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true)
        .order('exam_type', { ascending: true });

      if (error) {
        setError(error.message);
        console.error('useAssessments error:', error);
      } else {
        setAssessments(data ?? []);
      }
      setLoading(false);
    }
    fetchAssessments();
  }, []);

  return { assessments, loading, error };
}
