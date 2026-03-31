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
  // computed
  displayStatus: DisplayStatus
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
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, subscription_tier, subscription_status, stripe_subscription_id, subscription_start_date, subscription_end_date, status, last_active_date, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((u) => ({
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
    displayStatus: computeDisplayStatus(u.status as 'ACTIVE' | 'SUSPENDED', u.last_active_date),
  }))
}

export async function fetchB2CUser(id: string): Promise<B2CUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, subscription_tier, subscription_status, stripe_subscription_id, subscription_start_date, subscription_end_date, status, last_active_date, created_at')
    .eq('id', id)
    .single()

  if (error) return null

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
    displayStatus: computeDisplayStatus(data.status as 'ACTIVE' | 'SUSPENDED', data.last_active_date),
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

/**
 * Returns all assessments in a plan split into two groups:
 * - attempted: user has at least 1 completed attempt, includes stats
 * - notStarted: user has no attempts, title + category only
 */
export async function fetchPlanAssessments(
  planId: string,
  userId: string,
): Promise<{ attempted: PlanAssessmentRow[]; notStarted: { assessmentId: string; title: string; category: string }[] }> {
  const { data: mapRows, error: mapErr } = await supabase
    .from('plan_content_map')
    .select('content_item_id')
    .eq('plan_id', planId)
    .eq('content_type', 'ASSESSMENT')

  if (mapErr) throw new Error(mapErr.message)
  if (!mapRows || mapRows.length === 0) return { attempted: [], notStarted: [] }

  const assessmentIds = mapRows.map((r: { content_item_id: string }) => r.content_item_id)

  const [{ data: assessments, error: assErr }, { data: attempts, error: attErr }] = await Promise.all([
    supabase
      .from('content_items')
      .select('id, title, exam_categories(name)')
      .in('id', assessmentIds),
    supabase
      .from('attempts')
      .select('assessment_id, accuracy_percent, completed_at')
      .eq('user_id', userId)
      .in('assessment_id', assessmentIds)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),
  ])

  if (assErr) throw new Error(assErr.message)
  if (attErr) throw new Error(attErr.message)

  // Group attempts by assessment_id — track count, bestAccuracy, lastAttempted
  const attemptStats = new Map<string, { count: number; bestAccuracy: number | null; lastAttempted: string | null }>()
  for (const a of (attempts ?? [])) {
    const existing = attemptStats.get(a.assessment_id)
    if (!existing) {
      attemptStats.set(a.assessment_id, {
        count: 1,
        bestAccuracy: a.accuracy_percent,
        lastAttempted: a.completed_at,
      })
    } else {
      existing.count++
      if (a.accuracy_percent != null && (existing.bestAccuracy == null || a.accuracy_percent > existing.bestAccuracy)) {
        existing.bestAccuracy = a.accuracy_percent
      }
      // lastAttempted stays as first row (already ordered DESC)
    }
  }

  const attempted: PlanAssessmentRow[] = []
  const notStarted: { assessmentId: string; title: string; category: string }[] = []

  for (const a of (assessments ?? [])) {
    const catRaw = Array.isArray(a.exam_categories) ? a.exam_categories[0] : a.exam_categories
    const category = (catRaw as { name: string } | null)?.name ?? '—'
    const stats = attemptStats.get(a.id)

    if (stats) {
      attempted.push({
        assessmentId: a.id,
        title: a.title,
        category,
        attemptsUsed: stats.count,
        bestAccuracy: stats.bestAccuracy,
        lastAttempted: stats.lastAttempted,
      })
    } else {
      notStarted.push({ assessmentId: a.id, title: a.title, category })
    }
  }

  // Sort attempted by lastAttempted DESC, notStarted alphabetically
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
    .eq('status', 'completed')
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
 * Returns attempts on assessments NOT covered by any of the user's plan subscriptions.
 * These are "free access" attempts — 1 free attempt per assessment, no plan required.
 */
export async function fetchFreeAccessAttempts(
  userId: string,
  coveredAssessmentIds: string[],
): Promise<PlanAssessmentRow[]> {
  // attempts.assessment_id FK references the 'assessments' table (not content_items)
  const { data, error } = await supabase
    .from('attempts')
    .select('assessment_id, accuracy_percent, completed_at, assessments(title)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Filter to only uncovered assessments client-side
  const uncovered = (data ?? []).filter((a) => !coveredAssessmentIds.includes(a.assessment_id))

  // Group by assessment_id
  const grouped = new Map<string, {
    title: string
    count: number
    bestAccuracy: number | null
    lastAttempted: string | null
  }>()

  for (const a of uncovered) {
    const assessment = Array.isArray(a.assessments) ? a.assessments[0] : a.assessments
    const title = (assessment as { title: string } | null)?.title ?? 'Unknown Assessment'

    const existing = grouped.get(a.assessment_id)
    if (!existing) {
      grouped.set(a.assessment_id, { title, count: 1, bestAccuracy: a.accuracy_percent, lastAttempted: a.completed_at })
    } else {
      existing.count++
      if (a.accuracy_percent != null && (existing.bestAccuracy == null || a.accuracy_percent > existing.bestAccuracy)) {
        existing.bestAccuracy = a.accuracy_percent
      }
    }
  }

  return Array.from(grouped.entries()).map(([assessmentId, stats]) => ({
    assessmentId,
    title: stats.title,
    category: '—',
    attemptsUsed: stats.count,
    bestAccuracy: stats.bestAccuracy,
    lastAttempted: stats.lastAttempted,
  }))
}

/**
 * Returns all assessment IDs covered by a set of plans.
 * Used to determine which attempts are "free access" (not covered by any plan).
 */
export async function fetchPlanCoveredAssessmentIds(planIds: string[]): Promise<string[]> {
  if (planIds.length === 0) return []
  const { data, error } = await supabase
    .from('plan_content_map')
    .select('content_item_id')
    .in('plan_id', planIds)
    .eq('content_type', 'ASSESSMENT')
  if (error) return []
  return (data ?? []).map((r: { content_item_id: string }) => r.content_item_id)
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

export async function suspendUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ status: 'SUSPENDED' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function unsuspendUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ status: 'ACTIVE' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
