'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Search, Tag, X, TriangleAlert as AlertTriangle } from 'lucide-react'

const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

const EXAM_CATEGORIES = ['SAT', 'NEET', 'JEE', 'CLAT'] as const
type ExamCategory = typeof EXAM_CATEGORIES[number]

interface ConceptTag {
  id: string
  exam_category: string
  subject: string
  concept_name: string
  slug: string
  description: string | null
  created_at: string
  question_count: number
}

interface FormState {
  exam_category: ExamCategory | ''
  subject: string
  concept_name: string
  slug: string
  description: string
}

function emptyForm(): FormState {
  return { exam_category: '', subject: '', concept_name: '', slug: '', description: '' }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function ExamBadge({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    SAT: 'bg-blue-50 text-blue-700 border border-blue-200',
    NEET: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    JEE: 'bg-amber-50 text-amber-700 border border-amber-200',
    CLAT: 'bg-rose-50 text-rose-700 border border-rose-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[cat] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {cat}
    </span>
  )
}

export default function PlatformConfigPage() {
  const [tags, setTags] = useState<ConceptTag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [editTag, setEditTag] = useState<ConceptTag | null>(null)
  const [deleteTag, setDeleteTag] = useState<ConceptTag | null>(null)

  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50
  const [total, setTotal] = useState(0)

  const loadTags = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('concept_tags')
      .select('*', { count: 'exact' })
      .order('exam_category')
      .order('subject')
      .order('concept_name')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (examFilter) query = query.eq('exam_category', examFilter)
    if (subjectFilter) query = query.ilike('subject', `%${subjectFilter}%`)
    if (search) query = query.ilike('concept_name', `%${search}%`)

    const { data, count } = await query
    if (!data) { setLoading(false); return }

    const tagIds = data.map(t => t.id)
    let qcounts: Record<string, number> = {}
    if (tagIds.length > 0) {
      const { data: mappings } = await supabase
        .from('question_concept_mappings')
        .select('concept_tag_id')
        .in('concept_tag_id', tagIds)
      if (mappings) {
        for (const m of mappings) {
          qcounts[m.concept_tag_id] = (qcounts[m.concept_tag_id] ?? 0) + 1
        }
      }
    }

    setTags(data.map(t => ({ ...t, question_count: qcounts[t.id] ?? 0 })))
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, examFilter, subjectFilter, search])

  useEffect(() => { loadTags() }, [loadTags])

  const allSubjects = Array.from(new Set(tags.map(t => t.subject))).sort()

  function openCreate() {
    setForm(emptyForm())
    setError('')
    setShowCreate(true)
  }

  function openEdit(tag: ConceptTag) {
    setForm({
      exam_category: tag.exam_category as ExamCategory,
      subject: tag.subject,
      concept_name: tag.concept_name,
      slug: tag.slug,
      description: tag.description ?? '',
    })
    setError('')
    setEditTag(tag)
  }

  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      concept_name: name,
      slug: f.exam_category
        ? `${slugify(f.exam_category)}-${slugify(f.subject)}-${slugify(name)}`
        : slugify(name),
    }))
  }

  function handleSubjectChange(subject: string) {
    setForm(f => ({
      ...f,
      subject,
      slug: f.exam_category && f.concept_name
        ? `${slugify(f.exam_category)}-${slugify(subject)}-${slugify(f.concept_name)}`
        : f.slug,
    }))
  }

  function handleExamChange(cat: ExamCategory | '') {
    setForm(f => ({
      ...f,
      exam_category: cat,
      slug: cat && f.subject && f.concept_name
        ? `${slugify(cat)}-${slugify(f.subject)}-${slugify(f.concept_name)}`
        : f.slug,
    }))
  }

  function validate(): string {
    if (!form.exam_category) return 'Exam category is required'
    if (!form.subject.trim()) return 'Subject is required'
    if (!form.concept_name.trim()) return 'Concept name is required'
    if (!form.slug.trim()) return 'Slug is required'
    return ''
  }

  async function handleCreate() {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    const { error: dbErr } = await supabase.from('concept_tags').insert({
      exam_category: form.exam_category,
      subject: form.subject.trim(),
      concept_name: form.concept_name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      created_by: DEMO_SA_ID,
    })
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    setShowCreate(false)
    loadTags()
  }

  async function handleEdit() {
    if (!editTag) return
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    const { error: dbErr } = await supabase.from('concept_tags').update({
      exam_category: form.exam_category,
      subject: form.subject.trim(),
      concept_name: form.concept_name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
    }).eq('id', editTag.id)
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    setEditTag(null)
    loadTags()
  }

  async function handleDelete() {
    if (!deleteTag) return
    setDeleting(true)
    await supabase.from('concept_tags').delete().eq('id', deleteTag.id)
    setDeleting(false)
    setDeleteTag(null)
    loadTags()
  }

  const start = page * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE + tags.length, total)

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Platform Config</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage concept tags registry for all exams. Tags are used for analytics and question classification.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search concept name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            <select
              value={examFilter}
              onChange={e => { setExamFilter(e.target.value); setPage(0) }}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Exams</option>
              {EXAM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={subjectFilter}
              onChange={e => { setSubjectFilter(e.target.value); setPage(0) }}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Subjects</option>
              {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(search || examFilter || subjectFilter) && (
              <button
                onClick={() => { setSearch(''); setExamFilter(''); setSubjectFilter(''); setPage(0) }}
                className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Concept Tag
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-400">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No concept tags found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Exam</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Concept Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Slug</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Questions</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag, i) => (
                <tr
                  key={tag.id}
                  className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}
                >
                  <td className="px-4 py-3">
                    <ExamBadge cat={tag.exam_category} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-xs">{tag.subject}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-900 font-medium">{tag.concept_name}</span>
                    {tag.description && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{tag.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">{tag.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tag.question_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-400'}`}>
                      {tag.question_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(tag)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTag(tag)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 0 && (
          <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing {start}–{end} of {total} concept tags</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 border border-zinc-200 rounded text-xs disabled:opacity-40 hover:bg-zinc-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={end >= total}
                className="px-2 py-1 border border-zinc-200 rounded text-xs disabled:opacity-40 hover:bg-zinc-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(showCreate || editTag) && (
        <ConceptTagModal
          title={showCreate ? 'Add Concept Tag' : 'Edit Concept Tag'}
          form={form}
          setForm={setForm}
          error={error}
          saving={saving}
          onExamChange={handleExamChange}
          onSubjectChange={handleSubjectChange}
          onNameChange={handleNameChange}
          onSave={showCreate ? handleCreate : handleEdit}
          onClose={() => { setShowCreate(false); setEditTag(null) }}
        />
      )}

      {deleteTag && (
        <DeleteModal
          tag={deleteTag}
          deleting={deleting}
          onDelete={handleDelete}
          onClose={() => setDeleteTag(null)}
        />
      )}
    </div>
  )
}

function ConceptTagModal({
  title, form, setForm, error, saving,
  onExamChange, onSubjectChange, onNameChange,
  onSave, onClose,
}: {
  title: string
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  error: string
  saving: boolean
  onExamChange: (v: ExamCategory | '') => void
  onSubjectChange: (v: string) => void
  onNameChange: (v: string) => void
  onSave: () => void
  onClose: () => void
}) {
  const inputCls = 'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Exam Category <span className="text-rose-500">*</span></label>
            <select
              value={form.exam_category}
              onChange={e => onExamChange(e.target.value as ExamCategory | '')}
              className={inputCls}
            >
              <option value="">Select exam...</option>
              {EXAM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Subject <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Algebra, Craft and Structure"
              value={form.subject}
              onChange={e => onSubjectChange(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Concept Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Linear equations and inequalities"
              value={form.concept_name}
              onChange={e => onNameChange(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Slug <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className={`${inputCls} font-mono text-xs`}
            />
            <p className="text-xs text-zinc-400 mt-1">Auto-generated from exam + subject + name. Must be unique.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Optional — brief description of this concept"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ tag, deleting, onDelete, onClose }: {
  tag: ConceptTag
  deleting: boolean
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Delete Concept Tag</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Are you sure you want to delete <span className="font-medium text-zinc-900">{tag.concept_name}</span>?
            </p>
          </div>
        </div>

        {tag.question_count > 0 && (
          <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <strong>{tag.question_count} question{tag.question_count !== 1 ? 's' : ''}</strong> linked to this concept tag will lose their mapping. The <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">concept_tag</code> text field on questions is unaffected.
          </div>
        )}

        <p className="text-xs text-zinc-400 mb-5">This is a hard delete and cannot be undone.</p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
