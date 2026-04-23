import Link from 'next/link'
import { ArrowLeft, Layers3 } from 'lucide-react'
import { notFound } from 'next/navigation'

import EmailTemplateCard from '@/components/email-templates/EmailTemplateCard'
import { getTemplatesForTenant, TENANT_EMAIL_PREVIEW_PROFILES } from '@/lib/email-templates/data'
import type { TenantEmailSlug } from '@/lib/email-templates/types'

export default async function TenantEmailTemplatesPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  if (!(tenant in TENANT_EMAIL_PREVIEW_PROFILES)) {
    notFound()
  }

  const tenantSlug = tenant as TenantEmailSlug
  const tenantProfile = TENANT_EMAIL_PREVIEW_PROFILES[tenantSlug]
  const templates = getTemplatesForTenant(tenantSlug)

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/email-templates" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Tenant Chooser
        </Link>

        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${tenantProfile.badgeClass}`}>
                {tenantProfile.featureMode === 'FULL_CREATOR' ? 'Full Creator tenant' : tenantProfile.featureMode === 'RUN_ONLY' ? 'Run Only tenant' : 'B2C End User Emails'}
              </span>
              <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
                {tenantProfile.featureMode === 'B2C_END_USER' ? `${tenantProfile.displayName} - B2C End User Emails` : `${tenantProfile.displayName} - Client Admin Emails`}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Review each trigger, inspect the token contract, and open the template detail page to preview the raw HTML in an iframe.
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              <p className="font-medium text-zinc-900">Branding preview</p>
              <p className="mt-1">Company name: {tenantProfile.companyName}</p>
              <p>Logo source: {tenantProfile.companyLogoUrl ? 'Tenant asset' : 'keySkillset fallback asset'}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          {templates.map((template) => (
            <EmailTemplateCard key={template.id} tenantSlug={tenantSlug} template={template} />
          ))}
        </section>

        <section className="mt-8 rounded-md border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-semibold text-zinc-900">Template inventory for this tenant</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Trigger</th>
                  <th className="px-3 py-2">Recipient</th>
                  <th className="px-3 py-2">Applicability</th>
                  <th className="px-3 py-2">CTA style</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-3 py-3 font-medium text-zinc-900">{template.name}</td>
                    <td className="px-3 py-3 text-zinc-600">{template.triggerEvent}</td>
                    <td className="px-3 py-3 text-zinc-600">{template.recipient}</td>
                    <td className="px-3 py-3 text-zinc-600">
                      {template.featureApplicability === 'ALL'
                        ? 'All tenants'
                        : template.featureApplicability === 'FULL_CREATOR'
                          ? 'Full Creator only'
                          : template.featureApplicability === 'RUN_ONLY'
                            ? 'Run Only only'
                            : 'B2C End Users'}
                    </td>
                    <td className="px-3 py-3 text-zinc-600">{template.primaryCtaStyle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
