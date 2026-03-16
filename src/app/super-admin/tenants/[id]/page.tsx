'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ChevronRight, AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantDetail {
  id: string
  name: string
  type: string
  feature_toggle_mode: 'RUN_ONLY' | 'FULL_CREATOR'
  licensed_categories: string[]
  is_active: boolean
  created_at: string
}

interface Contract {
  id?: string
  tenant_id: string
  seat_count: number
  arr: number
  start_date: string
  end_date: string
  stripe_subscription_id: string
  notes: string
  updated_at?: string
}

interface AdminUser {
  id: string
  tenant_id: string
  name: string
  email: string
  role: 'CLIENT_ADMIN' | 'TEAM_MANAGER'
  is_active: boolean
}

interface AuditLog {
  id: string
  tenant_id: string
  actor_name: string
  action: string
  entity_type: string
  entity_id: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  timestamp: string
}

interface ExamCategory {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function renderDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string {
  if (!before && !after) return '—'
  const changes: string[] = []
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  keys.forEach(key => {
    const bVal = before?.[key]
    const aVal = after?.[key]
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      changes.push(`${key}: ${bVal ?? '—'} → ${aVal ?? '—'}`)
    }
  })
  return changes.length ? changes.join(', ') : '—'
}

function getActionBadgeClass(action: string): string {
  if (['TENANT_CREATED', 'ROLE_ASSIGNED', 'LEARNER_CREATED'].includes(action))
    return 'bg-green-50 text-green-700'
  if (['TENANT_UPDATED', 'CONTRACT_UPDATED', 'TENANT_CATEGORY_UPDATED'].includes(action))
    return 'bg-amber-50 text-amber-700'
  return 'bg-zinc-100 text-zinc-500'
}

function exportCSV(logs: AuditLog[], tenantName: string) {
  const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Changes']
  const rows = logs.map(log => [
    formatTimestamp(log.timestamp),
    log.actor_name,
    log.action,
    log.entity_type,
    renderDiff(log.before_state, log.after_state),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tenantName.replace(/\s+/g, '-').toLowerCase()}-audit-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
        enabled ? 'bg-blue-700' : 'bg-zinc-200'
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-2.5 flex items-center gap-2 z-50">
      <CheckCircle className="w-4 h-4" />
      {message}
    </div>
  )
}

// ─── Invite User Slide-over ───────────────────────────────────────────────────

function InviteUserSlideOver({
  tenantId,
  onClose,
  onInvited,
}: {
  tenantId: string
  onClose: () => void
  onInvited: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'CLIENT_ADMIN' | 'TEAM_MANAGER'>('TEAM_MANAGER')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!name.trim()) { setErr('Name is required.'); return }
    if (!email.trim()) { setErr('Email is required.'); return }
    setErr('')
    setSaving(true)
    try {
      const { error } = await supabase.from('admin_users').insert({
        tenant_id: tenantId,
        name: name.trim(),
        email: email.trim(),
        role,
        is_active: true,
      })
      if (error) throw error
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'ROLE_ASSIGNED',
        entity_type: 'AdminUser',
        entity_id: tenantId,
        before_state: null,
        after_state: { email: email.trim(), role },
      })
      onInvited()
    } catch {
      setErr('Failed to invite user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-xl flex flex-col z-50">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <p className="text-base font-semibold text-zinc-900">Invite User</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-4">
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as typeof role)}
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none"
            >
              <option value="TEAM_MANAGER">Team Manager</option>
              <option value="CLIENT_ADMIN">Client Admin</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Invite User
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({
  tenant,
  contract,
  learnerCount,
  clientAdminEmail,
}: {
  tenant: TenantDetail
  contract: Contract | null
  learnerCount: number
  clientAdminEmail: string
}) {
  const seatCount = contract?.seat_count ?? 0
  const fillPct = seatCount > 0 ? Math.min((learnerCount / seatCount) * 100, 100) : 0
  const near = seatCount > 0 && learnerCount / seatCount >= 0.9

  const fields: [string, React.ReactNode][] = [
    ['Tenant Name', <span key="name" className="text-sm text-zinc-900">{tenant.name}</span>],
    ['Type', <span key="type" className="text-xs font-medium bg-blue-50 text-blue-700 rounded-md px-2 py-0.5">{tenant.type}</span>],
    [
      'Feature Mode',
      <span
        key="mode"
        className={`text-xs font-medium rounded-md px-2 py-0.5 ${
          tenant.feature_toggle_mode === 'FULL_CREATOR' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'
        }`}
      >
        {tenant.feature_toggle_mode === 'FULL_CREATOR' ? 'Full Creator' : 'Run Only'}
      </span>,
    ],
    [
      'Status',
      <span
        key="status"
        className={`text-xs font-medium rounded-md px-2 py-0.5 ${
          tenant.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
        }`}
      >
        {tenant.is_active ? 'Active' : 'Inactive'}
      </span>,
    ],
    ['Created', <span key="created" className="text-sm text-zinc-900">{formatDate(tenant.created_at)}</span>],
    ['Client Admin', <span key="admin" className="text-sm text-zinc-900">{clientAdminEmail || '—'}</span>],
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Details Card */}
      <div className="bg-white rounded-md border border-zinc-200 p-5">
        <p className="text-sm font-semibold text-zinc-900 mb-4">Tenant Details</p>
        <div className="grid grid-cols-2 gap-y-3">
          {fields.map(([label, value]) => (
            <>
              <p key={`lbl-${label}`} className="text-sm text-zinc-500">{label}</p>
              <div key={`val-${label}`}>{value}</div>
            </>
          ))}
        </div>
      </div>

      {/* Seat Usage Card */}
      <div className="bg-white rounded-md border border-zinc-200 p-5">
        <p className="text-sm font-semibold text-zinc-900 mb-4">Seat Usage</p>
        <p className="text-3xl font-semibold text-zinc-900">
          {learnerCount}
          <span className="text-lg text-zinc-400"> / {seatCount || '—'}</span>
        </p>
        {seatCount > 0 && (
          <>
            <div className="w-full h-2 bg-zinc-100 rounded-md overflow-hidden mt-3">
              <div
                className={`h-full rounded-md ${near ? 'bg-amber-500' : 'bg-blue-700'}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            {near && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Approaching seat limit
              </p>
            )}
          </>
        )}
        <p className="text-xs text-zinc-400 mt-1">Active learners</p>
      </div>
    </div>
  )
}

// ─── Tab: Licensed Categories ─────────────────────────────────────────────────

function TabLicensedCategories({
  tenant,
  examCategories,
  onUpdated,
}: {
  tenant: TenantDetail
  examCategories: ExamCategory[]
  onUpdated: (cats: string[]) => void
}) {
  const [licensed, setLicensed] = useState<string[]>(tenant.licensed_categories || [])
  const [toast, setToast] = useState(false)

  const toggle = async (catId: string) => {
    const oldCats = [...licensed]
    const newCats = licensed.includes(catId)
      ? licensed.filter(id => id !== catId)
      : [...licensed, catId]
    setLicensed(newCats)

    await supabase
      .from('tenants')
      .update({ licensed_categories: newCats })
      .eq('id', tenant.id)
    await supabase.from('audit_logs').insert({
      tenant_id: tenant.id,
      actor_name: 'Super Admin',
      action: 'TENANT_CATEGORY_UPDATED',
      entity_type: 'Tenant',
      entity_id: tenant.id,
      before_state: { licensed_categories: oldCats },
      after_state: { licensed_categories: newCats },
    })
    setToast(true)
    onUpdated(newCats)
  }

  return (
    <div className="bg-white rounded-md border border-zinc-200 p-5">
      <p className="text-sm font-semibold text-zinc-900 mb-1">Licensed Categories</p>
      <p className="text-xs text-zinc-400 mb-4">Toggle categories this tenant can access.</p>
      <div>
        {examCategories.map(cat => (
          <div
            key={cat.id}
            className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0"
          >
            <p className="text-sm font-medium text-zinc-900">{cat.name}</p>
            <Toggle enabled={licensed.includes(cat.id)} onToggle={() => toggle(cat.id)} />
          </div>
        ))}
      </div>
      {toast && <Toast message="Categories updated" onDismiss={() => setToast(false)} />}
    </div>
  )
}

// ─── Tab: Users & Roles ───────────────────────────────────────────────────────

function TabUsersRoles({
  tenantId,
  adminUsers,
  onRefresh,
}: {
  tenantId: string
  adminUsers: AdminUser[]
  onRefresh: () => void
}) {
  const [showInvite, setShowInvite] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const removeUser = async (userId: string) => {
    setRemoving(userId)
    try {
      await supabase.from('admin_users').update({ is_active: false }).eq('id', userId)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'ROLE_REMOVED',
        entity_type: 'AdminUser',
        entity_id: userId,
        before_state: { is_active: true },
        after_state: { is_active: false },
      })
      setConfirmId(null)
      onRefresh()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-zinc-900">Users & Roles</p>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-blue-700 text-white text-sm font-medium rounded-md px-3 py-1.5 hover:bg-blue-800"
        >
          + Invite User
        </button>
      </div>

      <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adminUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">
                  No users found.
                </td>
              </tr>
            ) : (
              adminUsers.map(u => (
                <tr key={u.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                        u.role === 'CLIENT_ADMIN'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}
                    >
                      {u.role === 'CLIENT_ADMIN' ? 'Client Admin' : 'Team Manager'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                        u.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active && (
                      confirmId === u.id ? (
                        <span className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-500">Remove?</span>
                          <button
                            onClick={() => removeUser(u.id)}
                            disabled={removing === u.id}
                            className="text-rose-600 hover:text-rose-700 font-medium"
                          >
                            {removing === u.id ? 'Removing…' : 'Confirm'}
                          </button>
                          <button onClick={() => setConfirmId(null)} className="text-zinc-400 hover:text-zinc-600">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmId(u.id)}
                          className="text-sm text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteUserSlideOver
          tenantId={tenantId}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            setShowInvite(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

// ─── Tab: Contract ────────────────────────────────────────────────────────────

function TabContract({
  tenantId,
  contract,
  onSaved,
}: {
  tenantId: string
  contract: Contract | null
  onSaved: (c: Contract) => void
}) {
  const [form, setForm] = useState<Omit<Contract, 'tenant_id' | 'id' | 'updated_at'>>({
    seat_count: contract?.seat_count ?? 0,
    arr: contract ? contract.arr / 100 : 0,
    start_date: contract?.start_date?.split('T')[0] ?? '',
    end_date: contract?.end_date?.split('T')[0] ?? '',
    stripe_subscription_id: contract?.stripe_subscription_id ?? '',
    notes: contract?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  const set = (key: keyof typeof form, val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        tenant_id: tenantId,
        seat_count: Number(form.seat_count),
        arr: Math.round(Number(form.arr) * 100),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        stripe_subscription_id: form.stripe_subscription_id,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      }
      if (contract?.id) {
        await supabase.from('contracts').update(payload).eq('id', contract.id)
      } else {
        await supabase.from('contracts').insert(payload)
      }
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'CONTRACT_UPDATED',
        entity_type: 'Contract',
        entity_id: tenantId,
        before_state: contract ? { seat_count: contract.seat_count, arr: contract.arr } : null,
        after_state: { seat_count: payload.seat_count, arr: payload.arr },
      })
      onSaved({ ...payload, id: contract?.id } as Contract)
      setToast(true)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none'

  return (
    <div className="bg-white rounded-md border border-zinc-200 p-5">
      <p className="text-sm font-semibold text-zinc-900 mb-4">Contract Details</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">Seat Count</label>
          <input
            type="number"
            value={form.seat_count}
            onChange={e => set('seat_count', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">ARR ($)</label>
          <input
            type="text"
            value={form.arr}
            onChange={e => set('arr', e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={e => set('end_date', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">Stripe Subscription ID</label>
          <input
            type="text"
            value={form.stripe_subscription_id}
            onChange={e => set('stripe_subscription_id', e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-zinc-700 block mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 mt-4 flex items-center gap-2 disabled:opacity-70"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save Contract
      </button>
      {contract?.updated_at && (
        <p className="text-xs text-zinc-400 mt-2">Last updated {formatDate(contract.updated_at)}</p>
      )}
      {toast && <Toast message="Contract saved" onDismiss={() => setToast(false)} />}
    </div>
  )
}

// ─── Tab: Audit History ───────────────────────────────────────────────────────

const AUDIT_ACTIONS = [
  'All Actions',
  'TENANT_CREATED',
  'TENANT_UPDATED',
  'TENANT_CATEGORY_UPDATED',
  'CONTRACT_UPDATED',
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'LEARNER_CREATED',
]

function TabAuditHistory({
  logs,
  tenantName,
}: {
  logs: AuditLog[]
  tenantName: string
}) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [actionFilter, setActionFilter] = useState('All Actions')

  const filtered = logs.filter(l => {
    if (actionFilter !== 'All Actions' && l.action !== actionFilter) return false
    if (fromDate && l.timestamp < fromDate) return false
    if (toDate && l.timestamp > toDate + 'T23:59:59') return false
    return true
  })

  return (
    <div>
      {/* Filter row */}
      <div className="flex gap-3 mb-4 items-center">
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        />
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        >
          {AUDIT_ACTIONS.map(a => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <button
          onClick={() => exportCSV(filtered, tenantName)}
          className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-50 ml-auto"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              {['Timestamp', 'Actor', 'Action', 'Entity', 'Changes'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">
                  No audit events found for this tenant.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-500 whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">{log.actor_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{log.entity_type}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400 max-w-xs truncate">
                    {renderDiff(log.before_state, log.after_state)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Licensed Categories', 'Users & Roles', 'Contract', 'Audit History'] as const
type Tab = (typeof TABS)[number]

export default function TenantDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [learnerCount, setLearnerCount] = useState(0)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes, uRes, lRes, logRes, catRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', id).single(),
        supabase.from('contracts').select('*').eq('tenant_id', id).maybeSingle(),
        supabase.from('admin_users').select('*').eq('tenant_id', id),
        supabase.from('learners').select('id', { count: 'exact' }).eq('tenant_id', id).eq('status', 'ACTIVE'),
        supabase
          .from('audit_logs')
          .select('*')
          .eq('tenant_id', id)
          .order('timestamp', { ascending: false })
          .limit(20),
        supabase.from('exam_categories').select('id, name'),
      ])

      if (tRes.data) setTenant(tRes.data as TenantDetail)
      if (cRes.data) setContract(cRes.data as Contract)
      setAdminUsers((uRes.data || []) as AdminUser[])
      setLearnerCount(lRes.count || 0)
      setAuditLogs((logRes.data || []) as AuditLog[])
      setExamCategories((catRes.data || []) as ExamCategory[])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const refreshUsers = useCallback(async () => {
    const { data } = await supabase.from('admin_users').select('*').eq('tenant_id', id)
    setAdminUsers((data || []) as AdminUser[])
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 animate-pulse bg-zinc-100 rounded-md" />
        ))}
      </div>
    )
  }

  if (!tenant) {
    return <p className="p-6 text-sm text-zinc-400">Tenant not found.</p>
  }

  const clientAdmin = adminUsers.find(u => u.role === 'CLIENT_ADMIN' && u.is_active)

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <Link href="/super-admin/tenants" className="text-zinc-500 hover:text-zinc-700">
          Tenants
        </Link>
        <ChevronRight className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">{tenant.name}</h1>
        <span className="text-xs font-medium bg-blue-50 text-blue-700 rounded-md px-2 py-0.5">B2B</span>
        <span
          className={`text-xs font-medium rounded-md px-2 py-0.5 ${
            tenant.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
          }`}
        >
          {tenant.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Tab Nav */}
      <div className="border-b border-zinc-200 mb-6 flex">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tab
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <TabOverview
          tenant={tenant}
          contract={contract}
          learnerCount={learnerCount}
          clientAdminEmail={clientAdmin?.email ?? ''}
        />
      )}
      {activeTab === 'Licensed Categories' && (
        <TabLicensedCategories
          tenant={tenant}
          examCategories={examCategories}
          onUpdated={cats => setTenant(prev => prev ? { ...prev, licensed_categories: cats } : prev)}
        />
      )}
      {activeTab === 'Users & Roles' && (
        <TabUsersRoles
          tenantId={id}
          adminUsers={adminUsers}
          onRefresh={refreshUsers}
        />
      )}
      {activeTab === 'Contract' && (
        <TabContract
          tenantId={id}
          contract={contract}
          onSaved={c => setContract(c)}
        />
      )}
      {activeTab === 'Audit History' && (
        <TabAuditHistory
          logs={auditLogs}
          tenantName={tenant.name}
        />
      )}

    </div>
  )
}
