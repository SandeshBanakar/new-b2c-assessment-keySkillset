'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Users, UserCog, HardDrive, Mail, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contract {
  id: string
  seat_count: number
  content_creator_seats: number | null
  start_date: string
  end_date: string
  notes: string | null
  updated_at: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Contract Status Badge ────────────────────────────────────────────────────

function ContractStatusBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        Expired
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Expiring Soon
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      Active
    </span>
  )
}

// ─── Seat Usage Bar ───────────────────────────────────────────────────────────

function UsageBar({
  used,
  total,
  label,
  icon: Icon,
}: {
  used: number
  total: number
  label: string
  icon: React.ElementType
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const barColor =
    pct >= 100 ? 'bg-rose-500' : pct >= 90 ? 'bg-amber-500' : 'bg-violet-600'
  const isOver = used > total

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-700">{label}</p>
        </div>
        <p className={`text-sm font-semibold ${isOver ? 'text-rose-600' : 'text-zinc-700'}`}>
          {used} <span className="text-zinc-400 font-normal">of {total}</span>
        </p>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOver && (
        <p className="text-xs text-rose-600 mt-1.5">
          Over seat limit — contact your account manager to increase seats.
        </p>
      )}
      {!isOver && pct >= 90 && (
        <p className="text-xs text-amber-600 mt-1.5">
          Approaching seat limit ({Math.round(pct)}% used).
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [contract, setContract] = useState<Contract | null>(null)
  const [tenantMode, setTenantMode] = useState<string | null>(null)
  const [activeLearners, setActiveLearners] = useState(0)
  const [activeCCs, setActiveCCs] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }
    Promise.all([
      supabase
        .from('tenants')
        .select('feature_toggle_mode')
        .eq('id', tenantId)
        .single(),
      supabase
        .from('contracts')
        .select('id, seat_count, content_creator_seats, start_date, end_date, notes, updated_at')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      supabase
        .from('learners')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE'),
      supabase
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'CONTENT_CREATOR')
        .eq('is_active', true),
    ]).then(([tenantRes, contractRes, learnersRes, ccsRes]) => {
      setTenantMode(tenantRes.data?.feature_toggle_mode ?? null)
      setContract(contractRes.data as Contract | null)
      setActiveLearners(learnersRes.count ?? 0)
      setActiveCCs(ccsRes.count ?? 0)
      setLoading(false)
    })
  }, [tenantId])

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    )
  }

  const isFullCreator = tenantMode === 'FULL_CREATOR'
  const days = contract ? getDaysRemaining(contract.end_date) : null

  return (
    <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Billing &amp; Contract</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Your current contract details with keySkillset
        </p>
      </div>

      {/* No contract state */}
      {!contract ? (
        <div className="bg-white border border-zinc-200 rounded-md px-6 py-12 flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No contract on file</p>
          <p className="text-xs text-zinc-400 mt-1">
            Contact your keySkillset account manager to set up your contract.
          </p>
          <a
            href="mailto:contact@keyskillset.com"
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 border border-violet-200 rounded-md hover:bg-violet-50 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Contact Support
          </a>
        </div>
      ) : (
        <>
          {/* Section 1 — Contract Overview */}
          <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Contract Overview</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {contract.start_date ? formatDate(contract.start_date) : '—'} –{' '}
                  {contract.end_date ? formatDate(contract.end_date) : '—'}
                </p>
              </div>
              {days !== null && <ContractStatusBadge days={days} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <p className="text-xs text-zinc-500">Start Date</p>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  {contract.start_date ? formatDate(contract.start_date) : '—'}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <p className="text-xs text-zinc-500">End Date</p>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  {contract.end_date ? formatDate(contract.end_date) : '—'}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <p className="text-xs text-zinc-500">
                    {days !== null && days >= 0 ? 'Days Remaining' : 'Status'}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    days !== null && days < 0
                      ? 'text-rose-600'
                      : days !== null && days <= 30
                      ? 'text-amber-600'
                      : 'text-zinc-900'
                  }`}
                >
                  {days !== null && days >= 0
                    ? `${days} day${days !== 1 ? 's' : ''}`
                    : 'Expired'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 — Seat Usage */}
          <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
            <p className="text-sm font-semibold text-zinc-900 mb-5">Seat Usage</p>
            <div className="space-y-5">
              <UsageBar
                used={activeLearners}
                total={contract.seat_count}
                label="Learner Seats"
                icon={Users}
              />
              {isFullCreator && (contract.content_creator_seats ?? 0) > 0 && (
                <UsageBar
                  used={activeCCs}
                  total={contract.content_creator_seats!}
                  label="Content Creator Seats"
                  icon={UserCog}
                />
              )}
            </div>
          </div>

          {/* Section 3 — Storage & Hosting (FULL_CREATOR only) */}
          {isFullCreator && (
            <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-zinc-900">Storage &amp; Hosting</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Billed separately based on monthly usage · Daily snapshot
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                    <p className="text-xs text-zinc-500">Total Storage Used</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">12.4 GB</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                    <p className="text-xs text-zinc-500">Est. Hosting Cost</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">$18.60 / mo</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                    <p className="text-xs text-zinc-500">Last Snapshot</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">Mar 18, 2026</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4 — Notes (conditional) */}
          {contract.notes && (
            <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
              <p className="text-sm font-semibold text-zinc-900 mb-2">Contract Notes</p>
              <p className="text-sm text-zinc-600 leading-relaxed">{contract.notes}</p>
            </div>
          )}

          {/* Section 5 — Contact CTA */}
          <div className="bg-violet-50 border border-violet-200 rounded-md px-6 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-900">Need to make changes?</p>
                <p className="text-xs text-violet-700 mt-0.5">
                  Contact your keySkillset account manager to modify or renew your contract.
                </p>
              </div>
              <a
                href="mailto:contact@keyskillset.com"
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-700 rounded-md hover:bg-violet-800 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Support
              </a>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-violet-100 border border-violet-200 px-3 py-2.5">
              <Mail className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-800">
                We typically respond to all contract enquiries within{' '}
                <span className="font-semibold">2 business days</span>. You will receive a
                confirmation at your registered email once your request is received.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
