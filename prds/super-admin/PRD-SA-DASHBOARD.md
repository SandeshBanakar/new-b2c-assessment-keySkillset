# PRD KSS-SA-038: Super Admin Dashboard

**Status:** LOCKED  
**Author:** Sandesh Banakar I  
**Stakeholders:** Engineering, QA, Design  
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement
Super Admins had no centralised view of B2C platform health, revenue, and subscriber metrics. The Revenue tab was broken — returning empty data due to a DB migration that renamed plan status from `PUBLISHED` → `LIVE` without updating the analytics query. Plan publishing from the UI was also silently failing due to the same constraint mismatch.

### 1.2 Business Value & ROI
Provides the internal team a real-time (demo) view of B2C revenue performance, subscriber counts, MRR breakdown, and new subscription trends. Enables informed decisions on pricing, plan structure, and growth strategy ahead of production Stripe integration.

### 1.3 Strategic Alignment
Aligns with Q2 2026 goal of shipping a demo-ready B2C platform for internal team review. The dashboard is an iteration-by-iteration build — Revenue tab is V1; other tabs follow in subsequent tickets.

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **Super Admin** | Can view B2C Revenue metrics (MRR, new subscriptions, churn rate, plan breakdown) from a single dashboard tab. Can publish B2C plans without DB constraint errors. |
| **Internal Team (Demo)** | Can review the revenue tab with seeded data to validate layout and data model before production Stripe integration. |

---

## 3. User Flow & System Logic

### 3.1 Functional Flowchart
- **Entry Point:** Super Admin navigates to `/super-admin/dashboard` → clicks **B2C Revenue** tab.
- **Process:** `fetchRevenue(range)` queries `plans` (B2C + PUBLISHED), joins `plan_subscribers`, and counts `users.subscription_start_date` in the selected date range.
- **Outcome:** KPI strip, MRR bar chart, new subscriptions time-series chart, and paginated plan table are rendered with live DB data.

### 3.2 State Transition Logic
Plan status lifecycle (B2C plans):
- `DRAFT` → `PUBLISHED` (publish action via Plans & Pricing page or PlanOverviewTab)
- `PUBLISHED` → `DRAFT` (unpublish)
- `PUBLISHED` → `DELETED` (soft delete)

B2B plans retain `LIVE` status. Both `LIVE` and `PUBLISHED` are valid DB constraint values post KSS-DB migration.

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: View B2C Revenue Tab
* **Given** I am a Super Admin on `/super-admin/dashboard`
* **When** I click the **B2C Revenue** tab
* **Then** the system renders KPI cards (Total MRR, New Subscriptions, Churn Rate), MRR by Plan bar chart, New Subscriptions Over Time chart, and a paginated plan table with BILLING and ADDED ON columns.

### Scenario 2: MRR Calculation
* **Given** a B2C plan with `billing_cycle = 'ANNUAL'` and `price = 12000`
* **When** MRR is computed
* **Then** MRR = `(12000 / 12) × subscriber_count = 1000 × subscriber_count`
* **And** monthly plans use `price × subscriber_count` directly.

### Scenario 3: Info Tooltip — Total MRR
* **Given** I hover over or click the ⓘ icon on the Total MRR card
* **When** the tooltip opens (click-to-toggle, click-outside-to-close)
* **Then** it shows: formula `(Annual Revenue ÷ 12) × subscribers per plan`, note that it includes both assessment and course plans, and that in production this value is pulled from Stripe.

### Scenario 4: Pagination
* **Given** the plan table has more rows than the current page size
* **When** I change the page or page size (10 / 15 / 25)
* **Then** the visible rows update and the **table footer MRR** reflects only the visible page total.
* **And** the **KPI card Total MRR** always reflects the grand total across all plans.

### Scenario 5: Publish B2C Plan (fix)
* **Given** a B2C plan exists in DRAFT
* **When** I click Publish in Plans & Pricing
* **Then** the plan status is saved as `PUBLISHED` in the DB (constraint allows it post-migration).
* **And** the plan appears in the B2C Revenue tab.

---

## 5. Technical Specifications

### 5.1 Data Entities & Logic

**Primary Query — `fetchRevenue` (analytics.ts):**
```sql
SELECT id, name, price, billing_cycle, created_at
FROM plans
WHERE plan_audience = 'B2C' AND status = 'PUBLISHED'
ORDER BY created_at DESC
```

**MRR formula per plan:**
```
effectiveMonthlyPrice = billing_cycle === 'ANNUAL' ? price / 12 : price
mrr = effectiveMonthlyPrice × subscriber_count
```

**Total MRR:** Sum of all plan MRRs (not paginated — always full dataset).

**New Subscriptions:** Count of `users` rows where `subscription_start_date` is within the selected date range.

**Churn Rate:** Static estimate (2.8%) — production value pulled from Stripe.

### 5.2 DB Constraint (post-migration KSS-SA-038)
```sql
CHECK (status = ANY (ARRAY['DRAFT','PUBLISHED','LIVE','DELETED']))
```
B2C plans: `PUBLISHED`. B2B plans: `LIVE`.

### 5.3 Components
| Component | Path | Purpose |
|---|---|---|
| `InfoTooltip` | `src/components/ui/InfoTooltip.tsx` | Reusable click-to-open popover below icon. Click outside to close. |
| `PaginationBar` | `src/components/ui/PaginationBar.tsx` | Existing. Used with `pageSizeOptions=[10,15,25]`. |
| `RevenueTab` | `src/components/analytics/RevenueTab.tsx` | Main revenue tab renderer. |
| `fetchRevenue` | `src/lib/supabase/analytics.ts` | Data fetcher with corrected MRR calc. |

### 5.4 Tooltip Content

| Card | Tooltip Text |
|---|---|
| **Total MRR** | In production, MRR is pulled directly from Stripe. Calculated as: (Annual Revenue ÷ 12) × subscribers per plan, summed across all active B2C plans. Includes both assessment plans and course plans. |
| **New Subscriptions** | In production, this value is pulled from Stripe and reflects the number of users who have completed a paid subscription in the selected period. |
| **Churn Rate** | In production, churn rate is pulled directly from Stripe. No manual calculation is applied. |
| **Plan column** | This column has entries of all course and assessment plans, including single course + bundle course + platform plans + category plans. The list is displayed with recently added as first. |

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1 — KSS-SA-038)
- B2C Revenue tab: KPI cards, MRR bar chart, new subscriptions chart, paginated plan table
- InfoTooltip component (reusable)
- MRR calculation fix (annual → monthly conversion)
- DB migration: restore `PUBLISHED` status, migrate existing `LIVE` B2C plans
- Plan publish fix: B2C plans now correctly save as `PUBLISHED`
- Tab renamed from "Revenue" → "B2C Revenue"
- Pagination: 10/15/25 rows, page-scoped footer MRR

### 6.2 OUT OF SCOPE (V2 / Deferred)
- Live Stripe API integration (currently simulated)
- Real churn rate calculation
- Platform Health tab detail
- Client Admins tab detail
- Assessments tab detail (in Dashboard context)
- Export to CSV

---

## 7. Other Dashboard Tabs — Coming Soon

### Platform Health Tab
> **Coming Soon** — Will cover active users, session counts, assessment attempt volumes, error rates, and infrastructure health metrics. To be specced in a future iteration of this PRD.

### Client Admins Tab
> **Coming Soon** — Will cover tenant-level activity, new client onboarding counts, active vs. churned B2B tenants, and seat utilisation. To be specced in a future iteration of this PRD.

### Assessments Tab
> **Coming Soon** — Will cover total assessments taken, pass/fail rates, top-performing assessments by completion, and learner engagement metrics across B2C and B2B. To be specced in a future iteration of this PRD.

---

## 8. Edge Cases & Risk Mitigation
- **No B2C plans published:** Revenue tab renders with zeroed KPI cards and empty table — no crash.
- **Annual plan with zero subscribers:** MRR = 0, not null.
- **Tooltip in table header `<th>`:** Wrapped in `<div className="relative">` inside `<th>` to allow absolute child positioning.
- **Pagination with fewer rows than page size:** PaginationBar returns null when `totalPages === 0` or single page.

---

## 9. Success Metrics
- **Primary:** Revenue tab shows non-zero MRR data for all 13 published B2C plans.
- **Technical:** `fetchRevenue` query returns in < 500ms. MRR values match manual cross-check of `(price/12 or price) × subscriber_count`.
