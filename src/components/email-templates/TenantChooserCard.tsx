import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2 } from 'lucide-react'

import type { TenantEmailPreviewProfile } from '@/lib/email-templates/types'

export default function TenantChooserCard({
  tenant,
}: {
  tenant: TenantEmailPreviewProfile
}) {
  return (
    <Link
      href={`/email-templates/${tenant.slug}`}
      className="group block rounded-md border border-zinc-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-md text-white ${tenant.accentClass}`}>
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{tenant.displayName}</p>
            <p className="text-xs text-zinc-500">{tenant.tenantId}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" />
      </div>

      <div className="mt-4">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tenant.badgeClass}`}>
          <BadgeCheck className="h-3 w-3" />
          {tenant.featureMode === 'FULL_CREATOR' ? 'Full Creator' : 'Run Only'}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-600">{tenant.description}</p>
    </Link>
  )
}
