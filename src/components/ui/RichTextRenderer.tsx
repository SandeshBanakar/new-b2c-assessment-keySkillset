'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mathematics from '@tiptap/extension-mathematics'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import type { JSONContent } from '@tiptap/core'
import { useEffect } from 'react'
import 'katex/dist/katex.min.css'

interface RichTextRendererProps {
  content: JSONContent | null | undefined
  className?: string
}

export default function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [StarterKit, Mathematics, Underline, Subscript, Superscript],
    content: content || { type: 'doc', content: [] },
  })

  useEffect(() => {
    if (!editor || !content) return
    const curr = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(content)
    if (curr !== next) editor.commands.setContent(content, { emitUpdate: false })
  }, [editor, content])

  if (!editor) return null

  return (
    <div
      className={`
        [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-zinc-900
        [&_.ProseMirror_p]:my-0.5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5
        [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_li]:my-0.5
        ${className}
      `}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
