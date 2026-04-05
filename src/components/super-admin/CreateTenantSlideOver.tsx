'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Upload,
  Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  // Section 1 — Client Setup
  name: string
  // Section 1b — Client Admin
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
  // Section 4 (contract) — mandatory
  seatCount: string
  contentCreatorSeats: string
  startDate: string
  endDate: string
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
  seatCount: '',
  contentCreatorSeats: '',
  startDate: '',
  endDate: '',
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
  caEmail: string
}

function SuccessToast({ info, onDismiss }: { info: ToastInfo; onDismiss: () => void }) {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-[70] bg-white border border-zinc-200 shadow-md rounded-md px-4 py-3 text-sm flex items-center gap-2 max-w-sm">
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      <span className="text-zinc-700">
        Tenant Created. Invite email sent to{' '}
        <span className="font-medium">{info.caEmail}</span>.{' '}
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

function ErrorToast({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-[70] bg-white border border-zinc-200 shadow-md rounded-md px-4 py-3 text-sm flex items-center gap-2 max-w-sm">
      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
      <span className="text-zinc-700">{msg}</span>
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
        <p className="text-base font-semibold text-zinc-900 mb-2">Discard this client admin?</p>
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

// ─── Duplicate Email Modal ────────────────────────────────────────────────────

function DuplicateEmailModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-lg p-6 w-80">
        <p className="text-base font-semibold text-zinc-900 mb-2">Client Admin Already Exists</p>
        <p className="text-sm text-zinc-500 mb-6">
          This email is already registered as a Client Admin for another tenant. Each Client Admin can only be assigned to one tenant.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [toast, setToast] = useState<ToastInfo | null>(null)
  const [errorToastMsg, setErrorToastMsg] = useState<string | null>(null)
  const [contractError, setContractError] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoDragOver, setLogoDragOver] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoFile = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) return
    if (file.size > 512000) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

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
    setLogoFile(null)
    setLogoPreview(null)
    setShowDiscard(false)
    onClose()
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.name.trim()) e.name = 'Tenant name is required.'
    if (!form.inviteAdmin.name.trim()) e.inviteAdminName = 'Client Admin name is required.'
    if (!form.inviteAdmin.email.trim()) {
      e.inviteAdminEmail = 'Client Admin email is required.'
    } else if (!emailRegex.test(form.inviteAdmin.email.trim())) {
      e.inviteAdminEmail = 'Enter a valid email address.'
    }
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
    // Contract — mandatory
    if (!form.seatCount || parseInt(form.seatCount) <= 0) e.seatCount = 'Learner seats must be greater than 0.'
    if (!form.startDate) e.startDate = 'Start date is required.'
    if (!form.endDate) e.endDate = 'End date is required.'
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      e.endDate = 'End date must be after start date.'
    if (form.featureMode === 'FULL_CREATOR') {
      const ccNum = parseInt(form.contentCreatorSeats)
      if (!form.contentCreatorSeats || isNaN(ccNum) || ccNum <= 0)
        e.contentCreatorSeats = 'Must be greater than 0.'
      else if (ccNum > 10)
        e.contentCreatorSeats = 'Must be 10 or less.'
    }
    return e
  }

  const scrollToFirstError = (errors: Record<string, string>) => {
    const order = [
      'name', 'inviteAdminName', 'inviteAdminEmail',
      'contactName', 'contactEmail', 'contactPhone', 'timezone', 'dateFormat',
      'addressLine1', 'city', 'state', 'country', 'zipCode',
      'seatCount', 'startDate', 'endDate', 'contentCreatorSeats',
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
      // Duplicate email check before any DB writes
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', form.inviteAdmin.email.trim())
        .maybeSingle()

      if (existingAdmin) {
        setShowDuplicateModal(true)
        setForm(f => ({ ...f, isSubmitting: false }))
        return
      }

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

      // Insert Client Admin
      const { error: adminErr } = await supabase.from('admin_users').insert({
        email: form.inviteAdmin.email.trim(),
        name: form.inviteAdmin.name.trim(),
        role: 'CLIENT_ADMIN',
        tenant_id: newId,
        is_active: true,
      })

      if (adminErr) {
        if (adminErr.code === '23505') {
          // Race condition — unique constraint fired at DB level
          setShowDuplicateModal(true)
          setForm(f => ({ ...f, isSubmitting: false }))
          return
        }
        setErrorToastMsg('Insert failed. Something went wrong. Please try again.')
        setForm(f => ({ ...f, isSubmitting: false }))
        return
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

      // Phase 2 — contract (mandatory)
      {
        const { error: cErr } = await supabase.from('contracts').insert({
          tenant_id: newId,
          seat_count: parseInt(form.seatCount),
          start_date: form.startDate,
          end_date: form.endDate,
          notes: form.notes.trim() || null,
          content_creator_seats: form.featureMode === 'FULL_CREATOR' ? parseInt(form.contentCreatorSeats) : 0,
        })

        if (cErr) {
          setContractError(true)
          setForm(f => ({ ...f, isSubmitting: false }))
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
            seat_count: parseInt(form.seatCount),
            start_date: form.startDate,
            end_date: form.endDate,
          },
        })
      }

      // Upload logo if provided
      if (logoFile) {
        const { error: uploadErr } = await supabase.storage
          .from('tenant-logo')
          .upload(`${newId}.jpg`, logoFile, { upsert: true, contentType: logoFile.type })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('tenant-logo').getPublicUrl(`${newId}.jpg`)
          await supabase.from('tenants').update({ logo_url: urlData.publicUrl + '?t=' + Date.now() }).eq('id', newId)
        }
      }

      // Success
      const savedName = form.name.trim()
      const savedEmail = form.inviteAdmin.email.trim()
      setLogoFile(null)
      setLogoPreview(null)
      setForm(INITIAL_FORM)
      onCreated()
      setToast({ tenantName: savedName, tenantId: newId, caEmail: savedEmail })
    } catch {
      setForm(f => ({ ...f, isSubmitting: false }))
      setErrorToastMsg('Failed to create tenant. Something went wrong. Please try again.')
    }
  }

  const retryContract = async () => {
    if (!form.newTenantId) return
    setForm(f => ({ ...f, isSubmitting: true }))
    const { error: cErr } = await supabase.from('contracts').insert({
      tenant_id: form.newTenantId,
      seat_count: parseInt(form.seatCount),
      start_date: form.startDate,
      end_date: form.endDate,
      notes: form.notes.trim() || null,
      content_creator_seats: form.featureMode === 'FULL_CREATOR' ? parseInt(form.contentCreatorSeats) : 0,
    })
    if (!cErr) {
      setContractError(false)
      const savedName = form.name.trim()
      const savedId = form.newTenantId
      const savedEmail = form.inviteAdmin.email.trim()
      setForm(INITIAL_FORM)
      onCreated()
      setToast({ tenantName: savedName, tenantId: savedId, caEmail: savedEmail })
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
          <p className="text-lg font-semibold text-zinc-900">Create Client Admin</p>
          <button onClick={attemptClose} className="text-zinc-500 hover:text-zinc-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── SECTION 1: CLIENT SETUP ── */}
          <SectionHeader title="Client Setup" />

          {/* Client Name */}
          <div className="mb-5" data-field="name">
            <FieldLabel required>Client Name</FieldLabel>
            <TextInput
              value={form.name}
              onChange={field('name')}
              placeholder="e.g. Akash Institute Delhi"
              error={form.errors.name}
            />
          </div>

          {/* ── SECTION 1b: CLIENT ADMIN ── */}
          <div className="border-t border-zinc-200 my-6" />
          <SectionHeader title="Client Admin" />
          <p className="text-xs text-zinc-500 -mt-3 mb-4">
            Invite an admin and an email will be sent to them post creation.
          </p>

          <div className="mb-5" data-field="inviteAdminName">
            <FieldLabel required>Client Admin Name</FieldLabel>
            <TextInput
              value={form.inviteAdmin.name}
              onChange={v => setForm(f => ({
                ...f,
                inviteAdmin: { ...f.inviteAdmin, name: v },
                isDirty: true,
                errors: { ...f.errors, inviteAdminName: '' },
              }))}
              placeholder="e.g. Raj Sharma"
              error={form.errors.inviteAdminName}
            />
          </div>

          <div className="mb-5" data-field="inviteAdminEmail">
            <FieldLabel required>Client Admin Email</FieldLabel>
            <TextInput
              type="email"
              value={form.inviteAdmin.email}
              onChange={v => setForm(f => ({
                ...f,
                inviteAdmin: { ...f.inviteAdmin, email: v },
                isDirty: true,
                errors: { ...f.errors, inviteAdminEmail: '' },
              }))}
              placeholder="e.g. raj@akashinstitute.com"
              error={form.errors.inviteAdminEmail}
            />
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

          {/* Logo Upload */}
          <div className="mb-5">
            <FieldLabel>Logo <span className="text-zinc-400 font-normal text-xs">(optional)</span></FieldLabel>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }}
            />
            {logoPreview ? (
              <div className="flex items-center gap-3 p-3 border border-zinc-200 rounded-md bg-zinc-50">
                <img src={logoPreview} alt="Logo preview" className="h-10 w-auto max-w-30 object-contain rounded" />
                <p className="flex-1 text-xs text-zinc-500 truncate min-w-0">{logoFile?.name}</p>
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                  className="text-zinc-400 hover:text-rose-600 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true) }}
                onDragLeave={() => setLogoDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setLogoDragOver(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleLogoFile(f)
                }}
                className={`flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                  logoDragOver ? 'border-blue-700 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                }`}
              >
                <Upload className="w-5 h-5 text-zinc-400" />
                <p className="text-xs text-zinc-500">
                  <span className="text-blue-700 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-zinc-400">PNG, JPG · max 500KB</p>
              </div>
            )}
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

          {/* ── SECTION 4: CONTRACT TERMS ── */}
          <div className="border-t border-zinc-200 my-6" data-section="contract" />

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
              Contract Terms
            </p>
            <p className="text-xs text-rose-500">Required</p>
          </div>

          {/* Phase 1 success banner when contract failed */}
          {contractError && (
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Tenant saved successfully.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div data-field="seatCount">
              <FieldLabel required>Learner Seats</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.seatCount}
                onChange={e => { setForm(f => ({ ...f, seatCount: e.target.value, isDirty: true, errors: { ...f.errors, seatCount: '' } })) }}
                placeholder="e.g. 50"
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
                  form.errors.seatCount ? 'border-rose-400' : 'border-zinc-200'
                }`}
              />
              <FieldError msg={form.errors.seatCount} />
            </div>

            {form.featureMode === 'FULL_CREATOR' && (
              <div data-field="contentCreatorSeats">
                <FieldLabel required>Content Creator Seats</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.contentCreatorSeats}
                  onChange={e => {
                    const val = e.target.value
                    const num = parseInt(val)
                    let ccErr = ''
                    if (val !== '' && (isNaN(num) || num <= 0)) ccErr = 'Must be greater than 0.'
                    else if (!isNaN(num) && num > 10) ccErr = 'Must be 10 or less.'
                    setForm(f => ({ ...f, contentCreatorSeats: val, isDirty: true, errors: { ...f.errors, contentCreatorSeats: ccErr } }))
                  }}
                  placeholder="1 – 10"
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
                    form.errors.contentCreatorSeats ? 'border-rose-400' : 'border-zinc-200'
                  }`}
                />
                <FieldError msg={form.errors.contentCreatorSeats} />
              </div>
            )}

            <div data-field="startDate">
              <FieldLabel required>Start Date</FieldLabel>
              <input
                type="date"
                value={form.startDate}
                onChange={e => { setForm(f => ({ ...f, startDate: e.target.value, isDirty: true, errors: { ...f.errors, startDate: '', endDate: '' } })) }}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-700 ${
                  form.errors.startDate ? 'border-rose-400' : 'border-zinc-200'
                }`}
              />
              <FieldError msg={form.errors.startDate} />
            </div>

            <div data-field="endDate">
              <FieldLabel required>End Date</FieldLabel>
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
                Create Client Admin
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

      {/* Duplicate Email Modal */}
      {showDuplicateModal && (
        <DuplicateEmailModal onDismiss={() => setShowDuplicateModal(false)} />
      )}

      {/* Success Toast */}
      {toast && (
        <SuccessToast info={toast} onDismiss={() => setToast(null)} />
      )}

      {/* Error Toast */}
      {errorToastMsg && (
        <ErrorToast msg={errorToastMsg} onDismiss={() => setErrorToastMsg(null)} />
      )}
    </>
  )
}
