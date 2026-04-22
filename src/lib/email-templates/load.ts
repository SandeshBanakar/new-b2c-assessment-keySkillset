import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { EmailTemplateId } from '@/lib/email-templates/types'
import { getEmailTemplateDefinition } from '@/lib/email-templates/data'

const TEMPLATE_ROOT = path.join(process.cwd(), 'src', 'email-templates', 'html')

export async function loadEmailTemplateHtml(templateId: EmailTemplateId): Promise<string> {
  const definition = getEmailTemplateDefinition(templateId)
  if (!definition) {
    throw new Error(`Unknown email template: ${templateId}`)
  }

  return readFile(path.join(TEMPLATE_ROOT, definition.filename), 'utf8')
}
