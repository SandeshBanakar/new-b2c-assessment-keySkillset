# PRD B2C-EML-001: B2C End User Suspend/Revoke Email Templates

**Status:** DRAFT  
**Author:** Product Manager (Sandesh Banakar)  
**Stakeholders:** Engineering, Salesforce Developer, QA  
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"
### 1.1 Problem Statement
When a Super Admin suspends or revokes a B2C user's access from the Super Admin B2C Users page, the user receives no notification about the action taken against their account. This creates confusion and lack of communication透明度 for end users who are locked out of their accounts.

### 1.2 Business Value & ROI
- Improves user experience by communicating account status changes
- Reduces support tickets from users who are locked out without explanation
- Provides audit trail via Salesforce for compliance

### 1.3 Strategic Alignment
- Part of the B2C User Management feature set
- Uses Salesforce for email delivery (existing infrastructure)

---

## 2. User Personas & Impact
| Persona | Impact / Workflow Change |
| :--- | :--- |
| **Super Admin** | Can manage B2C user account status (suspend/revoke) with automatic user notification |
| **B2C End User** | Receives email notification when their account is suspended or access is restored |
| **Salesforce System** | Receives payload via API for email triggering |

---

## 3. User Flow & System Logic
### 3.1 Functional Flowchart
- **Entry Point:** Super Admin goes to B2C Users → Selects a user → Opens user details
- **Process:**
  - Super Admin clicks "Suspend User" → fills reason → confirms
  - System sends payload to Salesforce API → Salesforce triggers email
  - User receives "Account Suspended" email
- **Outcome:** User is informed of account suspension via email

### 3.2 State Transition Logic
- **Active User** → Suspend action → **Suspended User** + sends "Account Suspended" email
- **Suspended User** → Remove Suspension action → **Active User** + sends "Access Restored" email

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: Suspend B2C User
* **Given** I am a Super Admin on the B2C User details page
* **When** I click "Suspend User", enter a reason, and confirm the action
* **Then** the user's status should change to "SUSPENDED"
* **And** a payload should be sent to Salesforce with: action, email, firstName, lastName, reason
* **And** the user should receive an "Account Suspended" email

### Scenario 2: Remove Suspension (Revoke)
* **Given** I am a Super Admin viewing a suspended user's profile
* **When** I click "Remove Suspension", enter an optional reason, and confirm
* **Then** the user's status should change to "ACTIVE"
* **And** a payload should be sent to Salesforce with the same variables
* **And** the user should receive an "Access Restored" email

---

## 5. Technical Specifications (Production Grade)
### 5.1 Data Entities & Logic
- **Existing Entity:** `users` table (already has `status`, `suspension_reason`, `suspended_at` columns)
- **Action:** `suspendUser()` and `unsuspendUser()` already exist in `src/lib/supabase/b2c-users.ts`

### 5.2 API Requirements
- **Payload Structure (to Salesforce):**
```json
{
  "action": "suspend" | "revoke",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "reason": "Reason for action"
}
```
- **Endpoint:** To be provided by Salesforce Developer (integration in production)

### 5.3 Email Template Variables
Only these 5 variables for template rendering:
- `{{action}}` - "suspend" or "revoke"
- `{{email}}` - User's email address
- `{{firstName}}` - User's first name
- `{{lastName}}` - User's last name
- `{{reason}}` - Reason provided by Super Admin

### 5.4 Email Branding
- keySkillset branded (platform logo from external S3 URL)
- No tenant-specific branding
- Follow the keySkillset email rulebook (table-based layout, inline CSS, etc.)

---

## 6. Scope Boundaries (V1 vs. V2)
### 6.1 IN SCOPE (V1)
- [x] Two email templates: Account Suspended, Access Restored
- [x] Email template definitions in email-templates data.ts
- [x] Preview profile in persona selector → Email Templates → B2C End User Emails
- [x] Salesforce payload structure (5 variables)
- [x] Navigation structure: Persona Selector → Email Templates group → B2C End User Emails → Two cards

### 6.2 OUT OF SCOPE (V2 / Deferred)
- [ ] Salesforce API integration (to be built with Salesforce Developer)
- [ ] Multiple language support
- [ ] Custom email branding per tenant

---

## 7. Edge Cases & Risk Mitigation
- **No email on file:** If user has no email, log error but continue suspension action
- **API failure:** Continue with suspension; log error for retry (Salesforce queue)
- **Empty reason:** Allow empty reason; use fallback text in email

---

## 8. Success Metrics (KPIs)
- **Primary Metric:** User receives suspension notification within 1 minute of action
- **Technical Metric:** Email template renders correctly in all major clients (Gmail, Outlook, Apple Mail)

---

## 9. SEO & Metadata (Product Optimization)
- **Not applicable** - Internal admin-triggered emails

---

## 10. Email Template Design Requirements
Based on `@docs/email_rules/keyskillset-email-rulebook-v2.md`:
- Table-based HTML layout only
- Inline CSS on every element
- Max width: 600-620px
- Web-safe fonts: Arial, Helvetica, Georgia, Verdana
- Follow dark mode guidelines
- Include keySkillset logo (S3 URL: `https://uqweguyeaqkbxgtpkhez.supabase.co/storage/v1/object/public/Company%20Logos/New%20Upscaled%20keySkillset%20Logo.png`)

---

## 11. Navigation Structure
```
Persona Selector
  └── Email Templates (group)
      ├── Client Admin Emails (rose) → /email-templates → Tenant chooser
      └── B2C End User Emails (blue) → /email-templates/keyskillset
          ├── Card 1: Account Suspended
          └── Card 2: Access Restored
```

Note: The "Email Templates" group in persona selector has TWO entries:
- **Client Admin Emails** — routes to tenant chooser (Akash, TechCorp)
- **B2C End User Emails** — routes directly to keyskillset profile with template cards

---

## 12. Related Files
- `@src/lib/email-templates/data.ts` - Template definitions
- `@src/lib/email-templates/types.ts` - Type definitions
- `@src/email-templates/html/` - HTML email templates
- `@src/app/email-templates/` - Email template preview pages
- `@docs/email_rules/keyskillset-email-rulebook-v2.md` - Email design rules
- `@docs/keyskillset-shine-welcome-v9.html` - Style reference