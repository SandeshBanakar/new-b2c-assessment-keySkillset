/**
 * tiptapToPlainText
 * Walks a Tiptap JSONB doc tree and extracts concatenated plain text.
 * Handles both legacy plain strings and the Tiptap doc format produced by KSS-DB-018.
 * No editor instance required — pure function, safe to call in any render context.
 */
export function tiptapToPlainText(doc: unknown): string {
  if (doc === null || doc === undefined) return '';
  if (typeof doc === 'string') return doc;
  if (typeof doc !== 'object') return String(doc);

  const node = doc as { type?: string; text?: string; content?: unknown[] };

  if (node.text) return node.text;

  if (Array.isArray(node.content)) {
    return node.content
      .map(tiptapToPlainText)
      .join(node.type === 'paragraph' ? '\n' : '');
  }

  return '';
}
