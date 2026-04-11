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
  ChevronRight,
  CheckCircle,
  Info,
  BarChart2,
  Hash,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId, CA_ADMIN_USER_MAP } from '@/lib/client-admin/tenants'
import { formatCourseType } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentTarget {
  type: 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
  name: string
}

interface CatalogItem {
  id: string
  title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  item_type: string
  category: string | null
  audience_type: string | null
  source: 'GLOBAL' | 'TENANT_PRIVATE'
  assignment_count: number
  assignment_targets: AssignmentTarget[]
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

interface CourseTopic {
  id: string
  title: string
  order_index: number
}

interface CourseModuleWithTopics {
  id: string
  title: string
  order_index: number
  topics: CourseTopic[]
}

type Tab = 'COURSES' | 'ASSESSMENTS'
type TargetType = 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'

// ─── Badges ───────────────────────────────────────────────────────────────────

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

function SourceBadge({ source }: { source: 'GLOBAL' | 'TENANT_PRIVATE' }) {
  return source === 'TENANT_PRIVATE' ? (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Your Organisation
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
      keySkillset Content
    </span>
  )
}

// ─── Assignment tooltip ───────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  DEPARTMENT: 'Dept',
  TEAM: 'Team',
  INDIVIDUAL: 'User',
}

function AssignmentTooltip({ count, targets }: { count: number; targets: AssignmentTarget[] }) {
  const MAX_SHOWN = 5
  const shown = targets.slice(0, MAX_SHOWN)
  const overflow = targets.length - MAX_SHOWN

  return (
    <div className="relative inline-block group">
      <span className="text-xs font-medium text-zinc-700 underline decoration-dotted cursor-default">{count}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-zinc-800 text-white text-xs rounded-md px-3 py-2 shadow-lg pointer-events-none min-w-40">
        {shown.map((t, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wide w-10 shrink-0">{TYPE_LABEL[t.type]}</span>
            <span className="truncate">{t.name}</span>
          </div>
        ))}
        {overflow > 0 && <div className="text-zinc-400 pt-1 mt-1 border-t border-zinc-600">+{overflow} more</div>}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
      </div>
    </div>
  )
}

// ─── Course module accordion ──────────────────────────────────────────────────

function CourseModuleAccordion({ modules }: { modules: CourseModuleWithTopics[] }) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null)

  if (modules.length === 0) {
    return <p className="text-sm text-zinc-400 py-2">Module details not available yet.</p>
  }

  return (
    <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-md overflow-hidden">
      {modules.map(mod => {
        const isOpen = openId === mod.id
        return (
          <div key={mod.id}>
            <button
              onClick={() => setOpenId(isOpen ? null : mod.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors"
            >
              <span className="text-sm font-medium text-zinc-800">{mod.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-400">{mod.topics.length} topic{mod.topics.length !== 1 ? 's' : ''}</span>
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              </div>
            </button>
            {isOpen && mod.topics.length > 0 && (
              <ul className="px-4 pb-3 space-y-1 bg-zinc-50">
                {mod.topics.map(t => (
                  <li key={t.id} className="flex items-center gap-2 text-xs text-zinc-600 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Content detail + assign slide-over ──────────────────────────────────────

function ContentDetailSlideOver({
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
  // Detail state
  const [modules, setModules] = useState<CourseModuleWithTopics[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [tenantAttempts, setTenantAttempts] = useState<number | null>(null)

  // Assign state
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

  const filteredTeams = teams.filter(t => t.department_id === selectedDeptId)
  const filteredLearners = learners.filter(
    l => !learnerSearch || l.full_name.toLowerCase().includes(learnerSearch.toLowerCase()) || l.email.toLowerCase().includes(learnerSearch.toLowerCase())
  )

  useEffect(() => {
    // Fetch assign targets
    async function loadAssignData() {
      const [{ data: depts }, { data: rawTeams }, { data: rawLearners }] = await Promise.all([
        supabase.from('departments').select('id, name').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('name'),
        supabase.from('teams').select('id, department_id, name').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('name'),
        supabase.from('learners').select('id, full_name, email').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('full_name'),
      ])

      const learnerList = rawLearners ?? []
      const deptCounts: Record<string, number> = {}
      learnerList.forEach(l => { if ((l as any).department_id) deptCounts[(l as any).department_id] = (deptCounts[(l as any).department_id] ?? 0) + 1 })
      const teamCounts: Record<string, number> = {}
      learnerList.forEach(l => { if ((l as any).team_id) teamCounts[(l as any).team_id] = (teamCounts[(l as any).team_id] ?? 0) + 1 })

      setDepartments((depts ?? []).map(d => ({ ...d, learner_count: deptCounts[d.id] ?? 0 })))
      setTeams((rawTeams ?? []).map(t => ({ ...t, learner_count: teamCounts[t.id] ?? 0 })))
      setLearners(learnerList.map(l => ({ id: l.id, full_name: l.full_name, email: l.email })))
    }

    void loadAssignData()

    // Fetch content-specific detail data
    if (item.content_type === 'COURSE') {
      setModulesLoading(true)
      async function loadModules() {
        const { data: moduleRows } = await supabase
          .from('course_modules')
          .select('id, title, order_index')
          .eq('course_id', item.id)
          .order('order_index')

        const moduleIds = (moduleRows ?? []).map(m => m.id)
        const { data: topicRows } = moduleIds.length > 0
          ? await supabase.from('course_topics').select('id, module_id, title, order_index').in('module_id', moduleIds).order('order_index')
          : { data: [] as { id: string; module_id: string; title: string; order_index: number }[] }

        const merged: CourseModuleWithTopics[] = (moduleRows ?? []).map(m => ({
          ...m,
          topics: (topicRows ?? []).filter(t => t.module_id === m.id),
        }))

        setModules(merged)
        setModulesLoading(false)
      }
      void loadModules()
    }

    if (item.content_type === 'ASSESSMENT') {
      supabase
        .from('learner_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('content_id', item.id)
        .eq('content_type', 'ASSESSMENT')
        .then(({ count }) => setTenantAttempts(count ?? 0))
    }
  }, [item.id, item.content_type, tenantId])

  function resetSelections() {
    setSelectedDeptId('')
    setSelectedTeamId('')
    setSelectedLearnerId('')
    setLearnerSearch('')
    setError(null)
  }

  const selectedDept = departments.find(d => d.id === selectedDeptId)
  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  function learnerCountPreview(): number | null {
    if (targetType === 'DEPARTMENT' && selectedDeptId) return selectedDept?.learner_count ?? 0
    if (targetType === 'TEAM' && selectedTeamId) return selectedTeam?.learner_count ?? 0
    if (targetType === 'INDIVIDUAL' && selectedLearnerId) return 1
    return null
  }

  async function handleAssign() {
    setError(null)
    const targetId = targetType === 'DEPARTMENT' ? selectedDeptId : targetType === 'TEAM' ? selectedTeamId : selectedLearnerId
    if (!targetId) {
      setError(targetType === 'DEPARTMENT' ? 'Select a department.' : targetType === 'TEAM' ? 'Select a team.' : 'Select a learner.')
      return
    }
    setSaving(true)

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

    const { data: assignment, error: assignErr } = await supabase
      .from('content_assignments')
      .insert({ tenant_id: tenantId, content_id: item.id, content_type: item.content_type, target_type: targetType, target_id: targetId, assigned_by: adminUserId })
      .select('id')
      .single()

    if (assignErr || !assignment) { setError(assignErr?.message ?? 'Failed to create assignment.'); setSaving(false); return }

    let targetLearnerIds: string[] = []
    if (targetType === 'INDIVIDUAL') {
      targetLearnerIds = [targetId]
    } else if (targetType === 'DEPARTMENT') {
      const { data: dl } = await supabase.from('learners').select('id').eq('department_id', targetId).eq('tenant_id', tenantId).eq('status', 'ACTIVE')
      targetLearnerIds = (dl ?? []).map(l => l.id)
    } else {
      const { data: tl } = await supabase.from('learners').select('id').eq('team_id', targetId).eq('tenant_id', tenantId).eq('status', 'ACTIVE')
      targetLearnerIds = (tl ?? []).map(l => l.id)
    }

    if (targetLearnerIds.length > 0) {
      await supabase.from('learner_content_access').insert(
        targetLearnerIds.map(learnerId => ({
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
    setTimeout(() => { setSuccess(false); onAssigned(); onClose() }, 1200)
  }

  const previewCount = learnerCountPreview()

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-120 z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
              {item.content_type === 'ASSESSMENT'
                ? <FileText className="w-4 h-4 text-blue-600" />
                : <BookOpen className="w-4 h-4 text-violet-600" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 leading-snug">{item.title}</h2>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <TypeBadge type={item.content_type} />
                <SourceBadge source={item.source} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 shrink-0 mt-0.5 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Content details */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Details</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {item.content_type === 'ASSESSMENT' && (
                <>
                  <div>
                    <p className="text-xs text-zinc-400">Category</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{item.category ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Test Type</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{item.item_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Questions</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">—</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Attempts in your org</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">
                      {tenantAttempts == null ? '…' : tenantAttempts}
                    </p>
                  </div>
                </>
              )}
              {item.content_type === 'COURSE' && (
                <>
                  <div>
                    <p className="text-xs text-zinc-400">Course Format</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{item.item_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Audience</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{item.audience_type?.replace('_', ' ') ?? '—'}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-zinc-400">Assigned to</p>
                <p className="text-sm font-medium text-zinc-900 mt-0.5">
                  {item.assignment_count > 0 ? `${item.assignment_count} target${item.assignment_count !== 1 ? 's' : ''}` : 'Not yet assigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Course modules */}
          {item.content_type === 'COURSE' && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Modules</p>
              {modulesLoading
                ? <p className="text-sm text-zinc-400">Loading modules…</p>
                : <CourseModuleAccordion modules={modules} />}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-zinc-100" />

          {/* Assign section */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Assign To</p>

            <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5 mb-4">
              {(['DEPARTMENT', 'TEAM', 'INDIVIDUAL'] as TargetType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTargetType(t); resetSelections() }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                    targetType === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {t === 'DEPARTMENT' ? <Building2 className="w-3.5 h-3.5" /> : t === 'TEAM' ? <Users className="w-3.5 h-3.5" /> : <UserCircle className="w-3.5 h-3.5" />}
                  {t === 'INDIVIDUAL' ? 'Individual' : t === 'DEPARTMENT' ? 'Department' : 'Team'}
                </button>
              ))}
            </div>

            {targetType === 'DEPARTMENT' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                <div className="relative">
                  <select
                    value={selectedDeptId}
                    onChange={e => setSelectedDeptId(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="">Select a department…</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.learner_count} learner{d.learner_count !== 1 ? 's' : ''})</option>
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
                      onChange={e => { setSelectedDeptId(e.target.value); setSelectedTeamId('') }}
                      className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="">Select a department…</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Team</label>
                  <div className="relative">
                    <select
                      value={selectedTeamId}
                      onChange={e => setSelectedTeamId(e.target.value)}
                      disabled={!selectedDeptId}
                      className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a team…</option>
                      {filteredTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.learner_count} learner{t.learner_count !== 1 ? 's' : ''})</option>
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
                    onChange={e => { setLearnerSearch(e.target.value); setSelectedLearnerId('') }}
                    placeholder="Search by name or email…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="border border-zinc-200 rounded-md max-h-48 overflow-y-auto">
                  {filteredLearners.length === 0
                    ? <p className="px-3 py-3 text-sm text-zinc-400 text-center">No learners found.</p>
                    : filteredLearners.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLearnerId(l.id)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                          selectedLearnerId === l.id ? 'bg-violet-50 text-violet-700' : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{l.full_name}</p>
                          <p className="text-xs text-zinc-400">{l.email}</p>
                        </div>
                        {selectedLearnerId === l.id && <CheckCircle className="w-4 h-4 text-violet-600 shrink-0" />}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {previewCount !== null && (
              <div className="bg-violet-50 border border-violet-200 rounded-md px-4 py-3 mt-4">
                <p className="text-sm text-violet-700">
                  <span className="font-semibold">{previewCount}</span>{' '}
                  {previewCount === 1 ? 'learner' : 'learners'} will get immediate access.
                </p>
              </div>
            )}

            {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 flex items-center gap-2 mt-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">Content assigned successfully.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ search, tab }: { search: string; tab: Tab }) {
  return (
    <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
      {tab === 'COURSES'
        ? <BookOpen className="w-8 h-8 text-zinc-300 mb-3" />
        : <FileText className="w-8 h-8 text-zinc-300 mb-3" />}
      <p className="text-sm font-medium text-zinc-500">
        {search ? 'No content matches your search.' : tab === 'COURSES' ? 'No courses available.' : 'No assessments available.'}
      </p>
      {!search && (
        <p className="text-xs text-zinc-400 mt-1">
          Content becomes available once plans are assigned to this tenant.
        </p>
      )}
    </div>
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
  const [activeTab, setActiveTab] = useState<Tab>('COURSES')
  const [search, setSearch] = useState('')
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null)
  const [tenantMode, setTenantMode] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase.from('tenants').select('feature_toggle_mode').eq('id', tenantId).single()
      .then(({ data }) => { if (data) setTenantMode(data.feature_toggle_mode) })
  }, [tenantId])

  const fetchCatalog = useCallback(async () => {
    if (!tenantId) { setLoading(false); return }
    setLoading(true)

    const { data: planRows } = await supabase.from('tenant_plan_map').select('plan_id').eq('tenant_id', tenantId)
    const planIds = (planRows ?? []).map(r => r.plan_id)

    const globalAssessments: CatalogItem[] = []
    if (planIds.length > 0) {
      const { data: pcmRows } = await supabase
        .from('plan_content_map').select('content_item_id').in('plan_id', planIds).eq('content_type', 'ASSESSMENT').eq('excluded', false)
      const contentIds = [...new Set((pcmRows ?? []).map(r => r.content_item_id))]
      if (contentIds.length > 0) {
        const { data: ciRows } = await supabase
          .from('assessment_items').select('id, title, test_type, audience_type, visibility_scope, exam_categories(name)')
          .in('id', contentIds).eq('status', 'LIVE').eq('visibility_scope', 'GLOBAL')
        for (const ci of ciRows ?? []) {
          globalAssessments.push({
            id: ci.id, title: ci.title, content_type: 'ASSESSMENT', item_type: ci.test_type ?? '',
            category: (ci.exam_categories as unknown as { name: string } | null)?.name ?? null,
            audience_type: ci.audience_type, source: 'GLOBAL', assignment_count: 0, assignment_targets: [],
          })
        }
      }
    }

    const privateAssessments: CatalogItem[] = []
    const { data: privateRows } = await supabase
      .from('assessment_items').select('id, title, test_type, audience_type, exam_categories(name)')
      .eq('tenant_scope_id', tenantId).eq('status', 'LIVE').eq('visibility_scope', 'TENANT_PRIVATE')
    for (const ci of privateRows ?? []) {
      privateAssessments.push({
        id: ci.id, title: ci.title, content_type: 'ASSESSMENT', item_type: ci.test_type ?? '',
        category: (ci.exam_categories as unknown as { name: string } | null)?.name ?? null,
        audience_type: ci.audience_type, source: 'TENANT_PRIVATE', assignment_count: 0, assignment_targets: [],
      })
    }

    const courses: CatalogItem[] = []
    if (planIds.length > 0) {
      const { data: courseRows } = await supabase
        .from('courses').select('id, title, course_type, audience_type').eq('status', 'LIVE').in('audience_type', ['B2B_ONLY', 'BOTH']).order('title')
      for (const c of courseRows ?? []) {
        courses.push({
          id: c.id, title: c.title, content_type: 'COURSE', item_type: formatCourseType(c.course_type) ?? '',
          category: null, audience_type: c.audience_type, source: 'GLOBAL', assignment_count: 0, assignment_targets: [],
        })
      }
    }

    // TENANT_PRIVATE LIVE courses for FULL_CREATOR
    if (tenantMode === 'FULL_CREATOR') {
      const { data: privateCourseRows } = await supabase
        .from('courses').select('id, title, course_type, audience_type').eq('tenant_id', tenantId).eq('status', 'LIVE').order('title')
      for (const c of privateCourseRows ?? []) {
        courses.push({
          id: c.id, title: c.title, content_type: 'COURSE', item_type: formatCourseType(c.course_type) ?? '',
          category: null, audience_type: c.audience_type, source: 'TENANT_PRIVATE', assignment_count: 0, assignment_targets: [],
        })
      }
    }

    const allItemIds = new Set<string>()
    const merged: CatalogItem[] = []
    for (const item of [...globalAssessments, ...privateAssessments, ...courses]) {
      if (!allItemIds.has(item.id)) { allItemIds.add(item.id); merged.push(item) }
    }

    const { data: assignmentRows } = await supabase
      .from('content_assignments').select('content_id, target_type, target_id').eq('tenant_id', tenantId)
      .is('removed_at', null).in('content_id', merged.map(i => i.id))

    const rows = assignmentRows ?? []
    const deptIds = [...new Set(rows.filter(a => a.target_type === 'DEPARTMENT').map(a => a.target_id))]
    const teamIds = [...new Set(rows.filter(a => a.target_type === 'TEAM').map(a => a.target_id))]
    const learnerIds = [...new Set(rows.filter(a => a.target_type === 'INDIVIDUAL').map(a => a.target_id))]

    const [deptRes, teamRes, learnerRes] = await Promise.all([
      deptIds.length > 0 ? supabase.from('departments').select('id, name').in('id', deptIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      teamIds.length > 0 ? supabase.from('teams').select('id, name').in('id', teamIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      learnerIds.length > 0 ? supabase.from('learners').select('id, full_name').in('id', learnerIds) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ])

    const nameMap: Record<string, { name: string; type: 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL' }> = {}
    for (const d of deptRes.data ?? []) nameMap[d.id] = { name: d.name, type: 'DEPARTMENT' }
    for (const t of teamRes.data ?? []) nameMap[t.id] = { name: t.name, type: 'TEAM' }
    for (const l of learnerRes.data ?? []) nameMap[l.id] = { name: l.full_name, type: 'INDIVIDUAL' }

    const targetsByItem: Record<string, AssignmentTarget[]> = {}
    for (const a of rows) {
      if (!targetsByItem[a.content_id]) targetsByItem[a.content_id] = []
      const entry = nameMap[a.target_id]
      if (entry) targetsByItem[a.content_id].push({ type: entry.type, name: entry.name })
    }
    for (const item of merged) {
      item.assignment_targets = targetsByItem[item.id] ?? []
      item.assignment_count = item.assignment_targets.length
    }

    setItems(merged)
    setLoading(false)
  }, [tenantId, tenantMode])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])

  const courses = items.filter(i => i.content_type === 'COURSE')
  const assessments = items.filter(i => i.content_type === 'ASSESSMENT')

  const activeItems = activeTab === 'COURSES' ? courses : assessments
  const filtered = activeItems.filter(item => {
    const q = search.toLowerCase()
    return !q || item.title.toLowerCase().includes(q) || (item.category ?? '').toLowerCase().includes(q) || item.item_type.toLowerCase().includes(q)
  })

  function formatTestType(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Global Catalog</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {loading ? 'Loading…' : `${courses.length} course${courses.length !== 1 ? 's' : ''} · ${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* RUN_ONLY info banner */}
      {tenantMode === 'RUN_ONLY' && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-md px-4 py-3 mb-5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            All content in this catalog is provided by keySkillset.{' '}
            <a href="mailto:contact@keyskillset.com" className="font-medium underline hover:text-blue-800">
              Contact us
            </a>{' '}
            to request additional content.
          </p>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center border-b border-zinc-200">
          {([
            { id: 'COURSES' as Tab, label: 'Courses', count: courses.length, icon: BookOpen },
            { id: 'ASSESSMENTS' as Tab, label: 'Assessments', count: assessments.length, icon: FileText },
          ]).map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSearch('') }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? 'border-violet-700 text-violet-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === id ? 'bg-violet-100 text-violet-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={activeTab === 'COURSES' ? 'Search courses…' : 'Search assessments…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Source legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-md px-2 py-0.5 font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">keySkillset Content</span>
          — added by keySkillset
        </span>
        {tenantMode === 'FULL_CREATOR' && (
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-md px-2 py-0.5 font-medium bg-amber-50 text-amber-700 border border-amber-200">Your Organisation</span>
            — added by your content creators
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-zinc-400">Loading catalog…</div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} tab={activeTab} />
        ) : activeTab === 'COURSES' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Format</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Assigned</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-500 shrink-0" />
                        <span className="font-medium text-zinc-900">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{item.item_type || '—'}</td>
                    <td className="px-5 py-3"><SourceBadge source={item.source} /></td>
                    <td className="px-5 py-3">
                      {item.assignment_count > 0
                        ? <AssignmentTooltip count={item.assignment_count} targets={item.assignment_targets} />
                        : <span className="text-zinc-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDetailItem(item)}
                        className="px-2.5 py-1 text-xs font-medium text-violet-700 border border-violet-200 rounded hover:bg-violet-50 transition-colors"
                      >
                        View & Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Assessment</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Test Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Assigned</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium text-zinc-900">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{item.category ?? '—'}</td>
                    <td className="px-5 py-3 text-zinc-500">{formatTestType(item.item_type)}</td>
                    <td className="px-5 py-3"><SourceBadge source={item.source} /></td>
                    <td className="px-5 py-3">
                      {item.assignment_count > 0
                        ? <AssignmentTooltip count={item.assignment_count} targets={item.assignment_targets} />
                        : <span className="text-zinc-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDetailItem(item)}
                        className="px-2.5 py-1 text-xs font-medium text-violet-700 border border-violet-200 rounded hover:bg-violet-50 transition-colors"
                      >
                        View & Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail + Assign slide-over */}
      {detailItem && tenantId && (
        <ContentDetailSlideOver
          item={detailItem}
          tenantId={tenantId}
          adminUserId={adminUserId}
          onClose={() => setDetailItem(null)}
          onAssigned={() => { setDetailItem(null); fetchCatalog() }}
        />
      )}
    </div>
  )
}
