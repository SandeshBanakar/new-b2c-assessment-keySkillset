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

export type UserAttempt = {
  id: string
  assessmentId: string
  assessmentTitle: string
  examType: string
  assessmentType: string
  attemptNumber: number
  accuracyPercent: number | null
  correctCount: number | null
  incorrectCount: number | null
  skippedCount: number | null
  totalQuestions: number | null
  timeSpentSeconds: number | null
  passed: boolean | null   // null = no pass/fail concept (full-test / CLAT)
  completedAt: string | null
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

export type AssessmentSummary = {
  totalAttempts: number
  avgAccuracy: number | null
  avgTimePerQuestion: number | null  // seconds
  bestAccuracy: number | null
}

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

export async function fetchUserAttempts(userId: string): Promise<UserAttempt[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('id, assessment_id, attempt_number, accuracy_percent, correct_count, incorrect_count, skipped_count, total_questions, time_spent_seconds, passed, completed_at, assessments(title, exam_type, assessment_type)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((a) => {
    const assessment = Array.isArray(a.assessments) ? a.assessments[0] : a.assessments
    return {
      id: a.id,
      assessmentId: a.assessment_id,
      assessmentTitle: (assessment as { title: string } | null)?.title ?? 'Unknown',
      examType: (assessment as { exam_type: string } | null)?.exam_type ?? '—',
      assessmentType: (assessment as { assessment_type: string } | null)?.assessment_type ?? '',
      attemptNumber: a.attempt_number,
      accuracyPercent: a.accuracy_percent,
      correctCount: a.correct_count,
      incorrectCount: a.incorrect_count,
      skippedCount: a.skipped_count,
      totalQuestions: a.total_questions,
      timeSpentSeconds: a.time_spent_seconds,
      passed: a.passed,
      completedAt: a.completed_at,
    }
  })
}

export function computeAssessmentSummary(attempts: UserAttempt[]): AssessmentSummary {
  if (attempts.length === 0) return { totalAttempts: 0, avgAccuracy: null, avgTimePerQuestion: null, bestAccuracy: null }

  const withAccuracy = attempts.filter((a) => a.accuracyPercent !== null)
  const withTime = attempts.filter((a) => a.timeSpentSeconds !== null && a.totalQuestions !== null && a.totalQuestions > 0)

  const avgAccuracy = withAccuracy.length > 0
    ? withAccuracy.reduce((sum, a) => sum + (a.accuracyPercent ?? 0), 0) / withAccuracy.length
    : null

  const bestAccuracy = withAccuracy.length > 0
    ? Math.max(...withAccuracy.map((a) => a.accuracyPercent ?? 0))
    : null

  const avgTimePerQuestion = withTime.length > 0
    ? withTime.reduce((sum, a) => sum + (a.timeSpentSeconds! / a.totalQuestions!), 0) / withTime.length
    : null

  return { totalAttempts: attempts.length, avgAccuracy, avgTimePerQuestion, bestAccuracy }
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

export async function fetchUserAssessmentSubscriptions(userId: string): Promise<AssessmentSubscription[]> {
  const { data, error } = await supabase
    .from('b2c_assessment_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((s) => ({
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
