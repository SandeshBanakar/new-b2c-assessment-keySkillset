'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mathematics from '@tiptap/extension-mathematics'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import type { JSONContent } from '@tiptap/core'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  List, ListOrdered,
} from 'lucide-react'
import 'katex/dist/katex.min.css'

export type { JSONContent }

export function emptyDoc(): JSONContent {
  return { type: 'doc', content: [] }
}

export function isDocEmpty(doc: JSONContent | null | undefined): boolean {
  if (!doc?.content?.length) return true
  return doc.content.every((node) => {
    return node.type === 'paragraph' && (!node.content || node.content.length === 0)
  })
}

export function ensureDoc(val: unknown): JSONContent {
  if (!val) return emptyDoc()
  if (typeof val === 'object' && (val as JSONContent).type === 'doc') return val as JSONContent
  if (typeof val === 'string') {
    return val.trim() === '' ? emptyDoc() : {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: val }] }],
    }
  }
  return emptyDoc()
}

interface RichTextEditorProps {
  value: JSONContent | null | undefined
  onChange: (doc: JSONContent) => void
  minHeight?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  minHeight = '80px',
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Mathematics, Underline, Subscript, Superscript],
    content: value || emptyDoc(),
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  // Sync external value changes to editor without triggering onChange
  useEffect(() => {
    if (!editor || !value) return
    const editorJson = JSON.stringify(editor.getJSON())
    const valueJson = JSON.stringify(value)
    if (editorJson !== valueJson) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return (
      <div
        className={`border border-zinc-200 rounded-md bg-white ${className}`}
        style={{ minHeight }}
      />
    )
  }

  function ToolbarBtn({
    onClick, active, title, children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) {
    return (
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick() }}
        title={title}
        className={`p-1.5 rounded text-xs transition-colors ${
          active
            ? 'bg-blue-50 text-blue-700'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        {children}
      </button>
    )
  }

  function Divider() {
    return <span className="w-px h-4 bg-zinc-200 mx-1 shrink-0 self-center" />
  }

  const insertInlineMath = () => {
    const { from, to } = editor.state.selection
    const selected = editor.state.doc.textBetween(from, to)
    if (selected) {
      editor.chain().focus().deleteSelection().insertContent(`$${selected}$`).run()
    } else {
      editor.chain().focus().insertContent('$').run()
    }
  }

  const insertBlockMath = () => {
    editor.chain().focus().insertContent('$$').run()
  }

  return (
    <div
      className={`border border-zinc-200 rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-zinc-200 bg-zinc-50 flex-wrap">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          title="Subscript"
        >
          <SubscriptIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          title="Superscript"
        >
          <SuperscriptIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={insertInlineMath} title="Inline math — type $expression$">
          <span className="font-mono text-[11px] font-medium">$x$</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={insertBlockMath} title="Block math — type $$expression$$">
          <span className="font-mono text-[11px] font-medium">$$x$$</span>
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <div
        style={{ minHeight }}
        className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-zinc-900 [&_.ProseMirror_p]:my-0.5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_li]:my-0.5"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
