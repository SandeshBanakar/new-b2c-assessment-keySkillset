'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  tenant_id: string | null
  tenant_name?: string | null
}

interface FormState {
  // Section 1
  name: string
  clientAdminMode: 'search' | 'invite'
  selectedAdmin: { id: string; name: string; email: string } | null
  inviteAdmin: { name: string; email: string }
  featureMode: 'RUN_ONLY' | 'FULL_CREATOR'
  // Section 2
  contactName: string
  contactEmail: string
  contactPhone: string
  timezone: string
  dateFormat: string
  // Section 3
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  zipCode: string
  // Section 4 (contract)
  contractExpanded: boolean
  seatCount: string
  arrUsd: string
  startDate: string
  endDate: string
  stripeCustomerId: string
  notes: string
  // Control
  isDirty: boolean
  isSubmitting: boolean
  phase1Complete: boolean
  newTenantId: string | null
  errors: Record<string, string>
}

const INITIAL_FORM: FormState = {
  name: '',
  clientAdminMode: 'search',
  selectedAdmin: null,
  inviteAdmin: { name: '', email: '' },
  featureMode: 'RUN_ONLY',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  contractExpanded: false,
  seatCount: '',
  arrUsd: '',
  startDate: '',
  endDate: '',
  stripeCustomerId: '',
  notes: '',
  isDirty: false,
  isSubmitting: false,
  phase1Complete: false,
  newTenantId: null,
  errors: {},
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastInfo {
  tenantName: string
  tenantId: string
}

function SuccessToast({ info, onDismiss }: { info: ToastInfo; onDismiss: () => void }) {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-[70] bg-white border border-zinc-200 shadow-md rounded-md px-4 py-3 text-sm flex items-center gap-2 max-w-xs">
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      <span className="text-zinc-700">
        <span className="font-medium">{info.tenantName}</span> created.{' '}
        <button
          onClick={() => router.push(`/super-admin/tenants/${info.tenantId}`)}
          className="text-blue-700 hover:text-blue-800 font-medium"
        >
          View tenant →
        </button>
      </span>
      <button onClick={onDismiss} className="ml-1 text-zinc-400 hover:text-zinc-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Discard Dialog ───────────────────────────────────────────────────────────

function DiscardDialog({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void
  onDiscard: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-lg p-6 w-80">
        <p className="text-base font-semibold text-zinc-900 mb-2">Discard this tenant?</p>
        <p className="text-sm text-zinc-500 mb-6">Your changes will not be saved.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onDiscard}
            className="text-sm font-medium text-zinc-600"
          >
            Discard
          </button>
          <button
            onClick={onKeep}
            className="bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Client Admin Search ──────────────────────────────────────────────────────

function ClientAdminField({
  form,
  setForm,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminUser[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDropdown(false); return }
    setSearching(true)
    const { data } = await supabase
      .from('admin_users')
      .select('id, name, email, tenant_id, tenants(name)')
      .ilike('email', `%${q}%`)
      .limit(4)
    const rows: AdminUser[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      email: r.email as string,
      tenant_id: r.tenant_id as string | null,
      tenant_name: r.tenant_id
        ? (r.tenants as { name: string } | null)?.name ?? null
        : null,
    }))
    setResults(rows)
    setShowDropdown(true)
    setSearching(false)
  }, [])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    setForm(f => ({ ...f, isDirty: true }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  const selectAdmin = (user: AdminUser) => {
    setForm(f => ({
      ...f,
      selectedAdmin: { id: user.id, name: user.name, email: user.email },
      clientAdminMode: 'search',
      isDirty: true,
      errors: { ...f.errors, clientAdmin: '' },
    }))
    setShowDropdown(false)
    setQuery('')
  }

  const clearSelected = () => {
    setForm(f => ({ ...f, selectedAdmin: null, isDirty: true }))
  }

  const initials = (name: string) => name.trim().charAt(0).toUpperCase() || '?'

  const blockedUsers = results.filter(r => r.tenant_id !== null)
  const showInviteOption =
    showDropdown &&
    (results.length === 0 || blockedUsers.length === results.length)

  return (
    <div>
      <label className="text-sm font-medium text-zinc-700 block mb-0.5">
        Client Admin <span className="text-rose-500">*</span>
      </label>
      <p className="text-xs text-zinc-500 mb-2">Search by email to find or invite an admin.</p>

      {form.selectedAdmin ? (
        <div className="border border-blue-700 bg-blue-50 rounded-md p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-700 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {initials(form.selectedAdmin.name || form.selectedAdmin.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{form.selectedAdmin.name}</p>
            <p className="text-xs text-zinc-500 truncate">{form.selectedAdmin.email}</p>
          </div>
          <button onClick={clearSelected} className="text-zinc-400 hover:text-zinc-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by email..."
              className="w-full border border-zinc-200 rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-400" />
            )}
          </div>

          {showDropdown && (
            <div className="border border-zinc-200 rounded-md bg-white shadow-sm overflow-hidden mt-1">
              {results.length === 0 ? (
                <p className="text-sm text-zinc-500 px-3 py-2.5">No admin found for this email.</p>
              ) : (
                results.map(user => {
                  const blocked = user.tenant_id !== null
                  return (
                    <div
                      key={user.id}
                      onClick={() => !blocked && selectAdmin(user)}
                      className={`flex items-center gap-3 px-3 py-2.5 ${
                        blocked
                          ? 'bg-amber-50 cursor-not-allowed'
                          : 'hover:bg-zinc-50 cursor-pointer'
                      }`}
                    >
                      {blocked ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-blue-700 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {initials(user.name || user.email)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        {blocked && (
                          <p className="text-xs text-amber-700">
                            Client Admin of {user.tenant_name ?? 'another tenant'}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {showInviteOption && (
            <button
              type="button"
              onClick={() => { setShowInvite(true); setShowDropdown(false) }}
              className="mt-2 text-sm text-blue-700 font-medium cursor-pointer"
            >
              + Invite as new Client Admin
            </button>
          )}
        </>
      )}

      {form.errors.clientAdmin && (
        <p className="text-sm text-rose-600 mt-1">{form.errors.clientAdmin}</p>
      )}

      {showInvite && !form.selectedAdmin && (
        <InviteAdminForm
          initialEmail={query}
          form={form}
          setForm={setForm}
          onCancel={() => setShowInvite(false)}
        />
      )}
    </div>
  )
}

// ─── Invite Admin Form ────────────────────────────────────────────────────────

function InviteAdminForm({
  initialEmail,
  form,
  setForm,
  onCancel,
}: {
  initialEmail: string
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onCancel: () => void
}) {
  const [localName, setLocalName] = useState(form.inviteAdmin.name)
  const [localEmail, setLocalEmail] = useState(form.inviteAdmin.email || initialEmail)

  const sync = (name: string, email: string) => {
    setForm(f => ({
      ...f,
      inviteAdmin: { name, email },
      clientAdminMode: 'invite',
      isDirty: true,
    }))
  }

  const bothFilled = localName.trim() && localEmail.trim()

  return (
    <div className="mt-3 p-3 border border-zinc-200 rounded-md bg-zinc-50">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-medium text-zinc-700 uppercase tracking-wide">Invite new admin</p>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">Full Name</label>
          <input
            type="text"
            value={localName}
            onChange={e => { setLocalName(e.target.value); sync(e.target.value, localEmail) }}
            className="w-full border border-zinc-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">Email</label>
          <input
            type="email"
            value={localEmail}
            onChange={e => { setLocalEmail(e.target.value); sync(localName, e.target.value) }}
            className="w-full border border-zinc-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>
      </div>

      {bothFilled && (
        <div className="mt-3 border border-blue-700 bg-blue-50 rounded-md p-3">
          <p className="text-xs text-blue-700 mb-1">Will be invited as Client Admin</p>
          <p className="text-sm font-medium text-zinc-900">{localName}</p>
          <p className="text-sm text-zinc-500">{localEmail}</p>
        </div>
      )}
    </div>
  )
}

// ─── Field Components ─────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-zinc-700 block mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-sm text-rose-600 mt-1">{msg}</p>
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
          error ? 'border-rose-400' : 'border-zinc-200'
        }`}
      />
      <FieldError msg={error} />
    </>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">{title}</p>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateTenantSlideOver({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [showDiscard, setShowDiscard] = useState(false)
  const [toast, setToast] = useState<ToastInfo | null>(null)
  const [contractError, setContractError] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') attemptClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const field = (key: keyof FormState) => (v: string) =>
    setForm(f => ({ ...f, [key]: v, isDirty: true, errors: { ...f.errors, [key]: '' } }))

  const attemptClose = () => {
    if (form.isDirty) setShowDiscard(true)
    else onClose()
  }

  const discardAndClose = () => {
    setForm(INITIAL_FORM)
    setShowDiscard(false)
    onClose()
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Tenant name is required.'
    const hasAdmin =
      form.selectedAdmin ||
      (form.clientAdminMode === 'invite' &&
        form.inviteAdmin.name.trim() &&
        form.inviteAdmin.email.trim())
    if (!hasAdmin) e.clientAdmin = 'Select or invite a Client Admin.'
    if (!form.contactName.trim()) e.contactName = 'Contact name is required.'
    if (!form.contactEmail.trim()) e.contactEmail = 'Contact email is required.'
    if (!form.contactPhone.trim()) e.contactPhone = 'Contact phone is required.'
    if (!form.timezone) e.timezone = 'Timezone is required.'
    if (!form.dateFormat) e.dateFormat = 'Date format is required.'
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required.'
    if (!form.city.trim()) e.city = 'City is required.'
    if (!form.state.trim()) e.state = 'State is required.'
    if (!form.country.trim()) e.country = 'Country is required.'
    if (!form.zipCode.trim()) e.zipCode = 'Zip code is required.'
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      e.endDate = 'End date must be after start date.'
    return e
  }

  const scrollToFirstError = (errors: Record<string, string>) => {
    const order = [
      'name', 'clientAdmin',
      'contactName', 'contactEmail', 'contactPhone', 'timezone', 'dateFormat',
      'addressLine1', 'city', 'state', 'country', 'zipCode',
    ]
    const first = order.find(k => errors[k])
    if (!first) return
    const el = bodyRef.current?.querySelector(`[data-field="${first}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  const save = async () => {
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setForm(f => ({ ...f, errors }))
      scrollToFirstError(errors)
      return
    }

    setForm(f => ({ ...f, isSubmitting: true, errors: {} }))

    try {
      // Phase 1 — tenant record
      const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .insert({
          name: form.name.trim(),
          type: 'B2B',
          feature_toggle_mode: form.featureMode,
          is_active: true,
          contact_name: form.contactName.trim(),
          contact_email: form.contactEmail.trim(),
          contact_phone: form.contactPhone.trim(),
          timezone: form.timezone,
          date_format: form.dateFormat,
          address_line1: form.addressLine1.trim(),
          address_line2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim(),
          zip_code: form.zipCode.trim(),
        })
        .select('id')
        .single()

      if (tErr) {
        if (tErr.code === '23505') {
          setForm(f => ({
            ...f,
            isSubmitting: false,
            errors: { name: 'A tenant with this name already exists.' },
          }))
          bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        throw tErr
      }

      const newId = tenant.id

      // Admin user
      if (form.selectedAdmin) {
        await supabase
          .from('admin_users')
          .update({ tenant_id: newId })
          .eq('id', form.selectedAdmin.id)
      } else if (form.clientAdminMode === 'invite') {
        await supabase.from('admin_users').insert({
          email: form.inviteAdmin.email.trim(),
          name: form.inviteAdmin.name.trim(),
          role: 'CLIENT_ADMIN',
          tenant_id: newId,
          is_active: true,
        })
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'TENANT_CREATED',
        entity_type: 'tenant',
        entity_id: newId,
        actor_name: 'Super Admin',
        after_state: {
          name: form.name.trim(),
          feature_toggle_mode: form.featureMode,
          contact_name: form.contactName.trim(),
          contact_email: form.contactEmail.trim(),
          timezone: form.timezone,
          address_line1: form.addressLine1.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
        },
      })

      setForm(f => ({ ...f, phase1Complete: true, newTenantId: newId }))

      // Phase 2 — contract (non-blocking)
      const hasContract =
        form.seatCount || form.arrUsd || form.startDate || form.endDate || form.stripeCustomerId || form.notes

      if (hasContract) {
        const { error: cErr } = await supabase.from('contracts').insert({
          tenant_id: newId,
          seat_count: form.seatCount ? parseInt(form.seatCount) : null,
          arr_usd_cents: form.arrUsd ? parseFloat(form.arrUsd) * 100 : null,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
          stripe_customer_id: form.stripeCustomerId.trim() || null,
          notes: form.notes.trim() || null,
        })

        if (cErr) {
          setContractError(true)
          setForm(f => ({ ...f, isSubmitting: false }))
          // Scroll to contract section
          const el = bodyRef.current?.querySelector('[data-section="contract"]')
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }

        await supabase.from('audit_logs').insert({
          action: 'CONTRACT_CREATED',
          entity_type: 'contract',
          entity_id: newId,
          actor_name: 'Super Admin',
          after_state: {
            seat_count: form.seatCount || null,
            arr_usd_cents: form.arrUsd ? parseFloat(form.arrUsd) * 100 : null,
            start_date: form.startDate || null,
            end_date: form.endDate || null,
          },
        })
      }

      // Success
      const savedName = form.name.trim()
      setForm(INITIAL_FORM)
      onCreated()
      setToast({ tenantName: savedName, tenantId: newId })
    } catch {
      setForm(f => ({ ...f, isSubmitting: false }))
      // Show error toast via a simple state — handled below
      alert('Failed to create tenant. Please try again.')
    }
  }

  const retryContract = async () => {
    if (!form.newTenantId) return
    setForm(f => ({ ...f, isSubmitting: true }))
    const { error: cErr } = await supabase.from('contracts').insert({
      tenant_id: form.newTenantId,
      seat_count: form.seatCount ? parseInt(form.seatCount) : null,
      arr_usd_cents: form.arrUsd ? parseFloat(form.arrUsd) * 100 : null,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      stripe_customer_id: form.stripeCustomerId.trim() || null,
      notes: form.notes.trim() || null,
    })
    if (!cErr) {
      setContractError(false)
      const savedName = form.name.trim()
      const savedId = form.newTenantId
      setForm(INITIAL_FORM)
      onCreated()
      setToast({ tenantName: savedName, tenantId: savedId })
    } else {
      setForm(f => ({ ...f, isSubmitting: false }))
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={attemptClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-xl flex flex-col z-[60]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center flex-shrink-0">
          <p className="text-lg font-semibold text-zinc-900">Create Tenant</p>
          <button onClick={attemptClose} className="text-zinc-500 hover:text-zinc-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── SECTION 1: TENANT SETUP ── */}
          <SectionHeader title="Tenant Setup" />

          {/* Tenant Name */}
          <div className="mb-5" data-field="name">
            <FieldLabel required>Tenant Name</FieldLabel>
            <TextInput
              value={form.name}
              onChange={field('name')}
              placeholder="e.g. Akash Institute Delhi"
              error={form.errors.name}
            />
          </div>

          {/* Client Admin */}
          <div className="mb-5" data-field="clientAdmin">
            <ClientAdminField form={form} setForm={setForm} />
          </div>

          {/* Feature Mode */}
          <div className="mb-5">
            <FieldLabel required>Feature Mode</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              {(['RUN_ONLY', 'FULL_CREATOR'] as const).map(m => (
                <div
                  key={m}
                  onClick={() => { setForm(f => ({ ...f, featureMode: m, isDirty: true })) }}
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    form.featureMode === m
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {m === 'RUN_ONLY' ? 'Run Only' : 'Full Creator'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {m === 'RUN_ONLY'
                      ? 'Can run existing assessments'
                      : 'Can create and run assessments'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION 2: CLIENT PROFILE ── */}
          <div className="border-t border-zinc-200 my-6" />
          <SectionHeader title="Client Profile" />

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="col-span-2" data-field="contactName">
              <FieldLabel required>Contact Name</FieldLabel>
              <TextInput
                value={form.contactName}
                onChange={field('contactName')}
                placeholder="Primary contact at this organisation"
                error={form.errors.contactName}
              />
            </div>

            <div data-field="contactEmail">
              <FieldLabel required>Contact Email</FieldLabel>
              <TextInput
                value={form.contactEmail}
                onChange={field('contactEmail')}
                placeholder="contact@org.com"
                type="email"
                error={form.errors.contactEmail}
              />
            </div>

            <div data-field="contactPhone">
              <FieldLabel required>Contact Phone</FieldLabel>
              <TextInput
                value={form.contactPhone}
                onChange={field('contactPhone')}
                placeholder="+91 XXXXX XXXXX"
                type="tel"
                error={form.errors.contactPhone}
              />
            </div>

            <div data-field="timezone">
              <FieldLabel required>Timezone</FieldLabel>
              <select
                value={form.timezone}
                onChange={e => field('timezone')(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
                  form.errors.timezone ? 'border-rose-400' : 'border-zinc-200'
                }`}
              >
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                <option value="Asia/Singapore">Singapore Time (SGT)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
              <FieldError msg={form.errors.timezone} />
            </div>

            <div data-field="dateFormat">
              <FieldLabel required>Date Format</FieldLabel>
              <select
                value={form.dateFormat}
                onChange={e => field('dateFormat')(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
                  form.errors.dateFormat ? 'border-rose-400' : 'border-zinc-200'
                }`}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
              <FieldError msg={form.errors.dateFormat} />
            </div>
          </div>

          {/* ── SECTION 3: ADDRESS ── */}
          <div className="border-t border-zinc-200 my-6" />
          <SectionHeader title="Address" />

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="col-span-2" data-field="addressLine1">
              <FieldLabel required>Address Line 1</FieldLabel>
              <TextInput
                value={form.addressLine1}
                onChange={field('addressLine1')}
                placeholder="Building, street, area"
                error={form.errors.addressLine1}
              />
            </div>

            <div className="col-span-2">
              <FieldLabel>Address Line 2</FieldLabel>
              <TextInput
                value={form.addressLine2}
                onChange={field('addressLine2')}
                placeholder="Suite, floor, landmark (optional)"
              />
            </div>

            <div data-field="country">
              <FieldLabel required>Country</FieldLabel>
              <TextInput
                value={form.country}
                onChange={field('country')}
                error={form.errors.country}
              />
            </div>

            <div data-field="state">
              <FieldLabel required>State</FieldLabel>
              <TextInput
                value={form.state}
                onChange={field('state')}
                error={form.errors.state}
              />
            </div>

            <div data-field="city">
              <FieldLabel required>City</FieldLabel>
              <TextInput
                value={form.city}
                onChange={field('city')}
                error={form.errors.city}
              />
            </div>

            <div data-field="zipCode">
              <FieldLabel required>Zip Code</FieldLabel>
              <TextInput
                value={form.zipCode}
                onChange={field('zipCode')}
                error={form.errors.zipCode}
              />
            </div>
          </div>

          {/* ── SECTION 4: CONTRACT DETAILS ── */}
          <div className="border-t border-zinc-200 my-6" data-section="contract" />

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
              Contract Details
            </p>
            <p className="text-xs text-zinc-400">Optional — can be added later</p>
          </div>

          {/* Phase 1 success banner when contract failed */}
          {contractError && (
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Tenant saved successfully.</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setForm(f => ({ ...f, contractExpanded: !f.contractExpanded, isDirty: true }))
            }}
            className="flex items-center gap-1.5 text-sm text-blue-700 font-medium mb-2 w-full text-left"
          >
            {form.contractExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide contract details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Add contract details
              </>
            )}
          </button>

          {form.contractExpanded && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <FieldLabel>Seat Count</FieldLabel>
                <input
                  type="number"
                  min={1}
                  value={form.seatCount}
                  onChange={e => { setForm(f => ({ ...f, seatCount: e.target.value, isDirty: true })) }}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>

              <div>
                <FieldLabel>ARR (USD)</FieldLabel>
                <input
                  type="number"
                  value={form.arrUsd}
                  onChange={e => { setForm(f => ({ ...f, arrUsd: e.target.value, isDirty: true })) }}
                  placeholder="e.g. 12000"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700"
                />
                <p className="text-xs text-zinc-400 mt-1">Stored in cents × 100</p>
              </div>

              <div>
                <FieldLabel>Start Date</FieldLabel>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => { setForm(f => ({ ...f, startDate: e.target.value, isDirty: true, errors: { ...f.errors, endDate: '' } })) }}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>

              <div>
                <FieldLabel>End Date</FieldLabel>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => { setForm(f => ({ ...f, endDate: e.target.value, isDirty: true, errors: { ...f.errors, endDate: '' } })) }}
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
                    form.errors.endDate ? 'border-rose-400' : 'border-zinc-200'
                  }`}
                />
                <FieldError msg={form.errors.endDate} />
              </div>

              <div className="col-span-2">
                <FieldLabel>Stripe Customer ID</FieldLabel>
                <input
                  type="text"
                  value={form.stripeCustomerId}
                  onChange={e => { setForm(f => ({ ...f, stripeCustomerId: e.target.value, isDirty: true })) }}
                  placeholder="cus_..."
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>

              <div className="col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => { setForm(f => ({ ...f, notes: e.target.value, isDirty: true })) }}
                  placeholder="Internal notes about this contract"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 resize-none"
                />
              </div>

              {contractError && (
                <p className="col-span-2 text-sm text-rose-600 mt-2">
                  Contract could not be saved. Retry or add from the tenant page.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-white flex justify-end gap-3 flex-shrink-0">
          {contractError && form.newTenantId ? (
            <>
              <button
                onClick={() => router.push(`/super-admin/tenants/${form.newTenantId}`)}
                className="text-sm text-zinc-600 hover:text-zinc-800"
              >
                Go to tenant →
              </button>
              <button
                onClick={retryContract}
                disabled={form.isSubmitting}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-md px-4 py-2 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {form.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Retry Contract
              </button>
            </>
          ) : (
            <>
              <button
                onClick={attemptClose}
                className="text-sm text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={form.isSubmitting}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-md px-4 py-2 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {form.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Tenant
              </button>
            </>
          )}
        </div>
      </div>

      {/* Discard Dialog */}
      {showDiscard && (
        <DiscardDialog
          onKeep={() => setShowDiscard(false)}
          onDiscard={discardAndClose}
        />
      )}

      {/* Success Toast */}
      {toast && (
        <SuccessToast info={toast} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
