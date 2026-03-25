'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Eye, PenTool, Pencil, PowerOff, Power } from 'lucide-react'
import {
  fetchContentCreators,
  createContentCreator,
  updateContentCreator,
  toggleContentCreatorActive,
  type ContentCreatorRow,
} from '@/lib/supabase/content-creators'
import { useToast } from '@/components/ui/Toast'

// ─── Create Slide-Over ────────────────────────────────────────────────────────

function CreateCCSlideOver({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (!email.trim()) e.email = 'Email is required.'
    if (!password) e.password = 'Password is required.'
    else if (password.length < 6) e.password = 'Minimum 6 characters.'
    if (password !== confirm) e.confirm = 'Passwords do not match.'
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSaving(true)
    try {
      await createContentCreator({ name, email, password })
      showToast('Content Creator created.', 'success')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create.'
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setErrors({ email: 'This email already exists.' })
      } else {
        showToast('Failed to create Content Creator.', 'error')
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
          <p className="text-base font-semibold text-zinc-900">Add Content Creator</p>
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
              placeholder="Full name"
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-rose-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creator@keyskillset.com"
              className={inputCls(errors.email)}
            />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={labelCls}>Password <span className="text-rose-500">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className={inputCls(errors.password)}
            />
            {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className={labelCls}>Confirm Password <span className="text-rose-500">*</span></label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={inputCls(errors.confirm)}
            />
            {errors.confirm && <p className="text-xs text-rose-600 mt-1">{errors.confirm}</p>}
          </div>
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
            Create
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Edit Slide-Over (list) ────────────────────────────────────────────────────

function EditCCSlideOver({
  cc,
  onClose,
  onSaved,
}: {
  cc: ContentCreatorRow
  onClose: () => void
  onSaved: (updated: { name: string }) => void
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
    } catch {
      showToast('Failed to save changes.', 'error')
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls(errors.name)} />
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" className={inputCls(errors.password)} />
            {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
          </div>
          {password && (
            <div>
              <label className={labelCls}>Confirm New Password <span className="text-rose-500">*</span></label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls(errors.confirm)} />
              {errors.confirm && <p className="text-xs text-rose-600 mt-1">{errors.confirm}</p>}
            </div>
          )}
        </div>
        <div className="border-t border-zinc-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-70">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Toggle Active Modal (list) ────────────────────────────────────────────────

function ToggleActiveModal({
  cc,
  onClose,
  onConfirmed,
}: {
  cc: ContentCreatorRow
  onClose: () => void
  onConfirmed: () => void
}) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const deactivating = cc.is_active

  async function handleConfirm() {
    setSaving(true)
    try {
      await toggleContentCreatorActive(cc.id, !cc.is_active)
      showToast(deactivating ? `${cc.name} deactivated.` : `${cc.name} reactivated.`, 'success')
      onConfirmed()
    } catch {
      showToast('Action failed.', 'error')
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
            <button onClick={onClose} className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50">Cancel</button>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${
      isActive ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function ContentCreatorsPage() {
  const router = useRouter()
  const [creators, setCreators] = useState<ContentCreatorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ContentCreatorRow | null>(null)
  const [toggling, setToggling] = useState<ContentCreatorRow | null>(null)

  function load() {
    setLoading(true)
    fetchContentCreators()
      .then(setCreators)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Content Creators</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Master Organisation content creators</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Content Creator
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600 text-center py-10">{error}</p>
      ) : creators.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-2 bg-white border border-zinc-200 rounded-md">
          <PenTool className="w-8 h-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">No content creators yet.</p>
          <p className="text-xs text-zinc-400">Add a creator to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Assessments</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Courses</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {creators.map((cc) => (
                <tr key={cc.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{cc.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{cc.email}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge isActive={cc.is_active} />
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600">{cc.assessment_count}</td>
                  <td className="px-4 py-3 text-center text-zinc-600">{cc.course_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/super-admin/content-creators/${cc.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => setEditing(cc)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-800 font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setToggling(cc)}
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          cc.is_active
                            ? 'text-rose-600 hover:text-rose-700'
                            : 'text-blue-700 hover:text-blue-800'
                        }`}
                      >
                        {cc.is_active
                          ? <><PowerOff className="w-3.5 h-3.5" />Deactivate</>
                          : <><Power className="w-3.5 h-3.5" />Reactivate</>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateCCSlideOver
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}

      {editing && (
        <EditCCSlideOver
          cc={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setCreators((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...updated } : c))
            setEditing(null)
          }}
        />
      )}

      {toggling && (
        <ToggleActiveModal
          cc={toggling}
          onClose={() => setToggling(null)}
          onConfirmed={() => {
            setToggling(null)
            load()
          }}
        />
      )}
    </div>
  )
}
