'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, Pencil, Trash2, Search, Tag, X, GripVertical, ChevronLeft,
  TriangleAlert as AlertTriangle, Settings2, GraduationCap,
  ToggleLeft, ToggleRight, Clock, TrendingUp,
} from 'lucide-react'

const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamCategory {
  id: string
  name: string
  display_name: string
  slug: string
  description: string | null
  display_order: number
  is_active: boolean
}

interface ExamCategoryForm {
  display_name: string
  name: string
  slug: string
  description: string
  display_order: string
  is_active: boolean
}

interface ConceptTag {
  id: string; exam_category: string; subject: string
  concept_name: string; slug: string; description: string | null
  created_at: string; question_count: number
}

interface ConceptTagForm {
  exam_category: string; subject: string; concept_name: string
  slug: string; description: string
}

interface TierBand {
  id: string; name: string; label: string
  min_score: number; max_score: number; color: string; display_order: number
}

interface College {
  id: string; name: string; country: string; cutoff_score: number
  aid_pct: number; logo_initials: string | null; is_active: boolean; display_order: number
}

interface CollegeForm {
  name: string; country: 'US' | 'IN'; cutoff_score: string; aid_pct: string; logo_initials: string
}

interface RankPredictionRow {
  id: string
  year: number
  is_active: boolean
  updated_at: string | null
}

interface AddYearForm {
  year: string
  json: string
}

type SubTab = 'concept-tags' | 'analytics-display' | 'rank-prediction'

const RANK_PREDICTION_CATS = new Set(['NEET', 'JEE', 'CLAT'])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function emptyTagForm(): ConceptTagForm {
  return { exam_category: '', subject: '', concept_name: '', slug: '', description: '' }
}

function emptyCollegeForm(): CollegeForm {
  return { name: '', country: 'US', cutoff_score: '', aid_pct: '0', logo_initials: '' }
}

function emptyCategoryForm(nextOrder = 1): ExamCategoryForm {
  return { display_name: '', name: '', slug: '', description: '', display_order: String(nextOrder), is_active: true }
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  zinc:   { bg: 'bg-zinc-100',   text: 'text-zinc-600',   border: 'border-zinc-200' },
  teal:   { bg: 'bg-teal-50',    text: 'text-teal-700',   border: 'border-teal-200' },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  violet: { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
  amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
}

const EXAM_BADGE: Record<string, string> = {
  SAT:  'bg-blue-50 text-blue-700 border border-blue-200',
  NEET: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  JEE:  'bg-amber-50 text-amber-700 border border-amber-200',
  CLAT: 'bg-rose-50 text-rose-700 border border-rose-200',
  BANK: 'bg-teal-50 text-teal-700 border border-teal-200',
  SSC:  'bg-orange-50 text-orange-700 border border-orange-200',
}

function computeTierForScore(cutoff: number, bands: TierBand[]): TierBand | null {
  return [...bands].sort((a, b) => b.min_score - a.min_score).find(b => cutoff >= b.min_score) ?? null
}

const inputCls = 'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

// ─── Sortable Exam Row ────────────────────────────────────────────────────────

function SortableExamRow({
  category,
  onEdit,
  onDrillDown,
  tagCount,
}: {
  category: ExamCategory
  onEdit: (cat: ExamCategory) => void
  onDrillDown: (cat: ExamCategory) => void
  tagCount: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
      <td className="pl-4 pr-2 py-3 hidden sm:table-cell w-8">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-4 py-3">
        {category.is_active ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">Inactive</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-zinc-900">{category.display_name}</span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EXAM_BADGE[category.name] ?? 'bg-zinc-50 text-zinc-700 border border-zinc-200'}`}>
          {category.name}
        </span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {tagCount}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(category)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => onDrillDown(category)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            View →
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Category Slide-Over ──────────────────────────────────────────────────────

function CategorySlideOver({
  mode,
  form,
  setForm,
  error,
  saving,
  deleteState,
  onSave,
  onDelete,
  onCancelDelete,
  onClose,
}: {
  mode: 'create' | 'edit'
  form: ExamCategoryForm
  setForm: React.Dispatch<React.SetStateAction<ExamCategoryForm>>
  error: string
  saving: boolean
  deleteState: { checking: boolean; tagCount: number; assessmentCount: number; confirming: boolean; deleting: boolean } | null
  onSave: () => void
  onDelete: () => void
  onCancelDelete: () => void
  onClose: () => void
}) {
  function handleDisplayNameChange(v: string) {
    setForm(f => ({
      ...f,
      display_name: v,
      slug: mode === 'create' ? slugify(v) : f.slug,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <h2 className="text-base font-semibold text-zinc-900">
            {mode === 'create' ? 'Create Exam Category' : 'Edit Exam Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. JEE Mains"
              value={form.display_name}
              onChange={e => handleDisplayNameChange(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Code / Name <span className="text-rose-500">*</span>
              {mode === 'edit' && <span className="ml-1 text-zinc-400 font-normal">(read-only)</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. JEE"
              value={form.name}
              readOnly={mode === 'edit'}
              onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
              className={`${inputCls} ${mode === 'edit' ? 'bg-zinc-50 text-zinc-500 cursor-not-allowed' : ''}`}
            />
            <p className="text-[10px] text-zinc-400 mt-0.5">Immutable after creation. Used as internal identifier.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className={`${inputCls} font-mono text-xs`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Optional"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Display Order</label>
            <input
              type="number"
              min={1}
              value={form.display_order}
              onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-zinc-900">Active</p>
              <p className="text-xs text-zinc-500">Inactive categories are hidden from end-user pages and SA dropdowns.</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
              {form.is_active
                ? <ToggleRight className="w-8 h-8 text-blue-700" />
                : <ToggleLeft className="w-8 h-8 text-zinc-300" />}
            </button>
          </div>

          {/* Delete guard (edit mode only) */}
          {mode === 'edit' && deleteState && (
            <div className="pt-4 border-t border-zinc-100">
              {!deleteState.confirming ? (
                <button
                  onClick={onDelete}
                  disabled={deleteState.checking}
                  className="w-full py-2.5 text-sm font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors disabled:opacity-40"
                >
                  {deleteState.checking ? 'Checking…' : 'Delete Category'}
                </button>
              ) : (deleteState.tagCount > 0 || deleteState.assessmentCount > 0) ? (
                <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">
                  Cannot delete — {deleteState.tagCount} concept {deleteState.tagCount === 1 ? 'tag' : 'tags'} and {deleteState.assessmentCount} {deleteState.assessmentCount === 1 ? 'assessment' : 'assessments'} are linked to this category.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-700">Confirm deletion? This cannot be undone.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onDelete}
                      disabled={deleteState.deleting}
                      className="flex-1 py-2 text-sm font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50"
                    >
                      {deleteState.deleting ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      onClick={onCancelDelete}
                      className="px-4 py-2 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 shrink-0 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page (inner — needs Suspense for useSearchParams) ───────────────────

function PlatformConfigInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catIdParam = searchParams.get('cat')

  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const [loadingCats, setLoadingCats] = useState(true)
  const [catPage, setCatPage] = useState(0)
  const CAT_PAGE_SIZE = 10

  // Create/Edit slide-over state
  const [showCreate, setShowCreate] = useState(false)
  const [editCat, setEditCat] = useState<ExamCategory | null>(null)
  const [catForm, setCatForm] = useState<ExamCategoryForm>(emptyCategoryForm())
  const [catFormError, setCatFormError] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [deleteState, setDeleteState] = useState<{
    checking: boolean; tagCount: number; assessmentCount: number; confirming: boolean; deleting: boolean
  } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const loadCategories = useCallback(() => {
    supabase
      .from('exam_categories')
      .select('id, name, display_name, slug, description, display_order, is_active')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        const cats = (data ?? []) as ExamCategory[]
        setCategories(cats)

        if (cats.length === 0) {
          setLoadingCats(false)
          return
        }

        const names = cats.map(c => c.name)
        supabase
          .from('concept_tags')
          .select('exam_category')
          .in('exam_category', names)
          .then(({ data: tagRows }) => {
            const counts: Record<string, number> = {}
            for (const row of tagRows ?? []) {
              counts[row.exam_category] = (counts[row.exam_category] ?? 0) + 1
            }
            setTagCounts(counts)
            setLoadingCats(false)
          })
      })
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  // ── Drill-down state ─────────────────────────────────────────────────────────

  const selectedCat = catIdParam ? categories.find(c => c.id === catIdParam) ?? null : null
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('concept-tags')

  function drillDown(cat: ExamCategory) {
    router.push(`/super-admin/platform-config?cat=${cat.id}`)
    setActiveSubTab('concept-tags')
  }

  function goBack() {
    router.push('/super-admin/platform-config')
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)

    // Optimistic update
    setCategories(reordered)

    const updates = reordered.map((c, i) => ({ id: c.id, display_order: i + 1 }))
    await Promise.all(
      updates.map(({ id, display_order }) =>
        supabase.from('exam_categories').update({ display_order }).eq('id', id)
      )
    )
    setCategories(reordered.map((c, i) => ({ ...c, display_order: i + 1 })))
  }

  // ── Create Category ──────────────────────────────────────────────────────────

  function openCreate() {
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.display_order)) + 1
      : 1
    setCatForm(emptyCategoryForm(nextOrder))
    setCatFormError('')
    setShowCreate(true)
  }

  async function handleCreateSave() {
    if (!catForm.display_name.trim()) { setCatFormError('Display name is required'); return }
    if (!catForm.name.trim()) { setCatFormError('Code/Name is required'); return }
    if (!catForm.slug.trim()) { setCatFormError('Slug is required'); return }

    setCatSaving(true)
    const { error } = await supabase.from('exam_categories').insert({
      name: catForm.name.trim(),
      display_name: catForm.display_name.trim(),
      slug: catForm.slug.trim(),
      description: catForm.description.trim() || null,
      display_order: parseInt(catForm.display_order) || 1,
      is_active: catForm.is_active,
    })
    setCatSaving(false)

    if (error) { setCatFormError(error.message); return }
    setShowCreate(false)
    loadCategories()
  }

  // ── Edit Category ────────────────────────────────────────────────────────────

  function openEdit(cat: ExamCategory) {
    setCatForm({
      display_name: cat.display_name,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      display_order: String(cat.display_order),
      is_active: cat.is_active,
    })
    setCatFormError('')
    setDeleteState({ checking: false, tagCount: 0, assessmentCount: 0, confirming: false, deleting: false })
    setEditCat(cat)
  }

  async function handleEditSave() {
    if (!editCat) return
    if (!catForm.display_name.trim()) { setCatFormError('Display name is required'); return }

    setCatSaving(true)
    const { error } = await supabase.from('exam_categories').update({
      display_name: catForm.display_name.trim(),
      slug: catForm.slug.trim(),
      description: catForm.description.trim() || null,
      display_order: parseInt(catForm.display_order) || editCat.display_order,
      is_active: catForm.is_active,
    }).eq('id', editCat.id)
    setCatSaving(false)

    if (error) { setCatFormError(error.message); return }
    setEditCat(null)
    loadCategories()
  }

  // ── Delete Category ──────────────────────────────────────────────────────────

  async function handleDeleteAction() {
    if (!editCat || !deleteState) return

    if (!deleteState.confirming) {
      // Check counts first
      setDeleteState(s => s ? { ...s, checking: true } : s)
      const [{ count: tagCount }, { count: assessmentCount }] = await Promise.all([
        supabase.from('concept_tags').select('*', { count: 'exact', head: true }).eq('exam_category', editCat.name),
        supabase.from('assessment_items').select('*', { count: 'exact', head: true }).eq('exam_category_id', editCat.id),
      ])
      setDeleteState({ checking: false, tagCount: tagCount ?? 0, assessmentCount: assessmentCount ?? 0, confirming: true, deleting: false })
      return
    }

    if (deleteState.tagCount > 0 || deleteState.assessmentCount > 0) return

    // Confirmed + no linked content → hard delete
    setDeleteState(s => s ? { ...s, deleting: true } : s)
    await supabase.from('exam_categories').delete().eq('id', editCat.id)
    setEditCat(null)
    setDeleteState(null)
    loadCategories()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loadingCats) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Drill-down view
  if (selectedCat) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Platform Config
          </button>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900">{selectedCat.display_name}</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{selectedCat.display_name}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EXAM_BADGE[selectedCat.name] ?? 'bg-zinc-50 text-zinc-700 border border-zinc-200'}`}>
              {selectedCat.name}
            </span>
            {!selectedCat.is_active && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">Inactive</span>
            )}
          </div>
          <button
            onClick={() => openEdit(selectedCat)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 mb-5 flex-wrap">
          {([
            'concept-tags',
            ...(selectedCat.name === 'SAT' ? ['analytics-display'] : []),
            ...(RANK_PREDICTION_CATS.has(selectedCat.name) ? ['rank-prediction'] : []),
          ] as SubTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSubTab === tab
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {tab === 'concept-tags'
                ? <><Tag className="w-3.5 h-3.5" /> Concept Tags</>
                : tab === 'analytics-display'
                  ? <><Settings2 className="w-3.5 h-3.5" /> Analytics Config</>
                  : <><TrendingUp className="w-3.5 h-3.5" /> Rank Prediction</>}
            </button>
          ))}
        </div>

        {activeSubTab === 'concept-tags' && <ConceptTagsPanel key={selectedCat.name} categoryName={selectedCat.name} />}
        {activeSubTab === 'analytics-display' && <AnalyticsDisplayPanel category={selectedCat} />}
        {activeSubTab === 'rank-prediction' && <RankPredictionPanel category={selectedCat} />}
      </div>
    )
  }

  // Table view
  const pagedCats = categories.slice(catPage * CAT_PAGE_SIZE, (catPage + 1) * CAT_PAGE_SIZE)
  const totalCatPages = Math.ceil(categories.length / CAT_PAGE_SIZE)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Platform Config</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage exam categories, concept tags, and analytics display.</p>
      </div>

      {/* Exam Category card */}
      <div className="bg-white border border-zinc-200 rounded-md shadow-sm">
        {/* Card header */}
        <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-200 rounded-t-md flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">Exam Category</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {/* Create button above table */}
        <div className="px-5 pt-4 pb-3 flex justify-end">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Exam Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="py-16 text-center">
            <Settings2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No exam categories yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pagedCats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="pl-4 pr-2 py-2.5 hidden sm:table-cell w-8" />
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Display Name</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Internal Name</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Concept Tags</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedCats.map(cat => (
                        <SortableExamRow
                          key={cat.id}
                          category={cat}
                          tagCount={tagCounts[cat.name] ?? 0}
                          onEdit={openEdit}
                          onDrillDown={drillDown}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>

            {totalCatPages > 1 && (
              <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>{categories.length} total · page {catPage + 1} of {totalCatPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCatPage(p => Math.max(0, p - 1))}
                    disabled={catPage === 0}
                    className="px-2.5 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >← Prev</button>
                  <button
                    onClick={() => setCatPage(p => Math.min(totalCatPages - 1, p + 1))}
                    disabled={catPage >= totalCatPages - 1}
                    className="px-2.5 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create slide-over */}
      {showCreate && (
        <CategorySlideOver
          mode="create"
          form={catForm}
          setForm={setCatForm}
          error={catFormError}
          saving={catSaving}
          deleteState={null}
          onSave={handleCreateSave}
          onDelete={() => {}}
          onCancelDelete={() => {}}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Edit slide-over */}
      {editCat && (
        <CategorySlideOver
          mode="edit"
          form={catForm}
          setForm={setCatForm}
          error={catFormError}
          saving={catSaving}
          deleteState={deleteState}
          onSave={handleEditSave}
          onDelete={handleDeleteAction}
          onCancelDelete={() => setDeleteState(null)}
          onClose={() => { setEditCat(null); setDeleteState(null) }}
        />
      )}
    </div>
  )
}

// ─── Page export (wraps inner in Suspense for useSearchParams) ─────────────────

export default function PlatformConfigPage() {
  return (
    <Suspense fallback={
      <div className="px-6 py-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PlatformConfigInner />
    </Suspense>
  )
}

// ─── Concept Tags Panel ───────────────────────────────────────────────────────

function ConceptTagsPanel({ categoryName }: { categoryName: string }) {
  const [tags, setTags] = useState<ConceptTag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 50

  const [showCreate, setShowCreate] = useState(false)
  const [editTag, setEditTag] = useState<ConceptTag | null>(null)
  const [deleteTag, setDeleteTag] = useState<ConceptTag | null>(null)
  const [form, setForm] = useState<ConceptTagForm>(emptyTagForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const loadTags = useCallback(() => {
    let query = supabase
      .from('concept_tags')
      .select('*', { count: 'exact' })
      .eq('exam_category', categoryName)
      .order('subject').order('concept_name')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (subjectFilter) query = query.ilike('subject', `%${subjectFilter}%`)
    if (search) query = query.ilike('concept_name', `%${search}%`)

    query.then(({ data, count }) => {
      if (!data) { setLoading(false); return }

      const tagIds = data.map(t => t.id)
      if (tagIds.length === 0) {
        setTags(data.map(t => ({ ...t, question_count: 0 })))
        setTotal(count ?? 0)
        setLoading(false)
        return
      }

      supabase
        .from('questions').select('concept_tag_id').in('concept_tag_id', tagIds)
        .then(({ data: qrows }) => {
          const qcounts: Record<string, number> = {}
          if (qrows) {
            for (const r of qrows) if (r.concept_tag_id) qcounts[r.concept_tag_id] = (qcounts[r.concept_tag_id] ?? 0) + 1
          }
          setTags(data.map(t => ({ ...t, question_count: qcounts[t.id] ?? 0 })))
          setTotal(count ?? 0)
          setLoading(false)
        })
    })
  }, [categoryName, page, subjectFilter, search])

  useEffect(() => { loadTags() }, [loadTags])

  const allSubjects = Array.from(new Set(tags.map(t => t.subject))).sort()

  function openCreate() {
    setForm({ ...emptyTagForm(), exam_category: categoryName })
    setError(''); setShowCreate(true)
  }
  function openEdit(tag: ConceptTag) {
    setForm({ exam_category: tag.exam_category, subject: tag.subject, concept_name: tag.concept_name, slug: tag.slug, description: tag.description ?? '' })
    setError(''); setEditTag(tag)
  }
  function handleNameChange(name: string) {
    setForm(f => ({ ...f, concept_name: name, slug: `${slugify(f.exam_category)}-${slugify(f.subject)}-${slugify(name)}` }))
  }
  function handleSubjectChange(subject: string) {
    setForm(f => ({ ...f, subject, slug: f.concept_name ? `${slugify(f.exam_category)}-${slugify(subject)}-${slugify(f.concept_name)}` : f.slug }))
  }
  function validate() {
    if (!form.subject.trim()) return 'Subject is required'
    if (!form.concept_name.trim()) return 'Concept name is required'
    if (!form.slug.trim()) return 'Slug is required'
    return ''
  }
  async function handleCreate() {
    const err = validate(); if (err) { setError(err); return }
    setSaving(true)
    const { error: dbErr } = await supabase.from('concept_tags').insert({ ...form, exam_category: categoryName, description: form.description.trim() || null, created_by: DEMO_SA_ID })
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    setShowCreate(false); loadTags()
  }
  async function handleEdit() {
    if (!editTag) return
    const err = validate(); if (err) { setError(err); return }
    setSaving(true)
    const { error: dbErr } = await supabase.from('concept_tags').update({ subject: form.subject.trim(), concept_name: form.concept_name.trim(), slug: form.slug.trim(), description: form.description.trim() || null }).eq('id', editTag.id)
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    setEditTag(null); loadTags()
  }
  async function handleDelete() {
    if (!deleteTag) return
    setDeleting(true)
    const { error: dbErr } = await supabase.from('concept_tags').delete().eq('id', deleteTag.id)
    setDeleting(false)
    if (dbErr) { setError(dbErr.message); return }
    setDeleteTag(null); loadTags()
  }

  const start = page * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE + tags.length, total)

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input type="text" placeholder="Search concept..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
            </div>
            <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(0) }}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Subjects</option>
              {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(search || subjectFilter) && (
              <button onClick={() => { setSearch(''); setSubjectFilter(''); setPage(0) }} className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add Concept Tag
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-400">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No concept tags for {categoryName}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Concept Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Slug</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Questions</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, i) => (
                  <tr key={tag.id} className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{tag.subject}</td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-900 font-medium">{tag.concept_name}</span>
                      {tag.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{tag.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">{tag.slug}</code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tag.question_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-400'}`}>
                        {tag.question_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(tag)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTag(tag)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing {start}–{end} of {total}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-1 border border-zinc-200 rounded text-xs disabled:opacity-40 hover:bg-zinc-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={end >= total} className="px-2 py-1 border border-zinc-200 rounded text-xs disabled:opacity-40 hover:bg-zinc-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {(showCreate || editTag) && (
        <ConceptTagModal
          title={showCreate ? `Add Concept Tag — ${categoryName}` : 'Edit Concept Tag'}
          form={form} setForm={setForm} error={error} saving={saving}
          onSubjectChange={handleSubjectChange} onNameChange={handleNameChange}
          onSave={showCreate ? handleCreate : handleEdit}
          onClose={() => { setShowCreate(false); setEditTag(null) }}
        />
      )}
      {deleteTag && (
        <DeleteTagModal tag={deleteTag} deleting={deleting} onDelete={handleDelete} onClose={() => setDeleteTag(null)} />
      )}
    </>
  )
}

// ─── Analytics Display Panel ──────────────────────────────────────────────────

function AnalyticsDisplayPanel({ category }: { category: ExamCategory }) {
  if (category.name !== 'SAT') {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-10 text-center">
        <Settings2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-700">Analytics Display configuration for {category.display_name}</p>
        <p className="text-xs text-zinc-400 mt-1">Coming soon.</p>
      </div>
    )
  }
  return <SATAnalyticsDisplayConfig categoryId={category.id} />
}

// ─── SAT Analytics Display Config ─────────────────────────────────────────────

function SATAnalyticsDisplayConfig({ categoryId }: { categoryId: string }) {
  const [tierBands, setTierBands] = useState<TierBand[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)

  const [editingBand, setEditingBand] = useState<string | null>(null)
  const [bandEdits, setBandEdits] = useState<Record<string, { min_score: string; max_score: string }>>({})

  const [showCollegeForm, setShowCollegeForm] = useState(false)
  const [editCollege, setEditCollege] = useState<College | null>(null)
  const [deleteCollegeId, setDeleteCollegeId] = useState<string | null>(null)
  const [collegeForm, setCollegeForm] = useState<CollegeForm>(emptyCollegeForm())
  const [collegeSaving, setCollegeSaving] = useState(false)
  const [collegeDeleting, setCollegeDeleting] = useState(false)
  const [collegeError, setCollegeError] = useState('')
  const [countryFilter, setCountryFilter] = useState<'all' | 'US' | 'IN'>('all')

  useEffect(() => {
    async function load() {
      const [bandsRes, collegesRes] = await Promise.all([
        supabase.from('sat_tier_bands').select('*').order('display_order'),
        supabase.from('sat_colleges').select('*').order('cutoff_score', { ascending: false }),
      ])
      setTierBands(bandsRes.data ?? [])
      setColleges(collegesRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [categoryId])

  function startBandEdit(band: TierBand) {
    setEditingBand(band.id)
    setBandEdits(e => ({ ...e, [band.id]: { min_score: String(band.min_score), max_score: String(band.max_score) } }))
  }

  async function saveBandEdit(band: TierBand) {
    const edit = bandEdits[band.id]
    if (!edit) return
    const min = parseInt(edit.min_score); const max = parseInt(edit.max_score)
    if (isNaN(min) || isNaN(max) || min >= max) return
    await supabase.from('sat_tier_bands').update({ min_score: min, max_score: max, updated_at: new Date().toISOString() }).eq('id', band.id)
    setTierBands(bs => bs.map(b => b.id === band.id ? { ...b, min_score: min, max_score: max } : b))
    setEditingBand(null)
  }

  function openCreateCollege() {
    setCollegeForm(emptyCollegeForm()); setCollegeError(''); setShowCollegeForm(true)
  }
  function openEditCollege(c: College) {
    setCollegeForm({ name: c.name, country: c.country as 'US' | 'IN', cutoff_score: String(c.cutoff_score), aid_pct: String(c.aid_pct), logo_initials: c.logo_initials ?? '' })
    setCollegeError(''); setEditCollege(c)
  }
  function validateCollege() {
    if (!collegeForm.name.trim()) return 'College name is required'
    const cut = parseInt(collegeForm.cutoff_score)
    if (isNaN(cut) || cut < 400 || cut > 1600) return 'Cutoff score must be 400–1600'
    const aid = parseInt(collegeForm.aid_pct)
    if (isNaN(aid) || aid < 0 || aid > 100) return 'Aid % must be 0–100'
    return ''
  }
  async function handleSaveCollege() {
    const err = validateCollege(); if (err) { setCollegeError(err); return }
    setCollegeSaving(true)
    const payload = {
      name: collegeForm.name.trim(), country: collegeForm.country,
      cutoff_score: parseInt(collegeForm.cutoff_score), aid_pct: parseInt(collegeForm.aid_pct),
      logo_initials: collegeForm.logo_initials.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (editCollege) {
      await supabase.from('sat_colleges').update(payload).eq('id', editCollege.id)
      setColleges(cs => cs.map(c => c.id === editCollege.id ? { ...c, ...payload } : c).sort((a, b) => b.cutoff_score - a.cutoff_score))
      setEditCollege(null)
    } else {
      const { data } = await supabase.from('sat_colleges').insert({ ...payload, created_by: DEMO_SA_ID }).select().single()
      if (data) setColleges(cs => [...cs, data as College].sort((a, b) => b.cutoff_score - a.cutoff_score))
      setShowCollegeForm(false)
    }
    setCollegeSaving(false)
  }
  async function handleDeleteCollege() {
    if (!deleteCollegeId) return
    setCollegeDeleting(true)
    await supabase.from('sat_colleges').delete().eq('id', deleteCollegeId)
    setColleges(cs => cs.filter(c => c.id !== deleteCollegeId))
    setCollegeDeleting(false); setDeleteCollegeId(null)
  }

  const filteredColleges = countryFilter === 'all' ? colleges : colleges.filter(c => c.country === countryFilter)

  if (loading) return <div className="py-16 text-center"><div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      {/* Tier Bands */}
      <div className="bg-white border border-zinc-200 rounded-md">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Tier Bands</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Score ranges used to group colleges on the ladder.</p>
        </div>
        {tierBands.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">No tier bands found. Run KSS-DB-041 migration first.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Band</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Min Score</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Max Score</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Colour</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tierBands.map(band => {
                  const tc = TIER_COLORS[band.color] ?? TIER_COLORS.zinc
                  const isEditing = editingBand === band.id
                  const edit = bandEdits[band.id] ?? { min_score: String(band.min_score), max_score: String(band.max_score) }
                  return (
                    <tr key={band.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{band.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={edit.min_score} onChange={e => setBandEdits(b => ({ ...b, [band.id]: { ...edit, min_score: e.target.value } }))}
                            className="w-20 px-2 py-1 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        ) : <span className="text-zinc-700 tabular-nums">{band.min_score}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={edit.max_score} onChange={e => setBandEdits(b => ({ ...b, [band.id]: { ...edit, max_score: e.target.value } }))}
                            className="w-20 px-2 py-1 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        ) : <span className="text-zinc-700 tabular-nums">{band.max_score}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{band.color}</td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => saveBandEdit(band)} className="px-2.5 py-1 text-xs font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors">Save</button>
                            <button onClick={() => setEditingBand(null)} className="px-2.5 py-1 text-xs text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => startBandEdit(band)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* College Targets */}
      <div className="bg-white border border-zinc-200 rounded-md">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">College Targets</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Colleges shown on the student analytics ladder. Sorted by cutoff score.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-zinc-200 bg-white overflow-hidden text-xs">
              {(['all', 'US', 'IN'] as const).map(f => (
                <button key={f} onClick={() => setCountryFilter(f)}
                  className={`px-2.5 py-1.5 font-medium transition-colors ${countryFilter === f ? 'bg-blue-700 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                  {f === 'all' ? 'All' : f === 'US' ? '🇺🇸 US' : '🇮🇳 India'}
                </button>
              ))}
            </div>
            <button onClick={openCreateCollege} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors shrink-0">
              <Plus className="w-3.5 h-3.5" /> Add College
            </button>
          </div>
        </div>

        {colleges.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <GraduationCap className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No colleges yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">College</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Country</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Cutoff</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Aid %</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Tier</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredColleges.map(college => {
                  const tier = computeTierForScore(college.cutoff_score, tierBands)
                  const tc = tier ? (TIER_COLORS[tier.color] ?? TIER_COLORS.zinc) : TIER_COLORS.zinc
                  const isDeleting = deleteCollegeId === college.id
                  return (
                    <tr key={college.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-600 shrink-0">
                            {college.logo_initials ?? college.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-medium text-zinc-900">{college.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{college.country === 'US' ? '🇺🇸' : '🇮🇳'}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-zinc-700 font-medium">{college.cutoff_score}</td>
                      <td className="px-4 py-3 text-center text-zinc-500">{college.aid_pct}%</td>
                      <td className="px-4 py-3">
                        {tier ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tc.bg} ${tc.text} ${tc.border}`}>{tier.label}</span>
                        ) : <span className="text-xs text-zinc-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isDeleting ? (
                            <div className="inline-flex items-center gap-1.5 text-xs">
                              <span className="text-zinc-600">Remove {college.name}?</span>
                              <button onClick={handleDeleteCollege} disabled={collegeDeleting} className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700 disabled:opacity-50">{collegeDeleting ? '…' : 'Remove'}</button>
                              <button onClick={() => setDeleteCollegeId(null)} className="px-2 py-1 border border-zinc-200 rounded text-xs text-zinc-600 hover:bg-zinc-50">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => openEditCollege(college)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteCollegeId(college.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showCollegeForm || editCollege) && (
        <CollegeFormModal
          title={editCollege ? 'Edit College' : 'Add College'}
          form={collegeForm} setForm={setCollegeForm} error={collegeError}
          saving={collegeSaving} onSave={handleSaveCollege}
          onClose={() => { setShowCollegeForm(false); setEditCollege(null) }}
        />
      )}
    </div>
  )
}

// ─── College Form Modal ────────────────────────────────────────────────────────

function CollegeFormModal({ title, form, setForm, error, saving, onSave, onClose }: {
  title: string; form: CollegeForm; setForm: React.Dispatch<React.SetStateAction<CollegeForm>>
  error: string; saving: boolean; onSave: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-md shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
        </div>
        {error && <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">College Name <span className="text-rose-500">*</span></label>
            <input type="text" placeholder="e.g. MIT" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Country</label>
            <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden">
              {(['US', 'IN'] as const).map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, country: c }))}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${form.country === c ? 'bg-blue-700 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                  {c === 'US' ? '🇺🇸 US' : '🇮🇳 India'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">SAT Cutoff <span className="text-rose-500">*</span></label>
              <input type="number" placeholder="1540" min={400} max={1600} value={form.cutoff_score} onChange={e => setForm(f => ({ ...f, cutoff_score: e.target.value }))} className={inputCls} />
              <p className="text-[10px] text-zinc-400 mt-0.5">400–1600</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Financial Aid %</label>
              <input type="number" placeholder="100" min={0} max={100} value={form.aid_pct} onChange={e => setForm(f => ({ ...f, aid_pct: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Logo Initials</label>
            <input type="text" placeholder="MIT" maxLength={4} value={form.logo_initials} onChange={e => setForm(f => ({ ...f, logo_initials: e.target.value.toUpperCase() }))} className={inputCls} />
            <p className="text-[10px] text-zinc-400 mt-0.5">2–4 characters. Auto-derived from name if empty.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">Cancel</button>
          <button onClick={onSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Concept Tag Modals ───────────────────────────────────────────────────────

function ConceptTagModal({ title, form, setForm, error, saving, onSubjectChange, onNameChange, onSave, onClose }: {
  title: string; form: ConceptTagForm; setForm: React.Dispatch<React.SetStateAction<ConceptTagForm>>
  error: string; saving: boolean
  onSubjectChange: (v: string) => void; onNameChange: (v: string) => void
  onSave: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-md shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
        </div>
        {error && <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Subject <span className="text-rose-500">*</span></label>
            <input type="text" placeholder="e.g. Algebra, Craft and Structure" value={form.subject} onChange={e => onSubjectChange(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Concept Name <span className="text-rose-500">*</span></label>
            <input type="text" placeholder="e.g. Linear equations and inequalities" value={form.concept_name} onChange={e => onNameChange(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Slug <span className="text-rose-500">*</span></label>
            <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={`${inputCls} font-mono text-xs`} />
            <p className="text-xs text-zinc-400 mt-1">Auto-generated. Must be unique.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
            <textarea rows={2} placeholder="Optional — brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">Cancel</button>
          <button onClick={onSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteTagModal({ tag, deleting, onDelete, onClose }: {
  tag: ConceptTag; deleting: boolean; onDelete: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-md shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Delete Concept Tag</h2>
            <p className="text-sm text-zinc-500 mt-1">Are you sure you want to delete <span className="font-medium text-zinc-900">{tag.concept_name}</span>?</p>
          </div>
        </div>
        {tag.question_count > 0 && (
          <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <strong>{tag.question_count} question{tag.question_count !== 1 ? 's' : ''}</strong> linked to this tag will lose their mapping.
          </div>
        )}
        <p className="text-xs text-zinc-400 mb-5">This is a hard delete and cannot be undone.</p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">Cancel</button>
          <button onClick={onDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Rank Prediction Panel ─────────────────────────────────────────────────────

function RankPredictionPanel({ category }: { category: ExamCategory }) {
  const [rows, setRows] = useState<RankPredictionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showAddYear, setShowAddYear] = useState(false)
  const [addForm, setAddForm] = useState<AddYearForm>({ year: '', json: '' })
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  const isJee = category.name === 'JEE'
  const jsonHint = isJee
    ? `[{"marks": 300, "percentile_low": 99.9, "percentile_high": 100}, ...]`
    : `[{"marks": 720, "rank": 1}, {"marks": 640, "rank": 2000}, ...]`

  const loadRows = useCallback(() => {
    supabase
      .from('rank_prediction_tables')
      .select('id, year, is_active, updated_at')
      .eq('exam_category_id', category.id)
      .order('year', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [category.id])

  useEffect(() => { loadRows() }, [loadRows])

  async function toggleActive(row: RankPredictionRow) {
    if (toggling) return
    setToggling(row.id)
    const now = new Date().toISOString()

    if (!row.is_active) {
      // Deactivate all others, activate this one
      await supabase
        .from('rank_prediction_tables')
        .update({ is_active: false, updated_at: now })
        .eq('exam_category_id', category.id)
        .neq('id', row.id)
      await supabase
        .from('rank_prediction_tables')
        .update({ is_active: true, updated_at: now })
        .eq('id', row.id)
      setRows(rs => rs.map(r => ({ ...r, is_active: r.id === row.id, updated_at: r.id === row.id ? now : r.updated_at })))
    } else {
      await supabase
        .from('rank_prediction_tables')
        .update({ is_active: false, updated_at: now })
        .eq('id', row.id)
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, is_active: false, updated_at: now } : r))
    }
    setToggling(null)
  }

  async function handleAddYear() {
    const yearNum = parseInt(addForm.year)
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2035) {
      setAddError('Enter a valid year (2020–2035)')
      return
    }
    let parsed: unknown
    try { parsed = JSON.parse(addForm.json) } catch {
      setAddError('Invalid JSON — check your format and try again')
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setAddError('JSON must be a non-empty array')
      return
    }
    setAddSaving(true)
    const { error } = await supabase.from('rank_prediction_tables').insert({
      exam_category_id: category.id,
      year: yearNum,
      is_active: false,
      data: parsed,
      updated_by: DEMO_SA_ID,
      updated_at: new Date().toISOString(),
    })
    setAddSaving(false)
    if (error) {
      setAddError(error.message.includes('unique') ? `Data for ${yearNum} already exists` : error.message)
      return
    }
    setShowAddYear(false)
    setAddForm({ year: '', json: '' })
    setAddError('')
    loadRows()
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Year list */}
      <div className="bg-white border border-zinc-200 rounded-md">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Rank Prediction Data</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isJee
                ? 'NTA-normalised percentile bands per marks. One year active at a time.'
                : `Marks → AIR lookup for ${category.display_name}. One year active at a time.`}
            </p>
          </div>
          <button
            onClick={() => { setAddForm({ year: '', json: '' }); setAddError(''); setShowAddYear(true) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Year
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <TrendingUp className="w-7 h-7 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No rank prediction data configured yet.</p>
            <p className="text-xs text-zinc-400 mt-1">Click "Add Year" to add the first lookup table.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {rows.map(row => (
              <div key={row.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{row.year}</p>
                  {row.updated_at && (
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {new Date(row.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {row.is_active && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                  )}
                  <button
                    onClick={() => toggleActive(row)}
                    disabled={toggling === row.id}
                    title={row.is_active ? 'Deactivate' : 'Set as active'}
                    className="shrink-0 disabled:opacity-50"
                  >
                    {row.is_active
                      ? <ToggleRight className="w-8 h-8 text-emerald-600" />
                      : <ToggleLeft className="w-8 h-8 text-zinc-300 hover:text-zinc-500" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSON format reference */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-md px-5 py-4">
        <p className="text-xs font-medium text-zinc-600 mb-1.5">Expected JSON format for {category.name}</p>
        <code className="text-xs text-zinc-500 font-mono break-all">{jsonHint}</code>
        {isJee && (
          <p className="text-xs text-zinc-400 mt-2">
            Values are shift-normalised — use a band (percentile_low + percentile_high) per marks entry. Sort marks descending.
          </p>
        )}
      </div>

      {/* Add Year slide-over */}
      {showAddYear && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddYear(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
              <h2 className="text-base font-semibold text-zinc-900">Add Rank Data — {category.display_name}</h2>
              <button onClick={() => setShowAddYear(false)} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {addError && (
                <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">{addError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Year</label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={addForm.year}
                  onChange={e => setAddForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="e.g. 2026"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Lookup Data (JSON array)</label>
                <p className="text-xs text-zinc-400 mb-1.5 font-mono break-all">{jsonHint}</p>
                <textarea
                  rows={14}
                  value={addForm.json}
                  onChange={e => { setAddForm(f => ({ ...f, json: e.target.value })); setAddError('') }}
                  placeholder={`Paste JSON array here…`}
                  className={`${inputCls} font-mono text-xs resize-none`}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setShowAddYear(false)} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">
                Cancel
              </button>
              <button
                onClick={handleAddYear}
                disabled={addSaving}
                className="px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
              >
                {addSaving ? 'Saving…' : 'Add Year'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
