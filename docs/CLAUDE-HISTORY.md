# CLAUDE-HISTORY.md — Changelog, Completed Work & References
# NOT loaded every session. Read only when: debugging unexpected behaviour,
# asked "what changed", or verifying whether something was already built.

---

## COMPLETED WORK LOG

### April 26, 2026 — KSS-LINT-001: react-hooks/set-state-in-effect Full Sweep

**Ticket:** KSS-LINT-001 | **Rule:** `react-hooks/set-state-in-effect`  
**Result:** 0 violations remaining (down from ~19 in this rule alone). Build ✅ PASSED.

**Root cause:** The lint rule flags any `setState` call that runs synchronously inside a `useEffect` body, including inside `async useCallback` functions called from `useEffect` — because async/await within the same function scope is still treated as "within the effect body" by static analysis.

**Safe patterns confirmed:**
- `setState` inside `.then(callback)` is NOT flagged — the callback is a separate scope
- `useState(!!dep)` replaces `if (!dep) { setState(false); return }` guard pattern
- `key={prop}` at the call site remounts a component when `prop` changes, replacing `useEffect(() => { setState(init) }, [prop])`
- `effectivePage = Math.min(page, totalPages)` replaces `useEffect(() => { setPage(1) }, [filters])` for client-side pagination
- Moving `setPage(0)` into onChange handlers replaces the effect for server-side pagination

**Files modified (20 total):**

| File | Fix |
|------|-----|
| `certificates/CertificateTabsContent.tsx` | Removed `setLoading(true)` from effect body |
| `context/B2BLearnerContext.tsx` | `useState` lazy initializer for localStorage read |
| `hooks/useUserAttempts.ts` | `useState(!!userId)` |
| `b2b-learner/[tenant]/login/page.tsx` | `useState(!!tenantId)` |
| `components/ui/Tooltip.tsx` | Removed `mounted` state + effect; portal rendered directly |
| `super-admin/content-creators/page.tsx` | Removed `setLoading(true)` from `load()` |
| `super-admin/plans-pricing/page.tsx` | Removed `setLoading(true)` from 4 effect bodies |
| `super-admin/sources-chapters/page.tsx` | `fetchSources` async→Promise.then(); `key={viewSource?.id}` |
| `super-admin/sources-chapters/[sourceId]/page.tsx` | `fetchData` async→Promise.then(); `effectivePage` clamping |
| `super-admin/sources-chapters/[sourceId]/[chapterId]/page.tsx` | `fetchData` async→Promise.then(); `effectivePage` clamping |
| `super-admin/question-bank/page.tsx` | `fetchQuestions` async→Promise.then(); `setPage(0)` in onChange handlers; `key={previewId}` on modal |
| `super-admin/question-bank/_components/QuestionForm.tsx` | `key={form.question_type}` on `FormPreview` |
| `super-admin/question-bank/_components/QuestionPreviewModal.tsx` | `fetchQuestion` async→Promise.then(); cleanup via key remount |
| `super-admin/platform-config/page.tsx` | `loadCategories` + `loadTags` async→Promise.then(); `key={selectedCat.name}` on `ConceptTagsPanel`; `loadRows` moved to useCallback+Promise.then() |
| `super-admin/create-assessments/page.tsx` | `fetchData` → inner-async+.then() |
| `client-admin/[tenant]/content-bank/page.tsx` | `loadItems` async→Promise.then() |
| `client-admin/[tenant]/dashboard/page.tsx` | `useState(!!tenantId)` |
| `client-admin/[tenant]/learners/page.tsx` | `fetchData` async→Promise.then() |
| `client-admin/[tenant]/learners/[id]/page.tsx` | `useState(!!(tenantId && learnerId))` |
| `client-admin/[tenant]/catalog/page.tsx` | `fetchCatalog` inner-async+.then(); `useState(!!tenantId)`; `useState(item.content_type === 'COURSE')` for modulesLoading |

---

### April 23, 2026 — B2C End User Suspend/Revoke Email Templates

**Ticket:** B2C-EML-001 | **PRD:** `prds/end-user/PRD-B2C-EML-001-SUSPEND-REVOKE-EMAILS.md`

**Code changes:**
- **Types updated** (`src/lib/email-templates/types.ts`): Added new template IDs `b2c-user-suspended`, `b2c-access-restored` + new slug `keyskillset` + new `featureMode: 'B2C_END_USER'` + new interfaces `B2CUserActionContext`, `B2CUserActionPayload`
- **Preview profile added** (`src/lib/email-templates/data.ts`): Added `keyskillset` profile with `featureMode: 'B2C_END_USER'` for B2C End User Emails
- **Template definitions added** (`src/lib/email-templates/data.ts`): Added definitions for both B2C email templates with 5 variables: `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{reason}}`, `{{action}}`

**Email templates created:**
- `src/email-templates/html/b2c-user-suspended.html` — Account Suspended email (rose/red theme)
- `src/email-templates/html/b2c-access-restored.html` — Access Restored email (blue/navy theme)

**Navigation restructure:**
- **Persona Selector** now has TWO entries under "Email Templates" group:
  - **Client Admin Emails** (rose bg) → `/email-templates` → shows Akash + TechCorp tenants
  - **B2C End User Emails** (blue bg) → `/email-templates/keyskillset` → shows 2 template cards (Account Suspended, Access Restored)
- Updated tenant chooser page to filter out B2C End User profile
- Updated detail page back link text based on tenant slug

**PRD created:**
- `prds/end-user/PRD-B2C-EML-001-SUSPEND-REVOKE-EMAILS.md` — Full specification for B2C end user email templates

**Support email updated:**
- Changed `support@keyskillset.com` → `contact@keyskillset.com` everywhere in codebase

**Build:** `npm run build` ✅

---

### April 23, 2026 — Email Templates Persona Fixes + PRD

**Ticket:** Email Templates QA persona | **PRD:** `prds/PRD-CA-EMAIL-TEMPLATES.md`

**Code changes:**
- **iframe width fix** (`src/app/email-templates/[tenant]/[template]/page.tsx`): Changed from 2-column layout `xl:grid-cols-[1.05fr_1.35fr]` to single column full-width layout to prevent email preview being squeezed
- **Raw file display**: Changed from `src/email-templates/html/{filename}` to just `{filename}` (e.g., `certificate-of-completion.html`)
- **Dynamic variables filter**: Filtered to only show 5 core tokens: `{{cta_url}}`, `{{course_title}}`, `{{full_name}}`, `{{company_name}}`, `{{company_logo_url}}`
- **Persona selector restructure** (`src/app/page.tsx`): Created new "Email Templates" group below "Admin Access" with single entry "Client Admin Emails" → routes to `/email-templates` (tenant chooser)
- **Certificate background** (`src/email-templates/html/certificate-of-completion.html`): Added full background image from Supabase banner-images bucket (`https://uqweguyeaqkbxgtpkhez.supabase.co/storage/v1/object/public/banner-images/Page%202.png`)

**PRD created:**
- `prds/PRD-CA-EMAIL-TEMPLATES.md` — Full specification for email templates persona including user flows, technical specs, and scope boundaries

**Build:** `npm run build` ✅

---

### April 22, 2026 — KSS-SA-CA-001 Phase 7: Sources & Chapters + Engine Assessment Seeding

**Ticket:** KSS-SA-CA-001 | **SQL:** `docs/requirements/SQL-CA-MIGRATIONS-2.txt`

**Code changes:**
- **Fixed 400 on Create Assessments page:** PostgREST join without FK constraint returns 400; removed `admin_users!created_by` join temporarily, then restored after KSS-DB-054b.
- **`SourceChapterPicker` moved to `linear/_components.tsx`** (was in `adaptive/_components.tsx`); adaptive re-exports `Source`, `Chapter` types — no breaking change.
- **`SortableSectionRow` → expandable card:** drag handle on header, chevron toggle, Sources & Chapters picker in collapsible body. DnD preserved.
- **Linear create + edit forms:** Sources & Chapters wired — per-section `source_ids`/`chapter_ids` for `FULL_TEST`, single top-level pool for `SUBJECT_TEST`/`CHAPTER_TEST`.
- **`admin_users` join re-wired:** PostgREST named alias syntax `created_by_user:admin_users!fk_assessment_items_created_by(name)`. `admin_users.name` is the column (not `full_name`).

**DB migrations confirmed:**
- **KSS-DB-054a:** `assessment_items` ADD `assessments_id UUID REFERENCES assessments(id) ON DELETE SET NULL` + index. Verified.
- **KSS-DB-054b:** FK constraints `fk_assessment_items_created_by` + `fk_assessment_items_last_modified_by` → `admin_users(id) ON DELETE SET NULL`. Safety check showed 0 orphans — applied clean.
- **KSS-DB-055:** Seeded 22 linear engine assessments (`assessments` table, `architecture='linear'`) into `assessment_items` as `INACTIVE`/`LINEAR`. Type mapping: `full-test`→`FULL_TEST`, `subject-test`→`SUBJECT_TEST`, `chapter-test`→`CHAPTER_TEST`. `assessment_config` contains `duration_minutes` + `total_questions` only.

**Post-seed state:** `assessment_items` has 44 rows — 18 SA-created (18 with `created_by` set) + 22 seeded (no `created_by`, no `display_config`).

---

### April 21, 2026 — KSS-SA-CA-001 DB Migrations: KSS-DB-050 + KSS-DB-051

**Ticket:** KSS-SA-CA-001 | **SQL:** `docs/requirements/SQL-CA-MIGRATIONS.txt`

**DB migrations confirmed in Supabase:**
- **KSS-DB-050**: `ALTER TABLE exam_categories ADD COLUMN score_min INT NULL, score_max INT NULL` — SAT seeded 200/800, all others NULL. Verified via SELECT.
- **KSS-DB-051**: `CREATE TABLE assessment_scale_scores (...)` — table exists, index created. Verified via information_schema check.

Scale Score tab in Adaptive Create/Edit form is now fully functional end-to-end.

---

### April 21, 2026 — KSS-ANA-001 Phase 2: NEET/JEE/CLAT Analytics Data Seeding + KSS-DB-052

**Ticket:** KSS-ANA-001 | **PRD:** `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md`

**Scope:** Seeded full-test attempt_answers, attempt_section_results, user_concept_mastery, and attempt_ai_insights for premium user `191c894d-b532-4fa8-b1fe-746e5cdcdcc8` across NEET FT1, JEE FT1, CLAT FT1 (2 attempts each).

**DB migration applied:**
- **KSS-DB-052**: `ALTER TABLE attempt_answers DROP CONSTRAINT attempt_answers_question_id_fkey` — undocumented FK that blocked seeding with placeholder question_ids. `question_id` column remains as uuid (no FK). KSS-DB-050/051 are reserved for KSS-SA-CA-001 (exam_categories score range + assessment_scale_scores).

**Critical discovery — assessment ID routing:**
- `getAssessmentBySlug()` (`src/utils/assessmentUtils.ts:106`) filters `assessment_items` with `.eq('status', 'INACTIVE')` — this filter never matches LIVE or DRAFT assessments, so the function always falls through to the `assessments` (legacy engine) table lookup by slug.
- Consequence: `assessment.id` returned to `AnalyticsTab` = `assessments.id`, not `assessment_items.id`.
- All seeded data uses `assessments.id` values: NEET `693a891b-a1d9-4c44-89a6-703ad034c13c`, JEE `183eac3e-473b-4dfd-a13c-5ee84ff42e44`, CLAT `b123f49f-a7a2-4114-82da-b3579fe3dc68`.
- Bug filed as backlog: `.eq('status','INACTIVE')` should be `.eq('status','LIVE')` for SA-created assessments to route through `assessment_items.id`.

**Seeding completed (all 10 steps):**
- STEP 0: Cleanup — deleted ~116 wrongly-seeded mastery rows with `assessment_items.id` values
- STEP 1: 6 attempt rows for NEET A1/A2, JEE A1/A2, CLAT A1/A2 (using `assessments.id`)
- STEP 2: 22 `attempt_section_results` rows (sections per exam × 2 attempts)
- STEP 3: 6 `attempt_ai_insights` rows (model_used='static_demo')
- STEP 4: NEET A1 — 180 `attempt_answers` (Physics/Chemistry/Biology split, time + outcome distribution)
- STEP 5: NEET A2 — 180 `attempt_answers`
- STEP 6: JEE A1+A2 — 180 `attempt_answers` (Physics/Chemistry/Maths)
- STEP 7: CLAT A1+A2 — 240 `attempt_answers` (English/Legal/Logical/GK/Quant)
- STEP 8: ~116 `user_concept_mastery` rows for all 6 full-test attempts
- STEP 9+10: Chapter test answer UPDATEs + mastery INSERTs (pre-completed earlier session)

**Build:** Post-seeding docs only — no code changes this session. `npm run build` pending.

---

### April 20, 2026 — KSS-B2C-001: End User Persona + Assessment Access Fixes

**Ticket:** KSS-B2C-001 | **PRD:** `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md`

**Root causes fixed:**
- Category plan users (NEET/JEE/CLAT BASIC) had `subscription_tier: 'free'` — deriveCardState never granted them paid access
- Plans page called `fetchActivePlanForUser` which returns null for demo users (no DB subscription rows)
- AttemptsTab only showed rows when `isSubscribed()` returned true, which always returned false for demo users
- PlanSubscribersTab used DB count (0) for summary cards but rendered 5 mock rows → "Showing 5 of 0"

**Files changed:**
- `src/components/assessment/AssessmentCard.tsx` — Added `CATEGORY_TIER_MAP`, `effectiveTierAllows` in `deriveCardState` (checks category plan tier for matching exam after platform check fails). `normalizeExam` handles `IIT-JEE`→`JEE`.
- `src/app/plans/page.tsx` — Added `UserActivePlanInfo` import alias; demo user fallback using `planId=''` sentinel after `fetchActivePlanForUser` returns null; `getPlanCTA` `isCurrentPlan` now matches by scope+tier+category when `planId===''`; same-rank safety net.
- `src/components/assessment-detail/AttemptsTab.tsx` — Full rewrite. Always renders 6 rows (1 free + 5 paid). `computeHasPaidAccess` checks platform tier + category plan. Locked rows: opacity-60 + Lock icon + "Upgrade to Unlock". Sequentially locked rows: opacity-60 + "Complete [prev] to unlock". Both DB path and mock fallback path emit 6 rows. Removed `isSubscribed` dependency entirely.
- `src/app/assessments/[id]/page.tsx` — Added `assessment={assessment}` prop to `<AttemptsTab>` call.
- `src/components/plans/PlanSubscribersTab.tsx` — When DB count = 0, `count` falls back to `MOCK_SUBSCRIBERS.length` so summary cards stay consistent with mock table.
- `eslint.config.mjs` — Added `docs/**` to globalIgnores (reference JSX files were causing pre-existing lint failures).

**DB migration confirmed (Apr 20 2026):**
- `docs/requirements/SQL-RESPONSE-3.txt` — KSS-DB-045: `full-test→basic` (5 rows), `subject-test→professional` (8 rows), `chapter-test→premium` (9 rows). Verified via GROUP BY query.

**PRD updated:**
- `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md` — §1.1 PUBLISHED→LIVE; §2 fully written (min_tier mapping, effective tier resolution, 7 card states, 6-row AttemptsTab rule, selected_exams gate dropped).

**Build:** `npm run build` ✅ | **Lint (changed files):** ✅

---

### April 19, 2026 — KSS-SAT-A02: SAT Analytics V2 + Platform Config Restructure (Phases 1–6)

**Ticket:** KSS-SAT-A02 | **PRD:** `prds/super-admin/PRD-SAT-ANALYTICS-V2.md`

**DB migrations applied (all confirmed in SQL-RESPONSE-1.txt):**
- KSS-DB-041: `sat_tier_bands` table + 5 tier rows (Accessible/Top-100/Top-50/Top-20/Elite)
- KSS-DB-042: `sat_colleges` table + 19 colleges (US + India)
- KSS-DB-043: `users.target_sat_score` + `users.target_sat_subject_score` columns
- KSS-DB-044: `platform_analytics_config` table + SAT defaults (3 show_* rows)

**Platform Config page (Phase 2 — previous session):**
- Full rewrite to exam-category tabs (dynamic from DB), each with [Concept Tags] + [Analytics Display] sub-tabs
- SAT Analytics Display: Section Visibility toggles, Tier Bands inline-edit, College Targets CRUD with Add/Edit modal + delete confirm
- NEET/JEE/CLAT: "Coming Soon" placeholder

**Types & Context (this session):**
- `src/types/index.ts` — Added `targetSatScore`, `targetSatSubjectScore` to User interface
- `src/data/demoUsers.ts` — Added fields to DemoUser; Priya Sharma seeded with `target_sat_score: 1500`
- `src/context/AppContext.tsx` — Added `updateUser(fields)` partial update function; mapped new fields in demoUserToUser
- `src/components/assessment-detail/SolutionsPanel.tsx` — Added `difficulty?` to DbQuestion interface

**New shared components (Phase 3):**
- `src/components/ui/ScoreTrajectoryChart.tsx` — SVG line chart, attempts × score, optional target dashed line
- `src/components/ui/DifficultyBreakdownCard.tsx` — Easy/Medium/Hard progress bars from DiffMap
- `src/components/ui/PreviewSectionWrapper.tsx` — Absolute "Preview" badge overlay (violet)

**New SAT analytics components (Phase 4):**
- `src/components/assessment-detail/SATHeroScore.tsx` — Hero score display + trajectory chart + 3-touch target score (Touch 2 inline pill picker, Touch 3 progress bar + edit/remove)
- `src/components/assessment-detail/SATCollegeLadder.tsx` — Tier-grouped college cards, score + target ring highlight, Full Test only
- `src/components/assessment-detail/SATLeveragePanel.tsx` — Dark card, top-3 concepts by impact (formula: `min(50, round((0.9 - mastery/100) × total_count × multiplier))`)
- `src/components/assessment-detail/SATPacingChart.tsx` — Demo data, 4 module dot grids (on-pace/slow/wrong by color)
- `src/components/assessment-detail/SATMistakeTaxonomy.tsx` — Demo data, 4 root-cause categories with example chips

**SATAnalyticsTab rewrite (Phase 5):**
- Block order: HeroScore → PillFilter → CollegeLadder (FT only) → SectionBreakdown + time → DifficultyBreakdown → LeveragePanel → ConceptMastery → Pacing (Preview gated) → MistakeTaxonomy (Preview gated) → SATScoringTable (FT only) → SolutionsPanel → AI Insight
- Added `difficulty` to questions select; DiffMap computed from attempt_answers JOIN assessmentQuestions
- Tier bands + colleges + platform_analytics_config loaded in parallel on mount
- `onSaveTarget` writes to `users` table and calls `updateUser()` for optimistic local update
- SectionRow enhanced with `formatTime(time_spent_seconds)` display

**AssessmentCard Touch 1 (Phase 6):**
- `src/components/assessment/AssessmentCard.tsx` — SAT full-test, State 4, target null → shows "Set a score target" dashed box with select + save below the CTA

---

### April 19, 2026 — B2C Plan Status Standardization + Tier Cascade + Plan Seeding (KSS-SA-040)

**Ticket:** KSS-SA-040 | **PRD:** `prds/super-admin/PRD-SA-PLANS-PRICING.md` (addendum §11)

**DB migrations applied (confirmed in Supabase):**
- KSS-DB-040a: `ALTER TABLE plans ADD COLUMN IF NOT EXISTS allowed_assessment_types text[] DEFAULT '{}'` — confirmed
- KSS-DB-040b: `UPDATE plans SET status = 'LIVE' WHERE status = 'PUBLISHED'` — confirmed; no PUBLISHED rows remain
- KSS-DB-040c: 18-plan seed confirmed — 3 PLATFORM_WIDE + 5 exam categories × 3 tiers; plan_content_map links; plan_subscribers rows inserted

**Code changes (build passed clean):**
- `src/lib/supabase/plans.ts`
  - `CreatePlanPayload.status`: `'DRAFT' | 'LIVE'` (removed PUBLISHED)
  - `CreatePlanPayload.allowed_assessment_types: string[]` — new field persisted to DB
  - `updatePlan` type: `'DRAFT' | 'LIVE' | 'DELETED'`
  - `fetchPublishedPlans`, `fetchLivePlatformPlans`, `fetchLiveCategoryPlansGrouped`: `.eq('status', 'LIVE')` (was PUBLISHED)
  - `syncCourseFromPlan`, `transitionSingleCoursePlanStatus`: PUBLISHED→LIVE
  - `CreateB2BPlanPayload`, `CreateCourseBundlePlanPayload`, `CreateSingleCoursePlanPayload`, `UpdateSingleCoursePlanPayload`: all status references updated to LIVE
  - `checkLivePlanExistsForTierScope(tier, scope, category, excludePlanId?)` — NEW function; returns boolean; queries LIVE B2C ASSESSMENT plans for uniqueness
- `src/lib/supabase/analytics.ts` — line 176: `.eq('status', 'LIVE')`
- `src/components/plans/ContentPlanUsageModal.tsx` — StatusBadge: `s === 'LIVE'` (was 'PUBLISHED')
- `src/app/super-admin/plans-pricing/new/page.tsx`
  - TIER_ALLOWED_TYPES constant: BASIC→['FULL_TEST'], PRO→['FULL_TEST','SUBJECT_TEST'], PREMIUM→all three
  - `allowedTypes` derived from `TIER_ALLOWED_TYPES[tier]` — no longer free-form useState
  - `handleSubmit('DRAFT' | 'LIVE')` — uniqueness guard fires before createPlan when status='LIVE'
  - `allowed_assessment_types` passed to createPlan payload
  - Section 4 UI: read-only tiles (blue=included, dim/opacity-50=excluded)
  - "Make Live" button (was "Publish Plan"), "Going Live..." (was "Publishing...")
  - B2BForm, CourseBundleForm, SingleCoursePlanForm: PUBLISHED→LIVE in all button labels
- `src/components/plans/PlanOverviewTab.tsx`
  - `isLive = plan.status === 'LIVE'` (removed `|| plan.status === 'PUBLISHED'`)
  - `liveConflictError` state — shows inline error banner if uniqueness guard blocks
  - `handleSetLive`: fires `checkLivePlanExistsForTierScope` with `plan.id` as excludePlanId; `updatePlan(plan.id, { status: 'LIVE' })`
  - "Make Live" button (was "Set Live"), "Going Live..." (was "Saving...")
- `src/components/plans/EditPlanSlideOver.tsx` (B2CEditForm)
  - `allowedTypes` derived from `TIER_ALLOWED_TYPES[plan.tier]` — no longer togglable
  - Section 1: read-only Tier badge (zinc/blue/amber for BASIC/PRO/PREMIUM)
  - Section 4: read-only divs, opacity-50 for non-included types; subtitle "Allowed types are derived from tier and cannot be changed."
  - Status cast: `'DRAFT' | 'LIVE' | 'DELETED'`

**Bug fixed:**
- All B2C assessment plan cards were showing "Draft" badge. Root cause: `PlanStatusBadge` had no `PUBLISHED` key, so `status='PUBLISHED'` fell through to `config.DRAFT`. Fix: DB migration (`UPDATE plans SET status='LIVE' WHERE status='PUBLISHED'`) + all code updated to use LIVE.

**End-user /plans page fix:**
- `fetchLivePlatformPlans` and `fetchLiveCategoryPlansGrouped` were filtering `.eq('status', 'PUBLISHED')` — page returned no plans. Fixed to `.eq('status', 'LIVE')`.

**Key decisions locked:**
- Plan status vocabulary is now permanently `LIVE | DRAFT | DELETED`. `PUBLISHED` is fully deprecated.
- `allowed_assessment_types` is always derived from tier — never free-form. BASIC=['FULL_TEST'], PRO=['FULL_TEST','SUBJECT_TEST'], PREMIUM=all three.
- Uniqueness guard enforced at the LIVE transition point (not draft creation).
- 18 seed plans use deterministic UUIDs: platform `a1000001-...-000[1-3]`, NEET `a2000001-...`, JEE `a3000001-...`, SAT `a4000001-...`, CLAT `a5000001-...`, PMP `a6000001-...`; suffix 1/2/3 = BASIC/PRO/PREMIUM.
- `plan_content_map` links via JOIN on `exam_categories.name` (not hardcoded IDs) for category plans.
- max_attempts=5 on all 18 plans (1 free always included → 6 total visible to learner).

**Build:** `npm run build` passed clean.

---

### April 18, 2026 — Category Plan Gating & Demo Infrastructure (KSS-SA-039)

**Ticket:** KSS-SA-039 | **PRDs:** `prds/super-admin/PRD-SA-PLANS-PRICING.md`, `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md`

**DB seeds (all run in Supabase SQL editor — confirmed via SQL-RESPONSE.txt):**
- KSS-DB-039a: Confirmed `exam_categories.name` values: `BANK, CLAT, JEE, NEET, SAT, SSC`
- KSS-DB-039b: 9 category plans inserted — NEET/JEE/CLAT × BASIC/PRO/PREMIUM, all `status = 'PUBLISHED'`, `scope = 'CATEGORY_BUNDLE'`
  - NEET BASIC `10000001-ca39-…`, NEET PRO `10000002-ca39-…`, NEET PREMIUM `10000003-ca39-…`
  - JEE BASIC `20000001-ca39-…`, JEE PRO `20000002-ca39-…`, JEE PREMIUM `20000003-ca39-…`
  - CLAT BASIC `30000001-ca39-…`, CLAT PRO `30000002-ca39-…`, CLAT PREMIUM `30000003-ca39-…`
- KSS-DB-039c: 3 demo users inserted — all `subscription_tier = 'free'`
  - Ananya Krishnan `c1a2e3b4-5f6a-7b8c-9d0e-f1a2b3c4d5e6` — `neet@keyskillset.com`, `selected_exams=['NEET']`
  - Rohan Mehta `d2b3f4c5-6a7b-8c9d-0e1f-a2b3c4d5e6f7` — `jee@keyskillset.com`, `selected_exams=['JEE']`
  - Preethi Nair `e3c4a5d6-7b8c-9d0e-1f2a-b3c4d5e6f7a8` — `clat@keyskillset.com`, `selected_exams=['CLAT']`
- KSS-DB-039d: 3 `b2c_assessment_subscriptions` rows — each user linked to their BASIC category plan, `status = 'active'`

**Code changes:**
- `src/types/index.ts` — Added `ActivePlanInfo` interface (`scope`, `tier`, `category`); added `activePlanInfo?: ActivePlanInfo | null` to `User`
- `src/data/demoUsers.ts` — Added `active_plan_info?: ActivePlanInfo | null` to `DemoUser` type; added 3 category plan users (Ananya/Rohan/Preethi) to `DEMO_USERS`; platform plan users (Basic/Pro/Premium) now have `active_plan_info` with `scope: 'PLATFORM_WIDE'`
- `src/context/AppContext.tsx` — `demoUserToUser()` maps `demo.active_plan_info → activePlanInfo`
- `src/app/page.tsx` — Persona selector: platform plan users filtered to "Learner Personas" bay; new "Category Plan Learners" bay added with FlaskConical/Atom/Scale icons, green/orange/purple colour scheme, `{CATEGORY}·{TIER}` badges
- `src/components/assessment/AssessmentCard.tsx` — Added State 3 (category mismatch); `normalizeExam()` helper maps `IIT-JEE → JEE`; `deriveCardState()` accepts `activePlanInfo`; State 3 renders "Take Free Test"/"Resume Test"/"View Analysis" + "Switch Plan → /plans?highlight={exam_type}"; `AssessmentCardProps` extended
- `src/components/assessment/AssessmentLibrarySection.tsx` — `ExamCategorySection` and `AssessmentCard` receive `activePlanInfo` from context
- `src/app/plans/page.tsx` — `useSearchParams()` wrapped in `Suspense`; `?highlight=` param reads on mount → smooth scroll + 2-second ring animation (`ring-2 ring-blue-500 ring-offset-2`) on `CategoryAccordion`; each accordion gets `id="category-{name.toLowerCase()}"`
- `src/lib/supabase/b2c-users.ts` — `B2CUser` type extended with `activePlanLabel: string | null`, `activePlanScope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE' | null`; `fetchB2CUsers()` adds 4th parallel query on `b2c_assessment_subscriptions` + resolves plan details via `plans` table
- `src/app/super-admin/b2c-users/page.tsx` — "PLAN" column added after "TIER" column; green badge for `CATEGORY_BUNDLE` (e.g. "NEET BASIC"), blue for `PLATFORM_WIDE` (e.g. "Basic"), `—` for no active plan; `colSpan` updated to 9
- `src/app/checkout/page.tsx` — Mutual exclusivity gate: if `user.activePlanInfo` is non-null, renders full-page blocker (AlertCircle + "Go to Plans" CTA). No payment form shown.

**Docs updated this session:**
- `docs/CLAUDE-DB.md` — `subscription_tier` annotated as platform-plan ONLY; category plan demo UUIDs added; CATEGORY_BUNDLE plan rules + mutual exclusivity rule added
- `docs/CLAUDE-PLATFORM.md` — "Category Plan Learners" bay spec; State 3 (category mismatch) added to assessment card section; Plan column spec in B2C Users
- `docs/CLAUDE-RULES.md` — New section: "ASSESSMENT PLAN MUTUAL EXCLUSIVITY (Locked — KSS-SA-039)" before ANALYTICS ACCESS RULES
- `prds/super-admin/PRD-SA-PLANS-PRICING.md` — New PRD (full spec, SA-side)
- `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md` — New PRD (end-user side; Section 1 full, Sections 2–5 placeholders)

**Build:** `npm run build` passed clean.

**Key decisions locked:**
- `users.subscription_tier` is platform-plan tier ONLY — category plan subscriptions NEVER write to this field. Category plan holders always have `subscription_tier = 'free'`.
- `activePlanInfo` is the single source of truth for all category plan gating decisions across the app (AssessmentCard, checkout gate, plans page CTA).
- In demo: `activePlanInfo` is static from `demoUsers.ts`. In production: fetched once from `b2c_assessment_subscriptions` on session start.
- `IIT-JEE` (exam_type in legacy assessments table) normalises to `JEE` (plan category string) via `normalizeExam()` in AssessmentCard.
- V1 mutual exclusivity is UI-only. No DB trigger or server-side constraint. Production would enforce via Stripe webhook validation.
- State 3 is checked BEFORE tier-based States 1/2/4–7 in `deriveCardState()`.

---

### April 16, 2026 — Akash Institute Content Bank: 6 Private Courses Seed + UI Extension

**No schema changes — data-only seed + UI code change.**

**Seed data (SQL-RESPONSE.txt):**
- 6 B2B_ONLY courses inserted into `courses` table for Akash Institute (`tenant_id = ec1bc005-e76d-4208-ab0f-abe0d316e260`)
- All seeded with `status = INACTIVE` → appear under "Pending Review" tab in Content Bank
- `created_by = 7e1c0560-3f2b-44fa-ae18-ebb05ad2f860` (Rahul Sharma — Akash CA)
- `price = 0`, `price_usd = 0`, `audience_type = B2B_ONLY`, `is_individually_purchasable = false`

| Course | UUID | `course_type` |
|---|---|---|
| NEET Preparation Course | `96a8eebd-b8dc-4a57-a89e-68cf5ca74ab7` | COMBINATION |
| JEE Preparation Course | `4487343a-bc74-4a6c-83aa-feb0f2cd7536` | COMBINATION |
| Cognitive Skills Course | `7b57da77-014e-4436-9d58-d6ebf062cc25` | CLICK_BASED |
| SAT Preparation Course | `e96e99dd-5a8e-4c66-b9cf-6d3eaf6c597a` | COMBINATION |
| Typing Course | `ee93d801-d98e-4059-83b5-0a707afe7df3` | KEYBOARD_TRAINER |
| English Language Course | `dd4923ab-ce70-4e55-97f0-052dbdc62008` | VIDEO |

**Code changes:**
- `src/app/client-admin/[tenant]/content-bank/page.tsx` — extended to query both `assessment_items` (by `tenant_scope_id`) and `courses` (by `tenant_id`) in parallel via `Promise.all`; results merged and sorted by `created_at` desc
- `ContentItem` type: removed `category_name`, renamed `test_type` → `item_type`, added `content_type: 'ASSESSMENT' | 'COURSE'`
- `handleMakeLive` / `handleArchive`: branch on `content_type` to update correct table (`courses` or `assessment_items`)
- Table columns: "Category" replaced with **"Content Type"** (violet `Course` / blue `Assessment` badge); "Test Type" renamed **"Type"** — shows formatted test_type for assessments, formatted course_type for courses
- Row keys: `${content_type}-${id}` to prevent collision between the two datasets
- Imported `formatCourseType` from `@/lib/utils` — used for COURSE rows in "Type" column

**Build:** `npm run build` passed clean.

**Key decisions locked:**
- "Pending Review" = `status = INACTIVE` for both assessments and courses — consistent across tables
- Tenant-private courses scoped by `tenant_id` on `courses`. Assessments scoped by `tenant_scope_id` on `assessment_items`. These are different columns — never conflate.
- Super Admin and Master Org Content Creators have zero visibility into Akash-private courses — privacy enforced purely by `tenant_id` scoping in the query (no RLS needed, no visibility_scope column on courses)
- B2B courses always `price = 0` — do not add non-zero prices to B2B tenant courses
- Content Bank is FULL_CREATOR tenants only — RUN_ONLY tenants are redirected to Catalog

---

### April 15, 2026 — B2C Assessment Card CTA + Demo Data Seeding (KSS-SA-035)

**Ticket:** KSS-SA-035 | **Release:** 32 | **PRD:** `prds/PRD-B2C-ASSESSMENT-CARD-CTA.md`

**Data changes (no schema changes):**
- `assessments.total_questions` corrected to match `assessment_question_map` row counts
- 7 chapter tests updated: `min_tier='professional'` → `min_tier='premium'` (NEET Mechanics, Thermodynamics, Electrochemistry, Genetics; JEE Calculus; CLAT Legal Reasoning, Logical Reasoning)
- Premium User: `is_free_attempt=true` set on all `attempt_number=1` rows; 2 chapter test attempts added per 9 chapter tests; chapter test analytics (section_results, concept_mastery, ai_insights) repurposed from Priya; `selected_exams` updated to `['SAT','JEE','NEET','CLAT']`
- Priya Sharma: all old attempts + concept_mastery deleted; re-seeded with 6 clean attempts (1 free + 5 paid) per SAT+NEET full+subject tests only — no analytics
- Basic User: chapter/subject test attempts + invalid CLAT row deleted; re-seeded SAT FT1 (3 attempts), SAT FT2 (3 attempts), JEE FT1 (2 attempts); section_results + concept_mastery seeded on attempt_number=1 for SAT FT1 + FT2; NO ai_insights
- Free User: all attempts deleted; SAT Full Test 1 attempt_number=1 (is_free_attempt=true, COMPLETED) seeded

**Code changes:**
- `src/components/assessment/AssessmentCard.tsx` — States 6+7 collapsed to single "View Analysis" button, Retry removed
- `src/hooks/useUserAttempts.ts` — NEW hook; fetches all attempts for userId from Supabase; returns `Map<assessmentId, MockAttemptData>`; exports `DEFAULT_ATTEMPT`
- `src/components/assessment/AssessmentLibrarySection.tsx` — replaced all `getAttemptData(userId, title)` calls with `attemptsMap.get(assessment.id) ?? DEFAULT_ATTEMPT`; `ExamCategorySection` now receives `attemptsMap` prop; loading state covers both hooks
- `src/data/demoUsers.ts` — Premium User `selected_exams` updated to `['SAT','JEE','NEET','CLAT']`
- `src/components/quiz/RetryButton.tsx` — deleted (was TODO stub returning null, never imported)

**PRDs:**
- `prds/PRD-B2C-ASSESSMENT-CARD-CTA.md` — new file (KSS-SA-035, Release 32)
- `prds/PRD-AI-INSIGHTS-UPGRADE-PROMPT.md` — status → UPDATED; Section 10 added (Basic/Free demo data decisions for isAiEligible gate)

**Build:** `npm run build` passed clean.

**Key decisions locked:**
- No Retry on card — permanent. States 6+7 identical. Retry lives in detail/instructions flow only.
- `mockAttempts.ts` retained as type source (`MockAttemptData` interface) — `DEMO_ATTEMPTS` map is now dead code for library section but not deleted.
- Basic User has no ai_insights by design — always hits `isAiEligible=false` gate.
- `user_concept_mastery.assessment_id` is `text` type, UNIQUE on `(user_id, assessment_id, concept_tag, attempt_number)`.

---

### April 13, 2026 — B2C Plans Page DB-First Rebuild + Category Plans (KSS-SA-031 extension)

**Data changes (no schema change — data-only):**
- Restored 3 PLATFORM_WIDE plans (DELETED→LIVE): All Exams Basic/Pro/Premium
  - Added display_name, tagline, feature_bullets, is_popular (Pro=true), cta_label
- Updated NEET Pro (`96729cdd`): feature_bullets, is_popular=true, display_name, tagline, cta_label
- Updated JEE Premium (`4b68b3b9`): feature_bullets, display_name, tagline, cta_label
- Inserted 4 new CATEGORY_BUNDLE LIVE plans: NEET Basic, NEET Premium, JEE Basic, JEE Pro (is_popular for Pro)
- Inserted plan_subscribers for 4 new plans (412/178/334/267)
- Extended all active b2c_assessment_subscriptions.current_period_end to 2026-05-13
- Linked Basic user (a0c16137) subscription plan_id → Platform Basic (7151a03c)
- Inserted NEET Basic subscription for free user 9a3b56a5

**Demo plan → user state:**
- Free user (9a3b56a5) → NEET Basic
- Basic user (a0c16137) → Platform Basic
- Pro user / Priya (e150d59c) → NEET Pro (was already linked)
- Premium user (191c894d) → JEE Premium (was already linked)

**Code changes:**
- `src/lib/supabase/plans.ts`: Added `fetchLivePlatformPlans()`, `fetchLiveCategoryPlansGrouped()`, `fetchActivePlanForUser()`, `ActivePlanInfo` type
- `src/app/plans/page.tsx`: Full DB-first rewrite — platform plans + category plans accordion (collapsed by default), mutual exclusivity CTA logic, no gamification strip, warning banner global
- `src/app/super-admin/plans-pricing/new/page.tsx`: Rename "Category Bundle" → "Category Plans" (label + subtitle + validation message)

**CTA mutual exclusivity rules (locked):**
- No active plan → all CTAs available
- On platform plan → category plan CTAs: "Cancel current plan first"
- On category plan → platform plan CTAs: "Cancel current plan first", other category CTAs: "Cancel current plan first"
- Within same group: lower tier → "Unable to Downgrade", higher tier → "Upgrade to [tier]"
- Category plans: only show categories with all 3 tiers (BASIC/PRO/PREMIUM) + non-empty feature_bullets

---

### April 13, 2026 — B2C Analytics Engine — Demo Build (KSS-DB-022 to KSS-DB-025)

**Schema applied (project: uqweguyeaqkbxgtpkhez):**
- KSS-DB-022: `attempt_answers` table (per-question answer data)
- KSS-DB-023: `attempt_section_results` table (per-section aggregates)
- KSS-DB-024: `user_concept_mastery` table (concept-tag mastery per attempt)
- KSS-DB-025: `attempt_ai_insights` table (`what_went_well` + `next_steps`, two-column)

**Seed data:**
- 5 completed attempts seeded for Pro user `e150d59c-13c1-4db3-b6d7-4f30c29178e9` (Priya Sharma):
  - NEET Full Test 1: attempts 1 (`989e2ece`) and 2 (`deed0002-...-0001`)
  - CLAT Full Test 1: attempt 1 (`87ad5ef1`)
  - NEET Biology subject test: attempt 1 (`abab13b1`)
  - SAT Craft & Structure chapter test: attempt 1 (`deed0002-...-0002`)
- Section results, concept mastery, and static AI insights seeded for all 5 attempts.

**AnalyticsTab rebuild** (`src/components/assessment-detail/AnalyticsTab.tsx`):
- Fully DB-first — self-fetches from Supabase using `useAppContext` user ID
- 5 output blocks: Score Summary, Marks Lost (rose, negative-marking exams), Section Breakdown, Concept Mastery (heatmap ≥2 attempts / bars for 1), AI Insight Panel (What went well / Next Steps)
- `attempts` prop removed from component interface; page updated accordingly

**AttemptsTab rebuild** (`src/components/assessment-detail/AttemptsTab.tsx`):
- DB-first: fetches `attempts` from Supabase; falls back to mock data if no DB rows
- "View Analysis" button now routes to `?tab=analytics` instead of legacy `/analysis/[id]`

**Question Bank JSONB fix** (`src/app/super-admin/question-bank/page.tsx`):
- Added `extractPlainText(jsonb)` helper — recursively extracts text from Tiptap doc nodes
- Mapped `question_text` through `extractPlainText()` on row load (fixes `[object Object]` rendering)
- Search filter changed from `.ilike('question_text', ...)` to `.filter('question_text::text', 'ilike', ...)` for JSONB compat

**PRD published:**
- `docs/PRD-AI-ANALYTICS.md` rewritten to v2.0 (Apr 13 2026)
- Confluence: https://keyskillset-product-management.atlassian.net/wiki/x/CgBEBw (Release 32 Phase 2)
- Added to `docs/CLAUDE-ATLAS.md`

---

### April 12, 2026 — Tiptap Rich Text Integration — Question Bank (KSS-DB-018, KSS-DB-019)

**Schema applied:**
- **KSS-DB-018:** `ALTER TABLE questions ALTER COLUMN question_text TYPE JSONB USING ...`, `ALTER COLUMN explanation TYPE JSONB USING ...`, `ALTER COLUMN passage_text TYPE JSONB USING ...`. UPDATE to wrap existing text string in minimal Tiptap doc. UPDATE for `options` JSONB array to replace inner `text` string values with Tiptap doc objects via `jsonb_array_elements`.
- **KSS-DB-019:** `ALTER TABLE passage_sub_questions ALTER COLUMN question_text TYPE JSONB USING ...`, `ALTER COLUMN explanation TYPE JSONB USING ...`. Same Tiptap doc wrapping applied.

**RichTextEditor component** (`src/components/ui/RichTextEditor.tsx`) — NEW:
- Tiptap v3.22.3: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mathematics` (KaTeX), `@tiptap/extension-underline`, `@tiptap/extension-subscript`, `@tiptap/extension-superscript`
- Exports: `JSONContent` type, `emptyDoc()`, `isDocEmpty()`, `ensureDoc()` helpers
- Toolbar: Bold | Italic | Underline | Subscript | Superscript | BulletList | OrderedList | Inline Math ($x$) | Block Math ($$x$$)
- `onMouseDown + e.preventDefault()` on toolbar buttons to prevent editor blur
- External value sync via `useEffect` comparing JSON strings — no circular onChange loop
- Storage format: Tiptap JSON (`{ type: 'doc', content: [...] }`) stored as JSONB in PostgreSQL

**QuestionForm rewrite** (`src/app/super-admin/question-bank/_components/QuestionForm.tsx`):
- All text fields migrated: `question_text`, `explanation`, `passage_text` → `JSONContent`
- `options[].text` → `JSONContent` (was `string`)
- `SubQuestionDraft.question_text` and `.explanation` → `JSONContent`
- All `<textarea>` and option `<input>` replaced with `<RichTextEditor>`
- Option rows: `flex items-start gap-2`, radio/checkbox key label use `pt-2.5` for vertical alignment
- `validate()` uses `isDocEmpty()` instead of `.trim()`
- `loadQuestion()` uses `ensureDoc()` for backward compat with any legacy string rows
- Exam player rendering of Tiptap JSONB → separate ticket (TIPTAP-001/002 in TODO-BACKLOG.md)

**Assessment Authoring Platform — Master PRD** (Confluence page 121831426):
- Created April 12 2026. Sections: Overview, Scope, Sub-PRD Index (AAP-1 to AAP-5), Data Architecture, Rich Text Editor Spec, Concept Tag, Key Routes, Open Items.
- URL added to `docs/CLAUDE-ATLAS.md`.

**Doc maintenance:**
- All emojis removed from all docs (CLAUDE-PT.md, CLAUDE-DB.md, TODO-BACKLOG.md).
- CLAUDE.md TIER 2 section removed — CLAUDE.md is rulebook only; all pending items in TODO-BACKLOG.md.

---

### April 11, 2026 — Assessment Bank — Sources & Chapters, Question Bank, Create Question (KSS-DB-015, KSS-DB-016)

**Schema applied:**
- **KSS-DB-015:** `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS description TEXT, ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0`
- **KSS-DB-016:** `ALTER TABLE questions ADD COLUMN IF NOT EXISTS concept_tag TEXT`

**Sources & Chapters** (`super-admin/sources-chapters/page.tsx`) — full build from Coming Soon:
- CRUD: Create / Edit / Delete sources. Exam category FK loaded from `exam_categories` table (UUID, not hardcoded text).
- `exam_category_id UUID FK→exam_categories` — NOT legacy `exam_category TEXT` column (critical bug fix)
- Source cards show chapter count; category filter uses UUID comparison.
- "Chapters →" button navigates to `[sourceId]`

**Chapter detail** (`super-admin/sources-chapters/[sourceId]/page.tsx`) — new page:
- CRUD: Create / Edit / Delete chapters.
- Fields: `name`, `description`, `order_index`, `difficulty` (`easy|medium|hard|mixed`), `status` (`DRAFT|ACTIVE`)
- Ordered by `order_index ASC`. Source name/category shown in subtitle via join.

**Chapter questions view** (`super-admin/sources-chapters/[sourceId]/[chapterId]/page.tsx`) — new page:
- Read view of questions in a chapter. Edit links out to `/question-bank/[id]/edit`.
- Type, difficulty, and concept_tag filters. Breadcrumb: Sources & Chapters → Source → Chapter.

**Question Bank** (`super-admin/question-bank/page.tsx`) — full build from Coming Soon:
- Two-row filter panel (matches production screenshot):
  Row 1: Search | All Types | All Difficulty | All Status
  Row 2: All Sources | All Creators | Created on (date) | Last edited (date) | Clear filters
- `+ Create Question` button links to `/question-bank/new`. Status defaults to `ACTIVE`.
- Sources from `sources` table; Creators from `admin_users` (CONTENT_CREATOR + SUPER_ADMIN, is_active=true).
- Date filters: single-day match. Pagination 50/page.

**QuestionForm** (`super-admin/question-bank/_components/QuestionForm.tsx`) — all 5 types:
- `MCQ_SINGLE` | `MCQ_MULTI` | `NUMERIC` | `PASSAGE_SINGLE` | `PASSAGE_MULTI`
- Options: `{key: string, text: TiptapDoc}[]` JSONB (keys A/B/C/D) — text migrated to Tiptap JSONB in KSS-DB-018
- `correct_answer: ["A"]` for MCQ; `acceptable_answers: ["42"]` for NUMERIC (no `correct_answer`)
- `passage_sub_questions` FK: `parent_question_id` (NOT `question_id`)
- `concept_tag`: optional free-text, single tag, not required — CT-1/CT-2/CT-3 resolved
- Difficulty: lowercase `easy|medium|hard` only. Status on create: always `ACTIVE`.

**New/Edit wrappers:**
- `super-admin/question-bank/new/page.tsx` — accepts `?chapterId` and `?sourceId` query params
- `super-admin/question-bank/[questionId]/edit/page.tsx` — thin wrapper calling QuestionForm (edit mode)

**CreateTenantSlideOver country/state (Issue 3):**
- `country-state-city` library wired. ISO codes in form state; resolved to full names at DB insert.
- State dropdown disabled until country selected. Audit log `after_state` uses full names.

**concept_tag decisions (CT-1/CT-2/CT-3):**
- Single tag per question | optional (not required) | free text (no vocabulary table in V1)

---

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

**Courses (15 total):**
- 1 B2C ARCHIVED: HIPAA Compliance Training (`425b71f4`, `is_individually_purchasable=true`, $12.99)
- 7 B2B LIVE (platform-wide, `tenant_id = NULL`)
- 1 INACTIVE: CLAT (platform-wide)
- 6 B2B INACTIVE: Akash-private (`tenant_id = ec1bc005`, seeded Apr 16 2026) — NEET, JEE, Cognitive Skills, SAT, Typing, English Language

**Plans (9 total):** 6 B2C + 3 B2B (Akash Standard, TechCorp Premium, Enterprise Pro — all PLATFORM_WIDE/PUBLISHED)

**tenant_plan_map:**
- Akash Standard → Akash Institute
- TechCorp Premium → TechCorp India
- Enterprise Pro → both tenants

---

### April 17, 2026 — KSS-SA-038: Super Admin Dashboard B2C Revenue Tab

**Ticket:** KSS-SA-038 | **PRD:** `prds/super-admin/PRD-SA-DASHBOARD.md`

**DB changes:**
- KSS-DB-038a: Added `PUBLISHED` back to `plans_status_check` constraint
- KSS-DB-038b: Migrated 13 existing LIVE B2C plans → `PUBLISHED` status
- Plan status rule going forward: B2C plans use `PUBLISHED`, B2B plans use `LIVE`

**Code changes:**
- Renamed "Revenue" tab → "B2C Revenue" in dashboard
- Removed "Subscribers by Plan" pie chart from RevenueTab
- Created reusable `InfoTooltip` component (`src/components/ui/InfoTooltip.tsx`)
- Fixed MRR calculation: `(ANNUAL: price/12, MONTHLY: price) × subscribers`
- Added BILLING and ADDED ON columns to plan table
- Added client-side pagination (10/15/25, default 10) to plan table
- Fixed `fetchLivePlatformPlans`, `fetchLiveCategoryPlansGrouped`, `fetchPublishedPlans` to use `status = 'PUBLISHED'`
- Fixed `syncCourseFromPlan`, `transitionSingleCoursePlanStatus`, plan publish action for B2C → `PUBLISHED`

---

### April 17, 2026 — KSS-SAT-A01/A02: SAT Analytics Overhaul

**Ticket:** KSS-SAT-A01/A02 | **PRD:** `prds/PRD-SAT-ANALYTICS.md`

**New components:**
- `src/components/ui/AttemptPillFilter.tsx` — shared attempt pill (no score in label)
- `src/components/assessment-detail/ConceptMasteryPanel.tsx` — section pills, always-table layout, weakest-first sort, sticky col
- `src/components/assessment-detail/SATAnalyticsTab.tsx` — SAT full/subject tests; 400-1600 scoring, 4-module breakdown, dual heatmap, AI Insight panel
- `src/components/assessment-detail/ChapterAnalyticsTab.tsx` — all chapter tests (SAT/NEET/JEE/CLAT); negative marking aware
- `src/components/assessment-detail/SATScoringTable.tsx` — collapsible scoring reference

**Deleted:** `SolutionsPanel.tsx` — replaced by inline DB-driven accordion in AnalyticsTab. NEVER recreate.

**Key locks:**
- AttemptPillFilter: `Attempt N` label only — NO score in pill
- ConceptMasteryPanel: always table layout (never bar chart), rows sorted weakest-first
- SATAnalyticsTab: DO NOT TOUCH without explicit instruction — managed in separate session
- `isAiEligible = userTier === 'professional' || userTier === 'premium'` — locked

---

### April 17, 2026 — KSS-SA-037: Concept Tags + Platform Config + SAT Question Seeding

**Ticket:** KSS-SA-037 | **DB:** KSS-DB-030/031/032

**Schema:**
- `concept_tags` table (exam_category, subject, concept_name, slug)
- `question_concept_mappings` (question_id → concept_tag_id)
- `user_concept_mastery` enhanced (module_id, stage computed, attempt_count, trend)

**Seeded:** 45 SAT + 43 NEET + 33 JEE + 23 CLAT concept tags (144 total)

**SAT Question Seeding:**
- 8 SAT sources (UUIDs a1000001–008), 16 chapters (b1000001–016)
- 120 SAT questions (Practice Test #4): 33+33+27+27 across 4 modules
- Linked to: Full Test (120Q), R&W Subject (66Q), Math Subject (54Q)
- `question_concept_mappings`: 120 rows synced

**Code:**
- Platform Config page: Concept Tags CRUD (`src/app/super-admin/platform-config/page.tsx`)
- Super Admin nav updated to include Platform Config
- QuestionForm: `concept_tag` converted from text input → dropdown from `concept_tags` table
- Created `docs/SEEDING-FRAMEWORK.md` and `database.schema.json`

---

### April 18, 2026 — KSS-SA-039: Category Plan Gating & Demo Infrastructure (PRDs + Docs)

**Ticket:** KSS-SA-039 | **PRDs:** `prds/super-admin/PRD-SA-PLANS-PRICING.md` + `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md`

**This session:** Documentation and planning only. Code + DB tasks pending.

**Key decisions locked:**
- `users.subscription_tier` is platform-plan-only. Category plan holders keep `subscription_tier = 'free'` permanently.
- `activePlanInfo` shape: `{ scope, tier, category }` — added to `User` type + AppContext. Demo: static from `demoUsers.ts`. Production: fetched once on session start from `b2c_assessment_subscriptions`.
- Mutual exclusivity: one active plan at a time (platform OR category). Enforced at `/plans` CTA + `/checkout` gate (UI-level, V1).
- Assessment card State 3 (category mismatch): before States 4–7. "Take Free Test" + "Switch Plan" → `/plans?highlight={category}`.
- B2C Users "Plan" column: eager LATERAL JOIN on `b2c_assessment_subscriptions` → `plans`. Shows platform plan OR category plan per user.
- 3 new demo users: Ananya Krishnan (NEET Basic, `c1a2e3b4`), Rohan Mehta (JEE Basic, `d2b3f4c5`), Preethi Nair (CLAT Basic, `e3c4a5d6`)
- Persona selector new "Category Plan Learners" bay: green/FlaskConical (NEET), orange/Atom (JEE), purple/Scale (CLAT)

**Files created/updated this session:**
- `prds/super-admin/PRD-SA-PLANS-PRICING.md` — CREATED
- `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md` — CREATED (§1 LOCKED, §2–5 PLACEHOLDER)
- `docs/CLAUDE-DB.md` — updated: `subscription_tier` platform-only rule, category plan notes, 3 new demo UUIDs, plan status/mutual exclusivity rules
- `docs/CLAUDE-PLATFORM.md` — updated: persona selector bay spec, State 3 card spec, B2C Users Plan column spec
- `docs/CLAUDE-RULES.md` — updated: ASSESSMENT PLAN MUTUAL EXCLUSIVITY section added
- `docs/TODO-BACKLOG.md` — rewritten: active tasks only, completed work moved here

**b2c_certificates:** 4 demo rows seeded for HIPAA completions (Premium, Priya, Basic, Siddharth)