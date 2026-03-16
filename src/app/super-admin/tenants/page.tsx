'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  type: string
  feature_toggle_mode: 'RUN_ONLY' | 'FULL_CREATOR'
  licensed_categories: string[]
  is_active: boolean
  created_at: string
}

interface TenantRow extends Tenant {
  seat_count: number | null
  learner_count: number
  category_names: string[]
}

interface ExamCategory {
  id: string
  name: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Create Tenant Modal ──────────────────────────────────────────────────────

function CreateTenantModal({
  examCategories,
  onClose,
  onCreated,
}: {
  examCategories: ExamCategory[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<'RUN_ONLY' | 'FULL_CREATOR'>('RUN_ONLY')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const toggleCat = (id: string) =>
    setSelectedCats(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]))

  const save = async () => {
    if (!name.trim()) { setErr('Tenant name is required.'); return }
    if (!email.trim()) { setErr('Client admin email is required.'); return }
    setErr('')
    setSaving(true)
    try {
      const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .insert({
          name: name.trim(),
          type: 'B2B',
          feature_toggle_mode: mode,
          licensed_categories: selectedCats,
          is_active: true,
        })
        .select('id')
        .single()
      if (tErr) throw tErr

      await supabase.from('admin_users').insert({
        tenant_id: tenant.id,
        email: email.trim(),
        name: email.split('@')[0],
        role: 'CLIENT_ADMIN',
        is_active: true,
      })
      await supabase.from('audit_logs').insert({
        tenant_id: tenant.id,
        actor_name: 'Super Admin',
        action: 'TENANT_CREATED',
        entity_type: 'Tenant',
        entity_id: tenant.id,
        before_state: null,
        after_state: {
          name: name.trim(),
          type: 'B2B',
          feature_toggle_mode: mode,
          licensed_categories: selectedCats,
        },
      })
      onCreated()
    } catch {
      setErr('Failed to create tenant. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-xl flex flex-col z-50">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <p className="text-base font-semibold text-zinc-900">Create Tenant</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Tenant Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme Corp"
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">
              Client Admin Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@acme.com"
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-full focus:ring-1 focus:ring-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-2">Feature Mode</label>
            <div className="flex flex-col gap-2">
              {(['RUN_ONLY', 'FULL_CREATOR'] as const).map(m => (
                <div
                  key={m}
                  onClick={() => setMode(m)}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    mode === m ? 'border-blue-700 bg-blue-50' : 'border-zinc-200'
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {m === 'RUN_ONLY' ? 'Run Only' : 'Full Creator'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {m === 'RUN_ONLY'
                      ? 'Tenant can run existing assessments only.'
                      : 'Tenant can create and run their own assessments.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-2">Licensed Categories</label>
            <div className="space-y-2">
              {examCategories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                    className="rounded border-zinc-300"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
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
            Create Tenant
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [modeFilter, setModeFilter] = useState<'all' | 'RUN_ONLY' | 'FULL_CREATOR'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const [tRes, cRes, lRes, catRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('type', 'B2B').order('created_at', { ascending: false }),
        supabase.from('contracts').select('tenant_id, seat_count'),
        supabase.from('learners').select('tenant_id').eq('status', 'ACTIVE'),
        supabase.from('exam_categories').select('id, name'),
      ])
      if (tRes.error) throw tRes.error

      const cats: ExamCategory[] = catRes.data || []
      setExamCategories(cats)
      const catMap = new Map<string, string>(cats.map(c => [c.id, c.name]))

      const seatMap = new Map<string, number>()
      ;(cRes.data || []).forEach((c: { tenant_id: string; seat_count: number }) =>
        seatMap.set(c.tenant_id, c.seat_count)
      )

      const learnerMap = new Map<string, number>()
      ;(lRes.data || []).forEach((l: { tenant_id: string }) =>
        learnerMap.set(l.tenant_id, (learnerMap.get(l.tenant_id) || 0) + 1)
      )

      setTenants(
        (tRes.data || []).map((t: Tenant) => ({
          ...t,
          seat_count: seatMap.get(t.id) ?? null,
          learner_count: learnerMap.get(t.id) || 0,
          category_names: (t.licensed_categories || [])
            .map((id: string) => catMap.get(id))
            .filter((n): n is string => Boolean(n)),
        }))
      )
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(
    () =>
      tenants.filter(t => {
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
        if (statusFilter === 'active' && !t.is_active) return false
        if (statusFilter === 'inactive' && t.is_active) return false
        if (modeFilter !== 'all' && t.feature_toggle_mode !== modeFilter) return false
        return true
      }),
    [tenants, search, statusFilter, modeFilter]
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tenants</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage B2B client organisations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2"
        >
          + Create Tenant
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-md border border-zinc-200 p-4 mb-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-64 text-sm border border-zinc-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-700"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={modeFilter}
          onChange={e => setModeFilter(e.target.value as typeof modeFilter)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5"
        >
          <option value="all">All Modes</option>
          <option value="RUN_ONLY">Run Only</option>
          <option value="FULL_CREATOR">Full Creator</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 animate-pulse bg-zinc-100 rounded-md" />
          ))}
        </div>
      ) : fetchError ? (
        <p className="text-sm text-zinc-400">Failed to load tenants.</p>
      ) : (
        <div className="bg-white rounded-md border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                {['Name', 'Mode', 'Licensed Categories', 'Seats', 'Learners', 'Status', 'Actions'].map(col => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">
                    No tenants found.
                  </td>
                </tr>
              ) : (
                filtered.map(t => {
                  const ratio = t.seat_count ? t.learner_count / t.seat_count : 0
                  const near = ratio >= 0.9
                  return (
                    <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-900">{t.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Added {formatDate(t.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                            t.feature_toggle_mode === 'FULL_CREATOR'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {t.feature_toggle_mode === 'FULL_CREATOR' ? 'Full Creator' : 'Run Only'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.category_names.slice(0, 3).map(n => (
                            <span key={n} className="text-xs bg-zinc-100 text-zinc-600 rounded-md px-2 py-0.5">
                              {n}
                            </span>
                          ))}
                          {t.category_names.length > 3 && (
                            <span className="text-xs bg-zinc-100 text-zinc-600 rounded-md px-2 py-0.5">
                              +{t.category_names.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {t.seat_count != null ? (
                          <span
                            className={`text-sm flex items-center gap-1 ${near ? 'text-amber-600' : 'text-zinc-900'}`}
                          >
                            {near && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                            {t.learner_count} / {t.seat_count}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-900">{t.learner_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                            t.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/super-admin/tenants/${t.id}`}
                          className="text-sm text-blue-700 hover:text-blue-800 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateTenantModal
          examCategories={examCategories}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}
