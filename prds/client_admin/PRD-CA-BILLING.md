# PRD: Client Admin Billing & Contract Page

**Status:** REVIEW  
**Author:** Sandesh Banakar  
**Stakeholders:** Engineering, Product, Client Success  
**Target Version:** V1 (Shipped Apr 28 2026)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

Client Admins (CAs) currently have no visibility into their contract status, seat utilisation, or renewal timeline within the platform. This creates three compounding problems:

1. **Support ticket load** — CAs raise tickets asking "How many seats do we have?", "When does our contract expire?", and "Are we over our seat limit?" — all questions that should be self-serviceable.
2. **Reactive renewals** — CAs are unaware of approaching expiry dates, leading to last-minute or lapsed renewals that disrupt learner access.
3. **Storage cost opacity** — FULL_CREATOR tenants are billed separately for storage and hosting but have no visibility into their current usage, creating invoice surprise.

### 1.2 Business Value & ROI

- **Transparency** — CAs can self-serve contract and seat information without raising a support ticket.
- **Support deflection** — Reduces inbound contract-status queries to the keySkillset team.
- **Proactive renewal** — CAs who see an "Expiring Soon" status and a days-remaining countdown are more likely to initiate renewal before expiry, reducing revenue-gap risk.
- **Storage accountability** — FULL_CREATOR CAs understand what they are being billed for, reducing invoice disputes and improving trust.

### 1.3 Strategic Alignment

Part of the Q2 2026 Client Admin Portal enhancement initiative. Supports the North Star of reducing CA time-to-value and improving retention through platform transparency.

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **Client Admin** | Can now view contract status, seat utilisation, and renewal date without contacting support. Proactively contacts keySkillset before expiry. Understands storage usage and hosting cost (FULL_CREATOR). |
| **Super Admin** | Fewer inbound tickets about contract status. Renewal conversations shift from reactive to proactive. Storage billing disputes reduced for FULL_CREATOR clients. |
| **Learner** | Indirect: reduced risk of access disruption due to missed renewals. Platform hard-lock on expired contracts (V1 planned, see §6) protects billing integrity. |

---

## 3. User Flow & System Logic

### 3.1 Functional Flowchart

- **Entry Point:** CA navigates to **Settings → Billing** in the left sidebar of the Client Admin portal.
- **Process:**
  1. Page fetches `contracts` row for `tenant_id`.
  2. Page fetches active learner count from `learners` (status = ACTIVE).
  3. Page fetches active Content Creator count from `admin_users` (role = CONTENT_CREATOR, is_active = true) — FULL_CREATOR only.
  4. Derives contract status from `end_date` relative to today.
  5. Renders read-only view. All data is informational; no mutations from this page.
- **Outcome:** CA has full self-service visibility into their contract and can initiate renewal via the contact CTA.

### 3.2 Contract Status State Logic

| Condition | Badge | Days Display | Colour Signal |
|---|---|---|---|
| `end_date > today + 30 days` | Active | "{N} days remaining" | Green |
| `end_date` within 30 days of today | Expiring Soon | "{N} days remaining" | Amber |
| `end_date < today` | Expired | "Expired" | Red |
| No contract row exists | — | No contract on file | Neutral empty state |

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: Active contract — standard view

- **Given** I am a Client Admin with an active contract (`end_date > today + 30 days`)
- **When** I navigate to the Billing page
- **Then** I see a green "Active" badge, contract start and end dates, days remaining, and seat usage progress bars
- **And** if I am a FULL_CREATOR tenant, I also see the Storage & Hosting section with usage and estimated hosting cost

### Scenario 2: Contract expiring within 30 days

- **Given** my contract `end_date` is within 30 days of today
- **When** I navigate to the Billing page
- **Then** I see an amber "Expiring Soon" badge and the days remaining shown in amber
- **And** the Contact Support CTA is prominently visible with the 2-business-day SLA note

### Scenario 3: Expired contract — platform hard-lock

- **Given** my contract `end_date` has passed
- **When** I attempt to access any page in the Client Admin portal
- **Then** I am redirected to a contract-expired gate page
- **And** the gate page shows an "Expired" notice, the expiry date, and a Contact Support CTA to initiate renewal
- **And** I cannot access any other section of the portal until the contract is renewed and the SA updates the `end_date`
- **Note:** The Billing page itself shows the red "Expired" badge in V1. The platform-level hard-lock gate is V1 planned but requires a separate implementation pass (see §6.3).

### Scenario 4: No contract on file

- **Given** my tenant has no row in the `contracts` table
- **When** I navigate to the Billing page
- **Then** I see a neutral empty state: "No contract on file"
- **And** I see a Contact Support CTA to initiate contract setup

### Scenario 5: Seat limit warnings

- **Given** my active learner count approaches or exceeds the contracted `seat_count`
- **When** I view the Billing page
- **Then** the Learner Seats progress bar turns amber at ≥90% utilisation with a warning message
- **And** the bar turns red and shows an "Over seat limit" error at ≥100% utilisation
- **And** the same logic applies to Content Creator Seats for FULL_CREATOR tenants

### Scenario 6: Contact Support CTA — SLA expectation

- **Given** I want to make changes to my contract (renewal, seat increase, etc.)
- **When** I click "Contact Support" on the Billing page
- **Then** my default email client opens a pre-addressed email to `contact@keyskillset.com`
- **And** I see a highlighted note on the page: "We typically respond within 2 business days. You will receive a confirmation at your registered email once your request is received."

---

## 5. Technical Specifications

### 5.1 Data Entities & Logic

| Entity | Source | Fields Used |
|---|---|---|
| Contract | `contracts` WHERE `tenant_id = ?` | `seat_count`, `content_creator_seats`, `start_date`, `end_date`, `notes`, `updated_at` |
| Active Learners | `learners` WHERE `tenant_id = ? AND status = 'ACTIVE'` | `COUNT(*)` |
| Active Content Creators | `admin_users` WHERE `tenant_id = ? AND role = 'CONTENT_CREATOR' AND is_active = true` | `COUNT(*)` |
| Tenant Mode | `tenants` WHERE `id = ?` | `feature_toggle_mode` — determines FULL_CREATOR sections |

**Contract status derivation (client-side):**
```
daysRemaining = ceil((end_date - today) / 86400000)
status = daysRemaining < 0 → Expired
         daysRemaining <= 30 → Expiring Soon
         else → Active
```

**Seat utilisation:**
```
pct = (used / total) * 100
pct >= 100 → rose (over limit)
pct >= 90  → amber (approaching)
pct < 90   → violet (healthy)
```

### 5.2 API Requirements

No new API endpoints. All data fetched client-side via Supabase JS client in a single `Promise.all` on mount. Route: `/client-admin/[tenant]/billing`.

### 5.3 Infrastructure & Storage

- **Storage section data:** Currently static placeholder values (`12.4 GB`, `$18.60/mo`, `Mar 18, 2026`). A real `storage_snapshots` table is required for live data — deferred to V2 (see §6.2).
- **No file storage, triggers, or webhooks** in V1.
- **No audit logging** — read-only view; no mutations occur on this page.
- **Contact CTA:** `mailto:contact@keyskillset.com` — hardcoded. SA-configurable contact email deferred to V2.

---

## 6. Scope Boundaries

### 6.1 IN SCOPE — V1 (Shipped)

- Billing page route at `/client-admin/[tenant]/billing`
- "Billing" nav item in the Settings section of the CA sidebar (CreditCard icon)
- Contract Overview card: status badge, start/end dates, days remaining countdown
- Seat Usage progress bars: Learner Seats + Content Creator Seats (FULL_CREATOR only)
- Storage & Hosting section (FULL_CREATOR only): static placeholder data with "billed separately" note
- Contract Notes section (rendered only when `notes` is non-empty)
- Empty state for no contract on file
- Contact Support CTA with `mailto:contact@keyskillset.com`
- 2-business-day SLA highlighted note on the CTA section

### 6.2 OUT OF SCOPE — V2 (Deferred)

- **Live storage data** — requires a `storage_snapshots` DB table and a daily snapshot job
- **Downloadable PDF** of contract summary
- **In-app seat upgrade request form** (replaces email CTA with a structured form)
- **Renewal reminder email notifications** — triggered at 60, 30, and 7 days before contract expiry
- **SA-configurable contact email per tenant** — currently hardcoded to `contact@keyskillset.com`

### 6.3 V1 PLANNED — Implementation Pending (separate ticket)

- **Platform hard-lock on expired contracts** — When `end_date < today`, all CA portal pages should redirect to a contract-expired gate. Currently V1 shows the "Expired" badge on the Billing page only; no platform-level access gate exists. Requires middleware or layout-level contract check. Must ship before any client contract is allowed to lapse in production.

---

## 7. Edge Cases & Risk Mitigation

| Risk | Detail | Mitigation |
|---|---|---|
| Multiple CLIENT_ADMIN rows per tenant | Supabase returns the first-inserted row without an `is_active` filter, showing a deactivated CA's profile | Fixed: `.eq('is_active', true)` added to all CLIENT_ADMIN queries in `users-roles/page.tsx` and `layout.tsx` |
| No contract row | `contracts.maybeSingle()` returns null — page must render gracefully | Empty state handled: "No contract on file" with CTA |
| Over-seat scenarios already active | Learner count may exceed contracted seats; page must not crash | Progress bar clamps at 100%, red warning shown, no enforcement gate in V1 |
| Static storage data mismatch | Hardcoded storage values may not reflect reality for FULL_CREATOR tenants | "Daily snapshot" label + "Billed separately" note sets the right expectation; V2 live data resolves this |
| FULL_CREATOR with `content_creator_seats = 0` | SA may not have set CC seats | UsageBar only renders when `content_creator_seats > 0` — avoids divide-by-zero and misleading 0/0 display |
| Timezone edge cases | `end_date` stored as date string; `getDaysRemaining` uses UTC midnight normalisation | Both `today` and `end_date` set to midnight before diff — avoids off-by-one on the expiry day |

---

## 8. Success Metrics

| Metric | Definition | Target |
|---|---|---|
| **Proactive renewal rate** | % of CAs who initiate renewal contact (click CTA or email) before `end_date` | Baseline → track for 2 contract cycles post-ship |
| **Page visit frequency** | Billing page views per CA per month | ≥1 visit/month indicates CAs are actively monitoring |
| **Support ticket reduction** | Volume of inbound contract-status queries to `contact@keyskillset.com` | Track 30-day delta post-launch |

---

## 9. SEO & Metadata

- Internal authenticated route — no public indexing, no SEO requirements.
- No dynamic meta-tags needed.
- Page title: "Billing & Contract — keySkillset Client Admin".
