# TODO Backlog — keySkillset Platform
# Updated Apr 16 2026. Pick up items as separate tickets with KSS-DB-XXX authorisation where required.

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

## [IN-PROGRESS] Sources & Chapters — KSS-SA-036 (Apr 16 2026)

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
| SC-005 | Questions page full rebuild | `src/app/super-admin/sources-chapters/[sourceId]/[chapterId]/page.tsx` | [ ] NEXT SESSION |

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

## [HIGH] Question Seeding — KSS-SA-032 (new ticket — not yet built)

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| QS-001 | Real questions needed for 4 full tests | NEET (180Q), CLAT (~120–150Q), JEE (90Q), SAT (98Q) — all unique per full test. Subject/chapter tests can reuse. Questions must have concept_tag, explanation, marks. | Separate ticket |
| QS-002 | Sources + chapters must be seeded before questions | sources (NEET BIO 12TH SYLLABUS, NEET PHYS, etc.), chapters within each source, then questions linked to source+chapter. | After QS-001 |
| QS-003 | assessment_question_map rows needed | After questions seeded: link questions to full test assessments with section_name. | After QS-001 + QS-002 |
| QS-004 | Subject and chapter tests need creating in assessments table | NEET Bio subject test, NEET Phy subject test, chapter tests per subject — reusing existing questions. | After QS-001 |
| QS-005 | Demo attempt data needed for analytics | Seed attempt rows + attempt_answers for demo users to demonstrate analytics algorithm. | After ANA-003 + QS-001 |

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
| KSS-CA-007 | CA Dashboard | [PENDING] |
| KSS-CA-009 | Audit Log (CA) | [PENDING] |
| KSS-SA-019 | Contract mandatory on CA creation (Phase 2 enforcement) | [CRITICAL] |
| KEYS-485 | Restore archived plan | Spec locked Apr 7 2026, not yet built |
| KEYS-501 | Hard delete plan (ARCHIVED + zero subscribers) | Spec locked Apr 7 2026, not yet built |
| KSS-SA-[TBD] | Build Super Admin login + authentication flow | [PENDING] |
| KSS-CA-[TBD] | Build Client Admin login + authentication flow | [PENDING] |
| KSS-B2C-[TBD] | Build B2C user signup + onboarding flow | [PENDING] |

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
