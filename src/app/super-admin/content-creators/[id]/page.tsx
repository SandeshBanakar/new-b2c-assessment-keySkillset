'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, X, Loader2, Pencil, PowerOff, Power } from 'lucide-react'
import {
  fetchContentCreatorById,
  fetchCCAssessments,
  fetchCCCourses,
  updateContentCreator,
  toggleContentCreatorActive,
  type ContentCreatorDetail,
  type CCAssessment,
  type CCCourse,
} from '@/lib/supabase/content-creators'
import { useToast } from '@/components/ui/Toast'

// ─── Edit Slide-Over ──────────────────────────────────────────────────────────

function EditCCSlideOver({
  cc,
  onClose,
  onSaved,
}: {
  cc: ContentCreatorDetail
  onClose: () => void
  onSaved: (updated: Partial<ContentCreatorDetail>) => void
}) {
  const { showToast } = useToast()
  const [name, setName] = useState(cc.name)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (password && password.length < 6) e.password = 'Minimum 6 characters.'
    if (password && password !== confirm) e.confirm = 'Passwords do not match.'
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSaving(true)
    try {
      await updateContentCreator(cc.id, { name, password: password || undefined })
      showToast('Changes saved.', 'success')
      onSaved({ name: name.trim() })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save.'
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setErrors({ email: 'This email already exists.' })
      } else {
        showToast('Failed to save changes.', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (err?: string) =>
    `border rounded-md px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full ${
      err ? 'border-rose-400' : 'border-zinc-200'
    }`
  const labelCls = 'text-sm font-medium text-zinc-700 block mb-1'

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-120 bg-white shadow-xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
          <p className="text-base font-semibold text-zinc-900">Edit Content Creator</p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div>
            <label className={labelCls}>Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <p className="text-sm text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">{cc.email}</p>
            <p className="text-xs text-zinc-400 mt-1">Email cannot be changed after creation.</p>
          </div>
          <div className="border-t border-zinc-100 pt-4">
            <label className={labelCls}>
              New Password{' '}
              <span className="text-zinc-400 font-normal text-xs">(leave blank to keep existing)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className={inputCls(errors.password)}
            />
            {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
          </div>
          {password && (
            <div>
              <label className={labelCls}>Confirm New Password <span className="text-rose-500">*</span></label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls(errors.confirm)}
              />
              {errors.confirm && <p className="text-xs text-rose-600 mt-1">{errors.confirm}</p>}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Deactivate/Reactivate Confirm Modal ──────────────────────────────────────

function ToggleActiveModal({
  cc,
  onClose,
  onConfirmed,
}: {
  cc: ContentCreatorDetail
  onClose: () => void
  onConfirmed: () => void
}) {
  const [saving, setSaving] = useState(false)
  const deactivating = cc.is_active

  async function handleConfirm() {
    setSaving(true)
    try {
      await toggleContentCreatorActive(cc.id, !cc.is_active)
      onConfirmed()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-sm p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">
            {deactivating ? 'Deactivate' : 'Reactivate'} Content Creator
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            {deactivating
              ? `${cc.name} will lose access to the platform. Their content will not be affected.`
              : `${cc.name} will regain access to the platform.`}
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className={`text-sm font-medium text-white rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70 ${
                deactivating ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {deactivating ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ContentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    LIVE:     'bg-green-50 text-green-700',
    INACTIVE: 'bg-amber-50 text-amber-700',
    DRAFT:    'bg-zinc-100 text-zinc-500',
    ARCHIVED: 'bg-zinc-100 text-zinc-400',
  }
  return (
    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${map[status] ?? 'bg-zinc-100 text-zinc-500'}`}>
      {status}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentCreatorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const id = params.id as string

  const [cc, setCc] = useState<ContentCreatorDetail | null>(null)
  const [assessments, setAssessments] = useState<CCAssessment[]>([])
  const [courses, setCourses] = useState<CCCourse[]>([])
  const [loading, setLoading] = useState(true)

  const [showEdit, setShowEdit] = useState(false)
  const [showToggle, setShowToggle] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [ccData, aData, cData] = await Promise.all([
          fetchContentCreatorById(id),
          fetchCCAssessments(id),
          fetchCCCourses(id),
        ])
        setCc(ccData)
        setAssessments(aData)
        setCourses(cData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
    </div>
  )

  if (!cc) return (
    <div className="p-8">
      <p className="text-sm text-zinc-500">Content Creator not found.</p>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push('/super-admin/content-creators')}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Content Creators
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{cc.name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{cc.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-zinc-100 text-zinc-600 rounded-md px-2 py-0.5">
              CONTENT_CREATOR
            </span>
            <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${
              cc.is_active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {cc.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs text-zinc-400">Joined {formatDate(cc.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          {cc.is_active ? (
            <button
              onClick={() => setShowToggle(true)}
              className="border border-rose-200 rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
            >
              <PowerOff className="w-4 h-4" />
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => setShowToggle(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              <Power className="w-4 h-4" />
              Reactivate
            </button>
          )}
        </div>
      </div>

      {/* Section 1 — Assessments */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Assessments
          <span className="ml-2 text-xs font-normal text-zinc-400">{assessments.length}</span>
        </h2>
        {assessments.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-md px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">No assessments created by this creator.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">{a.title}</td>
                    <td className="px-4 py-3 text-zinc-500">{a.category_name ?? <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-500">{a.test_type}</td>
                    <td className="px-4 py-3 text-center">
                      <ContentStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2 — Courses */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Courses
          <span className="ml-2 text-xs font-normal text-zinc-400">{courses.length}</span>
        </h2>
        {courses.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-md px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">No courses created by this creator.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">{c.title}</td>
                    <td className="px-4 py-3 text-center">
                      <ContentStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit slide-over */}
      {showEdit && (
        <EditCCSlideOver
          cc={cc}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setCc((prev) => prev ? { ...prev, ...updated } : prev)
            showToast('Changes saved.', 'success')
          }}
        />
      )}

      {/* Toggle active modal */}
      {showToggle && (
        <ToggleActiveModal
          cc={cc}
          onClose={() => setShowToggle(false)}
          onConfirmed={() => {
            setCc((prev) => prev ? { ...prev, is_active: !prev.is_active } : prev)
            setShowToggle(false)
            showToast(cc.is_active ? 'Creator deactivated.' : 'Creator reactivated.', 'success')
          }}
        />
      )}
    </div>
  )
}
