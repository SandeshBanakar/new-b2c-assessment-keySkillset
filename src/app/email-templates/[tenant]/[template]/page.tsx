import Link from 'next/link'
import { ArrowLeft, ChevronLeft, FileCode2, MailCheck, ShieldCheck } from 'lucide-react'
import { notFound } from 'next/navigation'

import {
  buildPreviewPayload,
  getEmailTemplateDefinition,
  getTemplatesForTenant,
  TENANT_EMAIL_PREVIEW_PROFILES,
} from '@/lib/email-templates/data'
import { loadEmailTemplateHtml } from '@/lib/email-templates/load'
import { buildEmailTemplateTextPreview, renderEmailTemplateHtml } from '@/lib/email-templates/render'
import type { EmailTemplateId, TenantEmailSlug } from '@/lib/email-templates/types'

export default async function EmailTemplateDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; template: string }>
}) {
  const { tenant, template } = await params
  if (!(tenant in TENANT_EMAIL_PREVIEW_PROFILES)) {
    notFound()
  }

  const tenantSlug = tenant as TenantEmailSlug
  const tenantProfile = TENANT_EMAIL_PREVIEW_PROFILES[tenantSlug]
  const availableTemplates = getTemplatesForTenant(tenantSlug)
  const templateDefinition = getEmailTemplateDefinition(template as EmailTemplateId)

  if (!templateDefinition || !availableTemplates.some((item) => item.id === templateDefinition.id)) {
    notFound()
  }

  const payload = buildPreviewPayload(tenantSlug, templateDefinition.id)
  const templateHtml = await loadEmailTemplateHtml(templateDefinition.id)
  const renderedHtml = renderEmailTemplateHtml(templateHtml, payload)
  const textFallback = buildEmailTemplateTextPreview(payload)

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
<Link href={`/email-templates/${tenantSlug}`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
          <ChevronLeft className="w-4 h-4" />
          {tenantSlug === 'keyskillset' ? 'Back to B2C End User Emails'
          : tenantSlug === 'b2b-learner' ? 'Back to B2B End User Emails'
          : 'Back to Client Admin Emails'}
        </Link>
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${tenantProfile.badgeClass}`}>
            {tenantProfile.displayName}
          </span>
        </div>

        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-blue-700">
                {tenantProfile.featureMode === 'B2C_END_USER' ? 'B2C End User Email Detail'
                  : tenantProfile.featureMode === 'B2B_LEARNER' ? 'B2B Learner Email Detail — Salesforce Template'
                  : 'Client Admin Email Detail'}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{templateDefinition.name}</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{templateDefinition.summary}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              <p><span className="font-medium text-zinc-900">Raw file:</span> {templateDefinition.filename}</p>
              <p className="mt-1"><span className="font-medium text-zinc-900">Subject:</span> {templateDefinition.subject}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6">
          <div className="space-y-6">
            <div className="rounded-md border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-semibold text-zinc-900">Trigger context</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                <p><span className="font-medium text-zinc-900">Recipient:</span> {templateDefinition.recipient}</p>
                <p><span className="font-medium text-zinc-900">Trigger event:</span> {templateDefinition.triggerEvent}</p>
                <p><span className="font-medium text-zinc-900">When this fires:</span> {templateDefinition.whenTriggered}</p>
                <p><span className="font-medium text-zinc-900">CTA style:</span> {templateDefinition.primaryCtaStyle}</p>
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-semibold text-zinc-900">Dynamic variables</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {templateDefinition.variables.map((variable) => (
                  <span key={variable} className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {variable}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-zinc-900">Sample payload</h2>
              <pre className="mt-4 overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">{JSON.stringify(payload, null, 2)}</pre>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-zinc-900">Text fallback preview</h2>
              <pre className="mt-4 overflow-x-auto rounded-md bg-zinc-50 p-4 text-xs leading-6 text-zinc-700">{textFallback}</pre>
            </div>

            {tenantProfile.featureMode === 'B2B_LEARNER' ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-sm font-semibold text-emerald-900">Salesforce delivery notes</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-emerald-800">
                  <p><strong>This is a Salesforce template spec, not an AWS SES template.</strong> Engineering sends the payload via webhook; Salesforce (Marketing Cloud / Service Cloud) renders and delivers the email/PDF.</p>
                  <p>Trigger: auto-fired after every <code>learner_attempts</code> record is created by the production exam engine. Not triggered in demo — session state only.</p>
                  <p>Token replacement in this preview uses our standard <code>{`{{token}}`}</code> flow for QA inspection. In Salesforce, merge fields will follow their own syntax (e.g. AMPscript or SFMC personalization strings).</p>
                  <p>Placeholder sections (Section Breakdown, Concept Mastery, Pacing, Mistake Taxonomy) are shown in the template with <code>{`{{field_name}}`}</code> tokens for Salesforce dev reference — data not yet available in V1.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-zinc-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  <h2 className="text-sm font-semibold text-zinc-900">SES delivery guardrails</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                  <p>Direct-send template stays table-based and avoids JavaScript or local assets inside the HTML itself.</p>
                  <p>Preview uses the same token replacement flow as the send path, which keeps iframe output and future SES rendering aligned.</p>
                  <p>Branding is tenant-first, with fallback to keySkillset branding when logo data is unavailable.</p>
                  <p>Template tokens remain stable and SES-friendly using <code>{`{{token}}`}</code> syntax.</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-zinc-200 bg-white p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-zinc-900">iframe Preview</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              This preview renders the raw HTML file after token replacement. The rendered output is what should be passed onward to the SES send layer.
            </p>
            <div className="mt-5 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
              <iframe
                title={`${templateDefinition.name} preview`}
                srcDoc={renderedHtml}
                className="w-full bg-white"
                height={templateDefinition.previewHeight}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
