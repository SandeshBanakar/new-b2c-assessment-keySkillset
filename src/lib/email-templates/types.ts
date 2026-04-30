export type EmailTemplateId =
  | 'client-admin-onboarding'
  | 'content-creator-full'
  | 'learner-onboarding-invite'
  | 'course-completion'
  | 'certificate-of-completion'
  | 'b2c-user-suspended'
  | 'b2c-access-restored'
  | 'client-admin-deactivated'
  | 'client-admin-reactivated'
  | 'b2b-learner-report-card'
  | 'b2b-learner-ca-deactivated'

export type TenantEmailSlug = 'akash' | 'techcorp' | 'keyskillset' | 'b2b-learner'

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
  featureModeLabel?: string
  loginUrl?: string
  ctaUrl?: string
  ctaLabel?: string
  secondaryCtaUrl?: string
  secondaryCtaLabel?: string
  courseTitle: string
  completionDate: string
  certificateNumber: string
  certificateUrl: string
  programName: string
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
  extraContext?: Record<string, string>
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
  featureMode: 'FULL_CREATOR' | 'RUN_ONLY' | 'B2C_END_USER' | 'B2B_LEARNER'
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
  featureApplicability: 'ALL' | 'FULL_CREATOR' | 'RUN_ONLY' | 'B2C_END_USER' | 'B2B_LEARNER'
  primaryCtaStyle: string
  subject: string
  summary: string
  whenTriggered: string
  variables: string[]
  previewHeight: number
}
