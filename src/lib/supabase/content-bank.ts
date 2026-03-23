import { supabase } from '@/lib/supabase/client'

export type ContentBankItem = {
  id: string
  title: string
  contentType: 'ASSESSMENT' | 'COURSE'
  category: string | null      // exam_category.name for ASSESSMENT
  testType: string | null      // test_type for ASSESSMENT
  courseType: string | null    // course_type for COURSE
  status: 'DRAFT' | 'INACTIVE' | 'LIVE' | 'ARCHIVED'
  audienceType: string | null
  source: string | null
  createdAt: string
  planCount: number
}

export type ExamCategory = {
  id: string
  name: string
}

export async function fetchContentBank(): Promise<ContentBankItem[]> {
  // Fetch assessments with exam category name
  const { data: assessments, error: aErr } = await supabase
    .from('content_items')
    .select('id, title, test_type, status, audience_type, source, created_at, exam_categories(name)')
    .order('created_at', { ascending: false })

  if (aErr) throw new Error(aErr.message)

  // Fetch courses
  const { data: courses, error: cErr } = await supabase
    .from('courses')
    .select('id, title, course_type, status, audience_type, source, created_at')
    .order('created_at', { ascending: false })

  if (cErr) throw new Error(cErr.message)

  // Fetch plan counts — no FK so we query separately
  const { data: pcmRows, error: pcmErr } = await supabase
    .from('plan_content_map')
    .select('content_item_id, content_type')

  if (pcmErr) throw new Error(pcmErr.message)

  const assessmentPlanCounts = new Map<string, number>()
  const coursePlanCounts = new Map<string, number>()
  for (const row of pcmRows ?? []) {
    if (row.content_type === 'ASSESSMENT') {
      assessmentPlanCounts.set(row.content_item_id, (assessmentPlanCounts.get(row.content_item_id) ?? 0) + 1)
    } else if (row.content_type === 'COURSE') {
      coursePlanCounts.set(row.content_item_id, (coursePlanCounts.get(row.content_item_id) ?? 0) + 1)
    }
  }

  const items: ContentBankItem[] = [
    ...(assessments ?? []).map((a) => {
      const cats = a.exam_categories as { name: string } | { name: string }[] | null
      const categoryName = Array.isArray(cats) ? (cats[0]?.name ?? null) : (cats?.name ?? null)
      return {
        id: a.id,
        title: a.title,
        contentType: 'ASSESSMENT' as const,
        category: categoryName,
        testType: a.test_type,
        courseType: null,
        status: a.status as ContentBankItem['status'],
        audienceType: a.audience_type,
        source: a.source,
        createdAt: a.created_at,
        planCount: assessmentPlanCounts.get(a.id) ?? 0,
      }
    }),
    ...(courses ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      contentType: 'COURSE' as const,
      category: null,
      testType: null,
      courseType: c.course_type,
      status: c.status as ContentBankItem['status'],
      audienceType: c.audience_type,
      source: c.source,
      createdAt: c.created_at,
      planCount: coursePlanCounts.get(c.id) ?? 0,
    })),
  ]

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function fetchExamCategories(): Promise<ExamCategory[]> {
  const { data, error } = await supabase
    .from('exam_categories')
    .select('id, name')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchEligiblePlans(
  audienceType: string,
): Promise<{ id: string; name: string; plan_audience: string }[]> {
  const audiences =
    audienceType === 'BOTH'
      ? ['B2C', 'B2B']
      : audienceType === 'B2C_ONLY'
      ? ['B2C']
      : ['B2B']

  const { data, error } = await supabase
    .from('plans')
    .select('id, name, plan_audience')
    .in('plan_audience', audiences)
    .eq('status', 'PUBLISHED')

  if (error) throw new Error(error.message)
  return data ?? []
}

export type PlanMembership = {
  pcmId: string
  planId: string
  planName: string
  planAudience: string
}

export async function fetchContentPlanMembership(
  id: string,
  contentType: 'ASSESSMENT' | 'COURSE',
): Promise<PlanMembership[]> {
  const { data, error } = await supabase
    .from('plan_content_map')
    .select('id, plan_id, plans(id, name, plan_audience)')
    .eq('content_item_id', id)
    .eq('content_type', contentType)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans
    return {
      pcmId: row.id,
      planId: row.plan_id,
      planName: (plan as { name: string } | null)?.name ?? 'Unknown Plan',
      planAudience: (plan as { plan_audience: string } | null)?.plan_audience ?? 'B2C',
    }
  })
}

export async function makeLive(
  id: string,
  contentType: 'ASSESSMENT' | 'COURSE',
  audienceType: string,
): Promise<void> {
  const table = contentType === 'ASSESSMENT' ? 'content_items' : 'courses'
  const { error } = await supabase
    .from(table)
    .update({ status: 'LIVE', audience_type: audienceType })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function archiveContent(
  id: string,
  contentType: 'ASSESSMENT' | 'COURSE',
): Promise<void> {
  // Remove from all plans first
  await supabase
    .from('plan_content_map')
    .delete()
    .eq('content_item_id', id)
    .eq('content_type', contentType)

  const table = contentType === 'ASSESSMENT' ? 'content_items' : 'courses'
  const { error } = await supabase
    .from(table)
    .update({ status: 'ARCHIVED' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function reclassifyAudience(
  id: string,
  contentType: 'ASSESSMENT' | 'COURSE',
  newAudienceType: string,
  incompatiblePcmIds: string[],
): Promise<void> {
  if (incompatiblePcmIds.length > 0) {
    await supabase.from('plan_content_map').delete().in('id', incompatiblePcmIds)
  }

  const table = contentType === 'ASSESSMENT' ? 'content_items' : 'courses'
  const { error } = await supabase
    .from(table)
    .update({ audience_type: newAudienceType })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
