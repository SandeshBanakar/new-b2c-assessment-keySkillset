import { TENANT_SLUG_MAP } from '@/lib/client-admin/tenants'
import type {
  EmailTemplateDefinition,
  EmailTemplateId,
  EmailTemplatePayload,
  TenantEmailPreviewProfile,
  TenantEmailSlug,
} from '@/lib/email-templates/types'

const KEYSKILLSET_LOGO_URL =
  'https://uqweguyeaqkbxgtpkhez.supabase.co/storage/v1/object/public/Company%20Logos/New%20Upscaled%20keySkillset%20Logo.png'

export const TENANT_EMAIL_PREVIEW_PROFILES: Record<TenantEmailSlug, TenantEmailPreviewProfile> = {
  akash: {
    slug: 'akash',
    tenantId: TENANT_SLUG_MAP.akash,
    displayName: 'Akash Institute',
    companyName: 'Akash Institute',
    featureMode: 'FULL_CREATOR',
    companyLogoUrl: 'https://placehold.co/280x84/F5F3FF/6D28D9?text=Akash+Institute',
    supportEmail: 'contact@keyskillset.com',
    accentClass: 'bg-violet-700',
    badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200',
    description: 'Full Creator tenant with branded preview logo and content-creator enablement.',
  },
  techcorp: {
    slug: 'techcorp',
    tenantId: TENANT_SLUG_MAP.techcorp,
    displayName: 'TechCorp India',
    companyName: 'TechCorp India',
    featureMode: 'RUN_ONLY',
    companyLogoUrl: null,
    supportEmail: 'contact@keyskillset.com',
    accentClass: 'bg-teal-700',
    badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200',
    description: 'Run-Only tenant that intentionally falls back to keySkillset branding when logo assets are missing.',
  },
  keyskillset: {
    slug: 'keyskillset',
    tenantId: 'b2c-end-user',
    displayName: 'keySkillset',
    companyName: 'keySkillset',
    featureMode: 'B2C_END_USER',
    companyLogoUrl: KEYSKILLSET_LOGO_URL,
    supportEmail: 'contact@keyskillset.com',
    accentClass: 'bg-blue-700',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    description: 'B2C End User Emails - keySkillset branded emails for B2C user account actions.',
  },
  'b2b-learner': {
    slug: 'b2b-learner',
    tenantId: 'b2b-learner',
    displayName: 'B2B Learner',
    companyName: 'Akash Institute',
    featureMode: 'B2B_LEARNER',
    companyLogoUrl: 'https://placehold.co/280x84/F0FDF4/166534?text=Akash+Institute',
    supportEmail: 'contact@keyskillset.com',
    accentClass: 'bg-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    description: 'B2B Learner Emails — Salesforce-powered report cards sent automatically after each assessment attempt.',
  },
}

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  {
    id: 'client-admin-onboarding',
    name: 'Client Admin Onboarding',
    filename: 'client-admin-onboarding.html',
    recipient: 'Client Admin',
    triggerEvent: 'Sent after the tenant and Client Admin account are created.',
    featureApplicability: 'ALL',
    primaryCtaStyle: 'Tour-first CTA with setup/login support',
    subject: 'Welcome to {{platform_name}} for {{company_name}}',
    summary: 'Welcomes the Client Admin, explains responsibilities, and points them to their first setup steps.',
    whenTriggered: 'Trigger after Super Admin creates the tenant and assigns the primary Client Admin.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{company_logo_url}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{login_url}}',
      '{{cta_url}}',
    ],
    previewHeight: 1640,
  },
  {
    id: 'content-creator-full',
    name: 'Content Creator Onboarding - Full Creator',
    filename: 'content-creator-full.html',
    recipient: 'Content Creator',
    triggerEvent: 'Sent when a Content Creator is invited for a Full Creator tenant.',
    featureApplicability: 'FULL_CREATOR',
    primaryCtaStyle: 'Tour-first CTA with content-bank orientation',
    subject: 'Your content workspace is ready for {{company_name}}',
    summary: 'Introduces the content bank, creation workflow, and private-content responsibilities.',
    whenTriggered: 'Trigger after a Content Creator is added under a FULL_CREATOR tenant.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{company_logo_url}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{login_url}}',
      '{{cta_url}}',
    ],
    previewHeight: 1540,
  },
  {
    id: 'content-creator-run-only',
    name: 'Content Creator Onboarding - Run Only',
    filename: 'content-creator-run-only.html',
    recipient: 'Content Creator / Content Contact',
    triggerEvent: 'Sent for Run-Only tenants where content access is limited or coordinated via keySkillset.',
    featureApplicability: 'RUN_ONLY',
    primaryCtaStyle: 'Tour-first CTA with limited-access clarification',
    subject: 'Your access overview for {{company_name}} on {{platform_name}}',
    summary: 'Clarifies run-only operating model, what access is available, and where to coordinate content requests.',
    whenTriggered: 'Trigger when a content-side stakeholder needs guided access context for a RUN_ONLY tenant.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{company_logo_url}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{login_url}}',
      '{{cta_url}}',
    ],
    previewHeight: 1500,
  },
  {
    id: 'learner-onboarding-invite',
    name: 'Learner Onboarding Invite',
    filename: 'learner-onboarding-invite.html',
    recipient: 'Learner',
    triggerEvent: 'Sent when a learner is invited or enrolled into the tenant learning experience.',
    featureApplicability: 'B2B_LEARNER',
    primaryCtaStyle: 'Tour-first CTA with setup support',
    subject: 'You have been invited to learn with {{company_name}}',
    summary: 'Invites the learner, introduces assigned learning, and drives them into first access.',
    whenTriggered: 'Trigger after learner creation or enrolment into client-admin managed content.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{company_logo_url}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{login_url}}',
      '{{cta_url}}',
      '{{course_title}}',
    ],
    previewHeight: 1600,
  },
  {
    id: 'course-completion',
    name: 'Course Completion',
    filename: 'course-completion.html',
    recipient: 'Learner',
    triggerEvent: 'Sent when a learner completes an assigned course.',
    featureApplicability: 'B2B_LEARNER',
    primaryCtaStyle: 'Celebrate completion and drive next action',
    subject: 'You completed {{course_title}}',
    summary: 'Celebrates completion, summarizes the outcome, and points the learner to certificate or next learning.',
    whenTriggered: 'Trigger immediately after course progress reaches completion.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{company_logo_url}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{cta_url}}',
      '{{course_title}}',
      '{{completion_date}}',
    ],
    previewHeight: 1460,
  },
  {
    id: 'certificate-of-completion',
    name: 'Certificate Of Completion',
    filename: 'certificate-of-completion.html',
    recipient: 'Learner / External Viewer',
    triggerEvent: 'Rendered when a certificate is issued or shared.',
    featureApplicability: 'B2B_LEARNER',
    primaryCtaStyle: 'Certificate-first presentation',
    subject: 'Certificate of Completion - {{course_title}}',
    summary: 'Printable white-label certificate HTML with tenant/company branding and completion identity.',
    whenTriggered: 'Trigger when a certificate is generated or linked from a completion workflow.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{company_logo_url}}',
      '{{platform_name}}',
      '{{course_title}}',
      '{{completion_date}}',
      '{{certificate_number}}',
    ],
    previewHeight: 1160,
  },
  {
    id: 'client-admin-deactivated',
    name: 'Client Admin Account Deactivated',
    filename: 'client-admin-deactivated.html',
    recipient: 'Client Admin',
    triggerEvent: 'Sent when a Super Admin deactivates a tenant (Client Admin loses portal access).',
    featureApplicability: 'ALL',
    primaryCtaStyle: 'Informational — no CTA',
    subject: 'Your Client Admin access has been deactivated — {{company_name}}',
    summary: 'Notifies the Client Admin that their portal access has been deactivated, explains implications, and provides support contact.',
    whenTriggered: 'Trigger when Super Admin clicks "Deactivate" on a tenant in the Tenant Overview tab.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{platform_name}}',
      '{{support_email}}',
    ],
    previewHeight: 900,
  },
  {
    id: 'client-admin-reactivated',
    name: 'Client Admin Account Reactivated',
    filename: 'client-admin-reactivated.html',
    recipient: 'Client Admin',
    triggerEvent: 'Sent when a Super Admin reactivates a previously deactivated tenant.',
    featureApplicability: 'ALL',
    primaryCtaStyle: 'Tour-first CTA with login support',
    subject: 'Your Client Admin access has been restored — {{company_name}}',
    summary: 'Notifies the Client Admin that their portal access has been restored with a direct login CTA.',
    whenTriggered: 'Trigger when Super Admin clicks "Reactivate" on a deactivated tenant in the Tenant Overview tab.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{cta_url}}',
    ],
    previewHeight: 960,
  },
  {
    id: 'b2c-user-suspended',
    name: 'Account Suspended',
    filename: 'b2c-user-suspended.html',
    recipient: 'B2C End User',
    triggerEvent: 'Sent when a Super Admin suspends a B2C user account.',
    featureApplicability: 'B2C_END_USER',
    primaryCtaStyle: 'Informational - no CTA',
    subject: 'Your keySkillset account has been suspended',
    summary: 'Notifies the user that their account has been suspended by a Super Admin.',
    whenTriggered: 'Trigger when Super Admin clicks Suspend User on a B2C user profile.',
    variables: [
      '{{first_name}}',
      '{{last_name}}',
      '{{email}}',
      '{{reason}}',
      '{{action}}',
    ],
    previewHeight: 800,
  },
  {
    id: 'b2c-access-restored',
    name: 'Access Restored',
    filename: 'b2c-access-restored.html',
    recipient: 'B2C End User',
    triggerEvent: 'Sent when a Super Admin removes suspension (revokes) from a B2C user account.',
    featureApplicability: 'B2C_END_USER',
    primaryCtaStyle: 'Tour-first CTA with login support',
    subject: 'Your keySkillset access has been restored',
    summary: 'Notifies the user that their account access has been restored.',
    whenTriggered: 'Trigger when Super Admin clicks Remove Suspension on a suspended B2C user profile.',
    variables: [
      '{{first_name}}',
      '{{last_name}}',
      '{{email}}',
      '{{reason}}',
      '{{action}}',
    ],
    previewHeight: 800,
  },
  {
    id: 'b2b-learner-ca-deactivated',
    name: 'B2B Learner Access Suspended (CA Deactivated)',
    filename: 'b2b-learner-ca-deactivated.html',
    recipient: 'B2B Learner',
    triggerEvent: 'Sent to all active learners in a tenant when their Client Admin account is deactivated by a Super Admin.',
    featureApplicability: 'B2B_LEARNER',
    primaryCtaStyle: 'Informational — no CTA',
    subject: 'Your access to {{company_name}} on {{platform_name}} has been suspended',
    summary: 'Notifies the B2B learner that their organisation\'s admin account has been deactivated, explains what they have lost access to (courses, assessments, certificates), and confirms their progress data is safely preserved. Provides support contact.',
    whenTriggered: 'Trigger when Super Admin clicks "Deactivate" on a tenant. Fire to all ACTIVE learners in that tenant alongside the CA deactivation email.',
    variables: [
      '{{full_name}}',
      '{{company_name}}',
      '{{platform_name}}',
      '{{support_email}}',
    ],
    previewHeight: 960,
  },
  {
    id: 'b2b-learner-report-card',
    name: 'B2B Learner Assessment Report Card',
    filename: 'b2b-learner-report-card.html',
    recipient: 'B2B Learner',
    triggerEvent: 'Sent automatically after each assessment attempt is completed.',
    featureApplicability: 'B2B_LEARNER',
    primaryCtaStyle: 'Salesforce PDF — informational report, no primary CTA',
    subject: '[{{company_name}}] Your Assessment Report Card — {{assessment_title}} · Attempt {{attempt_number}}',
    summary: 'Per-attempt performance report card sent via Salesforce after every attempt. Covers score, pass/fail, time analysis, attempt history for trend context, certificate status, and placeholder sections for future detailed analytics (Section Breakdown, Concept Mastery, Pacing, Mistake Taxonomy).',
    whenTriggered: 'Trigger on every learner_attempts record creation. Production: exam engine completion webhook → Salesforce journey trigger with payload. Demo: not wired — session state only.',
    variables: [
      '{{full_name}}',
      '{{recipient_email}}',
      '{{company_name}}',
      '{{platform_name}}',
      '{{support_email}}',
      '{{assessment_title}}',
      '{{attempt_number}}',
      '{{score_pct}}',
      '{{passed}}',
      '{{time_taken_display}}',
      '{{attempted_at}}',
      '{{avg_time_per_question_display}}',
      '{{slowest_question_display}}',
      '{{fastest_question_display}}',
      '{{average_score_pct}}',
      '{{best_score_pct}}',
      '{{certificate_eligible}}',
      '{{certificate_number}}',
      '{{certificate_status_display}}',
      '{{unsubscribe_url}}',
    ],
    previewHeight: 2600,
  },
]

export function getEmailTemplateDefinition(templateId: EmailTemplateId): EmailTemplateDefinition | null {
  return EMAIL_TEMPLATE_DEFINITIONS.find((template) => template.id === templateId) ?? null
}

export function getTemplatesForTenant(tenantSlug: TenantEmailSlug): EmailTemplateDefinition[] {
  const tenant = TENANT_EMAIL_PREVIEW_PROFILES[tenantSlug]
  return EMAIL_TEMPLATE_DEFINITIONS.filter((template) => {
    if (tenant.featureMode === 'B2C_END_USER') {
      return template.featureApplicability === 'B2C_END_USER'
    }
    if (tenant.featureMode === 'B2B_LEARNER') {
      return template.featureApplicability === 'B2B_LEARNER'
    }
    if (template.featureApplicability === 'ALL') return true
    if (template.featureApplicability === 'B2C_END_USER') return false
    if (template.featureApplicability === 'B2B_LEARNER') return false
    return template.featureApplicability === tenant.featureMode
  })
}

function getBrandingName(tenant: TenantEmailPreviewProfile): string {
  return tenant.companyName || 'keySkillset'
}

function getBrandingLogo(tenant: TenantEmailPreviewProfile): string {
  return tenant.companyLogoUrl ?? KEYSKILLSET_LOGO_URL
}

export function buildPreviewPayload(
  tenantSlug: TenantEmailSlug,
  templateId: EmailTemplateId,
): EmailTemplatePayload {
  const tenant = TENANT_EMAIL_PREVIEW_PROFILES[tenantSlug]

  const basePayload: EmailTemplatePayload = {
    branding: {
      companyName: getBrandingName(tenant),
      companyLogoUrl: getBrandingLogo(tenant),
      platformName: 'keySkillset',
      supportEmail: tenant.supportEmail,
    },
    recipient: {
      fullName: templateId === 'client-admin-onboarding' || templateId === 'client-admin-deactivated' || templateId === 'client-admin-reactivated' ? 'Rahul Sharma'
        : templateId === 'b2b-learner-report-card' ? 'Ananya Krishnan'
        : 'Priya Nair',
      email: templateId === 'learner-onboarding-invite' || templateId === 'course-completion' || templateId === 'certificate-of-completion'
        ? 'learner@example.com'
        : templateId === 'b2b-learner-report-card'
        ? 'ananya.krishnan@akash.example.com'
        : 'admin@example.com',
    },
    context: {
      roleLabel: 'Client Admin',
      featureModeLabel: tenant.featureMode === 'FULL_CREATOR' ? 'Full Creator' : 'Run Only',
      loginUrl: `https://app.keyskillset.com/client-admin/${tenant.slug}/dashboard`,
      ctaUrl: `https://app.keyskillset.com/email-templates/${tenant.slug}/${templateId}`,
      ctaLabel: 'Take the Tour',
      secondaryCtaUrl: `https://app.keyskillset.com/client-admin/${tenant.slug}/users-roles`,
      secondaryCtaLabel: 'Review account access',
      courseTitle: 'Compliance Foundations 101',
      completionDate: '22 Apr 2026',
      certificateNumber: `KSS-${tenant.slug.toUpperCase()}-20260422-014`,
      certificateUrl: `https://app.keyskillset.com/certificates/${tenant.slug}/preview`,
      assignmentSummary: 'Your organisation has assigned a structured onboarding and compliance journey tailored to your role.',
      programName: 'Client Admin Launch Path',
      teamName: 'Operations Enablement',
      introEyebrow: 'White-label onboarding',
      heroTitle: 'Your learning workspace is ready.',
      heroSubtitle: 'Review the guided tour, set up your access, and move confidently into your first actions.',
      completionSummary: 'You completed the required learning path and unlocked your completion credentials.',
      issuedDate: '22 Apr 2026',
      privacyUrl: 'https://www.keyskillset.com/privacy',
      termsUrl: 'https://www.keyskillset.com/terms',
      unsubscribeUrl: 'https://www.keyskillset.com/unsubscribe',
    },
  }

  if (templateId === 'client-admin-onboarding') {
    return {
      ...basePayload,
      recipient: {
        fullName: tenant.slug === 'akash' ? 'Rahul Sharma' : 'Priya Nair',
        email: tenant.slug === 'akash' ? 'rahul.sharma@akash.example.com' : 'priya.nair@techcorp.example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Client Admin',
        ctaLabel: 'Take the Tour',
        secondaryCtaLabel: 'Open admin workspace',
        assignmentSummary: 'Your Super Admin has set up your organisation workspace. Your first job is to review people, catalog access, and rollout readiness.',
        programName: 'Client Admin Launch Path',
        teamName: tenant.displayName,
        introEyebrow: 'Client Admin onboarding',
        heroTitle: `${tenant.displayName} is live on keySkillset.`,
        heroSubtitle: 'Your admin workspace is ready with a guided first-run flow for setup, invites, and reporting.',
      },
    }
  }

  if (templateId === 'content-creator-full') {
    return {
      ...basePayload,
      recipient: {
        fullName: 'Asha Verma',
        email: 'asha.verma@example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Content Creator',
        ctaLabel: 'Take the Tour',
        secondaryCtaLabel: 'Open content bank',
        secondaryCtaUrl: `https://app.keyskillset.com/client-admin/${tenant.slug}/content-bank`,
        assignmentSummary: 'You can create and manage organisation-private content, review drafts, and coordinate launches with the Client Admin.',
        programName: 'Content Creator Enablement',
        teamName: 'Learning Content',
        introEyebrow: 'Content Creator onboarding',
        heroTitle: 'Your private content workspace is ready.',
        heroSubtitle: 'Start with the guided tour, then move into the content bank to manage tenant-private learning assets.',
      },
    }
  }

  if (templateId === 'content-creator-run-only') {
    return {
      ...basePayload,
      recipient: {
        fullName: 'Nisha Kapoor',
        email: 'nisha.kapoor@example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Content Contact',
        ctaLabel: 'Take the Tour',
        secondaryCtaLabel: 'Review support path',
        secondaryCtaUrl: `mailto:${tenant.supportEmail}`,
        assignmentSummary: 'This tenant is operating in Run-Only mode. Your access focuses on visibility, coordination, and support routing rather than private content authoring.',
        programName: 'Run-Only Access Guide',
        teamName: 'Programme Coordination',
        introEyebrow: 'Run-Only access',
        heroTitle: 'Here is how content works for your tenant.',
        heroSubtitle: 'You can track the experience, but keySkillset manages the content supply model for this workspace.',
      },
    }
  }

  if (templateId === 'client-admin-deactivated') {
    return {
      ...basePayload,
      recipient: {
        fullName: tenant.slug === 'akash' ? 'Rahul Sharma' : 'Priya Nair',
        email: tenant.slug === 'akash' ? 'rahul.sharma@akash.example.com' : 'priya.nair@techcorp.example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Client Admin',
        teamName: tenant.displayName,
        introEyebrow: 'Account status change',
        heroTitle: `${tenant.displayName} admin access deactivated.`,
        heroSubtitle: 'Your administrator access to the portal has been suspended. Contact support to reactivate.',
      },
    }
  }

  if (templateId === 'client-admin-reactivated') {
    return {
      ...basePayload,
      recipient: {
        fullName: tenant.slug === 'akash' ? 'Rahul Sharma' : 'Priya Nair',
        email: tenant.slug === 'akash' ? 'rahul.sharma@akash.example.com' : 'priya.nair@techcorp.example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Client Admin',
        ctaLabel: 'Log In to Admin Portal',
        ctaUrl: `https://app.keyskillset.com/client-admin/${tenant.slug}/dashboard`,
        teamName: tenant.displayName,
        introEyebrow: 'Account restored',
        heroTitle: `${tenant.displayName} admin access restored.`,
        heroSubtitle: 'Your Client Admin access is fully restored. Log in to continue managing your organisation.',
      },
    }
  }

  if (templateId === 'learner-onboarding-invite') {
    return {
      ...basePayload,
      recipient: {
        fullName: 'Ananya Krishnan',
        email: 'ananya.krishnan@example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Learner',
        ctaLabel: 'Take the Tour',
        secondaryCtaLabel: 'Set up your access',
        secondaryCtaUrl: basePayload.context.loginUrl,
        courseTitle: 'Client Admin Compliance Foundations',
        assignmentSummary: 'You have been invited to complete role-based learning assigned by your organisation.',
        programName: 'Learner Welcome Journey',
        teamName: 'Assigned Learning',
        introEyebrow: 'Learner onboarding',
        heroTitle: 'Your assigned learning is ready.',
        heroSubtitle: 'Preview the workspace, activate your access, and begin with the first required learning activity.',
      },
    }
  }

  if (templateId === 'course-completion') {
    return {
      ...basePayload,
      recipient: {
        fullName: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Learner',
        ctaLabel: 'View certificate',
        ctaUrl: basePayload.context.certificateUrl,
        secondaryCtaLabel: 'Continue learning',
        secondaryCtaUrl: basePayload.context.loginUrl,
        courseTitle: 'Data Privacy Essentials',
        completionDate: '22 Apr 2026',
        assignmentSummary: 'Your required learning is now complete and recorded in your tenant workspace.',
        programName: 'Completion milestone',
        teamName: 'Learning Record',
        introEyebrow: 'Course completion',
        heroTitle: 'You completed your course.',
        heroSubtitle: 'Your result has been recorded and your completion credentials are ready to review.',
        completionSummary: 'All required modules are complete and your final status has been marked as achieved.',
      },
    }
  }

  if (templateId === 'b2b-learner-ca-deactivated') {
    return {
      ...basePayload,
      recipient: {
        fullName: 'Ananya Krishnan',
        email: 'ananya.krishnan@akash.example.com',
      },
      context: {
        ...basePayload.context,
        roleLabel: 'Learner',
        teamName: tenant.displayName,
        introEyebrow: 'Account access suspended',
        heroTitle: 'Your access to the learning portal has been suspended.',
        heroSubtitle: `${tenant.displayName}'s admin account has been deactivated. Your courses, assessments, and certificates are temporarily inaccessible.`,
      },
    }
  }

  if (templateId === 'b2b-learner-report-card') {
    return {
      ...basePayload,
      recipient: {
        fullName: 'Ananya Krishnan',
        email: 'ananya.krishnan@akash.example.com',
      },
      context: {
        ...basePayload.context,
        heroTitle: 'Assessment Report Card — SAT Full Mock Test 1',
        heroSubtitle: 'Attempt 2 · 22 Apr 2026 · Akash Institute — powered by keySkillset',
        unsubscribeUrl: 'https://www.keyskillset.com/unsubscribe',
      },
      extraContext: {
        assessment_title: 'SAT Full Mock Test 1',
        attempt_number: '2',
        score_pct: '72',
        passed: 'PASS',
        time_taken_display: '90 min 0 sec',
        attempted_at: '22 Apr 2026, 10:45 AM',
        avg_time_per_question_display: '2 min 15 sec',
        slowest_question_display: '7 min 0 sec',
        fastest_question_display: '18 sec',
        average_score_pct: '65',
        best_score_pct: '72',
        certificate_eligible: 'Yes',
        certificate_number: 'KSS-2026-0042',
        certificate_status_display: 'Certificate Earned',
      },
    }
  }

  return {
    ...basePayload,
    recipient: {
      fullName: 'Preethi Nair',
      email: 'preethi.nair@example.com',
    },
    context: {
      ...basePayload.context,
      roleLabel: 'Learner',
      ctaLabel: 'View certificate',
      ctaUrl: basePayload.context.certificateUrl,
      secondaryCtaLabel: 'Open learning record',
      secondaryCtaUrl: basePayload.context.loginUrl,
      courseTitle: 'Client Admin Excellence Programme',
      completionDate: '22 Apr 2026',
      assignmentSummary: 'This certificate verifies completion within a white-label tenant experience on keySkillset.',
      programName: 'Certificate issue',
      teamName: tenant.displayName,
      introEyebrow: 'Certificate of completion',
      heroTitle: 'Certificate preview',
      heroSubtitle: 'Printable completion certificate with tenant-first branding and stable delivery tokens.',
      completionSummary: 'Completion has been verified and certificate issue details have been recorded.',
    },
  }
}
