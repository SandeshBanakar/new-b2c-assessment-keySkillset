# PRD KSS-CA-EMAIL-001: Client Admin White-Label Email Templates

**Status:** Draft  
**Last updated:** April 22, 2026  
**Owner:** Product + Engineering  
**Area:** Client Admin / White-label communications

## 1. Executive Summary

keySkillset needs a dedicated white-label email-template center for B2B tenant operations. The system must let internal teams and client-facing stakeholders preview the exact HTML that will be sent through AWS SES, validate tenant branding, and understand the product trigger for each message before release.

This PRD covers only the product decisions, flow, token contract, and preview model. Final HTML bodies are intentionally kept external so production-ready template files can be uploaded or swapped without rewriting the PRD.

## 2. Goal

Create one shared entry point for Client Admin email previews that supports:

- tenant-first white labeling
- separate HTML files per email
- preview-first review flow
- trigger context and token visibility
- send-path parity with AWS SES HTML rendering

## 3. Users

- Super Admin reviewing white-label readiness
- Internal product/engineering teams validating trigger coverage
- Client Admin stakeholders reviewing tenant communications
- QA users validating final HTML before SES delivery

## 4. User Flow

### 4.1 Preview Navigation

`Persona Selector -> Email Templates -> Tenant Chooser -> Client Admin Emails -> Template Detail -> iframe Preview`

### 4.2 Template Detail Behavior

When a user opens a template detail page:

1. The rendered email or certificate preview must appear first.
2. Supporting context should sit below the preview in collapsible sections.
3. The page should explain:
   - when the email is triggered
   - who receives it
   - which variables are available
   - a sample payload
   - SES delivery notes

### 4.3 Certificate Flow

Certificate preview follows the same route pattern as email preview, but the rendered asset is certificate HTML rather than a narrow email body. It must feel printable, premium, and white-label aware.

## 5. Template Inventory

The initial Client Admin email suite includes:

1. Client Admin onboarding welcome
2. Content Creator onboarding - Full Creator
3. Content Creator onboarding - Run-Only
4. Learner onboarding invite
5. Course completion
6. Certificate of completion

## 6. Product Decisions

### 6.1 White-Label Rules

- Every template must support dynamic `full_name`, `company_name`, and `company_logo_url`.
- Tenant branding must resolve first.
- If tenant branding is incomplete, preview and send should fall back to generic keySkillset branding.
- No template HTML may contain hardcoded customer-specific copy unless it is driven by tokens.
- No Sandesh-specific name, signature, contact line, or ownership language may appear in final templates.

### 6.2 Preview Rules

- The preview route must render the same token-replaced HTML that SES receives.
- Preview should use seeded tenant payloads for both branded and fallback-brand scenarios.
- Template detail pages should be readable by non-engineers, so the rendered output comes before technical context.

### 6.3 Delivery Rules

- HTML must remain SES-safe and transactional in structure.
- Templates should assume one-recipient transactional sends.
- HTML and plain-text equivalents should remain aligned.
- Images should be hosted externally rather than embedded as attachments.
- Token names should remain stable for preview/send parity and SES template testing.

### 6.4 Certificate Design Rules

- Certificate should be built in pure HTML/CSS.
- Design direction should feel premium and ceremonial, using a printable parchment-style surface and ornamental framing.
- Two signature blocks are required:
  - tenant company signer
  - keySkillset signer
- Signature region must include visible whitespace above signature lines to support a more realistic signed-certificate presentation.
- Certificate layout must remain white-label safe and not depend on one tenant's permanent visual identity.

## 7. Shared Token Contract

### 7.1 Core Branding Tokens (Dynamic Variables)

- `{{full_name}}`
- `{{company_name}}`
- `{{company_logo_url}}`

All other tokens in the templates are static and part of the template HTML itself.

## 8. Scope

### In Scope

- preview-center UX
- tenant chooser
- template index
- template detail pages
- separate HTML-file ownership model
- preview token rendering
- white-label certificate HTML

### Out of Scope

- live SES sending orchestration UI
- email analytics/reporting
- WYSIWYG email editing
- tenant-authored template builders

## 9. HTML Template Placeholders

Upload or replace the final HTML files in the linked source folder using the placeholders below.

- Client Admin onboarding HTML: `[UPLOAD_HTML_CLIENT_ADMIN_ONBOARDING]`
- Content Creator onboarding - Full Creator HTML: `[UPLOAD_HTML_CC_FULL_CREATOR]`
- Content Creator onboarding - Run-Only HTML: `[UPLOAD_HTML_CC_RUN_ONLY]`
- Learner onboarding invite HTML: `[UPLOAD_HTML_LEARNER_INVITE]`
- Course completion HTML: `[UPLOAD_HTML_COURSE_COMPLETION]`
- Certificate of completion HTML: `[UPLOAD_HTML_CERTIFICATE]`

## 10. Acceptance Criteria

- Users can enter a dedicated Email Templates persona from the root selector.
- Users can switch tenants before previewing templates.
- Each template detail page shows the rendered HTML preview first.
- Supporting context appears below the preview in collapsible sections.
- All six required template categories are represented.
- Certificate preview supports tenant-first branding and two-signature white-label layout.

## 11. Verification Checklist

- Preview all templates for Akash and TechCorp.
- Confirm fallback branding works when tenant logo is absent.
- Confirm all templates use stable token placeholders.
- Confirm certificate includes spacing above both signature lines.
- Confirm raw HTML remains suitable for SES delivery constraints.
