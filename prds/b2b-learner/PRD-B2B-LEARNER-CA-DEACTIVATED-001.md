# PRD KSS-B2B-CAD-001: B2B Learner Access Revocation on CA Deactivation

**Status:** DRAFT  
**Author:** Sandesh Banakar  
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA  
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

When a Super Admin deactivates a tenant's Client Admin account, B2B learners who belong to that organisation currently receive no communication about the access change. They lose access to their courses, assessments, certificates, and progress records silently — with no explanation on the login screen and no email notification. This creates confusion, support burden, and a poor learner experience.

Additionally, the Email Templates QA persona structure has structural issues: the B2B Learner email persona was duplicated inside the Client Admin tenant chooser, and learner-facing email templates (Learner Onboarding Invite, Course Completion, Certificate of Completion) were assigned to the CA persona instead of the B2B Learner persona.

### 1.2 Business Value & ROI

- Eliminates silent access loss for B2B learners — reduces support tickets when CA deactivation happens
- Gives learners a clear path to resolution (contact HR / admin / keySkillset support)
- Aligns the email template QA system with correct persona ownership

### 1.3 Strategic Alignment

Aligns with the B2B learner experience quality track. CA deactivation is a Super Admin action with downstream learner impact that currently has no learner-facing communication path.

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **B2B Learner** | Receives an email notification when their CA is deactivated, explaining they have lost access. Login screen shows a clear deactivated state with support information. |
| **Client Admin** | No change — CA already receives their own deactivation email. |
| **Super Admin** | No change to deactivation flow — new learner email fires as a side effect. |

---

## 3. User Flow & System Logic

### 3.1 Functional Flowchart

**Email Template QA Structure fixes (non-auth):**
- Persona Selector → B2B End User Emails → B2B Learner email list (includes: Report Card + 3 learner transactional emails + new CA Deactivated email)
- Persona Selector → Client Admin Emails → Tenant Chooser → CA-specific emails only (CA Onboarding, Content Creator emails, CA Deactivated/Reactivated)
- B2C End User Emails: back navigation goes to Persona Selector (`/`), not Tenant Chooser

**B2B Learner Login Deactivated State:**
- Entry Point: Learner navigates to `/b2b-learner/[tenant]/login?state=deactivated`
- Process: Login page reads `?state=deactivated` query param and renders `LearnerAccessRevokedPanel` instead of the learner card picker
- Outcome: Learner sees a clear explanation of the access suspension with support contact info

**B2B Learner CA Deactivated Email:**
- Trigger: Super Admin clicks "Deactivate" on a tenant in the SA Tenant Overview tab
- Audience: All ACTIVE learners in that tenant
- Recipient: Each learner's registered email
- CTA style: Informational — no CTA. Support email shown.

### 3.2 State Transition Logic

No new state introduced. The email and login state are display-only responses to the existing CA deactivation event.

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: B2B Learner login when CA is deactivated

* **Given** I am a B2B learner whose organisation's Client Admin has been deactivated
* **When** I navigate to `/b2b-learner/[tenant]/login?state=deactivated`
* **Then** the login page shows "Access Suspended" state with amber/rose warning styling
* **And** the panel explains: no access to courses, assessments, certificates; progress is preserved; contact support to resolve

### Scenario 2: B2B Learner CA Deactivated email

* **Given** a Super Admin has deactivated a tenant
* **When** the deactivation webhook fires
* **Then** all ACTIVE learners in that tenant receive the `b2b-learner-ca-deactivated` email
* **And** the email explains what they have lost access to, that progress is preserved, and provides support contact

### Scenario 3: Email Template QA — B2B learner persona shows correct templates

* **Given** I am on the Persona Selector
* **When** I click "B2B End User Emails"
* **Then** I see: Learner Onboarding Invite, Course Completion, Certificate of Completion, B2B Learner Report Card, B2B Learner CA Deactivated

### Scenario 4: Email Template QA — Client Admin persona shows correct templates only

* **Given** I am on the Client Admin Emails persona → Akash or TechCorp tenant
* **Then** I see: Client Admin Onboarding, Content Creator Onboarding (Full/Run Only), Client Admin Deactivated, Client Admin Reactivated
* **And** I do NOT see learner-facing templates (Learner Onboarding, Course Completion, Certificate)

### Scenario 5: Back navigation from B2C End User Emails

* **Given** I am on the B2C End User Emails list page (`/email-templates/keyskillset`)
* **When** I click "Back"
* **Then** I go to the Persona Selector (`/`), not the Tenant Chooser (`/email-templates`)

---

## 5. Technical Specifications

### 5.1 Email Template Definition

```
id:                   'b2b-learner-ca-deactivated'
filename:             'b2b-learner-ca-deactivated.html'
featureApplicability: 'B2B_LEARNER'
recipient:            'B2B Learner'
trigger:              'CA account deactivated by Super Admin'
CTA style:            'Informational — no CTA'
```

**Variables:**
- `{{full_name}}` — learner name
- `{{company_name}}` — tenant company name
- `{{platform_name}}` — keySkillset
- `{{support_email}}` — support contact

### 5.2 featureApplicability changes

| Template | Before | After |
|---|---|---|
| `learner-onboarding-invite` | `ALL` | `B2B_LEARNER` |
| `course-completion` | `ALL` | `B2B_LEARNER` |
| `certificate-of-completion` | `ALL` | `B2B_LEARNER` |
| `b2b-learner-ca-deactivated` | NEW | `B2B_LEARNER` |

### 5.3 B2B Login Deactivated State

Route: `/b2b-learner/[tenant]/login?state=deactivated`

`LearnerAccessRevokedPanel` renders when `searchParams.get('state') === 'deactivated'`:
- Amber/rose warning icon
- Title: "Access Suspended"
- Subtitle: "Your organisation's admin account has been deactivated"
- Impact list:
  - You can no longer access your assigned courses
  - Your assessments and scores are temporarily inaccessible
  - Your certificates are temporarily unavailable
  - Your progress and completion records are safely preserved
- Support block: contact HR/L&D or keySkillset support at `contact@keyskillset.com`

Demo state switcher added to login page (Normal / Deactivated).

### 5.4 Persona Selector

New auth screen tile added:
- Label: "B2B Login — Org Deactivated"
- Badge: `DEACTIVATED`
- Route: `/b2b-learner/akash/login?state=deactivated`
- Color: `bg-rose-700`

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1)

- Email template HTML file `b2b-learner-ca-deactivated.html`
- Template definition in `data.ts` + type registration in `types.ts`
- Preview payload for QA persona
- B2B learner login deactivated panel
- Persona selector auth screen tile
- Email template QA structure fixes (B2B duplication, back nav, featureApplicability remapping)

### 6.2 OUT OF SCOPE (V2 / Deferred)

- Actually wiring the email trigger to the SA deactivate action (production webhook)
- Per-tenant learner email list query at deactivation time
- Learner portal redirect to deactivated state when they're already logged in
- Reactivation email to learners when CA is restored

---

## 7. Edge Cases & Risk Mitigation

- **Learner already in session:** Not handled in V1 — learner remains in session until they navigate away or refresh
- **Multiple tenants:** Email template is tenant-branded via `{{company_name}}` and `{{platform_name}}`
- **featureApplicability change impact:** Moving 3 templates from `ALL` to `B2B_LEARNER` removes them from CA tenant pages — this is intentional and does not break any production logic (these are QA/preview-only definitions)

---

## 8. Success Metrics (KPIs)

- Zero support tickets from B2B learners who receive the deactivation email asking "why can't I login" (qualitative, post-production)
- QA personas show correct template sets with no cross-contamination

---

## 9. SEO & Metadata

Not applicable — all screens are authenticated or internal QA tooling.
