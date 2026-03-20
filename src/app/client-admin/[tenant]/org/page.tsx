'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Building2,
  Users,
  MoreHorizontal,
  Plus,
  ChevronRight,
  X,
  AlertTriangle,
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
            <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
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

// ─── Kebab menu ───────────────────────────────────────────────────────────────

function KebabMenu({
  onEdit,
  onDeactivate,
  onReactivate,
  isActive,
}: {
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
  isActive: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-zinc-200 rounded-md shadow-lg z-20 py-1">
            <button
              onClick={() => { setOpen(false); onEdit() }}
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Edit
            </button>
            {isActive ? (
              <button
                onClick={() => { setOpen(false); onDeactivate() }}
                className="w-full text-left px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => { setOpen(false); onReactivate() }}
                className="w-full text-left px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
              >
                Reactivate
              </button>
            )}
          </div>
        </>
      )}
    </div>
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

  // Modal state
  const [deptModal, setDeptModal] = useState<{ open: boolean; editing: Department | null }>({ open: false, editing: null })
  const [teamModal, setTeamModal] = useState<{ open: boolean; editing: Team | null }>({ open: false, editing: null })
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
    if (!tenantId) return
    setLoading(true)

    const { data: depts } = await supabase
      .from('departments')
      .select('id, name, description, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (!depts) { setLoading(false); return }

    // Fetch team counts per dept
    const { data: teamCounts } = await supabase
      .from('teams')
      .select('department_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')

    // Fetch learner counts per dept
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

    // Sync selected dept if it exists
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

    // Learner counts per team
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

  useEffect(() => { fetchDepartments() }, [fetchDepartments])
  useEffect(() => {
    if (selectedDept) fetchTeams(selectedDept.id)
    else setTeams([])
  }, [selectedDept, fetchTeams])

  // ── Department actions ─────────────────────────────────────────────────────

  function handleDeactivateDept(dept: Department) {
    setConfirmModal({
      open: true,
      title: 'Deactivate Department',
      message: `Deactivating "${dept.name}" will not remove learners. The department will no longer appear in active assignments.`,
      confirmLabel: 'Deactivate',
      destructive: true,
      onConfirm: async () => {
        await supabase.from('departments').update({ status: 'INACTIVE' }).eq('id', dept.id)
        setConfirmModal(null)
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
      <div className="flex gap-4 min-h-[520px]">
        {/* Left — Departments */}
        <div className="w-80 flex-shrink-0 bg-white border border-zinc-200 rounded-md overflow-hidden flex flex-col">
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
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <KebabMenu
                        isActive={dept.status === 'ACTIVE'}
                        onEdit={() => setDeptModal({ open: true, editing: dept })}
                        onDeactivate={() => handleDeactivateDept(dept)}
                        onReactivate={() => handleReactivateDept(dept)}
                      />
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
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
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
                        <th className="px-5 py-3" />
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
                          <td className="px-5 py-3 text-right">
                            <KebabMenu
                              isActive={team.status === 'ACTIVE'}
                              onEdit={() => setTeamModal({ open: true, editing: team })}
                              onDeactivate={() => handleDeactivateTeam(team)}
                              onReactivate={() => handleReactivateTeam(team)}
                            />
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
    </div>
  )
}
