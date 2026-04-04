# CLAUDE-PLATFORM.md — Platform Rules, UI & Specs
# Imported by CLAUDE.md. Read before any UI, nav, roles, tenant, plan, or content task.

---

## DESIGN SYSTEM

```
Primary:     blue-700 / hover:blue-800
Destructive: rose-600 / hover:rose-700
Background:  zinc-50
Surface:     white
Text:        zinc-900 / zinc-600 / zinc-400
Border:      zinc-200
Radius:      rounded-md
Weight:      font-medium / font-semibold (NEVER font-bold)
Icons:       lucide-react ONLY
Colors:      Tailwind tokens ONLY — zero custom hex, zero inline styles
```

Plan tier badge colours:
- `BASIC` = zinc-100/zinc-600
- `PRO` = blue-50/blue-700
- `PREMIUM` = amber-50/amber-700
- `ENTERPRISE` = violet-50/violet-700

Feature Mode chips (Tenant detail header):
- `FULL_CREATOR` = amber chip
- `RUN_ONLY` = zinc chip

---

## PLATFORM HIERARCHY (V1 — locked)

```
Super Admin
  └── Content Creator (tenant_id=NULL, Master Org)
Client Admin (one per tenant)
  └── Content Creator (FULL_CREATOR tenants only, tenant_id=B2B tenant)
B2C Student / Professional (direct)
```

`/content-creator/[tenant]/` — Future scope. Not built. Coming Soon placeholder only.

---

## SIDEBAR NAV (locked v4.0)

```
(none)               Dashboard             ✅ built
Content Management   Content Bank          ✅ built
Content Management   Plans & Pricing       ✅ built
Master Org           B2C Users             ✅ built
Master Org           Content Creators      ✅ built
Organisations        Tenants               ✅ built
Course Creation      Create Course         🟡 pending
Assessment Creation  Sources & Questions   Coming Soon
Assessment Creation  Question Bank         Coming Soon
Assessment Creation  Create Assessments    Coming Soon
Assessment Creation  Bulk Upload           Coming Soon
Configuration        Marketing Config      Coming Soon
Compliance           Audit Log             ✅ built
```

Nav group order: Content Management → Master Organisation → Organisations →
Course Creation → Assessment Creation → Configuration → Compliance

Permanently removed: Analytics nav item (merged to Dashboard) | Course Store

---

## PERSONA SELECTOR (locked)

Admin personas use `rounded-md`. Learner personas use `rounded-full`.

```
Super Admin → /super-admin         blue-700
Akash CA    → /client-admin/akash  violet-700
TechCorp CA → /client-admin/techcorp teal-700
Learner     → Free | Basic | Pro | Premium
```

Content Creator personas (`/content-creator/[tenant]/`) are **not built in V1**.
TechCorp has no CC persona (RUN_ONLY). Akash CC route shows Coming Soon placeholder only.

---

## KEY FILES

```
src/app/super-admin/tenants/[id]/page.tsx          6-tab tenant detail
src/components/tenant-detail/EditDetailsSlideOver.tsx
src/components/tenant-detail/PlansTab.tsx
src/components/tenant-detail/AssignPlanSlideOver.tsx
src/components/tenant-detail/ContentTab.tsx        OBSOLETE — never import
src/app/super-admin/plans/[id]/page.tsx
src/components/plans/AddContentSlideOver.tsx
src/components/plans/PlanContentTab.tsx
src/components/plans/ContentPlanUsageModal.tsx
src/components/plans/EditPlanSlideOver.tsx
src/components/plans/SingleCoursePlanEditSlideOver.tsx (plan detail page only)
src/app/super-admin/plans-pricing/page.tsx         4-tab
src/app/super-admin/plans-pricing/new/page.tsx
src/lib/supabase/plans.ts
src/lib/supabase/content-creators.ts
src/lib/supabase/b2c-users.ts
src/lib/supabase/content-bank.ts
src/app/super-admin/b2c-users/page.tsx
src/app/super-admin/b2c-users/[id]/page.tsx
src/app/super-admin/dashboard/page.tsx
src/app/assessments/[id]/exam/page.tsx             LinearExamPlayer
src/hooks/useExamEngine.ts
src/data/demoUsers.ts | src/data/assessments.ts | src/lib/supabase/client.ts
```

Utility: `formatCourseType()` in `src/lib/utils.ts` — use everywhere `course_type` is displayed.
Never display raw DB values. Mappings:
`VIDEO→Video | DOCUMENT→Document | CLICK_BASED→Click Based | CODING_SANDBOX→Simulation | COMBINATION→Combination | KEYBOARD_TRAINER→Keyboard Based`

---

## CONTENT LIFECYCLE (locked)

```
DRAFT    → creator saves. Not visible to SA.
INACTIVE → creator submits. SA reviews. Not visible to learners.
LIVE     → SA promotes with audience selection. Visible via plan membership.
ARCHIVED → soft removed. Read-only. History retained.
```

- `audience_type` set by SA at Make Live step ONLY — nullable on DRAFT/INACTIVE
- B2C plans: `B2C_ONLY` or `BOTH` content only
- B2B plans: `B2B_ONLY` or `BOTH` content only
- SA Content Bank: GLOBAL content only — never TENANT_PRIVATE
- `last_modified_by` updated on every save. `created_by` never changes.

---

## TENANT DETAIL PAGE — 6 TABS (locked)

Tab order: **Overview | Plans | Users & Roles | Learners | Contract | Audit History**

**Overview tab:**
- Quick Actions bar INSIDE Overview tab only (above two-card row) — Edit Details | Deactivate/Reactivate
- Left card: Tenant Name, Type, Feature Mode, Status, Created, Client Admin
- Right card: Seat Usage bar (`blue-700` <90%, `amber-500` ≥90%, `rose-600` 100%)
- Below: Contact/Address (read-only, "—" for nulls)

**Edit Details SlideOver:**
- Section 1: Tenant Setup — name, feature mode, logo drag-drop (500KB PNG/JPG → `tenant-logo/{tenant_id}.jpg`)
- Section 2: Address & Locale — address fields, country combobox, IANA timezone, date format
- Section 3: Client Profile — contact fields + inline CA assignment
- Unsaved changes guard on close. On save: logo upload → UPDATE tenants → audit `TENANT_UPDATED`

**Plans tab:** Docebo accordion. Assign Plan → AssignPlanSlideOver (B2B plans not yet assigned).
Duplicate badge: ⚠ In N plans → ContentPlanUsageModal.

**Learners tab:**
- Archive (reversible, seat decremented, audit `LEARNER_ARCHIVED`)
- Hard Delete (GDPR two-step, tombstone row `[Deleted User]`, irreversible)
- Kebab menu per row. No bulk actions V1.

**Contract tab:**
- Read-only default + Edit button unlocks editing
- Section 1: Learner Seats, ARR, Start/End Date, Stripe ID, Notes
- Creator Seats ONLY for `FULL_CREATOR`
- Section 2: Payment Overview (static mock)
- Section 3: Storage & Hosting — HIDDEN for `RUN_ONLY`, mock values for `FULL_CREATOR`

---

## PLANS & PRICING SPEC

Route: `/super-admin/plans-pricing`
Subtitle: "Manage B2C and B2B subscription plans and content entitlements"
No global Create button — tab-scoped buttons only.

**Tab 1 — Assessment Plans:** Card grid. Platform Plans (PLATFORM_WIDE B2C) + Category Plans (CATEGORY_BUNDLE B2C).
- MRR strip inside Tab 1 ONLY — not in page header or other tabs
- Edit via Pencil icon in card footer — no 3-dot menu

**Tab 2 — Single Course Plan:** Table (Plan Name | Course Name | Price USD | Status | View/Edit).
- View/Edit navigates to plan detail page
- Editing via `SingleCoursePlanEditSlideOver` (plan detail page only — not from table)

**Tab 3 — Course Bundle Plans:** Table. Create button top-right only.
- B2C only, PLATFORM_WIDE, annual, no tier, no `is_popular`/`cta_label`

**Tab 4 — B2B Plans:** Card grid. No price shown — "B2B plan pricing managed per-tenant via Contract tab."

**Plan content rules:**
- `ASSESSMENT` plans: hide Add Course in PlanContentTab
- `COURSE_BUNDLE` plans: hide Add Assessment in PlanContentTab
- `SINGLE_COURSE_PLAN`: shows Courses section ONLY. Max 1 course.
  Add Course button disabled (`opacity-50, cursor-not-allowed`) with Tailwind tooltip when `courses.length >= 1`
  Tooltip: "A course is already assigned to this plan. Remove it first to replace."
- `AddContentSlideOver` `singleSelect=true` for SINGLE_COURSE_PLAN COURSE content → radio buttons

**B2B plan rules:**
- `plan_category = 'ALL_CONTENT'` — always show BOTH assessments and courses in Content tab
- Overview: no MRR/Subscribers/Price metric boxes — Plan Details at top instead
- Overview: no Stripe Product ID or Billing Cycle in Plan Details
- `max_attempts` default = 10, editable in form and plan detail Overview tab

**Feature Bullets (B2C only):** JSONB, max 7, 80 chars each, start with 3 inputs.

**`derivePlanType()`:** uses `plan.scope` column — never `plan.name`

**Purchasable courses:**
- `is_individually_purchasable` courses EXCLUDED from B2C subscription plan pickers
- Greyed out in `AddContentSlideOver` with tooltip
- ALLOWED in course bundles — no gate for bundles

---

## B2C USER PROFILE SPEC

Single unified **"Subscriptions & Activity"** section — no separate Assessment/Course Performance sections.

**(1) Assessment Plans** — expandable rows, lazy-loaded:
- Expanded: "Attempted (N)" sub-section (open) with Assessment grid:
  Title | Category | Attempts Used (`X/6` or `X/—` if plan retired) | Best Accuracy | Last Attempted | View Attempts
- "Not Yet Started (N)" sub-section (collapsed toggle), paginated 20/page
- Cancelled plan "Not Yet Started": muted + amber warning "Plan cancelled — no longer accessible"
- Retired plan (`plan_id=null`): "Plan data unavailable" message

**(2) Course Plans** — expandable rows, lazy-loaded:
- 3-cell meta row: Started | Next Renewal | Certificate (number + issued date via Award icon)
- Then: module breakdown with inline accordion (modules + topics + progress %)
- Module progress from `b2c_module_progress` (`progress_pct int, status text`) — NOT `completed/completed_at`

**(3) Free Access Activity** — auto-shown if user has attempts on assessments not covered by any plan:
- Ceiling display: `X / 1`
- Label (exact): "These assessments were accessed using the free attempt entitlement. No plan subscription covers these."

**Attempt History** — `AttemptHistorySlideOver` (single instance at page level):
- Columns: Attempt # (with "(free)" on #1) | Date | Accuracy | Score | Time
- Read-only — no pass/fail shown anywhere in SA view
- Pass/fail removed from SA B2C profile UI ONLY — DB column and exam engine untouched

**B2C Users list:** paginated 20/page, URL params (`?page ?tier ?status ?search`), Suspense wrapper.
Course Performance 'Free' badge: show when no `b2c_course_subscriptions` row for `user+course`.
`cancel_at_period_end=true`: show amber "Cancels [date]" below Active badge — never change badge to non-Active.

---

## EXAM ENGINE — LOCKED BEHAVIOURS

NEVER modify without explicit "Override locked behaviour" instruction.

**Fixes that require "Override locked behaviour" in the same message:**
- KSS-B2C-FIX-025-FINAL (state machine) — touches core engine logic directly
- KSS-B2C-FIX-027 (MCQ_MULTI + NUMERIC renderers) — adds new question type handling to engine

**Fixes that do NOT require the override (UI/UX layer only):**
- KSS-B2C-FIX-023 (back button + ChevronLeft), FIX-024 (cross-section navigation),
  FIX-026 (mobile hard block modal), FIX-028 (draggable calculator)

- 5 question states: `not_visited | answered | marked_for_review | visited_unanswered | answered_and_marked`
- Previous: navigates only, no save. Disabled on Q1 Section 1 only.
- Mark for Review: one-directional. Unmark only via Save & Next.
- Timer: never pauses. Auto-submits at `00:00:00`.
- Types: MCQ_SINGLE ✅ | MCQ_MULTI ✅ | PASSAGE_SINGLE ✅ | PASSAGE_MULTI ✅ | NUMERIC ✅

---

## CLIENT ADMIN PLATFORM (V1 — locked)

```
Routes: /client-admin/[tenant]/  | /org | /learners | /catalog
        /content-bank (FULL_CREATOR only) | /reports | /users-roles
Tenant slugs: akash (FULL_CREATOR) | techcorp (RUN_ONLY) — IDs in CLAUDE-DB.md
```

**CA Sidebar:** Dashboard | Organisation | Learners | Global Catalog | Content Bank (FULL_CREATOR only) | Reports | Users & Roles | Audit Log (placeholder)

**Content model:**
- `tenant_scope_id=NULL` → GLOBAL (SA content)
- `tenant_scope_id NOT NULL` → TENANT_PRIVATE (tenant content)

**Source badges (locked):**
- "keySkillset Content" (zinc) on ALL GLOBAL rows — always
- "Your Organisation" (amber) on TENANT_PRIVATE rows

**CA Catalog:**
- FULL_CREATOR: GLOBAL (from assigned plans) + TENANT_PRIVATE LIVE
- RUN_ONLY: GLOBAL from assigned plans only

**CA Content Bank:** TENANT_PRIVATE items only. Make Live keeps `visibility_scope=TENANT_PRIVATE`. No `audience_type`.

**Users & Roles (SA view — tenant detail) — KSS-SA-018:**
- Invite User slideover ALWAYS opens for both FULL_CREATOR and RUN_ONLY — never disable the button
- If an active Client Admin already exists when SA submits → show inline error (rose text, locked copy):
  "An active Client Admin already exists. Remove the current one before inviting a new one."
- RUN_ONLY: role dropdown shows Client Admin only (no Content Creator option)
- FULL_CREATOR: role dropdown shows Client Admin + Content Creator
- Contract limit enforcement for Content Creators is Phase 2 (KSS-SA-019) — not in V1

**CA Users & Roles (CA self-view):**
- Section 1: My Profile (name editable, email read-only, role read-only)
- Section 2: Content Creators (FULL_CREATOR only) — Add CC (Name+Email+Password), "Coming Soon" badge on interface

**V1 excluded (never add):** Groups | Learning Paths | Assessment certs | R1/R2/R4 reports | PENDING_PROMOTION

---

## GLOBAL UI RULES

- Email never editable after creation — all edit forms (learners, CCs, CA Users & Roles)
- Quick Actions bar ONLY inside Overview tab — never in page header
- Global Toast via `useToast()` from `@/components/ui/Toast` — no local toast state in pages
- `FooterAdmins` (Copyright Hotkey Holdings LLC): super admin + client admin layouts ONLY
- `FooterEndUser` (Copyright keySkillset 2026): B2C PageWrapper ONLY — never swap
- Remove user from Users & Roles: popup modal (not inline confirm) with destructive copy
- RUN_ONLY tenant Invite User: no Content Creator role option — Client Admin only
- `/super-admin/analytics` permanently redirects to `/super-admin/dashboard`
- Dashboard: 4 tabs — Platform Health | Revenue | Client Admins | Assessments
- "Client Admin" label in SA pages/nav (display only — not a DB role value)
- "B2C Users" under "Master Organisation" nav group
- CA sidebar: logo replaces initials when `logo_url` present; fallback = initials badge

---

## CONTENT PLAN USAGE MODAL

Component: `src/components/plans/ContentPlanUsageModal.tsx`
Columns: Plan Name | Audience badge | Status badge | Remove (trash → inline confirm, no nested modals)
Auto-closes when < 2 plans remain.