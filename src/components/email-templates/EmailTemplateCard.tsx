import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'

import type { EmailTemplateDefinition, TenantEmailSlug } from '@/lib/email-templates/types'

export default function EmailTemplateCard({
  tenantSlug,
  template,
}: {
  tenantSlug: TenantEmailSlug
  template: EmailTemplateDefinition
}) {
  return (
    <Link
      href={`/email-templates/${tenantSlug}/${template.id}`}
      className="group block rounded-md border border-zinc-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{template.name}</p>
            <p className="text-xs text-zinc-500">{template.recipient}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" />
      </div>

      <div className="mt-4 space-y-2 text-sm text-zinc-600">
        <p><span className="font-medium text-zinc-800">Trigger:</span> {template.triggerEvent}</p>
        <p><span className="font-medium text-zinc-800">Applicability:</span> {template.featureApplicability === 'ALL' ? 'All tenants' : template.featureApplicability === 'FULL_CREATOR' ? 'Full Creator only' : 'Run Only only'}</p>
        <p><span className="font-medium text-zinc-800">CTA:</span> {template.primaryCtaStyle}</p>
      </div>
    </Link>
  )
}
