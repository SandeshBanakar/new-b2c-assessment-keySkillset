'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  BookOpen,
  FileText,
  Search,
  Users,
  Building2,
  UserCircle,
  X,
  ChevronDown,
  CheckCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId, CA_ADMIN_USER_MAP } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogItem {
  id: string
  title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  item_type: string
  category: string | null
  audience_type: string | null
  source: 'GLOBAL' | 'TENANT_PRIVATE'
  assignment_count: number
}

interface Department {
  id: string
  name: string
  learner_count: number
}

interface Team {
  id: string
  department_id: string
  name: string
  learner_count: number
}

interface Learner {
  id: string
  full_name: string
  email: string
}

type TargetType = 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
type FilterType = 'ALL' | 'ASSESSMENT' | 'COURSE'

// ─── Content type badge ───────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'ASSESSMENT' | 'COURSE' }) {
  return type === 'ASSESSMENT' ? (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <FileText className="w-3 h-3" />
      Assessment
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
      <BookOpen className="w-3 h-3" />
      Course
    </span>
  )
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: 'GLOBAL' | 'TENANT_PRIVATE' }) {
  return source === 'TENANT_PRIVATE' ? (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Own
    </span>
  ) : null
}

// ─── Assign slide-over ────────────────────────────────────────────────────────

function AssignSlideOver({
  item,
  tenantId,
  adminUserId,
  onClose,
  onAssigned,
}: {
  item: CatalogItem
  tenantId: string
  adminUserId: string
  onClose: () => void
  onAssigned: () => void
}) {
  const [targetType, setTargetType] = useState<TargetType>('DEPARTMENT')
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [learners, setLearners] = useState<Learner[]>([])

  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedLearnerId, setSelectedLearnerId] = useState('')
  const [learnerSearch, setLearnerSearch] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Derived: learner count preview
  const selectedDept = departments.find((d) => d.id === selectedDeptId)
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const filteredTeams = teams.filter((t) => t.department_id === selectedDeptId)
  const filteredLearners = learners.filter(
    (l) =>
      !learnerSearch ||
      l.full_name.toLowerCase().includes(learnerSearch.toLowerCase()) ||
      l.email.toLowerCase().includes(learnerSearch.toLowerCase())
  )

  useEffect(() => {
    async function load() {
      const [{ data: depts }, { data: rawTeams }, { data: rawLearners }] = await Promise.all([
        supabase
          .from('departments')
          .select('id, name')
          .eq('tenant_id', tenantId)
          .eq('status', 'ACTIVE')
          .order('name'),
        supabase
          .from('teams')
          .select('id, department_id, name')
          .eq('tenant_id', tenantId)
          .eq('status', 'ACTIVE')
          .order('name'),
        supabase
          .from('learners')
          .select('id, full_name, email, department_id, team_id')
          .eq('tenant_id', tenantId)
          .eq('status', 'ACTIVE')
          .order('full_name'),
      ])

      const learnerList = rawLearners ?? []

      // Compute learner counts per dept
      const deptCounts: Record<string, number> = {}
      learnerList.forEach((l) => {
        if (l.department_id) deptCounts[l.department_id] = (deptCounts[l.department_id] ?? 0) + 1
      })

      // Compute learner counts per team
      const teamCounts: Record<string, number> = {}
      learnerList.forEach((l) => {
        if (l.team_id) teamCounts[l.team_id] = (teamCounts[l.team_id] ?? 0) + 1
      })

      setDepartments((depts ?? []).map((d) => ({ ...d, learner_count: deptCounts[d.id] ?? 0 })))
      setTeams((rawTeams ?? []).map((t) => ({ ...t, learner_count: teamCounts[t.id] ?? 0 })))
      setLearners(learnerList.map((l) => ({ id: l.id, full_name: l.full_name, email: l.email })))
    }
    void load()
  }, [tenantId])

  function resetSelections() {
    setSelectedDeptId('')
    setSelectedTeamId('')
    setSelectedLearnerId('')
    setLearnerSearch('')
    setError(null)
  }

  function handleTargetTypeChange(t: TargetType) {
    setTargetType(t)
    resetSelections()
  }

  function learnerCountPreview(): number | null {
    if (targetType === 'DEPARTMENT' && selectedDeptId) return selectedDept?.learner_count ?? 0
    if (targetType === 'TEAM' && selectedTeamId) return selectedTeam?.learner_count ?? 0
    if (targetType === 'INDIVIDUAL' && selectedLearnerId) return 1
    return null
  }

  async function handleAssign() {
    setError(null)

    const targetId =
      targetType === 'DEPARTMENT'
        ? selectedDeptId
        : targetType === 'TEAM'
        ? selectedTeamId
        : selectedLearnerId

    if (!targetId) {
      setError(
        targetType === 'DEPARTMENT'
          ? 'Select a department.'
          : targetType === 'TEAM'
          ? 'Select a team.'
          : 'Select a learner.'
      )
      return
    }

    setSaving(true)

    // Check for existing active assignment to same target
    const { data: existing } = await supabase
      .from('content_assignments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('content_id', item.id)
      .eq('content_type', item.content_type)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .is('removed_at', null)
      .limit(1)

    if (existing && existing.length > 0) {
      setError('This content is already assigned to the selected target.')
      setSaving(false)
      return
    }

    // Insert content_assignment
    const { data: assignment, error: assignErr } = await supabase
      .from('content_assignments')
      .insert({
        tenant_id: tenantId,
        content_id: item.id,
        content_type: item.content_type,
        target_type: targetType,
        target_id: targetId,
        assigned_by: adminUserId,
      })
      .select('id')
      .single()

    if (assignErr || !assignment) {
      setError(assignErr?.message ?? 'Failed to create assignment.')
      setSaving(false)
      return
    }

    // Fetch learners in target for learner_content_access
    let targetLearnerIds: string[] = []

    if (targetType === 'INDIVIDUAL') {
      targetLearnerIds = [targetId]
    } else if (targetType === 'DEPARTMENT') {
      const { data: dl } = await supabase
        .from('learners')
        .select('id')
        .eq('department_id', targetId)
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE')
      targetLearnerIds = (dl ?? []).map((l) => l.id)
    } else {
      const { data: tl } = await supabase
        .from('learners')
        .select('id')
        .eq('team_id', targetId)
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE')
      targetLearnerIds = (tl ?? []).map((l) => l.id)
    }

    // Insert learner_content_access rows
    if (targetLearnerIds.length > 0) {
      await supabase.from('learner_content_access').insert(
        targetLearnerIds.map((learnerId) => ({
          learner_id: learnerId,
          content_id: item.id,
          content_type: item.content_type,
          tenant_id: tenantId,
          source_assignment_id: assignment.id,
        }))
      )
    }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      onAssigned()
      onClose()
    }, 1200)
  }

  const previewCount = learnerCountPreview()

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-120 z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Assign Content</h2>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.title}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Content summary */}
          <div className="bg-zinc-50 rounded-md px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              {item.content_type === 'ASSESSMENT' ? (
                <FileText className="w-4 h-4 text-blue-600" />
              ) : (
                <BookOpen className="w-4 h-4 text-violet-600" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-900">{item.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {item.content_type} · {item.item_type.replace(/_/g, ' ')}
                {item.category ? ` · ${item.category}` : ''}
              </p>
            </div>
          </div>

          {/* Target type */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Assign to
            </p>
            <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5">
              {(['DEPARTMENT', 'TEAM', 'INDIVIDUAL'] as TargetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTargetTypeChange(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                    targetType === t
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {t === 'DEPARTMENT' ? (
                    <Building2 className="w-3.5 h-3.5" />
                  ) : t === 'TEAM' ? (
                    <Users className="w-3.5 h-3.5" />
                  ) : (
                    <UserCircle className="w-3.5 h-3.5" />
                  )}
                  {t === 'INDIVIDUAL' ? 'Individual' : t === 'DEPARTMENT' ? 'Department' : 'Team'}
                </button>
              ))}
            </div>
          </div>

          {/* Target selector */}
          {targetType === 'DEPARTMENT' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
              <div className="relative">
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.learner_count} learner{d.learner_count !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}

          {targetType === 'TEAM' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                <div className="relative">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => { setSelectedDeptId(e.target.value); setSelectedTeamId('') }}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select a department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Team</label>
                <div className="relative">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={!selectedDeptId}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a team…</option>
                    {filteredTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.learner_count} learner{t.learner_count !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
                {selectedDeptId && filteredTeams.length === 0 && (
                  <p className="text-xs text-zinc-400 mt-1">No active teams in this department.</p>
                )}
              </div>
            </div>
          )}

          {targetType === 'INDIVIDUAL' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Learner</label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={learnerSearch}
                  onChange={(e) => { setLearnerSearch(e.target.value); setSelectedLearnerId('') }}
                  placeholder="Search by name or email…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div className="border border-zinc-200 rounded-md max-h-48 overflow-y-auto">
                {filteredLearners.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-zinc-400 text-center">No learners found.</p>
                ) : (
                  filteredLearners.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLearnerId(l.id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                        selectedLearnerId === l.id
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{l.full_name}</p>
                        <p className="text-xs text-zinc-400">{l.email}</p>
                      </div>
                      {selectedLearnerId === l.id && (
                        <CheckCircle className="w-4 h-4 text-violet-600 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Access preview */}
          {previewCount !== null && (
            <div className="bg-violet-50 border border-violet-200 rounded-md px-4 py-3">
              <p className="text-sm text-violet-700">
                <span className="font-semibold">{previewCount}</span>{' '}
                {previewCount === 1 ? 'learner' : 'learners'} will get immediate access.
              </p>
              <p className="text-xs text-violet-600 mt-0.5">
                Future learners added to this{' '}
                {targetType === 'DEPARTMENT' ? 'department' : targetType === 'TEAM' ? 'team' : 'group'}{' '}
                will automatically inherit access.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">Content assigned successfully.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={saving || success}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)
  const adminUserId = tenantId ? (CA_ADMIN_USER_MAP[tenantId] ?? '') : ''

  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('ALL')
  const [search, setSearch] = useState('')
  const [assignItem, setAssignItem] = useState<CatalogItem | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!tenantId) { setLoading(false); return }
    setLoading(true)

    // 1. Get plans assigned to this tenant
    const { data: planRows } = await supabase
      .from('tenant_plan_map')
      .select('plan_id')
      .eq('tenant_id', tenantId)

    const planIds = (planRows ?? []).map((r) => r.plan_id)

    // 2. GLOBAL assessments via plan_content_map for B2B plans
    const globalAssessments: CatalogItem[] = []
    if (planIds.length > 0) {
      const { data: pcmRows } = await supabase
        .from('plan_content_map')
        .select('content_item_id')
        .in('plan_id', planIds)
        .eq('content_type', 'ASSESSMENT')
        .eq('excluded', false)

      const contentIds = [...new Set((pcmRows ?? []).map((r) => r.content_item_id))]

      if (contentIds.length > 0) {
        const { data: ciRows } = await supabase
          .from('content_items')
          .select('id, title, test_type, audience_type, visibility_scope, exam_categories(name)')
          .in('id', contentIds)
          .eq('status', 'LIVE')
          .eq('visibility_scope', 'GLOBAL')

        for (const ci of ciRows ?? []) {
          globalAssessments.push({
            id: ci.id,
            title: ci.title,
            content_type: 'ASSESSMENT',
            item_type: ci.test_type ?? '',
            category: (ci.exam_categories as unknown as { name: string } | null)?.name ?? null,
            audience_type: ci.audience_type,
            source: 'GLOBAL',
            assignment_count: 0,
          })
        }
      }
    }

    // 3. TENANT_PRIVATE LIVE assessments (FULL_CREATOR only)
    const privateAssessments: CatalogItem[] = []
    const { data: privateRows } = await supabase
      .from('content_items')
      .select('id, title, test_type, audience_type, exam_categories(name)')
      .eq('tenant_scope_id', tenantId)
      .eq('status', 'LIVE')
      .eq('visibility_scope', 'TENANT_PRIVATE')

    for (const ci of privateRows ?? []) {
      privateAssessments.push({
        id: ci.id,
        title: ci.title,
        content_type: 'ASSESSMENT',
        item_type: ci.test_type ?? '',
        category: (ci.exam_categories as unknown as { name: string } | null)?.name ?? null,
        audience_type: ci.audience_type,
        source: 'TENANT_PRIVATE',
        assignment_count: 0,
      })
    }

    // 4. B2B LIVE courses (all B2B_ONLY or BOTH — shown to any tenant with a B2B plan)
    const courses: CatalogItem[] = []
    if (planIds.length > 0) {
      const { data: courseRows } = await supabase
        .from('courses')
        .select('id, title, course_type, audience_type')
        .eq('status', 'LIVE')
        .in('audience_type', ['B2B_ONLY', 'BOTH'])
        .order('title')

      for (const c of courseRows ?? []) {
        courses.push({
          id: c.id,
          title: c.title,
          content_type: 'COURSE',
          item_type: c.course_type ?? '',
          category: null,
          audience_type: c.audience_type,
          source: 'GLOBAL',
          assignment_count: 0,
        })
      }
    }

    // 5. Merge and deduplicate
    const allItemIds = new Set<string>()
    const merged: CatalogItem[] = []
    for (const item of [...globalAssessments, ...privateAssessments, ...courses]) {
      if (!allItemIds.has(item.id)) {
        allItemIds.add(item.id)
        merged.push(item)
      }
    }

    // 6. Fetch assignment counts
    const { data: assignmentCounts } = await supabase
      .from('content_assignments')
      .select('content_id, content_type')
      .eq('tenant_id', tenantId)
      .is('removed_at', null)
      .in('content_id', merged.map((i) => i.id))

    const countMap: Record<string, number> = {}
    for (const a of assignmentCounts ?? []) {
      countMap[a.content_id] = (countMap[a.content_id] ?? 0) + 1
    }
    for (const item of merged) {
      item.assignment_count = countMap[item.id] ?? 0
    }

    setItems(merged)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])

  const filtered = items.filter((item) => {
    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'ASSESSMENT' && item.content_type === 'ASSESSMENT') ||
      (filterType === 'COURSE' && item.content_type === 'COURSE')

    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.category ?? '').toLowerCase().includes(q) ||
      item.item_type.toLowerCase().includes(q)

    return matchesType && matchesSearch
  })

  const assessmentCount = items.filter((i) => i.content_type === 'ASSESSMENT').length
  const courseCount = items.filter((i) => i.content_type === 'COURSE').length

  function formatItemType(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Content Catalog</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading ? 'Loading…' : `${items.length} items available · ${assessmentCount} assessments · ${courseCount} courses`}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5">
          {(['ALL', 'ASSESSMENT', 'COURSE'] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                filterType === t
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'ASSESSMENT' ? 'Assessments' : 'Courses'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-zinc-400">Loading catalog…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="text-sm font-medium text-zinc-500">
              {search || filterType !== 'ALL' ? 'No content matches your filter.' : 'No content available in this catalog.'}
            </p>
            {!search && filterType === 'ALL' && (
              <p className="text-xs text-zinc-400 mt-1">
                Content becomes available once plans are assigned to this tenant.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Category / Format
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Assigned
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">{item.title}</span>
                      <SourceBadge source={item.source} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <TypeBadge type={item.content_type} />
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {item.category ?? formatItemType(item.item_type)}
                  </td>
                  <td className="px-5 py-3">
                    {item.assignment_count > 0 ? (
                      <span className="text-xs font-medium text-zinc-600 bg-zinc-100 rounded-md px-2 py-0.5">
                        {item.assignment_count} target{item.assignment_count !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setAssignItem(item)}
                      className="px-3 py-1.5 text-xs font-medium text-violet-700 border border-violet-200 rounded-md hover:bg-violet-50 transition-colors"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign slide-over */}
      {assignItem && tenantId && (
        <AssignSlideOver
          item={assignItem}
          tenantId={tenantId}
          adminUserId={adminUserId}
          onClose={() => setAssignItem(null)}
          onAssigned={() => { setAssignItem(null); fetchCatalog() }}
        />
      )}
    </div>
  )
}
