'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Search } from 'lucide-react'
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

// ─── Static data ──────────────────────────────────────────────────────────────

const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY']

// IANA timezone list from browser Intl API (Node 16+, all modern browsers)
const TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    // Fallback for environments that don't support supportedValuesOf
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

// ─── SearchableSelect component ───────────────────────────────────────────────

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

  const handleFocus = () => {
    setSearch('')
    setOpen(true)
  }

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
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          value={open ? search : value}
          onFocus={handleFocus}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={open ? `Search…` : (placeholder ?? '')}
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
                  value === option
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-zinc-700 hover:bg-zinc-50'
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
    }
  }, [isOpen, tenant])

  if (!isOpen) return null

  const set = (key: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setDirty(true)
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
      setNameErr('Tenant name is required.')
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

  const inputCls =
    'border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full'
  const sectionHeaderCls =
    'text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3 mt-6'
  const labelCls = 'text-sm font-medium text-zinc-700 block mb-1'

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-120 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
          <p className="text-base font-semibold text-zinc-900">Edit Details</p>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unsaved changes guard */}
        {confirmDiscard && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800 mb-2">You have unsaved changes. Discard?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDiscard(false)}
                className="text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md px-3 py-1 hover:bg-zinc-50"
              >
                Keep Editing
              </button>
              <button
                onClick={handleDiscard}
                className="text-sm font-medium text-rose-600 border border-rose-200 rounded-md px-3 py-1 hover:bg-rose-50"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Section 1 — Platform Setup */}
          <p className={sectionHeaderCls}>Platform Setup</p>

          <div className="mb-4">
            <label className={labelCls}>
              Tenant Name <span className="text-rose-500">*</span>
            </label>
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
            <select
              value={form.feature_toggle_mode}
              onChange={(e) => set('feature_toggle_mode', e.target.value)}
              className={inputCls}
            >
              <option value="RUN_ONLY">Run Only</option>
              <option value="FULL_CREATOR">Full Creator</option>
            </select>
          </div>

          {/* Section 2 — Contact */}
          <p className={sectionHeaderCls}>Contact</p>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Contact Phone</label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => set('contact_phone', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Section 3 — Address */}
          <p className={sectionHeaderCls}>Address</p>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Address Line 1</label>
              <input
                type="text"
                value={form.address_line1}
                onChange={(e) => set('address_line1', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Address Line 2</label>
              <input
                type="text"
                value={form.address_line2}
                onChange={(e) => set('address_line2', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Zip Code</label>
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={(e) => set('zip_code', e.target.value)}
                  className={inputCls}
                />
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
          </div>

          {/* Section 4 — Locale */}
          <p className={sectionHeaderCls}>Locale</p>

          <div className="space-y-4">
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
              <select
                value={form.date_format}
                onChange={(e) => set('date_format', e.target.value)}
                className={inputCls}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={handleClose}
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
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}
