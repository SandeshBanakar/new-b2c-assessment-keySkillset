'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { fetchB2CUsers, type B2CUser, type DisplayStatus } from '@/lib/supabase/b2c-users'

const TIERS = ['All', 'free', 'basic', 'professional', 'premium'] as const
type TierFilter = typeof TIERS[number]

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  professional: 'Professional',
  premium: 'Premium',
}

const TIER_BADGE: Record<string, string> = {
  free:         'bg-zinc-100 text-zinc-600',
  basic:        'bg-blue-50 text-blue-700',
  professional: 'bg-violet-50 text-violet-700',
  premium:      'bg-amber-50 text-amber-700',
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const styles: Record<DisplayStatus, string> = {
    ACTIVE:    'bg-green-50 text-green-700',
    INACTIVE:  'bg-amber-50 text-amber-700',
    SUSPENDED: 'bg-rose-50 text-rose-700',
  }
  const labels: Record<DisplayStatus, string> = {
    ACTIVE: 'Active', INACTIVE: 'Inactive', SUSPENDED: 'Suspended',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export default function B2CUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<B2CUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<TierFilter>('All')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchB2CUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (tierFilter !== 'All' && u.subscriptionTier !== tierFilter) return false
      if (statusFilter !== 'all' && u.displayStatus !== statusFilter.toUpperCase()) return false
      if (search) {
        const q = search.toLowerCase()
        return (u.displayName ?? '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      }
      return true
    })
  }, [users, tierFilter, statusFilter, search])

  // Tier counts
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { All: users.length }
    for (const t of TIERS.slice(1)) counts[t] = users.filter((u) => u.subscriptionTier === t).length
    return counts
  }, [users])

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-base font-semibold text-zinc-900">B2C Users</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Direct learners — subscriptions, assessment performance, and course progress.</p>
      </div>

      {/* Tier tab bar */}
      <div className="flex gap-1 border-b border-zinc-200">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tierFilter === t
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t === 'All' ? 'All' : TIER_LABELS[t]}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md font-medium ${
              tierFilter === t ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {tierCounts[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 text-zinc-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading users…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/4">NAME</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">EMAIL</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TIER</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">LAST ACTIVE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">JOINED</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 max-w-0">
                      <span className="block truncate font-medium text-zinc-900" title={user.displayName ?? user.email}>
                        {user.displayName ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 max-w-0">
                      <span className="block truncate" title={user.email}>{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${TIER_BADGE[user.subscriptionTier] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.displayStatus} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {user.lastActiveDate
                        ? new Date(user.lastActiveDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 min-w-20 text-right">
                      <button
                        onClick={() => router.push(`/super-admin/b2c-users/${user.id}`)}
                        className="text-xs font-medium text-blue-700 border border-blue-200 rounded-md px-2.5 py-1 hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-zinc-400">{filtered.length} of {users.length} users</p>
    </div>
  )
}
