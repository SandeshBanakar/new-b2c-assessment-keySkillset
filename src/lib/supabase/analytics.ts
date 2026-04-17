import { supabase } from './client'

// ─── Date range helpers ──────────────────────────────────────────────────────

export type DateRange = { from: string; to: string } // ISO date strings

export function buildRange(preset: '7d' | '30d' | '90d' | 'custom', custom?: DateRange): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date()
  if (preset === '7d')  from.setDate(from.getDate() - 6)
  if (preset === '30d') from.setDate(from.getDate() - 29)
  if (preset === '90d') from.setDate(from.getDate() - 89)
  if (preset === 'custom' && custom) return custom
  from.setHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: to.toISOString() }
}

/** Group an array of ISO date strings by day or week, returning label→count */
export function groupByPeriod(
  dates: string[],
  granularity: 'daily' | 'weekly',
): { date: string; count: number }[] {
  const map: Record<string, number> = {}
  for (const d of dates) {
    const dt = new Date(d)
    let key: string
    if (granularity === 'daily') {
      key = dt.toISOString().slice(0, 10)
    } else {
      // Week start = Monday
      const day = dt.getDay()
      const diff = (day === 0 ? -6 : 1 - day)
      const monday = new Date(dt)
      monday.setDate(dt.getDate() + diff)
      key = monday.toISOString().slice(0, 10)
    }
    map[key] = (map[key] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

export function pickGranularity(range: DateRange): 'daily' | 'weekly' {
  const days = Math.round((new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000)
  return days > 30 ? 'weekly' : 'daily'
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type TimeSeriesPoint = { date: string; count: number }

export type PlatformHealthData = {
  totalB2CSubscribers: number        // all-time from plan_subscribers (static)
  activeB2CLearners: number          // unique users with attempt in range
  newB2CSignups: number              // users.created_at in range
  totalB2BLearners: number           // all active learners (all tenants)
  dauSeries: TimeSeriesPoint[]       // distinct users per day/week in range
  newSignupsSeries: TimeSeriesPoint[] // new B2C signups per day/week in range
}

export type RevenuePlanRow = {
  planId: string
  name: string
  price: number
  billingCycle: string
  subscriberCount: number
  mrr: number
  createdAt: string
}

export type RevenueData = {
  totalMrr: number
  planRows: RevenuePlanRow[]
  newSubsSeries: TimeSeriesPoint[] // subscription_start_date in range
}

export type TenantRow = {
  id: string
  name: string
  isActive: boolean
  totalLearners: number
  activeLearners: number       // learner_attempts in range
  arr: number                  // arr_usd_cents ÷ 100 × 83 (INR)
  contractEnd: string | null   // end_date ISO
  isExpiringSoon: boolean      // end_date within range
}

export type TenantsData = {
  totalTenants: number
  activeTenants: number
  totalB2BLearners: number
  totalArrInr: number
  tenantRows: TenantRow[]
}

// ─── Platform Health ──────────────────────────────────────────────────────────

export async function fetchPlatformHealth(range: DateRange): Promise<PlatformHealthData> {
  const granularity = pickGranularity(range)

  const [subscribersRes, attemptsRes, signupsRes, learnersRes] = await Promise.all([
    // Total B2C subscribers (static — sum of plan_subscribers)
    supabase.from('plan_subscribers').select('subscriber_count'),

    // B2C attempts in range
    supabase
      .from('attempts')
      .select('created_at, user_id')
      .gte('created_at', range.from)
      .lte('created_at', range.to),

    // New B2C signups in range
    supabase
      .from('users')
      .select('created_at')
      .gte('created_at', range.from)
      .lte('created_at', range.to),

    // All active B2B learners (all-time count)
    supabase.from('learners').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
  ])

  const totalB2CSubscribers = (subscribersRes.data ?? []).reduce(
    (sum, r) => sum + (r.subscriber_count ?? 0), 0,
  )

  const attemptsInRange = attemptsRes.data ?? []
  const activeB2CLearners = new Set(attemptsInRange.map((r) => r.user_id)).size

  // DAU: unique users per day/week
  const userDayMap: Record<string, Set<string>> = {}
  for (const r of attemptsInRange) {
    const dt = new Date(r.created_at as string)
    let key: string
    if (granularity === 'daily') {
      key = dt.toISOString().slice(0, 10)
    } else {
      const day = dt.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(dt)
      monday.setDate(dt.getDate() + diff)
      key = monday.toISOString().slice(0, 10)
    }
    if (!userDayMap[key]) userDayMap[key] = new Set()
    userDayMap[key].add(r.user_id as string)
  }
  const dauSeries: TimeSeriesPoint[] = Object.entries(userDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, set]) => ({ date, count: set.size }))

  const signupDates = (signupsRes.data ?? []).map((r) => r.created_at as string)
  const newSignupsSeries = groupByPeriod(signupDates, granularity)

  return {
    totalB2CSubscribers,
    activeB2CLearners,
    newB2CSignups: (signupsRes.data ?? []).length,
    totalB2BLearners: learnersRes.count ?? 0,
    dauSeries,
    newSignupsSeries,
  }
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

export async function fetchRevenue(range: DateRange): Promise<RevenueData> {
  const granularity = pickGranularity(range)

  const [plansRes, subscribersRes, signupsRes] = await Promise.all([
    supabase
      .from('plans')
      .select('id, name, price, billing_cycle, created_at')
      .eq('plan_audience', 'B2C')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false }),

    supabase.from('plan_subscribers').select('plan_id, subscriber_count'),

    // New paid subscriptions in range (subscription_start_date in range)
    supabase
      .from('users')
      .select('subscription_start_date')
      .not('subscription_start_date', 'is', null)
      .gte('subscription_start_date', range.from.slice(0, 10))
      .lte('subscription_start_date', range.to.slice(0, 10)),
  ])

  const plans = plansRes.data ?? []
  const subscribers = subscribersRes.data ?? []

  const subMap: Record<string, number> = {}
  for (const s of subscribers) subMap[s.plan_id] = s.subscriber_count ?? 0

  const planRows: RevenuePlanRow[] = plans.map((p) => {
    const price       = p.price ?? 0
    const subscribers = subMap[p.id] ?? 0
    const monthlyPrice = p.billing_cycle === 'ANNUAL' ? price / 12 : price
    return {
      planId:        p.id,
      name:          p.name,
      price,
      billingCycle:  p.billing_cycle ?? 'MONTHLY',
      subscriberCount: subscribers,
      mrr:           monthlyPrice * subscribers,
      createdAt:     p.created_at as string,
    }
  })

  const totalMrr = planRows.reduce((s, r) => s + r.mrr, 0)

  const subDates = (signupsRes.data ?? [])
    .map((r) => (r.subscription_start_date as string) + 'T00:00:00Z')
  const newSubsSeries = groupByPeriod(subDates, granularity)

  return { totalMrr, planRows, newSubsSeries }
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export async function fetchTenantsAnalytics(range: DateRange): Promise<TenantsData> {
  const [tenantsRes, contractsRes, learnersRes, attemptsByTenantRes] = await Promise.all([
    supabase.from('tenants').select('id, name, is_active'),

    supabase.from('contracts').select('tenant_id, arr_usd_cents, end_date'),

    supabase.from('learners').select('id, tenant_id, status'),

    supabase
      .from('learner_attempts')
      .select('tenant_id, learner_id')
      .gte('attempted_at', range.from)
      .lte('attempted_at', range.to),
  ])

  const tenants = tenantsRes.data ?? []
  const contracts = contractsRes.data ?? []
  const learners = learnersRes.data ?? []
  const b2bAttempts = attemptsByTenantRes.data ?? []

  const contractMap: Record<string, { arrUsdCents: number; endDate: string | null }> = {}
  for (const c of contracts) {
    contractMap[c.tenant_id] = {
      arrUsdCents: c.arr_usd_cents ?? 0,
      endDate: c.end_date ?? null,
    }
  }

  const learnersByTenant: Record<string, number> = {}
  const activeLearnersByTenant: Record<string, number> = {}

  for (const l of learners) {
    if (l.status === 'ACTIVE') {
      learnersByTenant[l.tenant_id] = (learnersByTenant[l.tenant_id] ?? 0) + 1
    }
  }

  const activeInRange: Record<string, Set<string>> = {}
  for (const a of b2bAttempts) {
    if (!activeInRange[a.tenant_id]) activeInRange[a.tenant_id] = new Set()
    activeInRange[a.tenant_id].add(a.learner_id as string)
  }
  for (const [tid, set] of Object.entries(activeInRange)) {
    activeLearnersByTenant[tid] = set.size
  }

  const rangeEndMs = new Date(range.to).getTime()

  const tenantRows: TenantRow[] = tenants.map((t) => {
    const contract = contractMap[t.id] ?? { arrUsdCents: 0, endDate: null }
    const arrInr = Math.round((contract.arrUsdCents / 100) * 83)
    const endDate = contract.endDate ?? null
    const isExpiringSoon = endDate
      ? new Date(endDate).getTime() <= rangeEndMs &&
        new Date(endDate).getTime() >= Date.now()
      : false

    return {
      id: t.id,
      name: t.name,
      isActive: t.is_active,
      totalLearners: learnersByTenant[t.id] ?? 0,
      activeLearners: activeLearnersByTenant[t.id] ?? 0,
      arr: arrInr,
      contractEnd: endDate,
      isExpiringSoon,
    }
  })

  const activeTenants = tenants.filter((t) => t.is_active).length
  const totalB2BLearners = learners.filter((l) => l.status === 'ACTIVE').length
  const totalArrInr = tenantRows.reduce((s, r) => s + r.arr, 0)

  return {
    totalTenants: tenants.length,
    activeTenants,
    totalB2BLearners,
    totalArrInr,
    tenantRows,
  }
}

// ─── Assessments ──────────────────────────────────────────────────────────────

export type AssessmentStat = {
  assessmentId: string
  title: string
  totalAttempts: number
  uniqueUsers: number
  avgScore: number
}

export type AssessmentsAnalyticsData = {
  totalUniqueUsers: number
  assessmentsInUse: number
  avgScore: number
  totalAttempts: number
  attemptsSeries: TimeSeriesPoint[]
  uniqueUsersSeries: TimeSeriesPoint[]
  assessmentStats: AssessmentStat[]
}

export async function fetchAssessmentsAnalytics(range: DateRange): Promise<AssessmentsAnalyticsData> {
  const granularity = pickGranularity(range)

  const { data: attemptsData } = await supabase
    .from('attempts')
    .select('user_id, assessment_id, accuracy_percent, created_at')
    .gte('created_at', range.from)
    .lte('created_at', range.to)

  const attempts = attemptsData ?? []

  const totalAttempts = attempts.length
  const uniqueUserSet = new Set(attempts.map((a) => a.user_id as string))
  const totalUniqueUsers = uniqueUserSet.size
  const uniqueAssessmentSet = new Set(attempts.map((a) => a.assessment_id as string))
  const assessmentsInUse = uniqueAssessmentSet.size

  const scored = attempts.filter((a) => a.accuracy_percent != null)
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s: number, a) => s + (a.accuracy_percent as number), 0) / scored.length)
    : 0

  // Time series
  const attemptsByDay: Record<string, number> = {}
  const usersByDay: Record<string, Set<string>> = {}
  for (const a of attempts) {
    const dt = new Date(a.created_at as string)
    let key: string
    if (granularity === 'daily') {
      key = dt.toISOString().slice(0, 10)
    } else {
      const day = dt.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(dt)
      monday.setDate(dt.getDate() + diff)
      key = monday.toISOString().slice(0, 10)
    }
    attemptsByDay[key] = (attemptsByDay[key] ?? 0) + 1
    if (!usersByDay[key]) usersByDay[key] = new Set()
    usersByDay[key].add(a.user_id as string)
  }
  const attemptsSeries: TimeSeriesPoint[] = Object.entries(attemptsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
  const uniqueUsersSeries: TimeSeriesPoint[] = Object.entries(usersByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, set]) => ({ date, count: set.size }))

  // Fetch assessment titles
  const assessmentIds = Array.from(uniqueAssessmentSet)
  const titleMap: Record<string, string> = {}
  if (assessmentIds.length > 0) {
    const { data: contentData } = await supabase
      .from('assessments')
      .select('id, title')
      .in('id', assessmentIds)
    for (const c of contentData ?? []) titleMap[c.id] = c.title
  }

  // Per-assessment stats
  const byAssessment: Record<string, { users: Set<string>; scores: number[]; count: number }> = {}
  for (const a of attempts) {
    const id = a.assessment_id as string
    if (!byAssessment[id]) byAssessment[id] = { users: new Set(), scores: [], count: 0 }
    byAssessment[id].users.add(a.user_id as string)
    byAssessment[id].count++
    if (a.accuracy_percent != null) byAssessment[id].scores.push(a.accuracy_percent as number)
  }
  const assessmentStats: AssessmentStat[] = Object.entries(byAssessment)
    .map(([id, { users, scores, count }]) => ({
      assessmentId: id,
      title: titleMap[id] ?? 'Unknown Assessment',
      totalAttempts: count,
      uniqueUsers: users.size,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    }))
    .sort((a, b) => b.totalAttempts - a.totalAttempts)

  return { totalUniqueUsers, assessmentsInUse, avgScore, totalAttempts, attemptsSeries, uniqueUsersSeries, assessmentStats }
}
