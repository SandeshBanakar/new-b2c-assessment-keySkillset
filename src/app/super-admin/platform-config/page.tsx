'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Plus, Pencil, Trash2, Search, Tag, X,
  TriangleAlert as AlertTriangle, Settings2, GraduationCap,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Save, Clock,
} from 'lucide-react'

const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamCategory { id: string; name: string }

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

interface AnalyticsConfig {
  show_college_ladder: boolean
  show_pacing_preview: boolean
  show_mistake_taxonomy_preview: boolean
}

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
}

function computeTierForScore(cutoff: number, bands: TierBand[]): TierBand | null {
  return [...bands].sort((a, b) => b.min_score - a.min_score).find(b => cutoff >= b.min_score) ?? null
}

const inputCls = 'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlatformConfigPage() {
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([])
  const [selectedCatId, setSelectedCatId] = useState<string>('')
  const [activeSubTab, setActiveSubTab] = useState<'concept-tags' | 'analytics-display'>('concept-tags')
  const [loadingCats, setLoadingCats] = useState(true)

  useEffect(() => {
    supabase.from('exam_categories').select('id, name').order('name').then(({ data }) => {
      const cats = data ?? []
      setExamCategories(cats)
      if (cats.length > 0) setSelectedCatId(cats[0].id)
      setLoadingCats(false)
    })
  }, [])

  const selectedCat = examCategories.find(c => c.id === selectedCatId)

  if (loadingCats) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Platform Config</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage concept tags, analytics display, and exam-specific settings.</p>
      </div>

      {/* Exam Category Tabs */}
      <div className="flex items-center gap-1 mb-0 overflow-x-auto pb-0 border-b border-zinc-200">
        {examCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCatId(cat.id); setActiveSubTab('concept-tags') }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              selectedCatId === cat.id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {selectedCat && (
        <>
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 mt-4 mb-5">
            {(['concept-tags', 'analytics-display'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeSubTab === tab
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {tab === 'concept-tags' ? <><Tag className="w-3.5 h-3.5" /> Concept Tags</> : <><Settings2 className="w-3.5 h-3.5" /> Analytics Display</>}
              </button>
            ))}
          </div>

          {activeSubTab === 'concept-tags' && (
            <ConceptTagsPanel categoryName={selectedCat.name} />
          )}
          {activeSubTab === 'analytics-display' && (
            <AnalyticsDisplayPanel category={selectedCat} />
          )}
        </>
      )}
    </div>
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

  const loadTags = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('concept_tags')
      .select('*', { count: 'exact' })
      .eq('exam_category', categoryName)
      .order('subject').order('concept_name')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (subjectFilter) query = query.ilike('subject', `%${subjectFilter}%`)
    if (search) query = query.ilike('concept_name', `%${search}%`)

    const { data, count } = await query
    if (!data) { setLoading(false); return }

    const tagIds = data.map(t => t.id)
    let qcounts: Record<string, number> = {}
    if (tagIds.length > 0) {
      const { data: mappings } = await supabase
        .from('question_concept_mappings').select('concept_tag_id').in('concept_tag_id', tagIds)
      if (mappings) {
        for (const m of mappings) qcounts[m.concept_tag_id] = (qcounts[m.concept_tag_id] ?? 0) + 1
      }
    }

    setTags(data.map(t => ({ ...t, question_count: qcounts[t.id] ?? 0 })))
    setTotal(count ?? 0)
    setLoading(false)
  }, [categoryName, page, subjectFilter, search])

  useEffect(() => { setPage(0); setSearch(''); setSubjectFilter('') }, [categoryName])
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
    await supabase.from('concept_tags').delete().eq('id', deleteTag.id)
    setDeleting(false); setDeleteTag(null); loadTags()
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
        <p className="text-sm font-medium text-zinc-700">Analytics Display configuration for {category.name}</p>
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
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>({
    show_college_ladder: true, show_pacing_preview: true, show_mistake_taxonomy_preview: true,
  })
  const [loading, setLoading] = useState(true)
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

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
      setLoading(true)
      const [bandsRes, collegesRes, configRes] = await Promise.all([
        supabase.from('sat_tier_bands').select('*').order('display_order'),
        supabase.from('sat_colleges').select('*').order('cutoff_score', { ascending: false }),
        supabase.from('platform_analytics_config').select('config_key, config_value').eq('exam_category_id', categoryId),
      ])
      setTierBands(bandsRes.data ?? [])
      setColleges(collegesRes.data ?? [])
      if (configRes.data) {
        const map: Partial<AnalyticsConfig> = {}
        for (const row of configRes.data) {
          (map as Record<string, boolean>)[row.config_key] = row.config_value
        }
        setAnalyticsConfig(c => ({ ...c, ...map }))
      }
      setLoading(false)
    }
    load()
  }, [categoryId])

  // ── Section Visibility ──────────────────────────────────────────────────────

  async function saveConfig() {
    setConfigSaving(true)
    const upserts = (Object.entries(analyticsConfig) as [string, boolean][]).map(([key, val]) => ({
      exam_category_id: categoryId, config_key: key, config_value: val,
      updated_by: DEMO_SA_ID, updated_at: new Date().toISOString(),
    }))
    await supabase.from('platform_analytics_config').upsert(upserts, { onConflict: 'exam_category_id,config_key' })
    setConfigSaving(false); setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  // ── Tier Bands Edit ─────────────────────────────────────────────────────────

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

  // ── College CRUD ────────────────────────────────────────────────────────────

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

      {/* Section Visibility */}
      <div className="bg-white border border-zinc-200 rounded-md">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Section Visibility</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Control which analytics sections appear for SAT students.</p>
          </div>
          <button
            onClick={saveConfig} disabled={configSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors shrink-0"
          >
            {configSaved ? <><span className="w-3.5 h-3.5 text-emerald-300">✓</span> Saved</> : <><Save className="w-3.5 h-3.5" /> {configSaving ? 'Saving…' : 'Save'}</>}
          </button>
        </div>
        <div className="divide-y divide-zinc-100">
          {([ ['show_college_ladder', 'College Ladder', 'Show college eligibility ladder on full test analytics'],
              ['show_pacing_preview', 'Pacing (Preview)', 'Show pacing chart with demo data — "Preview" badge shown to students'],
              ['show_mistake_taxonomy_preview', 'Mistake Taxonomy (Preview)', 'Show mistake donut with demo data — "Preview" badge shown to students'],
          ] as [keyof AnalyticsConfig, string, string][]).map(([key, label, desc]) => (
            <div key={key} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
              <button onClick={() => setAnalyticsConfig(c => ({ ...c, [key]: !c[key] }))} className="shrink-0">
                {analyticsConfig[key]
                  ? <ToggleRight className="w-8 h-8 text-blue-700" />
                  : <ToggleLeft className="w-8 h-8 text-zinc-300" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Bands */}
      <div className="bg-white border border-zinc-200 rounded-md">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Tier Bands</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Score ranges used to group colleges on the ladder. Editing a band re-buckets all colleges automatically.</p>
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
            <p className="text-xs text-zinc-500 mt-0.5">Colleges shown on the student analytics ladder. Sorted by cutoff score (highest first).</p>
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
            <p className="text-sm text-zinc-500">No colleges yet. Run KSS-DB-042 migration or add one above.</p>
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
                      <td className="px-4 py-3 text-center text-sm">
                        {college.country === 'US' ? '🇺🇸' : '🇮🇳'}
                      </td>
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
            <p className="text-[10px] text-zinc-400 mt-0.5">2–4 characters shown in the badge. Auto-derived from name if empty.</p>
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
