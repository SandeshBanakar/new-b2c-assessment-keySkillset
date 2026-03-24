'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Search, Plus, UserCircle, Upload, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantRow {
  id: string
  name: string
  type: string
  feature_toggle_mode: 'RUN_ONLY' | 'FULL_CREATOR'
  licensed_categories?: string[]
  is_active: boolean
  created_at: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zip_code?: string | null
  timezone?: string | null
  date_format?: string | null
  logo_url?: string | null
}

interface FormState {
  name: string
  feature_toggle_mode: 'RUN_ONLY' | 'FULL_CREATOR'
  contact_name: string
  contact_email: string
  contact_phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  country: string
  zip_code: string
  timezone: string
  date_format: string
}

interface ClientAdminRecord {
  id: string
  name: string
  email: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY']

const TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return [
      'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
      'Asia/Shanghai', 'Asia/Seoul', 'Asia/Bangkok', 'Asia/Karachi',
      'Asia/Dhaka', 'Asia/Colombo', 'Asia/Kathmandu',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
      'America/New_York', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'America/Toronto', 'America/Sao_Paulo',
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos',
      'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
      'UTC',
    ]
  }
})()

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium',
  'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Cambodia',
  'Cameroon', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic',
  'Denmark', 'Ecuador', 'Egypt', 'Ethiopia', 'Finland', 'France',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Hong Kong',
  'Hungary', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Lebanon', 'Libya', 'Malaysia', 'Mexico', 'Morocco', 'Myanmar',
  'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Oman',
  'Pakistan', 'Palestine', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia', 'Singapore',
  'Slovakia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka',
  'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

// ─── SearchableSelect ─────────────────────────────────────────────────────────

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  inputCls,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  inputCls: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  )

  const handleFocus = () => { setSearch(''); setOpen(true) }
  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setOpen(false)
    setSearch('')
  }
  const handleSelect = (option: string) => {
    onChange(option)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={open ? search : value}
          onFocus={handleFocus}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={open ? 'Search…' : (placeholder ?? '')}
          className={`${inputCls} pl-8`}
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">No results</p>
          ) : (
            filtered.slice(0, 80).map((option) => (
              <button
                key={option}
                type="button"
                tabIndex={0}
                onMouseDown={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value === option ? 'bg-blue-50 text-blue-700 font-medium' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditDetailsSlideOver({
  isOpen,
  onClose,
  tenant,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  tenant: TenantRow
  onSave: (updated: Partial<TenantRow>) => void
}) {
  const [form, setForm] = useState<FormState>({
    name: '',
    feature_toggle_mode: 'RUN_ONLY',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
  })
  const [saving, setSaving] = useState(false)
  const [nameErr, setNameErr] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [logoDragOver, setLogoDragOver] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Client Admin state
  const [currentCA, setCurrentCA] = useState<ClientAdminRecord | null | undefined>(undefined)
  const [showAddCA, setShowAddCA] = useState(false)
  const [caName, setCaName] = useState('')
  const [caEmail, setCaEmail] = useState('')
  const [caNameErr, setCaNameErr] = useState('')
  const [caEmailErr, setCaEmailErr] = useState('')
  const [savingCA, setSavingCA] = useState(false)
  const [caSuccess, setCaSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: tenant.name,
        feature_toggle_mode: tenant.feature_toggle_mode,
        contact_name: tenant.contact_name ?? '',
        contact_email: tenant.contact_email ?? '',
        contact_phone: tenant.contact_phone ?? '',
        address_line1: tenant.address_line1 ?? '',
        address_line2: tenant.address_line2 ?? '',
        city: tenant.city ?? '',
        state: tenant.state ?? '',
        country: tenant.country ?? '',
        zip_code: tenant.zip_code ?? '',
        timezone: tenant.timezone ?? 'Asia/Kolkata',
        date_format: tenant.date_format ?? 'DD/MM/YYYY',
      })
      setDirty(false)
      setConfirmDiscard(false)
      setNameErr('')
      setCurrentCA(undefined)
      setShowAddCA(false)
      setCaName('')
      setCaEmail('')
      setCaSuccess(false)
      setLogoFile(null)
      setLogoPreview(null)
      setRemoveLogo(false)

      // Fetch current Client Admin
      supabase
        .from('admin_users')
        .select('id, name, email')
        .eq('tenant_id', tenant.id)
        .eq('role', 'CLIENT_ADMIN')
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setCurrentCA(data ?? null))
    }
  }, [isOpen, tenant])

  if (!isOpen) return null

  const set = (key: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setDirty(true)
  }

  const handleLogoFile = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) return
    if (file.size > 512000) return
    setLogoFile(file)
    setRemoveLogo(false)
    setDirty(true)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleClose = () => {
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  const handleDiscard = () => {
    setConfirmDiscard(false)
    setDirty(false)
    onClose()
  }

  const save = async () => {
    if (!form.name.trim()) {
      setNameErr('Client name is required.')
      return
    }
    setNameErr('')
    setSaving(true)
    try {
      const payload: Partial<TenantRow> = {
        name: form.name.trim(),
        feature_toggle_mode: form.feature_toggle_mode,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        zip_code: form.zip_code.trim() || null,
        timezone: form.timezone || 'Asia/Kolkata',
        date_format: form.date_format || 'DD/MM/YYYY',
      }

      // Handle logo upload / removal
      if (logoFile) {
        const { error: uploadErr } = await supabase.storage
          .from('tenant-logo')
          .upload(`${tenant.id}.jpg`, logoFile, { upsert: true, contentType: logoFile.type })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('tenant-logo').getPublicUrl(`${tenant.id}.jpg`)
          payload.logo_url = urlData.publicUrl + '?t=' + Date.now()
        }
      } else if (removeLogo) {
        await supabase.storage.from('tenant-logo').remove([`${tenant.id}.jpg`])
        payload.logo_url = null
      }

      const { error } = await supabase
        .from('tenants')
        .update(payload)
        .eq('id', tenant.id)

      if (error) throw error

      await supabase.from('audit_logs').insert({
        tenant_id: tenant.id,
        actor_name: 'Super Admin',
        action: 'TENANT_UPDATED',
        entity_type: 'Tenant',
        entity_id: tenant.id,
        before_state: { ...tenant } as Record<string, unknown>,
        after_state: { ...tenant, ...payload } as Record<string, unknown>,
      })

      onSave(payload)
      setDirty(false)
      onClose()
    } catch {
      // surface error via parent toast
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCA() {
    let hasErr = false
    if (!caName.trim()) { setCaNameErr('Name is required.'); hasErr = true } else setCaNameErr('')
    if (!caEmail.trim()) { setCaEmailErr('Email is required.'); hasErr = true } else setCaEmailErr('')
    if (hasErr) return

    setSavingCA(true)
    try {
      const { error } = await supabase.from('admin_users').insert({
        name: caName.trim(),
        email: caEmail.trim(),
        role: 'CLIENT_ADMIN',
        tenant_id: tenant.id,
        is_active: true,
      })
      if (error) throw error
      setCurrentCA({ id: '', name: caName.trim(), email: caEmail.trim() })
      setShowAddCA(false)
      setCaName('')
      setCaEmail('')
      setCaSuccess(true)
    } catch {
      setCaEmailErr('Failed to add Client Admin. Email may already exist.')
    } finally {
      setSavingCA(false)
    }
  }

  const inputCls = 'border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full'
  const sectionHeaderCls = 'text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3 mt-6'
  const labelCls = 'text-sm font-medium text-zinc-700 block mb-1'

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />

      <div className="fixed right-0 top-0 h-full w-120 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
          <p className="text-base font-semibold text-zinc-900">Edit Details</p>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmDiscard && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800 mb-2">You have unsaved changes. Discard?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDiscard(false)} className="text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md px-3 py-1 hover:bg-zinc-50">
                Keep Editing
              </button>
              <button onClick={handleDiscard} className="text-sm font-medium text-rose-600 border border-rose-200 rounded-md px-3 py-1 hover:bg-rose-50">
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Section 1 — Tenant Setup */}
          <p className={sectionHeaderCls}>Tenant Setup</p>

          <div className="mb-4">
            <label className={labelCls}>Client Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={`${inputCls} ${nameErr ? 'border-rose-400' : ''}`}
            />
            {nameErr && <p className="text-sm text-rose-600 mt-1">{nameErr}</p>}
          </div>

          <div>
            <label className={labelCls}>Feature Toggle Mode</label>
            <select value={form.feature_toggle_mode} onChange={(e) => set('feature_toggle_mode', e.target.value)} className={inputCls}>
              <option value="RUN_ONLY">Run Only</option>
              <option value="FULL_CREATOR">Full Creator</option>
            </select>
          </div>

          {/* Logo Upload */}
          <div className="mt-4">
            <label className={labelCls}>Logo <span className="text-zinc-400 font-normal">(optional)</span></label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }}
            />
            {(logoPreview || (!removeLogo && tenant.logo_url)) ? (
              <div className="flex items-center gap-3 p-3 border border-zinc-200 rounded-md bg-zinc-50">
                <img
                  src={logoPreview ?? tenant.logo_url ?? ''}
                  alt="Tenant logo"
                  className="h-10 w-auto max-w-30 object-contain rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 truncate">{logoFile?.name ?? 'Current logo'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setRemoveLogo(true); setDirty(true) }}
                  className="text-zinc-400 hover:text-rose-600 transition-colors"
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

          {/* Section 2 — Address & Locale */}
          <p className={sectionHeaderCls}>Address &amp; Locale</p>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Address Line 1</label>
              <input type="text" value={form.address_line1} onChange={(e) => set('address_line1', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Address Line 2</label>
              <input type="text" value={form.address_line2} onChange={(e) => set('address_line2', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input type="text" value={form.state} onChange={(e) => set('state', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Zip Code</label>
                <input type="text" value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <SearchableSelect
                  value={form.country}
                  onChange={(v) => set('country', v)}
                  options={COUNTRIES}
                  placeholder="Search country…"
                  inputCls={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Timezone</label>
              <SearchableSelect
                value={form.timezone}
                onChange={(v) => set('timezone', v)}
                options={TIMEZONES}
                placeholder="Search timezone…"
                inputCls={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date Format</label>
              <select value={form.date_format} onChange={(e) => set('date_format', e.target.value)} className={inputCls}>
                {DATE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Section 3 — Client Profile */}
          <p className={sectionHeaderCls}>Client Profile</p>

          <div className="space-y-4">
            {/* Contact fields */}
            <div>
              <label className={labelCls}>Contact Name</label>
              <input type="text" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Phone</label>
              <input type="text" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} className={inputCls} />
            </div>

            {/* Client Admin display / add */}
            <div className="pt-2 border-t border-zinc-100">
              <p className="text-sm font-medium text-zinc-700 mb-2">Client Admin</p>

              {currentCA === undefined ? (
                <p className="text-xs text-zinc-400">Loading…</p>
              ) : currentCA ? (
                <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-50 border border-zinc-200">
                  <UserCircle className="w-5 h-5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{currentCA.name}</p>
                    <p className="text-xs text-zinc-500">{currentCA.email}</p>
                  </div>
                  <p className="ml-auto text-xs text-zinc-400">Assigned</p>
                </div>
              ) : caSuccess ? (
                <p className="text-xs text-green-700">Client Admin added successfully.</p>
              ) : showAddCA ? (
                <div className="space-y-3 p-3 rounded-md bg-zinc-50 border border-zinc-200">
                  <p className="text-xs font-semibold text-zinc-600">Add Client Admin</p>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 block mb-1">Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={caName}
                      onChange={(e) => setCaName(e.target.value)}
                      className={`${inputCls} text-xs py-1.5 ${caNameErr ? 'border-rose-400' : ''}`}
                      placeholder="Full name"
                    />
                    {caNameErr && <p className="text-xs text-rose-600 mt-0.5">{caNameErr}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 block mb-1">Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      value={caEmail}
                      onChange={(e) => setCaEmail(e.target.value)}
                      className={`${inputCls} text-xs py-1.5 ${caEmailErr ? 'border-rose-400' : ''}`}
                      placeholder="admin@example.com"
                    />
                    {caEmailErr && <p className="text-xs text-rose-600 mt-0.5">{caEmailErr}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowAddCA(false); setCaName(''); setCaEmail(''); setCaNameErr(''); setCaEmailErr('') }}
                      className="text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCA}
                      disabled={savingCA}
                      className="text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingCA && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50 border border-zinc-200">
                  <p className="text-xs text-zinc-400">No Client Admin assigned</p>
                  <button
                    type="button"
                    onClick={() => setShowAddCA(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Client Admin
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button onClick={handleClose} className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}
