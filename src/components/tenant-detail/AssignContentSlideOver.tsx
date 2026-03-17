'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Search } from 'lucide-react'

interface AvailableAssessment {
  id: string
  title: string
  examType: string
  assessmentType: string
}

interface AvailableCourse {
  id: string
  title: string
  courseType: string
}

interface Props {
  tenantId: string
  contractId: string
  onClose: () => void
  onAssigned: () => void
}

export default function AssignContentSlideOver({
  contractId,
  onClose,
  onAssigned,
}: Props) {
  const [assessments, setAssessments] = useState<AvailableAssessment[]>([])
  const [courses, setCourses] = useState<AvailableCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'assessments' | 'courses'>('assessments')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    async function fetchAvailable() {
      setLoading(true)

      // Get already-assigned assessment IDs
      const { data: existingA } = await supabase
        .from('contract_content_map')
        .select('content_id')
        .eq('contract_id', contractId)
        .eq('content_type', 'ASSESSMENT')

      const assignedAIds = (existingA || []).map(
        (r: { content_id: string }) => r.content_id
      )

      // Get already-assigned course IDs
      const { data: existingC } = await supabase
        .from('contract_content_map')
        .select('content_id')
        .eq('contract_id', contractId)
        .eq('content_type', 'COURSE')

      const assignedCIds = (existingC || []).map(
        (r: { content_id: string }) => r.content_id
      )

      // Available assessments (exclude already assigned)
      let aQuery = supabase
        .from('content_items')
        .select('id, title, exam_type, assessment_type')
        .eq('status', 'LIVE')

      if (assignedAIds.length > 0) {
        aQuery = aQuery.not('id', 'in', `(${assignedAIds.join(',')})`)
      }

      const { data: aItems } = await aQuery

      // Available courses (exclude already assigned)
      let cQuery = supabase
        .from('courses')
        .select('id, title, course_type')
        .eq('status', 'LIVE')

      if (assignedCIds.length > 0) {
        cQuery = cQuery.not('id', 'in', `(${assignedCIds.join(',')})`)
      }

      const { data: cItems } = await cQuery

      setAssessments(
        (aItems || []).map(
          (a: { id: string; title: string; exam_type: string; assessment_type: string }) => ({
            id: a.id,
            title: a.title,
            examType: a.exam_type,
            assessmentType: a.assessment_type,
          })
        )
      )

      setCourses(
        (cItems || []).map(
          (c: { id: string; title: string; course_type: string }) => ({
            id: c.id,
            title: c.title,
            courseType: c.course_type,
          })
        )
      )

      setLoading(false)
    }

    fetchAvailable()
  }, [contractId])

  const filteredAssessments = assessments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    if (selectedIds.size === 0) return
    setSaving(true)
    setSaveError(false)

    const assessmentIdSet = new Set(assessments.map(a => a.id))
    const rows = Array.from(selectedIds).map(id => ({
      contract_id: contractId,
      content_id: id,
      content_type: assessmentIdSet.has(id) ? 'ASSESSMENT' : 'COURSE',
    }))

    const { error } = await supabase.from('contract_content_map').insert(rows)

    if (error) {
      setSaveError(true)
      setSaving(false)
      return
    }

    onAssigned()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-[480px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Assign Content</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-md text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'assessments'
                  ? 'border-b-2 border-blue-700 text-blue-700'
                  : 'text-zinc-400'
              }`}
            >
              Assessments ({filteredAssessments.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'courses'
                  ? 'border-b-2 border-blue-700 text-blue-700'
                  : 'text-zinc-400'
              }`}
            >
              Courses ({filteredCourses.length})
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-10 rounded bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'assessments' ? (
            filteredAssessments.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">
                All available assessments are already assigned.
              </p>
            ) : (
              <div className="space-y-1">
                {filteredAssessments.map(a => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="accent-blue-700"
                    />
                    <span className="flex-1 text-sm font-medium text-zinc-900">
                      {a.title}
                    </span>
                    <span className="text-xs bg-zinc-100 text-zinc-600 rounded px-2 py-0.5">
                      {a.examType}
                    </span>
                  </label>
                ))}
              </div>
            )
          ) : filteredCourses.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">
              All available courses are already assigned.
            </p>
          ) : (
            <div className="space-y-1">
              {filteredCourses.map(c => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="accent-blue-700"
                  />
                  <span className="flex-1 text-sm font-medium text-zinc-900">
                    {c.title}
                  </span>
                  <span className="text-xs bg-zinc-100 text-zinc-600 rounded px-2 py-0.5">
                    {c.courseType}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-4 flex flex-col gap-2">
          {saveError && (
            <p className="text-sm text-rose-600">Failed to assign content. Try again.</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedIds.size === 0 || saving}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Assigning...' : 'Assign Selected'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
