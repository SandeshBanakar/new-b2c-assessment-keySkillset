'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronDown, Plus, X, Construction,
  GripVertical, ChevronRight,
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
import { supabase } from '@/lib/supabase/client'
import type { TopicEntry, DisplayConfig, AssessmentConfig } from '@/types'
import { DisplayConfigPreview } from '@/components/assessment-detail/DisplayConfigPreview'

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  'English', 'Kannada', 'Malayalam', 'Spanish',
  'Chinese', 'Japanese', 'Korean', 'Assamese', 'German',
]

const NAV_POLICY_OPTIONS = [
  { value: 'FREE',           label: 'Free Navigation' },
  { value: 'LINEAR',         label: 'Adaptive' },
  { value: 'SECTION_LOCKED', label: 'Section Lock' },
]

const TEST_TYPE_OPTIONS = [
  { value: 'FULL_TEST',    label: 'Full Test' },
  { value: 'SUBJECT_TEST', label: 'Subject Test' },
  { value: 'CHAPTER_TEST', label: 'Chapter Test' },
]

const LEVEL_LABELS: Record<string, { l1: string; l2: string; l3: string }> = {
  FULL_TEST:    { l1: 'Subject', l2: 'Chapter', l3: 'Topic' },
  SUBJECT_TEST: { l1: 'Chapter', l2: 'Topic',   l3: '' },
  CHAPTER_TEST: { l1: 'Topic',   l2: '',         l3: '' },
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function newNode(label = ''): TopicEntry {
  return { id: crypto.randomUUID(), label }
}

function updateLabel(tree: TopicEntry[], id: string, label: string): TopicEntry[] {
  return tree.map(n =>
    n.id === id
      ? { ...n, label }
      : n.children
        ? { ...n, children: updateLabel(n.children, id, label) }
        : n
  )
}

function removeNode(tree: TopicEntry[], id: string): TopicEntry[] {
  return tree
    .filter(n => n.id !== id)
    .map(n => n.children ? { ...n, children: removeNode(n.children, id) } : n)
}

function addChildTo(tree: TopicEntry[], parentId: string, child: TopicEntry): TopicEntry[] {
  return tree.map(n =>
    n.id === parentId
      ? { ...n, children: [...(n.children ?? []), child] }
      : n.children
        ? { ...n, children: addChildTo(n.children, parentId, child) }
        : n
  )
}

function sortAtRoot(tree: TopicEntry[], activeId: string, overId: string): TopicEntry[] {
  const oi = tree.findIndex(n => n.id === activeId)
  const ni = tree.findIndex(n => n.id === overId)
  return oi < 0 || ni < 0 ? tree : arrayMove(tree, oi, ni)
}

function sortChildren(
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

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-700 mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-500">{message}</p>
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-zinc-400">{children}</p>
}

function inputCls(err?: string) {
  return `w-full border rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none ${err ? 'border-rose-400' : 'border-zinc-200'}`
}

function SelectField({
  value, onChange, options, placeholder, error,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  error?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls(error)} appearance-none pr-8 bg-white`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
    </div>
  )
}

function SectionCard({ title, description, children }: {
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

function SortableBulletList({
  label, hint, value, onChange,
}: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void
}) {
  const [items, setItems] = useState<BulletItem[]>(() =>
    value.length ? value.map(t => ({ id: crypto.randomUUID(), text: t }))
                 : [{ id: crypto.randomUUID(), text: '' }]
  )

  const prevItems = items
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

function TopicsCoveredBuilder({
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

  // ── CHAPTER_TEST: flat list ──────────────────────────────────────────────

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

  // ── SUBJECT_TEST: 2-level ────────────────────────────────────────────────

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

  // ── FULL_TEST: 3-level ───────────────────────────────────────────────────

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
                  onAddChapter={id => {
                    onChange(addChildTo(value, id, newNode()))
                  }}
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

function navLabel(policy: string) {
  return NAV_POLICY_OPTIONS.find(o => o.value === policy)?.label ?? '—'
}

function AssessmentPreviewPanel({
  title, examCategoryName, testType, durationMinutes, totalQuestions, totalMarks,
  navigationPolicy, description, language, whatYoullGet, topicsCovered,
}: {
  title: string; examCategoryName: string; testType: string
  durationMinutes: string; totalQuestions: string; totalMarks: string
  navigationPolicy: string; description: string; language: string
  whatYoullGet: string[]; topicsCovered: TopicEntry[]
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
  const statCards = [
    { label: 'Duration',    value: fmtDuration(durationMinutes) },
    { label: 'Questions',   value: totalQuestions || '—' },
    { label: 'Total Marks', value: totalMarks || '—' },
    { label: 'Navigation',  value: navigationPolicy ? navLabel(navigationPolicy) : '—' },
  ]

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

function TestTypeChangeModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">Change Assessment Length?</h3>
        <p className="text-sm text-zinc-600 mb-5">
          Changing Assessment Length will clear your Topics Covered entries. This cannot be undone.
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

// ─── Main page ────────────────────────────────────────────────────────────────

interface ExamCategory { id: string; name: string }

export default function CreateLinearAssessmentPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  // Basic Info
  const [title, setTitle] = useState('')
  const [testType, setTestType] = useState('')
  const [examCategoryId, setExamCategoryId] = useState('')
  const [duration, setDuration] = useState('')
  const [navigationPolicy, setNavigationPolicy] = useState('')
  const [totalQuestions, setTotalQuestions] = useState('')
  const [totalMarks, setTotalMarks] = useState('')

  // Display Config
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('English')
  const [whatYoullGet, setWhatYoullGet] = useState<string[]>([''])
  const [topicsCovered, setTopicsCovered] = useState<TopicEntry[]>([])

  // Test type change modal
  const [pendingTestType, setPendingTestType] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('exam_categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data as ExamCategory[])
    })
  }, [])

  const examCategoryName = categories.find(c => c.id === examCategoryId)?.name ?? ''

  function handleTestTypeChange(val: string) {
    if (topicsCovered.length > 0 && val !== testType) {
      setPendingTestType(val)
    } else {
      setTestType(val)
    }
  }

  function confirmTestTypeChange() {
    if (pendingTestType) {
      setTestType(pendingTestType)
      setTopicsCovered([])
      setPendingTestType(null)
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Assessment Title is required.'
    if (!testType) e.testType = 'Assessment Length is required.'
    if (!examCategoryId) e.examCategoryId = 'Category is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const displayConfig: DisplayConfig = {
      what_youll_get: whatYoullGet.filter(Boolean),
      topics_covered: topicsCovered,
      language: language || 'English',
    }

    const assessmentConfig: AssessmentConfig = {
      duration_minutes:  duration        ? Number(duration)        : null,
      navigation_policy: (navigationPolicy as AssessmentConfig['navigation_policy']) || null,
      total_questions:   totalQuestions  ? Number(totalQuestions)  : null,
      total_marks:       totalMarks      ? Number(totalMarks)      : null,
    }

    try {
      const { error } = await supabase.from('assessment_items').insert({
        title: title.trim(),
        exam_category_id: examCategoryId,
        test_type: testType,
        status: 'INACTIVE',
        assessment_type: 'LINEAR',
        source: 'PLATFORM',
        description: description.trim() || null,
        display_config: displayConfig,
        assessment_config: assessmentConfig,
        audience_type: 'B2C_ONLY',
        visibility_scope: 'GLOBAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      router.push('/super-admin/create-assessments')
    } catch (err) {
      console.error('Failed to create assessment:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      {pendingTestType && (
        <TestTypeChangeModal
          onConfirm={confirmTestTypeChange}
          onCancel={() => setPendingTestType(null)}
        />
      )}

      <button
        onClick={() => router.push('/super-admin/create-assessments')}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Create Assessments
      </button>

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-zinc-900">New Linear Assessment</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Create assessments with fixed sections and also configure what gets displayed to end user in the Overview tab
        </p>
      </div>

      {/* Edit / Preview segmented control */}
      <div className="inline-flex items-center bg-zinc-100 border border-zinc-200 rounded-md p-0.5 mb-6">
        {(['edit', 'preview'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-sm rounded-[5px] transition-all ${
              mode === m
                ? 'bg-white shadow-sm font-medium text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {m === 'edit' ? 'Edit Mode' : 'Preview Mode'}
          </button>
        ))}
      </div>

      {mode === 'preview' ? (
        <AssessmentPreviewPanel
          title={title}
          examCategoryName={examCategoryName}
          testType={testType}
          durationMinutes={duration}
          totalQuestions={totalQuestions}
          totalMarks={totalMarks}
          navigationPolicy={navigationPolicy}
          description={description}
          language={language}
          whatYoullGet={whatYoullGet}
          topicsCovered={topicsCovered}
        />
      ) : (
        <div className="space-y-6">
          {/* Basic Info */}
          <SectionCard
            title="Basic Info"
            description="Core details used to identify, classify, and configure this assessment."
          >
            <div>
              <Label required>Assessment Title</Label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. NEET Biology Full Mock — Series 1"
                className={inputCls(errors.title)}
              />
              <FieldError message={errors.title} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Assessment Length</Label>
                <SelectField
                  value={testType}
                  onChange={handleTestTypeChange}
                  placeholder="Select length"
                  error={errors.testType}
                  options={TEST_TYPE_OPTIONS}
                />
                <FieldError message={errors.testType} />
              </div>
              <div>
                <Label required>Category</Label>
                <SelectField
                  value={examCategoryId}
                  onChange={setExamCategoryId}
                  placeholder="Select category"
                  error={errors.examCategoryId}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
                <FieldError message={errors.examCategoryId} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <input
                  type="number" min={1} value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 180" className={inputCls()}
                />
              </div>
              <div>
                <Label>Navigation Policy</Label>
                <SelectField
                  value={navigationPolicy}
                  onChange={setNavigationPolicy}
                  placeholder="Select policy"
                  options={NAV_POLICY_OPTIONS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Questions</Label>
                <input
                  type="number" min={1} value={totalQuestions}
                  onChange={e => setTotalQuestions(e.target.value)}
                  placeholder="e.g. 180" className={inputCls()}
                />
                <FieldHint>Will sync automatically once Sections & Question Pools are configured.</FieldHint>
              </div>
              <div>
                <Label>Total Marks</Label>
                <input
                  type="number" min={1} value={totalMarks}
                  onChange={e => setTotalMarks(e.target.value)}
                  placeholder="e.g. 720" className={inputCls()}
                />
                <FieldHint>Will sync automatically once Sections & Question Pools are configured.</FieldHint>
              </div>
            </div>
          </SectionCard>

          {/* Display Config */}
          <SectionCard
            title="Display Config"
            description="Content shown on the assessment detail page for learners. Switch to Preview Mode to see how this renders."
          >
            <div>
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Briefly describe what this assessment covers and who it's for."
                className={`${inputCls()} resize-none`}
              />
            </div>

            <div>
              <Label>Language</Label>
              <SelectField
                value={language}
                onChange={setLanguage}
                placeholder="Select language"
                options={LANGUAGES.map(l => ({ value: l, label: l }))}
              />
            </div>

            <SortableBulletList
              label="What You'll Get"
              hint="Highlight key benefits or features of this assessment."
              value={whatYoullGet}
              onChange={setWhatYoullGet}
            />

            {testType ? (
              <TopicsCoveredBuilder
                testType={testType}
                value={topicsCovered}
                onChange={setTopicsCovered}
              />
            ) : (
              <div>
                <Label>Topics Covered</Label>
                <p className="text-xs text-zinc-400 mt-1">
                  Select an Assessment Length above to configure topics.
                </p>
              </div>
            )}
          </SectionCard>

          {/* Coming soon */}
          <div className="bg-white border border-zinc-200 rounded-lg">
            <div className="px-6 py-4 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-900">Sections & Question Pools</p>
            </div>
            <div className="px-6 py-10 flex flex-col items-center text-center">
              <Construction className="w-8 h-8 text-zinc-200 mb-3" />
              <p className="text-sm font-medium text-zinc-500">Coming Soon</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Section & question pool configuration will be available in an upcoming release.
              </p>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4">
            <button
              type="button"
              onClick={() => router.push('/super-admin/create-assessments')}
              className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
