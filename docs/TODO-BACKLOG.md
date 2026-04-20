# TODO Backlog — keySkillset Platform
# Last updated: Apr 20 2026 — KSS-B2C-001 complete. Active tasks only. Completed work → CLAUDE-HISTORY.md.

---

## [IN-PROGRESS] KSS-CC-SA-QB-001 — Question Bank (SA + CC)

| # | Task | Status |
|---|------|--------|
| QB-DB-001 | KSS-DB-020 migration — numeric_answer_type/min/max on questions, marks/negative_marks on passage_sub_questions | [x] DONE — confirmed Apr 20 2026 |
| QB-DB-002 | KSS-DB-021 — Add `concept_tag_id UUID REFERENCES concept_tags(id) ON DELETE RESTRICT` (nullable) to `questions`. Backfill by name-match (`concept_tag` text → `concept_tags.concept_name`). Drop legacy `concept_tag` text column. Replace `question_concept_mappings` count query in platform-config with `COUNT(*) FROM questions WHERE concept_tag_id=x`. Retire `question_concept_mappings` table. SQL → SQL-RESPONSE-2.txt | [ ] PENDING — all decisions locked, ready to build |
| QB-001 | Write `prds/content_creation/PRD-SA-QUESTIONS.md` — after all QB decisions finalised | [ ] PENDING — all decisions locked, ready to write |
| QB-002 | Update CLAUDE-DB.md to reflect KSS-DB-020 + KSS-DB-021 new columns | [ ] PENDING — after both migrations confirmed |
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
