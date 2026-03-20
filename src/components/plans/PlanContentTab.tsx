'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, FileX, BookX, Building2, AlertTriangle } from 'lucide-react'
import {
  fetchPlanAssignedAssessments,
  fetchPlanAssignedCourses,
  fetchTenantCountForPlan,
} from '@/lib/supabase/plans'
import type { PlanDetail, PlanAssignedAssessment, PlanAssignedCourse } from '@/lib/supabase/plans'
import { AddContentSlideOver } from './AddContentSlideOver'
import { RemoveFromPlanModal } from './RemoveFromPlanModal'
import { ContentPlanUsageModal } from './ContentPlanUsageModal'

type Props = { plan: PlanDetail }

export function PlanContentTab({ plan }: Props) {
  const [assessments, setAssessments] = useState<PlanAssignedAssessment[]>([])
  const [courses, setCourses] = useState<PlanAssignedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantCount, setTenantCount] = useState(0)

  const [addSlideOver, setAddSlideOver] = useState<'ASSESSMENT' | 'COURSE' | null>(null)
  const [removeItem, setRemoveItem] = useState<{
    pcmId: string
    title: string
    contentType: 'ASSESSMENT' | 'COURSE'
  } | null>(null)
  const [usageModal, setUsageModal] = useState<{ contentId: string; contentTitle: string } | null>(null)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      const [a, c, tc] = await Promise.all([
        fetchPlanAssignedAssessments(plan.id),
        fetchPlanAssignedCourses(plan.id),
        fetchTenantCountForPlan(plan.id),
      ])
      setAssessments(a)
      setCourses(c)
      setTenantCount(tc)
    } finally {
      setLoading(false)
    }
  }, [plan.id])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((s) => (
          <div key={s} className="space-y-2">
            <div className="h-4 w-28 rounded bg-zinc-100 animate-pulse" />
            {[0, 1, 2].map((r) => (
              <div key={r} className="h-10 rounded bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  const planAudience = (plan as PlanDetail & { plan_audience?: 'B2C' | 'B2B' }).plan_audience ?? 'B2C'

  return (
    <div className="space-y-8">

      {/* Multi-tenant callout — shown for B2B plans assigned to 1+ tenants */}
      {planAudience === 'B2B' && tenantCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
          <p className="text-sm text-blue-700">
            This plan is assigned to <span className="font-semibold">{tenantCount} tenant{tenantCount !== 1 ? 's' : ''}</span>.
            Content changes here apply to all assigned tenants immediately.
          </p>
        </div>
      )}

      {/* Plan audience indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Plan audience:</span>
        <span
          className={`text-xs font-medium rounded-md px-2 py-0.5 ${
            planAudience === 'B2B'
              ? 'bg-violet-50 text-violet-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {planAudience}
        </span>
        <span className="text-xs text-zinc-400">
          · Only {planAudience === 'B2C' ? 'B2C_ONLY and BOTH' : 'B2B_ONLY and BOTH'} content can be added
        </span>
      </div>

      {/* Assessments section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Assessments ({assessments.length})
          </p>
          <button
            onClick={() => setAddSlideOver('ASSESSMENT')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 transition-colors"
          >
            <Plus size={13} />
            Add Assessment
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 border border-zinc-200 rounded-md">
            <FileX size={22} className="text-zinc-300" />
            <p className="text-sm text-zinc-400">No assessments added to this plan yet.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/2">
                    TITLE
                  </th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                    CATEGORY
                  </th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                    TYPE
                  </th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                    STATUS
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {assessments.map((item, idx) => (
                  <tr
                    key={item.pcmId}
                    className={idx < assessments.length - 1 ? 'border-b border-zinc-100' : ''}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      <span>{item.title}</span>
                      {item.planCount > 1 && (
                        <button
                          onClick={() => setUsageModal({ contentId: item.contentId, contentTitle: item.title })}
                          className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          In {item.planCount} plans
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setRemoveItem({
                            pcmId: item.pcmId,
                            title: item.title,
                            contentType: 'ASSESSMENT',
                          })
                        }
                        className="text-zinc-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Courses section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Courses ({courses.length})
          </p>
          <button
            onClick={() => setAddSlideOver('COURSE')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 transition-colors"
          >
            <Plus size={13} />
            Add Course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 border border-zinc-200 rounded-md">
            <BookX size={22} className="text-zinc-300" />
            <p className="text-sm text-zinc-400">No courses added to this plan yet.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/2">
                    TITLE
                  </th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                    TYPE
                  </th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                    STATUS
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {courses.map((item, idx) => (
                  <tr
                    key={item.pcmId}
                    className={idx < courses.length - 1 ? 'border-b border-zinc-100' : ''}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{item.title}</td>
                    <td className="px-4 py-3 text-zinc-600">{item.courseType}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setRemoveItem({
                            pcmId: item.pcmId,
                            title: item.title,
                            contentType: 'COURSE',
                          })
                        }
                        className="text-zinc-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add content slide-over */}
      {addSlideOver && (
        <AddContentSlideOver
          planId={plan.id}
          contentType={addSlideOver}
          planAudience={planAudience}
          onClose={() => setAddSlideOver(null)}
          onAdded={() => {
            fetchContent()
            setAddSlideOver(null)
          }}
        />
      )}

      {/* Remove confirm modal */}
      {removeItem && (
        <RemoveFromPlanModal
          item={removeItem}
          planId={plan.id}
          onClose={() => setRemoveItem(null)}
          onRemoved={() => {
            fetchContent()
            setRemoveItem(null)
          }}
        />
      )}

      {/* Plan usage modal — platform-wide (no tenantId) */}
      {usageModal && (
        <ContentPlanUsageModal
          contentId={usageModal.contentId}
          contentTitle={usageModal.contentTitle}
          onClose={() => setUsageModal(null)}
          onRemoved={() => { setUsageModal(null); fetchContent() }}
        />
      )}
    </div>
  )
}
