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

**AttemptPillFilter — locked design (Apr 17 2026):**
- Component: `src/components/ui/AttemptPillFilter.tsx`
- Shape: `rounded-full`, active = `bg-blue-700 text-white`, inactive = `bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700`
- Label: `Attempt N` only — NO score displayed. `(Latest)` tag on most recent pill.
- Applies platform-wide to ALL analytics tabs (SAT full test, SAT subject test, AnalyticsTab chapter/other). Never show score in the pill.

Plan tier badge colours (Assessment plans only — BASIC/PRO/PREMIUM/ENTERPRISE never apply to course plans):
- `BASIC` = zinc-100/zinc-600
- `PRO` = blue-50/blue-700
- `PREMIUM` = amber-50/amber-700
- `ENTERPRISE` = violet-50/violet-700
- `FREE` (SINGLE_COURSE_PLAN only) = green-50/green-700

Single Course Plan rules (KSS-SA-026):
- `is_free=true` → Pricing Mode = "Free Plan". Price fields hidden. tier='FREE', price=0, price_usd=0, stripe_price_id=NULL.
- `is_free=false` → Pricing Mode = "Paid Plan". tier=NULL (never BASIC/PRO/PREMIUM for courses).
- One active (DRAFT or PUBLISHED) plan per course — enforced in create form via `checkCourseHasActivePlan()`. Error shown inline.
- Switching paid→free on edit triggers a warning modal before applying.
- `syncCourseFromPlan` is unchanged — free plans sync price=0, price_usd=0, stripe_price_id=NULL + is_individually_purchasable=true.

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
(none)               Dashboard             [DONE]
Content Management   Content Bank          [DONE]
Content Management   Plans & Pricing       [DONE]
Master Org           B2C Users             [DONE]
Master Org           Content Creators      [DONE]
Organisations        Tenants               [DONE]
Course Creation      Create Course         [PENDING]
Assessment Creation  Sources & Chapters    [DONE] (route: /super-admin/sources-chapters)
Assessment Creation  Question Bank         [DONE] (route: /super-admin/question-bank)
Assessment Creation  Create Assessments    [DONE] (list + archive)
Assessment Creation  Bulk Upload           Coming Soon
Configuration        Marketing Config      Coming Soon
Compliance           Audit Log             [DONE]
```

Nav group order: Content Management → Master Organisation → Organisations →
Course Creation → Assessment Creation → Configuration → Compliance

Permanently removed: Analytics nav item (merged to Dashboard) | Course Store

---

## PERSONA SELECTOR (locked — updated KSS-SA-039 Apr 18 2026)

Admin personas use `rounded-md`. Learner personas use `rounded-full`.

```
Super Admin → /super-admin           blue-700
Akash CA    → /client-admin/akash    violet-700
TechCorp CA → /client-admin/techcorp teal-700
Learner (Platform Plans) → Free | Basic | Pro | Premium
Learner (Category Plans) → NEET Basic | JEE Basic | CLAT Basic
```

**Category Plan Learners bay** (below "Learner Personas" divider, same `rounded-full` grid):
| Persona | UUID | Colour | Icon | Badge |
|---------|------|--------|------|-------|
| Ananya Krishnan | `c1a2e3b4-5f6a-7b8c-9d0e-f1a2b3c4d5e6` | `bg-green-700` | `FlaskConical` | `NEET · Basic` |
| Rohan Mehta | `d2b3f4c5-6a7b-8c9d-0e1f-a2b3c4d5e6f7` | `bg-orange-600` | `Atom` | `JEE · Basic` |
| Preethi Nair | `e3c4a5d6-7b8c-9d0e-1f2a-b3c4d5e6f7a8` | `bg-purple-700` | `Scale` | `CLAT · Basic` |

On select: `switchPersona()` sets `subscriptionTier = 'free'` + `activePlanInfo = { scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'NEET'/'JEE'/'CLAT' }`. Routes to `/assessments`.

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
src/app/super-admin/sources-chapters/page.tsx      Sources & Chapters list
src/app/super-admin/sources-chapters/[sourceId]/page.tsx      Source detail (chapters list)
src/app/super-admin/sources-chapters/[sourceId]/[chapterId]/page.tsx  Chapter detail (questions)
src/app/super-admin/question-bank/page.tsx         Question Bank list
src/app/super-admin/question-bank/new/page.tsx     Create Question (all 5 types)
src/app/super-admin/question-bank/[questionId]/edit/page.tsx  Edit Question
src/app/assessments/[id]/exam/page.tsx             LinearExamPlayer
src/hooks/useExamEngine.ts
src/data/demoUsers.ts | src/data/assessments.ts | src/lib/supabase/client.ts
```

**Assessment Analytics components (KSS-SAT-A01 — Apr 17 2026):**
```
src/components/ui/AttemptPillFilter.tsx                  Shared attempt pill — all analytics tabs
src/components/assessment-detail/ConceptMasteryPanel.tsx Shared concept mastery table — SAT + Chapter
src/components/assessment-detail/AnalyticsTab.tsx        Non-SAT full/subject tests (NEET, JEE, CLAT)
src/components/assessment-detail/SATAnalyticsTab.tsx     SAT full-test + subject-test only
src/components/assessment-detail/ChapterAnalyticsTab.tsx ALL chapter tests (SAT, NEET, JEE, CLAT)
src/components/assessment-detail/SolutionsPanel.tsx      DELETED — never re-create
```

**ConceptMasteryPanel rules (locked Apr 17 2026):**
- Props: `conceptMastery`, `tagSectionMap: Record<string,string>`, `sections: string[]`,
         `attempts: Array<{ attempt_number: number; completed_at: string | null }>`
- Section pills: `rounded-full`, same active/inactive colours as AttemptPillFilter
- Responsive pill label: `<span className="sm:hidden">R&W</span><span className="hidden sm:inline">Reading & Writing</span>`
- Always table layout (never bar chart fallback) — 1 attempt = 1 column
- Column header: `Attempt N` primary + `DD MMM` date secondary (from `completed_at`)
- Rows sorted weakest mastery % first (ascending, most recent attempt's mastery %)
- Missing data cell = `—` with `bg-zinc-100 text-zinc-400`
- First column sticky: `sticky left-0 bg-white z-10` — parent must NOT have `overflow-hidden`
- `overflow-x-auto` outer wrapper for mobile
- Footer always visible: `≥80% — strong · 60–79% — developing · <60% — needs work`
- Section pill filters rows only — all attempt columns always visible; sort recomputes per section
- In `SATAnalyticsTab`: parent builds `tagSectionMap` from `SAT_RW_DOMAIN_MAP`/`SAT_MATH_DOMAIN_MAP` keys

NEVER re-create `SolutionsPanel.tsx`. Use the inline DB-driven accordion pattern from `AnalyticsTab.tsx`.

Rich text editor: **Tiptap + KaTeX** — wired Apr 12 2026 (KSS-DB-018, KSS-DB-019).
- Component: `src/components/ui/RichTextEditor.tsx` — import `RichTextEditor` (default) + `JSONContent`, `emptyDoc`, `isDocEmpty`, `ensureDoc`
- Packages: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mathematics`, `@tiptap/extension-underline`, `@tiptap/extension-subscript`, `@tiptap/extension-superscript` (all v3.22.3), `katex`
- Use for all question_text, explanation, passage_text, and options[].text fields — all stored as Tiptap JSONB
- Never use plain `<textarea>` or `<input>` for any question content field
- Exam player rendering (TIPTAP-001/002): separate ticket — see TODO-BACKLOG.md

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

**Pagination — KSS-SA-019 (applies platform-wide)**
- All plan tables (Single Course Plans, Course Bundle Plans) paginate at 25 rows/page by default.
  A 25 / 50 / 100 page-size `<select>` sits at the bottom-left of the pagination bar.
- Card grids (Assessment Plans, B2B Plans) use a fixed 12 cards/page — no page-size dropdown.
- Navigation bar: `← Prev X / Y Next →` — bottom-right of each section.
- Bar hidden when total results = 0. Shown (Prev/Next disabled) when total pages = 1.
- Page state and page size stored in URL via `useSearchParams` + `router.replace`. Requires `<Suspense>` wrapper.
- URL params: `?tab=assessment-plans&platformPage=1&categoryPage=1` | `?tab=single-course-plan&page=1&pageSize=25`
- Shared component: `src/components/ui/PaginationBar.tsx` — use for ALL pagination in the platform.
- MRR strip removed in KSS-SA-019 (was Tab 1 only). TODO: add back as a dedicated aggregate query if needed.

**Tab 1 — Assessment Plans:** Card grid. Platform Plans (PLATFORM_WIDE B2C) + Category Plans (CATEGORY_BUNDLE B2C).
- Each section independently paginated (12 cards/page).
- Edit via Pencil icon in card footer — no 3-dot menu

**Tab 2 — Single Course Plan:** Table (Plan Name | Course Name | Price USD | Status | View/Edit).
- View/Edit navigates to plan detail page
- Editing via `SingleCoursePlanEditSlideOver` (plan detail page only — not from table)
- Paginated 25/page default, 25/50/100 dropdown

**Tab 3 — Course Bundle Plans:** Table. Create button top-right only.
- B2C only, PLATFORM_WIDE, annual, no tier, no `is_popular`/`cta_label`
- Paginated 25/page default, 25/50/100 dropdown

**Tab 4 — B2B Plans:** Card grid. No price shown — "B2B plan pricing managed per-tenant via Contract tab."
- Paginated 12 cards/page, no dropdown

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

**Plan Status Actions — detail page Overview tab ONLY (KEYS-485 / KEYS-501)**

Status strip buttons per status:
- `DRAFT`:     [Edit Details] [Publish Plan — blue filled] [Archive Plan — rose ghost]
- `PUBLISHED`: [Edit Details] [Archive Plan — rose ghost]
- `ARCHIVED`:  [Edit Details] [Restore Plan — blue filled] [Delete Plan — rose ghost]*
  *Delete Plan only shown when `plan_subscribers.subscriber_count = 0`
   AND for B2B plans: also zero rows in `tenant_plan_map`

Archive modal — copy differs by plan status:
- `DRAFT`: rose-50 block (plan name only, no subscriber count).
  Copy: "This plan is in draft. Archiving will remove it from the draft list." No Salesforce warning.
- `PUBLISHED`: rose-50 block (plan name + subscriber count, always shown even if 0).
  Copy: "This action is destructive. Make sure you inform the users via Salesforce about this action."
  Salesforce warning always shown for PUBLISHED regardless of subscriber count.

Restore Plan modal (ARCHIVED plans — KEYS-485):
- Trigger: "Restore Plan" (blue-700 filled) — replaces static "Archived — duplicate to create a new version" text
- Body:
  1. blue-50/blue-100 border block: plan name + tier/category badge + subscriber count (always shown, even 0)
  2. B2B plans only (separate line below block): "Tenants assigned to this plan will regain access if restored to Live."
  3. `border-t border-zinc-100` divider
  4. Neutral grey line: "The plan will be saved as a draft and will not be visible to learners until published."
- Footer: Cancel (text-link far-left) | right side flex-col:
  - Caption: "This plan will immediately become available to Learners" (text-xs text-zinc-500)
  - [Restore to Draft — ghost border] [Restore to Live — blue-700 filled]
- Loading: clicked button → "Restoring to Draft…" / "Restoring to Live…"; other button disables
- After confirm: stay on detail page, refresh in place
- Audit log: `RESTORED_TO_LIVE` / `RESTORED_TO_DRAFT` via `writePlanAuditLog`

Single Course Plan restore rules (KEYS-485):
- Restore to PUBLISHED: call `syncCourseFromPlan(courseId, { ...plan, status: 'PUBLISHED' })` FIRST
  Only call `updatePlan(id, { status: 'PUBLISHED' })` if sync succeeds
- Restore to DRAFT: call `updatePlan(id, { status: 'DRAFT' })` only — do NOT call syncCourseFromPlan
- Sync failure: write `RESTORE_FAILED` audit log `{ reason: 'Course sync failed', error }`, show error toast, plan stays ARCHIVED
- No course linked (empty plan_content_map): "Restore to Live" disabled (`opacity-50 cursor-not-allowed`); "Restore to Draft" still enabled

Delete Plan modal (ARCHIVED + zero subscribers — KEYS-501, separate story):
- Trigger: "Delete Plan" (rose ghost) in status strip — only when ARCHIVED + subscribers = 0 + (B2B: tenant_plan_map rows = 0)
- Body: rose-50 block (plan name + tier/category badge) + "This action is permanent and cannot be undone."
  Input field: SA must type `plan.name` exactly (case-sensitive) to enable confirm button
- Footer: Cancel | Delete Plan (rose filled — disabled until name matches exactly)
- Cascade on hard DELETE: `plan_content_map`, `plan_subscribers`, `tenant_plan_map`,
  `b2c_assessment_subscriptions`, `b2c_course_subscriptions`, `plan_audit_logs`
- Single Course Plan: set `is_individually_purchasable = false` on linked course before deleting plan row
- Post-deletion: redirect to `/super-admin/plans-pricing` + toast "Plan deleted successfully"
- No audit log (no global SA audit log table exists)

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

**Plan column (KSS-SA-039):** Added after "Tier" column. Sourced from eager LATERAL JOIN on `b2c_assessment_subscriptions` → `plans`.
- Platform plan holder: shows tier badge (e.g. `Basic`) using existing TIER_BADGE colours
- Category plan holder: shows `{category} {tier}` (e.g. `NEET Basic`) with a distinct category badge style
- No active plan: `—`
- The "Tier" column still shows `subscription_tier` (platform tier only). For category plan holders, Tier = `Free`, Plan = `NEET Basic` — these intentionally differ. The tier tab filter still works correctly (category plan holders appear under "Free" tab).

---

## B2C ASSESSMENT CARD — LOCKED BEHAVIOURS (Apr 15 2026)

**No Retry — permanent product decision**
Assessment attempts are permanent. Once a paid attempt is used, it cannot be retried.
- States 6 and 7 are collapsed: both show "View Analysis" only.
- There is NO retry, re-attempt, or re-take CTA anywhere in the B2C platform.
- `RetryButton.tsx` deleted — was a TODO stub returning null.
- Document reference: confirmed Q&A session Apr 15 2026.

**Card state model (locked) — matches `deriveCardState()` in AssessmentCard.tsx:**
- State 1: Tier below min_tier, free attempt not yet used → "Take Free Test" + "Upgrade to Access"
- State 2: Tier below min_tier, free attempt exhausted (COMPLETED) → "Continue Your Test" + "Upgrade to Access"
- **State 3 (KSS-SA-039): Category plan mismatch** — user has CATEGORY_BUNDLE plan, assessment is in a DIFFERENT category
  - Evaluated BEFORE States 4–7. Condition: `activePlanInfo.scope === 'CATEGORY_BUNDLE' AND assessment.exam !== activePlanInfo.category`
  - State 3a: free attempt unused → "Take Free Test" (primary) + "Switch Plan" (secondary) → `/plans?highlight={examCategory}`
  - State 3b: free attempt used + COMPLETED → "View Analysis" (primary) + "Switch Plan" (secondary)
  - State 3c: attempt in-progress → "Resume Test" (primary) + "Switch Plan" (subtle, below CTA)
- State 4: Tier allows, 0 attempts → "Start Your Test"
- State 5: Tier allows, attempt in progress → "Resume Test"
- State 6 + 7 (collapsed): Tier allows, any COMPLETED attempt → "View Analysis" only

**Free User card states:**
- SAT Full Test 1: State 2 (is_free_attempt=true, COMPLETED, tier=free below most min_tier)
- All other assessments: State 1 (no attempt row, free attempt available)

**Basic User card states:**
- Full tests (SAT FT1, SAT FT2, JEE FT1): State 6 → "View Analysis" (3/3/2 attempts, all COMPLETED)
- Subject tests: State 1 (no attempt rows, min_tier='professional' or 'premium', basic blocked)
- Chapter tests: State 1 (no attempt rows, min_tier='premium', basic blocked)

**Pro User (Priya) card states:**
- Full tests + subject tests: State 7 → "View Analysis" (6 attempts each, all COMPLETED)
- Chapter tests: State 1 (min_tier='premium', professional tier blocked)

**Premium User card states:**
- Full tests + subject tests: State 6 or 7 → "View Analysis" (varies by attempt count)
- Chapter tests: State 6 → "View Analysis" (2 attempts each, all COMPLETED)

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
- Types: MCQ_SINGLE [DONE] | MCQ_MULTI [DONE] | PASSAGE_SINGLE [DONE] | PASSAGE_MULTI [DONE] | NUMERIC [DONE]

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