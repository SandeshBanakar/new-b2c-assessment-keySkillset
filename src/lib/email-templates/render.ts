import type { EmailTemplatePayload } from '@/lib/email-templates/types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildEmailTemplateTokenMap(payload: EmailTemplatePayload): Record<string, string> {
  return {
    company_name: escapeHtml(payload.branding.companyName),
    company_logo_url: payload.branding.companyLogoUrl ?? '',
    platform_name: escapeHtml(payload.branding.platformName),
    support_email: escapeHtml(payload.branding.supportEmail),
    full_name: escapeHtml(payload.recipient.fullName),
    recipient_email: escapeHtml(payload.recipient.email),
    role_label: escapeHtml(payload.context.roleLabel),
    feature_mode_label: escapeHtml(payload.context.featureModeLabel),
    login_url: payload.context.loginUrl,
    cta_url: payload.context.ctaUrl,
    cta_label: escapeHtml(payload.context.ctaLabel),
    secondary_cta_url: payload.context.secondaryCtaUrl,
    secondary_cta_label: escapeHtml(payload.context.secondaryCtaLabel),
    course_title: escapeHtml(payload.context.courseTitle),
    completion_date: escapeHtml(payload.context.completionDate),
    certificate_number: escapeHtml(payload.context.certificateNumber),
    certificate_url: payload.context.certificateUrl,
    assignment_summary: escapeHtml(payload.context.assignmentSummary),
    program_name: escapeHtml(payload.context.programName),
    team_name: escapeHtml(payload.context.teamName),
    intro_eyebrow: escapeHtml(payload.context.introEyebrow),
    hero_title: escapeHtml(payload.context.heroTitle),
    hero_subtitle: escapeHtml(payload.context.heroSubtitle),
    completion_summary: escapeHtml(payload.context.completionSummary),
    issued_date: escapeHtml(payload.context.issuedDate),
    privacy_url: payload.context.privacyUrl,
    terms_url: payload.context.termsUrl,
    unsubscribe_url: payload.context.unsubscribeUrl,
    current_year: '2026',
  }
}

export function renderEmailTemplateHtml(templateHtml: string, payload: EmailTemplatePayload): string {
  const tokenMap = buildEmailTemplateTokenMap(payload)

  return templateHtml.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, token: string) => {
    return tokenMap[token] ?? ''
  })
}

export function buildEmailTemplateTextPreview(payload: EmailTemplatePayload): string {
  return [
    `${payload.context.heroTitle}`,
    '',
    `Hello ${payload.recipient.fullName},`,
    '',
    `${payload.context.heroSubtitle}`,
    '',
    `Company: ${payload.branding.companyName}`,
    `Role: ${payload.context.roleLabel}`,
    `Feature mode: ${payload.context.featureModeLabel}`,
    `Course: ${payload.context.courseTitle}`,
    `Completion date: ${payload.context.completionDate}`,
    `Certificate number: ${payload.context.certificateNumber}`,
    '',
    `Primary action: ${payload.context.ctaLabel} -> ${payload.context.ctaUrl}`,
    `Secondary action: ${payload.context.secondaryCtaLabel} -> ${payload.context.secondaryCtaUrl}`,
    '',
    `Support: ${payload.branding.supportEmail}`,
  ].join('\n')
}
