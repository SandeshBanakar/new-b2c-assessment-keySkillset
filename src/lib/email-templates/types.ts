export type EmailTemplateId =
  | 'client-admin-onboarding'
  | 'content-creator-full'
  | 'content-creator-run-only'
  | 'learner-onboarding-invite'
  | 'course-completion'
  | 'certificate-of-completion'
  | 'b2c-user-suspended'
  | 'b2c-access-restored'
  | 'client-admin-deactivated'
  | 'client-admin-reactivated'

export type TenantEmailSlug = 'akash' | 'techcorp' | 'keyskillset'

export interface EmailBranding {
  companyName: string
  companyLogoUrl: string | null
  platformName: string
  supportEmail: string
}

export interface EmailRecipient {
  fullName: string
  email: string
}

export interface EmailTemplateContext {
  roleLabel: string
  featureModeLabel: string
  loginUrl: string
  ctaUrl: string
  ctaLabel: string
  secondaryCtaUrl: string
  secondaryCtaLabel: string
  courseTitle: string
  completionDate: string
  certificateNumber: string
  certificateUrl: string
  assignmentSummary: string
  programName: string
  teamName: string
  introEyebrow: string
  heroTitle: string
  heroSubtitle: string
  completionSummary: string
  issuedDate: string
  privacyUrl: string
  termsUrl: string
  unsubscribeUrl: string
}

export interface B2CUserActionContext {
  action: 'suspend' | 'revoke'
  email: string
  firstName: string
  lastName: string
  reason: string
}

export interface EmailTemplatePayload {
  branding: EmailBranding
  recipient: EmailRecipient
  context: EmailTemplateContext
}

export interface B2CUserActionPayload {
  branding: EmailBranding
  recipient: EmailRecipient
  actionContext: B2CUserActionContext
}

export interface TenantEmailPreviewProfile {
  slug: TenantEmailSlug
  tenantId: string
  displayName: string
  companyName: string
  featureMode: 'FULL_CREATOR' | 'RUN_ONLY' | 'B2C_END_USER'
  companyLogoUrl: string | null
  supportEmail: string
  accentClass: string
  badgeClass: string
  description: string
}

export interface EmailTemplateDefinition {
  id: EmailTemplateId
  name: string
  filename: string
  recipient: string
  triggerEvent: string
  featureApplicability: 'ALL' | 'FULL_CREATOR' | 'RUN_ONLY' | 'B2C_END_USER'
  primaryCtaStyle: string
  subject: string
  summary: string
  whenTriggered: string
  variables: string[]
  previewHeight: number
}
