import { supabase } from '@/lib/supabase/client'

export type ContentCreatorRow = {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  assessment_count: number
  course_count: number
}

export type ContentCreatorDetail = {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
}

export type CCAssessment = {
  id: string
  title: string
  category_name: string | null
  test_type: string
  status: string
  created_at: string
}

export type CCCourse = {
  id: string
  title: string
  status: string
  created_at: string
}

export async function fetchContentCreators(): Promise<ContentCreatorRow[]> {
  const { data: ccs, error } = await supabase
    .from('admin_users')
    .select('id, name, email, is_active, created_at')
    .eq('role', 'CONTENT_CREATOR')
    .is('tenant_id', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!ccs || ccs.length === 0) return []

  const ccIds = ccs.map((cc: { id: string }) => cc.id)

  const [{ data: aRows }, { data: cRows }] = await Promise.all([
    supabase.from('assessment_items').select('created_by').in('created_by', ccIds),
    supabase.from('courses').select('created_by').in('created_by', ccIds),
  ])

  const aCounts: Record<string, number> = {}
  for (const r of aRows ?? []) {
    const id = (r as { created_by: string }).created_by
    aCounts[id] = (aCounts[id] ?? 0) + 1
  }
  const cCounts: Record<string, number> = {}
  for (const r of cRows ?? []) {
    const id = (r as { created_by: string }).created_by
    cCounts[id] = (cCounts[id] ?? 0) + 1
  }

  return ccs.map((cc: { id: string; name: string; email: string; is_active: boolean; created_at: string }) => ({
    ...cc,
    assessment_count: aCounts[cc.id] ?? 0,
    course_count: cCounts[cc.id] ?? 0,
  }))
}

export async function fetchContentCreatorById(id: string): Promise<ContentCreatorDetail | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, name, email, is_active, created_at')
    .eq('id', id)
    .eq('role', 'CONTENT_CREATOR')
    .is('tenant_id', null)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as ContentCreatorDetail | null
}

export async function fetchCCAssessments(createdBy: string): Promise<CCAssessment[]> {
  const { data, error } = await supabase
    .from('assessment_items')
    .select('id, title, test_type, status, created_at, exam_categories(name)')
    .eq('created_by', createdBy)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    title: item.title as string,
    test_type: item.test_type as string,
    status: item.status as string,
    created_at: item.created_at as string,
    category_name: (item.exam_categories as { name: string } | null)?.name ?? null,
  }))
}

export async function fetchCCCourses(createdBy: string): Promise<CCCourse[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, status, created_at')
    .eq('created_by', createdBy)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    title: item.title as string,
    status: item.status as string,
    created_at: item.created_at as string,
  }))
}

export async function createContentCreator(payload: {
  name: string
  email: string
  password: string
}): Promise<void> {
  const { error } = await supabase.from('admin_users').insert({
    name: payload.name.trim(),
    email: payload.email.trim(),
    role: 'CONTENT_CREATOR',
    tenant_id: null,
    is_active: true,
    password_hash: payload.password,
  })
  if (error) throw new Error(error.message)
}

export async function updateContentCreator(
  id: string,
  payload: { name: string; email?: string; password?: string }
): Promise<void> {
  const update: Record<string, string> = {
    name: payload.name.trim(),
  }
  if (payload.email) update.email = payload.email.trim()
  if (payload.password) update.password_hash = payload.password

  const { error } = await supabase.from('admin_users').update(update).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleContentCreatorActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('admin_users').update({ is_active: isActive }).eq('id', id)
  if (error) throw new Error(error.message)
}
