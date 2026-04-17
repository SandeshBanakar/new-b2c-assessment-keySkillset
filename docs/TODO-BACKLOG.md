# TODO Backlog — keySkillset Platform
# Updated Apr 17 2026 (session 3). Pick up items as separate tickets with KSS-DB-XXX authorisation where required.

---

## [DONE] Super Admin Dashboard — B2C Revenue Tab — KSS-SA-038 (Apr 17 2026)

Super Admin Dashboard Revenue tab fix, rename, and full feature build.
PRD: `prds/super-admin/PRD-SA-DASHBOARD.md`

### DB Migration
| # | Migration | Status |
|---|-----------|--------|
| KSS-DB-038a | Add `PUBLISHED` to `plans_status_check` constraint | [x] DONE Apr 17 |
| KSS-DB-038b | Migrate existing `LIVE` B2C plans → `PUBLISHED` (13 rows) | [x] DONE Apr 17 |

### Fixes
| # | Task | File | Status |
|---|------|------|--------|
| SA038-F01 | Fix Revenue tab empty data: `status = 'PUBLISHED'` (was `'PUBLISHED'` → renamed to `'LIVE'` in migration, now restored) | `src/lib/supabase/analytics.ts` | [x] DONE Apr 17 |
| SA038-F02 | Fix plan publish failure: `'PUBLISHED'` rejected by DB constraint — constraint restored | `plans_status_check` | [x] DONE Apr 17 |
| SA038-F03 | Fix `syncCourseFromPlan` to accept `'PUBLISHED'` status | `src/lib/supabase/plans.ts` | [x] DONE Apr 17 |
| SA038-F04 | Fix `transitionSingleCoursePlanStatus` signature + `setWasLive` logic | `src/lib/supabase/plans.ts` | [x] DONE Apr 17 |
| SA038-F05 | Fix `PlanOverviewTab` publish action: B2C → `PUBLISHED`, B2B → `LIVE` | `src/components/plans/PlanOverviewTab.tsx` | [x] DONE Apr 17 |
| SA038-F06 | Fix `plans-pricing/new` single course plan handleSubmit: `'LIVE'` → `'PUBLISHED'` | `src/app/super-admin/plans-pricing/new/page.tsx` | [x] DONE Apr 17 |
| SA038-F07 | Fix `fetchPublishedPlans`, `fetchLivePlatformPlans`, `fetchLiveCategoryPlansGrouped` queries | `src/lib/supabase/plans.ts` | [x] DONE Apr 17 |
| SA038-F08 | Update TypeScript status types across `plans.ts`, `EditPlanSlideOver.tsx` | multiple | [x] DONE Apr 17 |

### Features
| # | Task | File | Status |
|---|------|------|--------|
| SA038-01 | Rename "Revenue" tab → "B2C Revenue" | `src/app/super-admin/dashboard/page.tsx` | [x] DONE Apr 17 |
| SA038-02 | Remove "Subscribers by Plan" pie chart from RevenueTab | `src/components/analytics/RevenueTab.tsx` | [x] DONE Apr 17 |
| SA038-03 | Create reusable `InfoTooltip` component (click-to-open, click-outside-to-close) | `src/components/ui/InfoTooltip.tsx` | [x] DONE Apr 17 |
| SA038-04 | Add InfoTooltip to Total MRR, New Subscriptions, Churn Rate KPI cards | `RevenueTab.tsx` | [x] DONE Apr 17 |
| SA038-05 | Add InfoTooltip to Plan column header in table | `RevenueTab.tsx` | [x] DONE Apr 17 |
| SA038-06 | Fix MRR calculation: `(ANNUAL: price/12, MONTHLY: price) × subscribers` | `src/lib/supabase/analytics.ts` | [x] DONE Apr 17 |
| SA038-07 | Add `billing_cycle` + `created_at` to `fetchRevenue` plans query; ORDER BY `created_at DESC` | `src/lib/supabase/analytics.ts` | [x] DONE Apr 17 |
| SA038-08 | Add BILLING column to plan table | `RevenueTab.tsx` | [x] DONE Apr 17 |
| SA038-09 | Add ADDED ON column to plan table (format: "17 April 2026") | `RevenueTab.tsx` | [x] DONE Apr 17 |
| SA038-10 | Add client-side pagination to plan table (10/15/25, default 10, page-scoped footer MRR) | `RevenueTab.tsx` | [x] DONE Apr 17 |
| SA038-11 | Create `prds/super-admin/PRD-SA-DASHBOARD.md` (KSS-SA-038) | `prds/super-admin/PRD-SA-DASHBOARD.md` | [x] DONE Apr 17 |

---

## [IN-PROGRESS] SAT Analytics Overhaul — KSS-SAT-A01 (Apr 17 2026)

Full rebuild of the SAT analytics experience across full tests, subject tests, and chapter tests.
PRD: `prds/PRD-SAT-ANALYTICS.md`

### Task 1 — Session Setup + Doc Updates
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T1a | Update CLAUDE.md with Active Roles directive | `CLAUDE.md` | [x] DONE Apr 17 |
| SAT-A01-T1b | Update CLAUDE-PLATFORM.md: AttemptPillFilter spec (no score in pills) | `docs/CLAUDE-PLATFORM.md` | [x] DONE Apr 17 |
| SAT-A01-T1c | Add SAT analytics task list to TODO-BACKLOG.md | `docs/TODO-BACKLOG.md` | [x] DONE Apr 17 |
| SAT-A01-T1d | Create PRD-SAT-ANALYTICS.md | `prds/PRD-SAT-ANALYTICS.md` | [x] DONE Apr 17 |

### Task 2 — Extract AttemptPillFilter shared component
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T2a | Create `AttemptPillFilter.tsx` shared UI component | `src/components/ui/AttemptPillFilter.tsx` | [ ] PENDING |
| SAT-A01-T2b | Wire `AttemptPillFilter` into `SATAnalyticsTab` (below Score Progression) | `src/components/assessment-detail/SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T2c | Wire `AttemptPillFilter` into `AnalyticsTab` (replace existing pill logic) | `src/components/assessment-detail/AnalyticsTab.tsx` | [ ] PENDING |

### Task 3 — SAT Full Test: Remove attempt select + remove question-type filter
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T3a | Remove `<select>` attempt dropdown from inside Section Breakdown | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T3b | Remove question-type filter card (`filter` state, `SOLUTION_FILTERS`, `Analytics filter` card) | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T3c | Simplify `filteredConceptMastery` → `conceptMastery` (no type gating) | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T3d | Simplify `weakConcepts` — remove `allowedConceptTags` filter | `SATAnalyticsTab.tsx` | [ ] PENDING |

### Task 4 — Remove score from AnalyticsTab pills (standardise)
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T4a | Remove `attempt.score` from pill label in `AnalyticsTab.tsx` | `src/components/assessment-detail/AnalyticsTab.tsx` | [ ] PENDING |

### Task 5 — SAT Full Test: Replace hardcoded SolutionsPanel with DB-driven accordion
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T5a | Remove `SAT_SOLUTION_QUESTIONS` export + usage from `SolutionsPanel.tsx` | `src/components/assessment-detail/SolutionsPanel.tsx` | [ ] PENDING |
| SAT-A01-T5b | Adapt `AnalyticsTab` `renderQuestionRow` pattern for SAT module structure (4 module tabs) | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T5c | Wire module tabs to `assessment_question_map` by `section_name` (R&W M1/M2, Math M1/M2) | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T5d | Wire `attempt_answers` for selected attempt → show user answers + correct answer in accordion | `SATAnalyticsTab.tsx` | [ ] PENDING |

### Task 6 — SAT Full Test: AI Insight block review
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T6a | Verify AI Insight block gating: Free/Basic = locked teaser, Pro/Premium = real data or "not available" | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T6b | Fix hardcoded "We are thrilled to say..." upgrade copy — align to CLAUDE-RULES.md AI Insight spec | `SATAnalyticsTab.tsx` | [ ] PENDING |

### Task 7 — Subject Test cascade
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T7a | Verify all T2–T6 changes work correctly for subject tests (isFullTest=false path) | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T7b | Subject test: confirm Section Breakdown shows 4 domain sections (not R&W/Math modules) | `SATAnalyticsTab.tsx` | [ ] PENDING |

### Task 8 — Create generic ChapterAnalyticsTab (all exam types)
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T8a | Create `ChapterAnalyticsTab.tsx` — works for SAT, NEET, JEE, CLAT chapter tests | `src/components/assessment-detail/ChapterAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T8b | Blocks: Attempt Summary, AttemptPillFilter, Concept Performance bars, Solutions, AI Insight | `ChapterAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T8c | Negative marking aware: show "Marks Lost" block for NEET/JEE, hide for SAT/CLAT | `ChapterAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T8d | Update `page.tsx` routing: `chapter-test` → `ChapterAnalyticsTab`, SAT ft/st → `SATAnalyticsTab`, else → `AnalyticsTab` | `src/app/assessments/[id]/page.tsx` | [ ] PENDING |

### Task 10 — Extract ConceptMasteryPanel as shared component
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T10a | Create `ConceptMasteryPanel.tsx`: section pills, always-table layout, weakest-first sort, sticky col, date headers | `src/components/assessment-detail/ConceptMasteryPanel.tsx` | [ ] PENDING |
| SAT-A01-T10b | Wire into `SATAnalyticsTab` — replaces dual Math/RW panels; parent builds tagSectionMap from domain maps | `SATAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T10c | Wire into `ChapterAnalyticsTab` | `ChapterAnalyticsTab.tsx` | [ ] PENDING |
| SAT-A01-T10d | AnalyticsTab concept mastery upgrade — DEFERRED to separate ticket | `AnalyticsTab.tsx` | [ ] DEFERRED |

### Task 9 — PRD update
| # | Task | File | Status |
|---|------|------|--------|
| SAT-A01-T9a | Update `PRD-SAT-ANALYTICS.md` with final decisions post-implementation | `prds/PRD-SAT-ANALYTICS.md` | [ ] PENDING |
| SAT-A01-T9b | Update `PRD-AI-ANALYTICS.md` §9 components section with new component map | `prds/PRD-AI-ANALYTICS.md` | [ ] PENDING |

---

---

## [DONE] Concept Tags + Platform Config + SAT Question Seeding — KSS-SA-037 (Apr 17 2026)

Schema changes, seeding, UI, QuestionForm dropdown update, and SAT Practice Test #4 question seeding.

### Schema (run in Supabase)

| # | Migration | Status |
|---|-----------|--------|
| KSS-DB-030 | Recreate `concept_tags` table (full hierarchy: exam_category, subject, concept_name, slug) | [x] DONE Apr 17 |
| KSS-DB-031 | Create `question_concept_mappings` table (question_id → concept_tag_id FK) | [x] DONE Apr 17 |
| KSS-DB-032 | Enhance `user_concept_mastery` (add module_id, stage computed, attempt_count, last_attempt_date, trend) | [x] DONE Apr 17 |

### Seed Data

| # | Task | Status |
|---|------|--------|
| CT-SEED-001 | Seed SAT concept tags (R&W: 4 subjects × ~5 tags, Math: 4 subjects × ~6 tags) | [x] DONE Apr 17 — 45 SAT tags |
| CT-SEED-002 | Seed NEET concept tags (Physics, Chemistry, Biology) | [x] DONE Apr 17 — 43 NEET tags |
| CT-SEED-003 | Seed JEE concept tags (Math, Physics, Chemistry) | [x] DONE Apr 17 — 33 JEE tags |
| CT-SEED-004 | Seed CLAT concept tags (English, Legal, Logical, Quant, Current Affairs) | [x] DONE Apr 17 — 23 CLAT tags |

### Code Tasks

| # | Task | File | Status |
|---|------|------|--------|
| CT-001 | Platform Config page — Concept Tags CRUD (list, create, edit, delete) | `src/app/super-admin/platform-config/page.tsx` | [x] DONE Apr 17 |
| CT-002 | Update Super Admin nav to include Platform Config below Marketing | `src/app/super-admin/layout.tsx` | [x] DONE Apr 17 |
| CT-003 | QuestionForm: convert `concept_tag` from text input → dropdown from `concept_tags` table | `src/app/super-admin/question-bank/_components/QuestionForm.tsx` | [x] DONE Apr 17 |
| CT-004 | Update `CLAUDE-DB.md` with new schema + SAT scoring table | `docs/CLAUDE-DB.md` | [x] DONE Apr 17 |
| CT-005 | Create `docs/SEEDING-FRAMEWORK.md` | `docs/SEEDING-FRAMEWORK.md` | [x] DONE Apr 17 |
| CT-006 | Create `database.schema.json` | `database.schema.json` | [x] DONE Apr 17 |
| CT-007 | Update PRD-AI-ANALYTICS.md with mastery fields spec | `prds/PRD-AI-ANALYTICS.md` | [x] DONE Apr 17 |

### SAT Question Seeding (QS-001, QS-002, QS-003)

| # | Task | Status |
|---|------|--------|
| QS-002 | Seed 8 SAT sources + 16 chapters | [x] DONE Apr 17 — UUIDs a1000001-...001–008 / b1000001-...001–016 |
| QS-001 | Seed 120 SAT questions (Practice Test #4) | [x] DONE Apr 17 — 33+33+27+27 across 4 modules |
| QS-003 | Link questions to assessments (Full Test 120Q, R&W Subject 66Q, Math Subject 54Q) | [x] DONE Apr 17 |
| QS-003b | Sync question_concept_mappings (120 rows) | [x] DONE Apr 17 |

### SAT Scoring Display UI

| # | Task | Status |
|---|------|--------|
| SAT-UI-001 | Build `SATScoringTable` component — collapsible scoring reference | [x] DONE Apr 17 — `src/components/assessment-detail/SATScoringTable.tsx` |
| SAT-UI-002 | Wire `SATScoringTable` into `SATAnalyticsTab` | [x] DONE Apr 17 |

---

## [DONE] Akash Institute Content Bank — Courses Seed + UI Extension (Apr 16 2026)

Seed 6 private B2B courses for Akash Institute and extend the Content Bank page to show courses alongside assessment_items.

### Scope
- Seed 6 courses into `courses` table (`tenant_id = ec1bc005-e76d-4208-ab0f-abe0d316e260`, `status = INACTIVE`, `audience_type = B2B_ONLY`)
- Courses: NEET, JEE, Cognitive Skills, SAT, Typing, English Language
- Extend `/client-admin/[tenant]/content-bank/page.tsx` to also query `courses` where `tenant_id = tenantId`
- Unified table display: add "Content Type" column (ASSESSMENT / COURSE), adapt "Type" column to show test_type OR course_type

### Tasks

| # | Task | Status |
|---|------|--------|
| CB-001 | Write SQL to seed 6 courses for Akash Institute | [x] DONE — SQL-RESPONSE.txt (run in Supabase) |
| CB-002 | Extend Content Bank page to query + display courses (unified ContentItem type) | [x] DONE |
| CB-003 | Add "Content Type" pill (ASSESSMENT / COURSE) to Content Bank table | [x] DONE |
| CB-004 | Adapt "Type" column — show test_type for assessments, course_type for courses | [x] DONE |
| CB-005 | Ensure Make Live / Archive actions work correctly for course rows | [x] DONE |

---

## [DONE] Sources & Chapters — KSS-SA-036 (Apr 16–17 2026)

Schema changes authorized. UI rebuild + soft-delete implementation.

### Schema (run in Supabase — results → SQL-RESPONSE.txt)

| # | Migration | SQL | Status |
|---|-----------|-----|--------|
| KSS-DB-027 | Add `status` to `sources` | `ALTER TABLE sources ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE'));` | [x] DONE Apr 16 |
| KSS-DB-028a | Add `deleted_at` to `sources` | `ALTER TABLE sources ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;` | [x] DONE Apr 16 |
| KSS-DB-028b | Add `deleted_at` to `chapters` | `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;` | [x] DONE Apr 16 |
| KSS-DB-029 | Drop `status` from `chapters` | `ALTER TABLE chapters DROP COLUMN IF EXISTS status;` | [ ] PENDING — run in Supabase |

### Seed SQL (run after KSS-DB-029)

| # | Task | Status |
|---|------|--------|
| SEED-001 | Assign `created_by` + `last_modified_by` on existing chapters | [ ] PENDING — Option A: ~60% never edited, ~40% have last editor. Use admin_users from SQL-RESPONSE.txt |

### Code Tasks

| # | Task | File | Status |
|---|------|------|--------|
| SC-001 | Sources main page — full rebuild | `src/app/super-admin/sources-chapters/page.tsx` | [x] DONE Apr 16 |
| SC-001a | — Add `difficulty`, `target_exam`, `status`, `deleted_at` to Source type + query | page.tsx | [x] DONE |
| SC-001b | — Add Difficulty column to table + badge colours (EASY/MEDIUM/HARD/MIXED) | page.tsx | [x] DONE |
| SC-001c | — Fix action icons: Eye → Layers → Pencil → Trash (icon-only, no text pill) | page.tsx | [x] DONE |
| SC-001d | — Create modal: add Target Exam, Difficulty Level, Status fields | page.tsx | [x] DONE |
| SC-001e | — Edit modal: add Target Exam, Difficulty Level, Status fields | page.tsx | [x] DONE |
| SC-001f | — View modal: live chapter fetch + Difficulty + Target Exam + Chapters list + Statistics | page.tsx | [x] DONE |
| SC-001g | — Delete modal: simple confirm (no content-blocking), soft-delete source + child chapters | page.tsx | [x] DONE |
| SC-001h | — All queries filter `deleted_at IS NULL` | page.tsx | [x] DONE |
| SC-001i | — PaginationBar: 25/50/100 rows per page, platform-standard | page.tsx | [x] DONE |
| SC-001j | — Button label: "New Source" → "Create Source" | page.tsx | [x] DONE |
| SC-001k | — ViewSourceModal: remove StatusBadge from chapter rows (post KSS-DB-029) | page.tsx | [x] DONE Apr 16 |
| SC-002 | Chapter list page — full rebuild matching production | `src/app/super-admin/sources-chapters/[sourceId]/page.tsx` | [x] DONE Apr 16 |
| SC-002a | — Remove status entirely from chapters (types, query, UI) | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002b | — Table: Chapter Name / Difficulty / Questions / Created By / Last Edited / Actions | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002c | — Batch admin_users lookup for created_by + last_modified_by names | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002d | — "Never edited" when last_modified_by IS NULL | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002e | — Actions: FileText+Questions button / Eye / Pencil / Trash | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002f | — Create modal: Chapter Name (textarea) + Difficulty only | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002g | — Preview modal: Source + Difficulty + Total Questions stat + black Close | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002h | — Delete modal: amber warning (no blocking) if question_count > 0 | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002i | — Filters: Search + All Difficulties + All Creators (dynamic) | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002j | — Info banner: "Chapters added here will be tagged directly to '[source.name]'" | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-002k | — PaginationBar: 25/50/100 + "Showing X–Y of Z results" | [sourceId]/page.tsx | [x] DONE Apr 16 |
| SC-003 | Update CLAUDE-DB.md — add KSS-DB-027/028/029 schema entries | `docs/CLAUDE-DB.md` | [x] DONE Apr 16 |
| SC-004 | Question assignment diagnostic SQL (deferred — after UI) | `docs/SQL-RESPONSE.txt` | [ ] DEFERRED |
| SC-005 | Questions page full rebuild | `src/app/super-admin/sources-chapters/[sourceId]/[chapterId]/page.tsx` | [x] DONE Apr 17 |

---

## [CRITICAL] — Data / Schema

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| TODO-001 | `assessments` table formal deprecation plan | Legacy B2C engine table. Still canonical for exam engine (useExamEngine reads by slug). Needs migration plan: SA-created assessment_items → assessments at "Make Live". Document promotion sync logic. | Separate ticket |
| TODO-002 | `assessment_items` missing learner-facing columns | `slug`, `total_questions`, `difficulty`, `min_tier`, `is_puzzle_mode`, `rating`, `total_users`, `subject` — needed for full learner detail page once `assessments` table is retired as primary source. | KSS-DB-XXX |
| TODO-003 | Learner assessments list page still on `assessments` table | `/assessments/page.tsx` reads via `AssessmentLibrarySection`. Needs migration to `assessment_items` once that table is canonical. | Separate ticket |
| TODO-006 | `DB-TODO-002` — MAINTENANCE status first-class state | Badge: orange-50/orange-700. Learners cannot access MAINTENANCE content. | KSS-DB-XXX |

---

## [HIGH] Analytics — KSS-SA-031 — DEMO SHIPPED Apr 13 2026

Demo analytics engine is live. All tables seeded. AnalyticsTab rebuilt DB-first.
PRD: https://keyskillset-product-management.atlassian.net/wiki/x/CgBEBw

Remaining production work:

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| ANA-001 | [DONE — demo] `attempt_answers` table created | KSS-DB-022 applied. `time_spent_seconds` column present. Production: wire `useExamEngine` to write per-question rows on submit. See PRD §12. | — |
| ANA-002 | `assessment_question_map.section_name` is fragile for analytics | Text match can break if section renamed. Future: migrate to `section_id` UUID referencing assessment_config.sections[].id at "Make Live" time. | KSS-DB-XXX |
| ANA-003 | [DONE — demo] `attempt_section_results` table created | KSS-DB-023 applied. Seeded with 5 demo attempts. Production: write on submit in `useExamEngine`. | — |
| ANA-004 | [DONE — demo] `user_concept_mastery` table created | KSS-DB-024 applied. Seeded. Production: compute from attempt_answers on submit. | — |
| ANA-005 | Production analytics algorithm — rules engine | Panic detection (< 25% avg section time + wrong), guess detection, weak concept identification, improvement velocity. Spec in PRD §6 + §7. | Separate ticket |
| ANA-006 | [DONE — demo] AnalyticsTab rebuilt DB-first | 5 output blocks live. Static AI insights seeded. Production: wire Claude API (see PRD §11). | — |
| ANA-007 | [DONE — demo] SATAnalyticsTab built | `src/components/assessment-detail/SATAnalyticsTab.tsx`. SAT-specific scoring (400-1600 full, 200-800 subject), 4-module section breakdown, dual heatmap (R&W + Math side-by-side for full test), algorithmic "Where You Lost Points" from mastery < 60%, AI insight panel. Premium demo user seeded with 2 attempts for each SAT assessment (Full Test, Math subject, R&W subject). Production: same as ANA-001 to ANA-004. | — |
| ANA-008 | SAT score equating not implemented | Scaled scores (200-800 per section) are seeded as static values. Real SAT equating depends on adaptive module routing and College Board tables. Production: compute approximate scaled score from raw correct count per module pair using CB lookup tables. | Separate ticket |
| ANA-009 | SAT adaptive module routing not tracked | `attempt_section_results.section_id` currently stores module names. Production: track which module 2 variant (easy/hard) the learner received so analytics can flag routing outcome. | Separate ticket |

---

## [PARTIAL] Question Seeding — KSS-SA-032

| # | Issue | Detail | Status |
|---|-------|--------|--------|
| QS-001 | SAT 120 questions seeded (Practice Test #4) | 33+33+27+27 across 4 modules. MCQ_SINGLE + NUMERIC. All linked to 3 assessments. | [x] DONE Apr 17 |
| QS-002 | SAT sources + chapters seeded | 8 sources, 16 chapters (2/source) with fixed deterministic UUIDs. | [x] DONE Apr 17 |
| QS-003 | assessment_question_map seeded | Full Test (120Q), R&W Subject Test (66Q), Math Subject Test (54Q) | [x] DONE Apr 17 |
| QS-001b | NEET questions (180Q) | NEET (180Q) — all unique, concept_tag, explanation, marks. | [ ] PENDING |
| QS-001c | CLAT questions (~140Q) | Passage-based English, Legal, Logical, Quant, GK. | [ ] PENDING |
| QS-001d | JEE questions (90Q) | Physics, Chemistry, Mathematics — MCQ + NUMERIC. | [ ] PENDING |
| QS-004 | SAT Full Test 2 question mapping | `476083b3-0b9a-4e9e-b550-b02367e6b49b` has no questions — no unique question set seeded yet. | [ ] PENDING |
| QS-005 | Demo attempt data for new questions | Seed attempt rows + attempt_answers for demo users once NEET/JEE/CLAT/SAT FT2 questions are seeded. | [ ] PENDING |

---

## [IN-PROGRESS] Sections Builder — KSS-SA-030 extension

| # | Issue | Detail |
|---|-------|--------|
| SEC-001 | Sections builder UI not yet built in linear form | FULL_TEST only. SA adds sections (name + questionCount + optional durationMinutes when SECTION_LOCKED). Saved to assessment_config.sections[]. |
| SEC-002 | navigation_policy SECTION_LOCKED validation | Cannot select SECTION_LOCKED if assessment has < 2 sections. Warn on save. |
| SEC-003 | total_questions auto-sum from sections | When sections are defined, total_questions = sum of section questionCounts. SA should not enter it manually. |
| SEC-004 | total_marks auto-sum from sections | total_marks = sum of (section.questionCount x section.marksPerQuestion). Needs marksPerQuestion per section. |

---

## [IN-PROGRESS] Tiptap Rich Text — Exam Player Rendering (separate ticket from SA form wiring)

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| TIPTAP-001 | Exam player must render Tiptap JSONB question_text | After KSS-DB-018/019 migrate question_text/explanation/passage_text to JSONB, the exam player (useExamEngine + LinearExamPlayer) currently renders question_text as a plain string — will show raw JSON to students. Must add read-only Tiptap renderer to all question type renderers in the player. | Separate ticket — being handled in parallel instance |
| TIPTAP-002 | Option text JSONB rendering in exam player | options[].text is now Tiptap JSON doc. Exam player option renderer must use read-only Tiptap instance for each option. | Same ticket as TIPTAP-001 |

---

## [DEBT] Type / Code Debt

| # | Issue | Detail | File |
|---|-------|--------|------|
| TODO-008 | `SyllabusSection` type deprecated | After KSS-SA-030, unused. Remove in cleanup. | `src/types/index.ts` |
| TODO-009 | `mockSyllabus` unused after KSS-SA-030 | Remove in cleanup. | `src/data/assessments.ts` |
| TODO-010 | `navigation_policy` vs sections validation | SECTION_LOCKED advisory only until sections builder ships. | `linear/page.tsx` |
| TODO-014 | `ContinueLearningWidget.tsx` still uses `getAttemptData` | Dashboard "Continue Learning" widget uses dead mock data keys — all real users fall to 0-attempt default. Migrate to `useUserAttempts()` hook same as AssessmentLibrarySection (KSS-SA-035). | `src/components/dashboard/ContinueLearningWidget.tsx` |
| TODO-015 | `YourAssessmentsSection.tsx` still uses `getAttemptData` | "Your Assessments" section on dashboard/profile uses dead mock data keys. Migrate to `useUserAttempts()` hook. | `src/components/assessment/YourAssessmentsSection.tsx` |
| TODO-016 | `mockAttempts.ts` DEMO_ATTEMPTS map is dead code | `getAttemptData()` no longer called from AssessmentLibrarySection. Remaining callers (TODO-014, TODO-015) should be migrated then this file's map + function can be removed. Keep `MockAttemptData` interface and `DEFAULT_ATTEMPT` (exported from `useUserAttempts.ts`). | `src/data/mockAttempts.ts` |

---

## [PENDING] Feature Tickets

| Ticket | Feature | Status |
|--------|---------|--------|
| KSS-SA-007 | Marketing Config | [PENDING] |
| KSS-SA-[TBD] | Platform Config (Concept Tags CRUD) | [IN-PROGRESS — Apr 17 2026] |
| KSS-CA-007 | CA Dashboard | [PENDING] |
| KSS-CA-009 | Audit Log (CA) | [PENDING] |
| KSS-SA-019 | Contract mandatory on CA creation (Phase 2 enforcement) | [CRITICAL] |
| KEYS-485 | Restore archived plan | Spec locked Apr 7 2026, not yet built |
| KEYS-501 | Hard delete plan (ARCHIVED + zero subscribers) | Spec locked Apr 7 2026, not yet built |
| KSS-SA-[TBD] | Build Super Admin login + authentication flow | [PENDING] |
| KSS-CA-[TBD] | Build Client Admin login + authentication flow | [PENDING] |
| KSS-B2C-[TBD] | Build B2C user signup + onboarding flow | [PENDING] |
| KSS-SA-[TBD] | SAT Exam Engine (scoring + adaptive routing) | [BACKLOG — todo after concept tags shipped] |

---

## [DONE] Completed / Resolved

| # | Issue | Resolution |
|---|-------|------------|
| ~~TODO-004~~ | Rename content_items → assessment_items | KSS-DB-001 applied Apr 11 2026 |
| ~~TODO-005~~ | Unified questions table + sources + chapters | KSS-DB-009/010/011/012 applied Apr 11 2026 |
| ~~TODO-007~~ | assessment_config needs marks fields | assessment_config JSONB with sections[] added KSS-DB-017 |
| ~~TODO-012~~ | Slug vs UUID routing decision | Path C implemented: UUID lookup on assessment_items first, slug fallback on assessments |
| ~~KSS-SA-035~~ | B2C assessment card CTA + attempt state model + demo data seeding | Completed Apr 15 2026. No Retry locked. useUserAttempts hook live. All 4 persona datasets seeded. |
| ~~KSS-SA-034~~ | AI Insights upgrade prompt for basic/free users | Originally completed Apr 14 2026. Updated Apr 15 2026 — added Section 10 (demo data decisions for isAiEligible gate). |

---

## [DECISION NEEDED] UX / Product Decisions

| # | Issue | Detail |
|---|-------|--------|
| TODO-011 | SECTION_LOCKED + sections count validation | Confirm: block save or just warn? |
| TODO-013 | Empty what_youll_get fallback | If display_config.what_youll_get is empty, learner sees nothing. Platform-default bullets needed? |

---

## RULES (Added Apr 17 2026)

- This file MUST be updated at the START of every session with new tasks
- Mark tasks `[IN-PROGRESS]` as work begins, `[x] DONE` on completion
- Archive completed tasks to the `[DONE]` section at end of session
- Never delete context — archive only
