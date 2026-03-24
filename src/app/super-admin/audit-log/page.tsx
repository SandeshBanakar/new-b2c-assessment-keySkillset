'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Search, ChevronDown, ClipboardList, X, Loader2 } from 'lucide-react'
import {
  fetchAuditLogs,
  ACTION_LABELS,
  ACTION_CATEGORIES,
  type AuditLogEntry,
  type ActionCategory,
} from '@/lib/supabase/audit-log'

const PAGE_SIZE = 25

// ─── Category badge ─────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<ActionCategory, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-rose-50 text-rose-700',
  assign: 'bg-violet-50 text-violet-700',
}

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  assign: 'Assign',
}

// ─── Action filter dropdown ──────────────────────────────────────────────────

const ALL_ACTIONS = Object.keys(ACTION_LABELS).sort()

function ActionFilterDropdown({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function toggle(action: string) {
    onChange(
      selected.includes(action)
        ? selected.filter((a) => a !== action)
        : [...selected, action]
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm border border-zinc-200 rounded-md px-3 py-2 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors whitespace-nowrap"
      >
        Action Type
        {selected.length > 0 && (
          <span className="bg-blue-700 text-white text-xs font-medium rounded-md px-1.5 py-0.5 leading-none">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-zinc-200 rounded-md shadow-lg z-20 py-1 max-h-72 overflow-y-auto">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-left text-xs text-zinc-500 hover:text-zinc-700 px-3 py-1.5 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
          {ALL_ACTIONS.map((action) => (
            <label
              key={action}
              className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(action)}
                onChange={() => toggle(action)}
                className="w-3.5 h-3.5 accent-blue-700"
              />
              <span className="text-sm text-zinc-700">{ACTION_LABELS[action]}</span>
              <span
                className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-md ${CATEGORY_BADGE[ACTION_CATEGORIES[action] ?? 'update']}`}
              >
                {CATEGORY_LABELS[ACTION_CATEGORIES[action] ?? 'update']}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between text-sm text-zinc-500">
      <span>
        {start}–{end} of {total} entries
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-zinc-700 font-medium">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [entries, setEntries]         = useState<AuditLogEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [actionFilter, setActionFilter] = useState<string[]>([])
  const [page, setPage]               = useState(1)

  useEffect(() => {
    fetchAuditLogs()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  // Client-side filter + search
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter.length > 0 && !actionFilter.includes(e.action)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          e.actorName.toLowerCase().includes(q) ||
          e.entityName.toLowerCase().includes(q) ||
          e.actionLabel.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [entries, actionFilter, search])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const hasFilters = actionFilter.length > 0 || search.trim().length > 0

  function clearFilters() {
    setSearch('')
    setActionFilter([])
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-zinc-900">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Immutable record of all Super Admin platform actions.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search actor, entity or action…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>
        <ActionFilterDropdown selected={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1) }} />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading audit log…
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ClipboardList className="w-8 h-8 text-zinc-300" />
            {entries.length === 0 ? (
              <>
                <p className="text-sm font-medium text-zinc-900">No audit log entries yet</p>
                <p className="text-sm text-zinc-400">Events will appear here as Super Admin actions are taken.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-900">No results match your filters</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-zinc-500 underline hover:text-zinc-700"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 whitespace-nowrap">TIMESTAMP</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 whitespace-nowrap w-24">CATEGORY</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">ACTION</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 whitespace-nowrap">ACTOR</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 whitespace-nowrap">ENTITY TYPE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">ENTITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                  {/* Timestamp */}
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    {' '}
                    <span className="text-zinc-400">
                      {new Date(e.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>

                  {/* Category badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${CATEGORY_BADGE[e.actionCategory]}`}
                    >
                      {CATEGORY_LABELS[e.actionCategory]}
                    </span>
                  </td>

                  {/* Action label */}
                  <td className="px-4 py-3 text-zinc-900 font-medium whitespace-nowrap">
                    {e.actionLabel}
                  </td>

                  {/* Actor */}
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                    {e.actorName}
                  </td>

                  {/* Entity type */}
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {e.entityTypeLabel}
                  </td>

                  {/* Resolved entity name */}
                  <td className="px-4 py-3 text-zinc-700 max-w-xs">
                    <span className="block truncate" title={e.entityName}>
                      {e.entityName}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <Pagination
          page={page}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      )}
    </div>
  )
}
