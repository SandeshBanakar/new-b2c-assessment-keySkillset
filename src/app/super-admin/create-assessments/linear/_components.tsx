'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ChevronDown, Plus, X, GripVertical, ChevronRight, AlertCircle,
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TopicEntry } from '@/types'
import { DisplayConfigPreview } from '@/components/assessment-detail/DisplayConfigPreview'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Source { id: string; name: string; exam_category_id: string | null }
export interface Chapter { id: string; source_id: string; name: string; order_index: number }

// ─── Constants ────────────────────────────────────────────────────────────────

export const LANGUAGES = [
  'English', 'Kannada', 'Malayalam', 'Spanish',
  'Chinese', 'Japanese', 'Korean', 'Assamese', 'German',
]

export const TEST_TYPE_OPTIONS = [
  { value: 'FULL_TEST',    label: 'Full Test' },
  { value: 'SUBJECT_TEST', label: 'Subject Test' },
  { value: 'CHAPTER_TEST', label: 'Chapter Test' },
]

export const LEVEL_LABELS: Record<string, { l1: string; l2: string; l3: string }> = {
  FULL_TEST:    { l1: 'Subject', l2: 'Chapter', l3: 'Topic' },
  SUBJECT_TEST: { l1: 'Chapter', l2: 'Topic',   l3: '' },
  CHAPTER_TEST: { l1: 'Topic',   l2: '',         l3: '' },
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────

export function newNode(label = ''): TopicEntry {
  return { id: crypto.randomUUID(), label }
}

export function updateLabel(tree: TopicEntry[], id: string, label: string): TopicEntry[] {
  return tree.map(n =>
    n.id === id
      ? { ...n, label }
      : n.children
        ? { ...n, children: updateLabel(n.children, id, label) }
        : n
  )
}

export function removeNode(tree: TopicEntry[], id: string): TopicEntry[] {
  return tree
    .filter(n => n.id !== id)
    .map(n => n.children ? { ...n, children: removeNode(n.children, id) } : n)
}

export function addChildTo(tree: TopicEntry[], parentId: string, child: TopicEntry): TopicEntry[] {
  return tree.map(n =>
    n.id === parentId
      ? { ...n, children: [...(n.children ?? []), child] }
      : n.children
        ? { ...n, children: addChildTo(n.children, parentId, child) }
        : n
  )
}

export function sortAtRoot(tree: TopicEntry[], activeId: string, overId: string): TopicEntry[] {
  const oi = tree.findIndex(n => n.id === activeId)
  const ni = tree.findIndex(n => n.id === overId)
  return oi < 0 || ni < 0 ? tree : arrayMove(tree, oi, ni)
}

export function sortChildren(
  tree: TopicEntry[], parentId: string, activeId: string, overId: string
): TopicEntry[] {
  return tree.map(n => {
    if (n.id === parentId && n.children) {
      const oi = n.children.findIndex(c => c.id === activeId)
      const ni = n.children.findIndex(c => c.id === overId)
      return oi < 0 || ni < 0 ? n : { ...n, children: arrayMove(n.children, oi, ni) }
    }
    return n.children
      ? { ...n, children: sortChildren(n.children, parentId, activeId, overId) }
      : n
  })
}

// ─── Design primitives ────────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-zinc-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

export function ToggleRow({ label, hint, checked, onChange, disabled }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div>
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        {hint && <p className="text-xs text-zinc-400 mt-0.5">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-700 mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-500">{message}</p>
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-zinc-400">{children}</p>
}

export function inputCls(err?: string) {
  return `w-full border rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none ${err ? 'border-rose-400' : 'border-zinc-200'}`
}

export function SelectField({
  value, onChange, options, placeholder, error, disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  error?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputCls(error)} appearance-none pr-8 bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
    </div>
  )
}

// ─── Source + Chapter multi-select ───────────────────────────────────────────

export function SourceChapterPicker({
  sources, chaptersMap,
  selectedSourceIds, selectedChapterIds,
  onSourcesChange, onChaptersChange,
}: {
  sources: Source[]
  chaptersMap: Record<string, Chapter[]>
  selectedSourceIds: string[]
  selectedChapterIds: string[]
  onSourcesChange: (ids: string[]) => void
  onChaptersChange: (ids: string[]) => void
}) {
  const [openSources, setOpenSources] = useState<Set<string>>(new Set())

  function toggleSource(id: string) {
    const next = selectedSourceIds.includes(id)
      ? selectedSourceIds.filter(s => s !== id)
      : [...selectedSourceIds, id]
    onSourcesChange(next)
    if (selectedSourceIds.includes(id)) {
      const chapIds = (chaptersMap[id] ?? []).map(c => c.id)
      onChaptersChange(selectedChapterIds.filter(c => !chapIds.includes(c)))
    }
  }

  function toggleChapter(chapterId: string) {
    onChaptersChange(
      selectedChapterIds.includes(chapterId)
        ? selectedChapterIds.filter(c => c !== chapterId)
        : [...selectedChapterIds, chapterId]
    )
  }

  function toggleOpen(id: string) {
    setOpenSources(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  if (sources.length === 0) {
    return <p className="text-xs text-zinc-400">No sources available for this category.</p>
  }

  return (
    <div className="space-y-1">
      {sources.map(src => {
        const chapters = chaptersMap[src.id] ?? []
        const isChecked = selectedSourceIds.includes(src.id)
        const isOpen = openSources.has(src.id)
        return (
          <div key={src.id} className="border border-zinc-100 rounded-md overflow-hidden">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-zinc-50">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSource(src.id)}
                className="accent-blue-700 shrink-0"
              />
              <span className="flex-1 text-sm text-zinc-800">{src.name}</span>
              {chapters.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleOpen(src.id)}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
            {isOpen && chapters.length > 0 && (
              <div className="px-3 py-2 space-y-1.5 border-t border-zinc-100">
                {chapters.map(ch => (
                  <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChapterIds.includes(ch.id)}
                      onChange={() => toggleChapter(ch.id)}
                      disabled={!isChecked}
                      className="accent-blue-700"
                    />
                    <span className="text-xs text-zinc-700">{ch.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

// ─── Sortable bullet item (What You'll Get) ───────────────────────────────────

function SortableBulletItem({
  id, value, onChange, onRemove, placeholder,
}: {
  id: string; value: string; onChange: (v: string) => void
  onRemove: () => void; placeholder: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        className="cursor-grab text-zinc-300 hover:text-zinc-400 shrink-0 touch-none"
        {...attributes} {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Sortable bullet list (What You'll Get) ───────────────────────────────────

interface BulletItem { id: string; text: string }

export function SortableBulletList({
  label, hint, value, onChange,
}: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void
}) {
  const [items, setItems] = useState<BulletItem[]>(() =>
    value.length ? value.map(t => ({ id: crypto.randomUUID(), text: t }))
                 : [{ id: crypto.randomUUID(), text: '' }]
  )

  useEffect(() => {
    onChange(items.map(i => i.text))
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems(prev => {
      const oi = prev.findIndex(i => i.id === active.id)
      const ni = prev.findIndex(i => i.id === over.id)
      return arrayMove(prev, oi, ni)
    })
  }

  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-zinc-400 mb-2">{hint}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <SortableBulletItem
                key={item.id}
                id={item.id}
                value={item.text}
                onChange={t => setItems(prev => prev.map(i => i.id === item.id ? { ...i, text: t } : i))}
                onRemove={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                placeholder={`Item ${idx + 1}`}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={() => setItems(prev => [...prev, { id: crypto.randomUUID(), text: '' }])}
        className="mt-2 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  )
}

// ─── Section entry ────────────────────────────────────────────────────────────

export interface SectionEntry {
  id: string
  name: string
  questionCount: string
  durationMinutes: string
  source_ids: string[]
  chapter_ids: string[]
}

// ─── Sortable section card ────────────────────────────────────────────────────

function SortableSectionRow({
  entry, showDuration, sources, chaptersMap, onChange, onRemove,
}: {
  entry: SectionEntry
  showDuration: boolean
  sources: Source[]
  chaptersMap: Record<string, Chapter[]>
  onChange: (id: string, updates: Partial<SectionEntry>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id })
  const [open, setOpen] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="border border-zinc-200 rounded-lg overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50">
        <button
          type="button"
          className="cursor-grab text-zinc-300 hover:text-zinc-400 shrink-0 touch-none"
          {...attributes} {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={entry.name}
          onChange={e => onChange(entry.id, { name: e.target.value })}
          placeholder="Section name, e.g. Biology"
          className="flex-1 bg-transparent border-none text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none min-w-0"
        />
        <input
          type="number" min={1}
          value={entry.questionCount}
          onChange={e => onChange(entry.id, { questionCount: e.target.value })}
          placeholder="Qs"
          title="Question count"
          className="w-16 border border-zinc-200 rounded-md px-2 py-1 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-1 focus:ring-blue-700 focus:border-transparent outline-none bg-white"
        />
        {showDuration && (
          <input
            type="number" min={1}
            value={entry.durationMinutes}
            onChange={e => onChange(entry.id, { durationMinutes: e.target.value })}
            placeholder="Min"
            title="Duration in minutes"
            className="w-14 border border-zinc-200 rounded-md px-2 py-1 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-1 focus:ring-blue-700 focus:border-transparent outline-none bg-white"
          />
        )}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          title="Sources & Chapters"
          className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-4 py-3 border-t border-zinc-100 space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Sources & Chapters</p>
          <SourceChapterPicker
            sources={sources}
            chaptersMap={chaptersMap}
            selectedSourceIds={entry.source_ids}
            selectedChapterIds={entry.chapter_ids}
            onSourcesChange={ids => onChange(entry.id, { source_ids: ids })}
            onChaptersChange={ids => onChange(entry.id, { chapter_ids: ids })}
          />
        </div>
      )}
    </div>
  )
}

// ─── Sections builder ─────────────────────────────────────────────────────────

export function SectionsBuilder({
  sections, onChange,
  timerMode, navigationPolicy,
  overrideMarks, marksPerQuestion,
  sources, chaptersMap,
  error,
}: {
  sections: SectionEntry[]
  onChange: (s: SectionEntry[]) => void
  timerMode: 'FULL' | 'SECTIONAL'
  navigationPolicy: string
  overrideMarks: boolean
  marksPerQuestion: string
  sources: Source[]
  chaptersMap: Record<string, Chapter[]>
  error?: string
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const showDuration = timerMode === 'SECTIONAL' || navigationPolicy === 'SECTION_LOCKED'

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oi = sections.findIndex(s => s.id === active.id)
    const ni = sections.findIndex(s => s.id === over.id)
    onChange(arrayMove(sections, oi, ni))
  }

  function handleChange(id: string, updates: Partial<SectionEntry>) {
    onChange(sections.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const computedQ = sections.reduce((sum, s) => sum + (Number(s.questionCount) || 0), 0)
  const marksNum = Number(marksPerQuestion)
  const computedM = overrideMarks && computedQ > 0 && marksNum > 0 ? computedQ * marksNum : null

  function newSection(): SectionEntry {
    return { id: crypto.randomUUID(), name: '', questionCount: '', durationMinutes: '', source_ids: [], chapter_ids: [] }
  }

  return (
    <div className="space-y-5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map(s => (
              <SortableSectionRow
                key={s.id} entry={s}
                showDuration={showDuration}
                sources={sources}
                chaptersMap={chaptersMap}
                onChange={handleChange}
                onRemove={id => onChange(sections.filter(x => x.id !== id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-md py-6 text-center">
          <p className="text-sm text-zinc-400">No sections yet. Add a section to configure this assessment.</p>
        </div>
      )}

      <div title={sections.length >= 10 ? 'Maximum 10 sections reached' : undefined}>
        <button
          type="button"
          disabled={sections.length >= 10}
          onClick={() => sections.length < 10 && onChange([...sections, newSection()])}
          className={`flex items-center gap-1.5 text-sm transition-colors ${sections.length >= 10 ? 'text-zinc-300 cursor-not-allowed' : 'text-blue-700 hover:text-blue-800'}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Section
        </button>
      </div>

      {computedQ > 0 && (
        <div className="bg-zinc-50 border border-zinc-100 rounded-md px-4 py-3 flex items-center gap-8">
          <div>
            <p className="text-xs text-zinc-400">Total Questions</p>
            <p className="text-sm font-semibold text-zinc-900">{computedQ}</p>
          </div>
          {computedM != null && (
            <div>
              <p className="text-xs text-zinc-400">Total Marks</p>
              <p className="text-sm font-semibold text-zinc-900">{computedM}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-400">Sections</p>
            <p className="text-sm font-semibold text-zinc-900">{sections.filter(s => s.name.trim()).length}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}
    </div>
  )
}

// ─── Sortable topic row (leaf level) ─────────────────────────────────────────

function SortableTopicRow({
  node, placeholder, onLabelChange, onRemove, indent = 0,
}: {
  node: TopicEntry; placeholder: string; indent?: number
  onLabelChange: (id: string, v: string) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id })
  const pl = indent === 1 ? 'pl-4' : indent === 2 ? 'pl-8' : 'pl-0'
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 ${pl}`}
    >
      <button
        type="button"
        className="cursor-grab text-zinc-300 hover:text-zinc-400 shrink-0 touch-none"
        {...attributes} {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <input
        type="text"
        value={node.label}
        onChange={e => onLabelChange(node.id, e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-zinc-200 rounded-md px-2.5 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(node.id)}
        className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Sortable chapter row ─────────────────────────────────────────────────────

function SortableChapterRow({
  node, hasTopicsLevel, topicsOpen, indent,
  onLabelChange, onRemove, onToggleTopics,
  onAddTopic, onTopicLabelChange, onTopicRemove, onTopicDragEnd,
}: {
  node: TopicEntry; hasTopicsLevel: boolean; topicsOpen: boolean; indent: number
  onLabelChange: (id: string, v: string) => void
  onRemove: (id: string) => void
  onToggleTopics: (id: string) => void
  onAddTopic: (parentId: string) => void
  onTopicLabelChange: (id: string, v: string) => void
  onTopicRemove: (id: string) => void
  onTopicDragEnd: (containerId: string, activeId: string, overId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id })
  const pl = indent > 0 ? 'pl-4' : 'pl-0'
  const topicSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <div className={`flex items-center gap-2 ${pl}`}>
        <button
          type="button"
          className="cursor-grab text-zinc-300 hover:text-zinc-400 shrink-0 touch-none"
          {...attributes} {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={node.label}
          onChange={e => onLabelChange(node.id, e.target.value)}
          placeholder="Chapter name"
          className="flex-1 border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
        />
        {hasTopicsLevel && (
          <button
            type="button"
            onClick={() => onToggleTopics(node.id)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md border transition-colors shrink-0 ${
              topicsOpen
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            }`}
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${topicsOpen ? 'rotate-90' : ''}`} />
            Topics
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(node.id)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {hasTopicsLevel && topicsOpen && (
        <div className={`mt-2 ${indent > 0 ? 'ml-12' : 'ml-8'} space-y-1.5 border-l-2 border-zinc-100 pl-3`}>
          <DndContext
            sensors={topicSensors}
            collisionDetection={closestCenter}
            onDragEnd={e => {
              const { active, over } = e
              if (over && active.id !== over.id)
                onTopicDragEnd(`children-${node.id}`, String(active.id), String(over.id))
            }}
          >
            <SortableContext
              id={`children-${node.id}`}
              items={(node.children ?? []).map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {(node.children ?? []).map(topic => (
                <SortableTopicRow
                  key={topic.id}
                  node={topic}
                  placeholder="Topic name"
                  indent={0}
                  onLabelChange={onTopicLabelChange}
                  onRemove={onTopicRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={() => onAddTopic(node.id)}
            className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 transition-colors mt-1"
          >
            <Plus className="w-3 h-3" />
            Add topic
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Topics Covered builder ───────────────────────────────────────────────────

export function TopicsCoveredBuilder({
  testType, value, onChange,
}: {
  testType: string; value: TopicEntry[]; onChange: (v: TopicEntry[]) => void
}) {
  const levels = testType === 'FULL_TEST' ? 3 : testType === 'SUBJECT_TEST' ? 2 : 1
  const ll = LEVEL_LABELS[testType] ?? LEVEL_LABELS.FULL_TEST
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const labelChange = useCallback(
    (id: string, label: string) => onChange(updateLabel(value, id, label)),
    [value, onChange]
  )
  const removeNodeCb = useCallback(
    (id: string) => onChange(removeNode(value, id)),
    [value, onChange]
  )
  const handleTopicDragEnd = useCallback(
    (containerId: string, activeId: string, overId: string) => {
      const chapterId = containerId.replace('children-', '')
      onChange(sortChildren(value, chapterId, activeId, overId))
    },
    [value, onChange]
  )

  function toggleSubject(id: string) {
    setExpandedSubjects(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleTopics(id: string) {
    setOpenTopics(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function handleRootDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const activeContainer = (active.data.current as { sortable?: { containerId?: string } })?.sortable?.containerId
    const overContainer = (over.data.current as { sortable?: { containerId?: string } })?.sortable?.containerId
    if (!activeContainer || activeContainer !== overContainer) return

    if (activeContainer === 'root') {
      onChange(sortAtRoot(value, String(active.id), String(over.id)))
    } else {
      const parentId = activeContainer.replace('children-', '')
      onChange(sortChildren(value, parentId, String(active.id), String(over.id)))
    }
  }

  if (levels === 1) {
    return (
      <div>
        <Label>Topics Covered</Label>
        <p className="text-xs text-zinc-400 mb-2">List the topics in this chapter.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => {
          const { active, over } = e
          if (over && active.id !== over.id)
            onChange(sortAtRoot(value, String(active.id), String(over.id)))
        }}>
          <SortableContext id="root" items={value.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map(node => (
                <SortableTopicRow
                  key={node.id} node={node}
                  placeholder={`${ll.l1} name`} indent={0}
                  onLabelChange={labelChange} onRemove={removeNodeCb}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <button
          type="button"
          onClick={() => onChange([...value, newNode()])}
          className="mt-2 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {ll.l1.toLowerCase()}
        </button>
      </div>
    )
  }

  if (levels === 2) {
    return (
      <div>
        <Label>Topics Covered</Label>
        <p className="text-xs text-zinc-400 mb-2">Add chapters, then optionally expand each to add topics.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRootDragEnd}>
          <SortableContext id="root" items={value.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map(chapter => (
                <SortableChapterRow
                  key={chapter.id} node={chapter}
                  hasTopicsLevel indent={0}
                  topicsOpen={openTopics.has(chapter.id)}
                  onLabelChange={labelChange} onRemove={removeNodeCb}
                  onToggleTopics={toggleTopics}
                  onAddTopic={id => onChange(addChildTo(value, id, newNode()))}
                  onTopicLabelChange={labelChange} onTopicRemove={removeNodeCb}
                  onTopicDragEnd={handleTopicDragEnd}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <button
          type="button"
          onClick={() => onChange([...value, newNode()])}
          className="mt-2 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {ll.l1.toLowerCase()}
        </button>
      </div>
    )
  }

  return (
    <div>
      <Label>Topics Covered</Label>
      <p className="text-xs text-zinc-400 mb-3">
        Add subjects, then chapters within each, then optionally topics within each chapter.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRootDragEnd}>
        <div className="space-y-3">
          <SortableContext id="root" items={value.map(n => n.id)} strategy={verticalListSortingStrategy}>
            {value.map(subject => {
              const isOpen = expandedSubjects.has(subject.id)
              return (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  isOpen={isOpen}
                  ll={ll}
                  openTopics={openTopics}
                  onToggle={toggleSubject}
                  onLabelChange={labelChange}
                  onRemove={removeNodeCb}
                  onToggleTopics={toggleTopics}
                  onAddChapter={id => onChange(addChildTo(value, id, newNode()))}
                  onAddTopic={id => onChange(addChildTo(value, id, newNode()))}
                  onTopicLabelChange={labelChange}
                  onTopicRemove={removeNodeCb}
                  onTopicDragEnd={handleTopicDragEnd}
                  onChapterDragEnd={handleRootDragEnd}
                />
              )
            })}
          </SortableContext>
        </div>
      </DndContext>
      <button
        type="button"
        onClick={() => {
          const n = newNode()
          onChange([...value, n])
          setExpandedSubjects(prev => new Set([...prev, n.id]))
        }}
        className="mt-3 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add {ll.l1.toLowerCase()}
      </button>
    </div>
  )
}

// ─── Subject row (FULL_TEST only) ─────────────────────────────────────────────

function SubjectRow({
  subject, isOpen, ll, openTopics,
  onToggle, onLabelChange, onRemove, onToggleTopics,
  onAddChapter, onAddTopic, onTopicLabelChange, onTopicRemove,
  onTopicDragEnd, onChapterDragEnd,
}: {
  subject: TopicEntry
  isOpen: boolean
  ll: { l1: string; l2: string; l3: string }
  openTopics: Set<string>
  onToggle: (id: string) => void
  onLabelChange: (id: string, v: string) => void
  onRemove: (id: string) => void
  onToggleTopics: (id: string) => void
  onAddChapter: (subjectId: string) => void
  onAddTopic: (chapterId: string) => void
  onTopicLabelChange: (id: string, v: string) => void
  onTopicRemove: (id: string) => void
  onTopicDragEnd: (containerId: string, activeId: string, overId: string) => void
  onChapterDragEnd: (e: DragEndEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subject.id })
  const chapterSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="border border-zinc-200 rounded-md overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50">
        <button
          type="button"
          className="cursor-grab text-zinc-300 hover:text-zinc-400 shrink-0 touch-none"
          {...attributes} {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={subject.label}
          onChange={e => onLabelChange(subject.id, e.target.value)}
          placeholder={`${ll.l1} name (e.g. Physics)`}
          className="flex-1 bg-transparent border-none text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onToggle(subject.id)}
          className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors shrink-0"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(subject.id)}
          className="p-1 text-zinc-400 hover:text-rose-500 rounded transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="px-3 py-3 border-t border-zinc-100 space-y-2">
          <DndContext
            sensors={chapterSensors}
            collisionDetection={closestCenter}
            onDragEnd={onChapterDragEnd}
          >
            <SortableContext
              id={`children-${subject.id}`}
              items={(subject.children ?? []).map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {(subject.children ?? []).map(chapter => (
                <SortableChapterRow
                  key={chapter.id} node={chapter}
                  hasTopicsLevel indent={1}
                  topicsOpen={openTopics.has(chapter.id)}
                  onLabelChange={onLabelChange} onRemove={onRemove}
                  onToggleTopics={onToggleTopics}
                  onAddTopic={onAddTopic}
                  onTopicLabelChange={onTopicLabelChange}
                  onTopicRemove={onTopicRemove}
                  onTopicDragEnd={onTopicDragEnd}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={() => onAddChapter(subject.id)}
            className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 transition-colors pl-6"
          >
            <Plus className="w-3 h-3" />
            Add {ll.l2.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Preview panel ────────────────────────────────────────────────────────────

export function navLabel(policy: string) {
  if (policy === 'FREE') return 'Free Navigation'
  if (policy === 'SECTION_LOCKED') return 'Section Lock'
  return policy || '—'
}

export function AssessmentPreviewPanel({
  title, examCategoryName, testType, durationMinutes, totalQuestions, totalMarks,
  navigationPolicy, description, language, whatYoullGet, topicsCovered, sections,
}: {
  title: string; examCategoryName: string; testType: string
  durationMinutes: string; totalQuestions: string | number | null; totalMarks: string | number | null
  navigationPolicy: string; description: string; language: string
  whatYoullGet: string[]; topicsCovered: TopicEntry[]
  sections: SectionEntry[]
}) {
  function fmtDuration(mins: string) {
    const n = parseInt(mins)
    if (!n) return '—'
    const h = Math.floor(n / 60); const m = n % 60
    if (h === 0) return `${m} min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const testTypeLabel = TEST_TYPE_OPTIONS.find(o => o.value === testType)?.label ?? ''
  const qDisplay = totalQuestions != null && totalQuestions !== '' ? String(totalQuestions) : '—'
  const mDisplay = totalMarks != null && totalMarks !== '' ? String(totalMarks) : '—'
  const statCards = [
    { label: 'Duration',    value: fmtDuration(durationMinutes) },
    { label: 'Questions',   value: qDisplay },
    { label: 'Total Marks', value: mDisplay },
    { label: 'Navigation',  value: navigationPolicy ? navLabel(navigationPolicy) : '—' },
  ]
  const namedSections = sections.filter(s => s.name.trim())

  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      <div className="bg-zinc-900 px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          {examCategoryName && (
            <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {examCategoryName}
            </span>
          )}
          {testTypeLabel && (
            <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {testTypeLabel}
            </span>
          )}
          {language && (
            <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {language}
            </span>
          )}
        </div>
        <h2 className="text-base font-semibold text-white">{title || 'Assessment Title'}</h2>
      </div>

      <div className="px-6 py-5 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ label, value }) => (
            <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-md p-3">
              <p className="text-sm font-semibold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {namedSections.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Sections</p>
            <div className="flex flex-wrap gap-2">
              {namedSections.map(s => (
                <div key={s.id} className="bg-zinc-50 border border-zinc-100 rounded-md px-3 py-2 text-sm">
                  <span className="font-medium text-zinc-800">{s.name}</span>
                  {s.questionCount && <span className="text-zinc-400 ml-1.5 text-xs">{s.questionCount}Q</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <DisplayConfigPreview
          description={description || null}
          language={language || null}
          whatYoullGet={whatYoullGet.filter(Boolean)}
          topicsCovered={topicsCovered}
          testType={testType}
        />

        <div className="border border-dashed border-zinc-200 rounded-lg p-4 text-center">
          <p className="text-xs text-zinc-400">CTA shown to learners based on subscription tier</p>
        </div>
      </div>
    </div>
  )
}

// ─── Test type change modal ───────────────────────────────────────────────────

export function TestTypeChangeModal({ onConfirm, onCancel, hasSections }: {
  onConfirm: () => void; onCancel: () => void; hasSections: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">Change Assessment Length?</h3>
        <p className="text-sm text-zinc-600 mb-5">
          Changing Assessment Length will clear your Topics Covered{hasSections ? ' and Sections' : ''} configuration. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button" onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
