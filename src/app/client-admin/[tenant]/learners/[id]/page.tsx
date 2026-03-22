'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  User,
  Building2,
  Users,
  Phone,
  Mail,
  Hash,
  FileText,
  BookOpen,
  Calendar,
  StickyNote,
  AlertTriangle,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LearnerDetail {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: 'ACTIVE' | 'INACTIVE'
  employee_roll_number: string | null
  notes: string | null
  created_at: string
  department_id: string | null
  team_id: string | null
  departmentName?: string
  teamName?: string
}

interface AssignedContent {
  id: string
  title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  granted_at: string
  source: 'DIRECT' | 'TEAM' | 'DEPARTMENT'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
      {children}
    </p>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <div className="text-sm text-zinc-900 font-medium mt-0.5">{value}</div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearnerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenant as string
  const learnerId = params.id as string
  const tenantId = getTenantId(tenantSlug)

  const [learner, setLearner] = useState<LearnerDetail | null>(null)
  const [content, setContent] = useState<AssignedContent[]>([])
  const [loading, setLoading] = useState(true)

  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId || !learnerId) { setLoading(false); return }

    async function load() {
      setLoading(true)

      // Learner data
      const { data: l } = await supabase
        .from('learners')
        .select('id, full_name, email, phone, status, employee_roll_number, notes, created_at, department_id, team_id')
        .eq('id', learnerId)
        .eq('tenant_id', tenantId)
        .single()

      if (!l) { setLoading(false); return }

      // Dept + team names
      const [deptResult, teamResult] = await Promise.all([
        l.department_id
          ? supabase.from('departments').select('name').eq('id', l.department_id).single()
          : Promise.resolve({ data: null }),
        l.team_id
          ? supabase.from('teams').select('name').eq('id', l.team_id).single()
          : Promise.resolve({ data: null }),
      ])

      setLearner({
        ...l,
        departmentName: deptResult.data?.name,
        teamName: teamResult.data?.name,
      })

      // Assigned content via learner_content_access (active)
      const { data: accessRows } = await supabase
        .from('learner_content_access')
        .select('content_id, content_type, granted_at, source_assignment_id')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .is('revoked_at', null)

      if (!accessRows || accessRows.length === 0) {
        setContent([])
        setLoading(false)
        return
      }

      // Get assignment target types for source labels
      const assignmentIds = accessRows
        .map((r) => r.source_assignment_id)
        .filter(Boolean) as string[]

      const { data: assignments } = assignmentIds.length > 0
        ? await supabase
            .from('content_assignments')
            .select('id, target_type')
            .in('id', assignmentIds)
        : { data: [] }

      const assignmentTargetMap: Record<string, string> = {}
      for (const a of assignments ?? []) {
        assignmentTargetMap[a.id] = a.target_type
      }

      // Fetch titles
      const assessmentIds = accessRows
        .filter((r) => r.content_type === 'ASSESSMENT')
        .map((r) => r.content_id)
      const courseIds = accessRows
        .filter((r) => r.content_type === 'COURSE')
        .map((r) => r.content_id)

      const [{ data: ciRows }, { data: courseRows }] = await Promise.all([
        assessmentIds.length > 0
          ? supabase.from('content_items').select('id, title').in('id', assessmentIds)
          : Promise.resolve({ data: [] }),
        courseIds.length > 0
          ? supabase.from('courses').select('id, title').in('id', courseIds)
          : Promise.resolve({ data: [] }),
      ])

      const titleMap: Record<string, string> = {}
      for (const ci of ciRows ?? []) titleMap[ci.id] = ci.title
      for (const c of courseRows ?? []) titleMap[c.id] = c.title

      const merged: AssignedContent[] = accessRows
        .filter((r) => titleMap[r.content_id])
        .map((r) => {
          const targetType = r.source_assignment_id
            ? assignmentTargetMap[r.source_assignment_id]
            : 'INDIVIDUAL'
          const source: 'DIRECT' | 'TEAM' | 'DEPARTMENT' =
            targetType === 'TEAM' ? 'TEAM' :
            targetType === 'DEPARTMENT' ? 'DEPARTMENT' :
            'DIRECT'
          return {
            id: r.content_id,
            title: titleMap[r.content_id],
            content_type: r.content_type as 'ASSESSMENT' | 'COURSE',
            granted_at: r.granted_at,
            source,
          }
        })

      setContent(merged)
      setLoading(false)
    }

    void load()
  }, [learnerId, tenantId])

  async function handleToggleStatus() {
    if (!learner) return
    setSaving(true)
    const newStatus = learner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await supabase
      .from('learners')
      .update({ status: newStatus })
      .eq('id', learner.id)
    setLearner((prev) => prev ? { ...prev, status: newStatus } : prev)
    setSaving(false)
    setConfirmDeactivate(false)
  }

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    )
  }

  if (!learner) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-zinc-500">Learner not found.</p>
        <Link
          href={`/client-admin/${tenantSlug}/learners`}
          className="text-sm text-violet-700 hover:underline mt-2 inline-block"
        >
          ← Back to Learners
        </Link>
      </div>
    )
  }

  const sourceLabel: Record<string, string> = {
    DIRECT: 'Individual',
    TEAM: 'Team',
    DEPARTMENT: 'Department',
  }

  return (
    <div className="px-8 py-8">
      {/* Back link */}
      <Link
        href={`/client-admin/${tenantSlug}/learners`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Learners
      </Link>

      {/* Profile header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-violet-100 flex items-center justify-center text-lg font-semibold text-violet-700 shrink-0">
            {learner.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{learner.full_name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{learner.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
            learner.status === 'ACTIVE'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
          }`}>
            {learner.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </span>
          {learner.status === 'ACTIVE' ? (
            <button
              onClick={() => setConfirmDeactivate(true)}
              className="px-3 py-1.5 text-sm font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleToggleStatus}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium text-violet-700 border border-violet-200 rounded-md hover:bg-violet-50 transition-colors disabled:opacity-50"
            >
              {saving ? 'Reactivating…' : 'Reactivate'}
            </button>
          )}
        </div>
      </div>

      {/* Two-column detail */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Contact & identity */}
        <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 space-y-4">
          <SectionLabel>Contact & Identity</SectionLabel>
          <InfoRow icon={Mail} label="Email" value={learner.email} />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={learner.phone ?? <span className="text-zinc-400 font-normal">—</span>}
          />
          <InfoRow
            icon={Hash}
            label="Employee ID"
            value={
              learner.employee_roll_number ?? (
                <span className="text-zinc-400 font-normal">—</span>
              )
            }
          />
          <InfoRow icon={Calendar} label="Joined" value={formatDate(learner.created_at)} />
        </div>

        {/* Organisation */}
        <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 space-y-4">
          <SectionLabel>Organisation</SectionLabel>
          <InfoRow
            icon={Building2}
            label="Department"
            value={
              learner.departmentName ?? (
                <span className="text-zinc-400 font-normal">Not assigned</span>
              )
            }
          />
          <InfoRow
            icon={Users}
            label="Team"
            value={
              learner.teamName ?? (
                <span className="text-zinc-400 font-normal">Not assigned</span>
              )
            }
          />
          {learner.notes && (
            <InfoRow
              icon={StickyNote}
              label="Notes"
              value={<span className="font-normal text-zinc-700">{learner.notes}</span>}
            />
          )}
        </div>
      </div>

      {/* Assigned content */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-700">
            Assigned Content{' '}
            <span className="text-zinc-400 font-normal">({content.length})</span>
          </p>
        </div>

        {content.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-400">No content assigned yet.</p>
            <Link
              href={`/client-admin/${tenantSlug}/catalog`}
              className="text-sm text-violet-700 hover:underline mt-1 inline-block"
            >
              Go to Catalog to assign content
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Via
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Granted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {content.map((c) => (
                <tr key={`${c.id}-${c.source}`} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {c.content_type === 'ASSESSMENT' ? (
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-violet-500 shrink-0" />
                      )}
                      <span className="font-medium text-zinc-900">{c.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {c.content_type === 'ASSESSMENT' ? 'Assessment' : 'Course'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {sourceLabel[c.source]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{formatDate(c.granted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Deactivate confirm modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-lg">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Deactivate learner?</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    <span className="font-medium">{learner.full_name}</span> will lose access to
                    all assigned content. This can be reversed by reactivating them.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
