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

// ─── Write helpers (KSS-SA-004-B) ────────────────────────────────────────────

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

// ─── Detail page types + helpers (KSS-SA-004-C) ──────────────────────────────

export type PlanDetail = PlanRow & {
  scope: string
  category: string | null
  max_attempts_per_assessment: number
  description: string
}

export type PlanAuditEntry = {
  id: string
  action: string
  actor_email: string
  metadata: Record<string, string> | null
  created_at: string
}

export type PlanContentItem = {
  id: string
  title: string
  exam_type: string
  assessment_type: string
  is_active: boolean
  include_mode: 'AUTO' | 'MANUAL'
  excluded: boolean
}

export async function fetchPlanById(id: string): Promise<PlanDetail> {
  const { data, error } = await supabase
    .from('plans')
    .select(`
      id, name, description, price, billing_cycle,
      audience_type, status, scope, category,
      max_attempts_per_assessment, created_at,
      plan_subscribers (subscriber_count, mock_mrr)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  const row = data as PlanDetail & {
    plan_subscribers:
      | { subscriber_count: number; mock_mrr: number }[]
      | { subscriber_count: number; mock_mrr: number }
      | null
  }

  return {
    ...row,
    plan_subscribers: Array.isArray(row.plan_subscribers)
      ? (row.plan_subscribers[0] ?? null)
      : row.plan_subscribers,
  } as PlanDetail
}

export async function fetchPlanAuditLogs(
  planId: string
): Promise<PlanAuditEntry[]> {
  const { data, error } = await supabase
    .from('plan_audit_logs')
    .select('id, action, actor_email, metadata, created_at')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as PlanAuditEntry[]
}

export async function fetchAllAssessmentsForPlan(): Promise<
  Omit<PlanContentItem, 'include_mode' | 'excluded'>[]
> {
  const { data, error } = await supabase
    .from('assessments')
    .select('id, title, exam_type, assessment_type, is_active')
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Omit<PlanContentItem, 'include_mode' | 'excluded'>[]
}

export async function updatePlan(
  id: string,
  fields: Partial<Omit<CreatePlanPayload, 'status'>> & {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  }
): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .update(fields)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function writePlanAuditLog(
  planId: string,
  action: string,
  metadata?: Record<string, string>
): Promise<void> {
  const { error } = await supabase
    .from('plan_audit_logs')
    .insert({
      plan_id:     planId,
      action,
      actor_email: 'admin@keyskillset.com',
      metadata:    metadata ?? null,
    })

  if (error) throw new Error(error.message)
}
