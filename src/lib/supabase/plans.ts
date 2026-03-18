import { supabase } from '@/lib/supabase/client'

export type PlanRow = {
  id: string
  name: string
  price: number
  billing_cycle: string
  audience_type: string
  plan_audience: 'B2C' | 'B2B'
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
      plan_audience,
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
  plan_audience: 'B2C' | 'B2B'
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
      audience_type, plan_audience, status, scope, category,
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

// ─── Tenant contract helpers (FIX-SA-003-CONTRACT-PLAN) ──────────────────────

export type PublishedPlanOption = {
  id: string
  name: string
  price: number
  scope: string
}

export async function fetchPublishedPlans(): Promise<PublishedPlanOption[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, price, scope')
    .eq('status', 'PUBLISHED')
    .order('price', { ascending: true })
  if (error) throw new Error(error.message)
  return data as PublishedPlanOption[]
}

// ─── Tenant Content tab helpers (FIX-SA-003-CONTENT-V2) ──────────────────────

export type TenantPlanAssessment = {
  pcmId: string
  contentId: string
  title: string
  examType: string
  assessmentType: string
  status: string
}

export type TenantPlanSection = {
  planId: string
  planName: string
  assessments: TenantPlanAssessment[]
}

export async function fetchTenantPlansWithContent(
  tenantId: string
): Promise<TenantPlanSection[]> {
  // Step 1: plan IDs for this tenant
  const { data: tpmRows, error: tpmError } = await supabase
    .from('tenant_plan_map')
    .select('plan_id')
    .eq('tenant_id', tenantId)

  if (tpmError) throw new Error(tpmError.message)
  if (!tpmRows || tpmRows.length === 0) return []

  const planIds = (tpmRows as { plan_id: string }[]).map((r) => r.plan_id)

  // Step 2: plan names
  const { data: planRows, error: plansError } = await supabase
    .from('plans')
    .select('id, name')
    .in('id', planIds)

  if (plansError) throw new Error(plansError.message)

  const planNameMap = Object.fromEntries(
    (planRows as { id: string; name: string }[]).map((p) => [p.id, p.name])
  )

  // Step 3: assessment rows from plan_content_map
  const { data: pcmRows, error: pcmError } = await supabase
    .from('plan_content_map')
    .select('id, plan_id, content_id')
    .in('plan_id', planIds)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)

  const contentIds = (pcmRows as { content_id: string }[]).map((r) => r.content_id)

  // Step 4: content_items details
  let contentMap: Record<string, { title: string; exam_type: string; assessment_type: string; status: string }> = {}
  if (contentIds.length > 0) {
    const { data: ciRows, error: ciError } = await supabase
      .from('content_items')
      .select('id, title, exam_type, assessment_type, status')
      .in('id', contentIds)

    if (ciError) throw new Error(ciError.message)

    contentMap = Object.fromEntries(
      (ciRows as { id: string; title: string; exam_type: string; assessment_type: string; status: string }[])
        .map((c) => [c.id, c])
    )
  }

  // Step 5: build sections — detect duplicates across plans
  const contentIdToPlanCount: Record<string, number> = {}
  ;(pcmRows as { content_id: string }[]).forEach((r) => {
    contentIdToPlanCount[r.content_id] = (contentIdToPlanCount[r.content_id] ?? 0) + 1
  })

  return planIds.map((planId) => {
    const planAssessments: TenantPlanAssessment[] = (
      pcmRows as { id: string; plan_id: string; content_id: string }[]
    )
      .filter((r) => r.plan_id === planId)
      .map((r) => {
        const ci = contentMap[r.content_id]
        return {
          pcmId: r.id,
          contentId: r.content_id,
          title: ci?.title ?? '—',
          examType: ci?.exam_type ?? '—',
          assessmentType: ci?.assessment_type ?? '—',
          status: ci?.status ?? '—',
          inPlanCount: contentIdToPlanCount[r.content_id] ?? 1,
        }
      })

    return {
      planId,
      planName: planNameMap[planId] ?? 'Unknown Plan',
      assessments: planAssessments,
    }
  })
}

// ─── Plan Content tab helpers (manual model — KSS-SA-004) ────────────────────

export type PlanAssignedAssessment = {
  pcmId: string
  contentId: string
  title: string
  examType: string
  assessmentType: string
  status: string
}

export type PlanAssignedCourse = {
  pcmId: string
  contentId: string
  title: string
  courseType: string
  status: string
}

export async function fetchPlanAssignedAssessments(
  planId: string
): Promise<PlanAssignedAssessment[]> {
  const { data: pcmRows, error: pcmError } = await supabase
    .from('plan_content_map')
    .select('id, content_id')
    .eq('plan_id', planId)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)
  if (!pcmRows || pcmRows.length === 0) return []

  const contentIds = (pcmRows as { content_id: string }[]).map((r) => r.content_id)

  const { data: ciRows, error: ciError } = await supabase
    .from('content_items')
    .select('id, title, exam_type, assessment_type, status')
    .in('id', contentIds)

  if (ciError) throw new Error(ciError.message)

  const ciMap = Object.fromEntries(
    (ciRows as { id: string; title: string; exam_type: string; assessment_type: string; status: string }[])
      .map((c) => [c.id, c])
  )

  return (pcmRows as { id: string; content_id: string }[]).map((r) => {
    const ci = ciMap[r.content_id]
    return {
      pcmId: r.id,
      contentId: r.content_id,
      title: ci?.title ?? '—',
      examType: ci?.exam_type ?? '—',
      assessmentType: ci?.assessment_type ?? '—',
      status: ci?.status ?? '—',
    }
  })
}

export async function fetchPlanAssignedCourses(
  planId: string
): Promise<PlanAssignedCourse[]> {
  const { data: pcmRows, error: pcmError } = await supabase
    .from('plan_content_map')
    .select('id, content_id')
    .eq('plan_id', planId)
    .eq('content_type', 'COURSE')

  if (pcmError) throw new Error(pcmError.message)
  if (!pcmRows || pcmRows.length === 0) return []

  const contentIds = (pcmRows as { content_id: string }[]).map((r) => r.content_id)

  const { data: coRows, error: coError } = await supabase
    .from('courses')
    .select('id, title, course_type, status')
    .in('id', contentIds)

  if (coError) throw new Error(coError.message)

  const coMap = Object.fromEntries(
    (coRows as { id: string; title: string; course_type: string; status: string }[])
      .map((c) => [c.id, c])
  )

  return (pcmRows as { id: string; content_id: string }[]).map((r) => {
    const co = coMap[r.content_id]
    return {
      pcmId: r.id,
      contentId: r.content_id,
      title: co?.title ?? '—',
      courseType: co?.course_type ?? '—',
      status: co?.status ?? '—',
    }
  })
}

export async function fetchAvailableAssessmentsForPlan(
  planId: string,
  planAudience: 'B2C' | 'B2B' = 'B2C'
): Promise<{ id: string; title: string; examType: string; assessmentType: string; audienceType: string | null }[]> {
  const { data: existing } = await supabase
    .from('plan_content_map')
    .select('content_id')
    .eq('plan_id', planId)
    .eq('content_type', 'ASSESSMENT')

  const assignedIds = (existing as { content_id: string }[] | null ?? []).map((r) => r.content_id)

  // Audience gate: B2C plans show B2C_ONLY and BOTH content; B2B plans show B2B_ONLY and BOTH content
  const compatibleType = planAudience === 'B2C' ? 'B2C_ONLY' : 'B2B_ONLY'

  let query = supabase
    .from('content_items')
    .select('id, title, exam_type, assessment_type, audience_type')
    .eq('status', 'LIVE')
    .or(`audience_type.eq.${compatibleType},audience_type.eq.BOTH,audience_type.is.null`)

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as { id: string; title: string; exam_type: string; assessment_type: string; audience_type: string | null }[]).map(
    (a) => ({ id: a.id, title: a.title, examType: a.exam_type, assessmentType: a.assessment_type, audienceType: a.audience_type })
  )
}

export async function fetchAvailableCoursesForPlan(
  planId: string
): Promise<{ id: string; title: string; courseType: string }[]> {
  const { data: existing } = await supabase
    .from('plan_content_map')
    .select('content_id')
    .eq('plan_id', planId)
    .eq('content_type', 'COURSE')

  const assignedIds = (existing as { content_id: string }[] | null ?? []).map((r) => r.content_id)

  let query = supabase
    .from('courses')
    .select('id, title, course_type')
    .eq('status', 'LIVE')

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as { id: string; title: string; course_type: string }[]).map(
    (c) => ({ id: c.id, title: c.title, courseType: c.course_type })
  )
}

export async function addContentToPlan(
  planId: string,
  contentId: string,
  contentType: 'ASSESSMENT' | 'COURSE'
): Promise<void> {
  const { error } = await supabase
    .from('plan_content_map')
    .insert({ plan_id: planId, content_id: contentId, content_type: contentType })
  if (error) throw new Error(error.message)
}

export async function removeContentFromPlan(pcmId: string): Promise<void> {
  const { error } = await supabase
    .from('plan_content_map')
    .delete()
    .eq('id', pcmId)
  if (error) throw new Error(error.message)
}

// ─── Tenant Plans tab helpers (KSS-SA-004-ARCH) ───────────────────────────────

export type TenantAssignedPlan = {
  planId: string
  planName: string
  planAudience: 'B2C' | 'B2B'
  assessments: (TenantPlanAssessment & { inPlanCount: number })[]
}

export async function fetchTenantAssignedPlansWithContent(
  tenantId: string
): Promise<TenantAssignedPlan[]> {
  // Step 1: plan IDs + plan details for this tenant
  const { data: tpmRows, error: tpmError } = await supabase
    .from('tenant_plan_map')
    .select('plan_id')
    .eq('tenant_id', tenantId)

  if (tpmError) throw new Error(tpmError.message)
  if (!tpmRows || tpmRows.length === 0) return []

  const planIds = (tpmRows as { plan_id: string }[]).map((r) => r.plan_id)

  // Step 2: plan details
  const { data: planRows, error: plansError } = await supabase
    .from('plans')
    .select('id, name, plan_audience')
    .in('id', planIds)

  if (plansError) throw new Error(plansError.message)

  const planMap = Object.fromEntries(
    (planRows as { id: string; name: string; plan_audience: string }[]).map((p) => [p.id, p])
  )

  // Step 3: assessment content map rows
  const { data: pcmRows, error: pcmError } = await supabase
    .from('plan_content_map')
    .select('id, plan_id, content_id')
    .in('plan_id', planIds)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)

  const typedPcm = (pcmRows ?? []) as { id: string; plan_id: string; content_id: string }[]
  const contentIds = typedPcm.map((r) => r.content_id)

  // Step 4: content_items details
  let contentMap: Record<string, { title: string; exam_type: string; assessment_type: string; status: string }> = {}
  if (contentIds.length > 0) {
    const { data: ciRows, error: ciError } = await supabase
      .from('content_items')
      .select('id, title, exam_type, assessment_type, status')
      .in('id', contentIds)

    if (ciError) throw new Error(ciError.message)

    contentMap = Object.fromEntries(
      (ciRows as { id: string; title: string; exam_type: string; assessment_type: string; status: string }[])
        .map((c) => [c.id, c])
    )
  }

  // Step 5: detect duplicates (same content in multiple plans for this tenant)
  const contentIdToPlanCount: Record<string, number> = {}
  typedPcm.forEach((r) => {
    contentIdToPlanCount[r.content_id] = (contentIdToPlanCount[r.content_id] ?? 0) + 1
  })

  return planIds.map((planId) => {
    const plan = planMap[planId]
    const assessments = typedPcm
      .filter((r) => r.plan_id === planId)
      .map((r) => {
        const ci = contentMap[r.content_id]
        return {
          pcmId: r.id,
          contentId: r.content_id,
          title: ci?.title ?? '—',
          examType: ci?.exam_type ?? '—',
          assessmentType: ci?.assessment_type ?? '—',
          status: ci?.status ?? '—',
          inPlanCount: contentIdToPlanCount[r.content_id] ?? 1,
        }
      })

    return {
      planId,
      planName: plan?.name ?? 'Unknown Plan',
      planAudience: (plan?.plan_audience ?? 'B2B') as 'B2C' | 'B2B',
      assessments,
    }
  })
}

export type AvailableB2BPlan = {
  id: string
  name: string
}

export async function fetchAvailableB2BPlansForTenant(
  tenantId: string
): Promise<AvailableB2BPlan[]> {
  // Get plan IDs already assigned to this tenant
  const { data: assigned } = await supabase
    .from('tenant_plan_map')
    .select('plan_id')
    .eq('tenant_id', tenantId)

  const assignedIds = (assigned as { plan_id: string }[] | null ?? []).map((r) => r.plan_id)

  let query = supabase
    .from('plans')
    .select('id, name')
    .eq('plan_audience', 'B2B')

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data, error } = await query.order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data as AvailableB2BPlan[]
}

export async function assignPlanToTenant(
  tenantId: string,
  planId: string
): Promise<void> {
  const { error } = await supabase
    .from('tenant_plan_map')
    .insert({ tenant_id: tenantId, plan_id: planId })
  if (error) throw new Error(error.message)
}

export async function unassignPlanFromTenant(
  tenantId: string,
  planId: string
): Promise<void> {
  const { error } = await supabase
    .from('tenant_plan_map')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('plan_id', planId)
  if (error) throw new Error(error.message)
}

export async function fetchTenantCountForPlan(planId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tenant_plan_map')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId)
  if (error) return 0
  return count ?? 0
}
