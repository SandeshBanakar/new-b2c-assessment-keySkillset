'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Building2,
  Users,
  Plus,
  ChevronRight,
  X,
  AlertTriangle,
  Search,
  UserPlus,
  FileText,
  BookOpen,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  teamCount: number
  learnerCount: number
}

interface Team {
  id: string
  department_id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
  learnerCount: number
}

interface CandidateLearner {
  id: string
  full_name: string
  email: string
  department_id: string | null
  departmentName?: string
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return status === 'ACTIVE' ? (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
      Inactive
    </span>
  )
}

// ─── Department form modal ────────────────────────────────────────────────────

function DeptModal({
  tenantId,
  editing,
  onClose,
  onSaved,
}: {
  tenantId: string
  editing: Department | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('Department name is required.'); return }
    setSaving(true)
    setError(null)

    if (editing) {
      const { error: e } = await supabase
        .from('departments')
        .update({ name: name.trim(), description: description.trim() || null })
        .eq('id', editing.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase
        .from('departments')
        .insert({ tenant_id: tenantId, name: name.trim(), description: description.trim() || null, status: 'ACTIVE' })
      if (e) { setError(e.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-md mx-4 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editing ? 'Edit Department' : 'New Department'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Department'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Team form modal ──────────────────────────────────────────────────────────

function TeamModal({
  tenantId,
  departmentId,
  editing,
  onClose,
  onSaved,
}: {
  tenantId: string
  departmentId: string
  editing: Team | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('Team name is required.'); return }
    setSaving(true)
    setError(null)

    if (editing) {
      const { error: e } = await supabase
        .from('teams')
        .update({ name: name.trim() })
        .eq('id', editing.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase
        .from('teams')
        .insert({ tenant_id: tenantId, department_id: departmentId, name: name.trim(), status: 'ACTIVE' })
      if (e) { setError(e.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editing ? 'Edit Team' : 'New Team'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Team Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frontend"
            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <p className="text-sm text-zinc-500 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-violet-700 hover:bg-violet-800'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Learners modal ───────────────────────────────────────────────────────

function AddLearnersModal({
  team,
  dept,
  tenantId,
  allDepts,
  onClose,
  onAdded,
}: {
  team: Team
  dept: Department
  tenantId: string
  allDepts: Department[]
  onClose: () => void
  onAdded: (count: number) => void
}) {
  const [step, setStep] = useState<'pick' | 'confirm'>('pick')
  const [candidates, setCandidates] = useState<CandidateLearner[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Fetch unassigned active learners for this tenant
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('learners')
        .select('id, full_name, email, department_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE')
        .is('team_id', null)
        .order('full_name')
      if (data) {
        const deptMap: Record<string, string> = {}
        allDepts.forEach((d) => { deptMap[d.id] = d.name })
        setCandidates(data.map((l) => ({
          ...l,
          departmentName: l.department_id ? deptMap[l.department_id] : undefined,
        })))
      }
      setLoadingCandidates(false)
    }
    void load()
  }, [tenantId, allDepts])

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((c) => c.id)))
    }
  }

  const selectedLearners = candidates.filter((c) => selected.has(c.id))

  async function handleConfirm() {
    setSaving(true)
    const ids = [...selected]
    await supabase
      .from('learners')
      .update({ team_id: team.id, department_id: dept.id })
      .in('id', ids)
    setSaving(false)
    onAdded(ids.length)
  }

  // ── Step 1: Picker ──────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-md border border-zinc-200 w-full max-w-lg mx-4 shadow-lg flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Add Learners</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Adding to <span className="font-medium text-zinc-700">{team.name}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-zinc-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search learners…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingCandidates ? (
              <div className="px-6 py-12 text-center text-sm text-zinc-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                <Users className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm font-medium text-zinc-500">
                  {search ? 'No learners match your search.' : 'No unassigned learners available.'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {!search && 'All active learners are already assigned to a team.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="rounded border-zinc-300 accent-violet-600"
                      />
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Current Dept
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => toggleSelect(c.id)}
                      className="cursor-pointer hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 w-10">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-zinc-300 accent-violet-600"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-zinc-900">{c.full_name}</p>
                        <p className="text-xs text-zinc-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 text-xs">
                        {c.departmentName ?? <span className="text-zinc-300">Unassigned</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              {selected.size > 0 ? `${selected.size} selected` : 'Select learners to add'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={selected.size === 0}
                className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Warning + confirm ───────────────────────────────────────────────
  const deptChanges = selectedLearners.filter(
    (l) => l.department_id && l.department_id !== dept.id
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-lg mx-4 shadow-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Confirm Assignment</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {selectedLearners.length} learner{selectedLearners.length !== 1 ? 's' : ''} → {team.name}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {deptChanges.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {deptChanges.length} learner{deptChanges.length !== 1 ? 's' : ''} will be moved
                to <span className="font-semibold">{dept.name}</span>. Any content previously
                assigned via their old department will be revoked.
              </p>
            </div>
          )}

          <table className="w-full text-sm border border-zinc-100 rounded-md overflow-hidden">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-3 py-2 text-xs font-medium text-zinc-500">Name</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-zinc-500">Dept change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {selectedLearners.map((l) => {
                const deptChange = l.department_id && l.department_id !== dept.id
                const oldDeptName = allDepts.find((d) => d.id === l.department_id)?.name
                return (
                  <tr key={l.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-zinc-900">{l.full_name}</p>
                      <p className="text-xs text-zinc-400">{l.email}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {deptChange ? (
                        <span className="text-amber-700">
                          {oldDeptName} → {dept.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100">
          <button
            onClick={() => setStep('pick')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : `Add ${selectedLearners.length} Learner${selectedLearners.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Team detail slide-over ───────────────────────────────────────────────────

interface TeamLearner {
  id: string
  full_name: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

interface TeamContent {
  id: string
  title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  assigned_at: string
  inherited: boolean
}

function TeamDetailSlideOver({
  team,
  dept,
  tenantId,
  tenantSlug,
  onClose,
  onLearnerRemoved,
}: {
  team: Team
  dept: Department
  tenantId: string
  tenantSlug: string
  onClose: () => void
  onLearnerRemoved: () => void
}) {
  const [learners, setLearners] = useState<TeamLearner[]>([])
  const [content, setContent] = useState<TeamContent[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<TeamLearner | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Team learners
      const { data: rawLearners } = await supabase
        .from('learners')
        .select('id, full_name, status, created_at')
        .eq('team_id', team.id)
        .eq('tenant_id', tenantId)
        .order('full_name')

      setLearners((rawLearners ?? []) as TeamLearner[])

      // Content assignments — team-direct + dept-inherited
      const { data: teamAssignments } = await supabase
        .from('content_assignments')
        .select('content_id, content_type, assigned_at')
        .eq('tenant_id', tenantId)
        .eq('target_type', 'TEAM')
        .eq('target_id', team.id)
        .is('removed_at', null)

      const { data: deptAssignments } = await supabase
        .from('content_assignments')
        .select('content_id, content_type, assigned_at')
        .eq('tenant_id', tenantId)
        .eq('target_type', 'DEPARTMENT')
        .eq('target_id', dept.id)
        .is('removed_at', null)

      const allAssignments = [
        ...((teamAssignments ?? []).map((a) => ({ ...a, inherited: false }))),
        ...((deptAssignments ?? []).map((a) => ({ ...a, inherited: true }))),
      ]

      if (allAssignments.length === 0) {
        setContent([])
        setLoading(false)
        return
      }

      const assessmentIds = allAssignments
        .filter((a) => a.content_type === 'ASSESSMENT')
        .map((a) => a.content_id)
      const courseIds = allAssignments
        .filter((a) => a.content_type === 'COURSE')
        .map((a) => a.content_id)

      const [{ data: ciRows }, { data: courseRows }] = await Promise.all([
        assessmentIds.length > 0
          ? supabase.from('content_items').select('id, title').in('id', assessmentIds)
          : Promise.resolve({ data: [] }),
        courseIds.length > 0
          ? supabase.from('courses').select('id, title').in('id', courseIds)
          : Promise.resolve({ data: [] }),
      ])

      const titleMap: Record<string, string> = {}
      for (const ci of ciRows ?? []) titleMap[ci.id] = ci.title
      for (const c of courseRows ?? []) titleMap[c.id] = c.title

      // Deduplicate by content_id, prefer direct over inherited
      const seen = new Set<string>()
      const merged: TeamContent[] = []
      // Direct first
      for (const a of allAssignments.filter((x) => !x.inherited)) {
        if (!seen.has(a.content_id) && titleMap[a.content_id]) {
          seen.add(a.content_id)
          merged.push({
            id: a.content_id,
            title: titleMap[a.content_id],
            content_type: a.content_type as 'ASSESSMENT' | 'COURSE',
            assigned_at: a.assigned_at,
            inherited: false,
          })
        }
      }
      // Inherited
      for (const a of allAssignments.filter((x) => x.inherited)) {
        if (!seen.has(a.content_id) && titleMap[a.content_id]) {
          seen.add(a.content_id)
          merged.push({
            id: a.content_id,
            title: titleMap[a.content_id],
            content_type: a.content_type as 'ASSESSMENT' | 'COURSE',
            assigned_at: a.assigned_at,
            inherited: true,
          })
        }
      }

      setContent(merged)
      setLoading(false)
    }
    void load()
  }, [team.id, dept.id, tenantId])

  async function handleRemoveLearner(learner: TeamLearner) {
    setRemovingId(learner.id)
    await supabase
      .from('learners')
      .update({ team_id: null })
      .eq('id', learner.id)
    setLearners((prev) => prev.filter((l) => l.id !== learner.id))
    setRemovingId(null)
    setConfirmRemove(null)
    onLearnerRemoved()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">{team.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{dept.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
            Loading…
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Section 1 — Learners */}
            <div className="px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Learners ({learners.length})
                </p>
              </div>

              {learners.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">
                  No learners in this team yet.
                </p>
              ) : (
                <div className="space-y-px">
                  {learners.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <Link
                            href={`/client-admin/${tenantSlug}/learners/${l.id}`}
                            className="flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline"
                          >
                            {l.full_name}
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          </Link>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Joined {formatDate(l.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          l.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                        }`}>
                          {l.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => setConfirmRemove(l)}
                          disabled={removingId === l.id}
                          className="px-2 py-1 text-xs font-medium text-rose-600 border border-rose-200 rounded hover:bg-rose-50 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2 — Assigned Content (read-only) */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Assigned Content ({content.length})
                </p>
              </div>

              {content.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">
                  No content assigned to this team.
                </p>
              ) : (
                <div className="space-y-px">
                  {content.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start justify-between py-2 px-1 rounded-md hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {c.content_type === 'ASSESSMENT' ? (
                            <FileText className="w-4 h-4 text-blue-500" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-violet-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{c.title}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {c.content_type === 'ASSESSMENT' ? 'Assessment' : 'Course'} ·{' '}
                            {formatDate(c.assigned_at)}
                            {c.inherited && (
                              <span className="ml-1.5 text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">
                                via dept
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-100">
                To unassign content, go to the{' '}
                <Link
                  href={`/client-admin/${tenantSlug}/catalog`}
                  className="text-violet-700 hover:underline"
                >
                  Catalog page
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Remove from team confirm */}
      {confirmRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Remove from team?</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    <span className="font-medium">{confirmRemove.full_name}</span> will be removed
                    from <span className="font-medium">{team.name}</span>. They will remain in{' '}
                    {dept.name} and keep individually-assigned content.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveLearner(confirmRemove)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrgPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)

  const [deptModal, setDeptModal] = useState<{ open: boolean; editing: Department | null }>({ open: false, editing: null })
  const [teamModal, setTeamModal] = useState<{ open: boolean; editing: Team | null }>({ open: false, editing: null })
  const [addLearnersTeam, setAddLearnersTeam] = useState<Team | null>(null)
  const [viewMoreTeam, setViewMoreTeam] = useState<Team | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    confirmLabel: string
    destructive?: boolean
    onConfirm: () => Promise<void>
  } | null>(null)

  // ── Fetch departments ──────────────────────────────────────────────────────

  const fetchDepartments = useCallback(async () => {
    if (!tenantId) { setLoading(false); return }
    setLoading(true)

    const { data: depts } = await supabase
      .from('departments')
      .select('id, name, description, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (!depts) { setLoading(false); return }

    const { data: teamCounts } = await supabase
      .from('teams')
      .select('department_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')

    const { data: learnerCounts } = await supabase
      .from('learners')
      .select('department_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')

    const teamCountMap: Record<string, number> = {}
    const learnerCountMap: Record<string, number> = {}

    teamCounts?.forEach((t) => {
      if (t.department_id) teamCountMap[t.department_id] = (teamCountMap[t.department_id] ?? 0) + 1
    })
    learnerCounts?.forEach((l) => {
      if (l.department_id) learnerCountMap[l.department_id] = (learnerCountMap[l.department_id] ?? 0) + 1
    })

    const enriched: Department[] = depts.map((d) => ({
      ...d,
      teamCount: teamCountMap[d.id] ?? 0,
      learnerCount: learnerCountMap[d.id] ?? 0,
    }))

    setDepartments(enriched)
    setSelectedDept((prev) => {
      if (!prev) return null
      return enriched.find((d) => d.id === prev.id) ?? null
    })
    setLoading(false)
  }, [tenantId])

  // ── Fetch teams for selected dept ──────────────────────────────────────────

  const fetchTeams = useCallback(async (deptId: string) => {
    const { data: rawTeams } = await supabase
      .from('teams')
      .select('id, department_id, name, status, created_at')
      .eq('department_id', deptId)
      .order('created_at', { ascending: true })

    if (!rawTeams) { setTeams([]); return }

    const { data: learnerCounts } = await supabase
      .from('learners')
      .select('team_id')
      .in('team_id', rawTeams.map((t) => t.id))
      .eq('status', 'ACTIVE')

    const teamLearnerMap: Record<string, number> = {}
    learnerCounts?.forEach((l) => {
      if (l.team_id) teamLearnerMap[l.team_id] = (teamLearnerMap[l.team_id] ?? 0) + 1
    })

    setTeams(rawTeams.map((t) => ({ ...t, learnerCount: teamLearnerMap[t.id] ?? 0 })))
  }, [])

  useEffect(() => {
    void (async () => { await fetchDepartments() })()
  }, [fetchDepartments])

  useEffect(() => {
    void (async () => {
      if (selectedDept) await fetchTeams(selectedDept.id)
      else setTeams([])
    })()
  }, [selectedDept, fetchTeams])

  // ── Department actions ─────────────────────────────────────────────────────

  async function handleDeactivateDept(dept: Department) {
    // Fetch cascade impact before showing modal
    const [{ data: affectedTeams }, { data: affectedLearners }] = await Promise.all([
      supabase
        .from('teams')
        .select('id')
        .eq('department_id', dept.id)
        .eq('status', 'ACTIVE'),
      supabase
        .from('learners')
        .select('id')
        .eq('department_id', dept.id)
        .eq('status', 'ACTIVE'),
    ])

    const teamCount = affectedTeams?.length ?? 0
    const learnerCount = affectedLearners?.length ?? 0

    const parts: string[] = []
    if (teamCount > 0) parts.push(`${teamCount} active team${teamCount !== 1 ? 's' : ''} will be deactivated`)
    if (learnerCount > 0) parts.push(`${learnerCount} learner${learnerCount !== 1 ? 's' : ''} will be unassigned from this department`)

    const cascadeNote = parts.length > 0
      ? `This will also: ${parts.join(' and ')}. Learners remain in the platform — reassign them via the Learners page.`
      : `The department will no longer appear in active assignments.`

    setConfirmModal({
      open: true,
      title: 'Deactivate Department',
      message: `Deactivate "${dept.name}"? ${cascadeNote}`,
      confirmLabel: 'Deactivate',
      destructive: true,
      onConfirm: async () => {
        const teamIds = (affectedTeams ?? []).map((t) => t.id)
        await Promise.all([
          // Cascade: deactivate all child teams
          teamIds.length > 0
            ? supabase.from('teams').update({ status: 'INACTIVE' }).in('id', teamIds)
            : Promise.resolve(),
          // Cascade: unassign learners from dept + team
          supabase
            .from('learners')
            .update({ department_id: null, team_id: null })
            .eq('department_id', dept.id)
            .eq('tenant_id', tenantId ?? ''),
          // Deactivate dept
          supabase.from('departments').update({ status: 'INACTIVE' }).eq('id', dept.id),
        ])
        setConfirmModal(null)
        if (selectedDept?.id === dept.id) setSelectedDept(null)
        await fetchDepartments()
      },
    })
  }

  function handleReactivateDept(dept: Department) {
    setConfirmModal({
      open: true,
      title: 'Reactivate Department',
      message: `Reactivate "${dept.name}"? It will appear again in assignment flows.`,
      confirmLabel: 'Reactivate',
      onConfirm: async () => {
        await supabase.from('departments').update({ status: 'ACTIVE' }).eq('id', dept.id)
        setConfirmModal(null)
        await fetchDepartments()
      },
    })
  }

  // ── Team actions ───────────────────────────────────────────────────────────

  function handleDeactivateTeam(team: Team) {
    setConfirmModal({
      open: true,
      title: 'Deactivate Team',
      message: `Deactivating "${team.name}" will not remove learners. The team will no longer appear in active assignments.`,
      confirmLabel: 'Deactivate',
      destructive: true,
      onConfirm: async () => {
        await supabase.from('teams').update({ status: 'INACTIVE' }).eq('id', team.id)
        setConfirmModal(null)
        if (selectedDept) await fetchTeams(selectedDept.id)
        await fetchDepartments()
      },
    })
  }

  function handleReactivateTeam(team: Team) {
    setConfirmModal({
      open: true,
      title: 'Reactivate Team',
      message: `Reactivate "${team.name}"?`,
      confirmLabel: 'Reactivate',
      onConfirm: async () => {
        await supabase.from('teams').update({ status: 'ACTIVE' }).eq('id', team.id)
        setConfirmModal(null)
        if (selectedDept) await fetchTeams(selectedDept.id)
        await fetchDepartments()
      },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Departments &amp; Teams</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your organisation structure</p>
        </div>
        <button
          onClick={() => setDeptModal({ open: true, editing: null })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Department
        </button>
      </div>

      {/* Split pane */}
      <div className="flex gap-4 min-h-130">
        {/* Left — Departments */}
        <div className="w-80 shrink-0 bg-white border border-zinc-200 rounded-md overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Departments{' '}
              <span className="normal-case font-normal text-zinc-400">
                ({departments.length})
              </span>
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-zinc-400">Loading…</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
              <Building2 className="w-8 h-8 text-zinc-300 mb-3" />
              <p className="text-sm font-medium text-zinc-500">No departments yet</p>
              <p className="text-xs text-zinc-400 mt-1">
                Create your first department to organise learners.
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {departments.map((dept) => (
                <li
                  key={dept.id}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-4 py-3 cursor-pointer transition-colors group ${
                    selectedDept?.id === dept.id
                      ? 'bg-violet-50 border-l-2 border-violet-700'
                      : 'hover:bg-zinc-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900 truncate">{dept.name}</p>
                        <StatusBadge status={dept.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {dept.teamCount} team{dept.teamCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {dept.learnerCount} learner{dept.learnerCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeptModal({ open: true, editing: dept })}
                        className="px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                      >
                        Edit
                      </button>
                      {dept.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleDeactivateDept(dept)}
                          className="px-2 py-1 text-xs font-medium text-rose-600 border border-rose-200 rounded hover:bg-rose-50 transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateDept(dept)}
                          className="px-2 py-1 text-xs font-medium text-violet-700 border border-violet-200 rounded hover:bg-violet-50 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-colors ${
                        selectedDept?.id === dept.id ? 'text-violet-500' : 'text-zinc-300'
                      }`} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right — Teams */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-md overflow-hidden flex flex-col">
          {!selectedDept ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
              <ChevronRight className="w-8 h-8 text-zinc-300 mb-3" />
              <p className="text-sm font-medium text-zinc-500">Select a department</p>
              <p className="text-xs text-zinc-400 mt-1">
                Choose a department on the left to view and manage its teams.
              </p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{selectedDept.name}</p>
                  {selectedDept.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedDept.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setTeamModal({ open: true, editing: null })}
                  disabled={selectedDept.status === 'INACTIVE'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  New Team
                </button>
              </div>

              {selectedDept.status === 'INACTIVE' && (
                <div className="mx-5 mt-4 px-4 py-3 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    This department is inactive. Reactivate it to create new teams or assign learners.
                  </p>
                </div>
              )}

              {teams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
                  <Users className="w-8 h-8 text-zinc-300 mb-3" />
                  <p className="text-sm font-medium text-zinc-500">No teams yet</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Create a team within {selectedDept.name} to group learners.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Team Name
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Learners
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {teams.map((team) => (
                        <tr key={team.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-zinc-900">{team.name}</td>
                          <td className="px-5 py-3 text-zinc-600">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-zinc-400" />
                              {team.learnerCount}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={team.status} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewMoreTeam(team)}
                                className="px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                              >
                                View More
                              </button>
                              {team.status === 'ACTIVE' && (
                                <button
                                  onClick={() => setAddLearnersTeam(team)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-violet-700 border border-violet-200 rounded hover:bg-violet-50 transition-colors"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Add Learners
                                </button>
                              )}
                              <button
                                onClick={() => setTeamModal({ open: true, editing: team })}
                                className="px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                              >
                                Edit
                              </button>
                              {team.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleDeactivateTeam(team)}
                                  className="px-2 py-1 text-xs font-medium text-rose-600 border border-rose-200 rounded hover:bg-rose-50 transition-colors"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateTeam(team)}
                                  className="px-2 py-1 text-xs font-medium text-violet-700 border border-violet-200 rounded hover:bg-violet-50 transition-colors"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {deptModal.open && tenantId && (
        <DeptModal
          tenantId={tenantId}
          editing={deptModal.editing}
          onClose={() => setDeptModal({ open: false, editing: null })}
          onSaved={async () => {
            setDeptModal({ open: false, editing: null })
            await fetchDepartments()
          }}
        />
      )}

      {teamModal.open && tenantId && selectedDept && (
        <TeamModal
          tenantId={tenantId}
          departmentId={selectedDept.id}
          editing={teamModal.editing}
          onClose={() => setTeamModal({ open: false, editing: null })}
          onSaved={async () => {
            setTeamModal({ open: false, editing: null })
            await fetchTeams(selectedDept.id)
            await fetchDepartments()
          }}
        />
      )}

      {addLearnersTeam && selectedDept && tenantId && (
        <AddLearnersModal
          team={addLearnersTeam}
          dept={selectedDept}
          tenantId={tenantId}
          allDepts={departments}
          onClose={() => setAddLearnersTeam(null)}
          onAdded={async (count) => {
            setAddLearnersTeam(null)
            // Optimistic update on team count, then re-fetch for accuracy
            setTeams((prev) =>
              prev.map((t) =>
                t.id === addLearnersTeam.id
                  ? { ...t, learnerCount: t.learnerCount + count }
                  : t
              )
            )
            await fetchTeams(selectedDept.id)
            await fetchDepartments()
          }}
        />
      )}

      {confirmModal?.open && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          destructive={confirmModal.destructive}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {viewMoreTeam && selectedDept && tenantId && (
        <TeamDetailSlideOver
          team={viewMoreTeam}
          dept={selectedDept}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          onClose={() => setViewMoreTeam(null)}
          onLearnerRemoved={async () => {
            if (selectedDept) await fetchTeams(selectedDept.id)
            await fetchDepartments()
          }}
        />
      )}
    </div>
  )
}
