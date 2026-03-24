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
  totalB2CSubscribers: number       // all-time from plan_subscribers (static)
  activeB2CLearners: number         // unique users with attempt in range
  newB2CSignups: number             // users.created_at in range
  totalB2BLearners: number          // all active learners (all tenants)
  attemptsSeries: TimeSeriesPoint[] // attempts per day/week in range
  dauSeries: TimeSeriesPoint[]      // distinct users per day/week in range
}

export type RevenuePlanRow = {
  planId: string
  name: string
  price: number
  subscriberCount: number
  mrr: number
}

export type RevenueData = {
  totalMrr: number
  planRows: RevenuePlanRow[]
  newSubsSeries: TimeSeriesPoint[] // subscription_start_date in range
}

export type ContentRow = {
  id: string
  title: string
  type: 'Assessment' | 'Course'
  attempts: number
  avgAccuracy: number | null   // null = no data
  passRate: number | null      // null = all full-tests (passed=null)
}

export type ContentData = {
  rows: ContentRow[]           // sorted: highest attempts first
  zeroAttempts: ContentRow[]   // assessments with 0 attempts all-time
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

  const allDates = attemptsInRange.map((r) => r.created_at as string)
  const attemptsSeries = groupByPeriod(allDates, granularity)

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

  return {
    totalB2CSubscribers,
    activeB2CLearners,
    newB2CSignups: (signupsRes.data ?? []).length,
    totalB2BLearners: learnersRes.count ?? 0,
    attemptsSeries,
    dauSeries,
  }
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

export async function fetchRevenue(range: DateRange): Promise<RevenueData> {
  const granularity = pickGranularity(range)

  const [plansRes, subscribersRes, signupsRes] = await Promise.all([
    supabase
      .from('plans')
      .select('id, name, price')
      .eq('plan_audience', 'B2C')
      .eq('status', 'PUBLISHED'),

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

  const planRows: RevenuePlanRow[] = plans.map((p) => ({
    planId: p.id,
    name: p.name,
    price: p.price ?? 0,
    subscriberCount: subMap[p.id] ?? 0,
    mrr: (p.price ?? 0) * (subMap[p.id] ?? 0),
  }))

  const totalMrr = planRows.reduce((s, r) => s + r.mrr, 0)

  const subDates = (signupsRes.data ?? [])
    .map((r) => (r.subscription_start_date as string) + 'T00:00:00Z')
  const newSubsSeries = groupByPeriod(subDates, granularity)

  return { totalMrr, planRows, newSubsSeries }
}

// ─── Content ─────────────────────────────────────────────────────────────────

export async function fetchContentAnalytics(range: DateRange): Promise<ContentData> {
  // attempts.assessment_id references assessments.id (not content_items.id)
  const [dbAssessmentsRes, coursesRes, attemptsRes] = await Promise.all([
    supabase.from('assessments').select('id, title, assessment_type'),
    supabase.from('courses').select('id, title').eq('status', 'LIVE'),
    supabase
      .from('attempts')
      .select('assessment_id, accuracy_percent, passed')
      .gte('created_at', range.from)
      .lte('created_at', range.to)
      .eq('status', 'COMPLETED'),
  ])

  const dbAssessments = dbAssessmentsRes.data ?? []
  const courses       = coursesRes.data ?? []
  const attempts      = attemptsRes.data ?? []

  // Group attempts by assessment_id
  type AttemptStats = { count: number; accuracySum: number; passCount: number; totalWithPass: number }
  const statsMap: Record<string, AttemptStats> = {}

  for (const a of attempts) {
    const id = a.assessment_id as string
    if (!statsMap[id]) statsMap[id] = { count: 0, accuracySum: 0, passCount: 0, totalWithPass: 0 }
    statsMap[id].count++
    if (a.accuracy_percent != null) statsMap[id].accuracySum += Number(a.accuracy_percent)
    if (a.passed !== null) {
      statsMap[id].totalWithPass++
      if (a.passed) statsMap[id].passCount++
    }
  }

  const rows: ContentRow[] = []
  const zeroAttempts: ContentRow[] = []

  for (const a of dbAssessments) {
    const stats = statsMap[a.id]
    if (!stats || stats.count === 0) {
      zeroAttempts.push({
        id: a.id,
        title: a.title,
        type: 'Assessment',
        attempts: 0,
        avgAccuracy: null,
        passRate: null,
      })
    } else {
      rows.push({
        id: a.id,
        title: a.title,
        type: 'Assessment',
        attempts: stats.count,
        avgAccuracy: stats.count > 0 ? Math.round(stats.accuracySum / stats.count) : null,
        passRate: stats.totalWithPass > 0
          ? Math.round((stats.passCount / stats.totalWithPass) * 100)
          : null,
      })
    }
  }

  // Courses: no attempts table for courses (B2C uses b2c_course_progress) — show with 0 for now
  for (const c of courses) {
    rows.push({
      id: c.id,
      title: c.title,
      type: 'Course',
      attempts: 0,
      avgAccuracy: null,
      passRate: null,
    })
  }

  rows.sort((a, b) => b.attempts - a.attempts)

  return { rows, zeroAttempts }
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
