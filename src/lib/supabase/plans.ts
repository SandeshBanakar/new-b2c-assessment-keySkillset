import { supabase } from '@/lib/supabase/client'

export type PlanRow = {
  id: string
  name: string
  display_name: string | null
  description: string | null
  price: number
  billing_cycle: string
  audience_type: string
  plan_audience: 'B2C' | 'B2B'
  plan_category: 'ASSESSMENT' | 'COURSE_BUNDLE'
  status: string
  scope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
  tier: 'BASIC' | 'PRO' | 'PREMIUM' | 'ENTERPRISE' | null
  feature_bullets: string[]
  category: string | null
  max_attempts_per_assessment: number
  tagline: string | null
  footnote: string | null
  is_popular: boolean
  cta_label: string | null
  allowed_assessment_types: string[]
  created_at: string
  plan_subscribers: {
    subscriber_count: number
  } | null
}

// Matches DB scope column values exactly — PLATFORM_WIDE not WHOLE_PLATFORM
export type PlanType = 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'

// Uses actual DB scope column — never name heuristics
export function derivePlanType(scope: string): PlanType {
  return scope === 'PLATFORM_WIDE' ? 'PLATFORM_WIDE' : 'CATEGORY_BUNDLE'
}

export async function fetchPlans(): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(`
      id,
      name,
      display_name,
      description,
      price,
      billing_cycle,
      audience_type,
      plan_audience,
      status,
      scope,
      tier,
      feature_bullets,
      category,
      max_attempts_per_assessment,
      tagline,
      footnote,
      is_popular,
      cta_label,
      created_at,
      plan_category,
      plan_subscribers (
        subscriber_count
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Supabase returns plan_subscribers as an array (one-to-one relation).
  // Normalise to a single object or null before returning.
  // allowed_assessment_types is not a DB column — default to [] client-side.
  const normalised = (data ?? []).map((row) => ({
    ...row,
    plan_category: ((row as {plan_category?: string}).plan_category ?? 'ASSESSMENT') as 'ASSESSMENT' | 'COURSE_BUNDLE',
    allowed_assessment_types: [],
    plan_subscribers: Array.isArray(row.plan_subscribers)
      ? (row.plan_subscribers[0] ?? null)
      : row.plan_subscribers,
  }))

  return normalised as PlanRow[]
}

// ─── Write helpers (KSS-SA-004-B) ────────────────────────────────────────────

export type CreatePlanPayload = {
  name: string
  display_name: string | null
  description: string | null
  tagline: string | null
  is_popular: boolean
  cta_label: string | null
  price: number
  billing_cycle: string
  status: 'DRAFT' | 'PUBLISHED'
  max_attempts_per_assessment: number
  // allowed_assessment_types is not a DB column — UI-only, not persisted
  scope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
  category: string | null
  feature_bullets: string[]
  footnote: string | null
  plan_audience: 'B2C' | 'B2B'
}

export async function createPlan(
  payload: CreatePlanPayload
): Promise<string> {
  // Returns the new plan UUID
  const { data, error } = await supabase
    .from('plans')
    .insert({
      name:                          payload.name,
      display_name:                  payload.display_name,
      description:                   payload.description,
      tagline:                       payload.tagline,
      is_popular:                    payload.is_popular,
      cta_label:                     payload.cta_label,
      audience_type:                 'B2C', // legacy column — keep default
      plan_audience:                 payload.plan_audience,
      price:                         payload.price,
      billing_cycle:                 payload.billing_cycle,
      status:                        payload.status,
      max_attempts_per_assessment:   payload.max_attempts_per_assessment,
      scope:                         payload.scope,
      category:                      payload.category,
      feature_bullets:               payload.feature_bullets,
      footnote:                      payload.footnote,
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
    plan_id:          planId,
    content_item_id:  contentItemId,
    content_type:     'ASSESSMENT' as const,
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
  description: string
  tagline: string | null
  footnote: string | null
  is_popular: boolean
  cta_label: string | null
  allowed_assessment_types: string[]
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
      id, name, display_name, description, price, billing_cycle,
      audience_type, plan_audience, plan_category, status, scope, tier, category,
      max_attempts_per_assessment, feature_bullets,
      tagline, footnote, is_popular, cta_label,
      created_at,
      plan_subscribers (subscriber_count)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  const row = data as PlanDetail & {
    plan_subscribers:
      | { subscriber_count: number }[]
      | { subscriber_count: number }
      | null
  }

  return {
    ...row,
    plan_category: ((row as {plan_category?: string}).plan_category ?? 'ASSESSMENT') as 'ASSESSMENT' | 'COURSE_BUNDLE',
    // allowed_assessment_types is not a DB column — default to [] client-side
    allowed_assessment_types: [],
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
    .select('id, plan_id, content_item_id')
    .in('plan_id', planIds)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)

  const contentIds = (pcmRows as { content_item_id: string }[]).map((r) => r.content_item_id)

  // Step 4: content_items details (DB columns: test_type, exam_category_id — no exam_type/assessment_type)
  let contentMap: Record<string, { title: string; test_type: string; status: string }> = {}
  if (contentIds.length > 0) {
    const { data: ciRows, error: ciError } = await supabase
      .from('content_items')
      .select('id, title, test_type, status')
      .in('id', contentIds)

    if (ciError) throw new Error(ciError.message)

    contentMap = Object.fromEntries(
      (ciRows as { id: string; title: string; test_type: string; status: string }[])
        .map((c) => [c.id, c])
    )
  }

  // Step 5: build sections — detect duplicates across plans
  const contentIdToPlanCount: Record<string, number> = {}
  ;(pcmRows as { content_item_id: string }[]).forEach((r) => {
    contentIdToPlanCount[r.content_item_id] = (contentIdToPlanCount[r.content_item_id] ?? 0) + 1
  })

  return planIds.map((planId) => {
    const planAssessments: TenantPlanAssessment[] = (
      pcmRows as { id: string; plan_id: string; content_item_id: string }[]
    )
      .filter((r) => r.plan_id === planId)
      .map((r) => {
        const ci = contentMap[r.content_item_id]
        return {
          pcmId: r.id,
          contentId: r.content_item_id,
          title: ci?.title ?? '—',
          examType: '—',
          assessmentType: ci?.test_type ?? '—',
          status: ci?.status ?? '—',
          inPlanCount: contentIdToPlanCount[r.content_item_id] ?? 1,
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
  planCount: number   // how many plans platform-wide contain this item
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
    .select('id, content_item_id')
    .eq('plan_id', planId)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)
  if (!pcmRows || pcmRows.length === 0) return []

  const contentIds = (pcmRows as { content_item_id: string }[]).map((r) => r.content_item_id)

  // DB columns: test_type (not assessment_type), exam_category_id UUID FK (not exam_type string)
  const { data: ciRows, error: ciError } = await supabase
    .from('content_items')
    .select('id, title, test_type, status')
    .in('id', contentIds)

  if (ciError) throw new Error(ciError.message)

  const ciMap = Object.fromEntries(
    (ciRows as { id: string; title: string; test_type: string; status: string }[])
      .map((c) => [c.id, c])
  )

  // Platform-wide plan count per content item (for duplicate badge)
  const { data: countRows } = await supabase
    .from('plan_content_map')
    .select('content_item_id')
    .in('content_item_id', contentIds)
    .eq('content_type', 'ASSESSMENT')

  const planCountMap: Record<string, number> = {}
  ;(countRows as { content_item_id: string }[] ?? []).forEach((r) => {
    planCountMap[r.content_item_id] = (planCountMap[r.content_item_id] ?? 0) + 1
  })

  return (pcmRows as { id: string; content_item_id: string }[]).map((r) => {
    const ci = ciMap[r.content_item_id]
    return {
      pcmId: r.id,
      contentId: r.content_item_id,
      title: ci?.title ?? '—',
      examType: '—',
      assessmentType: ci?.test_type ?? '—',
      status: ci?.status ?? '—',
      planCount: planCountMap[r.content_item_id] ?? 1,
    }
  })
}

export async function fetchPlanAssignedCourses(
  planId: string
): Promise<PlanAssignedCourse[]> {
  const { data: pcmRows, error: pcmError } = await supabase
    .from('plan_content_map')
    .select('id, content_item_id')
    .eq('plan_id', planId)
    .eq('content_type', 'COURSE')

  if (pcmError) throw new Error(pcmError.message)
  if (!pcmRows || pcmRows.length === 0) return []

  const contentIds = (pcmRows as { content_item_id: string }[]).map((r) => r.content_item_id)

  const { data: coRows, error: coError } = await supabase
    .from('courses')
    .select('id, title, course_type, status')
    .in('id', contentIds)

  if (coError) throw new Error(coError.message)

  const coMap = Object.fromEntries(
    (coRows as { id: string; title: string; course_type: string; status: string }[])
      .map((c) => [c.id, c])
  )

  return (pcmRows as { id: string; content_item_id: string }[]).map((r) => {
    const co = coMap[r.content_item_id]
    return {
      pcmId: r.id,
      contentId: r.content_item_id,
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
    .select('content_item_id')
    .eq('plan_id', planId)
    .eq('content_type', 'ASSESSMENT')

  const assignedIds = (existing as { content_item_id: string }[] | null ?? []).map((r) => r.content_item_id)

  // Audience gate: B2C plans show B2C_ONLY and BOTH content; B2B plans show B2B_ONLY and BOTH content
  const compatibleType = planAudience === 'B2C' ? 'B2C_ONLY' : 'B2B_ONLY'

  // DB columns: test_type (not assessment_type) — exam_category_id is UUID FK, not returned as string
  let query = supabase
    .from('content_items')
    .select('id, title, test_type, audience_type')
    .eq('status', 'LIVE')
    .or(`audience_type.eq.${compatibleType},audience_type.eq.BOTH,audience_type.is.null`)

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as { id: string; title: string; test_type: string; audience_type: string | null }[]).map(
    (a) => ({ id: a.id, title: a.title, examType: '—', assessmentType: a.test_type, audienceType: a.audience_type })
  )
}

export async function fetchAvailableCoursesForPlan(
  planId: string,
  planAudience: 'B2C' | 'B2B' = 'B2C'
): Promise<{ id: string; title: string; courseType: string; isIndividuallyPurchasable: boolean }[]> {
  const { data: existing } = await supabase
    .from('plan_content_map')
    .select('content_item_id')
    .eq('plan_id', planId)
    .eq('content_type', 'COURSE')

  const assignedIds = (existing as { content_item_id: string }[] | null ?? []).map((r) => r.content_item_id)

  // Audience gate: B2C plans show B2C_ONLY and BOTH; B2B plans show B2B_ONLY and BOTH
  const audienceFilter = planAudience === 'B2B'
    ? 'audience_type.eq.B2B_ONLY,audience_type.eq.BOTH'
    : 'audience_type.eq.B2C_ONLY,audience_type.eq.BOTH'

  let query = supabase
    .from('courses')
    .select('id, title, course_type, is_individually_purchasable')
    .eq('status', 'LIVE')
    .or(audienceFilter)

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data as { id: string; title: string; course_type: string; is_individually_purchasable: boolean }[]).map(
    (c) => ({ id: c.id, title: c.title, courseType: c.course_type, isIndividuallyPurchasable: c.is_individually_purchasable })
  )
}

// ─── Helpers for pre-creation content selection (plan ID doesn't exist yet) ───

export async function fetchAllLiveB2BAssessments(): Promise<
  { id: string; title: string; assessmentType: string }[]
> {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, test_type')
    .eq('status', 'LIVE')
    .or('audience_type.eq.B2B_ONLY,audience_type.eq.BOTH')
    .order('title', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as { id: string; title: string; test_type: string }[]).map(
    (a) => ({ id: a.id, title: a.title, assessmentType: a.test_type })
  )
}

export async function fetchAllLiveB2BCourses(): Promise<
  { id: string; title: string; courseType: string }[]
> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, course_type')
    .eq('status', 'LIVE')
    .eq('is_individually_purchasable', false)
    .or('audience_type.eq.B2B_ONLY,audience_type.eq.BOTH')
    .order('title', { ascending: true })
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
    .insert({ plan_id: planId, content_item_id: contentId, content_type: contentType })
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

export type TenantAssignedCourse = {
  pcmId: string
  contentId: string
  title: string
  courseType: string
  status: string
}

export type TenantAssignedPlan = {
  planId: string
  planName: string
  planAudience: 'B2C' | 'B2B'
  assessments: (TenantPlanAssessment & { inPlanCount: number })[]
  courses: TenantAssignedCourse[]
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
    .select('id, plan_id, content_item_id')
    .in('plan_id', planIds)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)

  const typedPcm = (pcmRows ?? []) as { id: string; plan_id: string; content_item_id: string }[]
  const contentIds = typedPcm.map((r) => r.content_item_id)

  // Step 4: content_items details (DB columns: test_type, exam_category_id UUID FK)
  let contentMap: Record<string, { title: string; test_type: string; status: string }> = {}
  if (contentIds.length > 0) {
    const { data: ciRows, error: ciError } = await supabase
      .from('content_items')
      .select('id, title, test_type, status')
      .in('id', contentIds)

    if (ciError) throw new Error(ciError.message)

    contentMap = Object.fromEntries(
      (ciRows as { id: string; title: string; test_type: string; status: string }[])
        .map((c) => [c.id, c])
    )
  }

  // Step 5: detect duplicates (same content in multiple plans for this tenant)
  const contentIdToPlanCount: Record<string, number> = {}
  typedPcm.forEach((r) => {
    contentIdToPlanCount[r.content_item_id] = (contentIdToPlanCount[r.content_item_id] ?? 0) + 1
  })

  // Step 6: course content map rows
  const { data: coursePcmRows, error: coursePcmError } = await supabase
    .from('plan_content_map')
    .select('id, plan_id, content_item_id')
    .in('plan_id', planIds)
    .eq('content_type', 'COURSE')

  if (coursePcmError) throw new Error(coursePcmError.message)

  const typedCoursePcm = (coursePcmRows ?? []) as { id: string; plan_id: string; content_item_id: string }[]
  const courseContentIds = typedCoursePcm.map((r) => r.content_item_id)

  // Step 7: courses table details
  let courseMap: Record<string, { title: string; course_type: string; status: string }> = {}
  if (courseContentIds.length > 0) {
    const { data: coRows, error: coError } = await supabase
      .from('courses')
      .select('id, title, course_type, status')
      .in('id', courseContentIds)

    if (coError) throw new Error(coError.message)

    courseMap = Object.fromEntries(
      (coRows as { id: string; title: string; course_type: string; status: string }[])
        .map((c) => [c.id, c])
    )
  }

  return planIds.map((planId) => {
    const plan = planMap[planId]

    const assessments = typedPcm
      .filter((r) => r.plan_id === planId)
      .map((r) => {
        const ci = contentMap[r.content_item_id]
        return {
          pcmId: r.id,
          contentId: r.content_item_id,
          title: ci?.title ?? '—',
          examType: '—',
          assessmentType: ci?.test_type ?? '—',
          status: ci?.status ?? '—',
          inPlanCount: contentIdToPlanCount[r.content_item_id] ?? 1,
        }
      })

    const courses = typedCoursePcm
      .filter((r) => r.plan_id === planId)
      .map((r) => {
        const co = courseMap[r.content_item_id]
        return {
          pcmId: r.id,
          contentId: r.content_item_id,
          title: co?.title ?? '—',
          courseType: co?.course_type ?? '—',
          status: co?.status ?? '—',
        }
      })

    return {
      planId,
      planName: plan?.name ?? 'Unknown Plan',
      planAudience: (plan?.plan_audience ?? 'B2B') as 'B2C' | 'B2B',
      assessments,
      courses,
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
  // Fetch all B2B plans
  const { data: allPlans, error: plansError } = await supabase
    .from('plans')
    .select('id, name')
    .eq('plan_audience', 'B2B')
    .order('name', { ascending: true })
  if (plansError) throw new Error(plansError.message)

  // Fetch plan IDs already assigned to this tenant
  const { data: assigned } = await supabase
    .from('tenant_plan_map')
    .select('plan_id')
    .eq('tenant_id', tenantId)

  const assignedIds = new Set(
    (assigned as { plan_id: string }[] | null ?? []).map((r) => r.plan_id)
  )

  // Filter in JS — avoids PostgREST NOT IN syntax issues with UUIDs
  return (allPlans as AvailableB2BPlan[]).filter((p) => !assignedIds.has(p.id))
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

// ─── B2B plan create helper (KSS-SA-004) ─────────────────────────────────────

export type CreateB2BPlanPayload = {
  name: string
  description: string
  max_attempts_per_assessment: number
  status: 'DRAFT' | 'PUBLISHED'
}

export async function createB2BPlan(payload: CreateB2BPlanPayload): Promise<string> {
  const { data, error } = await supabase
    .from('plans')
    .insert({
      name:                        payload.name,
      description:                 payload.description,
      price:                       0,
      plan_audience:               'B2B',
      audience_type:               'B2C', // legacy column — keep default
      scope:                       'PLATFORM_WIDE',
      status:                      payload.status,
      max_attempts_per_assessment: payload.max_attempts_per_assessment,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

// ─── Tab 2: Course Pricing helpers (KSS-SA-004) ───────────────────────────────

export type CoursePricingRow = {
  id: string
  title: string
  course_type: string
  status: string
  audience_type: string | null
  price: number | null
  is_individually_purchasable: boolean
  stripe_price_id: string | null
}

export async function fetchB2CCoursesForPricing(): Promise<CoursePricingRow[]> {
  // Tab 2: LIVE courses with B2C_ONLY or BOTH audience_type only
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, course_type, status, audience_type, price, is_individually_purchasable, stripe_price_id')
    .eq('status', 'LIVE')
    .or('audience_type.eq.B2C_ONLY,audience_type.eq.BOTH')
    .order('title', { ascending: true })
  if (error) throw new Error(error.message)
  return data as CoursePricingRow[]
}

export type UpdateCoursePricingPayload = {
  price: number | null
  is_individually_purchasable: boolean
  stripe_price_id: string | null
}

export async function updateCoursePricing(
  courseId: string,
  payload: UpdateCoursePricingPayload
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({
      price:                       payload.price,
      is_individually_purchasable: payload.is_individually_purchasable,
      stripe_price_id:             payload.stripe_price_id,
    })
    .eq('id', courseId)
  if (error) throw new Error(error.message)
}

// ─── B2B card grid helper (KSS-SA-004) ───────────────────────────────────────

export type B2BPlanCard = {
  id: string
  name: string
  status: string
  tenant_count: number
  content_count: number
}

export async function fetchB2BPlansForGrid(): Promise<B2BPlanCard[]> {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, status')
    .eq('plan_audience', 'B2B')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)

  const planList = (plans ?? []) as { id: string; name: string; status: string }[]
  if (planList.length === 0) return []

  const planIds = planList.map((p) => p.id)

  // Tenant counts
  const { data: tpmRows } = await supabase
    .from('tenant_plan_map')
    .select('plan_id')
    .in('plan_id', planIds)
  const tenantCountMap: Record<string, number> = {}
  ;(tpmRows ?? []).forEach((r: { plan_id: string }) => {
    tenantCountMap[r.plan_id] = (tenantCountMap[r.plan_id] ?? 0) + 1
  })

  // Content counts
  const { data: pcmRows } = await supabase
    .from('plan_content_map')
    .select('plan_id')
    .in('plan_id', planIds)
  const contentCountMap: Record<string, number> = {}
  ;(pcmRows ?? []).forEach((r: { plan_id: string }) => {
    contentCountMap[r.plan_id] = (contentCountMap[r.plan_id] ?? 0) + 1
  })

  return planList.map((p) => ({
    id:            p.id,
    name:          p.name,
    status:        p.status,
    tenant_count:  tenantCountMap[p.id] ?? 0,
    content_count: contentCountMap[p.id] ?? 0,
  }))
}

// ─── Course Bundle Plans (KSS-DB-SA-004) ─────────────────────────────────────

export type CourseBundlePlanRow = {
  id: string
  name: string
  display_name: string | null
  price: number
  status: string
  course_count: number
}

export async function fetchCourseBundlePlans(): Promise<CourseBundlePlanRow[]> {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, display_name, price, status')
    .eq('plan_audience', 'B2C')
    .eq('plan_category', 'COURSE_BUNDLE')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const planList = (plans ?? []) as { id: string; name: string; display_name: string | null; price: number; status: string }[]
  if (planList.length === 0) return []

  const planIds = planList.map((p) => p.id)
  const { data: pcmRows } = await supabase
    .from('plan_content_map')
    .select('plan_id')
    .in('plan_id', planIds)
  const countMap: Record<string, number> = {}
  ;(pcmRows ?? []).forEach((r: { plan_id: string }) => {
    countMap[r.plan_id] = (countMap[r.plan_id] ?? 0) + 1
  })

  return planList.map((p) => ({
    id:           p.id,
    name:         p.name,
    display_name: p.display_name,
    price:        p.price,
    status:       p.status,
    course_count: countMap[p.id] ?? 0,
  }))
}

export type CreateCourseBundlePlanPayload = {
  name: string
  display_name: string | null
  description: string | null
  tagline: string | null
  price: number
  billing_cycle: 'ANNUAL' | 'MONTHLY'
  feature_bullets: string[]
  stripe_price_id: string | null
  status: 'DRAFT' | 'PUBLISHED'
}

export async function createCourseBundlePlan(
  payload: CreateCourseBundlePlanPayload
): Promise<string> {
  const { data, error } = await supabase
    .from('plans')
    .insert({
      name:            payload.name,
      display_name:    payload.display_name,
      description:     payload.description,
      tagline:         payload.tagline,
      price:           payload.price,
      billing_cycle:   payload.billing_cycle,
      feature_bullets: payload.feature_bullets,
      plan_audience:   'B2C',
      audience_type:   'B2C', // legacy column — keep default
      plan_category:   'COURSE_BUNDLE',
      scope:           'PLATFORM_WIDE',
      status:          payload.status,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

// B2C course picker for course bundle plan creation
// Returns LIVE B2C courses (B2C_ONLY or BOTH) with purchasable flag
export type B2CCourseBundlePickerItem = {
  id: string
  title: string
  courseType: string
  isIndividuallyPurchasable: boolean
}

export async function fetchAllLiveB2CCoursesForBundle(): Promise<B2CCourseBundlePickerItem[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, course_type, is_individually_purchasable')
    .eq('status', 'LIVE')
    .or('audience_type.eq.B2C_ONLY,audience_type.eq.BOTH')
    .order('title', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as { id: string; title: string; course_type: string; is_individually_purchasable: boolean }[]).map(
    (c) => ({
      id:                        c.id,
      title:                     c.title,
      courseType:                c.course_type,
      isIndividuallyPurchasable: c.is_individually_purchasable,
    })
  )
}

// ─── Content plan usage modal (duplicate badge) ────────────────────────────────

export type PlanUsageItem = {
  pcmId: string
  planId: string
  planName: string
  planAudience: 'B2C' | 'B2B'
  planStatus: string
}

export async function fetchPlansContainingContent(
  contentId: string,
  tenantId?: string
): Promise<PlanUsageItem[]> {
  // Step 1: all plan_content_map rows for this content item
  const { data: pcmRows, error: pcmError } = await supabase
    .from('plan_content_map')
    .select('id, plan_id')
    .eq('content_item_id', contentId)
    .eq('content_type', 'ASSESSMENT')

  if (pcmError) throw new Error(pcmError.message)
  if (!pcmRows || pcmRows.length === 0) return []

  const typed = (pcmRows as { id: string; plan_id: string }[])
  let planIds = typed.map((r) => r.plan_id)

  // Step 2: if tenantId provided, scope to that tenant's plans only
  if (tenantId) {
    const { data: tpmRows } = await supabase
      .from('tenant_plan_map')
      .select('plan_id')
      .eq('tenant_id', tenantId)

    const tenantPlanSet = new Set(
      (tpmRows as { plan_id: string }[] ?? []).map((r) => r.plan_id)
    )
    planIds = planIds.filter((id) => tenantPlanSet.has(id))
  }

  if (planIds.length === 0) return []

  // Step 3: plan details
  const { data: planRows, error: planError } = await supabase
    .from('plans')
    .select('id, name, plan_audience, status')
    .in('id', planIds)

  if (planError) throw new Error(planError.message)

  const planMap = Object.fromEntries(
    (planRows as { id: string; name: string; plan_audience: string; status: string }[])
      .map((p) => [p.id, p])
  )

  return typed
    .filter((r) => planIds.includes(r.plan_id))
    .map((r) => {
      const plan = planMap[r.plan_id]
      return {
        pcmId: r.id,
        planId: r.plan_id,
        planName: plan?.name ?? 'Unknown Plan',
        planAudience: (plan?.plan_audience ?? 'B2B') as 'B2C' | 'B2B',
        planStatus: plan?.status ?? '—',
      }
    })
}
