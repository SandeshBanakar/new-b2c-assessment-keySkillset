# PRD B2C-CA-AUTH-SCREENS-001: B2C Auth Screens + Suspended/Deactivated States + CA Deactivation Email Templates

**Status:** DRAFT  
**Author:** Sandesh Banakar I  
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Salesforce Developer, Product, QA, Design  
**Target Version:** V1 (Current)  
**Related PRDs:**
- `prds/end-user/PRD-B2C-EML-001-SUSPEND-REVOKE-EMAILS.md` — B2C user suspend/revoke emails
- `prds/client_admin/PRD-CA-BILLING.md` — CA billing + contract expiry lock

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

The keySkillset platform currently has no production-mapped login or signup UI for B2C end users or Client Admins. There are also no visual states defined for what happens when:
- A **suspended B2C user** attempts to log in
- A **deactivated Client Admin** attempts to access their portal

Additionally, the Super Admin's tenant deactivation action (Deactivate / Reactivate on the Overview tab) does not send any email notification to the Client Admin whose access has changed. This creates a silent, confusing experience for the CA.

### 1.2 Business Value & ROI

- Defines the canonical UX for B2C auth flows (signup + login) to match production
- Reduces confusion and support tickets from suspended/deactivated users who hit generic errors
- Provides Client Admins clear communication when their account status changes
- Establishes email templates for Salesforce to trigger at the correct lifecycle events

### 1.3 Strategic Alignment

- Builds toward the full B2C authentication flow (`KSS-B2C-[TBD]` pending ticket)
- Closes the CA deactivation communication gap alongside the existing SA deactivation UI
- Expands the email template centre (Client Admin Emails) with two new CA lifecycle templates

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **B2C End User (Normal)** | Sees familiar production-matching login and signup screens |
| **B2C End User (Suspended)** | Sees a clear, informative suspension state instead of a generic error |
| **Client Admin (Normal)** | Sees a dedicated CA login screen with portal branding |
| **Client Admin (Deactivated)** | Sees a clear deactivation state with what has changed and a support path |
| **Super Admin** | Deactivation/Reactivation action triggers CA email (Salesforce hook) |
| **Salesforce System** | Receives payload for CA deactivation + reactivation email triggers |

---

## 3. Feature Scope

This PRD covers **three interconnected deliverables**:

1. **B2C Auth Screens** — `/login` (Sign Up) and `/signup` pages matching production
2. **Suspended/Deactivated States** — Visual states on each auth screen
3. **CA Deactivation Email Templates** — Two new templates added to the email template centre

---

## 4. Feature 1 — B2C Auth Screens

### 4.1 B2C Signup Screen (`/signup`)

**Layout:** Two-column split (mobile: form only, lg+: form + illustration panel).

**Left panel — form:**
| Field | Type | Required | Notes |
|---|---|---|---|
| First Name | text | ✅ | Left half of name row |
| Last Name | text | ❌ | Right half of name row |
| Email Address | email | ✅ | |
| Phone Number | tel | ❌ | With country code selector |
| Create Password | password | ✅ | Toggle show/hide |
| Terms & Conditions checkbox | checkbox | ✅ | Gates "Create Account" button |

**CTAs:**
- Primary: `Create Account` (green-600, rounded-full, disabled until checkbox ticked)
- Link: `Already have an account? Login` → `/login`

**Right panel — illustration:**
- Dark card (zinc-800 gradient base) with education quote
- Responsive: hidden below `lg` breakpoint

### 4.2 B2C Login Screen (`/login`)

**Layout:** Same two-column split.

**Left panel — form (normal state):**
| Field | Type | Required | Notes |
|---|---|---|---|
| Email Address | email | ✅ | Placeholder: "Registered Email ID" |
| Password | password | ✅ | Toggle show/hide + "Forgot Password ?" right-aligned |

**CTAs:**
- Primary: `Log In` (green-600, rounded-full)
- Secondary: `Sign Up` (outlined, dark border, rounded-full) → `/signup`
- Info note: blue-50 box — "If you're an existing user, please set up your new password using Forgot Password button!"

### 4.3 B2C Login — Suspended User State

**Trigger:** URL param `?state=suspended` (production: resolved from auth server response).

**State behaviour:**
- Normal form is replaced by a suspension panel
- Panel contents:
  - Rose-100 icon circle with `AlertTriangle`
  - Heading: "Account Suspended"
  - Subtext: "Your access to keySkillset has been suspended by an administrator."
  - rose-50 border box: label "Reason for suspension" + `{{reason}}` text
  - zinc-50 info box: support email `contact@keyskillset.com`
  - "← Back to login" link

**URL param schema:**
```
/login?state=suspended&reason=URL-encoded+reason+text
```

---

## 5. Feature 2 — Client Admin Login Screen (`/client-admin/login`)

### 5.1 Normal State

**Layout:** Same two-column split. Illustration panel uses violet gradient tones (to distinguish from B2C blue/green).

**Left panel — form:**
- violet-50 badge row: `Building2` icon + "Client Admin Portal"
- Heading: "Login to your account"
- Subtitle: "Manage your organisation's learning journey"
- Email (placeholder: "Admin Email ID")
- Password with toggle
- "Forgot Password ?" right-aligned
- Primary CTA: `Log In` (violet-700, rounded-full)
- Info note: violet-50 box — clarifies portal is for CAs only, links to `/login` for B2C users

### 5.2 Deactivated CA State

**Trigger:** URL param `?state=deactivated`.

**State behaviour:**
- Normal form is replaced by a deactivation panel
- Panel contents:
  - amber-100 icon circle with `AlertTriangle`
  - Heading: "Account Deactivated"
  - Subtext: "Your Client Admin account has been deactivated by your Super Admin."
  - amber-50 border box: bullet list of what deactivation means (portal access removed, learners unaffected, data preserved, account can be reactivated)
  - zinc-50 info box: support contact + `contact@keyskillset.com`
  - "← Back to login" link

**URL param schema:**
```
/client-admin/login?state=deactivated
```

---

## 6. Feature 3 — CA Deactivation Email Templates

### 6.1 Template 1: Client Admin Account Deactivated

| Attribute | Value |
|---|---|
| Template ID | `client-admin-deactivated` |
| Filename | `client-admin-deactivated.html` |
| Recipient | Client Admin |
| Subject | `Your Client Admin access has been deactivated — {{company_name}}` |
| Trigger event | Super Admin clicks "Deactivate" on a tenant in the Tenant Overview tab |
| Hero colour | amber-800 (`#92400E`) |
| CTA | None — informational only |
| Applicability | ALL tenants |

**Template variables:**
- `{{full_name}}` — CA full name
- `{{company_name}}` — Tenant/organisation name
- `{{platform_name}}` — keySkillset
- `{{support_email}}` — `contact@keyskillset.com`

**Body content:**
1. Hero: amber header with platform logo + "Your Client Admin access has been deactivated"
2. Greeting + account reference sentence
3. amber-50 box listing 4 implications (portal access removed, learners unaffected, data preserved, can be reactivated)
4. Escalation sentence + support contact
5. Footer with privacy/terms links

### 6.2 Template 2: Client Admin Account Reactivated

| Attribute | Value |
|---|---|
| Template ID | `client-admin-reactivated` |
| Filename | `client-admin-reactivated.html` |
| Recipient | Client Admin |
| Subject | `Your Client Admin access has been restored — {{company_name}}` |
| Trigger event | Super Admin clicks "Reactivate" on a deactivated tenant |
| Hero colour | green-800 (`#166534`) |
| CTA | `Log In to Admin Portal` (green-600 button) → `{{cta_url}}` |
| Applicability | ALL tenants |

**Template variables:**
- `{{full_name}}` — CA full name
- `{{company_name}}` — Tenant/organisation name
- `{{platform_name}}` — keySkillset
- `{{support_email}}` — `contact@keyskillset.com`
- `{{cta_url}}` — Direct link to CA dashboard

**Body content:**
1. Hero: green header + "Your Client Admin access has been reactivated"
2. Greeting + account restoration sentence
3. green-50 box listing 4 restored capabilities (portal access, learner management, catalog/billing/config, data preserved)
4. Login CTA button + fallback URL
5. Footer

---

## 7. Navigation & Persona Selector

Two new entry points are added to the persona selector's **Auth Screens** section:

| Tile | Route | Colour | Badge |
|---|---|---|---|
| B2C Sign Up | `/signup` | green-700 | AUTH_SCREEN |
| B2C Login | `/login` | blue-700 | AUTH_SCREEN |
| Login — Suspended | `/login?state=suspended&reason=...` | rose-700 | SUSPENDED |
| CA Login | `/client-admin/login` | violet-700 | AUTH_SCREEN |
| CA Login — Deactivated | `/client-admin/login?state=deactivated` | amber-700 | DEACTIVATED |

Email template centre navigation:
- CA Deactivated / CA Reactivated templates appear under **Client Admin Emails** (akash + techcorp tenants)
- Accessible at `/email-templates/[tenant]/client-admin-deactivated` and `/email-templates/[tenant]/client-admin-reactivated`

---

## 8. Technical Specifications

### 8.1 Routes Created

| Route | File | Notes |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | `'use client'` + Suspense for `useSearchParams` |
| `/signup` | `src/app/signup/page.tsx` | `'use client'` — no search params |
| `/client-admin/login` | `src/app/client-admin/login/page.tsx` | Static route takes precedence over `[tenant]` dynamic segment |

### 8.2 No Conflict with `[tenant]` Dynamic Route

Next.js resolves static segments before dynamic ones. `/client-admin/login` (static) is matched before `/client-admin/[tenant]` (dynamic). No routing conflict exists.

### 8.3 Salesforce Payload (CA Deactivation — Production)

```json
{
  "action": "deactivate" | "reactivate",
  "email": "admin@example.com",
  "fullName": "Rahul Sharma",
  "companyName": "Akash Institute",
  "platformName": "keySkillset",
  "ctaUrl": "https://app.keyskillset.com/client-admin/akash/dashboard"
}
```

**Endpoint:** To be provided by Salesforce Developer (integration in production).

### 8.4 SA Trigger Hook (Production — not yet built)

When Super Admin calls the deactivate/reactivate action on a tenant:
1. Update `tenants.is_active` in Supabase (already implemented)
2. **NEW (Production):** POST payload to Salesforce email trigger endpoint
3. Salesforce sends the appropriate template email to the CA's registered email

This hook is currently **not implemented in V1 demo** — templates are spec-only for Salesforce configuration.

---

## 9. Email Design System Compliance

Both CA email templates follow the keySkillset email rulebook:
- Table-based HTML layout only
- Inline CSS on every element
- Max width: 620px
- Web-safe fonts: Arial, Helvetica, sans-serif
- keySkillset logo from Supabase storage URL
- Privacy Policy + Terms of Service links in footer
- Copyright notice: `© 2026 keySkillset. All rights reserved.`

---

## 10. Scope Boundaries

### 10.1 IN SCOPE (V1)

- [x] B2C Login screen — normal state
- [x] B2C Login screen — suspended user state
- [x] B2C Signup screen
- [x] CA Login screen — normal state
- [x] CA Login screen — deactivated CA state
- [x] Persona selector tiles for all 5 auth screen states
- [x] `client-admin-deactivated` email HTML template
- [x] `client-admin-reactivated` email HTML template
- [x] Template definitions + preview payloads wired into email template centre

### 10.2 OUT OF SCOPE (V2 / Deferred)

- [ ] Actual Supabase auth integration (real login/signup flow)
- [ ] Salesforce API hook on SA deactivate/reactivate action
- [ ] Password reset / forgot password flow
- [ ] Phone OTP verification on signup
- [ ] OAuth (Google / Apple sign-in)
- [ ] Session management and JWT handling

---

## 11. Edge Cases & Risk Mitigation

| Edge Case | Mitigation |
|---|---|
| `/client-admin/login` conflicts with `[tenant]` route | Next.js static > dynamic resolution — no conflict |
| `reason` URL param is missing on suspended state | Fallback reason text shown in template |
| CA email has no registered address | Log error, continue deactivation action |
| Salesforce API fails on trigger | Continue with DB action; log error for retry queue |

---

## 12. Related Files

- `src/app/login/page.tsx` — B2C login page
- `src/app/signup/page.tsx` — B2C signup page
- `src/app/client-admin/login/page.tsx` — CA login page
- `src/email-templates/html/client-admin-deactivated.html`
- `src/email-templates/html/client-admin-reactivated.html`
- `src/lib/email-templates/types.ts` — `EmailTemplateId` union updated
- `src/lib/email-templates/data.ts` — template definitions + preview payloads
- `src/app/page.tsx` — persona selector (Auth Screens section)
- `src/app/super-admin/tenants/[id]/page.tsx` — SA deactivate/reactivate trigger (Salesforce hook TBD)
