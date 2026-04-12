'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { TopicEntry } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisplayConfigPreviewProps {
  description?: string | null
  language?: string | null
  whatYoullGet?: string[]
  topicsCovered?: TopicEntry[]
  /** DB value: 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST'. Used to label accordion levels. */
  testType?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Infer render depth from the data itself so callers don't need to pass testType */
function inferDepth(items: TopicEntry[]): 1 | 2 | 3 {
  if (!items.length) return 1
  const hasChildren = items.some(n => n.children?.length)
  if (!hasChildren) return 1
  const hasGrandchildren = items.some(n => n.children?.some(c => c.children?.length))
  return hasGrandchildren ? 3 : 2
}

// ─── Accordion: Topics Covered (read-only) ────────────────────────────────────

function TopicsAccordion({ items, testType }: { items: TopicEntry[]; testType?: string }) {
  const depth = testType === 'FULL_TEST' ? 3 : testType === 'SUBJECT_TEST' ? 2 : testType === 'CHAPTER_TEST' ? 1 : inferDepth(items)

  // CHAPTER_TEST: flat bullet list, no accordion
  if (depth === 1) {
    if (!items.length) return <p className="text-sm italic text-zinc-400">No topics added yet.</p>
    return (
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-zinc-600">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
            {item.label || <span className="italic text-zinc-400">Untitled topic</span>}
          </li>
        ))}
      </ul>
    )
  }

  // SUBJECT_TEST (2-level) or FULL_TEST (3-level): accordion
  return <AccordionList items={items} depth={depth} />
}

function AccordionList({ items, depth }: { items: TopicEntry[]; depth: 2 | 3 }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!items.length) return <p className="text-sm italic text-zinc-400">No topics added yet.</p>

  return (
    <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-md overflow-hidden">
      {items.map(item => {
        const isOpen = openIds.has(item.id)
        const hasChildren = (item.children?.length ?? 0) > 0
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => hasChildren && toggle(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left bg-white transition-colors ${hasChildren ? 'hover:bg-zinc-50 cursor-pointer' : 'cursor-default'}`}
            >
              <span className="text-sm font-medium text-zinc-900">
                {item.label || <span className="italic text-zinc-400 font-normal">Untitled</span>}
              </span>
              {hasChildren && (
                isOpen
                  ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
              )}
            </button>

            {isOpen && hasChildren && (
              <div className="px-4 pb-3 bg-white">
                {depth === 3 ? (
                  // Chapter list under subject
                  <div className="space-y-2 pl-2 border-l-2 border-zinc-100">
                    {(item.children ?? []).map(chapter => (
                      <div key={chapter.id}>
                        <p className="text-sm font-medium text-zinc-700 py-1">
                          {chapter.label || <span className="italic text-zinc-400 font-normal">Untitled chapter</span>}
                        </p>
                        {(chapter.children?.length ?? 0) > 0 && (
                          <ul className="ml-3 space-y-1">
                            {(chapter.children ?? []).map(topic => (
                              <li key={topic.id} className="flex items-start gap-2 text-sm text-zinc-500">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-200 shrink-0" />
                                {topic.label || <span className="italic">Untitled topic</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Topics directly under chapter (SUBJECT_TEST)
                  <ul className="space-y-1.5 pl-2">
                    {(item.children ?? []).map(topic => (
                      <li key={topic.id} className="flex items-start gap-2 text-sm text-zinc-500">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                        {topic.label || <span className="italic">Untitled topic</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DisplayConfigPreview({
  description,
  language,
  whatYoullGet = [],
  topicsCovered = [],
  testType,
}: DisplayConfigPreviewProps) {
  const filledItems = whatYoullGet.filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
      )}

      {/* What You'll Get */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <h3 className="text-base font-medium text-zinc-900 mb-4">What you&apos;ll get</h3>
        {filledItems.length > 0 ? (
          <ul className="space-y-3">
            {filledItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm text-zinc-700">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-zinc-400">No benefits added yet.</p>
        )}
      </div>

      {/* Topics Covered */}
      <div className="bg-white shadow-sm rounded-md p-6">
        <h3 className="text-base font-medium text-zinc-900 mb-4">Topics Covered</h3>
        <TopicsAccordion items={topicsCovered} testType={testType} />
      </div>
    </div>
  )
}
