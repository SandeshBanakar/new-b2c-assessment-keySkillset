'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, BookOpen, LayoutGrid, AlertTriangle, Loader2 } from 'lucide-react'
import {
  fetchTenantAssignedPlansWithContent,
  unassignPlanFromTenant,
  type TenantAssignedPlan,
} from '@/lib/supabase/plans'
import { supabase } from '@/lib/supabase/client'
import { AssignPlanSlideOver } from './AssignPlanSlideOver'
import { formatCourseType } from '@/lib/utils'
import { ContentPlanUsageModal } from '@/components/plans/ContentPlanUsageModal'

interface Props {
  tenantId: string
  // kept for future compat — unused in current surface
  onGoToPlans?: () => void
}

// ─── Unassign confirmation modal ──────────────────────────────────────────────

function UnassignModal({
  planName,
  onCancel,
  onConfirm,
  loading,
}: {
  planName: string
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 mb-1">Unassign Plan</p>
              <p className="text-sm text-zinc-500">
                Remove <span className="font-medium text-zinc-900">{planName}</span> from this tenant? Learners will lose access to all content in this plan immediately.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Unassign
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Single plan accordion row ────────────────────────────────────────────────

function PlanAccordionRow({
  plan,
  tenantId,
  onUnassigned,
  onContentChanged,
}: {
  plan: TenantAssignedPlan
  tenantId: string
  onUnassigned: () => void
  onContentChanged: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmUnassign, setConfirmUnassign] = useState(false)
  const [unassigning, setUnassigning] = useState(false)
  const [usageModal, setUsageModal] = useState<{ contentId: string; contentTitle: string } | null>(null)

  const totalItems = plan.assessments.length + plan.courses.length

  const handleUnassign = async () => {
    setUnassigning(true)
    try {
      await unassignPlanFromTenant(tenantId, plan.planId)
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_name: 'Super Admin',
        action: 'PLAN_UNASSIGNED_FROM_TENANT',
        entity_type: 'Plan',
        entity_id: plan.planId,
        before_state: { plan_name: plan.planName },
        after_state: null,
      })
      onUnassigned()
    } finally {
      setUnassigning(false)
      setConfirmUnassign(false)
    }
  }

  return (
    <>
      <div className="border border-zinc-200 rounded-md bg-white overflow-hidden">
        {/* Accordion header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
          )}

          <span className="text-sm font-medium text-zinc-900 flex-1">{plan.planName}</span>

          {/* Plan audience badge */}
          <span
            className={`text-xs font-medium rounded-md px-2 py-0.5 ${
              plan.planAudience === 'B2B'
                ? 'bg-violet-50 text-violet-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {plan.planAudience}
          </span>

          <span className="text-xs text-zinc-400">{totalItems} items</span>

          {/* Unassign button — stop propagation so it doesn't toggle accordion */}
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmUnassign(true) }}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-md px-2.5 py-1 ml-2 shrink-0"
          >
            Unassign
          </button>
        </div>

        {/* Accordion body */}
        {expanded && (
          <div className="border-t border-zinc-100 px-4 py-4 space-y-5">
            {/* Assessments sub-section */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Assessments ({plan.assessments.length})
              </p>

              {plan.assessments.length === 0 ? (
                <p className="text-sm text-zinc-400">No assessments in this plan.</p>
              ) : (
                <div className="border border-zinc-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/2">TITLE</th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">CATEGORY</th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TYPE</th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.assessments.map((item, idx) => (
                        <tr
                          key={item.pcmId}
                          className={idx < plan.assessments.length - 1 ? 'border-b border-zinc-100' : ''}
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            <span>{item.title}</span>
                            {item.inPlanCount > 1 && (
                              <button
                                onClick={() => setUsageModal({ contentId: item.contentId, contentTitle: item.title })}
                                className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition-colors"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                In {item.inPlanCount} plans
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{item.examType}</td>
                          <td className="px-4 py-3 text-zinc-600">{item.assessmentType}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Courses sub-section */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Courses ({plan.courses.length})
              </p>

              {plan.courses.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <BookOpen className="w-4 h-4 text-zinc-300 shrink-0" />
                  <p className="text-sm text-zinc-400">No courses in this plan.</p>
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/2">TITLE</th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TYPE</th>
                        <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.courses.map((course, idx) => (
                        <tr
                          key={course.pcmId}
                          className={idx < plan.courses.length - 1 ? 'border-b border-zinc-100' : ''}
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900">{course.title}</td>
                          <td className="px-4 py-3 text-zinc-600">{formatCourseType(course.courseType) ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                              {course.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmUnassign && (
        <UnassignModal
          planName={plan.planName}
          onCancel={() => setConfirmUnassign(false)}
          onConfirm={handleUnassign}
          loading={unassigning}
        />
      )}

      {usageModal && (
        <ContentPlanUsageModal
          contentId={usageModal.contentId}
          contentTitle={usageModal.contentTitle}
          tenantId={tenantId}
          onClose={() => setUsageModal(null)}
          onRemoved={() => { setUsageModal(null); onContentChanged() }}
        />
      )}
    </>
  )
}

// ─── Main PlansTab component ──────────────────────────────────────────────────

export default function PlansTab({ tenantId }: Props) {
  const [plans, setPlans] = useState<TenantAssignedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [filterPlanId, setFilterPlanId] = useState('')

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchTenantAssignedPlansWithContent(tenantId)
      setPlans(data)
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load plans.')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const displayed = filterPlanId ? plans.filter((p) => p.planId === filterPlanId) : plans

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse bg-zinc-100 rounded-md" />
        ))}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
        <p className="text-sm text-rose-600">{loadError}</p>
        <button
          onClick={fetchPlans}
          className="ml-auto text-xs font-medium text-rose-600 underline shrink-0"
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LayoutGrid className="w-10 h-10 text-zinc-300 mb-4" />
          <p className="text-sm font-semibold text-zinc-900 mb-1">No plans assigned to this tenant yet.</p>
          <p className="text-sm text-zinc-500 max-w-sm mb-5">
            Assign a plan to make content available to this tenant&apos;s learners.
          </p>
          <button
            onClick={() => setShowAssign(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2"
          >
            Assign Plan
          </button>
        </div>

        {showAssign && (
          <AssignPlanSlideOver
            tenantId={tenantId}
            onClose={() => setShowAssign(false)}
            onAssigned={() => { setShowAssign(false); fetchPlans() }}
          />
        )}
      </>
    )
  }

  return (
    <>
      {/* Controls row */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowAssign(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-3 py-1.5"
        >
          + Assign Plan
        </button>

        {plans.length >= 2 && (
          <select
            value={filterPlanId}
            onChange={(e) => setFilterPlanId(e.target.value)}
            className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-700"
          >
            <option value="">All Plans ({plans.length})</option>
            {plans.map((p) => (
              <option key={p.planId} value={p.planId}>{p.planName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Plan accordion list */}
      <div className="space-y-3">
        {displayed.map((plan) => (
          <PlanAccordionRow
            key={plan.planId}
            plan={plan}
            tenantId={tenantId}
            onUnassigned={fetchPlans}
            onContentChanged={fetchPlans}
          />
        ))}
      </div>

      {showAssign && (
        <AssignPlanSlideOver
          tenantId={tenantId}
          onClose={() => setShowAssign(false)}
          onAssigned={() => { setShowAssign(false); fetchPlans() }}
        />
      )}
    </>
  )
}
