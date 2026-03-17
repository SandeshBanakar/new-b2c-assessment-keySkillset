import { supabase } from '@/lib/supabase/client'

export type CreatePlanPayload = {
  name: string
  description: string
  price: number
  billing_cycle: string
  status: 'DRAFT' | 'PUBLISHED'
  max_attempts_per_assessment: number
  allowed_assessment_types: string[]
  scope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
  category: string | null
  // null when scope = PLATFORM_WIDE
}

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

export async function createPlan(
  payload: CreatePlanPayload
): Promise<string> {
  // Returns the new plan UUID
  const { data, error } = await supabase
    .from('plans')
    .insert({
      name:                          payload.name,
      description:                   payload.description,
      audience_type:                 'B2C',
      // hardcoded — B2B plans via Contracts in V2
      price:                         payload.price,
      billing_cycle:                 payload.billing_cycle,
      status:                        payload.status,
      max_attempts_per_assessment:   payload.max_attempts_per_assessment,
      scope:                         payload.scope,
      category:                      payload.category,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function assignContentToPlan(
  planId: string,
  contentItemIds: string[]
): Promise<void> {
  if (contentItemIds.length === 0) return

  const rows = contentItemIds.map((contentItemId) => ({
    plan_id:      planId,
    content_id:   contentItemId,
    content_type: 'ASSESSMENT' as const,
  }))

  const { error } = await supabase
    .from('plan_content_map')
    .insert(rows)

  if (error) throw new Error(error.message)
}

export async function fetchLiveAssessments(): Promise<
  { id: string; title: string; exam_type: string; assessment_type: string }[]
> {
  const { data, error } = await supabase
    .from('assessments')
    .select('id, title, exam_type, assessment_type')
    .eq('is_active', true)
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return data as { id: string; title: string; exam_type: string; assessment_type: string }[]
}
