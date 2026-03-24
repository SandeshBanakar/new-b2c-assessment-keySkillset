'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import CreateTenantSlideOver from '@/components/super-admin/CreateTenantSlideOver'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      console.log('DEBUG: starting tenant fetch')

      const [tenantsRes, contractsRes, learnersRes, categoriesRes] = await Promise.all([
        supabase
          .from('tenants')
          .select('id, name, type, feature_toggle_mode, licensed_categories, is_active, created_at')
          .eq('type', 'B2B')
          .order('created_at', { ascending: false }),

        supabase
          .from('contracts')
          .select('tenant_id, seat_count'),

        supabase
          .from('learners')
          .select('id, tenant_id')
          .eq('status', 'ACTIVE'),

        supabase
          .from('exam_categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ])

      if (tenantsRes.error) throw tenantsRes.error
      if (contractsRes.error) throw contractsRes.error
      if (learnersRes.error) throw learnersRes.error
      if (categoriesRes.error) throw categoriesRes.error

      const combined = (tenantsRes.data ?? []).map((tenant: Tenant) => {
        const contract = contractsRes.data?.find(c => c.tenant_id === tenant.id)
        const learnerCount = learnersRes.data?.filter(l => l.tenant_id === tenant.id).length ?? 0
        const categoryNames = (tenant.licensed_categories ?? [])
          .map((catId: string) => categoriesRes.data?.find(c => c.id === catId)?.name)
          .filter(Boolean) as string[]

        return {
          ...tenant,
          seat_count: contract?.seat_count ?? 0,
          learner_count: learnerCount,
          category_names: categoryNames,
        }
      })

      setTenants(combined)
    } catch (err) {
      console.error('DEBUG: tenant fetch failed', err)
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
          <h1 className="text-xl font-semibold text-zinc-900">Client Admins</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage B2B client organisations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2"
        >
          + Create Client Admin
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
                            {near && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
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
        <CreateTenantSlideOver
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
