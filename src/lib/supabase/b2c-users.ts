import { supabase } from '@/lib/supabase/client'

export type DisplayStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type B2CUser = {
  id: string
  email: string
  displayName: string | null
  subscriptionTier: string
  subscriptionStatus: string
  stripeSubscriptionId: string | null
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  status: 'ACTIVE' | 'SUSPENDED'
  lastActiveDate: string | null
  createdAt: string
  // suspension audit fields
  suspensionReason: string | null
  suspendedAt: string | null
  suspendedByName: string | null
  unsuspendReason: string | null
  unsuspendedAt: string | null
  // computed
  displayStatus: DisplayStatus
  courseCount: number
  // active assessment plan (null = no active plan)
  activePlanLabel: string | null
  activePlanScope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE' | null
}

export type UserCourseProgress = {
  id: string
  courseId: string
  courseTitle: string
  courseType: string | null
  status: 'IN_PROGRESS' | 'COMPLETED'
  progressPct: number
  startedAt: string
  completedAt: string | null
}

// ─── Subscription Types ───────────────────────────────────────────────────────

export type AssessmentSubscription = {
  id: string
  userId: string
  planId: string | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  productName: string
  priceUsd: number | null
  currency: string
  billingInterval: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  endedAt: string | null
  createdAt: string
  maxAttempts: number | null  // from plans.max_attempts_per_assessment; null if plan retired
}

export type CourseSubscription = {
  id: string
  userId: string
  planId: string | null
  courseId: string | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  productName: string
  priceUsd: number | null
  currency: string
  billingInterval: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  endedAt: string | null
  createdAt: string
}

// ─── Plan Assessment Types ────────────────────────────────────────────────────

export type PlanAssessmentRow = {
  assessmentId: string
  title: string
  category: string
  attemptsUsed: number
  bestAccuracy: number | null  // null = never attempted or no accuracy data
  lastAttempted: string | null
}

export type AttemptRow = {
  id: string
  attemptNumber: number
  accuracyPercent: number | null
  correctCount: number | null
  totalQuestions: number | null
  timeSpentSeconds: number | null
  completedAt: string | null
}

export type B2CCertificate = {
  certificateNumber: string
  issuedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INACTIVE_THRESHOLD_DAYS = 30

export function computeDisplayStatus(
  status: 'ACTIVE' | 'SUSPENDED',
  lastActiveDate: string | null,
): DisplayStatus {
  if (status === 'SUSPENDED') return 'SUSPENDED'
  if (!lastActiveDate) return 'INACTIVE'
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - INACTIVE_THRESHOLD_DAYS)
  return new Date(lastActiveDate) < threshold ? 'INACTIVE' : 'ACTIVE'
}

// ─── User Fetchers ────────────────────────────────────────────────────────────

export async function fetchB2CUsers(): Promise<B2CUser[]> {
  const now = new Date().toISOString()

  const [{ data, error }, { data: activeSubs }, { data: progress }, { data: assessSubs }] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, display_name, subscription_tier, subscription_status, stripe_subscription_id, subscription_start_date, subscription_end_date, status, last_active_date, created_at')
      .order('created_at', { ascending: false }),
    // Active course entitlement
    supabase
      .from('b2c_course_subscriptions')
      .select('user_id, course_id')
      .in('status', ['active', 'trialing'])
      .gt('current_period_end', now)
      .not('course_id', 'is', null),
    // Course engagement
    supabase
      .from('b2c_course_progress')
      .select('user_id, course_id'),
    // Active assessment subscriptions — most recent per user resolved in JS below
    supabase
      .from('b2c_assessment_subscriptions')
      .select('user_id, plan_id, status, current_period_end, created_at')
      .eq('status', 'active')
      .gt('current_period_end', now)
      .order('created_at', { ascending: false }),
  ])

  if (error) throw new Error(error.message)

  // Resolve plan details for active assessment subs
  const activePlanMap = new Map<string, { planId: string }>()
  for (const s of (assessSubs ?? [])) {
    if (!activePlanMap.has(s.user_id) && s.plan_id) {
      activePlanMap.set(s.user_id, { planId: s.plan_id })
    }
  }

  const uniquePlanIds = [...new Set([...activePlanMap.values()].map((v) => v.planId))]
  const planDetails = new Map<string, { scope: string; tier: string; category: string | null; display_name: string }>()
  if (uniquePlanIds.length > 0) {
    const { data: plans } = await supabase
      .from('plans')
      .select('id, scope, tier, category, display_name')
      .in('id', uniquePlanIds)
    for (const p of (plans ?? [])) {
      planDetails.set(p.id, { scope: p.scope, tier: p.tier, category: p.category ?? null, display_name: p.display_name })
    }
  }

  // Build user → plan label map
  const planLabelMap = new Map<string, { label: string; scope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE' }>()
  for (const [userId, { planId }] of activePlanMap.entries()) {
    const plan = planDetails.get(planId)
    if (!plan) continue
    const scope = plan.scope as 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
    const label = scope === 'CATEGORY_BUNDLE' && plan.category
      ? `${plan.category} ${plan.tier}`
      : (plan.display_name ?? plan.tier)
    planLabelMap.set(userId, { label, scope })
  }

  // Union course entitlements + engagement, deduplicated by course_id per user.
  const courseMap = new Map<string, Set<string>>()
  for (const s of (activeSubs ?? [])) {
    if (!courseMap.has(s.user_id)) courseMap.set(s.user_id, new Set())
    courseMap.get(s.user_id)!.add(s.course_id as string)
  }
  for (const p of (progress ?? [])) {
    if (!courseMap.has(p.user_id)) courseMap.set(p.user_id, new Set())
    courseMap.get(p.user_id)!.add(p.course_id)
  }

  return (data ?? []).map((u) => {
    const plan = planLabelMap.get(u.id)
    return {
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      subscriptionTier: u.subscription_tier,
      subscriptionStatus: u.subscription_status,
      stripeSubscriptionId: u.stripe_subscription_id,
      subscriptionStartDate: u.subscription_start_date,
      subscriptionEndDate: u.subscription_end_date,
      status: u.status as 'ACTIVE' | 'SUSPENDED',
      lastActiveDate: u.last_active_date,
      createdAt: u.created_at,
      suspensionReason: null,
      suspendedAt: null,
      suspendedByName: null,
      unsuspendReason: null,
      unsuspendedAt: null,
      displayStatus: computeDisplayStatus(u.status as 'ACTIVE' | 'SUSPENDED', u.last_active_date),
      courseCount: courseMap.get(u.id)?.size ?? 0,
      activePlanLabel: plan?.label ?? null,
      activePlanScope: plan?.scope ?? null,
    }
  })
}

export async function fetchB2CUser(id: string): Promise<B2CUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, subscription_tier, subscription_status, stripe_subscription_id, subscription_start_date, subscription_end_date, status, last_active_date, created_at, suspension_reason, suspended_at, suspended_by, unsuspend_reason, unsuspended_at')
    .eq('id', id)
    .single()

  if (error) return null

  let suspendedByName: string | null = null
  if (data.suspended_by) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('name')
      .eq('id', data.suspended_by)
      .single()
    suspendedByName = admin?.name ?? null
  }

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    subscriptionTier: data.subscription_tier,
    subscriptionStatus: data.subscription_status,
    stripeSubscriptionId: data.stripe_subscription_id,
    subscriptionStartDate: data.subscription_start_date,
    subscriptionEndDate: data.subscription_end_date,
    status: data.status as 'ACTIVE' | 'SUSPENDED',
    lastActiveDate: data.last_active_date,
    createdAt: data.created_at,
    suspensionReason: data.suspension_reason ?? null,
    suspendedAt: data.suspended_at ?? null,
    suspendedByName,
    unsuspendReason: data.unsuspend_reason ?? null,
    unsuspendedAt: data.unsuspended_at ?? null,
    displayStatus: computeDisplayStatus(data.status as 'ACTIVE' | 'SUSPENDED', data.last_active_date),
    courseCount: 0,
    activePlanLabel: null,
    activePlanScope: null,
  }
}

// ─── Subscription Fetchers ────────────────────────────────────────────────────

export async function fetchUserAssessmentSubscriptions(userId: string): Promise<AssessmentSubscription[]> {
  // plan_id has no FK constraint on b2c_assessment_subscriptions — fetch plans separately
  const { data, error } = await supabase
    .from('b2c_assessment_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = data ?? []

  // Fetch max_attempts for each unique plan_id in a single query
  const planIds = [...new Set(rows.map((s) => s.plan_id).filter(Boolean))] as string[]
  const planMaxMap = new Map<string, number>()
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('plans')
      .select('id, max_attempts_per_assessment')
      .in('id', planIds)
    for (const p of plans ?? []) {
      if (p.max_attempts_per_assessment != null) planMaxMap.set(p.id, p.max_attempts_per_assessment)
    }
  }

  return rows.map((s) => ({
    id: s.id,
    userId: s.user_id,
    planId: s.plan_id,
    stripeSubscriptionId: s.stripe_subscription_id,
    stripeCustomerId: s.stripe_customer_id,
    productName: s.product_name,
    priceUsd: s.price_usd != null ? Number(s.price_usd) : null,
    currency: s.currency,
    billingInterval: s.billing_interval,
    status: s.status,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    currentPeriodStart: s.current_period_start,
    currentPeriodEnd: s.current_period_end,
    canceledAt: s.canceled_at,
    endedAt: s.ended_at,
    createdAt: s.created_at,
    maxAttempts: s.plan_id ? (planMaxMap.get(s.plan_id) ?? null) : null,
  }))
}

export async function fetchUserCourseSubscriptions(userId: string): Promise<CourseSubscription[]> {
  const { data, error } = await supabase
    .from('b2c_course_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    planId: s.plan_id,
    courseId: s.course_id,
    stripeSubscriptionId: s.stripe_subscription_id,
    stripeCustomerId: s.stripe_customer_id,
    productName: s.product_name,
    priceUsd: s.price_usd != null ? Number(s.price_usd) : null,
    currency: s.currency,
    billingInterval: s.billing_interval,
    status: s.status,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    currentPeriodStart: s.current_period_start,
    currentPeriodEnd: s.current_period_end,
    canceledAt: s.canceled_at,
    endedAt: s.ended_at,
    createdAt: s.created_at,
  }))
}

// ─── Plan Assessment Fetchers ─────────────────────────────────────────────────

// Maps plan tier (SA) → assessments.tier values covered (cumulative)
// Premium users access all tiers; Pro covers basic+professional; Basic covers basic only
const PLAN_TIER_COVERAGE: Record<string, string[]> = {
  BASIC: ['basic'],
  PRO: ['basic', 'professional'],
  PREMIUM: ['basic', 'professional', 'premium'],
  ENTERPRISE: ['basic', 'professional', 'premium'],
}

/**
 * Returns all assessments for a plan's tier split into two groups:
 * - attempted: user has at least 1 completed attempt, includes stats
 * - notStarted: user has no attempts, title + category only
 *
 * NOTE: attempts.assessment_id references the B2C `assessments` table (not assessment_items).
 * plan_content_map uses assessment_items IDs — these are separate systems with no shared IDs.
 * We resolve the plan's tier and query `assessments` by tier instead.
 */
export async function fetchPlanAssessments(
  planId: string,
  userId: string,
): Promise<{ attempted: PlanAssessmentRow[]; notStarted: { assessmentId: string; title: string; category: string }[] }> {
  // Resolve plan tier
  const { data: plan } = await supabase
    .from('plans')
    .select('tier')
    .eq('id', planId)
    .single()

  if (!plan) return { attempted: [], notStarted: [] }

  const tiers = PLAN_TIER_COVERAGE[plan.tier] ?? [plan.tier.toLowerCase()]

  const [{ data: assessments, error: assErr }, { data: attempts, error: attErr }] = await Promise.all([
    supabase
      .from('assessments')
      .select('id, title, exam_categories!exam_category_id(name)')
      .in('tier', tiers),
    supabase
      .from('attempts')
      .select('assessment_id, attempt_number, accuracy_percent, completed_at')
      .eq('user_id', userId)
      .ilike('status', 'completed')
      .order('completed_at', { ascending: false }),
  ])

  if (assErr) throw new Error(assErr.message)
  if (attErr) throw new Error(attErr.message)

  const assessmentIds = new Set((assessments ?? []).map((a: { id: string }) => a.id))

  // Group by assessment_id — distinct attempt_number count to avoid inflation from duplicate rows
  const attemptStats = new Map<string, {
    attemptNumbers: Set<number>
    bestAccuracy: number | null
    lastAttempted: string | null
  }>()

  for (const a of (attempts ?? [])) {
    if (!assessmentIds.has(a.assessment_id)) continue
    const existing = attemptStats.get(a.assessment_id)
    if (!existing) {
      attemptStats.set(a.assessment_id, {
        attemptNumbers: new Set([a.attempt_number]),
        bestAccuracy: a.accuracy_percent,
        lastAttempted: a.completed_at,
      })
    } else {
      existing.attemptNumbers.add(a.attempt_number)
      if (a.accuracy_percent != null && (existing.bestAccuracy == null || a.accuracy_percent > existing.bestAccuracy)) {
        existing.bestAccuracy = a.accuracy_percent
      }
      // lastAttempted stays as first row (already ordered DESC)
    }
  }

  const attempted: PlanAssessmentRow[] = []
  const notStarted: { assessmentId: string; title: string; category: string }[] = []

  for (const a of (assessments ?? [])) {
    const stats = attemptStats.get(a.id)
    if (stats) {
      attempted.push({
        assessmentId: a.id,
        title: a.title,
        category: ((a as { exam_categories?: { name: string } | { name: string }[] | null }).exam_categories as { name: string } | null)?.name ?? '—',
        attemptsUsed: stats.attemptNumbers.size,
        bestAccuracy: stats.bestAccuracy,
        lastAttempted: stats.lastAttempted,
      })
    } else {
      notStarted.push({ assessmentId: a.id, title: a.title, category: ((a as { exam_categories?: { name: string } | { name: string }[] | null }).exam_categories as { name: string } | null)?.name ?? '—' })
    }
  }

  attempted.sort((a, b) => {
    if (!a.lastAttempted) return 1
    if (!b.lastAttempted) return -1
    return new Date(b.lastAttempted).getTime() - new Date(a.lastAttempted).getTime()
  })
  notStarted.sort((a, b) => a.title.localeCompare(b.title))

  return { attempted, notStarted }
}

/**
 * Returns all attempts for a specific user + assessment (for the slide-over panel).
 * Ordered by attempt_number ascending.
 */
export async function fetchAssessmentAttempts(userId: string, assessmentId: string): Promise<AttemptRow[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('id, attempt_number, accuracy_percent, correct_count, total_questions, time_spent_seconds, completed_at')
    .eq('user_id', userId)
    .eq('assessment_id', assessmentId)
    .ilike('status', 'completed')
    .order('attempt_number', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((a) => ({
    id: a.id,
    attemptNumber: a.attempt_number ?? 1,
    accuracyPercent: a.accuracy_percent,
    correctCount: a.correct_count,
    totalQuestions: a.total_questions,
    timeSpentSeconds: a.time_spent_seconds,
    completedAt: a.completed_at,
  }))
}

/**
 * Returns free attempt activity not covered by any active plan subscription.
 * Only rows where is_free_attempt=true are shown — max 1 free attempt per assessment ever.
 * attemptsUsed is always 1. If the assessment is covered by an active plan, it is excluded
 * (plan absorbs the free attempt — show under the plan's Attempted section instead).
 */
export async function fetchFreeAccessAttempts(
  userId: string,
  coveredAssessmentIds: string[],
): Promise<PlanAssessmentRow[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('assessment_id, accuracy_percent, completed_at, assessments(title, exam_categories(name))')
    .eq('user_id', userId)
    .eq('is_free_attempt', true)
    .ilike('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)

  const uncovered = (data ?? []).filter((a) => !coveredAssessmentIds.includes(a.assessment_id))

  return uncovered.map((a) => {
    const assessment = Array.isArray(a.assessments) ? a.assessments[0] : a.assessments
    const title = (assessment as { title: string } | null)?.title ?? 'Unknown Assessment'
    const cats = (assessment as { exam_categories?: { name: string } | { name: string }[] | null } | null)?.exam_categories
    const category = (Array.isArray(cats) ? cats[0]?.name : (cats as { name: string } | null)?.name) ?? '—'
    return {
      assessmentId: a.assessment_id,
      title,
      category,
      attemptsUsed: 1,  // always 1 — max 1 free attempt per assessment
      bestAccuracy: a.accuracy_percent,
      lastAttempted: a.completed_at,
    }
  })
}

/**
 * Returns all assessment IDs covered by a set of plans.
 * Uses the B2C `assessments` table filtered by plan tier — the same source
 * as fetchPlanAssessments. Used to determine "free access" orphaned attempts.
 */
export async function fetchPlanCoveredAssessmentIds(planIds: string[]): Promise<string[]> {
  if (planIds.length === 0) return []
  const { data: plans } = await supabase
    .from('plans')
    .select('tier')
    .in('id', planIds)

  const allTiers = new Set<string>()
  for (const p of (plans ?? [])) {
    const coverage = PLAN_TIER_COVERAGE[p.tier] ?? []
    coverage.forEach((t: string) => allTiers.add(t))
  }
  const tiers = Array.from(allTiers)
  if (tiers.length === 0) return []

  const { data } = await supabase
    .from('assessments')
    .select('id')
    .in('tier', tiers)

  return (data ?? []).map((a: { id: string }) => a.id)
}

// ─── Certificate Fetcher ──────────────────────────────────────────────────────

export async function fetchB2CCertificate(userId: string, courseId: string): Promise<B2CCertificate | null> {
  const { data, error } = await supabase
    .from('b2c_certificates')
    .select('certificate_number, issued_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (error) return null
  return { certificateNumber: data.certificate_number, issuedAt: data.issued_at }
}

// ─── Course Module Progress ───────────────────────────────────────────────────

export type CourseTopic = {
  id: string
  title: string
  orderIndex: number
  completed: boolean
}

export type CourseModule = {
  id: string
  title: string
  orderIndex: number
  progressPct: number
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'
  topics: CourseTopic[]
}

export async function fetchUserCourseProgress(userId: string): Promise<UserCourseProgress[]> {
  const { data, error } = await supabase
    .from('b2c_course_progress')
    .select('id, course_id, status, progress_pct, started_at, completed_at, courses(title, course_type)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => {
    const course = Array.isArray(p.courses) ? p.courses[0] : p.courses
    return {
      id: p.id,
      courseId: p.course_id,
      courseTitle: (course as { title: string } | null)?.title ?? 'Unknown Course',
      courseType: (course as { course_type: string } | null)?.course_type ?? null,
      status: p.status as 'IN_PROGRESS' | 'COMPLETED',
      progressPct: p.progress_pct,
      startedAt: p.started_at,
      completedAt: p.completed_at,
    }
  })
}

export async function fetchCourseModuleProgress(
  courseId: string,
  userId: string,
): Promise<CourseModule[]> {
  const { data: modules, error: modErr } = await supabase
    .from('course_modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index')

  if (modErr) throw new Error(modErr.message)
  if (!modules || modules.length === 0) return []

  const moduleIds = modules.map((m: { id: string }) => m.id)

  const [{ data: modProgress }, { data: topics }] = await Promise.all([
    supabase
      .from('b2c_module_progress')
      .select('module_id, progress_pct, status')
      .eq('user_id', userId)
      .in('module_id', moduleIds)
      .is('topic_id', null),
    supabase
      .from('course_topics')
      .select('id, module_id, title, order_index')
      .in('module_id', moduleIds)
      .order('order_index'),
  ])

  const topicIds = (topics ?? []).map((t: { id: string }) => t.id)
  const { data: topicProgress } = topicIds.length > 0
    ? await supabase
        .from('b2c_module_progress')
        .select('topic_id, status')
        .eq('user_id', userId)
        .in('topic_id', topicIds)
    : { data: [] }

  return modules.map((m: { id: string; title: string; order_index: number }) => {
    const mp = (modProgress ?? []).find((p: { module_id: string }) => p.module_id === m.id) as
      | { progress_pct: number; status: string }
      | undefined
    const moduleTopics = (topics ?? [])
      .filter((t: { module_id: string }) => t.module_id === m.id)
      .map((t: { id: string; title: string; order_index: number }) => {
        const tp = (topicProgress ?? []).find((p: { topic_id: string }) => p.topic_id === t.id) as
          | { status: string }
          | undefined
        return {
          id: t.id,
          title: t.title,
          orderIndex: t.order_index,
          completed: tp?.status === 'COMPLETED',
        }
      })
    return {
      id: m.id,
      title: m.title,
      orderIndex: m.order_index,
      progressPct: mp?.progress_pct ?? 0,
      status: (mp?.status ?? 'NOT_STARTED') as 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED',
      topics: moduleTopics,
    }
  })
}

// ─── User Actions ─────────────────────────────────────────────────────────────

// Demo: hardcoded Super Admin UUID until auth session is implemented
const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

export async function suspendUser(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      status: 'SUSPENDED',
      suspension_reason: reason,
      suspended_at: new Date().toISOString(),
      suspended_by: DEMO_SA_ID,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function unsuspendUser(id: string, reason: string | null): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      status: 'ACTIVE',
      unsuspend_reason: reason || null,
      unsuspended_at: new Date().toISOString(),
      unsuspended_by: DEMO_SA_ID,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
