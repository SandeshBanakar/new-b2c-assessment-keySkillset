# TODO Backlog — keySkillset Platform
# Last updated: Apr 21 2026 — KSS-ANA-001 Phase 2 seeding COMPLETE. KSS-DB-052 added. KSS-SA-CA-001 Create Assessment Feature Set added. Active tasks only. Completed work → CLAUDE-HISTORY.md.

---

## [DONE] KSS-SA-CA-001 — Create Assessment Feature Set

**PRD:** `prds/super-admin/PRD-SA-CREATE-ASSESSMENTS.md`  
**SQL:** `docs/requirements/SQL-CA-MIGRATIONS.txt` — KSS-DB-050 + KSS-DB-051 (SA must run in Supabase)  
**Scope:** Main page state machine · Linear form refactor · Linear edit flow · Adaptive create + edit forms · Scale Score tab  
**Completed:** Apr 21 2026

### Phase 0 — PRD + SQL + Planning
| # | Task | Status |
|---|------|--------|
| CA-0a | Write PRD → `prds/super-admin/PRD-SA-CREATE-ASSESSMENTS.md` | [x] DONE |
| CA-0b | Write SQL → `docs/requirements/SQL-CA-MIGRATIONS.txt` (KSS-DB-050 + KSS-DB-051) | [x] DONE |
| CA-0c | Update TODO-BACKLOG.md | [x] DONE |
| CA-0d | Add nav policy lock note to `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md` | [x] DONE |

### Phase 1 — Main Page Rewrite
| # | Task | Status |
|---|------|--------|
| CA-1a | `statusActions()` helper — returns allowed actions per status | [x] DONE |
| CA-1b | Search bar (title-only, client-side) | [x] DONE |
| CA-1c | Full action menus by status (DRAFT/INACTIVE/LIVE/MAINTENANCE/ARCHIVED) | [x] DONE |
| CA-1d | Modals: Publish, Ready to Publish, Archive, Duplicate | [x] DONE |
| CA-1e | Take Offline modal (start/end date-time → stores to assessment_config JSONB, status → MAINTENANCE) | [x] DONE |
| CA-1f | End Maintenance modal (MAINTENANCE → INACTIVE) | [x] DONE |
| CA-1g | Make Live modal (ARCHIVED → LIVE) | [x] DONE |
| CA-1h | Delete modal (query plan_content_map, list plans, block if LIVE/MAINTENANCE) | [x] DONE |
| CA-1i | Auto-revert check on page load (MAINTENANCE + end_time < now → INACTIVE + banner) | [x] DONE |
| CA-1j | Enable "Create Adaptive" button | [x] DONE |

### Phase 2 — Linear Form Refactor
| # | Task | Status |
|---|------|--------|
| CA-2a | Move Duration to new "Timings" section card | [x] DONE |
| CA-2b | Allow Sectional Navigation toggle (drives timer_mode + navigation_policy; removes dropdown) | [x] DONE |
| CA-2c | Cap sections at 10 (disable button at cap, tooltip) | [x] DONE |
| CA-2d | Cap duration at 500 min (max=500 on input) | [x] DONE |
| CA-2e | Allow Back Navigation + Allow Calculator toggles in Timings section | [x] DONE |
| CA-2f | Shared components extracted to `linear/_components.tsx` | [x] DONE |

### Phase 3 — Linear Edit Form
| # | Task | Status |
|---|------|--------|
| CA-3a | `/linear/[id]/page.tsx` — load by ID, pre-populate all fields | [x] DONE |
| CA-3b | "Save Changes" button, UPDATE instead of INSERT | [x] DONE |
| CA-3c | MAINTENANCE read-only warning banner + fieldset disabled | [x] DONE |

### Phase 4 — Adaptive Create Form
| # | Task | Status |
|---|------|--------|
| CA-4a | Basic Info section (Full Test / Subject Test, Category, Allow Calculator) | [x] DONE |
| CA-4b | Foundation Module builder (1–5 FM for Full Test, exactly 1 for Subject Test) | [x] DONE |
| CA-4c | Per-FM branching config (High/Low % + auto medium range + reset) | [x] DONE |
| CA-4d | Variant Module cards (3 per FM: EASY/MEDIUM/HARD) | [x] DONE |
| CA-4e | Break screen builder (between FM and VMs only) | [x] DONE |
| CA-4f | Display Config section | [x] DONE |
| CA-4g | Preview tab (module flow diagram) | [x] DONE |
| CA-4h | Scale Score tab (disabled until save; shows "Save first" message) | [x] DONE |
| CA-4i | Sources + Chapters multi-select picker per module | [x] DONE |
| CA-4j | Question Type Distribution editor per module | [x] DONE |
| CA-4k | Save as Draft (INSERT to assessment_items) | [x] DONE |

### Phase 5 — Adaptive Edit Form
| # | Task | Status |
|---|------|--------|
| CA-5a | `/adaptive/[id]/page.tsx` — hydrate from DB, pre-populate all FM/VM fields | [x] DONE |
| CA-5b | "Save Changes" button, UPDATE + Scale Score UPSERT (per-module delete+insert) | [x] DONE |
| CA-5c | Scale Score tab fully active (assessment_id available) | [x] DONE |
| CA-5d | MAINTENANCE read-only banner + fieldset disabled | [x] DONE |

### Phase 6 — Post-Build
| # | Task | Status |
|---|------|--------|
| CA-6a | Update `docs/CLAUDE-DB.md` — KSS-DB-050 + KSS-DB-051 schemas | [x] DONE |
| CA-6b | `npm run build` passes clean (6 new routes) | [x] DONE |
| CA-6c | KSS-DB-050 + KSS-DB-051 run in Supabase — verified Apr 21 2026 | [x] DONE |

---

## [IN-PROGRESS] KSS-ANA-001 — Linear Analytics V2 (NEET / JEE / CLAT)

**PRD:** `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md`  
**Scope:** ScoreTrajectoryChart · MistakeIntelligence · LeverageActions · RankPredictionCard  
**Retains:** All 7 existing AnalyticsTab blocks unchanged. Strengths/WeakSpots → replaced by LeverageActions.  
**Out of scope (locked):** Exam-specific insights, peer percentile, exam countdown, recovery journey, SAT analytics.

### Phase 0 — PRD & Planning
| # | Task | Status |
|---|------|--------|
| LA-0a | Write PRD → `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md` | [x] DONE — Apr 20 2026 |
| LA-0b | Update TODO-BACKLOG.md | [x] DONE — Apr 20 2026 |

### Phase 1 — DB Migrations
| # | Migration | Status |
|---|---|---|
| KSS-DB-048 | `users`: ADD `target_neet_score INT NULL`, `target_jee_score INT NULL`, `target_clat_score INT NULL` | [ ] PENDING |
| KSS-DB-049 | CREATE `rank_prediction_tables` + seed NEET/JEE/CLAT 2025 data (`is_active=true`) | [ ] PENDING |
| KSS-DB-052 | DROP `attempt_answers_question_id_fkey` — undocumented FK blocking analytics seeding with placeholder question_ids | [x] DONE — Apr 21 2026 |

### Phase 2 — Data Seeding (attempt_answers for NEET / JEE / CLAT)
| # | Task | Status |
|---|---|---|
| SEED-LA-001 | NEET FT1 Attempt 1 (free) — 180 attempt_answers with time + distribution | [x] DONE — Apr 21 2026 |
| SEED-LA-002 | NEET FT1 Attempt 2 (paid) — 180 attempt_answers | [x] DONE — Apr 21 2026 |
| SEED-LA-003 | JEE FT1 Attempt 1+2 — 180 attempt_answers combined | [x] DONE — Apr 21 2026 |
| SEED-LA-004 | JEE FT1 Attempt 2 (paid) — 90 attempt_answers | [x] DONE — Apr 21 2026 (combined with SEED-LA-003) |
| SEED-LA-005 | CLAT FT1 Attempt 1+2 — 240 attempt_answers combined | [x] DONE — Apr 21 2026 |
| SEED-LA-006 | CLAT FT1 Attempt 2 (paid) — 150 attempt_answers | [x] DONE — Apr 21 2026 (combined with SEED-LA-005) |
| SEED-LA-007 | Verify `attempt_section_results.time_spent_seconds` populated for all 6 attempts | [x] DONE — Apr 21 2026 (seeded in STEP 2) |
| SEED-LA-008 | Chapter test answer UPDATEs + mastery INSERTs for chapter tests | [x] DONE — Apr 21 2026 (STEP 9+10, pre-completed) |

### Phase 3 — New Standalone Components
| # | File | Status |
|---|---|---|
| LA-C001 | `src/components/assessment-detail/ScoreTrajectoryChart.tsx` — 6-slot, target line, inline prompt | [ ] PENDING |
| LA-C002 | `src/components/assessment-detail/RankPredictionCard.tsx` — NEET/CLAT AIR + JEE band, interpolation | [ ] PENDING |
| LA-C003 | `src/components/assessment-detail/MistakeIntelligence.tsx` — 6 categories, empty state, INFERENCE-ENGINE rules | [ ] PENDING |
| LA-C004 | `src/components/assessment-detail/LeverageActions.tsx` — top 3 by marks lost, mastery fallback, time insight | [ ] PENDING |

### Phase 4 — AnalyticsTab.tsx Integration
| # | Task | Status |
|---|---|---|
| LA-I001 | Add rank_prediction_tables fetch (once on mount, by exam_category_id) | [ ] PENDING |
| LA-I002 | Add attempt_answers fetch per selected attempt (shared by MistakeIntelligence + LeverageActions) | [ ] PENDING |
| LA-I003 | Insert ScoreTrajectoryChart at Block 3 | [ ] PENDING |
| LA-I004 | Insert RankPredictionCard at Block 4 (NEET/JEE/CLAT guard) | [ ] PENDING |
| LA-I005 | Insert MistakeIntelligence after Section Breakdown | [ ] PENDING |
| LA-I006 | Replace Strengths/WeakSpots with LeverageActions | [ ] PENDING |
| LA-I007 | Wire target score read/write via AppContext | [ ] PENDING |

### Phase 5 — AppContext
| # | Task | Status |
|---|---|---|
| LA-AC001 | Add `target_neet_score`, `target_jee_score`, `target_clat_score` to user shape | [ ] PENDING |
| LA-AC002 | Add `updateTargetScore(exam, score)` method — writes Supabase + updates context | [ ] PENDING |

### Phase 6 — Platform Config Rank Prediction Sub-tab
| # | Task | Status |
|---|---|---|
| LA-PC001 | Add "Rank Prediction" sub-tab to NEET/JEE/CLAT categories in Platform Config drill-down | [ ] PENDING |
| LA-PC002 | List years + is_active toggle + "Add Year" slide-over (year + JSON paste) | [ ] PENDING |

### Phase 7 — Post-Build (Phase 2 seeding docs)
| # | Task | Status |
|---|---|---|
| LA-POST001 | Update `CLAUDE-DB.md` — KSS-DB-052 + Phase 2 seeding notes + routing bug note | [x] DONE — Apr 21 2026 |
| LA-POST002 | Update `CLAUDE-HISTORY.md` — log KSS-ANA-001 Phase 2 seeding + KSS-DB-052 | [x] DONE — Apr 21 2026 |
| LA-POST003 | Update memory files — project_kss_ana_001.md | [x] DONE — Apr 21 2026 |
| LA-POST004 | `npm run build` must pass clean | [ ] PENDING |
| LA-POST005 | Update `CLAUDE-DB.md` — KSS-DB-048 + KSS-DB-049 schemas (after Phase 1 DB migrations run) | [ ] PENDING |

---

## [COMPLETE — BUILD PASSING] KSS-SA-PC-001 — Platform Config Exam Category CRUD

**PRD:** `prds/super-admin/PRD-SA-PLATFORM-CONFIG.md`
**Decision:** Option B — `display_name` column added; `name` = immutable short code

### Phase 0 — Pre-Implementation
| # | Task | Status |
|---|------|--------|
| PC-0a | DB diagnostic run — DIAG-1 through DIAG-6 pasted in SQL-RESPONSE-3.txt | [x] DONE — Apr 20 2026 |
| PC-0b | CQ-6a/b/c resolved — JEE-only, Thermodynamics=Physics, CLAT Quantitative | [x] DONE |
| PC-0c | CLAUDE-DB.md updated — confirmed IDs, schema gaps, backfill mapping | [x] DONE |
| PC-0d | PRD written — `prds/super-admin/PRD-SA-PLATFORM-CONFIG.md` | [x] DONE |
| PC-0e | Option B chosen — `display_name` column added (`name` = immutable code) | [x] DONE — Apr 20 2026 |

### Phase 1 — DB Migrations
| # | Migration | Status |
|---|---|---|
| KSS-DB-045 | `exam_categories`: ADD `description`, `display_order`, `display_name`. Seeded. | [x] DONE — Apr 20 2026 |
| KSS-DB-046a | `assessments` + `assessment_items`: ADD `exam_category_id UUID FK`. Backfilled. | [x] DONE — Apr 20 2026 |
| KSS-DB-046b | `assessments`: DROP `exam_type`. | [x] DONE — Apr 20 2026 |
| KSS-DB-047 | Insert missing concept tags (Thermodynamics/JEE, Arithmetic+Ratio/CLAT). Verify pending. | [x] DONE — Apr 20 2026 |

### Phase 2 — Shared Hook
| # | Task | Status |
|---|---|---|
| PC-2a | Create `src/hooks/useExamCategories.ts` — `activeOnly` flag, ordered by `display_order` | [x] DONE — Apr 20 2026 |
| PC-2b | `useAssessments.ts`, `assessmentUtils.ts`, `plans.ts`, `b2c-users.ts` — JOIN `exam_categories!exam_category_id` | [x] DONE — Apr 20 2026 |

### Phase 3 — EXAM_SORT_ORDER Replacement
| # | Task | Status |
|---|---|---|
| PC-3a | Remove hardcoded `EXAM_SORT_ORDER` from `AssessmentLibrarySection.tsx` | [x] DONE — Apr 20 2026 |
| PC-3b | `buildExamGroups()` sorts by `display_order`; filters `is_active = false` | [x] DONE — Apr 20 2026 |
| PC-3c | `YourAssessmentsSection` — dynamic exam filter options from active assessments | [x] DONE — Apr 20 2026 |

### Phase 4 — Platform Config Page Refactor
| # | Task | Status |
|---|---|---|
| PC-4a | Replace tab nav → 3-col card grid (mobile 1-col, tablet 2-col, desktop 3-col) | [x] DONE — Apr 20 2026 |
| PC-4b | SortableExamCard: display_name, badge, tag count, Edit button, drag handle | [x] DONE — Apr 20 2026 |
| PC-4c | dnd-kit drag-to-reorder → batch UPDATE `display_order` on drop | [x] DONE — Apr 20 2026 |
| PC-4d | URL param `?cat=[categoryId]` — drill-down with breadcrumb (Suspense wrapper) | [x] DONE — Apr 20 2026 |
| PC-4e | Sub-tabs (Concept Tags + Analytics Display) preserved inside drill-down | [x] DONE — Apr 20 2026 |

### Phase 5 — Exam Category CRUD
| # | Task | Status |
|---|---|---|
| PC-5a | "Create Exam Category" slide-over (all fields, slug auto-gen) | [x] DONE — Apr 20 2026 |
| PC-5b | Edit slide-over — name/slug READ-ONLY; delete button at bottom | [x] DONE — Apr 20 2026 |
| PC-5c | Delete guard — count concept_tags + assessment_items; block if > 0 | [x] DONE — Apr 20 2026 |
| PC-5d | Cancel button bug fixed — `onCancelDelete` prop resets confirming state | [x] DONE — Apr 20 2026 |

### Phase 6 — is_active Consumer Wiring
| # | Task | Status |
|---|---|---|
| PC-6a | SA `create-assessments/page.tsx` + `linear/page.tsx` — `.eq('is_active', true).order('display_order')` | [x] DONE — Apr 20 2026 |
| PC-6b | `AssessmentCard`, `ContinueLearningWidget` — use `exam_categories.name/display_name` | [x] DONE — Apr 20 2026 |
| PC-6c | `AssessmentLibrarySection`, `YourAssessmentsSection` — filter inactive categories | [x] DONE — Apr 20 2026 |

### Phase 7 — makeLive Sync
| # | Task | Status |
|---|---|---|
| PC-7a | `makeLive()` in `content-bank.ts` — INSERT into `assessments`, set `assessment_items.assessments_id` | [x] DONE — Apr 20 2026 |
| PC-7b | Idempotent guard — if `assessments_id` set, UPDATE existing row | [x] DONE — Apr 20 2026 |

### Phase 8 — Concept Tag Count Fix (post QB-DB-021 Step B)
| # | Task | Status |
|---|---|---|
| PC-8a | Count query already correct — uses `questions WHERE concept_tag_id = x` (verified) | [x] DONE — Apr 20 2026 |

### Post-Implementation
| # | Task | Status |
|---|---|---|
| POST-1 | Update PRD status → LOCKED | [ ] PENDING |
| POST-2 | Update `CLAUDE-DB.md` — final exam_categories schema | [ ] PENDING |
| POST-3 | Update `CLAUDE-HISTORY.md` — log KSS-SA-PC-001 completion | [ ] PENDING |
| POST-4 | Update memory `project_kss_sa_pc_001.md` | [ ] PENDING |
| POST-5 | `npm run build` — must pass clean | [x] DONE — Apr 20 2026 |

---

## [IN-PROGRESS] KSS-CC-SA-QB-001 — Question Bank (SA + CC)

| # | Task | Status |
|---|------|--------|
| QB-DB-001 | KSS-DB-020 migration — numeric_answer_type/min/max on questions, marks/negative_marks on passage_sub_questions | [x] DONE — confirmed Apr 20 2026 |
| QB-DB-002 | KSS-DB-021 — Add `concept_tag_id UUID REFERENCES concept_tags(id) ON DELETE RESTRICT` (nullable) to `questions`. Backfill by name-match (`concept_tag` text → `concept_tags.concept_name`). Drop legacy `concept_tag` text column. Replace `question_concept_mappings` count query in platform-config with `COUNT(*) FROM questions WHERE concept_tag_id=x`. Retire `question_concept_mappings` table. SQL → SQL-RESPONSE-2.txt | [x] DONE — Apr 20 2026 |
| QB-001 | Write `prds/super-admin/PRD-SA-QUESTIONS.md` — after all QB decisions finalised | [x] DONE — Apr 20 2026 |
| QB-002 | Update CLAUDE-DB.md to reflect KSS-DB-033 + KSS-DB-034 new columns | [x] DONE — Apr 20 2026 |
| QB-003 | Create Assessment question-picker UI — SA picks sources/chapters, system randomly assigns questions at runtime | [ ] PENDING — separate ticket |
| QB-004 | `categories` column on `questions` table — legacy/redundant. Leave as DEFAULT '[]', never write to it. Drop in future cleanup | [ ] DEFERRED |
| QB-005 | TIPTAP-001/002 — Exam player rendering of Tiptap JSONB question_text and options[].text | [ ] PENDING — pre-existing ticket |
| QB-006 | **QuestionForm — options 4–6, drag-to-reorder** | [x] DONE — Apr 20 2026 |
| QB-007 | **PASSAGE_SINGLE stem label fix** | [x] DONE — Apr 20 2026 |
| QB-008 | **PASSAGE_SINGLE marks validation bug** | [x] DONE — Apr 20 2026 |
| QB-009 | **filteredSources race condition** | [x] DONE — Apr 20 2026 |
| QB-010 | **Platform Config concept tag delete fix** — catch FK RESTRICT violation, show "Cannot delete — X questions reference this tag" | [ ] PENDING — separate ticket, must ship before QB-DB-002 goes live |

**All decisions locked (Apr 20 2026):**
- Concept tag: ONE tag per question. `questions.concept_tag_id` UUID FK, ON DELETE RESTRICT, nullable. Backfill by name-match. Drop `concept_tag` text column post-migration. `question_concept_mappings` retired (only reader = platform-config count, replaceable with direct COUNT).
- MCQ options: min 4, max 6 (A–F). Drag reorder via @dnd-kit/sortable. Alphabetical key reflow on drop + correct_answer auto-updates to new key assignments.
- Option removal: disabled at min=4. Also disabled if option is the current correct answer — SA changes answer first.
- Sub-questions: same 4–6 option rules.
- PASSAGE_SINGLE marks: same validation rules as PASSAGE_MULTI sub-questions.
- PASSAGE_SINGLE stem: label updated, shown in exam player only, not in admin preview.

**Built this session (Apr 19–20 2026):**
- `src/components/ui/RichTextRenderer.tsx` — read-only Tiptap+KaTeX renderer
- `src/app/super-admin/question-bank/page.tsx` — Serial #, Question, Type, Difficulty, Created by, Last edited by, Actions eye-only; removed status filter + pencil
- `src/app/super-admin/question-bank/_components/QuestionPreviewModal.tsx` — MCQ/NUMERIC/PASSAGE split-pane preview, Delete warning, Edit routing
- `src/app/super-admin/question-bank/_components/QuestionForm.tsx` — exam category filter, NUMERIC Exact/Range, sub-question marks (PASSAGE_MULTI), parent marks auto-sum, video_url, Edit/Preview tabs, save warning modal, marks validation; bug-fix: question_text always saved (not cleared for PASSAGE types)

---

## [PENDING] KSS-SAT-A02 — SAT Analytics V2 + Platform Config Restructure

**PRD:** `prds/super-admin/PRD-SAT-ANALYTICS-V2.md`

### Phase 1 — DB Migrations ✅ COMPLETE
| # | Migration | Status |
|---|---|---|
| KSS-DB-041 | `sat_tier_bands` + 5 rows seeded | [x] DONE — SQL-RESPONSE-1.txt |
| KSS-DB-042 | `sat_colleges` + 19 colleges seeded | [x] DONE — SQL-RESPONSE-1.txt |
| KSS-DB-043 | `users.target_sat_score` + `target_sat_subject_score` columns | [x] DONE — SQL-RESPONSE-1.txt |
| KSS-DB-044 | `platform_analytics_config` + SAT defaults seeded | [x] DONE — SQL-RESPONSE-1.txt |

### Phase 2 — Platform Config Page Restructure ✅ COMPLETE
All tasks PC-001 through PC-007 done (previous session).

### Phase 3 — New Shared Components ✅ COMPLETE
| # | File | Status |
|---|---|---|
| SC-001 | `src/components/ui/ScoreTrajectoryChart.tsx` | [x] DONE |
| SC-002 | `src/components/ui/DifficultyBreakdownCard.tsx` | [x] DONE |
| SC-003 | `src/components/ui/PreviewSectionWrapper.tsx` | [x] DONE |

### Phase 4 — SAT Analytics Components ✅ COMPLETE
| # | File | Status |
|---|---|---|
| SA-001 | `src/components/assessment-detail/SATHeroScore.tsx` | [x] DONE |
| SA-002 | `src/components/assessment-detail/SATCollegeLadder.tsx` | [x] DONE |
| SA-003 | `src/components/assessment-detail/SATLeveragePanel.tsx` | [x] DONE |
| SA-004 | `src/components/assessment-detail/SATPacingChart.tsx` | [x] DONE — demo data |
| SA-005 | `src/components/assessment-detail/SATMistakeTaxonomy.tsx` | [x] DONE — demo data |

### Phase 5 — SATAnalyticsTab Wiring ✅ COMPLETE
All AT-001 through AT-009 wired. `difficulty` added to questions select. Platform config + tier bands + colleges loaded in parallel. Target score from AppContext. build passes.

### Phase 6 — Assessment Card Target Score Prompt ✅ COMPLETE
| # | Task | Status |
|---|---|---|
| TC-001 | Touch 1 prompt below SAT full-test card CTA (State 4, target null) | [x] DONE |
| TC-002 | Save target → Supabase `UPDATE users` + AppContext `updateUser` | [x] DONE |

### Phase 7 — Solutions Panel Accordion + attempt_answers Seeding ✅ COMPLETE (Apr 20 2026)
| # | Task | Status |
|---|---|---|
| FIX-001 | Trim assessment_question_map to correct Digital SAT counts (27/27/22/22) | [x] DONE — SQL-RESPONSE-1.txt STEP 1-2 (run in Supabase) |
| FIX-002 | Seed attempt_answers for SAT FT Attempt 1 (98 rows with correct/wrong/skipped distribution) | [x] DONE — SQL-RESPONSE-1.txt STEP 5-9 (run in Supabase) |
| FIX-003 | Update attempt_section_results + attempts.score_rw/math | [x] DONE — SQL-RESPONSE-1.txt STEP 3-4 (run in Supabase) |
| FIX-004 | SolutionsPanel.tsx — accordion redesign, remove inline (Correct) label, Marks Earned/Lost panel | [x] DONE — code shipped |
| FIX-005 | SATAnalyticsTab.tsx — add section_id/time_spent_seconds/marks_awarded to query + derivedSectionResults | [x] DONE — code shipped |
| FIX-006 | CLAUDE-RULES.md — Solutions Panel spec updated to match reference image accordion format | [x] DONE |
| FIX-007 | PRD-SAT-ANALYTICS-V2.md §10 — accordion spec + hybrid architecture + marks-per-question concept | [x] DONE |
| FIX-008 | CLAUDE-DB.md — seeding notes for attempt_answers + updated module question counts | [x] DONE |

**Pending (SA runs SQL):** SQL-RESPONSE-1.txt batch must be run in Supabase before DB-side data is live. Code changes are already deployed.

### Post-Exam-Engine (DEFERRED — do not build yet)
| # | Task | Blocked on |
|---|---|---|
| DEFER-001 | Wire Pacing to real per-question time data | Exam engine must record `time_per_question_seconds[]` on submit |
| DEFER-002 | Wire MistakeTaxonomy to real classification | Engine analysis layer + classification algorithm |
| DEFER-003 | Remove Preview badges when real data is live | After DEFER-001 + DEFER-002 |

---

## [IN-PROGRESS] KSS-SA-036 — Sources & Chapters (Pending items)

| # | Migration / Task | Status |
|---|---------|--------|
| KSS-DB-029 | Drop `status` column from `chapters` | [ ] PENDING — run in Supabase |
| SEED-001 | Assign `created_by` + `last_modified_by` on existing chapters | [ ] PENDING |
| SC-004 | Question assignment diagnostic SQL | [ ] DEFERRED |

---

## [IN-PROGRESS] Sections Builder — KSS-SA-030 extension

| # | Issue | Detail |
|---|-------|--------|
| SEC-001 | Sections builder UI not yet built in linear form | FULL_TEST only. SA adds sections (name + questionCount + optional durationMinutes when SECTION_LOCKED). Saved to `assessment_config.sections[]`. |
| SEC-002 | `navigation_policy` SECTION_LOCKED validation | Cannot select SECTION_LOCKED if assessment has < 2 sections. Warn on save. |
| SEC-003 | `total_questions` auto-sum from sections | When sections defined, `total_questions` = sum of section questionCounts. SA should not enter manually. |
| SEC-004 | `total_marks` auto-sum from sections | `total_marks` = sum of (`section.questionCount × section.marksPerQuestion`). Needs marksPerQuestion per section. |

---

## [IN-PROGRESS] Tiptap Rich Text — Exam Player Rendering

| # | Issue | Detail |
|---|-------|--------|
| TIPTAP-001 | Exam player must render Tiptap JSONB `question_text` | Exam player (useExamEngine + LinearExamPlayer) currently renders as plain string — will show raw JSON to students. Must add read-only Tiptap renderer to all question type renderers. |
| TIPTAP-002 | Option text JSONB rendering in exam player | `options[].text` is now Tiptap JSON doc. Option renderer must use read-only Tiptap instance. |

---

## [CRITICAL] Data / Schema

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| TODO-001 | `assessments` table formal deprecation plan | Legacy B2C engine table. Still canonical for exam engine (useExamEngine reads by slug). Migration plan needed: SA-created `assessment_items` → `assessments` at "Make Live". | Separate ticket |
| TODO-002 | `assessment_items` missing learner-facing columns | `slug`, `total_questions`, `difficulty`, `min_tier`, `is_puzzle_mode`, `rating`, `total_users`, `subject` — needed for full learner detail page once `assessments` is retired as primary source. | KSS-DB-XXX |
| TODO-003 | Learner assessments list page still on `assessments` table | `/assessments/page.tsx` reads via `AssessmentLibrarySection`. Needs migration to `assessment_items` once canonical. | Separate ticket |
| TODO-006 | `MAINTENANCE` status first-class state | Badge: orange-50/orange-700. Learners cannot access MAINTENANCE content. | KSS-DB-XXX |

---

## [HIGH] Analytics — KSS-SA-031 (Remaining production work)

| # | Issue | Detail |
|---|-------|--------|
| ANA-001 | Production: wire `useExamEngine` to write `attempt_answers` rows on submit | Demo done. Production path deferred. |
| ANA-002 | `assessment_question_map.section_name` is fragile for analytics | Text match breaks if section renamed. Future: migrate to `section_id` UUID. |
| ANA-003 | Production: write `attempt_section_results` on submit | Demo done. |
| ANA-004 | Production: write `user_concept_mastery` on submit | Demo done. |
| ANA-005 | Production analytics algorithm — rules engine | Panic detection, guess detection, weak concept identification, improvement velocity. Spec in PRD §6+§7. |
| ANA-008 | SAT score equating not implemented | Scaled scores seeded as static values. Real equating needs CB lookup tables. |
| ANA-009 | SAT adaptive module routing not tracked | `attempt_section_results.section_id` stores module names. Production: track which module 2 variant (easy/hard) received. |

---

## [PARTIAL] Question Seeding — KSS-SA-032

| # | Issue | Detail | Status |
|---|-------|--------|--------|
| QS-001b | NEET questions (180Q) | NEET — all unique, concept_tag, explanation, marks. | [ ] PENDING |
| QS-001c | CLAT questions (~140Q) | Passage-based English, Legal, Logical, Quant, GK. | [ ] PENDING |
| QS-001d | JEE questions (90Q) | Physics, Chemistry, Mathematics — MCQ + NUMERIC. | [ ] PENDING |
| QS-004 | SAT Full Test 2 question mapping | `476083b3` has no questions — no unique set seeded yet. | [ ] PENDING |
| QS-005 | Demo attempt data for new questions | Seed attempt rows + attempt_answers for demo users once NEET/JEE/CLAT/SAT FT2 questions seeded. | [ ] PENDING |

---

## [PARTIAL] PRD Updates (deferred)

| # | Task | Status |
|---|------|--------|
| SAT-A01-T9a | Update `PRD-SAT-ANALYTICS.md` with final decisions post-implementation | [ ] PENDING |
| SAT-A01-T9b | Update `PRD-AI-ANALYTICS.md` §9 components section with new component map | [ ] PENDING |
| SAT-A01-T10d | `AnalyticsTab` concept mastery upgrade — deferred from KSS-SAT-A01 | [ ] DEFERRED |

---

## [DEBT] Type / Code Debt

| # | Issue | Detail | File |
|---|-------|--------|------|
| TODO-008 | `SyllabusSection` type deprecated | After KSS-SA-030, unused. Remove in cleanup. | `src/types/index.ts` |
| TODO-009 | `mockSyllabus` unused after KSS-SA-030 | Remove in cleanup. | `src/data/assessments.ts` |
| TODO-010 | `navigation_policy` vs sections validation | SECTION_LOCKED advisory only until sections builder ships. | `linear/page.tsx` |
| TODO-014 | `ContinueLearningWidget.tsx` still uses `getAttemptData` | Dead mock data keys. Migrate to `useUserAttempts()` hook. | `src/components/dashboard/ContinueLearningWidget.tsx` |
| TODO-015 | `YourAssessmentsSection.tsx` still uses `getAttemptData` | Migrate to `useUserAttempts()` hook. | `src/components/assessment/YourAssessmentsSection.tsx` |
| TODO-016 | `mockAttempts.ts` DEMO_ATTEMPTS map is dead code | After TODO-014/015 migrated, remove the map + function. Keep `MockAttemptData` interface + `DEFAULT_ATTEMPT`. | `src/data/mockAttempts.ts` |

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
| KSS-SA-[TBD] | SAT Exam Engine (scoring + adaptive routing) | [BACKLOG] |
| KSS-B2C-[TBD] | Plan cancellation flow UI (end-user) | [PENDING — PRD placeholder in PRD-B2C-END-USER-ASSESS-PLANS.md §4] |
| KSS-B2C-[TBD] | Plan upgrade/downgrade flow UI (end-user) | [PENDING — PRD placeholder §5] |

---

## [DECISION NEEDED] UX / Product Decisions

| # | Issue | Detail |
|---|-------|--------|
| TODO-011 | SECTION_LOCKED + sections count validation | Confirm: block save or just warn? |
| TODO-013 | Empty `what_youll_get` fallback | If `display_config.what_youll_get` is empty, learner sees nothing. Platform-default bullets needed? |

---

## RULES

- This file MUST be updated at the START of every session with new tasks
- Only ACTIVE tasks live here. Completed work → `docs/CLAUDE-HISTORY.md`
- Mark tasks `[IN-PROGRESS]` as work begins, `[x] DONE` on completion, then move to CLAUDE-HISTORY.md at session end
