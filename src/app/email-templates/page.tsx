import Link from 'next/link'
import { ArrowLeft, Mail, Sparkles } from 'lucide-react'

import TenantChooserCard from '@/components/email-templates/TenantChooserCard'
import { TENANT_EMAIL_PREVIEW_PROFILES } from '@/lib/email-templates/data'

export default function EmailTemplatesTenantChooserPage() {
  const tenants = Object.values(TENANT_EMAIL_PREVIEW_PROFILES).filter((t) => t.featureMode !== 'B2C_END_USER')

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Persona Selector
        </Link>

        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Mail className="h-4 w-4" />
                Email Templates
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Choose a tenant preview</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                This persona is dedicated to white-label email QA. Pick a tenant, review trigger context, and inspect the iframe-rendered HTML that will match the raw template send path.
              </p>
            </div>
            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <p className="font-medium">Flow</p>
              <p className="mt-1">Persona Selector &rarr; Tenant Chooser &rarr; Client Admin Emails &rarr; Template Detail &rarr; iframe Preview</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {tenants.map((tenant) => (
            <TenantChooserCard key={tenant.slug} tenant={tenant} />
          ))}
        </section>

        <section className="mt-8 rounded-md border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-2 text-zinc-900">
            <Sparkles className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-semibold">SES-safe preview rules baked into this center</h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-600 sm:grid-cols-2">
            <p>Templates use separate raw HTML files with stable <code>{`{{token}}`}</code> placeholders so preview output and send output stay aligned.</p>
            <p>Branding resolves tenant-first with keySkillset fallback for missing logo assets, which is visible in the tenant previews.</p>
            <p>Layouts stay table-based and lightweight for direct email sending through AWS SES v2.</p>
            <p>Each detail page includes the trigger event, payload contract, rendered HTML preview, and text fallback reference.</p>
          </div>
        </section>
      </div>
    </main>
  )
}