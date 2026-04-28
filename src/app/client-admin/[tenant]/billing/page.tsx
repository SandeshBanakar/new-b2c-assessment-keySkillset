'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Users, UserCog, HardDrive, Mail, FileText, CreditCard, Info } from 'lucide-react'
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
  payment_method_brand: string | null
  payment_method_last4: string | null
  payment_billing_email: string | null
  contract_amount: number | null
  contract_currency: string | null
  pay_now: boolean | null
  trial_period_days: number | null
  coupon_code: string | null
}

interface PaymentHistoryRow {
  id: string
  invoice_id: string | null
  amount_inr: number
  status: string
  payment_date: string
  description: string | null
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
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([])
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
        .select('id, seat_count, content_creator_seats, start_date, end_date, notes, updated_at, payment_method_brand, payment_method_last4, payment_billing_email, contract_amount, contract_currency, pay_now, trial_period_days, coupon_code')
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
      const c = contractRes.data as Contract | null
      setContract(c)
      setActiveLearners(learnersRes.count ?? 0)
      setActiveCCs(ccsRes.count ?? 0)

      if (c?.id) {
        supabase
          .from('contract_payment_history')
          .select('id, invoice_id, amount_inr, status, payment_date, description')
          .eq('contract_id', c.id)
          .order('payment_date', { ascending: false })
          .then(({ data }) => setPaymentHistory(data ?? []))
      }

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

            {/* Billing Config — contract value, billing mode, coupon */}
            {(contract.contract_amount != null || contract.pay_now != null || contract.coupon_code) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contract.contract_amount != null && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <p className="text-xs text-zinc-500">Contract Value</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {contract.contract_currency === 'USD' ? '$' : '₹'}
                      {contract.contract_amount.toLocaleString('en-IN')}
                      {' '}<span className="text-xs font-normal text-zinc-400">{contract.contract_currency ?? 'INR'}</span>
                    </p>
                  </div>
                )}
                <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                    <p className="text-xs text-zinc-500">Billing Mode</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {contract.pay_now
                      ? 'Immediate'
                      : contract.trial_period_days && contract.trial_period_days > 0
                        ? `${contract.trial_period_days}-day trial`
                        : 'Deferred'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {contract.pay_now
                      ? 'Billing started immediately upon activation'
                      : contract.trial_period_days && contract.trial_period_days > 0
                        ? `Billing begins after a ${contract.trial_period_days}-day trial period`
                        : 'Billing deferred — contact your account manager'}
                  </p>
                </div>
                {contract.coupon_code && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      <p className="text-xs text-zinc-500">Discount Applied</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 font-mono">{contract.coupon_code}</p>
                  </div>
                )}
              </div>
            )}
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

          {/* Section 4 — Payment Details */}
          {(contract.payment_method_brand || contract.payment_billing_email) && (
            <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-900">Payment Details</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                  <p className="text-xs text-zinc-500 mb-1">Card on File</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {contract.payment_method_brand && contract.payment_method_last4
                      ? `${contract.payment_method_brand.charAt(0).toUpperCase()}${contract.payment_method_brand.slice(1)} •••• ${contract.payment_method_last4}`
                      : '—'
                    }
                  </p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
                  <p className="text-xs text-zinc-500 mb-1">Billing Email</p>
                  <p className="text-sm font-semibold text-zinc-900 break-all">
                    {contract.payment_billing_email ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <p className="text-xs text-zinc-400">Payment details are managed via Stripe and updated by your keySkillset account manager.</p>
              </div>
            </div>
          )}

          {/* Section 5 — Payment History */}
          {paymentHistory.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
              <p className="text-sm font-semibold text-zinc-900 mb-4">Payment History</p>
              <div className="border border-zinc-200 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">DATE</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 hidden sm:table-cell">DESCRIPTION</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">AMOUNT</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paymentHistory.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-xs text-zinc-600">
                          {new Date(row.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600 hidden sm:table-cell">{row.description ?? '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                          ₹{row.amount_inr.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            row.status === 'paid'    ? 'bg-green-50 text-green-700' :
                            row.status === 'failed'  ? 'bg-rose-50 text-rose-700' :
                            row.status === 'refunded'? 'bg-amber-50 text-amber-700' :
                            'bg-zinc-100 text-zinc-500'
                          }`}>
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 6 — Notes (conditional) */}
          {contract.notes && (
            <div className="bg-white border border-zinc-200 rounded-md px-6 py-5">
              <p className="text-sm font-semibold text-zinc-900 mb-2">Contract Notes</p>
              <p className="text-sm text-zinc-600 leading-relaxed">{contract.notes}</p>
            </div>
          )}

          {/* Section 7 — Contact CTA */}
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
