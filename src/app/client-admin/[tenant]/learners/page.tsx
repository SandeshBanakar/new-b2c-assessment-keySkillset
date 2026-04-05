'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Search,
  X,
  AlertTriangle,
  ChevronDown,
  UserCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'
import { PhoneInputField, getDialCode } from '@/components/PhoneInputField'
import { validateEmail } from '@/components/validateEmail'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Learner {
  id: string
  tenant_id: string
  full_name: string
  email: string
  phone: string | null
  phone_country_code: string | null
  department_id: string | null
  team_id: string | null
  status: 'ACTIVE' | 'INACTIVE'
  employee_roll_number: string | null
  notes: string | null
  created_at: string
  departmentName?: string
  teamName?: string
}

interface Department {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
}

interface Team {
  id: string
  department_id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
}

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE'

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

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActions({
  learner,
  onView,
  onDeactivate,
  onReactivate,
}: {
  learner: Learner
  onView: () => void
  onDeactivate: () => void
  onReactivate: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={onView}
        className="px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
      >
        View Profile
      </button>
      {learner.status === 'ACTIVE' ? (
        <button
          onClick={onDeactivate}
          className="px-2 py-1 text-xs font-medium text-rose-600 border border-rose-200 rounded hover:bg-rose-50 transition-colors"
        >
          Deactivate
        </button>
      ) : (
        <button
          onClick={onReactivate}
          className="px-2 py-1 text-xs font-medium text-violet-700 border border-violet-200 rounded hover:bg-violet-50 transition-colors"
        >
          Reactivate
        </button>
      )}
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
              destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-violet-700 hover:bg-violet-800'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Learner form (Add / Edit) — right slide-over ─────────────────────────────

function LearnerSlideOver({
  tenantId,
  editing,
  departments,
  allTeams,
  onClose,
  onSaved,
}: {
  tenantId: string
  editing: Learner | null
  departments: Department[]
  allTeams: Team[]
  onClose: () => void
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState(editing?.full_name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [emailTouched, setEmailTouched] = useState(false)
  // Phone — managed via PhoneInputField; parent tracks latest values for save
  const [phoneCode, setPhoneCode] = useState(editing?.phone_country_code ?? '')
  const [phoneNum, setPhoneNum] = useState(editing?.phone ?? '')
  const [phoneSubmitError, setPhoneSubmitError] = useState<string | undefined>()
  const [departmentId, setDepartmentId] = useState(editing?.department_id ?? '')
  const [teamId, setTeamId] = useState(editing?.team_id ?? '')
  const [rollNumber, setRollNumber] = useState(editing?.employee_roll_number ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  const activeDepts = departments.filter((d) => d.status === 'ACTIVE')
  const filteredTeams = allTeams.filter(
    (t) => t.department_id === departmentId && t.status === 'ACTIVE'
  )

  // D3/5B — email error: nothing until first blur, then live
  const emailFormatError = emailTouched ? validateEmail(email) : null

  function handleDeptChange(val: string) {
    setDepartmentId(val)
    setTeamId('')
    setDirty(true)
  }

  function requestClose() {
    if (dirty) setShowDiscard(true)
    else onClose()
  }

  async function handleSave() {
    if (!fullName.trim()) { setError('Full name is required.'); return }

    // Email validation (add mode only — edit mode email is locked)
    if (!editing) {
      if (!email.trim()) { setError('Email is required.'); return }
      const emailErr = validateEmail(email)
      if (emailErr) { setError(emailErr); return }
    }

    // Phone validation (submit-level)
    if (!phoneCode && phoneNum) {
      setPhoneSubmitError('Select a country code.')
      return
    }
    if (phoneCode && !phoneNum) {
      setPhoneSubmitError('Please enter the phone number.')
      return
    }
    setPhoneSubmitError(undefined)

    setSaving(true)
    setError(null)

    const payload = {
      full_name: fullName.trim(),
      ...(editing ? {} : { email: email.trim() }),
      phone: phoneNum || null,
      phone_country_code: phoneCode || null,
      department_id: departmentId || null,
      team_id: teamId || null,
      employee_roll_number: rollNumber.trim() || null,
      notes: notes.trim() || null,
    }

    if (editing) {
      const { error: e } = await supabase
        .from('learners')
        .update(payload)
        .eq('id', editing.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase
        .from('learners')
        .insert({ ...payload, tenant_id: tenantId, status: 'ACTIVE' })
      if (e) { setError(e.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={requestClose} />
      <div className="fixed right-0 top-0 h-full w-120 z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editing ? 'Edit Learner' : 'Add Learner'}
          </h2>
          <button onClick={requestClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Personal Details */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
              Personal Details
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setDirty(true) }}
                  placeholder="e.g. Arjun Mehta"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Email {!editing && <span className="text-rose-600">*</span>}
                </label>
                {editing ? (
                  <>
                    <p className="text-sm text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">{editing.email}</p>
                    <p className="text-xs text-zinc-400 mt-1">Email cannot be changed after creation.</p>
                  </>
                ) : (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setDirty(true) }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="e.g. arjun@example.com"
                      className={`w-full border rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${emailFormatError ? 'border-rose-400' : 'border-zinc-200'}`}
                    />
                    {emailFormatError && (
                      <p className="text-xs text-rose-600 mt-1">{emailFormatError}</p>
                    )}
                  </>
                )}
              </div>
              <PhoneInputField
                key={editing?.id ?? 'new'}
                defaultCode={editing?.phone_country_code ?? ''}
                defaultNumber={editing?.phone ?? ''}
                onChange={(iso, num) => { setPhoneCode(iso); setPhoneNum(num); setPhoneSubmitError(undefined); setDirty(true) }}
                submitError={phoneSubmitError}
              />
            </div>
          </div>

          {/* Organisation */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
              Organisation
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                <div className="relative">
                  <select
                    value={departmentId}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                  >
                    <option value="">No department</option>
                    {activeDepts.map((d) => (
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
                    value={teamId}
                    onChange={(e) => { setTeamId(e.target.value); setDirty(true) }}
                    disabled={!departmentId}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">No team</option>
                    {filteredTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
                {departmentId && filteredTeams.length === 0 && (
                  <p className="text-xs text-zinc-400 mt-1">No active teams in this department.</p>
                )}
              </div>
            </div>
          </div>

          {/* Internal Fields */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
              Internal Fields
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Employee Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => { setRollNumber(e.target.value); setDirty(true) }}
                  placeholder="e.g. AKS-2026-001"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setDirty(true) }}
                  placeholder="Internal notes about this learner"
                  rows={3}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={requestClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Learner'}
          </button>
        </div>
      </div>

      {/* Discard guard */}
      {showDiscard && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
            <div className="px-6 py-5">
              <p className="text-sm font-semibold text-zinc-900">Discard changes?</p>
              <p className="text-sm text-zinc-500 mt-1">
                You have unsaved changes. They will be lost if you close now.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setShowDiscard(false)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearnersPage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [learners, setLearners] = useState<Learner[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const [filterTab, setFilterTab] = useState<FilterTab>('ACTIVE')
  const [search, setSearch] = useState('')

  // Panel state
  const [addSlideOver, setAddSlideOver] = useState(false)
  const [editLearner, setEditLearner] = useState<Learner | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    title: string
    message: string
    confirmLabel: string
    destructive?: boolean
    onConfirm: () => Promise<void>
  } | null>(null)

  // ── Fetch all data ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!tenantId) { setLoading(false); return }
    setLoading(true)

    const [
      { data: rawLearners },
      { data: depts },
      { data: teams },
    ] = await Promise.all([
      supabase
        .from('learners')
        .select('id, tenant_id, full_name, email, phone, phone_country_code, department_id, team_id, status, employee_roll_number, notes, created_at')
        .eq('tenant_id', tenantId)
        .order('full_name', { ascending: true }),
      supabase
        .from('departments')
        .select('id, name, status')
        .eq('tenant_id', tenantId)
        .order('name'),
      supabase
        .from('teams')
        .select('id, department_id, name, status')
        .eq('tenant_id', tenantId)
        .order('name'),
    ])

    const deptMap: Record<string, string> = {}
    const teamMap: Record<string, string> = {}
    depts?.forEach((d) => { deptMap[d.id] = d.name })
    teams?.forEach((t) => { teamMap[t.id] = t.name })

    const enriched: Learner[] = (rawLearners ?? []).map((l) => ({
      ...l,
      departmentName: l.department_id ? deptMap[l.department_id] : undefined,
      teamName: l.team_id ? teamMap[l.team_id] : undefined,
    }))

    setLearners(enriched)
    setDepartments(depts ?? [])
    setAllTeams(teams ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = learners.filter((l) => {
    const matchesTab =
      filterTab === 'ALL' ||
      (filterTab === 'ACTIVE' && l.status === 'ACTIVE') ||
      (filterTab === 'INACTIVE' && l.status === 'INACTIVE')

    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      l.full_name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.phone ?? '').includes(q) ||
      (l.departmentName ?? '').toLowerCase().includes(q)

    return matchesTab && matchesSearch
  })

  const activeCount = learners.filter((l) => l.status === 'ACTIVE').length
  const totalCount = learners.length

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleDeactivate(learner: Learner) {
    setConfirmModal({
      title: 'Deactivate Learner',
      message: `Deactivating ${learner.full_name} will revoke their access immediately. You can reactivate them later.`,
      confirmLabel: 'Deactivate',
      destructive: true,
      onConfirm: async () => {
        await supabase.from('learners').update({ status: 'INACTIVE' }).eq('id', learner.id)
        setConfirmModal(null)
        await fetchData()
      },
    })
  }

  function handleReactivate(learner: Learner) {
    setConfirmModal({
      title: 'Reactivate Learner',
      message: `Reactivate ${learner.full_name}? They will regain access to assigned content.`,
      confirmLabel: 'Reactivate',
      onConfirm: async () => {
        await supabase.from('learners').update({ status: 'ACTIVE' }).eq('id', learner.id)
        setConfirmModal(null)
        await fetchData()
      },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Learners</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {activeCount} active · {totalCount} total
          </p>
        </div>
        <button
          onClick={() => setAddSlideOver(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Learner
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-md p-0.5">
          {(['ACTIVE', 'INACTIVE', 'ALL'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                filterTab === tab
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-zinc-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <UserCircle className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="text-sm font-medium text-zinc-500">
              {search ? 'No learners match your search.' : 'No learners yet.'}
            </p>
            {!search && (
              <p className="text-xs text-zinc-400 mt-1">
                Add your first learner to get started.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Department
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Team
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
              {filtered.map((learner) => (
                <tr key={learner.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0">
                        {learner.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-900">{learner.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{learner.email}</td>
                  <td className="px-5 py-3 text-zinc-600">
                    {learner.departmentName ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">
                    {learner.teamName ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={learner.status} />
                  </td>
                  <td className="px-5 py-3">
                    <RowActions
                      learner={learner}
                      onView={() => router.push(`/client-admin/${tenantSlug}/learners/${learner.id}`)}
                      onDeactivate={() => handleDeactivate(learner)}
                      onReactivate={() => handleReactivate(learner)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add slide-over */}
      {addSlideOver && tenantId && (
        <LearnerSlideOver
          tenantId={tenantId}
          editing={null}
          departments={departments}
          allTeams={allTeams}
          onClose={() => setAddSlideOver(false)}
          onSaved={() => { setAddSlideOver(false); fetchData() }}
        />
      )}

      {/* Edit slide-over */}
      {editLearner && tenantId && (
        <LearnerSlideOver
          tenantId={tenantId}
          editing={editLearner}
          departments={departments}
          allTeams={allTeams}
          onClose={() => setEditLearner(null)}
          onSaved={() => { setEditLearner(null); fetchData() }}
        />
      )}

      {/* Confirm modal */}
      {confirmModal && (
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
