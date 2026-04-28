# PRD KSS-B2B-PORTAL-001: B2B Learner Portal

**Status:** LOCKED — V1 COMPLETE (Spec-as-built, Apr 28 2026)
**Author:** Sandesh Banakar I
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA, Design
**Target Version:** V1 (Live)
**Related PRDs:** `PRD-B2B-UI-001.md` (UI Overhaul), `PRD-B2B-REPORT-CARD-001.md` (Report Card)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement
B2B enterprise clients (tenants) need a dedicated, white-label learning portal for their employees (learners). Prior to this build, there was no learner-facing interface for B2B tenants — learners had no way to view assigned courses, take assessments, or track their certificates independently from the B2C product.

### 1.2 Business Value & ROI
- Enables B2B client onboarding by giving learners a self-serve portal scoped to their tenant
- Separates B2B learner state from B2C user state — no cross-contamination of analytics or access
- Unlocks certificate issuance for enterprise learners, supporting compliance and training completion workflows
- Reduces client admin support load by giving learners visibility into their own progress and history

### 1.3 Strategic Alignment
Directly supports the B2B revenue stream. Enterprise clients evaluate platforms on learner experience — a polished, mobile-first portal is table-stakes for renewal and upsell.

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **B2B Learner** | Can independently view all assigned courses and assessments, track progress, review attempt history, and download certificates — without contacting their admin. |
| **Client Admin (FULL CREATOR)** | Creates content in SA tools and assigns it to learners via `learner_content_access`. Learners see it immediately on their portal. |
| **Client Admin (RUN ONLY)** | Cannot create content. Receives SA-pushed content and assigns it to specific learners via `learner_content_access`. Super Admin may also assign directly. |
| **Super Admin** | Pushes content to RUN ONLY tenants. Can assign content to learners on behalf of RUN ONLY client admins. Full visibility across all tenants. |

### 2.1 Content Assignment Flow

```
FULL CREATOR TENANT
  CA creates content (SA tools)
    └─→ CA assigns to learner via learner_content_access
          └─→ Learner sees content on portal immediately

RUN ONLY TENANT
  SA creates and publishes content
    └─→ SA pushes content to tenant
          └─→ CA assigns to specific learners via learner_content_access
          OR
          └─→ SA assigns directly to learners (bypass CA)
                └─→ Learner sees content on portal immediately
```

Access gate on all portal queries: `revoked_at IS NULL` on `learner_content_access`.

---

## 3. User Flow & System Logic

### 3.1 Portal Structure

```
/b2b-learner/[tenant]/
├── (root)          → My Learning dashboard
├── /courses        → Courses list with filters
├── /assessments    → Assessments list with filters
└── /certificates   → Certificates (Course + Assessment tabs)
```

All routes are guarded by `B2BAuthGuard`. Context is provided by `B2BLearnerContext` (learner identity, tenant slug, tenant ID, logout).

### 3.2 State Transition Logic

**Course progress states:**
`NOT_STARTED → IN_PROGRESS → COMPLETED`
Sourced from `learner_course_progress.status` and `progress_pct`.

**Assessment attempt states:**
`NOT_STARTED (0) → IN_PROGRESS (1–4 attempts) → EXHAUSTED (5 attempts)`
Sourced from count of rows in `learner_attempts` per `content_id`.

**Certificate issuance:**
- Course: issued when `learner_course_progress.progress_pct = 100` (all modules completed, module/sub-module tests excluded from progress calculation)
- Assessment: issued when learner achieves ≥80% on any single attempt (`learner_attempts.score_pct >= 80`)

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: My Learning Dashboard
* **Given** I am an authenticated B2B learner
* **When** I land on `/b2b-learner/[tenant]`
* **Then** I see a welcome header with my name, department, and overall course progress %
* **And** I see stat cards: Courses In Progress, Courses Completed, Assessments Done (≥5 attempts), Certificates earned
* **And** I see a "Newly Assigned" section showing the 2 most recently assigned courses and assessments
* **And** I see a "Continue Learning" grid of all IN_PROGRESS courses with progress bars

### Scenario 2: Courses List with Filters
* **Given** I am on `/b2b-learner/[tenant]/courses`
* **When** the page loads
* **Then** I see all courses I have active access to (`revoked_at IS NULL`)
* **And** I can filter by category (dropdown, visible only when >2 distinct categories exist)
* **And** I can filter by status (pill buttons: All / Not Started / In Progress / Completed) with per-status counts
* **And** the filtered list updates in real time client-side (no re-fetch)

### Scenario 3: Assessments List with Filters
* **Given** I am on `/b2b-learner/[tenant]/assessments`
* **When** the page loads
* **Then** I see all assessments I have active access to
* **And** I see an "Attempts Summary Panel" (Attempted / Passed / Avg Score) if I have at least 1 attempt
* **And** I can filter by exam category (dropdown, visible only when >2 distinct categories exist)
* **And** I can filter by status (pill buttons: All / Not Started / In Progress / Exhausted) with counts
* **And** each assessment card shows: gradient header by exam category, category + test-type pills, duration/questions/difficulty metadata, attempt progress bar (when attempts > 0), CTA button per state

### Scenario 4: Assessment CTA States
* **Given** an assessment card is rendered
* **When** attemptCount = 0
* **Then** CTA shows "Start Assessment" (blue)
* **When** 1 ≤ attemptCount ≤ 4
* **Then** CTA shows "Start New Attempt" with remaining count chip (blue)
* **When** attemptCount = 5 (exhausted)
* **Then** CTA shows "View Analysis" ghost button → navigates to `?tab=attempts` on detail page

### Scenario 5: Certificates Page
* **Given** I am on `/b2b-learner/[tenant]/certificates`
* **When** the page loads
* **Then** I see a banner: "Pass any assessment with 80% or higher to show here. Your best attempt counts."
* **And** I see two tabs: Course Certificates and Assessment Certificates
* **And** each tab shows a stats row and a 2-column card grid of earned certificates
* **And** each certificate card (vertical layout) shows: type accent bar, award icon, course/assessment title, type badge, certificate number, issued date, Download button

### Scenario 6: Filter empty state
* **Given** I have applied category and/or status filters on courses or assessments
* **When** no items match the combined filters
* **Then** I see an empty state card: "No [courses/assessments] match your filters."
* **And** the original list is not shown

---

## 5. Technical Specifications

### 5.1 Data Entities & Logic

| Table | Role in Portal |
|---|---|
| `learner_content_access` | Access gate — `revoked_at IS NULL` filter applied on all queries |
| `learner_course_progress` | Course status, `progress_pct`, `started_at`, `completed_at` |
| `learner_attempts` | Assessment attempt history — `score_pct`, `passed`, `attempted_at`, `time_taken_seconds` |
| `certificates` | Polymorphic — `content_type: 'COURSE' \| 'ASSESSMENT'` |
| `courses` | `id, title, description, course_type, category, status` |
| `assessment_items` | SA-canonical assessment content — `id, title, test_type, assessments_id, exam_categories` |
| `assessments` | Exam engine config — `duration_minutes, total_questions, total_marks, difficulty` (fetched via two-step: `assessments_id` column first, then separate query) |
| `departments` | Optional learner department metadata — used in dashboard welcome header |

**Key DB rules:**
- RLS is OFF. All queries are scoped by `learner_id` + `tenant_id` explicitly.
- PostgREST join hint (`assessments!assessments_id(...)`) is NOT used — the FK may not be registered. Two-step fetch pattern is the standard for `assessment_items → assessments`.
- Attempt count cap: `MAX_ATTEMPTS = 5` (client-side constant).

### 5.2 Certification Rules (Locked)

| Content Type | Rule | Data Source |
|---|---|---|
| Course | `learner_course_progress.progress_pct = 100` — all modules completed; module/sub-module tests excluded from progress calculation | `learner_course_progress` |
| Assessment | Any single attempt with `score_pct >= 80` | `learner_attempts` |

### 5.3 Gradient Rendering Rule (Tailwind v4 Constraint)
Dynamic gradient classes built from Record/variable lookups are NOT compiled by Tailwind v4. All runtime-computed gradients use `React.CSSProperties` with inline `linear-gradient()` hex values.

```typescript
// Correct pattern
const EXAM_GRADIENT_STYLE: Record<string, React.CSSProperties> = {
  SAT: { background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
};

// Never do this
const EXAM_GRADIENT: Record<string, string> = {
  SAT: 'from-blue-500 to-indigo-600', // will NOT render
};
```

### 5.4 Component Architecture

| Component | Location | Shared |
|---|---|---|
| `B2BNavbar` | `src/components/layout/B2BNavbar.tsx` | All portal pages |
| `B2BAuthGuard` | `src/components/shared/B2BAuthGuard.tsx` | All portal pages |
| `B2BLearnerContext` | `src/context/B2BLearnerContext.tsx` | All portal pages |
| `CertificateCard` | `src/components/certificates/CertificateCard.tsx` | Certificates page |
| `CertificateTabsContent` | `src/components/certificates/CertificateTabsContent.tsx` | Certificates page |

### 5.5 Navbar Layout
Single-row, 3-column CSS grid: `gridTemplateColumns: 'auto 1fr auto'`
- Column 1: Brand logo / tenant name
- Column 2: Nav tabs centered (`justify-center overflow-x-auto scrollbar-none` for mobile scroll)
- Column 3: Learner avatar initials + logout button

Mobile: all 3 columns remain on the same row; tabs scroll horizontally within their column.

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1 — COMPLETE)
- My Learning dashboard: welcome header, stats, Newly Assigned, Continue Learning
- Courses list: cards with progress bars, category + status filters
- Assessments list: cards with attempt tracking, category + status filters, Attempts Summary Panel
- Certificates page: Course + Assessment tabs, vertical card layout, 2-column grid, 80% cert threshold banner
- B2BNavbar: single-row responsive layout, active tab indicator
- B2BAuthGuard + B2BLearnerContext: tenant-scoped authentication

### 6.2 OUT OF SCOPE (V2 / Deferred)
- **Exam engine routing** — "Start Assessment" / "Start New Attempt" buttons are UI placeholders; B2BLearnerContext is not yet wired to the exam engine AppContext
- **Assessment detail analytics** — per-attempt drill-down requires `learner_attempt_answers` table (not yet built for B2B)
- **Report Card Phase 2** — Salesforce webhook + `report_card_requests` DB write on request (see `PRD-B2B-REPORT-CARD-001.md`)
- **Report Card Phase 3** — PDF generation, CA audit view, white-label PDF branding
- **Module-level progress tracking** — module/sub-module test exclusion from progress is a production rule, not yet replicated in B2B DB queries
- **Course thumbnail images** — currently rendered as colored placeholder; thumbnail URL storage and display deferred

---

## 7. Edge Cases & Risk Mitigation

| Risk | Mitigation |
|---|---|
| Learner sees content from another tenant | All queries scope by both `learner_id` AND `tenant_id` — no single-key queries |
| Revoked access still shows | `revoked_at IS NULL` applied consistently across all `learner_content_access` queries |
| Assessment with no linked `assessments` record | `assessments_id` is nullable; two-step fetch gracefully returns `null` for missing meta — cards render with `—` placeholders |
| PostgREST 400 on FK join hint | Two-step fetch pattern replaces all `table!fk_column(...)` join hints for `assessment_items → assessments` |
| Dynamic gradient class not rendered | All runtime-computed gradients use inline `React.CSSProperties` — never dynamic Tailwind class strings |
| Filter leaves zero results | Dedicated empty state: "No [items] match your filters." — distinct from the zero-access empty state |
| Attempt count exceeds 5 in DB | `MAX_ATTEMPTS = 5` is a client-side constant; exhausted state is checked with `>=` not `===` |

---

## 8. Success Metrics (KPIs)

| Metric | Target | Measurement |
|---|---|---|
| **Content start rate** | ≥70% of assigned content started within 7 days of assignment | `learner_content_access.granted_at` vs `learner_course_progress.started_at` / first `learner_attempts` row |
| **Assessment attempt rate** | ≥60% of assigned assessments reach ≥1 attempt | `learner_attempts` count per `content_id` |
| **Certificate conversion** | ≥25% of learners who attempt all 5 assessment slots earn a certificate | `certificates` rows / `learner_attempts` exhausted learners |
| **Portal load time** | Dashboard renders in <1.5s on 4G mobile | Measured via Vercel Analytics / Core Web Vitals |

---

## 9. SEO & Metadata

Not applicable — all portal routes are behind authentication (`B2BAuthGuard`). No public-facing URLs. No schema markup or meta-tag requirements for V1.
