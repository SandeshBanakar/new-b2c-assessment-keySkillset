# PRD CA-EMAIL-TEMPLATES: Email Templates Persona

**Status:** REVIEW
**Author:** Claude (AI Assistant)
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA, Design
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"
### 1.1 Problem Statement
The email templates persona is a QA-focused feature that allows stakeholders to preview white-label email templates before they are sent via AWS SES v2. Currently, the demo app has issues with iframe display width, raw file path display, and needs better persona organization in the selector.

### 1.2 Business Value & ROI
- Enables Client Admins and Super Admins to preview email templates before deployment
- Ensures brand consistency across tenants (tenant-first branding with keySkillset fallback)
- Validates token replacement works identically in preview and send paths

### 1.3 Strategic Alignment
Part of the B2B white-label email system that allows multi-tenant organizations to send branded emails via AWS SES v2.

---

## 2. User Personas & Impact
| Persona | Impact / Workflow Change |
| :--- | :--- |
| **Client Admin** | Can preview tenant-specific email templates with branding applied |
| **Super Admin** | Can view all tenant templates and verify SES-safe HTML structure |
| **QA Persona** | Dedicated persona to review all email templates across tenants |

---

## 3. User Flow & System Logic
### 3.1 Functional Flowchart
- **Entry Point:** Persona Selector → "Email Templates" group → Choose "Client Admin Emails" or "Email Templates"
- **Process:** Tenant Chooser → Select Tenant → Template Detail → iframe Preview
- **Outcome:** Rendered HTML with token replacement, aligned with SES send path

### 3.2 Key Features
1. **Persona Selector Restructure:**
   - New "Email Templates" group below "Admin Access"
   - "Client Admin Emails" → goes to `/email-templates` (tenant chooser)

2. **Template Detail Page:**
   - Wide/full-width iframe layout for proper email rendering
   - Raw file displays only filename (e.g., `certificate-of-completion.html`)
   - Dynamic variables filtered to core 5: `{{cta_url}}`, `{{course_title}}`, `{{full_name}}`, `{{company_name}}`, `{{company_logo_url}}`

3. **Certificate Template:**
   - Background image applied from Supabase banner-images bucket
   - URL: `https://uqweguyeaqkbxgtpkhez.supabase.co/storage/v1/object/public/banner-images/Page%202.png`

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: View Client Admin Emails
- **Given** I am on the Persona Selector page
- **When** I click "Client Admin Emails" in the Email Templates group
- **Then** I should see the Akash Institute email templates page

### Scenario 2: Preview Template with Full-Width iframe
- **Given** I am on a template detail page
- **When** I view the iframe preview section
- **Then** the iframe should display at full container width (not side-squeezed)

### Scenario 3: View Dynamic Variables
- **Given** I am on a template detail page
- **When** I view the "Dynamic variables" section
- **Then** I should see only: `{{cta_url}}`, `{{course_title}}`, `{{full_name}}`, `{{company_name}}`, `{{company_logo_url}}`

### Scenario 4: View Raw File Name
- **Given** I am on a template detail page
- **When** I view the Raw file information
- **Then** I should see only the filename (e.g., `learner-onboarding-invite.html`)

### Scenario 5: Certificate Background Image
- **Given** I preview the Certificate of Completion template
- **Then** I should see the background image from Supabase

---

## 5. Technical Specifications (Production Grade)
### 5.1 Email Template Architecture
- **Storage:** Raw HTML files in `src/email-templates/html/`
- **Token Format:** Mustache-style `{{token}}` placeholders
- **Rendering:** Runtime token replacement in demo app
- **Dynamic Fields:** Rendered at runtime in demo app (not stored in HTML files)

### 5.2 Available Tokens
The following are the only dynamic values used in templates:
- `{{cta_url}}` - Call-to-action URL
- `{{course_title}}` - Course name
- `{{full_name}}` - Recipient full name
- `{{company_name}}` - Tenant company name
- `{{company_logo_url}}` - Company logo URL (tenant-first, keySkillset fallback)

### 5.3 Tenant Branding
- **Full Creator tenants:** Use custom logo from tenant assets
- **Run Only tenants:** Fall back to keySkillset logo

### 5.4 SES Safety Requirements
- Table-based layouts (no div soup)
- No JavaScript in email HTML
- No local assets (all external or inline)
- Stable token syntax for consistent preview/send output

---

## 6. Scope Boundaries (V1 vs. V2)
### 6.1 IN SCOPE (V1)
- [x] Persona selector restructure (new Email Templates group)
- [x] Full-width iframe layout
- [x] Filtered dynamic variables (5 core tokens)
- [x] Raw file name only (no path)
- [x] Certificate background image from Supabase

### 6.2 OUT OF SCOPE (V2 / Deferred)
- Real email sending via AWS SES (demo only)
- Template editor UI
- Token management interface

---

## 7. Edge Cases & Risk Mitigation
- **Missing tenant logo:** Falls back to keySkillset branding automatically
- **Long course titles:** CSS truncation or responsive scaling in email templates
- **Image load failure:** Alt text and inline styles for resilience

---

## 8. Success Metrics (KPIs)
- **Primary Metric:** All 6 email templates render correctly in iframe
- **Technical Metric:** Template pages load without console errors

---

## 9. SEO & Metadata (Product Optimization)
- **Technical SEO:** N/A (internal demo tool)
- **Metadata:** Dynamic page titles based on template name