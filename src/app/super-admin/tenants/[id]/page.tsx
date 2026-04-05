'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  ChevronRight, CheckCircle, X, Loader2,
  UploadCloud, Plus, Users, Download,
  Pencil, PowerOff, Power, AlertTriangle, Info,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { EditDetailsSlideOver, TenantRow } from '@/components/tenant-detail/EditDetailsSlideOver'
import PlansTab from '@/components/tenant-detail/PlansTab'
import { useToast } from '@/components/ui/Toast'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { PhoneInputField, getDialCode } from '@/components/PhoneInputField'
import { validateEmail } from '@/components/validateEmail'

// ─── Types ────────────────────────────────────────────────────────────────────

// TenantDetail extends TenantRow with all DB columns
type TenantDetail = TenantRow & {
  licensed_categories: string[]
  stripe_customer_id?: string | null
}

interface Contract {
  id?: string
  tenant_id: string
  seat_count: number
  content_creator_seats?: number | null
  arr: number
  start_date: string
  end_date: string
  stripe_subscription_id: string
  notes: string
  updated_at?: string
  plan_id?: string | null
}

interface AdminUser {
  id: string
  tenant_id: string
  name: string
  email: string
  role: 'CLIENT_ADMIN' | 'CONTENT_CREATOR' | 'SUPER_ADMIN'
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

type RawLearner = {
  id: string
  tenant_id: string
  full_name: string
  email: string
  phone: string | null
  department_id: string | null
  team_id: string | null
  status: string
  created_at: string
  departments: { name: string } | null
  teams: { name: string } | null
}

interface Department {
  id: string
  name: string
}

interface Team {
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
  if (['TENANT_CREATED', 'ROLE_ASSIGNED', 'LEARNER_CREATED', 'LEARNER_ADDED'].includes(action))
    return 'bg-green-50 text-green-700'
  if (['TENANT_UPDATED', 'CONTRACT_UPDATED', 'TENANT_CATEGORY_UPDATED'].includes(action))
    return 'bg-amber-50 text-amber-700'
  return 'bg-zinc-100 text-zinc-500'
}

function exportAuditCSV(logs: AuditLog[], tenantName: string) {
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

function exportLearnersCSV(learners: RawLearner[], tenantSlug: string) {
  const headers = ['Full Name', 'Email', 'Department', 'Team', 'Status', 'Date Added']
  const rows = learners.map(l => [
    l.full_name,
    l.email,
    l.departments?.name ?? '',
    l.teams?.name ?? '',
    l.status,
    formatDate(l.created_at),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tenantSlug}-learners-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  onDismiss,
  variant = 'success',
}: {
  message: string
  onDismiss: () => void
  variant?: 'success' | 'error'
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-4 right-4 text-sm rounded-md px-4 py-2.5 flex items-center gap-2 z-50 ${
        variant === 'error'
          ? 'bg-rose-50 border border-rose-200 text-rose-600'
          : 'bg-green-50 border border-green-200 text-green-700'
      }`}
    >
      {variant === 'error' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      {message}
    </div>
  )
}

// ─── Invite User Slide-over ───────────────────────────────────────────────────

function InviteUserSlideOver({
  tenantId,
  featureToggleMode,
  contract,
  activeCCCount,
  activeCACount,
  onClose,
  onInvited,
}: {
  tenantId: string
  featureToggleMode: string
  contract: Contract | null
  activeCCCount: number
  activeCACount: number
  onClose: () => void
  onInvited: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [role, setRole] = useState<'CLIENT_ADMIN' | 'CONTENT_CREATOR'>('CLIENT_ADMIN')
  const isRunOnly = featureToggleMode === 'RUN_ONLY'
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ccLimitErr, setCcLimitErr] = useState('')

  const ccSeatsAllowed = contract?.content_creator_seats ?? 0
  const ccAtLimit = activeCCCount >= ccSeatsAllowed && ccSeatsAllowed > 0

  const handleRoleChange = (newRole: 'CLIENT_ADMIN' | 'CONTENT_CREATOR') => {
    setRole(newRole)
    if (newRole === 'CONTENT_CREATOR' && ccAtLimit) {
      setCcLimitErr(`All Content Creator seats are filled (${activeCCCount}/${ccSeatsAllowed}). Remove an existing Content Creator to continue.`)
    } else {
      setCcLimitErr('')
    }
  }

  const save = async () => {
    if (!name.trim()) { setErr('Name is required.'); return }
    if (!email.trim()) { setErr('Email is required.'); return }
    const fmtErr = validateEmail(email)
    if (fmtErr) { setErr(fmtErr); return }
    if (ccLimitErr) return
    // Locked rule: check for existing active CA on submit
    if (role === 'CLIENT_ADMIN' && activeCACount > 0) {
      setErr('An active Client Admin already exists. Use the Replace button to assign a new Client Admin.')
      return
    }
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
      <div className="fixed inset-y-0 right-0 w-105 bg-white shadow-xl flex flex-col z-50">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <p className="text-base font-semibold text-zinc-900">Invite User</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-4">
          {/* CC seat info banner — FULL_CREATOR only */}
          {!isRunOnly && contract && (
            <div className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${
              ccAtLimit
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-blue-50 border border-blue-100 text-blue-700'
            }`}>
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Content Creator seats:{' '}
                <span className="font-medium">{activeCCCount} of {ccSeatsAllowed} used</span>
                {ccAtLimit && ' — all seats filled.'}
              </span>
            </div>
          )}
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
            {(() => { const liveErr = emailTouched ? validateEmail(email) : null; return (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (emailTouched) setErr('') }}
                  onBlur={() => setEmailTouched(true)}
                  className={`text-sm border rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none ${liveErr ? 'border-rose-400' : 'border-zinc-200'}`}
                />
                {liveErr && <p className="text-sm text-rose-600 mt-1">{liveErr}</p>}
              </>
            )})()}
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Role</label>
            <select
              value={role}
              onChange={e => handleRoleChange(e.target.value as typeof role)}
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none"
            >
              <option value="CLIENT_ADMIN">Client Admin</option>
              {!isRunOnly && <option value="CONTENT_CREATOR">Content Creator</option>}
            </select>
            {ccLimitErr && <p className="text-sm text-rose-600 mt-1">{ccLimitErr}</p>}
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
            disabled={saving || !!ccLimitErr}
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

// ─── Replace Client Admin Modal ───────────────────────────────────────────────

function ReplaceClientAdminModal({
  tenantId,
  existingAdmin,
  onClose,
  onReplaced,
}: {
  tenantId: string
  existingAdmin: AdminUser
  onClose: () => void
  onReplaced: () => void
}) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canSubmit = name.trim().length > 0 && email.trim().length > 0

  const save = async () => {
    if (!canSubmit) return
    const fmtErr = validateEmail(email.trim())
    if (fmtErr) { setErr(fmtErr); return }
    setErr('')
    setSaving(true)
    try {
      // Check if this email already exists in admin_users
      const { data: existing } = await supabase
        .from('admin_users')
        .select('id, role, is_active, tenant_id')
        .eq('email', email.trim())
        .maybeSingle()

      let newAdminId: string | null = null

      if (existing) {
        if (existing.is_active) {
          setErr('This email belongs to an active admin. Use a different email.')
          return
        }
        if (existing.role !== 'CLIENT_ADMIN' || existing.tenant_id !== tenantId) {
          setErr('This email is already registered with a different role or tenant.')
          return
        }
        // Reactivate existing inactive CA for this tenant
        const { error: reactivateErr } = await supabase
          .from('admin_users')
          .update({ is_active: true, name: name.trim() })
          .eq('id', existing.id)
        if (reactivateErr) throw reactivateErr
        newAdminId = existing.id
      } else {
        // Step 1: INSERT new CA first — prevents orphan if this fails
        const { data: inserted, error: insertErr } = await supabase
          .from('admin_users')
          .insert({
            tenant_id: tenantId,
            name: name.trim(),
            email: email.trim(),
            role: 'CLIENT_ADMIN',
            is_active: true,
          })
          .select('id')
          .single()
        if (insertErr) {
          if (insertErr.code === '23505') { setErr('This email is already registered. Use a different email.'); return }
          throw insertErr
        }
        newAdminId = inserted.id
      }

      // Step 2: Deactivate old CA — only if step 1 succeeded
      const { error: deactivateErr } = await supabase
        .from('admin_users')
        .update({ is_active: false })
        .eq('id', existingAdmin.id)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'ROLE_REPLACED',
        entity_type: 'AdminUser',
        entity_id: existingAdmin.id,
        before_state: { email: existingAdmin.email, is_active: true },
        after_state: { replaced_by_email: email.trim(), new_admin_id: newAdminId, is_active: false },
      })
      if (deactivateErr) {
        showToast('New admin activated. Previous admin could not be deactivated. Please remove them manually from the table.', 'error')
      } else {
        showToast('Client Admin replaced successfully.')
      }
      onReplaced()
    } catch {
      setErr('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-md mx-4 shadow-xl">
        {/* Top section — warning */}
        <div className="px-6 py-5 border-b border-zinc-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Replace Client Admin</p>
              <p className="text-sm text-zinc-500 mt-1">
                The current admin will lose access immediately. Enter the new admin&apos;s details below. You can re-add a previously deactivated admin by entering their email.
              </p>
            </div>
          </div>
        </div>
        {/* Bottom section — replacement form */}
        <div className="px-6 py-5 space-y-4">
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-zinc-200 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-700 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            {(() => { const liveErr = emailTouched ? validateEmail(email) : null; return (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (emailTouched) setErr('') }}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full border rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-700 outline-none ${liveErr ? 'border-rose-400' : 'border-zinc-200'}`}
                />
                {liveErr && <p className="text-sm text-rose-600 mt-1">{liveErr}</p>}
              </>
            )})()}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canSubmit || saving}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Replace Admin
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Deactivate Content Creator Modal ────────────────────────────────────────

function DeactivateContentCreatorModal({
  tenantId,
  user,
  onClose,
  onDeactivated,
}: {
  tenantId: string
  user: AdminUser
  onClose: () => void
  onDeactivated: () => void
}) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const deactivate = async () => {
    setSaving(true)
    try {
      await supabase.from('admin_users').update({ is_active: false }).eq('id', user.id)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'ROLE_REMOVED',
        entity_type: 'AdminUser',
        entity_id: user.id,
        before_state: { is_active: true },
        after_state: { is_active: false },
      })
      showToast(`${user.name} has been deactivated.`)
      onDeactivated()
    } catch {
      showToast('Failed to deactivate user.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-xl">
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-zinc-900 mb-2">Deactivate {user.name}?</p>
          <p className="text-sm text-zinc-500">
            This will immediately revoke their access to the client admin panel. Their content and work will be preserved. You can reactivate them from this tab at any time.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={deactivate}
            disabled={saving}
            className="bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Deactivate
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({
  tenant,
  contract,
  learnerCount,
  clientAdmin,
  onEditDetails,
  onToggleActive,
  onSwitchToUsersRoles,
}: {
  tenant: TenantDetail
  contract: Contract | null
  learnerCount: number
  clientAdmin: { name: string; email: string } | null
  onEditDetails: () => void
  onToggleActive: () => void
  onSwitchToUsersRoles: () => void
}) {
  const seatCount = contract?.seat_count ?? 0
  const fillPct = seatCount > 0 ? Math.min((learnerCount / seatCount) * 100, 100) : 0
  const ratio = seatCount > 0 ? learnerCount / seatCount : 0
  const barColor = ratio >= 1.0 ? 'bg-rose-600' : ratio >= 0.9 ? 'bg-amber-500' : 'bg-blue-700'

  const val = (v: string | null | undefined) =>
    v ? (
      <p className="text-sm text-zinc-900">{v}</p>
    ) : (
      <p className="text-sm text-zinc-400">—</p>
    )

  return (
    <div>
      {/* No-CA safety banner — edge case / legacy data guard */}
      {!clientAdmin && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            This client has no Client Admin.{' '}
            <button
              onClick={onSwitchToUsersRoles}
              className="font-medium underline hover:no-underline"
            >
              Go to Users &amp; Roles
            </button>
            {' '}→ Invite User to assign one.
          </p>
        </div>
      )}

      {/* Quick Actions bar — OVERVIEW TAB ONLY */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onEditDetails}
          className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center"
        >
          <Pencil className="w-4 h-4 mr-1.5" />
          Edit Details
        </button>
        {tenant.is_active ? (
          <button
            onClick={onToggleActive}
            className="border border-rose-200 rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center"
          >
            <PowerOff className="w-4 h-4 mr-1.5" />
            Deactivate
          </button>
        ) : (
          <button
            onClick={onToggleActive}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-1.5 text-sm font-medium flex items-center"
          >
            <Power className="w-4 h-4 mr-1.5" />
            Reactivate
          </button>
        )}
      </div>

      {/* Row 1: Client Admin Details + Seat Usage */}
      <div className="flex gap-6">
        {/* Client Admin Details card */}
        <div className="flex-1 bg-white rounded-md border border-zinc-200 p-5">
          {tenant.logo_url && (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-10 w-auto max-w-32 object-contain mb-4"
            />
          )}
          <p className="text-sm font-semibold text-zinc-900 mb-4">Client Admin Details</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-start">
            <p className="text-sm text-zinc-500">Client Name</p>
            <p className="text-sm text-zinc-900">{tenant.name}</p>

            <p className="text-sm text-zinc-500">Type</p>
            <span className="text-xs font-medium bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 w-fit">
              {tenant.type}
            </span>

            <p className="text-sm text-zinc-500">Feature Mode</p>
            <span
              className={`text-xs font-medium rounded-md px-2 py-0.5 w-fit ${
                tenant.feature_toggle_mode === 'FULL_CREATOR'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {tenant.feature_toggle_mode === 'FULL_CREATOR' ? 'Full Creator' : 'Run Only'}
            </span>

            <p className="text-sm text-zinc-500">Status</p>
            <span
              className={`text-xs font-medium rounded-md px-2 py-0.5 w-fit ${
                tenant.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {tenant.is_active ? 'Active' : 'Inactive'}
            </span>

            <p className="text-sm text-zinc-500">Created</p>
            <p className="text-sm text-zinc-900">{formatDate(tenant.created_at)}</p>

            <p className="text-sm text-zinc-500">Client Admin</p>
            <div>
              {clientAdmin ? (
                <>
                  <p className="text-sm text-zinc-900">{clientAdmin.name}</p>
                  <p className="text-sm text-zinc-500">{clientAdmin.email}</p>
                </>
              ) : (
                <p className="text-sm text-zinc-400">Not assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Seat Usage card */}
        <div className="w-64 flex-none bg-white rounded-md border border-zinc-200 p-5">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Seat Usage</p>
          <p className="text-3xl font-semibold text-zinc-900">
            {learnerCount}
            <span className="text-lg text-zinc-400"> / {seatCount || '—'}</span>
          </p>
          {seatCount > 0 && (
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          )}
          <p className="text-xs text-zinc-400 mt-2">Active learners</p>
        </div>
      </div>

      {/* Row 2: Contact & Address */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-zinc-900 mb-3">Contact &amp; Address</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {/* Left column */}
          <div className="space-y-3">
            {(
              [
                ['Contact Name', tenant.contact_name],
                ['Contact Email', tenant.contact_email],
                ['Contact Phone', tenant.contact_phone
                  ? (tenant.contact_phone_country_code
                      ? getDialCode(tenant.contact_phone_country_code) + ' ' + tenant.contact_phone
                      : tenant.contact_phone)
                  : null],
                ['Timezone', tenant.timezone],
                ['Date Format', tenant.date_format],
              ] as [string, string | null | undefined][]
            ).map(([label, value]) => (
              <div key={label} className="flex">
                <p className="text-sm text-zinc-500 w-36 shrink-0">{label}</p>
                {val(value)}
              </div>
            ))}
          </div>
          {/* Right column */}
          <div className="space-y-3">
            {(
              [
                ['Address Line 1', tenant.address_line1],
                ['Address Line 2', tenant.address_line2],
                ['City', tenant.city],
                ['State', tenant.state],
                ['Country', tenant.country],
                ['Zip Code', tenant.zip_code],
              ] as [string, string | null | undefined][]
            ).map(([label, value]) => (
              <div key={label} className="flex">
                <p className="text-sm text-zinc-500 w-36 shrink-0">{label}</p>
                {val(value)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// TabPlans is rendered via PlansTab component (see import above)

// ─── Tab: Users & Roles ───────────────────────────────────────────────────────

function TabUsersRoles({
  tenantId,
  adminUsers,
  onRefresh,
  featureToggleMode,
  contract,
  onSwitchToContract,
}: {
  tenantId: string
  adminUsers: AdminUser[]
  onRefresh: () => void
  featureToggleMode: string
  contract: Contract | null
  onSwitchToContract: () => void
}) {
  const { showToast } = useToast()
  const [showInvite, setShowInvite] = useState(false)
  const [replaceModal, setReplaceModal] = useState<AdminUser | null>(null)
  const [deactivateModal, setDeactivateModal] = useState<AdminUser | null>(null)
  const [reactivating, setReactivating] = useState<string | null>(null)

  const isRunOnly = featureToggleMode === 'RUN_ONLY'
  const activeCACount = adminUsers.filter(u => u.role === 'CLIENT_ADMIN' && u.is_active).length
  const activeCCCount = adminUsers.filter(u => u.role === 'CONTENT_CREATOR' && u.is_active).length
  const ccSeatsAllowed = contract?.content_creator_seats ?? 0
  const hasContract = contract !== null

  const reactivateUser = async (user: AdminUser) => {
    if (user.role === 'CLIENT_ADMIN' && activeCACount >= 1) {
      showToast('Cannot reactivate. This tenant already has an active Client Admin. Replace the current one first.', 'error')
      return
    }
    if (user.role === 'CONTENT_CREATOR' && activeCCCount >= ccSeatsAllowed) {
      showToast(`Cannot reactivate. All ${ccSeatsAllowed} Content Creator seat${ccSeatsAllowed !== 1 ? 's' : ''} are in use.`, 'error')
      return
    }
    setReactivating(user.id)
    try {
      await supabase.from('admin_users').update({ is_active: true }).eq('id', user.id)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'ROLE_REACTIVATED',
        entity_type: 'AdminUser',
        entity_id: user.id,
        before_state: { is_active: false },
        after_state: { is_active: true },
      })
      showToast(`${user.name} has been reactivated.`)
      onRefresh()
    } catch {
      showToast('Failed to reactivate user.', 'error')
    } finally {
      setReactivating(null)
    }
  }

  return (
    <div>
      {/* Instructions panel — always visible */}
      <div className={`mb-4 rounded-md px-4 py-3 border ${
        !hasContract && !isRunOnly
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-100'
      }`}>
        {!hasContract && !isRunOnly ? (
          <p className="text-sm text-amber-700">
            No contract set up. Seat limits cannot be enforced.{' '}
            <button
              onClick={onSwitchToContract}
              className="font-medium underline hover:no-underline"
            >
              Add a contract in the Contract tab.
            </button>
          </p>
        ) : isRunOnly ? (
          <p className="text-sm text-blue-700">
            <span className="font-medium">Run Only client:</span> 1 Client Admin permitted. Content Creators are not supported.
          </p>
        ) : (
          <p className="text-sm text-blue-700">
            <span className="font-medium">Full Creator client:</span> 1 Client Admin permitted.{' '}
            {hasContract
              ? `${activeCCCount} of ${ccSeatsAllowed} Content Creator seat${ccSeatsAllowed !== 1 ? 's' : ''} used.`
              : ''}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-zinc-900">Users &amp; Roles</p>
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
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                      u.role === 'CLIENT_ADMIN'
                        ? 'bg-blue-50 text-blue-700'
                        : u.role === 'SUPER_ADMIN'
                        ? 'bg-zinc-100 text-zinc-600'
                        : 'bg-violet-50 text-violet-700'
                    }`}>
                      {u.role === 'CLIENT_ADMIN' ? 'Client Admin' : u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Content Creator'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                      u.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    {u.role === 'CLIENT_ADMIN' && u.is_active && (
                      <button
                        onClick={() => setReplaceModal(u)}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        Replace
                      </button>
                    )}
                    {u.role === 'CLIENT_ADMIN' && !u.is_active && (
                      <button
                        onClick={() => reactivateUser(u)}
                        disabled={reactivating === u.id}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
                      >
                        {reactivating === u.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Reactivate
                      </button>
                    )}
                    {u.role === 'CONTENT_CREATOR' && u.is_active && (
                      <button
                        onClick={() => setDeactivateModal(u)}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        Deactivate
                      </button>
                    )}
                    {u.role === 'CONTENT_CREATOR' && !u.is_active && (
                      <button
                        onClick={() => reactivateUser(u)}
                        disabled={reactivating === u.id}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
                      >
                        {reactivating === u.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        Reactivate
                      </button>
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
          featureToggleMode={featureToggleMode}
          contract={contract}
          activeCCCount={activeCCCount}
          activeCACount={activeCACount}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            setShowInvite(false)
            onRefresh()
          }}
        />
      )}

      {replaceModal && (
        <ReplaceClientAdminModal
          tenantId={tenantId}
          existingAdmin={replaceModal}
          onClose={() => setReplaceModal(null)}
          onReplaced={() => {
            setReplaceModal(null)
            onRefresh()
          }}
        />
      )}

      {deactivateModal && (
        <DeactivateContentCreatorModal
          tenantId={tenantId}
          user={deactivateModal}
          onClose={() => setDeactivateModal(null)}
          onDeactivated={() => {
            setDeactivateModal(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

// ─── Add Learner Slide-over ───────────────────────────────────────────────────

function AddLearnerSlideOver({
  tenantId,
  onClose,
  onAdded,
}: {
  tenantId: string
  onClose: () => void
  onAdded: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneNum, setPhoneNum] = useState('')
  const [phoneSubmitErr, setPhoneSubmitErr] = useState<string | undefined>()
  const [deptId, setDeptId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [emailErr, setEmailErr] = useState('')

  useEffect(() => {
    supabase
      .from('departments')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .then(({ data }) => setDepartments((data ?? []) as Department[]))
  }, [tenantId])

  useEffect(() => {
    if (!deptId) { setTeams([]); setTeamId(''); return }
    supabase
      .from('teams')
      .select('id, name')
      .eq('department_id', deptId)
      .then(({ data }) => setTeams((data ?? []) as Team[]))
    setTeamId('')
  }, [deptId])

  const save = async () => {
    if (!fullName.trim()) { setErr('Full name is required.'); return }
    if (!email.trim()) { setEmailErr('Email is required.'); return }
    const fmtErr = validateEmail(email)
    if (fmtErr) { setEmailErr(fmtErr); return }
    if (!phoneCode && phoneNum) { setPhoneSubmitErr('Select a country code.'); return }
    if (phoneCode && !phoneNum) { setPhoneSubmitErr('Please enter the phone number.'); return }
    setErr('')
    setEmailErr('')
    setPhoneSubmitErr(undefined)
    setSaving(true)
    try {
      const { data: newLearner, error: insertErr } = await supabase
        .from('learners')
        .insert({
          tenant_id: tenantId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phoneNum || null,
          phone_country_code: phoneCode || null,
          department_id: deptId || null,
          team_id: teamId || null,
          status: 'ACTIVE',
        })
        .select('id')
        .single()

      if (insertErr) {
        if (insertErr.code === '23505') {
          setEmailErr('A learner with this email already exists in this tenant.')
        } else {
          setErr('Failed to add learner. Please try again.')
        }
        return
      }

      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'LEARNER_ADDED',
        entity_type: 'learner',
        entity_id: newLearner.id,
        before_state: null,
        after_state: { full_name: fullName.trim(), email: email.trim(), status: 'ACTIVE' },
      })
      onAdded()
    } catch {
      setErr('Failed to add learner. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl flex flex-col z-50">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
          <p className="text-base font-semibold text-zinc-900">Add Learner</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Priya Mehta"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            {(() => { const liveErr = emailTouched ? validateEmail(email) : null; const displayErr = emailErr || liveErr; return (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="learner@organisation.com"
                  className={`${inputCls} ${displayErr ? 'border-rose-400' : ''}`}
                />
                {displayErr && <p className="text-sm text-rose-600 mt-1">{displayErr}</p>}
              </>
            )})()}
          </div>

          <div>
            <PhoneInputField
              defaultCode={phoneCode}
              defaultNumber={phoneNum}
              onChange={(iso, num) => { setPhoneCode(iso); setPhoneNum(num); setPhoneSubmitErr(undefined) }}
              submitError={phoneSubmitErr}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Department</label>
            <select
              value={deptId}
              onChange={e => setDeptId(e.target.value)}
              className={inputCls}
            >
              <option value="">No department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Team</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              disabled={!deptId}
              className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">No team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-t border-zinc-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-sm text-zinc-600 hover:text-zinc-800">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Learner
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Tab: Learners ────────────────────────────────────────────────────────────

const LEARNERS_PAGE_SIZE = 25

function TabLearners({
  tenantId,
  tenantName,
  onRefresh,
}: {
  tenantId: string
  tenantName: string
  onRefresh: () => void
}) {
  const [learners, setLearners] = useState<RawLearner[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase
      .from('learners')
      .select('*, departments(name), teams(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLearners((data ?? []) as RawLearner[])
        setLoading(false)
      })
  }, [tenantId, refreshKey])

  useEffect(() => {
    supabase
      .from('departments')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .then(({ data }) => setDepartments((data ?? []) as Department[]))
  }, [tenantId])

  const fetchLearners = () => setRefreshKey(k => k + 1)

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 300)
  }

  const filtered = learners.filter(l => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!l.full_name.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false
    }
    if (deptFilter && l.department_id !== deptFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / LEARNERS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * LEARNERS_PAGE_SIZE, safePage * LEARNERS_PAGE_SIZE)
  const showing = {
    from: filtered.length === 0 ? 0 : (safePage - 1) * LEARNERS_PAGE_SIZE + 1,
    to: Math.min(safePage * LEARNERS_PAGE_SIZE, filtered.length),
    total: filtered.length,
  }

  const tenantSlug = tenantName.replace(/\s+/g, '-').toLowerCase()

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-zinc-900">
          Learners{' '}
          <span className="text-zinc-500 font-normal">({learners.length})</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => console.log('Bulk upload — available in SA-Bulk prompt')}
            className="border border-zinc-200 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 text-sm font-medium flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Learner
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          className="w-64 text-sm border border-zinc-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-700"
        />
        <select
          value={deptFilter}
          onChange={e => { setDeptFilter(e.target.value); setPage(1) }}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              {['Full Name', 'Email', 'Department', 'Team', 'Status', 'Date Added'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2].map(i => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-12 animate-pulse bg-zinc-100 rounded-md" />
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Users className="w-8 h-8 text-zinc-300 mb-2 mx-auto" />
                  <p className="text-sm text-zinc-400">No learners found.</p>
                </td>
              </tr>
            ) : (
              paginated.map(l => (
                <tr key={l.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">{l.full_name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{l.email}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{l.departments?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{l.teams?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                        l.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {l.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(l.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + Export */}
      {!loading && (
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => exportLearnersCSV(learners, tenantSlug)}
            className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </button>
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Add Learner Slide-over */}
      {showAdd && (
        <AddLearnerSlideOver
          tenantId={tenantId}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false)
            setToast(true)
            fetchLearners()
            onRefresh()
          }}
        />
      )}

      {toast && <Toast message="Learner added successfully." onDismiss={() => setToast(false)} />}
    </div>
  )
}

// ─── Tab: Content ─────────────────────────────────────────────────────────────

// ─── Tab: Contract ────────────────────────────────────────────────────────────

function TabContract({
  tenantId,
  contract,
  onSaved,
  featureToggleMode,
  tenantStripeCustomerId,
  onTenantStripeSaved,
  activeCCCount,
  activeLearnerCount,
}: {
  tenantId: string
  contract: Contract | null
  onSaved: (c: Contract) => void
  featureToggleMode: string
  tenantStripeCustomerId: string | null
  onTenantStripeSaved: (customerId: string) => void
  activeCCCount: number
  activeLearnerCount: number
}) {
  const { showToast } = useToast()
  const isFullCreator = featureToggleMode === 'FULL_CREATOR'

  // Contract Terms edit state
  const [editingContract, setEditingContract] = useState(false)
  const [contractForm, setContractForm] = useState({
    seat_count: Math.max(1, contract?.seat_count ?? 1),
    content_creator_seats: Math.max(1, contract?.content_creator_seats ?? 1),
    start_date: contract?.start_date?.split('T')[0] ?? '',
    end_date: contract?.end_date?.split('T')[0] ?? '',
    notes: contract?.notes ?? '',
    ccSeatsErr: '',
    seatCountErr: '',
    endDateErr: '',
  })
  const [savingContract, setSavingContract] = useState(false)

  // Stripe edit state
  const [editingStripe, setEditingStripe] = useState(false)
  const [stripeForm, setStripeForm] = useState({
    stripe_customer_id: tenantStripeCustomerId ?? '',
    stripe_subscription_id: contract?.stripe_subscription_id ?? '',
  })
  const [savingStripe, setSavingStripe] = useState(false)

  function startEditContract() {
    setContractForm({
      seat_count: Math.max(1, contract?.seat_count ?? 1),
      content_creator_seats: Math.max(1, contract?.content_creator_seats ?? 1),
      start_date: contract?.start_date?.split('T')[0] ?? '',
      end_date: contract?.end_date?.split('T')[0] ?? '',
      notes: contract?.notes ?? '',
      ccSeatsErr: '',
      seatCountErr: '',
      endDateErr: '',
    })
    setEditingContract(true)
  }

  function startEditStripe() {
    setStripeForm({
      stripe_customer_id: tenantStripeCustomerId ?? '',
      stripe_subscription_id: contract?.stripe_subscription_id ?? '',
    })
    setEditingStripe(true)
  }

  const saveContract = async () => {
    // Full validation pass before any DB write
    const seatNum = Number(contractForm.seat_count)
    const ccNum = Number(contractForm.content_creator_seats)
    let hasErr = false
    let newSeatCountErr = ''
    let newCcSeatsErr = ''
    let newEndDateErr = ''

    if (seatNum <= 0) {
      newSeatCountErr = 'Must be greater than 0.'
      hasErr = true
    } else if (seatNum < activeLearnerCount) {
      newSeatCountErr = `Cannot reduce below ${activeLearnerCount} active learner(s). Archive learners from the Learners tab first.`
      hasErr = true
    }

    if (isFullCreator) {
      if (ccNum <= 0) {
        newCcSeatsErr = 'Must be greater than 0.'
        hasErr = true
      } else if (ccNum > 10) {
        newCcSeatsErr = 'Must be 10 or less.'
        hasErr = true
      } else if (ccNum < activeCCCount) {
        newCcSeatsErr = `Cannot reduce below ${activeCCCount} active Content Creator(s). Deactivate them first.`
        hasErr = true
      }
    }

    if (!contractForm.start_date) {
      hasErr = true
    }
    if (!contractForm.end_date) {
      newEndDateErr = 'End date is required.'
      hasErr = true
    } else if (contractForm.start_date && contractForm.end_date <= contractForm.start_date) {
      newEndDateErr = 'End date must be after start date.'
      hasErr = true
    }

    if (hasErr) {
      setContractForm(f => ({ ...f, seatCountErr: newSeatCountErr, ccSeatsErr: newCcSeatsErr, endDateErr: newEndDateErr }))
      return
    }

    setSavingContract(true)
    try {
      const payload = {
        tenant_id: tenantId,
        seat_count: seatNum,
        content_creator_seats: isFullCreator ? ccNum : 0,
        arr: contract?.arr ?? 0,
        start_date: contractForm.start_date,
        end_date: contractForm.end_date,
        stripe_subscription_id: contract?.stripe_subscription_id ?? '',
        notes: contractForm.notes,
        updated_at: new Date().toISOString(),
      }

      let savedId = contract?.id
      if (contract?.id) {
        const { error: updateErr } = await supabase.from('contracts').update(payload).eq('id', contract.id)
        if (updateErr) throw updateErr
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('contracts').insert(payload).select('id').single()
        if (insertErr) throw insertErr
        savedId = inserted.id
      }

      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'CONTRACT_UPDATED',
        entity_type: 'Contract',
        entity_id: tenantId,
        before_state: contract ? {
          seat_count: contract.seat_count,
          content_creator_seats: contract.content_creator_seats,
          start_date: contract.start_date,
          end_date: contract.end_date,
          notes: contract.notes,
        } : null,
        after_state: {
          seat_count: payload.seat_count,
          content_creator_seats: payload.content_creator_seats,
          start_date: payload.start_date,
          end_date: payload.end_date,
          notes: payload.notes,
        },
      })

      onSaved({ ...payload, id: savedId } as Contract)
      setEditingContract(false)
      showToast('Contract saved successfully.')
    } catch {
      showToast('Failed to save contract.', 'error')
    } finally {
      setSavingContract(false)
    }
  }

  const saveStripe = async () => {
    setSavingStripe(true)
    try {
      if (contract?.id) {
        await supabase.from('contracts').update({
          stripe_subscription_id: stripeForm.stripe_subscription_id,
          updated_at: new Date().toISOString(),
        }).eq('id', contract.id)
      }
      await supabase.from('tenants').update({
        stripe_customer_id: stripeForm.stripe_customer_id || null,
      }).eq('id', tenantId)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'CONTRACT_UPDATED',
        entity_type: 'Contract',
        entity_id: tenantId,
        before_state: { stripe_subscription_id: contract?.stripe_subscription_id },
        after_state: { stripe_subscription_id: stripeForm.stripe_subscription_id },
      })
      onSaved({ ...contract!, stripe_subscription_id: stripeForm.stripe_subscription_id, updated_at: new Date().toISOString() })
      onTenantStripeSaved(stripeForm.stripe_customer_id)
      setEditingStripe(false)
      showToast('Stripe details saved.')
    } catch {
      showToast('Failed to save Stripe details.', 'error')
    } finally {
      setSavingStripe(false)
    }
  }

  const inputCls = 'text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none'
  const readVal = (v: string | number | null | undefined) =>
    v != null && v !== '' ? String(v) : <span className="text-zinc-400">—</span>

  const arrDisplay = contract?.arr != null && contract.arr > 0
    ? `$${(contract.arr / 100).toFixed(2)} / year`
    : null

  return (
    <div className="space-y-4">

      {/* Section 1 — Contract Terms */}
      <div className="bg-white rounded-md border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-zinc-900">Contract Terms</p>
          {!editingContract && (
            <button
              onClick={startEditContract}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 border border-blue-200 rounded-md px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>

        {editingContract ? (
          <div className="space-y-4">
            <div className={`grid gap-4 ${isFullCreator ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
              {/* Learner Seats */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Learner Seats</label>
                <input
                  type="number"
                  min={1}
                  value={contractForm.seat_count}
                  onChange={e => {
                    const num = Number(e.target.value)
                    let seatCountErr = ''
                    if (num <= 0) seatCountErr = 'Must be greater than 0.'
                    else if (num < activeLearnerCount) seatCountErr = `Cannot reduce below ${activeLearnerCount} active learner(s). Archive learners from the Learners tab first.`
                    setContractForm(f => ({ ...f, seat_count: num, seatCountErr }))
                  }}
                  className={`${inputCls} ${contractForm.seatCountErr ? 'border-rose-400' : ''}`}
                />
                <p className="text-xs text-zinc-400 mt-1">{activeLearnerCount} currently active</p>
                {contractForm.seatCountErr && (
                  <p className="text-xs text-rose-600 mt-0.5">{contractForm.seatCountErr}</p>
                )}
              </div>
              {/* CC Seats — FULL_CREATOR only */}
              {isFullCreator && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Content Creator Seats</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={contractForm.content_creator_seats}
                    onChange={e => {
                      const num = Number(e.target.value)
                      let ccSeatsErr = ''
                      if (num <= 0) ccSeatsErr = 'Must be greater than 0.'
                      else if (num > 10) ccSeatsErr = 'Must be 10 or less.'
                      else if (num < activeCCCount) ccSeatsErr = `Cannot reduce below ${activeCCCount} active Content Creator(s). Deactivate them first.`
                      setContractForm(f => ({ ...f, content_creator_seats: num, ccSeatsErr }))
                    }}
                    className={`${inputCls} ${contractForm.ccSeatsErr ? 'border-rose-400' : ''}`}
                  />
                  <p className="text-xs text-zinc-400 mt-1">{activeCCCount} currently active</p>
                  {contractForm.ccSeatsErr && (
                    <p className="text-xs text-rose-600 mt-0.5">{contractForm.ccSeatsErr}</p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Start Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  value={contractForm.start_date}
                  onChange={e => {
                    const newStart = e.target.value
                    const endDateErr = newStart && contractForm.end_date && contractForm.end_date <= newStart
                      ? 'End date must be after start date.'
                      : contractForm.endDateErr === 'End date must be after start date.' ? '' : contractForm.endDateErr
                    setContractForm(f => ({ ...f, start_date: newStart, endDateErr }))
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">End Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  value={contractForm.end_date}
                  onChange={e => {
                    const newEnd = e.target.value
                    const endDateErr = contractForm.start_date && newEnd && newEnd <= contractForm.start_date
                      ? 'End date must be after start date.'
                      : ''
                    setContractForm(f => ({ ...f, end_date: newEnd, endDateErr }))
                  }}
                  className={`${inputCls} ${contractForm.endDateErr ? 'border-rose-400' : ''}`}
                />
                {contractForm.endDateErr && (
                  <p className="text-xs text-rose-600 mt-1">{contractForm.endDateErr}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Notes</label>
              <textarea rows={3} value={contractForm.notes}
                onChange={e => setContractForm(f => ({ ...f, notes: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveContract}
                disabled={savingContract || !!(contractForm.ccSeatsErr || contractForm.seatCountErr || contractForm.endDateErr)}
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savingContract && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
              <button onClick={() => setEditingContract(false)}
                className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">
                Cancel
              </button>
              {contract?.updated_at && (
                <p className="text-xs text-zinc-400 ml-auto">Last updated {formatDate(contract.updated_at)}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Over-limit warnings — view mode only */}
            {contract && activeLearnerCount > (contract.seat_count ?? 0) && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{activeLearnerCount} learners are active but only {contract.seat_count} seat{contract.seat_count !== 1 ? 's' : ''} are contracted. Archive learners to resolve.</span>
              </div>
            )}
            {isFullCreator && contract && activeCCCount > (contract.content_creator_seats ?? 0) && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{activeCCCount} Content Creator{activeCCCount !== 1 ? 's' : ''} are active but only {contract.content_creator_seats} seat{(contract.content_creator_seats ?? 0) !== 1 ? 's' : ''} are contracted. Deactivate them to resolve.</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-zinc-400">Learner Seats</p>
                <p className="text-sm font-medium text-zinc-900 mt-0.5">{readVal(contract?.seat_count)}</p>
                {contract?.seat_count != null && (
                  <p className="text-xs text-zinc-400 mt-0.5">{activeLearnerCount} of {contract.seat_count} in use</p>
                )}
              </div>
              {isFullCreator && (
                <div>
                  <p className="text-xs text-zinc-400">Content Creator Seats</p>
                  <p className="text-sm font-medium text-zinc-900 mt-0.5">{readVal(contract?.content_creator_seats)}</p>
                  {contract?.content_creator_seats != null && contract.content_creator_seats > 0 && (
                    <p className="text-xs text-zinc-400 mt-0.5">{activeCCCount} of {contract.content_creator_seats} in use</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-400">Start Date</p>
                <p className="text-sm font-medium text-zinc-900 mt-0.5">{contract?.start_date ? formatDate(contract.start_date) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">End Date</p>
                <p className="text-sm font-medium text-zinc-900 mt-0.5">{contract?.end_date ? formatDate(contract.end_date) : '—'}</p>
              </div>
            </div>
            {contract?.notes && (
              <div>
                <p className="text-xs text-zinc-400">Notes</p>
                <p className="text-sm text-zinc-700 mt-0.5">{contract.notes}</p>
              </div>
            )}
            {contract?.updated_at && (
              <p className="text-xs text-zinc-400 pt-1">Last updated {formatDate(contract.updated_at)}</p>
            )}
          </div>
        )}
      </div>

      {/* Section 2 — Payment & Billing */}
      <div className="bg-white rounded-md border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-zinc-900">Payment &amp; Billing</p>
          {!editingStripe && (
            <button
              onClick={startEditStripe}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 border border-blue-200 rounded-md px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit Stripe
            </button>
          )}
        </div>

        {editingStripe ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Stripe Customer ID</label>
              <input type="text" value={stripeForm.stripe_customer_id}
                onChange={e => setStripeForm(f => ({ ...f, stripe_customer_id: e.target.value }))}
                placeholder="cus_..."
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Subscription ID</label>
              <input type="text" value={stripeForm.stripe_subscription_id}
                onChange={e => setStripeForm(f => ({ ...f, stripe_subscription_id: e.target.value }))}
                placeholder="sub_..."
                className={inputCls} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={saveStripe} disabled={savingStripe}
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70">
                {savingStripe && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Stripe Details
              </button>
              <button onClick={() => setEditingStripe(false)}
                className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-zinc-400">Stripe Customer ID</p>
              <p className="text-sm font-medium text-zinc-900 mt-0.5 font-mono text-xs">
                {readVal(tenantStripeCustomerId)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Subscription ID</p>
              <p className="text-sm font-medium text-zinc-900 mt-0.5 font-mono text-xs">
                {readVal(contract?.stripe_subscription_id)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-zinc-400">ARR</p>
              {arrDisplay ? (
                <>
                  <p className="text-sm font-medium text-zinc-900 mt-0.5">{arrDisplay}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Calculated from Stripe</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-400 mt-0.5">—</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Calculated from Stripe</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 3 — Storage & Hosting (FULL_CREATOR only) */}
      {isFullCreator && (
        <div className="bg-white rounded-md border border-zinc-200 p-5">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Storage &amp; Hosting</p>
          <p className="text-xs text-zinc-400 mb-4">Daily snapshot · Super Admin only</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Total Storage Used</p>
              <p className="text-sm font-semibold text-zinc-900">12.4 GB</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Est. Hosting Cost</p>
              <p className="text-sm font-semibold text-zinc-900">$18.60 / mo</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Last Snapshot</p>
              <p className="text-sm font-semibold text-zinc-900">Mar 18, 2026</p>
            </div>
          </div>
        </div>
      )}

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
  'LEARNER_ADDED',
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
          onClick={() => exportAuditCSV(filtered, tenantName)}
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

const TABS = [
  'Overview',
  'Plans',
  'Users & Roles',
  'Learners',
  'Contract',
  'Audit History',
] as const
type Tab = (typeof TABS)[number]

export default function TenantDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [learnerCount, setLearnerCount] = useState(0)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  // ── Edit Details slide-over
  const [showEditDetails, setShowEditDetails] = useState(false)

  // ── Page-level toast (header actions)
  const [pageToast, setPageToast] = useState<{ msg: string; variant: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes, uRes, lRes, logRes] = await Promise.all([
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
      ])

      if (tRes.data) setTenant(tRes.data as TenantDetail)
      if (cRes.data) setContract(cRes.data as Contract)
      setAdminUsers((uRes.data || []) as AdminUser[])
      setLearnerCount(lRes.count || 0)
      setAuditLogs((logRes.data || []) as AuditLog[])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const refreshUsers = useCallback(async () => {
    const { data } = await supabase.from('admin_users').select('*').eq('tenant_id', id)
    setAdminUsers((data || []) as AdminUser[])
  }, [id])

  const toggleActive = async () => {
    if (!tenant) return
    const newActive = !tenant.is_active
    const { error } = await supabase
      .from('tenants')
      .update({ is_active: newActive })
      .eq('id', id)
    if (error) {
      setPageToast({ msg: `Failed to ${newActive ? 'reactivate' : 'deactivate'} tenant.`, variant: 'error' })
      return
    }
    await supabase.from('audit_logs').insert({
      action: 'TENANT_UPDATED',
      entity_type: 'tenant',
      entity_id: id,
      actor_name: 'Super Admin',
      before_state: { is_active: tenant.is_active },
      after_state: { is_active: newActive },
    })
    setTenant(prev => prev ? { ...prev, is_active: newActive } : prev)
    setPageToast({ msg: newActive ? 'Tenant reactivated.' : 'Tenant deactivated.', variant: 'success' })
  }

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

  const clientAdminUser = adminUsers.find(u => u.role === 'CLIENT_ADMIN' && u.is_active)
  const clientAdmin = clientAdminUser
    ? { name: clientAdminUser.name, email: clientAdminUser.email }
    : null

  const handleEditDetailsSave = (updated: Partial<TenantRow>) => {
    setTenant(prev => prev ? { ...prev, ...updated } as TenantDetail : prev)
    setPageToast({ msg: 'Tenant details updated', variant: 'success' })
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <Link href="/super-admin/tenants" className="text-zinc-500 hover:text-zinc-700">
          Client Admins
        </Link>
        <ChevronRight className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">{tenant.name}</h1>
        <span
          className={`text-xs font-medium rounded-md px-2 py-0.5 ${
            tenant.feature_toggle_mode === 'FULL_CREATOR'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {tenant.feature_toggle_mode ?? 'RUN_ONLY'}
        </span>
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
          clientAdmin={clientAdmin}
          onEditDetails={() => setShowEditDetails(true)}
          onToggleActive={toggleActive}
          onSwitchToUsersRoles={() => setActiveTab('Users & Roles')}
        />
      )}
      {activeTab === 'Plans' && (
        <PlansTab tenantId={id} />
      )}
      {activeTab === 'Users & Roles' && (
        <TabUsersRoles
          tenantId={id}
          adminUsers={adminUsers}
          onRefresh={refreshUsers}
          featureToggleMode={tenant.feature_toggle_mode ?? 'RUN_ONLY'}
          contract={contract}
          onSwitchToContract={() => setActiveTab('Contract')}
        />
      )}
      {activeTab === 'Learners' && (
        <TabLearners
          tenantId={id}
          tenantName={tenant.name}
          onRefresh={load}
        />
      )}
      {activeTab === 'Contract' && (
        <TabContract
          tenantId={id}
          contract={contract}
          onSaved={c => setContract(c)}
          featureToggleMode={tenant.feature_toggle_mode ?? ''}
          tenantStripeCustomerId={tenant.stripe_customer_id ?? null}
          onTenantStripeSaved={customerId => setTenant(prev => prev ? { ...prev, stripe_customer_id: customerId } : prev)}
          activeCCCount={adminUsers.filter(u => u.role === 'CONTENT_CREATOR' && u.is_active).length}
          activeLearnerCount={learnerCount}
        />
      )}
      {activeTab === 'Audit History' && (
        <TabAuditHistory
          logs={auditLogs}
          tenantName={tenant.name}
        />
      )}

      <EditDetailsSlideOver
        isOpen={showEditDetails}
        onClose={() => setShowEditDetails(false)}
        tenant={tenant}
        onSave={handleEditDetailsSave}
      />

      {pageToast && (
        <Toast
          message={pageToast.msg}
          variant={pageToast.variant}
          onDismiss={() => setPageToast(null)}
        />
      )}
    </div>
  )
}
