'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import 'flag-icons/css/flag-icons.min.css'

// ─── Country data ──────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { iso: 'IN', dialCode: '+91',  name: 'India' },
  { iso: 'US', dialCode: '+1',   name: 'USA' },
  { iso: 'CA', dialCode: '+1',   name: 'Canada' },
  { iso: 'GB', dialCode: '+44',  name: 'UK' },
  { iso: 'AE', dialCode: '+971', name: 'UAE' },
  { iso: 'SG', dialCode: '+65',  name: 'Singapore' },
  { iso: 'AU', dialCode: '+61',  name: 'Australia' },
  { iso: 'PH', dialCode: '+63',  name: 'Philippines' },
] as const

const PHONE_LENGTHS: Record<string, number> = {
  IN: 10, US: 10, CA: 10, GB: 10,
  AE: 9,  SG: 8,  AU: 9,  PH: 10,
}

// ─── Exported helpers ──────────────────────────────────────────────────────────

/** Derive the dial code string from a stored ISO code (e.g. "IN" → "+91"). */
export function getDialCode(iso: string): string {
  return COUNTRY_CODES.find(c => c.iso === iso)?.dialCode ?? ''
}

/** Return the expected subscriber digit count for a stored ISO code. */
export function getPhoneLength(iso: string): number {
  return PHONE_LENGTHS[iso] ?? 0
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface PhoneInputFieldProps {
  /** ISO 3166-1 alpha-2 code to pre-populate (e.g. "IN"). */
  defaultCode?: string
  /** Subscriber digits only, no country prefix (e.g. "9876543210"). */
  defaultNumber?: string
  /** Called whenever either the country code or number changes. */
  onChange: (isoCode: string, number: string) => void
  /** Error string passed in by the parent on submit-level validation failure. */
  submitError?: string
  /** Label text rendered above the field. Defaults to "Phone". */
  label?: string
}

export function PhoneInputField({
  defaultCode = '',
  defaultNumber = '',
  onChange,
  submitError,
  label = 'Phone',
}: PhoneInputFieldProps) {
  const [selectedIso, setSelectedIso] = useState(defaultCode)
  const [number, setNumber] = useState(defaultNumber)
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const [internalError, setInternalError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedCountry = COUNTRY_CODES.find(c => c.iso === selectedIso) ?? null
  const maxDigits = selectedIso ? PHONE_LENGTHS[selectedIso] : 15

  // ── Close on outside click or scroll ────────────────────────────────────────

  useEffect(() => {
    if (!open) return

    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleScroll() { setOpen(false) }

    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  // ── Dropdown position (E2 — viewport flip) ───────────────────────────────────

  function openDropdown() {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropUp = spaceBelow < 240

    setDropStyle({
      position: 'fixed',
      left: rect.left,
      width: 220,
      zIndex: 9999,
      ...(dropUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    })
    setOpen(true)
  }

  function handleButtonClick() {
    if (open) { setOpen(false) } else { openDropdown() }
  }

  // ── Country selection ────────────────────────────────────────────────────────

  function handleSelectCountry(iso: string) {
    const newMax = PHONE_LENGTHS[iso]
    const trimmed = number.slice(0, newMax)
    setSelectedIso(iso)
    setNumber(trimmed)
    setOpen(false)
    setInternalError(null)
    onChange(iso, trimmed)
  }

  // ── Number input handlers ────────────────────────────────────────────────────

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, maxDigits)
    setNumber(digitsOnly)
    onChange(selectedIso, digitsOnly)
    if (touched) validateField(selectedIso, digitsOnly)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    // 1A: reject paste only if it contains non-digit characters
    if (/\D/.test(text)) e.preventDefault()
    // Pure-digit paste flows through onChange which enforces maxDigits
  }

  function handleBlur() {
    setTouched(true)
    validateField(selectedIso, number)
  }

  // ── Validation (B3 hybrid — inline errors) ───────────────────────────────────

  function validateField(iso: string, num: string) {
    if (!iso && num) {
      setInternalError('Select a country code.')
      return
    }
    if (iso && num && num.length !== PHONE_LENGTHS[iso]) {
      setInternalError(`Must be exactly ${PHONE_LENGTHS[iso]} digits.`)
      return
    }
    setInternalError(null)
  }

  const displayError = submitError ?? internalError

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>

      <div className="flex items-stretch">
        {/* ── Country selector button ── */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleButtonClick}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 shrink-0 px-3 h-9 bg-white border border-zinc-200 rounded-l-md text-sm text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:z-10 transition-colors"
        >
          {selectedCountry ? (
            <>
              <span
                className={`fi fi-${selectedIso.toLowerCase()}`}
                style={{ width: '1.25rem', height: '0.9375rem', display: 'inline-block', borderRadius: '2px' }}
              />
              <span className="font-medium">{selectedCountry.dialCode}</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-400">Code</span>
            </>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {/* ── Number input ── */}
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          onBlur={handleBlur}
          onPaste={handlePaste}
          readOnly={!selectedIso}
          aria-disabled={!selectedIso}
          placeholder={selectedIso ? 'Phone number' : 'Select a country first'}
          className={[
            'flex-1 -ml-px h-9 border border-zinc-200 rounded-r-md px-3 text-sm',
            'placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:z-10',
            !selectedIso ? 'bg-zinc-50 cursor-not-allowed text-zinc-400' : 'bg-white text-zinc-900',
            displayError ? 'border-rose-400' : '',
          ].join(' ')}
        />

        {/* ── Fixed-position dropdown (avoids overflow-hidden clipping) ── */}
        {open && (
          <div
            role="listbox"
            style={dropStyle}
            className="bg-white border border-zinc-200 rounded-md shadow-lg overflow-y-auto max-h-56 py-1"
          >
            {COUNTRY_CODES.map(c => (
              <button
                key={c.iso}
                type="button"
                role="option"
                aria-selected={selectedIso === c.iso}
                onClick={() => handleSelectCountry(c.iso)}
                className={[
                  'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors',
                  selectedIso === c.iso
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-zinc-700 hover:bg-zinc-50',
                ].join(' ')}
              >
                <span
                  className={`fi fi-${c.iso.toLowerCase()}`}
                  style={{ width: '1.25rem', height: '0.9375rem', display: 'inline-block', borderRadius: '2px', flexShrink: 0 }}
                />
                <span>{c.name}</span>
                <span className="ml-auto text-zinc-400 font-medium tabular-nums">{c.dialCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Error / hint ── */}
      {displayError ? (
        <p className="text-xs text-rose-600 mt-1">{displayError}</p>
      ) : selectedIso ? (
        <p className="text-xs text-zinc-400 mt-1">{PHONE_LENGTHS[selectedIso]} digits required</p>
      ) : (
        <p className="text-xs text-zinc-400 mt-1">Select a country to enable this field</p>
      )}
    </div>
  )
}
