# CLAUDE-HISTORY.md — Changelog, Completed Work & References
# NOT loaded every session. Read only when: debugging unexpected behaviour,
# asked "what changed", or verifying whether something was already built.

---

## COMPLETED WORK LOG

### April 11, 2026 — KSS-SA-030 Create Linear Assessment — full rebuild + Path C OverviewTab wiring

**Branch:** `feat/KSS-SA-030`

**Create Linear Assessment page** (`super-admin/create-assessments/linear/page.tsx`) — full rebuild:
- Layout: `max-w-4xl`, Edit / Preview segmented tabs (no Radix — two styled buttons)
- Section 1 — Basic Info: Assessment Title, Category (exam_categories), Test Type (FULL_TEST / SUBJECT_TEST / CHAPTER_TEST), Assessment Length (duration_minutes), Navigation Policy (FREE="Free Navigation" / LINEAR="Adaptive" / SECTION_LOCKED="Section Lock")
- Section 2 — Display Config: Description, What You'll Get (bullet list, drag-to-reorder via dnd-kit), Topics Covered hierarchical builder (FULL_TEST = Subject→Chapter→Topic 3-level accordion; SUBJECT_TEST = Chapter→Topic 2-level; CHAPTER_TEST = flat list 1-level), Language dropdown (9 languages)
- Test-type change warning modal: fires when test_type changes and topics_covered is non-empty; clears tree on confirm
- Preview tab: full learner-facing preview via `DisplayConfigPreview` shared component
- CTA: "Save as Draft" — upserts to `assessment_items` with `status='DRAFT'`, `source='PLATFORM'`, `assessment_type='LINEAR'`; saves both `display_config` and `assessment_config` JSONB
- Subtitle: "Create assessments with fixed sections and also configure what gets displayed to end user in the Overview tab"

**DisplayConfigPreview** (`src/components/assessment-detail/DisplayConfigPreview.tsx`) — NEW shared component:
- Renders: description, What You'll Get checklist (CheckCircle2), Topics Covered accordion
- `inferDepth()` helper infers accordion depth from data when testType not passed
- Depth 1 (CHAPTER_TEST): flat bullet list. Depth 2 (SUBJECT_TEST): 2-level accordion. Depth 3 (FULL_TEST): 3-level accordion
- Used by both Preview tab (SA form) and OverviewTab (learner-facing)

**OverviewTab rebuild** (`src/components/assessment-detail/OverviewTab.tsx`):
- Removed: hardcoded WHAT_YOULL_GET, mockSyllabus, SCORE_RANGES, SyllabusAccordion
- Added: `StatCards` (4 cards — Duration / Questions / Total Marks / Navigation using Clock, FileText, Award, Navigation2 icons)
- Reads from `assessment.display_config` and `assessment.assessment_config`
- Discriminates on `assessment._source === 'assessment_items'` (SA-created) vs `'assessments'` (legacy)

**Path C — dual-table getAssessmentBySlug** (`src/utils/assessmentUtils.ts`):
- Tries `assessment_items` by UUID first (SA-created, no slug)
- Falls back to `assessments` by slug (legacy demo data)
- `mapTestType()` helper maps DB `test_type` → frontend `AssessmentType`
- `_source` discriminator on returned Assessment object

**Types** (`src/types/index.ts`):
- Added: `TopicEntry`, `DisplayConfig`, `AssessmentConfig` interfaces
- `Assessment` extended with `display_config?`, `assessment_config?`, `_source?`

**DB changes:**
- **KSS-DB-001** (another session, April 11): Renamed `content_items` → `assessment_items`
- **KSS-DB-017** (this session): `ALTER TABLE assessment_items ADD COLUMN IF NOT EXISTS assessment_config JSONB DEFAULT '{}'`
- `display_config` shape updated: `{ what_youll_get: string[], topics_covered: TopicEntry[], language: string }` (replaced old `syllabus: string[]`)

**dnd-kit** installed: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2` — see `docs/CLAUDE-PACKAGES.md`

---

### April 10, 2026 — SA B2C Users list — Courses column (final implementation)
- **B2C Users list** (`super-admin/b2c-users/page.tsx`): **Courses** column added after Tier. Display-only, left-aligned, uniform styling, zero shows as `0`. Not sortable, not clickable.
- `B2CUser` type: `courseCount: number` field.
- `fetchB2CUser` (single-user detail): `courseCount: 0` hardcoded — detail page has full subscription tabs; this field unused there. Known compromise, not a bug.
- **`courseCount` source — locked spec (union, deduplicated by course_id per user):**
  - (1) `b2c_course_subscriptions WHERE status IN ('active','trialing') AND current_period_end > NOW() AND course_id IS NOT NULL` — active paid entitlement, including trialing (full Stripe access). Mirrors platform access gate (CLAUDE-DB) but extends to trialing. `current_period_end` nulls excluded by SQL `.gt()` semantics — matches platform gate.
  - (2) `b2c_course_progress` (all rows, any status) — courses the user has started or completed, free or paid. "A completed course is still a course they engaged with."
  - Three parallel queries in `fetchB2CUsers`: users + activeSubs + progress. `Promise.all`.
  - null `course_id` filtered in query (`.not('course_id', 'is', null)`), not client-side.
- Sub-PRD 7 updated to v2.2 in Confluence (§3.3, §3.6, §10.1).

### April 9, 2026 — CA Catalog restructure + CA Learner Profile rebuild + SA Create Assessments
- **CA Catalog** (`client-admin/[tenant]/catalog/page.tsx`): replaced flat ALL/ASSESSMENT/COURSE filter with Courses | Assessments tabs (count badges). Added `CourseModuleAccordion` (module→topic expand). Added `ContentDetailSlideOver` (unified detail + assign in one slide-over — Option B). Courses tab shows module hierarchy; Assessments tab shows tenant attempt count from `learner_attempts`. TENANT_PRIVATE content appears in both tabs with "Your Organisation" badge. Tailwind: `w-120` (not `w-[480px]`).
- **CA Learner Profile** (`client-admin/[tenant]/learners/[id]/page.tsx`): full rebuild matching SA B2C profile style. Identity 2×2 InfoGrid, Organisation card, Assessment Performance table (Title | Category | Attempts | Best Score | Last Attempted — no pass/fail), Course Performance table (Title | Type | Progress bar | Status | Completed | Certificate). Queries: `learner_attempts`, `learner_course_progress`, `exam_categories`, `content_items`, `courses`, `certificates`.
- **CA Reports** scroll fix: all 4 tab tables (`<table>`) wrapped in `<div className="overflow-x-auto">` to prevent page-level horizontal scroll on small screens.
- **SA Create Assessments list** (`super-admin/create-assessments/page.tsx`): replaced Coming Soon with full table (Title | Type badge | Length | Category | Status | Created by | Last edited | 3-dot Actions). "Create Linear" (blue) + "Create Adaptive" (disabled, hover tooltip — coming soon) buttons top-right. Filter dropdowns for Type / Category / Status.
- **SA Create Linear Assessment form** (`super-admin/create-assessments/linear/page.tsx`): new page at `/super-admin/create-assessments/linear`. Basic Info (title, exam category, test type, duration, navigation policy) + Display Config (description, What You'll Get bullets, Syllabus bullets → saved to `display_config` JSONB) + Sections & Question Pools Coming Soon stub. Saves to `content_items` as `assessment_type='LINEAR'`, `status='INACTIVE'`, `source='PLATFORM'`.
- **KSS-DB-007** (applied April 9 2026): `ALTER TABLE content_items ADD COLUMN description TEXT, ADD COLUMN display_config JSONB DEFAULT '{}', ADD COLUMN assessment_type TEXT DEFAULT 'LINEAR' CHECK IN ('LINEAR','ADAPTIVE')`.
- **KSS-DB-008** (applied April 9 2026): `CREATE TABLE learner_course_progress` — B2B learner course progress (learner_id, tenant_id, course_id, status NOT_STARTED/IN_PROGRESS/COMPLETED, progress_pct 0–100, started_at, completed_at). UNIQUE (learner_id, course_id, tenant_id). Fallback derivation from `learner_attempts.score_pct` if no row exists.
- `CLAUDE-DB.md` updated: content_items section + new `learner_course_progress` table documented.
- Build: `npm run build` passed clean (35 routes).

### April 9, 2026 — KEYS-553 SA B2C Users — Suspend/Unsuspend V2
- KSS-DB-SA-012: 6 new columns on `users`: `suspension_reason`, `suspended_at`, `suspended_by`, `unsuspend_reason`, `unsuspended_at`, `unsuspended_by`
- Radhika Anand (`radhika@keyskillset.com`, `6046c2f4`) updated to SUPER_ADMIN in `admin_users`
- Meera Krishnan (`a1f52fe9`) backfilled with suspension seed data (suspended by Radhika Anand, reason + date)
- `suspendUser(id, reason)` writes audit fields; `unsuspendUser(id, reason|null)` writes audit fields; both use hardcoded demo SA UUID until auth is built
- `B2CUser` type extended with suspension fields; `fetchB2CUser` secondary-queries `admin_users` for `suspendedByName`
- `SuspendModal`: confirm disabled until reason typed (required)
- `UnsuspendModal`: new lightweight modal, optional reason, blue callout
- Profile header: shows reason, suspended-on date, "by [name]" when SUSPENDED
- `src/app/suspended/page.tsx` created — access-gate page (ShieldOff icon + contact@keyskillset.com)
- Sub-PRD 7 updated to v2.0 in Confluence — §4.3–4.6 added, §7.1 + §8.2 updated

### April 7, 2026 — KEYS-485 / KEYS-501 Plan restore + delete — spec locked, not yet built
- KEYS-485: Restore archived plan (to PUBLISHED or DRAFT) from plan detail Overview tab. Full modal spec, audit log (RESTORED_TO_LIVE / RESTORED_TO_DRAFT / RESTORE_FAILED), syncCourseFromPlan reverse logic for Single Course Plans. Dead code removal (ArchivePlanModal + onArchive from list page).
- KEYS-501: Hard delete plan (ARCHIVED + zero subscribers) from plan detail Overview tab. Type-to-confirm modal, cascade delete of all dependent rows. Separate story — not built in KEYS-485.
- CLAUDE-PT.md updated with full Plan Status Actions spec for both tickets.
- Jira: KEYS-485 (restore), KEYS-501 (delete) created in keySkillset Engineering project.

### April 6, 2026 — KSS-SA-026 Free plan support for Single Course Plan
- KSS-DB-006: `plans.is_free BOOLEAN DEFAULT false` added. `tier` CHECK expanded to include `'FREE'`. `NOT NULL` dropped from `tier`. Existing SINGLE_COURSE_PLAN rows migrated to `tier=NULL`.
- Pricing Mode toggle (`Paid Plan` / `Free Plan`) added to create form (Section 3) and `SingleCoursePlanEditSlideOver`.
- Free mode: price fields hidden, green callout shown, `price=0 / price_usd=0 / stripe_price_id=NULL / tier='FREE'` enforced in lib layer.
- Paid → Free switch on edit: warning modal ("This will set prices to ₹0 / $0...") required before applying.
- One-active-plan-per-course guard: `checkCourseHasActivePlan(courseId)` called before create submit; inline error if DRAFT/PUBLISHED plan exists.
- `SingleCoursePlanEditSlideOver` wired to plan detail page (`PlanOverviewTab`) — was dead code before; generic `EditPlanSlideOver` still used for all other plan types.
- `fetchPlanById` extended to select `price_usd`, `stripe_price_id`, `is_free`.
- Green **Free** badge in Single Course Plan list table Price (USD) column when `is_free=true`.
- `CLAUDE-DB.md` + `CLAUDE-PT.md` updated with all new rules.
- Sub-PRD 4 (Plans & Entitlements) updated to v4.4 in Confluence.

### April 2026 — KSS-SA-019 Plans & Pricing server-side pagination
- `src/components/ui/PaginationBar.tsx` created — shared `← Prev X/Y Next →` component used platform-wide
- `src/lib/supabase/plans.ts` — 6 new paginated functions added (originals untouched):
  `fetchPlatformAssessmentPlansPaginated`, `fetchCategoryAssessmentPlansPaginated`,
  `fetchSingleCoursePlansPaginated`, `fetchCourseBundlePlansPaginated`,
  `fetchB2BPlansForGridPaginated`, `fetchAssessmentCountsForPlans`
- `plans-pricing/page.tsx` rewritten: Suspense wrapper, URL state, `fetchPlans()` removed from parent,
  MRR strip removed, all 4 tabs server-side paginated independently
- Assessment Plans: Platform Plans + Category Plans each paginated separately (12 cards/page)
- Single Course Plans + Course Bundle Plans: table pagination with 25/50/100 dropdown (default 25)
- B2B Plans: card grid pagination (12/page, no dropdown)
- Existing pagination updated to PaginationBar: B2C users list, Audit Log, Tenant Learners tab
- Tenant Learners converted from 0-indexed to 1-indexed pagination
- `docs/CLAUDE-ATLAS.md` created — canonical Confluence PRD link index
- Sub-PRD 4 (Plans & Entitlements) updated in Confluence after build passed

### April 4, 2026 — KSS-SA-018 Invite User smart update shipped
- SA tenant detail → Users & Roles: Invite User slideover always opens (never disabled)
- Inline rose error shown on submit if active Client Admin already exists:
  "An active Client Admin already exists. Remove the current one before inviting a new one."
- Applies to both FULL_CREATOR and RUN_ONLY tenants

### April 2, 2026 — All B2C exam engine fixes shipped
- KSS-B2C-FIX-023: Back button + ChevronLeft on instructions page
- KSS-B2C-FIX-024: Previous cross-section NTA navigation
- KSS-B2C-FIX-025-FINAL: Exam engine state machine (final resolution)
- KSS-B2C-FIX-026: Mobile hard block modal (< 768px)
- KSS-B2C-FIX-027: MCQ_MULTI + NUMERIC question type renderers
- KSS-B2C-FIX-028: Draggable on-screen calculator

### March 31, 2026 — B2C user profile unified redesign
- `max_attempts_per_assessment` updated to 6 (1 free + 5 paid) for all 8 B2C plans
- `b2c_certificates` table created. RLS OFF. 4 demo rows seeded (HIPAA completions).
  Format: `KSS-{shortCode}-{YYYYMMDD}-{seq}`
- B2C user profile page fully rebuilt into single "Subscriptions & Activity" section
  replacing three separate sections (SubscriptionsHistory, AssessmentPerformanceSection, CoursePerformanceSection)
- `AttemptHistorySlideOver` added (slide-over, page-level single instance)
- Pass/fail removed from SA B2C profile UI only — DB column and exam engine untouched
- `b2c-users.ts`: removed `fetchUserAttempts`, `computeAssessmentSummary`, `UserAttempt`, `AssessmentSummary`
  Added: `fetchPlanAssessments`, `fetchAssessmentAttempts`, `fetchFreeAccessAttempts`,
  `fetchPlanCoveredAssessmentIds`, `fetchB2CCertificate`
  `AssessmentSubscription` type now includes `maxAttempts`
- `recharts` installed (was in package.json but missing from node_modules)

### March 30, 2026 — B2C subscription tables + SA user list/profile upgrades
- DB: `b2c_assessment_subscriptions` table created (RLS OFF, 11 seeded rows)
- DB: `b2c_course_subscriptions` table created (RLS OFF, 11 seeded rows)
- Open Decision #3 resolved: assessment plan + course plan subscriptions coexist freely
- B2C user profile: Subscriptions History rewritten (2 sub-sections: Assessment Plan + Course Plans)
- B2C user profile: Course Performance paginated (10/page) + 'Free' badge
- B2C users list: client-side pagination (20/page), URL param state, Suspense wrapper

### March 27, 2026 — formatCourseType + SINGLE_COURSE_PLAN enforcement
- `formatCourseType()` utility added to `src/lib/utils.ts`, applied platform-wide (10 locations)
- SINGLE_COURSE_PLAN Content tab: Add Course button disabled with Tailwind tooltip when `courses.length >= 1`
- `AddContentSlideOver`: `singleSelect` prop added (radio buttons for SINGLE_COURSE_PLAN)
- DB: 6 course rows corrected from `DOCUMENT → VIDEO`

### March 25, 2026 — Minor upgrades
- Module status icons: CheckCircle2/CircleDot/Circle per COMPLETED/IN_PROGRESS/NOT_STARTED
- Course % recomputed from module averages (Option A — no DB change)
- Email immutable after creation on all edit surfaces
- Content Creators list: Actions column (View + Edit + Deactivate/Reactivate)
- Assessment Plans cards: 3-dot menu → Pencil icon Edit button in card footer
- PlanContentTab validation: ASSESSMENT plans hide Add Course; COURSE_BUNDLE plans hide Add Assessment
- `plan_category` type extended to include `'SINGLE_COURSE_PLAN'`
- Dashboard: Assessments tab added (4th tab) — 4 KPI cards + dual-series AreaChart + per-assessment table

### Previously completed
- KSS-SA-004 through KSS-SA-017
- KSS-SA-008 / 009 / 010
- KSS-DB-CA-001
- KSS-CA-001 through KSS-CA-006
- KSS-CA-008
- All BUG-SA and FIX-SA items

---

## RESOLVED DECISIONS

**#1 (April 4, 2026):** Unified questions table — MERGE decision.
One `questions` table shared across the platform. SA/Content Creators write. B2C + B2B read.
`content_items` renamed to `assessment_items` (not `assessments` — corrects DB-TODO-001).
Assessment Creation nav group (Sources & Questions, Question Bank, Create Assessments, Bulk Upload)
will all be built on this unified schema. Schema design pending KSS-DB-XXX authorisation.

**#2 (April 2, 2026):** `licensed_categories` on `tenants` + `contracts` is metadata only — informational display.
Never use it to gate content access. Access control is via Plans only. No sync mechanism needed.
Column stays on both tables independently. Single source of truth question is moot — it is never the authority.

**#3 (March 30, 2026):** Assessment plan + individual course plan subscriptions coexist freely.
A user may hold 1 assessment plan (PLATFORM_WIDE OR CATEGORY_BUNDLE — not both) AND N course plan
subscriptions simultaneously. Independent Stripe subscriptions. Cancelling one does not affect the other.
`subscription_tier` on users reflects assessment plan tier only.

---

## PHASE 2 ITEMS

Doc: https://keyskillset-product-management.atlassian.net/wiki/x/AYCeBg (Atlassian MCP — reconnect if 401)
Key Phase 2 item tracked here: KSS-SA-019 — contract mandatory on CA creation + CC seat enforcement per contract.

---

## CONFLUENCE LINKS

Base: https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/

| Document | Page ID |
|---|---|
| SA Master PRD | 91226113 |
| SA Sub-PRD 1 Nav | 98664450 |
| SA Sub-PRD 2 Content | 93421571 |
| SA Sub-PRD 3 Tenant/RBAC | 93913089 |
| SA Sub-PRD 4 Plans | 93093890 |
| SA Sub-PRD 5 Marketing | 93323269 |
| SA Sub-PRD 6 Analytics | 94928898 |
| CA Master PRD | 93552656 |
| CA Sub-PRD 1 Org/RBAC | 95420418 |
| CA Sub-PRD 2 Learners | 96272385 |
| CA Sub-PRD 3 Content | 96862209 |
| CA Sub-PRD 4 Reports | 97452044 |

---

## DEMO SEED REFERENCE

**B2C demo users (16 total):** 6 Free, 4 Basic, 3 Pro, 3 Premium. 1 Suspended (Meera Krishnan), 3 Inactive.

**Courses (9 total):**
- 1 B2C ARCHIVED: HIPAA Compliance Training (`425b71f4`, `is_individually_purchasable=true`, $12.99)
- 7 B2B LIVE
- 1 INACTIVE: CLAT

**Plans (9 total):** 6 B2C + 3 B2B (Akash Standard, TechCorp Premium, Enterprise Pro — all PLATFORM_WIDE/PUBLISHED)

**tenant_plan_map:**
- Akash Standard → Akash Institute
- TechCorp Premium → TechCorp India
- Enterprise Pro → both tenants

**b2c_certificates:** 4 demo rows seeded for HIPAA completions (Premium, Priya, Basic, Siddharth)