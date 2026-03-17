'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PlusCircle, Trash2, FileX, BookX, AlertCircle } from 'lucide-react'
import AssignContentSlideOver from './AssignContentSlideOver'
import RemoveContentModal from './RemoveContentModal'

interface AssignedAssessment {
  ccmId: string
  contentId: string
  title: string
  examType: string
  assessmentType: string
  assignedAt: string
}

interface AssignedCourse {
  ccmId: string
  contentId: string
  title: string
  courseType: string
  assignedAt: string
}

interface Props {
  tenantId: string
}

export default function ContentTab({ tenantId }: Props) {
  const [contractId, setContractId] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<AssignedAssessment[]>([])
  const [courses, setCourses] = useState<AssignedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [removeItem, setRemoveItem] = useState<{
    ccmId: string
    title: string
    contentType: 'ASSESSMENT' | 'COURSE'
  } | null>(null)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(false)

    // Step 1: get contract for this tenant
    const { data: contracts, error: contractError } = await supabase
      .from('contracts')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1)

    if (contractError || !contracts || contracts.length === 0) {
      setContractId(null)
      setAssessments([])
      setCourses([])
      setLoading(false)
      return
    }

    const cId = contracts[0].id
    setContractId(cId)

    // Step 2a: get ASSESSMENT rows from contract_content_map
    const { data: ccmAssessments, error: ccmAError } = await supabase
      .from('contract_content_map')
      .select('id, content_id, content_type, created_at')
      .eq('contract_id', cId)
      .eq('content_type', 'ASSESSMENT')

    // Step 2b: get COURSE rows from contract_content_map
    const { data: ccmCourses, error: ccmCError } = await supabase
      .from('contract_content_map')
      .select('id, content_id, content_type, created_at')
      .eq('contract_id', cId)
      .eq('content_type', 'COURSE')

    if (ccmAError || ccmCError) {
      setError(true)
      setLoading(false)
      return
    }

    // Step 3a: join content_items for assessment rows in JS
    const assessmentIds = (ccmAssessments || []).map(
      (r: { content_id: string }) => r.content_id
    )
    let builtAssessments: AssignedAssessment[] = []

    if (assessmentIds.length > 0) {
      const { data: contentItems, error: ciError } = await supabase
        .from('content_items')
        .select('id, title, exam_type, assessment_type')
        .in('id', assessmentIds)

      if (ciError) {
        setError(true)
        setLoading(false)
        return
      }

      const ciMap = Object.fromEntries(
        (contentItems || []).map((c: { id: string }) => [c.id, c])
      )

      builtAssessments = (ccmAssessments || []).map(
        (row: { id: string; content_id: string; created_at: string }) => {
          const ci = ciMap[row.content_id] as {
            id: string
            title: string
            exam_type: string
            assessment_type: string
          } | undefined
          return {
            ccmId: row.id,
            contentId: row.content_id,
            title: ci?.title ?? '—',
            examType: ci?.exam_type ?? '—',
            assessmentType: ci?.assessment_type ?? '—',
            assignedAt: row.created_at,
          }
        }
      )
    }

    // Step 3b: join courses for course rows in JS
    const courseIds = (ccmCourses || []).map(
      (r: { content_id: string }) => r.content_id
    )
    let builtCourses: AssignedCourse[] = []

    if (courseIds.length > 0) {
      const { data: courseItems, error: coError } = await supabase
        .from('courses')
        .select('id, title, course_type')
        .in('id', courseIds)

      if (coError) {
        setError(true)
        setLoading(false)
        return
      }

      const coMap = Object.fromEntries(
        (courseItems || []).map((c: { id: string }) => [c.id, c])
      )

      builtCourses = (ccmCourses || []).map(
        (row: { id: string; content_id: string; created_at: string }) => {
          const co = coMap[row.content_id] as {
            id: string
            title: string
            course_type: string
          } | undefined
          return {
            ccmId: row.id,
            contentId: row.content_id,
            title: co?.title ?? '—',
            courseType: co?.course_type ?? '—',
            assignedAt: row.created_at,
          }
        }
      )
    }

    setAssessments(builtAssessments)
    setCourses(builtCourses)
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1].map(s => (
          <div key={s} className="space-y-2">
            <div className="h-4 w-24 rounded bg-zinc-100 animate-pulse" />
            {[0, 1, 2].map(r => (
              <div key={r} className="h-10 rounded bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        <AlertCircle size={16} />
        Failed to load content. Refresh to retry.
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-zinc-900">Assigned Content</h2>
        <button
          onClick={() => setShowAssign(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800"
        >
          <PlusCircle size={15} />
          Assign Content
        </button>
      </div>

      {/* Assessments section */}
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
        Assessments
      </p>
      {assessments.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2 border border-zinc-200 rounded-md mb-6">
          <FileX size={24} className="text-zinc-300" />
          <p className="text-sm text-zinc-400">No assessments assigned to this tenant.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-md overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
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
                  ASSIGNED
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((item, idx) => (
                <tr
                  key={item.ccmId}
                  className={idx < assessments.length - 1 ? 'border-b border-zinc-100' : ''}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">{item.title}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.examType}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.assessmentType}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatDate(item.assignedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setRemoveItem({
                          ccmId: item.ccmId,
                          title: item.title,
                          contentType: 'ASSESSMENT',
                        })
                      }
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses section */}
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
        Courses
      </p>
      {courses.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2 border border-zinc-200 rounded-md">
          <BookX size={24} className="text-zinc-300" />
          <p className="text-sm text-zinc-400">No courses assigned to this tenant.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/2">
                  TITLE
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                  TYPE
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                  ASSIGNED
                </th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((item, idx) => (
                <tr
                  key={item.ccmId}
                  className={idx < courses.length - 1 ? 'border-b border-zinc-100' : ''}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">{item.title}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.courseType}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatDate(item.assignedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setRemoveItem({
                          ccmId: item.ccmId,
                          title: item.title,
                          contentType: 'COURSE',
                        })
                      }
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign slide-over */}
      {showAssign && contractId && (
        <AssignContentSlideOver
          tenantId={tenantId}
          contractId={contractId}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            fetchContent()
            setShowAssign(false)
          }}
        />
      )}

      {/* Remove modal */}
      {removeItem && (
        <RemoveContentModal
          item={removeItem}
          onClose={() => setRemoveItem(null)}
          onRemoved={() => {
            fetchContent()
            setRemoveItem(null)
          }}
        />
      )}
    </div>
  )
}
