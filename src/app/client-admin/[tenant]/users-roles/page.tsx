'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  UserCog,
  Mail,
  Shield,
  Plus,
  X,
  AlertTriangle,
  Pencil,
  Check,
  Calendar,
  KeyRound,
  Eye,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  first_name: string | null
  last_name: string | null
  email: string
  role: string
  is_active: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(firstName: string | null, lastName: string | null) {
  const first = firstName?.charAt(0) ?? ''
  const last = lastName?.charAt(0) ?? ''
  return (first + last).toUpperCase() || '?'
}

function getFullName(firstName: string | null, lastName: string | null): string {
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  if (lastName) return lastName
  return ''
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
      Inactive
    </span>
  )
}

// ─── View CC slide-over ───────────────────────────────────────────────────────

function ViewCCSlideOver({
  cc,
  onClose,
}: {
  cc: AdminUser
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Content Creator Profile</h2>
            <p className="text-xs text-zinc-500 mt-0.5">View-only</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Avatar block */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-md bg-amber-100 flex items-center justify-center text-lg font-semibold text-amber-700 shrink-0">
              {getInitials(cc.first_name, cc.last_name)}
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900">{getFullName(cc.first_name, cc.last_name)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Shield className="w-3 h-3" />
                  Content Creator
                </span>
                <StatusBadge active={cc.is_active} />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-sm text-zinc-900">{cc.email}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 mb-1">Role</p>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-sm text-zinc-900">Content Creator</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 mb-1">Added</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-sm text-zinc-900">{formatDate(cc.created_at)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400 mb-1">Status</p>
              <StatusBadge active={cc.is_active} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Edit CC slide-over ───────────────────────────────────────────────────────

function EditCCSlideOver({
  cc,
  onClose,
  onSaved,
}: {
  cc: AdminUser
  onClose: () => void
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState(cc.first_name ?? '')
  const [lastName, setLastName] = useState(cc.last_name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Password reset warning modal state
  const [showPasswordWarning, setShowPasswordWarning] = useState(false)

  const passwordFilled = newPassword.length > 0 || confirmPassword.length > 0

  function validate(): string | null {
    if (!firstName.trim()) return 'First name is required.'
    if (passwordFilled) {
      if (newPassword.length < 8) return 'Password must be at least 8 characters.'
      if (newPassword !== confirmPassword) return 'Passwords do not match.'
    }
    return null
  }

  function handleSaveClick() {
    setError(null)
    const err = validate()
    if (err) { setError(err); return }

    // If password fields are filled, show the warning modal first
    if (passwordFilled) {
      setShowPasswordWarning(true)
    } else {
      void doSave()
    }
  }

  async function doSave() {
    setSaving(true)
    setShowPasswordWarning(false)
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const { error: updateErr } = await supabase
      .from('admin_users')
      .update({ 
        name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null
      })
      .eq('id', cc.id)
    if (updateErr) { setError(updateErr.message); setSaving(false); return }
    setSaving(false)
    onSaved()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Edit Content Creator</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{cc.email}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Profile
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  First Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reset password */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-zinc-400" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Reset Password
              </p>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Leave blank to keep the current password. Filling these fields will reset the
              Content Creator's password on save.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Inline amber callout when password fields are touched */}
            {passwordFilled && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Saving will reset this Content Creator's password. You will need to share
                  the new password with them directly.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
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
            onClick={handleSaveClick}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password reset warning modal — shown when password fields are filled */}
      {showPasswordWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-xl">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Reset password?</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    You are about to reset{' '}
                    <span className="font-medium text-zinc-700">{cc.name}</span>'s password.
                    They will need to log in with the new password immediately.
                  </p>
                  <p className="text-sm text-zinc-500 mt-2">
                    Make sure you share the new password with them securely before confirming.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setShowPasswordWarning(false)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel — go back
              </button>
              <button
                onClick={() => void doSave()}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Add CC slide-over ────────────────────────────────────────────────────────

function AddCCSlideOver({
  tenantId,
  onClose,
  onAdded,
}: {
  tenantId: string
  onClose: () => void
  onAdded: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    if (!password) { setError('Password is required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setSaving(true)

    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email.trim().toLowerCase())
      .limit(1)

    if (existing && existing.length > 0) {
      setError('A user with this email already exists for this tenant.')
      setSaving(false)
      return
    }

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const { error: insertErr } = await supabase
      .from('admin_users')
      .insert({
        tenant_id: tenantId,
        name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        email: email.trim().toLowerCase(),
        role: 'CONTENT_CREATOR',
        is_active: true,
      })

    if (insertErr) { setError(insertErr.message); setSaving(false); return }
    setSaving(false)
    onAdded()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] z-50 bg-white shadow-xl border-l border-zinc-200 flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Add Content Creator</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Content Creators can manage your organisation's content bank.
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                First Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Priya"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Mehta"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Email <span className="text-rose-600">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@akashinstitute.com"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div className="pt-1 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 mb-3">
              Set a temporary password. The user should change this on first login.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Confirm Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
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
            {saving ? 'Adding…' : 'Add Content Creator'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersRolesPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [caUser, setCaUser] = useState<AdminUser | null>(null)
  const [contentCreators, setContentCreators] = useState<AdminUser[]>([])
  const [tenantMode, setTenantMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // CA profile edit state
  const [editingName, setEditingName] = useState(false)
  const [firstNameValue, setFirstNameValue] = useState('')
  const [lastNameValue, setLastNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // CC panel state
  const [addCCOpen, setAddCCOpen] = useState(false)
  const [viewCC, setViewCC] = useState<AdminUser | null>(null)
  const [editCC, setEditCC] = useState<AdminUser | null>(null)

  // Deactivate/reactivate confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string
    message: string
    confirmLabel: string
    destructive?: boolean
    onConfirm: () => Promise<void>
  } | null>(null)

  const fetchData = useCallback(async () => {
    if (!tenantId) { setLoading(false); return }
    setLoading(true)

    const [tenantRes, caRes, ccRes] = await Promise.all([
      supabase.from('tenants').select('feature_toggle_mode').eq('id', tenantId).single(),
      supabase
        .from('admin_users')
        .select('id, name, first_name, last_name, email, role, is_active, created_at')
        .eq('tenant_id', tenantId)
        .eq('role', 'CLIENT_ADMIN')
        .limit(1)
        .single(),
      supabase
        .from('admin_users')
        .select('id, name, first_name, last_name, email, role, is_active, created_at')
        .eq('tenant_id', tenantId)
        .eq('role', 'CONTENT_CREATOR')
        .order('created_at', { ascending: true }),
    ])

    if (tenantRes.data) setTenantMode(tenantRes.data.feature_toggle_mode)
    if (caRes.data) {
      setCaUser(caRes.data as AdminUser)
      setFirstNameValue(caRes.data.first_name ?? '')
      setLastNameValue(caRes.data.last_name ?? '')
    }
    setContentCreators((ccRes.data ?? []) as AdminUser[])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { void fetchData() }, [fetchData])

  // ── CA profile name edit ───────────────────────────────────────────────────

  async function handleSaveName() {
    if (!caUser || !firstNameValue.trim()) { setNameError('First name is required.'); return }
    setSavingName(true)
    setNameError(null)
    const fullName = [firstNameValue.trim(), lastNameValue.trim()].filter(Boolean).join(' ')
    const { error } = await supabase
      .from('admin_users')
      .update({ 
        name: fullName,
        first_name: firstNameValue.trim(),
        last_name: lastNameValue.trim() || null
      })
      .eq('id', caUser.id)
    if (error) { setNameError(error.message); setSavingName(false); return }
    setCaUser((prev) => prev ? { 
      ...prev, 
      name: fullName,
      first_name: firstNameValue.trim(),
      last_name: lastNameValue.trim() || null
    } : prev)
    setSavingName(false)
    setEditingName(false)
  }

  function handleCancelEdit() {
    setFirstNameValue(caUser?.first_name ?? '')
    setLastNameValue(caUser?.last_name ?? '')
    setNameError(null)
    setEditingName(false)
  }

  // ── CC actions ─────────────────────────────────────────────────────────────

  function handleDeactivateCC(cc: AdminUser) {
    setConfirmModal({
      title: 'Deactivate Content Creator',
      message: `Deactivate "${cc.name}"? They will lose access to the content bank. This can be reversed.`,
      confirmLabel: 'Deactivate',
      destructive: true,
      onConfirm: async () => {
        await supabase.from('admin_users').update({ is_active: false }).eq('id', cc.id)
        setConfirmModal(null)
        await fetchData()
      },
    })
  }

  function handleReactivateCC(cc: AdminUser) {
    setConfirmModal({
      title: 'Reactivate Content Creator',
      message: `Reactivate "${cc.name}"? They will regain access to the content bank.`,
      confirmLabel: 'Reactivate',
      onConfirm: async () => {
        await supabase.from('admin_users').update({ is_active: true }).eq('id', cc.id)
        setConfirmModal(null)
        await fetchData()
      },
    })
  }

  const isFullCreator = tenantMode === 'FULL_CREATOR'

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Users & Roles</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your admin profile and organisation users
        </p>
      </div>

      {/* ── Section 1: CA Profile ─────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-700">My Profile</p>
        </div>

        {caUser ? (
          <div className="px-6 py-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-md bg-violet-100 flex items-center justify-center text-lg font-semibold text-violet-700 shrink-0">
                {getInitials(caUser.first_name, caUser.last_name)}
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">{getFullName(caUser.first_name, caUser.last_name)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield className="w-3 h-3" />
                    Client Admin
                  </span>
                  <StatusBadge active={caUser.is_active} />
                </div>
              </div>
            </div>

            <div className="space-y-5 max-w-md">
              {/* Name (editable) */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
                {editingName ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={firstNameValue}
                          onChange={(e) => setFirstNameValue(e.target.value)}
                          placeholder="First Name"
                          className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={lastNameValue}
                          onChange={(e) => setLastNameValue(e.target.value)}
                          placeholder="Last Name"
                          className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors disabled:opacity-50"
                      >
                        {savingName ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-900 font-medium">{getFullName(caUser.first_name, caUser.last_name)}</p>
                    <button
                      onClick={() => setEditingName(true)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                )}
                {nameError && <p className="text-xs text-rose-600 mt-1">{nameError}</p>}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <p className="text-sm text-zinc-900">{caUser.email}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Email cannot be changed. Contact your Super Admin if an update is needed.
                </p>
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
                  <p className="text-sm text-zinc-900">Client Admin</p>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Role is assigned by your Super Admin and cannot be changed here.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">No admin profile found.</p>
          </div>
        )}
      </div>

      {/* ── Section 2: Content Creators (FULL_CREATOR only) ───────────────── */}
      {isFullCreator && (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-700">Content Creators</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Content Creators manage your organisation's private content bank.
              </p>
            </div>
            <button
              onClick={() => setAddCCOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Content Creator
            </button>
          </div>

          {contentCreators.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
              <UserCog className="w-8 h-8 text-zinc-300 mb-3" />
              <p className="text-sm font-medium text-zinc-500">No Content Creators yet</p>
              <p className="text-xs text-zinc-400 mt-1">
                Add a Content Creator to let them manage your private content bank.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {contentCreators.map((cc) => (
                  <tr key={cc.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700 shrink-0">
                          {getInitials(cc.first_name, cc.last_name)}
                        </div>
                        <p className="font-medium text-zinc-900">{getFullName(cc.first_name, cc.last_name)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{cc.email}</td>
                    <td className="px-6 py-3">
                      <StatusBadge active={cc.is_active} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewCC(cc)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => setEditCC(cc)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        {cc.is_active ? (
                          <button
                            onClick={() => handleDeactivateCC(cc)}
                            className="px-2 py-1 text-xs font-medium text-rose-600 border border-rose-200 rounded hover:bg-rose-50 transition-colors"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateCC(cc)}
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
          )}
        </div>
      )}

      {/* RUN_ONLY note */}
      {!isFullCreator && tenantMode !== null && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-md px-5 py-4">
          <p className="text-sm text-zinc-500">
            Content Creator management is available for Full Creator tenants only.
            This tenant is configured in{' '}
            <span className="font-medium text-zinc-700">Run-Only</span> mode — all content
            is provided by keySkillset.
          </p>
        </div>
      )}

      {/* Panels */}
      {viewCC && <ViewCCSlideOver cc={viewCC} onClose={() => setViewCC(null)} />}

      {editCC && (
        <EditCCSlideOver
          cc={editCC}
          onClose={() => setEditCC(null)}
          onSaved={async () => {
            setEditCC(null)
            await fetchData()
          }}
        />
      )}

      {addCCOpen && tenantId && (
        <AddCCSlideOver
          tenantId={tenantId}
          onClose={() => setAddCCOpen(false)}
          onAdded={async () => {
            setAddCCOpen(false)
            await fetchData()
          }}
        />
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{confirmModal.title}</p>
                  <p className="text-sm text-zinc-500 mt-1">{confirmModal.message}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors ${
                  confirmModal.destructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-violet-700 hover:bg-violet-800'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
