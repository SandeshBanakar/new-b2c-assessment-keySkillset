import { supabase } from '@/lib/supabase/client'

export type PlanRow = {
  id: string
  name: string
  price: number
  billing_cycle: string
  audience_type: string
  status: string
  created_at: string
  plan_subscribers: {
    subscriber_count: number
    mock_mrr: number
  } | null
}

export type PlanType = 'WHOLE_PLATFORM' | 'CATEGORY_BUNDLE'

export function derivePlanType(name: string): PlanType {
  return name.startsWith('All Exams') ? 'WHOLE_PLATFORM' : 'CATEGORY_BUNDLE'
}

export async function fetchPlans(): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(`
      id,
      name,
      price,
      billing_cycle,
      audience_type,
      status,
      created_at,
      plan_subscribers (
        subscriber_count,
        mock_mrr
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Supabase returns plan_subscribers as an array (one-to-one relation).
  // Normalise to a single object or null before returning.
  const normalised = (data ?? []).map((row) => ({
    ...row,
    plan_subscribers: Array.isArray(row.plan_subscribers)
      ? (row.plan_subscribers[0] ?? null)
      : row.plan_subscribers,
  }))

  return normalised as PlanRow[]
}
